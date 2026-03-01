package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
)

type config struct {
	DatabaseURL          string
	IPFSAPIURL           string
	PGListenChannel      string
	OpenRouterAPIKey     string
	OpenRouterBaseURL    string
	OpenRouterChatModel  string
	OpenRouterEmbedModel string
	EmbeddingDim         int
	SimilarityTopK       int
	SimilarityThreshold  float64
}

type notifyPayload struct {
	EvidenceID string `json:"evidence_id"`
}

type evidenceRow struct {
	ID        string
	Content   string
	CreatedAt time.Time
}

type ipfsAddResponse struct {
	Hash string `json:"Hash"`
}

type aiClassification struct {
	Label   string `json:"label"`
	Summary string `json:"summary"`
}

type openRouterChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type openRouterEmbeddingResponse struct {
	Data []struct {
		Embedding []float64 `json:"embedding"`
	} `json:"data"`
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("FATAL: %v", err)
	}

	if err := preflight(ctx, cfg); err != nil {
		log.Fatalf("FATAL: preflight failed: %v", err)
	}

	log.Printf("worker starting, listen channel=%s", cfg.PGListenChannel)

	if err := run(ctx, cfg); err != nil && !errors.Is(err, context.Canceled) {
		log.Fatalf("FATAL: worker stopped unexpectedly: %v", err)
	}
}

func loadConfig() (config, error) {
	getRequired := func(name string) (string, error) {
		value := os.Getenv(name)
		if value == "" {
			return "", fmt.Errorf("missing required env var: %s", name)
		}
		return value, nil
	}

	databaseURL, err := getRequired("DATABASE_URL")
	if err != nil {
		return config{}, err
	}

	ipfsAPIURL, err := getRequired("IPFS_API_URL")
	if err != nil {
		return config{}, err
	}

	channel := os.Getenv("PG_LISTEN_CHANNEL")
	if channel == "" {
		channel = "chainsight_evidence_created"
	}

	openRouterAPIKey, err := getRequired("OPENROUTER_APIKEY")
	if err != nil {
		return config{}, err
	}

	openRouterBaseURL := os.Getenv("OPENROUTER_BASE_URL")
	if openRouterBaseURL == "" {
		openRouterBaseURL = "https://openrouter.ai/api/v1"
	}

	openRouterChatModel := os.Getenv("OPENROUTER_CHAT_MODEL")
	if openRouterChatModel == "" {
		openRouterChatModel = "openai/gpt-4o-mini"
	}

	openRouterEmbedModel := os.Getenv("OPENROUTER_EMBED_MODEL")
	if openRouterEmbedModel == "" {
		openRouterEmbedModel = "openai/text-embedding-3-small"
	}

	embeddingDim, err := parsePositiveIntEnv("EMBEDDING_DIM", 1536)
	if err != nil {
		return config{}, err
	}

	similarityTopK, err := parsePositiveIntEnv("SIMILARITY_TOP_K", 5)
	if err != nil {
		return config{}, err
	}

	similarityThreshold, err := parseRangeFloatEnv("SIMILARITY_THRESHOLD", 0.82)
	if err != nil {
		return config{}, err
	}

	return config{
		DatabaseURL:          databaseURL,
		IPFSAPIURL:           ipfsAPIURL,
		PGListenChannel:      channel,
		OpenRouterAPIKey:     openRouterAPIKey,
		OpenRouterBaseURL:    openRouterBaseURL,
		OpenRouterChatModel:  openRouterChatModel,
		OpenRouterEmbedModel: openRouterEmbedModel,
		EmbeddingDim:         embeddingDim,
		SimilarityTopK:       similarityTopK,
		SimilarityThreshold:  similarityThreshold,
	}, nil
}

func parsePositiveIntEnv(name string, fallback int) (int, error) {
	raw := os.Getenv(name)
	if raw == "" {
		return fallback, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("invalid %s=%q, expected positive integer", name, raw)
	}

	return value, nil
}

func parseRangeFloatEnv(name string, fallback float64) (float64, error) {
	raw := os.Getenv(name)
	if raw == "" {
		return fallback, nil
	}

	value, err := strconv.ParseFloat(raw, 64)
	if err != nil || value < 0 || value > 1 {
		return 0, fmt.Errorf("invalid %s=%q, expected number between 0 and 1", name, raw)
	}

	return value, nil
}

func preflight(ctx context.Context, cfg config) error {
	dbCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	db, err := pgx.Connect(dbCtx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("cannot connect postgresql: %w", err)
	}
	defer db.Close(context.Background())

	if err := db.Ping(dbCtx); err != nil {
		return fmt.Errorf("postgresql ping failed: %w", err)
	}

	ipfsVersionURL, err := toIPFSVersionURL(cfg.IPFSAPIURL)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(dbCtx, http.MethodPost, ipfsVersionURL, nil)
	if err != nil {
		return fmt.Errorf("cannot create ipfs preflight request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("cannot reach ipfs api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return fmt.Errorf("ipfs api unhealthy status=%d body=%s", resp.StatusCode, string(body))
	}

	return nil
}

func run(ctx context.Context, cfg config) error {
	listener, err := pgx.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect listener failed: %w", err)
	}
	defer listener.Close(context.Background())

	workerDB, err := pgx.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("connect worker db failed: %w", err)
	}
	defer workerDB.Close(context.Background())

	hasVector, err := detectVectorSupport(ctx, workerDB)
	if err != nil {
		return fmt.Errorf("detect vector support failed: %w", err)
	}
	log.Printf("worker vector support=%t", hasVector)

	if _, err := listener.Exec(ctx, "listen "+cfg.PGListenChannel); err != nil {
		return fmt.Errorf("listen channel failed: %w", err)
	}

	for {
		notification, err := listener.WaitForNotification(ctx)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				return err
			}
			return fmt.Errorf("wait notification failed: %w", err)
		}

		if err := processNotification(ctx, workerDB, cfg, hasVector, notification.Payload); err != nil {
			log.Printf("ERROR: process notification failed: %v", err)
		}
	}
}

func detectVectorSupport(ctx context.Context, db *pgx.Conn) (bool, error) {
	var hasVector bool
	if err := db.QueryRow(ctx, `
		select exists(
			select 1
			from pg_type
			where typname = 'vector'
		)
	`).Scan(&hasVector); err != nil {
		return false, err
	}

	return hasVector, nil
}

func toIPFSVersionURL(addURL string) (string, error) {
	parsed, err := url.Parse(addURL)
	if err != nil {
		return "", fmt.Errorf("invalid IPFS_API_URL: %w", err)
	}

	parsed.Path = "/api/v0/version"
	parsed.RawQuery = ""
	return parsed.String(), nil
}

func processNotification(ctx context.Context, db *pgx.Conn, cfg config, hasVector bool, payload string) error {
	var event notifyPayload
	if err := json.Unmarshal([]byte(payload), &event); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}

	if event.EvidenceID == "" {
		return fmt.Errorf("empty evidence_id in payload")
	}

	var ev evidenceRow
	err := db.QueryRow(ctx, `
		select id::text, content, created_at
		from chainsight.evidence
		where id = $1::uuid
	`, event.EvidenceID).Scan(&ev.ID, &ev.Content, &ev.CreatedAt)
	if err != nil {
		return fmt.Errorf("load evidence failed: %w", err)
	}

	jobResult, err := db.Exec(ctx, `
		update chainsight.processing_job
		set status = 'in_progress', attempts = attempts + 1, updated_at = now(), error_message = null
		where evidence_id = $1::uuid and job_type = 'evidence_pipeline' and status in ('pending', 'failed')
	`, ev.ID)
	if err != nil {
		return fmt.Errorf("mark processing_job in_progress failed: %w", err)
	}
	if jobResult.RowsAffected() == 0 {
		log.Printf("skip evidence_id=%s because processing_job is already in terminal state", ev.ID)
		return nil
	}

	var cid string
	var cidPtr *string
	if err := db.QueryRow(ctx, `
		select cid
		from chainsight.evidence
		where id = $1::uuid
	`, ev.ID).Scan(&cidPtr); err != nil {
		_ = markPipelineFailed(ctx, db, ev.ID, err)
		return fmt.Errorf("load current cid failed: %w", err)
	}
	if cidPtr != nil {
		cid = *cidPtr
	}

	cidWasCreated := false
	if cid == "" {
		cid, err = uploadEvidenceToIPFS(ctx, cfg.IPFSAPIURL, ev.Content)
		if err != nil {
			_ = markPipelineFailed(ctx, db, ev.ID, err)
			return fmt.Errorf("ipfs upload failed: %w", err)
		}

		evidenceResult, err := db.Exec(ctx, `
			update chainsight.evidence
			set cid = $1, status = 'CID_READY', updated_at = now()
			where id = $2::uuid and cid is null
		`, cid, ev.ID)
		if err != nil {
			_ = markPipelineFailed(ctx, db, ev.ID, err)
			return fmt.Errorf("update evidence cid failed: %w", err)
		}
		cidWasCreated = evidenceResult.RowsAffected() > 0
	}

	if cidWasCreated {
		if err := appendHashLog(ctx, db, ev.ID, ev.Content, cid); err != nil {
			_ = markPipelineFailed(ctx, db, ev.ID, err)
			return fmt.Errorf("append hash log failed: %w", err)
		}
	}

	classification, embedding, err := analyzeEvidence(ctx, cfg, ev.Content)
	if err != nil {
		_ = markPipelineFailed(ctx, db, ev.ID, err)
		return fmt.Errorf("phase2 analysis failed: %w", err)
	}

	if err := updateEvidenceAnalysis(ctx, db, ev.ID, classification, embedding, hasVector); err != nil {
		_ = markPipelineFailed(ctx, db, ev.ID, err)
		return fmt.Errorf("update evidence analysis failed: %w", err)
	}

	if err := upsertSemanticEdges(ctx, db, ev.ID, ev.CreatedAt, embedding, hasVector, cfg.SimilarityThreshold, cfg.SimilarityTopK); err != nil {
		_ = markPipelineFailed(ctx, db, ev.ID, err)
		return fmt.Errorf("upsert semantic edges failed: %w", err)
	}

	if _, err := db.Exec(ctx, `
		update chainsight.processing_job
		set status = 'completed', finished_at = now(), updated_at = now()
		where evidence_id = $1::uuid and job_type = 'evidence_pipeline' and status = 'in_progress'
	`, ev.ID); err != nil {
		return fmt.Errorf("complete processing_job failed: %w", err)
	}

	log.Printf("processed evidence_id=%s cid=%s", ev.ID, cid)
	return nil
}

func analyzeEvidence(ctx context.Context, cfg config, content string) (aiClassification, []float64, error) {
	classification, err := classifyEvidence(ctx, cfg, content)
	if err != nil {
		return aiClassification{}, nil, err
	}

	embedding, err := embedEvidence(ctx, cfg, content)
	if err != nil {
		return aiClassification{}, nil, err
	}

	if len(embedding) != cfg.EmbeddingDim {
		return aiClassification{}, nil, fmt.Errorf("unexpected embedding dimension: got=%d want=%d", len(embedding), cfg.EmbeddingDim)
	}

	return classification, embedding, nil
}

func classifyEvidence(ctx context.Context, cfg config, content string) (aiClassification, error) {
	body := map[string]any{
		"model": cfg.OpenRouterChatModel,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You classify potentially misleading public text for a rumor-analysis PoC. Return strict JSON only with keys: label and summary. label must be one of: 疑似谣言, 信息待核实, 未发现异常. summary must be concise Chinese text under 80 chars.",
			},
			{
				"role":    "user",
				"content": content,
			},
		},
		"temperature": 0.1,
	}

	respBody, err := callOpenRouter(ctx, cfg, "/chat/completions", body)
	if err != nil {
		return aiClassification{}, err
	}

	var resp openRouterChatResponse
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return aiClassification{}, fmt.Errorf("decode chat completion response failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return aiClassification{}, fmt.Errorf("chat completion has no choices")
	}

	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	classification, err := parseClassification(raw)
	if err != nil {
		return aiClassification{}, err
	}

	return classification, nil
}

func parseClassification(raw string) (aiClassification, error) {
	if raw == "" {
		return aiClassification{}, fmt.Errorf("classification content is empty")
	}

	cleaned := strings.TrimSpace(raw)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	start := strings.Index(cleaned, "{")
	end := strings.LastIndex(cleaned, "}")
	if start < 0 || end < 0 || end <= start {
		return aiClassification{}, fmt.Errorf("classification response does not contain json object")
	}

	jsonPart := cleaned[start : end+1]

	var classification aiClassification
	if err := json.Unmarshal([]byte(jsonPart), &classification); err != nil {
		return aiClassification{}, fmt.Errorf("decode classification json failed: %w", err)
	}

	classification.Label = strings.TrimSpace(classification.Label)
	classification.Summary = strings.TrimSpace(classification.Summary)
	if classification.Label == "" {
		return aiClassification{}, fmt.Errorf("classification label is empty")
	}
	if classification.Summary == "" {
		return aiClassification{}, fmt.Errorf("classification summary is empty")
	}

	return classification, nil
}

func embedEvidence(ctx context.Context, cfg config, content string) ([]float64, error) {
	body := map[string]any{
		"model": cfg.OpenRouterEmbedModel,
		"input": content,
	}

	respBody, err := callOpenRouter(ctx, cfg, "/embeddings", body)
	if err != nil {
		return nil, err
	}

	var resp openRouterEmbeddingResponse
	if err := json.Unmarshal(respBody, &resp); err != nil {
		return nil, fmt.Errorf("decode embedding response failed: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("embedding response has no data")
	}

	if len(resp.Data[0].Embedding) == 0 {
		return nil, fmt.Errorf("embedding vector is empty")
	}

	return resp.Data[0].Embedding, nil
}

func callOpenRouter(ctx context.Context, cfg config, path string, payload any) ([]byte, error) {
	endpoint, err := url.JoinPath(cfg.OpenRouterBaseURL, path)
	if err != nil {
		return nil, fmt.Errorf("invalid openrouter base url: %w", err)
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal openrouter request failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create openrouter request failed: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+cfg.OpenRouterAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call openrouter failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read openrouter response failed: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("openrouter request failed status=%d body=%s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

func vectorLiteral(embedding []float64) string {
	parts := make([]string, 0, len(embedding))
	for _, value := range embedding {
		parts = append(parts, strconv.FormatFloat(value, 'f', -1, 64))
	}
	return "[" + strings.Join(parts, ",") + "]"
}

func updateEvidenceAnalysis(ctx context.Context, db *pgx.Conn, evidenceID string, classification aiClassification, embedding []float64, hasVector bool) error {
	if hasVector {
		embeddingLiteral := vectorLiteral(embedding)
		if _, err := db.Exec(ctx, `
			update chainsight.evidence
			set
			  ai_label = $1,
			  ai_summary = $2,
			  embedding = $3::vector,
			  status = case when status = 'ANCHORED' then status else 'ANALYZED' end,
			  updated_at = now()
			where id = $4::uuid
		`, classification.Label, classification.Summary, embeddingLiteral, evidenceID); err != nil {
			return err
		}
		return nil
	}

	embeddingArray := toFloat32Array(embedding)
	if _, err := db.Exec(ctx, `
		update chainsight.evidence
		set
		  ai_label = $1,
		  ai_summary = $2,
		  embedding = $3::real[],
		  status = case when status = 'ANCHORED' then status else 'ANALYZED' end,
		  updated_at = now()
		where id = $4::uuid
	`, classification.Label, classification.Summary, embeddingArray, evidenceID); err != nil {
		return err
	}

	return nil
}

func upsertSemanticEdges(ctx context.Context, db *pgx.Conn, sourceEvidenceID string, sourceCreatedAt time.Time, embedding []float64, hasVector bool, threshold float64, topK int) error {
	if hasVector {
		return upsertSemanticEdgesWithVector(ctx, db, sourceEvidenceID, sourceCreatedAt, vectorLiteral(embedding), threshold, topK)
	}

	return upsertSemanticEdgesFallback(ctx, db, sourceEvidenceID, sourceCreatedAt, embedding, threshold, topK)
}

func upsertSemanticEdgesWithVector(ctx context.Context, db *pgx.Conn, sourceEvidenceID string, sourceCreatedAt time.Time, embeddingLiteral string, threshold float64, topK int) error {
	rows, err := db.Query(ctx, `
		select id::text, 1 - (embedding <=> $1::vector) as score
		from chainsight.evidence
		where id <> $2::uuid
		  and created_at < $3
		  and embedding is not null
		  and (1 - (embedding <=> $1::vector)) >= $4
		order by embedding <=> $1::vector asc
		limit $5
	`, embeddingLiteral, sourceEvidenceID, sourceCreatedAt, threshold, topK)
	if err != nil {
		return fmt.Errorf("query semantic candidates failed: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var targetEvidenceID string
		var score float64
		if err := rows.Scan(&targetEvidenceID, &score); err != nil {
			return fmt.Errorf("scan semantic candidate failed: %w", err)
		}

		if _, err := db.Exec(ctx, `
			insert into chainsight.semantic_edge (source_evidence_id, target_evidence_id, score, edge_type)
			values ($1::uuid, $2::uuid, $3, 'semantic')
			on conflict (source_evidence_id, target_evidence_id, edge_type)
			do update set score = excluded.score, created_at = now()
		`, sourceEvidenceID, targetEvidenceID, score); err != nil {
			return fmt.Errorf("upsert semantic edge failed: %w", err)
		}
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate semantic candidates failed: %w", err)
	}

	return nil
}

type edgeCandidate struct {
	EvidenceID string
	Score      float64
}

func upsertSemanticEdgesFallback(ctx context.Context, db *pgx.Conn, sourceEvidenceID string, sourceCreatedAt time.Time, embedding []float64, threshold float64, topK int) error {
	rows, err := db.Query(ctx, `
		select id::text, embedding
		from chainsight.evidence
		where id <> $1::uuid
		  and created_at < $2
		  and embedding is not null
		order by created_at desc
		limit 500
	`, sourceEvidenceID, sourceCreatedAt)
	if err != nil {
		return fmt.Errorf("query fallback semantic candidates failed: %w", err)
	}
	defer rows.Close()

	candidates := make([]edgeCandidate, 0, topK)
	for rows.Next() {
		var targetEvidenceID string
		var targetEmbedding []float32
		if err := rows.Scan(&targetEvidenceID, &targetEmbedding); err != nil {
			return fmt.Errorf("scan fallback semantic candidate failed: %w", err)
		}

		score, ok := cosineSimilarity(embedding, fromFloat32Array(targetEmbedding))
		if !ok || score < threshold {
			continue
		}

		candidates = append(candidates, edgeCandidate{EvidenceID: targetEvidenceID, Score: score})
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate fallback semantic candidates failed: %w", err)
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Score > candidates[j].Score
	})

	if len(candidates) > topK {
		candidates = candidates[:topK]
	}

	for _, candidate := range candidates {
		if _, err := db.Exec(ctx, `
			insert into chainsight.semantic_edge (source_evidence_id, target_evidence_id, score, edge_type)
			values ($1::uuid, $2::uuid, $3, 'semantic')
			on conflict (source_evidence_id, target_evidence_id, edge_type)
			do update set score = excluded.score, created_at = now()
		`, sourceEvidenceID, candidate.EvidenceID, candidate.Score); err != nil {
			return fmt.Errorf("upsert fallback semantic edge failed: %w", err)
		}
	}

	return nil
}

func toFloat32Array(values []float64) []float32 {
	converted := make([]float32, 0, len(values))
	for _, value := range values {
		converted = append(converted, float32(value))
	}
	return converted
}

func fromFloat32Array(values []float32) []float64 {
	converted := make([]float64, 0, len(values))
	for _, value := range values {
		converted = append(converted, float64(value))
	}
	return converted
}

func cosineSimilarity(a []float64, b []float64) (float64, bool) {
	if len(a) == 0 || len(a) != len(b) {
		return 0, false
	}

	dot := 0.0
	aNorm := 0.0
	bNorm := 0.0
	for i := range a {
		dot += a[i] * b[i]
		aNorm += a[i] * a[i]
		bNorm += b[i] * b[i]
	}

	if aNorm == 0 || bNorm == 0 {
		return 0, false
	}

	return dot / (math.Sqrt(aNorm) * math.Sqrt(bNorm)), true
}

func uploadEvidenceToIPFS(ctx context.Context, ipfsAPIURL string, content string) (string, error) {
	evidence := map[string]any{
		"content": content,
		"metadata": map[string]any{
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"version":   "1.0",
		},
	}

	bodyBytes, err := json.Marshal(evidence)
	if err != nil {
		return "", fmt.Errorf("marshal evidence json failed: %w", err)
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", "evidence.json")
	if err != nil {
		return "", fmt.Errorf("create multipart file failed: %w", err)
	}

	if _, err := part.Write(bodyBytes); err != nil {
		return "", fmt.Errorf("write multipart body failed: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("close multipart writer failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ipfsAPIURL, &body)
	if err != nil {
		return "", fmt.Errorf("create ipfs request failed: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("call ipfs api failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", fmt.Errorf("ipfs add failed status=%d body=%s", resp.StatusCode, string(body))
	}

	var result ipfsAddResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode ipfs response failed: %w", err)
	}

	if result.Hash == "" {
		return "", fmt.Errorf("ipfs response missing hash")
	}

	return result.Hash, nil
}

func appendHashLog(ctx context.Context, db *pgx.Conn, evidenceID string, content string, cid string) error {
	payloadHash := hashHex(content + "|" + cid)

	var previousHash *string
	err := db.QueryRow(ctx, `
		select current_hash
		from chainsight.append_only_hash_log
		order by id desc
		limit 1
	`).Scan(&previousHash)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("query previous hash failed: %w", err)
	}

	prev := ""
	if previousHash != nil {
		prev = *previousHash
	}

	currentHash := hashHex(prev + "|" + payloadHash + "|" + evidenceID)

	if _, err := db.Exec(ctx, `
		insert into chainsight.append_only_hash_log (evidence_id, payload_hash, previous_hash, current_hash)
		values ($1::uuid, $2, nullif($3, ''), $4)
		on conflict (current_hash) do nothing
	`, evidenceID, payloadHash, prev, currentHash); err != nil {
		return fmt.Errorf("insert hash log failed: %w", err)
	}

	return nil
}

func markPipelineFailed(ctx context.Context, db *pgx.Conn, evidenceID string, cause error) error {
	if _, err := db.Exec(ctx, `
		update chainsight.evidence
		set status = 'FAILED', updated_at = now()
		where id = $1::uuid
	`, evidenceID); err != nil {
		return err
	}

	if _, err := db.Exec(ctx, `
		update chainsight.processing_job
		set status = 'failed', error_message = $2, updated_at = now()
		where evidence_id = $1::uuid and job_type = 'evidence_pipeline' and status = 'in_progress'
	`, evidenceID, cause.Error()); err != nil {
		return err
	}

	return nil
}

func hashHex(input string) string {
	sum := sha256.Sum256([]byte(input))
	return hex.EncodeToString(sum[:])
}

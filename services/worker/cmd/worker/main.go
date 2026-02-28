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
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
)

type config struct {
	DatabaseURL     string
	IPFSAPIURL      string
	PGListenChannel string
}

type notifyPayload struct {
	EvidenceID string `json:"evidence_id"`
}

type evidenceRow struct {
	ID      string
	Content string
}

type ipfsAddResponse struct {
	Hash string `json:"Hash"`
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

	return config{
		DatabaseURL:     databaseURL,
		IPFSAPIURL:      ipfsAPIURL,
		PGListenChannel: channel,
	}, nil
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

		if err := processNotification(ctx, workerDB, cfg, notification.Payload); err != nil {
			log.Printf("ERROR: process notification failed: %v", err)
		}
	}
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

func processNotification(ctx context.Context, db *pgx.Conn, cfg config, payload string) error {
	var event notifyPayload
	if err := json.Unmarshal([]byte(payload), &event); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}

	if event.EvidenceID == "" {
		return fmt.Errorf("empty evidence_id in payload")
	}

	var ev evidenceRow
	err := db.QueryRow(ctx, `
		select id::text, content
		from chainsight.evidence
		where id = $1::uuid
	`, event.EvidenceID).Scan(&ev.ID, &ev.Content)
	if err != nil {
		return fmt.Errorf("load evidence failed: %w", err)
	}

	if _, err := db.Exec(ctx, `
		update chainsight.processing_job
		set status = 'in_progress', attempts = attempts + 1, updated_at = now(), error_message = null
		where evidence_id = $1::uuid and job_type = 'evidence_pipeline' and status in ('pending', 'failed')
	`, ev.ID); err != nil {
		return fmt.Errorf("mark processing_job in_progress failed: %w", err)
	}

	cid, err := uploadEvidenceToIPFS(ctx, cfg.IPFSAPIURL, ev.Content)
	if err != nil {
		_ = markPipelineFailed(ctx, db, ev.ID, err)
		return fmt.Errorf("ipfs upload failed: %w", err)
	}

	if _, err := db.Exec(ctx, `
		update chainsight.evidence
		set cid = $1, status = 'CID_READY', updated_at = now()
		where id = $2::uuid and cid is null
	`, cid, ev.ID); err != nil {
		_ = markPipelineFailed(ctx, db, ev.ID, err)
		return fmt.Errorf("update evidence cid failed: %w", err)
	}

	if err := appendHashLog(ctx, db, ev.ID, ev.Content, cid); err != nil {
		_ = markPipelineFailed(ctx, db, ev.ID, err)
		return fmt.Errorf("append hash log failed: %w", err)
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

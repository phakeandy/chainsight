package main

import (
	"math"
	"testing"
)

func TestToIPFSVersionURL(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{
			name:  "ipfs add endpoint",
			input: "http://ipfs:5001/api/v0/add",
			want:  "http://ipfs:5001/api/v0/version",
		},
		{
			name:    "invalid url",
			input:   "://invalid",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := toIPFSVersionURL(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got none")
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if got != tt.want {
				t.Fatalf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestHashHex(t *testing.T) {
	g1 := hashHex("chainsight")
	g2 := hashHex("chainsight")

	if g1 != g2 {
		t.Fatalf("hash should be deterministic")
	}

	if len(g1) != 64 {
		t.Fatalf("sha256 hex length should be 64, got %d", len(g1))
	}
}

func TestParseClassification(t *testing.T) {
	tests := []struct {
		name      string
		raw       string
		wantLabel string
		wantErr   bool
	}{
		{
			name:      "raw json",
			raw:       `{"label":"疑似谣言","summary":"样例摘要"}`,
			wantLabel: "疑似谣言",
		},
		{
			name:      "markdown fence",
			raw:       "```json\n{\"label\":\"信息待核实\",\"summary\":\"样例\"}\n```",
			wantLabel: "信息待核实",
		},
		{
			name:    "invalid",
			raw:     "hello world",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseClassification(tt.raw)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if got.Label != tt.wantLabel {
				t.Fatalf("got label %q, want %q", got.Label, tt.wantLabel)
			}
		})
	}
}

func TestVectorLiteral(t *testing.T) {
	got := vectorLiteral([]float64{0.1, -0.2, 1.5})
	want := "[0.1,-0.2,1.5]"
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestParsePositiveIntEnv(t *testing.T) {
	t.Setenv("SIMILARITY_TOP_K", "8")
	got, err := parsePositiveIntEnv("SIMILARITY_TOP_K", 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 8 {
		t.Fatalf("got %d, want 8", got)
	}
}

func TestParseRangeFloatEnv(t *testing.T) {
	t.Setenv("SIMILARITY_THRESHOLD", "0.75")
	got, err := parseRangeFloatEnv("SIMILARITY_THRESHOLD", 0.82)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if math.Abs(got-0.75) > 1e-9 {
		t.Fatalf("got %v, want 0.75", got)
	}
}

func TestCosineSimilarity(t *testing.T) {
	score, ok := cosineSimilarity([]float64{1, 0}, []float64{1, 0})
	if !ok {
		t.Fatalf("expected valid cosine similarity")
	}
	if math.Abs(score-1) > 1e-9 {
		t.Fatalf("got %v, want 1", score)
	}

	_, ok = cosineSimilarity([]float64{1, 0}, []float64{1})
	if ok {
		t.Fatalf("expected invalid similarity for mismatched lengths")
	}
}

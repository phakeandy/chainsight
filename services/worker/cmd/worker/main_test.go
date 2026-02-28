package main

import "testing"

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

package config

import (
	"testing"
)

func TestLoadParsesCORSAllowedOrigins(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000, http://example.com:3000,,https://app.example.com")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned error: %v", err)
	}

	want := []string{
		"http://localhost:3000",
		"http://example.com:3000",
		"https://app.example.com",
	}

	if len(cfg.Server.CORSAllowedOrigins) != len(want) {
		t.Fatalf("got %d origins, want %d: %#v", len(cfg.Server.CORSAllowedOrigins), len(want), cfg.Server.CORSAllowedOrigins)
	}

	for i := range want {
		if cfg.Server.CORSAllowedOrigins[i] != want[i] {
			t.Fatalf("origin %d = %q, want %q", i, cfg.Server.CORSAllowedOrigins[i], want[i])
		}
	}
}

func TestLoadDefaultsCORSAllowedOrigins(t *testing.T) {
	t.Setenv("CORS_ALLOWED_ORIGINS", " ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned error: %v", err)
	}

	want := []string{"http://localhost:3000", "http://localhost:5173"}
	if len(cfg.Server.CORSAllowedOrigins) != len(want) {
		t.Fatalf("got %d origins, want %d: %#v", len(cfg.Server.CORSAllowedOrigins), len(want), cfg.Server.CORSAllowedOrigins)
	}

	for i := range want {
		if cfg.Server.CORSAllowedOrigins[i] != want[i] {
			t.Fatalf("origin %d = %q, want %q", i, cfg.Server.CORSAllowedOrigins[i], want[i])
		}
	}
}

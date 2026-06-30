package main

import "testing"

func TestParseConfigDefaults(t *testing.T) {
	cfg := parseConfig([]string{})
	if cfg.BaseURL == "" {
		t.Fatal("expected a default BaseURL")
	}
	if cfg.Reviewers <= 0 {
		t.Fatalf("expected positive reviewer pool, got %d", cfg.Reviewers)
	}
	if cfg.Concurrency <= 0 {
		t.Fatalf("expected positive concurrency, got %d", cfg.Concurrency)
	}
}

func TestParseConfigFlags(t *testing.T) {
	cfg := parseConfig([]string{
		"--reviewers", "7",
		"--submissions-per-conference", "9",
		"--conferences", "3",
		"--base-url", "http://x:1",
	})
	if cfg.Reviewers != 7 || cfg.SubmissionsPerConference != 9 || cfg.Conferences != 3 || cfg.BaseURL != "http://x:1" {
		t.Fatalf("flags not parsed: %+v", cfg)
	}
	if got := cfg.submissionsPerConf(); got != 9 {
		t.Fatalf("submissionsPerConf: want 9, got %d", got)
	}
}

func TestResolvedSizes(t *testing.T) {
	// Total submissions divided across conferences when per-conference is unset.
	cfg := parseConfig([]string{"--submissions", "100", "--conferences", "4"})
	if got := cfg.submissionsPerConf(); got != 25 {
		t.Fatalf("submissionsPerConf from total: want 25, got %d", got)
	}

	// reviewers-per-conference caps at the pool size.
	cfg = parseConfig([]string{"--reviewers", "10", "--reviewers-per-conference", "50"})
	if got := cfg.reviewersPerConf(); got != 10 {
		t.Fatalf("reviewersPerConf cap: want 10, got %d", got)
	}
}

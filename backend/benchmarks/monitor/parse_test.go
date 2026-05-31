package main

import (
	"strings"
	"testing"
)

func TestParseConfigDefaults(t *testing.T) {
	cfg := parseConfig([]string{})
	if cfg.ServerPort != 8080 {
		t.Fatalf("ServerPort: want 8080, got %d", cfg.ServerPort)
	}
	if cfg.Interval.Seconds() != 2 {
		t.Fatalf("Interval: want 2s, got %s", cfg.Interval)
	}
	if len(cfg.Containers) != 3 || cfg.Containers[0] != "conferencespace-db" {
		t.Fatalf("Containers default wrong: %v", cfg.Containers)
	}
	if cfg.Summarize {
		t.Fatal("Summarize should default false")
	}
}

func TestParseConfigFlags(t *testing.T) {
	cfg := parseConfig([]string{
		"--summarize",
		"--pid", "1234",
		"--containers", "a,b",
		"--interval", "5s",
		"--in", "x.jsonl",
		"--out", "y.json",
	})
	if !cfg.Summarize || cfg.PID != 1234 {
		t.Fatalf("flags not parsed: %+v", cfg)
	}
	if len(cfg.Containers) != 2 || cfg.Containers[1] != "b" {
		t.Fatalf("containers not parsed: %v", cfg.Containers)
	}
	if cfg.Interval.Seconds() != 5 || cfg.In != "x.jsonl" || cfg.SummaryOut != "y.json" {
		t.Fatalf("flags not parsed: %+v", cfg)
	}
}

func TestParseCPUTime(t *testing.T) {
	cases := map[string]float64{
		"05":          5,
		"01:05":       65,
		"02:01:05":    7265,
		"1-02:01:05":  93665,
		"  00:00:02 ": 2,
	}
	for in, want := range cases {
		got, err := parseCPUTime(in)
		if err != nil {
			t.Fatalf("parseCPUTime(%q) error: %v", in, err)
		}
		if got != want {
			t.Fatalf("parseCPUTime(%q): want %v, got %v", in, want, got)
		}
	}
	if _, err := parseCPUTime("garbage"); err == nil {
		t.Fatal("expected error for garbage input")
	}
}

func TestProcessCPUPercent(t *testing.T) {
	got, ok := processCPUPercent(10.0, 12.0, 100.0, 102.0)
	if !ok || got != 100.0 {
		t.Fatalf("want 100%% ok, got %v ok=%v", got, ok)
	}
	if _, ok := processCPUPercent(10, 11, 100, 100); ok {
		t.Fatal("expected !ok for zero wall delta")
	}
	if _, ok := processCPUPercent(10, 11, 100, 99); ok {
		t.Fatal("expected !ok for negative wall delta")
	}
}

func TestParseRSS(t *testing.T) {
	mb, err := parseRSS(" 204800 ")
	if err != nil {
		t.Fatal(err)
	}
	if mb != 200.0 {
		t.Fatalf("parseRSS: want 200, got %v", mb)
	}
}

func TestParseMemUsage(t *testing.T) {
	cases := map[string]float64{
		"318MiB / 512MiB":   318,
		"1.5GiB / 4GiB":     1536,
		"512KiB / 1GiB":     0.5,
		"2GB / 4GB":         1907.3486328125,
		"123.4MiB / 512MiB": 123.4,
	}
	for in, want := range cases {
		got, err := parseMemUsageMiB(in)
		if err != nil {
			t.Fatalf("parseMemUsageMiB(%q): %v", in, err)
		}
		if diff := got - want; diff > 0.01 || diff < -0.01 {
			t.Fatalf("parseMemUsageMiB(%q): want %v, got %v", in, want, got)
		}
	}
}

func TestParseDockerStatsFilter(t *testing.T) {
	lines := []string{
		`{"Name":"conferencespace-db","CPUPerc":"40.2%","MemUsage":"318MiB / 512MiB"}`,
		`{"Name":"conferencespace-neo4j","CPUPerc":"15.0%","MemUsage":"402MiB / 512MiB"}`,
		`{"Name":"some-other-container","CPUPerc":"99%","MemUsage":"10MiB / 1GiB"}`,
	}
	targets := []string{"conferencespace-db", "conferencespace-redis", "conferencespace-neo4j"}
	got := parseDockerStats(strings.Join(lines, "\n"), targets)
	if len(got) != 2 {
		t.Fatalf("want 2 matched targets, got %d: %+v", len(got), got)
	}
	db := got["conferencespace-db"]
	if db.CPUPct != 40.2 || db.MemMB != 318 {
		t.Fatalf("db parsed wrong: %+v", db)
	}
	if _, ok := got["conferencespace-redis"]; ok {
		t.Fatal("redis should be absent")
	}
	if _, ok := got["some-other-container"]; ok {
		t.Fatal("non-target container should be filtered out")
	}
}

func TestSummarize(t *testing.T) {
	jsonl := strings.Join([]string{
		`{"ts":"2026-01-01T00:00:00Z","phase":"crud","targets":[{"name":"go-server","kind":"process","cpu_pct":null,"mem_mb":100}]}`,
		`{"ts":"2026-01-01T00:00:02Z","phase":"crud","targets":[{"name":"go-server","kind":"process","cpu_pct":50,"mem_mb":120}]}`,
		`{"ts":"2026-01-01T00:00:04Z","phase":"crud","targets":[{"name":"go-server","kind":"process","cpu_pct":90,"mem_mb":140}]}`,
		`{"ts":"2026-01-01T00:00:06Z","phase":"coi","targets":[{"name":"conferencespace-db","kind":"container","cpu_pct":80,"mem_mb":300}]}`,
	}, "\n")

	sum, err := summarize(strings.NewReader(jsonl))
	if err != nil {
		t.Fatal(err)
	}
	crud := sum.Phases["crud"].Targets["go-server"]
	if crud.CPUPct.Avg != 70 || crud.CPUPct.Peak != 90 {
		t.Fatalf("crud cpu wrong: %+v", crud.CPUPct)
	}
	if crud.MemMB.Avg != 120 || crud.MemMB.Peak != 140 {
		t.Fatalf("crud mem wrong: %+v", crud.MemMB)
	}
	if sum.Phases["crud"].Samples != 3 {
		t.Fatalf("crud samples: want 3, got %d", sum.Phases["crud"].Samples)
	}
	overall := sum.Overall.Targets["go-server"]
	if overall.CPUPct.Peak != 90 {
		t.Fatalf("overall peak wrong: %+v", overall.CPUPct)
	}
	if sum.Host.CPUCores < 1 {
		t.Fatalf("host cpu_cores should be >=1, got %d", sum.Host.CPUCores)
	}
}

func TestSummarizeEmpty(t *testing.T) {
	sum, err := summarize(strings.NewReader(""))
	if err != nil {
		t.Fatal(err)
	}
	if sum.Overall.Samples != 0 {
		t.Fatalf("empty input should yield 0 samples, got %d", sum.Overall.Samples)
	}
}

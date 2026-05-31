package main

import (
	"flag"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	PID        int
	ServerPort int
	Containers []string
	Interval   time.Duration
	Out        string
	PhaseFile  string
	Summarize  bool
	In         string
	SummaryOut string
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func atoiOr(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func durationOr(s string, def time.Duration) time.Duration {
	if s == "" {
		return def
	}
	d, err := time.ParseDuration(s)
	if err != nil {
		return def
	}
	return d
}

func splitContainers(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}

func parseConfig(args []string) Config {
	fs := flag.NewFlagSet("monitor", flag.ContinueOnError)
	cfg := Config{}

	pid := fs.Int("pid", atoiOr(os.Getenv("SERVER_PID"), 0), "server PID (0 = auto-detect via lsof)")
	fs.IntVar(&cfg.ServerPort, "server-port", atoiOr(os.Getenv("SERVER_PORT"), 8080), "port for PID auto-detect")
	containers := fs.String("containers", envOr("CONTAINERS", "conferencespace-db,conferencespace-redis,conferencespace-neo4j"), "comma-separated container names")
	fs.DurationVar(&cfg.Interval, "interval", durationOr(os.Getenv("MONITOR_INTERVAL"), 2*time.Second), "sampling interval")
	fs.StringVar(&cfg.Out, "out", "benchmarks/results/resources.jsonl", "sample output (sample mode) / summary output (summarize mode)")
	fs.StringVar(&cfg.PhaseFile, "phase-file", "benchmarks/results/phase.txt", "current-phase control file")
	fs.BoolVar(&cfg.Summarize, "summarize", false, "summarize an existing resources.jsonl")
	fs.StringVar(&cfg.In, "in", "benchmarks/results/resources.jsonl", "input (summarize mode)")

	_ = fs.Parse(args)
	cfg.PID = *pid
	cfg.Containers = splitContainers(*containers)

	if cfg.Summarize {
		cfg.SummaryOut = cfg.Out
		if cfg.SummaryOut == "benchmarks/results/resources.jsonl" {
			cfg.SummaryOut = "benchmarks/results/resources.summary.json"
		}
	}
	return cfg
}

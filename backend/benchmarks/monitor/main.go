package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
)

func main() {
	cfg := parseConfig(os.Args[1:])

	if cfg.Summarize {
		if err := runSummarize(cfg); err != nil {
			fmt.Fprintf(os.Stderr, "summarize failed: %v\n", err)
			os.Exit(1)
		}
		return
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if err := runSampler(ctx, cfg); err != nil {
		fmt.Fprintf(os.Stderr, "sampler failed: %v\n", err)
		os.Exit(1)
	}
}

func runSummarize(cfg Config) error {
	in, err := os.Open(cfg.In)
	if err != nil {
		if os.IsNotExist(err) {
			empty := &Summary{
				GeneratedAt: time.Now().UTC().Format(time.RFC3339),
				Host:        hostInfo{CPUCores: runtime.NumCPU(), TotalMemMB: totalMemMB()},
				Phases:      map[string]phaseSummary{},
				Overall:     phaseSummary{Samples: 0, Targets: map[string]targetSummary{}},
			}
			return writeJSON(cfg.SummaryOut, empty)
		}
		return err
	}
	defer in.Close()
	sum, err := summarize(in)
	if err != nil {
		return err
	}
	if err := writeJSON(cfg.SummaryOut, sum); err != nil {
		return err
	}
	fmt.Printf("resource summary -> %s\n", cfg.SummaryOut)
	return nil
}

func writeJSON(path string, v interface{}) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	buf, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, buf, 0o644)
}

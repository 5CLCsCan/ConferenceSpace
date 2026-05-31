package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type containerStat struct {
	CPUPct float64
	MemMB  float64
}

type dockerStatRow struct {
	Name     string `json:"Name"`
	CPUPerc  string `json:"CPUPerc"`
	MemUsage string `json:"MemUsage"`
}

// parseCPUTime parses ps -o cputime output: [[DD-]HH:]MM:SS -> seconds.
func parseCPUTime(s string) (float64, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, fmt.Errorf("empty cputime")
	}
	days := 0.0
	if i := strings.Index(s, "-"); i >= 0 {
		d, err := strconv.Atoi(s[:i])
		if err != nil {
			return 0, fmt.Errorf("bad days in %q: %w", s, err)
		}
		days = float64(d)
		s = s[i+1:]
	}
	parts := strings.Split(s, ":")
	var secs float64
	for _, p := range parts {
		n, err := strconv.ParseFloat(strings.TrimSpace(p), 64)
		if err != nil {
			return 0, fmt.Errorf("bad cputime field %q in %q: %w", p, s, err)
		}
		secs = secs*60 + n
	}
	return days*86400 + secs, nil
}

// processCPUPercent returns per-core CPU% from CPU-time and wall deltas.
func processCPUPercent(cpuPrev, cpuNow, wallPrev, wallNow float64) (float64, bool) {
	dw := wallNow - wallPrev
	if dw <= 0 {
		return 0, false
	}
	dc := cpuNow - cpuPrev
	if dc < 0 {
		dc = 0
	}
	return dc / dw * 100.0, true
}

// parseRSS parses ps -o rss output (KB) into MiB.
func parseRSS(s string) (float64, error) {
	n, err := strconv.ParseFloat(strings.TrimSpace(s), 64)
	if err != nil {
		return 0, fmt.Errorf("bad rss %q: %w", s, err)
	}
	return n / 1024.0, nil
}

func parsePercent(s string) (float64, error) {
	s = strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(s), "%"))
	return strconv.ParseFloat(s, 64)
}

// parseMemUsageMiB parses the used side of docker's "used / limit" MemUsage.
func parseMemUsageMiB(s string) (float64, error) {
	used := s
	if i := strings.Index(s, "/"); i >= 0 {
		used = s[:i]
	}
	return parseByteSizeMiB(strings.TrimSpace(used))
}

func parseByteSizeMiB(s string) (float64, error) {
	s = strings.TrimSpace(s)
	units := []struct {
		suf   string
		bytes float64
	}{
		{"GiB", 1024 * 1024 * 1024},
		{"MiB", 1024 * 1024},
		{"KiB", 1024},
		{"GB", 1000 * 1000 * 1000},
		{"MB", 1000 * 1000},
		{"KB", 1000},
		{"B", 1},
	}
	for _, u := range units {
		if strings.HasSuffix(s, u.suf) {
			num := strings.TrimSpace(strings.TrimSuffix(s, u.suf))
			v, err := strconv.ParseFloat(num, 64)
			if err != nil {
				return 0, fmt.Errorf("bad size %q: %w", s, err)
			}
			return v * u.bytes / (1024 * 1024), nil
		}
	}
	return 0, fmt.Errorf("unknown size unit in %q", s)
}

// parseDockerStats parses newline-delimited docker stats JSON and filters to targets.
func parseDockerStats(out string, targets []string) map[string]containerStat {
	want := make(map[string]bool, len(targets))
	for _, t := range targets {
		want[t] = true
	}
	res := make(map[string]containerStat)
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var row dockerStatRow
		if err := json.Unmarshal([]byte(line), &row); err != nil {
			continue
		}
		if !want[row.Name] {
			continue
		}
		cpu, err1 := parsePercent(row.CPUPerc)
		mem, err2 := parseMemUsageMiB(row.MemUsage)
		if err1 != nil || err2 != nil {
			continue
		}
		res[row.Name] = containerStat{CPUPct: cpu, MemMB: mem}
	}
	return res
}

func detectServerPID(port int) int {
	out, err := exec.Command("lsof", "-ti", "tcp:"+strconv.Itoa(port), "-sTCP:LISTEN").Output()
	if err != nil {
		return 0
	}
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if pid, err := strconv.Atoi(strings.TrimSpace(line)); err == nil && pid > 0 {
			return pid
		}
	}
	return 0
}

func readProcCPUMem(pid int) (float64, float64, error) {
	out, err := exec.Command("ps", "-o", "cputime=,rss=", "-p", strconv.Itoa(pid)).Output()
	if err != nil {
		return 0, 0, err
	}
	fields := strings.Fields(strings.TrimSpace(string(out)))
	if len(fields) < 2 {
		return 0, 0, fmt.Errorf("unexpected ps output %q", string(out))
	}
	cpu, err := parseCPUTime(fields[0])
	if err != nil {
		return 0, 0, err
	}
	rss, err := parseRSS(fields[1])
	if err != nil {
		return 0, 0, err
	}
	return cpu, rss, nil
}

func readDockerStats(targets []string) map[string]containerStat {
	out, err := exec.Command("docker", "stats", "--no-stream", "--format", "{{json .}}").Output()
	if err != nil {
		return map[string]containerStat{}
	}
	return parseDockerStats(string(out), targets)
}

func readPhase(path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
		return "unknown"
	}
	p := strings.TrimSpace(string(b))
	if p == "" {
		return "unknown"
	}
	return p
}

// runSampler samples until ctx is cancelled, appending JSONL to cfg.Out.
func runSampler(ctx context.Context, cfg Config) error {
	pid := cfg.PID
	if pid == 0 {
		pid = detectServerPID(cfg.ServerPort)
	}
	if pid == 0 {
		fmt.Fprintln(os.Stderr, "monitor: no server PID resolved; sampling containers only")
	}

	if err := os.MkdirAll(filepath.Dir(cfg.Out), 0o755); err != nil {
		return err
	}
	f, err := os.OpenFile(cfg.Out, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)

	var (
		prevCPU  float64
		prevWall time.Time
		havePrev bool
	)

	tick := func() {
		now := time.Now()
		var targets []targetSample

		if pid > 0 {
			cpuSec, rss, err := readProcCPUMem(pid)
			if err == nil {
				var cpuPtr *float64
				if havePrev {
					if pct, ok := processCPUPercent(prevCPU, cpuSec, 0, now.Sub(prevWall).Seconds()); ok {
						cpuPtr = &pct
					}
				}
				memVal := rss
				targets = append(targets, targetSample{
					Name: "go-server", Kind: "process", CPUPct: cpuPtr, MemMB: &memVal,
				})
				prevCPU = cpuSec
				prevWall = now
				havePrev = true
			}
		}

		stats := readDockerStats(cfg.Containers)
		for _, name := range cfg.Containers {
			st, ok := stats[name]
			if !ok {
				continue
			}
			cpu := st.CPUPct
			mem := st.MemMB
			targets = append(targets, targetSample{
				Name: name, Kind: "container", CPUPct: &cpu, MemMB: &mem,
			})
		}

		line := sampleLine{
			TS:      now.UTC().Format(time.RFC3339),
			Phase:   readPhase(cfg.PhaseFile),
			Targets: targets,
		}
		if err := enc.Encode(&line); err != nil {
			fmt.Fprintf(os.Stderr, "monitor: write error: %v\n", err)
		}
	}

	t := time.NewTicker(cfg.Interval)
	defer t.Stop()
	tick()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-t.C:
			tick()
		}
	}
}

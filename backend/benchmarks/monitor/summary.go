package main

import (
	"bufio"
	"encoding/json"
	"io"
	"runtime"
	"time"
)

type sampleLine struct {
	TS      string         `json:"ts"`
	Phase   string         `json:"phase"`
	Targets []targetSample `json:"targets"`
}

type targetSample struct {
	Name   string   `json:"name"`
	Kind   string   `json:"kind"`
	CPUPct *float64 `json:"cpu_pct"`
	MemMB  *float64 `json:"mem_mb"`
}

type stat struct {
	Avg  float64 `json:"avg"`
	Peak float64 `json:"peak"`
}

type targetSummary struct {
	CPUPct stat `json:"cpu_pct"`
	MemMB  stat `json:"mem_mb"`
}

type phaseSummary struct {
	Samples int                      `json:"samples"`
	Targets map[string]targetSummary `json:"targets"`
}

type hostInfo struct {
	CPUCores   int     `json:"cpu_cores"`
	TotalMemMB float64 `json:"total_mem_mb"`
}

type Summary struct {
	GeneratedAt string                  `json:"generated_at"`
	Host        hostInfo                `json:"host"`
	Phases      map[string]phaseSummary `json:"phases"`
	Overall     phaseSummary            `json:"overall"`
}

type acc struct {
	cpuSum, cpuPeak float64
	cpuN            int
	memSum, memPeak float64
	memN            int
}

func (a *acc) addCPU(v float64) {
	a.cpuSum += v
	a.cpuN++
	if v > a.cpuPeak {
		a.cpuPeak = v
	}
}

func (a *acc) addMem(v float64) {
	a.memSum += v
	a.memN++
	if v > a.memPeak {
		a.memPeak = v
	}
}

func (a *acc) toSummary() targetSummary {
	var ts targetSummary
	if a.cpuN > 0 {
		ts.CPUPct = stat{Avg: a.cpuSum / float64(a.cpuN), Peak: a.cpuPeak}
	}
	if a.memN > 0 {
		ts.MemMB = stat{Avg: a.memSum / float64(a.memN), Peak: a.memPeak}
	}
	return ts
}

func summarize(r io.Reader) (*Summary, error) {
	phaseAcc := map[string]map[string]*acc{}
	phaseSamples := map[string]int{}
	overallAcc := map[string]*acc{}
	overallSamples := 0

	sc := bufio.NewScanner(r)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for sc.Scan() {
		line := sc.Bytes()
		if len(line) == 0 {
			continue
		}
		var s sampleLine
		if err := json.Unmarshal(line, &s); err != nil {
			continue
		}
		overallSamples++
		phaseSamples[s.Phase]++
		if phaseAcc[s.Phase] == nil {
			phaseAcc[s.Phase] = map[string]*acc{}
		}
		for _, t := range s.Targets {
			if phaseAcc[s.Phase][t.Name] == nil {
				phaseAcc[s.Phase][t.Name] = &acc{}
			}
			if overallAcc[t.Name] == nil {
				overallAcc[t.Name] = &acc{}
			}
			if t.CPUPct != nil {
				phaseAcc[s.Phase][t.Name].addCPU(*t.CPUPct)
				overallAcc[t.Name].addCPU(*t.CPUPct)
			}
			if t.MemMB != nil {
				phaseAcc[s.Phase][t.Name].addMem(*t.MemMB)
				overallAcc[t.Name].addMem(*t.MemMB)
			}
		}
	}
	if err := sc.Err(); err != nil {
		return nil, err
	}

	sum := &Summary{
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Host:        hostInfo{CPUCores: runtime.NumCPU(), TotalMemMB: totalMemMB()},
		Phases:      map[string]phaseSummary{},
	}
	for phase, targets := range phaseAcc {
		ps := phaseSummary{Samples: phaseSamples[phase], Targets: map[string]targetSummary{}}
		for name, a := range targets {
			ps.Targets[name] = a.toSummary()
		}
		sum.Phases[phase] = ps
	}
	overall := phaseSummary{Samples: overallSamples, Targets: map[string]targetSummary{}}
	for name, a := range overallAcc {
		overall.Targets[name] = a.toSummary()
	}
	sum.Overall = overall
	return sum, nil
}

package main

import (
	"os/exec"
	"runtime"
	"strconv"
	"strings"
)

// totalMemMB returns total physical memory in MiB, or 0 if it can't be read.
func totalMemMB() float64 {
	switch runtime.GOOS {
	case "darwin":
		out, err := exec.Command("sysctl", "-n", "hw.memsize").Output()
		if err != nil {
			return 0
		}
		b, err := strconv.ParseFloat(strings.TrimSpace(string(out)), 64)
		if err != nil {
			return 0
		}
		return b / (1024 * 1024)
	case "linux":
		out, err := exec.Command("sh", "-c", "grep MemTotal /proc/meminfo").Output()
		if err != nil {
			return 0
		}
		fields := strings.Fields(string(out))
		if len(fields) < 2 {
			return 0
		}
		kb, err := strconv.ParseFloat(fields[1], 64)
		if err != nil {
			return 0
		}
		return kb / 1024
	default:
		return 0
	}
}

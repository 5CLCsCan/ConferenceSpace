package main

import (
	"os"
	"path/filepath"
)

// backendRoot returns the directory containing scripts/graph_ingestion.
func backendRoot() string {
	wd, err := os.Getwd()
	if err != nil {
		return "."
	}
	candidates := []string{wd, filepath.Join(wd, "..")}
	for _, dir := range candidates {
		if _, err := os.Stat(filepath.Join(dir, "scripts", "graph_ingestion")); err == nil {
			return dir
		}
	}
	return wd
}

func resultsDir() string {
	root := backendRoot()
	return filepath.Join(root, "benchmarks", "results")
}

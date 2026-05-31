package main

import (
	"fmt"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
)

func seedGraph(cfg Config) error {
	csvPath := filepath.Join(os.TempDir(), "bench_coauthors.csv")
	if err := writeCoauthorCSV(csvPath, cfg.Authors, cfg.CoauthorEdges); err != nil {
		return fmt.Errorf("generate csv: %w", err)
	}

	loaderDir := filepath.Join(backendRoot(), "scripts", "graph_ingestion")
	cmd := exec.Command("go", "run", ".",
		"-file="+csvPath,
		"-uri="+cfg.Neo4jURI,
		"-user="+cfg.Neo4jUser,
		"-pass="+cfg.Neo4jPass,
		"-clear",
	)
	cmd.Dir = loaderDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func writeCoauthorCSV(path string, authors, edges int) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := fmt.Fprintln(f, "author_1,author_2,date,metadata"); err != nil {
		return err
	}
	for i := 0; i < edges; i++ {
		a := rand.Intn(authors)
		b := rand.Intn(authors)
		if a == b {
			b = (b + 1) % authors
		}
		if _, err := fmt.Fprintf(f, "bench-reviewer-%d@example.com,bench-reviewer-%d@example.com,2024,\n", a, b); err != nil {
			return err
		}
	}
	return nil
}

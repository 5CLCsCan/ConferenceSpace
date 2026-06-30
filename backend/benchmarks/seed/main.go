package main

import (
	"fmt"
	"os"
)

func main() {
	cfg := parseConfig(os.Args[1:])
	c := newAPIClient(cfg.BaseURL)

	if cfg.GraphOnly {
		if err := seedGraph(cfg); err != nil {
			fmt.Fprintf(os.Stderr, "graph seed failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("graph seed complete")
		return
	}

	sum, err := seedPostgres(c, cfg)
	if err != nil {
		fmt.Fprintf(os.Stderr, "seed failed: %v\n", err)
		os.Exit(1)
	}
	path, err := writeSummary(sum)
	if err != nil {
		fmt.Fprintf(os.Stderr, "write summary failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("seeded %d conferences, %d submissions, %d reviewers -> %s\n",
		len(sum.ConferenceIDs), len(sum.SubmissionIDs), len(sum.ReviewerIDs), path)
}

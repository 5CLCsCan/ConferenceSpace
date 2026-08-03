package main

import (
	"testing"

	ss "github.com/dcao/conferencespace/internal/clients/semantic_scholar"
)

func TestBuildSnapshot(t *testing.T) {
	authors := []fetchedAuthor{
		{
			ID:   "A1",
			Name: "Alice",
			Papers: []ss.Paper{
				{PaperID: "P1", Title: "Graph Neural Networks", Authors: []ss.Author{{AuthorID: "A1"}}},
				{PaperID: "P2", Title: "Language Model Pretraining", Authors: []ss.Author{{AuthorID: "A1"}, {AuthorID: "A2"}}},
			},
		},
		{
			ID:   "A2",
			Name: "Bob",
			Papers: []ss.Paper{
				{PaperID: "P2", Title: "Language Model Pretraining", Authors: []ss.Author{{AuthorID: "A1"}, {AuthorID: "A2"}}},
			},
		},
	}
	snap := buildSnapshot(authors)

	// P1 and P2 -> 2 unique papers.
	if len(snap.Papers) != 2 {
		t.Fatalf("papers = %d, want 2", len(snap.Papers))
	}
	if len(snap.Authors) != 2 {
		t.Fatalf("authors = %d, want 2", len(snap.Authors))
	}

	// P2 is co-authored -> both A1 and A2 attributed.
	var p2 *ss.Paper
	_ = p2
	for _, p := range snap.Papers {
		if p.ID == "P2" {
			if len(p.AuthorIDs) != 2 {
				t.Fatalf("P2 authorIds = %v, want 2", p.AuthorIDs)
			}
			if len(p.Topics) == 0 {
				t.Fatal("P2 has no topics")
			}
		}
	}
}

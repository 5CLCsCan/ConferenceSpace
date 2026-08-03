package main

import (
	"sort"

	"github.com/dcao/conferencespace/benchmarks/quality"
	ss "github.com/dcao/conferencespace/internal/clients/semantic_scholar"
)

// fetchedAuthor is an author plus the papers we pulled for them.
type fetchedAuthor struct {
	ID     string
	Name   string
	Papers []ss.Paper
}

// paperFields flattens a paper's coarse S2 field tags for topic enrichment.
func paperFields(p ss.Paper) []string {
	out := append([]string(nil), p.FieldsOfStudy...)
	for _, f := range p.S2FieldsOfStudy {
		if f.Category != "" {
			out = append(out, f.Category)
		}
	}
	return out
}

// buildSnapshot converts fetched authors into a deterministic quality.Snapshot.
// Papers are deduped by ID; each paper is attributed to every fetched author that
// appears in its author list.
func buildSnapshot(authors []fetchedAuthor) *quality.Snapshot {
	known := make(map[string]bool, len(authors))
	names := make(map[string]string, len(authors))
	for _, a := range authors {
		known[a.ID] = true
		names[a.ID] = a.Name
	}

	papers := make(map[string]*quality.PaperRecord)
	authorPapers := make(map[string]map[string]bool) // authorID -> set of paperIDs

	for _, a := range authors {
		for _, p := range a.Papers {
			if p.PaperID == "" {
				continue
			}
			rec, ok := papers[p.PaperID]
			if !ok {
				attributed := []string{}
				seen := map[string]bool{}
				for _, pa := range p.Authors {
					if known[pa.AuthorID] && !seen[pa.AuthorID] {
						attributed = append(attributed, pa.AuthorID)
						seen[pa.AuthorID] = true
					}
				}
				// Ensure the fetching author is attributed even if the paper's
				// author list is sparse.
				if !seen[a.ID] {
					attributed = append(attributed, a.ID)
				}
				sort.Strings(attributed)
				rec = &quality.PaperRecord{
					ID:        p.PaperID,
					AuthorIDs: attributed,
					Title:     p.Title,
					Topics:    quality.ExtractTopics(p.Title, paperFields(p)),
				}
				papers[p.PaperID] = rec
			}
			for _, aid := range rec.AuthorIDs {
				if authorPapers[aid] == nil {
					authorPapers[aid] = map[string]bool{}
				}
				authorPapers[aid][p.PaperID] = true
			}
		}
	}

	snap := &quality.Snapshot{}
	authorIDs := make([]string, 0, len(known))
	for id := range known {
		authorIDs = append(authorIDs, id)
	}
	sort.Strings(authorIDs)
	for _, id := range authorIDs {
		pids := make([]string, 0, len(authorPapers[id]))
		for pid := range authorPapers[id] {
			pids = append(pids, pid)
		}
		sort.Strings(pids)
		snap.Authors = append(snap.Authors, quality.AuthorRecord{ID: id, Name: names[id], Papers: pids})
	}

	paperIDs := make([]string, 0, len(papers))
	for pid := range papers {
		paperIDs = append(paperIDs, pid)
	}
	sort.Strings(paperIDs)
	for _, pid := range paperIDs {
		snap.Papers = append(snap.Papers, *papers[pid])
	}
	return snap
}

// keepTopAuthors retains the N authors with the most papers. Ties are broken
// by author ID for determinism. Papers and attributions are updated to match.
func keepTopAuthors(snap *quality.Snapshot, n int) *quality.Snapshot {
	if len(snap.Authors) <= n {
		return snap
	}
	// Sort by paper count descending, then author ID ascending.
	sorted := make([]quality.AuthorRecord, len(snap.Authors))
	copy(sorted, snap.Authors)
	sort.Slice(sorted, func(i, j int) bool {
		if len(sorted[i].Papers) != len(sorted[j].Papers) {
			return len(sorted[i].Papers) > len(sorted[j].Papers)
		}
		return sorted[i].ID < sorted[j].ID
	})
	keep := map[string]bool{}
	out := &quality.Snapshot{}
	for i := 0; i < n && i < len(sorted); i++ {
		keep[sorted[i].ID] = true
		out.Authors = append(out.Authors, sorted[i])
	}
	// Re-sort authors by ID for determinism.
	sort.Slice(out.Authors, func(i, j int) bool {
		return out.Authors[i].ID < out.Authors[j].ID
	})
	referenced := map[string]bool{}
	for _, a := range out.Authors {
		for _, pid := range a.Papers {
			referenced[pid] = true
		}
	}
	for _, p := range snap.Papers {
		if referenced[p.ID] {
			filtered := p.AuthorIDs[:0:0]
			for _, aid := range p.AuthorIDs {
				if keep[aid] {
					filtered = append(filtered, aid)
				}
			}
			p.AuthorIDs = filtered
			out.Papers = append(out.Papers, p)
		}
	}
	return out
}

// pruneToUsable drops authors with fewer than 2 papers (so each yields a
// leave-one-out query) and then drops papers no longer referenced by any author.
func pruneToUsable(snap *quality.Snapshot) *quality.Snapshot {
	keepAuthor := map[string]bool{}
	out := &quality.Snapshot{}
	for _, a := range snap.Authors {
		if len(a.Papers) >= 2 {
			keepAuthor[a.ID] = true
			out.Authors = append(out.Authors, a)
		}
	}
	referenced := map[string]bool{}
	for _, a := range out.Authors {
		for _, pid := range a.Papers {
			referenced[pid] = true
		}
	}
	for _, p := range snap.Papers {
		if referenced[p.ID] {
			// Keep only attributions to retained authors.
			filtered := p.AuthorIDs[:0:0]
			for _, aid := range p.AuthorIDs {
				if keepAuthor[aid] {
					filtered = append(filtered, aid)
				}
			}
			p.AuthorIDs = filtered
			out.Papers = append(out.Papers, p)
		}
	}
	return out
}

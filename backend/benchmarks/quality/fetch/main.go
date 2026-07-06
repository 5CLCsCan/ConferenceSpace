package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	ss "github.com/dcao/conferencespace/internal/clients/semantic_scholar"
	"github.com/joho/godotenv"
)

// loadDotenv best-effort loads the project's .env so SEMANTIC_SCHOLAR_API_KEY is
// picked up without the caller having to `export` it. godotenv.Load does not
// override variables already set in the environment, and the first file to define
// a key wins — so a local .env (when run from this dir) takes precedence over the
// backend .env (when run from backend/benchmarks/quality via ../../.env).
func loadDotenv() {
	_ = godotenv.Load()             // .env in the current working directory, if any
	_ = godotenv.Load("../../.env") // backend/.env when run from benchmarks/quality
}

// isRateLimited reports whether err is a Semantic Scholar 429 response.
func isRateLimited(err error) bool {
	return err != nil && strings.Contains(err.Error(), "status 429")
}

// retryOn429 retries fn with exponential backoff when the API rate-limits us.
// Keyless callers are throttled hard; setting SEMANTIC_SCHOLAR_API_KEY raises the
// limit and makes a large fetch viable.
func retryOn429[T any](fn func() (T, error)) (T, error) {
	var zero T
	backoff := 2 * time.Second
	for attempt := 0; attempt < 5; attempt++ {
		v, err := fn()
		if !isRateLimited(err) {
			return v, err
		}
		time.Sleep(backoff)
		backoff *= 2
	}
	return zero, fmt.Errorf("giving up after repeated 429s (set SEMANTIC_SCHOLAR_API_KEY for higher limits)")
}

// seedQueries drive paper discovery. Chosen to span distinct CS sub-areas so topic
// overlap in the fixture is partial and realistic.
var seedQueries = []string{
	"natural language processing",
	"computer vision",
	"graph neural networks",
	"reinforcement learning",
	"information retrieval",
	"speech recognition",
	"machine learning",
	"deep learning",
}

func main() {
	out := flag.String("out", "testdata/s2_snapshot.json", "output snapshot path (relative to benchmarks/quality)")
	papersPerQuery := flag.Int("papers-per-query", 30, "papers to search per seed query")
	authorsPerQuery := flag.Int("authors-per-query", 15, "max unique authors to keep per seed query")
	papersPerAuthor := flag.Int("papers-per-author", 50, "max papers to pull per author")
	maxAuthors := flag.Int("max-authors", 60, "total authors to include in snapshot")
	flag.Parse()

	loadDotenv()

	key := os.Getenv("SEMANTIC_SCHOLAR_API_KEY")
	if key == "" {
		log.Printf("no SEMANTIC_SCHOLAR_API_KEY found; using keyless (rate-limited) access")
	} else {
		log.Printf("using SEMANTIC_SCHOLAR_API_KEY from environment/.env")
	}
	client := ss.NewClient(ss.Config{APIKey: key})
	ctx := context.Background()

	// Phase 1: Search papers by topic, extract authors.
	// SearchPapers finds papers whose title/abstract match the query — this is the
	// correct way to discover authors in a research area. (SearchAuthors searches
	// author *names*, not research fields, which is why the old approach returned
	// irrelevant authors like "Computer Center".)
	discovered := map[string]string{} // authorID -> name
	for _, q := range seedQueries {
		resp, err := retryOn429(func() (*ss.PaperSearchResponse, error) {
			return client.SearchPapers(ctx, q, *papersPerQuery)
		})
		if err != nil {
			log.Printf("paper search %q failed: %v", q, err)
			continue
		}

		// Collect unique authors from this query's papers, up to the per-query cap.
		queryAuthors := 0
		for _, p := range resp.Data {
			for _, a := range p.Authors {
				if a.AuthorID == "" {
					continue
				}
				if _, ok := discovered[a.AuthorID]; !ok {
					discovered[a.AuthorID] = a.Name
					queryAuthors++
					if queryAuthors >= *authorsPerQuery {
						break
					}
				}
			}
			if queryAuthors >= *authorsPerQuery {
				break
			}
		}
		log.Printf("query %q: found %d papers, added %d new authors", q, len(resp.Data), queryAuthors)
	}
	log.Printf("discovered %d unique authors total", len(discovered))

	// Phase 2: Fetch papers for each discovered author.
	var fetched []fetchedAuthor
	for id, name := range discovered {
		resp, err := retryOn429(func() (*ss.PapersResponse, error) {
			return client.GetAuthorPapers(ctx, id, 0, *papersPerAuthor)
		})
		if err != nil {
			log.Printf("papers for %s (%s) failed: %v", name, id, err)
			continue
		}
		fetched = append(fetched, fetchedAuthor{ID: id, Name: name, Papers: resp.Data})
	}
	log.Printf("fetched papers for %d authors", len(fetched))

	// Phase 3: Build and prune snapshot.
	snap := buildSnapshot(fetched)
	snap = pruneToUsable(snap)

	// If we have too many authors, keep the ones with the most papers for a richer
	// benchmark (more papers = more leave-one-out queries).
	if len(snap.Authors) > *maxAuthors {
		snap = keepTopAuthors(snap, *maxAuthors)
	}

	// Write to temp first, validate, then swap.
	tmp := *out + ".tmp"
	b, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		log.Fatalf("marshal: %v", err)
	}
	if err := os.WriteFile(tmp, b, 0o644); err != nil {
		log.Fatalf("write %s: %v", tmp, err)
	}
	if err := os.Rename(tmp, *out); err != nil {
		log.Fatalf("rename %s -> %s: %v", tmp, *out, err)
	}
	fmt.Printf("wrote %s: %d authors, %d papers\n", *out, len(snap.Authors), len(snap.Papers))
}

// Command gen produces a SYNTHETIC snapshot for the matching quality benchmark.
//
// This is not real bibliographic data. It generates authors clustered into
// research subfields, each with a coherent topic fingerprint plus occasional
// cross-field overlap, so the leave-one-out ranking eval and the assignment
// scenario have a realistic (partial, not perfect) overlap structure to score.
//
// Use it while a real dataset is unavailable. When reporting numbers produced
// from this fixture, state that the dataset is synthetic. Replace it with a real
// fetch (`go run ./fetch`) once a valid Semantic Scholar key is available — the
// output schema is identical, so the benchmark itself does not change.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"sort"
	"strings"

	"github.com/dcao/conferencespace/benchmarks/quality"
)

// subfields maps a research area to its mid-granularity topic vocabulary. Phrases
// mirror the granularity of the real app's keywords/domains ("machine translation",
// not "Computer Science").
var subfields = map[string][]string{
	"nlp": {
		"language model", "machine translation", "named entity recognition",
		"question answering", "text summarization", "sentiment analysis",
		"word embeddings", "dependency parsing", "dialogue systems",
		"coreference resolution",
	},
	"vision": {
		"image segmentation", "object detection", "image classification",
		"pose estimation", "optical flow", "face recognition",
		"semantic segmentation", "image generation", "depth estimation",
		"video understanding",
	},
	"graph": {
		"graph neural networks", "node classification", "link prediction",
		"graph representation", "knowledge graphs", "community detection",
		"graph embeddings", "message passing",
	},
	"rl": {
		"reinforcement learning", "policy gradient", "q learning",
		"reward shaping", "exploration strategies", "actor critic",
		"model based rl", "multi agent rl",
	},
	"ir": {
		"information retrieval", "learning to rank", "query expansion",
		"document ranking", "dense retrieval", "relevance feedback",
		"semantic search", "passage ranking",
	},
	"speech": {
		"speech recognition", "speaker verification", "voice conversion",
		"acoustic modeling", "speech synthesis", "keyword spotting",
		"end to end asr",
	},
	"systems": {
		"distributed training", "model parallelism", "gpu scheduling",
		"inference optimization", "memory efficient training", "gradient compression",
	},
	"theory": {
		"generalization bounds", "convex optimization", "sample complexity",
		"pac learning", "regret analysis", "kernel methods",
	},
}

// drawTopics builds a paper's topic set: 2-3 topics from the author's primary
// subfield, plus (30% of the time) one topic from another field to create the
// partial cross-field overlap that makes ranking non-trivial.
func drawTopics(rng *rand.Rand, primary string, fields []string) []string {
	set := make(map[string]bool)
	pool := subfields[primary]
	k := 2 + rng.Intn(2) // 2 or 3
	for len(set) < k {
		set[pool[rng.Intn(len(pool))]] = true
	}
	if rng.Float64() < 0.3 {
		other := fields[rng.Intn(len(fields))]
		op := subfields[other]
		set[op[rng.Intn(len(op))]] = true
	}
	out := make([]string, 0, len(set))
	for t := range set {
		out = append(out, t)
	}
	sort.Strings(out)
	return out
}

func title(topics []string) string {
	cased := make([]string, len(topics))
	for i, t := range topics {
		cased[i] = strings.Title(t) //nolint:staticcheck // display-only, ASCII topics
	}
	return strings.Join(cased, ", ")
}

func main() {
	out := flag.String("out", "testdata/s2_snapshot.json", "output snapshot path")
	numAuthors := flag.Int("authors", 60, "number of synthetic authors")
	seed := flag.Int64("seed", 42, "RNG seed (fixed for determinism)")
	flag.Parse()

	rng := rand.New(rand.NewSource(*seed))

	fields := make([]string, 0, len(subfields))
	for k := range subfields {
		fields = append(fields, k)
	}
	sort.Strings(fields)

	var snap quality.Snapshot
	paperCounter := 0
	for i := 0; i < *numAuthors; i++ {
		authorID := fmt.Sprintf("A%04d", i+1)
		primary := fields[i%len(fields)] // even spread across subfields
		nPapers := 3 + rng.Intn(3)       // 3-5 papers (>=2 => yields a LOO query)
		var paperIDs []string
		for j := 0; j < nPapers; j++ {
			paperCounter++
			pid := fmt.Sprintf("P%05d", paperCounter)
			topics := drawTopics(rng, primary, fields)
			snap.Papers = append(snap.Papers, quality.PaperRecord{
				ID:        pid,
				AuthorIDs: []string{authorID},
				Title:     title(topics),
				Topics:    topics,
			})
			paperIDs = append(paperIDs, pid)
		}
		snap.Authors = append(snap.Authors, quality.AuthorRecord{
			ID:     authorID,
			Name:   fmt.Sprintf("Author %d (%s)", i+1, primary),
			Papers: paperIDs,
		})
	}

	b, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		log.Fatalf("marshal: %v", err)
	}
	if err := os.WriteFile(*out, b, 0o644); err != nil {
		log.Fatalf("write %s: %v", *out, err)
	}
	fmt.Printf("wrote SYNTHETIC %s: %d authors, %d papers\n", *out, len(snap.Authors), len(snap.Papers))
}

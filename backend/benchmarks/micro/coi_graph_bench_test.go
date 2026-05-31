package micro

import (
	"context"
	"os"
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
	"github.com/dcao/conferencespace/internal/clients/neo4j"
)

// BenchmarkCOI_Graph requires a running Neo4j with a seeded co-authorship graph.
// It skips unless BENCH_NEO4J=1 is set.
func BenchmarkCOI_Graph(b *testing.B) {
	if os.Getenv("BENCH_NEO4J") != "1" {
		b.Skip("set BENCH_NEO4J=1 (and seed the graph) to run the graph COI benchmark")
	}

	client, err := neo4j.NewClient(neo4j.Config{
		URI:      envOrDefault("NEO4J_URI", "bolt://localhost:7687"),
		Username: envOrDefault("NEO4J_USER", "neo4j"),
		Password: envOrDefault("NEO4J_PASS", "conferencespace"),
	})
	if err != nil {
		b.Fatalf("connect neo4j: %v", err)
	}
	defer client.Close(context.Background())

	det := detectors.NewRelationshipDetector(client, detectors.DefaultCOIWindowYears)
	subs, revs := GenCOIInputsBenchReviewers(200, 200, 0.5)
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := det.DetectConflicts(ctx, subs, revs); err != nil {
			b.Fatalf("DetectConflicts failed: %v", err)
		}
	}
}

func envOrDefault(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

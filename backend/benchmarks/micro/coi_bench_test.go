package micro

import (
	"context"
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/detectors"
)

func benchmarkCOI(b *testing.B, numSubs, numReviewers int) {
	subs, revs := GenCOIInputs(numSubs, numReviewers, 0.5)
	det := detectors.NewCompositeDetector(
		detectors.NewSelfAuthorDetector(),
		detectors.NewDeclaredConflictsDetector(),
	)
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if _, err := det.DetectConflicts(ctx, subs, revs); err != nil {
			b.Fatalf("DetectConflicts failed: %v", err)
		}
	}
}

func BenchmarkCOI_Small(b *testing.B)  { benchmarkCOI(b, 50, 50) }
func BenchmarkCOI_Medium(b *testing.B) { benchmarkCOI(b, 500, 200) }
func BenchmarkCOI_Large(b *testing.B)  { benchmarkCOI(b, 2000, 500) }

package micro

import "testing"

func TestGenCOIInputsShape(t *testing.T) {
	subs, revs := GenCOIInputs(10, 20, 0.5)
	if len(subs) != 10 {
		t.Fatalf("want 10 submissions, got %d", len(subs))
	}
	if len(revs) != 20 {
		t.Fatalf("want 20 reviewers, got %d", len(revs))
	}
	declared := 0
	for _, s := range subs {
		if len(s.Declared) > 0 {
			declared++
		}
	}
	if declared == 0 {
		t.Fatalf("expected some declared conflicts, got 0")
	}
}

func TestGenScoreMatrixShape(t *testing.T) {
	m := GenScoreMatrix(5, 8)
	if len(m) != 40 {
		t.Fatalf("want 40 score entries, got %d", len(m))
	}
}

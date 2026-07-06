package quality

import (
	"math"
	"testing"
)

func approx(a, b float64) bool { return math.Abs(a-b) < 1e-9 }

func TestHitAtK(t *testing.T) {
	ranks := []int{1, 3, 0, 6} // 0 = not found
	if got := HitAtK(ranks, 1); !approx(got, 0.25) {
		t.Fatalf("HitAt1 = %v, want 0.25", got)
	}
	if got := HitAtK(ranks, 5); !approx(got, 0.5) {
		t.Fatalf("HitAt5 = %v, want 0.5", got)
	}
}

func TestMRR(t *testing.T) {
	ranks := []int{1, 2, 0} // 1 + 0.5 + 0 = 1.5 over 3
	if got := MRR(ranks); !approx(got, 0.5) {
		t.Fatalf("MRR = %v, want 0.5", got)
	}
}

func TestNDCGAtK(t *testing.T) {
	// rank 1 -> 1/log2(2)=1 ; rank 3 -> 1/log2(4)=0.5 ; not found -> 0. mean over 3.
	ranks := []int{1, 3, 0}
	want := (1.0 + 0.5 + 0.0) / 3.0
	if got := NDCGAtK(ranks, 10); !approx(got, want) {
		t.Fatalf("NDCG = %v, want %v", got, want)
	}
}

func TestMeanMinStdDev(t *testing.T) {
	xs := []float64{2, 4, 4, 4, 5, 5, 7, 9}
	if got := Mean(xs); !approx(got, 5) {
		t.Fatalf("Mean = %v, want 5", got)
	}
	if got := Min(xs); !approx(got, 2) {
		t.Fatalf("Min = %v, want 2", got)
	}
	if got := StdDev(xs); !approx(got, 2) {
		t.Fatalf("StdDev = %v, want 2", got)
	}
	if got := Min(nil); !approx(got, 0) {
		t.Fatalf("Min(nil) = %v, want 0", got)
	}
}

func TestGini(t *testing.T) {
	if got := Gini([]int{2, 2, 2, 2}); !approx(got, 0) {
		t.Fatalf("Gini(equal) = %v, want 0", got)
	}
	if got := Gini([]int{0, 0, 0, 4}); !approx(got, 0.75) {
		t.Fatalf("Gini(skewed) = %v, want 0.75", got)
	}
	if got := Gini([]int{0, 0, 0, 0}); !approx(got, 0) {
		t.Fatalf("Gini(all-zero) = %v, want 0", got)
	}
}

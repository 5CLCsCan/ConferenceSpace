package quality

import (
	"math"
	"sort"
)

// HitAtK returns the fraction of queries whose true-item rank (1-based) is in [1,k].
func HitAtK(ranks []int, k int) float64 {
	if len(ranks) == 0 {
		return 0
	}
	hits := 0
	for _, r := range ranks {
		if r >= 1 && r <= k {
			hits++
		}
	}
	return float64(hits) / float64(len(ranks))
}

// MRR is the mean reciprocal rank; rank 0 (not found) contributes 0.
func MRR(ranks []int) float64 {
	if len(ranks) == 0 {
		return 0
	}
	sum := 0.0
	for _, r := range ranks {
		if r >= 1 {
			sum += 1.0 / float64(r)
		}
	}
	return sum / float64(len(ranks))
}

// NDCGAtK is nDCG for single-relevant queries (IDCG = 1): gain 1/log2(rank+1) if
// rank is within k, else 0, averaged over queries.
func NDCGAtK(ranks []int, k int) float64 {
	if len(ranks) == 0 {
		return 0
	}
	sum := 0.0
	for _, r := range ranks {
		if r >= 1 && r <= k {
			sum += 1.0 / math.Log2(float64(r)+1.0)
		}
	}
	return sum / float64(len(ranks))
}

// Mean returns the arithmetic mean; empty input returns 0.
func Mean(xs []float64) float64 {
	if len(xs) == 0 {
		return 0
	}
	sum := 0.0
	for _, x := range xs {
		sum += x
	}
	return sum / float64(len(xs))
}

// Min returns the minimum; empty input returns 0.
func Min(xs []float64) float64 {
	if len(xs) == 0 {
		return 0
	}
	m := xs[0]
	for _, x := range xs[1:] {
		if x < m {
			m = x
		}
	}
	return m
}

// StdDev returns the population standard deviation; empty input returns 0.
func StdDev(xs []float64) float64 {
	if len(xs) == 0 {
		return 0
	}
	m := Mean(xs)
	var ss float64
	for _, x := range xs {
		d := x - m
		ss += d * d
	}
	return math.Sqrt(ss / float64(len(xs)))
}

// Gini returns the Gini coefficient of a non-negative load distribution.
// 0 = perfectly equal. Empty or all-zero input returns 0.
func Gini(vals []int) float64 {
	n := len(vals)
	if n == 0 {
		return 0
	}
	xs := append([]int(nil), vals...)
	sort.Ints(xs)
	total := 0
	weighted := 0
	for i, v := range xs {
		total += v
		weighted += (i + 1) * v
	}
	if total == 0 {
		return 0
	}
	return float64(2*weighted)/(float64(n)*float64(total)) - float64(n+1)/float64(n)
}

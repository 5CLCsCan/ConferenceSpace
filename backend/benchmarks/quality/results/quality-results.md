# Matching Quality Benchmark Results

## Fixture

- Authors: 60 | Papers: 2565 | Reviewers: 60 | LOO queries: 60
- Topic vocabulary: 14096 | Mean topics/paper: 11.66

## Reviewer Suggestion (ranking)

| Method | Hit@1 | Hit@5 | Hit@10 | MRR | nDCG@10 |
|---|---|---|---|---|---|
| jaccard | 0.250 | 0.550 | 0.650 | 0.392 | 0.442 |
| overlap_count | 0.233 | 0.550 | 0.733 | 0.391 | 0.463 |
| random | 0.017 | 0.083 | 0.167 | 0.078 | 0.076 |

## Assignment Suggestion (optimization)

| Method | Coverage | Load StdDev | Load Gini | COI Violations | Mean Score | Min Score | Fallback Rate |
|---|---|---|---|---|---|---|---|
| greedy | 0.659 | 9.316 | 0.049 | 0 | 0.011 | 0.000 | 0.233 |
| round_robin | 1.000 | 0.940 | 0.005 | 0 | 0.004 | 0.000 | 0.000 |
| random | 1.000 | 1.756 | 0.005 | 0 | 0.004 | 0.000 | 0.000 |

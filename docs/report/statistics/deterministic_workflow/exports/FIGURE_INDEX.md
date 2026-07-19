# Figure index — deterministic workflow (Chương 4)

Sinh tự động từ `scripts/export_benchmark_to_excel.py`.
Nguồn: `benchmark_output/quality-results.{csv,md}` + `ranking_case_counts.xlsx`.
Dùng PNG trong `exports/figures/` cho **Chương 4 — đánh giá thuật toán deterministic** (đối sánh phản biện, phân công, COI).

| File | Nội dung | Gợi ý chỗ dùng |
| --- | --- | --- |
| `fig01_fixture_setup.png` | Quy mô fixture: authors / papers / LOO / vocab | Ch4 — thiết lập đánh giá quality |
| `fig02_ranking_hit_at_k.png` | Hit@1 / Hit@5 / Hit@10 theo method | Ch4 — reviewer ranking |
| `fig03_ranking_mrr_ndcg.png` | MRR và nDCG@10 theo method | Ch4 — reviewer ranking |
| `fig04_ranking_case_counts.png` | Jaccard: số case đúng/sai theo Hit@k | Ch4 — bảng case counts |
| `fig05_ranking_vs_baselines.png` | Jaccard vs overlap_count vs random | Ch4 — so baseline ranking |
| `fig06_assignment_coverage_score.png` | Coverage vs mean relevance score | Ch4 — assignment quality |
| `fig07_assignment_load_balance.png` | Load Gini + StdDev theo method | Ch4 — cân bằng tải |
| `fig08_coi_violations.png` | COI violations = 0 trên mọi method | Ch4 — ràng buộc COI |
| `fig09_assignment_fallback.png` | Fallback rate (pass-2) greedy | Ch4 — trade-off coverage |
| `fig10_headline_metrics.png` | Headline metrics cho slide/báo cáo | Ch4 — tóm tắt kết quả |

## Excel workbook

- `deterministic_workflow_results.xlsx` — workbook báo cáo
  - `Overview` — headline + fixture + COI
  - `Ranking_Metrics` — Hit@k / MRR / nDCG + case counts
  - `Ranking_Case_Detail` — long form Hit@k đúng/sai theo method
  - `Assignment_Metrics` — coverage / load / score / fallback / COI
  - `Quality_Long` — CSV gốc long-form (section, method, metric, value)
  - `Fixture` — thống kê dataset
  - `Case_Counts_*` — sheet copy từ `ranking_case_counts.xlsx`
  - `Run_Meta` — provenance
- `benchmark_output/quality-results.{csv,md}` — raw từ backend quality suite
- `ranking_case_counts.xlsx` — bảng case-level đã soạn cho báo cáo

## Caveats (bắt buộc khi trích vào báo cáo)

1. **Chất lượng ≠ tốc độ.** Gói này đo *độ đúng* ranking/assignment/COI. Tốc độ HTTP/micro nằm ở `system_performance/`.
2. **Proxy ground truth:** leave-one-out authorship — author được coi là reviewer phù hợp cho paper của chính họ. Không phải gold assignment từ hội nghị thật.
3. **Lexical Jaccard:** khớp chuỗi exact trên topic/keyword — synonym (`NLP` ≠ `Natural Language Processing`) bị tính miss.
4. **COI trong quality suite** = self-authorship map trong scenario synthetic; không thay đánh giá full 3-layer COI (declared + Neo4j multi-hop) dưới tải production (xem k6 COI trong system_performance).
5. Greedy coverage < 100% là trade-off có chủ đích: ưu tiên điểm phù hợp; pass-2 chỉ cứu paper 0 reviewer, không lấp paper dưới min reviewers.
6. `overlap_count` có thể gần hoặc hơi hơn Jaccard ở một số metric (union-normalization phạt profile rộng) — vẫn giữ Jaccard production vì ổn định hơn trên profile không đều.
7. Số case đúng/sai = `round(rate × n_queries)`; khớp `ranking_case_counts.xlsx`.

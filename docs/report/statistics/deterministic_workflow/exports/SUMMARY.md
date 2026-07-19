# Tóm tắt benchmark deterministic workflow (Chương 4)

**Run:** `matching-quality-benchmark`  
**Nguồn raw:** `backend/benchmarks/quality/results/quality-results.csv`  
**Suite:** `backend/benchmarks/quality/`  
**Fixture:** 60 authors · 2565 papers · 60 LOO queries · vocab 14096  
**Thuật toán:** deterministic (Jaccard + greedy assignment + COI hard constraint)

## 1. Reviewer ranking (gợi ý phản biện)

Proxy ground truth: leave-one-out authorship — author thật phải xuất hiện trong top-k.

| Method | Role | Hit@1 | Hit@5 | Hit@10 | MRR | nDCG@10 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| jaccard | production | 0.250 | 0.550 | 0.650 | 0.392 | 0.442 |
| overlap_count | baseline | 0.233 | 0.550 | 0.733 | 0.391 | 0.463 |
| random | baseline | 0.017 | 0.083 | 0.167 | 0.078 | 0.076 |

**Nhận xét ngắn:**

- Jaccard production: Hit@1 **25%** (15/60), Hit@5 **55%**, Hit@10 **65%**, MRR **0.392**.
- Vượt random rõ: MRR lift ≈ **5.0×** (random MRR 0.078 ≈ sàn lý thuyết leave-one-out).
- `overlap_count` gần Jaccard (thậm chí Hit@10 cao hơn một chút) — union-normalization của Jaccard phạt profile topic rộng.

## 2. Assignment (phân công tối ưu ràng buộc)

| Method | Role | Coverage | Load StdDev | Load Gini | COI | Mean score | Fallback |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| greedy | production | 0.659 | 9.316 | 0.049 | 0 | 0.0107 | 0.233 |
| round_robin | baseline | 1.000 | 0.940 | 0.005 | 0 | 0.0038 | 0.000 |
| random | baseline | 1.000 | 1.756 | 0.005 | 0 | 0.0037 | 0.000 |

**Nhận xét ngắn:**

- Greedy production: coverage **65.9%**, mean score **0.0107**, fallback **23.3%**, **0 COI violations**.
- Baselines (round_robin / random) đạt coverage 100% nhưng mean score ~3× thấp hơn — chứng tỏ greedy đổi coverage lấy relevance.
- Load Gini greedy cao hơn baselines một chút (tập trung reviewer giỏi); vẫn trong mức chấp nhận được cho lượt gợi ý.

## 3. COI (ràng buộc cứng trong assignment)

- Tổng COI violations trên mọi method: **0**.
- Quality suite gắn self-authorship COI vào scenario; greedy/round_robin/random đều nhận cùng conflict map và **không** gán cặp xung đột.
- Đánh giá latency/throughput endpoint COI production nằm ở gói `system_performance` (k6 scenario `coi`, ~16.7k request, median ~9.5 ms).

## 4. File dùng trong báo cáo

| Nhu cầu | File |
| --- | --- |
| Bảng ranking / assignment / COI | `exports/deterministic_workflow_results.xlsx` |
| Biểu đồ chèn LaTeX/Word | `exports/figures/fig01_…` → `fig10_…` |
| Mục lục figure + caveats | `exports/FIGURE_INDEX.md` |
| Case counts Hit@k (đã soạn) | `ranking_case_counts.xlsx` |
| Raw backend quality | `benchmark_output/quality-results.{csv,md}` |

## 5. Caveats (bắt buộc)

1. Proxy ground truth leave-one-out — đo tính nhất quán fingerprint topic, không phải gold assignment hội nghị.
2. Jaccard lexical exact-match — synonym là miss.
3. COI quality = self-authorship trong scenario; full graph COI xem system_performance + Neo4j.
4. Không trộn số liệu quality với latency k6/micro.

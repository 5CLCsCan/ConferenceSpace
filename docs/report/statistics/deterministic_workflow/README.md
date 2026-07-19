# Deterministic workflow benchmarks (Chương 4)

Package số liệu **chất lượng** thuật toán deterministic: gợi ý phản biện (ranking Jaccard), phân công greedy có ràng buộc, và COI hard filter.

Cấu trúc giống `ai_workflow_benchmarks` / `system_performance`:

```text
deterministic_workflow/
  ranking_case_counts.xlsx          # bảng case Hit@k đã soạn (đúng/sai)
  benchmark_output/
    quality-results.csv             # raw long-form từ backend quality suite
    quality-results.md
  exports/
    deterministic_workflow_results.xlsx
    figures/*.png
    FIGURE_INDEX.md
    SUMMARY.md
    summary_metrics.json
  scripts/
    export_benchmark_to_excel.py
  README.md
```

## Nguồn chuẩn

| File | Ý nghĩa |
| --- | --- |
| `backend/benchmarks/quality/results/quality-results.{csv,md}` | Run quality suite (ranking + assignment + COI) |
| `backend/benchmarks/quality/` | Code: Jaccard rankers, greedy assigner, metrics, LOO fixture |
| `ranking_case_counts.xlsx` | Case counts Hit@1/5/10 (đúng/sai) cho bảng báo cáo |

**Không** nhầm với:

| Gói | Đo gì |
| --- | --- |
| `system_performance/` | Tốc độ HTTP k6 + micro COI/matching + resource |
| `ai_workflow_benchmarks/` | LLM workflows (track, gating LLM, chatbot, TCA, …) |
| **gói này** | **Chất lượng** ranking / assignment / COI constraint |

## Tái sinh exports

```bash
python docs/report/statistics/deterministic_workflow/scripts/export_benchmark_to_excel.py
```

Yêu cầu: Python 3.10+, `pandas`, `openpyxl`, `matplotlib`, `numpy`.

Cập nhật raw từ backend (khi re-run quality suite):

```bash
# từ backend/
go test ./benchmarks/quality/ -run TestQuality -v
# rồi copy results → benchmark_output/
```

## Dùng trong Chương 4

| Nhu cầu | File |
| --- | --- |
| Bảng ranking / assignment / COI | `exports/deterministic_workflow_results.xlsx` |
| Biểu đồ chèn báo cáo | `exports/figures/fig01_…` → `fig10_…` |
| Caveats + gợi ý vị trí | `exports/FIGURE_INDEX.md` |
| Tóm tắt narrative | `exports/SUMMARY.md` |
| Case counts Hit@k | `ranking_case_counts.xlsx` hoặc sheet `Case_*` trong workbook |

## Headline (đã kiểm từ raw)

| Hạng mục | Giá trị |
| --- | --- |
| Fixture | 60 authors · 2565 papers · 60 LOO queries |
| Jaccard Hit@1 / Hit@5 / Hit@10 | 25% / 55% / 65% |
| Jaccard MRR / nDCG@10 | 0.392 / 0.442 |
| Greedy coverage | 65.9% |
| Greedy mean score | 0.0107 |
| COI violations (mọi method) | **0** |

## Caveats (bắt buộc)

1. Proxy ground truth = leave-one-out authorship, không phải gold assignment hội nghị.
2. Jaccard lexical exact-match — synonym là miss.
3. COI quality suite = self-authorship map; latency endpoint COI nằm ở `system_performance`.
4. Không trộn quality metrics với k6/micro latency.

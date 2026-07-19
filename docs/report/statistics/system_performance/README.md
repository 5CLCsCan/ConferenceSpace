# System performance benchmarks (Chương 4)

Package số liệu hiệu năng backend: k6 HTTP load, Go micro-benchmark, giám sát tài nguyên.

Cấu trúc giống `ai_workflow_benchmarks`:

```text
system_performance/
  benchmark_output/
    benchmark-results.xlsx   # FULL raw (~45k request rows + micro + resources)
  exports/
    system_performance_results.xlsx
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
| `backend/benchmarks/results/latest/benchmark-results.xlsx` | Run gốc 2026-05-31 |
| `benchmark_output/benchmark-results.xlsx` | Bản copy trong package (đối chiếu full) |

## Tái sinh exports

```bash
python docs/report/statistics/system_performance/scripts/export_benchmark_to_excel.py
```

Yêu cầu: Python 3.10+, `pandas`, `openpyxl`, `matplotlib`, `numpy`.

## Dùng trong Chương 4

| Nhu cầu | File |
| --- | --- |
| Bảng k6 / micro / resource | `exports/system_performance_results.xlsx` → sheet `K6_By_Scenario`, `Micro_Summary`, `Resources_Summary` |
| Biểu đồ chèn báo cáo | `exports/figures/fig01_…` → `fig11_…` |
| Caveats + gợi ý vị trí | `exports/FIGURE_INDEX.md` |
| Tóm tắt narrative | `exports/SUMMARY.md` |
| Audit từng request | `benchmark_output/benchmark-results.xlsx` sheets `http_crud` / `http_matching` / `http_coi` |

## Headline (đã kiểm từ raw)

| Kịch bản | Request | Throughput | Median | p95 | Lỗi |
| --- | ---: | ---: | ---: | ---: | ---: |
| CRUD | 11.107 | 369,1 req/s | 46,2 ms | 117,6 ms | 0% |
| Matching | 17.183 | 572,3 req/s | 9,7 ms | 71,8 ms | 0% |
| COI | 16.760 | 558,1 req/s | 9,5 ms | 79,3 ms | 0% |

- Host: 14 CPU / 48 GB RAM · seed 300 hội nghị / 15.000 bài / 9.000 reviewer-links  
- p95 max < 120 ms · 0% lỗi trên ~45.050 request  
- Bottleneck resource: PostgreSQL (CPU avg ~115% per-core)

# Statistics & Benchmark Exports

Bộ số liệu và biểu đồ sẵn sàng đưa vào báo cáo tốt nghiệp ConferenceSpace.

Cấu trúc mỗi gói giống `ai_workflow_benchmarks`:

```text
<package>/
  benchmark_output/     # nguồn số liệu thô / snapshot
  exports/
    *.xlsx              # workbook Excel
    figures/*.png       # biểu đồ báo cáo
    FIGURE_INDEX.md     # mục lục figure + caveats
  scripts/
    export_benchmark_to_excel.py
  *.md                  # báo cáo nguồn (nếu có)
```

## Các gói

| Gói | Nội dung | Excel | Figures |
| --- | --- | --- | --- |
| [`ai_workflow_benchmarks/`](ai_workflow_benchmarks/) | 6 luồng AI: Autofill, Track, Gating rule/LLM, Chatbot, TCA | `exports/workflow_benchmark_results.xlsx` | 14 PNG |
| [`deterministic_workflow/`](deterministic_workflow/) | Matching quality: ranking Jaccard + assignment greedy vs baselines | `exports/deterministic_benchmark_results.xlsx` | 6 PNG |
| [`system_performance/`](system_performance/) | k6 HTTP load + Go micro-benchmark + resource usage | `exports/system_performance_results.xlsx` | 7 PNG |

## Tái sinh exports

```bash
# AI workflows (đọc benchmark_output lớn — vài phút nếu parse jsonl lớn)
python docs/report/statistics/ai_workflow_benchmarks/scripts/export_benchmark_to_excel.py

# Matching quality (deterministic)
python docs/report/statistics/deterministic_workflow/scripts/export_benchmark_to_excel.py

# System performance (k6 + micro)
python docs/report/statistics/system_performance/scripts/export_benchmark_to_excel.py
```

Yêu cầu: Python 3.10+, `pandas`, `openpyxl`, `matplotlib`.

## Gợi ý dùng trong báo cáo

| Chương | Gói | Figure chính |
| --- | --- | --- |
| Ch4 — thiết lập / hiệu năng backend | `system_performance` | fig01 throughput, fig02 latency, fig06 resources |
| Ch4 — lớp thuật toán xác định | `deterministic_workflow` | fig01 ranking, fig02 vs random, fig03 assignment |
| Ch4/5 — lớp AI | `ai_workflow_benchmarks` | fig01 overview, fig08 autofill, fig09a–d TCA, fig10 headline |

## Nguồn số liệu

| Gói | Nguồn gốc |
| --- | --- |
| AI workflows | `docs/report/raw/workflow_benchmarks/benchmark_output` (đã copy vào package) |
| Deterministic | `backend/benchmarks/quality/results` + `docs/report/raw/matching-quality-benchmark.md` |
| System performance | Snapshot công bố trong `chapter_5-danh-gia-thuc-nghiem.md` / `chapter4.tex` (raw k6 JSON run không còn trong repo) |

## Caveats chung

1. **Không trộn đơn vị:** µs micro-benchmark ≠ ms k6 HTTP.
2. **AI track / LLM steering:** human labels còn trống — không claim top-1 accuracy / grounded rate từ Excel.
3. **Matching ranking:** leave-one-out authorship proxy, không phải gold reviewer.
4. **k6:** tải ngắn hạn 20 VU × 30s; không thay stress test dài hạn.
5. Mọi figure index có mục **Caveats** riêng — đọc trước khi trích vào luận văn.

# Figure index — system performance

Sinh tự động từ `scripts/export_benchmark_to_excel.py`.
Dùng PNG trong `exports/figures/` cho Chương 4 (hiệu năng backend).

| File | Nội dung | Gợi ý chỗ dùng |
| --- | --- | --- |
| `fig01_k6_throughput.png` | Throughput req/s theo kịch bản k6 | Chương 4 — tải HTTP |
| `fig02_k6_latency.png` | Median / p90 / p95 / avg latency | Chương 4 — độ trễ |
| `fig03_k6_volume_errors.png` | Số request + error rate 0% | Chương 4 — độ tin cậy |
| `fig04_microbench_scale.png` | COI vs matching theo scale (log) | Chương 4 — micro-benchmark |
| `fig05_microbench_allocs.png` | Allocations theo scale | Chương 4 — chi phí bộ nhớ thuật toán |
| `fig06_resource_usage.png` | CPU/RAM API / Postgres / Neo4j / Redis | Chương 4 — tài nguyên |
| `fig07_headline_metrics.png` | Headline metrics hiệu năng | Chương 4/5 — tóm tắt |

## Excel workbook

- `system_performance_results.xlsx`
  - `Overview` — headline
  - `K6_HTTP` — CRUD / Matching / COI
  - `K6_Environment` — seed + host config
  - `Microbench` — COI + matching theo scale
  - `Resources` — CPU/RAM theo component
  - `Headline` — chỉ số tóm tắt

## Caveats (bắt buộc khi trích vào báo cáo)

1. k6: 20 VU × 30s mỗi kịch bản — tải ngắn hạn, không thay stress test dài hạn.
2. p95 < 120 ms và 0% lỗi chỉ khẳng định trên cấu hình thử nghiệm (14 CPU / 48 GB RAM).
3. Micro-benchmark đo chi phí thuật toán thuần (không HTTP/DB); không so trực tiếp với độ trễ k6.
4. CPU% là per-core; PostgreSQL avg ~115% nghĩa là hơn 1 nhân, không phải 115% toàn máy.
5. Số liệu là snapshot đã công bố trong báo cáo; raw k6 JSON run directory không còn trong repo.

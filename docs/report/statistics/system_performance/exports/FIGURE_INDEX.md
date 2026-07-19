# Figure index — system performance (Chương 4)

Sinh tự động từ `scripts/export_benchmark_to_excel.py`.
Nguồn: `benchmark_output/benchmark-results.xlsx` (full k6 request log + micro + resources).
Dùng PNG trong `exports/figures/` cho **Chương 4 — đánh giá hiệu năng backend**.

| File | Nội dung | Gợi ý chỗ dùng |
| --- | --- | --- |
| `fig01_setup_request_volume.png` | Quy mô tải: số request + throughput theo kịch bản + seed | Ch4 — thiết lập đánh giá |
| `fig02_k6_throughput.png` | Thông lượng HTTP (req/s) | Ch4 — kết quả tải HTTP |
| `fig03_k6_latency_percentiles.png` | Median / p90 / p95 / avg latency + ngưỡng 120 ms | Ch4 — độ trễ |
| `fig04_k6_latency_distribution.png` | Phân bố độ trễ từng kịch bản (histogram) | Ch4 — phân bố latency |
| `fig05_k6_reliability.png` | Tỷ lệ thành công 100% / error rate 0% | Ch4 — độ tin cậy |
| `fig06_k6_path_mix.png` | Thành phần request theo họ endpoint (100% stacked) — kịch bản k6 đo API nào | Ch4 — diễn giải phạm vi đo (không phải latency) |
| `fig07_microbench_scale.png` | COI vs matching theo scale (log) | Ch4 — micro-benchmark |
| `fig08_microbench_allocs.png` | Allocations theo scale | Ch4 — chi phí bộ nhớ thuật toán |
| `fig09_resource_cpu.png` | CPU avg/peak theo phase và component | Ch4 — tài nguyên CPU |
| `fig10_resource_ram.png` | RAM avg/peak theo component | Ch4 — tài nguyên bộ nhớ |
| `fig11_headline_metrics.png` | Headline metrics cho slide/báo cáo | Ch4 — tóm tắt kết quả |

## Excel workbook

- `system_performance_results.xlsx` — workbook báo cáo (tóm tắt + breakdown)
  - `Overview` — headline + môi trường
  - `K6_By_Scenario` — bảng 3 kịch bản (số liệu bảng 4.x)
  - `K6_Route_Family` — thành phần request theo họ endpoint (100% mỗi kịch bản)
  - `K6_Path_Top` — top URL cụ thể (audit)
  - `HTTP_Summary` — 905 dòng path-level từ k6
  - `Micro_Summary` / `Micro_Runs` — Go micro-benchmark
  - `Resources_Summary` / `Resources_Samples` — CPU/RAM theo phase
  - `Run_Meta` — provenance lần chạy
- `benchmark_output/benchmark-results.xlsx` — **full raw** (~45k request rows)
  - `http_crud` / `http_matching` / `http_coi` — từng request

## Caveats (bắt buộc khi trích vào báo cáo)

1. k6: 20 VU × 30s mỗi kịch bản — tải ngắn hạn, **không** thay soak/stress test dài hạn.
2. p95 < 120 ms và 0% lỗi chỉ khẳng định trên cấu hình thử nghiệm (14 CPU / 48 GB RAM).
3. Micro-benchmark đo chi phí thuật toán **thuần** (không HTTP/DB) — không so trực tiếp với độ trễ k6.
4. CPU% là **per-core**; PostgreSQL avg ~115% = hơn 1 nhân, không phải 115% toàn máy.
5. fig06 / `K6_Route_Family`: **thành phần tải**, không phải độ trễ. Matching ≈ gợi ý reviewer; COI ≈ check COI; CRUD ≈ list/search.
6. Sheet micro **không** gồm `BenchmarkCOI_Graph` (Neo4j) — chi phí graph chỉ gián tiếp qua k6 COI + resource Neo4j.
7. Số request có thể lệch ±1–3 so với bảng đã làm tròn trong bản thảo LaTeX; raw Excel là nguồn chuẩn.

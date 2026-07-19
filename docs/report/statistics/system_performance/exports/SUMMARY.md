# Tóm tắt benchmark hiệu năng hệ thống (Chương 4)

**Run:** `2026-05-31-backend-benchmark`  
**Nguồn raw:** `backend/benchmarks/results/latest/benchmark-results.xlsx`  
**Host:** 14 CPU · 48 GB RAM  
**Seed:** 300 hội nghị · 15,000 bài nộp · 9,000 quan hệ reviewer  
**Tải:** 20 VU × 30s / kịch bản

## 1. Kết quả tải HTTP (k6)

| Kịch bản | Request | Throughput | Median | p90 | p95 | Max | Avg | Lỗi |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| CRUD | 11,107 | 369.1 req/s | 46.21 ms | 100.47 ms | 117.61 ms | 403.59 ms | 51.78 ms | 0.0% |
| Đối sánh phản biện | 17,183 | 572.3 req/s | 9.74 ms | 50.78 ms | 71.8 ms | 254.71 ms | 19.02 ms | 0.0% |
| Xung đột lợi ích (COI) | 16,760 | 558.1 req/s | 9.54 ms | 56.5 ms | 79.34 ms | 293.94 ms | 20.4 ms | 0.0% |

**Nhận xét ngắn:**

- Tổng ~45,050 request, **0% lỗi**, p95 cao nhất **117.61 ms** (CRUD) — dưới ngưỡng 120 ms.
- Matching/COI median ~9,5–9,7 ms, thấp hơn rõ so với CRUD (~46 ms) → điểm nghẽn chính nằm ở truy vấn quan hệ PostgreSQL, không phải endpoint thuật toán đã đo.
- Throughput cao nhất ở Matching (~572 req/s), tiếp theo COI (~558), CRUD (~369).

## 2. Go micro-benchmark

| Thuật toán | Nhỏ | Trung bình | Lớn |
| --- | ---: | ---: | ---: |
| Phát hiện COI | 14.93 µs | 146.98 µs | 653.32 µs |
| Đối sánh phản biện | 0.1313 ms | 6.1141 ms | 56.0667 ms |

**Nhận xét ngắn:**

- Cả hai thuật toán ở mức micro-giây đến mili-giây, phù hợp tương tác gần thời gian thực.
- Matching scale nhanh hơn theo kích thước (ma trận điểm submission×reviewer); COI scale chậm hơn (so khớp tập hợp).

## 3. Tài nguyên (overall)

| Thành phần | CPU avg % | CPU peak % | RAM avg MB | RAM peak MB |
| --- | ---: | ---: | ---: | ---: |
| API | 28.2 | 42.6 | 30.5 | 31.2 |
| PostgreSQL | 115.0 | 163.2 | 203.8 | 222.2 |
| Neo4j | 0.9 | 7.0 | 507.9 | 509.1 |
| Redis | 0.5 | 1.9 | 9.1 | 9.1 |

**Nhận xét ngắn:**

- PostgreSQL là điểm tiêu thụ CPU lớn nhất (~115% avg per-core, peak ~163%).
- API container nhẹ (~28% CPU avg, ~30 MB RAM) — phù hợp thiết kế backend Go tách AI.
- Neo4j giữ ~508 MB RAM nền nhưng CPU thấp trong các phase đo.

## 4. File dùng trong báo cáo

| Nhu cầu | File |
| --- | --- |
| Bảng số liệu k6 / micro / resource | `exports/system_performance_results.xlsx` |
| Biểu đồ chèn LaTeX/Word | `exports/figures/fig01_…` → `fig11_…` |
| Mục lục figure + caveats | `exports/FIGURE_INDEX.md` |
| Đối chiếu từng request | `benchmark_output/benchmark-results.xlsx` |

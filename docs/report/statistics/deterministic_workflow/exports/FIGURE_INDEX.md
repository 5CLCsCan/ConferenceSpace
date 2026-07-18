# Figure index — deterministic matching quality

Sinh tự động từ `scripts/export_benchmark_to_excel.py`.
Dùng PNG trong `exports/figures/` cho Chương 4/5 (lớp thuật toán xác định).

| File | Nội dung | Gợi ý chỗ dùng |
| --- | --- | --- |
| `fig01_ranking_metrics.png` | Hit@k / MRR / nDCG theo method (jaccard, overlap, random) | Chương 4 — ranking quality |
| `fig02_ranking_vs_random.png` | Jaccard vs random + hệ số cải thiện | Chương 4 — giá trị thuật toán |
| `fig03_assignment_metrics.png` | Coverage / mean score / COI / fallback | Chương 4 — assignment optimization |
| `fig04_load_balance.png` | Load StdDev và Gini theo method | Chương 4 — cân bằng tải |
| `fig05_synthetic_vs_real.png` | Synthetic vs real S2 + % thay đổi | Chương 4 — độ ổn định benchmark |
| `fig06_headline_metrics.png` | Headline metrics matching quality | Chương 4/5 — tóm tắt |

## Excel workbook

- `deterministic_benchmark_results.xlsx`
  - `Overview` — headline + fixture
  - `Ranking` — Hit@k / MRR / nDCG theo method
  - `Assignment` — coverage / load / COI / score
  - `Quality_Long` — CSV gốc (long format)
  - `Fixture` — thống kê dataset S2
  - `Synthetic_vs_Real` — so sánh synthetic vs real
  - `Headline` — chỉ số tóm tắt cho slide

## Caveats (bắt buộc khi trích vào báo cáo)

1. Ground truth ranking = leave-one-out authorship proxy — không phải gold reviewer assignment.
2. Absolute mean Jaccard score thấp (0.011) do lexical ceiling; so sánh **tương đối** với baseline mới có ý nghĩa.
3. Greedy coverage 65.9% là thiết kế quality-first; phần còn lại do chair gán thủ công.
4. COI violations = 0 trên mọi method trong benchmark này (self-author constraint).
5. Dataset 60 authors đủ so sánh thuật toán, chưa thay cho đánh giá hội nghị quy mô lớn.

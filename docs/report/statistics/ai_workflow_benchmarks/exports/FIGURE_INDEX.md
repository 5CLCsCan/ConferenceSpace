# Danh mục hình — kết quả đánh giá các luồng xử lý

Sinh tự động từ `scripts/export_benchmark_to_excel.py`.
Dùng các tệp PNG trong `exports/figures/` cho Chương 4 và Chương 5.

| File | Nội dung | Gợi ý chỗ dùng |
| --- | --- | --- |
| `fig01_overview_case_counts.png` | Quy mô các bộ dữ liệu đánh giá: bộ thực thi 1.127, bộ TCA 1.097 và các bộ chuyên biệt | Chương 4 — thiết lập đánh giá |
| `fig01b_runner_by_conference.png` | Phân bố 1.127 bài đầu vào theo hội nghị / track | Chương 4 — thiết lập dữ liệu |
| `fig02_gating_rule_metrics.png` | Verdict Accuracy, Rule-ID Recall, False Block Count và Verdict Distribution | Submission Gating — Rule Check |
| `fig03_gating_llm_verdicts.png` | Verdict Distribution và Output Contract Violation | Submission Gating — LLM Steering |
| `fig04_track_by_conference.png` | Phân bố trường hợp Track Recommendation theo hội nghị / track | Submission Autofill — Track Recommendation |
| `fig05_chatbot_latency_by_scenario.png` | TTFT, Time to First Answer Token và Total Duration theo kịch bản | Chatbot Agent — độ trễ |
| `fig06_chatbot_tool_success.png` | Tool-call Success Rate theo kịch bản | Chatbot Agent — tool reliability |
| `fig07_chatbot_manual_outcomes.png` | Phân bố kết quả rà soát thủ công trong 40 lượt | Chatbot Agent — chất lượng |
| `fig08_autofill_quality.png` | Exact Match, ROUGE-L và F1 của các trường metadata | Submission Autofill — trích xuất metadata |
| `fig09a_reviewer_annotation_grounding.png` | Mức bám nguồn của chú thích | Reviewer Initial Analysis |
| `fig09b_reviewer_attention_points.png` | Điểm cần chú ý khi đọc bài | Reviewer Initial Analysis |
| `fig09c_review_quality_auditor.png` | Cảnh báo trên bản phản biện | Review Quality Auditor |
| `fig09d_chair_evidence_basis.png` | Cơ sở bằng chứng | Chair Decision Copilot |
| `fig10_headline_metrics.png` | Các chỉ số chính dùng cho báo cáo | Chương 5 — tóm tắt kết quả |
| `fig11_resource_latency.png` | Độ trễ trung bình, trung vị và cao nhất theo luồng (Bảng 4.7), kèm ngưỡng 100 giây | Chương 4 — tính khả thi vận hành |
| `fig12_resource_tokens.png` | Token trung bình trên mỗi đơn vị công việc (mẫu số khác nhau — không xếp hạng chi phí) | Chương 4 — tính khả thi vận hành |
| `fig13_resource_ops_mode.png` | Khuyến nghị cách vận hành (đồng bộ / không chặn / phản hồi từng phần / xử lý nền) | Chương 4 — tính khả thi vận hành |
| `fig14_chatbot_response_stages.png` | Chatbot Agent: TTFT, Time to First Answer Token, Stream Duration, Total Duration và Tool-call Success Rate | Chương 4 — Chatbot Agent / vận hành |

## Tệp Excel tổng hợp

- `workflow_benchmark_results.xlsx`
  - `Overview` — các chỉ số chính theo luồng xử lý
  - `Track_Recommendation` — 48 trường hợp Track Recommendation
  - `Gating_Rule_Check` — 8 trường hợp kiểm tra quy tắc cố định
  - `Gating_LLM_Steering` — các phát hiện kiểm tra nội dung
  - `Chatbot_Trials` — số liệu truyền tải của 40 lượt hội thoại
  - `Chatbot_By_Scenario` — tổng hợp theo kịch bản và kết quả rà soát
  - `Autofill_Summary` + `Autofill_Cases` — số liệu đối sánh tệp CSV
  - `TCA_Summary` + `TCA_Papers` — tỷ lệ đánh giá TCA theo bài
  - `Resource_Usage` — Bảng 4.7: độ trễ trung bình/trung vị/cao nhất, token và cách vận hành
  - `Chatbot_Response_Stages` — thời gian phản hồi và các lượt gọi công cụ thất bại

## Lưu ý khi trích dẫn vào báo cáo

1. Track Recommendation: `human_label` trống → **không** suy ra Top-1 Accuracy từ tệp này.
2. Submission Gating — LLM Steering: `grounded/actionable` trống → chỉ kết luận về Output Contract Violation.
3. Chatbot Agent: số liệu thời gian lấy từ `run_summary.json`; kết quả đạt/đạt một phần/không đạt lấy từ báo cáo rà soát thủ công.
4. Hình 09a–09d: mỗi luồng có một hình; nhãn gồm tỷ lệ và số lượng; cỡ mẫu đặt dưới trục; chú giải đặt bên phải.
5. Hình 09a dùng số lượng tuyệt đối. Các hình còn lại ghi số lượng ước tính trong ngoặc theo tỷ lệ trên tổng đơn vị.
6. Hình 11–14: số liệu khớp Bảng 4.7 và các báo cáo luồng; **không** xếp hạng chi phí bằng token vì mẫu số khác nhau (bài / lượt kiểm tra / hội thoại). Độ trễ cao nhất của Chatbot Agent là giá trị của nhóm kịch bản chậm nhất.
7. Hình 13: cách vận hành là **khuyến nghị thiết kế** dựa trên độ trễ, không phải kết quả so sánh triển khai.

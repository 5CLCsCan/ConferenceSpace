# Figure index — workflow benchmark visualizations

Sinh tự động từ `scripts/export_benchmark_to_excel.py`.
Dùng PNG trong `exports/figures/` cho Chương 5 (đánh giá).

| File | Nội dung | Gợi ý chỗ dùng |
| --- | --- | --- |
| `fig01_overview_case_counts.png` | Quy mô bộ đánh giá: bộ thực thi 1.127 vs TCA 1.097 vs bộ đánh giá chuyên biệt | Chương 4 — thiết lập đánh giá |
| `fig01b_runner_by_conference.png` | Phân bố 1.127 bài đầu vào theo hội nghị / chuyên đề | Chương 4 — thiết lập dữ liệu |
| `fig02_gating_rule_metrics.png` | Accuracy/recall rule check + phân bố verdict | Submission Gating (deterministic) |
| `fig03_gating_llm_verdicts.png` | LLM steering verdict + contract violation | Submission Gating (LLM content) |
| `fig04_track_by_conference.png` | Track recommendation theo hội nghị | Track recommendation setup |
| `fig05_chatbot_latency_by_scenario.png` | TTFT / first-answer / total duration theo kịch bản | Chatbot Agent — latency |
| `fig06_chatbot_tool_success.png` | Tool-call success rate theo kịch bản | Chatbot Agent — tool reliability |
| `fig07_chatbot_manual_outcomes.png` | Manual pass / partial / fail (40 trials) | Chatbot Agent — quality |
| `fig08_autofill_quality.png` | Title/abstract/keyword/author quality | Submission Autofill |
| `fig09a_reviewer_annotation_grounding.png` | Độ bám nguồn chú thích (phân tích ban đầu) | Phân tích ban đầu cho phản biện |
| `fig09b_reviewer_attention_points.png` | Điểm cần chú ý khi đọc bài | Phân tích ban đầu cho phản biện |
| `fig09c_review_quality_auditor.png` | Cảnh báo kiểm tra chất lượng phản biện | Kiểm tra chất lượng phản biện |
| `fig09d_chair_evidence_basis.png` | Cơ sở bằng chứng hỗ trợ chủ tịch | Hỗ trợ quyết định chủ tịch |
| `fig10_headline_metrics.png` | Headline metrics cho slide/báo cáo | Chương 5 — tóm tắt kết quả |

## Excel workbook

- `workflow_benchmark_results.xlsx`
  - `Overview` — chỉ số headline theo workflow
  - `Track_Recommendation` — 48 case predictions
  - `Gating_Rule_Check` — 8 deterministic cases
  - `Gating_LLM_Steering` — LLM content findings
  - `Chatbot_Trials` — 40 trial transport metrics
  - `Chatbot_By_Scenario` — gộp theo kịch bản + manual outcome
  - `Autofill_Summary` + `Autofill_Cases` — completed CSV metrics
  - `TCA_Summary` + `TCA_Papers` — TCA rates per paper

## Caveats (bắt buộc khi trích vào báo cáo)

1. Track recommendation: `human_label` trống → **không** claim top-1 accuracy từ file này.
2. LLM steering: `grounded/actionable` trống → chỉ claim operational contract (0 block violation).
3. Chatbot: transport metrics từ `run_summary.json`; manual pass/partial/fail từ report review.
4. TCA/fig09a–d: mỗi workflow một figure; nhãn = % + (số lượng); cỡ mẫu dưới trục; chú giải bên phải.
5. Annotation (fig09a): số lượng là đếm tuyệt đối. Các figure còn lại: số trong ngoặc ≈ tỷ lệ × tổng đơn vị.
6. fig01: **1.127 không phải chỉ Autofill** — là bộ thực thi chung (hiệu năng, token, đầu ra nhiều luồng). 1.097 là bộ đánh giá TCA (chính xác, trung thực, tin cậy, tiềm năng). Các cột còn lại là bộ đánh giá chuyên biệt.

# Mô tả chi tiết benchmark các workflow AI

Tài liệu này mô tả thiết kế benchmark cho hai nhóm chức năng AI cần đánh giá trong hệ thống ConferenceSpace:

1. Gợi ý track bên trong workflow Submission Autofill.
2. Submission Gating đầy đủ, gồm deterministic rule check và LLM steering check.

Mục tiêu của benchmark không chỉ là chứng minh script có thể chạy, mà là tạo ra một quy trình đánh giá có thể lặp lại, có đầu vào rõ ràng, có artifact để review thủ công, và có giới hạn diễn giải đủ chặt chẽ để đưa vào báo cáo. Benchmark được thiết kế theo hướng tối giản nhưng kiểm soát chặt: chạy local, không dùng dispatcher, không phụ thuộc Modal, và lưu toàn bộ kết quả thành file để có thể audit lại từng case.

## 1. Phạm vi và nguyên tắc đánh giá

### 1.1. Phạm vi hệ thống được benchmark

Benchmark tập trung vào các workflow AI sau:

| Nhóm benchmark | Workflow hệ thống | Thành phần được đánh giá | Ghi chú phạm vi |
| --- | --- | --- | --- |
| Track recommendation | Submission Autofill | `track_rankings` trong output autofill | Không đánh giá workflow track recommendation độc lập. Đầu vào là hội nghị đang hoạt động và paper cần nộp. |
| Submission Gating - rules | Submission Gating | Các rule deterministic và verdict blocking do rule tạo ra | Đánh giá bằng fixture có ground truth rõ ràng. |
| Submission Gating - LLM steering | Submission Gating | Khả năng phát hiện vấn đề nội dung theo yêu cầu của chair | Đánh giá bằng submission thật; LLM chỉ được đưa ra cảnh báo/nhận xét, không được tạo blocking verdict. |

Phần track recommendation được đặt trong Submission Autofill vì đây là hành vi thực tế của platform: khi author upload paper và chọn hội nghị đang hoạt động, workflow autofill trích xuất metadata và đồng thời đề xuất track phù hợp dựa trên thông tin paper và context của hội nghị. Do đó benchmark này không có ý nghĩa nếu tách track recommendation thành một workflow độc lập với context khác.

### 1.2. Nguyên tắc thiết kế benchmark

Benchmark được thiết kế theo bốn nguyên tắc:

- **Dùng runtime thật của hệ thống**: script benchmark gọi runner workflow thật trong `ai-service`, không viết lại logic gốc để tránh đánh giá một bản mô phỏng khác với sản phẩm.
- **Tách các loại evidence**: deterministic rules được đánh giá bằng exact match với expected rule id và verdict; LLM steering được đánh giá bằng artifact review thủ công và rubric chất lượng; track recommendation được đánh giá bằng plausibility review do chưa có ground truth track chính thức cho từng paper.
- **Lưu kết quả để audit**: mỗi run tạo raw response, normalized output, CSV review, summary metrics, audit report, và report-ready summary.
- **Không trao quyền reject cho LLM**: LLM steering chỉ phát hiện và giải thích rủi ro nội dung. Blocking decision chỉ đến từ rule deterministic có thể tái lập, giải thích, và kiểm tra bằng fixture.

## 2. Môi trường benchmark

### 2.1. Vị trí project benchmark

Benchmark được đặt trong project riêng:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks
```

Lý do tách project:

- Runner benchmark cũ trong `Benchmarks/workflow_runner` được thiết kế cho Modal, không phù hợp với benchmark local.
- Benchmark mới cần isolation để không làm biến đổi code workflow sản phẩm.
- Tất cả artifact đầu ra được ghi local, phù hợp với quy mô 50-100 test cases.
- Không cần dispatcher vì task list đã biết trước và có thể fetch từ dataset local.

### 2.2. Code sản phẩm được benchmark

Benchmark tham chiếu workflow trong repo ConferenceSpace:

```text
E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service
```

Hai runner chính:

```text
ai-service/app/workflows/submission_autofill/runner.py
ai-service/app/workflows/submission_gating/runner.py
```

Với Submission Gating, benchmark cần bảo đảm runner sử dụng đúng thứ tự stage, đặc biệt `document_extraction` phải chạy trước `format_compliance` vì format compliance cần `state.extracted_document` để kiểm tra font size, margin, paper size, column count và các thông tin layout khác.

Với PDF extraction, benchmark sử dụng extractor thật của workflow, không thay bằng parser đơn giản. Điều này quan trọng vì paper IEEE hoặc paper hai cột thường làm sai các extractor phổ thông; nếu dùng extractor khác, kết quả benchmark sẽ không đại diện cho hành vi sản phẩm.

### 2.3. Cấu hình LLM và biến môi trường

Benchmark dùng cấu hình OpenAI/OpenRouter sẵn có trong:

```text
E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\.env
```

Run cuối cùng ghi nhận cấu hình runtime như sau:

| Trường | Giá trị |
| --- | --- |
| `openai_configured` | `true` |
| `openai_base_url` | `http://13.250.136.185:20128/v1` |
| `openai_model` | `cx/gpt-5.4-mini` |
| `openrouter_configured` | `true` |
| `agent_model` | `openrouter/google/gemini-3.1-flash-lite-preview:nitro` |
| `llm_request_timeout_seconds` | `60` |
| `dispatcher` | `false` |
| `local_first` | `true` |
| `max_concurrency` | `10` |

Nếu cần fetch lại file từ OpenReview hoặc tránh rate limiting, benchmark có thể dùng proxy list:

```text
E:\Download\proxyscrape_premium_http_proxies (4).txt
```

Trong run đã review, benchmark ưu tiên local cached PDFs và chỉ dùng network khi cần. Thiết kế này làm giảm độ nhiễu từ OpenReview và giúp kết quả ổn định hơn.

### 2.4. Lệnh chạy benchmark

Chạy tất cả workflow:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow all `
  --track-cases 50 `
  --gating-cases 24 `
  --max-concurrency 10 `
  --task-timeout-seconds 180 `
  --proxy-file "E:\Download\proxyscrape_premium_http_proxies (4).txt"
```

Chạy riêng track recommendation:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow track_recommendation `
  --track-cases 50 `
  --max-concurrency 10 `
  --task-timeout-seconds 180 `
  --proxy-file "E:\Download\proxyscrape_premium_http_proxies (4).txt"
```

Chạy riêng Submission Gating rules:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow submission_gating_rule_check `
  --max-concurrency 10 `
  --task-timeout-seconds 180
```

Chạy riêng Submission Gating LLM steering:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
python ai_workflow_benchmarks/run_benchmarks.py `
  --workflow submission_gating_llm_steering `
  --gating-cases 24 `
  --max-concurrency 10 `
  --task-timeout-seconds 180 `
  --proxy-file "E:\Download\proxyscrape_premium_http_proxies (4).txt"
```

Tạo artifact review tổng hợp:

```powershell
cd E:\HCMUS\Graduate-Project\Benchmarks
$env:PYTHONPATH=(Resolve-Path ai_workflow_benchmarks/src).Path
python -m local_ai_benchmark.review_outputs `
  --track-run "E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\track_recommendation\run_20260706T194602Z" `
  --llm-run "E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_llm_steering\run_20260706T190216Z" `
  --output-dir "E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\final_ai_workflow_review\run_20260706T194602Z_track__20260706T190216Z_llm"
```

## 3. Dataset đầu vào

### 3.1. Dataset cho track recommendation

Track recommendation dùng submission thật đã có trong benchmark dataset:

```text
E:\HCMUS\Graduate-Project\Benchmarks\dataset
```

Các nguồn đầu vào chính:

| Artifact | Vai trò |
| --- | --- |
| `conference_dataset.json` | Chứa context của hội nghị: tên, acronym, năm, mô tả, CFP text, track/topic nếu có. |
| `submission_data.jsonl` | Danh sách submission/paper được lấy từ các hội nghị trong dataset. |
| PDF cached theo paper | File gốc để Submission Autofill đọc và trích xuất metadata. |
| Extracted metadata cached | Dùng để tham khảo và giảm fetch lại khi có sẵn. |

Mỗi test case cho track recommendation cần có tối thiểu:

- `case_id`: mã benchmark case.
- `conference_id`: hội nghị đang hoạt động.
- `paper_id`: paper cần nộp.
- `paper_pdf`: file PDF gốc.
- `conference_context`: thông tin hội nghị đang hoạt động.
- `available_tracks`: danh sách track hợp lệ mà workflow được phép đề xuất.

Danh sách `available_tracks` được trích xuất từ CFP hoặc từ domain/topic list của hội nghị. Benchmark có bước lọc các item không phải track, vì CFP thường chứa lịch sự kiện, deadline, địa điểm, ngày tháng, hoặc nội dung hướng dẫn. Nếu không lọc, workflow có thể gợi ý các chuỗi như "2-4 August: Main conference", làm sai metric invalid track rate và không phản ánh đúng bài toán.

### 3.2. Dataset cho Submission Gating rule check

Rule check không dùng submission thật làm ground truth chính, vì mục tiêu là kiểm tra deterministic rule có hoạt động đúng hay không. Benchmark tạo seed fixture cục bộ, mỗi fixture được thiết kế để kích hoạt một hoặc một nhóm rule cụ thể.

Tập case seed gồm 8 case:

| Case | Mục tiêu |
| --- | --- |
| `valid_baseline` | Paper hợp lệ, không bị block. |
| `min_references_block` | Thiếu số lượng references tối thiểu, kỳ vọng block theo rule reference. |
| `required_sections_block` | Thiếu section bắt buộc, kỳ vọng block theo rule section. |
| `banned_phrases_block` | Chứa phrase bị cấm, kỳ vọng block theo rule policy. |
| `unsupported_format_block` | File không phải PDF hợp lệ, kỳ vọng block ở binary/document integrity. |
| `unreadable_pdf_block` | PDF hỏng/không đọc được, kỳ vọng block ở extraction integrity. |
| `required_sections_pass` | Có đủ required sections, xác nhận rule không false positive. |
| `maximum_pages_warn` | Vượt ngưỡng page warning nếu policy chỉ yêu cầu cảnh báo, không tạo sai blocking verdict. |

LLM steering bị tắt trong benchmark rules bằng cách để `prompt_fragments=[]`. Nếu không tắt, benchmark deterministic sẽ bị nhiễu bởi output của LLM và không thể quy lỗi sai về rule nào.

### 3.3. Dataset cho Submission Gating LLM steering

LLM steering dùng 24 submission thật từ dataset, mỗi submission có PDF gốc và metadata hội nghị. Khác với rule check, benchmark này không tạo paper giả lập, vì mục tiêu là xem LLM có phát hiện các vấn đề nội dung thực tế theo yêu cầu của chair hay không.

Mỗi case có thêm một steering prompt riêng, đóng vai trò như input của chair trước khi mở cổng nộp bài. Steering prompt mô tả kỳ vọng nội dung của hội nghị, nhưng viết theo ngôn ngữ business/reviewer, không đưa ra chỉ dẫn kỹ thuật cho model.

Bốn nhóm steering được bao phủ:

| Nhóm steering | Số case | Điều cần đánh giá |
| --- | ---: | --- |
| `readiness_and_limitations` | 6 | Paper có nêu rõ limitation, assumption, threat to validity, hoặc điều kiện áp dụng không. |
| `evidence_quality` | 6 | Paper có bằng chứng thực nghiệm, baseline, metric, hoặc lập luận đủ mạnh không. |
| `conference_fit` | 6 | Paper có phù hợp với scope và mục tiêu của hội nghị/track không. |
| `general_submission_readiness` | 6 | Paper có sẵn sàng để nộp về mặt nội dung, rõ ràng, đầy đủ, không thiếu thông tin quan trọng không. |

Trong LLM steering benchmark, deterministic rules được neutralize tới mức tối thiểu, ngoại trừ binary integrity và document extraction integrity. Điều này cần thiết vì benchmark giả định submission đã qua các rule format cơ bản; phần còn lại là đánh giá nội dung mà rule không thể bắt bằng thuật toán.

## 4. Benchmark track recommendation trong Submission Autofill

### 4.1. Cấu trúc input

Mỗi case gọi Submission Autofill với các thành phần:

```text
{
  "conference": {
    "id": "...",
    "name": "...",
    "acronym": "...",
    "description": "...",
    "cfp_text": "...",
    "available_tracks": ["...", "..."]
  },
  "submission": {
    "paper_id": "...",
    "pdf_file": "...",
    "known_title": "...",
    "known_abstract": "...",
    "known_keywords": ["...", "..."]
  }
}
```

Trong sản phẩm, Submission Autofill không chỉ nhận text metadata có sẵn. Workflow phải đọc PDF, trích xuất title, authors, abstract, keywords và các metadata liên quan; sau đó dùng nội dung đó cùng với context hội nghị để xếp hạng track. Vì vậy benchmark không nên chỉ đưa abstract vào model, vì làm vậy sẽ bỏ qua lỗi extraction và bỏ qua hành vi tích hợp của workflow.

### 4.2. Output cần thu thập

Mỗi response cần được lưu ở hai lớp:

- Raw response: giữ nguyên output của workflow để audit lỗi parser, lỗi schema, lỗi runtime.
- Normalized prediction: chuẩn hóa thành các cột review ổn định.

Với track recommendation, normalized output cần có:

| Trường | Ý nghĩa |
| --- | --- |
| `case_id` | Mã case benchmark. |
| `conference_id` | Hội nghị active. |
| `paper_id` | Paper cần đánh giá. |
| `paper_title` | Tiêu đề paper sau extraction hoặc metadata cache. |
| `available_tracks` | Danh sách track hợp lệ. |
| `rank_1_track` | Track top 1 workflow đề xuất. |
| `rank_1_confidence` | Confidence nếu workflow trả về. |
| `rank_1_rationale` | Lý do của top 1. |
| `top_3_tracks` | Ba track đầu tiên sau khi chuẩn hóa. |
| `invalid_tracks` | Track không nằm trong `available_tracks`. |
| `duplicate_tracks` | Track bị lặp trong ranking. |
| `review_decision` | Kết quả review thủ công: strong/plausible/weak/reject. |
| `review_note` | Lý do reviewer chấp nhận hoặc nghi ngờ. |

### 4.3. Metric

Vì dataset hiện tại không có ground truth track chính thức cho từng paper, benchmark không được gọi metric này là accuracy theo nghĩa supervised. Các metric hợp lệ là:

| Metric | Công thức/diễn giải | Lý do sử dụng |
| --- | --- | --- |
| Completion rate | `completed_count / case_count` | Độ ổn định runtime. |
| Invalid track rate | Số track ngoài danh sách hợp lệ / tổng số track được đề xuất | Kiểm tra workflow có tôn trọng option của hội nghị không. |
| Duplicate track rate | Số ranking có track lặp / tổng case | Kiểm tra chất lượng ranking. |
| Strong Top-1 plausible rate | Số case top 1 được reviewer đánh giá strong / tổng case | Ước lượng mức độ phù hợp cao. |
| Top-1 plausible rate | Số case top 1 được reviewer chấp nhận / tổng case | Ước lượng mức độ có thể dùng được. |
| Top-3 acceptable rate | Số case có ít nhất một track chấp nhận được trong top 3 / tổng case | Phù hợp với UX nếu user có thể chọn lại track. |

Nếu sau này có ground truth track từ conference management system, có thể bổ sung Top-1 accuracy, Top-3 accuracy, MRR và NDCG@K. Trong benchmark hiện tại, dùng các metric đó sẽ tạo cảm giác chính xác giả vì không có label tin cậy.

### 4.4. Kết quả run đã review

Run cuối cùng:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\track_recommendation\run_20260706T194602Z
```

Kết quả tổng hợp:

| Chỉ số | Giá trị |
| --- | ---: |
| Số case | 48 |
| Completed | 48 |
| Failed | 0 |
| Invalid track rate | 0.0 |
| Strong Top-1 plausible | 45/48 = 93.8% |
| Top-1 plausible | 47/48 = 97.9% |
| Top-3 acceptable | 48/48 = 100.0% |

Case cần chú ý:

| Case | Vấn đề |
| --- | --- |
| `trackrec_0004` | Top-1 yếu/low confidence, cần review khi đưa vào báo cáo. |
| `trackrec_0015` | Không được xếp strong, nhưng vẫn có thể chấp nhận tùy ngữ cảnh. |
| `trackrec_0044` | Không được xếp strong, cần ghi là case biên. |

Diễn giải báo cáo nên thận trọng: workflow cho kết quả đề xuất track ổn định và không tạo invalid track trong 48 case, nhưng con số 97.9% là reviewer plausibility, không phải accuracy có ground truth.

## 5. Benchmark Submission Gating - deterministic rules

### 5.1. Mục tiêu

Rule benchmark kiểm tra các điều kiện có thể xác định bằng thuật toán:

- File có phải PDF hợp lệ không.
- PDF có đọc được không.
- Paper có đủ section bắt buộc không.
- Paper có đạt số references tối thiểu không.
- Paper có chứa phrase bị cấm không.
- Paper có vi phạm ngưỡng format/page policy không.

Đây là nhóm rule có thể tạo blocking verdict vì:

- Đầu vào và đầu ra có thể tái lập.
- Rule có thể giải thích bằng điều kiện cụ thể.
- Author có thể sửa trực tiếp.
- Kết quả không phụ thuộc vào đánh giá mơ hồ của LLM.

### 5.2. Cấu trúc input

Mỗi fixture gồm:

```text
{
  "case_id": "...",
  "file_mode": "generated_pdf | unsupported_text | invalid_pdf",
  "paper_content": "...",
  "policy": {
    "required_sections": ["Abstract", "Introduction", "Conclusion"],
    "min_references": 8,
    "banned_phrases": ["..."],
    "max_pages": 8
  },
  "expected": {
    "verdict": "pass | warning | desk_reject",
    "blocking_rule_ids": ["..."]
  }
}
```

Fixture PDF được sinh local để kiểm soát nội dung. Các case file hỏng hoặc unsupported format không cần paper thật, vì mục tiêu là validate boundary behavior của upload/document extraction.

### 5.3. Output cần thu thập

Normalized rule output cần có:

| Trường | Ý nghĩa |
| --- | --- |
| `case_id` | Mã fixture. |
| `expected_verdict` | Verdict mong đợi. |
| `actual_verdict` | Verdict workflow trả về. |
| `expected_rule_ids` | Rule id kỳ vọng bị kích hoạt. |
| `actual_rule_ids` | Rule id workflow kích hoạt. |
| `missing_rule_ids` | Rule kỳ vọng nhưng không xuất hiện. |
| `unexpected_rule_ids` | Rule xuất hiện ngoài kỳ vọng. |
| `false_block` | Có block khi expected không block. |
| `false_pass` | Pass khi expected block. |
| `review_note` | Ghi chú để đọc lại lỗi nếu có. |

### 5.4. Metric

| Metric | Diễn giải |
| --- | --- |
| Blocking verdict accuracy | Tỷ lệ case có verdict đúng với expected. |
| Rule id recall | Tỷ lệ expected blocking/warning rule được kích hoạt. |
| False block count | Số case bị block sai. |
| False pass count | Số case đáng lẽ block nhưng pass. |
| Runtime failure count | Số case lỗi runner, parser, extractor hoặc schema. |

Với deterministic rules, metric phải đạt gần 100% trước khi dùng để benchmark tiếp. Nếu rule check sai, các benchmark LLM steering và track recommendation vẫn có thể chạy, nhưng báo cáo về gating sẽ không đáng tin vì pipeline có lỗi nền tảng.

### 5.5. Kết quả run đã review

Run cuối cùng:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_rule_check\run_20260706T185930Z
```

Kết quả:

| Chỉ số | Giá trị |
| --- | ---: |
| Số case | 8 |
| Completed | 8 |
| Failed | 0 |
| Correct verdict | 8 |
| Correct rules | 8 |
| False block | 0 |
| Blocking verdict accuracy | 1.0 |
| Rule id recall | 1.0 |

Kết quả này cho thấy runner và các rule deterministic đã đủ ổn định để dùng làm lớp gating có quyền block. Tuy nhiên, vì fixture hiện tại chỉ bao phủ các rule chính, không nên diễn giải thành bảo đảm toàn bộ format compliance của mọi template paper. Nếu cần claim rộng hơn, cần thêm fixture về font size, margin, paper size và column count.

## 6. Benchmark Submission Gating - LLM steering

### 6.1. Mục tiêu

LLM steering benchmark đánh giá khả năng workflow đưa ra feedback nội dung theo yêu cầu của chair. Đây là nhóm vấn đề mà deterministic rules không thể bắt tốt, vì chúng cần đọc ý nghĩa của paper:

- Paper có lệch scope hội nghị không.
- Evidence có đủ để support claim không.
- Limitation có đủ rõ không.
- Nội dung có sẵn sàng để author nộp chính thức không.
- Paper có thiếu thông tin quan trọng mà rule format không phát hiện được không.

LLM steering không được tạo blocking verdict. Nếu LLM thấy có vấn đề, output đúng phải là advisory finding: nói rõ vấn đề, vì sao quan trọng, và author nên xem lại điểm nào. Quyền reject hoặc block chỉ nằm ở deterministic rule hoặc quyết định con người.

### 6.2. Cấu trúc input

Mỗi case gồm:

```text
{
  "case_id": "...",
  "paper_id": "...",
  "conference_id": "...",
  "paper_pdf": "...",
  "conference_context": {
    "name": "...",
    "scope": "...",
    "tracks": ["...", "..."]
  },
  "chair_steering": {
    "focus": "conference_fit | evidence_quality | readiness_and_limitations | general_submission_readiness",
    "instruction": "..."
  },
  "policy": {
    "deterministic_rules": "neutralized_except_document_integrity"
  }
}
```

Steering prompt phải viết như chair đang đưa ra yêu cầu nội dung cho cổng nộp bài. Prompt không nên nói về model, token, pipeline, embedding, hay cách hệ thống suy luận. Lý do là prompt sản phẩm cần giống input nghiệp vụ thật, để kết quả benchmark đại diện cho cách chair sử dụng chức năng.

### 6.3. Output cần thu thập

Normalized LLM steering output cần có:

| Trường | Ý nghĩa |
| --- | --- |
| `case_id` | Mã case benchmark. |
| `paper_title` | Tiêu đề paper. |
| `conference_id` | Hội nghị active. |
| `focus` | Nhóm steering được test. |
| `chair_instruction` | Yêu cầu nội dung của chair. |
| `finding_severity` | `pass`, `warning`, hoặc severity advisory từ workflow. |
| `finding_summary` | Tóm tắt vấn đề hoặc lý do pass. |
| `evidence` | Đoạn bằng chứng/lý do workflow đưa ra. |
| `actionability` | Reviewer đánh giá feedback có giúp author sửa bài không. |
| `groundedness` | Reviewer đánh giá finding có bám vào paper/context không. |
| `llm_block_violation` | Có vi phạm contract không: LLM tự tạo blocking verdict. |
| `manual_review_decision` | Accepted / caution / rejected. |
| `review_note` | Ghi chú của reviewer. |

### 6.4. Rubric review

LLM steering không nên được đánh giá bằng exact match. Thay vào đó, mỗi finding được review theo rubric:

| Tiêu chí | Đạt | Không đạt |
| --- | --- | --- |
| Groundedness | Nhận xét có liên hệ rõ với nội dung paper hoặc scope hội nghị. | Nhận xét chung chung, không chứng minh được đã đọc paper. |
| Actionability | Author biết cần sửa/kiểm tra điểm nào. | Feedback mơ hồ, không tạo hành động. |
| Severity appropriateness | Warning/pass phù hợp với mức độ vấn đề. | Phóng đại rủi ro hoặc bỏ qua vấn đề rõ ràng. |
| Chair alignment | Nhận xét bám vào steering instruction. | Trả lời lệch sang yêu cầu khác. |
| Contract compliance | Không tạo blocking verdict. | LLM tự đề xuất reject/block như một quyết định hệ thống. |

### 6.5. Kết quả run đã review

Run cuối cùng:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_llm_steering\run_20260706T190216Z
```

Kết quả:

| Chỉ số | Giá trị |
| --- | ---: |
| Số case | 24 |
| Completed | 24 |
| Failed | 0 |
| Review rows | 26 |
| Warning findings | 14 |
| Usable warnings | 14 |
| No-content-issue cases | 6 |
| Positive pass checks | 6 |
| Needs manual caution | 0 |
| LLM block contract violation | 0 |
| Grounded rate trên non-empty findings | 1.0 |
| Actionable rate trên warnings | 1.0 |
| Severity OK rate | 1.0 |

Kết quả này có thể được diễn giải là workflow LLM steering đã tạo feedback có thể review và có tính hành động trong tập test hiện tại, đồng thời tuân thủ contract quan trọng: LLM không tạo blocking verdict. Tuy nhiên, đây vẫn là benchmark reviewer-assessed, không phải ground truth độc lập từ program committee.

## 7. Artifact đầu ra

### 7.1. Artifact của track recommendation

Run:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\track_recommendation\run_20260706T194602Z
```

| File | Nội dung |
| --- | --- |
| `raw_responses.jsonl` | Output workflow nguyên bản theo từng case. |
| `normalized_predictions.jsonl` | Output đã chuẩn hóa cho metric và review. |
| `human_review.csv` | Bảng review thủ công top track, rationale và note. |
| `summary_metrics.json` | Metric tổng hợp. |
| `audit_report.json` | Kết quả audit script: pass/fail, lỗi schema, lỗi runtime. |

### 7.2. Artifact của Submission Gating rules

Run:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_rule_check\run_20260706T185930Z
```

| File | Nội dung |
| --- | --- |
| `raw_responses.jsonl` | Output workflow nguyên bản. |
| `normalized_rule_findings.jsonl` | Verdict/rule ids đã chuẩn hóa. |
| `rule_review.csv` | Bảng so sánh expected vs actual cho từng fixture. |
| `summary_metrics.json` | Accuracy, recall, false block, failure count. |
| `audit_report.json` | Trạng thái audit của run. |

### 7.3. Artifact của Submission Gating LLM steering

Run:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\submission_gating_llm_steering\run_20260706T190216Z
```

| File | Nội dung |
| --- | --- |
| `raw_responses.jsonl` | Output workflow nguyên bản. |
| `normalized_content_findings.jsonl` | Finding đã chuẩn hóa theo case/focus. |
| `llm_steering_review.csv` | Bảng review thủ công groundedness, actionability, severity và contract. |
| `summary_metrics.json` | Metric tổng hợp của LLM steering. |
| `audit_report.json` | Kết quả audit run. |

### 7.4. Artifact review tổng hợp

Run review tổng hợp:

```text
E:\HCMUS\Graduate-Project\Benchmarks\ai_workflow_benchmarks\outputs\final_ai_workflow_review\run_20260706T194602Z_track__20260706T190216Z_llm
```

| File | Nội dung |
| --- | --- |
| `reviewed_track_recommendation.csv` | Bảng review 48 case track recommendation. |
| `reviewed_llm_steering.csv` | Bảng review 26 finding/case LLM steering. |
| `final_review_metrics.json` | Metric tổng hợp đã tính sau review. |
| `failure_and_limitation_cases.md` | Các case yếu, caveat và giới hạn diễn giải. |
| `report_ready_ai_workflow_evaluation.md` | Bản tóm tắt kết quả có thể đưa vào report. |

## 8. Diễn giải kết quả cho báo cáo

### 8.1. Track recommendation

Kết quả nên được viết theo hướng:

> Benchmark trên 48 submission thật cho thấy Submission Autofill có thể tạo ranking track hợp lệ với invalid track rate bằng 0.0. Reviewer đánh giá 45/48 case có Top-1 recommendation mạnh, 47/48 case có Top-1 recommendation chấp nhận được, và 48/48 case có ít nhất một track phù hợp trong Top-3. Do dataset chưa có ground truth track chính thức cho từng paper, các chỉ số này phản ánh mức độ hợp lý dưới review thủ công, không được diễn giải là accuracy supervised.

Điểm quan trọng cần nhấn mạnh:

- Workflow tôn trọng danh sách track hợp lệ của hội nghị.
- Kết quả Top-3 phù hợp với UX vì author vẫn có bước review/chọn lại.
- Cần giữ caveat về ground truth.

### 8.2. Submission Gating rules

Kết quả nên được viết theo hướng:

> Benchmark deterministic rules trên 8 fixture có ground truth cho thấy workflow trả về đúng verdict và đúng rule id trong tất cả case. Kết quả này ủng hộ việc dùng rule deterministic làm lớp gating có quyền block, vì các rule này có thể tái lập, giải thích và kiểm tra bằng case được seed.

Điểm quan trọng:

- Rule check là lớp có quyền block.
- Fixture hiện tại bao phủ rule chính, không phải mọi biến thể format của mọi template paper.
- Nếu claim về format compliance nâng cao, cần thêm fixture riêng cho layout.

### 8.3. Submission Gating LLM steering

Kết quả nên được viết theo hướng:

> Benchmark LLM steering trên 24 submission thật cho thấy workflow tạo được feedback nội dung có tính hành động và bám vào steering instruction của chair. Tất cả warning finding trong tập test được đánh giá là usable, groundedness trên non-empty findings đạt 1.0, và không có case nào LLM vi phạm contract bằng cách tạo blocking verdict. Điều này phù hợp với vai trò thiết kế của LLM steering: hỗ trợ author phát hiện rủi ro nội dung trước khi nộp, không thay thế deterministic rule hay quyết định reject của con người.

Điểm quan trọng:

- LLM steering là advisory, không phải desk reject automation.
- Kết quả phù hợp để viết về khả năng hỗ trợ chair/author.
- Không nên claim LLM có độ chính xác reject cao, vì benchmark không được thiết kế cho quyết định reject.

## 9. Giới hạn và rủi ro cần công bố

Benchmark có các giới hạn sau:

1. **Track recommendation chưa có ground truth chính thức**: kết quả là reviewer plausibility. Nếu có label track thật từ hệ thống nộp bài, cần chạy lại với Top-1 accuracy, Top-3 accuracy, MRR và NDCG@K.
2. **Số lượng case còn nhỏ**: 48 track cases và 24 LLM steering cases đủ để review thủ công chất lượng, nhưng chưa đủ để kết luận thống kê mạnh trên mọi domain hội nghị.
3. **Rule fixtures bao phủ rule chính, không bao phủ mọi biến thể layout**: nếu báo cáo muốn claim về IEEE format compliance sâu hơn, cần thêm case font size, margin, paper size, column count và bibliography edge cases.
4. **LLM steering phụ thuộc vào steering prompt**: kết quả tốt với tập prompt đã review không bảo đảm mọi chair prompt ngoài đời sẽ cho output tương đương.
5. **Review thủ công có tính chủ quan**: rubric làm giảm chủ quan, nhưng chưa thay thế double-blind independent annotation.
6. **Network và provider có thể ảnh hưởng reproducibility**: model, base URL, timeout và cached PDF cần được ghi vào manifest mỗi run.

## 10. Điều kiện để xem benchmark là review-ready

Một run benchmark chỉ nên được đưa vào báo cáo nếu đạt tất cả điều kiện:

- Tất cả workflow hoàn thành với `failed_count = 0`.
- Track recommendation có `invalid_track_rate = 0.0` hoặc mọi invalid case được giải thích rõ.
- Rule check không có false pass và không có false block.
- LLM steering không có `llm_block_contract_violation`.
- Mọi output đều có raw response và normalized review artifact.
- Các case yếu được liệt kê trong `failure_and_limitation_cases.md`.
- Report-ready summary không diễn giải reviewer plausibility thành ground truth accuracy.

Theo các run đã review, tập artifact hiện tại đạt điều kiện review-ready cho mục tiêu báo cáo: chứng minh workflow đã chạy end-to-end, có output để review thủ công, và có bằng chứng đủ để đưa ra nhận định thận trọng về chất lượng của track recommendation và Submission Gating.

# Đánh Giá Các Workflow LLM

## Thiết Lập Đánh Giá

Phần đánh giá này tập trung vào hai năng lực sinh nội dung của hệ thống: gợi ý track trong Submission Autofill và kiểm tra nội dung bằng LLM trong Submission Gating. Các kết quả được chạy cục bộ bằng benchmark project độc lập, sử dụng lại cấu hình OpenAI hiện có của `ai-service`, không dùng dispatcher và không ghi vào cơ sở dữ liệu production. Mỗi lần chạy đều lưu raw response, normalized JSONL, CSV phục vụ review, summary metrics, failure cases và audit report.

Đối với gợi ý track, tập dữ liệu không có nhãn ground truth chính thức cho từng bài nộp. Vì vậy, chỉ số được báo cáo là mức độ hợp lý do reviewer đánh giá, không được diễn giải như accuracy tuyệt đối. Đối với Submission Gating LLM Steering, mỗi cảnh báo được kiểm tra theo ba tiêu chí: có bám vào bằng chứng trong bản thảo hay không, có đưa ra hướng sửa cụ thể hay không, và có giữ đúng ràng buộc không tạo quyết định chặn bài hay không.

## Submission Autofill: Gợi Ý Track

Benchmark chạy trên 48 bài nộp có PDF/cache hợp lệ. Tất cả 48 case hoàn tất, không có lỗi runtime và tỷ lệ track không hợp lệ là 0.0%. Sau khi loại bỏ nhiễu từ việc trích xuất nhầm mốc thời gian trong CFP, reviewer ghi nhận 45/48 case có Top-1 mạnh, tương đương 93.8%. Nếu tính các case Top-1 còn hợp lý nhưng confidence thấp, tỷ lệ Top-1 plausible là 97.9%; tỷ lệ Top-3 acceptable là 100.0%.

Kết quả cho thấy workflow có thể dùng được như một cơ chế hỗ trợ tác giả chọn track, đặc biệt khi danh sách track của hội nghị được chuẩn hóa tốt. Tuy nhiên, đây không nên được trình bày là bộ phân loại track tự động có accuracy tuyệt đối, vì nhãn đúng/sai cuối cùng vẫn cần xác nhận bởi người dùng hoặc ban tổ chức hội nghị. Vai trò phù hợp của chức năng này là xếp hạng các lựa chọn hợp lý và giảm công sức tìm track, không thay thế quyết định của tác giả.

Các case cần diễn giải thận trọng gồm:

- `trackrec_0004`: Top-1 `Emerging Technologies and Innovations in Information Systems` có confidence 3.10 và được đánh dấu `weak_top1_low_confidence`.
- `trackrec_0015`: Top-1 `Applications of uncertainty in AI` có confidence 5.90 và được đánh dấu `acceptable_but_low_confidence`.
- `trackrec_0044`: Top-1 `Safety, fairness, and societal impact` có confidence 6.00 và được đánh dấu `acceptable_but_low_confidence`.

## Submission Gating: LLM Steering

Benchmark LLM Steering chạy trên 24 bài nộp thật, chia đều bốn trọng tâm chair prompt: readiness/limitations, evidence quality, conference fit và general submission readiness. Tất cả 24 case hoàn tất, không có lỗi runtime và không có trường hợp LLM tạo quyết định chặn bài. Đây là điểm quan trọng vì workflow được thiết kế để LLM chỉ đưa ra cảnh báo nội dung, còn quyết định blocking chỉ đến từ các rule deterministic có thể giải thích và tái lập.

Trong 26 dòng review, có 14 cảnh báo nội dung. Reviewer đánh giá 14/14 cảnh báo là usable chair warning, tương đương 100.0%. Tỷ lệ grounded trên các finding có nội dung là 100.0%, tỷ lệ actionable trên warning là 100.0%, và tỷ lệ severity phù hợp là 100.0%. Ngoài ra, 6 case không sinh cảnh báo nội dung, được ghi nhận riêng thay vì tính như lỗi.

Các cảnh báo hữu ích nhất là những cảnh báo chỉ ra vấn đề có thể sửa trước khi nộp, ví dụ thiếu phần limitations rõ ràng, claim vượt quá phạm vi bằng chứng, thông tin định danh tác giả trong bản thảo, hoặc bản PDF có dấu hiệu nội dung lặp/format chưa sạch. Các cảnh báo này đều ở mức `warn` và dẫn tới `manual_review`, không tạo `desk_reject`.

Một số nhóm cảnh báo tiêu biểu:

- `readiness_and_limitations` / `limitations_missing_or_weak`: workflow phát hiện phần giới hạn/rủi ro còn thiếu hoặc chưa đủ rõ, và đề xuất bổ sung đoạn limitations nêu phạm vi áp dụng, giả định và các trường hợp kết quả có thể không còn đúng.
- `evidence_quality` / `evidence_scope_widescale_deployment`: workflow phát hiện claim đang rộng hơn bằng chứng được trình bày, và đề xuất thu hẹp diễn giải hoặc bổ sung validation, ablation hay baseline cần thiết.
- `readiness_and_limitations` / `limitations-clarity`: workflow phát hiện phần giới hạn/rủi ro còn thiếu hoặc chưa đủ rõ, và đề xuất bổ sung đoạn limitations nêu phạm vi áp dụng, giả định và các trường hợp kết quả có thể không còn đúng.
- `general_submission_readiness` / `anonymization`: workflow phát hiện thông tin định danh tác giả trong bản thảo và đề xuất loại bỏ tên, email, affiliation hoặc metadata trước khi nộp.

## Kết Luận

Hai workflow LLM đạt mức đủ tốt để đưa vào báo cáo với luận điểm thận trọng: hệ thống hỗ trợ tác giả và ban tổ chức bằng cách xếp hạng lựa chọn và phát hiện vấn đề nội dung có thể sửa, nhưng không tự động thay thế quyết định của con người. Điểm mạnh chính là các output đều có raw response, normalized artifact, review CSV, audit report và failure analysis. Giới hạn chính là benchmark track recommendation chưa có ground truth track chính thức, còn đánh giá rationale của LLM steering vẫn dựa trên reviewer rubric thay vì một bộ nhãn chuyên gia độc lập.

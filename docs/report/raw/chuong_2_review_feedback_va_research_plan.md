# Review feedback và research plan cho Chương 2

## 1. Mục đích của artifact

File này ghi lại feedback review cho Chương 2 trước khi tiến hành research bổ sung citation và rewrite nội dung. Đây không phải bản viết lại Chương 2, mà là brief làm việc cho bước tiếp theo.

Phạm vi review:

- Chuẩn narrative của Chương 1: vấn đề peer review quá tải, rủi ro liêm chính học thuật khi đưa AI vào quy trình, ranh giới "AI hỗ trợ, con người quyết định".
- Chương 2 hiện tại trong `docs/report/compiled/final_combined/02-khao-sat-hien-trang-khoang-trong.md`.
- Outline hiện tại trong `docs/report/compiled/outline_bao_cao.md`.
- Các nguồn raw liên quan trong `docs/report/raw/`, đặc biệt:
  - `chapter_2.1-khao-sat-nhu-cau.md`
  - `chapter_2.2-he-thong-tuong-tu.md`
  - `chapter_2.3-phan-tich-yeu-cau.md`
  - `chapter_2-survey-and-requirements-Analysis.md`

Ghi chú quan trọng từ người dùng: các placeholder ảnh trong Chương 2 được giữ lại như anchor nội dung để team chèn biểu đồ/phụ lục phù hợp sau khi hoàn thiện nội dung. Vì vậy, placeholder ảnh không được xem là lỗi cần xóa. Khi rewrite, vẫn giữ anchor ảnh, nhưng cần đặt caption và mô tả xung quanh rõ ràng để biết ảnh cần chứng minh điều gì.

## 2. Verdict tổng quan

Chương 2 hiện có đủ nguyên liệu, nhưng chưa đạt cùng mức chất lượng narrative và học thuật như Chương 1. Vấn đề không nằm ở việc thiếu nội dung, mà nằm ở cách tổ chức và mức độ chứng minh.

Chương 1 đã làm tốt ba việc:

1. Đặt bối cảnh lớn của peer review và AI.
2. Xác định rủi ro học thuật và ranh giới thiết kế.
3. Biến ranh giới đó thành mục tiêu và phạm vi đề tài.

Chương 2 cần tiếp nối theo kiểu top-down:

1. Chuyển vấn đề ở Chương 1 thành nhu cầu người dùng và điểm đau cụ thể.
2. Đối chiếu nhu cầu đó với các hệ thống hiện có.
3. Rút ra khoảng trống thực tiễn/nghiên cứu.
4. Tổng hợp thành yêu cầu hệ thống và nguyên tắc thiết kế để bàn giao cho Chương 3.

Hiện tại Chương 2 mới làm được một phần của chuỗi này. Chương có survey, có competitor analysis, có gap analysis, nhưng thiếu phần tổng hợp yêu cầu hệ thống rõ ràng theo outline, và có một số nội dung công nghệ/provider đang lấn sang phạm vi Chương 4.

## 3. Các feedback ưu tiên

### P1. Cấu trúc Chương 2 chưa align với outline hiện tại

Outline yêu cầu Chương 2 có mục `2.4 Tổng hợp yêu cầu hệ thống từ khảo sát`, đóng vai trò cầu nối giữa nhu cầu, hiện trạng, khoảng trống và Chương 3. Bản compiled hiện tại chỉ có:

- `2.1 Khảo sát nhu cầu`
- `2.2 Khảo sát hiện trạng`
- `2.3 Khoảng trống nghiên cứu`

Trong khi đó, raw `chapter_2.3-phan-tich-yeu-cau.md` có phần yêu cầu chức năng, phi chức năng và ràng buộc hệ thống khá hữu ích. Phần này nên được đưa trở lại thành `2.4`, nhưng cần rewrite trước khi chèn vì một số scope cũ không còn đúng.

Hướng sửa:

- Giữ `2.1`, `2.2`, `2.3` như các lớp lập luận.
- Thêm `2.4 Tổng hợp yêu cầu hệ thống từ khảo sát`.
- `2.4` nên gồm:
  - `2.4.1 Yêu cầu chức năng theo vai trò`
  - `2.4.2 Yêu cầu phi chức năng`
  - `2.4.3 Nguyên tắc thiết kế AI có kiểm soát`
  - `2.4.4 Ma trận traceability từ nhu cầu đến yêu cầu hệ thống`

### P1. Bản compiled có dấu vết merge/compile chưa sạch

Chương 2 hiện có lặp lại heading cấp 1 `# Chương 2. Khảo sát nhu cầu (tiếp theo)` ở giữa file. Đây là lỗi trình bày rõ ràng, không phải vấn đề nội dung.

Hướng sửa:

- Khi rewrite, chỉ giữ một heading cấp 1 ở đầu chương.
- Các phần tiếp theo dùng heading cấp 2/cấp 3 đúng numbering.
- Không xóa placeholder ảnh, nhưng chuyển chúng thành anchor có ý nghĩa:
  - `![Biểu đồ phân bố đối tượng tham gia khảo sát](...)`
  - `![Biểu đồ các pain point chính](...)`
  - `![Biểu đồ mức độ ủng hộ AI của reviewer](...)`
- Mỗi anchor ảnh cần có một câu trước/sau giải thích: "Biểu đồ này dùng để minh họa..."

### P1. Scope drift: reviewer matching và track suggestion đang bị đặt sai lớp

Chương 1 đặt ranh giới rõ: nghiệp vụ cốt lõi, thuật toán xác định, AI hỗ trợ. Chương 5 cũng đã fix theo hướng reviewer matching là thuật toán xác định, không phải generative AI workflow.

Chương 2 hiện vẫn có các cụm như:

- "Gợi ý phản biện bằng AI"
- "Track Recommendation" như workflow độc lập
- Mapping "Track Recommendation" trong AI Service như một workflow riêng

Hướng sửa:

- Đổi "Gợi ý phản biện bằng AI" thành "Gợi ý phản biện bằng thuật toán xác định/có thể giải thích".
- Reviewer matching nên nằm trong lớp thuật toán: Domain Jaccard Similarity, Semantic Scholar profile, COI constraints.
- Đổi "Track Recommendation" thành "gợi ý track trong Submission Autofill" nếu đang nói về sub-output trong workflow Autofill.
- Nếu vẫn cần nói "track recommendation" như một ý niệm tổng quát, phải ghi rõ benchmark hiện tại chỉ bao phủ sub-output trong Autofill.

### P1. Một số mô tả AI còn vượt qua ranh giới "hỗ trợ, không quyết định"

Raw requirements có dòng "AI Decision Copilot ... đề xuất quyết định accept/reject". Cách viết này mâu thuẫn với Chương 1 và Chương 5.

Hướng sửa:

- Decision Copilot không "đề xuất quyết định accept/reject" như một classifier.
- Viết lại thành: "tổng hợp evidence, điểm đồng thuận/bất đồng, vấn đề chưa giải quyết và câu hỏi cần chair xem xét trước khi ra quyết định".
- Review Quality Auditor không "chấm review đạt/không đạt"; chỉ "cảnh báo rủi ro chất lượng review để chair kiểm tra".
- Submission Gating chỉ được trình bày như hỗ trợ kiểm tra sơ bộ và cảnh báo, không như cơ chế loại bài tự động nếu chưa có chính sách/ground truth rõ.

### P2. Phần khảo sát nhu cầu có số liệu nhưng chưa đủ chuẩn phương pháp

Phần `2.1` có mẫu 71 phản hồi, có pain points và chia theo vai trò. Đây là nền tốt. Tuy nhiên, mức độ học thuật còn yếu vì thiếu:

- Thời điểm khảo sát.
- Kênh phân phối khảo sát.
- Cấu trúc bảng hỏi.
- Cách xử lý câu hỏi nhiều lựa chọn.
- Cách tính tỷ lệ.
- Giới hạn mẫu, đặc biệt với subgroup nhỏ như 7 chair và 11 reviewer.

Hướng bổ sung:

- Thêm một bảng "Thông tin mẫu khảo sát":
  - Tổng số phản hồi hợp lệ.
  - Số người theo vai trò.
  - Có cho phép một người chọn nhiều vai trò hay không.
  - Đối tượng chính: sinh viên, học viên cao học, giảng viên/nhà nghiên cứu, người làm doanh nghiệp có tham gia hội nghị.
- Thêm một đoạn "Giới hạn của khảo sát":
  - Mẫu thuận tiện, chưa đại diện cho toàn bộ cộng đồng học thuật.
  - Số lượng chair/reviewer nhỏ, vì vậy kết quả theo subgroup chỉ nên đọc như tín hiệu định hướng.
  - Survey nhu cầu ban đầu khác với UAT sau sử dụng ở Chương 5.
- Viết lại kết luận theo mức độ bằng chứng:
  - "kết quả gợi ý..."
  - "tín hiệu từ mẫu khảo sát cho thấy..."
  - tránh "người dùng cực kỳ ưu ái..." nếu không có bằng chứng định tính mạnh.

### P2. Văn phong một số đoạn còn marketing

Một số cụm như "tạo lợi thế cạnh tranh cốt lõi", "khác biệt khổng lồ", "hiệu ứng Wow" làm giảm chuẩn học thuật.

Hướng sửa:

- Đổi "tạo lợi thế cạnh tranh cốt lõi" thành "tạo điểm khác biệt về trải nghiệm người dùng so với quy trình nhập liệu thủ công".
- Đổi "hiệu ứng Wow" thành "giảm đáng kể friction trong điểm chạm đầu tiên của tác giả với hệ thống".
- Đổi "khác biệt khổng lồ" thành "khác biệt rõ ràng về mức độ tự động hóa và khả năng hướng dẫn người dùng".

### P2. Phần công nghệ/provider đang nằm sai vị trí

Chương 2 nên tổng hợp nhu cầu, hiện trạng, gap và requirements. Phần chi tiết về Go, Next.js, Gemini, OpenRouter, LiteLLM, rate limit, context window nên thuộc Chương 4.

Hướng sửa:

- Trong Chương 2 chỉ giữ "nguyên tắc công nghệ" ở mức high-level:
  - Cần tách AI Service khỏi core backend.
  - Cần có AI platform hỗ trợ PDF/native document processing.
  - Cần có structured output/function calling cho chatbot và workflow.
  - Cần có cơ chế đổi provider/fallback về sau.
  - Cần vận hành được khi AI service lỗi.
- Chuyển bảng chi tiết tech stack sang Chương 4 hoặc rút gọn thành "yêu cầu kỹ thuật phát sinh từ khảo sát".

### P2. So sánh hệ thống hiện có cần citation và tiêu chí rõ hơn

Chương 2 hiện có comparative analysis tốt về EasyChair, HotCRP, OpenReview, CMT. Tuy nhiên, để đạt chuẩn như Chương 1, cần citation và tiêu chí chọn hệ thống.

Hướng bổ sung:

- Thêm tiêu chí chọn hệ thống:
  - Phổ biến trong cộng đồng học thuật.
  - Bao phủ các bước chính của peer review.
  - Đại diện cho các mô hình: closed review, open review, self-hosted, managed service.
  - Có liên quan trực tiếp đến ba vai trò Author/Reviewer/Chair.
- Tách nhóm hệ thống:
  - Hệ thống quản lý peer review: EasyChair, HotCRP, OpenReview, Microsoft CMT.
  - Công cụ phụ trợ tìm hội nghị/xếp hạng: WikiCFP, CORE/ICORE, ConfHub nếu muốn đưa vào nhu cầu tìm hội nghị.
- Mỗi hệ thống cần có citation tới trang chính thức hoặc tài liệu chính thức.
- Bảng so sánh nên có cột "ghi chú/mức độ hỗ trợ", tránh bảng binary "Có/Không" quá mạnh.

## 4. Cấu trúc đề xuất cho bản rewrite Chương 2

```text
# Chương 2. Khảo sát nhu cầu, hiện trạng và tổng hợp yêu cầu

## 2.1. Khảo sát nhu cầu người dùng
### 2.1.1. Mục tiêu và thiết kế khảo sát
### 2.1.2. Đối tượng và đặc điểm mẫu
### 2.1.3. Kết quả theo pain point chính
### 2.1.4. Kết quả theo vai trò: Author, Reviewer, Chair
### 2.1.5. Diễn giải kết quả và giới hạn của khảo sát

## 2.2. Khảo sát hiện trạng các hệ thống quản lý hội nghị
### 2.2.1. Tiêu chí lựa chọn hệ thống đối sánh
### 2.2.2. Tổng quan EasyChair, HotCRP, OpenReview, Microsoft CMT
### 2.2.3. So sánh theo workflow và mức hỗ trợ người dùng
### 2.2.4. Nhận xét về khoảng trống so với nhu cầu đã khảo sát

## 2.3. Khoảng trống thực tiễn và nguyên tắc giải pháp
### 2.3.1. Thao tác thủ công và friction trong quy trình nộp bài
### 2.3.2. Reviewer matching và COI cần logic có thể giải thích
### 2.3.3. AI cần được đặt ở vai trò hỗ trợ có kiểm soát
### 2.3.4. Thiếu dashboard, realtime notification và trợ lý nền tảng
### 2.3.5. Ánh xạ khoảng trống sang định hướng ConferenceSpace

## 2.4. Tổng hợp yêu cầu hệ thống từ khảo sát
### 2.4.1. Yêu cầu chức năng theo vai trò
### 2.4.2. Yêu cầu phi chức năng
### 2.4.3. Nguyên tắc giới hạn vai trò AI
### 2.4.4. Ma trận traceability từ nhu cầu đến thiết kế và đánh giá
```

## 5. Hướng bổ sung theo từng mục

### 5.1. Cho mục 2.1 Khảo sát nhu cầu

Cần thêm:

- Bảng đặc điểm mẫu.
- Mô tả thang đo Likert và câu hỏi multiple-choice.
- Phân biệt rõ "survey nhu cầu ban đầu" với "UAT sau sử dụng" ở Chương 5.
- Nhận xét về subgroup nhỏ:
  - 7 chair: chỉ đủ để ghi nhận tín hiệu, không đủ để kết luận tổng quát.
  - 11 reviewer: cần đọc cẩn thận khi nói về mức độ chấp nhận AI trong reviewer workflow.

Giữ lại:

- Pain point "không biết bước tiếp theo", "form nhập liệu dài", "phải đọc hướng dẫn dài", "không có kiểm tra lỗi sớm", "thông báo/deadline rời rạc".
- Nhu cầu human-in-the-loop khi dùng Autofill.
- Cảnh báo reviewer không muốn AI thay thế nhận xét học thuật.

Sửa văn phong:

- Thay "người dùng bị ám ảnh" bằng "nhiều phản hồi tập trung vào".
- Thay "hiệu ứng Wow" bằng "giảm friction ở điểm chạm đầu tiên".
- Thay "lợi thế cạnh tranh cốt lõi" bằng "điểm khác biệt về trải nghiệm và mức độ tự động hóa".

### 5.2. Cho mục 2.2 Khảo sát hiện trạng

Cần thêm:

- Citation chính thức cho EasyChair, HotCRP, OpenReview, Microsoft CMT.
- Nếu dùng TPMS/CMT, cần nguồn về TPMS hoặc tài liệu CMT reviewer assignment.
- Nếu nói OpenReview có AI Review Assistant/LLM-generated reviews, cần citation hoặc bỏ câu này nếu chưa verify.
- Nếu nói hệ thống nào "không có AI", cần viết cẩn thận: "không ghi nhận như một tính năng cốt lõi công khai trong phạm vi khảo sát" thay vì khẳng định tuyệt đối.

Giữ lại:

- EasyChair: đầy đủ nghiệp vụ nhưng UI cũ, manual-heavy.
- HotCRP: mạnh cho reviewer/chair, có bidding, self-hosted/technical.
- OpenReview: minh bạch, API mở, phù hợp open peer review.
- Microsoft CMT: managed service, quy mô lớn, có TPMS/DBLP-related support nhưng workflow matching/COI có giới hạn.

Cần cân bằng:

- Không so sánh ConferenceSpace như "có tất cả và tốt hơn tất cả".
- Phải nói rõ ConferenceSpace cũng có hạn chế: chưa có bidding, chưa có public API mature như OpenReview, chưa có production adoption như EasyChair/CMT.

### 5.3. Cho mục 2.3 Khoảng trống và nguyên tắc giải pháp

Khoảng trống nên viết thành các luận điểm có cấu trúc:

1. **Friction trong thao tác tác giả:** form dài, thiếu hướng dẫn, thiếu kiểm tra sớm.
2. **Khoảng trống reviewer/chair workload:** reviewer cần định hướng, chair cần tổng hợp và theo dõi tiến độ.
3. **Reviewer matching và COI cần tính giải thích:** không nên giao cho LLM quyết định.
4. **AI chỉ phù hợp ở vai trò hỗ trợ có kiểm soát:** trích xuất, tóm tắt, gợi ý điểm cần xem, tổng hợp evidence.
5. **Thiếu realtime và trợ lý nền tảng:** email-only và UI cũ làm tăng cognitive load.

Cần tránh:

- "AI hỗ trợ toàn diện" nếu không giải thích rõ là "hỗ trợ tại các điểm cụ thể".
- "Desk rejection tự động" nếu không có chính sách rõ. Nên gọi "Submission Gating/kiểm tra sơ bộ bản thảo".
- "AI reviewer matching" vì sai lớp.

### 5.4. Cho mục 2.4 Tổng hợp yêu cầu hệ thống

Nên dùng raw `chapter_2.3-phan-tich-yeu-cau.md` làm nguồn, nhưng rewrite theo phạm vi đúng.

Yêu cầu chức năng nên gồm:

- Author:
  - Tìm/xem hội nghị.
  - Nộp bài theo wizard.
  - Autofill metadata và gợi ý track trong Submission Autofill.
  - Lưu draft, sửa trước deadline, rebuttal, camera-ready.
  - Theo dõi trạng thái và nhận thông báo.
- Reviewer:
  - Nhận/từ chối lời mời.
  - Xem bài được phân công.
  - Nhận briefing/initial analysis như gợi ý đọc bài.
  - Viết, lưu draft, nộp review.
  - Xem rebuttal và cập nhật review nếu cần.
- Chair:
  - Tạo/cấu hình hội nghị.
  - Quản lý track, deadline, committee.
  - Reviewer matching bằng thuật toán có thể giải thích.
  - Kiểm tra COI đa tầng.
  - Theo dõi tiến độ review.
  - Review Quality Auditor như checklist.
  - Chair Decision Copilot như evidence synthesis.
  - Ra quyết định cuối cùng.

Yêu cầu phi chức năng nên gồm:

- Usability: wizard, role-based UI, lỗi rõ nguyên nhân, undo/back.
- Performance: backend gần realtime, AI workflow bất đồng bộ nếu dài.
- Security/privacy: RBAC, HTTPS, file access, không leak dữ liệu hội nghị.
- Explainability: reviewer matching/COI có lý do và evidence.
- Reliability: system vẫn chạy khi AI service lỗi.
- Maintainability: tách AI service khỏi core backend.
- Scalability: có hàng đợi/retry/worker cho workflow AI.

Nguyên tắc AI:

- AI không tự động chấp nhận/từ chối bài.
- AI không thay reviewer viết nhận xét học thuật.
- AI không thay chair ra quyết định.
- Mỗi output AI cần có trạng thái review/xác nhận của người dùng.
- Output quan trọng cần có nguồn/evidence hoặc lý do.

## 6. Traceability matrix để thêm vào Chương 2

| Nhu cầu / khoảng trống | Evidence trong Chương 2 | Yêu cầu hệ thống | Kiểm chứng về sau |
|---|---|---|---|
| Form dài, thao tác lặp lại | Pain point form nhập liệu dài | Submission Autofill, draft/edit form | Chương 5: benchmark Autofill metadata |
| Tác giả không biết bước tiếp theo | Pain point điều hướng | Wizard nộp bài, CTA rõ, notification | UAT và feedback người dùng |
| Không có kiểm tra lỗi sớm | Pain point kiểm tra trước khi nộp | Submission Gating/kiểm tra sơ bộ | Chương 5: Gating rule/steering benchmark |
| Chair khó kiểm tra COI | Survey chair + competitor gap | COI đa tầng, evidence cho mỗi conflict | Chương 5: COI performance/benchmark |
| Matching cần công bằng và giải thích | Chương 1 và competitor gap | Reviewer matching xác định, không dùng LLM để quyết định | Chương 5: reviewer matching benchmark |
| Reviewer cần hỗ trợ đọc bài nhưng không muốn AI thay mình | Survey reviewer + integrity concern | Reviewer Initial Analysis với nguồn và user confirmation | Chương 5: TCA truthfulness/coverage |
| Chair quá tải tổng hợp review/rebuttal | Gap trong chair workflow | Chair Decision Copilot tổng hợp evidence | Chương 5: Decision Copilot benchmark |
| Email/deadline rời rạc | Pain point notification | Dashboard, realtime notification, chatbot | UAT/chatbot benchmark |

## 7. Claim-evidence map cần xử lý trước khi rewrite

| Claim | Trạng thái | Action |
|---|---|---|
| Người dùng cần giảm thao tác thủ công | Supported bằng survey nội bộ | Giữ, viết học thuật hơn |
| Autofill là workflow ưu tiên | Supported nhưng cần caveat | Giữ, gắn với pain point và benchmark Chương 5 |
| Chair ưu tiên AI reviewer matching thấp | Supported yếu do subgroup chair nhỏ | Giữ với caveat 7 chair, không khẳng định tổng quát |
| Reviewer lo ngại AI thay thế nhận xét học thuật | Supported và align Chương 1 | Giữ, biến thành nguyên tắc thiết kế |
| Hệ thống hiện có thiếu AI hỗ trợ toàn diện | Weak nếu không citation | Research bổ sung, viết lại cẩn thận |
| Reviewer matching là AI | Sai scope | Chuyển sang thuật toán xác định |
| Track Recommendation là workflow độc lập | Scope drift | Đổi thành gợi ý track trong Submission Autofill |
| Decision Copilot đề xuất accept/reject | Overclaim | Đổi thành tổng hợp evidence cho chair |
| Gemini/OpenRouter là nội dung chính của Chương 2 | Sai vị trí | Rút gọn, chuyển chi tiết sang Chương 4 |

## 8. Research và citation checklist trước khi rewrite

Cần research bổ sung trước khi rewrite full Chương 2:

### 8.1. Nguồn cho hệ thống hiện có

- EasyChair:
  - Trang chính thức và tài liệu tính năng.
  - Evidence về workflow submission/review/decision.
- HotCRP:
  - Trang chính thức/tài liệu về bidding, review assignment, discussion.
  - Evidence về self-hosted/open-source.
- OpenReview:
  - Trang chính thức/tài liệu về open peer review, API, venues.
  - Evidence về scope AI assistant nếu muốn đề cập.
- Microsoft CMT:
  - Trang chính thức/tài liệu về CMT workflow.
  - Nguồn về TPMS/reviewer matching nếu đề cập.
  - Nguồn về conflict management/DBLP nếu đề cập.

### 8.2. Nguồn cho vấn đề peer review và user needs

- Tài liệu về reviewer workload và scale của hội nghị.
- Tài liệu về reviewer assignment và conflict of interest.
- Tài liệu về rủi ro AI trong peer review để liên kết lại Chương 1.
- Nếu có thể, nguồn về UX/friction trong scholarly submission systems hoặc conference management systems.

### 8.3. Nguồn cho technology/platform chỉ ở mức yêu cầu

Trong Chương 2, không cần citation chi tiết cho từng version tech stack. Nếu vẫn giữ các nguyên tắc công nghệ, chỉ cần source cho:

- Semantic Scholar API như nguồn dữ liệu học thuật.
- Lý do dùng graph database cho relationship traversal/COI nếu muốn làm mạnh gap COI.
- Nguyên tắc human-in-the-loop / AI-assisted decision support trong high-stakes workflow.

Chi tiết Gemini, OpenRouter, LiteLLM, rate limit, context window nên để Chương 4 và citation-check ở đó.

## 9. Acceptance criteria cho bản rewrite Chương 2

Bản Chương 2 sau khi rewrite nên đạt các tiêu chí sau:

- Chỉ có một heading cấp 1.
- Giữ các placeholder ảnh như anchor, nhưng mỗi anchor có caption/mục đích rõ.
- Có cầu nối mở đầu nói rõ vai trò của Chương 2 sau Chương 1.
- Có phương pháp khảo sát và giới hạn mẫu.
- Có comparative analysis với citation hoặc danh sách nguồn cần citation.
- Có gap analysis không pitch sản phẩm quá đà.
- Có `2.4 Tổng hợp yêu cầu hệ thống từ khảo sát`.
- Có traceability matrix từ nhu cầu/khoảng trống đến yêu cầu hệ thống.
- Reviewer matching được đặt ở lớp thuật toán xác định.
- Track suggestion được đặt trong Submission Autofill nếu theo scope hiện tại.
- Decision Copilot, Review Quality Auditor và Submission Gating đều được viết như công cụ hỗ trợ có kiểm soát, không thay thế quyết định học thuật.
- Nội dung công nghệ/provider chỉ giữ ở mức yêu cầu/nguyên tắc; chi tiết đưa sang Chương 4.

## 10. Kết luận làm việc

Chương 2 không nên được sửa theo kiểu "viết lại cho mượt". Cần refine top-down giống Chương 1:

1. Dùng Chương 1 làm narrative contract.
2. Dùng survey và system comparison làm evidence.
3. Dùng gap analysis làm cầu nối.
4. Dùng requirements synthesis làm output của chương.

Sau khi research bổ sung citation, bước rewrite nên ưu tiên cấu trúc và ranh giới claim trước, rồi mới polish văn phong.

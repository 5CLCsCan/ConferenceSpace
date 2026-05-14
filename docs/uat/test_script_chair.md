# Script kiểm thử & hướng dẫn sử dụng - Role CHAIR

Tài liệu này dành cho người lần đầu dùng ConferenceSpace với vai trò **Chair/Chủ tọa**. Script bao phủ toàn bộ vòng đời hội nghị: tạo template, tạo hội nghị, cấu hình CFP/deadline, mời committee, quản lý submission, auto-assign reviewer, kiểm tra COI, theo dõi review, mở rebuttal, dùng AI decision copilot, ra quyết định và kiểm tra camera-ready.

## 0. Chuẩn bị trước khi test

**Tài khoản đề xuất**

- Chair: `chair@gmail.com` / `Demo@123`
- Author chính: `author1@gmail.com` / `Demo@123`
- Co-author dùng để test COI: `author2@gmail.com` / `Demo@123`
- Reviewer phù hợp: `reviewer1@gmail.com` / `Demo@123`
- Reviewer có COI: `reviewer2@gmail.com` / `Demo@123`
- Reviewer lệch chuyên môn: `reviewer3@gmail.com` / `Demo@123`

**Hội nghị mẫu**

- Full name: `International Conference on AI & Future Tech 2026`
- Acronym: `AIFT`
- Year: `2026`
- Location: `Ho Chi Minh City, Vietnam`
- Website: `https://aift2026.example.com`
- Domains: `Artificial Intelligence`, `Machine Learning`, `Natural Language Processing`, `Generative AI`
- Tracks:
  - `Artificial Intelligence & Machine Learning`
  - `Software Engineering`
  - `Human-Computer Interaction`

**Mốc thời gian gợi ý khi test**

- Submission deadline: đặt sau ngày hiện tại để Author nộp bài được.
- Review deadline: sau submission deadline vài ngày.
- Rebuttal start/end: chỉ bật sau khi có review.
- Notification/final decision date: sau rebuttal.
- Camera-ready deadline: sau khi accept.

## 0.1. Giải thích field đăng ký/đăng nhập cho Chair

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **First Name** | Tên của Chair, dùng trong profile và committee. | `Nguyen Van` | Nên dùng tên thật/chính thức. |
| **Last Name** | Họ hoặc phần tên còn lại. | `Chair` | Hiển thị trong committee/conference owner. |
| **Email** | Tài khoản đăng nhập và contact định danh người tạo hội nghị. | `chair@gmail.com` | Email này có thể xuất hiện trong quyền sở hữu conference. |
| **Domains** | Lĩnh vực chuyên môn của Chair. | `Artificial Intelligence`, `Machine Learning` | Không thay thế topics của hội nghị, nhưng giúp profile Chair rõ hơn. |
| **Password/Confirm Password** | Mật khẩu đăng nhập. | `Demo@123` | Cần đủ rule: 8+ ký tự, chữ thường, chữ hoa, số, ký tự đặc biệt. |
| **Login Remember me** | Giữ phiên đăng nhập. | Tick khi demo dài | Không ảnh hưởng quyền Chair. |

## 0.2. Giải thích chi tiết 6 bước tạo hội nghị

### Bước 1: Basic Details

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Conference Name/Title** | Tên đầy đủ của hội nghị. Author sẽ thấy tên này trong danh sách hội nghị. | `International Conference on AI & Future Tech 2026` | Bắt buộc. Thiếu title thì Save Draft/Create bị chặn. |
| **Acronym** | Tên viết tắt, dùng cho nhận diện nhanh, URL/correspondence nếu có. | `AIFT 2026` hoặc `AIFT` | Bắt buộc. Nên ngắn, không nhập mô tả dài. |
| **Contact Email** | Email ban tổ chức/chair nhận câu hỏi. | `chairs@aift2026.org` | Bắt buộc trong form. Sai định dạng email phải báo lỗi. |
| **Conference Website** | Website công khai của hội nghị. | `https://aift2026.example.com` | Optional. Nên có `https://`. |
| **Conference Format** | Cách tổ chức hội nghị. | `In-person`, `Virtual`, `Hybrid` | Chọn format sẽ thay đổi field location/platform. |
| **Venue Location** | Địa điểm vật lý nếu in-person/hybrid. | `Convention Center, Ho Chi Minh City, Vietnam` | Không hiện hoặc không bắt buộc nếu chọn Virtual. |
| **Virtual Platform** | Nền tảng online nếu virtual/hybrid. | `Zoom`, `Gather Town`, `Hopin` | Dùng để author/reviewer biết cách tham dự. |
| **Start Date** | Ngày/giờ bắt đầu hội nghị. | `2026-09-10 09:00` | End Date không được trước Start Date. |
| **End Date** | Ngày/giờ kết thúc hội nghị. | `2026-09-12 17:00` | UI có thể hiển thị duration. |
| **Description** | Mô tả ngắn cho người xem hiểu hội nghị nói về gì. | `AIFT 2026 focuses on trustworthy AI, LLM systems, and enterprise AI applications.` | Nên rõ phạm vi, tránh quá dài. UI giới hạn khoảng 500 ký tự. |
| **Next** | Sang bước sau. | Bấm sau khi điền cơ bản | Không nhất thiết lưu vào backend ngay, chỉ chuyển bước trong wizard. |
| **Save Draft** | Lưu hội nghị dưới trạng thái draft. | Dùng khi chưa muốn publish | Draft cần ít nhất title/acronym. Author thường chưa thấy draft. |

### Bước 2: Topics & Deadlines

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Subject Areas/Topics** | Chủ đề học thuật của hội nghị. Hệ thống dùng để tag submission và gợi ý reviewer. | `Generative AI`, `Natural Language Processing`, `AI Governance` | Bắt buộc. Gõ rồi Enter hoặc dấu phẩy. Trùng topic không thêm lại. |
| **Remove topic (x)** | Xóa topic khỏi hội nghị. | Xóa `Computer Vision` nếu không nhận track này | Sau xóa, topic không dùng để match reviewer nữa. |
| **Track Names** | Các luồng/chuyên mục con mà Author sẽ chọn khi nộp bài. | `Artificial Intelligence & Machine Learning`, `Software Engineering` | Optional theo code, nhưng nên có để quản lý review tốt hơn. |
| **Abstract Submission** | Hạn đăng ký abstract/ý định nộp bài. | `2026-06-01 23:59` | Hệ thống map field này thành submissions open trong một số logic cũ. |
| **Full Paper Submission** | Hạn cuối upload paper đầy đủ. | `2026-06-15 23:59` | Rất quan trọng: sau hạn này Author không submit/sửa bài nếu strict policy. |
| **Notification of Acceptance** | Ngày tác giả nhận quyết định. | `2026-08-01 09:00` | Phải sau full paper deadline. |
| **Camera-Ready Deadline** | Hạn nộp bản cuối cho bài accepted. | `2026-08-20 23:59` | Chỉ có ý nghĩa với bài accepted. |
| **Strict Deadlines** | Khóa thao tác sau deadline. | Tick nếu muốn deadline cứng | Dùng test: sau deadline, Author không submit/rebuttal/camera-ready được. |

### Bước 3: Policy & Guidelines

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Maximum Pages** | Số trang tối đa, thường không tính references. | `8` | Dùng trong precheck/gating nếu bật. |
| **Abstract Max Words** | Số từ tối đa cho abstract. | `250` | Author nhập abstract quá dài có thể bị cảnh báo/chặn tùy policy. |
| **Min Keywords** | Số keyword tối thiểu khi submit paper. | `3` | Author ít hơn mức này phải bị validation/gating. |
| **Max Keywords** | Số keyword tối đa. | `5` | Author nhập quá nhiều phải bị cảnh báo/chặn tùy UI. |
| **Accepted File Formats** | Định dạng file được nhận. | `PDF`, `LaTeX`, `Word` | Nên bật PDF cho review chính. Test upload sai định dạng ở Author. |
| **Enable Submission Gating** | Bật kiểm tra chính sách trước khi nhận bài vào review. | Tick để bật | Nếu AI/precheck service lỗi, cần kiểm tra fallback không crash. |
| **Minimum References** | Số tài liệu tham khảo tối thiểu. | `10` | Paper có ít references hơn bị finding/blocker tùy cấu hình. |
| **Title max words** | Giới hạn số từ trong title. | `18` | Title quá dài bị cảnh báo/chặn. |
| **Required Sections** | Các section bắt buộc trong manuscript. | `Abstract, Introduction, Methodology, Experiments, References` | Nhập dạng comma-separated. Precheck tìm section trong file. |
| **Scope keywords** | Từ khóa để kiểm tra paper có thuộc phạm vi hội nghị. | `LLM, Generative AI, NLP, AI Governance` | Paper thiếu liên quan có thể bị finding về scope. |
| **Banned Phrases** | Cụm từ không được xuất hiện. | `under review elsewhere, previously published` | Dùng để test deterministic finding. |
| **Require anonymized submissions** | Bắt buộc PDF ẩn danh tác giả. | Tick nếu double-blind | Nếu file có tên/affiliation tác giả, precheck có thể cảnh báo. |
| **Steering Prompt** | Hướng dẫn thêm cho AI/gating advisory. | `Flag unsupported claims and weak evaluation baselines.` | Tối đa khoảng 2000 ký tự. Không thay thế rule deterministic. |
| **Review Type - Double-blind** | Reviewer không biết tác giả, tác giả không biết reviewer. | Chọn cho hội nghị nghiên cứu nghiêm ngặt | Author phải ẩn tên trong PDF. |
| **Review Type - Single-blind** | Reviewer biết tác giả, tác giả không biết reviewer. | Chọn nếu hội nghị cho phép reviewer thấy author | Không yêu cầu author ẩn danh nghiêm như double-blind. |
| **Allow Supplementary Materials** | Cho nộp file phụ. | Tick để cho upload code/data | Nếu tắt, Author không nên upload supplementary. |
| **Allowed Types** | Loại file phụ được nhận. | `Source code`, `Datasets`, `Appendix`, `Video` | Dùng để kiểm tra UI upload file phụ. |

### Bước 4: Call for Papers

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **CFP Rich Text/Markdown Editor** | Nội dung công khai mời nộp bài. Author đọc phần này để hiểu hội nghị nhận gì. | Gồm `Overview`, `Topics of Interest`, `Submission Guidelines`, `Important Dates` | Nên viết đủ yêu cầu format, blind policy, page limit, deadline. |
| **Character count** | Số ký tự đã viết. | `1,250 characters` | Dùng kiểm tra editor nhận nội dung dài. |
| **Preview/live markdown** | Xem định dạng markdown. | Heading, bullet, table | Đảm bảo Author nhìn được dễ đọc ở Call for Papers tab. |

**Mẫu CFP nên nhập**

```markdown
## Overview
AIFT 2026 welcomes high-quality research on Generative AI, LLM systems, trustworthy AI, and enterprise AI applications.

## Topics of Interest
- Large Language Models
- Natural Language Processing
- AI Governance
- Human-AI Collaboration

## Submission Guidelines
- Main paper: up to 8 pages excluding references.
- Format: PDF.
- Review type: double-blind, remove author names from the manuscript.
- Keywords: 3-5 keywords.
```

### Bước 5: Committees

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Email search/input** | Tìm user đã có hoặc nhập email trực tiếp để mời. | `reviewer1@gmail.com` | Gõ từ 2 ký tự có thể hiện user search. |
| **Add directly** | Mời email chưa có tài khoản hoặc không tìm thấy. | `external.reviewer@uni.edu` | Tạo external invitation nếu backend hỗ trợ. |
| **Role** | Vai trò của người được mời. | `Reviewer`, `PC Member`, `Co-chair` | Role quyết định quyền trong hội nghị. |
| **Add/Invite** | Thêm người vào danh sách mời. | Mời `reviewer1@gmail.com` làm reviewer | Trùng email không được thêm duplicate. |
| **Pending** | Lời mời đã gửi/chưa accept. | Reviewer chưa bấm Accept | Sau reviewer accept, trạng thái phải đổi. |
| **Remove** | Gỡ người khỏi danh sách trước khi tạo hoặc trong edit nếu được phép. | Xóa email nhập nhầm | Không nên gỡ Chair chính. |

### Bước 6: Final Review

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Review summary cards** | Xem lại tất cả cấu hình đã nhập. | Basic info, dates, policies, committee | Dùng để bắt lỗi trước khi publish. |
| **Edit step** | Quay lại bước cụ thể để sửa. | Sửa deadline ở Step 2 | Sau sửa quay lại Final Review phải thấy dữ liệu mới. |
| **Confirmed checkbox** | Xác nhận cấu hình đúng và sẵn sàng tạo/publish. | Tick trước Create | Nếu chưa tick, Create có thể bị disable. |
| **Create Conference/Update Conference** | Gửi dữ liệu lên backend. | Bấm sau khi confirmed | Sau thành công vào trang chi tiết hội nghị. |
| **Save Template** | Lưu cấu hình thành template nếu đang ở template mode. | `Standard Tech Conference Template` | Template dùng để tạo hội nghị sau này. |

## 0.3. Giải thích Match Score và Match Details

Match score là điểm hệ thống dùng để giải thích vì sao một reviewer phù hợp hoặc không phù hợp với paper/conference. Người test cần mở **Match Details** để kiểm tra không chỉ điểm tổng mà cả lý do.

| Thành phần | Ý nghĩa | Ví dụ cụ thể | Cách đánh giá khi test |
| --- | --- | --- | --- |
| **Match Score** | Điểm phù hợp tổng quát, thường hiển thị dạng phần trăm hoặc số từ 0-100. | `95` cho `reviewer1@gmail.com` | Điểm cao khi reviewer có nhiều keyword trùng paper/conference. |
| **Matched Keywords** | Keyword trùng giữa paper/conference và hồ sơ reviewer. | Paper: `LLM`, `NLP`; Reviewer: `LLM`, `NLP` | Đây là lý do match mạnh nhất. Càng nhiều keyword quan trọng trùng, score càng cao. |
| **Paper-only Keywords** | Keyword có trong paper nhưng reviewer không có. | Paper có `Prompt Engineering`, reviewer không có | Cho thấy reviewer còn thiếu mảng nào. Không nhất thiết fail nếu vẫn có keyword chính. |
| **Reviewer-only Keywords** | Keyword reviewer có nhưng paper không dùng. | Reviewer có `Computer Vision` | Dùng để hiểu reviewer có chuyên môn phụ nhưng không liên quan paper. |
| **Shares N keywords** | Lý do tự động: reviewer chia sẻ N keyword với paper/conference. | `Shares 2 keywords: LLM, NLP` | Nên xuất hiện với auto match tốt. |
| **No keyword overlap** | Không có keyword trùng. | Reviewer chỉ có `Image Processing`, paper là `LLM` | Score thấp, không nên ưu tiên assign nếu còn reviewer khác. |
| **Auto-assign pass 1** | Lượt assign chính, chọn reviewer theo match tốt và không có COI. | `reviewer1@gmail.com` được chọn pass 1 | Đây là kết quả lý tưởng. |
| **Auto-assign pass 2 fallback** | Lượt fallback khi thiếu reviewer phù hợp, hệ thống chọn người ít xấu nhất/còn khả dụng. | Reviewer score `50` nhưng được chọn vì thiếu người | Cần Chair kiểm tra kỹ trước Confirm. |
| **Manual** | Reviewer do Chair thêm tay, không có score tính toán đầy đủ. | Chair tự assign external reviewer | Match Details có thể báo `Manually added by chair`. |
| **Reviewer Load** | Số bài reviewer đã được assign trong hội nghị. | `Assigned in this conference: 3` | Nếu load cao, dù match tốt cũng nên cân nhắc người khác. |
| **Self-author COI check** | Kiểm tra reviewer có phải tác giả/co-author của paper không. | `passed` hoặc `conflict_detected` | Nếu conflict, không assign. |
| **Declared conflicts check** | Kiểm tra reviewer có nằm trong COI do Author khai báo không. | Author khai báo `reviewer2@gmail.com` | Nếu conflict, không assign hoặc phải override có lý do. |
| **Relationship check** | Kiểm tra quan hệ graph/co-author/advisor trong quá khứ. | `author2@gmail.com` từng co-author với `reviewer2@gmail.com` | Nếu Neo4j unavailable, trạng thái có thể là skipped. |
| **Skipped graph database unavailable** | Không chạy được kiểm tra relationship vì graph DB không sẵn sàng. | `skipped_neo4j_unavailable` | Không kết luận là không có COI; Chair cần kiểm tra thủ công. |
| **Conflict detected** | Có xung đột lợi ích. | Reviewer là recent co-author | Hệ thống phải chặn/cảnh báo rõ. |

**Ví dụ đọc Match Details**

- `reviewer1@gmail.com`: score cao vì matched keywords `Generative AI`, `LLM`, `NLP`; COI checks đều `passed`; reviewer load thấp. Kết luận: nên assign.
- `reviewer2@gmail.com`: keyword có thể khớp `NLP`, nhưng relationship/declared conflict với `author2@gmail.com`. Kết luận: không assign.
- `reviewer3@gmail.com`: reviewer-only keywords `Computer Vision`, `Image Processing`, paper-only keywords `LLM`, `NLP`; no keyword overlap hoặc overlap thấp. Kết luận: chỉ dùng fallback nếu thiếu reviewer.

## 0.4. Bản đồ phụ thuộc flow cho Chair

Đây là phần quan trọng nhất để tránh bị kẹt khi test. Nhiều chức năng Chair không tự sinh dữ liệu; chúng phụ thuộc vào Author và Reviewer.

| Flow muốn test | Bắt buộc phải có trước | Role cần chạy trước | Nếu thiếu thì sẽ thấy gì |
| --- | --- | --- | --- |
| Tạo template | Chair đã đăng nhập và có quyền Chair | Chair | Không vào được trang template/conference. |
| Tạo hội nghị | Chair đã đăng nhập, có basic profile | Chair | Không tạo được hoặc thiếu quyền. |
| Publish hội nghị | Conference form có title/acronym/contact/dates tối thiểu và confirmed | Chair | Create/Publish disabled hoặc validation error. |
| Author nhìn thấy hội nghị | Hội nghị đã publish/open, không chỉ là draft | Chair | Author Conferences không thấy hội nghị. |
| Author submit paper | Hội nghị còn full paper deadline, policy hợp lệ | Chair trước, Author sau | Chair Submissions trống. |
| Mời reviewer thủ công | Reviewer email tồn tại hoặc external invitation được hỗ trợ | Chair + Reviewer account | Invitation pending mãi nếu reviewer không đăng nhập/accept. |
| Suggested Reviewers | Có user reviewer với domains/profile; conference có topics/domains | Reviewer profile + Chair conference | Danh sách gợi ý trống hoặc score thấp/không có evidence. |
| Reviewer accept invitation | Chair đã gửi invitation đúng email | Chair trước, Reviewer sau | Reviewer không thấy invitation, Chair committee vẫn pending. |
| Manual assign | Có paper submitted; có reviewer accepted/available; không bị COI chặn | Chair + Author + Reviewer | Nút assign không có reviewer hoặc báo conflict. |
| Auto-assign | Có hội nghị + ít nhất 1 paper submitted + reviewer đã accepted + topics/keywords đủ + assignment service chạy | Chair + Author + Reviewer + system | Auto-assign báo thiếu submissions/reviewers hoặc không tạo suggestion. |
| Xem Match Details | Assignment/suggestion có metadata từ auto-assign hoặc reviewer suggestion | Chair/system | Chỉ thấy no detailed breakdown hoặc manual/no computed score. |
| COI detection | Author khai báo conflict hoặc graph DB có relationship; reviewer/author data có email/profile | Author + Reviewer + system | COI checks passed/skipped, không detect được conflict mong muốn. |
| Theo dõi review progress | Reviewer đã accept assignment và submit/draft review | Reviewer | Progress là 0 hoặc pending. |
| Review Quality Audit | Reviewer đã submit hoặc thử submit review; audit service/rules hoạt động | Reviewer + system | Không có audit panel hoặc không có cảnh báo. |
| Mở rebuttal phase | Có review đã submit; dates rebuttal hợp lệ | Reviewer trước, Chair sau | Author không có review để phản hồi. |
| Xem rebuttal | Author đã gửi rebuttal trong phase mở | Author | Rebuttal panel trống. |
| Reviewer update score sau rebuttal | Author đã submit rebuttal; reviewer có assignment đã review | Author + Reviewer | Không có nút update score hoặc không có rebuttal để đọc. |
| Decision Copilot | Submission có review; tốt nhất có rebuttal; AI service chạy | Reviewer + optional Author + system | Copilot báo thiếu dữ liệu hoặc lỗi service. |
| Ra Accept/Reject | Submission tồn tại, thường đã đủ review; Chair có quyền | Author + Reviewer + Chair | Decision button bị khóa/cảnh báo chưa đủ review. |
| Camera-ready | Submission đã Accepted; camera-ready deadline/policy còn mở | Chair decision trước, Author sau | Author không thấy upload camera-ready. |
| Archive/completed conference | Hội nghị đã có trạng thái/phases phù hợp | Chair | Archive có thể bị chặn hoặc chỉ chuyển trạng thái. |

**Chuỗi test end-to-end khuyến nghị để có đủ dữ liệu**

1. **Chair setup:** đăng nhập Chair, tạo template nếu cần, tạo và publish hội nghị `AIFT 2026`, thêm topics/tracks/deadlines/policy.
2. **Reviewer setup:** đăng ký/cập nhật profile cho `reviewer1`, `reviewer2`, `reviewer3` với domains khác nhau.
3. **Chair invite:** mời 3 reviewer vào committee.
4. **Reviewer accept:** từng reviewer đăng nhập và accept invitation.
5. **Author setup:** đăng ký/cập nhật profile cho `author1`, `author2`.
6. **Author submit:** `author1` nộp paper, thêm `author2` làm co-author, khai báo COI với `reviewer2`.
7. **Chair assign:** chạy Suggested Reviewers/Auto-Assign, kiểm tra Match Details và COI, assign `reviewer1`.
8. **Reviewer review:** `reviewer1` submit review đầy đủ, test audit fail/pass nếu cần.
9. **Chair rebuttal:** bật rebuttal phase.
10. **Author rebuttal:** `author1` gửi rebuttal.
11. **Reviewer post-rebuttal:** reviewer đọc rebuttal và update score nếu cần.
12. **Chair decision:** dùng Decision Copilot, nhập meta-review, Accept/Reject.
13. **Author final:** xem decision, nếu Accepted thì nộp camera-ready.

**Bộ dữ liệu tối thiểu để test auto-assign**

- 1 hội nghị đã publish với topics: `Generative AI`, `LLM`, `NLP`.
- 1 paper đã submitted với keywords: `Generative AI`, `LLM`, `NLP`.
- Ít nhất 1 reviewer đã accepted committee invitation và có domains khớp, ví dụ `reviewer1@gmail.com` có `Large Language Models`, `Generative AI`, `NLP`.
- Nếu muốn test COI: thêm `author2@gmail.com` làm co-author và khai báo conflict với `reviewer2@gmail.com`, hoặc chuẩn bị relationship trong graph DB.
- Backend assignment service/AI service/graph DB đang chạy nếu muốn thấy đầy đủ score/evidence/COI.

## 0.5. Option seed nhanh thay vì chuẩn bị thủ công

Nếu người test không muốn tự tạo hội nghị, tạo reviewer, accept invitation và submit paper bằng tay, có thể chạy seed Python. Đây là lựa chọn nên dùng cho demo vì tránh bị kẹt ở các flow phụ thuộc dữ liệu.

**Yêu cầu trước khi chạy seed**

- Backend đang chạy ở `http://localhost:8080`.
- Frontend đang chạy ở `http://localhost:3000` để mở UI sau khi seed.
- Python có package `requests`. Nếu thiếu, cài bằng:

```powershell
pip install requests
```

**Các seed script nên dùng**

| Muốn demo/test | File seed nên chạy | Lệnh | Dữ liệu được tạo |
| --- | --- | --- | --- |
| Suggested Reviewers + Auto-Assign | `devtool/seeder/seed_two_conferences.py` | `python devtool/seeder/seed_two_conferences.py --base-url http://localhost:8080` | 1 Chair, 1 conference `SUG...` để test Suggested Reviewers, 1 conference `ASG...` có 8 reviewer accepted + 7 published submissions để test Auto-Assign ngay. |
| Match Details UI đầy đủ | `devtool/seeder/seed_reviewer_match_demo.py` | `python devtool/seeder/seed_reviewer_match_demo.py` | Conference có suggestion metadata: `auto_pass1`, `auto_pass2`, `manual`, matched keywords, paper-only, reviewer-only, COI checks. |
| Rebuttal phase | `devtool/seeder/seed_rebuttal_demo.py` | `python devtool/seeder/seed_rebuttal_demo.py --base-url http://localhost:8080` | Conference ở phase rebuttal, có 3 submission ở các trạng thái: author đã rebuttal, partial acknowledged, awaiting author response. |
| Reviewer Briefing | `devtool/seeder/seed_ai003_reviewer_briefing.py` | `python devtool/seeder/seed_ai003_reviewer_briefing.py --base-url http://localhost:8080` | 1 conference, 1 reviewer, 1 submission có PDF, 1 assignment confirmed để reviewer mở briefing. |

**Cách dùng output sau khi seed**

1. Chạy seed bằng lệnh ở bảng trên.
2. Đọc phần output cuối terminal. Script sẽ in:
   - Conference ID/acronym.
   - URL UI cần mở, ví dụ `/role/chair/conferences/{id}`.
   - Email/password của các account được tạo.
3. Mở frontend, đăng nhập bằng account Chair script in ra.
4. Vào đúng conference ID/acronym script in ra.
5. Test flow theo script:
   - Với auto-assign: mở conference `ASG...` → tab **Assignments** → bấm **Auto-Assign**.
   - Với suggested reviewers: mở conference `SUG...` → tab **Committee** → **Suggested Reviewers**.
   - Với rebuttal: mở URL Chair script in ra → tab **Rebuttal**.

**Lưu ý quan trọng**

- `seed_two_conferences.py` tạo dữ liệu mới mỗi lần chạy bằng timestamp, nên ít bị trùng.
- Nếu chạy trên Windows PowerShell, dùng `python` thay cho `python3` nếu máy không nhận `python3`.
- Nếu backend không ở `localhost:8080`, truyền lại `--base-url`.

**Mapping seed với các flow trong script Chair**

| Flow trong tài liệu này | Chuẩn bị thủ công | Seed thay thế |
| --- | --- | --- |
| Mời Suggested Reviewers | Tạo conference + tạo nhiều user reviewer có domains khác nhau | `seed_two_conferences.py`, dùng conference `SUG...` |
| Auto-Assign | Tạo conference + reviewer accepted + paper submitted | `seed_two_conferences.py`, dùng conference `ASG...` |
| Match Score/Match Details | Chạy auto-assign hoặc suggestion có metadata | `seed_reviewer_match_demo.py` |
| Rebuttal management | Reviewer submit review + Chair mở rebuttal + Author gửi rebuttal | `seed_rebuttal_demo.py` |
| Decision Copilot | Có submission đã có review | Chuẩn bị thủ công tới sau bước Reviewer review, hoặc dùng dữ liệu từ `seed_two_conferences.py` sau khi chạy/confirm auto-assign và có review |
| Reviewer Briefing | Có assignment confirmed và file PDF | `seed_ai003_reviewer_briefing.py` |

## 1. Đăng nhập và chọn vai trò Chair

**Mục đích:** đảm bảo Chair vào đúng dashboard quản trị.

**Các bước**

1. Mở website.
2. Đăng nhập bằng `chair@gmail.com`.
3. Ở trang `/role`, chọn **Chair**.
4. Quan sát sidebar.

**Kết quả mong đợi**

- Người dùng được đưa tới `/role/chair`.
- Sidebar có **Dashboard**, **Conferences**, **Schedules**, **Notifications**.
- Nếu tài khoản không có quyền Chair, hệ thống không cho vào role này.

## 2. Cập nhật hồ sơ Chair

**Mục đích:** thông tin Chair hiển thị đúng trong committee và thông báo hội nghị.

**Các bước**

1. Click tài khoản ở cuối sidebar.
2. Chọn **View Profile**.
3. Cập nhật tên, affiliation, domains.
4. Lưu lại.
5. Quay về `/role/chair`.

**Kết quả mong đợi**

- Hồ sơ lưu thành công.
- Tên Chair hiển thị đúng trong các khu vực liên quan.

## 3. Tạo và quản lý conference template

**Mục đích:** kiểm tra Chair có thể lưu cấu hình hội nghị để tái sử dụng.

**Các bước**

1. Vào **Conferences**.
2. Chọn **Manage Templates**.
3. Chọn tạo template mới.
4. Nhập tên template: `Standard Tech Conference Template`.
5. Điền các phần có trong form:
   - Basic information mặc định.
   - Tracks.
   - Important dates mẫu.
   - Review criteria/form nếu có.
   - Rebuttal/camera-ready setting nếu có.
6. Lưu template.
7. Mở lại **Manage Templates** để kiểm tra template vừa tạo.
8. Nếu có chức năng dùng template để tạo hội nghị, chọn template này.

**Kết quả mong đợi**

- Template được lưu.
- Có thể xem/chọn lại template.
- Khi dùng template, các trường cấu hình được prefill vào form tạo hội nghị.

## 4. Tạo hội nghị mới

**Mục đích:** khởi tạo hội nghị hoàn chỉnh.

**Các bước**

1. Vào **Conferences**.
2. Chọn **Create Conference**.
3. Nếu có template, chọn `Standard Tech Conference Template`.
4. Điền thông tin:
   - Full name: `International Conference on AI & Future Tech 2026`
   - Acronym: `AIFT`
   - Year: `2026`
   - Location: `Ho Chi Minh City, Vietnam`
   - Website/contact email nếu form có.
   - Description: mô tả ngắn về hội nghị AI.
   - Domains/Topics.
   - Tracks.
5. Điền **Call for Papers**:
   - Scope.
   - Topics of interest.
   - Submission guideline.
   - PDF/template requirement.
6. Điền **Important Dates**:
   - Abstract/full paper deadline.
   - Review deadline.
   - Notification date.
   - Conference start/end.
7. Chọn lưu:
   - **Save Draft** nếu muốn test draft conference.
   - **Publish/Create** nếu muốn mở cho Author thấy.

**Kết quả mong đợi**

- Hội nghị được tạo và xuất hiện trong **My Conferences**.
- Nếu lưu draft, hội nghị nằm ở tab **Drafts** và chưa mở cho Author theo chính sách.
- Nếu publish, Author có thể tìm thấy trong danh sách hội nghị.

## 5. Kiểm tra danh sách Conferences của Chair

**Mục đích:** quản lý nhiều hội nghị.

**Các bước**

1. Vào **Conferences**.
2. Kiểm tra các tab:
   - My Conferences.
   - Explore.
   - Drafts.
   - Archived.
3. Dùng search theo `AIFT`.
4. Dùng sort:
   - Date newest/upcoming.
   - Name A-Z.
   - Submissions high-low nếu có.
5. Mở menu more actions của một hội nghị.
6. Kiểm tra các thao tác như edit/archive nếu có.

**Kết quả mong đợi**

- Search/filter/sort hoạt động đúng.
- Hội nghị do Chair tạo nằm trong My Conferences.
- Hội nghị draft/archived hiển thị đúng tab.

## 6. Mở trang chi tiết hội nghị

**Mục đích:** kiểm tra toàn bộ tab quản trị của một hội nghị.

**Các bước**

1. Mở hội nghị `AIFT`.
2. Kiểm tra header:
   - Tên đầy đủ, acronym, year.
   - Location.
   - Conference dates.
   - Nút Settings/Edit.
3. Kiểm tra các tab:
   - Dashboard.
   - Overview.
   - Call for Papers.
   - Important Dates.
   - Committee.
   - Submissions.
   - Assignments.
   - COI.
   - Rebuttal.

**Kết quả mong đợi**

- Chair thấy đầy đủ tab quản trị.
- Tab restricted không hiển thị cho Author/Reviewer.
- Nút Settings đưa tới trang edit đúng hội nghị.

## 7. Chỉnh sửa hội nghị và cấu hình trạng thái

**Mục đích:** kiểm tra Chair cập nhật thông tin sau khi tạo.

**Các bước**

1. Trong chi tiết hội nghị, chọn **Settings/Edit**.
2. Sửa description hoặc deadline.
3. Lưu.
4. Quay lại chi tiết hội nghị.
5. Kiểm tra dữ liệu mới hiển thị.
6. Nếu có điều khiển trạng thái:
   - Draft.
   - Open/Active.
   - Submission closed.
   - Under review.
   - Completed/Archived.
7. Thử đổi trạng thái theo luồng hợp lệ.

**Kết quả mong đợi**

- Dữ liệu update thành công.
- Không cho nhập deadline vô lý nếu có validation.
- Trạng thái hội nghị ảnh hưởng đúng tới khả năng nộp bài của Author.

## 8. Quản lý Call for Papers và Important Dates

**Mục đích:** đảm bảo thông tin công khai cho Author đúng và dễ hiểu.

**Các bước**

1. Mở tab **Call for Papers**.
2. Kiểm tra nội dung đã nhập.
3. Nếu có editor, sửa guideline hoặc topic.
4. Lưu và kiểm tra bên Author thấy nội dung mới.
5. Mở tab **Important Dates**.
6. Kiểm tra các mốc:
   - Submission deadline.
   - Review deadline.
   - Rebuttal window.
   - Notification/final decision.
   - Camera-ready.
7. Kiểm tra hiển thị countdown/sắp đến hạn nếu có.

**Kết quả mong đợi**

- CFP hiển thị đúng cho Chair và Author.
- Important dates đồng bộ với Schedules.
- Deadline điều khiển đúng các nút submit/review/rebuttal.

## 9. Mời committee/reviewer thủ công

**Mục đích:** Chair thêm người phản biện vào hội nghị.

**Các bước**

1. Vào tab **Committee**.
2. Chọn **Invite Reviewer** hoặc thao tác tương đương.
3. Nhập `reviewer1@gmail.com`.
4. Chọn role nếu có: reviewer/PC/co-chair.
5. Gửi lời mời.
6. Lặp lại với:
   - `reviewer2@gmail.com`
   - `reviewer3@gmail.com`
7. Kiểm tra danh sách committee/invitations.
8. Đăng nhập từng reviewer để accept invitation.
9. Quay lại Chair và refresh tab Committee.

**Kết quả mong đợi**

- Lời mời ban đầu có trạng thái pending/invited.
- Sau khi reviewer accept, trạng thái chuyển accepted/active.
- Không tạo trùng invitation khi mời lại cùng email.

## 10. Mời reviewer bằng Suggested Reviewers

**Mục đích:** kiểm tra hệ thống gợi ý reviewer dựa trên chuyên môn.

**Các bước**

1. Trong tab **Committee**, mở phần **Suggested Reviewers**.
2. Chạy gợi ý nếu cần.
3. Quan sát danh sách:
   - Tên/email reviewer.
   - Affiliation.
   - Domains/keywords.
   - Match score.
   - Lý do match nếu có.
4. Click vào reviewer để xem profile.
5. Chọn reviewer phù hợp.
6. Bấm **Invite Selected**.

**Kết quả mong đợi**

- `reviewer1@gmail.com` có match score cao vì trùng LLM/Generative AI/NLP.
- `reviewer3@gmail.com` có match score thấp hơn vì Computer Vision không khớp.
- Hệ thống không gợi ý/invite người đã là committee một cách trùng lặp.

## 11. Theo dõi submissions của hội nghị

**Điều kiện:** Author đã submit bài theo script Author.

**Mục đích:** Chair xem và lọc bài nộp.

**Các bước**

1. Vào tab **Submissions**.
2. Kiểm tra danh sách bài:
   - Title.
   - Authors hoặc mã ẩn danh tùy chính sách.
   - Track.
   - Status.
   - Review progress.
3. Search theo title `Evaluating Generative AI`.
4. Lọc theo status/track nếu có.
5. Mở chi tiết submission.
6. Kiểm tra các tab trong chi tiết:
   - Reviews.
   - Discussion.
   - History.
   - Chair actions/decision panel.

**Kết quả mong đợi**

- Submission mới xuất hiện.
- Chair xem được metadata, file, authors/co-authors và declared conflicts.
- Review progress ban đầu là chưa đủ reviewer/chưa có review.

## 12. Kiểm tra COI

**Mục đích:** đảm bảo xung đột lợi ích được phát hiện trước khi phân công.

**Các bước**

1. Vào tab **COI** của hội nghị.
2. Kiểm tra declared conflicts từ Author.
3. Kiểm tra relationship COI nếu hệ thống có graph/semantic scholar:
   - `author2@gmail.com` có quan hệ với `reviewer2@gmail.com`.
4. Mở submission có co-author `author2@gmail.com`.
5. Thử assign `reviewer2@gmail.com`.
6. **Test xuất dữ liệu:** Tại tab COI, tìm và nhấn nút **Export Report** để xuất báo cáo Xung đột lợi ích ra file lưu trữ. Kiểm tra file được tải xuống thành công.

**Kết quả mong đợi**

- Hệ thống cảnh báo COI giữa co-author và reviewer.
- Chair không thể assign reviewer có COI hoặc phải override có lý do nếu hệ thống cho phép.
- COI warning đủ rõ để người test hiểu vì sao bị chặn.

## 13. Phân công reviewer thủ công

**Mục đích:** Chair tự chọn reviewer cho từng bài.

**Các bước**

1. Vào tab **Assignments** hoặc mở chi tiết submission.
2. Chọn paper cần assign.
3. Mở danh sách reviewer available.
4. Chọn `reviewer1@gmail.com`.
5. Chọn thêm reviewer khác nếu cần.
6. Lưu assignment.
7. Kiểm tra trạng thái assignment.
8. Đăng nhập reviewer để kiểm tra bài xuất hiện ở dashboard.

**Kết quả mong đợi**

- Assignment được tạo.
- Submission chuyển sang **Under Review** hoặc trạng thái tương đương.
- Reviewer được thông báo hoặc thấy bài trong dashboard.

## 14. Phân công bằng Auto-Assign

**Mục đích:** kiểm tra AI/thuật toán tự ghép reviewer theo keyword, workload và COI.

**Các bước**

1. Vào tab **Assignments**.
2. Chọn **Auto-Assign**.
3. Cấu hình nếu có:
   - Số reviewer mỗi bài.
   - Track.
   - Tránh COI.
   - Cân bằng workload.
4. Chạy auto-assign.
5. Xem preview/kết quả đề xuất.
6. Kiểm tra lý do match:
   - Keyword overlap.
   - Domain match.
   - Workload.
   - COI excluded.
7. Confirm assignment.

**Kết quả mong đợi**

- `reviewer1@gmail.com` được ưu tiên cho bài Generative AI/LLM.
- `reviewer2@gmail.com` bị loại/cảnh báo nếu có COI.
- `reviewer3@gmail.com` ít được chọn nếu không đủ khớp chuyên môn.
- Sau confirm, assignment thật được tạo.

## 15. Theo dõi tiến độ review

**Mục đích:** Chair biết reviewer nào đã hoàn thành.

**Các bước**

1. Vào tab **Dashboard** hoặc **Submissions**.
2. Kiểm tra card/analytics:
   - Tổng submissions.
   - Pending reviews.
   - Completed reviews.
   - Pending decisions.
3. Mở một submission.
4. Kiểm tra từng assignment:
   - Reviewer.
   - Status.
   - Score/recommendation.
   - Submitted at.
5. Nếu reviewer chưa review, kiểm tra reminder nếu hệ thống có.

**Kết quả mong đợi**

- Progress cập nhật sau khi reviewer submit.
- Chair thấy confidential remarks.
- Author không thấy confidential remarks.

## 16. Xem review và dùng Review Quality Audit

**Mục đích:** Chair đánh giá chất lượng review trước khi ra quyết định.

**Các bước**

1. Mở submission đã có review.
2. Đọc từng review:
   - Score/recommendation.
   - Confidence.
   - Strengths.
   - Weaknesses.
   - Comments to Author.
   - Confidential Remarks to Chair.
3. Kiểm tra panel **Review Quality Audit** nếu có.
4. Với review quá ngắn, kiểm tra hệ thống có warning.
5. Với review tốt, kiểm tra audit pass hoặc không có cảnh báo blocker.

**Kết quả mong đợi**

- Chair đọc được toàn bộ review, bao gồm phần confidential.
- Audit giúp phát hiện review sơ sài.
- Review status/progress thống nhất với danh sách submissions.

## 17. Quản lý discussion nội bộ

**Mục đích:** Chair trao đổi với reviewer/author theo đúng phạm vi.

**Các bước**

1. Mở chi tiết submission.
2. Vào tab **Discussion**.
3. Tạo thread mới:
   - Tiêu đề: `Clarify evaluation concerns`
   - Nội dung: câu hỏi hoặc chỉ đạo cho reviewer.
4. Chọn visibility nếu có:
   - Internal only.
   - Reviewer only.
   - Author-visible.
5. Gửi message.
6. Đăng nhập reviewer/author để kiểm tra ai thấy thread.

**Kết quả mong đợi**

- Thread hiển thị đúng theo visibility.
- Chair có thể theo dõi trao đổi.
- Nội dung internal không lộ cho Author.

## 18. Mở và quản lý Rebuttal Phase

**Mục đích:** cho Author phản hồi review trước quyết định cuối cùng.

**Các bước**

1. Vào tab **Rebuttal** của hội nghị.
2. Bật **Enable Rebuttal Phase**.
3. Thiết lập:
   - Start date/time.
   - End date/time.
   - Hướng dẫn phản hồi.
   - Có cho point-by-point reply hay không nếu có tùy chọn.
4. Lưu cấu hình.
5. Đăng nhập Author, gửi rebuttal theo script Author.
6. Quay lại Chair, mở submission.
7. Kiểm tra rebuttal:
   - General response.
   - Point-by-point replies.
   - Trạng thái submitted.
8. Theo dõi reviewer update score sau rebuttal.

**Kết quả mong đợi**

- Author chỉ gửi rebuttal trong thời gian mở.
- Chair xem được rebuttal và lịch sử thay đổi score.
- Sau end date, rebuttal form bị khóa.

## 19. Dùng Chair Decision Copilot

**Mục đích:** kiểm tra AI hỗ trợ Chair tổng hợp review và đề xuất quyết định.

**Điều kiện:** submission đã có review, tốt nhất có thêm rebuttal.

**Các bước**

1. Mở chi tiết submission.
2. Tìm panel **Chair Decision Copilot** hoặc **Chair Actions**.
3. Chọn tạo phân tích/tóm tắt.
4. Chờ AI xử lý.
5. Đọc kết quả:
   - Summary of strengths.
   - Summary of weaknesses.
   - Reviewer disagreement nếu có.
   - Rebuttal impact nếu có.
   - Risk/concerns.
   - Suggested decision.
   - Draft meta-review nếu có.
6. So sánh kết quả AI với review gốc.
7. Không chấp nhận máy móc; chỉnh lại meta-review theo quyết định của Chair.

**Kết quả mong đợi**

- Copilot tạo được summary hữu ích.
- Nếu AI service lỗi, giao diện báo lỗi thân thiện và Chair vẫn có thể ra quyết định thủ công.
- AI không tự ra quyết định cuối nếu Chair chưa xác nhận.

## 20. Ra quyết định Accept/Reject

**Mục đích:** hoàn tất vòng review của một submission.

**Các bước**

1. Mở submission đã đủ review.
2. Đọc lại:
   - Review score.
   - Confidential remarks.
   - Rebuttal.
   - Copilot summary.
3. Trong panel decision, chọn:
   - **Accept** nếu bài được nhận.
   - **Reject** nếu bài bị từ chối.
4. Nhập **Meta-review**:
   - Tóm tắt lý do.
   - Nêu điểm mạnh/yếu chính.
   - Nếu reject, giải thích chuyên nghiệp.
   - Nếu accept, nêu yêu cầu sửa trước camera-ready nếu có.
5. Xác nhận quyết định.
6. Quay lại danh sách submissions.

**Kết quả mong đợi**

- Submission chuyển sang **Accepted** hoặc **Rejected**.
- Pending decisions giảm.
- Author thấy final decision và meta-review.
- Review flow bị khóa theo chính sách sau quyết định.

## 21. Quản lý camera-ready cho bài accepted

**Mục đích:** kiểm tra Chair yêu cầu và theo dõi bản cuối.

**Các bước**

1. Đảm bảo submission đã **Accepted**.
2. Trong cấu hình hội nghị hoặc tab Rebuttal/Dates, bật camera-ready nếu có.
3. Đặt camera-ready deadline.
4. Đăng nhập Author và upload camera-ready.
5. Quay lại Chair.
6. Mở submission accepted.
7. Kiểm tra:
   - File camera-ready.
   - Submitted at.
   - Note/changelog từ Author nếu có.
8. Nếu có verify/approve camera-ready, thực hiện duyệt.

**Kết quả mong đợi**

- Chair thấy file camera-ready.
- File tải được.
- Trạng thái camera-ready cập nhật đúng.
- Bài rejected không yêu cầu camera-ready.

## 22. Kiểm tra Schedules và Notifications

**Mục đích:** Chair theo dõi deadline, lời mời, review và quyết định.

**Các bước**

1. Vào **Schedules**.
2. Kiểm tra các mốc hội nghị do Chair quản lý.
3. Vào **Notifications**.
4. Kiểm tra thông báo:
   - Reviewer accept/decline invitation.
   - New submission.
   - Review submitted.
   - Rebuttal submitted.
   - Deadline sắp tới.
5. Click notification để kiểm tra điều hướng.
6. Đánh dấu đã đọc.

**Kết quả mong đợi**

- Deadline hiển thị đúng.
- Notification badge cập nhật đúng.
- Click notification mở đúng hội nghị/submission.

## 23. Kiểm thử phân quyền Chair, Co-chair và PC nếu có

**Mục đích:** đảm bảo quyền quản trị không bị lộ cho người không phù hợp.

**Checklist**

- Chair xem/sửa được hội nghị mình tạo.
- Chair không sửa được hội nghị không có quyền nếu hệ thống giới hạn ownership.
- Co-chair nếu có quyền: xem/quản lý được các tab được cấp.
- PC/read-only role: xem được thông tin cần thiết nhưng không thấy nút edit/decision nếu không được phép.
- Reviewer không thấy tab Assignments/COI/Decision của Chair.
- Author không thấy confidential remarks và dữ liệu reviewer nội bộ.

## 24. Kiểm thử lỗi và trường hợp biên

**Checklist**

- Tạo hội nghị thiếu title/acronym: có validation.
- Nhập deadline end trước start: bị chặn.
- Mời email sai định dạng: bị chặn.
- Mời trùng reviewer: không tạo duplicate.
- Auto-assign khi chưa có reviewer accepted: báo thiếu dữ liệu.
- Auto-assign khi chưa có submission: báo thiếu dữ liệu.
- Assign reviewer có COI: bị chặn hoặc yêu cầu override reason.
- Ra quyết định khi chưa đủ review: bị chặn hoặc cảnh báo rõ.
- Bật rebuttal khi chưa có review: hệ thống cảnh báo.
- Gọi AI copilot khi AI service lỗi: không crash trang.
- Archive hội nghị: hội nghị chuyển sang Archived và không còn hoạt động như hội nghị open.

## 25. Kết luận pass/fail cho role Chair

Role Chair được xem là **pass** khi:

- Tạo template và hội nghị được.
- Cấu hình CFP, dates, status và settings đúng.
- Mời reviewer thủ công và bằng suggested reviewers được.
- Xem submission, kiểm tra COI, assign thủ công/auto-assign được.
- Theo dõi review, audit review quality, discussion và rebuttal được.
- Dùng Chair Decision Copilot được hoặc fallback thủ công khi AI lỗi.
- Ra quyết định Accept/Reject và Author xem được meta-review.
- Theo dõi camera-ready, schedules và notifications hoạt động đúng.

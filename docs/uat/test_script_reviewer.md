# Script kiểm thử & hướng dẫn sử dụng - Role REVIEWER

Tài liệu này dành cho người lần đầu dùng ConferenceSpace với vai trò **Reviewer/Người phản biện**. Script đi từ nhận lời mời, xem bài được phân công, dùng AI hỗ trợ đọc bài, viết review, kiểm tra chất lượng review, phản hồi rebuttal và xem lịch/thông báo.

## 0. Chuẩn bị trước khi test

**Tài khoản đề xuất**

- Reviewer phù hợp nhất: `reviewer1@gmail.com` / `Demo@123`
- Reviewer có COI để test cảnh báo: `reviewer2@gmail.com` / `Demo@123`
- Reviewer lệch chuyên môn: `reviewer3@gmail.com` / `Demo@123`

**Điều kiện hệ thống**

- Chair đã tạo hội nghị.
- Reviewer đã được mời vào committee hoặc được mời chấm một paper cụ thể.
- Có ít nhất một submission đã được Chair phân công cho reviewer.

### Smoke test môi trường và production

Trước khi chạy các bước nghiệp vụ, chọn một môi trường cố định cho cả phiên test:

- Local: mở frontend ở `http://localhost:3000`, backend ở `http://localhost:8080`.
- Production: mở `https://conference-space.com` và kiểm tra `https://www.conference-space.com` cũng truy cập được.

**Checklist**

- Trang login/role load được qua HTTPS, không có cảnh báo certificate hoặc mixed content.
- Sau khi đăng nhập, các request invitation/assignment đi qua `/api/backend/...` và không bị lỗi 404/CORS.
- Notification realtime nếu có dùng `wss://conference-space.com/ws/...` ở production, không còn hardcode `localhost`.
- Microsoft Clarity script `https://www.clarity.ms/tag/wr08flgvt4` được tải sau khi trang interactive và không chặn accept invitation/review nếu request analytics bị block bởi ad blocker.

**Dữ liệu review mẫu**

- Recommendation: `Accept` hoặc `Borderline Accept`
- Confidence: `High`
- Strengths: bài có chủ đề thực tế, đóng góp rõ về ứng dụng LLM trong doanh nghiệp, phần đánh giá có nhiều tiêu chí.
- Weaknesses: cần mô tả dataset rõ hơn, cần bổ sung threat to validity, cần so sánh thêm baseline.
- Confidential remarks: bài có tiềm năng, nên yêu cầu tác giả làm rõ quy trình đánh giá trước khi accept cuối cùng.

## 0.1. Giải thích field đăng ký/đăng nhập cho Reviewer

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **First Name** | Tên reviewer hiển thị trong profile/committee nội bộ. | `Pham` | Author thường không thấy tên nếu double-blind. |
| **Last Name** | Họ hoặc phần tên còn lại. | `Reviewer One` | Chair dùng để nhận diện khi mời/assign. |
| **Email** | Tài khoản đăng nhập và địa chỉ nhận invitation. | `reviewer1@gmail.com` | Phải trùng email Chair đã mời để thấy invitation. |
| **Domains** | Chuyên môn reviewer, là dữ liệu quan trọng nhất cho matching. | `Large Language Models`, `Generative AI`, `NLP` | Nếu domain không khớp paper, match score sẽ thấp. |
| **Password/Confirm Password** | Mật khẩu. | `Demo@123` | Phải đủ rule bảo mật. |
| **Remember me** | Giữ phiên đăng nhập. | Tick khi test dài | Không thay đổi assignment/review data. |

## 0.2. Giải thích field lời mời Reviewer

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Conference title/acronym** | Hội nghị gửi lời mời. | `AIFT 2026` | Reviewer cần biết mình được mời cho hội nghị nào. |
| **Invitation type** | Loại lời mời. | `Committee Invitation` hoặc `Paper Invitation` | Committee là tham gia hội đồng; Paper là mời chấm bài cụ thể. |
| **Role** | Vai trò được mời. | `Reviewer`, `PC Member` | Quyết định reviewer thấy menu/chức năng nào. |
| **Paper title/abstract** | Thông tin tóm tắt bài nếu là paper invitation. | `Evaluating Generative AI...` | Reviewer dùng để quyết định có đủ chuyên môn không. |
| **Deadline** | Hạn phản hồi/chấm bài. | `2026-07-01 23:59` | Quá hạn có thể không accept/submit được. |
| **COI warning** | Cảnh báo xung đột lợi ích nếu hệ thống phát hiện. | `Conflict detected with co-author` | Nếu có COI, reviewer nên Decline với reason conflict_of_interest. |
| **Preview** | Xem nhanh thông tin trước khi accept/decline. | Mở abstract/paper metadata | Không tính là accept. |
| **Accept** | Đồng ý tham gia/chấm bài. | Bấm khi đủ chuyên môn và không COI | Sau accept, assignment/conference xuất hiện trong dashboard. |
| **Decline** | Từ chối lời mời. | Bấm khi bận hoặc có COI | Cần chọn reason nếu dialog yêu cầu. |
| **Decline reason: not_my_expertise** | Không đúng chuyên môn. | Paper LLM nhưng reviewer Computer Vision | Dữ liệu giúp Chair mời người khác. |
| **Decline reason: too_busy** | Reviewer quá tải. | Đang có 5 bài cần review | Có thể ảnh hưởng workload management. |
| **Decline reason: schedule_conflict** | Vướng lịch/deadline. | Đi công tác đúng review period | Khác với too_busy vì lý do thời gian cụ thể. |
| **Decline reason: conflict_of_interest** | Có xung đột lợi ích. | Là co-author/advisor/cùng dự án với tác giả | Đây là lý do nghiêm trọng, Chair cần thấy rõ. |
| **Decline reason: other** | Lý do khác. | `I am unavailable due to medical leave.` | Nên nhập ghi chú nếu UI có ô note. |

## 0.3. Giải thích chi tiết review form

Review tốt phải giúp Chair ra quyết định và giúp Author cải thiện paper. Người test cần nhập nội dung cụ thể, không chỉ “good paper”.

### Điểm tiêu chí 1-10

| Criterion | Ý nghĩa | Ví dụ khi cho điểm cao | Ví dụ khi cho điểm thấp |
| --- | --- | --- | --- |
| **Originality** | Mức độ mới của ý tưởng/đóng góp. | Paper đề xuất cách đánh giá LLM mới trong enterprise workflow. | Paper chỉ áp dụng kỹ thuật có sẵn, không có insight mới. |
| **Technical Quality** | Độ chắc chắn kỹ thuật: mô hình, thí nghiệm, phân tích. | Có baseline, ablation, thống kê lỗi, setup rõ. | Thiếu baseline, metric không rõ, kết luận vượt dữ liệu. |
| **Clarity** | Độ rõ ràng của trình bày. | Cấu trúc tốt, figure/table dễ hiểu. | Viết mơ hồ, thiếu định nghĩa, section lộn xộn. |
| **Significance** | Tầm quan trọng với cộng đồng/hội nghị. | Giải quyết vấn đề thực tế lớn, tác động rõ. | Đóng góp nhỏ, ít liên quan scope hội nghị. |
| **Methodology** | Chất lượng phương pháp nghiên cứu. | Quy trình thu thập dữ liệu, evaluation protocol, threat analysis rõ. | Không mô tả dataset, không nói cách chọn sample, không có kiểm chứng. |

**Thang điểm gợi ý**

| Điểm | Diễn giải | Khi nào dùng |
| --- | --- | --- |
| 1-2 | Poor/Weak | Có lỗi nghiêm trọng, không đủ chất lượng review. |
| 3-4 | Below average/Fair | Có ý tưởng nhưng nhiều thiếu sót lớn. |
| 5 | Borderline | Lưỡng lự, cần Chair cân nhắc hoặc rebuttal. |
| 6-7 | Acceptable/Good | Đủ tốt, còn một số điểm cần sửa. |
| 8-9 | Strong/Excellent | Đóng góp rõ, kỹ thuật tốt, ít điểm yếu. |
| 10 | Outstanding | Rất xuất sắc, nên nhận mạnh. |

### Field phản hồi bằng chữ

| Field | Ý nghĩa | Ví dụ cụ thể nên nhập | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Summary of Contribution** | Tóm tắt bài bằng lời reviewer để chứng minh đã hiểu paper. | `The paper studies how LLM agents can automate enterprise workflows and evaluates them across accuracy, latency, and governance dimensions.` | Không nên copy abstract nguyên văn. |
| **Strengths** | Điểm mạnh cụ thể. | `The topic is timely; the paper compares multiple prompting strategies; the discussion of governance risks is useful for practitioners.` | Nên nêu ít nhất 2-3 ý. |
| **Weaknesses** | Hạn chế cụ thể tác giả cần xử lý. | `The dataset construction is underspecified; baseline selection is weak; no statistical significance test is reported.` | Đây là phần Author sẽ rebuttal, cần rõ ràng và công bằng. |
| **Questions for Authors** | Câu hỏi cho rebuttal. | `How were enterprise workflow samples selected? Did you evaluate robustness across domains?` | Nên hỏi câu có thể trả lời, không hỏi mơ hồ. |
| **Comments to Author** | Nhận xét tổng hợp tác giả sẽ thấy. | `I lean positive, but the paper needs a clearer dataset description and stronger baseline comparison.` | Không viết thông tin bí mật hoặc danh tính reviewer. |
| **Confidential Remarks to Chair** | Nhận xét riêng Chair thấy, Author không thấy. | `I recommend borderline accept if the rebuttal clarifies dataset construction.` | Dùng để nói rủi ro, nghi ngờ ethical issue, hoặc khuyến nghị riêng. |
| **Recommendation/Score** | Kết luận tổng thể. | `Borderline Accept` | Phải nhất quán với điểm tiêu chí và phần chữ. |
| **Confidence** | Mức tự tin của reviewer về đánh giá. | `High` nếu đúng chuyên môn LLM/NLP | Nếu không đúng chuyên môn, chọn thấp và giải thích. |
| **Save Draft** | Lưu review chưa gửi. | Dùng khi viết dở | Chair chưa nên tính là completed. |
| **Submit Review** | Gửi review chính thức. | Bấm khi đã kiểm tra đủ | Sau submit, review có thể bị khóa. |

**Ví dụ review hợp lệ**

- Summary: `The paper investigates enterprise LLM automation and compares prompting strategies across workflow categories.`
- Strengths: `The problem is timely; the paper covers practical deployment risks; the evaluation includes multiple enterprise scenarios.`
- Weaknesses: `The dataset construction is unclear; the baseline systems are not sufficiently described; the paper lacks an ablation on prompt design choices.`
- Questions: `Can the authors clarify how workflows were sampled and whether any sensitive data was removed?`
- Confidential remarks: `I lean borderline accept if the rebuttal provides convincing details on dataset construction.`

## 0.4. Giải thích Review Quality Audit

| Tín hiệu audit | Ý nghĩa | Ví dụ fail | Cách sửa để pass |
| --- | --- | --- | --- |
| **Too short** | Nội dung quá ngắn, không đủ cơ sở cho quyết định. | `Good paper. Accept.` | Viết summary, strengths, weaknesses cụ thể. |
| **Missing methodology analysis** | Không đánh giá phương pháp/thí nghiệm. | Chỉ nói `interesting idea` | Nêu dataset, baseline, metric, protocol. |
| **No actionable weakness** | Weakness chung chung, Author không biết sửa gì. | `Needs improvement.` | Viết `Add baseline X and describe sample selection.` |
| **Inconsistent recommendation** | Điểm và lời nhận xét mâu thuẫn. | Score 9 nhưng weakness rất nghiêm trọng | Điều chỉnh score hoặc giải thích rõ. |
| **Potentially unprofessional tone** | Ngôn ngữ công kích/thiếu học thuật. | `The authors clearly do not understand...` | Viết trung lập, tập trung vào paper. |

## 0.5. Bản đồ phụ thuộc flow cho Reviewer

Reviewer là role phụ thuộc nhiều vào dữ liệu từ Chair. Nếu Chair chưa mời hoặc chưa assign bài, dashboard reviewer sẽ không có gì để test.

| Flow muốn test | Bắt buộc phải có trước | Ai tạo dữ liệu đó | Nếu thiếu thì sẽ thấy gì |
| --- | --- | --- | --- |
| Vào role Reviewer | Tài khoản có quyền reviewer hoặc được hệ thống cho chọn role reviewer | Register/profile | Không thấy thẻ Reviewer hoặc bị chặn. |
| Xem Invitations | Chair đã gửi invitation tới đúng email reviewer | Chair | Trang Invitations trống. |
| Accept committee invitation | Có invitation pending | Chair | Không có nút Accept hoặc invitation đã xử lý trước đó. |
| Decline invitation | Có invitation pending chưa accept | Chair | Không thể decline invitation đã accepted/submitted. |
| Xem Conferences | Reviewer đã accept committee invitation | Chair + Reviewer | Conferences trống. |
| Xem assigned papers | Chair đã assign paper cho reviewer hoặc gửi paper invitation đã accept | Chair + Author | Dashboard/Assignments không có bài. |
| Download manuscript | Paper đã submitted và reviewer được assign | Author + Chair | Không có file hoặc bị 403 nếu không có quyền. |
| AI Reviewer Briefing | Assignment tồn tại, file/paper metadata có đủ, AI service chạy | Author + Chair + system | Panel báo lỗi service hoặc không tạo briefing. |
| Annotation | Assignment tồn tại, file đọc được, annotation service/table chạy | Author + Chair + system | Không lưu được ghi chú hoặc panel trống. |
| Save Draft Review | Assignment active, review deadline chưa khóa | Chair + Reviewer | Nút Save Draft bị khóa hoặc báo deadline. |
| Submit Review | Review form đủ score/comment; assignment active; deadline hợp lệ | Chair + Reviewer | Validation error hoặc submit bị chặn. |
| Review Quality Audit | Reviewer submit nội dung review; audit service/rules chạy | Reviewer + system | Không có cảnh báo audit hoặc audit lỗi. |
| Completed Reviews | Reviewer đã submit ít nhất một review | Reviewer | Tab Completed trống. |
| Đọc Author rebuttal | Chair đã mở rebuttal phase và Author đã gửi rebuttal | Chair + Author | Rebuttal tab trống hoặc form update score chưa mở. |
| Update score sau rebuttal | Reviewer đã submit review trước đó; Author đã rebuttal; phase còn mở | Reviewer + Author + Chair | Không có nút Update Score hoặc bị khóa do phase đóng. |
| Discussion | Assignment/submission có thread và reviewer được phép thấy | Chair/Reviewer/Author | Không thấy thread hoặc không gửi được message. |
| Notifications/Schedules | Có invitation/assignment/deadline liên quan | Chair + system | Badge bằng 0 hoặc danh sách trống. |

**Thứ tự test Reviewer khuyến nghị**

1. Chair tạo/publish hội nghị.
2. Chair mời reviewer đúng email.
3. Reviewer đăng nhập, cập nhật profile domains.
4. Reviewer accept invitation.
5. Author submit paper.
6. Chair assign paper cho reviewer.
7. Reviewer mở assignment, download paper, tạo briefing/annotation nếu có.
8. Reviewer save draft review.
9. Reviewer submit review.
10. Chair mở rebuttal phase.
11. Author gửi rebuttal.
12. Reviewer đọc rebuttal và update score.

## 0.6. Option seed nhanh cho Reviewer

Reviewer thường không thể tự tạo dữ liệu để test, vì assignment phải đến từ Chair. Nếu muốn vào thẳng màn hình có việc để làm, chạy seed tương ứng trước.

| Flow Reviewer muốn test | Seed nên chạy | Lệnh | Account/đường dẫn sau khi seed |
| --- | --- | --- | --- |
| Dashboard có assignment và reviewer briefing | `devtool/seeder/seed_ai003_reviewer_briefing.py` | `python devtool/seeder/seed_ai003_reviewer_briefing.py --base-url http://localhost:8080` | Script in `Reviewer`, `Password`, `Review URL`. Đăng nhập reviewer đó và mở URL. |
| Rebuttal tab, acknowledge/update score | `devtool/seeder/seed_rebuttal_demo.py` | `python devtool/seeder/seed_rebuttal_demo.py --base-url http://localhost:8080` | Đăng nhập `demo_rebuttal_reviewer_1-4@test.com` với password `Demo@12345`; script in submission states và demo steps. |
| Auto-assignment tạo sẵn reviewer accepted + papers | `devtool/seeder/seed_two_conferences.py` | `python devtool/seeder/seed_two_conferences.py --base-url http://localhost:8080` | Dùng account reviewer script in ra cho conference `ASG...`; nếu Chair đã chạy Auto-Assign thì reviewer sẽ thấy assignments. |
**Cách dùng output seed**

1. Chạy seed.
2. Copy email/password được in ở cuối terminal.
3. Đăng nhập frontend.
4. Chọn role **Reviewer**.
5. Nếu script in direct review URL, mở URL đó để vào thẳng assignment.

**Lưu ý**

- Nếu dùng `seed_two_conferences.py`, conference `ASG...` đã có reviewer accepted và submissions published, nhưng reviewer chỉ thấy assignment sau khi Chair vào tab Assignments và chạy/confirm Auto-Assign nếu script chưa confirm sẵn theo UI mong muốn.
- Nếu muốn test Invitation accept/decline bằng tay, không dùng seed đã auto-accept reviewer; hãy dùng flow thủ công hoặc conference `SUG...` để mời từ Suggested Reviewers.

## 1. Đăng nhập và chọn vai trò Reviewer

**Mục đích:** đảm bảo reviewer vào đúng dashboard và có menu cần thiết.

**Các bước**

1. Mở website.
2. Đăng nhập bằng tài khoản reviewer.
3. Ở trang `/role`, chọn **Reviewer**.
4. Quan sát sidebar.

**Kết quả mong đợi**

- Người dùng được đưa tới `/role/reviewer`.
- Sidebar có **Dashboard**, **Conferences**, **Invitations**, **Completed**, **Schedules**, **Notifications**.
- Nếu tài khoản chưa có quyền reviewer, hệ thống không cho vào role hoặc không hiển thị thẻ Reviewer.

## 2. Cập nhật hồ sơ chuyên môn

**Mục đích:** Chair và hệ thống matching dùng hồ sơ chuyên môn để mời/assign bài phù hợp.

**Các bước**

1. Click tài khoản ở cuối sidebar.
2. Chọn **View Profile**.
3. Cập nhật affiliation/organization.
4. Cập nhật research domains/keywords:
   - Với `reviewer1@gmail.com`: `Large Language Models`, `Generative AI`, `NLP`.
   - Với `reviewer2@gmail.com`: `Deep Learning`, `NLP`.
   - Với `reviewer3@gmail.com`: `Computer Vision`, `Image Processing`.
5. **Liên kết danh tính học thuật (Semantic Scholar):** Dán URL hồ sơ hoặc mã Author ID Semantic Scholar của bạn (Ví dụ: `https://www.semanticscholar.org/author/1234567`) để hệ thống đồng bộ công trình, hỗ trợ AI Matching nhận diện chuyên môn chính xác hơn.
6. Lưu hồ sơ.
7. Reload profile và kiểm tra domains/keywords từ Semantic Scholar được merge với keyword đã nhập tay, không ghi đè mất dữ liệu cũ.
8. Quay lại role Reviewer.

**Kết quả mong đợi**

- Hồ sơ lưu thành công.
- Các keyword hiển thị lại sau refresh.
- Keyword/domain sau sync được merge ổn định, giúp Suggested Reviewers/Auto Assign có thêm evidence.
- Dữ liệu này có thể được Chair dùng trong Suggested Reviewers/Auto Assign.

## 3. Xem và xử lý lời mời

**Mục đích:** kiểm thử reviewer nhận/decline lời mời tham gia hội nghị hoặc lời mời chấm bài.

**Các bước**

1. Vào **Invitations**.
2. Kiểm tra danh sách lời mời:
   - Committee invitation: mời vào hội đồng của hội nghị.
   - Paper invitation: mời chấm một bài cụ thể.
3. Mở một lời mời.
4. Đọc thông tin:
   - Tên hội nghị.
   - Vai trò được mời.
   - Deadline review.
   - Paper title/abstract nếu là paper invitation.
   - Conflict of Interest warning nếu có.
5. Chọn **Accept** với lời mời cần tham gia.
6. Với một lời mời test khác, chọn **Decline** nếu có:
   - Chọn lý do: not my expertise, too busy, schedule conflict, conflict of interest hoặc other.
   - Nhập ghi chú nếu form yêu cầu.
   - Xác nhận decline.

**Kết quả mong đợi**

- Accept chuyển lời mời sang trạng thái accepted và hội nghị xuất hiện trong **Conferences**.
- Decline lưu lý do từ chối và không tạo assignment active.
- Nếu reviewer đã accept/decline, thao tác lại không tạo bản ghi trùng.

### 3.1. Accept lời mời khi chưa có tài khoản

**Mục đích:** kiểm tra luồng external invitation tạo tài khoản reviewer mới từ link mời.

**Các bước**

1. Dùng link invitation được Chair gửi cho email chưa có tài khoản, mở ở trình duyệt incognito.
2. Kiểm tra form hiển thị thông tin được prefill: email, tên, role và conference/paper liên quan.
3. Nếu lời mời đến từ Semantic Scholar, kiểm tra fields of study/profile link hiển thị hoặc được lưu sau accept.
4. Nhập mật khẩu hợp lệ và hoàn tất accept.
5. Kiểm tra người dùng được đăng nhập hoặc chuyển tới login với thông báo thành công.
6. Chọn role **Reviewer** và mở conference/assignment vừa được mời.

**Kết quả mong đợi**

- Tài khoản mới được tạo đúng email đã mời.
- Reviewer mới có quyền vào conference/assignment tương ứng, không cần Chair mời lại.
- Link invitation đã dùng không tạo thêm tài khoản/lời mời trùng khi refresh hoặc mở lại.

## 4. Xem dashboard Reviewer

**Mục đích:** kiểm tra màn hình tổng quan giúp reviewer biết việc cần làm.

**Các bước**

1. Vào **Dashboard**.
2. Kiểm tra các số liệu/tóm tắt:
   - Bài đang cần review.
   - Deadline gần nhất.
   - Lời mời chưa xử lý.
   - Bài đã hoàn thành.
3. Dùng sort/filter nếu dashboard có:
   - Sắp xếp theo deadline.
   - Sắp xếp theo title.
   - Lọc theo trạng thái.
4. Click một bài từ dashboard.

**Kết quả mong đợi**

- Dashboard hiển thị đúng số lượng assignment.
- Click điều hướng đúng tới trang assignment hoặc invitation.
- Trạng thái overdue/urgent nếu có được thể hiện rõ.

## 5. Xem hội nghị mà reviewer tham gia

**Mục đích:** reviewer đọc được thông tin hội nghị trước khi đánh giá bài.

**Các bước**

1. Vào **Conferences**.
2. Mở hội nghị đã accept.
3. Kiểm tra thông tin hội nghị:
   - Overview.
   - Important dates.
   - Committee.
   - Danh sách submissions/assignments của reviewer trong hội nghị nếu có.
4. Mở danh sách submissions của hội nghị.

**Kết quả mong đợi**

- Reviewer chỉ thấy hội nghị mà mình có quyền.
- Reviewer không thấy các chức năng quản trị của Chair như chỉnh sửa hội nghị hoặc ra quyết định.
- Reviewer thấy các bài được giao cho mình.

## 6. Mở bài được phân công

**Mục đích:** kiểm tra reviewer xem đủ thông tin để đánh giá mà không lộ dữ liệu không được phép.

**Các bước**

1. Từ Dashboard hoặc Conferences, mở một assignment.
2. Kiểm tra header:
   - Title paper.
   - Conference.
   - Deadline.
   - Trạng thái review: pending/draft/submitted.
3. Đọc abstract và metadata.
4. Tải file PDF bằng nút **Download PDF** hoặc mở preview nếu có.
5. Kiểm tra blind review:
   - Nếu hội nghị ẩn danh, tên tác giả không được lộ.
   - Nếu không ẩn danh, thông tin tác giả hiển thị theo chính sách.
6. Kiểm tra cảnh báo COI nếu bài có xung đột.

**Kết quả mong đợi**

- Reviewer tải/xem được manuscript của bài được assign.
- Reviewer không xem được bài không được assign bằng URL trực tiếp.
- COI hoặc deadline warning hiển thị rõ nếu có.

## 7. Dùng AI Reviewer Briefing và annotation nếu có

**Mục đích:** kiểm tra các công cụ hỗ trợ reviewer đọc nhanh và ghi chú.

**Các bước**

1. Trong trang assignment, tìm panel **Reviewer Briefing/AI Briefing**.
2. Bấm tạo briefing.
3. Đọc kết quả:
   - Tóm tắt nội dung bài.
   - Điểm mới/đóng góp chính.
   - Rủi ro cần kiểm tra.
   - Câu hỏi gợi ý cho reviewer.
4. Nếu có **Paper Annotation**:
   - Mở panel annotation.
   - Chọn đoạn/trang cần ghi chú.
   - Thêm ghi chú nội bộ.
   - Lưu.
5. Refresh trang và kiểm tra ghi chú còn tồn tại.

**Kết quả mong đợi**

- AI briefing tạo được hoặc báo lỗi thân thiện nếu AI service không khả dụng.
- Annotation lưu đúng bài/assignment.
- Ghi chú nội bộ không bị hiển thị cho Author nếu không có quyền.

## 8. Lưu draft review

**Mục đích:** reviewer có thể viết dở và quay lại sau.

**Các bước**

1. Mở form review.
2. Chọn recommendation/score tạm thời.
3. Chọn confidence.
4. Nhập một phần Strengths.
5. Nhập một phần Weaknesses.
6. Nhập Comments to Author.
7. Nhập Confidential Remarks to Chair.
8. Chọn **Save Draft**.
9. Rời trang rồi quay lại assignment.

**Kết quả mong đợi**

- Draft được lưu.
- Dữ liệu vẫn còn khi quay lại.
- Trạng thái vẫn là draft/pending, chưa tính là completed.

## 9. Submit review hợp lệ

**Mục đích:** gửi đánh giá chuyên môn đầy đủ.

**Các bước**

1. Mở assignment đang pending hoặc draft.
2. Điền đầy đủ form:
   - **Recommendation/Score:** chọn mức đánh giá.
   - **Confidence:** chọn mức tự tin.
   - **Strengths:** viết ít nhất vài ý cụ thể.
   - **Weaknesses:** viết rõ các hạn chế, ưu tiên dạng bullet/đoạn dễ đọc.
   - **Comments to Author:** phản hồi xây dựng cho tác giả.
   - **Confidential Remarks to Chair:** ý kiến riêng cho Chair, không đưa thông tin nhạy cảm vào comment cho Author.
3. Chọn **Submit Review**.
4. Đọc dialog xác nhận nếu có.
5. Xác nhận gửi.

**Kết quả mong đợi**

- Review chuyển sang trạng thái submitted/completed.
- Bài biến mất khỏi danh sách pending hoặc xuất hiện ở **Completed**.
- Form bị khóa hoặc chỉ cho sửa theo chính sách hệ thống.

## 10. Test Review Quality Audit

**Mục đích:** kiểm tra hệ thống cảnh báo review quá sơ sài.

**Các bước audit fail**

1. Mở một assignment test chưa submit.
2. Điền review quá ngắn:
   - Strengths: `Good paper.`
   - Weaknesses: `No major issue.`
   - Comments: `Accept.`
3. Chọn **Submit Review**.
4. Quan sát cảnh báo chất lượng.

**Kết quả mong đợi audit fail**

- Hệ thống cảnh báo review quá ngắn/thiếu phân tích.
- Review chưa được submit hoặc yêu cầu reviewer xác nhận/sửa theo rule hiện tại.

**Các bước audit pass**

1. Sửa review thành nội dung chi tiết:
   - Nêu đóng góp cụ thể.
   - Nêu hạn chế về dataset, baseline, methodology.
   - Đưa đề xuất cải thiện rõ ràng.
2. Submit lại.

**Kết quả mong đợi audit pass**

- Review được chấp nhận.
- Nếu panel audit có điểm chất lượng, trạng thái chuyển sang pass hoặc không còn blocker.

## 11. Xem Completed Reviews

**Mục đích:** kiểm tra reviewer xem lại các bài đã hoàn thành.

**Các bước**

1. Vào **Completed**.
2. Tìm bài vừa submit review.
3. Mở chi tiết.
4. Kiểm tra review đã gửi:
   - Score.
   - Confidence.
   - Strengths/Weaknesses.
   - Comments.
   - Confidential remarks nếu reviewer được xem lại.
5. Kiểm tra ngày giờ submit.

**Kết quả mong đợi**

- Bài đã review nằm trong Completed.
- Nội dung review không bị mất.
- Nếu deadline đã qua, hệ thống xử lý quyền sửa đúng theo chính sách.

## 12. Đọc rebuttal của Author

**Điều kiện:** Chair đã mở rebuttal phase và Author đã gửi rebuttal.

**Mục đích:** reviewer đọc phản hồi của tác giả sau review.

**Các bước**

1. Mở assignment đã completed.
2. Vào tab/panel **Rebuttal**.
3. Đọc **General Response** của Author.
4. Đọc từng point-by-point response:
   - Weakness do reviewer viết.
   - Reply của Author.
5. Kiểm tra file sửa đổi hoặc note nếu hệ thống cho phép tác giả đính kèm.

**Kết quả mong đợi**

- Reviewer thấy rebuttal liên quan tới review của mình.
- Không thấy thông tin reviewer khác nếu chính sách ẩn danh/giới hạn không cho phép.
- Rebuttal hiển thị theo từng điểm, dễ đối chiếu.

## 13. Cập nhật điểm sau rebuttal

**Mục đích:** reviewer có thể thay đổi đánh giá nếu tác giả phản hồi thuyết phục.

**Các bước**

1. Trong panel Rebuttal, chọn **Update Score** hoặc thao tác tương đương.
2. Chọn recommendation/score mới.
3. Nhập lý do thay đổi, ví dụ:
   - `The authors clarified the evaluation setup and committed to adding baseline comparisons, which addresses my main concern.`
4. Lưu thay đổi.
5. Refresh trang.

**Kết quả mong đợi**

- Score/recommendation mới được lưu.
- Lịch sử thay đổi điểm hiển thị cho Chair.
- Không cho cập nhật nếu rebuttal phase đã đóng hoặc reviewer không có quyền.

## 14. Tham gia discussion

**Mục đích:** kiểm thử trao đổi có kiểm soát giữa reviewer/chair/author tùy visibility.

**Các bước**

1. Mở assignment.
2. Vào tab **Discussion**.
3. Xem các thread hiện có.
4. Tạo thread mới nếu được phép.
5. Chọn visibility/phạm vi nếu có:
   - Internal reviewers/chair.
   - Author-visible nếu hệ thống cho phép.
6. Gửi message.
7. Kiểm tra message xuất hiện sau refresh.

**Kết quả mong đợi**

- Reviewer gửi được discussion trong phạm vi được phép.
- Message nội bộ không lộ cho Author.
- Người không có quyền không thấy thread bị giới hạn.

## 15. Theo dõi lịch và thông báo

**Mục đích:** reviewer kiểm soát deadline và cập nhật.

**Các bước**

1. Vào **Schedules**.
2. Kiểm tra review deadline, rebuttal deadline và các mốc hội nghị.
3. Vào **Notifications**.
4. Kiểm tra thông báo:
   - Lời mời mới.
   - Bài mới được assign.
   - Deadline sắp đến.
   - Author đã gửi rebuttal.
   - Chair đã có final decision nếu reviewer được thông báo.
5. Đánh dấu đã đọc.
6. Click notification để kiểm tra điều hướng.

**Kết quả mong đợi**

- Schedules hiển thị deadline liên quan tới reviewer.
- Notification badge cập nhật đúng.
- Click notification mở đúng invitation/assignment.

## 16. Kiểm thử lỗi và phân quyền Reviewer

**Checklist**

- Reviewer chưa accept invitation không thấy hội nghị trong Conferences.
- Reviewer decline paper invitation không có assignment active.
- Reviewer truy cập assignment của reviewer khác bằng URL trực tiếp: bị chặn.
- Reviewer submit review thiếu score/confidence/comment bắt buộc: có validation.
- Reviewer submit sau review deadline: bị chặn hoặc cảnh báo đúng chính sách.
- Reviewer có COI không được assign hoặc thấy cảnh báo rõ.
- Confidential remarks không xuất hiện ở giao diện Author.
- Review đã submitted không thể sửa tùy tiện nếu hệ thống khóa.

## 17. Kết luận pass/fail cho role Reviewer

Role Reviewer được xem là **pass** khi:

- Nhận/từ chối invitation được.
- Xem hội nghị và assignment được phân quyền đúng.
- Tải/xem manuscript được.
- Lưu draft và submit review hợp lệ được.
- Review Quality Audit cảnh báo review sơ sài.
- Đọc rebuttal và cập nhật score sau rebuttal được.
- Notification, schedule, completed reviews hoạt động đúng.

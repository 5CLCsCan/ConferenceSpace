# Script kiểm thử & hướng dẫn sử dụng - Role AUTHOR

Tài liệu này dành cho người lần đầu dùng ConferenceSpace với vai trò **Author/Tác giả**. Hãy làm theo từng bước để kiểm thử toàn bộ luồng: đăng ký, cập nhật hồ sơ, tìm hội nghị, nộp bài, sửa/rút bài, phản biện, xem quyết định và nộp camera-ready.

## 0. Chuẩn bị trước khi test

**Tài khoản đề xuất**

- Email: `author1@gmail.com`
- Mật khẩu: `Demo@123`
- Đồng tác giả dùng để test COI: `author2@gmail.com`

**Dữ liệu bài báo mẫu**

- Title: `Evaluating Generative AI and LLMs in Enterprise Applications`
- Abstract: `This paper explores the real-world applications of Generative AI and Large Language Models in automating enterprise workflows. We evaluate natural language processing techniques, prompt engineering strategies, deployment trade-offs, and governance risks in enterprise environments.`
- Keywords: `Generative AI`, `LLM`, `NLP`, `Prompt Engineering`
- Track gợi ý: `Artificial Intelligence & Machine Learning`
- File: dùng file PDF hợp lệ, ví dụ `frontend/tests/fixtures/files/sample.pdf`

**Điều kiện hệ thống**

- Website đã chạy và có thể truy cập bằng trình duyệt.
- Backend/AI service đang hoạt động nếu muốn test precheck, autofill, gợi ý track và các tính năng AI.
- Đã có ít nhất một hội nghị đang mở nhận bài. Nếu chưa có, chạy script Chair trước để tạo hội nghị.

## 0.1. Giải thích các field đăng ký/đăng nhập

Người test nên đọc phần này trước khi tạo tài khoản, vì các field ở bước đăng ký ảnh hưởng trực tiếp tới matching, COI và dữ liệu tự điền khi nộp bài.

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **First Name** | Tên/given name của người dùng. Hệ thống dùng để hiển thị profile, sidebar, danh sách tác giả. | `Tran` | Không nhập biệt danh nếu đang test luồng học thuật chính thức. |
| **Last Name** | Họ/family name. Kết hợp với First Name thành tên đầy đủ. | `Van Author` | Nên giữ nhất quán với tên trong paper và profile. |
| **Email** | Định danh đăng nhập và địa chỉ nhận thông báo/lời mời. | `author1@gmail.com` | Phải đúng định dạng email. Email này cũng được dùng khi Chair xem co-author hoặc notification. |
| **Domains** | Các lĩnh vực chuyên môn của tài khoản. Đây là tag học thuật, không phải domain website. | `Generative AI`, `Natural Language Processing`, `Machine Learning` | Bắt buộc có ít nhất 1 domain khi đăng ký. Có thể gõ rồi Enter hoặc click chip gợi ý. |
| **Add domain (+)** | Thêm domain đang nhập thành chip. | Gõ `NLP`, bấm nút `+` | Nếu nhập trùng domain đã có, hệ thống không thêm trùng. |
| **Password** | Mật khẩu đăng nhập. | `Demo@123` | Phải có ít nhất 8 ký tự, chữ thường, chữ hoa, số và ký tự đặc biệt. |
| **Show/Hide password** | Hiện/ẩn mật khẩu để kiểm tra người dùng nhập đúng. | Bấm icon mắt | Không thay đổi giá trị mật khẩu, chỉ đổi cách hiển thị. |
| **Confirm Password** | Nhập lại mật khẩu để tránh gõ nhầm. | `Demo@123` | Nếu khác Password, hệ thống báo lỗi password mismatch. |
| **Sign Up** | Gửi thông tin tạo tài khoản. | Bấm sau khi điền đủ | Nếu thiếu Domains hoặc password yếu, không tạo tài khoản. |
| **Login Email** | Email đã đăng ký. | `author1@gmail.com` | Nên trim khoảng trắng đầu/cuối khi test, hệ thống có xử lý trim. |
| **Login Password** | Mật khẩu của tài khoản. | `Demo@123` | Sai mật khẩu phải báo lỗi, không vào dashboard. |
| **Remember me** | Giữ phiên đăng nhập lâu hơn trên trình duyệt. | Tick khi muốn test quay lại sau refresh | Không ảnh hưởng quyền role, chỉ ảnh hưởng session. |
| **Forgot password** | Bắt đầu luồng đặt lại mật khẩu. | Click nếu muốn test reset password | Cần email hợp lệ và backend email/reset hoạt động. |

**Ví dụ đăng ký hoàn chỉnh cho Author**

- First Name: `Tran`
- Last Name: `Van Author`
- Email: `author1@gmail.com`
- Domains: `Generative AI`, `Large Language Models`, `NLP`
- Password: `Demo@123`
- Confirm Password: `Demo@123`

**Kết quả mong đợi:** đăng ký thành công chuyển về Login, sau login vào được trang chọn role.

## 0.2. Bản đồ phụ thuộc flow cho Author

Không phải flow nào của Author cũng test độc lập được. Nếu nhảy thẳng vào một flow mà dữ liệu trước đó chưa có, màn hình có thể trống hoặc nút bị khóa. Dùng bảng này để biết cần chuẩn bị gì trước.

| Flow muốn test | Bắt buộc phải có trước | Ai tạo dữ liệu đó | Nếu thiếu thì sẽ thấy gì |
| --- | --- | --- | --- |
| Xem danh sách hội nghị | Có ít nhất một hội nghị đã publish/open | Chair | Trang Conferences trống hoặc không có nút submit. |
| Nộp bài mới | Hội nghị đã publish, còn full paper deadline, có tracks/policy hợp lệ | Chair | Nút New Submission bị ẩn/disabled hoặc báo conference not accepting submissions. |
| Gợi ý track khi submit | Title/abstract/keywords đã nhập; hội nghị có track; AI/backend chạy | Author + Chair + system | Không có recommendation hoặc báo lỗi AI/service. |
| Precheck manuscript | Hội nghị có policy/gating; file hợp lệ; AI/precheck service chạy | Chair + Author + system | Chỉ upload file, không có kết quả precheck hoặc báo precheck failed. |
| Xem submission trong My Submissions | Author đã save draft hoặc submit paper | Author | Danh sách trống. |
| Sửa submission | Có draft hoặc submission còn trong thời gian được sửa | Author + Chair deadline | Nút Edit bị khóa hoặc không xuất hiện. |
| Withdraw | Có submission đã submit và policy còn cho rút | Author + Chair deadline | Nút Withdraw bị khóa/ẩn. |
| Xem review | Chair đã assign reviewer, reviewer đã submit review, Chair/policy cho Author xem | Chair + Reviewer | Tab review/rebuttal trống hoặc chưa có nội dung. |
| Gửi rebuttal | Có review đã submit; Chair đã bật rebuttal phase; hiện tại nằm trong rebuttal window | Chair + Reviewer + Author | Rebuttal form bị khóa hoặc báo phase chưa mở/đã đóng. |
| Discussion | Submission tồn tại và user có quyền trong thread visibility | Author/Chair/Reviewer | Không thấy thread hoặc không thấy nút tạo message. |
| Xem final decision | Chair đã ra Accept/Reject | Chair | Trạng thái vẫn Under Review/Pending Decision. |
| Nộp camera-ready | Submission đã Accepted; Chair bật camera-ready và deadline còn mở | Chair + Author | Không thấy phần camera-ready hoặc upload bị khóa. |

**Thứ tự test Author khuyến nghị**

1. Chair tạo và publish hội nghị.
2. Author đăng ký/đăng nhập/cập nhật profile.
3. Author nộp draft rồi submit paper.
4. Chair assign reviewer.
5. Reviewer submit review.
6. Chair mở rebuttal phase nếu muốn test rebuttal.
7. Author gửi rebuttal.
8. Reviewer cập nhật score nếu cần.
9. Chair ra final decision.
10. Author xem decision và nộp camera-ready nếu accepted.

## 0.2.1. Option seed nhanh cho Author

Nếu không muốn đi từ đầu qua Chair/Reviewer để tạo dữ liệu, có thể chạy seed Python rồi đăng nhập bằng account Author mà script in ra.

| Flow Author muốn test | Seed nên chạy | Lệnh | Sau khi chạy thì làm gì |
| --- | --- | --- | --- |
| Xem conference và submission đã có | `devtool/seeder/seed_two_conferences.py` | `python devtool/seeder/seed_two_conferences.py --base-url http://localhost:8080` | Đọc output, đăng nhập bằng author của conference `ASG...`; mở My Submissions hoặc conference được in ra. |
| Rebuttal form, rebuttal đã gửi/chưa gửi | `devtool/seeder/seed_rebuttal_demo.py` | `python devtool/seeder/seed_rebuttal_demo.py --base-url http://localhost:8080` | Đăng nhập `demo_rebuttal_author_1-3@test.com` với password `Demo@12345`; mở submission ID script in ra. |

**Khi nào dùng seed thay vì tự chuẩn bị**

- Muốn demo nhanh rebuttal nhưng chưa có review.
- Muốn xem submission đã được assign/review mà không cần tự chạy Chair và Reviewer.
- Muốn tránh lỗi do thiếu deadline, thiếu reviewer accepted, thiếu paper submitted.

**Khi nào nên chuẩn bị thủ công**

- Muốn test đúng trải nghiệm người dùng mới từ Register → Profile → Submit.
- Muốn kiểm tra validation từng field trong form submit.
- Muốn test một bug cụ thể liên quan tới deadline/policy do bạn tự cấu hình.

## 0.3. Giải thích các field hồ sơ cá nhân

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Name/First name/Last name** | Tên hiển thị trong hệ thống và danh sách tác giả. | `Tran Van Author` | Nếu sửa profile, sidebar hoặc profile page phải cập nhật. |
| **Affiliation/Organization** | Đơn vị công tác hoặc nơi thực hiện nghiên cứu. | `Vietnam National University` | Dùng để đọc context học thuật và hỗ trợ phát hiện institutional conflict. |
| **Research Domains/Keywords** | Chuyên môn của người dùng. | `NLP`, `Prompt Engineering` | Với Author, giúp Chair hiểu nền tảng; với Reviewer, dùng mạnh trong matching. |
| **Academic/Publications profile** | Thông tin học thuật hoặc liên kết scholar nếu có. | Semantic Scholar/Google Scholar profile | Nếu có tích hợp graph, dữ liệu này có thể hỗ trợ COI relationship. |
| **Save** | Lưu hồ sơ. | Bấm sau khi sửa | Refresh lại để kiểm tra dữ liệu không mất. |
| **Change language** | Đổi ngôn ngữ giao diện. | `EN`/`VI` | Dữ liệu không thay đổi, chỉ đổi nhãn giao diện. |
| **Sign out** | Đăng xuất. | Click ở menu tài khoản | Sau logout truy cập `/role/author` phải bị đưa về login. |

## 0.4. Giải thích từng field khi submit paper

### Bước Paper Details

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Paper Title** | Tên chính thức của bài báo. Chair, reviewer và danh sách submission đều dùng title này. | `Evaluating Generative AI and LLMs in Enterprise Applications` | Bắt buộc. Nên rõ ràng, không quá dài. Nếu Chair bật gating `Title max words`, title quá dài có thể bị chặn. |
| **Abstract** | Tóm tắt nội dung: vấn đề, phương pháp, đóng góp, kết quả chính. | `This paper explores the real-world applications...` | Bắt buộc. Editor hỗ trợ markdown. Nên 150-250 từ nếu hội nghị không yêu cầu khác. |
| **Keywords** | Từ khóa mô tả nội dung bài. Hệ thống dùng để gợi ý track và match reviewer. | `Generative AI`, `LLM`, `NLP` | Bắt buộc. Gõ keyword rồi nhấn Enter. Nên dùng 3-5 keyword đúng trọng tâm. |
| **Remove keyword (x)** | Xóa keyword đã thêm. | Xóa `Computer Vision` nếu bài không liên quan | Sau xóa, keyword không còn trong Review & Submit. |
| **Select Track** | Chọn track/chủ đề con của hội nghị. Chair dùng track để lọc và phân công review. | `Artificial Intelligence & Machine Learning` | Bắt buộc nếu hội nghị có tracks. Chọn sai track có thể làm reviewer matching kém. |
| **Find/Get Recommendations** | Gọi AI/API để gợi ý track dựa trên title/abstract/keywords. | Hệ thống gợi ý `Artificial Intelligence & Machine Learning` | Chỉ đáng tin khi title/abstract/keywords đã đủ thông tin. Nếu AI lỗi, vẫn chọn track thủ công được. |
| **Student Paper** | Đánh dấu bài do sinh viên là tác giả chính. | Tick nếu primary author là sinh viên | Có thể dùng cho award/session riêng, không thay thế track. |

### Bước Authors & Affiliations

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Author List** | Danh sách tác giả sẽ gắn với submission. | `Tran Van Author`, `Le Thi Author Two` | Thứ tự tác giả quan trọng. Người đầu thường là primary author. |
| **Correspondent/Corresponding Author** | Tác giả nhận trao đổi chính với hội nghị. | Tick cho `author1@gmail.com` | Tác giả đầu tiên thường bị khóa không cho bỏ correspondent nếu là người nộp. |
| **Edit author** | Sửa tên/email/affiliation/country của tác giả. | Sửa affiliation thành `HCMUT` | Dùng khi autofill hoặc profile điền sai. |
| **Drag reorder** | Đổi thứ tự tác giả. | Kéo co-author lên/xuống | Primary author có thể bị khóa không cho kéo tùy UI. |
| **Add Co-author - First Name** | Tên của đồng tác giả. | `Le Thi` | Bắt buộc khi thêm co-author. |
| **Add Co-author - Last Name** | Họ/tên sau của đồng tác giả. | `Author Two` | Bắt buộc. |
| **Add Co-author - Email** | Email đồng tác giả. Có thể search user trên hệ thống. | `author2@gmail.com` | Gõ từ 2 ký tự trở lên có thể hiện dropdown user. Chọn user có sẵn giúp dữ liệu đúng hơn. |
| **Affiliation** | Đơn vị của đồng tác giả. | `Vietnam National University` | Dùng cho hồ sơ bài và có thể hỗ trợ COI. |
| **Country** | Quốc gia của tác giả. | `Vietnam` | Dùng cho metadata/thống kê. |
| **Add Author** | Thêm co-author vào danh sách. | Bấm sau khi điền đủ | Nếu thiếu email/tên/affiliation/country, cần kiểm tra validation. |
| **Naming Guidelines** | Hướng dẫn đặt tên tác giả. | Mở modal đọc quy tắc | Nhắc không đưa tên tác giả vào PDF nếu double-blind. |

### Bước Upload Manuscript

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Manuscript File** | File bài báo chính gửi cho reviewer. | `sample.pdf` | UI ghi nhận PDF/DOCX/TEX, nhưng nhiều hội nghị yêu cầu PDF. Kiểm tra policy của hội nghị. |
| **Click to upload/drag and drop** | Chọn file từ máy. | Chọn `frontend/tests/fixtures/files/sample.pdf` | File quá lớn hoặc sai định dạng phải báo lỗi. UI có max 20MB. |
| **Preview** | Mở file đã upload trong tab mới. | Bấm icon mắt | Dùng để chắc chắn đúng file. |
| **Delete/Remove file** | Gỡ file đã upload. | Bấm icon thùng rác | Sau gỡ file, không được submit nếu file bắt buộc. |
| **Download existing** | Tải file đã lưu trong draft/submission cũ. | Bấm khi sửa submission | Dùng kiểm tra file cũ còn lưu. |
| **Precheck/Quality Check** | Kiểm tra file theo chính sách hội nghị trước review. | Hệ thống báo `Ready` hoặc liệt kê lỗi | Có thể kiểm tra format, title, reference, section, anonymization, banned phrases tùy Chair cấu hình. |
| **Precheck decision: accept_for_review** | File đạt yêu cầu để submit. | Badge `Ready` | Submit được nếu các bước khác hợp lệ. |
| **Precheck warning/error** | File thiếu điều kiện. | `Missing References section` | Nếu là blocker, phải sửa file/chính sách trước khi submit. |
| **Supplementary Material** | File phụ như code, dataset, appendix, video. | `artifact.zip` | Optional. Chỉ upload nếu hội nghị cho phép supplementary. |

### Bước Conflicts of Interest

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Conflict Domains** | Domain email của tổ chức có xung đột. Reviewer dùng email thuộc domain này sẽ bị cảnh báo. | `vnu.edu.vn`, `mit.edu` | Không nhập `https://`; chỉ nhập domain email/tổ chức. |
| **Add domain** | Thêm domain vào danh sách. | Gõ `mit.edu`, Enter | Dùng để test institutional COI. |
| **Individual Conflicts - First/Last Name** | Tên người cụ thể có xung đột. | `Hoang Reviewer Two` | Có thể nhập dù chưa biết email, nhưng email giúp hệ thống match chắc hơn. |
| **Individual Conflicts - Email** | Email người có xung đột. | `reviewer2@gmail.com` | Nên nhập để Chair/COI engine phát hiện chính xác. |
| **Reason** | Loại xung đột. | `Recent co-author last 24 months` | Các loại chính: advisor/advisee, recent co-author, family/personal, financial/grant collaboration, other. |
| **Add Conflict** | Thêm cá nhân vào bảng COI. | Thêm `reviewer2@gmail.com` | Sau thêm phải thấy trong table. |
| **Remove Conflict** | Xóa một khai báo COI. | Xóa người nhập nhầm | Dùng test thao tác sửa trước submit. |
| **Confirm Declaration** | Xác nhận đã khai báo COI trung thực. | Tick checkbox | Bắt buộc trước submit. Không tick thì không qua bước cuối. |

### Bước Review & Submit

| Field/Nút | Ý nghĩa | Ví dụ cụ thể | Lưu ý kiểm thử |
| --- | --- | --- | --- |
| **Edit** | Quay lại bước tương ứng để sửa. | Edit Paper Details | Sau sửa quay lại bước cuối phải thấy dữ liệu mới. |
| **Submission confirmation** | Cam kết thông tin chính xác và được phép submit. | Tick checkbox cuối | Bắt buộc trước Submit/Publish. |
| **Save Draft** | Lưu bản nháp, chưa gửi chính thức cho hội nghị. | Dùng khi chưa chắc file cuối | Draft có thể sửa/xóa. Reviewer chưa thấy để review. |
| **Submit/Publish** | Gửi bài chính thức. | Bấm sau khi precheck pass | Sau submit, trạng thái chuyển Submitted/Published và Chair thấy bài. |
| **Cancel/Back** | Rời wizard. | Bấm khi không muốn tiếp tục | Nếu có dữ liệu chưa lưu, kiểm tra warning mất dữ liệu. |

## 1. Đăng ký, đăng nhập và chọn vai trò Author

**Mục đích:** đảm bảo người dùng mới vào được hệ thống và chọn đúng không gian làm việc.

**Các bước**

1. Mở trang chủ của website.
2. Nếu chưa có tài khoản, chọn **Register**.
3. Nhập email, mật khẩu, họ tên và thông tin bắt buộc.
4. Gửi đăng ký.
5. Nếu hệ thống yêu cầu xác minh email, mở luồng **Verify Email** theo hướng dẫn hiển thị.
6. Vào **Login**, đăng nhập bằng tài khoản Author.
7. Ở trang chọn vai trò `/role`, chọn thẻ **Author**.

**Kết quả mong đợi**

- Người dùng được đưa tới `/role/author`.
- Sidebar hiển thị các mục của Author: **Conferences**, **My Submissions**, **Schedules**, **Notifications**.
- Góc dưới sidebar hiển thị tên/email tài khoản.

## 2. Cập nhật hồ sơ cá nhân

**Mục đích:** hồ sơ đầy đủ giúp Chair/AI hiểu chuyên môn của tác giả và giúp form nộp bài tự điền thông tin chính xác hơn.

**Các bước**

1. Click khu vực tài khoản ở cuối sidebar.
2. Chọn **View Profile**.
3. Kiểm tra thông tin cơ bản: tên, email, affiliation/organization.
4. Chọn **Edit** hoặc nút chỉnh sửa thông tin nếu có.
5. Cập nhật:
   - First name, Last name.
   - Affiliation/Organization, ví dụ `Vietnam National University`.
   - Research domains/keywords, ví dụ `Natural Language Processing`, `Generative AI`, `Machine Learning`.
   - **Liên kết danh tính học thuật (Semantic Scholar):** Tìm mục liên kết hồ sơ Semantic Scholar. Dán URL hồ sơ hoặc mã Author ID của bạn vào ô nhập liệu để đồng bộ công trình và chỉ số trích dẫn. (Ví dụ URL: `https://www.semanticscholar.org/author/1234567`).
6. Lưu thay đổi.
7. Đổi ngôn ngữ ở menu tài khoản để kiểm tra giao diện tiếng Việt/tiếng Anh nếu cần.

**Kết quả mong đợi**

- Hồ sơ lưu thành công, reload trang vẫn còn dữ liệu.
- Tên/affiliation ở sidebar được cập nhật.
- Không thấy lỗi validation khi điền dữ liệu hợp lệ.

## 3. Xem danh sách hội nghị dành cho tác giả

**Mục đích:** kiểm tra Author có thể tìm và đọc thông tin hội nghị trước khi nộp bài.

**Các bước**

1. Vào **Conferences** ở sidebar hoặc `/role/author`.
2. Quan sát danh sách hội nghị.
3. Dùng ô tìm kiếm để tìm theo tên hoặc acronym, ví dụ `AI` hoặc `Future Tech`.
4. Mở một hội nghị.
5. Kiểm tra các tab trong trang chi tiết:
   - **Overview:** thông tin tổng quan, địa điểm, mô tả.
   - **Call for Papers:** chủ đề nhận bài, quy định, tài nguyên, hướng dẫn định dạng.
   - **Important Dates:** các mốc submission deadline, notification, conference dates.
   - **Committee:** danh sách Chair/Reviewer/PC nếu được công khai.
6. Kiểm tra nút chia sẻ, in hoặc tải Call for Papers nếu giao diện có.

**Kết quả mong đợi**

- Author xem được hội nghị công khai.
- Nếu hội nghị còn hạn nộp bài, nút **New Submission/Submit Paper** khả dụng.
- Nếu quá hạn hoặc không mở nhận bài, nút nộp bài bị khóa và có thông báo lý do.

## 4. Tạo bài nộp mới bằng wizard

**Mục đích:** kiểm thử luồng nộp bài đầy đủ qua các bước Paper Details, Authors, Upload, COI, Review & Submit.

**Các bước**

1. Trong trang chi tiết hội nghị, chọn **New Submission** hoặc vào `/role/author/submissions/new`.
2. Ở bước **Paper Details**:
   - Nhập Title mẫu.
   - Nhập Abstract mẫu.
   - Thêm Keywords: `Generative AI`, `LLM`, `NLP`.
   - Chọn Track phù hợp.
   - Nếu có nút gợi ý track bằng AI, bấm chạy và kiểm tra track được đề xuất.
3. Chọn **Next**.
4. Ở bước **Authors & Affiliations**:
   - Kiểm tra tác giả hiện tại đã được đánh dấu corresponding author.
   - Thêm đồng tác giả `author2@gmail.com`.
   - Điền affiliation/country cho từng tác giả nếu form yêu cầu.
   - **Test tính năng xóa/đổi thứ tự:** Nhấn vào icon xóa (Remove) kế bên tác giả phụ xem hệ thống có xóa đúng không. Sau đó thêm lại. Dùng chuột kéo thả (Drag & Drop) để đổi thứ tự tác giả và kiểm tra kết quả lưu.
   - Kiểm tra không cho xóa corresponding author duy nhất nếu hệ thống có ràng buộc.
5. Chọn **Next**.
6. Ở bước **Upload Manuscript**:
   - Tải lên file PDF hợp lệ.
   - Chờ upload hoàn tất.
   - Nếu có precheck, bấm chạy kiểm tra hoặc chờ hệ thống tự chạy.
   - Đọc kết quả precheck: định dạng, nội dung, cảnh báo hoặc lỗi chặn.
7. Test validation file:
   - Thử upload file không phải PDF nếu có sẵn.
   - Kiểm tra hệ thống báo lỗi định dạng.
   - Quay lại upload PDF hợp lệ.
8. Chọn **Next**.
9. Ở bước **Conflicts of Interest**:
   - Thêm domain tổ chức có xung đột nếu cần, ví dụ `mit.edu`.
   - Thêm declared conflict với email reviewer nếu muốn test, ví dụ `reviewer2@gmail.com`, reason `co-author/collaborator`.
   - Tick xác nhận đã khai báo COI trung thực.
10. Chọn **Next**.
11. Ở bước **Review & Submit**:
   - Kiểm tra lại title, abstract, authors, file, conflicts.
   - Tick xác nhận cuối cùng nếu form yêu cầu.
   - Chọn **Save Draft** trước để kiểm tra lưu nháp.

**Kết quả mong đợi**

- Wizard cho phép đi qua từng bước khi dữ liệu hợp lệ.
- Các lỗi bắt buộc được hiển thị rõ nếu bỏ trống title, abstract, keyword, file hoặc xác nhận COI.
- Draft được lưu và xuất hiện trong **My Submissions** với trạng thái **Draft**.

## 5. Test AI Autofill khi nộp bài

**Mục đích:** kiểm tra tính năng trích xuất thông tin từ file để hỗ trợ điền form.

**Các bước**

1. Tạo submission mới hoặc mở draft.
2. Tìm nút/sheet **Autofill** hoặc tính năng tự điền từ manuscript.
3. Upload một file PDF có nội dung bài báo.
4. Chạy autofill.
5. Kiểm tra hệ thống đề xuất title, abstract, keywords, authors/materials.
6. Chọn áp dụng dữ liệu autofill.
7. Sửa lại các trường chưa đúng.

**Kết quả mong đợi**

- Hệ thống không ghi đè dữ liệu quan trọng nếu người dùng chưa xác nhận.
- Các trường được điền hợp lý từ file.
- Người dùng vẫn có thể chỉnh tay trước khi submit.

## 6. Submit chính thức bài báo

**Mục đích:** chuyển bài từ draft sang bài nộp chính thức.

**Các bước**

1. Mở draft trong **My Submissions**.
2. Chọn **Edit/Continue**.
3. Kiểm tra lại toàn bộ wizard.
4. Chọn **Submit/Publish**.
5. Xác nhận trong dialog nếu có.
6. Quay về **My Submissions**.

**Kết quả mong đợi**

- Trạng thái bài chuyển từ **Draft** sang **Submitted/Published**.
- Bài xuất hiện trong danh sách với đúng hội nghị, track, ngày nộp.
- Sau khi submit, hệ thống không còn coi bài là bản nháp.

## 7. Quản lý danh sách My Submissions

**Mục đích:** kiểm tra Author theo dõi được tất cả bài đã nộp.

**Các bước**

1. Vào **My Submissions**.
2. Dùng tìm kiếm theo title.
3. Lọc theo trạng thái:
   - All.
   - Draft.
   - Submitted.
   - Under Review.
   - Accepted.
   - Rejected.
4. Lọc theo hội nghị nếu có nhiều hội nghị.
5. Sắp xếp hoặc chuyển trang nếu danh sách dài.
6. Mở một submission.

**Kết quả mong đợi**

- Danh sách hiển thị đúng trạng thái.
- Search/filter không làm mất dữ liệu.
- Click vào một bài mở đúng trang chi tiết `/role/author/submissions/{submissionId}`.

## 7.1. Kiểm tra góc nhìn của Đồng tác giả (Co-author perspective)

**Mục đích:** kiểm tra hệ thống tự động chia sẻ quyền truy cập bài báo cho những người được gán làm đồng tác giả.

**Các bước**

1. Đăng xuất tài khoản `author1@gmail.com`.
2. Đăng nhập bằng tài khoản đồng tác giả `author2@gmail.com` (tài khoản đã được mời/thêm ở Bước 4).
3. Truy cập vào không gian làm việc `/role/author`.
4. Mở tab **My Submissions**.
5. Kiểm tra bài báo do `author1` nộp có xuất hiện trong danh sách này không.
6. Mở chi tiết bài báo, kiểm tra quyền hạn của Co-author (có thể là View-only hoặc có quyền Edit tùy cấu hình).
7. Đăng xuất và trở lại tài khoản `author1`.

**Kết quả mong đợi**

- Đồng tác giả nhìn thấy bài báo trên hệ thống ở danh sách `My Submissions` của chính họ.
- Khi tác giả chính thay đổi tiến độ, đồng tác giả cũng theo dõi được trạng thái mới nhất.

## 8. Xem chi tiết bài nộp

**Mục đích:** kiểm tra Author hiểu được trạng thái, file, timeline và lịch sử bài.

**Các bước**

1. Mở một submission.
2. Ở tab **Overview**, kiểm tra:
   - Title, abstract, keywords/track.
   - Conference liên quan.
   - File manuscript, nút preview/download.
   - Cover letter nếu có.
   - Timeline: Submitted, Bidding/Review, Rebuttal, Final Decision.
3. Kiểm tra trạng thái hiện tại:
   - Draft.
   - Submitted/Published.
   - Under Review.
   - Pending Decision.
   - Accepted/Rejected.
   - Withdrawn.
4. Nếu có tab **Discussion**, mở và xem thread trao đổi.
5. Nếu có tab **Rebuttal**, kiểm tra trạng thái mở/đóng.

**Kết quả mong đợi**

- Author chỉ xem được dữ liệu của bài mình.
- File tải được nếu đã upload.
- Timeline giúp người mới hiểu bài đang ở giai đoạn nào.

## 9. Chỉnh sửa, lưu nháp, xóa draft và rút bài

**Mục đích:** kiểm tra các thao tác trước/sau deadline.

**Các bước**

1. Với bài **Draft**:
   - Mở draft.
   - Sửa title hoặc abstract.
   - Lưu lại.
   - Quay về danh sách và kiểm tra dữ liệu đã đổi.
   - Nếu có nút delete draft, thử xóa một draft không cần dùng.
2. Với bài **Submitted** trước deadline:
   - Mở submission.
   - Chọn **Edit** nếu hệ thống cho phép.
   - Upload file PDF mới hoặc sửa metadata.
   - Lưu/submit lại.
3. Test **Withdraw**:
   - Mở bài đã submit.
   - Chọn **Withdraw**.
   - Đọc cảnh báo.
   - Xác nhận chỉ khi đang test bằng dữ liệu không quan trọng.
4. Với hội nghị đã quá hạn:
   - Mở bài thuộc hội nghị quá deadline.
   - Kiểm tra nút edit/submit bị khóa hoặc báo lý do không cho sửa.

**Kết quả mong đợi**

- Draft có thể sửa/xóa.
- Bài đã submit chỉ sửa/rút khi chính sách hội nghị cho phép.
- Withdraw chuyển trạng thái sang **Withdrawn** và không còn trong luồng review bình thường.

## 10. Theo dõi thông báo và lịch

**Mục đích:** kiểm tra Author không bỏ lỡ deadline hoặc cập nhật từ hệ thống.

**Các bước**

1. Vào **Notifications**.
2. Kiểm tra thông báo liên quan:
   - Hội nghị mở/đóng nhận bài.
   - Submission được nhận.
   - Review/rebuttal/decision.
3. Đánh dấu thông báo đã đọc nếu có.
4. Vào **Schedules**.
5. Kiểm tra các mốc deadline của hội nghị và submission.

**Kết quả mong đợi**

- Badge thông báo trên sidebar cập nhật đúng.
- Click thông báo điều hướng đúng tới submission hoặc hội nghị.
- Schedules hiển thị các mốc quan trọng dễ hiểu.

## 11. Đọc review và gửi rebuttal

**Điều kiện:** Chair đã mở rebuttal phase và reviewer đã submit review.

**Mục đích:** tác giả đọc nhận xét và phản hồi có cấu trúc trước quyết định cuối cùng.

**Các bước**

1. Mở submission đã có review.
2. Vào tab **Rebuttal**.
3. Đọc phần tổng hợp review:
   - Điểm số/recommendation của reviewer.
   - Strengths.
   - Weaknesses.
   - Comments to Author.
4. Kiểm tra phần reviewer ẩn danh nếu hội nghị dùng blind review.
5. Nhập **General Response**:
   - Cảm ơn reviewer.
   - Tóm tắt cách bạn sẽ xử lý góp ý.
   - Giữ giọng văn chuyên nghiệp, không công kích cá nhân.
6. Với từng weakness/rebuttal point:
   - Nhập phản hồi trực tiếp.
   - Nêu rõ bạn đồng ý/sửa ở đâu hoặc giải thích vì sao nhận xét chưa đúng.
   - Nếu có thay đổi trong bản sau, ghi rõ phần/section liên quan.
7. Lưu nháp rebuttal nếu có.
8. Chọn **Submit Rebuttal**.
9. Xác nhận gửi.

**Kết quả mong đợi**

- Rebuttal được lưu và chuyển trạng thái đã gửi.
- Sau khi gửi hoặc sau deadline, form bị khóa theo đúng chính sách.
- Reviewer/Chair có thể đọc rebuttal ở luồng của họ.

## 12. Tham gia discussion

**Mục đích:** kiểm tra kênh trao đổi có kiểm soát giữa các bên.

**Các bước**

1. Mở submission.
2. Vào tab **Discussion**.
3. Xem danh sách thread hiện có.
4. Tạo thread mới nếu role Author được phép:
   - Nhập tiêu đề ngắn.
   - Nhập nội dung câu hỏi hoặc phản hồi.
   - Chọn visibility/phạm vi nếu giao diện có.
5. Gửi message.
6. Refresh trang.

**Kết quả mong đợi**

- Thread/message mới hiển thị sau khi gửi.
- Người không có quyền không thấy nút hoặc không gửi được.
- Nội dung discussion không làm thay đổi trạng thái submission.

## 13. Xem quyết định cuối cùng

**Điều kiện:** Chair đã ra quyết định Accept hoặc Reject.

**Mục đích:** Author hiểu kết quả và lý do.

**Các bước**

1. Mở **My Submissions**.
2. Tìm bài có trạng thái **Accepted** hoặc **Rejected**.
3. Mở chi tiết bài.
4. Đọc:
   - Final decision.
   - Meta-review/lý do tổng kết của Chair.
   - Review history nếu hệ thống hiển thị.
5. Kiểm tra notification tương ứng.

**Kết quả mong đợi**

- Trạng thái cuối cùng rõ ràng.
- Author đọc được meta-review.
- Nếu rejected, không thấy yêu cầu camera-ready.
- Nếu accepted, phần camera-ready xuất hiện khi hội nghị yêu cầu.

## 14. Nộp camera-ready cho bài được accepted

**Điều kiện:** submission đã **Accepted** và hội nghị bật camera-ready.

**Mục đích:** kiểm tra Author upload bản cuối sau khi bài được nhận.

**Các bước**

1. Mở submission accepted.
2. Tìm phần **Camera-ready** trong Overview hoặc khu vực riêng.
3. Đọc deadline và yêu cầu file.
4. Upload file PDF bản cuối.
5. Nếu có form note/changelog, nhập các thay đổi đã sửa theo review.
6. Gửi camera-ready.
7. Tải lại trang.

**Kết quả mong đợi**

- File camera-ready được lưu và có thể tải lại.
- Trạng thái camera-ready chuyển sang submitted/pending verification.
- Nếu quá deadline, hệ thống khóa upload hoặc hiển thị cảnh báo.

## 15. Kiểm thử lỗi và phân quyền Author

**Mục đích:** đảm bảo hệ thống bảo vệ dữ liệu và hướng dẫn người dùng rõ khi thao tác sai.

**Checklist**

- Đăng xuất rồi truy cập trực tiếp `/role/author`: phải bị chuyển về login.
- Author truy cập URL submission của người khác: phải bị chặn hoặc không thấy dữ liệu.
- Author truy cập trang Chair như `/role/chair`: phải bị chặn nếu không có quyền.
- Bỏ trống title khi submit: phải có lỗi validation.
- Upload file sai định dạng: phải có lỗi rõ ràng.
- Submit sau deadline: phải bị chặn.
- Submit rebuttal khi rebuttal phase đóng: phải bị chặn.
- Refresh trang ở giữa wizard: dữ liệu draft/autosave không mất nếu đã lưu.

## 16. Kết luận pass/fail cho role Author

Role Author được xem là **pass** khi:

- Tạo/sửa hồ sơ được.
- Tìm và đọc hội nghị được.
- Tạo draft, submit bài, xem danh sách và chi tiết submission được.
- Validation file, deadline, COI và quyền truy cập hoạt động đúng.
- Xem review, gửi rebuttal và xem final decision được.
- Với bài accepted, nộp camera-ready được nếu hội nghị yêu cầu.

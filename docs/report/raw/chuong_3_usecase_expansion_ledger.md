# Ledger mở rộng use case cho Chương 3

## 1. Trạng thái và mục đích

Tài liệu này là ledger tiền triển khai cho việc mở rộng phần use case trong Chương 3. Ledger xác định rõ nội dung sẽ thêm, nội dung sẽ giữ, cách tổ chức lại và các điều kiện phải kiểm tra trước khi chỉnh sửa file Chương 3 chính.

**Trạng thái:** Chờ review và phê duyệt trước khi áp dụng.

**File đích dự kiến:** `docs/report/compiled/final_combined/03-xay-dung-he-thong.md`.

**Nguyên tắc nguồn sự thật:**

1. Chương 1 xác định mục tiêu, phạm vi và đóng góp của đề tài.
2. Chương 2 xác định 21 yêu cầu chức năng hiện hành và các nguyên tắc sử dụng AI.
3. Chương 3 hiện tại là nền nội dung cần bảo toàn.
4. Code và kiểm thử trong repository được dùng để xác minh hành vi triển khai.
5. File `docs/report/compiled/markdown/chapter_3-xay-dung-he-thong.md` chỉ là nguồn tham khảo ý tưởng; không được sao chép nguyên khối.

## 2. Kết luận thiết kế

Phần use case sẽ được mở rộng từ bốn đặc tả hiện tại thành **mười use case đại diện**. Mười use case này bao phủ toàn bộ vòng đời của ba vai trò chính, 21 yêu cầu chức năng ở Chương 2 và các đóng góp cốt lõi của đề tài, nhưng không biến mọi endpoint hoặc tác vụ nền thành một use case riêng.

Ba thay đổi có giá trị lớn nhất là:

- Bổ sung các luồng nghiệp vụ nền tảng để chứng minh ConferenceSpace là một platform hoàn chỉnh, không chỉ là tập hợp feature AI.
- Bổ sung use case Discussion theo submission vì đây là điểm giao giữa Tác giả, Người phản biện và Chair, đồng thời là một nguồn bằng chứng cho Chair Decision Copilot.
- Thêm ma trận truy vết trực tiếp từ yêu cầu Chương 2 đến use case và mục thiết kế ở Chương 3.

## 3. Phạm vi thay đổi theo cấu trúc Chương 3

### 3.1. Mục 3.2.1 - Tác nhân hệ thống

**Giữ lại:**

- Ba vai trò chính: Tác giả, Người phản biện và Chair/Co-chair.
- Quản trị hệ thống, AI service và tác vụ nền là tác nhân hỗ trợ.

**Bổ sung hoặc làm rõ:**

- Phân biệt **tác nhân nghiệp vụ chính** với **tác nhân kỹ thuật hỗ trợ**.
- Nêu Discussion là luồng liên vai trò nhưng quyền của các vai trò không giống nhau.
- Không nâng PC, cron job hoặc AI service thành trọng tâm ngang hàng với ba vai trò trong phạm vi đề tài.

### 3.2. Mục 3.2.2 - Các use case chính

**Thay sơ đồ hiện tại bằng hai lớp biểu diễn:**

1. **Sơ đồ use case tổng quát theo ba vai trò:** thể hiện mười use case đại diện và quan hệ giữa chúng.
2. **Sơ đồ chức năng xuyên vai trò:** thể hiện Discussion, Chatbot Agent, notification và kiểm soát truy cập là các khả năng dùng chung hoặc liên vai trò.

**Bổ sung bảng truy vết:**

| Cột | Nội dung |
|---|---|
| Mã yêu cầu | Mã hiện hành trong Chương 2 |
| Use case đáp ứng | Một hoặc nhiều use case trong danh sách mười use case |
| Mục thiết kế liên quan | Mục 3.3, 3.4 hoặc 3.5 giải thích cơ chế |
| Ranh giới/ghi chú | Điều kiện con người kiểm soát, giới hạn triển khai hoặc concern xuyên suốt |

### 3.3. Mục 3.2.3 - Đặc tả use case quan trọng

Mỗi use case sử dụng cùng một cấu trúc:

1. **Mục tiêu và giá trị đối với vấn đề ở Chương 1–2.**
2. **Tác nhân chính và tác nhân phối hợp.**
3. **Sự kiện kích hoạt.**
4. **Điều kiện tiên quyết.**
5. **Luồng chính.**
6. **Luồng thay thế và trường hợp lỗi.**
7. **Hậu điều kiện.**
8. **Sơ đồ Mermaid.**
9. **Giải thích ranh giới trách nhiệm và liên kết tới mục thiết kế chi tiết.**

Không lặp lại shape input/output chi tiết của các workflow AI ở mục 3.5. Phần use case chỉ mô tả mục tiêu người dùng và luồng tương tác; mục 3.5 tiếp tục chịu trách nhiệm giải thích workflow AI ở mức kỹ thuật.

### 3.4. Các mục thiết kế liên quan

- **Mục 3.3.2:** bổ sung liên kết giữa workspace theo vai trò và các use case mới.
- **Mục 3.3.3:** bổ sung ma trận quyền Discussion ở mức ngắn gọn.
- **Mục 3.3.5:** chỉ thêm luồng hệ thống nếu chưa được biểu diễn trong use case; tránh lặp lại cùng một sơ đồ.
- **Mục 3.4.4:** giữ notification routing, deadline gating và trạng thái nghiệp vụ là cơ chế xuyên suốt.
- **Mục 3.5:** giữ nguyên sáu workflow AI; không tạo workflow Track Recommendation độc lập.
- **Mục 3.7:** cập nhật tổng kết để phản ánh cả nghiệp vụ platform, thuật toán xác định, Discussion và AI hỗ trợ.

## 4. Danh sách mười use case sẽ có trong Chương 3

### UC-01. Khám phá và theo dõi hội nghị

**Trạng thái:** Thêm mới.

**Tác nhân chính:** Tác giả.

**Nội dung sẽ bổ sung:**

- Tìm kiếm và lọc hội nghị.
- Xem thông tin hội nghị, CFP, track và hạn chót.
- Đánh dấu hội nghị quan tâm.
- Chuyển từ bước khám phá sang quy trình nộp bài.

**Luồng thay thế/lỗi cần nêu:** không có hội nghị phù hợp; hội nghị đã đóng nhận bài; người dùng chưa đăng nhập khi muốn đánh dấu quan tâm.

**Hậu điều kiện:** tác giả chọn được hội nghị hoặc lưu hội nghị để theo dõi.

**Sơ đồ:** Activity diagram.

**Truy vết:** `F-AUTHOR-01`.

### UC-02. Hoàn tất và kiểm tra bài nộp

**Trạng thái:** Viết lại UC-01 hiện tại để tên use case phản ánh toàn bộ hành trình, không chỉ một workflow AI.

**Tác nhân chính:** Tác giả.

**Nội dung sẽ giữ và bổ sung:**

- Tạo draft và tải bản thảo.
- Submission Autofill trích xuất metadata; khả năng gợi ý track được mô tả như một đầu ra của workflow này.
- Tác giả kiểm tra và chỉnh sửa dữ liệu AI tạo.
- Submission Gating thực hiện pre-check trước khi gửi chính thức.
- Khai báo COI, xem lại và xác nhận gửi.

**Luồng thay thế/lỗi cần nêu:** file không đọc được; Autofill lỗi và chuyển sang nhập tay; Gating trả `warn`; Gating trả `block` cho lỗi policy/hình thức có căn cứ; hội nghị đã hết hạn.

**Hậu điều kiện:** submission được lưu ở trạng thái draft hoặc được gửi chính thức sau xác nhận của tác giả.

**Sơ đồ:** Activity diagram có các nhánh Autofill thủ công, `pass/warn/block` và xác nhận cuối.

**Truy vết:** `F-AUTHOR-02`, `F-AUTHOR-03`, `F-AUTHOR-04`, `F-AUTHOR-05`.

### UC-03. Quản lý vòng đời bài nộp

**Trạng thái:** Thêm mới.

**Tác nhân chính:** Tác giả.

**Nội dung sẽ bổ sung:**

- Xem danh sách và trạng thái các bài đã tạo.
- Tiếp tục chỉnh sửa draft và autosave.
- Chỉnh sửa hoặc rút bài trong phạm vi policy cho phép.
- Xem review và quyết định.
- Gửi rebuttal khi giai đoạn được mở.
- Nộp camera-ready khi bài được chấp nhận.

**Luồng thay thế/lỗi cần nêu:** thao tác sau deadline; trạng thái submission không cho phép sửa/rút; rebuttal chưa mở hoặc đã đóng; camera-ready chỉ nhận bài đã được chấp nhận và file hợp lệ.

**Hậu điều kiện:** trạng thái và artifact của submission được cập nhật theo đúng transition nghiệp vụ.

**Sơ đồ:** State-oriented activity diagram, không vẽ Decision Copilot như tác nhân ra quyết định.

**Truy vết:** `F-AUTHOR-06`.

**Ranh giới:** chỉ mô tả upload camera-ready; không tuyên bố hệ thống có workflow Chair phê duyệt hoặc yêu cầu nộp lại camera-ready khi code chưa hỗ trợ.

### UC-04. Tiếp nhận lời mời và quản lý bài được phân công

**Trạng thái:** Thêm mới.

**Tác nhân chính:** Người phản biện.

**Tác nhân phối hợp:** Chair.

**Nội dung sẽ bổ sung:**

- Nhận lời mời trong hệ thống hoặc qua email.
- Chấp nhận/từ chối lời mời.
- Xem dashboard và danh sách bài được phân công.
- Xem deadline, trạng thái, metadata và file bản thảo.
- Mở workspace phản biện.

**Luồng thay thế/lỗi cần nêu:** invitation hết hạn hoặc không hợp lệ; reviewer từ chối; assignment chưa được xác nhận; người dùng không sở hữu assignment.

**Hậu điều kiện:** reviewer tham gia hoặc từ chối; assignment hợp lệ trở thành đầu vào của quá trình phản biện.

**Sơ đồ:** Sequence diagram giữa Chair, hệ thống email, reviewer và backend.

**Truy vết:** `F-REVIEWER-01`, một phần `F-REVIEWER-02`.

### UC-05. Đọc, soạn và gửi phản biện có AI hỗ trợ

**Trạng thái:** Mở rộng và tái cấu trúc UC-03 hiện tại.

**Tác nhân chính:** Người phản biện.

**Nội dung sẽ giữ và bổ sung:**

- Xem bài và khởi tạo Reviewer Initial Analysis.
- Reviewer đọc bản thảo và tự hình thành đánh giá chuyên môn.
- Nhập điểm, nhận xét, recommendation và confidence.
- Lưu draft qua nhiều phiên.
- Chạy Review Quality Auditor trước khi gửi.
- Xử lý `pass`, `warn`, `block` theo ranh giới đã giải thích ở mục 3.5.
- Gửi review chính thức.
- Xem rebuttal, acknowledgement và cập nhật đánh giá sau rebuttal nếu cần.

**Luồng thay thế/lỗi cần nêu:** Initial Analysis không khả dụng; artifact đã stale; Auditor lỗi; false block; reviewer lưu nháp thay vì gửi; deadline đã qua.

**Hậu điều kiện:** review được lưu nháp hoặc gửi chính thức; mọi nhận định học thuật vẫn thuộc về reviewer.

**Sơ đồ:** Activity diagram theo vòng đời review; không gộp hai workflow AI thành một hộp xử lý mơ hồ.

**Truy vết:** phần còn lại của `F-REVIEWER-02`, `F-REVIEWER-03`, `F-REVIEWER-04`, `F-REVIEWER-05`, `F-CHAIR-06`.

### UC-06. Phân công phản biện có kiểm tra xung đột lợi ích

**Trạng thái:** Giữ UC-02 hiện tại và bổ sung cấu trúc đặc tả chuẩn.

**Tác nhân chính:** Chair.

**Nội dung sẽ giữ và bổ sung:**

- Chuẩn bị tập submission và reviewer hợp lệ.
- Tính điểm phù hợp bằng thuật toán xác định.
- Chạy các lớp kiểm tra COI.
- Loại COI như ràng buộc cứng.
- Áp dụng ràng buộc tải và số reviewer cần thiết.
- Hiển thị điểm và lý do để Chair kiểm tra.
- Chair xác nhận, điều chỉnh hoặc ghi đè trước khi lưu.

**Luồng thay thế/lỗi cần nêu:** thiếu reviewer; tín hiệu domain yếu; bài chưa đủ reviewer sau fallback; Neo4j hoặc nguồn dữ liệu học thuật không khả dụng; Chair chuyển sang phân công thủ công.

**Hậu điều kiện:** proposal được tạo hoặc assignment được Chair xác nhận.

**Sơ đồ:** Activity diagram giữ rõ ba lớp scoring, COI và human confirmation.

**Truy vết:** `F-CHAIR-03`, `F-CHAIR-04`, `F-CHAIR-05`.

### UC-07. Quản lý hội nghị và theo dõi tiến độ

**Trạng thái:** Thêm mới.

**Tác nhân chính:** Chair/Co-chair.

**Nội dung sẽ bổ sung:**

- Tạo và cấu hình hội nghị, track, deadline, review form và policy.
- Mời và quản lý committee/reviewer.
- Theo dõi số bài, tiến độ review, COI và tác vụ cần xử lý.
- Mở, cấu hình và kết thúc giai đoạn rebuttal.
- Chuyển tới các luồng phân công, Discussion và quyết định.

**Luồng thay thế/lỗi cần nêu:** cấu hình deadline không hợp lệ; thiếu reviewer; không đủ review để mở bước tiếp theo; người dùng không có quyền Chair/Co-chair.

**Hậu điều kiện:** hội nghị có cấu hình hợp lệ và Chair có trạng thái vận hành cập nhật.

**Sơ đồ:** Activity diagram theo lifecycle của hội nghị, không liệt kê từng endpoint.

**Truy vết:** `F-CHAIR-01`, `F-CHAIR-02`.

### UC-08. Trao đổi theo submission

**Trạng thái:** Thêm mới; đây là use case liên vai trò bị thiếu trong Chương 3 hiện tại.

**Tác nhân chính:** Người phản biện được phân công và Tác giả.

**Tác nhân giám sát:** Chair/Co-chair.

**Hành vi đã được xác minh từ backend và kiểm thử:**

- Chỉ reviewer được phân công có thể tạo thread trong giai đoạn conference ở trạng thái reviewing.
- Reviewer sở hữu thread và tác giả của submission có thể gửi message trong thread.
- Reviewer chỉ xem thread của chính mình; tác giả xem các thread của submission; Chair xem toàn bộ thread và message của submission.
- Chair hiện có quyền quan sát nhưng backend không cho tạo thread hoặc gửi message.
- Message mới tạo notification cho bên còn lại.
- Participant hợp lệ có thể tải lên hoặc tải xuống tệp đính kèm.
- Nội dung Discussion được dùng làm một nguồn evidence của Chair Decision Copilot.

**Luồng thay thế/lỗi cần nêu:** conference không ở giai đoạn reviewing; người dùng không liên quan tới submission; reviewer khác truy cập thread không thuộc mình; Chair chỉ quan sát; attachment không hợp lệ hoặc vượt giới hạn.

**Hậu điều kiện:** thread/message được lưu, bên liên quan nhận notification và Discussion trở thành một phần lịch sử trao đổi của submission.

**Sơ đồ:** Sequence diagram thể hiện reviewer khởi tạo, author/reviewer trao đổi, Chair quan sát và notification được phát sinh.

**Truy vết:** bổ sung sự cụ thể hóa cho `F-AUTHOR-06`, `F-REVIEWER-02`, `F-CHAIR-02`, `F-COMMON-02`, `F-COMMON-03`.

**Điểm phải xử lý thận trọng khi viết:**

1. Frontend hiện có mã giao diện cho Chair tạo thread/gửi message, nhưng backend và API test từ chối hai thao tác này.
2. Database có trường `visibility` với các giá trị `committee`, `reviewers`, `authors`, nhưng truy vấn backend hiện chưa lọc danh sách thread theo trường này.
3. Vì vậy, báo cáo không được tuyên bố cơ chế visibility nhiều tầng đã được cưỡng chế đầy đủ. Nếu đề cập, phải ghi đây là cấu trúc dữ liệu hoặc hướng thiết kế chưa hoàn thiện, không phải bảo đảm bảo mật đã được kiểm chứng.

### UC-09. Tổng hợp bằng chứng hỗ trợ Chair ra quyết định

**Trạng thái:** Giữ và mở rộng UC-04 hiện tại.

**Tác nhân chính:** Chair.

**Nội dung sẽ giữ và bổ sung:**

- Thu thập review, điểm số, thay đổi sau rebuttal, Discussion và phản hồi tác giả.
- Kiểm tra fingerprint và trạng thái artifact.
- Chair Decision Copilot tổng hợp đồng thuận, bất đồng, vấn đề còn mở và evidence pointer.
- Chair đối chiếu với dữ liệu gốc.
- Chair tự đưa ra và lưu quyết định cuối cùng.

**Luồng thay thế/lỗi cần nêu:** thiếu review; chưa kết thúc giai đoạn cần thiết; artifact stale; AI service lỗi; Chair tiếp tục quyết định bằng dữ liệu gốc.

**Hậu điều kiện:** bản tổng hợp được lưu làm artifact hỗ trợ; quyết định chỉ được tạo bởi Chair.

**Sơ đồ:** Sequence hoặc activity diagram tách rõ bước AI tổng hợp khỏi bước Chair quyết định.

**Truy vết:** `F-CHAIR-07`.

### UC-10. Truy vấn trạng thái và hướng dẫn theo ngữ cảnh bằng Chatbot Agent

**Trạng thái:** Thêm mới vào phần use case; giữ mô tả kỹ thuật chi tiết ở mục 3.5.

**Tác nhân chính:** Tác giả, Người phản biện và Chair.

**Nội dung sẽ bổ sung:**

- Người dùng đặt câu hỏi về trạng thái, thao tác hoặc dữ liệu được phép xem.
- Agent xác định có cần gọi backend query endpoint hay không.
- Backend xác thực cả danh tính người dùng, service token, resource và phạm vi quyền.
- Agent tổng hợp câu trả lời từ dữ liệu được phép.
- Câu trả lời hiển thị cho đúng vai trò và ngữ cảnh.

**Luồng thay thế/lỗi cần nêu:** câu hỏi không cần dữ liệu; tool call không hợp lệ; người dùng không có quyền; query không được registry cho phép; service lỗi hoặc không có bằng chứng đủ để trả lời.

**Hậu điều kiện:** người dùng nhận câu trả lời hoặc lỗi có giải thích; agent không truy cập database trực tiếp và không vượt quyền.

**Sơ đồ:** Sequence diagram Browser/Frontend, AI Service, Backend Query Engine và nguồn dữ liệu.

**Truy vết:** `F-COMMON-01`, `F-COMMON-03`.

## 5. Ma trận truy vết 21 yêu cầu Chương 2

| Mã yêu cầu | Use case đáp ứng | Mục thiết kế hỗ trợ |
|---|---|---|
| F-AUTHOR-01 | UC-01 | 3.3.2, 3.4.4 |
| F-AUTHOR-02 | UC-02 | 3.3.2, 3.3.3, 3.3.4 |
| F-AUTHOR-03 | UC-02 | 3.5.2.1 |
| F-AUTHOR-04 | UC-02 | 3.5.2.1 |
| F-AUTHOR-05 | UC-02 | 3.5.2.2 |
| F-AUTHOR-06 | UC-03, UC-08 | 3.3.2, 3.3.4, 3.4.4 |
| F-REVIEWER-01 | UC-04 | 3.3.2, 3.3.3 |
| F-REVIEWER-02 | UC-04, UC-05, UC-08 | 3.3.2, 3.3.3 |
| F-REVIEWER-03 | UC-05 | 3.3.2, 3.3.4 |
| F-REVIEWER-04 | UC-05 | 3.5.2.3 |
| F-REVIEWER-05 | UC-05 | 3.5.2.3, 3.5.2.4 |
| F-CHAIR-01 | UC-07 | 3.3.2, 3.3.3 |
| F-CHAIR-02 | UC-07, UC-08 | 3.3.2, 3.4.4 |
| F-CHAIR-03 | UC-06 | 3.4.2 |
| F-CHAIR-04 | UC-06 | 3.4.3 |
| F-CHAIR-05 | UC-06 | 3.4.2, 3.4.3 |
| F-CHAIR-06 | UC-05 | 3.5.2.4 |
| F-CHAIR-07 | UC-09 | 3.5.2.5 |
| F-COMMON-01 | UC-10 | 3.5.2.6 |
| F-COMMON-02 | Concern xuyên suốt UC-02 đến UC-09 | 3.3.2, 3.4.4 |
| F-COMMON-03 | Concern xuyên suốt cả mười use case | 3.3.3, 3.6.7 |

## 6. Nội dung từ file Chương 3 cũ không được mang sang

- Hệ thống 88 mã chức năng cũ.
- Track Recommendation như một workflow AI độc lập.
- Các câu mô tả lịch sử chỉnh sửa như "trước bản cập nhật", "bị bỏ sót" hoặc "đã có".
- UC riêng cho Admin token, cron job hoặc AI callback.
- Khẳng định Chair đã có workflow duyệt/yêu cầu nộp lại camera-ready.
- Khẳng định AI Service có thể tùy ý cập nhật dữ liệu backend.
- Model, rate limit, cấu hình server và số liệu triển khai lỗi thời.
- Các sơ đồ lặp lại nội dung đã được giải thích đầy đủ ở mục 3.3–3.6.

## 7. Tiêu chí kiểm tra trước khi áp dụng

### 7.1. Kiểm tra nội dung

- [ ] Mười use case bao phủ đủ 21 yêu cầu Chương 2.
- [ ] Ba vai trò chính xuất hiện nhất quán với phạm vi Chương 1.
- [ ] Discussion mô tả đúng quyền bất đối xứng giữa reviewer, author và Chair.
- [ ] Không biến Track Recommendation thành workflow riêng.
- [ ] Không mô tả AI là tác nhân ra quyết định học thuật.
- [ ] Không đưa endpoint, header hoặc chi tiết code vào phần use case nếu không giúp giải thích ranh giới hệ thống.

### 7.2. Kiểm tra cấu trúc

- [ ] Sơ đồ tổng quát không quá dày và vẫn đọc được khi render trong báo cáo.
- [ ] Mỗi use case có đúng một mục tiêu người dùng chính.
- [ ] Các sơ đồ use case không lặp lại sơ đồ workflow AI ở mục 3.5.
- [ ] Notification và RBAC được trình bày như concern xuyên suốt, không bị tách thành use case giả.
- [ ] Số hình, bảng và tham chiếu chéo được đánh lại liên tục sau khi chèn.

### 7.3. Kiểm tra bằng chứng

- [ ] Mọi capability được đối chiếu với route, service, storage hoặc test hiện hành.
- [ ] Các chênh lệch frontend/backend của Discussion không bị che giấu.
- [ ] Camera-ready chỉ được mô tả trong phạm vi upload/download hiện có.
- [ ] Chatbot Agent giữ nguyên cơ chế backend query có xác thực kép và resource registry.
- [ ] Các transition trạng thái và deadline được kiểm tra lại trước khi viết luồng ngoại lệ.

### 7.4. Kiểm tra văn phong học thuật

- [ ] Không có câu mang tính instruction, changelog hoặc hội thoại nội bộ.
- [ ] Mỗi phần giải thích vì sao use case quan trọng đối với bài toán nghiên cứu.
- [ ] Không liệt kê feature thuần túy mà thiếu luồng, ranh giới và hậu điều kiện.
- [ ] Thuật ngữ Author/Reviewer/Chair được dùng nhất quán với Chương 1–2.
- [ ] Phần use case cân bằng giữa nghiệp vụ platform, thuật toán xác định và AI hỗ trợ.

## 8. Trình tự áp dụng sau khi ledger được phê duyệt

1. Viết lại mục 3.2.1 và 3.2.2, sau đó kiểm tra sơ đồ tổng quát cùng ma trận truy vết.
2. Viết các UC-01 đến UC-03 cho vòng đời Tác giả.
3. Viết các UC-04 và UC-05 cho vòng đời Người phản biện.
4. Viết các UC-06, UC-07 và UC-09 cho vòng đời Chair.
5. Viết UC-08 Discussion và UC-10 Chatbot Agent như hai luồng xuyên vai trò.
6. Cập nhật các liên kết ngắn ở mục 3.3, 3.4, 3.5 và tổng kết 3.7.
7. Đọc lại toàn bộ Chương 3 để loại trùng lặp, kiểm tra số hình/bảng và xác minh mọi capability với code.


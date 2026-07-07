# Chương 2. Khảo sát nhu cầu, hiện trạng và khoảng trống nghiên cứu

## 2.1. Khảo sát nhu cầu

### 2.1.1 Mục tiêu khảo sát

Khảo sát này được thực hiện nhằm mục đích xác định rõ nhu cầu thực tế của người dùng đối với một nền tảng quản lý hội nghị khoa học. Thông qua việc tìm hiểu những khó khăn (pain points) mà người dùng đang gặp phải trên các hệ thống hiện tại (như Microsoft CMT, EasyChair, OpenReview, Google Form), nhóm nghiên cứu mong muốn xác định được:

- Các tính năng thiết yếu cần có và mức độ ưu tiên của từng chức năng đối với từng nhóm người dùng.
- Sự quan tâm và phản hồi đối với các công cụ trợ lý AI được tích hợp vào hệ thống nhằm hỗ trợ quy trình tổ chức, nộp bài và phản biện.

Kết quả của cuộc khảo sát đóng vai trò là cơ sở thực tiễn quan trọng, cung cấp minh chứng cho các quyết định thiết kế kiến trúc, giao diện (UX/UI) và luồng xử lý nghiệp vụ cho hệ thống ConferenceSpace ở các chương sau.

### 2.1.2 Đối tượng khảo sát

Khảo sát đã nhận được tổng cộng 71 phản hồi hợp lệ từ đa dạng các nhóm đối tượng đang học tập và làm việc trong môi trường học thuật, nghiên cứu và doanh nghiệp.

_![Biểu đồ phân bố đối tượng tham gia khảo sát](link_hinh_anh_google_forms_vao_day)_

Cụ thể, các nhóm đối tượng bao gồm:

- **Sinh viên đại học / Học viên cao học:** Là nhóm người dùng trẻ, thường xuyên đóng vai trò là tác giả nộp bài (Author). Nhóm này giúp hệ thống định hình được trải nghiệm nộp bài (submission) thân thiện, dễ hiểu, không đòi hỏi phải đọc quá nhiều tài liệu hướng dẫn.
- **Giảng viên / Nhà nghiên cứu:** Đây là nhóm chuyên gia có nhiều kinh nghiệm, tham gia với nhiều vai trò linh hoạt: từ Author, Reviewer đến Chair/Ban tổ chức. Ý kiến của họ cực kỳ quan trọng để đánh giá mức độ thiết thực của các tính năng chuyên sâu và các công cụ hỗ trợ ra quyết định.
- **Người làm trong doanh nghiệp có tham gia hội nghị khoa học:** Mang đến góc nhìn thực tiễn về tính ứng dụng, bảo mật và sự tiện lợi, nhanh chóng của hệ thống.

Sự đa dạng về đối tượng giúp đảm bảo rằng hệ thống thu thập được yêu cầu nghiệp vụ toàn diện từ tất cả các bên tham gia vào vòng đời của một hội nghị khoa học.

### 2.1.3 Phương pháp khảo sát

Khảo sát được thực hiện thông qua hình thức biểu mẫu trực tuyến (Google Forms). Phương pháp này được lựa chọn vì tính tiện lợi, dễ dàng tiếp cận với cộng đồng nghiên cứu khoa học ở nhiều khu vực khác nhau, đồng thời hỗ trợ xuất dữ liệu ra định dạng Excel để phân tích định lượng.

Biểu mẫu được thiết kế có hệ thống với các nhóm câu hỏi kết hợp:

- **Trắc nghiệm chọn một hoặc chọn nhiều:** Nhằm đánh giá mức độ đồng ý, khảo sát thói quen sử dụng nền tảng (EasyChair: 32 người, CMT: 23 người, Google Form/Excel: 43 người...), và xác định các khó khăn lớn nhất (pain points).
- **Thang điểm Likert (1 - 5):** Đánh giá mức độ hữu ích của từng tính năng AI dự kiến cho các vai trò Chair, Author, và Reviewer (1: Không hữu ích -> 5: Rất hữu ích).
- **Câu hỏi mở (Tự luận):** Lấy ý kiến trực tiếp về sự mong đợi, các nguyên tắc áp dụng AI, và những thay đổi người dùng muốn có nhất ở một nền tảng mới.

### 2.1.4 Kết quả khảo sát theo từng tính năng

Dữ liệu khảo sát chỉ ra các vấn đề nhức nhối hiện tại và sự ủng hộ đối với các tính năng mới theo từng góc độ. Dưới đây là bảng phân tích chi tiết.

#### A. Những khó khăn lớn nhất (Pain Points) hiện tại

_![Biểu đồ các vấn đề người dùng gặp phải](link_hinh_anh_google_forms_vao_day)_

| Vấn đề (Pain Point)                                | Số người bình chọn | Tỷ lệ (%) | Lý do / Đánh giá                                                                                                          |
| :------------------------------------------------- | :----------------: | :-------: | :------------------------------------------------------------------------------------------------------------------------ |
| Không biết bước tiếp theo cần làm là gì            |         35         |  ~49.3%   | Giao diện các nền tảng cũ thường phức tạp, thiếu các thông báo điều hướng (call-to-action) rõ ràng.                       |
| Form nhập liệu dài và lặp lại                      |         34         |  ~47.9%   | Người dùng thường phải nhập đi nhập lại các thông tin như tên tác giả, email, abstract dù chúng đã có sẵn trong file PDF. |
| Phải đọc nhiều hướng dẫn dài trước khi thao tác    |         33         |  ~46.5%   | UX của hệ thống chưa đủ trực quan, đòi hỏi người dùng tốn thời gian làm quen với các khái niệm phức tạp.                  |
| Không có kiểm tra lỗi sớm trước khi nộp chính thức |         30         |  ~42.3%   | Việc phát hiện sai format quá muộn khiến bài nộp dễ bị loại hoặc phải sửa đổi gấp rút sát giờ deadline.                   |
| Thông báo/deadline rời rạc dễ bỏ sót               |         28         |  ~39.4%   | Thiếu một Dashboard tập trung để theo dõi tổng quan tiến độ của hội nghị.                                                 |

#### B. Đánh giá các tính năng dành cho Chair / Ban tổ chức

_(Lưu ý: Trong 71 người tham gia, chỉ có 7 người thuộc vai trò Chair)_

| Tính năng AI đề xuất                           | Mức độ ủng hộ (Điểm 4-5/5) | Giải thích / Phân tích                                                                                                                                                   |
| :--------------------------------------------- | :------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI cảnh báo Conflict of Interest (COI)**     |      Cao (5/7 người)       | Chair thường gặp khó khăn và thiếu tự tin khi kiểm tra COI thủ công. Việc tự động cảnh báo COI dựa trên quan hệ học thuật giúp tăng tính minh bạch và công bằng.         |
| **Dashboard tóm tắt tình trạng toàn hội nghị** |      Khá (4/7 người)       | Việc gom nhóm tình trạng hội nghị thành các "việc cần xử lý hôm nay" giúp Chair giảm tải nhận thức, không bị lạc trong vô số email và bảng biểu.                         |
| **AI gợi ý reviewer theo chuyên môn**          |      Thấp (2/7 người)      | Mặc dù có tiềm năng tiết kiệm thời gian, nhiều Chair chưa đặt ưu tiên cao cho tính năng này, có thể do e ngại về độ chính xác của AI so với mạng lưới chuyên gia của họ. |

#### C. Đánh giá các tính năng dành cho Author (Tác giả)

| Tính năng AI đề xuất                      | Lựa chọn phổ biến nhất                                        | Giải thích lý do người dùng lựa chọn                                                                                                                     |
| :---------------------------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI tự động điền thông tin (Auto-fill)** | "Tự điền và cho phép tôi sửa nhanh những mục sai" (21 ý kiến) | Tiết kiệm đáng kể thời gian copy-paste thủ công. Người dùng đồng ý dùng AI nhưng vẫn muốn nắm quyền kiểm soát và xác nhận cuối cùng (Human-in-the-loop). |
| **Kiểm tra format tự động trước khi nộp** | Rất hữu ích                                                   | Tác giả mong muốn hệ thống hoạt động như một "wizard đơn giản", phát hiện sớm lỗi file, lỗi template để họ yên tâm khi nhấn nút Submit.                  |

#### D. Đánh giá các tính năng dành cho Reviewer (Người phản biện)

_(Lưu ý: Có 11/71 người tham gia dưới vai trò Reviewer)_

_![Biểu đồ mức độ ủng hộ AI của Reviewer](link_hinh_anh_google_forms_vao_day)_

| Tính năng AI đề xuất                     | Mức độ ủng hộ (Điểm 4-5/5) | Phân tích đánh giá từ người dùng                                                                                                                                                                   |
| :--------------------------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI tạo bản tóm tắt trung lập**         | Khá (6/11 người)           | Giúp Reviewer nhanh chóng nắm bắt các đóng góp và phương pháp chính của một bài báo dài hàng chục trang trước khi đọc sâu.                                                                         |
| **Làm nổi bật các điểm cần kiểm tra kỹ** | Thấp (3/11 người)          | Phần lớn Reviewer (8/11) chỉ cho điểm dưới mức 4. Họ nhấn mạnh quy tắc: "AI chỉ nên làm nổi bật hoặc nhắc nhở, con người vẫn phải là người ra quyết định điểm số và nhận xét học thuật cuối cùng." |

### 2.1.5 Phân tích lý do người dùng lựa chọn tính năng

Dựa trên các bảng số liệu và ý kiến tự luận, sự ưu tiên của người dùng đối với các tính năng mới xuất phát từ các nguyên nhân cốt lõi sau:

1. **Tiết kiệm thời gian (Giảm thao tác thủ công):** Đa phần người dùng (cả Author và Chair) bị ám ảnh bởi các thao tác lặp lại vô nghĩa. Việc ứng dụng AI để tự động trích xuất thông tin, điền form, và gợi ý phân công reviewer giúp chuyển hóa các quy trình mất hàng giờ đồng hồ xuống chỉ còn vài cú click chuột và xác nhận.
2. **Tăng độ chính xác và giảm rủi ro:** Tính năng kiểm tra định dạng và cảnh báo COI tự động được lựa chọn vì nó loại bỏ yếu tố sai sót do con người (human error). Tác giả không sợ rớt bài vì thiếu file phụ; Chair không sợ phân công nhầm bài cho người cùng lab với tác giả.
3. **Giảm tải nhận thức (Cognitive Load):** Giao diện phức tạp là nguyên nhân khiến người mới bối rối (35 người chọn). Do đó, người dùng cực kỳ ưu ái các tính năng như Dashboard tập trung và AI tóm tắt công việc trong ngày, giúp họ tập trung vào chuyên môn thay vì học cách sử dụng phần mềm.
4. **Minh bạch và có kiểm soát:** Người dùng lựa chọn tính năng AI với một điều kiện tiên quyết: tính năng đó phải minh bạch (giải thích lý do gợi ý) và cho phép người dùng ghi đè (override) quyết định.

### 2.1.6 Phân tích tính năng được yêu thích nhất

Qua khảo sát, tính năng nổi bật và được kỳ vọng nhiều nhất là **"Trợ lý AI tự động đọc file và điền dữ liệu (Auto-fill) kết hợp kiểm tra lỗi format trước khi nộp bài"**, đi kèm với **"Dashboard tổng hợp công việc/deadline thông minh"**.

**Lý do tính năng này trở thành trọng tâm thiết kế:**

1. **Đánh đúng vào pain point phổ biến nhất:** Form nhập liệu dài và lặp lại là điều khiến tác giả nản lòng nhất. Việc AI giải quyết được nút thắt này sẽ lập tức tạo ra hiệu ứng "Wow" và cảm giác trải nghiệm hiện đại, nhẹ nhàng.
2. **Cân bằng hoàn hảo giữa Tự động hóa và Sự kiểm soát:** Khảo sát chỉ ra 35 người dùng (chiếm số đông) chọn phương án "Tự điền và cho phép sửa nhanh" hoặc "Bắt buộc kiểm tra từng mục". Hệ thống ConferenceSpace sẽ lấy đây làm nguyên lý thiết kế: AI làm phần việc tay chân, con người đưa ra xác nhận học thuật.
3. **Tạo lợi thế cạnh tranh cốt lõi:** Đây là tính năng có tần suất sử dụng cao nhất (mọi bài nộp đều phải qua bước này) và là "điểm chạm" (touchpoint) đầu tiên của người dùng. Một quy trình nộp bài "wizard" 3 bước đơn giản với AI hỗ trợ sẽ tạo ra sự khác biệt khổng lồ so với các hệ thống cồng kềnh truyền thống như EasyChair hay Microsoft CMT.

# Chương 2. Khảo sát nhu cầu (tiếp theo)

---

## 2.2. Khảo sát hiện trạng

Bên cạnh việc thu thập nhu cầu trực tiếp từ người dùng (mục 2.1), nhóm tiến hành khảo sát các hệ thống quản lý hội nghị học thuật hiện có trên thế giới. Mục tiêu của khảo sát này là: (i) xác định các chức năng đã được chuẩn hóa trong lĩnh vực, (ii) đánh giá mức độ đáp ứng nhu cầu người dùng của các nền tảng phổ biến, và (iii) phát hiện khoảng trống chức năng — đặc biệt liên quan đến tích hợp trí tuệ nhân tạo (AI) và trải nghiệm người dùng — làm cơ sở cho việc định hướng giải pháp của nhóm.

### 2.2.1. Mô tả các ứng dụng hiện có

Nhóm lựa chọn bốn hệ thống đại diện, bao phủ cả dạng thương mại, dạng mã nguồn mở và dạng phản biện công khai, nhằm tạo bức tranh toàn diện về hiện trạng công nghệ trong lĩnh vực quản lý hội nghị khoa học.

#### a) EasyChair

**EasyChair** (https://easychair.org) là hệ thống quản lý hội nghị lâu đời và phổ biến nhất thế giới, phục vụ hàng chục nghìn hội nghị khoa học mỗi năm kể từ khi ra mắt vào năm 2002. EasyChair hỗ trợ toàn bộ vòng đời hội nghị — từ tiếp nhận bài nộp (submission), phân công phản biện (reviewer assignment), thu thập nhận xét (review), đến ra quyết định cuối cùng (decision) và quản lý bản hoàn chỉnh (camera-ready).

**Chức năng chính:**

- Quản lý đầy đủ chu trình nghiệp vụ: CFP → Submission → Review → Decision → Camera-ready.
- Hỗ trợ nhiều track và cấu hình vai trò linh hoạt cho ban tổ chức (Chair, Co-Chair, PC member).
- Phân công phản biện thủ công và bán tự động theo lĩnh vực khai báo.
- Giao tiếp giữa Chair và Reviewer/Author thông qua email tích hợp.
- Miễn phí cho hội nghị quy mô nhỏ và vừa.

**Nhóm người dùng chính:** Tác giả, Người phản biện, Trưởng ban chương trình.

**Hạn chế đáng chú ý:**

- Giao diện người dùng lỗi thời, thiết kế theo phong cách đầu thập niên 2000, đường cong học tập cao đối với người mới — đặc biệt là sinh viên và nhà nghiên cứu trẻ.
- Không tích hợp bất kỳ tính năng AI nào: không gợi ý phản biện dựa trên nội dung bài báo, không phát hiện xung đột lợi ích (COI) tự động, không hỗ trợ trích xuất thông tin từ bản thảo.
- Kiểm tra COI phụ thuộc hoàn toàn vào khai báo thủ công của người dùng, dễ bỏ sót các mối quan hệ tiềm ẩn.
- Không có thông báo thời gian thực (real-time); người dùng phải chủ động truy cập hệ thống để kiểm tra cập nhật.
- Quy trình nộp bài không trực quan, thiếu hướng dẫn từng bước cho người dùng lần đầu sử dụng.

#### b) HotCRP

**HotCRP** (https://hotcrp.com) là hệ thống mã nguồn mở, được phát triển bởi Eddie Kohler tại Harvard và được sử dụng rộng rãi bởi các hội nghị hàng đầu về khoa học máy tính như USENIX, SIGCOMM, OSDI, SOSP.

**Chức năng chính:**

- Hệ thống phân công phản biện với cơ chế **bidding** — cho phép phản biện nêu mức độ ưu tiên đánh giá đối với từng bài nộp, từ đó Chair có thêm thông tin để phân công hợp lý hơn.
- Hỗ trợ phản biện nhiều vòng (multi-round review) với khả năng cập nhật nhận xét sau giai đoạn phản hồi tác giả.
- Tính năng **discussion thread** nội bộ giữa các phản biện và Chair để trao đổi về các bài nộp gây tranh cãi.
- Bộ lọc và tìm kiếm bài nộp mạnh mẽ, phù hợp cho hội nghị quy mô lớn.
- Hiệu năng cao, tải nhanh ngay cả với hàng nghìn bài nộp.

**Nhóm người dùng chính:** Chủ yếu hướng đến Người phản biện và Trưởng ban; trải nghiệm phía Tác giả không phải trọng tâm thiết kế.

**Hạn chế đáng chú ý:**

- Giao diện tối giản, thiên hướng kỹ thuật cao — không thân thiện với người dùng ít kinh nghiệm (sinh viên, nhà nghiên cứu trẻ).
- Không tích hợp AI cho bất kỳ khâu nào trong quy trình — đây là hạn chế đáng chú ý so với xu hướng gần đây của các hội nghị hàng đầu (ICLR, AAAI) đã bắt đầu thí điểm AI-assisted review.
- Yêu cầu tự triển khai (self-hosted), đòi hỏi kiến thức quản trị hệ thống và hạ tầng máy chủ.
- Không có thông báo real-time và không có chatbot hỗ trợ người dùng.

#### c) OpenReview

**OpenReview** (https://openreview.net) là nền tảng nổi tiếng với mô hình phản biện công khai (open peer review), được phát triển bởi UMass Amherst và sử dụng bởi các hội nghị hàng đầu trong lĩnh vực trí tuệ nhân tạo như ICLR, NeurIPS (workshop tracks) và ICML.

**Chức năng chính:**

- Hỗ trợ mô hình phản biện mở — các nhận xét và phản hồi được công bố công khai, thúc đẩy tính minh bạch trong quy trình xét duyệt.
- Cung cấp **REST API mở** cho phép nhà nghiên cứu và công cụ bên thứ ba truy xuất dữ liệu phục vụ phân tích meta-review.
- Hỗ trợ nhiều loại quy trình phản biện: single-blind, double-blind, open review.
- Tính năng rebuttal (phản hồi tác giả) được tích hợp trực tiếp vào giao diện.
- Cộng đồng người dùng lớn, đặc biệt trong ngành AI/ML.

**Nhóm người dùng chính:** Tác giả, Người phản biện — đặc biệt trong cộng đồng nghiên cứu AI.

**Hạn chế đáng chú ý:**

- Mô hình phản biện công khai không phù hợp với tất cả hội nghị, đặc biệt những hội nghị yêu cầu phản biện kín (double-blind review) truyền thống.
- Không tích hợp AI để gợi ý phản biện, phát hiện COI hay hỗ trợ trích xuất thông tin bài nộp.
- Giao diện khá phức tạp với người dùng mới, cấu hình hội nghị đòi hỏi hiểu biết kỹ thuật.
- Gần đây, OpenReview đã bắt đầu thử nghiệm tích hợp LLM-generated reviews thông qua tính năng "AI Review Assistant", nhưng đây mới chỉ là thí điểm trên quy mô hạn chế và chưa được triển khai rộng rãi như một tính năng chính thức của nền tảng.

#### d) Microsoft CMT

**Microsoft CMT** — Conference Management Toolkit (https://cmt3.research.microsoft.com) — là dịch vụ quản lý hội nghị miễn phí được phát triển bởi Microsoft Research, sử dụng bởi các hội nghị quy mô lớn như CVPR, ICCV, AAAI.

**Chức năng chính:**

- Quản lý hội nghị toàn diện với hỗ trợ multi-track và multi-phase review.
- Phân công phản biện thủ công và bán tự động.
- Tích hợp **TPMS (Toronto Paper Matching System)** — một hệ thống gợi ý phản biện sử dụng thuật toán TF-IDF cổ điển để tính toán độ tương đồng giữa hồ sơ phản biện và nội dung bài nộp.
- Về phát hiện xung đột lợi ích, CMT cung cấp hai cơ chế: Individual-based conflict management và Domain-based conflict management. Ngoài ra, CMT đã hợp tác với DBLP để tự động phát hiện co-authorship conflicts thông qua đối chiếu mã định danh DBLP của tác giả và người phản biện — một bước tiến so với các hệ thống chỉ dựa trên khai báo thủ công.
- Ổn định ở quy mô lớn (hàng nghìn bài nộp), giao diện thân thiện hơn EasyChair.
- Miễn phí hoàn toàn cho sử dụng học thuật.

**Nhóm người dùng chính:** Tác giả, Người phản biện, Trưởng ban chương trình.

**Hạn chế đáng chú ý:**

- TPMS hoạt động như một hệ thống tách rời — Chair phải xuất dữ liệu, chạy matching trên TPMS, sau đó nhập kết quả trở lại CMT. Quy trình xuất-nhập thủ công này tạo ra độ trễ và rủi ro sai sót trong quá trình chuyển đổi dữ liệu.
- TPMS sử dụng thuật toán cổ điển (TF-IDF), không tận dụng được các mô hình ngôn ngữ lớn (LLM) hiện đại có khả năng hiểu ngữ nghĩa sâu hơn.
- Cơ chế phát hiện COI qua DBLP chỉ dừng ở mức đối chiếu co-authorship trực tiếp, chưa phân tích mạng lưới đồng tác giả gián tiếp hay quan hệ COI phức tạp hơn.
- Phụ thuộc hệ sinh thái Microsoft, khó tùy biến cho nhu cầu đặc thù.
- Không có chatbot hỗ trợ và không có thông báo real-time.

### 2.2.2. Đánh giá mức độ được yêu thích

Để bổ sung cho phân tích chức năng, nhóm đánh giá mức độ phổ biến và sự chấp nhận của cộng đồng nghiên cứu đối với từng hệ thống, dựa trên ba yếu tố: (i) quy mô sử dụng — số lượng hội nghị và người dùng; (ii) phản hồi thực tế từ cộng đồng học thuật; và (iii) mức độ hiện đại hóa giao diện và trải nghiệm.

**Bảng 2.2 — Đánh giá mức độ phổ biến và trải nghiệm người dùng**

| Tiêu chí              | EasyChair                              | HotCRP                     | OpenReview                    | Microsoft CMT                 |
| --------------------- | -------------------------------------- | -------------------------- | ----------------------------- | ----------------------------- |
| Quy mô sử dụng        | Rất lớn (hàng chục nghìn hội nghị/năm) | Lớn (hội nghị CS hàng đầu) | Lớn (hội nghị AI/ML hàng đầu) | Lớn (hội nghị CV/AI hàng đầu) |
| Trải nghiệm tác giả   | Trung bình – yếu                       | Trung bình                 | Khá                           | Khá                           |
| Trải nghiệm phản biện | Trung bình                             | Tốt                        | Khá                           | Khá                           |
| Trải nghiệm Chair     | Khá                                    | Tốt                        | Khá                           | Khá                           |
| Giao diện hiện đại    | Lỗi thời                               | Tối giản                   | Trung bình                    | Trung bình                    |
| Mức độ tin tưởng      | Rất cao (truyền thống lâu năm)         | Cao (cộng đồng CS)         | Cao (minh bạch)               | Cao (Microsoft)               |

**Nhận xét tổng hợp:**

- **EasyChair** là hệ thống được sử dụng rộng rãi nhất nhờ tính miễn phí và sự quen thuộc lâu năm trong cộng đồng. Tuy nhiên, giao diện lỗi thời và thiếu hỗ trợ hiện đại khiến người dùng — đặc biệt là sinh viên và nhà nghiên cứu trẻ — gặp nhiều khó khăn khi sử dụng lần đầu. Nhiều ý kiến phản hồi cho rằng quy trình nộp bài trên EasyChair "thiếu trực quan" và "khó tìm chức năng cần thiết".

- **HotCRP** được đánh giá cao về trải nghiệm phản biện nhờ cơ chế bidding và discussion thread. Tuy nhiên, sự phức tạp trong việc tự triển khai và giao diện kỹ thuật cao khiến HotCRP phù hợp hơn với các hội nghị có đội ngũ kỹ thuật hỗ trợ, chứ không phải lựa chọn dễ tiếp cận cho hội nghị quy mô nhỏ.

- **OpenReview** nổi bật với tính minh bạch và API mở, được cộng đồng AI/ML đánh giá cao. Song, mô hình phản biện công khai gây e ngại cho một số người dùng vì lo lắng về áp lực khi nhận xét bị công bố công khai. Thí điểm AI Review Assistant gần đây là một tín hiệu tích cực, nhưng quy mô còn hạn chế nên chưa tác động đáng kể đến trải nghiệm chung của người dùng.

- **Microsoft CMT** cân bằng giữa tính hoàn chỉnh về chức năng và giao diện tương đối dễ dùng. TPMS là điểm sáng về matching reviewer, nhưng việc tách rời khỏi luồng chính và sử dụng thuật toán cổ điển hạn chế tính tiện dụng thực tế. Cơ chế phát hiện COI qua DBLP cũng là một điểm cộng, dù mới chỉ dừng ở quan hệ đồng tác giả trực tiếp.

**Điểm chung đáng chú ý:** Không có hệ thống nào trong bốn nền tảng được khảo sát cung cấp trải nghiệm "liền mạch" từ đầu đến cuối cho tất cả vai trò. Tác giả thường gặp khó khăn ở khâu nộp bài, phản biện thiếu công cụ hỗ trợ đọc hiểu, và Chair phải xử lý phần lớn công việc quản trị một cách thủ công.

### 2.2.3. So sánh với các ứng dụng khác

Để làm rõ khoảng cách giữa các giải pháp hiện có và nhu cầu thực tế đã khảo sát ở mục 2.1, nhóm xây dựng bảng so sánh chi tiết theo 22 tiêu chí, bao gồm cả chức năng cơ bản, tính năng AI nâng cao và trải nghiệm người dùng.

**Bảng 2.3 — So sánh chi tiết chức năng giữa các hệ thống quản lý hội nghị**

| Tiêu chí                                                      | EasyChair | HotCRP | OpenReview | Microsoft CMT                               | **ConferenceSpace**                           |
| ------------------------------------------------------------- | --------- | ------ | ---------- | ------------------------------------------- | --------------------------------------------- |
| Quản lý nộp bài (Submission)                                  | Có        | Có     | Có         | Có                                          | Có                                            |
| Phân công phản biện thủ công                                  | Có        | Có     | Có         | Có                                          | Có                                            |
| Bidding (phản biện nêu ưu tiên)                               | Có        | Có     | Có         | Có                                          | **Chưa có**                                   |
| Phản biện kín (blind review)                                  | Có        | Có     | Có         | Có                                          | Có                                            |
| Rebuttal (phản hồi tác giả)                                   | Có        | Có     | Có         | Có                                          | Có                                            |
| Thảo luận nội bộ (discussion thread)                          | Không     | Có     | Có         | Có                                          | Có                                            |
| Hỗ trợ nhiều track                                            | Có        | Có     | Có         | Có                                          | Có                                            |
| Mời phản biện bên ngoài                                       | Có        | Có     | Có         | Có                                          | Có                                            |
| API mở (public REST API)                                      | Không     | Không  | Có         | Không                                       | Không                                         |
| Mã nguồn mở                                                   | Không     | Có     | Không      | Không                                       | Chưa (dự kiến mở trong tương lai — mục 6.3.3) |
| **Gợi ý phản biện bằng AI**                                   | Không     | Không  | Không      | Hạn chế (TPMS)                              | **Có**                                        |
| **Phát hiện COI tự động (đồ thị đồng tác giả)**               | Không     | Không  | Không      | Hạn chế (DBLP, chỉ co-authorship trực tiếp) | **Có**                                        |
| **Trích xuất thông tin bài nộp tự động (AI Autofill)**        | Không     | Không  | Không      | Không                                       | **Có**                                        |
| **Gợi ý track phù hợp bằng AI**                               | Không     | Không  | Không      | Không                                       | **Có**                                        |
| **Submission Gating (Desk Rejection)**                        | Không     | Không  | Không      | Không                                       | **Có**                                        |
| **Hỗ trợ phân tích sơ bộ bài báo cho Reviewer**               | Không     | Không  | Không      | Không                                       | **Có**                                        |
| **Kiểm tra chất lượng bài phản biện bằng AI**                 | Không     | Không  | Không      | Không                                       | **Có**                                        |
| **Hỗ trợ ra quyết định cho Chair bằng AI (Decision Copilot)** | Không     | Không  | Không      | Không                                       | **Có**                                        |
| **Chatbot AI hỗ trợ người dùng 24/7**                         | Không     | Không  | Không      | Không                                       | **Có**                                        |
| **Thông báo real-time (WebSocket)**                           | Không     | Không  | Không      | Không                                       | **Có**                                        |
| Giao diện hiện đại, responsive                                | Không     | Không  | Hạn chế    | Hạn chế                                     | **Có**                                        |
| Hỗ trợ đa ngôn ngữ (i18n)                                     | Không     | Không  | Không      | Không                                       | **Có**                                        |

**Phân tích so sánh:**

Bảng so sánh cho thấy ba nhóm khác biệt rõ rệt giữa ConferenceSpace và các hệ thống hiện có:

**Nhóm 1 — Chức năng cơ bản đã chuẩn hóa:** Tất cả năm hệ thống đều hỗ trợ các chức năng nền tảng như quản lý nộp bài, phân công phản biện, thu thập nhận xét, và rebuttal. Đây là "bảng chuẩn" mà bất kỳ hệ thống quản lý hội nghị nào cũng cần đáp ứng. ConferenceSpace đáp ứng đầy đủ nhóm yêu cầu này.

**Nhóm 2 — Tính năng AI tiên tiến:** Đây là khoảng trống lớn nhất. Trong bốn hệ thống hiện tại, chỉ CMT (với TPMS) và OpenReview (với thí điểm AI Review Assistant) có yếu tố AI, nhưng đều ở mức cơ bản và giới hạn trong một khâu duy nhất của quy trình. ConferenceSpace là hệ thống duy nhất cung cấp sáu workflow AI phục vụ cả ba vai trò người dùng — từ trích xuất thông tin tự động (Author), phân tích sơ bộ bài báo (Reviewer), đến tổng hợp hỗ trợ ra quyết định (Chair).

**Nhóm 3 — Trải nghiệm người dùng hiện đại:** Thông báo real-time, giao diện responsive, hỗ trợ đa ngôn ngữ và chatbot 24/7 là những tính năng mà không hệ thống hiện tại nào cung cấp đầy đủ. Đây là điểm mà ConferenceSpace khác biệt rõ ràng, phản ánh trực tiếp nhu cầu đã được xác định trong khảo sát (mục 2.1).

**Một hạn chế của ConferenceSpace so với các hệ thống hiện tại:** ConferenceSpace hiện chưa hỗ trợ cơ chế **bidding** — tính năng cho phép phản biện chủ động nêu ưu tiên đánh giá bài nào. Đây là tính năng có giá trị thực tiễn (đặc biệt ở HotCRP) và được coi là hướng phát triển trong tương lai.

# Chương 2. Khảo sát nhu cầu (tiếp theo)

---

## 2.3. Khoảng trống nghiên cứu

Dựa trên kết quả khảo sát nhu cầu (mục 2.1) và khảo sát hiện trạng (mục 2.2), kết hợp với bối cảnh thực tế của lĩnh vực hội nghị học thuật — nơi số lượng bài nộp tại các hội nghị hàng đầu như NeurIPS, ICML, ICLR đã vượt ngưỡng 10.000–30.000 bài mỗi kỳ — nhóm xác định bốn khoảng trống chức năng chính của các hệ thống quản lý hội nghị hiện tại. Các khoảng trống này không chỉ phản ánh nhu cầu của người dùng mà còn thể hiện sự tụt hậu so với xu hướng công nghệ, khi các hội nghị hàng đầu đã bắt đầu thí điểm tích hợp AI vào quy trình xét duyệt.

### 2.3.1. Hạn chế của các hệ thống hiện tại

Qua phân tích bốn hệ thống đại diện (EasyChair, HotCRP, OpenReview, Microsoft CMT) kết hợp với dữ liệu khảo sát từ 71 người dùng, nhóm nhận diện bốn khoảng trống chức năng lớn mà các hệ thống hiện tại chưa giải quyết được:

#### Khoảng trống 1 — Thiếu AI hỗ trợ toàn diện trong quy trình xét duyệt

Đây là khoảng trống nghiêm trọng nhất. Mặc dù Microsoft CMT đã tích hợp TPMS cho gợi ý phản biện và OpenReview gần đây bắt đầu thí điểm AI Review Assistant, không hệ thống nào trong bốn nền tảng được khảo sát ứng dụng mô hình ngôn ngữ lớn (LLM) một cách nhất quán và xuyên suốt toàn bộ quy trình xét duyệt. Cụ thể:

- **Tác giả** phải tự nhập toàn bộ thông tin bài nộp (tiêu đề, tóm tắt, từ khóa, danh sách tác giả) một cách thủ công, dù phần lớn thông tin này đã có sẵn trong file PDF bản thảo. Theo kết quả khảo sát (mục 2.1), tính năng AI tự động điền thông tin (Autofill) được 35/50 tác giả (70%) đánh giá là **tính năng hữu ích nhất**, cho thấy nhu cầu rất lớn về giảm thao tác nhập liệu thủ công.
- **Người phản biện** không có công cụ hỗ trợ đọc hiểu sơ bộ bài báo. Phản biện phải tự đọc toàn bộ bản thảo từ đầu đến cuối trước khi bắt đầu viết nhận xét — quá trình này tốn nhiều thời gian, đặc biệt khi bài báo dài hoặc thuộc lĩnh vực liên ngành.
- **Trưởng ban (Chair)** không có công cụ tổng hợp thông minh. Khi ra quyết định chấp nhận hay từ chối một bài nộp, Chair phải tự đọc tất cả nhận xét, phản hồi rebuttal và thảo luận nội bộ — rồi tự tổng hợp trong đầu trước khi đưa ra quyết định. Với hội nghị có hàng trăm bài nộp, quy trình này vừa tốn thời gian vừa dễ bỏ sót thông tin quan trọng.

Xét riêng hai trường hợp có yếu tố AI: TPMS của CMT sử dụng thuật toán TF-IDF cổ điển, hoạt động như hệ thống tách rời (phải xuất-nhập dữ liệu thủ công) và không tận dụng được khả năng hiểu ngữ nghĩa sâu của các mô hình ngôn ngữ lớn hiện đại; còn AI Review Assistant của OpenReview mới dừng ở việc hỗ trợ sinh nội dung nhận xét trên quy mô thí điểm, chưa mở rộng sang các khâu khác như trích xuất thông tin bài nộp, gợi ý phân công phản biện hay tổng hợp hỗ trợ ra quyết định. Nói cách khác, chưa hệ thống nào cung cấp một lớp hỗ trợ AI bao trùm cả ba vai trò Tác giả, Phản biện và Trưởng ban.

#### Khoảng trống 2 — Phát hiện xung đột lợi ích (COI) còn thô sơ

Xung đột lợi ích là vấn đề nhạy cảm trong quy trình phản biện. Nếu một phản biện có mối quan hệ đồng tác giả hoặc cộng tác gần đây với tác giả bài nộp, tính khách quan của nhận xét bị ảnh hưởng nghiêm trọng.

Trong bốn hệ thống được khảo sát, EasyChair, HotCRP và OpenReview xử lý COI hoàn toàn bằng phương pháp **khai báo thủ công** — tác giả và phản biện tự khai báo các mối quan hệ. Microsoft CMT đã tiến thêm một bước khi hợp tác với DBLP để tự động đối chiếu mã định danh tác giả và phản biện, qua đó phát hiện quan hệ đồng tác giả trực tiếp mà không cần khai báo. Tuy nhiên, cơ chế này chỉ dừng ở quan hệ đồng tác giả bậc một (trực tiếp), chưa mở rộng phân tích mạng lưới đồng tác giả đa bậc (ví dụ: hai người từng cùng công bố với một tác giả trung gian) — vốn là dạng xung đột lợi ích tiềm ẩn nhưng khó tự phát hiện bằng mắt thường.

Nhìn chung, cách tiếp cận COI hiện tại của các hệ thống này — dù thủ công hay bán tự động — đều tồn tại ba hạn chế chung:

- Phụ thuộc vào ý thức và sự trung thực của người dùng (đối với phần khai báo thủ công).
- Dễ bỏ sót các mối quan hệ gián tiếp, đa bậc.
- Chưa khai thác đầy đủ dữ liệu công khai từ các cơ sở dữ liệu học thuật (Semantic Scholar, DBLP) dưới dạng phân tích đồ thị quan hệ.

#### Khoảng trống 3 — Thiếu hỗ trợ người dùng thông minh

Trong quá trình sử dụng các hệ thống quản lý hội nghị, người dùng — đặc biệt là người mới — thường gặp khó khăn với các thao tác phức tạp: cách nộp bài đúng quy định, cách viết nhận xét có chất lượng, cách phân công phản biện hiệu quả. Hiện không có hệ thống nào cung cấp:

- Chatbot hay trợ lý AI hướng dẫn thao tác trong quá trình sử dụng.
- Công cụ hỗ trợ Chair rà soát chất lượng các bài phản biện đã nộp trước khi tổng hợp ra quyết định (ví dụ: cảnh báo khi nhận xét quá ngắn, thiếu căn cứ, hoặc điểm số mâu thuẫn với nhận xét).
- Hệ thống kiểm tra sơ bộ bài nộp (desk rejection) tự động để lọc những bài không đạt yêu cầu cơ bản trước khi đưa vào quy trình phản biện chính thức.

#### Khoảng trống 4 — Thiếu thông báo real-time và giao diện hiện đại

Tất cả bốn hệ thống hiện tại chỉ dựa vào email để thông báo các sự kiện quan trọng (bài nộp mới, nhận xét hoàn thành, quyết định cuối cùng). Cơ chế này có độ trễ cao, dễ lọt vào thư rác, và không phù hợp với kỳ vọng trải nghiệm hiện đại. Kết hợp với giao diện lỗi thời (đặc biệt ở EasyChair và HotCRP), trải nghiệm tổng thể của người dùng bị ảnh hưởng đáng kể.

**Bảng 2.4 — Tổng hợp khoảng trống nghiên cứu**

| STT | Khoảng trống                                        | Hệ thống bị ảnh hưởng                       | Nhu cầu liên quan (mục 2.1)                                                                  |
| :-: | --------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
|  1  | Thiếu AI hỗ trợ toàn diện trong quy trình xét duyệt | Tất cả (EasyChair, HotCRP, OpenReview, CMT) | Autofill (70% tác giả chọn là hữu ích nhất), gợi ý track, hỗ trợ phản biện, Decision Copilot |
|  2  | Phát hiện COI còn thô sơ                            | Tất cả                                      | Phát hiện COI đáng tin cậy (ưu tiên Trung bình–Cao)                                          |
|  3  | Thiếu hỗ trợ người dùng thông minh                  | Tất cả                                      | Chatbot 24/7, kiểm tra chất lượng review, desk rejection                                     |
|  4  | Thiếu real-time và UX hiện đại                      | Tất cả                                      | Thông báo tức thì, giao diện responsive, đa ngôn ngữ                                         |

### 2.3.2. Liên kết hạn chế với giải pháp của nhóm

Giải pháp ConferenceSpace không được thiết kế một cách rời rạc mà là **phản hồi trực tiếp** đối với từng khoảng trống đã xác định. Bảng dưới đây trình bày mối liên hệ giữa từng hạn chế và thành phần tương ứng trong hệ thống:

**Bảng 2.5 — Ánh xạ khoảng trống sang giải pháp ConferenceSpace**

| Khoảng trống                                            | Giải pháp trong ConferenceSpace                                                                                                                                                                                                                                                  | Thành phần kỹ thuật                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Thiếu AI hỗ trợ toàn diện**                           | Sáu workflow AI phục vụ cả ba vai trò: Submission Autofill, Track Recommendation, Submission Gating/Desk Rejection (Author); Reviewer Initial Analysis (Reviewer); Review Quality Auditor, Chair Decision Copilot (Chair)                                                        | Python AI Service (FastAPI) + Google Gemini LLM qua LiteLLM                                   |
| **COI thủ công hoặc chỉ dò được quan hệ bậc một (CMT)** | Cơ chế phát hiện COI đa tầng: (1) Kiểm tra tự phản biện, (2) Khai báo thủ công, (3) Phân tích đồ thị đồng tác giả tự động, hỗ trợ phát hiện quan hệ đa bậc (1–3 bậc)                                                                                                             | Neo4j (graph database) + Semantic Scholar API + Composite pattern COI detector                |
| **Thiếu hỗ trợ người dùng**                             | Chatbot AI 24/7 tích hợp Function Calling để tra cứu dữ liệu hệ thống; Review Quality Auditor hỗ trợ Chair rà soát chất lượng và tính nhất quán của các bài phản biện đã nộp; Desk Rejection tự động lọc bài không đạt chuẩn cơ bản trước khi vào quy trình phản biện chính thức | Conference Agent (LLM + AgentQuery Engine) + Review Quality Auditor + Desk Rejection pipeline |
| **Thiếu real-time và UX hiện đại**                      | WebSocket push notification; giao diện Next.js 15 responsive với dark mode; hỗ trợ đa ngôn ngữ (Tiếng Anh, Tiếng Việt)                                                                                                                                                           | gorilla/websocket (Go) + Next.js 15 App Router + Tailwind CSS v4 + shadcn/ui + i18n           |

**Tính hệ thống của giải pháp:**

Điểm khác biệt quan trọng của ConferenceSpace so với cách tiếp cận "thêm tính năng" đơn thuần là sự **liên kết chặt chẽ** giữa ba lớp hệ thống:

1. **Lớp nghiệp vụ cốt lõi** (Core Business Layer): Xử lý toàn bộ quy trình xét duyệt — nộp bài, phân công, thu thập nhận xét, rebuttal, quyết định — hoạt động ổn định và độc lập, không phụ thuộc vào AI. Đây là nền tảng đảm bảo hệ thống vẫn hoạt động bình thường ngay cả khi các dịch vụ AI tạm thời không khả dụng.

2. **Lớp thuật toán** (Algorithm Layer): Gợi ý phản biện (Domain Jaccard Similarity + Greedy Matching) và phát hiện COI (đồ thị đồng tác giả trên Neo4j) — hoạt động dựa trên tính toán xác định, có thể giải thích và kiểm chứng được, không sử dụng LLM.

3. **Lớp hỗ trợ AI** (AI-Assisted Layer): Sáu workflow sử dụng LLM để hỗ trợ người dùng ở các khâu tổng hợp, trích xuất và đối chiếu thông tin. Lớp này đóng vai trò **hỗ trợ** chứ không thay thế quyết định — mọi kết quả AI đều được trình bày dưới dạng gợi ý, và quyết định cuối cùng luôn thuộc về người dùng.

Thiết kế ba lớp này đảm bảo: (i) hệ thống vẫn vận hành đầy đủ nếu AI service bị ngưng, (ii) kết quả thuật toán có thể giải thích và kiểm tra, (iii) AI không đưa ra quyết định thay người dùng — phù hợp với bản chất đòi hỏi tính trách nhiệm cao của quy trình phản biện học thuật. Việc tách lớp AI-Assisted Layer thành một microservice độc lập (mục 2.3.3) cũng tạo điều kiện thuận lợi để thay thế nhà cung cấp LLM hoặc chuyển sang mô hình triển khai on-premise trong tương lai, nhằm đáp ứng các yêu cầu bảo mật dữ liệu nghiêm ngặt hơn — một hạn chế của giải pháp hiện tại được phân tích cụ thể ở Chương 6.

### 2.3.3. Định hướng giải pháp và nguyên tắc thiết kế

Để hiện thực hóa giải pháp ba lớp nêu trên, nhóm lựa chọn một bộ công nghệ cân bằng giữa hiệu năng, chi phí và tính linh hoạt. Phần này giới thiệu ngắn gọn các công nghệ chính và vai trò của chúng; phân tích chi tiết từng công nghệ sẽ được trình bày ở Chương 4.

**Bảng 2.6 — Tổng quan công nghệ sử dụng và vai trò trong giải pháp**

| Thành phần                | Công nghệ                                             | Vai trò trong giải pháp                                                                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend API**           | Go 1.24 + Gin Framework                               | Xử lý nghiệp vụ cốt lõi với hiệu năng cao; goroutines phù hợp cho I/O-bound tasks (WebSocket, gọi API bên ngoài); kiến trúc Clean Architecture (Controller–Service–Storage) đảm bảo khả năng bảo trì                                                                    |
| **Frontend**              | Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui | Giao diện responsive, hiện đại, hỗ trợ SSR; đóng vai trò proxy layer giữa browser và backend, ẩn URL nội bộ                                                                                                                                                             |
| **Cơ sở dữ liệu quan hệ** | PostgreSQL 15                                         | Lưu trữ toàn bộ dữ liệu có cấu trúc; tận dụng JSONB cho cấu hình linh hoạt, TEXT[] cho mảng chuyên môn; 93 migration files quản lý schema                                                                                                                               |
| **Cơ sở dữ liệu đồ thị**  | Neo4j 5.15                                            | Lưu trữ và truy vấn mạng lưới đồng tác giả phục vụ phát hiện COI; graph traversal 1–3 bậc hiệu quả hơn SQL JOIN                                                                                                                                                         |
| **AI Service**            | Python + FastAPI + LiteLLM                            | Microservice độc lập chạy sáu workflow AI (Submission Autofill, Track Recommendation, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot); LiteLLM trừu tượng hóa lớp gọi LLM, cho phép chuyển đổi provider mà không sửa code |
| **LLM chính**             | Google Gemini 3.1 Flash-Lite                          | Hạn mức miễn phí phù hợp cho giai đoạn phát triển, hỗ trợ multimodal (xử lý PDF native), context window ~1M token (1.048.576 token) — phù hợp cho autofill và phân tích bài báo dài                                                                                     |
| **Chatbot gateway**       | OpenRouter                                            | Cho phép chuyển đổi model chatbot linh hoạt (Gemini, GPT, Claude) mà không thay đổi code                                                                                                                                                                                |
| **Dữ liệu học thuật**     | Semantic Scholar API                                  | Cung cấp hồ sơ tác giả, danh sách bài báo, mạng lưới đồng tác giả phục vụ gợi ý reviewer và phát hiện COI                                                                                                                                                               |
| **Real-time**             | WebSocket (gorilla/websocket)                         | Đẩy thông báo tức thì tới client khi có sự kiện mới                                                                                                                                                                                                                     |
| **Triển khai**            | Docker + Docker Compose + Caddy                       | Containerization đảm bảo nhất quán môi trường; Caddy tự động quản lý HTTPS                                                                                                                                                                                              |

**Lý do chọn Google Gemini làm nền tảng AI chính:**

Trong quá trình đánh giá các nhà cung cấp LLM, nhóm lựa chọn Google Gemini 3.1 Flash-Lite dựa trên ba yếu tố phù hợp với yêu cầu của hệ thống: (i) khả năng xử lý PDF native — cần thiết cho tính năng Autofill, (ii) context window ~1M token — hỗ trợ phân tích bài báo dài và tổng hợp nhiều nhận xét, và (iii) hạn mức miễn phí 15 request/phút và 500 request/ngày — đủ cho quy mô hội nghị vừa và nhỏ trong giai đoạn phát triển.

Thông qua LiteLLM và OpenRouter, kiến trúc hệ thống được thiết kế để có thể chuyển đổi sang các nhà cung cấp khác (OpenAI, DeepSeek) hoặc mô hình mã nguồn mở chạy cục bộ khi điều kiện thay đổi, đảm bảo tính linh hoạt và giảm phụ thuộc lâu dài.

---

_Kết quả phân tích trong các mục 2.2 và 2.3 cung cấp cơ sở trực tiếp cho việc xác định phạm vi chức năng và lựa chọn công nghệ xây dựng hệ thống ConferenceSpace. Các nội dung thiết kế chi tiết sẽ được trình bày trong Chương 3 (Xây dựng hệ thống) và Chương 4 (Công nghệ sử dụng)._

# Tổng quan và bối cảnh đề tài

## 1.1 Đặt vấn đề

Trong bối cảnh nghiên cứu khoa học ngày càng phát triển, số lượng bài báo được nộp tại các hội nghị quốc tế tăng trưởng nhanh chóng qua từng năm. Việc quản lý quy trình xét duyệt — từ tiếp nhận bản thảo, phân công phản biện, thu thập đánh giá cho đến ra quyết định chấp nhận hay từ chối — đặt ra nhiều thách thức cho ban tổ chức hội nghị.

Các nền tảng quản lý hội nghị hiện có như EasyChair [1], HotCRP [2] hay Microsoft CMT [3] tuy đã được sử dụng rộng rãi nhưng phần lớn được phát triển từ nhiều năm trước. Dựa trên những tính năng có thể quan sát qua tài liệu và giao diện công khai, các nền tảng này nhìn chung chưa tích hợp các cơ chế tự động hóa, tổng hợp thông tin, hỗ trợ ra quyết định trong quy trình phân công và kiểm tra bản thảo.

Trong quá trình khảo sát, nhóm nhận thấy quy trình xét duyệt bài báo tại các hội nghị khoa học hiện nay đối mặt với một số hạn chế cụ thể:

- **Phân công phản biện thủ công:** Việc phân công vẫn chủ yếu thực hiện thủ công, tốn thời gian và dễ xảy ra không phù hợp về chuyên môn.
- **Phát hiện xung đột lợi ích thiếu hệ thống:** Phụ thuộc nhiều vào khai báo chủ quan của người dùng, thiếu cơ chế kiểm chứng có hệ thống dựa trên dữ liệu quan hệ giữa các tác giả.
- **Thiếu công cụ hỗ trợ người dùng:** Các nền tảng hiện có chưa cung cấp công cụ hỗ trợ trong quá trình thao tác, đặc biệt đối với các vai trò ít kinh nghiệm như phản biện lần đầu hay tác giả mới nộp bài.

Từ đó, nhóm đề xuất xây dựng **ConferenceSpace** — một hệ thống hỗ trợ xét duyệt bài báo khoa học với các chức năng cốt lõi phục vụ ba vai trò chính: **Tác giả (Author)**, **Phản biện (Reviewer)** và **Chủ tịch hội nghị (Chair)**. Hệ thống được thiết kế theo kiến trúc hiện đại, kết hợp:

- Thuật toán đối sánh phản biện dựa trên độ tương đồng chuyên môn
- Cơ chế phát hiện xung đột lợi ích và phân tích đồ thị đồng tác giả
- Các mô-đun ứng dụng mô hình ngôn ngữ lớn (LLM) hỗ trợ người dùng trong các khâu tổng hợp và đối chiếu thông tin, bao gồm: trích xuất và điền tự động thông tin bài nộp (Submission Autofill), trợ lý hội thoại (Conference Agent), kiểm tra tuân thủ bản thảo, tóm lược hỗ trợ phản biện viên, hỗ trợ tổng hợp thông tin cho Chair, và rà soát chất lượng phản biện của Reviewer.

Ý nghĩa thực tiễn của đề tài nằm ở việc xây dựng một hệ thống có quy trình tự động hóa rõ ràng và giao diện hiện đại hơn so với các nền tảng truyền thống, đồng thời khảo sát khả năng ứng dụng LLM vào một số khâu trong quy trình xét duyệt ở quy mô hội nghị vừa và nhỏ.

---

## 1.2 Mục tiêu đề tài

Đề tài đặt mục tiêu xây dựng nền tảng web **ConferenceSpace** với các chức năng cốt lõi phục vụ toàn bộ vòng đời xét duyệt bài báo, bao gồm nộp bài, phân công phản biện, thu thập đánh giá và ra quyết định. Cụ thể:

### Tự động hóa phân công phản biện

Xây dựng thuật toán đối sánh phản biện dựa trên **Domain Jaccard Similarity** kết hợp ràng buộc cân bằng tải, tạo ra đề xuất phân công để Chair xem xét và xác nhận — thay vì thực hiện phân công hoàn toàn tự động.

### Phát hiện xung đột lợi ích đa tầng

Kết hợp ba lớp kiểm tra: khai báo thủ công, kiểm tra phản biện, và phân tích đồ thị đồng tác giả trên Neo4j.

### Hỗ trợ bằng AI

Tích hợp sáu mô-đun AI phục vụ các nhu cầu cụ thể trong quy trình:

| Mô-đun | Vai trò | Chức năng |
|---|---|---|
| **Submission Autofill** | Author | Trích xuất thông tin từ file bài nộp, điền tự động tiêu đề, tóm tắt, từ khóa, danh sách tác giả và đề xuất track phù hợp |
| **Conference Agent** | Tất cả | Trợ lý hội thoại hỗ trợ tra cứu và điều hướng thao tác |
| **Desk Rejection** | Author | Pipeline kiểm tra tuân thủ bản thảo trước khi nộp |
| **Tóm lược bài nộp** | Reviewer | Giúp reviewer tiếp cận nhanh nội dung bài nộp |
| **Hỗ trợ Chair** | Chair | Tổng hợp thông tin đánh giá phục vụ ra quyết định |
| **Rà soát chất lượng phản biện** | Reviewer | Phát hiện dấu hiệu đánh giá chưa nhất quán trước khi nộp |

### Câu hỏi nghiên cứu

Xa hơn, đề tài đặt ra câu hỏi nghiên cứu: trong quy trình xét duyệt, lớp nào trong ba lớp hỗ trợ — **tổ chức nghiệp vụ**, **thuật toán** và **AI** — thực sự mang lại giá trị gia tăng rõ ràng? Việc quan sát và đánh giá mức hữu ích thực tế của từng lớp giúp xác định ranh giới phù hợp giữa tự động hóa, tính toán và hỗ trợ bằng AI trong một quy trình đầy đủ tính trách nhiệm học thuật.

---

## 1.3 Phạm vi của đề tài

### Phạm vi bao gồm

Đề tài tập trung vào **quy trình xét duyệt bài báo (peer review process)** tại các hội nghị khoa học, phục vụ ba vai trò chính: Tác giả, Phản biện và Chủ tịch hội nghị. Hệ thống khai thác mạng lưới đồng tác giả và hồ sơ học thuật từ Semantic Scholar [4] để làm giàu thông tin người dùng và hỗ trợ phát hiện xung đột lợi ích.

Nội dung xây dựng bao gồm:

- **Hệ thống quản lý hội nghị trực tuyến** với các module: quản lý hội nghị, nộp bài, phân công phản biện, đánh giá, thảo luận, phản hồi tác giả và ra quyết định.
- **Thuật toán đối sánh phản biện – bài báo** dựa trên độ tương đồng chuyên môn.
- **Cơ chế phát hiện xung đột lợi ích** sử dụng cơ sở dữ liệu đồ thị Neo4j.
- **Các mô-đun hỗ trợ bằng AI** phục vụ từng vai trò như đã mô tả.

### Phạm vi không bao gồm

- Quản lý sự kiện hội nghị theo nghĩa rộng (đăng ký tham dự, xây dựng chương trình hội nghị chi tiết).
- Kết quả phân công phản biện mang tính chất **đề xuất** và yêu cầu Chair xác nhận trước khi áp dụng.
- Độ phủ của dữ liệu đồ thị đồng tác giả **phụ thuộc vào nguồn Semantic Scholar** và có thể bị giới hạn ở một số lĩnh vực chuyên biệt.
- Các mô-đun hỗ trợ bằng AI **phụ thuộc vào dịch vụ mô hình ngôn ngữ bên ngoài**, trong khi thuật toán đối sánh và phát hiện COI hoạt động độc lập.

---

## 1.4 Giải pháp và cách thực hiện

### Kiến trúc ba lớp

Nhóm tổ chức hệ thống theo ba lớp rõ ràng:

| Lớp | Nội dung | Đặc điểm |
|---|---|---|
| **Lớp nghiệp vụ cốt lõi** | Nộp bài, quản lý phản biện, theo dõi trạng thái, ra quyết định | Hành vi ổn định, kiểm tra được, không phụ thuộc vào các mô-đun hỗ trợ |
| **Lớp thuật toán** | Phân công phản biện dựa trên độ tương đồng chuyên môn; phát hiện xung đột lợi ích | Tính toán xác định, không sử dụng LLM, có thể kiểm chứng rõ ràng |
| **Lớp hỗ trợ bằng AI** | Hỗ trợ tổng hợp, đọc hiểu, đối chiếu thông tin cho người dùng | Không thay thế quyết định nghiệp vụ quan trọng; quyết định cuối thuộc về người dùng có quyền |

### Kiến trúc kỹ thuật

**Backend:**
- Ngôn ngữ Go với framework Gin [10]
- Tổ chức theo **Clean Architecture**: Controller – Service – Storage
- **PostgreSQL** cho dữ liệu quan hệ (người dùng, hội nghị, bài nộp, đánh giá)
- **Neo4j** [5] cho dữ liệu đồ thị (mạng đồng tác giả, phát hiện COI)

**Frontend:**
- **Next.js 15** [9] với App Router, React 18, Tailwind CSS v4, shadcn/ui
- WebSocket cho thông báo thời gian thực
- Hỗ trợ đa ngôn ngữ

### Thuật toán đối sánh phản biện

Hệ thống tính điểm tương đồng chuyên môn giữa mỗi cặp (phản biện, bài báo) bằng **Domain Jaccard Similarity** dựa trên lĩnh vực nghiên cứu, sau đó áp dụng **thuật toán gán tham lam (Greedy Matching)** có xét ràng buộc số bài tối thiểu và tối đa cho mỗi phản biện. Đây là phương pháp tính toán xác định, không sử dụng mô hình ngôn ngữ; phù hợp với quy mô hội nghị vừa và nhỏ, đồng thời tích hợp trực tiếp với cơ chế phát hiện COI trong cùng một quy trình phân công.

### Phát hiện xung đột lợi ích (COI)

Hệ thống triển khai ba lớp kiểm tra:

1. **Tự phản biện (self-author):** Phản biện là tác giả của bài nộp.
2. **Khai báo thủ công (declared conflict):** Người dùng tự khai báo xung đột.
3. **Phân tích quan hệ đồng tác giả trên đồ thị Neo4j** với cửa sổ thời gian cấu hình được.

### Sáu mô-đun AI

Chi tiết từng mô-đun trong lớp hỗ trợ bằng AI:

1. **Submission Autofill *(Author)*:** Nhận file bài nộp (PDF, ...), trích xuất nội dung văn bản và gọi LLM để điền tự động các trường: tiêu đề, tóm tắt, từ khóa, loại bài, ghi chú, danh sách tác giả (tên, email, đơn vị, quốc gia), và xếp hạng track phù hợp theo ngữ cảnh hội nghị. Kết quả được trả về để tác giả xem xét và xác nhận trước khi hoàn tất nộp bài.
2. **Conference Agent *(Tất cả vai trò)*:** Hỗ trợ người dùng tra cứu ngữ cảnh và điều hướng thao tác trong hệ thống.
3. **Desk Rejection *(Author)*:** Rà soát sơ bộ bài nộp trước khi đi sâu vào quy trình phản biện chính thức.
4. **Tóm lược hỗ trợ phản biện viên *(Reviewer)*:** Rút ngắn thời gian tiếp cận ban đầu, giúp phản biện nắm nhanh cấu trúc và luận điểm chính trước khi đọc chi tiết.
5. **Hỗ trợ Chair tổng hợp thông tin *(Chair)*:** Tổng hợp thông tin liên quan đến bài nộp, đánh giá và trao đổi thành một bức tranh có động hơn để hỗ trợ xem xét quyết định.
6. **Rà soát chất lượng phản biện *(Reviewer)*:** Phát hiện những dấu hiệu cho thấy nội dung phản biện chưa nhất quán, chưa căn cứ hoặc chưa bao quát các khía cạnh cơ bản của bài nộp trước khi nộp.

### Điểm khác biệt của ConferenceSpace

So với các hệ thống hiện có, ConferenceSpace kết hợp trong một nền tảng thống nhất:

- Phân tích đồ thị đồng tác giả cho COI
- Thuật toán đối sánh phản biện có xét ràng buộc
- Trợ lý hội thoại LLM
- Kiểm tra bản thảo tự động

Đây là tổ hợp tính năng mà nhóm chưa quan sát thấy trong các nền tảng EasyChair [1], HotCRP [2] hay Microsoft CMT [3] qua tài liệu công khai hiện có.

### Kết quả dự kiến

**Sản phẩm phần mềm:**

- Nền tảng web ConferenceSpace với đầy đủ chức năng cốt lõi cho ba vai trò.
- Module đối sánh phản biện tự động dựa trên Domain Jaccard Similarity và thuật toán gán tham lam có xét ràng buộc.
- Cơ chế phát hiện xung đột lợi ích đa tầng trên Neo4j.
- Conference Agent — trợ lý hội thoại hỗ trợ nhiều vai trò.
- Pipeline Desk Rejection ở mức nguyên mẫu có chức năng.
- Nền tảng thông báo thời gian thực.
- Tích hợp Semantic Scholar để làm giàu hồ sơ học thuật.

**Đánh giá và đo lường:**

| Tiêu chí | Phương pháp đo |
|---|---|
| Thời gian thực thi thuật toán phân công | So sánh với ước tính thời gian phân công thủ công trên cùng tập dữ liệu kiểm thử |
| Độ phủ phát hiện COI | Đánh giá so với phương pháp chỉ dựa vào khai báo thủ công, dùng tập dữ liệu có nhãn |
| Hiệu năng giao diện và khả năng chịu tải | Đo trong giai đoạn kiểm thử; ngưỡng mục tiêu xác định sau khi có kết quả baseline |

**Đầu ra phân tích:**

Ngoài sản phẩm phần mềm, báo cáo bao gồm:

- Mô tả kiến trúc hệ thống theo khung ba lớp và lý giải cách mỗi lớp được tổ chức.
- Mô tả cơ chế giải phân công phản biện và phân tích các ràng buộc được xử lý.
- Mô tả cơ chế phát hiện xung đột lợi ích và các lớp kiểm tra được triển khai.
- Quan sát thực nghiệm với từng mô-đun hỗ trợ bằng AI trong các tình huống sử dụng cụ thể.

Những đầu ra này giúp trả lời câu hỏi nghiên cứu cốt lõi: trong quy trình xét duyệt, chức năng nào nên được giải quyết bằng **tổ chức nghiệp vụ**, chức năng nào bằng **thuật toán có thể giải thích**, và chức năng nào mới thực sự phù hợp đưa **AI** vào hỗ trợ.

# Feedback cho "Đề cương lần 1"

## Mục đích

Tài liệu này tổng hợp nhận xét đối với nội dung trong file `Đề cương lần 1.docx`, đối chiếu với hiện trạng repo và các tài liệu kỹ thuật đang có trong dự án. Mục tiêu là chỉ ra những chỗ cần chỉnh về cách diễn đạt, phạm vi, mức độ hoàn thiện, và cách phân loại tính năng AI so với tính năng thuật toán thông thường. Tài liệu này không thay thế trực tiếp nội dung trong đề cương gốc.

## Nguyên tắc dùng trong phần nhận xét

- `sai`: nội dung không phù hợp với hiện trạng repo hoặc mô tả sai bản chất kỹ thuật.
- `phóng đại`: nội dung có phần đi xa hơn mức mà repo hiện tại chứng minh được.
- `thiếu`: nội dung còn thiếu một ràng buộc, phân loại, trạng thái triển khai, hoặc phần kế hoạch cần thiết.
- `mơ hồ`: nội dung có thể hiểu theo nhiều cách, dễ làm người đọc nhầm giữa mục tiêu dự kiến và trạng thái hiện tại.

## Nhận xét theo từng mục

### 2.1 Giới thiệu về đề tài

1. `sai`  
Phần giới thiệu đang đặt reviewer matching và COI detection vào cùng nhóm các điểm nhấn AI. Theo hiện trạng repo, đây không phải là tính năng AI.

- Reviewer matching hiện được triển khai theo hướng chấm điểm tương đồng miền nghiên cứu bằng `Domain Jaccard Similarity`, sau đó gán bằng chiến lược greedy có xét ràng buộc tải và COI.
- COI detection hiện được triển khai theo hướng khai báo thủ công, kiểm tra self-author, và phân tích quan hệ trên đồ thị Neo4j.

Hướng chỉnh:
- Đổi cách gọi từ “tính năng AI” sang “thuật toán đối sánh tự động” và “cơ chế phát hiện xung đột lợi ích dựa trên luật và đồ thị”.

2. `phóng đại`  
Conference Agent đang được mô tả như một trợ lý xuyên vai trò đã hoàn chỉnh. Trong repo, AI-001 có hiện trạng `partial`, nghĩa là đã có chatbot shell, runtime, query/tooling, nhưng phạm vi kỳ vọng rộng hơn vẫn chưa hoàn tất.

Hướng chỉnh:
- Dùng cách diễn đạt thận trọng hơn, ví dụ: “đã có nền tảng trợ lý hội thoại bước đầu”, hoặc “đang được phát triển theo hướng hỗ trợ nhiều vai trò”.

3. `thiếu`  
Phần giới thiệu chưa phản ánh đúng phổ tính năng AI đang có căn cứ trong repo. Nếu muốn nêu AI như một nét chính của đề tài, nên tách rõ:

- AI-001: Conference Agent
- AI-002: Submission Material Gating
- AI-003: Reviewer Pre-Read Briefing
- AI-006: Chair Decision Copilot
- AI-010: Review Quality Auditor

4. `mơ hồ`  
Cụm “hỗ trợ đầy đủ ba vai trò chính” có thể chấp nhận nếu hiểu theo mặt định tuyến giao diện, nhưng nếu hiểu theo toàn bộ quy trình nghiệp vụ thì còn hơi rộng, vì một số luồng phía chair vẫn còn trạng thái placeholder, blocked hoặc mock-backed.

Hướng chỉnh:
- Có thể giữ ý này, nhưng nên bổ sung một câu giới hạn rằng một số chức năng quản trị nâng cao vẫn đang trong quá trình hoàn thiện.

### 2.2 Mục tiêu đề tài

1. `sai`  
Câu “Hệ thống đối sánh phản biện tự động dựa trên AI” là không đúng với hiện trạng code. Đây là một mô-đun thuật toán, không phải mô-đun AI.

Hướng chỉnh:
- Sửa thành “Hệ thống đối sánh phản biện tự động dựa trên độ tương đồng chuyên môn và ràng buộc cân bằng tải”.

2. `phóng đại`  
Phần mô tả nền tảng như một hệ thống phục vụ toàn bộ vòng đời xét duyệt, bao gồm cả rebuttal và các giai đoạn sau quyết định, đang đi xa hơn mức mà repo hiện tại chứng minh được.

Hiện trạng cần lưu ý:
- Rebuttal write path chưa hoàn chỉnh.
- Revision decision chưa là trạng thái persist đầy đủ.
- Post-acceptance / camera-ready chưa tạo thành một pipeline trọn vẹn.

Hướng chỉnh:
- Nếu đây là mục tiêu của đề tài, cần nêu rõ là “mục tiêu hướng tới”.
- Nếu đây là mô tả hiện trạng, cần hạ giọng và ghi nhận các phần mới ở mức bước đầu hoặc đang hoàn thiện.

3. `mơ hồ`  
Mục tiêu đang trộn lẫn giữa trạng thái hiện tại và mục tiêu dự kiến. Điều này đặc biệt dễ gây lệch ở các tính năng AI:

- AI-001: `partial`
- AI-002: `needs work`
- AI-010: `partial`

Hướng chỉnh:
- Tách riêng hai lớp diễn đạt:
  - “nội dung hệ thống đang có”
  - “nội dung đề tài hướng đến hoàn thiện”

4. `thiếu`  
Mục này chưa phân loại rành mạch giữa:

- tính năng AI,
- tính năng thuật toán không dùng AI,
- tính năng nghiệp vụ thông thường.

Hướng chỉnh:
- Thêm một đoạn ngắn phân loại để tránh việc gắn nhãn AI quá rộng.

5. `thiếu`  
Mục tiêu hiện chưa nói rõ rằng:

- auto-assignment hiện mang tính gợi ý để chair duyệt/xác nhận,
- final decision state đang persist chủ yếu ở `accepted` và `rejected`.

Điểm này quan trọng vì nó ảnh hưởng trực tiếp tới cách hiểu về mức độ tự động hóa của hệ thống.

### 2.3 Phạm vi của đề tài

1. `phóng đại`  
Cụm “đầy đủ các module ... phản hồi tác giả và ra quyết định” dễ được hiểu là các luồng này đã hoàn chỉnh ở mức triển khai. Điều này chưa khớp hoàn toàn với hiện trạng.

Hướng chỉnh:
- Với rebuttal, nên diễn đạt là “đã có bề mặt giao diện và dữ liệu liên quan ở mức nhất định”, thay vì khẳng định như một quy trình đã khép kín.

2. `thiếu`  
Phần phạm vi chưa nêu rõ các giới hạn thực tế đã lộ ra trong repo:

- schedule/planning đang dựa nhiều vào dữ liệu mock,
- conference settings và CFP editing có phần đọc được nhưng chưa đầy đủ khả năng cập nhật,
- COI moderation actions chưa khả dụng,
- revision decisions đang bị disable ở giao diện,
- một số analytics có fallback hoặc synthetic behavior.

Hướng chỉnh:
- Thêm một đoạn “giới hạn triển khai hiện tại” để tránh người đọc hiểu rằng tất cả bề mặt UI đều đã là chức năng nghiệp vụ hoàn chỉnh.

3. `đúng nhưng cần giữ ranh giới`  
Phần nêu phụ thuộc của tính năng AI vào OpenRouter/Gemini là hợp lý. Tuy nhiên nên giữ ranh giới rõ rằng phụ thuộc này áp dụng cho các tính năng AI, không áp dụng cho reviewer matching và COI detection.

### 2.4 Cách tiếp cận dự kiến

1. `sai`  
“Đối sánh phản biện bằng AI” là diễn đạt chưa phù hợp. Trong code, đây là cách tiếp cận thuật toán.

Hướng chỉnh:
- Dùng cách viết: “Đối sánh phản biện tự động bằng chiến lược chấm điểm độ tương đồng miền nghiên cứu kết hợp thuật toán gán tham lam có xét ràng buộc.”

2. `sai`  
COI detection cũng không nên được mô tả như một kỹ thuật AI. Bản chất hiện tại là:

- khai báo xung đột,
- kiểm tra reviewer trùng author/co-author,
- phân tích quan hệ hợp tác trên đồ thị Neo4j.

3. `phóng đại`  
Mô tả Conference Agent đang nghiêng về bức tranh target-state hơn là trạng thái hiện tại.

Hướng chỉnh:
- Nếu giữ mô tả kỹ thuật chi tiết, nên thêm cụm như “theo hướng triển khai”, “đang được tổ chức”, hoặc “ở giai đoạn hiện tại đã có”.

4. `phóng đại`  
Submission Gating đang được mô tả như một workflow đã hoàn tất, trong khi tài liệu AI-002 cho thấy đây vẫn là phần cần tiếp tục hoàn thiện.

Hướng chỉnh:
- Đổi cách diễn đạt sang dạng “đang được xây dựng theo pipeline nhiều giai đoạn”, hoặc “hiện đã có advisory precheck làm nền”.

5. `phóng đại`  
Câu mang tính so sánh mạnh như “nền tảng đầu tiên ...” chưa có dẫn chứng đối ngoại đi kèm. Đây là dạng khẳng định dễ bị hỏi lại.

Hướng chỉnh:
- Bỏ hẳn, hoặc đổi thành một nhận định khiêm tốn hơn về hướng tiếp cận của đề tài.

6. `thiếu`  
Mục cách tiếp cận nên nêu thêm các caveat có ảnh hưởng tới kiến trúc và nghiệp vụ:

- auto-assignment vẫn cần chair xác nhận,
- analytics có phần fallback,
- schedule page chưa lấy dữ liệu từ backend,
- một số khả năng chỉnh cấu hình còn chưa nối đầy đủ.

### 2.5 Kết quả dự kiến của đề tài

1. `phóng đại`  
“Hệ thống web ConferenceSpace hoàn chỉnh” là cách diễn đạt quá mạnh so với hiện trạng và cũng hơi cứng trong một đề cương học thuật.

Hướng chỉnh:
- Dùng “hệ thống web phục vụ ... ở mức nguyên mẫu có chức năng”, hoặc “hệ thống web được phát triển với các chức năng cốt lõi”.

2. `sai`  
Nếu reviewer matching tiếp tục được liệt kê như một đầu ra AI thì cần sửa. Đây là đầu ra của mô-đun thuật toán.

3. `sai`  
Nếu Submission Gating được liệt kê như một mô-đun AI đã hoàn tất thì cần hạ mức khẳng định. Hiện trạng repo chưa chứng minh workflow mục tiêu đã đóng kín.

4. `mơ hồ`  
AI conversation assistant là có thật, nhưng đang ở mức triển khai từng phần. Không nên để người đọc hiểu là toàn bộ AI-001 đã ổn định ở phạm vi hoàn chỉnh.

5. `mơ hồ`  
AI-010 hiện có mặt trong repo nhưng chưa nên mô tả như một tính năng đã hoàn tất toàn bộ.

6. `sai/mơ hồ`  
“Hệ thống thông báo thời gian thực qua WebSocket và email” cần viết cẩn thận hơn.

- WebSocket và in-app notifications là có căn cứ rõ.
- Email nên chỉ nêu nếu tài liệu bảo vệ luận điểm này rõ hơn, hoặc ghi là “có xem xét hỗ trợ”.

7. `thiếu`  
Các chỉ tiêu định lượng như:

- “hàng trăm bài nộp”,
- “giảm đáng kể”,
- “độ phủ cao hơn”,
- “dưới 2 giây”

đang thiếu:

- baseline để so sánh,
- cách đo,
- ngữ cảnh đo,
- tiêu chí đánh giá.

Hướng chỉnh:
- Đưa chúng về dạng “mục tiêu đánh giá” thay vì “kết quả dự kiến chắc chắn đạt được”.

8. `thiếu`  
Mục này cũng nên nói rõ đầu ra của reviewer assignment là “đề xuất phân công để chair xem xét”, thay vì ngầm hiểu là phân công hoàn toàn tự động.

### 2.6 Kế hoạch thực hiện

1. `thiếu nghiêm trọng`  
Đây là phần trống lớn nhất trong đề cương hiện tại. Mục đã có tiêu đề nhưng chưa có nội dung thực chất cho:

- phân công vai trò thành viên,
- kế hoạch theo giai đoạn,
- công việc theo giai đoạn,
- mốc kiểm tra và đánh giá,
- rủi ro và phương án dự phòng.

Hướng chỉnh:
- Cần điền nội dung cụ thể ngay trong bản đề cương, vì đây là phần thường được xem để đánh giá tính khả thi của đề tài.

### Tài liệu tham khảo

1. `thiếu`  
Danh mục hiện tại hỗ trợ tương đối tốt cho:

- bối cảnh hệ thống quản lý hội nghị,
- peer review,
- reviewer matching,
- nền tảng công nghệ.

Tuy nhiên, phần này chưa đủ để nâng đỡ các phát biểu mạnh liên quan tới:

- agent architecture,
- LLM-assisted review support,
- review quality auditing,
- submission compliance / gating có yếu tố AI.

2. `thiếu`  
Nếu tiếp tục giữ AI-001, AI-002, AI-003, AI-006, AI-010 là các hướng quan trọng của đề tài, nên bổ sung thêm tài liệu ngoài repo cho các nhóm chủ đề này, đồng thời có thể dùng tài liệu nội bộ như tài liệu thiết kế để tham chiếu trong phạm vi mô tả kỹ thuật nội bộ.

## Kết luận ngắn

Điểm cần sửa rõ nhất là ranh giới giữa:

- **tính năng AI thực sự**: AI-001, AI-002, AI-003, AI-006, AI-010,
- **tính năng thuật toán/đồ thị không phải AI**: reviewer matching, COI detection.

Sau điểm này, phần cần ưu tiên tiếp theo là:

1. hạ mức khẳng định ở các đoạn đang mô tả target-state như current-state,  
2. điền đầy đủ mục `2.6`,  
3. bổ sung tài liệu tham khảo cho các luận điểm có yếu tố LLM/agent.

# Nguồn nội dung đầy đủ theo component của bộ slide ConferenceSpace

Tài liệu này là **nguồn nội dung đầy đủ** của bộ slide bảo vệ ConferenceSpace. Phần chữ đang hiển thị trên slide là phiên bản đã được chọn lọc từ tài liệu này theo giới hạn không gian trình chiếu. Mỗi mục dưới đây giữ lại toàn bộ luận điểm cần thiết để người biên tập có thể bổ sung, thay thế hoặc rút gọn nội dung mà không làm mất bối cảnh, bằng chứng hoặc giới hạn của kết luận.

Quy ước sử dụng:

- Cấu trúc được tổ chức theo thứ tự **slide → component → nội dung nguồn đầy đủ**.
- “Component” là một khối có chức năng riêng trên slide, chẳng hạn số liệu nhấn, chuỗi nguyên nhân, sơ đồ, bảng so sánh, hình kết quả hoặc câu kết luận.
- Các số liệu chỉ được lấy từ `docs/report/compiled/latex` và `docs/report/statistics`.
- Reviewer matching được xem là thuật toán xác định; không mô tả đây là AI tạo sinh.
- Kết quả TCA, NLI, UAT và các benchmark theo kịch bản được diễn giải đúng phạm vi; chúng không được dùng để suy ra chất lượng quyết định học thuật hoặc mức sẵn sàng triển khai thực tế khi báo cáo chưa có bằng chứng tương ứng.

---

## Slide 2 — Mạch trình bày

### Component 1 — Phần 1: Vấn đề và khoảng trống thiết kế

**Nội dung nguồn đầy đủ:** Phần mở đầu thiết lập bối cảnh quy mô công bố tăng, áp lực điều phối và phản biện tăng theo, trong khi việc sử dụng AI trong hoạt động phản biện đã xuất hiện nhưng chịu các ràng buộc về bảo mật, trách nhiệm học thuật và phán đoán chuyên môn. Khảo sát người dùng cho thấy nhu cầu giảm nhập liệu, nhận chỉ dẫn theo trạng thái, phát hiện thiếu sót sớm và tập trung thông báo. Đối chiếu các nền tảng hiện có cho thấy nghiệp vụ cốt lõi đã trưởng thành; khoảng trống mà đề tài xử lý nằm ở cách lựa chọn cơ chế cho từng tác vụ và cách gắn đầu ra hỗ trợ với người chịu trách nhiệm xác nhận.

### Component 2 — Phần 2: Use case và vòng đời hội nghị

**Nội dung nguồn đầy đủ:** Phần use case bắt đầu từ sơ đồ tổng quát của mười ca sử dụng và ba vai trò chính, sau đó nối các ca sử dụng thành vòng đời của một bài nộp. Mục tiêu không phải liệt kê chức năng riêng lẻ, mà làm rõ cách Tác giả, Phản biện viên và Chủ tọa cùng làm việc trên một trạng thái nghiệp vụ thống nhất. Các use case đơn giản được gom theo vai trò; các use case có ảnh hưởng lớn đến tính công bằng và trách nhiệm, gồm reviewer matching, phát hiện xung đột lợi ích và các luồng AI, được giải thích sâu hơn.

### Component 3 — Phần 3: Trách nhiệm và thiết kế kỹ thuật

**Nội dung nguồn đầy đủ:** Phần thiết kế trình bày mô hình ba lớp trách nhiệm, đường chuyển từ đầu ra hỗ trợ đến dữ liệu chính thức, kiến trúc dịch vụ, cách phân quyền theo tài nguyên và topology triển khai. Mục tiêu là chứng minh rằng ranh giới trách nhiệm không chỉ tồn tại ở mức mô tả. Backend kiểm tra quyền, trạng thái và điều kiện nghiệp vụ; các kho dữ liệu được chọn theo kiểu truy vấn; dịch vụ AI không trực tiếp ghi dữ liệu nghiệp vụ; pipeline triển khai gắn image với commit SHA để hỗ trợ truy vết phiên bản.

### Component 4 — Phần 4: Thực nghiệm và kiểm thử

**Nội dung nguồn đầy đủ:** Phần đánh giá sử dụng các nguồn bằng chứng khác nhau cho từng lớp. Backend được đánh giá bằng tải HTTP và tài nguyên; reviewer matching và COI được đánh giá bằng microbenchmark cùng các chỉ số xếp hạng và phân công; từng luồng AI được đánh giá bằng đối chiếu trực tiếp, TCA hoặc kịch bản hội thoại; UAT cung cấp bằng chứng cảm nhận. Mỗi kết quả được trình bày cùng giới hạn để tránh dùng một phép đo hẹp làm căn cứ cho một kết luận rộng hơn.

### Component 5 — Phần 5: Kết quả, hạn chế và hướng phát triển

**Nội dung nguồn đầy đủ:** Phần cuối đối chiếu sản phẩm và bằng chứng với mục tiêu đề tài; phân biệt phần đã xây dựng, phần đã được kiểm chứng trực tiếp, phần mới có chỉ số gián tiếp và phần chưa được xác nhận. Các hạn chế được nhóm theo dữ liệu và phương pháp, vận hành và quản trị dữ liệu. Hướng phát triển ưu tiên bổ sung bằng chứng có nhãn, hoàn thiện xử lý tác vụ dài và nhật ký kiểm toán, phát triển lớp truy hồi có kiểm soát, sau đó mới mở rộng nghiệp vụ và mức tự động hóa.

### Component 6 — Mệnh đề nối toàn bài

**Nội dung nguồn đầy đủ:** Mạch trình bày đi từ lý do xây dựng đến mức độ có thể bảo vệ từng kết luận. Mỗi phần trả lời một câu hỏi kế tiếp: vì sao cần hệ thống; hệ thống hỗ trợ ai và ở bước nào; trách nhiệm được đặt ở đâu; bằng chứng xác nhận được điều gì; và phần nào vẫn cần tiếp tục đánh giá.

### Kết luận đầy đủ của slide

Bộ slide không kể câu chuyện theo danh sách tính năng. Mạch lập luận bắt đầu từ áp lực và rủi ro, chuyển thành nguyên tắc thiết kế, thể hiện nguyên tắc đó trong use case và kiến trúc, rồi kiểm tra từng lớp bằng loại bằng chứng phù hợp. Nhờ vậy, kết luận cuối có thể chỉ rõ phần nào đã được xây dựng, phần nào đã được đo và phần nào chưa đủ căn cứ để khái quát.

**Nguồn nội bộ:** cấu trúc và nội dung Chương 1–5 trong `docs/report/compiled/latex`.

---

## Slide 3 — Quy mô công bố tăng gây áp lực lên quy trình xét duyệt

### Component 1 — Chuỗi tác động từ quy mô đến chất lượng xét duyệt

**Nội dung nguồn đầy đủ:** Khi số lượng bài nộp tăng, khối lượng công việc trong cùng một kỳ xét duyệt cũng tăng. Với mỗi bài nộp, ban tổ chức phải kiểm tra thông tin, lựa chọn phản biện viên phù hợp, theo dõi tiến độ và tổng hợp các nhận xét trong thời hạn của kỳ xét duyệt. Đây là những công đoạn vừa cần điều phối, vừa phụ thuộc vào chuyên môn và trách nhiệm của người tham gia quy trình.

Nếu khối lượng công việc tăng nhanh hơn nguồn phản biện viên có kinh nghiệm, thời gian dành cho từng bản thảo có thể bị thu hẹp. Việc duy trì tính nhất quán trong phân công và theo dõi tiến độ cũng trở nên khó khăn hơn, qua đó làm tăng nguy cơ suy giảm chất lượng phản biện.

### Component 2 — Bằng chứng về xu hướng tăng quy mô

**Nội dung nguồn đầy đủ:** Nghiên cứu được dẫn trong Chương 1 phân tích 87.137 công trình tại 11 hội nghị trí tuệ nhân tạo hàng đầu trong giai đoạn 2014–2023 và ghi nhận xu hướng tăng đều về số công trình được công bố và số tác giả. Số liệu này cho thấy quy mô công bố gia tăng ở nhiều hội nghị trong một giai đoạn dài; số liệu không mô tả riêng ConferenceSpace và cũng không dự báo quy mô của một kỳ hội nghị cụ thể.

### Component 3 — Quy mô bài nộp tại NeurIPS 2025

**Nội dung nguồn đầy đủ:** NeurIPS 2025 ghi nhận 21.575 bài nộp. Số liệu này thể hiện quy mô hồ sơ mà ban tổ chức phải tiếp nhận và đưa qua quy trình xét duyệt trong một kỳ hội nghị. Áp lực không chỉ nằm ở việc lưu trữ bài nộp, mà còn ở các công việc gắn với từng bài: kiểm tra thông tin, lựa chọn phản biện viên, theo dõi tiến độ và tổng hợp nhận xét.

### Component 4 — Quy mô lực lượng phản biện tại NeurIPS 2025

**Nội dung nguồn đầy đủ:** Cùng kỳ hội nghị có 21.921 phản biện viên kỹ thuật. Số liệu này cho thấy quy mô nhân sự mà một hội nghị lớn phải huy động và phối hợp để thực hiện xét duyệt. Hai số liệu về bài nộp và phản biện viên cùng mô tả quy mô vận hành của NeurIPS 2025; báo cáo không dùng chúng để thiết lập tỷ lệ giữa số bài và số phản biện viên hoặc suy ra một đơn vị công việc khác.

### Component 5 — Hàm ý đối với thiết kế hệ thống

**Nội dung nguồn đầy đủ:** Hệ thống cần giảm tải các công việc điều phối có thể chuẩn hóa, đồng thời không làm thu hẹp thời gian dành cho việc đọc bài hoặc chuyển trách nhiệm đánh giá khỏi phản biện viên và Chủ tọa. Vì vậy, bài toán không chỉ là xử lý được nhiều hồ sơ hơn, mà còn là duy trì chất lượng và trách nhiệm trong từng công đoạn của quy trình xét duyệt.

### Kết luận đầy đủ của slide

Quy mô công bố tăng làm gia tăng khối lượng công việc trong quy trình xét duyệt. Khi khối lượng này tăng nhanh hơn nguồn phản biện viên có kinh nghiệm, thời gian đọc và tính nhất quán trong phân công, theo dõi có thể chịu sức ép. Do đó, hệ thống phải hỗ trợ giảm tải điều phối nhưng vẫn duy trì chất lượng và trách nhiệm học thuật trong từng công đoạn.

### Nội dung hiển thị đề xuất

**Tiêu đề:** Quy mô công bố tăng gây áp lực lên quy trình xét duyệt

**Chuỗi tác động:**

Quy mô công bố tăng → khối lượng công việc xét duyệt tăng → thời gian đọc và tính nhất quán của quy trình chịu sức ép

**Bằng chứng và diễn giải:**

- 87.137 công trình tại 11 hội nghị trí tuệ nhân tạo giai đoạn 2014–2023 cho thấy số công trình được công bố và số tác giả đều tăng.
- Với mỗi bài nộp, ban tổ chức phải kiểm tra thông tin, lựa chọn phản biện viên phù hợp, theo dõi tiến độ và tổng hợp nhận xét trong thời hạn của kỳ xét duyệt.
- Khi khối lượng công việc tăng nhanh hơn nguồn phản biện viên có kinh nghiệm, thời gian dành cho từng bản thảo có thể bị thu hẹp và tính nhất quán trong phân công, theo dõi khó được duy trì.

**Số liệu nhấn:**

- **21.575** bài nộp tại NeurIPS 2025
- **21.921** phản biện viên kỹ thuật tại NeurIPS 2025

**Câu kết:** Bài toán không chỉ là xử lý được nhiều hồ sơ hơn, mà còn là duy trì chất lượng và trách nhiệm trong từng công đoạn của quy trình xét duyệt.

**Nguồn nội bộ:** Chương 1, mục “Đặt vấn đề”.

---

## Slide 4 — AI đã xuất hiện trong phản biện, nhưng trách nhiệm học thuật vẫn thuộc về con người

### Component 1 — Ràng buộc về bảo mật bản thảo

**Nội dung nguồn đầy đủ:** Bản thảo chưa công bố là dữ liệu cần được bảo mật. Các chính sách được tổng hợp trong báo cáo cho thấy Phản biện viên không được đưa nội dung bản thảo vào công cụ AI tạo sinh bên ngoài nếu chưa có cơ chế bảo vệ phù hợp. Ràng buộc này không chỉ là vấn đề giao diện hoặc phân quyền trong ứng dụng; nó còn liên quan đến điều khoản lưu giữ, sử dụng, xử lý và vị trí lưu trữ dữ liệu của nhà cung cấp AI. ConferenceSpace chỉ đánh giá phân quyền ở cấp ứng dụng và chưa kiểm toán đầy đủ vòng đời dữ liệu phía nhà cung cấp.

### Component 2 — Ràng buộc về trách nhiệm học thuật

**Nội dung nguồn đầy đủ:** Công cụ AI không phải chủ thể chịu trách nhiệm về nội dung phản biện hoặc quyết định học thuật. Người tham gia quy trình phải chịu trách nhiệm cuối cùng đối với nội dung họ gửi và hành động họ xác nhận. Trong thiết kế ConferenceSpace, Tác giả xác nhận siêu dữ liệu và nội dung bài nộp; Phản biện viên tự đọc bài, viết và gửi bản phản biện; Chủ tọa kiểm tra phương án phân công và tự ghi nhận quyết định chấp nhận hoặc từ chối.

### Component 3 — Ràng buộc về phán đoán chuyên môn

**Nội dung nguồn đầy đủ:** AI không được dùng để thay thế việc đọc bài hoặc phán đoán chuyên môn. Một bản tóm tắt có thể giúp định hướng đọc, một cảnh báo có thể giúp rà soát bản nháp và một bản tổng hợp có thể giúp Chủ tọa nhận biết điểm đồng thuận hoặc bất đồng. Tuy nhiên, các đầu ra này có thể thiếu thông tin, diễn giải sai hoặc làm lệch sự chú ý. Vì vậy, thiết kế phải giữ khả năng đối chiếu với dữ liệu nguồn và không cho AI tự ghi điểm số, gửi phản biện hoặc quyết định bài.

### Component 4 — Tín hiệu sử dụng AI trong thực tế: 15,8%

**Nội dung nguồn đầy đủ:** Một nghiên cứu bán thực nghiệm tại ICLR 2024, dựa trên kết quả của công cụ phát hiện văn bản có sự hỗ trợ của AI, ước lượng ít nhất 15,8% bản phản biện có dấu hiệu sử dụng mô hình ngôn ngữ lớn. Đây là ước lượng dựa trên công cụ phát hiện, không phải xác nhận trực tiếp của từng Phản biện viên. Nghiên cứu còn ghi nhận mối liên hệ tiềm tàng giữa dấu hiệu sử dụng LLM với điểm số và tỷ lệ chấp nhận, nhưng bằng chứng không cho phép biến mối liên hệ này thành kết luận nhân quả.

Con số 15,8% cho thấy quy định hạn chế hoặc cấm không tự động loại bỏ việc sử dụng AI trong thực tế. Vì vậy, thiết kế hệ thống cần làm rõ tác vụ nào được phép, dữ liệu nào được xử lý, đầu ra nào được tạo và ai chịu trách nhiệm, thay vì giả định người dùng sẽ không sử dụng AI.

### Component 5 — Tín hiệu giá trị khi AI chỉ hỗ trợ: 26,6% và 89%

**Nội dung nguồn đầy đủ:** Trong thử nghiệm Review Feedback Agent tại ICLR 2025, 26,6% Phản biện viên thuộc nhóm thực sự nhận được phản hồi đã cập nhật nhận xét theo gợi ý của hệ thống. Trong phép đánh giá ẩn danh, các nhà nghiên cứu học máy nhận định phản hồi của hệ thống cải thiện chất lượng nhận xét ở 89% trường hợp được so sánh. Thử nghiệm đồng thời không ghi nhận khác biệt có ý nghĩa thống kê về kết quả chấp nhận bài giữa nhóm được hỗ trợ và nhóm đối chứng.

Hai số liệu này cho thấy AI có thể tạo giá trị khi góp ý trên nội dung do con người viết và để người dùng quyết định có áp dụng hay không. Chúng không chứng minh AI nên viết thay bản phản biện hoặc tự quyết định kết quả bài báo.

### Component 6 — Ranh giới thiết kế rút ra

**Nội dung nguồn đầy đủ:** Ranh giới cần xác lập không nằm đơn giản giữa “có AI” và “không có AI”. Ranh giới nằm ở bốn câu hỏi: AI được áp dụng cho tác vụ nào; dữ liệu nào được phép gửi đến dịch vụ; hệ thống tạo loại đầu ra nào; và ai phải kiểm tra đầu ra trước khi hành động. ConferenceSpace biến bốn câu hỏi này thành tiêu chí lựa chọn cơ chế và quy ước trách nhiệm cho từng luồng.

### Kết luận đầy đủ của slide

Việc AI đã xuất hiện trong phản biện thực tế tạo ra nhu cầu quản trị rõ ràng hơn, không phải lý do để mở rộng tự động hóa không giới hạn. Bằng chứng hiện có ủng hộ các hình thức hỗ trợ có phạm vi và có bước kiểm tra của con người; đồng thời, chính sách học thuật yêu cầu bảo mật dữ liệu, giữ trách nhiệm ở người dùng và không thay thế phán đoán chuyên môn.

**Nguồn nội bộ:** Chương 1, mục “Đặt vấn đề”; Chương 2, mục “Đối chiếu yêu cầu về phân công và sử dụng AI với bằng chứng bên ngoài”.

---

## Slide 5 — Người dùng cần giảm thao tác nhưng không muốn mất quyền kiểm soát

### Component 1 — Thiết kế và phạm vi khảo sát

**Nội dung nguồn đầy đủ:** Khảo sát thu được 71 phản hồi từ sinh viên và học viên cao học, giảng viên, nhà nghiên cứu và người làm việc tại doanh nghiệp có tham gia hoạt động nghiên cứu. Nhóm sử dụng biểu mẫu trực tuyến, kết hợp câu hỏi một lựa chọn, nhiều lựa chọn, thang Likert từ 1 đến 5 và câu hỏi mở. Khảo sát xem xét khó khăn với các nền tảng hiện có, kỳ vọng đối với nền tảng mới và mức độ chấp nhận AI trong các tác vụ nhập liệu, kiểm tra sơ bộ, hỗ trợ đọc, rà soát phản biện và tổng hợp thông tin.

Đây là mẫu thuận tiện, không đại diện cho toàn bộ cộng đồng học thuật. Số phản hồi giữa các vai trò không đồng đều; nhóm Chủ tọa và Phản biện viên có quy mô nhỏ, nên kết quả theo vai trò chỉ được dùng làm tín hiệu định hướng thiết kế.

### Component 2 — Khó khăn 1: Không biết bước tiếp theo

**Nội dung nguồn đầy đủ:** Có 35/71 người, tương ứng 49,3%, chọn khó khăn “không biết bước tiếp theo cần làm là gì”. Vấn đề này cho thấy hệ thống không chỉ cần hiển thị trạng thái, mà còn phải chuyển trạng thái thành hành động có thể hiểu được: người dùng đang ở giai đoạn nào, việc nào đang chờ họ, hạn chót nào liên quan và thao tác nào hợp lệ. Hàm ý thiết kế là cung cấp chỉ dẫn theo ngữ cảnh và bảng điều khiển tập trung, thay vì buộc người dùng tự suy ra quy trình từ tài liệu hướng dẫn dài.

### Component 3 — Khó khăn 2: Biểu mẫu dài và lặp lại

**Nội dung nguồn đầy đủ:** Có 34/71 người, tương ứng 47,9%, cho biết biểu mẫu nhập liệu dài và lặp lại là một khó khăn. Nhu cầu rút ra không phải tự động điền rồi khóa kết quả, mà là giảm lượng thông tin phải nhập lại trong khi vẫn cho phép người dùng kiểm tra và sửa từng trường. Submission Autofill được thiết kế theo hướng tạo siêu dữ liệu nháp; Tác giả tiếp tục kiểm soát nội dung và quyết định thời điểm gửi.

### Component 4 — Khó khăn 3: Thiếu kiểm tra lỗi sớm

**Nội dung nguồn đầy đủ:** Có 30/71 người, tương ứng 42,3%, cho biết hệ thống thiếu kiểm tra lỗi sớm trước khi nộp chính thức. Nếu lỗi chỉ xuất hiện sau khi bài đã đi vào quy trình, chi phí sửa chữa và phối hợp tăng lên. Submission Gating vì vậy được thiết kế để kiểm tra trước thời điểm gửi, đồng thời phân biệt hai loại kết quả: lỗi có căn cứ theo quy tắc có thể chặn thao tác và cảnh báo nội dung chỉ cung cấp thông tin để Tác giả xem xét.

### Component 5 — Tín hiệu từ nhóm Tác giả

**Nội dung nguồn đầy đủ:** Trong nhóm câu hỏi dành cho Tác giả, 21 người chọn phương án Submission Autofill “tự điền và cho phép tôi sửa nhanh những mục sai”. Với Submission Gating, 40/50 người trả lời, tương ứng 80,0%, đánh giá chức năng hữu ích hoặc rất hữu ích. Hai kết quả cùng thể hiện một yêu cầu: người dùng muốn giảm thao tác và phát hiện thiếu sót sớm, nhưng không muốn hệ thống tước quyền kiểm tra và xác nhận dữ liệu.

### Component 6 — Tín hiệu từ nhóm Phản biện viên

**Nội dung nguồn đầy đủ:** Trong nhóm 11 Phản biện viên, 6/11 người đánh giá cao chức năng tạo bản tóm tắt trung lập, trong khi 3/11 người đánh giá cao chức năng nêu bật các điểm cần kiểm tra kỹ. Chênh lệch này cho thấy người tham gia thận trọng hơn với đầu ra có thể định hướng sự chú ý. Kết quả không đo ảnh hưởng đến thời gian đọc, công sức hoặc nhận định chuyên môn; nó chỉ cung cấp tín hiệu về mức chấp nhận AI trong vai trò hỗ trợ đọc.

### Component 7 — Bốn nhu cầu nền tảng

**Nội dung nguồn đầy đủ:** Từ toàn bộ phản hồi, báo cáo tổng hợp bốn nhu cầu: giảm thao tác nhập và kiểm tra lặp lại; tập trung trạng thái bài nộp, việc cần làm và hạn chót; hỗ trợ kiểm soát rủi ro trong nộp bài và phân công; cung cấp đầu ra AI có thể kiểm tra để người có thẩm quyền đưa ra quyết định. Các nhu cầu này trực tiếp dẫn đến Submission Autofill, Submission Gating, bảng điều khiển, reviewer matching, kiểm tra COI và các luồng hỗ trợ theo vai trò.

### Kết luận đầy đủ của slide

Khảo sát cho thấy người dùng cần hệ thống giảm gánh nặng thao tác và làm rõ bước tiếp theo, nhưng vẫn muốn giữ quyền sửa, bỏ qua và xác nhận. Do đó, tự động hóa phù hợp không phải là tự động thay người dùng hoàn tất quy trình; nó phải tạo đầu ra có thể kiểm tra, xuất hiện đúng thời điểm và để người có trách nhiệm quyết định hành động tiếp theo.

**Nguồn nội bộ:** Chương 2, mục “Khảo sát nhu cầu người dùng”.

---

## Slide 6 — Nền tảng hiện có đã bao phủ vòng đời; khoảng trống nằm ở cách dùng AI

### Component 1 — Nhóm nền tảng quản lý hội nghị trưởng thành

**Nội dung nguồn đầy đủ:** EasyChair, HotCRP, OpenReview và Microsoft CMT được dùng làm chuẩn tham chiếu về vòng đời xét duyệt, vai trò, phân quyền, phân công Phản biện viên, phản biện và ra quyết định. Các nền tảng này đã công bố chức năng bao phủ phần lớn chuỗi nghiệp vụ từ tiếp nhận bản thảo đến quyết định. Vì vậy, ConferenceSpace không thể xem việc xây dựng lại các màn hình nộp bài hoặc quản lý phản biện là đóng góp đủ mạnh nếu không giải thích được cách hệ thống xử lý trách nhiệm, khả năng kiểm tra và bằng chứng.

EasyChair cho thấy cách duy trì trạng thái và quyền hạn xuyên suốt các giai đoạn. HotCRP cho thấy tự động phân công vẫn cần bước chạy thử, rà soát và điều chỉnh của Chủ tọa. OpenReview cho thấy mức độ công khai phải được cấu hình theo giai đoạn cùng quyền đọc và quyền ghi. Microsoft CMT và TPMS cho thấy điểm phù hợp chỉ là một căn cứ; Chủ tọa còn phải xem chuyên môn, xung đột lợi ích và tải công việc.

### Component 2 — Nhóm nền tảng thể hiện xu hướng AI và tự động hóa

**Nội dung nguồn đầy đủ:** PeerSubmit và Morressier được dùng để nhận diện các khâu tự động hóa, loại đầu ra và bước xác nhận do nhà cung cấp công bố. PeerSubmit giới thiệu các chức năng sàng lọc, đối sánh, kiểm tra xung đột, tóm tắt và hỗ trợ quyết định. Tuy nhiên, tài liệu công khai chưa cung cấp đủ dữ liệu nguồn, định nghĩa chỉ số và phương pháp đo để đối chiếu độc lập các tỷ lệ cải thiện; tài liệu về quyền tạo phán quyết cũng chưa hoàn toàn thống nhất.

Morressier cung cấp hai mẫu thiết kế đáng chú ý: công cụ sàng lọc tạo báo cáo để nhóm biên tập xem xét; công cụ Auto-Assign tạo danh sách để Ban tổ chức điều chỉnh trước khi xác nhận. Giá trị tham khảo nằm ở cách tổ chức đầu ra và bước xác nhận, không phải ở việc giả định chất lượng của công cụ đã được chứng minh trên cùng dữ liệu với ConferenceSpace.

### Component 3 — Giới hạn của phép đối chiếu

**Nội dung nguồn đầy đủ:** Báo cáo đối chiếu các nền tảng dựa trên tài liệu và chính sách công khai. Phép đối chiếu mô tả phạm vi chức năng, cách nhà cung cấp định vị sản phẩm và quy ước trách nhiệm được công bố; nó không đánh giá các nền tảng trên cùng dữ liệu, cùng kịch bản hoặc cùng thước đo. Vì vậy, tài liệu không xếp hạng chất lượng sản phẩm và không khẳng định ConferenceSpace vượt trội hơn EasyChair, HotCRP, OpenReview, Microsoft CMT, PeerSubmit hoặc Morressier.

### Component 4 — Hàm ý 1: Vòng đời nghiệp vụ phải liền mạch

**Nội dung nguồn đầy đủ:** Các luồng hỗ trợ chỉ có giá trị khi được đặt trong một vòng đời có trạng thái và phân quyền nhất quán. ConferenceSpace vì vậy kết nối nộp bài, phân công, phản biện, phản hồi, thảo luận và quyết định trên cùng dữ liệu nghiệp vụ. AI không được triển khai như các công cụ rời không biết người dùng đang ở giai đoạn nào hoặc có quyền xem dữ liệu nào.

### Component 5 — Hàm ý 2: Đối sánh và COI phải có căn cứ

**Nội dung nguồn đầy đủ:** Điểm phù hợp, trạng thái xung đột và khối lượng công việc phải được trình bày cùng nhau để Chủ tọa đánh giá phương án phân công. Thuật toán tạo danh sách đề xuất và lý do; Chủ tọa có quyền điều chỉnh và xác nhận. Thiết kế này phản ánh thực tế rằng một điểm số đơn lẻ không thể biểu diễn đầy đủ chuyên môn, công bằng, tải và các ngoại lệ của hội nghị.

### Component 6 — Hàm ý 3: AI phải tạo đúng loại đầu ra

**Nội dung nguồn đầy đủ:** Các tác vụ tạo nội dung chỉ nên tạo bản nháp, tóm tắt, cảnh báo hoặc bản tổng hợp có thể đối chiếu. Mức tự động hóa phải tương ứng với hậu quả của tác vụ. AI có thể hỗ trợ Tác giả nhập liệu, hỗ trợ Phản biện viên đọc và rà soát, hỗ trợ Chủ tọa tổng hợp bằng chứng; AI không tự gửi bài, tự viết phản biện, tự phân công hoặc tự quyết định chấp nhận và từ chối.

### Kết luận đầy đủ của slide

Nghiệp vụ quản lý hội nghị không còn là khoảng trống chính: các nền tảng hiện có đã chứng minh độ bao phủ rộng của vòng đời. Khoảng trống mà ConferenceSpace lựa chọn xử lý là cách phân biệt tác vụ xác định với tác vụ tạo nội dung, cách trình bày căn cứ và cách giữ quyền xác nhận ở người có trách nhiệm. Đây là khoảng trống về thiết kế trách nhiệm, không phải cuộc đua tăng số lượng tính năng AI.

**Nguồn nội bộ:** Chương 1, mục “Đặt vấn đề”; Chương 2, mục “Khảo sát hiện trạng các hệ thống quản lý hội nghị”.

---

## Slide 7 — Câu hỏi thiết kế là chọn đúng cơ chế cho từng tác vụ

### Component 1 — Câu hỏi trung tâm

**Nội dung nguồn đầy đủ:** Tác vụ nào cần được xử lý bằng nghiệp vụ xác định, tác vụ nào cần thuật toán có thể tái lập và tác vụ nào phù hợp với AI hỗ trợ? Câu hỏi này thay thế cách tiếp cận “gắn AI vào mọi bước”. Mỗi lựa chọn phải dựa trên hậu quả của tác vụ, yêu cầu kiểm tra lại, loại đầu ra và người chịu trách nhiệm.

### Component 2 — Tiêu chí 1: Tác vụ có thay đổi dữ liệu chính thức không?

**Nội dung nguồn đầy đủ:** Nếu tác vụ thay đổi trạng thái hội nghị, bài nộp, phân công, bản phản biện hoặc quyết định, backend phải kiểm tra quyền, trạng thái, hạn chót và điều kiện nghiệp vụ trước khi ghi dữ liệu. Đầu ra AI không được bỏ qua đường kiểm tra này. Ví dụ, một bản tổng hợp có thể giúp Chủ tọa xem xét, nhưng chỉ thao tác do Chủ tọa thực hiện qua backend mới tạo quyết định chính thức.

### Component 3 — Tiêu chí 2: Kết quả có cần tái lập và giải thích không?

**Nội dung nguồn đầy đủ:** Các tác vụ như reviewer matching và phát hiện xung đột lợi ích cần đầu ra ổn định trên cùng đầu vào và cấu hình. Người dùng phải có thể xem điểm số, lý do, ràng buộc và trường hợp chưa được giải quyết. Vì vậy, đề tài dùng công thức Jaccard, quy tắc sắp xếp và thuật toán tham lam hai lượt thay vì giao tác vụ phân công cho mô hình tạo sinh.

### Component 4 — Tiêu chí 3: AI được phép tạo loại đầu ra nào?

**Nội dung nguồn đầy đủ:** AI chỉ được tạo loại đầu ra phù hợp với tác vụ và mức ảnh hưởng: siêu dữ liệu nháp, cảnh báo không chặn, bản định hướng đọc, bản rà soát bản nháp, bản tổng hợp bằng chứng hoặc câu trả lời trong phạm vi quyền. Hệ thống phải phân biệt rõ đầu ra nào có thể sai và yêu cầu người dùng đối chiếu với nguồn trước khi sử dụng.

### Component 5 — Tiêu chí 4: Ai kiểm tra và chịu trách nhiệm?

**Nội dung nguồn đầy đủ:** Mỗi luồng phải xác định người kiểm tra đầu ra. Tác giả kiểm tra dữ liệu Autofill và cảnh báo Gating; Phản biện viên kiểm tra Reviewer Initial Analysis và Review Quality Auditor; Chủ tọa kiểm tra đề xuất matching, căn cứ COI và bản tổng hợp của Chair Decision Copilot. Backend chịu trách nhiệm thực thi quy tắc quyền và trạng thái, nhưng không thay thế trách nhiệm học thuật của người dùng.

### Component 6 — Ranh giới phạm vi

**Nội dung nguồn đầy đủ:** ConferenceSpace không tự động quyết định chấp nhận hoặc từ chối bài; không thay thế việc đọc bài và phán đoán chuyên môn; không bảo đảm phát hiện đầy đủ mọi xung đột lợi ích khi dữ liệu bên ngoài không đầy đủ; và không bao gồm quản lý sự kiện theo nghĩa rộng như bán vé, đăng ký tham dự, xếp lịch phòng, tổ chức chương trình hoặc xuất bản kỷ yếu. Đề tài cũng không chứng minh hệ thống vượt trội hơn các sản phẩm thương mại và không đánh giá tác động dài hạn của AI lên văn hóa phản biện.

### Component 7 — Quy tắc lựa chọn cơ chế

**Nội dung nguồn đầy đủ:** Tác vụ có trạng thái và điều kiện rõ được đặt trong nghiệp vụ cốt lõi. Tác vụ cần điểm số, thứ tự hoặc ràng buộc có thể kiểm tra được xử lý bằng thuật toán xác định. Tác vụ cần đọc, trích xuất, diễn giải hoặc tổng hợp nội dung có thể dùng AI, nhưng đầu ra phải là hỗ trợ và phải gắn với người kiểm tra. Quy tắc này tạo một hệ thống có nhiều mức tự động hóa thay vì một đường tự động hóa duy nhất.

### Kết luận đầy đủ của slide

Thiết kế bắt đầu từ trách nhiệm và hậu quả của tác vụ, không bắt đầu từ khả năng của mô hình. Bốn tiêu chí giúp chọn cơ chế phù hợp và ngăn một đầu ra xác suất trở thành quyết định chính thức mà không qua kiểm tra. Ranh giới phạm vi đồng thời xác định rõ điều ConferenceSpace có thể chứng minh và điều đề tài không tuyên bố.

**Nguồn nội bộ:** Chương 1, mục “Phạm vi đề tài”; Chương 2, các mục “Vấn đề thực tiễn và nguyên tắc giải pháp” và “Nguyên tắc sử dụng AI có trách nhiệm”.

---

## Slide 8 — ConferenceSpace là nền tảng thực nghiệm cho mô hình ba lớp trách nhiệm

### Component 1 — Vai trò của ConferenceSpace

**Nội dung nguồn đầy đủ:** ConferenceSpace được xây dựng như một nền tảng thực nghiệm để đánh giá cách phân công trách nhiệm trong quy trình xét duyệt. Hệ thống cung cấp vòng đời nghiệp vụ thống nhất cho Tác giả, Phản biện viên và Chủ tọa; đồng thời đặt các thuật toán và chức năng AI vào các điểm cụ thể của vòng đời. Cách xây dựng này cho phép đánh giá từng cơ chế trong đúng bối cảnh quyền và trạng thái, thay vì đánh giá một công cụ AI rời khỏi quy trình.

Đề tài không triển khai kiến trúc đối chứng và không chứng minh mô hình ba lớp là tối ưu. Giá trị của mô hình nằm ở việc tạo một cấu trúc rõ để thiết kế, triển khai và đánh giá từng tác vụ theo loại đầu ra và người chịu trách nhiệm.

### Component 2 — Lớp nghiệp vụ cốt lõi

**Nội dung nguồn đầy đủ:** Lớp nghiệp vụ cốt lõi kiểm tra quyền và quản lý trạng thái của hội nghị, bài nộp, phân công, phản biện, phản hồi và quyết định. Kết quả của lớp này là dữ liệu nghiệp vụ chính thức cùng lịch sử thay đổi trạng thái. Người dùng được phân quyền thực hiện thao tác; backend xác thực danh tính, quan hệ với tài nguyên, trạng thái và điều kiện trước khi cập nhật.

Lớp nghiệp vụ phải hoạt động độc lập với AI ở các bước cốt lõi. AI có thể cung cấp thông tin hỗ trợ, nhưng không được trở thành đường duy nhất để thực hiện một thao tác nghiệp vụ, trừ trường hợp Submission Gating hiện vẫn là điều kiện bắt buộc và được báo cáo xác định là giới hạn cần khắc phục.

### Component 3 — Lớp thuật toán xác định

**Nội dung nguồn đầy đủ:** Lớp thuật toán xác định tính điểm phù hợp, xếp hạng ứng viên và phát hiện xung đột lợi ích theo các quy tắc đã định nghĩa. Kết quả gồm điểm số, lý do, danh sách đề xuất và danh sách bài chưa đủ Phản biện viên. Cùng một đầu vào và cấu hình phải tạo thứ tự ổn định để Chủ tọa có thể tái lập và kiểm tra kết quả.

Thuật toán không tự phân công. Chủ tọa xem căn cứ, điều chỉnh phương án và xác nhận. Việc giữ quyết định ở Chủ tọa phản ánh giới hạn của tín hiệu chủ đề và thuật toán tham lam: chúng không thể tự biểu diễn đầy đủ chuyên môn, công bằng và mọi ngoại lệ nghiệp vụ.

### Component 4 — Lớp AI hỗ trợ

**Nội dung nguồn đầy đủ:** Lớp AI hỗ trợ thực hiện sáu luồng: Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent. Các luồng tạo siêu dữ liệu nháp, cảnh báo, bản định hướng đọc, bản rà soát, bản tổng hợp hoặc câu trả lời. Đầu ra có thể sai, thiếu hoặc không phù hợp; người dùng phải đối chiếu với dữ liệu gốc và chịu trách nhiệm về thao tác tiếp theo.

### Component 5 — Ba vai trò chịu trách nhiệm

**Nội dung nguồn đầy đủ:** Tác giả kiểm tra và xác nhận dữ liệu bài nộp, khai báo đồng tác giả và xung đột, gửi phản hồi và nộp camera-ready. Phản biện viên tiếp nhận bài được phân công, tự đọc bài, viết điểm số và nhận xét, quyết định có sửa bản nháp theo cảnh báo hay không. Chủ tọa cấu hình hội nghị, xác nhận phân công, giám sát tiến độ, xem phản biện và phản hồi, rồi tự ghi nhận quyết định. AI hỗ trợ từng vai trò nhưng không thay đổi thẩm quyền học thuật.

### Component 6 — Đường chuyển thành dữ liệu chính thức

**Nội dung nguồn đầy đủ:** Đầu ra hỗ trợ không trực tiếp cập nhật dữ liệu chính thức. Quy trình gồm bốn bước: cơ chế hỗ trợ tạo đầu ra cùng căn cứ; người dùng kiểm tra và lựa chọn; backend xác thực quyền, trạng thái và điều kiện; hệ thống mới ghi dữ liệu cùng lịch sử. Đường chuyển này là cơ chế hiện thực hóa nguyên tắc human-in-the-loop trong phần mềm.

### Kết luận đầy đủ của slide

ConferenceSpace là môi trường để kiểm tra một mô hình trách nhiệm cụ thể: nghiệp vụ tạo trạng thái chính thức, thuật toán tạo đề xuất tái lập và AI tạo đầu ra cần được kiểm tra. Quyết định học thuật và việc ghi nhận dữ liệu chính thức vẫn thuộc về người dùng có thẩm quyền thông qua backend. Đây là nguyên tắc xuyên suốt các use case, kiến trúc và phép đánh giá ở các phần sau.

**Nguồn nội bộ:** Chương 1, mục “Mục tiêu đề tài”; Chương 3, mục “Mô hình trách nhiệm”.

---

## Slide 9 — Mười use case kết nối ba vai trò trong cùng một hệ thống

### Component 1 — Ranh giới hệ thống ConferenceSpace

**Nội dung nguồn đầy đủ:** Sơ đồ use case đặt mười ca sử dụng trong cùng ranh giới ConferenceSpace để nhấn mạnh rằng chúng chia sẻ trạng thái, phân quyền và dữ liệu nghiệp vụ. Hệ thống không được mô tả như mười công cụ độc lập. Một thay đổi ở giai đoạn trước tạo điều kiện hoặc giới hạn cho giai đoạn sau: hội nghị phải còn mở để Tác giả bắt đầu bài nộp; bài phải được gửi và vượt điều kiện nghiệp vụ để đi vào phân công; Phản biện viên chỉ xem được bài thuộc phân công của mình; thảo luận và phản hồi bổ sung bằng chứng trước quyết định.

### Component 2 — Tác giả và UC-01: Khám phá hội nghị

**Nội dung nguồn đầy đủ:** Tác giả tìm kiếm hội nghị theo từ khóa, lĩnh vực, chuyên đề hoặc trạng thái; xem phần tổng quan, kêu gọi nộp bài, mốc thời gian và thông tin hội đồng. Hội nghị đã đóng vẫn có thể được xem hoặc lưu theo dõi, nhưng hệ thống chỉ cho phép bắt đầu bài nộp khi hội nghị còn mở. Kết quả của UC-01 là một hội nghị phù hợp được chọn hoặc được lưu để theo dõi.

### Component 3 — Tác giả và UC-02: Hoàn tất, kiểm tra bài nộp

**Nội dung nguồn đầy đủ:** Tác giả tạo bản nháp, tải bản thảo, nhập hoặc áp dụng siêu dữ liệu do Submission Autofill đề xuất, khai báo đồng tác giả và xung đột lợi ích, sau đó chạy Submission Gating. Bản nháp vẫn có thể được lưu khi chưa hoàn tất. Chỉ khi các điều kiện chặn theo quy tắc đã được xử lý và Tác giả xác nhận nội dung, bài mới được gửi chính thức. Đầu ra AI không tự thay thế dữ liệu đã được Tác giả xác nhận.

### Component 4 — Tác giả và UC-03: Quản lý vòng đời bài nộp

**Nội dung nguồn đầy đủ:** Tác giả xem danh sách bài và thực hiện hành động phù hợp với trạng thái: chỉnh sửa bản nháp; theo dõi hoặc rút bài đã gửi khi cấu hình và hạn chót cho phép; xem phản biện; gửi rebuttal trong giai đoạn do Chủ tọa mở; và tải camera-ready sau khi bài được chấp nhận. Backend từ chối hành động không phù hợp với trạng thái hoặc thời điểm.

### Component 5 — Phản biện viên và UC-04: Lời mời, phân công

**Nội dung nguồn đầy đủ:** Chủ tọa mời thành viên tham gia hội nghị; hệ thống lưu trạng thái lời mời và gửi thông báo. Phản biện viên chỉ có thể chấp nhận hoặc từ chối lời mời của chính mình. Sau khi phân công được tạo, backend chỉ trả các bài thuộc người dùng hiện tại, kèm hạn chót và trạng thái. UC-04 thiết lập ranh giới quyền trước khi nội dung bản thảo và không gian phản biện được mở.

### Component 6 — Phản biện viên và UC-05: Đọc, soạn, gửi phản biện

**Nội dung nguồn đầy đủ:** Phản biện viên mở bài được phân công, đọc bản thảo, nhập điểm, mức độ tự tin, nhận xét gửi Tác giả và ghi chú dành cho hội đồng. Reviewer Initial Analysis có thể cung cấp bản định hướng đọc; Review Quality Auditor có thể rà soát bản nháp trước khi gửi. Phản biện viên tự quyết định sửa hoặc giữ nội dung và chịu trách nhiệm đối với bản phản biện cuối cùng.

### Component 7 — Chủ tọa và UC-06: Phân công, xung đột lợi ích

**Nội dung nguồn đầy đủ:** Hệ thống tính điểm phù hợp giữa bài và Phản biện viên, loại các cặp có xung đột khỏi đề xuất tự động, theo dõi tải phát sinh và liệt kê các bài chưa đủ người. Chủ tọa xem điểm số, lý do, trạng thái COI và tải trước khi điều chỉnh hoặc xác nhận. Kết quả của use case là phương án phân công có căn cứ, không phải quyết định tự động của thuật toán.

### Component 8 — Chủ tọa và UC-07: Quản lý hội nghị

**Nội dung nguồn đầy đủ:** Chủ tọa cấu hình thông tin hội nghị, chuyên đề, hạn chót, biểu mẫu phản biện và chính sách; mời hội đồng chương trình; theo dõi số bài, tiến độ phản biện và trường hợp cần xử lý. Bảng điều khiển giúp nhận biết điểm nghẽn nhưng không tự chuyển giai đoạn hoặc tự ra quyết định.

### Component 9 — Dùng chung UC-08: Trao đổi theo bài nộp

**Nội dung nguồn đầy đủ:** Sau khi Chủ tọa mở giai đoạn phản hồi, Phản biện viên được phân công có thể tạo chuỗi thảo luận; Tác giả và Phản biện viên trao đổi trong chuỗi tương ứng; Chủ tọa xem lịch sử ở chế độ giám sát. Backend kiểm tra quan hệ giữa người dùng, bài nộp và chuỗi thảo luận trước mỗi thao tác. Lịch sử trao đổi trở thành một phần của bộ bằng chứng trước quyết định.

### Component 10 — Chủ tọa và UC-09: Hỗ trợ quyết định

**Nội dung nguồn đầy đủ:** Backend tập hợp điểm số, bản phản biện, phản hồi của Tác giả, thay đổi sau phản hồi và nội dung thảo luận. Chair Decision Copilot tổ chức dữ liệu thành bản tổng hợp về đồng thuận, bất đồng, vấn đề còn mở và bằng chứng liên quan. Chủ tọa đối chiếu với dữ liệu gốc rồi tự ghi nhận quyết định.

### Component 11 — Dùng chung UC-10: Chatbot Agent

**Nội dung nguồn đầy đủ:** Chatbot Agent hỗ trợ ba vai trò tra cứu trạng thái và hướng dẫn theo ngữ cảnh. Khi cần dữ liệu nghiệp vụ, Agent gọi công cụ để gửi yêu cầu có cấu trúc đến backend. Backend kiểm tra mã xác thực, tài nguyên, trường dữ liệu, bộ lọc và quyền của người dùng, rồi chỉ trả phần dữ liệu tối thiểu được phép. Chatbot không truy cập trực tiếp cơ sở dữ liệu và không phải trợ lý nghiên cứu tự do.

### Kết luận đầy đủ của slide

Mười use case cùng tạo một hệ thống xét duyệt thống nhất: mỗi vai trò có nhiệm vụ riêng, hai use case dùng chung vẫn bị giới hạn bởi quyền trên tài nguyên, và các đầu ra hỗ trợ chỉ có ý nghĩa khi được đặt trong trạng thái nghiệp vụ hiện hành. Sơ đồ use case vì vậy là bản đồ trách nhiệm, không chỉ là danh mục chức năng.

**Nguồn nội bộ:** Chương 3, mục “Use case”, Hình “Use case tổng quát theo vai trò” và Bảng “Tổng quan các use case của ConferenceSpace”.

---

## Slide 10 — Một bài nộp đi qua các trạng thái với chủ thể chịu trách nhiệm rõ ràng

### Component 1 — Trạng thái 01: Bài nháp

**Nội dung nguồn đầy đủ:** Tác giả tạo bài nộp ở trạng thái nháp, tải tệp và bổ sung siêu dữ liệu. Ở trạng thái này, dữ liệu chưa trở thành bài gửi chính thức; Tác giả có thể chỉnh sửa, thay tệp, cập nhật đồng tác giả, khai báo xung đột và lưu lại. Submission Autofill chỉ cung cấp dữ liệu nháp để Tác giả áp dụng; mọi trường vẫn có thể được sửa trước khi gửi.

### Component 2 — Trạng thái 02: Bài đã gửi

**Nội dung nguồn đầy đủ:** Khi Tác giả xác nhận gửi, backend kiểm tra quyền, hạn chót, trường bắt buộc, tệp và các điều kiện Submission Gating. Các lỗi theo quy tắc có căn cứ có thể ngăn thao tác; cảnh báo nội dung không tự chặn nếu chính sách cho phép tiếp tục. Sau khi yêu cầu hợp lệ, hệ thống ghi trạng thái bài đã gửi và lưu lịch sử. Tác giả không còn được thao tác như với bản nháp; các quyền tiếp theo phụ thuộc cấu hình hội nghị.

### Component 3 — Trạng thái 03: Phân công phản biện

**Nội dung nguồn đầy đủ:** Chủ tọa sử dụng thông tin chuyên môn, tải công việc và xung đột lợi ích để xem đề xuất Phản biện viên. Thuật toán có thể tạo điểm và danh sách ứng viên, nhưng Chủ tọa xác nhận phương án. Khi phân công được ghi nhận, quyền xem bản thảo và không gian phản biện được cấp cho đúng Phản biện viên; các cặp có xung đột trong đề xuất tự động bị loại.

### Component 4 — Trạng thái 04: Phản biện

**Nội dung nguồn đầy đủ:** Phản biện viên chấp nhận hoặc từ chối bài được phân công theo quy trình, đọc bản thảo, soạn điểm số và nhận xét. Reviewer Initial Analysis và Review Quality Auditor có thể hỗ trợ định hướng đọc và rà soát bản nháp, nhưng Phản biện viên tự viết và tự gửi. Backend chỉ nhận phản biện từ người có phân công hợp lệ và trong giai đoạn cho phép.

### Component 5 — Trạng thái 05: Phản hồi và thảo luận

**Nội dung nguồn đầy đủ:** Khi Chủ tọa mở giai đoạn phản hồi, Tác giả xem các nhận xét được công bố và gửi rebuttal. Phản biện viên có thể đọc phản hồi, tham gia thảo luận và cập nhật đánh giá nếu quy trình cho phép. Chủ tọa giám sát toàn bộ lịch sử. Các thay đổi sau rebuttal được đưa vào bộ bằng chứng trước quyết định, thay vì bị tách khỏi bản phản biện ban đầu.

### Component 6 — Trạng thái 06: Quyết định

**Nội dung nguồn đầy đủ:** Chủ tọa xem điểm số, bản phản biện, rebuttal, nội dung thảo luận và các thay đổi sau phản hồi. Chair Decision Copilot có thể tổ chức các nguồn thành bản tổng hợp, nhưng không đề xuất chấp nhận hoặc từ chối. Chủ tọa tự ghi nhận quyết định; backend kiểm tra quyền và trạng thái trước khi cập nhật bài.

### Component 7 — Trạng thái 07: Camera-ready

**Nội dung nguồn đầy đủ:** Chỉ bài được chấp nhận mới chuyển sang bước nộp bản thảo hoàn chỉnh. Tác giả tải lên camera-ready theo điều kiện và hạn chót được cấu hình; người có quyền có thể truy xuất tệp. ConferenceSpace quản lý bước nộp bản hoàn thiện trong phạm vi đề tài, nhưng không bao gồm quy trình xuất bản kỷ yếu.

### Component 8 — Nhánh rút bài

**Nội dung nguồn đầy đủ:** Tác giả có thể rút bài đã gửi khi cấu hình hội nghị và hạn chót cho phép. Hệ thống lưu trạng thái rút như một phần của lịch sử nghiệp vụ, không xóa dấu vết bài nộp. Sau khi rút, bài không tiếp tục đi qua phân công và phản biện theo luồng thông thường.

### Component 9 — Nhánh từ chối

**Nội dung nguồn đầy đủ:** Nếu Chủ tọa quyết định từ chối, bài kết thúc vòng đời xét duyệt trong trạng thái bị từ chối và không đi đến camera-ready. Quyết định vẫn được lưu cùng dữ liệu và bằng chứng liên quan; hệ thống không để AI tự tạo hoặc tự ghi nhận trạng thái này.

### Component 10 — Ba điều kiện xuyên suốt

**Nội dung nguồn đầy đủ:** Mỗi chuyển trạng thái chỉ xảy ra khi ba điều kiện cùng được đáp ứng: đúng vai trò hoặc đúng quan hệ với tài nguyên; đúng điều kiện nghiệp vụ, gồm trạng thái hiện tại và dữ liệu bắt buộc; đúng thời điểm theo hạn chót và giai đoạn do hội nghị cấu hình. Việc hiển thị nút trên giao diện không thay thế kiểm tra của backend.

### Kết luận đầy đủ của slide

Vòng đời bài nộp là chuỗi chuyển trạng thái có kiểm soát, trong đó mỗi bước gắn với một chủ thể chịu trách nhiệm và một bộ điều kiện cụ thể. Các nhánh rút bài, từ chối và camera-ready được lưu như trạng thái có lịch sử. Mọi cơ chế hỗ trợ chỉ cung cấp thông tin cho người dùng; quyền chuyển trạng thái vẫn được backend xác thực theo vai trò, dữ liệu và thời điểm.

**Nguồn nội bộ:** Chương 3, mục “Vòng đời nghiệp vụ”.

---

## Slide 11 — Tác giả kiểm soát dữ liệu từ khám phá hội nghị đến camera-ready

### Component 1 — Tìm và đánh giá hội nghị

**Nội dung nguồn đầy đủ:** Tác giả bắt đầu bằng việc tìm kiếm hội nghị theo từ khóa, lĩnh vực, chuyên đề hoặc trạng thái. Trang chi tiết cung cấp tổng quan, kêu gọi nộp bài, mốc thời gian và thông tin hội đồng. Dữ liệu này giúp Tác giả xác định hội nghị có phù hợp và còn mở hay không. Hệ thống cho phép xem hoặc theo dõi hội nghị đã đóng, nhưng chỉ cho phép bắt đầu bài nộp khi điều kiện mở nhận bài được đáp ứng.

### Component 2 — Tạo và duy trì bản nháp

**Nội dung nguồn đầy đủ:** Tác giả tạo bài nộp ở trạng thái nháp, tải bản thảo và bổ sung thông tin. Bản nháp cho phép tách quá trình chuẩn bị khỏi thao tác gửi chính thức. Tác giả có thể quay lại chỉnh sửa tiêu đề, tóm tắt, từ khóa, chuyên đề, danh sách tác giả, tệp và các khai báo liên quan trước khi gửi.

### Component 3 — Submission Autofill

**Nội dung nguồn đầy đủ:** Submission Autofill trích xuất siêu dữ liệu từ bản thảo và gợi ý chuyên đề trong danh sách hợp lệ của hội nghị. Hệ thống trả kết quả vào biểu mẫu có thể chỉnh sửa; không tự gửi bài và không thay thế dữ liệu đã được Tác giả xác nhận. Nếu tài liệu khó đọc hoặc có định dạng bất thường, một số trường có thể thất bại hoàn toàn; vì vậy, giao diện phải làm rõ đây là bản nháp và yêu cầu Tác giả kiểm tra từng trường.

### Component 4 — Khai báo đồng tác giả và xung đột lợi ích

**Nội dung nguồn đầy đủ:** Trước khi gửi, Tác giả hoàn tất danh sách đồng tác giả và khai báo xung đột lợi ích theo yêu cầu. Dữ liệu này trở thành một nguồn cho cơ chế COI ở giai đoạn phân công. Độ đầy đủ của cơ chế phụ thuộc vào dữ liệu được khai báo và dữ liệu quan hệ học thuật có sẵn; hệ thống không thể bảo đảm phát hiện mọi xung đột nếu đầu vào thiếu.

### Component 5 — Submission Gating

**Nội dung nguồn đầy đủ:** Submission Gating phân tách tuyến kiểm tra luật cố định và tuyến cảnh báo nội dung. Tuyến luật kiểm tra các điều kiện có kết quả xác định, chẳng hạn trường bắt buộc, tệp hoặc chính sách được cấu hình; kết quả có thể chặn thao tác khi có lỗi có căn cứ. Tuyến LLM đọc nội dung để tạo cảnh báo không chặn đối với vấn đề cần người dùng xem xét. Việc phân tách này ngăn một nhận định xác suất trở thành quyết định từ chối bài về mặt học thuật.

### Component 6 — Theo dõi, rebuttal và camera-ready

**Nội dung nguồn đầy đủ:** Sau khi gửi, Tác giả theo dõi trạng thái bài và thông báo, có thể rút bài khi được phép, xem phản biện khi được công bố, gửi rebuttal trong giai đoạn mở và nộp camera-ready nếu bài được chấp nhận. Mỗi hành động phụ thuộc vào trạng thái và hạn chót; backend từ chối yêu cầu không hợp lệ. Luồng này giúp Tác giả nhìn thấy toàn bộ vòng đời thay vì phải chuyển giữa nhiều công cụ rời.

### Component 7 — Ý nghĩa của ảnh giao diện

**Nội dung nguồn đầy đủ:** Ảnh Autofill/Gating minh họa điểm kiểm soát của Tác giả: kết quả trích xuất xuất hiện trong biểu mẫu để sửa; kết quả kiểm tra được phân loại theo trạng thái để Tác giả hiểu việc nào bắt buộc phải khắc phục và việc nào chỉ là cảnh báo. Ảnh không được dùng làm bằng chứng về độ chính xác; bằng chứng định lượng được trình bày riêng ở phần đánh giá.

### Kết luận đầy đủ của slide

Luồng Tác giả giảm nhập liệu và phát hiện thiếu sót sớm nhưng không chuyển quyền kiểm soát dữ liệu cho hệ thống. Từ bản nháp đến camera-ready, Tác giả vẫn là người kiểm tra, chỉnh sửa và xác nhận nội dung; backend giữ trách nhiệm kiểm tra trạng thái, hạn chót và điều kiện trước mỗi thay đổi chính thức.

**Nguồn nội bộ:** Chương 3, UC-01–UC-03; các hình `chapter_3_uc01_*`, `chapter_3_uc02_*`, `chapter_3_uc03_*`.

---

## Slide 12 — Phản biện viên nhận hỗ trợ đọc và rà soát, nhưng tự viết phản biện

### Component 1 — Tiếp nhận lời mời và quyền xem bài

**Nội dung nguồn đầy đủ:** Chủ tọa gửi lời mời tham gia hội nghị; hệ thống thông báo và lưu trạng thái. Phản biện viên tự chấp nhận hoặc từ chối lời mời và bài được phân công. Chỉ sau khi có phân công hợp lệ, không vi phạm quyền truy cập và đáp ứng điều kiện COI, backend mới trả bản thảo cùng không gian phản biện cho người dùng hiện tại.

### Component 2 — Đọc bài và Reviewer Initial Analysis

**Nội dung nguồn đầy đủ:** Phản biện viên phải đọc bản thảo gốc. Reviewer Initial Analysis chỉ cung cấp bản định hướng ban đầu, gồm các trích dẫn hoặc điểm cần lưu ý để hỗ trợ tổ chức việc đọc. Luồng này không được dùng để thay thế toàn văn, không tự điền điểm số và không ghi nội dung vào biểu mẫu phản biện. Vì phần diễn giải có mức bám nguồn thấp hơn trích dẫn trực tiếp trong benchmark, Phản biện viên phải kiểm tra từng nhận định trên bài gốc.

### Component 3 — Soạn bản phản biện

**Nội dung nguồn đầy đủ:** Phản biện viên nhập điểm, mức độ tự tin, nhận xét gửi Tác giả và ghi chú riêng cho hội đồng theo biểu mẫu của hội nghị. Nội dung phản biện là sản phẩm do Phản biện viên chịu trách nhiệm. Hệ thống có thể lưu bản nháp và hỗ trợ tổ chức thông tin, nhưng không tạo thay quyết định chuyên môn của người phản biện.

### Component 4 — Review Quality Auditor

**Nội dung nguồn đầy đủ:** Trước khi gửi, Review Quality Auditor rà soát bản nháp về mức độ đầy đủ, cụ thể và nhất quán. Hệ thống trả danh sách phát hiện để Phản biện viên xem xét. Benchmark cho thấy còn nhiều nhiễu, nên đầu ra phù hợp nhất với vai trò gợi ý điểm cần kiểm tra; nó chưa đủ căn cứ để trở thành quy tắc chặn cứng.

### Component 5 — Ý nghĩa của `blocking`, `warning` và `pass`

**Nội dung nguồn đầy đủ:** `severity=blocking` biểu thị phát hiện có mức nghiêm trọng cao; `status=block` làm nổi bật bản phản biện cần được xem xét trên giao diện. Các nhãn này điều khiển mức độ ưu tiên hiển thị, không ngăn Phản biện viên gửi bản phản biện. `warning` biểu thị vấn đề cần cân nhắc ở mức thấp hơn, còn `pass` cho biết lượt kiểm tra không tạo phát hiện cần cảnh báo theo điều kiện hiện hành.

### Component 6 — Quyền quyết định cuối cùng của Phản biện viên

**Nội dung nguồn đầy đủ:** Phản biện viên đối chiếu cảnh báo với bản thảo và bản nháp của mình, sau đó quyết định sửa, bỏ qua hoặc gửi. Khi dịch vụ kiểm tra không thể chạy, thiết kế cho phép người dùng xác nhận tiếp tục và ghi nhận thao tác trong nhật ký. Cơ chế này giữ khả năng hoàn tất nghiệp vụ nhưng chưa được đánh giá đầy đủ về cách người dùng phản ứng với cảnh báo hoặc lỗi dịch vụ.

### Component 7 — Ý nghĩa của ảnh giao diện

**Nội dung nguồn đầy đủ:** Ảnh không gian phản biện cho thấy bản thảo, biểu mẫu và kết quả hỗ trợ được đặt trong cùng ngữ cảnh để Phản biện viên có thể đối chiếu. Ảnh Reviewer Initial Analysis hoặc Quality Auditor minh họa loại đầu ra và điểm kiểm soát; không được dùng thay bằng chứng định lượng về chất lượng đầu ra.

### Kết luận đầy đủ của slide

ConferenceSpace hỗ trợ Phản biện viên ở hai điểm: định hướng việc đọc và rà soát bản nháp. Cả hai đầu ra đều có thể sai và chỉ mang tính hỗ trợ. Phản biện viên vẫn phải đọc bài, tự viết điểm số và nhận xét, kiểm tra các phát hiện rồi chịu trách nhiệm đối với bản phản biện được gửi.

**Nguồn nội bộ:** Chương 3, UC-04 và UC-05; Chương 5, các đoạn về Reviewer Initial Analysis và Review Quality Auditor.

---

## Slide 13 — Chủ tọa điều phối hội nghị và ra quyết định từ bằng chứng đã kiểm tra

### Component 1 — Cấu hình hội nghị và hội đồng

**Nội dung nguồn đầy đủ:** Chủ tọa cấu hình thông tin hội nghị, chuyên đề, hạn chót, biểu mẫu phản biện và chính sách; mời thành viên hội đồng chương trình và theo dõi trạng thái lời mời. Các cấu hình này xác định điều kiện cho các thao tác sau: khi nào được nộp bài, số Phản biện viên cần cho mỗi bài, giai đoạn phản hồi và quyền xem dữ liệu.

### Component 2 — Theo dõi tiến độ

**Nội dung nguồn đầy đủ:** Bảng điều khiển tập trung số bài, trạng thái phân công, phản biện còn thiếu, hạn chót và các trường hợp cần xử lý. Mục tiêu là giúp Chủ tọa nhận biết điểm nghẽn và ưu tiên hành động. Bảng điều khiển không tự chuyển giai đoạn, không tự nhắc theo một quyết định không được cấu hình và không tự ra quyết định thay Chủ tọa.

### Component 3 — Phân công và kiểm tra COI

**Nội dung nguồn đầy đủ:** Chủ tọa xem đề xuất Phản biện viên cùng điểm phù hợp, tải và trạng thái xung đột lợi ích. Thuật toán loại cặp có COI khỏi đề xuất tự động, nhưng các trường hợp dữ liệu thiếu hoặc đề xuất thủ công vẫn cần Chủ tọa kiểm tra. Chủ tọa có thể điều chỉnh phương án trước khi xác nhận, phản ánh trách nhiệm điều phối đối với công bằng và chất lượng chuyên môn.

### Component 4 — Mở phản hồi và thảo luận

**Nội dung nguồn đầy đủ:** Sau khi phản biện được công bố, Chủ tọa hoặc Đồng chủ tọa mở giai đoạn rebuttal và thảo luận. Tác giả gửi phản hồi; Phản biện viên đọc, trao đổi và có thể cập nhật đánh giá. Chủ tọa xem toàn bộ lịch sử, bảo đảm các thay đổi sau phản hồi được đưa vào bộ bằng chứng trước quyết định.

### Component 5 — Chair Decision Copilot

**Nội dung nguồn đầy đủ:** Backend tập hợp điểm số, bản phản biện, rebuttal, thảo luận và thay đổi sau phản hồi. Chair Decision Copilot sắp xếp các nguồn thành bản tổng hợp về đồng thuận, bất đồng, vấn đề còn mở và cơ sở bằng chứng. Luồng không đưa ra khuyến nghị chấp nhận hoặc từ chối. Kết quả benchmark chỉ đo mức bám nguồn của các mệnh đề tổng hợp, không đo độ đúng của quyết định học thuật.

### Component 6 — Ghi nhận quyết định

**Nội dung nguồn đầy đủ:** Chủ tọa đối chiếu bản tổng hợp với dữ liệu gốc, cân nhắc các yếu tố học thuật và tự ghi nhận quyết định. Backend xác thực quyền và trạng thái trước khi cập nhật. Quyết định cùng lịch sử dữ liệu được lưu như kết quả nghiệp vụ chính thức; AI không trực tiếp tạo trạng thái chấp nhận hoặc từ chối.

### Component 7 — Ý nghĩa của ảnh giao diện

**Nội dung nguồn đầy đủ:** Ảnh dashboard hoặc giao diện hỗ trợ quyết định cho thấy Chủ tọa có thể truy cập đồng thời dữ liệu gốc và bản tổng hợp. Cấu trúc này tạo điều kiện kiểm tra chéo, thay vì trình bày một kết luận AI tách khỏi nguồn. Ảnh minh họa cách sử dụng, không chứng minh tính đầy đủ hoặc hữu ích của bản tổng hợp.

### Kết luận đầy đủ của slide

Chủ tọa chịu trách nhiệm xuyên suốt từ cấu hình đến quyết định. Hệ thống có thể giúp nhận biết điểm nghẽn, tạo phương án phân công và tổng hợp bằng chứng, nhưng mỗi bước ảnh hưởng đến quyền truy cập hoặc kết quả học thuật đều cần Chủ tọa kiểm tra và xác nhận. Chair Decision Copilot hỗ trợ tổ chức thông tin, không thay thế quyết định.

**Nguồn nội bộ:** Chương 3, UC-06–UC-09; các hình `chapter_3_uc06_*`, `chapter_3_uc07_*`, `chapter_3_uc08_*`, `chapter_3_uc09_decision_support.png`.

---

## Slide 14 — Reviewer matching kết hợp chủ đề, tải công việc và ràng buộc

### Component 1 — Đầu vào chuyên môn

**Nội dung nguồn đầy đủ:** Hệ thống biểu diễn miền chuyên môn của bài nộp bằng tập (S) và miền chuyên môn của Phản biện viên bằng tập (R). Các tập có thể được hình thành từ hồ sơ và dữ liệu chủ đề sẵn có. Tín hiệu này chỉ phản ánh mức giao nhau của miền chuyên môn đã được mã hóa; nó không thay thế đánh giá của Chủ tọa về kinh nghiệm thực tế, chuyên môn hẹp hoặc sự phù hợp với một bài cụ thể.

### Component 2 — Điểm Jaccard

**Nội dung nguồn đầy đủ:** Hệ thống tính (J(S,R)=|S\cap R|/|S\cup R|). Nếu cả hai tập rỗng, điểm bằng 0 vì không có bằng chứng về mức phù hợp. Jaccard được chọn vì có thể giải thích trực tiếp từ số miền chung và tổng số miền khác nhau, không cần dữ liệu huấn luyện và cho kết quả tái lập trên cùng đầu vào.

### Component 3 — Bidding và tín hiệu nguyện vọng

**Nội dung nguồn đầy đủ:** Khi hội nghị kích hoạt giai đoạn đăng ký nguyện vọng, bidding bổ sung tín hiệu về bài Phản biện viên muốn hoặc không muốn nhận. Tín hiệu này không thay thế kiểm tra chuyên môn và COI; nó là một căn cứ bổ sung để Chủ tọa xem xét trong bối cảnh phân công. Mức độ sử dụng bidding phụ thuộc cấu hình hội nghị.

### Component 4 — Ràng buộc xung đột lợi ích

**Nội dung nguồn đầy đủ:** Trước khi sắp xếp ứng viên, thuật toán loại các cặp có xung đột lợi ích khỏi đề xuất tự động. COI là ràng buộc cứng trong cả lượt chính và lượt dự phòng. Việc giữ ràng buộc này quan trọng hơn việc tăng độ phủ bằng cách gán một cặp không hợp lệ.

### Component 5 — Tải và quy tắc phân xử khi bằng điểm

**Nội dung nguồn đầy đủ:** Thuật toán sắp xếp ứng viên theo điểm giảm dần. Khi hai ứng viên có cùng điểm, hệ thống ưu tiên người có ít bài đang được phân công hơn; nếu tải vẫn bằng nhau, hệ thống dùng thứ tự cố định theo định danh. Quy tắc này làm kết quả ổn định và có thể kiểm tra lại. Giới hạn tải trong lượt chạy giúp tránh dồn quá nhiều bài vào một nhóm nhỏ.

### Component 6 — Lượt 1 của GreedyMatcher

**Nội dung nguồn đầy đủ:** Lượt đầu tạo ma trận điểm, loại COI, sắp xếp ứng viên và gán dưới các điều kiện về ngưỡng điểm, số người cần cho mỗi bài và giới hạn tải phát sinh. Mục tiêu là giữ tín hiệu phù hợp trong khi đáp ứng ràng buộc. Vì thuật toán tham lam ra quyết định theo thứ tự cục bộ, nó không bảo đảm tổng mức phù hợp tối ưu cho toàn hội nghị.

### Component 7 — Lượt 2 dự phòng

**Nội dung nguồn đầy đủ:** Với bài vẫn chưa có Phản biện viên, lượt dự phòng bỏ ngưỡng điểm và giới hạn tải phát sinh, nhưng vẫn giữ COI là ràng buộc cứng và chỉ bổ sung một Phản biện viên cho mỗi bài còn thiếu. Lượt này có thể chọn cặp có điểm 0 hoặc làm một người vượt giới hạn tải. Vì vậy, hệ thống phải đánh dấu đây là kết quả dự phòng để Chủ tọa kiểm tra kỹ hơn.

### Component 8 — Đầu ra và quyền xác nhận

**Nội dung nguồn đầy đủ:** Hệ thống trả danh sách đề xuất kèm điểm, lý do, tải, trạng thái COI và danh sách bài chưa đủ người. Chủ tọa có thể thêm, loại hoặc đổi Phản biện viên trước khi xác nhận. Đề xuất không tự tạo phân công chính thức; backend chỉ ghi dữ liệu sau thao tác của Chủ tọa.

### Component 9 — Giới hạn của thuật toán

**Nội dung nguồn đầy đủ:** Điểm Jaccard dựa trên khớp chủ đề từ vựng và có thể bỏ lỡ từ đồng nghĩa hoặc chuyên môn không được mã hóa. Thuật toán Greedy không tối ưu toàn cục, có thể thiếu độ phủ và cần lượt dự phòng. Benchmark dùng nhãn tác giả gốc làm tín hiệu gián tiếp, không phải phương án phân công do Chủ tọa xác nhận. Vì vậy, thuật toán phù hợp với vai trò tạo danh sách ứng viên có căn cứ, không phù hợp với phân công hoàn toàn tự động.

### Kết luận đầy đủ của slide

Reviewer matching trong ConferenceSpace là quy trình xác định kết hợp tín hiệu chủ đề, nguyện vọng, tải và COI. Giá trị của thuật toán nằm ở kết quả ổn định, có lý do và có thể kiểm tra; giới hạn của dữ liệu và chiến lược tham lam khiến Chủ tọa vẫn phải xem, điều chỉnh và xác nhận trước khi phân công.

**Nguồn nội bộ:** Chương 3, mục “Đối sánh Phản biện viên”; Chương 4, mục “Hành vi xếp hạng và phân công”; `statistics/deterministic_workflow`.

---

## Slide 15 — Xung đột lợi ích được kiểm tra trước khi Phản biện viên được phân công

### Component 1 — Nguồn 1: Quan hệ tác giả trực tiếp

**Nội dung nguồn đầy đủ:** Hệ thống kiểm tra liệu người được xem xét phân công có phải tác giả của bài hoặc có quan hệ trực tiếp được lưu trong dữ liệu bài nộp hay không. Đây là trường hợp xác định và phải bị loại khỏi đề xuất tự động. Benchmark chất lượng đã gắn self-authorship COI vào kịch bản và không ghi nhận vi phạm trong các phương pháp được thử, nhưng kết quả này chỉ bao phủ conflict map của bộ thử.

### Component 2 — Nguồn 2: Khai báo thủ công

**Nội dung nguồn đầy đủ:** Tác giả, Phản biện viên hoặc người có trách nhiệm có thể khai báo quan hệ xung đột theo quy trình. Backend dùng dữ liệu khai báo như một ràng buộc khi tạo đề xuất. Chất lượng phụ thuộc vào độ đầy đủ và trung thực của khai báo; hệ thống không thể suy ra những quan hệ chưa được cung cấp.

### Component 3 — Nguồn 3: Quan hệ đồng tác giả nhiều bậc

**Nội dung nguồn đầy đủ:** Neo4j lưu quan hệ học thuật để truy vấn đường đi đồng tác giả từ một đến ba bậc trong khoảng thời gian được cấu hình. Lớp đồ thị nhằm phát hiện quan hệ gián tiếp không xuất hiện trong dữ liệu bài nộp hiện tại. Kết quả phải kèm đường quan hệ hoặc căn cứ để Chủ tọa xem xét, vì một quan hệ đồ thị không tự động cho biết mức độ xung đột trong mọi chính sách hội nghị.

### Component 4 — Xử lý trong đề xuất tự động

**Nội dung nguồn đầy đủ:** Thuật toán loại cặp có COI khỏi cả lượt chính và lượt dự phòng. Đây là ràng buộc cứng: hệ thống không được đánh đổi COI để tăng điểm phù hợp hoặc độ phủ. Danh sách đề xuất hiển thị trạng thái kiểm tra để Chủ tọa biết vì sao một ứng viên bị loại hoặc cần xem xét thêm.

### Component 5 — Xử lý khi Chủ tọa thêm thủ công

**Nội dung nguồn đầy đủ:** Khi Chủ tọa thêm một đề xuất thủ công, backend kiểm tra các nguồn hiện có, trả cảnh báo và lưu trạng thái kiểm tra trong siêu dữ liệu của đề xuất. Luồng hiện tại cảnh báo thay vì ngăn ghi dữ liệu. Đây là một giới hạn: thao tác thủ công có thể vượt qua ràng buộc tự động nếu Chủ tọa không xử lý cảnh báo đúng cách.

### Component 6 — Trường hợp Neo4j thiếu hoặc lỗi

**Nội dung nguồn đầy đủ:** Nếu Neo4j chưa được cấu hình, hệ thống tiếp tục bằng các nguồn trực tiếp và khai báo, đồng thời ghi nhận lớp đồ thị đã bị bỏ qua. Nếu truy vấn Neo4j thất bại, hệ thống không thể khẳng định đã kiểm tra đầy đủ quan hệ nhiều bậc. Trạng thái này phải được hiển thị như sự không đầy đủ của bằng chứng, không được hiểu là “không có xung đột”.

### Component 7 — Vai trò của Chủ tọa và ảnh giao diện

**Nội dung nguồn đầy đủ:** Giao diện kiểm tra COI cho phép Chủ tọa xem nguồn, trạng thái và quan hệ liên quan trước khi xác nhận phân công. Hình minh họa điểm kiểm soát và loại căn cứ; nó không chứng minh độ chính xác của cơ chế đa tầng. Báo cáo chưa có tập cặp xung đột do chuyên gia gán nhãn để đo precision, recall và độ phủ theo từng nguồn.

### Kết luận đầy đủ của slide

COI là ràng buộc đa nguồn và không thể được rút gọn thành một cờ có hoặc không. ConferenceSpace kết hợp quan hệ trực tiếp, khai báo và đồ thị đồng tác giả; đồng thời hiển thị mức độ đầy đủ của việc kiểm tra. Đề xuất tự động loại COI như ràng buộc cứng, nhưng Chủ tọa vẫn phải kiểm tra căn cứ, đặc biệt khi dữ liệu đồ thị thiếu, truy vấn lỗi hoặc đề xuất được thêm thủ công.

**Nguồn nội bộ:** Chương 3, mục “Phát hiện xung đột lợi ích” và UC-06; Chương 4, mục “Phát hiện xung đột lợi ích đa tầng”.

---

## Slide 16 — Thảo luận và Chatbot hỗ trợ nhiều vai trò trong đúng phạm vi quyền

### Component 1 — Thảo luận theo bài nộp

**Nội dung nguồn đầy đủ:** UC-08 lưu trao đổi trong các chuỗi gắn với bài nộp. Sau khi Chủ tọa mở giai đoạn phản hồi, Phản biện viên được phân công có thể khởi tạo chủ đề; Tác giả và Phản biện viên trao đổi trong phạm vi bài; Chủ tọa xem lịch sử ở chế độ giám sát. Việc gắn thảo luận với bài giúp lưu lại bối cảnh, thời điểm và người tham gia, đồng thời đưa trao đổi vào bộ bằng chứng trước quyết định.

### Component 2 — Kiểm tra quyền trong thảo luận

**Nội dung nguồn đầy đủ:** Backend kiểm tra quan hệ giữa người dùng, bài nộp và chuỗi thảo luận trước mỗi thao tác đọc hoặc ghi. Quyền không chỉ dựa trên nhãn vai trò toàn cục. Một Phản biện viên chỉ được tham gia bài mình được phân công; một Tác giả chỉ được xem chuỗi thuộc bài của mình và đúng giai đoạn; Chủ tọa có quyền giám sát trong hội nghị do mình quản lý.

### Component 3 — Phạm vi Chatbot Agent

**Nội dung nguồn đầy đủ:** Chatbot Agent hỗ trợ truy vấn trạng thái và hướng dẫn thao tác trong ConferenceSpace. Nó có thể trả lời câu hỏi về hội nghị công khai, bài của Tác giả, phân công của Phản biện viên hoặc tổng quan hội nghị của Chủ tọa khi người dùng có quyền tương ứng. Agent không được định vị là trợ lý nghiên cứu bên ngoài, công cụ viết phản biện hoặc nguồn tư vấn tự do về thị trường và lĩnh vực không thuộc nền tảng.

### Component 4 — Luồng gọi công cụ

**Nội dung nguồn đầy đủ:** Chatbot nhận câu hỏi, lịch sử hội thoại và ngữ cảnh trang. Nếu cần dữ liệu nghiệp vụ, Agent chọn công cụ và gửi yêu cầu có cấu trúc. Công cụ gọi endpoint backend bằng mã xác thực người dùng và mã xác thực liên dịch vụ. Backend kiểm tra tài nguyên, trường dữ liệu, bộ lọc và quyền, rồi trả phần dữ liệu tối thiểu được phép. Agent dùng kết quả để tạo câu trả lời.

### Component 5 — Ranh giới dữ liệu

**Nội dung nguồn đầy đủ:** Chatbot không truy cập trực tiếp PostgreSQL, Neo4j hoặc Redis. Việc bắt buộc đi qua backend giữ toàn bộ quy tắc phân quyền và nghiệp vụ ở một ranh giới có thể kiểm tra. Dịch vụ AI không được tự mở rộng truy vấn, đọc trường dữ liệu ngoài cấu trúc công cụ hoặc sử dụng quyền của một vai trò khác.

### Component 6 — Xử lý lỗi và câu hỏi vượt phạm vi

**Nội dung nguồn đầy đủ:** Khi công cụ thất bại hoặc backend từ chối quyền, Chatbot phải giải thích giới hạn thay vì trình bày lỗi truy vấn thô hoặc suy đoán dữ liệu. Khi câu hỏi nằm ngoài phạm vi, Agent phải từ chối hoặc hướng người dùng về chức năng phù hợp. Benchmark ghi nhận một biến thể đã tạo nội dung vượt phạm vi và một số câu trả lời lộ lỗi truy vấn; đây là bằng chứng cho thấy ranh giới cần tiếp tục được củng cố.

### Component 7 — Ý nghĩa của hai ảnh giao diện

**Nội dung nguồn đầy đủ:** Ảnh thảo luận minh họa lịch sử trao đổi có cấu trúc theo bài; ảnh Chatbot minh họa một giao diện dùng chung nhưng phản hồi phụ thuộc vai trò và quyền. Hai ảnh không có nghĩa Chatbot thay thế thảo luận chính thức. Thảo luận tạo dữ liệu nghiệp vụ gắn với bài; Chatbot chỉ tra cứu hoặc hướng dẫn trên dữ liệu được phép xem.

### Kết luận đầy đủ của slide

Thảo luận và Chatbot cùng phục vụ nhiều vai trò nhưng có chức năng khác nhau. Thảo luận lưu trao đổi chính thức theo bài; Chatbot hỗ trợ truy vấn và hướng dẫn. Cả hai đều phải đi qua kiểm tra quyền trên tài nguyên. Việc tách Chatbot khỏi cơ sở dữ liệu và buộc Agent dùng endpoint backend là cơ chế kỹ thuật bảo vệ ranh giới này.

**Nguồn nội bộ:** Chương 3, UC-08 và UC-10; mục “Kiến trúc tổng thể”.

---

## Slide 17 — Ba lớp khác nhau ở cơ chế tạo kết quả và quyền xác nhận

### Component 1 — Cột “Lớp”

**Nội dung nguồn đầy đủ:** Ba lớp là cách phân loại logic dựa trên cơ chế tạo kết quả và thẩm quyền sử dụng kết quả, không phải ba tầng triển khai tách biệt hoàn toàn. Một thành phần kỹ thuật có thể tham gia nhiều lớp. Backend vừa quản lý trạng thái nghiệp vụ, vừa chạy thuật toán đối sánh; dịch vụ AI tạo nhiều loại đầu ra nhưng không có quyền ghi dữ liệu chính thức. Cách phân loại giúp xác định trách nhiệm trước khi lựa chọn công nghệ.

### Component 2 — Hàng “Nghiệp vụ cốt lõi”: tác vụ và đầu ra

**Nội dung nguồn đầy đủ:** Lớp nghiệp vụ cốt lõi kiểm tra quyền và quản lý trạng thái hội nghị, bài nộp, phân công, phản biện, phản hồi, thảo luận và quyết định. Đầu ra của lớp này là dữ liệu nghiệp vụ chính thức và lịch sử thay đổi. Các ví dụ gồm ghi nhận một bài đã được gửi, tạo phân công sau khi Chủ tọa xác nhận, lưu bản phản biện do Phản biện viên gửi, mở giai đoạn rebuttal và cập nhật trạng thái chấp nhận hoặc từ chối.

### Component 3 — Hàng “Nghiệp vụ cốt lõi”: người xác nhận

**Nội dung nguồn đầy đủ:** Người dùng có thẩm quyền thực hiện thao tác; backend kiểm tra danh tính, vai trò trong hội nghị, quan hệ với tài nguyên, trạng thái hiện tại, hạn chót và các điều kiện nghiệp vụ. Backend không tự quyết định nội dung học thuật, nhưng chịu trách nhiệm không ghi một thay đổi trái quyền hoặc trái trạng thái. Vì vậy, quyền xác nhận thuộc người dùng, còn tính hợp lệ của thao tác được thực thi ở backend.

### Component 4 — Hàng “Thuật toán xác định”: tác vụ và đầu ra

**Nội dung nguồn đầy đủ:** Lớp thuật toán xác định tính điểm phù hợp, xếp hạng ứng viên, phân xử khi bằng điểm, theo dõi tải và phát hiện xung đột lợi ích theo quy tắc đã định nghĩa. Đầu ra gồm điểm số, lý do, danh sách đề xuất và danh sách bài chưa đủ Phản biện viên. Trên cùng đầu vào và cấu hình, kết quả phải ổn định để người dùng có thể tái lập và kiểm tra.

### Component 5 — Hàng “Thuật toán xác định”: người xác nhận

**Nội dung nguồn đầy đủ:** Chủ tọa kiểm tra điểm, tải, COI và các trường hợp dự phòng, sau đó điều chỉnh hoặc xác nhận. Thuật toán không tự tạo phân công chính thức. Quyền ghi dữ liệu vẫn đi qua backend sau hành động của Chủ tọa. Cách tổ chức này tách việc tạo phương án khỏi trách nhiệm quyết định phương án có phù hợp với bối cảnh hội nghị hay không.

### Component 6 — Hàng “AI hỗ trợ”: tác vụ và đầu ra

**Nội dung nguồn đầy đủ:** Lớp AI trích xuất siêu dữ liệu, tạo cảnh báo nội dung, định hướng đọc, rà soát bản nháp, tổng hợp bằng chứng và trả lời câu hỏi. Đầu ra gồm bản nháp, cảnh báo, bản phân tích, bản tổng hợp hoặc câu trả lời. Các đầu ra có thể chứa thông tin sai, thiếu hoặc không phù hợp; mã nhận diện dữ liệu, nguồn và nhật ký hỗ trợ truy vết nhưng không chứng minh đầu ra luôn đúng.

### Component 7 — Hàng “AI hỗ trợ”: người xác nhận

**Nội dung nguồn đầy đủ:** Tác giả kiểm tra Autofill và Gating; Phản biện viên kiểm tra Reviewer Initial Analysis và Review Quality Auditor; Chủ tọa kiểm tra Chair Decision Copilot; mọi người dùng kiểm tra câu trả lời Chatbot trong phạm vi của mình. AI không tự gửi bài, tự gửi phản biện, tự phân công hoặc tự quyết định.

### Component 8 — Bước 01: Đầu ra hỗ trợ

**Nội dung nguồn đầy đủ:** Thuật toán hoặc AI tạo kết quả cùng căn cứ, trạng thái và thông tin truy vết. Ở bước này, dữ liệu mới chỉ là đề xuất hoặc nội dung hỗ trợ. Nó chưa làm thay đổi trạng thái bài, chưa cấp quyền mới và chưa trở thành quyết định.

### Component 9 — Bước 02: Người dùng kiểm tra

**Nội dung nguồn đầy đủ:** Người có vai trò phù hợp đối chiếu đầu ra với dữ liệu gốc, sửa hoặc bỏ qua nội dung và lựa chọn hành động. Bước này là điểm đặt trách nhiệm học thuật: Tác giả chịu trách nhiệm về bài nộp, Phản biện viên về bản phản biện và Chủ tọa về phân công cùng quyết định.

### Component 10 — Bước 03: Backend xác thực

**Nội dung nguồn đầy đủ:** Backend kiểm tra quyền, trạng thái, hạn chót, dữ liệu bắt buộc và các ràng buộc liên quan. Việc người dùng nhìn thấy một đề xuất hoặc một nút trên giao diện không đủ để cập nhật dữ liệu. Backend là điểm thực thi cuối nhằm ngăn thao tác không hợp lệ hoặc vượt quyền.

### Component 11 — Bước 04: Ghi nhận dữ liệu chính thức

**Nội dung nguồn đầy đủ:** Chỉ sau khi người dùng hành động và backend xác thực, hệ thống mới ghi dữ liệu nghiệp vụ cùng lịch sử. Nhật ký phải cho biết ai thực hiện, trên tài nguyên nào, kết quả hỗ trợ nào đã được dùng nếu có, và trạng thái thay đổi ra sao. Báo cáo xác định nhật ký toàn diện cho đầu ra AI và quyết định người dùng vẫn là hạng mục cần hoàn thiện.

### Kết luận đầy đủ của slide

Ba lớp không khác nhau chỉ ở công nghệ; chúng khác ở loại kết quả và quyền biến kết quả thành dữ liệu chính thức. Không có đường đi trực tiếp từ đầu ra thuật toán hoặc AI đến trạng thái nghiệp vụ. Người dùng phải kiểm tra và lựa chọn, backend phải xác thực, rồi hệ thống mới ghi nhận thay đổi. Đây là cơ chế trung tâm bảo toàn trách nhiệm trong ConferenceSpace.

**Nguồn nội bộ:** Chương 3, Bảng “Trách nhiệm và thẩm quyền trong ba lớp” và Hình “Đường chuyển kết quả hỗ trợ thành dữ liệu nghiệp vụ chính thức”.

---

## Slide 18 — Backend là ranh giới nghiệp vụ và phân quyền của hệ thống

### Component 1 — Trình duyệt và ba không gian vai trò

**Nội dung nguồn đầy đủ:** Người dùng tương tác qua giao diện web được tổ chức theo không gian Tác giả, Phản biện viên và Chủ tọa. Không gian Tác giả kết nối khám phá hội nghị, nộp và quản lý bài; không gian Phản biện viên kết nối lời mời, bài được phân công, biểu mẫu phản biện và thảo luận; không gian Chủ tọa kết nối cấu hình, phân công, giám sát tiến độ và quyết định. Chatbot và thông báo xuất hiện ở nhiều không gian nhưng dùng cùng ngữ cảnh xác thực.

### Component 2 — Caddy và Next.js

**Nội dung nguồn đầy đủ:** Caddy là cổng tiếp nhận lưu lượng, cung cấp HTTPS và định tuyến đến giao diện hoặc backend. Next.js cung cấp giao diện web và một luồng hội thoại phía máy chủ. Giao diện không truy cập trực tiếp cơ sở dữ liệu hoặc nhà cung cấp mô hình. Việc tách cổng truy cập và giao diện khỏi dữ liệu giúp kiểm soát các đường vào công khai.

### Component 3 — Backend Go và Gin

**Nội dung nguồn đầy đủ:** Backend là ứng dụng nguyên khối có kiến trúc phân lớp, được xây dựng bằng Go và Gin. Tầng điều khiển tiếp nhận yêu cầu HTTP; tầng dịch vụ thực thi nghiệp vụ; tầng lưu trữ làm việc với PostgreSQL; tầng tích hợp kết nối AI, Neo4j, nguồn dữ liệu học thuật và thư điện tử. Nhóm không tách nghiệp vụ thành nhiều vi dịch vụ khi chưa có nhu cầu vận hành tương ứng, nhằm giữ logic trạng thái và phân quyền trong một ranh giới rõ.

Backend xác thực người dùng, kiểm tra quyền trên tài nguyên và thực thi quy tắc trước khi đọc hoặc cập nhật dữ liệu. Backend cũng thực hiện các tác vụ xác định như reviewer matching và kiểm tra COI. Đây là nơi duy nhất được phép ghi trạng thái nghiệp vụ chính thức.

### Component 4 — Dịch vụ AI

**Nội dung nguồn đầy đủ:** Dịch vụ AI được tách khỏi backend vì có vòng đời, tải xử lý và phụ thuộc nhà cung cấp khác. Backend điều phối phần lớn các luồng AI. Riêng hội thoại có đường Next.js đến dịch vụ AI; khi Chatbot cần dữ liệu, dịch vụ AI vẫn phải gọi endpoint backend bằng ngữ cảnh xác thực. Dịch vụ AI tạo đầu ra hỗ trợ và trạng thái xử lý, không trực tiếp cập nhật bảng nghiệp vụ.

### Component 5 — PostgreSQL

**Nội dung nguồn đầy đủ:** PostgreSQL lưu dữ liệu giao dịch của hội nghị, bài nộp, phân công, phản biện, phản hồi, thảo luận và quyết định; đồng thời lưu phiên hội thoại cùng kết quả cần truy vết. Cơ sở dữ liệu này phù hợp với các thao tác cần giao dịch và tính nhất quán. Việc cập nhật chỉ xảy ra qua backend sau kiểm tra quyền và điều kiện.

### Component 6 — Neo4j

**Nội dung nguồn đầy đủ:** Neo4j biểu diễn quan hệ học thuật và đồng tác giả để hỗ trợ truy vấn đường đi nhiều bậc trong kiểm tra COI. Kho đồ thị được tách vì kiểu truy vấn quan hệ khác với giao dịch nghiệp vụ. Nếu Neo4j chưa cấu hình hoặc truy vấn thất bại, hệ thống phải ghi nhận lớp đồ thị bị bỏ qua hoặc chưa được kiểm tra đầy đủ.

### Component 7 — Redis

**Nội dung nguồn đầy đủ:** Redis lưu kết quả công cụ đang chờ và bộ đếm giới hạn tần suất có thời hạn ngắn. Dữ liệu này phục vụ trạng thái tạm thời và điều phối, không thay thế PostgreSQL cho lịch sử nghiệp vụ. Việc tách Redis giúp các tác vụ ngắn hạn không làm phức tạp mô hình giao dịch chính.

### Component 8 — Nguyên tắc 1: Ranh giới nghiệp vụ

**Nội dung nguồn đầy đủ:** Backend là nơi duy nhất kiểm tra điều kiện và cập nhật trạng thái chính thức. Giao diện, dịch vụ AI và kho dữ liệu chuyên biệt không được tạo đường ghi tắt. Nguyên tắc này giúp mọi thao tác chính thức đi qua cùng logic quyền và trạng thái, giảm nguy cơ một chức năng hỗ trợ vượt khỏi phạm vi.

### Component 9 — Nguyên tắc 2: Dữ liệu theo kiểu truy vấn

**Nội dung nguồn đầy đủ:** PostgreSQL ưu tiên giao dịch và lịch sử nghiệp vụ; Neo4j phục vụ quan hệ nhiều bậc; Redis giữ trạng thái ngắn hạn. Việc dùng ba kho dữ liệu không tương ứng với ba lớp trách nhiệm. Đây là quyết định kỹ thuật dựa trên cấu trúc dữ liệu, yêu cầu nhất quán và kiểu truy vấn.

### Component 10 — Nguyên tắc 3: Quyền theo tài nguyên

**Nội dung nguồn đầy đủ:** Hệ thống không dùng một vai trò toàn cục cố định. Một người có thể là Tác giả ở hội nghị này, Phản biện viên ở hội nghị khác và Chủ tọa ở hội nghị thứ ba. Backend kiểm tra danh tính cùng quan hệ cụ thể với hội nghị, bài, phân công hoặc chuỗi thảo luận. Cách kiểm tra này ngăn việc một vai trò hợp lệ ở nơi này bị dùng để truy cập dữ liệu ở nơi khác.

### Kết luận đầy đủ của slide

Kiến trúc đặt backend làm ranh giới duy nhất cho nghiệp vụ và phân quyền, trong khi giao diện, dịch vụ AI và các kho dữ liệu chuyên biệt chỉ thực hiện chức năng tương ứng. Cách phân chia này giữ logic trạng thái gần dữ liệu giao dịch, cho phép AI hỗ trợ mà không mở đường truy cập trực tiếp, và bảo đảm quyền được đánh giá trên từng tài nguyên thay vì theo vai trò toàn cục.

**Nguồn nội bộ:** Chương 3, các mục “Kiến trúc tổng thể”, “Thiết kế giao diện, backend và phân quyền” và “Thiết kế dữ liệu”.

---

## Slide 19 — Deployment tách mạng công khai, ứng dụng và dữ liệu

### Component 1 — Internet và điểm vào công khai

**Nội dung nguồn đầy đủ:** Lưu lượng từ Internet chỉ đi vào hệ thống qua Caddy. Caddy cung cấp HTTPS và định tuyến yêu cầu đến giao diện web hoặc backend. Việc dùng một điểm vào công khai giúp tập trung cấu hình chứng chỉ, tuyến đường và các chính sách mạng thay vì mở riêng từng dịch vụ ra Internet.

### Component 2 — Caddy: TLS và định tuyến

**Nội dung nguồn đầy đủ:** Caddy kết thúc kết nối TLS, bảo vệ dữ liệu trên đường truyền và định tuyến theo loại yêu cầu. Caddy không chứa logic học thuật hoặc quyền nghiệp vụ; backend vẫn phải xác thực người dùng và kiểm tra tài nguyên. Cổng mạng và ranh giới nghiệp vụ vì vậy là hai lớp kiểm soát bổ sung, không thay thế nhau.

### Component 3 — Nhóm dịch vụ ứng dụng

**Nội dung nguồn đầy đủ:** Giao diện web, backend, dịch vụ AI và tác vụ migration được đóng gói thành các dịch vụ riêng. Việc tách này phản ánh vòng đời và tải khác nhau: frontend phục vụ giao diện; backend xử lý giao dịch và thuật toán; dịch vụ AI thực hiện tác vụ dài hoặc phụ thuộc mô hình; migration cập nhật lược đồ theo thứ tự trước khi ứng dụng mới hoạt động. Các dịch vụ vẫn nằm trong một topology có mạng ứng dụng được kiểm soát.

### Component 4 — Nhóm dữ liệu nội bộ

**Nội dung nguồn đầy đủ:** PostgreSQL, Redis và Neo4j không mở cổng trực tiếp ra Internet. Chúng chỉ nhận kết nối từ các dịch vụ được phép trong mạng dữ liệu nội bộ. Cấu hình tách mạng ứng dụng khỏi mạng dữ liệu nhằm giảm bề mặt truy cập và làm rõ dịch vụ nào có quyền kết nối đến từng kho.

### Component 5 — Quan hệ ứng dụng–dữ liệu

**Nội dung nguồn đầy đủ:** Backend kết nối PostgreSQL và Neo4j theo nhu cầu nghiệp vụ; dịch vụ AI dùng Redis cho trạng thái công cụ và có thể gọi backend để truy vấn dữ liệu được phép. Việc kết nối không cấp cho AI quyền đọc trực tiếp toàn bộ dữ liệu. Quyền nghiệp vụ vẫn được backend kiểm tra ở cấp yêu cầu.

### Component 6 — CI/CD bước 01: Build

**Nội dung nguồn đầy đủ:** GitHub Actions khởi chạy khi mã nguồn được đẩy hoặc khi người vận hành chạy thủ công. Pipeline xây dựng song song image của frontend, backend và dịch vụ AI. Build song song giảm thời gian chờ nhưng vẫn tạo ba sản phẩm triển khai độc lập theo trách nhiệm của từng dịch vụ.

### Component 7 — CI/CD bước 02: Tag

**Nội dung nguồn đầy đủ:** Mỗi image được gắn thẻ theo commit SHA. Thẻ này liên kết phiên bản triển khai với trạng thái mã nguồn cụ thể, hỗ trợ truy vết khi cần xác định dịch vụ nào đã tạo một hành vi hoặc lỗi. Việc gắn thẻ không tự tạo khả năng rollback; báo cáo xác định rollback và khôi phục sau sự cố là giới hạn chưa được kiểm chứng.

### Component 8 — CI/CD bước 03: Push

**Nội dung nguồn đầy đủ:** Pipeline đẩy image lên GitHub Container Registry. Giá trị bí mật và cấu hình thực thi không được đóng gói trong image; chúng được lưu trong tệp môi trường trên máy chủ hoặc GitHub Secrets. Cách tách này giúp cùng image có thể chạy trong môi trường khác nhau mà không đưa thông tin nhạy cảm vào mã nguồn.

### Component 9 — CI/CD bước 04: Deploy

**Nội dung nguồn đầy đủ:** Máy chủ kéo đúng image theo commit SHA, chạy migration và cập nhật container bằng Docker Compose. Migration phải chạy có thứ tự trước khi ứng dụng sử dụng lược đồ mới, nhằm tránh lệch giữa phiên bản dịch vụ và dữ liệu. Cấu hình triển khai cần bảo đảm các kho dữ liệu nội bộ không bị mở công khai trong quá trình cập nhật.

### Component 10 — Giới hạn vận hành

**Nội dung nguồn đầy đủ:** Kiến trúc triển khai và image theo commit SHA hỗ trợ truy vết cấu hình, nhưng báo cáo chưa kiểm thử chạy bền, triển khai phân tán, rollback, khôi phục sau lỗi, timeout của dịch vụ AI hoặc tính nhất quán khi một dịch vụ ngừng hoạt động. Topology mô tả ranh giới dự kiến; mức độ sẵn sàng vận hành thực tế cần thêm bằng chứng.

### Kết luận đầy đủ của slide

Deployment tách rõ ba vùng: Caddy là điểm vào công khai, các dịch vụ ứng dụng xử lý theo chức năng, còn PostgreSQL, Redis và Neo4j nằm trong mạng dữ liệu nội bộ. Pipeline CI/CD tạo image có thể truy vết theo commit, chạy migration và cập nhật bằng Docker Compose. Thiết kế làm rõ nơi nào được công khai và nơi nào được phép ghi dữ liệu, nhưng chưa chứng minh khả năng vận hành dài hạn hoặc phục hồi sau sự cố.

**Nguồn nội bộ:** Chương 3, mục “Môi trường triển khai và vận hành”; Hình “Luồng xây dựng image và triển khai tự động”.

---

## Slide 20 — Mỗi lớp được đánh giá bằng loại bằng chứng riêng

### Component 1 — Nguyên tắc đánh giá theo trách nhiệm

**Nội dung nguồn đầy đủ:** Ba lớp của ConferenceSpace tạo ba loại kết quả khác nhau, nên không thể dùng một chỉ số chung để kết luận về toàn hệ thống. Hiệu năng backend không cho biết nội dung AI có đúng hay không. Mức bám nguồn cao không chứng minh một quyết định học thuật chính xác. Phản hồi tích cực của người dùng không thay thế phép đo định lượng. Khung đánh giá vì vậy tách câu hỏi, nguồn bằng chứng, chỉ số và phạm vi kết luận cho từng nhóm trách nhiệm.

### Component 2 — Nghiệp vụ cốt lõi: hiệu năng và độ ổn định

**Nội dung nguồn đầy đủ:** Nhóm này trả lời câu hỏi các đường xử lý nghiệp vụ được chọn có đủ nhanh và ổn định trong cấu hình thử nghiệm hay không. Nguồn bằng chứng gồm tải HTTP bằng k6, thống kê yêu cầu thất bại và giám sát CPU/RAM. Các chỉ số chính là thông lượng, độ trễ trung vị và p95, tỷ lệ yêu cầu thất bại và mức sử dụng tài nguyên. Phạm vi kết luận chỉ bao phủ ba đường xử lý và thời lượng tải đã chọn.

### Component 3 — Thuật toán xác định: chi phí và hành vi

**Nội dung nguồn đầy đủ:** Nhóm này tách hai câu hỏi. Go microbenchmark đo thời gian xử lý, bộ nhớ và số lần cấp phát trực tiếp trên mã, không gồm HTTP, cơ sở dữ liệu hoặc mạng. Bộ đánh giá chất lượng trên dữ liệu tổng hợp đo Hit@k, MRR, nDCG, độ phủ, điểm phù hợp, tải và lượt dự phòng. Các chỉ số cho biết chi phí mã và hành vi của thuật toán trên fixture, không xác nhận mức phù hợp chuyên môn trong hội nghị thật.

### Component 4 — AI hỗ trợ: chất lượng theo từng loại đầu ra

**Nội dung nguồn đầy đủ:** Submission Autofill được đối chiếu với siêu dữ liệu tham chiếu bằng Exact Match, F1 và ROUGE. Submission Gating có nhánh luật được đối chiếu trực tiếp với phán quyết và mã luật; nhánh nội dung được kiểm tra về ranh giới không chặn. Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot được chấm bằng TCA để mô tả quan hệ giữa mệnh đề và bằng chứng. Chatbot Agent được đánh giá bằng kịch bản theo vai trò, quyền và hành vi gọi công cụ. Mỗi phép đo chỉ trả lời câu hỏi của luồng tương ứng.

### Component 5 — UAT: bằng chứng cảm nhận

**Nội dung nguồn đầy đủ:** UAT khảo sát người dùng sau khi trải nghiệm hệ thống. Các chỉ số gồm mức hài lòng, cảm nhận giảm thao tác hoặc thời gian, tính năng được đánh giá hữu ích và mức sẵn sàng giới thiệu. UAT mô tả cảm nhận của mẫu tham gia; nó không đo trực tiếp số phút tiết kiệm, chất lượng quyết định hoặc hiệu lực của từng AI workflow khi câu hỏi gộp nhiều chức năng.

### Component 6 — Quy mô dữ liệu backend

**Nội dung nguồn đầy đủ:** Kiểm thử backend dùng dữ liệu tổng hợp gồm 300 hội nghị, 15.000 bài nộp và 9.000 quan hệ Phản biện viên–hội nghị. Mỗi kịch bản dùng 20 người dùng ảo trong 30 giây. Quy mô này tạo tải lặp lại trên các endpoint đã chọn nhưng không mô phỏng đầy đủ toàn bộ hành trình người dùng hoặc vận hành nhiều ngày.

### Component 7 — Quy mô dữ liệu thuật toán

**Nội dung nguồn đầy đủ:** Đánh giá reviewer matching dùng snapshot tổng hợp gồm 60 hồ sơ tác giả, 60 Phản biện viên, 2.565 bài và 60 truy vấn leave-one-out; từ vựng chủ đề gồm 14.096 mục, trung bình 11,66 chủ đề mỗi bài. Nhãn tác giả gốc là proxy cho quan hệ chủ đề, không phải gold assignment.

### Component 8 — Quy mô dữ liệu AI

**Nội dung nguồn đầy đủ:** Bộ thực thi AI nhận 1.127 bài từ tập ReviewRebuttal đã chọn lọc và hoàn tất 1.097 bài, tương ứng 97,34%. Ba mươi bài không hoàn tất do lỗi dịch vụ AI hoặc lỗi benchmark; chúng được giữ trong thống kê vận hành nhưng không đưa vào TCA. Các bộ chuyên biệt gồm 48 trường hợp Track Recommendation, 8 trường hợp kiểm tra luật Gating, 24 trường hợp cảnh báo nội dung và 40 hội thoại Chatbot thuộc tám nhóm kịch bản.

### Component 9 — Chuỗi từ đầu vào đến kết luận

**Nội dung nguồn đầy đủ:** Mỗi thực nghiệm phải nối năm bước: xác định đầu vào và điều kiện; thực hiện thao tác theo kịch bản; lưu đầu ra và tư liệu truy vết; tính chỉ số hoặc đối chiếu; diễn giải kết quả cùng giới hạn. Chuỗi này ngăn việc chỉ đưa một biểu đồ mà không giải thích dữ liệu, cách chạy và phần không được đo.

### Kết luận đầy đủ của slide

Mỗi lớp chỉ được đánh giá bằng bằng chứng phù hợp với trách nhiệm của nó. Hệ thống nghiệp vụ được đo về hiệu năng; thuật toán được đo về chi phí và hành vi có thể tái lập; AI được đo theo từng loại đầu ra; UAT đo cảm nhận. Việc tách này cho phép kết luận chính xác hơn và ngăn một kết quả tích cực ở một lớp bị dùng để che giới hạn ở lớp khác.

**Nguồn nội bộ:** Chương 4, các mục “Mục tiêu và phạm vi đánh giá”, “Kịch bản đánh giá và đầu vào theo nhóm”, “Thiết lập thực nghiệm”; `statistics/*/exports`.

---

## Slide 21 — Backend đáp ứng tải ngắn hạn trên ba đường xử lý được chọn

### Component 1 — Thiết lập tải

**Nội dung nguồn đầy đủ:** k6 tạo tải HTTP lên API trong stack Go API, PostgreSQL, Neo4j và Redis chạy bằng Docker. Máy thử có 14 lõi CPU và 48 GB RAM. Dữ liệu khởi tạo gồm 300 hội nghị, 15.000 bài nộp và 9.000 quan hệ Phản biện viên–hội nghị. Mỗi kịch bản chạy với 20 người dùng ảo trong 30 giây. Ngưỡng tham chiếu của phép thử là p95 không vượt 120 ms.

### Component 2 — Kịch bản truy vấn đọc

**Nội dung nguồn đầy đủ:** Kịch bản được gọi là CRUD trong tư liệu tải nhưng chỉ thực hiện ba thao tác đọc: liệt kê hội nghị, liệt kê bài nộp và tìm kiếm người dùng. Theo tệp thống kê xuất, kịch bản xử lý 11.107 yêu cầu, đạt 369,1 yêu cầu/giây, độ trễ trung bình 51,78 ms, trung vị 46,21 ms, p95 117,61 ms, p99 168,11 ms và cao nhất 403,59 ms. Không ghi nhận yêu cầu thất bại.

Ý nghĩa của kết quả là đường truy vấn đọc đạt ngưỡng p95 trong tải ngắn hạn. Vì kịch bản không tạo, cập nhật hoặc xóa dữ liệu, kết quả không được dùng để kết luận hiệu năng CRUD đầy đủ.

### Component 3 — Kịch bản gợi ý Phản biện viên

**Nội dung nguồn đầy đủ:** Kịch bản gọi đường xử lý gợi ý Phản biện viên, không tự ghi phân công. Tệp thống kê ghi 17.183 yêu cầu, thông lượng 572,3 yêu cầu/giây, độ trễ trung bình 19,02 ms, trung vị 9,74 ms, p95 71,80 ms, p99 117,34 ms và cao nhất 254,71 ms. Tỷ lệ thất bại bằng 0%.

Kết quả này đo đường xử lý HTTP trong cấu hình fixture, không đo chất lượng danh sách ứng viên và không bao gồm thời gian Chủ tọa xem xét hoặc xác nhận.

### Component 4 — Kịch bản kiểm tra COI

**Nội dung nguồn đầy đủ:** Kịch bản kiểm tra xung đột lợi ích ghi 16.760 yêu cầu, thông lượng 558,1 yêu cầu/giây, độ trễ trung bình 20,40 ms, trung vị 9,54 ms, p95 79,34 ms, p99 124,89 ms và cao nhất 293,94 ms. Tỷ lệ thất bại bằng 0%. Kịch bản có truy vấn mẫu quan hệ đồng tác giả trên Neo4j, nhưng kết quả tải không đồng nghĩa với việc chất lượng phát hiện COI đa tầng đã được xác nhận.

### Component 5 — Tổng hợp độ tin cậy và thông lượng

**Nội dung nguồn đầy đủ:** Ba kịch bản tạo khoảng 45.050 yêu cầu và không ghi nhận lỗi HTTP. Thông lượng nằm trong khoảng 369,1–572,3 yêu cầu/giây; p95 cao nhất là 117,61 ms ở kịch bản truy vấn đọc, dưới ngưỡng 120 ms. Matching và COI có trung vị khoảng 9,5–9,7 ms, thấp hơn truy vấn đọc khoảng 46 ms trong cấu hình đã thử.

### Component 6 — Tài nguyên API

**Nội dung nguồn đầy đủ:** Container API sử dụng CPU trung bình 28,20% công suất một nhân, cao nhất 42,65%; RAM trung bình 30,47 MB, cao nhất 31,16 MB. Kết quả cho thấy container Go sử dụng tài nguyên tương đối thấp trong phép đo, nhưng không đại diện cho tải có nhiều tác vụ AI hoặc thao tác ghi phức tạp hơn.

### Component 7 — Tài nguyên PostgreSQL, Neo4j và Redis

**Nội dung nguồn đầy đủ:** PostgreSQL dùng CPU trung bình 114,98% và cao nhất 163,15% theo cách báo cáo trên một nhân; RAM trung bình 203,84 MB, cao nhất 222,20 MB. Neo4j dùng CPU trung bình 0,85%, cao nhất 7,01%, nhưng RAM trung bình 507,88 MB. Redis dùng CPU trung bình 0,45% và khoảng 9,15 MB RAM. PostgreSQL là thành phần cần ưu tiên phân tích khi tối ưu, nhưng phép đo chưa tách thời gian truy vấn theo thành phần nên không chứng minh đây là điểm nghẽn duy nhất.

### Component 8 — Giới hạn

**Nội dung nguồn đầy đủ:** Kết quả chỉ bao phủ tải ngắn hạn trên ba đường xử lý. Phép thử chưa bao gồm toàn bộ vòng đời chức năng, kiểm thử đầu cuối về phân quyền, chạy bền, tải phân tán, gây lỗi có chủ đích, khôi phục hoặc hành vi khi các dịch vụ phụ thuộc không khả dụng. Tỷ lệ lỗi bằng 0 trong 30 giây không được diễn giải thành độ tin cậy dài hạn.

### Kết luận đầy đủ của slide

Trong cấu hình thử nghiệm, ba endpoint được chọn xử lý hàng trăm yêu cầu mỗi giây, giữ p95 dưới 120 ms và không ghi nhận yêu cầu thất bại. Kết quả trực tiếp xác nhận ngưỡng hiệu năng ngắn hạn của các đường xử lý đó. Nó chưa xác nhận toàn bộ hành trình người dùng, tính đúng của phân quyền hoặc khả năng vận hành bền vững.

**Lưu ý nguồn:** tệp `statistics/system_performance/exports/summary_metrics.json` ghi 11.107 yêu cầu cho truy vấn đọc và 17.183 cho matching; bảng trong `Chapter4/chapter4.tex` ghi lần lượt 11.110 và 17.184. Khi đưa lên slide, nên ưu tiên thông lượng, độ trễ và tỷ lệ lỗi vì các giá trị này thống nhất về kết luận và có nguồn thống kê chi tiết.

**Nguồn nội bộ:** Chương 4, mục “Đánh giá lớp nghiệp vụ cốt lõi”; `statistics/system_performance/exports/summary_metrics.json`; `statistics/system_performance/exports/SUMMARY.md`.

---

## Slide 22 — Matching cho tín hiệu chủ đề hữu ích, nhưng chưa đủ để tự động phân công

### Component 1 — Fixture và proxy ground truth

**Nội dung nguồn đầy đủ:** Bộ đánh giá gồm 60 hồ sơ tác giả, 60 Phản biện viên, 2.565 bài, 60 truy vấn leave-one-out, từ vựng 14.096 chủ đề và trung bình 11,66 chủ đề mỗi bài. Với mỗi hồ sơ, nhóm giữ lại một bài làm truy vấn, loại bài đó khỏi hồ sơ rồi xếp hạng các hồ sơ còn lại. Tác giả gốc được xem là mục tiêu truy hồi vì hồ sơ của họ chia sẻ tín hiệu chủ đề với bài. Đây là proxy ground truth về tính nhất quán chủ đề, không phải gold assignment: tác giả của bài thực tế là một COI và không thể được phân công làm Phản biện viên cho chính bài đó.

### Component 2 — Kết quả xếp hạng Jaccard

**Nội dung nguồn đầy đủ:** Jaccard đạt Hit@1 bằng 0,250, tương ứng 15/60 truy vấn; Hit@5 bằng 0,550, tương ứng 33/60; Hit@10 bằng 0,650, tương ứng 39/60; MRR đạt 0,391736 và nDCG@10 đạt 0,44218. MRR cao gấp khoảng 5 lần phương pháp ngẫu nhiên có MRR 0,077998. Kết quả cho thấy điểm Jaccard truy hồi tín hiệu chủ đề đã được mã hóa tốt hơn sắp xếp ngẫu nhiên trong fixture.

### Component 3 — So sánh với `overlap_count`

**Nội dung nguồn đầy đủ:** Phương pháp đếm số chủ đề chung đạt Hit@1 0,233, Hit@5 0,550, Hit@10 0,733, MRR 0,391 và nDCG@10 0,463. Phương pháp này gần Jaccard ở MRR và tốt hơn ở Hit@10 cùng nDCG@10. Kết quả cho thấy phép chuẩn hóa theo hợp của Jaccard có thể làm giảm điểm của hồ sơ có tập chủ đề rộng; trên 60 truy vấn, chưa có bằng chứng một phương pháp chiếm ưu thế ổn định ở mọi chỉ số.

### Component 4 — Kết quả phân công Greedy

**Nội dung nguồn đầy đủ:** Greedy đạt độ phủ đủ hai Phản biện viên cho 65,9259% số bài. Điểm Jaccard trung bình của các cặp được gán đạt 0,010748, giá trị nhỏ nhất bằng 0. Độ lệch chuẩn tải là 9,315623 và hệ số Gini tải là 0,048581. Có 23,2749% số bài cần lượt dự phòng. Bộ thử không ghi nhận vi phạm COI theo conflict map đã cung cấp.

### Component 5 — So sánh với gán tuần tự và ngẫu nhiên

**Nội dung nguồn đầy đủ:** Gán tuần tự và ngẫu nhiên đạt độ phủ 100% nhưng điểm Jaccard trung bình chỉ khoảng 0,003769 và 0,003731, thấp hơn Greedy khoảng 2,75–2,88 lần. Hai phương pháp cơ sở cân bằng tải hơn nhưng không ưu tiên tín hiệu chủ đề. So sánh cho thấy Greedy đánh đổi độ phủ và độ đồng đều để tăng điểm phù hợp nội tại; đây không phải bằng chứng Greedy tạo phương án học thuật tốt hơn trong hội nghị thực tế.

### Component 6 — Chi phí microbenchmark

**Nội dung nguồn đầy đủ:** Thời gian matching tăng từ 131,32 micro-giây ở quy mô nhỏ lên 6,1141 ms ở quy mô trung bình và 56,0667 ms ở quy mô lớn. Bộ nhớ trung bình tăng từ 82.432 byte lên 24.241.480 byte mỗi thao tác; số lần cấp phát tăng từ 31 lên 55. Các giá trị đo trực tiếp mã thuật toán, không gồm HTTP, cơ sở dữ liệu hoặc mạng.

### Component 7 — COI trong bộ đánh giá

**Nội dung nguồn đầy đủ:** Cả Greedy, gán tuần tự và ngẫu nhiên đều nhận cùng conflict map và ghi nhận 0 vi phạm trong fixture. Kết quả chỉ xác nhận việc các phương pháp tôn trọng ràng buộc được cung cấp. Nó không đo độ chính xác hoặc độ phủ của cơ chế phát hiện COI nhiều tầng.

### Component 8 — Giới hạn quyết định

**Nội dung nguồn đầy đủ:** Nhãn tác giả gốc chỉ là tín hiệu gián tiếp, Jaccard dùng khớp từ vựng và có thể bỏ lỡ từ đồng nghĩa, fixture là dữ liệu tổng hợp, và chưa có phương án do Chủ tọa xác nhận. Độ phủ 65,9% cũng cho thấy phương án có thể để lại nhiều bài chưa đủ người hoặc cần lượt dự phòng có điểm 0. Vì vậy, kết quả chỉ hỗ trợ sử dụng thuật toán để tạo ứng viên có căn cứ.

### Kết luận đầy đủ của slide

Jaccard truy hồi tín hiệu chủ đề tốt hơn ngẫu nhiên, còn Greedy tạo các cặp có điểm trung bình cao hơn các phương pháp cơ sở nhưng đánh đổi độ phủ và tải. Bằng chứng cho thấy thuật toán hữu ích để chuẩn bị danh sách đề xuất và làm rõ ràng buộc; nó chưa đủ để tự động phân công hoặc khẳng định mức phù hợp chuyên môn trong hội nghị thật.

**Nguồn nội bộ:** Chương 4, mục “Đánh giá lớp thuật toán có thể kiểm chứng”; `statistics/deterministic_workflow/exports/summary_metrics.json`; `statistics/system_performance/exports/summary_metrics.json`.

---

## Slide 23 — Autofill có bằng chứng trực tiếp mạnh hơn, còn Gating giữ đúng ranh giới hỗ trợ

### Component 1 — Submission Autofill: chất lượng tiêu đề

**Nội dung nguồn đầy đủ:** Trên 1.127 bài, F1 theo token của tiêu đề đạt 98,20%. Tiêu đề thường là trường ngắn, có cấu trúc rõ và xuất hiện nổi bật trong bản thảo, nên mức khớp cao hơn các trường phức tạp. Kết quả trực tiếp xác nhận khả năng trích xuất tiêu đề trên tập đã chọn, không bảo đảm cùng mức chất lượng trên định dạng hoặc ngôn ngữ khác.

### Component 2 — Submission Autofill: từ khóa, tác giả và trường bắt buộc

**Nội dung nguồn đầy đủ:** F1 từ khóa đạt 92,77%; F1 tác giả đạt 83,49%; tỷ lệ hoàn tất trường bắt buộc đạt 86,93%. Chênh lệch giữa các trường cho thấy cấu trúc danh sách tác giả và thông tin phức tạp khó trích xuất hơn tiêu đề. Giá trị thấp nhất bằng 0 ở một số trường cho thấy có trường hợp thất bại hoàn toàn. Do đó, đầu ra phải được áp dụng vào biểu mẫu nháp và Tác giả phải kiểm tra trước khi gửi.

### Component 3 — Track Recommendation trong Autofill

**Nội dung nguồn đầy đủ:** Luồng nhận nội dung bài cùng danh sách chuyên đề hợp lệ của hội nghị và chỉ được trả đề xuất thuộc danh sách đó. Bộ thử gồm 48 trường hợp; luồng hoàn tất 48/48, không tạo chuyên đề ngoài danh sách và có độ trễ trung bình 18,19 giây. Kết quả xác nhận hợp đồng đầu ra và khả năng hoàn tất. Trường `human_label` chưa có nhãn chuyên gia, nên không được suy ra Top-1 hoặc Top-3 accuracy.

### Component 4 — Submission Gating: nhánh luật

**Nội dung nguồn đầy đủ:** Nhánh luật cố định đối chiếu tệp và siêu dữ liệu với điều kiện nộp bài có kết quả kỳ vọng. Bộ thử hoàn tất 8/8 trường hợp, đạt 100% về phán quyết và mã luật, không ghi nhận trường hợp chặn sai. Độ trễ trung bình 0,08 giây, trung vị 0,09 giây và cao nhất 0,14 giây. Kết quả trực tiếp hỗ trợ việc chạy nhánh này đồng bộ trước thao tác gửi.

### Component 5 — Submission Gating: nhánh cảnh báo nội dung

**Nội dung nguồn đầy đủ:** Nhánh LLM đọc nội dung để tạo cảnh báo không chặn. Bộ thử hoàn tất 24/24 trường hợp, tạo 26 cảnh báo và không ghi nhận trường hợp biến cảnh báo nội dung thành quyết định chặn tự động. Độ trễ trung bình 11,83 giây, trung vị 11,47 giây và cao nhất 19,64 giây. Kết quả xác nhận ranh giới đầu ra và hợp đồng xử lý; bộ thử chưa có nhãn chuyên gia để đo độ chính xác, tính hữu ích hoặc khả năng hỗ trợ chỉnh sửa của từng cảnh báo.

### Component 6 — Sự khác nhau giữa lỗi và cảnh báo

**Nội dung nguồn đầy đủ:** Lỗi theo quy tắc dựa trên điều kiện có thể kiểm tra trực tiếp và có thể ngăn thao tác khi không hợp lệ. Cảnh báo nội dung dựa trên diễn giải xác suất và chỉ cung cấp thông tin để Tác giả cân nhắc. Việc trình bày hai tuyến riêng giúp người dùng hiểu điều nào bắt buộc phải khắc phục và điều nào cần đọc lại, đồng thời ngăn AI tự từ chối bài về mặt học thuật.

### Component 7 — Giới hạn

**Nội dung nguồn đầy đủ:** Tập bài chủ yếu bằng tiếng Anh từ OpenReview; một số trường Autofill thất bại hoàn toàn; Track Recommendation thiếu nhãn chuyên gia; cảnh báo nội dung chưa được chấm về tính đúng hoặc mức hữu ích. Vì vậy, bằng chứng mạnh nhất nằm ở siêu dữ liệu có tham chiếu và nhánh luật có kết quả kỳ vọng, không nằm ở mọi nội dung do AI tạo.

### Kết luận đầy đủ của slide

Submission Autofill có bằng chứng trực tiếp về nhiều trường siêu dữ liệu và nên được dùng để tạo bản nháp có thể sửa. Submission Gating chứng minh nhánh luật hoạt động đúng trên bộ thử và nhánh AI giữ cảnh báo ở chế độ không chặn. Kết quả ủng hộ cách tách quy tắc xác định khỏi diễn giải nội dung, đồng thời vẫn yêu cầu Tác giả kiểm tra mọi đầu ra trước khi gửi.

**Nguồn nội bộ:** Chương 4, mục “Submission Autofill và Submission Gating”; `statistics/ai_workflow_benchmarks/exports/FIGURE_INDEX.md`; `statistics/ai_workflow_benchmarks/exports/resource_usage_metrics.json`.

---

## Slide 24 — Reviewer Initial Analysis bám nguồn tốt ở trích dẫn nhưng yếu hơn ở phần diễn giải

### Component 1 — Mục tiêu và đầu ra của luồng

**Nội dung nguồn đầy đủ:** Reviewer Initial Analysis tạo bản định hướng trước khi Phản biện viên viết nhận xét. Đầu ra có thể gồm trích dẫn theo phần, tóm tắt và các điểm cần chú ý. Chức năng được thiết kế để giúp người dùng tổ chức việc đọc, không thay thế toàn văn, không ghi vào biểu mẫu phản biện và không tạo điểm số.

### Component 2 — Tỷ lệ trích dẫn bám nguồn 96,22%

**Nội dung nguồn đầy đủ:** Theo TCA, 96,22% phần trích dẫn được phân loại là bám nguồn. Tỷ lệ nội dung bị phân loại không bám nguồn là 3,78%. Kết quả cho thấy việc chỉ ra đoạn nguồn là phần mạnh hơn của luồng trong phép chấm tự động. Tuy nhiên, TCA chưa được hiệu chuẩn bằng nhãn chuyên gia nên tỷ lệ này vẫn là chỉ số gián tiếp về quan hệ với nguồn.

### Component 3 — Truthfulness của điểm cần lưu ý 69,86%

**Nội dung nguồn đầy đủ:** Các điểm cần lưu ý có Truthfulness 69,86%, thấp hơn rõ so với phần trích dẫn. Chênh lệch phản ánh rủi ro tăng lên khi hệ thống chuyển từ trích dẫn trực tiếp sang diễn giải hoặc chọn điểm cần chú ý. Phản biện viên phải kiểm tra từng nhận định trên bài gốc và không được xem bản phân tích như kết luận chuyên môn đã được xác nhận.

### Component 4 — Coverage 4,49%

**Nội dung nguồn đầy đủ:** Coverage đo mức trùng khớp với nội dung tham chiếu do con người tạo và đạt 4,49%. Giá trị thấp không tự động có nghĩa đầu ra kém hữu ích; nó cho biết nội dung hệ thống ít trùng trực tiếp với tham chiếu theo cách đo hiện tại. Vì tham chiếu không phải danh sách đầy đủ mọi nhận định hợp lệ, Coverage chỉ mô tả quan hệ với tham chiếu.

### Component 5 — Additionality 92,23%

**Nội dung nguồn đầy đủ:** Additionality đạt 92,23%, tức nhiều mệnh đề được phép chấm xem là có căn cứ nhưng không trùng trực tiếp với tham chiếu. Chỉ số này không đo độ mới hay giá trị học thuật; nó không cho biết thông tin bổ sung có giúp Phản biện viên đọc nhanh hơn hoặc đưa ra nhận định tốt hơn hay không.

### Component 6 — Độ trễ và cách vận hành

**Nội dung nguồn đầy đủ:** Độ trễ trung bình đạt 39,18 giây, trung vị 37,53 giây và cao nhất 126,36 giây; token trung bình khoảng 11.575 trên mỗi bài. Các trường hợp vượt 100 giây khiến luồng phù hợp hơn với chạy nền hoặc chạy trước, thay vì buộc Phản biện viên chờ đồng bộ khi mở bài.

### Component 7 — Giới hạn đánh giá

**Nội dung nguồn đầy đủ:** TCA chưa được hiệu chuẩn bằng nhãn chuyên gia; nghiên cứu chưa đo tác động đến thời gian đọc, mức độ phụ thuộc, chất lượng phản biện hoặc phán đoán chuyên môn. Chính sách sử dụng AI cũng khác nhau giữa các hội nghị. Vì vậy, luồng chỉ nên được bật khi chính sách và điều kiện xử lý dữ liệu cho phép.

### Kết luận đầy đủ của slide

Reviewer Initial Analysis thể hiện mức bám nguồn cao ở phần trích dẫn, nhưng độ tin cậy giảm ở phần diễn giải và điểm cần lưu ý. Kết quả phù hợp với vai trò định hướng đọc có căn cứ, không phù hợp với việc thay thế việc đọc bài. Phản biện viên vẫn phải kiểm tra nguồn và tự hình thành nhận định chuyên môn.

**Nguồn nội bộ:** Chương 4, mục “Reviewer Initial Analysis”; `statistics/ai_workflow_benchmarks/exports/figures/fig09a_reviewer_annotation_grounding.png`; `statistics/ai_workflow_benchmarks/exports/resource_usage_metrics.json`.

---

## Slide 25 — Review Quality Auditor còn nhiều nhiễu nên chỉ phù hợp để gợi ý điểm cần kiểm tra

### Component 1 — Mục tiêu của luồng

**Nội dung nguồn đầy đủ:** Review Quality Auditor đọc bản nháp phản biện để chỉ ra vấn đề về mức độ đầy đủ, cụ thể hoặc nhất quán. Đầu ra là danh sách phát hiện để Phản biện viên xem xét trước khi nộp. Hệ thống không tự sửa bản phản biện và không có quyền ngăn người dùng gửi chỉ vì một phát hiện xác suất.

### Component 2 — Phân bố 3.658 lượt kiểm tra

**Nội dung nguồn đầy đủ:** Trên 1.127 bài, luồng tạo 3.658 lượt kiểm tra, gồm 1.913 lượt `block`, 1.650 lượt `warn` và 95 lượt `pass`. Các đơn vị ở đây là lượt kiểm tra, không phải số bài duy nhất. Một bài có thể tạo nhiều lượt hoặc nhiều trạng thái theo cách pipeline thực hiện.

### Component 3 — Ý nghĩa của nhãn trạng thái

**Nội dung nguồn đầy đủ:** `severity=blocking` mô tả mức nghiêm trọng của phát hiện; `status=block` làm nổi bật bản phản biện cần xem trên giao diện. `warn` biểu thị mức ưu tiên thấp hơn; `pass` không có phát hiện theo điều kiện hiện hành. Các nhãn chỉ điều khiển cách hiển thị và ưu tiên, không phải số lần hệ thống từ chối thao tác. Phản biện viên vẫn có quyền gửi sau khi xem xét.

### Component 4 — Truthfulness 58,28%

**Nội dung nguồn đầy đủ:** TCA ước lượng 58,28% phát hiện có quan hệ bám nguồn với bản phản biện. Tỷ lệ này cho thấy phần đáng kể đầu ra cần được kiểm tra lại. Nó không phải precision theo nhãn chuyên gia và không cho biết một phát hiện sai có mức ảnh hưởng như thế nào đến hành vi người dùng.

### Component 5 — Tỷ lệ hợp lệ 71,04%

**Nội dung nguồn đầy đủ:** Phép đánh giá ghi nhận 71,04% phát hiện đạt điều kiện hợp lệ theo tiêu chí của pipeline. Tính hợp lệ và mức bám nguồn là hai chiều khác nhau: một phát hiện có thể đúng cấu trúc hoặc phù hợp tiêu chí nhưng không được dữ liệu nguồn hỗ trợ đầy đủ.

### Component 6 — Tỷ lệ đồng thời bám nguồn và hợp lệ 46,99%

**Nội dung nguồn đầy đủ:** Chỉ 46,99% phát hiện đồng thời đạt cả hai điều kiện. Đây là chỉ số quan trọng nhất để giới hạn cách sử dụng: hơn một nửa số phát hiện không đạt đồng thời mức bám nguồn và tính hợp lệ theo phép chấm. Vì vậy, đầu ra chưa đủ tin cậy để chuyển thành điều kiện chặn cứng.

### Component 7 — Độ trễ và vận hành

**Nội dung nguồn đầy đủ:** Độ trễ trung bình đạt 15,55 giây, trung vị 14,63 giây và cao nhất 123,67 giây; token trung bình khoảng 7.874 trên mỗi lượt kiểm tra. Luồng nên chạy nền và hiển thị trạng thái, tránh chặn giao diện trong các trường hợp dài.

### Component 8 — Giới hạn và yêu cầu tiếp theo

**Nội dung nguồn đầy đủ:** Nghiên cứu chưa có nhãn chuyên gia để đo cảnh báo sai, chưa quan sát cách Phản biện viên phản ứng với cảnh báo và chưa đo ảnh hưởng đến chất lượng bản phản biện. Bước tiếp theo cần xây dựng tập phát hiện có nhãn, đo false positive/false negative và ghi nhận quyết định sửa, bỏ qua hoặc tiếp tục của người dùng.

### Kết luận đầy đủ của slide

Review Quality Auditor có thể giúp Phản biện viên nhận biết các điểm cần kiểm tra, nhưng tỷ lệ phát hiện vừa bám nguồn vừa hợp lệ chỉ đạt 46,99%. Bằng chứng hiện có chỉ ủng hộ cảnh báo có thể bỏ qua và cần người dùng xác nhận; nó không ủng hộ việc dùng các nhãn `block` như điều kiện chặn nộp phản biện.

**Nguồn nội bộ:** Chương 4, mục “Review Quality Auditor”; Chương 5, mục “Chuỗi bằng chứng cho các chức năng AI hỗ trợ”; `statistics/ai_workflow_benchmarks/exports/figures/fig09c_review_quality_auditor.png`.

---

## Slide 26 — Chair Decision Copilot tổng hợp khá bám nguồn nhưng không đo chất lượng quyết định

### Component 1 — Mục tiêu và dữ liệu đầu vào

**Nội dung nguồn đầy đủ:** Chair Decision Copilot nhận điểm số, bản phản biện, phản hồi của Tác giả, thay đổi sau rebuttal và nội dung thảo luận đã được backend tập hợp. Luồng tổ chức các nguồn thành phần đồng thuận, bất đồng, vấn đề còn mở và cơ sở bằng chứng. Nó không tạo khuyến nghị chấp nhận hoặc từ chối và không có quyền ghi quyết định.

### Component 2 — Truthfulness của cơ sở bằng chứng: 87,34%

**Nội dung nguồn đầy đủ:** Theo TCA, các mệnh đề trong phần cơ sở bằng chứng đạt Truthfulness 87,34%. Chỉ số ước lượng tỷ lệ mệnh đề được dữ liệu nguồn hỗ trợ. Giá trị này cho thấy phần lớn mệnh đề có quan hệ với nguồn theo bộ chấm, nhưng không bảo đảm mọi mệnh đề đúng về chuyên môn hoặc đủ bối cảnh để Chủ tọa quyết định.

### Component 3 — Truthfulness của bản tổng hợp bất đồng: 87,11%

**Nội dung nguồn đầy đủ:** Các mệnh đề tổng hợp điểm bất đồng đạt Truthfulness 87,11%. Việc tổng hợp bất đồng là tác vụ khó hơn liệt kê điểm số vì phải nhận biết quan hệ giữa nhiều nhận xét và rebuttal. Tỷ lệ cho thấy mức bám nguồn tương đối cao trong phép chấm tự động, nhưng phần còn lại vẫn có nguy cơ diễn giải sai hoặc bỏ sót mối quan hệ quan trọng.

### Component 4 — Coverage và Additionality

**Nội dung nguồn đầy đủ:** Coverage của cơ sở bằng chứng đạt 5,27%; Coverage của bản tổng hợp bất đồng đạt 13,82%. Additionality của cơ sở bằng chứng đạt 91,63%. Các chỉ số này mô tả mức trùng với tham chiếu và tỷ lệ mệnh đề có căn cứ nhưng không trùng trực tiếp; chúng không đo độ đầy đủ, tính mới hoặc mức hữu ích đối với Chủ tọa.

### Component 5 — Tỷ lệ rủi ro cao 1,28%

**Nội dung nguồn đầy đủ:** Tỷ lệ rủi ro cao đạt 1,28%, tương đương khoảng 14 bài trong tập chấm. Dù tỷ lệ nhỏ, các trường hợp này xuất hiện ở vị trí gần quyết định học thuật nên không thể bị bỏ qua bằng cách nhìn điểm trung bình. Thiết kế phải cho phép Chủ tọa quay về dữ liệu gốc và nhận biết các phần có mức tin cậy thấp.

### Component 6 — Độ trễ và cách vận hành

**Nội dung nguồn đầy đủ:** Độ trễ trung bình đạt 21,68 giây, trung vị 20,59 giây và cao nhất 116,74 giây; token trung bình khoảng 6.242 trên mỗi bài. Các trường hợp vượt 100 giây cho thấy bản tổng hợp phù hợp hơn với chạy nền hoặc chuẩn bị trước khi Chủ tọa mở trang quyết định.

### Component 7 — Điều chưa được đo

**Nội dung nguồn đầy đủ:** Nghiên cứu chưa đo độ đầy đủ và hữu ích theo đánh giá của Chủ tọa, thời gian đọc, độ chính xác quyết định, thay đổi quyết định trước và sau hỗ trợ hoặc thiên lệch tự động hóa. TCA và NLI chưa được hiệu chuẩn bằng nhãn chuyên gia. UAT Chủ tọa dùng câu hỏi gộp và không đánh giá riêng Chair Decision Copilot.

### Component 8 — Quyền quyết định

**Nội dung nguồn đầy đủ:** Chủ tọa phải đối chiếu bản tổng hợp với bản phản biện, rebuttal và thảo luận; sau đó tự nhập và xác nhận quyết định. Backend kiểm tra quyền và trạng thái. Bản tổng hợp được xem là một lớp tổ chức thông tin, không phải kết quả học thuật chính thức.

### Kết luận đầy đủ của slide

Chair Decision Copilot đạt mức bám nguồn tương đối cao trong phép chấm TCA, nhưng phép đo chỉ đánh giá quan hệ giữa mệnh đề và dữ liệu nguồn. Nó không đo chất lượng hoặc độ đúng của quyết định chấp nhận và từ chối. Vì tác vụ nằm sát bước quyết định, Chủ tọa phải kiểm tra nguồn, đặc biệt ở các trường hợp rủi ro cao, rồi tự chịu trách nhiệm về kết quả cuối cùng.

**Nguồn nội bộ:** Chương 4, mục “Chair Decision Copilot”; `statistics/ai_workflow_benchmarks/exports/figures/fig09d_chair_evidence_basis.png`; `statistics/ai_workflow_benchmarks/exports/resource_usage_metrics.json`.

---

## Slide 27 — Chatbot giữ ranh giới quyền trong bộ thử, nhưng độ tin cậy công cụ còn hạn chế

### Component 1 — Phạm vi đánh giá

**Nội dung nguồn đầy đủ:** Chatbot Agent được đánh giá như trợ lý truy vấn dữ liệu ConferenceSpace theo quyền của người dùng, không phải trợ lý nghiên cứu hoặc hệ thống trò chuyện tự do. Bộ thử gồm tám nhóm kịch bản, mỗi nhóm có năm biến thể diễn đạt, tổng cộng 40 hội thoại. Các kịch bản bao phủ thông tin hội nghị công khai, dữ liệu bài của Tác giả, phân công của Phản biện viên, tổng quan của Chủ tọa, ranh giới quyền và yêu cầu nằm ngoài phạm vi.

### Component 2 — Kết quả hội thoại 25/12/3

**Nội dung nguồn đầy đủ:** Báo cáo rà soát thủ công hồi cứu phân loại 25 hội thoại đạt, 12 đạt một phần và 3 không đạt. Chatbot hoàn tất luồng phản hồi trong cả 40 hội thoại, nhưng “hoàn tất luồng” chỉ có nghĩa phiên xử lý tạo được câu trả lời; nó không đồng nghĩa câu trả lời đúng hoàn toàn. Tổng cộng 37/40 hội thoại được đánh giá đạt hoặc đạt một phần.

### Component 3 — Kết quả gọi công cụ 97/128

**Nội dung nguồn đầy đủ:** Trong 128 lượt gọi công cụ, 97 lượt thành công và 31 lượt thất bại; tỷ lệ thành công đạt 75,78%. Tỷ lệ này đo khả năng gọi công cụ, không phải tỷ lệ thành công của hội thoại. Một hội thoại có thể có nhiều lượt gọi, và Agent có thể vẫn tạo câu trả lời sau khi một lượt thất bại, dù chất lượng hoặc độ đầy đủ bị ảnh hưởng.

### Component 4 — Ranh giới quyền

**Nội dung nguồn đầy đủ:** Thử nghiệm không ghi nhận rò rỉ dữ liệu riêng tư trong các kịch bản quyền đã chạy. Kết quả cho thấy đường công cụ–backend giữ được phạm vi truy cập trong bộ thử. Tuy nhiên, 40 hội thoại không tương đương kiểm toán bảo mật, kiểm thử đối kháng hoặc chứng minh hệ thống không thể rò rỉ ở tình huống khác.

### Component 5 — Thời gian đến token đầu tiên

**Nội dung nguồn đầy đủ:** Thời gian đến token đầu tiên trung bình đạt 2,36 giây. Người dùng nhận được tín hiệu sớm rằng hệ thống đã bắt đầu phản hồi. Chỉ số này không cho biết thời điểm nội dung trả lời hoàn chỉnh xuất hiện, vì Agent còn phải gọi công cụ và tổng hợp dữ liệu.

### Component 6 — Thời gian đến câu trả lời hoàn chỉnh và tổng thời lượng

**Nội dung nguồn đầy đủ:** Token đầu tiên của câu trả lời hoàn chỉnh xuất hiện sau trung bình 23,02 giây. Thời gian truyền nội dung trung bình là 24,17 giây và tổng thời lượng trung bình đạt 26,53 giây. Độ trễ cao nhất được ghi cho nhóm kịch bản chậm nhất là 57,89 giây, không nhất thiết là giá trị cao nhất của một hội thoại riêng lẻ. Kết quả cho thấy streaming tạo cảm giác phản hồi sớm, nhưng phần nội dung có giá trị vẫn phụ thuộc chuỗi gọi công cụ.

### Component 7 — Trường hợp vượt phạm vi và lộ lỗi

**Nội dung nguồn đầy đủ:** Một biến thể yêu cầu nghiên cứu ngoài nền tảng vẫn tạo báo cáo thị trường, cho thấy cơ chế từ chối phạm vi chưa ổn định. Một số câu trả lời trình bày lỗi truy vấn thay vì giải thích ranh giới quyền hoặc hướng xử lý. Đây là hai nhóm lỗi khác nhau: lỗi kiểm soát phạm vi và lỗi trải nghiệm khi công cụ thất bại.

### Component 8 — Giới hạn của phép chấm

**Nội dung nguồn đầy đủ:** Các trường chấm theo từng lượt chưa được điền đầy đủ; tư liệu chưa ghi đầy đủ người chấm và ngày chấm. Vì vậy, phân bố 25/12/3 là bằng chứng mô tả hồi cứu, chưa đạt mức đánh giá mù có khả năng tái lập độc lập. Bộ thử cũng chưa bao phủ tấn công prompt, chuỗi công cụ dài hoặc tải đồng thời.

### Component 9 — Hàm ý vận hành

**Nội dung nguồn đầy đủ:** Chatbot cần phản hồi từng phần, hiển thị trạng thái tra cứu và phân biệt rõ đang chờ công cụ, đã nhận dữ liệu hay gặp lỗi. Mỗi công cụ cần cấu trúc đầu vào, quyền truy cập và cách xử lý lỗi rõ. Nhật ký phải lưu chuỗi gọi, nguồn dữ liệu và lý do câu trả lời không đầy đủ để giảm 31 lượt thất bại và hỗ trợ điều tra.

### Kết luận đầy đủ của slide

Chatbot giữ được ranh giới quyền trong các kịch bản đã thử và tạo phản hồi trong cả 40 hội thoại, nhưng chỉ 75,78% lượt gọi công cụ thành công và vẫn có lỗi vượt phạm vi cùng lỗi hiển thị truy vấn. Kết quả hỗ trợ tiếp tục phát triển Agent như trợ lý theo quyền có streaming và trạng thái rõ ràng; chưa đủ để tuyên bố độ tin cậy vận hành hoặc an toàn bảo mật toàn diện.

**Nguồn nội bộ:** Chương 4, mục “Chatbot Agent”; `statistics/ai_workflow_benchmarks/benchmark_output/chatbot_agent/chatbot_run_1783406671_1783411092/run_summary.json`; `statistics/ai_workflow_benchmarks/exports/resource_usage_metrics.json`; `statistics/ai_workflow_benchmarks/exports/FIGURE_INDEX.md`.

---

## Slide 28 — Độ trễ yêu cầu cách vận hành khác nhau cho từng luồng AI

### Component 1 — Cách đọc biểu đồ độ trễ

**Nội dung nguồn đầy đủ:** Biểu đồ trình bày độ trễ trung bình, trung vị và cao nhất của từng luồng, nhưng đơn vị công việc khác nhau: Autofill, Reviewer Initial Analysis và Chair Decision Copilot tính theo bài; Review Quality Auditor tính theo lượt kiểm tra; Chatbot tính theo hội thoại. Vì vậy, các giá trị cho biết trải nghiệm chờ và rủi ro đuôi dài của từng luồng, không nên dùng để xếp hạng chi phí giữa các tác vụ khác bản chất.

### Component 2 — Gating theo luật: chạy đồng bộ

**Nội dung nguồn đầy đủ:** Nhánh luật có độ trễ trung bình 0,08 giây, trung vị 0,09 giây và cao nhất 0,14 giây. Kết quả nhanh, xác định và có thể chặn lỗi có căn cứ, nên phù hợp chạy đồng bộ ngay trước thao tác gửi. Người dùng có thể nhận kết quả mà không tạo thời gian chờ đáng kể.

### Component 3 — Cảnh báo nội dung Gating: song song, không chặn

**Nội dung nguồn đầy đủ:** Nhánh LLM Gating có độ trễ trung bình 11,83 giây, trung vị 11,47 giây và cao nhất 19,64 giây. Vì đầu ra chỉ là cảnh báo nội dung và chưa có nhãn chuyên gia về độ chính xác, luồng phù hợp chạy song song không chặn. Kết quả đến muộn vẫn có thể được Tác giả xem trước khi xác nhận, nhưng không nên khóa thao tác chỉ vì dịch vụ chưa trả lời.

### Component 4 — Autofill: tương tác có giới hạn chờ

**Nội dung nguồn đầy đủ:** Trích xuất metadata có độ trễ trung bình 10,64 giây, trung vị 9,32 giây và cao nhất 102,20 giây; Track Recommendation trung bình 18,19 giây, trung vị 17,54 giây và cao nhất 37,42 giây. Autofill xuất hiện trong biểu mẫu tương tác nên cần hiển thị trạng thái, đặt giới hạn chờ và cho phép Tác giả tiếp tục nhập thủ công khi kết quả chậm hoặc lỗi.

### Component 5 — Reviewer Initial Analysis: chạy nền hoặc chạy trước

**Nội dung nguồn đầy đủ:** Độ trễ trung bình 39,18 giây, trung vị 37,53 giây và cao nhất 126,36 giây. Vì luồng không bắt buộc để mở bài và có trường hợp vượt 100 giây, hệ thống nên chuẩn bị trước khi Phản biện viên vào không gian đọc hoặc chạy nền với trạng thái rõ. Phản biện viên phải luôn có thể đọc bài mà không chờ luồng này.

### Component 6 — Review Quality Auditor: chạy nền và hiển thị trạng thái

**Nội dung nguồn đầy đủ:** Độ trễ trung bình 15,55 giây, trung vị 14,63 giây và cao nhất 123,67 giây. Hệ thống có thể kích hoạt sau khi bản nháp đạt điều kiện tối thiểu, chạy nền và cập nhật phát hiện khi hoàn tất. Phản biện viên cần biết kết quả đang xử lý, đã lỗi hay đã sẵn sàng; thao tác gửi không được phụ thuộc cứng vào thời gian phản hồi của AI.

### Component 7 — Chair Decision Copilot: chạy nền hoặc chuẩn bị trước

**Nội dung nguồn đầy đủ:** Độ trễ trung bình 21,68 giây, trung vị 20,59 giây và cao nhất 116,74 giây. Bản tổng hợp có thể được tạo trước khi Chủ tọa mở trang quyết định hoặc chạy nền khi dữ liệu nguồn thay đổi. Mã nhận diện đầu vào cần đánh dấu kết quả không còn hiệu lực nếu phản biện, rebuttal hoặc thảo luận đã được cập nhật.

### Component 8 — Chatbot Agent: streaming và trạng thái tra cứu

**Nội dung nguồn đầy đủ:** Chatbot có tổng thời lượng trung bình 26,53 giây nhưng phát token đầu tiên sau 2,36 giây; câu trả lời hoàn chỉnh bắt đầu sau 23,02 giây. Vì trải nghiệm phụ thuộc nhiều lượt gọi công cụ, giao diện cần phản hồi từng phần và hiển thị trạng thái tra cứu. Streaming không được dùng để che việc câu trả lời có giá trị đến chậm hoặc công cụ đã thất bại.

### Component 9 — Token và giới hạn so sánh chi phí

**Nội dung nguồn đầy đủ:** Token trung bình được ghi theo mẫu số khác nhau: khoảng 4.094 cho Autofill metadata, 11.575 cho Reviewer Initial Analysis, 7.874 cho Review Quality Auditor, 6.242 cho Chair Decision Copilot và 360,5 cho mỗi hội thoại Chatbot. Các số này không thể xếp hạng chi phí trực tiếp vì mỗi đơn vị chứa lượng dữ liệu và số giai đoạn khác nhau.

### Component 10 — Giới hạn của khuyến nghị

**Nội dung nguồn đầy đủ:** Cách tổ chức đồng bộ, không chặn, xử lý nền hoặc streaming là khuyến nghị suy ra từ độ trễ quan sát và tính chất đầu ra. Nghiên cứu chưa so sánh thực nghiệm các kiến trúc hàng đợi, chưa kiểm thử toàn luồng khi AI timeout hoặc ngừng hoạt động và chưa đo ảnh hưởng đến tỷ lệ hoàn tất nhiệm vụ.

### Kết luận đầy đủ của slide

Không có một cơ chế vận hành phù hợp cho mọi luồng AI. Quy tắc nhanh và xác định có thể chạy đồng bộ; cảnh báo nội dung nên không chặn; tác vụ đọc và tổng hợp dài cần chạy nền hoặc chuẩn bị trước; Chatbot cần streaming và trạng thái công cụ. Đây là khuyến nghị thiết kế dựa trên độ trễ, chưa phải bằng chứng rằng phương án triển khai đã tối ưu.

**Nguồn nội bộ:** Chương 4, mục “Tính khả thi vận hành”; `statistics/ai_workflow_benchmarks/exports/resource_usage_metrics.json`; các hình `fig11`, `fig12`, `fig13`, `fig14`.

---

## Slide 29 — UAT cho tín hiệu tích cực, nhưng mẫu lệch mạnh về Tác giả

### Component 1 — Cấu trúc mẫu

**Nội dung nguồn đầy đủ:** UAT ghi nhận 91 phản hồi dùng cho phân tích, gồm 76 Tác giả, 7 Phản biện viên và 8 Chủ tọa. Tác giả chiếm 83,5% mẫu. Đây là mẫu thuận tiện; quy mô nhỏ của hai nhóm chuyên môn và mức mất cân bằng cao không cho phép suy rộng thống kê hoặc so sánh chắc chắn giữa vai trò.

### Component 2 — Tác giả: hài lòng và tính năng nổi bật

**Nội dung nguồn đầy đủ:** Nhóm Tác giả có điểm hài lòng tổng thể 3,89/5; 67/76 phản hồi được tổng hợp là tích cực. Có 47/76 người chọn Submission Autofill là tính năng hữu ích nhất và 69/76 cảm nhận AI giúp giảm thao tác hoặc thời gian. Khảo sát đo cảm nhận, không đo trực tiếp số thao tác hoặc số phút tiết kiệm.

### Component 3 — Phản biện viên: tín hiệu tích cực trên mẫu nhỏ

**Nội dung nguồn đầy đủ:** Bảy Phản biện viên có điểm hài lòng tổng thể 4,29/5; 6/7 phản hồi tích cực với nhóm chức năng hỗ trợ đọc và phản biện. Câu hỏi gộp nhiều thành phần, nên kết quả không thể được quy riêng cho Reviewer Initial Analysis hoặc Review Quality Auditor. Với cỡ mẫu 7, một phản hồi có ảnh hưởng lớn đến tỷ lệ.

### Component 4 — Chủ tọa: điểm số và giới hạn truy vết

**Nội dung nguồn đầy đủ:** Tám phản hồi Chủ tọa có điểm hài lòng tổng thể 4,38/5; 7/8 phản hồi tích cực; 8/8 tích cực về theo dõi tiến độ và 7/8 tích cực trong câu hỏi gộp về nhóm công cụ AI. Tuy nhiên, số liệu này chưa thể tái lập độc lập từ tệp thô hiện có. Bản ghi thô chỉ có sáu bản ghi Chủ tọa, năm bản ghi thiếu phần đánh giá chính; vì vậy, thống kê mẫu số tám được giữ theo báo cáo tổng hợp nhưng là số liệu thứ cấp.

### Component 5 — Mức sẵn sàng giới thiệu: 73/91

**Nội dung nguồn đầy đủ:** Có 73/91 người cho biết sẵn sàng giới thiệu nền tảng. Tỷ lệ này chịu ảnh hưởng lớn từ nhóm Tác giả do họ chiếm phần lớn mẫu. Chỉ số phản ánh mức chấp nhận chung ban đầu, không thể dùng để kết luận riêng về trải nghiệm của Phản biện viên hoặc Chủ tọa.

### Component 6 — Quyền kiểm soát đầu ra AI

**Nội dung nguồn đầy đủ:** Phản hồi UAT tiếp tục nhấn mạnh nhu cầu giữ quyền kiểm tra, sửa và bỏ qua đầu ra AI. Tín hiệu này phù hợp với thiết kế Autofill dạng bản nháp, Gating phân tách lỗi và cảnh báo, Auditor không chặn và Copilot không quyết định. Tuy nhiên, UAT chưa đo liệu người dùng có thực sự kiểm tra đúng cách hay có xu hướng phụ thuộc vào gợi ý.

### Component 7 — Giới hạn phương pháp

**Nội dung nguồn đầy đủ:** Mẫu thuận tiện, mất cân bằng và thiếu mã ẩn danh duy nhất cho phản hồi Chủ tọa làm giảm khả năng kiểm chứng. Khảo sát chưa xác minh tư cách vai trò tách biệt với câu trả lời, chưa chuẩn hóa nhiệm vụ, chưa có đối chứng không dùng AI và chưa đo thời gian thao tác hoặc chất lượng quyết định. Kết quả chỉ là bằng chứng cảm nhận ban đầu.

### Kết luận đầy đủ của slide

UAT cho tín hiệu tích cực ở cả ba vai trò và cho thấy người dùng đánh giá cao việc giảm thao tác, theo dõi tiến độ và nhận hỗ trợ có thể kiểm soát. Tuy nhiên, Tác giả chiếm 83,5% mẫu, hai nhóm chuyên môn rất nhỏ và dữ liệu Chủ tọa chưa truy vết đầy đủ. Vì vậy, kết quả chỉ mô tả cảm nhận của mẫu tham gia, không chứng minh hiệu quả hoặc khả năng chấp nhận trên cộng đồng rộng hơn.

**Nguồn nội bộ:** Chương 4, mục “Khảo sát người dùng”; Chương 5, mục “Giới hạn của dữ liệu và phương pháp đánh giá”.

---

## Slide 30 — Bằng chứng mạnh ở phạm vi hẹp; kết luận rộng vẫn cần kiểm chứng

### Component 1 — Mức 01: Bằng chứng trực tiếp

**Nội dung nguồn đầy đủ:** Bằng chứng trực tiếp xuất hiện khi phép đo đối chiếu đúng đầu ra cần kết luận trong điều kiện xác định. Nhóm này gồm hiệu năng của ba endpoint được chọn, chất lượng một số trường siêu dữ liệu của Submission Autofill và hành vi của nhánh luật Submission Gating. Ba endpoint đạt p95 dưới 120 ms và 0% lỗi trong tải 30 giây; Autofill đạt F1 tiêu đề 98,20%, từ khóa 92,77%, tác giả 83,49% và hoàn tất trường bắt buộc 86,93%; nhánh luật Gating xử lý đúng 8/8 trường hợp về phán quyết và mã luật.

Phạm vi vẫn hẹp: endpoint không đại diện toàn hệ thống; Autofill không bảo đảm mọi trường hoặc mọi định dạng; 8 trường hợp luật không đại diện mọi chính sách hội nghị.

### Component 2 — Mức 02: Bằng chứng gián tiếp

**Nội dung nguồn đầy đủ:** Reviewer matching dùng nhãn tác giả gốc và chỉ số nội tại làm proxy cho tín hiệu chủ đề; TCA/NLI ước lượng quan hệ giữa mệnh đề và bằng chứng. Jaccard đạt MRR 0,392 và Greedy đạt độ phủ 65,9%, nhưng không có gold assignment. Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot có các tỷ lệ Truthfulness hoặc hợp lệ, nhưng TCA chưa được hiệu chuẩn bằng chuyên gia. Các phép đo này giúp nhận biết xu hướng và trường hợp cần kiểm tra, không xác nhận chất lượng chuyên môn cuối cùng.

### Component 3 — Mức 03: Bằng chứng theo kịch bản hoặc mô tả

**Nội dung nguồn đầy đủ:** Chatbot được đánh giá trên 40 hội thoại với tám nhóm kịch bản; UAT ghi nhận 91 phản hồi cảm nhận. Kịch bản cho thấy Agent giữ ranh giới quyền trong bộ thử và tạo 25 lượt đạt, 12 đạt một phần, 3 không đạt; UAT cho thấy mức hài lòng và sẵn sàng giới thiệu tích cực. Tuy nhiên, kịch bản không thay thế kiểm toán bảo mật và mẫu UAT không đại diện cho cộng đồng rộng.

### Component 4 — Mức 04: Chưa xác nhận

**Nội dung nguồn đầy đủ:** Báo cáo chưa xác nhận chất lượng của cơ chế COI đa tầng vì thiếu tập cặp có nhãn và chưa đo riêng lớp Neo4j. Báo cáo chưa đo độ đúng của quyết định học thuật, mức độ người dùng phụ thuộc vào AI, thiên lệch tự động hóa, khả năng vận hành dài hạn, rollback, khôi phục hoặc mức sẵn sàng triển khai trong hội nghị thực tế. Những nội dung này phải được giữ ở trạng thái câu hỏi mở, không được suy ra từ điểm trung bình của các luồng khác.

### Component 5 — Cách đọc thang bằng chứng

**Nội dung nguồn đầy đủ:** Thang không xếp hạng tầm quan trọng của các chức năng. Nó xếp loại mức trực tiếp của quan hệ giữa phép đo và kết luận. Một chỉ số cao ở mức gián tiếp vẫn không mạnh hơn một phép đối chiếu trực tiếp cho cùng câu hỏi; ngược lại, bằng chứng trực tiếp ở một fixture nhỏ cũng không cho phép khái quát ra mọi điều kiện.

### Component 6 — Kết luận rộng nhất được phép

**Nội dung nguồn đầy đủ:** Toàn bộ bằng chứng ủng hộ tính khả thi của việc xây dựng và đánh giá mô hình ba lớp trong phạm vi thử nghiệm. Đề tài đã triển khai vòng đời nghiệp vụ, thuật toán có căn cứ và sáu luồng AI có điểm kiểm soát. Bằng chứng không chứng minh mô hình tối ưu, ConferenceSpace vượt trội hơn sản phẩm khác, AI cải thiện chất lượng quyết định hoặc hệ thống đã sẵn sàng vận hành hội nghị thực tế.

### Kết luận đầy đủ của slide

Điểm mạnh của chuỗi đánh giá là phân biệt rõ mức bằng chứng. Các kết quả trực tiếp xác nhận một số endpoint, trường Autofill và luật Gating trong điều kiện thử; matching, TCA, Chatbot và UAT cung cấp căn cứ hẹp hơn; COI đa tầng, chất lượng quyết định và vận hành thực tế vẫn chưa được xác nhận. Kết luận bảo vệ được là tính khả thi và khả năng truy vết theo tác vụ, không phải tính tối ưu hoặc ưu thế sản phẩm.

**Nguồn nội bộ:** Chương 4, mục “Tổng hợp kết quả và giới hạn”; Chương 5, phần mở đầu và “Mức độ hoàn thành mục tiêu”.

---

## Slide 31 — Kết quả đạt được

### Component 1 — Kết quả 1: Nền tảng nghiệp vụ

**Nội dung nguồn đầy đủ:** Đề tài đã xây dựng các thành phần, giao diện và API cho vòng đời xét duyệt từ cấu hình hội nghị, khám phá hội nghị và nộp bài đến phân công, phản biện, rebuttal, thảo luận, quyết định và nộp camera-ready. Mười use case kết nối ba vai trò chính là Tác giả, Phản biện viên và Chủ tọa/Đồng chủ tọa. Trạng thái và quyền được duy trì xuyên suốt; backend từ chối thao tác không phù hợp với vai trò, tài nguyên, trạng thái hoặc hạn chót.

Phạm vi sau quyết định mới bao gồm camera-ready và truy xuất tệp; xuất bản kỷ yếu, đăng ký tham dự, thanh toán và quản lý sự kiện không thuộc đề tài. Ba endpoint được chọn đạt ngưỡng hiệu năng trong tải ngắn hạn, nhưng toàn bộ vòng đời chưa được kiểm thử đầu cuối.

### Component 2 — Kết quả 2: Mô hình trách nhiệm

**Nội dung nguồn đầy đủ:** Đề tài đã triển khai mô hình ba lớp logic. Nghiệp vụ cốt lõi tạo dữ liệu chính thức sau khi kiểm tra quyền và trạng thái. Thuật toán xác định tạo điểm số, đề xuất và căn cứ có thể tái lập. AI tạo bản nháp, cảnh báo, phân tích, bản tổng hợp hoặc câu trả lời để người dùng kiểm tra. Đường chuyển từ đầu ra hỗ trợ đến dữ liệu chính thức luôn cần hành động của người dùng có thẩm quyền và kiểm tra của backend.

Mô hình đã được thể hiện trong thiết kế và phần mềm, nhưng thử nghiệm chưa đánh giá đầy đủ hiệu lực của các ranh giới đối với hành vi người dùng. Do không có kiến trúc đối chứng, kết quả không chứng minh mô hình ba lớp là tối ưu hoặc là nguyên nhân duy nhất tạo ra các kết quả quan sát được.

### Component 3 — Kết quả 3: Thuật toán có căn cứ

**Nội dung nguồn đầy đủ:** Reviewer matching sử dụng Jaccard, quy tắc phân xử theo tải và định danh, thuật toán tham lam hai lượt cùng COI là ràng buộc cứng. Hệ thống trả điểm, lý do, tải và danh sách bài chưa đủ người để Chủ tọa kiểm tra. Cơ chế COI kết hợp quan hệ trực tiếp, khai báo và đồ thị đồng tác giả nhiều bậc.

Benchmark cho thấy Jaccard truy hồi tín hiệu chủ đề tốt hơn ngẫu nhiên và Greedy tăng điểm phù hợp nội tại, nhưng độ phủ chỉ đạt 65,9% và 23,3% bài cần lượt dự phòng. Chất lượng phân công và COI đa tầng chưa được xác nhận bằng nhãn chuyên gia. Vì vậy, kết quả là cơ chế đề xuất có thể kiểm tra, không phải tự động phân công.

### Component 4 — Kết quả 4: Sáu workflow AI

**Nội dung nguồn đầy đủ:** Đề tài đã tích hợp Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent. Mỗi luồng có đầu vào, đầu ra, người kiểm tra và ranh giới riêng. Autofill tạo bản nháp; Gating phân tách luật chặn với cảnh báo nội dung; Initial Analysis định hướng đọc; Auditor rà soát bản nháp; Copilot tổng hợp bằng chứng; Chatbot truy vấn dữ liệu theo quyền.

Kết quả không đồng đều. Autofill và nhánh luật Gating có bằng chứng trực tiếp rõ hơn. Initial Analysis bám nguồn tốt ở trích dẫn nhưng yếu hơn ở diễn giải. Auditor còn nhiều nhiễu. Copilot có mức bám nguồn tương đối cao nhưng chưa đo chất lượng quyết định. Chatbot giữ quyền trong bộ thử nhưng còn 31/128 lượt gọi công cụ thất bại.

### Component 5 — Kết quả 5: Chuỗi đánh giá theo lớp

**Nội dung nguồn đầy đủ:** Đề tài xây dựng chuỗi bằng chứng riêng cho hiệu năng backend, chi phí thuật toán, hành vi matching, đầu ra AI, hội thoại theo quyền và UAT. Kết quả, trường hợp lỗi và khoảng trống đánh giá được trình bày riêng thay vì gộp thành một điểm số “chất lượng hệ thống”. Khung tổng hợp phân biệt bằng chứng trực tiếp, gián tiếp, theo kịch bản và nội dung chưa xác nhận.

Đóng góp của chuỗi đánh giá nằm ở khả năng khóa phạm vi kết luận. Kết quả kỹ thuật không bị dùng để thay bằng chứng người dùng; phản hồi người dùng không bị dùng để chứng minh độ đúng của AI; chỉ số TCA không bị dùng để khẳng định chất lượng quyết định học thuật.

### Component 6 — Mức độ hoàn thành mục tiêu

**Nội dung nguồn đầy đủ:** Quy trình nghiệp vụ đã được xây dựng trong phạm vi. Mô hình ba lớp đã được triển khai. Cơ chế có thể kiểm chứng đã được triển khai nhưng chất lượng chưa xác nhận đầy đủ. Sáu luồng AI đã được tích hợp và đánh giá riêng, với kết quả không đồng đều. Đánh giá bằng nhiều nhóm bằng chứng đã được thực hiện một phần nhưng còn thiếu kiểm thử đầu cuối, nhãn chuyên gia, UAT cân bằng và xác minh hồ sơ người tham gia.

### Kết luận đầy đủ của slide

Đề tài đã xây dựng một nền tảng nghiệp vụ, triển khai mô hình trách nhiệm, cung cấp thuật toán có căn cứ, tích hợp sáu workflow AI và tổ chức chuỗi đánh giá theo từng lớp. Các kết quả chứng minh khả năng triển khai và đánh giá mô hình trong phạm vi thử nghiệm. Chúng chưa chứng minh mô hình tối ưu, ConferenceSpace trưởng thành như sản phẩm thương mại hoặc hệ thống vượt trội hơn các nền tảng khác.

**Nguồn nội bộ:** Chương 5, các mục “Kết quả đạt được” và “Mức độ hoàn thành mục tiêu”.

---

## Slide 32 — Các hạn chế tập trung ở bằng chứng thực tế, vận hành và quản trị dữ liệu

### Component 1 — Dữ liệu matching và COI chưa phản ánh phân công thực

**Nội dung nguồn đầy đủ:** Reviewer matching được đánh giá trên dữ liệu tổng hợp và proxy leave-one-out theo tác giả. Nghiên cứu chưa có dữ liệu phân công thực tế, nhãn xác nhận của Chủ tọa, tỷ lệ chấp nhận đề xuất hoặc phương án gold. COI chưa có tập cặp có và không có xung đột do chuyên gia gán nhãn. Hệ quả là báo cáo chưa đo được độ đúng của đề xuất trong hội nghị thật, precision, recall hoặc độ phủ của từng nguồn COI.

Hướng khắc phục là thu thập phương án phân công và quyết định xác nhận của Chủ tọa trên nhiều hội nghị, đồng thời xây dựng tập COI có nhãn với nguồn quan hệ rõ. Khi đó, nghiên cứu có thể tách chất lượng xếp hạng, chất lượng phương án phân công và chất lượng phát hiện xung đột.

### Component 2 — Nhãn tác giả gốc chỉ là tín hiệu gián tiếp

**Nội dung nguồn đầy đủ:** Tác giả gốc được dùng để kiểm tra liệu hồ sơ chủ đề có truy hồi đúng quan hệ đã mã hóa hay không. Tác giả không phải Phản biện viên phù hợp cho chính bài và còn là một COI hiển nhiên. Vì vậy, Hit@k và MRR chỉ đo tính nhất quán của fingerprint chủ đề, không đo chuyên môn, chất lượng phản biện hoặc tính công bằng của phân công.

Hướng khắc phục là dùng nhãn của Chủ tọa hoặc đánh giá cặp bài–Phản biện viên bởi nhiều chuyên gia, có hướng dẫn và đo mức thống nhất giữa người chấm.

### Component 3 — TCA/NLI chưa thay thế đánh giá chuyên gia

**Nội dung nguồn đầy đủ:** TCA và NLI ước lượng quan hệ giữa mệnh đề và nguồn, cùng một số điều kiện hợp lệ. Chúng chưa được hiệu chuẩn trên nhãn chuyên gia trong miền phản biện khoa học. Các chỉ số không đo trực tiếp tính hữu ích, độ đầy đủ, mức nghiêm trọng của lỗi hoặc ảnh hưởng đến phán đoán. Đặc biệt, một mệnh đề bám nguồn vẫn có thể thiếu bối cảnh hoặc không quan trọng; một mệnh đề khác tham chiếu vẫn có thể hữu ích.

Hướng khắc phục là xây dựng tập nhãn theo từng workflow, cho chuyên gia đánh giá bám nguồn, tính đúng, mức hữu ích và mức ảnh hưởng; sau đó hiệu chuẩn ngưỡng và kiểm tra độ thống nhất.

### Component 4 — UAT nhỏ và mất cân bằng

**Nội dung nguồn đầy đủ:** UAT có 91 phản hồi nhưng Tác giả chiếm 83,5%; chỉ có 7 Phản biện viên và 8 phản hồi Chủ tọa. Mẫu thuận tiện không cho phép suy rộng. Dữ liệu Chủ tọa chưa truy vết đầy đủ và thiếu cơ chế xác minh độc lập tính duy nhất hoặc hồ sơ chuyên môn. Câu hỏi gộp cũng không tách tác động của từng workflow.

Hướng khắc phục là cân bằng mẫu, cấp mã ẩn danh duy nhất, xác minh vai trò tách biệt với câu trả lời, chuẩn hóa nhiệm vụ, đo thời gian thao tác và bổ sung điều kiện đối chứng không dùng AI.

### Component 5 — Backend mới được kiểm thử tải ngắn hạn

**Nội dung nguồn đầy đủ:** Kết quả k6 chỉ bao phủ ba đường xử lý, 20 người dùng ảo và 30 giây mỗi kịch bản. Chưa có kiểm thử chạy bền, tải phân tán, toàn bộ hành trình người dùng hoặc kiểm tra nhất quán giữa nhiều bước. Do đó, 0% lỗi và p95 dưới 120 ms không chứng minh độ tin cậy của toàn hệ thống trong vận hành dài hạn.

Hướng khắc phục là bổ sung soak test, stress test, tải nhiều node, đo đầu cuối và quan sát độ trễ theo từng phụ thuộc.

### Component 6 — Chưa kiểm thử gây lỗi và khôi phục

**Nội dung nguồn đầy đủ:** Nghiên cứu chưa chủ động làm AI, hàng đợi hoặc kho dữ liệu hết thời gian chờ, ngừng hoạt động hoặc trả dữ liệu không nhất quán. Hành vi retry, giới hạn số lần thử, idempotency, rollback, phục hồi sau lỗi và trạng thái của tác vụ đang chạy chưa được xác nhận. Một số luồng có trường hợp vượt 100 giây, nên khoảng trống này ảnh hưởng trực tiếp đến trải nghiệm.

Hướng khắc phục là xác định failure matrix, kiểm thử từng điểm lỗi, ghi trạng thái rõ và bảo đảm người dùng có đường tiếp tục an toàn khi thành phần hỗ trợ không khả dụng.

### Component 7 — Chatbot chưa được kiểm toán bảo mật

**Nội dung nguồn đầy đủ:** Việc không ghi nhận rò rỉ trong 40 hội thoại chỉ có giá trị trong bộ kịch bản quyền đã thử. Nghiên cứu chưa thực hiện prompt injection, tool abuse, chuỗi truy vấn đối kháng, tải đồng thời hoặc kiểm toán độc lập. Một biến thể còn tạo nội dung vượt phạm vi và một số câu trả lời lộ lỗi truy vấn.

Hướng khắc phục là xây dựng bộ kiểm thử đối kháng theo vai trò, dữ liệu và công cụ; kiểm tra từ chối, giảm thiểu dữ liệu trả về, nhật ký truy cập và xử lý lỗi không lộ chi tiết nội bộ.

### Component 8 — Vòng đời dữ liệu tại nhà cung cấp AI chưa được kiểm toán

**Nội dung nguồn đầy đủ:** Phân quyền cấp ứng dụng không cho biết nhà cung cấp lưu dữ liệu bao lâu, dùng dữ liệu vào mục đích nào, xử lý ở khu vực nào hoặc xóa theo cơ chế nào. Đề tài chưa kiểm toán đầy đủ các điều khoản này và chưa có nhật ký toàn diện liên kết nguồn, phiên bản, đầu ra AI và quyết định người dùng. Bản thảo hoặc phản biện mật chỉ được gửi khi chính sách hội nghị và thỏa thuận xử lý dữ liệu cho phép rõ ràng.

Hướng khắc phục là đánh giá nhà cung cấp theo Data Processing Agreement, chính sách lưu giữ và khu vực xử lý; cân nhắc triển khai tại chỗ hoặc mô hình trọng số mở cho dữ liệu nhạy cảm; bổ sung nhật ký và cơ chế xóa.

### Kết luận đầy đủ của slide

Các hạn chế không phủ nhận việc hệ thống và chuỗi đánh giá đã được xây dựng; chúng xác định chính xác phần chưa được chứng minh. Khoảng trống lớn nhất nằm ở nhãn chuyên gia và dữ liệu hội nghị thực, hiệu lực kiểm soát của con người, vận hành khi có lỗi và quản trị dữ liệu ngoài ứng dụng. Vì vậy, mọi kết luận phải được khóa trong phạm vi fixture, kịch bản và mẫu người dùng hiện có.

**Nguồn nội bộ:** Chương 5, mục “Các hạn chế”; Chương 4, mục “Tổng hợp kết quả và giới hạn”.

---

## Slide 33 — Hướng phát triển ưu tiên bằng chứng và vận hành trước khi mở rộng tự động hóa

### Component 1 — Giai đoạn 1: Bằng chứng có nhãn

**Nội dung nguồn đầy đủ:** Ưu tiên đầu tiên là xây dựng tập đánh giá gần vận hành thực. Reviewer matching cần dữ liệu phân công, nhãn của Chủ tọa, tỷ lệ chấp nhận đề xuất và phản hồi về lý do điều chỉnh. COI cần tập cặp có và không có xung đột do chuyên gia gán nhãn để đo precision, recall và độ phủ theo từng nguồn trực tiếp, khai báo và đồ thị.

Sáu workflow AI cần bộ nhãn riêng theo chức năng: độ chính xác và khả năng sửa của Autofill; tính đúng và mức hữu ích của cảnh báo Gating; độ bám nguồn và ảnh hưởng đến việc đọc của Initial Analysis; false positive/false negative của Auditor; độ đầy đủ và hữu ích của Copilot; tính đúng, từ chối phạm vi và tuân thủ quyền của Chatbot. UAT cần cân bằng theo vai trò, có mã ẩn danh duy nhất và nhiệm vụ chuẩn hóa.

### Component 2 — Giai đoạn 2: Vận hành tác vụ dài

**Nội dung nguồn đầy đủ:** Các tác vụ dài cần chuyển sang hàng đợi bất đồng bộ, có trạng thái đang chờ, đang xử lý, hoàn tất, lỗi và hết hạn. Giao diện phải hiển thị tiến độ, giới hạn thời gian và số lần thử lại. Backend cần bảo đảm idempotency để một tác vụ chạy lại không ghi trùng dữ liệu hoặc tạo kết quả mâu thuẫn.

Nhật ký kiểm toán phải liên kết dữ liệu nguồn, mã nhận diện đầu vào, phiên bản chính sách hoặc mô hình, công cụ được gọi, kết quả, lỗi và hành động của người dùng. Hệ thống cần kiểm thử timeout, dịch vụ ngừng hoạt động, mất kết nối kho dữ liệu, retry và khôi phục. Riêng Submission Gating cần tách khỏi điều kiện bắt buộc của bước công bố bài nếu hệ thống muốn tiếp tục vận hành khi AI lỗi.

### Component 3 — Giai đoạn 3: Truy hồi có kiểm soát

**Nội dung nguồn đầy đủ:** Chatbot và các Agent cần truy hồi từ chính sách hội nghị, hướng dẫn nộp bài, biểu mẫu phản biện, hồ sơ chuyên môn và tài liệu đã được phân quyền. Lớp truy hồi có thể kết hợp biểu diễn nhúng, tìm kiếm véc-tơ và tìm kiếm từ khóa, nhưng phải dùng siêu dữ liệu, phiên bản tài liệu và quyền truy cập để giới hạn kết quả.

Mỗi câu trả lời hoặc bản tổng hợp cần kèm nguồn để người dùng kiểm tra. Mỗi công cụ phải có cấu trúc đầu vào, quyền và cách xử lý lỗi rõ; Agent không tự thay đổi quyết định học thuật và phải yêu cầu xác nhận trước mọi thao tác làm thay đổi trạng thái. Cần kiểm thử đối kháng trên ranh giới quyền và lưu toàn bộ chuỗi gọi để truy vết.

### Component 4 — Giai đoạn 4: Hoàn thiện nghiệp vụ

**Nội dung nguồn đầy đủ:** Trước khi triển khai thực tế, ConferenceSpace cần hoàn thiện COI đa tầng, kiểm soát hạn chót, bidding, cơ chế chọn bài phản biện, nghiệp vụ sau quyết định và quy trình camera-ready. Dữ liệu chuyên môn và COI có thể được mở rộng từ DBLP, Semantic Scholar và thông tin đơn vị công tác, nhưng nguồn gốc và quyền sử dụng phải được ghi nhận.

Hệ thống cũng cần đánh giá lựa chọn nhà cung cấp AI, so sánh triển khai tại chỗ hoặc mô hình trọng số mở theo chất lượng, chi phí và công sức vận hành. Phạm vi tự động hóa chỉ nên mở rộng sau khi bằng chứng, kiểm soát quyền, khả năng phục hồi và quản trị dữ liệu đạt yêu cầu.

### Component 5 — Thứ tự ưu tiên

**Nội dung nguồn đầy đủ:** Giai đoạn 1 là ưu tiên cao nhất vì bằng chứng có nhãn quyết định hệ thống có thể kết luận gì về chất lượng. Các giai đoạn 2–4 phụ thuộc vào nền tảng vận hành và dữ liệu đó. Việc thêm nhiều Agent hoặc tăng quyền tự động trước khi đo được sai số, hành vi người dùng và khả năng phục hồi sẽ làm tăng rủi ro mà không tăng tương ứng độ tin cậy.

### Kết luận đầy đủ của slide

Hướng phát triển không bắt đầu bằng việc gắn thêm AI. Thứ tự hợp lý là bổ sung bằng chứng có nhãn, làm tác vụ dài và nhật ký đủ tin cậy, xây dựng truy hồi có nguồn và quyền rõ, rồi hoàn thiện nghiệp vụ cùng mức tự động hóa. Cách ưu tiên này giữ mục tiêu chuyển ConferenceSpace từ nền tảng thực nghiệm sang hệ thống có thể đánh giá và vận hành có trách nhiệm.

**Nguồn nội bộ:** Chương 5, mục “Hướng phát triển trong tương lai”.

---

## Slide 34 — Câu hỏi và thảo luận

### Component 1 — Câu kết luận trung tâm

**Nội dung nguồn đầy đủ:** Giá trị chính của đề tài là đặt đúng cơ chế vào đúng tác vụ, đồng thời phân biệt rõ phần đã được kiểm chứng với phần còn cần đánh giá. Nghiệp vụ cốt lõi xử lý quyền, trạng thái và dữ liệu chính thức; thuật toán xác định tạo đề xuất có căn cứ; AI hỗ trợ tạo đầu ra để người dùng kiểm tra. Mỗi lớp cần bằng chứng tương ứng và không được vay mượn kết quả của lớp khác để tạo một kết luận rộng hơn.

### Component 2 — Dải “Nghiệp vụ cốt lõi”

**Nội dung nguồn đầy đủ:** Nghiệp vụ cốt lõi bảo toàn vòng đời từ cấu hình, nộp bài, phân công và phản biện đến quyết định. Backend kiểm tra quyền, trạng thái và điều kiện trước khi ghi dữ liệu. Kết quả benchmark trực tiếp xác nhận hiệu năng của ba endpoint trong tải ngắn hạn, nhưng toàn bộ vòng đời và vận hành dài hạn còn cần kiểm thử.

### Component 3 — Dải “Thuật toán xác định”

**Nội dung nguồn đầy đủ:** Reviewer matching và COI được tổ chức thành cơ chế có công thức, ràng buộc, quy tắc phân xử và đầu ra có thể truy vết. Kết quả hiện cho thấy tín hiệu chủ đề hữu ích trong fixture, nhưng chưa có gold assignment hoặc bộ COI có nhãn. Thuật toán vì vậy hỗ trợ Chủ tọa, không thay thế việc phân công.

### Component 4 — Dải “AI hỗ trợ có kiểm soát”

**Nội dung nguồn đầy đủ:** Sáu workflow AI tạo bản nháp, cảnh báo, bản phân tích, bản tổng hợp hoặc câu trả lời theo quyền. Bằng chứng mạnh và yếu khác nhau giữa các luồng; một số chỉ có chỉ số gián tiếp. Con người phải kiểm tra nguồn và chịu trách nhiệm đối với thao tác chính thức. Chính sách hội nghị và điều kiện xử lý dữ liệu quyết định luồng nào được phép bật.

### Component 5 — Câu hỏi mở cho thảo luận

**Nội dung nguồn đầy đủ:** Các câu hỏi cần tiếp tục thảo luận gồm: bằng chứng nào đủ để Chủ tọa tin cậy một đề xuất matching; cơ chế nào đo hiệu lực của bước human-in-the-loop thay vì chỉ kiểm tra sự tồn tại của nút xác nhận; cách cân bằng giữa thời gian chờ và quyền tiếp tục khi AI không khả dụng; điều kiện dữ liệu và chính sách nào phải được đáp ứng trước khi bật AI cho bản thảo mật; và mức tự động hóa nào phù hợp với từng loại hội nghị.

### Kết luận đầy đủ của slide

ConferenceSpace đã chứng minh khả năng xây dựng một quy trình xét duyệt có phân định trách nhiệm và chuỗi bằng chứng theo tác vụ. Phần đã được kiểm chứng tập trung ở một số endpoint, siêu dữ liệu, luật nghiệp vụ và hành vi trong các bộ thử. Phần còn cần đánh giá gồm chất lượng phân công thực, COI đa tầng, ảnh hưởng của AI đến phán đoán, vận hành dài hạn và quản trị dữ liệu. Câu hỏi trung tâm cho giai đoạn tiếp theo không phải “AI có thể làm thêm gì”, mà là “bằng chứng và cơ chế kiểm soát nào phải có trước khi giao thêm trách nhiệm cho hệ thống”.

**Nguồn nội bộ:** Chương 5, đoạn kết luận cuối chương.

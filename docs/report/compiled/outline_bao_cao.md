# Outline báo cáo

## Chương 1. Mở đầu

### 1.1 Đặt vấn đề
Trình bày bối cảnh thực tế của lĩnh vực mà đề tài hướng tới, đồng thời nêu những khó khăn, bất cập hoặc hạn chế trong quy trình hiện tại. Phần này cần làm rõ lý do đề tài có ý nghĩa thực tiễn và tại sao việc xây dựng hệ thống là cần thiết trong bối cảnh đó.

### 1.2 Mục tiêu đề tài
Nêu mục tiêu tổng quát của đề tài và các mục tiêu cụ thể cần đạt được trong quá trình xây dựng hệ thống. Các mục tiêu này nên gắn trực tiếp với nhu cầu người dùng, giải pháp kỹ thuật và kết quả đánh giá cuối cùng của hệ thống.

### 1.3 Phạm vi đề tài
Xác định rõ phạm vi mà đề tài thực hiện và các nội dung không nằm trong phạm vi nghiên cứu. Mục này cần làm rõ hệ thống tập trung vào quy trình xét duyệt bài báo trong hội nghị khoa học, các vai trò được hỗ trợ, các nhóm chức năng chính được triển khai và giới hạn của đề tài như không thay thế quyết định học thuật của con người, không bao phủ quản lý sự kiện hội nghị theo nghĩa rộng và không đánh giá tác động dài hạn của AI lên văn hóa phản biện.

### 1.4 Cấu trúc luận văn
Giới thiệu ngắn gọn nội dung của từng chương để người đọc hình dung được mạch triển khai toàn bộ báo cáo. Mục này cần thể hiện rõ mối liên hệ giữa các chương, từ khảo sát nhu cầu đến xây dựng hệ thống và đánh giá kết quả.

## Chương 2. Khảo sát nhu cầu, hiện trạng và khoảng trống nghiên cứu

### 2.1 Khảo sát nhu cầu

#### 2.1.1 Mục tiêu khảo sát
Trình bày mục đích của hoạt động khảo sát, bao gồm việc xác định nhu cầu thực tế, các tính năng được quan tâm và mức độ ưu tiên của từng chức năng. Phần này cũng cần cho thấy khảo sát được thực hiện nhằm làm cơ sở cho các quyết định thiết kế ở các chương sau.

#### 2.1.2 Đối tượng khảo sát
Nêu rõ các nhóm đối tượng tham gia khảo sát như người dùng chính, quản trị viên, chuyên gia nghiệp vụ hoặc các bên liên quan khác. Cần giải thích vai trò của từng nhóm và lý do họ được lựa chọn làm nguồn cung cấp yêu cầu cho hệ thống.

#### 2.1.3 Phương pháp khảo sát
Mô tả hình thức thu thập dữ liệu như phỏng vấn trực tiếp, biểu mẫu khảo sát hoặc kết hợp nhiều phương pháp. Phần này cần thể hiện rằng việc thu thập yêu cầu được tiến hành có hệ thống và phù hợp với mục tiêu của đề tài.

#### 2.1.4 Kết quả khảo sát theo từng tính năng
Trình bày kết quả khảo sát theo từng nhóm chức năng của hệ thống. Mục này cần làm rõ tính năng nào được nhiều người dùng quan tâm, tính năng nào mang tính bổ trợ và tính năng nào có thể ưu tiên triển khai trước.

#### 2.1.5 Phân tích lý do người dùng lựa chọn tính năng
Phân tích nguyên nhân người dùng ưu tiên từng tính năng, chẳng hạn vì tiết kiệm thời gian, tăng độ chính xác, giảm thao tác thủ công hoặc hỗ trợ ra quyết định tốt hơn. Nội dung của mục này giúp chuyển từ ý thích người dùng sang yêu cầu nghiệp vụ thực sự.

#### 2.1.6 Phân tích tính năng được yêu thích nhất
Xác định tính năng được lựa chọn nhiều nhất hoặc được đánh giá cao nhất trong khảo sát. Sau đó giải thích vì sao tính năng đó nổi bật hơn các tính năng khác và vì sao nó cần được xem là thành phần trọng tâm trong giải pháp của nhóm.

### 2.2 Khảo sát hiện trạng

#### 2.2.1 Mô tả các ứng dụng hiện có
Giới thiệu các hệ thống, nền tảng hoặc ứng dụng đang giải quyết bài toán tương tự. Mỗi hệ thống cần được mô tả theo hướng mục tiêu sử dụng, nhóm người dùng và chức năng chính mà nó đang cung cấp.

#### 2.2.2 Đánh giá mức độ được yêu thích
Trình bày mức độ phổ biến hoặc mức độ được người dùng đánh giá cao của các ứng dụng hiện có. Nội dung này nên tập trung vào trải nghiệm thực tế của người dùng, những điểm mạnh nổi bật và các điểm khiến người dùng chưa hài lòng.

#### 2.2.3 So sánh với các ứng dụng khác
So sánh các giải pháp hiện có với nhau và với định hướng hệ thống của nhóm. Mục này cần làm rõ sự khác biệt về chức năng, trải nghiệm, mức độ tự động hóa, khả năng hỗ trợ AI và mức độ phù hợp với nhu cầu thực tế đã khảo sát.

### 2.3 Khoảng trống nghiên cứu

#### 2.3.1 Hạn chế của các hệ thống hiện tại
Chỉ ra các điểm yếu hoặc phần còn thiếu trong các hệ thống đang tồn tại, chẳng hạn chưa hỗ trợ đầy đủ quy trình nghiệp vụ, mức tự động hóa thấp, thiếu tính cá nhân hóa hoặc chưa tận dụng AI một cách hiệu quả. Những hạn chế này cần được trình bày như cơ sở trực tiếp dẫn tới đề xuất giải pháp của nhóm.

#### 2.3.2 Liên kết hạn chế với giải pháp của nhóm
Trình bày cách nhóm xây dựng hệ thống để giải quyết các hạn chế đã nêu ở mục trước. Phần này cần cho thấy giải pháp không xuất hiện một cách rời rạc, mà là phản hồi trực tiếp đối với các vấn đề được phát hiện từ khảo sát nhu cầu và khảo sát hiện trạng.

#### 2.3.3 Định hướng giải pháp và nguyên tắc thiết kế
Trình bày định hướng giải pháp ở mức khái niệm, bao gồm cách hệ thống phản hồi trực tiếp với các khoảng trống đã xác định và các nguyên tắc thiết kế chủ đạo như tách lớp nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ. Phần này chỉ nên giới thiệu vai trò của các hướng giải pháp, không phân tích sâu công nghệ cụ thể vì nội dung đó thuộc Chương 4.

### 2.4 Tổng hợp yêu cầu hệ thống từ khảo sát
Tổng hợp các yêu cầu rút ra từ khảo sát nhu cầu, khảo sát hiện trạng và khoảng trống nghiên cứu. Mục này đóng vai trò cầu nối giữa Chương 2 và Chương 3, giúp người đọc thấy rõ vì sao hệ thống cần những chức năng và nguyên tắc thiết kế được trình bày ở chương sau.

#### 2.4.1 Yêu cầu chức năng
Liệt kê và nhóm các chức năng hệ thống cần hỗ trợ theo từng vai trò như Tác giả, Người phản biện, Chủ tọa và Quản trị viên. Nội dung cần cho thấy mỗi nhóm chức năng xuất phát từ nhu cầu hoặc khoảng trống cụ thể đã phân tích ở các mục trước.

#### 2.4.2 Yêu cầu phi chức năng
Trình bày các yêu cầu về hiệu năng, bảo mật, khả năng mở rộng, độ tin cậy, khả năng sử dụng, tính minh bạch và khả năng giải thích. Đây là cơ sở để đánh giá các quyết định kiến trúc và công nghệ ở Chương 3 và Chương 4.

#### 2.4.3 Nguyên tắc sử dụng AI có trách nhiệm
Nêu các nguyên tắc giới hạn vai trò của AI trong hệ thống, chẳng hạn AI chỉ hỗ trợ chứ không thay thế quyết định học thuật, người dùng phải có quyền xem lại và ghi đè kết quả, các gợi ý cần có căn cứ hoặc giải thích, và hệ thống phải vận hành được khi dịch vụ AI không khả dụng.

## Chương 3. Xây dựng hệ thống

### 3.1 Tổng quan hệ thống
Giới thiệu mục tiêu của hệ thống, các nhóm người dùng chính và các thành phần quan trọng trong kiến trúc tổng thể. Phần này giúp người đọc hình dung bức tranh chung trước khi đi vào các chi tiết thiết kế kỹ thuật.

#### 3.1.1 Mô hình phân lớp của hệ thống
Trình bày cách hệ thống được chia thành các lớp trách nhiệm chính, bao gồm lớp nghiệp vụ cốt lõi, lớp thuật toán xác định và lớp AI hỗ trợ. Mục này cần làm rõ vì sao việc phân lớp giúp hệ thống vừa đáp ứng nhu cầu nghiệp vụ, vừa kiểm soát được rủi ro khi đưa AI vào quy trình học thuật.

#### 3.1.2 Nguyên tắc thiết kế hệ thống
Nêu các nguyên tắc thiết kế chi phối toàn bộ kiến trúc, chẳng hạn tách biệt trách nhiệm, ưu tiên kết quả có thể giải thích, không để AI quyết định thay con người, xử lý lỗi rõ ràng và đảm bảo hệ thống vẫn hoạt động khi một thành phần phụ trợ không khả dụng.

### 3.2 Use Case

#### 3.2.1 Tác nhân hệ thống
Xác định các tác nhân tương tác với hệ thống như người dùng cuối, quản trị viên và các dịch vụ liên quan. Cần mô tả vai trò của từng tác nhân và mối quan hệ của họ với các chức năng chính của hệ thống.

#### 3.2.2 Các use case chính
Trình bày các chức năng chính mà hệ thống cung cấp cho từng tác nhân. Nội dung nên thể hiện hệ thống hỗ trợ người dùng thực hiện những tác vụ nào và từng tác vụ đóng vai trò gì trong quy trình nghiệp vụ tổng thể.

#### 3.2.3 Đặc tả use case quan trọng
Mô tả chi tiết các use case trọng tâm, bao gồm mục tiêu, điều kiện thực hiện, luồng xử lý chính, các trường hợp ngoại lệ và đầu ra. Phần này giúp liên kết nhu cầu người dùng với cách hệ thống được thiết kế để phục vụ nhu cầu đó.

### 3.3 Thiết kế kỹ thuật

#### 3.3.1 Kiến trúc tổng thể
Trình bày kiến trúc tổng thể của hệ thống, bao gồm frontend, backend, cơ sở dữ liệu, các dịch vụ AI và các thành phần hỗ trợ khác. Nội dung cần làm rõ cách các thành phần phối hợp với nhau để đảm bảo hệ thống hoạt động ổn định và có khả năng mở rộng.

#### 3.3.2 Thiết kế backend
Mô tả cấu trúc phía máy chủ, cách tổ chức module, xử lý nghiệp vụ, API và cơ chế giao tiếp giữa các thành phần. Mục này cần nhấn mạnh tính rõ ràng trong thiết kế, khả năng bảo trì và khả năng tích hợp với các workflow AI.

#### 3.3.3 Thiết kế dữ liệu
Trình bày mô hình dữ liệu chính của hệ thống, bao gồm dữ liệu người dùng, dữ liệu nghiệp vụ và dữ liệu phát sinh trong quá trình xử lý bằng AI. Phần này cần làm rõ dữ liệu được lưu trữ, liên kết và khai thác như thế nào để phục vụ toàn bộ hệ thống.

#### 3.3.4 Luồng xử lý hệ thống
Mô tả dòng chảy của dữ liệu và thao tác từ lúc hệ thống nhận đầu vào đến khi trả đầu ra cho người dùng. Nội dung này nên làm rõ từng bước xử lý chính, các điểm chuyển giao giữa các thành phần và vị trí mà AI tham gia trong các workflow.

### 3.4 Giải pháp AI

#### 3.4.1 Vai trò của AI trong hệ thống
Giải thích AI được đưa vào hệ thống để hỗ trợ công đoạn nào, giải quyết hạn chế gì của quy trình hiện tại và mang lại lợi ích gì so với cách xử lý thông thường. Phần này cần gắn trực tiếp với nhu cầu đã khảo sát ở Chương 2 để tránh cảm giác AI chỉ được thêm vào cho có.

#### 3.4.2 Các workflow có sử dụng AI
Trình bày các quy trình trong hệ thống mà AI tham gia xử lý. Với mỗi workflow, cần mô tả mục tiêu, dữ liệu đầu vào, các bước xử lý, vai trò cụ thể của AI và kết quả đầu ra mà workflow tạo ra.

#### 3.4.3 Tích hợp AI vào kiến trúc hệ thống
Mô tả cách các thành phần AI được tích hợp vào backend và các thành phần còn lại của hệ thống. Phần này cần làm rõ cơ chế gọi mô hình, truyền dữ liệu, nhận kết quả, xử lý lỗi và cách phối hợp giữa AI với logic nghiệp vụ thông thường.

#### 3.4.4 Ưu điểm và giới hạn của các workflow AI
Phân tích lợi ích của việc sử dụng AI trong từng workflow như giảm thao tác thủ công, tăng tốc xử lý hoặc cải thiện chất lượng kết quả. Đồng thời, mục này cũng cần nêu rõ các giới hạn như phụ thuộc dữ liệu, khả năng sai ngữ cảnh, chi phí tính toán và nhu cầu kiểm duyệt đầu ra.

### 3.5 Kiến trúc triển khai tổng quan

#### 3.5.1 Cấu hình server
Trình bày môi trường máy chủ dùng để triển khai hệ thống ở mức tổng quan, bao gồm cấu hình cơ bản và vai trò của môi trường triển khai trong việc chứng minh hệ thống có thể vận hành thực tế. Các lý do lựa chọn công nghệ triển khai cụ thể sẽ được trình bày chi tiết hơn ở Chương 4.

#### 3.5.2 Proxy
Mô tả vai trò của proxy trong kiến trúc triển khai, chẳng hạn điều phối truy cập, định tuyến request hoặc hỗ trợ bảo mật giao tiếp giữa các thành phần. Nội dung nên tập trung vào vị trí của proxy trong hệ thống, tránh lặp lại phân tích công nghệ chi tiết ở Chương 4.

#### 3.5.3 Các thành phần triển khai khác
Trình bày các thành phần triển khai bổ sung như cơ sở dữ liệu, lưu trữ, dịch vụ nền, mạng nội bộ và pipeline cập nhật hệ thống ở mức kiến trúc. Phần này giúp chứng minh hệ thống được triển khai như một giải pháp hoàn chỉnh, nhưng không cần đi sâu vào lý do chọn từng công nghệ.

## Chương 4. Công nghệ sử dụng

### 4.1 Công nghệ phía giao diện
Trình bày các công nghệ dùng để phát triển giao diện người dùng và lý do lựa chọn chúng. Nội dung nên gắn với khả năng hiển thị thông tin, tương tác với người dùng và hỗ trợ trải nghiệm sử dụng hệ thống.

#### 4.1.1 Framework giao diện và ngôn ngữ phát triển
Giới thiệu framework frontend, ngôn ngữ lập trình và các thư viện giao diện chính được sử dụng. Nội dung cần giải thích vì sao các công nghệ này phù hợp với yêu cầu xây dựng giao diện nhiều vai trò, nhiều quy trình và có tương tác thời gian thực.

#### 4.1.2 Tổ chức giao diện và trải nghiệm người dùng
Trình bày cách các công nghệ frontend hỗ trợ tổ chức màn hình, quản lý trạng thái, điều hướng, responsive layout và trải nghiệm sử dụng nhất quán cho Tác giả, Người phản biện và Chủ tọa.

### 4.2 Công nghệ phía máy chủ
Giới thiệu ngôn ngữ, framework hoặc nền tảng backend được dùng để xử lý nghiệp vụ và cung cấp API. Cần nêu rõ các công nghệ này hỗ trợ như thế nào cho việc tích hợp workflow AI và vận hành hệ thống ổn định.

#### 4.2.1 Ngôn ngữ và framework backend
Trình bày ngôn ngữ lập trình và framework backend chính, cùng lý do lựa chọn dựa trên hiệu năng, khả năng bảo trì, khả năng xử lý đồng thời và mức độ phù hợp với nghiệp vụ hệ thống.

#### 4.2.2 Xác thực, phân quyền và API contract
Mô tả các công nghệ hoặc cơ chế phục vụ xác thực, phân quyền, quản lý phiên làm việc và đặc tả API. Mục này cần liên hệ với yêu cầu bảo mật và phân vai trong hệ thống quản lý hội nghị.

#### 4.2.3 Giao tiếp thời gian thực
Trình bày công nghệ dùng để hỗ trợ thông báo hoặc cập nhật thời gian thực. Nội dung cần giải thích vai trò của giao tiếp realtime trong việc giảm phụ thuộc vào email và cải thiện trải nghiệm vận hành hội nghị.

### 4.3 Công nghệ cơ sở dữ liệu và lưu trữ
Trình bày công nghệ quản lý dữ liệu được sử dụng và vai trò của nó trong việc lưu trữ dữ liệu nghiệp vụ cũng như dữ liệu phục vụ các workflow AI. Phần này cần làm rõ tính phù hợp của giải pháp dữ liệu với yêu cầu của hệ thống.

#### 4.3.1 Cơ sở dữ liệu quan hệ
Giới thiệu cơ sở dữ liệu quan hệ dùng để lưu trữ dữ liệu nghiệp vụ chính như người dùng, hội nghị, bài nộp, phân công phản biện, đánh giá và quyết định. Cần nêu rõ các đặc tính khiến công nghệ này phù hợp với dữ liệu có cấu trúc và yêu cầu nhất quán.

#### 4.3.2 Cơ sở dữ liệu đồ thị
Trình bày công nghệ đồ thị dùng để lưu trữ và truy vấn quan hệ học thuật phục vụ phát hiện xung đột lợi ích. Nội dung cần giải thích vì sao mô hình đồ thị phù hợp hơn cho bài toán quan hệ đồng tác giả nhiều bậc.

#### 4.3.3 Cache, session và lưu trữ file
Mô tả các công nghệ phục vụ cache, lưu session, runtime state và lưu trữ file bài nộp. Mục này cần làm rõ vai trò của từng thành phần trong việc hỗ trợ hiệu năng, trải nghiệm người dùng và độ bền dữ liệu.

### 4.4 Công nghệ AI/ML
Giới thiệu các mô hình, thư viện, nền tảng hoặc dịch vụ AI/ML được sử dụng trong hệ thống. Nội dung cần gắn trực tiếp với các workflow AI đã trình bày ở Chương 3 và làm rõ vì sao các công nghệ đó được chọn.

#### 4.4.1 Nền tảng mô hình ngôn ngữ
Trình bày nền tảng hoặc mô hình ngôn ngữ được sử dụng cho các workflow AI, cùng các tiêu chí lựa chọn như khả năng xử lý tài liệu, độ trễ, chi phí, context window và mức độ phù hợp với dữ liệu học thuật.

#### 4.4.2 AI Service và lớp gọi mô hình
Mô tả công nghệ xây dựng AI Service và lớp trừu tượng dùng để gọi các nhà cung cấp mô hình. Nội dung cần làm rõ vì sao lớp này giúp tách biệt workflow AI khỏi backend nghiệp vụ và giảm phụ thuộc vào một provider duy nhất.

#### 4.4.3 Nguồn dữ liệu học thuật bên ngoài
Trình bày các API hoặc nguồn dữ liệu học thuật được tích hợp để làm giàu hồ sơ tác giả, bài báo và quan hệ đồng tác giả. Mục này cần liên hệ với chức năng matching và phát hiện xung đột lợi ích.

### 4.5 Công nghệ triển khai và vận hành
Trình bày các công nghệ phục vụ triển khai, giám sát, quản trị và vận hành hệ thống. Phần này giúp thể hiện hệ thống không chỉ được xây dựng về mặt chức năng mà còn có nền tảng để chạy thực tế.

#### 4.5.1 Container hóa và điều phối dịch vụ
Giới thiệu công nghệ container hóa và cách điều phối các service trong hệ thống. Nội dung cần làm rõ vai trò của container trong việc tái tạo môi trường, cô lập thành phần và triển khai hệ thống đa dịch vụ.

#### 4.5.2 Reverse proxy và HTTPS
Trình bày công nghệ proxy, quản lý HTTPS và định tuyến lưu lượng vào hệ thống. Mục này cần gắn với yêu cầu bảo mật, vận hành ổn định và hỗ trợ các kết nối như WebSocket.

#### 4.5.3 CI/CD và tự động hóa vận hành
Mô tả công nghệ dùng để kiểm thử, build, phát hành và cập nhật hệ thống. Nội dung cần cho thấy quy trình vận hành có thể lặp lại, giảm thao tác thủ công và hạn chế rủi ro khi triển khai.

## Chương 5. Thiết lập thực nghiệm và đánh giá hệ thống

### 5.1 Mục tiêu và câu hỏi đánh giá
Nêu rõ Chương 5 không chỉ kiểm tra hệ thống có chạy được hay không, mà đánh giá toàn diện ba lớp chính của ConferenceSpace: lớp nghiệp vụ cốt lõi, lớp thuật toán xác định và lớp AI hỗ trợ. Mục này cần xác định các câu hỏi đánh giá chính, tiêu chí thành công và cách các kết quả ở chương này liên kết trở lại với nhu cầu người dùng đã khảo sát ở Chương 2.

#### 5.1.1 Các lớp cần đánh giá
Giới thiệu các lớp được đánh giá trong chương, bao gồm hiệu năng của backend nghiệp vụ, chất lượng và chi phí của thuật toán đối sánh/phát hiện xung đột lợi ích, chất lượng của các workflow AI và phản hồi thực tế của người dùng sau khi trải nghiệm hệ thống. Việc phân lớp giúp tránh trộn lẫn giữa đánh giá kỹ thuật, đánh giá AI và khảo sát người dùng.

#### 5.1.2 Câu hỏi đánh giá và tiêu chí thành công
Trình bày các câu hỏi mà phần thực nghiệm cần trả lời, chẳng hạn hệ thống có đáp ứng tải vận hành hay không, thuật toán có đủ nhanh cho tương tác thực tế hay không, các workflow AI có tạo ra đầu ra đáng tin cậy hay không và người dùng có hài lòng khi sử dụng hay không. Với mỗi câu hỏi, cần nêu tiêu chí hoặc chỉ số dùng để kết luận.

#### 5.1.3 Liên kết với nhu cầu người dùng ở Chương 2
Giải thích cách các nội dung đánh giá trong chương này kiểm chứng lại những nhu cầu và ưu tiên đã được phát hiện ở Chương 2. Mục này chỉ đóng vai trò định hướng, còn phần đối chiếu kết quả đầy đủ sẽ được tổng hợp ở cuối chương sau khi đã trình bày toàn bộ số liệu thực nghiệm và khảo sát người dùng.

### 5.2 Thiết lập thực nghiệm
Trình bày điều kiện, dữ liệu, công cụ và quy trình dùng để tạo ra các kết quả đánh giá. Mục này chỉ nên mô tả cách thực nghiệm được tiến hành, không đưa kết quả khảo sát hoặc diễn giải chất lượng hệ thống vào đây.

#### 5.2.1 Dữ liệu thực nghiệm
Mô tả các tập dữ liệu được sử dụng cho từng nhóm đánh giá, bao gồm dữ liệu phục vụ benchmark backend, dữ liệu thử nghiệm thuật toán, dữ liệu bài báo dùng để đánh giá các workflow AI và dữ liệu thu được từ khảo sát người dùng sau sử dụng. Cần làm rõ nguồn gốc, quy mô, phạm vi và giới hạn của từng loại dữ liệu.

#### 5.2.2 Môi trường thực nghiệm
Trình bày cấu hình phần cứng, phần mềm, hạ tầng triển khai và các dịch vụ liên quan được dùng trong quá trình đo lường. Nội dung cần tách rõ môi trường benchmark backend, môi trường chạy workflow AI và môi trường khảo sát người dùng để người đọc hiểu kết quả được tạo ra trong điều kiện nào.

#### 5.2.3 Kịch bản và chỉ số đánh giá
Mô tả các kịch bản thực nghiệm và bộ chỉ số tương ứng cho từng lớp đánh giá. Ví dụ, backend có thể được đánh giá bằng độ trễ, thông lượng và tỷ lệ lỗi; thuật toán được đánh giá bằng thời gian xử lý và khả năng giải thích; workflow AI được đánh giá bằng các chỉ số phù hợp với từng loại đầu ra; khảo sát người dùng được đánh giá bằng mức độ hài lòng, độ dễ sử dụng và phản hồi định tính.

#### 5.2.4 Phạm vi và giới hạn của thực nghiệm
Nêu rõ những gì thực nghiệm có thể và không thể chứng minh. Mục này giúp đặt đúng kỳ vọng cho người đọc, tránh diễn giải quá mức từ dữ liệu benchmark hoặc khảo sát có quy mô giới hạn.

#### 5.2.5 Bộ dữ liệu đối chứng và quy trình chấm điểm benchmark
Trình bày các bộ dữ liệu có ground truth dùng để đánh giá chất lượng các thuật toán và workflow AI, bao gồm dữ liệu đối sánh phản biện, dữ liệu track ground truth, dữ liệu kiểm tra submission gating và bộ câu hỏi chatbot agent. Mục này cần làm rõ cách gán nhãn, cách chuẩn hóa đầu ra, cách chấm điểm tự động hoặc bán tự động và các giới hạn của từng tập dữ liệu.

### 5.3 Đánh giá lớp nghiệp vụ cốt lõi
Đánh giá khả năng vận hành của các chức năng backend chính trong điều kiện tải thử nghiệm. Mục này tập trung vào hiệu năng, độ ổn định và tài nguyên tiêu thụ của hệ thống nghiệp vụ, không trộn với đánh giá thuật toán hoặc AI.

#### 5.3.1 Kịch bản tải HTTP
Trình bày các endpoint, nhóm thao tác hoặc quy trình nghiệp vụ được đưa vào kiểm thử tải. Cần giải thích vì sao các kịch bản này đại diện cho hoạt động thực tế của hệ thống quản lý hội nghị.

#### 5.3.2 Kết quả hiệu năng backend
Phân tích các kết quả như độ trễ trung bình, trung vị, p90/p95, thông lượng và tỷ lệ lỗi. Nội dung cần chỉ ra hệ thống đáp ứng tốt ở điểm nào, còn điểm nào có nguy cơ trở thành bottleneck khi mở rộng.

#### 5.3.3 Tài nguyên tiêu thụ và điểm nghẽn vận hành
Trình bày mức sử dụng CPU, bộ nhớ, cơ sở dữ liệu và các thành phần hạ tầng trong quá trình benchmark. Mục này cần liên hệ kết quả tài nguyên với thiết kế triển khai đã trình bày ở Chương 3 và Chương 4.

### 5.4 Đánh giá lớp thuật toán xác định
Đánh giá các thành phần thuật toán có kết quả nhất quán và có thể giải thích được, đặc biệt là đối sánh phản biện và phát hiện xung đột lợi ích. Mục này cần tách khỏi phần AI vì bản chất đánh giá, rủi ro và tiêu chí thành công của thuật toán xác định khác với workflow AI.

#### 5.4.1 Thuật toán đối sánh phản biện
Trình bày cách đánh giá hiệu năng của thuật toán gợi ý hoặc phân công phản biện, bao gồm thời gian xử lý, khả năng hoạt động ở các quy mô dữ liệu khác nhau và tài nguyên tiêu thụ khi số lượng bài nộp hoặc phản biện tăng lên. Mục này tập trung vào tốc độ và khả năng mở rộng, chưa dùng để kết luận về chất lượng chuyên môn của đề xuất.

#### 5.4.2 Độ chính xác và chất lượng của reviewer matching
Đánh giá mức độ phù hợp chuyên môn của các gợi ý hoặc phân công phản biện bằng các chỉ số như Precision@K, Recall@K, coverage, average assigned score, load balance, fallback rate và mức độ chênh lệch so với baseline tối ưu trên tập dữ liệu nhỏ. Nếu sử dụng dữ liệu chair-labeled hoặc historical assignment làm ground truth, cần mô tả rõ nguồn nhãn và giới hạn khi so sánh với quyết định của con người.

#### 5.4.3 Cơ chế phát hiện xung đột lợi ích
Đánh giá cơ chế phát hiện xung đột lợi ích theo các lớp kiểm tra đã thiết kế, chẳng hạn tự phản biện, khai báo thủ công và quan hệ đồng tác giả. Nội dung cần làm rõ cơ chế này đóng góp gì cho tính minh bạch và an toàn của quy trình xét duyệt.

#### 5.4.4 Giới hạn hiện tại về chất lượng đề xuất
Tổng hợp những chỉ số hoặc thí nghiệm còn thiếu đối với lớp thuật toán, chẳng hạn mức độ phù hợp chuyên môn của gợi ý phản biện, tỷ lệ chấp nhận đề xuất của chủ tọa hoặc số lượng xung đột lợi ích ẩn được phát hiện thêm. Mục này giúp tránh kết luận quá mạnh nếu thực nghiệm hiện tại mới chứng minh tốc độ xử lý.

### 5.5 Đánh giá các workflow AI
Đánh giá chất lượng, độ tin cậy và giá trị bổ sung của các workflow AI trong hệ thống. Mục này cần chọn chỉ số phù hợp với từng workflow thay vì dùng một khuôn đánh giá chung cho mọi đầu ra AI.

#### 5.5.1 Phương pháp đánh giá AI
Trình bày khung đánh giá được dùng cho các workflow AI, bao gồm các chỉ số deterministic cho đầu ra có ground truth rõ ràng và các chỉ số đánh giá trung thực, trùng lặp, bổ sung hoặc chất lượng lập luận cho các đầu ra tự luận. Cần giải thích vì sao từng loại chỉ số phù hợp với bản chất của workflow được đánh giá.

#### 5.5.2 Submission Autofill
Đánh giá workflow tự động trích xuất thông tin bài nộp từ PDF, bao gồm độ chính xác của tiêu đề, tác giả, từ khóa, tóm tắt, các trường metadata liên quan và dữ liệu trung gian được dùng cho bước gợi ý track trong cùng luồng autofill. Mục này cần nhấn mạnh yêu cầu người dùng vẫn xem lại và chỉnh sửa trước khi gửi chính thức.

#### 5.5.3 Gợi ý track trong Submission Autofill
Đánh giá khả năng Submission Autofill gợi ý track phù hợp cho bài nộp dựa trên hội nghị đang hoạt động, danh sách track của hội nghị và thông tin bài nộp đã được trích xuất hoặc cung cấp trong form. Mục này không đánh giá workflow track recommendation độc lập, mà tập trung vào `track_rankings` nằm trong kết quả autofill. Các chỉ số nên bao gồm Top-1 accuracy, Top-3 accuracy, MRR, NDCG@K, invalid hoặc duplicate track rate, độ ổn định giữa các lần chạy và calibration của confidence score sau khi chuẩn hóa thang điểm.

#### 5.5.4 Submission Gating
Đánh giá workflow kiểm tra sơ bộ bản thảo trước khi nộp hoặc trước khi publish, bao gồm độ chính xác của verdict pass/warn/block, precision và recall của block decision, F1 theo từng rule cảnh báo, false block rate, chất lượng guidance cho tác giả và độ trễ theo từng stage xử lý. Mục này cần tách rõ rule deterministic với phần đánh giá nội dung có sử dụng LLM.

#### 5.5.5 Reviewer Initial Analysis
Đánh giá workflow hỗ trợ người phản biện đọc hiểu bài nộp ban đầu, bao gồm mức độ trung thực của các trích dẫn, độ hữu ích của phần tóm tắt và khả năng cung cấp điểm lưu ý có căn cứ. Nội dung cần làm rõ workflow này hỗ trợ reviewer, không thay thế việc đọc và đánh giá học thuật của reviewer.

#### 5.5.6 Review Quality Auditor
Đánh giá workflow kiểm toán chất lượng phản biện, bao gồm khả năng phát hiện phản biện thiếu căn cứ, thiếu chiều sâu hoặc không nhất quán. Mục này cần phân tích thẳng các giới hạn của việc dùng AI để đánh giá một loại đầu ra vốn đòi hỏi suy luận ngữ cảnh rộng.

#### 5.5.7 Chair Decision Copilot
Đánh giá workflow hỗ trợ chủ tọa tổng hợp phản biện, rebuttal và các điểm đồng thuận hoặc mâu thuẫn. Nội dung cần nhấn mạnh rằng workflow này cung cấp bằng chứng và tổng hợp thông tin, không tự động quyết định chấp nhận hay từ chối bài báo.

#### 5.5.8 Chatbot Agent của nền tảng
Đánh giá chatbot như một agent có khả năng dùng công cụ truy vấn dữ liệu hệ thống, không chỉ như một chatbot hội thoại thông thường. Nội dung cần đo độ chính xác của câu trả lời so với dữ liệu trong hệ thống, mức độ groundedness, tỷ lệ gọi tool thành công, tỷ lệ không tiết lộ dữ liệu vượt quyền, TTFT, stream duration, timeout rate và khả năng tiếp tục phiên hội thoại.

#### 5.5.9 Các workflow chưa đánh giá đầy đủ
Nêu rõ những workflow AI chưa có thực nghiệm định lượng hoặc chưa được đánh giá sâu trong phạm vi đề tài sau khi đã tách riêng Autofill, gợi ý track trong Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent. Mục này giúp giữ tính trung thực học thuật, đồng thời tạo cơ sở hợp lý cho phần hạn chế và hướng phát triển ở Chương 6.

### 5.6 Phân tích tính khả thi vận hành
Phân tích khả năng đưa hệ thống vào vận hành thực tế dựa trên chi phí, độ trễ, giới hạn dịch vụ bên ngoài và khả năng mở rộng. Mục này không chỉ nhìn vào việc hệ thống chạy được trong thực nghiệm, mà xem xét liệu hệ thống có hợp lý khi triển khai cho hội nghị thật hay không.

#### 5.6.1 Độ trễ và token tiêu thụ
Trình bày thời gian xử lý và lượng token tiêu thụ của các workflow AI hoặc tác vụ có sử dụng mô hình ngôn ngữ. Nội dung cần liên hệ các con số này với trải nghiệm người dùng, đặc biệt là tác vụ cần phản hồi trực tiếp và tác vụ có thể chạy bất đồng bộ.

#### 5.6.2 Chi phí xử lý một bài báo
Ước tính chi phí cần thiết để xử lý một bài báo hoặc một đơn vị dữ liệu đầu vào. Mục này giúp lượng hóa tính thực tiễn của giải pháp, đồng thời so sánh chi phí AI với quy mô vận hành thường gặp của một hội nghị học thuật.

#### 5.6.3 Rate limit và khả năng mở rộng
Phân tích các giới hạn khi số lượng người dùng, bài nộp hoặc workflow AI tăng lên. Cần chỉ ra những bottleneck có thể xuất hiện, chẳng hạn cơ sở dữ liệu, hàng đợi xử lý, giới hạn request của nhà cung cấp mô hình và hướng tối ưu phù hợp.

### 5.7 Khảo sát người dùng sau sử dụng
Trình bày phản hồi của người dùng sau khi trải nghiệm hệ thống ở các vai trò khác nhau. Mục này phải được đặt sau các kết quả kỹ thuật để người đọc có thể đối chiếu cảm nhận người dùng với dữ liệu benchmark và đánh giá AI đã trình bày trước đó.

#### 5.7.1 Phương pháp và mẫu khảo sát
Mô tả cách thiết kế khảo sát sau sử dụng, nhóm người tham gia, vai trò được khảo sát, thang đo sử dụng và các nhóm câu hỏi chính. Nội dung cần cho thấy khảo sát được dùng để đánh giá trải nghiệm thực tế, không lặp lại khảo sát nhu cầu ban đầu ở Chương 2.

#### 5.7.2 Kết quả theo vai trò Chủ tọa
Phân tích phản hồi của nhóm Chủ tọa đối với các chức năng quản lý hội nghị, gợi ý phản biện, kiểm tra xung đột lợi ích, tổng hợp phản biện và các tính năng AI hỗ trợ ra quyết định. Cần chỉ ra cả điểm mạnh và điểm cần cải thiện cho vai trò này.

#### 5.7.3 Kết quả theo vai trò Người phản biện
Phân tích phản hồi của nhóm Người phản biện đối với quy trình nhận bài, đọc bài, nhập nhận xét, gửi đánh giá và sử dụng công cụ AI hỗ trợ. Nội dung cần làm rõ AI có giúp reviewer làm việc hiệu quả hơn hay tạo thêm lo ngại về độ tin cậy.

#### 5.7.4 Kết quả theo vai trò Tác giả
Phân tích phản hồi của nhóm Tác giả đối với quy trình nộp bài, tự động điền thông tin, khai báo xung đột lợi ích, nhận thông báo và tương tác với hệ thống. Cần chú ý các điểm nhạy cảm liên quan đến dữ liệu cá nhân, minh bạch và niềm tin.

#### 5.7.5 Tổng hợp xuyên vai trò
Tổng hợp các phát hiện chung từ ba nhóm người dùng, đặc biệt là các điểm nghẽn lặp lại ở nhiều vai trò như khả năng giải thích của AI, độ dễ sử dụng hoặc mức độ tin tưởng vào gợi ý của hệ thống. Mục này tạo cầu nối trực tiếp sang phần tổng hợp cuối chương.

### 5.8 Tổng hợp kết quả đánh giá
Tổng hợp các kết quả chính của chương theo hướng trả lời lại các câu hỏi đánh giá đã nêu ở mục 5.1. Mục này cần kết nối benchmark kỹ thuật, đánh giá AI và khảo sát người dùng thành một kết luận nhất quán, thay vì chỉ liệt kê lại từng nhóm số liệu.

#### 5.8.1 Mức độ đáp ứng nhu cầu ban đầu
Đối chiếu kết quả hệ thống sau khi xây dựng với nhu cầu và ưu tiên đã khảo sát ở Chương 2. Nội dung cần chỉ ra nhu cầu nào đã được đáp ứng tốt, nhu cầu nào mới được đáp ứng một phần và nhu cầu nào còn là khoảng trống.

#### 5.8.2 Các phát hiện nhất quán giữa benchmark và khảo sát người dùng
Phân tích những điểm mà dữ liệu kỹ thuật và phản hồi người dùng cùng chỉ về một kết luận, chẳng hạn workflow nào có hiệu quả rõ ràng, điểm nghẽn nào người dùng cũng cảm nhận được, hoặc giới hạn nào cần ưu tiên cải thiện.

#### 5.8.3 Hạn chế cần chuyển sang Chương 6
Tóm tắt các hạn chế đã được phát hiện qua thực nghiệm và khảo sát, nhưng chỉ ở mức định hướng để Chương 6 tiếp tục trình bày đầy đủ hơn. Mục này giúp Chương 6 không xuất hiện đột ngột mà là phần tiếp nối tự nhiên từ bằng chứng ở Chương 5.

## Chương 6. Kết luận

### 6.1 Kết quả đạt được
Tổng hợp những nội dung chính mà đề tài đã hoàn thành so với mục tiêu ban đầu. Mục này cần nhấn mạnh các kết quả về hệ thống, khả năng đáp ứng nhu cầu người dùng và hiệu quả của giải pháp được xây dựng.

### 6.2 Các hạn chế
Trình bày những giới hạn còn tồn tại của đề tài, có thể liên quan đến dữ liệu, workflow AI, độ hoàn thiện hệ thống, triển khai thực tế hoặc chi phí vận hành. Phần này nên viết thẳng, rõ và bám sát các kết quả đánh giá ở Chương 5.

### 6.3 Hướng phát triển trong tương lai
Đề xuất các hướng cải tiến hoặc mở rộng có thể thực hiện sau đề tài. Nội dung cần liên hệ trực tiếp với các hạn chế đã nêu, đồng thời chỉ ra các cơ hội để hệ thống trở nên hoàn thiện, chính xác và khả thi hơn trong thực tế.

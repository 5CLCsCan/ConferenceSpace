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
Trình bày định hướng giải pháp ở mức khái niệm, bao gồm cách hệ thống phản hồi trực tiếp với các khoảng trống đã xác định và các nguyên tắc thiết kế chủ đạo như tách lớp nghiệp vụ cốt lõi, cơ chế thuật toán xác định và AI hỗ trợ. Phần này chỉ nên giới thiệu vai trò của các hướng giải pháp; các quyết định thiết kế, công nghệ và triển khai cụ thể sẽ được trình bày ở Chương 3.

### 2.4 Tổng hợp yêu cầu hệ thống từ khảo sát
Tổng hợp các yêu cầu rút ra từ khảo sát nhu cầu, khảo sát hiện trạng và khoảng trống nghiên cứu. Mục này đóng vai trò cầu nối giữa Chương 2 và Chương 3, giúp người đọc thấy rõ vì sao hệ thống cần những chức năng và nguyên tắc thiết kế được trình bày ở chương sau.

#### 2.4.1 Yêu cầu chức năng
Liệt kê và nhóm các chức năng hệ thống cần hỗ trợ theo từng vai trò như Tác giả, Người phản biện, Chủ tọa và Quản trị viên. Nội dung cần cho thấy mỗi nhóm chức năng xuất phát từ nhu cầu hoặc khoảng trống cụ thể đã phân tích ở các mục trước.

#### 2.4.2 Yêu cầu phi chức năng
Trình bày các yêu cầu về hiệu năng, bảo mật, khả năng mở rộng, độ tin cậy, khả năng sử dụng, tính minh bạch và khả năng giải thích. Đây là cơ sở để đánh giá các quyết định kiến trúc, công nghệ và triển khai ở Chương 3.

#### 2.4.3 Nguyên tắc sử dụng AI có trách nhiệm
Nêu các nguyên tắc giới hạn vai trò của AI trong hệ thống, chẳng hạn AI chỉ hỗ trợ chứ không thay thế quyết định học thuật, người dùng phải có quyền xem lại và ghi đè kết quả, các gợi ý cần có căn cứ hoặc giải thích, và hệ thống phải vận hành được khi dịch vụ AI không khả dụng.

## Chương 3. Xây dựng hệ thống

### 3.1 Tổng quan hệ thống
Giới thiệu mục tiêu xây dựng ConferenceSpace, các nhóm người dùng chính, phạm vi nghiệp vụ được hệ thống hỗ trợ và cách chương này nối trực tiếp với các yêu cầu đã rút ra ở Chương 2. Phần này giúp người đọc hình dung bức tranh chung trước khi đi vào use case, thiết kế kỹ thuật, cơ chế nghiệp vụ và thuật toán xác định, workflow AI và môi trường triển khai.

#### 3.1.1 Mô hình phân lớp của hệ thống
Trình bày cách hệ thống được chia thành các lớp trách nhiệm chính, bao gồm lớp nghiệp vụ cốt lõi, lớp cơ chế xác định và lớp AI hỗ trợ. Mục này cần làm rõ vì sao việc phân lớp giúp hệ thống vừa đáp ứng nhu cầu nghiệp vụ, vừa kiểm soát được rủi ro khi đưa AI vào quy trình học thuật.

#### 3.1.2 Nguyên tắc thiết kế hệ thống
Nêu các nguyên tắc thiết kế chi phối toàn bộ kiến trúc, chẳng hạn tách biệt trách nhiệm, ưu tiên kết quả có thể giải thích, không để AI quyết định thay con người, xử lý lỗi rõ ràng và đảm bảo hệ thống vẫn hoạt động khi một thành phần phụ trợ không khả dụng.

#### 3.1.3 Lựa chọn công nghệ ở mức tổng quan
Tóm tắt các công nghệ chính được sử dụng trong hệ thống như Next.js/React, Go/Gin, PostgreSQL, Neo4j, Redis, FastAPI/Pydantic, `gemini-3.1-flash-lite`, Docker Compose, Caddy và GitHub Actions. Phần này chỉ đóng vai trò bản đồ định hướng; lý do và vai trò của từng công nghệ sẽ được giải thích tại các mục thiết kế tương ứng thay vì tách thành một chương công nghệ riêng.

### 3.2 Use Case

#### 3.2.1 Tác nhân hệ thống
Xác định các tác nhân tương tác với hệ thống như người dùng cuối, quản trị viên và các dịch vụ liên quan. Cần mô tả vai trò của từng tác nhân và mối quan hệ của họ với các chức năng chính của hệ thống.

#### 3.2.2 Các use case chính
Trình bày các chức năng chính mà hệ thống cung cấp cho từng tác nhân. Nội dung nên thể hiện hệ thống hỗ trợ người dùng thực hiện những tác vụ nào và từng tác vụ đóng vai trò gì trong quy trình nghiệp vụ tổng thể.

#### 3.2.3 Đặc tả use case quan trọng
Mô tả chi tiết các use case trọng tâm, bao gồm mục tiêu, điều kiện thực hiện, luồng xử lý chính, các trường hợp ngoại lệ và đầu ra. Phần này giúp liên kết nhu cầu người dùng với cách hệ thống được thiết kế để phục vụ nhu cầu đó.

### 3.3 Thiết kế kỹ thuật

#### 3.3.1 Kiến trúc tổng thể
Trình bày kiến trúc tổng thể của hệ thống, bao gồm frontend, backend nghiệp vụ, AI service, cơ sở dữ liệu, cache, graph database, reverse proxy và các thành phần hỗ trợ khác. Nội dung cần làm rõ cách các thành phần phối hợp với nhau để đảm bảo hệ thống hoạt động ổn định, có khả năng mở rộng và giữ được ranh giới giữa nghiệp vụ, cơ chế xác định và AI hỗ trợ.

#### 3.3.2 Thiết kế frontend và trải nghiệm theo vai trò
Mô tả cách frontend được tổ chức bằng Next.js, React, TypeScript, Radix UI và Tailwind CSS để phục vụ các luồng nhiều vai trò như tác giả, người phản biện và chủ tọa. Phần này cần tập trung vào cách công nghệ giao diện hỗ trợ điều hướng, trạng thái, dashboard, form phức tạp, realtime notification và trải nghiệm nhất quán, không chỉ liệt kê thư viện.

#### 3.3.3 Thiết kế backend, API và phân quyền
Mô tả cấu trúc backend Go/Gin, cách tổ chức module nghiệp vụ, API contract, xác thực JWT, phân quyền theo vai trò trong từng hội nghị và giao tiếp với AI service. Mục này cần nhấn mạnh tính rõ ràng trong thiết kế, khả năng bảo trì, khả năng kiểm soát quyền truy cập và khả năng tích hợp với các workflow AI mà không làm mờ ranh giới trách nhiệm của backend.

#### 3.3.4 Thiết kế dữ liệu
Trình bày mô hình dữ liệu chính của hệ thống, bao gồm dữ liệu nghiệp vụ trong PostgreSQL, dữ liệu quan hệ học thuật và COI trong Neo4j/PostgreSQL, cache/session/runtime state trong Redis, file bài nộp và artifact AI. Phần này cần làm rõ dữ liệu được lưu trữ, liên kết, truy vết và khai thác như thế nào để phục vụ toàn bộ hệ thống.

#### 3.3.5 Luồng xử lý hệ thống
Mô tả dòng chảy của dữ liệu và thao tác từ lúc hệ thống nhận đầu vào đến khi trả đầu ra cho người dùng. Nội dung này nên làm rõ từng bước xử lý chính, các điểm chuyển giao giữa frontend, backend, database, AI service và các thành phần hạ tầng.

### 3.4 Cơ chế nghiệp vụ và thuật toán xác định

#### 3.4.1 Vai trò của các cơ chế xác định
Giải thích các thành phần xử lý nghiệp vụ và thuật toán xác định có vai trò quan trọng trong hệ thống, đặc biệt là những cơ chế có kết quả nhất quán, có thể giải thích và có thể kiểm thử bằng benchmark deterministic. Phần này giúp tách rõ reviewer matching, COI, phân quyền, thông báo và workflow nghiệp vụ khỏi các workflow AI.

#### 3.4.2 Reviewer matching
Trình bày cơ chế gợi ý hoặc phân công người phản biện dựa trên thông tin bài nộp, lĩnh vực chuyên môn, hồ sơ học thuật, tải công việc và các ràng buộc nghiệp vụ. Nội dung cần nhấn mạnh reviewer matching là cơ chế thuật toán xác định hoặc bán xác định, không phải workflow sinh nội dung bằng AI.

#### 3.4.3 Phát hiện xung đột lợi ích
Mô tả các lớp phát hiện COI như tự phản biện, khai báo thủ công, trùng tác giả, quan hệ đồng tác giả và quan hệ học thuật nhiều bậc. Mục này cần làm rõ nguồn dữ liệu, cách tạo bằng chứng, mức độ nghiêm trọng và vai trò kiểm tra cuối cùng của Chair.

#### 3.4.4 Các cơ chế nghiệp vụ hỗ trợ vận hành
Trình bày các cơ chế nghiệp vụ khác như phân quyền theo hội nghị, notification realtime, rebuttal workflow, discussion thread, audit event và kiểm soát trạng thái. Phần này giúp hội đồng thấy hệ thống không phụ thuộc vào AI để vận hành các quy trình cốt lõi.

### 3.5 Giải pháp AI

#### 3.5.1 Vai trò của AI trong hệ thống
Giải thích AI được đưa vào hệ thống để hỗ trợ công đoạn nào, giải quyết hạn chế gì của quy trình hiện tại và mang lại lợi ích gì so với cách xử lý thông thường. Phần này cần gắn trực tiếp với nhu cầu đã khảo sát ở Chương 2 để tránh cảm giác AI chỉ được thêm vào cho có.

#### 3.5.2 Các workflow có sử dụng AI
Giới thiệu tổng quan các quy trình trong hệ thống mà AI tham gia xử lý, sau đó phân nhóm theo vai trò người dùng và vị trí của workflow trong quy trình hội nghị. Phần này cần nhấn mạnh rằng mỗi workflow tạo đầu ra hỗ trợ để người dùng kiểm tra lại, không tự động thay thế quyết định học thuật.

##### 3.5.2.1 Submission Autofill
Trình bày workflow hỗ trợ tác giả chuẩn bị form nộp bài từ bản thảo, gồm trích xuất metadata, chuẩn hóa thông tin, gợi ý keyword và gợi ý track như các khả năng bên trong Submission Autofill. Mục này cần làm rõ đầu vào, đầu ra, điểm tác giả xác nhận và giới hạn của việc tự động điền thông tin.

##### 3.5.2.2 Submission Gating
Trình bày workflow kiểm tra sơ bộ bản thảo trước khi nộp hoặc trước khi publish, gồm kiểm tra luật nộp bài, cảnh báo lỗi hình thức và hỗ trợ điều hướng nội dung cần xem lại. Mục này cần tách rõ phần rule deterministic với phần cảnh báo hỗ trợ dùng AI, đồng thời nhấn mạnh workflow không tự động thay Chair loại bài vì nhận định nội dung.

##### 3.5.2.3 Reviewer Initial Analysis
Trình bày workflow hỗ trợ người phản biện đọc hiểu bài nộp ban đầu, gồm tóm tắt trung lập, nhận diện điểm cần kiểm tra kỹ và tổ chức các ghi chú ban đầu. Nội dung cần nhấn mạnh AI giúp reviewer định hướng đọc, nhưng reviewer vẫn chịu trách nhiệm đọc bài và viết đánh giá chuyên môn.

##### 3.5.2.4 Review Quality Auditor
Trình bày workflow kiểm tra chất lượng bản nháp phản biện, gồm phát hiện phản biện thiếu căn cứ, thiếu chiều sâu, không nhất quán hoặc có nguy cơ không đáp ứng yêu cầu biểu mẫu. Mục này cần nhấn mạnh auditor là công cụ hỗ trợ tự kiểm tra hoặc hỗ trợ Chair, không phải bộ lọc tự động quyết định review đạt hay không đạt.

##### 3.5.2.5 Chair Decision Copilot
Trình bày workflow hỗ trợ Chair tổng hợp review, rebuttal, điểm đồng thuận, điểm mâu thuẫn và bằng chứng liên quan trước khi ra quyết định. Mục này cần khẳng định workflow chỉ hỗ trợ tổng hợp evidence, không sinh quyết định accept/reject thay Chair.

##### 3.5.2.6 Chatbot Agent của nền tảng
Trình bày Chatbot Agent như một workflow hội thoại có khả năng gọi công cụ truy vấn dữ liệu hệ thống trong phạm vi quyền được cấp. Nội dung cần làm rõ cơ chế kiểm soát quyền, tool-call, streaming response và giới hạn dữ liệu mà agent được phép truy cập.

##### 3.5.2.7 Các kiểm soát chung cho workflow AI
Tổng hợp các kiểm soát chung như structured output, validation schema, artifact fingerprint, trạng thái run, stage record, logging, timeout, retry có kiểm soát và fallback thủ công. Mục này giúp tránh lặp lại cùng một cơ chế kiểm soát trong từng workflow riêng lẻ.

#### 3.5.3 AI Service, model router và structured output
Mô tả cách AI service được xây dựng bằng FastAPI/Pydantic, cách hệ thống gọi `gemini-3.1-flash-lite` qua model router hoặc OpenAI-compatible client của nhóm, cách validate structured output, lưu artifact và xử lý lỗi. Phần này cần làm rõ AI service là lớp hỗ trợ có hợp đồng đầu ra, không phải nơi quyết định nghiệp vụ cuối cùng.

#### 3.5.4 Tích hợp nguồn dữ liệu học thuật bên ngoài
Trình bày cách hệ thống dùng Semantic Scholar API và cache học thuật để làm giàu hồ sơ tác giả, bài báo và quan hệ đồng tác giả. Mục này cần liên hệ với reviewer matching và COI, đồng thời nêu rõ giới hạn của dữ liệu bên ngoài và quyền kiểm tra/ghi đè của Chair.

#### 3.5.5 Ưu điểm và giới hạn của các workflow AI
Phân tích lợi ích của việc sử dụng AI trong từng workflow như giảm thao tác thủ công, hỗ trợ đọc bài, kiểm tra chất lượng phản biện hoặc tổng hợp bằng chứng. Đồng thời, mục này cũng cần nêu rõ các giới hạn như phụ thuộc dữ liệu, khả năng sai ngữ cảnh, chi phí tính toán, độ trễ, nhu cầu kiểm duyệt đầu ra và nguyên tắc không thay thế quyết định học thuật.

### 3.6 Môi trường triển khai và vận hành

#### 3.6.1 Kiến trúc triển khai production
Trình bày topology triển khai thực tế của hệ thống, gồm Caddy gateway, Next.js web, Go backend, AI service, PostgreSQL, Redis, Neo4j, migration job, volumes và networks. Phần này cần chứng minh hệ thống không chỉ chạy ở môi trường phát triển mà có cấu trúc triển khai có thể tái lập.

#### 3.6.2 Docker Compose và container images
Mô tả cách Docker Compose khai báo service, network, volume, healthcheck, migration job và biến môi trường. Nội dung nên dùng bảng hoặc snippet ngắn từ `deployment/docker-compose.prod.yml`, không đưa toàn bộ file vào thân chương. Cần nêu rõ frontend, backend và AI service được build thành image riêng.

#### 3.6.3 Cấu hình server và biến môi trường
Trình bày cấu hình server ở mức cần thiết cho báo cáo, bao gồm Docker Engine, Docker Compose plugin, firewall, thư mục deploy, `.env.production`, biến public URL, database, Redis, Neo4j, backend runtime, AI service runtime, service token và model provider. Không đưa secret thật vào báo cáo.

#### 3.6.4 Reverse proxy, HTTPS và routing
Mô tả vai trò của Caddy trong việc nhận request public, tự động HTTPS, nén nội dung, reverse proxy tới web/backend và hỗ trợ WebSocket. Phần này cần giải thích vị trí của proxy trong ranh giới truy cập thay vì chỉ liệt kê cấu hình.

#### 3.6.5 CI/CD, GitHub Actions và GHCR
Trình bày pipeline build, push và deploy qua GitHub Actions, bao gồm việc build image frontend/backend/AI service, push lên GitHub Container Registry, dùng image tag theo commit SHA/digest, copy file triển khai lên server, chạy migration và `docker compose up -d`. Có thể đặt anchor hình cho GitHub Actions/GHCR để nhóm chèn screenshot sau.

#### 3.6.6 Network isolation, volume và bảo mật secret
Phân tích cách triển khai tách public gateway khỏi data network, dùng volume bền vững cho PostgreSQL/Redis/Neo4j/uploads/Caddy, giới hạn truy cập service nội bộ và quản lý secret qua environment/server configuration. Mục này giúp liên kết yêu cầu bảo mật và khả năng vận hành với triển khai thực tế.

### 3.7 Tổng kết chương
Tổng hợp lại cách hệ thống được xây dựng từ yêu cầu người dùng ở Chương 2: use case xác định chức năng, thiết kế kỹ thuật hiện thực hóa chức năng, cơ chế nghiệp vụ và thuật toán xác định xử lý các quy trình cần tính nhất quán, AI hỗ trợ các tác vụ cần đọc hiểu/tổng hợp, và môi trường triển khai chứng minh hệ thống có thể vận hành thực tế. Phần này cần tạo cầu nối trực tiếp sang chương đánh giá thực nghiệm.

## Chương 4. Thiết lập thực nghiệm và đánh giá hệ thống

### 4.1 Mục tiêu và câu hỏi đánh giá
Nêu rõ Chương 4 không chỉ kiểm tra hệ thống có chạy được hay không, mà đánh giá toàn diện ba lớp chính của ConferenceSpace: lớp nghiệp vụ cốt lõi, lớp thuật toán xác định và lớp AI hỗ trợ. Mục này cần xác định các câu hỏi đánh giá chính, tiêu chí thành công và cách các kết quả ở chương này liên kết trở lại với nhu cầu người dùng đã khảo sát ở Chương 2.

#### 4.1.1 Các lớp cần đánh giá
Giới thiệu các lớp được đánh giá trong chương, bao gồm hiệu năng của backend nghiệp vụ, chất lượng và chi phí của thuật toán đối sánh/phát hiện xung đột lợi ích, chất lượng của các workflow AI và phản hồi thực tế của người dùng sau khi trải nghiệm hệ thống. Việc phân lớp giúp tránh trộn lẫn giữa đánh giá kỹ thuật, đánh giá AI và khảo sát người dùng.

#### 4.1.2 Câu hỏi đánh giá và tiêu chí thành công
Trình bày các câu hỏi mà phần thực nghiệm cần trả lời, chẳng hạn hệ thống có đáp ứng tải vận hành hay không, thuật toán có đủ nhanh cho tương tác thực tế hay không, các workflow AI có tạo ra đầu ra đáng tin cậy hay không và người dùng có hài lòng khi sử dụng hay không. Với mỗi câu hỏi, cần nêu tiêu chí hoặc chỉ số dùng để kết luận.

#### 4.1.3 Liên kết với nhu cầu người dùng ở Chương 2
Giải thích cách các nội dung đánh giá trong chương này kiểm chứng lại những nhu cầu và ưu tiên đã được phát hiện ở Chương 2. Mục này chỉ đóng vai trò định hướng, còn phần đối chiếu kết quả đầy đủ sẽ được tổng hợp ở cuối chương sau khi đã trình bày toàn bộ số liệu thực nghiệm và khảo sát người dùng.

### 4.2 Thiết lập thực nghiệm
Trình bày điều kiện, dữ liệu, công cụ và quy trình dùng để tạo ra các kết quả đánh giá. Mục này chỉ nên mô tả cách thực nghiệm được tiến hành, không đưa kết quả khảo sát hoặc diễn giải chất lượng hệ thống vào đây.

#### 4.2.1 Dữ liệu thực nghiệm
Mô tả các tập dữ liệu được sử dụng cho từng nhóm đánh giá, bao gồm dữ liệu phục vụ benchmark backend, dữ liệu thử nghiệm thuật toán, dữ liệu bài báo dùng để đánh giá các workflow AI và dữ liệu thu được từ khảo sát người dùng sau sử dụng. Cần làm rõ nguồn gốc, quy mô, phạm vi và giới hạn của từng loại dữ liệu.

#### 4.2.2 Môi trường thực nghiệm
Trình bày cấu hình phần cứng, phần mềm, hạ tầng triển khai và các dịch vụ liên quan được dùng trong quá trình đo lường. Nội dung cần tách rõ môi trường benchmark backend, môi trường chạy workflow AI và môi trường khảo sát người dùng để người đọc hiểu kết quả được tạo ra trong điều kiện nào.

#### 4.2.3 Kịch bản và chỉ số đánh giá
Mô tả các kịch bản thực nghiệm và bộ chỉ số tương ứng cho từng lớp đánh giá. Ví dụ, backend có thể được đánh giá bằng độ trễ, thông lượng và tỷ lệ lỗi; thuật toán được đánh giá bằng thời gian xử lý và khả năng giải thích; workflow AI được đánh giá bằng các chỉ số phù hợp với từng loại đầu ra; khảo sát người dùng được đánh giá bằng mức độ hài lòng, độ dễ sử dụng và phản hồi định tính.

#### 4.2.4 Phạm vi và giới hạn của thực nghiệm
Nêu rõ những gì thực nghiệm có thể và không thể chứng minh. Mục này giúp đặt đúng kỳ vọng cho người đọc, tránh diễn giải quá mức từ dữ liệu benchmark hoặc khảo sát có quy mô giới hạn.

#### 4.2.5 Bộ dữ liệu đối chứng và quy trình chấm điểm benchmark
Trình bày các bộ dữ liệu và quy trình chấm điểm được dùng cho từng nhóm benchmark. Với lớp thuật toán xác định, cần mô tả dữ liệu dùng để đánh giá reviewer matching và phát hiện xung đột lợi ích. Với lớp AI hỗ trợ, cần nêu rõ dataset workflow runner, tập kết quả được đưa vào TCA benchmark, các benchmark hợp đồng riêng cho Submission Gating và gợi ý track trong Submission Autofill, cùng bộ kịch bản hội thoại của Chatbot Agent. Mục này phải làm rõ mẫu số, nguồn dữ liệu, ground truth hoặc proxy đánh giá, cách chuẩn hóa đầu ra, cách chấm điểm tự động hoặc bán tự động, và giới hạn của từng tập dữ liệu. Nếu một workflow chưa có nhãn chuyên gia, chỉ được kết luận theo metric hiện có, không suy diễn thành độ chính xác chuyên môn.

### 4.3 Đánh giá lớp nghiệp vụ cốt lõi
Đánh giá khả năng vận hành của các chức năng backend chính trong điều kiện tải thử nghiệm. Mục này tập trung vào hiệu năng, độ ổn định và tài nguyên tiêu thụ của hệ thống nghiệp vụ, không trộn với đánh giá thuật toán hoặc AI.

#### 4.3.1 Kịch bản tải HTTP
Trình bày các endpoint, nhóm thao tác hoặc quy trình nghiệp vụ được đưa vào kiểm thử tải. Cần giải thích vì sao các kịch bản này đại diện cho hoạt động thực tế của hệ thống quản lý hội nghị.

#### 4.3.2 Kết quả hiệu năng backend
Phân tích các kết quả như độ trễ trung bình, trung vị, p90/p95, thông lượng và tỷ lệ lỗi. Nội dung cần chỉ ra hệ thống đáp ứng tốt ở điểm nào, còn điểm nào có nguy cơ trở thành bottleneck khi mở rộng.

#### 4.3.3 Tài nguyên tiêu thụ và điểm nghẽn vận hành
Trình bày mức sử dụng CPU, bộ nhớ, cơ sở dữ liệu và các thành phần hạ tầng trong quá trình benchmark. Mục này cần liên hệ kết quả tài nguyên với thiết kế triển khai đã trình bày ở Chương 3.

### 4.4 Đánh giá lớp thuật toán xác định
Đánh giá các thành phần thuật toán có kết quả nhất quán và có thể giải thích được, đặc biệt là đối sánh phản biện và phát hiện xung đột lợi ích. Mục này cần tách khỏi phần AI vì bản chất đánh giá, rủi ro và tiêu chí thành công của thuật toán xác định khác với workflow AI.

#### 4.4.1 Thuật toán đối sánh phản biện
Trình bày cách đánh giá hiệu năng của thuật toán gợi ý hoặc phân công phản biện, bao gồm thời gian xử lý, khả năng hoạt động ở các quy mô dữ liệu khác nhau và tài nguyên tiêu thụ khi số lượng bài nộp hoặc phản biện tăng lên. Mục này tập trung vào tốc độ và khả năng mở rộng, chưa dùng để kết luận về chất lượng chuyên môn của đề xuất.

#### 4.4.2 Độ chính xác và chất lượng của reviewer matching
Đánh giá mức độ phù hợp chuyên môn của các gợi ý hoặc phân công phản biện bằng các chỉ số như Precision@K, Recall@K, coverage, average assigned score, load balance, fallback rate và mức độ chênh lệch so với baseline tối ưu trên tập dữ liệu nhỏ. Nếu sử dụng dữ liệu chair-labeled hoặc historical assignment làm ground truth, cần mô tả rõ nguồn nhãn và giới hạn khi so sánh với quyết định của con người.

#### 4.4.3 Cơ chế phát hiện xung đột lợi ích
Đánh giá cơ chế phát hiện xung đột lợi ích theo các lớp kiểm tra đã thiết kế, chẳng hạn tự phản biện, khai báo thủ công và quan hệ đồng tác giả. Nội dung cần làm rõ cơ chế này đóng góp gì cho tính minh bạch và an toàn của quy trình xét duyệt.

#### 4.4.4 Giới hạn hiện tại về chất lượng đề xuất
Tổng hợp những chỉ số hoặc thí nghiệm còn thiếu đối với lớp thuật toán, chẳng hạn mức độ phù hợp chuyên môn của gợi ý phản biện, tỷ lệ chấp nhận đề xuất của chủ tọa hoặc số lượng xung đột lợi ích ẩn được phát hiện thêm. Mục này giúp tránh kết luận quá mạnh nếu thực nghiệm hiện tại mới chứng minh tốc độ xử lý.

### 4.5 Đánh giá các workflow AI
Đánh giá chất lượng, độ tin cậy, giá trị bổ sung và giới hạn vận hành của các workflow AI trong hệ thống. Mục này cần chọn chỉ số phù hợp với từng workflow thay vì dùng một khuôn đánh giá chung cho mọi đầu ra AI. Toàn bộ phần này phải giữ đúng nguyên tắc của đề tài: AI hỗ trợ nhập liệu, đọc hiểu, kiểm tra và tổng hợp; AI không thay thế quyết định học thuật cuối cùng của tác giả, phản biện hoặc chủ tọa.

#### 4.5.1 Kiến trúc benchmark workflow AI và nguyên tắc diễn giải kết quả
Trình bày kiến trúc benchmark hai lớp gồm workflow runner và TCA benchmark. Workflow runner chạy các workflow trên dataset, sinh output thật, lưu thời gian xử lý, token tiêu thụ, trạng thái hoàn tất và các metric deterministic khi có dữ liệu tham chiếu rõ. TCA benchmark đọc lại output đã lưu để đánh giá các đầu ra tự luận theo truthfulness, coverage và additionality. Chatbot Agent được đánh giá riêng theo kịch bản hội thoại, tool-call success, quyền truy cập và trải nghiệm stream. Mục này cần giải thích vì sao generator và evaluator được tách rời, vì sao mỗi workflow cần metric riêng, và vì sao coverage thấp không luôn đồng nghĩa với chất lượng thấp nếu truthfulness và additionality được diễn giải đúng bối cảnh.

#### 4.5.2 Tổng hợp mức bằng chứng theo workflow
Đặt một bảng tổng hợp trước khi đi vào từng workflow. Bảng này nên gồm: workflow, nguồn số liệu chính, mẫu số, metric chính, kết luận được phép rút ra và giới hạn cần giữ khi viết báo cáo. Mục tiêu là giúp người đọc phân biệt giữa benchmark có ground truth rõ, benchmark dùng proxy claim/evidence, benchmark hợp đồng đầu ra và benchmark thủ công theo kịch bản. Bảng này cũng là chốt kiểm soát để tránh overclaim, ví dụ không biến gợi ý track chưa có nhãn chuyên gia thành top-1 accuracy, không biến Review Quality Auditor thành hệ thống tự động chấm review, và không biến Chair Decision Copilot thành bộ phân loại accept/reject.

#### 4.5.3 Submission Autofill
Đánh giá Submission Autofill như một workflow hỗ trợ tác giả chuẩn bị form nộp bài từ bản thảo PDF và ngữ cảnh hội nghị. Mục này cần tách rõ hai nhóm đánh giá chính: pipeline metadata dùng để tạo các trường form có thể chỉnh sửa, và phần gợi ý track dựa trên danh sách track chính thức của hội nghị đang hoạt động. Toàn bộ đầu ra vẫn là gợi ý; người dùng phải xem lại trước khi gửi chính thức.

##### 4.5.3.1 Pipeline trích xuất và chuẩn bị metadata cho form
Đánh giá toàn bộ pipeline tạo metadata cho form nộp bài, bao gồm trích xuất thông tin từ bản thảo, chuẩn hóa giá trị để đưa vào form, xử lý trường bị thiếu hoặc bị nhiễu do quá trình đọc PDF, và mở rộng keyword khi ngữ cảnh bài báo/hội nghị cho phép. Các trường cần đánh giá gồm tiêu đề, tóm tắt, tác giả, email, affiliation, quốc gia, keyword gốc và keyword bổ sung. Các chỉ số nên bao gồm exact match hoặc normalized match cho tiêu đề, ROUGE hoặc semantic similarity cho abstract, F1 cho tác giả và keyword gốc, precision của keyword bổ sung, tỷ lệ keyword quá chung chung, tỷ lệ sửa sai làm thay đổi sự thật trong bản thảo và tỷ lệ file có đủ text coverage để workflow tiếp tục xử lý.

##### 4.5.3.2 Gợi ý track trong Submission Autofill
Đánh giá phần gợi ý track nằm bên trong Submission Autofill, dựa trên hội nghị đang hoạt động, danh sách track chính thức của hội nghị và thông tin bài nộp đã được trích xuất hoặc phục hồi. Mục này không đánh giá workflow track recommendation độc lập. Với benchmark hiện tại, phần này chỉ nên kết luận về tỷ lệ hoàn tất, invalid track rate, duplicate track rate, độ trễ và khả năng giữ track trong danh sách hợp lệ. Các chỉ số Top-1 accuracy, Top-3 accuracy, MRR hoặc NDCG@K chỉ được đưa vào nếu có nhãn chuyên gia hoặc ground truth track đủ rõ.

#### 4.5.4 Submission Gating
Đánh giá workflow kiểm tra sơ bộ bản thảo trước khi nộp hoặc trước khi publish, bao gồm độ chính xác của verdict pass/warn/block, precision và recall của block decision, F1 theo từng rule cảnh báo, false block rate, chất lượng guidance cho tác giả và độ trễ theo từng stage xử lý. Mục này cần tách rõ rule deterministic với phần đánh giá nội dung có sử dụng LLM.

#### 4.5.5 Reviewer Initial Analysis
Đánh giá workflow hỗ trợ người phản biện đọc hiểu bài nộp ban đầu, bao gồm mức độ trung thực của các trích dẫn, độ hữu ích của phần tóm tắt và khả năng cung cấp điểm lưu ý có căn cứ. Nội dung cần làm rõ workflow này hỗ trợ reviewer, không thay thế việc đọc và đánh giá học thuật của reviewer.

#### 4.5.6 Review Quality Auditor
Đánh giá workflow kiểm toán chất lượng phản biện, bao gồm khả năng phát hiện phản biện thiếu căn cứ, thiếu chiều sâu hoặc không nhất quán. Mục này cần phân tích thẳng các giới hạn của việc dùng AI để đánh giá một loại đầu ra vốn đòi hỏi suy luận ngữ cảnh rộng. Nếu benchmark cho thấy grounded-valid rate hoặc truthfulness chưa đủ cao, phải trình bày auditor như danh sách kiểm tra hỗ trợ chair, không phải bộ lọc tự động quyết định review đạt hay không đạt.

#### 4.5.7 Chair Decision Copilot
Đánh giá workflow hỗ trợ chủ tọa tổng hợp phản biện, rebuttal và các điểm đồng thuận hoặc mâu thuẫn. Nội dung cần nhấn mạnh rằng workflow này cung cấp bằng chứng và tổng hợp thông tin, không tự động quyết định chấp nhận hay từ chối bài báo. Nếu chưa có benchmark decision label match, không được kết luận hệ thống dự đoán đúng quyết định accept/reject.

#### 4.5.8 Chatbot Agent của nền tảng
Đánh giá chatbot như một agent có khả năng dùng công cụ truy vấn dữ liệu hệ thống, không chỉ như một chatbot hội thoại thông thường. Nội dung cần đo độ chính xác của câu trả lời so với dữ liệu trong hệ thống, mức độ groundedness, tỷ lệ gọi tool thành công, tỷ lệ không tiết lộ dữ liệu vượt quyền, TTFT, stream duration, timeout rate và khả năng tiếp tục phiên hội thoại.

#### 4.5.9 Các workflow chưa đánh giá đầy đủ
Nêu rõ những workflow AI chưa có thực nghiệm định lượng hoặc chưa được đánh giá sâu trong phạm vi đề tài sau khi đã tách riêng Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent. Mục này giúp giữ tính trung thực học thuật, đồng thời tạo cơ sở hợp lý cho phần hạn chế và hướng phát triển ở Chương 5.

### 4.6 Phân tích tính khả thi vận hành
Phân tích khả năng đưa hệ thống vào vận hành thực tế dựa trên chi phí, độ trễ, giới hạn dịch vụ bên ngoài và khả năng mở rộng. Mục này không chỉ nhìn vào việc hệ thống chạy được trong thực nghiệm, mà xem xét liệu hệ thống có hợp lý khi triển khai cho hội nghị thật hay không.

#### 4.6.1 Độ trễ và token tiêu thụ
Trình bày thời gian xử lý và lượng token tiêu thụ của các workflow AI hoặc tác vụ có sử dụng mô hình ngôn ngữ. Nên có bảng tổng hợp theo workflow, gồm thời gian trung bình, trung vị, cao nhất, token trung bình, token cao nhất khi có, và phân loại tác vụ nên chạy đồng bộ hay bất đồng bộ. Nội dung cần liên hệ các con số này với trải nghiệm người dùng, đặc biệt là tác vụ cần phản hồi trực tiếp như Chatbot Agent hoặc Submission Autofill, và tác vụ có thể chạy nền như Reviewer Initial Analysis, Review Quality Auditor hoặc Chair Decision Copilot.

#### 4.6.2 Chi phí xử lý một bài báo
Ước tính chi phí cần thiết để xử lý một bài báo hoặc một đơn vị dữ liệu đầu vào. Mục này giúp lượng hóa tính thực tiễn của giải pháp, đồng thời so sánh chi phí AI với quy mô vận hành thường gặp của một hội nghị học thuật.

#### 4.6.3 Rate limit và khả năng mở rộng
Phân tích các giới hạn khi số lượng người dùng, bài nộp hoặc workflow AI tăng lên. Cần chỉ ra những bottleneck có thể xuất hiện, chẳng hạn cơ sở dữ liệu, hàng đợi xử lý, giới hạn request của nhà cung cấp mô hình và hướng tối ưu phù hợp.

### 4.7 Khảo sát người dùng sau sử dụng
Trình bày phản hồi của người dùng sau khi trải nghiệm hệ thống ở các vai trò khác nhau. Mục này phải được đặt sau các kết quả kỹ thuật để người đọc có thể đối chiếu cảm nhận người dùng với dữ liệu benchmark và đánh giá AI đã trình bày trước đó.

#### 4.7.1 Phương pháp và mẫu khảo sát
Mô tả cách thiết kế khảo sát sau sử dụng, nhóm người tham gia, vai trò được khảo sát, thang đo sử dụng và các nhóm câu hỏi chính. Nội dung cần cho thấy khảo sát được dùng để đánh giá trải nghiệm thực tế, không lặp lại khảo sát nhu cầu ban đầu ở Chương 2.

#### 4.7.2 Kết quả theo vai trò Chủ tọa
Phân tích phản hồi của nhóm Chủ tọa đối với các chức năng quản lý hội nghị, gợi ý phản biện, kiểm tra xung đột lợi ích, tổng hợp phản biện và các tính năng AI hỗ trợ ra quyết định. Cần chỉ ra cả điểm mạnh và điểm cần cải thiện cho vai trò này.

#### 4.7.3 Kết quả theo vai trò Người phản biện
Phân tích phản hồi của nhóm Người phản biện đối với quy trình nhận bài, đọc bài, nhập nhận xét, gửi đánh giá và sử dụng công cụ AI hỗ trợ. Nội dung cần làm rõ AI có giúp reviewer làm việc hiệu quả hơn hay tạo thêm lo ngại về độ tin cậy.

#### 4.7.4 Kết quả theo vai trò Tác giả
Phân tích phản hồi của nhóm Tác giả đối với quy trình nộp bài, tự động điền thông tin, khai báo xung đột lợi ích, nhận thông báo và tương tác với hệ thống. Cần chú ý các điểm nhạy cảm liên quan đến dữ liệu cá nhân, minh bạch và niềm tin.

#### 4.7.5 Tổng hợp xuyên vai trò
Tổng hợp các phát hiện chung từ ba nhóm người dùng, đặc biệt là các điểm nghẽn lặp lại ở nhiều vai trò như khả năng giải thích của AI, độ dễ sử dụng hoặc mức độ tin tưởng vào gợi ý của hệ thống. Mục này tạo cầu nối trực tiếp sang phần tổng hợp cuối chương.

### 4.8 Tổng hợp kết quả đánh giá
Tổng hợp các kết quả chính của chương theo hướng trả lời lại các câu hỏi đánh giá đã nêu ở mục 4.1. Mục này cần kết nối benchmark kỹ thuật, đánh giá AI và khảo sát người dùng thành một kết luận nhất quán, thay vì chỉ liệt kê lại từng nhóm số liệu. Kết luận cuối chương phải quay lại luận điểm ở Chương 1: ConferenceSpace chứng minh một cách tích hợp AI có kiểm soát vào quy trình peer review, trong đó AI hỗ trợ các thao tác nhập liệu, kiểm tra, đọc hiểu và tổng hợp, còn quyết định học thuật vẫn thuộc về con người.

#### 4.8.1 Mức độ đáp ứng nhu cầu ban đầu
Đối chiếu kết quả hệ thống sau khi xây dựng với nhu cầu và ưu tiên đã khảo sát ở Chương 2. Nội dung cần chỉ ra nhu cầu nào đã được đáp ứng tốt, nhu cầu nào mới được đáp ứng một phần và nhu cầu nào còn là khoảng trống.

#### 4.8.2 Các phát hiện nhất quán giữa benchmark và khảo sát người dùng
Phân tích những điểm mà dữ liệu kỹ thuật và phản hồi người dùng cùng chỉ về một kết luận, chẳng hạn workflow nào có hiệu quả rõ ràng, điểm nghẽn nào người dùng cũng cảm nhận được, hoặc giới hạn nào cần ưu tiên cải thiện. Phần này nên đối chiếu trực tiếp các workflow AI với mục tiêu ở Chương 1: giảm thao tác thủ công cho tác giả, hỗ trợ reviewer đọc bài có định hướng, giúp chair tổng hợp evidence, và giữ ranh giới không để AI ra quyết định thay con người.

#### 4.8.3 Hạn chế cần chuyển sang Chương 5
Tóm tắt các hạn chế đã được phát hiện qua thực nghiệm và khảo sát, nhưng chỉ ở mức định hướng để Chương 5 tiếp tục trình bày đầy đủ hơn. Cần ưu tiên các hạn chế có bằng chứng từ benchmark, như thiếu nhãn chuyên gia cho track recommendation, các finding của Review Quality Auditor còn nhiễu, coverage thấp cần diễn giải thận trọng, tool-call failure của Chatbot Agent, độ trễ cao ở một số workflow và giới hạn của TCA như một proxy tự động thay vì đánh giá chuyên gia đầy đủ. Mục này giúp Chương 5 không xuất hiện đột ngột mà là phần tiếp nối tự nhiên từ bằng chứng ở Chương 4.

## Chương 5. Kết luận

### 5.1 Kết quả đạt được
Tổng hợp những nội dung chính mà đề tài đã hoàn thành so với mục tiêu ban đầu. Mục này cần nhấn mạnh các kết quả về hệ thống, khả năng đáp ứng nhu cầu người dùng và hiệu quả của giải pháp được xây dựng.

### 5.2 Các hạn chế
Trình bày những giới hạn còn tồn tại của đề tài, có thể liên quan đến dữ liệu, workflow AI, độ hoàn thiện hệ thống, triển khai thực tế hoặc chi phí vận hành. Phần này nên viết thẳng, rõ và bám sát các kết quả đánh giá ở Chương 4.

### 5.3 Hướng phát triển trong tương lai
Đề xuất các hướng cải tiến hoặc mở rộng có thể thực hiện sau đề tài. Nội dung cần liên hệ trực tiếp với các hạn chế đã nêu, đồng thời chỉ ra các cơ hội để hệ thống trở nên hoàn thiện, chính xác và khả thi hơn trong thực tế.

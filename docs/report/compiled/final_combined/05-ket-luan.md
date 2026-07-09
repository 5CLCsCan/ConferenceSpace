# Chương 5. Kết luận

Chương này tổng kết mức độ hoàn thành của đề tài ConferenceSpace dựa trên mục tiêu đã xác định ở Chương 1, yêu cầu rút ra ở Chương 2, thiết kế hệ thống ở Chương 3 và kết quả đánh giá thực nghiệm ở Chương 4. Trọng tâm của chương không phải là lặp lại toàn bộ số liệu benchmark, mà là xác định rõ đề tài đã chứng minh được điều gì, chưa chứng minh được điều gì và những giới hạn đó dẫn tới hướng phát triển nào.

Luận điểm xuyên suốt của đề tài là AI có thể tạo giá trị trong quy trình xét duyệt bài báo nếu được đặt trong một kiến trúc có ranh giới kiểm soát rõ ràng. Trong ConferenceSpace, nghiệp vụ cốt lõi, cơ chế thuật toán xác định và workflow AI hỗ trợ được tách thành các lớp trách nhiệm khác nhau. AI không thay thế tác giả, người phản biện hoặc Chair; AI chỉ hỗ trợ nhập liệu, kiểm tra sớm, định hướng đọc, kiểm toán bản nháp và tổng hợp bằng chứng để con người ra quyết định trên cơ sở đầy đủ hơn.

## 5.1. Kết quả đạt được

### 5.1.1. Nền tảng nghiệp vụ và kiến trúc hệ thống

Kết quả đầu tiên của đề tài là hiện thực được một nền tảng nghiệp vụ có khả năng hỗ trợ vòng đời xét duyệt bài báo theo nhiều vai trò, bao gồm tác giả, người phản biện, Chair và quản trị viên. Hệ thống không chỉ dừng ở giao diện minh họa, mà bao phủ các luồng chính như cấu hình hội nghị, nộp bài, kiểm tra xung đột lợi ích, phân công phản biện, thu thập phản biện, rebuttal, thảo luận và hỗ trợ Chair tổng hợp bằng chứng. Các use case ở Chương 3 cũng cho thấy hệ thống được tổ chức theo dòng công việc của người dùng, không phải theo các chức năng rời rạc.

Về kiến trúc, ConferenceSpace tách trách nhiệm giữa frontend, backend nghiệp vụ, AI service, cơ sở dữ liệu quan hệ, graph database, cache, reverse proxy và môi trường triển khai container hóa. Cách tổ chức này tạo ra một ranh giới quan trọng: backend kiểm soát dữ liệu, trạng thái và quyền truy cập; các cơ chế xác định xử lý những tác vụ cần nhất quán và có thể giải thích; AI service tạo đầu ra hỗ trợ để người dùng kiểm tra lại. Kết quả benchmark ở Chương 4, với 0% lỗi request và độ trễ p95 dưới 120 ms trong các kịch bản CRUD, Matching và COI ở quy mô thử nghiệm, củng cố rằng lớp nghiệp vụ cốt lõi vận hành ổn định trong phạm vi đánh giá của đề tài.

### 5.1.2. Cơ chế xác định cho reviewer matching và COI

Kết quả thứ hai là đề tài đã tách reviewer matching và phát hiện xung đột lợi ích khỏi nhóm workflow AI tạo sinh. Đây là quyết định thiết kế quan trọng, vì các tác vụ này cần tính nhất quán, khả năng giải thích và khả năng kiểm tra lại. Hệ thống dùng cơ chế thuật toán xác định hoặc bán xác định để tạo danh sách ứng viên, điểm phù hợp và bằng chứng liên quan cho Chair xem xét, thay vì để AI sinh đề xuất phân công không thể truy vết.

Benchmark reviewer matching cho thấy thuật toán có khả năng xếp hạng tốt hơn baseline ngẫu nhiên trên dữ liệu Semantic Scholar, đồng thời assignment không ghi nhận vi phạm COI trong tập thử nghiệm. Tuy nhiên, coverage 65,9% và fallback rate 23,3% cũng cho thấy hệ thống chưa đủ để tự động xử lý mọi tình huống phân công khó. Kết luận phù hợp là reviewer matching có giá trị ở vai trò hỗ trợ Chair: giảm tải thao tác dò tìm, gom bằng chứng chuyên môn và kiểm tra ràng buộc, nhưng không thay thế quyết định phân công cuối cùng trong các trường hợp thiếu dữ liệu, thiếu người phản biện phù hợp hoặc có quan hệ COI phức tạp.

### 5.1.3. Vai trò của các workflow AI hỗ trợ

Kết quả thứ ba là đề tài đã tích hợp AI vào những điểm nghẽn cụ thể của quy trình peer review thay vì tự động hóa toàn bộ quá trình xét duyệt. Các workflow như Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent đều có đầu vào, đầu ra, ranh giới kiểm soát và tiêu chí đánh giá riêng. Vì vậy, giá trị của AI được đánh giá theo từng nhiệm vụ, không bị biến thành một tuyên bố chung rằng "AI làm tốt peer review".

Các kết quả thực nghiệm cho thấy AI tạo giá trị rõ nhất ở những nhiệm vụ có nguồn dữ liệu cụ thể và đầu ra có thể kiểm tra. Submission Autofill có bằng chứng mạnh ở tác vụ tạo bản nháp metadata; Submission Gating phát huy tốt ở tuyến rule xác định; Reviewer Initial Analysis cung cấp điểm neo nguồn cho quá trình đọc ban đầu; Chair Decision Copilot hữu ích trong việc tổng hợp evidence, điểm đồng thuận và điểm bất đồng. Những kết quả này phù hợp với nhu cầu đã nêu ở Chương 2: giảm thao tác thủ công, giảm tải nhận thức và giữ AI trong vai trò có thể xem lại.

Đồng thời, Chương 4 cũng cho thấy rõ phần chưa thể kết luận mạnh. Gợi ý track chưa có nhãn chuyên gia; Initial Analysis có attention point cần kiểm tra lại; Review Quality Auditor còn nhiễu; Chair Decision Copilot chưa được đánh giá bằng decision label match. Vì vậy, kết luận bảo vệ được là các workflow AI có giá trị hỗ trợ theo từng tác vụ, không phải bằng chứng rằng AI có thể thay thế tác giả, reviewer hoặc Chair.

### 5.1.4. Mức độ đáp ứng mục tiêu đề tài

Đối chiếu với mục tiêu ban đầu, ConferenceSpace đạt được bốn kết quả chính. Thứ nhất, nhóm đã xây dựng được một nền tảng nghiệp vụ hỗ trợ quy trình xét duyệt bài báo ở mức thử nghiệm, có trạng thái, phân quyền, dữ liệu và triển khai tương ứng. Thứ hai, nhóm đã hiện thực reviewer matching và COI như các cơ chế xác định có thể giải thích, không giao cho AI tạo sinh. Thứ ba, nhóm đã tích hợp AI vào các điểm nghẽn phù hợp như nhập liệu, kiểm tra sớm bản thảo, hỗ trợ đọc bài, kiểm toán bản nháp review, tổng hợp evidence và hội thoại trong phạm vi quyền truy cập. Thứ tư, nhóm đã xây dựng được chuỗi đánh giá nhiều lớp, tách rõ benchmark backend, thuật toán xác định, workflow AI, phân tích vận hành và khảo sát người dùng.

Từ các kết quả trên, có thể kết luận ConferenceSpace đáp ứng mục tiêu cốt lõi của đề tài: xây dựng một nền tảng quản lý quy trình xét duyệt bài báo có tích hợp AI theo ranh giới kiểm soát rõ ràng. Kết luận này chỉ áp dụng ở phạm vi thử nghiệm của đề tài. Nó không chứng minh hệ thống đã sẵn sàng thay thế mọi quy trình hội nghị thật, và càng không chứng minh AI có thể thay con người trong các quyết định học thuật.

## 5.2. Các hạn chế

### 5.2.1. Hạn chế về dữ liệu và phạm vi đánh giá

Nhóm hạn chế đầu tiên nằm ở bằng chứng đánh giá. Các benchmark hiện tại chủ yếu dựa trên bài báo tiếng Anh và dữ liệu học thuật được chuẩn hóa, trong đó có các tập từ OpenReview hoặc Semantic Scholar. Điều này phù hợp với mục tiêu đánh giá kỹ thuật, nhưng chưa đủ để kết luận hệ thống hoạt động tương đương trên hội nghị nhỏ, hội nghị tiếng Việt hoặc hội nghị có chính sách phản biện đặc thù.

Một số workflow chưa có nhãn chuyên gia đầy đủ. Gợi ý track mới chứng minh được tỷ lệ hoàn tất và khả năng giữ gợi ý trong danh sách hợp lệ, chưa chứng minh độ đúng chuyên môn. Submission Gating tuyến nội dung mềm chưa có nhãn thủ công cho actionability, severity và groundedness của từng finding. Chair Decision Copilot chưa được đánh giá theo quyết định cuối cùng của Chair, vì mục tiêu của workflow là tổng hợp bằng chứng chứ không dự đoán nhãn accept hoặc reject.

Reviewer matching cũng cần thêm dữ liệu gần vận hành thật. Các chỉ số ranking và assignment hiện tại cho thấy thuật toán tốt hơn baseline trong điều kiện benchmark, nhưng chưa đo trực tiếp tỷ lệ Chair chấp nhận đề xuất, chất lượng phản biện sau phân công hoặc tác động lên tiến độ hội nghị. Khảo sát người dùng sau sử dụng mới có giá trị như phản hồi định tính ban đầu do cỡ mẫu còn nhỏ.

### 5.2.2. Hạn chế về chất lượng và độ tin cậy của workflow AI

Nhóm hạn chế thứ hai nằm ở độ tin cậy của đầu ra AI. Các workflow AI vẫn có thể sinh thông tin không có căn cứ, diễn giải quá mạnh hoặc tạo finding chưa đủ bằng chứng. Rủi ro này đặc biệt quan trọng ở các workflow gần điểm quyết định như Review Quality Auditor và Chair Decision Copilot, nơi người dùng có thể hiểu sai đầu ra AI như một kết luận học thuật nếu giao diện không thể hiện rõ bằng chứng và mức độ chắc chắn.

Review Quality Auditor là trường hợp cần thận trọng nhất. Dù workflow có thể phát hiện vấn đề hữu ích trong bản nháp review, các chỉ số truthfulness và grounded-valid hiện tại chưa đủ cao để hệ thống tự động chặn mọi trường hợp bị đánh dấu nghiêm trọng. Trong phạm vi hiện tại, trạng thái block chỉ nên là cơ chế bảo vệ tối thiểu cho một số lỗi nặng trước khi gửi review chính thức; những finding thiếu căn cứ cần có giải thích, quyền ghi đè hoặc xác nhận bởi reviewer hoặc Chair.

Reviewer Initial Analysis và Chair Decision Copilot cũng phải được đọc trong đúng vai trò hỗ trợ. Initial Analysis giúp reviewer định hướng đọc, nhưng không bảo đảm bao phủ đầy đủ mọi đóng góp, thiếu sót hoặc rủi ro học thuật của bài báo. Chair Decision Copilot giúp tổng hợp review, rebuttal và evidence, nhưng chưa có cơ sở để kết luận hệ thống chọn đúng accept hoặc reject. Các cơ chế hậu kiểm bằng TCA/NLI trong benchmark là proxy tự động cho groundedness, coverage và additionality; chúng không thay thế đánh giá của chuyên gia trong các tiêu chí đòi hỏi hiểu sâu lĩnh vực nghiên cứu và chuẩn mực hội nghị.

### 5.2.3. Hạn chế về vận hành và độ hoàn thiện sản phẩm

Nhóm hạn chế thứ ba nằm ở khả năng vận hành như một sản phẩm thực tế. Một số workflow AI có độ trễ cao và có trường hợp ngoại lệ vượt 100 giây, nên không phù hợp với mọi tương tác đồng bộ. Các workflow như Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot cần được vận hành theo hướng chạy nền, có hàng đợi xử lý, retry có giới hạn, timeout theo stage và trạng thái tiến độ rõ ràng.

Chatbot Agent còn tỷ lệ lỗi khi gọi công cụ ở mức đáng kể. Dù benchmark không ghi nhận rò rỉ dữ liệu trong kịch bản kiểm tra quyền truy cập, một agent có quyền truy vấn dữ liệu hệ thống phải từ chối đúng khi người dùng không có quyền, báo lỗi rõ khi dữ liệu không đủ và truy vết được nguyên nhân khi câu trả lời chỉ đạt một phần hoặc không đạt.

Một số workflow nghiệp vụ cũng cần hoàn thiện nếu hệ thống hướng tới vận hành hội nghị thật. Discussion, camera-ready, bidding, lịch sử phiên bản, deadline và các thao tác Chair sau quyết định vẫn cần được kiểm soát chặt hơn theo vai trò, trạng thái submission và phạm vi hiển thị.

Cuối cùng, hệ thống còn phụ thuộc vào nhà cung cấp và mô hình bên ngoài cho các thao tác LLM, bao gồm `gemini-3.1-flash-lite` thông qua OpenRouter hoặc model router tương thích OpenAI client. Sự phụ thuộc này tạo rủi ro về chi phí, giới hạn dịch vụ, độ ổn định, thay đổi chất lượng mô hình và bảo mật dữ liệu bản thảo. Vì vậy, chi phí và khả năng mở rộng cần tiếp tục được đánh giá bằng token, độ trễ và chính sách vận hành, thay vì gắn kết luận vào một bảng giá cố định.

## 5.3. Hướng phát triển trong tương lai

### 5.3.1. Nâng độ tin cậy và khả năng kiểm tra của đầu ra AI

Hướng phát triển ưu tiên là đưa một phần cơ chế hậu kiểm từ benchmark vào thời điểm vận hành. Hệ thống có thể chuẩn hóa finding, attention point hoặc rationale thành các claim rõ ràng, ghép chúng với bằng chứng từ bài nộp, review, rebuttal và artifact liên quan, sau đó đánh giá mức độ bám nguồn trước khi giữ mức cảnh báo cao.

Hướng này giải quyết trực tiếp hạn chế của Review Quality Auditor và các workflow có đầu ra tự luận. Các finding thiếu căn cứ nên được hạ từ block xuống warn hoặc yêu cầu reviewer/Chair xác nhận trước khi chặn gửi chính thức. Giao diện cần hiển thị bằng chứng, mức độ nghiêm trọng và lý do cảnh báo; người dùng phải có khả năng chỉnh sửa, bỏ qua, xác nhận hoặc phản hồi chất lượng đầu ra.

### 5.3.2. Hoàn thiện vận hành và trải nghiệm sử dụng

Các workflow AI dài cần được chuyển sang cơ chế bất đồng bộ rõ ràng hơn, với hàng đợi xử lý, retry có giới hạn, timeout theo stage, tiến độ xử lý và thông báo khi hoàn tất. Đây là điều kiện để chuyển kết quả benchmark thành trải nghiệm sản phẩm ổn định, đặc biệt với Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot.

Chatbot Agent cần được phát triển như một agent có kiểm soát, không chỉ là giao diện hội thoại. Các công cụ cần schema rõ hơn, thông báo lỗi dễ hiểu hơn, kiểm thử quyền truy cập chặt hơn và observability tốt hơn để truy vết nguyên nhân câu trả lời sai, thiếu hoặc chỉ đạt một phần.

Ở lớp vận hành hệ thống, cần bổ sung backup tự động, kiểm tra phục hồi dữ liệu, theo dõi tài nguyên, log có cấu trúc và cảnh báo lỗi cho các thành phần chính. Đây là điều kiện tối thiểu để một hệ thống chứa bản thảo, phản biện và quyết định hội nghị có thể được tin cậy trong môi trường thực tế.

### 5.3.3. Mở rộng dữ liệu đánh giá và cơ chế nghiệp vụ

Để nâng chất lượng kết luận học thuật, nhóm cần xây dựng thêm các tập nhãn chuyên gia. Gợi ý track cần nhãn do chuyên gia hoặc Chair xác nhận; Submission Gating tuyến nội dung mềm cần nhãn actionability, severity và groundedness; Chair Decision Copilot cần thí nghiệm với Chair thật để đo thời gian đọc, mức hữu ích, số điểm bất đồng được phát hiện và mức tin tưởng vào bản tổng hợp.

Reviewer matching nên được đánh giá bằng dữ liệu gần vận hành hơn, chẳng hạn dữ liệu phân công lịch sử, dữ liệu do Chair gắn nhãn, tỷ lệ Chair chấp nhận đề xuất, chất lượng review sau phân công và tác động đến thời gian hoàn tất vòng phản biện. Nếu bổ sung bidding, hệ thống có thể kết hợp bid của reviewer với điểm phù hợp chuyên môn, tải công việc và COI.

Về nghiệp vụ, các phần cần hoàn thiện tiếp gồm Discussion, camera-ready, bidding, lịch sử phiên bản, deadline và các thao tác Chair sau quyết định. Những phần này giúp hệ thống tiến gần hơn đến vận hành hội nghị thật, thay vì chỉ chứng minh các vòng đời cốt lõi ở mức thử nghiệm.

### 5.3.4. Tăng tính tự chủ khi triển khai thực tế

Một hướng phát triển dài hạn là giảm phụ thuộc vận hành vào nhà cung cấp bên ngoài. Nhóm có thể đánh giá phương án dùng mô hình open-weight hoặc triển khai on-premise cho những hội nghị có yêu cầu bảo mật cao. Hướng này cần được cân nhắc cùng chi phí hạ tầng, độ trễ, chất lượng đầu ra, khả năng cập nhật mô hình và công sức vận hành.

Hệ thống cũng nên mở rộng nguồn dữ liệu cho COI và hồ sơ chuyên môn nếu có điều kiện, chẳng hạn dữ liệu DBLP, Semantic Scholar cập nhật định kỳ hoặc dữ liệu affiliation do hội nghị tự thu thập. Việc mở rộng nguồn dữ liệu cần đi kèm cơ chế giải thích và kiểm tra thủ công, vì dữ liệu học thuật thường không đầy đủ, có tên trùng, affiliation thay đổi theo thời gian và quan hệ đồng tác giả không luôn phản ánh xung đột lợi ích hiện tại.

Nếu tiếp tục phát triển theo hướng nghiên cứu, nhóm có thể công bố một phần benchmark hoặc mã nguồn sau khi xử lý quyền dữ liệu, ẩn danh thông tin nhạy cảm và mô tả rõ giới hạn sử dụng. Điều này giúp kết quả của đề tài có khả năng tái lập và tạo nền tảng cho các nghiên cứu tiếp theo về AI hỗ trợ peer review có kiểm soát.

Tóm lại, ConferenceSpace cho thấy AI có thể tạo giá trị trong quy trình xét duyệt bài báo khi được đặt đúng vai trò: hỗ trợ thao tác, hỗ trợ đọc hiểu, kiểm tra bản nháp và tổng hợp bằng chứng. Giá trị đó chỉ bền vững khi hệ thống giữ quyền quyết định học thuật cho con người, cung cấp bằng chứng để kiểm tra lại và thừa nhận rõ giới hạn của dữ liệu, mô hình và môi trường vận hành. Kết luận của đề tài vì vậy không phải là AI có thể thay thế con người trong peer review, mà là một nền tảng được thiết kế đúng ranh giới có thể dùng AI để giảm tải một số điểm nghẽn mà vẫn bảo vệ trách nhiệm học thuật của tác giả, người phản biện và Chair.

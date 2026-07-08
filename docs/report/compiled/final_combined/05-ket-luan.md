# Chương 5. Kết luận

Chương này tổng kết mức độ hoàn thành của đề tài ConferenceSpace dựa trên mục tiêu đã xác định ở Chương 1, các yêu cầu rút ra ở Chương 2, thiết kế hệ thống ở Chương 3 và kết quả đánh giá thực nghiệm ở Chương 4. Nội dung kết luận tập trung vào ba phương diện chính: hệ thống nghiệp vụ đã xây dựng, hiệu quả của các cơ chế xác định và giá trị hỗ trợ của các workflow AI trong phạm vi đánh giá của đề tài.

Luận điểm xuyên suốt của đề tài là AI có thể được tích hợp vào quy trình xét duyệt bài báo nếu hệ thống duy trì ranh giới rõ ràng giữa nghiệp vụ cốt lõi, cơ chế xác định và các workflow hỗ trợ bằng AI. Trong ranh giới đó, AI không thay thế tác giả, người phản biện hoặc Chair; AI chỉ hỗ trợ nhập liệu, kiểm tra sớm, định hướng đọc, kiểm toán bản nháp và tổng hợp bằng chứng để con người ra quyết định trên cơ sở đầy đủ hơn.

## 5.1. Kết quả đạt được

### 5.1.1. Nền tảng nghiệp vụ và kiến trúc hệ thống

Đề tài đã hiện thực một nền tảng hỗ trợ quy trình xét duyệt bài báo theo nhiều vai trò, bao gồm tác giả, người phản biện, Chair và quản trị viên. Trong phạm vi đề tài, hệ thống bao phủ các vòng đời nghiệp vụ chính: cấu hình hội nghị, nộp bài, khai báo và kiểm tra xung đột lợi ích, gợi ý hoặc phân công phản biện, thu thập phản biện, rebuttal, thảo luận, hỗ trợ Chair tổng hợp bằng chứng và theo dõi trạng thái hội nghị.

Các use case ở Chương 3 cho thấy hệ thống được tổ chức theo dòng công việc của từng vai trò thay vì chỉ tập trung vào các chức năng rời rạc. Với tác giả, hệ thống hướng tới giảm thao tác nhập liệu và phát hiện lỗi trước khi gửi chính thức. Với người phản biện, hệ thống hỗ trợ quá trình đọc bài, viết phản biện và tự kiểm tra chất lượng bản nháp. Với Chair, hệ thống hỗ trợ theo dõi tiến độ, kiểm soát rủi ro, xem xét xung đột lợi ích, điều phối phản biện và tổng hợp bằng chứng trước khi ra quyết định.

Về kiến trúc, ConferenceSpace được thiết kế theo hướng tách trách nhiệm giữa frontend, backend nghiệp vụ, AI service, cơ sở dữ liệu quan hệ, graph database, cache, reverse proxy và môi trường triển khai container hóa. Cách tổ chức này giúp hệ thống giữ được ranh giới quan trọng: backend là nơi kiểm soát dữ liệu, trạng thái và quyền truy cập; các cơ chế xác định xử lý những tác vụ cần nhất quán và có thể giải thích; AI service chỉ tạo đầu ra hỗ trợ để người dùng kiểm tra lại.

Kết quả benchmark lớp nghiệp vụ ở Chương 4 cho thấy backend đạt 0% lỗi request trong các kịch bản CRUD, Matching và COI ở quy mô thử nghiệm gồm 300 hội nghị, 15.000 bài nộp và 9.000 người phản biện. Độ trễ p95 của các nhóm kịch bản đều dưới 120 ms trong điều kiện benchmark hiện tại. Kết quả này cho phép kết luận rằng lớp nghiệp vụ cốt lõi vận hành ổn định trong phạm vi kiểm thử của đề tài; đồng thời, tải lên PostgreSQL khi dữ liệu quan hệ tăng là điểm cần chú ý khi mở rộng.

### 5.1.2. Cơ chế xác định cho reviewer matching và COI

Một kết quả quan trọng của đề tài là tách reviewer matching và phát hiện xung đột lợi ích khỏi nhóm workflow AI tạo sinh. Đây là các cơ chế cần tính nhất quán, khả năng giải thích và khả năng kiểm tra lại; vì vậy chúng được thiết kế như các cơ chế thuật toán xác định hoặc bán xác định, thay vì để AI tự sinh đề xuất không thể truy vết.

Trong benchmark reviewer matching, hệ thống được đánh giá trên tập dữ liệu Semantic Scholar gồm 60 tác giả và 2.565 bài báo. Kết quả ranking đạt MRR 0,392, Hit@5 đạt 55% và Hit@10 đạt 65%, cao hơn baseline ngẫu nhiên. Ở bài toán assignment, hệ thống không ghi nhận vi phạm COI trong benchmark và đạt mức phù hợp trung bình cao hơn baseline. Tuy nhiên, coverage 65,9% và fallback rate 23,3% cho thấy thuật toán chưa đủ để tự động xử lý mọi trường hợp phân công khó thay cho Chair.

Kết quả này phù hợp với định hướng của đề tài: reviewer matching nên được xem là lớp hỗ trợ ra quyết định, cung cấp danh sách ứng viên và bằng chứng liên quan để Chair xem xét. Hệ thống có thể giảm tải thao tác dò tìm và kiểm tra ràng buộc, nhưng quyết định phân công cuối cùng vẫn thuộc về Chair, đặc biệt trong các trường hợp thiếu dữ liệu chuyên môn, thiếu người phản biện phù hợp hoặc có ràng buộc COI phức tạp.

### 5.1.3. Vai trò của các workflow AI hỗ trợ

Các workflow AI trong ConferenceSpace được triển khai theo nguyên tắc hỗ trợ từng điểm nghẽn cụ thể của quy trình, không tự động hóa toàn bộ quá trình xét duyệt. Mỗi workflow có đầu vào, đầu ra, ranh giới kiểm soát và tiêu chí đánh giá riêng. Cách tiếp cận này cho phép đánh giá AI theo nhiệm vụ cụ thể thay vì đưa ra nhận định chung chung về toàn bộ nhóm chức năng AI.

Submission Autofill là workflow có bằng chứng định lượng rõ nhất trong nhóm hỗ trợ tác giả. Trên tập benchmark ở Chương 4, hệ thống đạt title exact 91,22%, title token F1 98,20%, abstract ROUGE-1 83,64%, abstract ROUGE-L 83,25%, keyword F1 92,77%, author F1 83,49% và required field completion 86,93%. Các kết quả này cho thấy AI có giá trị thực nghiệm ở tác vụ tạo bản nháp metadata cho form nộp bài. Phần gợi ý track nằm bên trong Submission Autofill cũng hoàn tất 48/48 trường hợp và có invalid track rate 0,00%, nhưng do chưa có nhãn chuyên gia nên chỉ có thể kết luận hệ thống giữ gợi ý trong danh sách track hợp lệ, chưa thể kết luận về độ chính xác chuyên môn của track được đề xuất.

Submission Gating cho thấy giá trị ở việc phát hiện lỗi tại giai đoạn sớm, trước khi bài được gửi chính thức. Tuyến rule xác định đạt 8/8 completion, blocking verdict accuracy 100%, rule ID recall 100% và không ghi nhận trường hợp chặn sai trong tập benchmark rule. Tuyến đánh giá nội dung mềm hoàn tất 24/24 trường hợp và không tự động tạo trạng thái block ngoài hợp đồng đã định nghĩa. Vì vậy, kết luận phù hợp là workflow này có thể hỗ trợ kiểm tra hình thức, policy và cảnh báo nội dung cần xem lại; workflow không thay Chair đưa ra quyết định loại bài vì lý do học thuật.

Reviewer Initial Analysis chứng minh được vai trò tạo briefing ban đầu cho người phản biện. Benchmark ghi nhận quote grounded rate 96,22%, cho thấy các trích dẫn và điểm neo nguồn tương đối đáng tin cậy trong phạm vi kiểm thử. Tuy nhiên, attention point truthfulness đạt 69,86% và coverage ở mức thấp, nên các điểm cần chú ý phải được xem là gợi ý định hướng đọc, không phải nhận định học thuật hoàn chỉnh. Đây là kết quả phù hợp với mục tiêu thiết kế: AI giúp reviewer giảm thao tác truy vết và đọc lại các đoạn liên quan, nhưng không thay thế quá trình đọc bài và đánh giá chuyên môn.

Review Quality Auditor là workflow có giá trị tiềm năng nhưng cũng bộc lộ rủi ro rõ nhất. Trên 3.658 lượt audit, hệ thống sinh trung bình 2,39 finding mỗi audit, nhưng truthfulness 58,28%, validity 71,04% và grounded-valid 46,99% cho thấy kết quả phát hiện còn nhiễu. Vì vậy, auditor nên được dùng như công cụ hỗ trợ tự kiểm tra hoặc hỗ trợ Chair phát hiện review thiếu thông tin, thiếu căn cứ hoặc tự mâu thuẫn; không nên xem nó là cơ chế tự động quyết định chất lượng học thuật của bài báo hoặc của người phản biện.

Chair Decision Copilot đạt evidence basis truthfulness 87,34%, disagreement map truthfulness 87,11%, evidence additionality 91,63% và high-risk rate 1,28%. Kết quả này cho phép kết luận workflow có ích trong việc tổng hợp review, rebuttal, điểm đồng thuận, điểm bất đồng và các rủi ro cần Chair xem lại. Tuy nhiên, benchmark không đo decision label match, nên không có cơ sở kết luận Copilot dự đoán đúng quyết định accept hoặc reject. Vai trò của Copilot là giúp Chair đọc và đối chiếu bằng chứng nhanh hơn, không sinh quyết định thay Chair.

Chatbot Agent hoàn tất 40/40 hội thoại benchmark, gồm 25 trường hợp đạt, 12 trường hợp đạt một phần và 3 trường hợp không đạt. Tỷ lệ gọi công cụ thành công đạt 75,78%, với 97 lời gọi thành công trên 128 lời gọi. Kết quả này cho thấy hướng tiếp cận agent có thể hỗ trợ người dùng truy vấn trạng thái, thao tác và dữ liệu trong phạm vi quyền truy cập, nhưng độ ổn định của công cụ và độ trễ phản hồi vẫn cần cải thiện trước khi xem đây là một trợ lý sản phẩm ổn định.

### 5.1.4. Mức độ đáp ứng mục tiêu đề tài

Đối chiếu với mục tiêu ở Chương 1, đề tài đã đạt được bốn kết quả chính.

Thứ nhất, nhóm đã xây dựng được một nền tảng nghiệp vụ có khả năng hỗ trợ quy trình xét duyệt bài báo trong hội nghị khoa học, thay vì chỉ dừng ở mô hình hoặc giao diện minh họa. Các chức năng được đặt trong dòng công việc nhiều vai trò và có cơ chế trạng thái, phân quyền, dữ liệu và triển khai tương ứng.

Thứ hai, nhóm đã hiện thực được các cơ chế xác định cho những phần không nên giao cho AI tạo sinh, đặc biệt là reviewer matching và COI. Kết quả đánh giá cho thấy các cơ chế này có giá trị hỗ trợ Chair, đồng thời vẫn giữ được tính kiểm tra và giải thích.

Thứ ba, nhóm đã tích hợp AI vào các điểm nghẽn phù hợp của quy trình: nhập liệu khi nộp bài, kiểm tra sớm bản thảo, hỗ trợ reviewer đọc bài, kiểm toán bản nháp review, tổng hợp evidence cho Chair và hỗ trợ hội thoại trong phạm vi quyền truy cập. Các workflow này phản hồi trực tiếp nhu cầu đã xác định ở Chương 2: giảm thao tác thủ công, giảm tải nhận thức, tăng kiểm soát rủi ro và giữ AI minh bạch, có thể ghi đè.

Thứ tư, nhóm đã xây dựng được một chuỗi đánh giá nhiều lớp thay vì chỉ dựa trên nhận xét cảm tính. Chương 4 tách riêng benchmark backend, benchmark thuật toán xác định, benchmark workflow AI, phân tích vận hành và khảo sát người dùng sau sử dụng. Cách đánh giá này giúp kết luận của đề tài có ranh giới rõ: phần nào đã có bằng chứng định lượng, phần nào mới có bằng chứng proxy và phần nào chỉ nên xem là phản hồi định tính ban đầu.

Từ các kết quả trên, có thể kết luận ConferenceSpace đáp ứng mục tiêu cốt lõi của đề tài ở mức thử nghiệm: xây dựng được một nền tảng quản lý quy trình xét duyệt bài báo có tích hợp AI theo ranh giới kiểm soát rõ ràng. Tuy nhiên, các kết quả này không đồng nghĩa hệ thống đã sẵn sàng thay thế quy trình vận hành của mọi hội nghị thật, cũng không chứng minh AI có thể thay con người trong các quyết định học thuật.

## 5.2. Các hạn chế

### 5.2.1. Hạn chế về dữ liệu và phạm vi đánh giá

Các benchmark hiện tại chủ yếu dựa trên bài báo tiếng Anh và dữ liệu học thuật được chuẩn hóa, trong đó có các tập dữ liệu lấy từ OpenReview hoặc Semantic Scholar. Điều này phù hợp với mục tiêu đánh giá kỹ thuật của đề tài, nhưng chưa đủ để kết luận hệ thống hoạt động tương đương trên hội nghị nhỏ, hội nghị tiếng Việt, hội nghị có biểu mẫu đặc thù hoặc hội nghị có chính sách phản biện khác đáng kể.

Một số workflow chưa có nhãn chuyên gia đầy đủ. Phần gợi ý track trong Submission Autofill mới chứng minh được tỷ lệ hoàn tất và khả năng giữ gợi ý trong danh sách track hợp lệ, chưa chứng minh độ đúng chuyên môn của track. Tuyến đánh giá nội dung mềm của Submission Gating chưa có nhãn chuyên gia cho từng finding, nên chưa thể kết luận về actionability hoặc severity. Chair Decision Copilot chưa được đánh giá theo quyết định cuối cùng của Chair, vì mục tiêu của workflow là tổng hợp bằng chứng chứ không dự đoán nhãn accept/reject.

Reviewer matching cũng cần thêm dữ liệu vận hành thật để đánh giá sâu hơn. Các chỉ số ranking và assignment hiện tại cho thấy hệ thống tốt hơn baseline trong điều kiện benchmark, nhưng chưa đo trực tiếp tỷ lệ Chair chấp nhận đề xuất, chất lượng phản biện sau phân công hoặc tác động của thuật toán lên tiến độ hội nghị trong môi trường thực tế.

Khảo sát người dùng sau sử dụng ở Chương 4 có giá trị như phản hồi định tính ban đầu, nhưng cỡ mẫu còn nhỏ. Vì vậy, các kết quả như mức hài lòng, thời gian tiết kiệm hoặc mức tin tưởng vào AI nên được hiểu như tín hiệu thực nghiệm ban đầu, không phải kết luận thống kê đại diện cho toàn bộ cộng đồng học thuật.

### 5.2.2. Hạn chế về chất lượng và độ tin cậy của workflow AI

Giới hạn lớn nhất của nhóm workflow AI là đầu ra vẫn có thể sinh thông tin không có căn cứ, diễn giải quá mạnh hoặc tạo finding chưa đủ bằng chứng. Điều này đặc biệt quan trọng ở các workflow gần điểm quyết định như Review Quality Auditor và Chair Decision Copilot. Nếu hệ thống trình bày đầu ra AI như kết luận tuyệt đối, người dùng có thể hiểu sai vai trò của AI và làm lệch trách nhiệm học thuật.

Review Quality Auditor là ví dụ rõ nhất. Dù workflow có thể phát hiện nhiều vấn đề hữu ích trong bản nháp review, các chỉ số truthfulness và grounded-valid hiện tại chưa đủ cao để cho phép hệ thống tự động chặn mọi trường hợp bị đánh dấu nghiêm trọng. Trong phiên bản hiện tại, trạng thái block nên được hiểu là cơ chế bảo vệ tối thiểu cho một số lỗi nặng của thao tác gửi review, nhưng vẫn cần khả năng giải thích, ghi đè hoặc xác nhận bởi reviewer/Chair.

Reviewer Initial Analysis có quote grounded tốt, nhưng các attention point vẫn cần được kiểm tra lại khi sử dụng. Workflow này giúp reviewer định hướng đọc và giảm thao tác truy vết, nhưng không bảo đảm đã bao phủ đầy đủ mọi đóng góp, thiếu sót hoặc rủi ro học thuật của bài báo.

Các cơ chế hậu kiểm bằng TCA/NLI trong benchmark giúp đánh giá truthfulness, groundedness, coverage và additionality của một số đầu ra AI, nhưng bản thân chúng vẫn là proxy tự động. Chúng không thể thay đánh giá của chuyên gia, đặc biệt với những tiêu chí đòi hỏi hiểu sâu lĩnh vực nghiên cứu, chuẩn mực hội nghị và chất lượng lập luận học thuật.

### 5.2.3. Hạn chế về vận hành và độ hoàn thiện sản phẩm

Một số workflow AI có độ trễ cao và có trường hợp ngoại lệ vượt 100 giây. Điều này không phù hợp với mọi tương tác đồng bộ trên giao diện. Các workflow như Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot cần được vận hành theo hướng chạy nền, có hàng đợi xử lý, cơ chế thử lại, giới hạn thời gian theo từng stage, trạng thái tiến độ và cơ chế đánh dấu artifact cũ khi dữ liệu nguồn thay đổi.

Chatbot Agent còn tỷ lệ lỗi khi gọi công cụ ở mức đáng kể. Dù benchmark không ghi nhận rò rỉ dữ liệu trong kịch bản kiểm tra quyền truy cập, độ tin cậy của lời gọi công cụ, cách báo lỗi và thời gian phản hồi vẫn cần cải thiện. Với một agent có quyền truy vấn dữ liệu hệ thống, yêu cầu quan trọng không chỉ là trả lời đúng, mà còn là từ chối đúng khi người dùng không có quyền hoặc khi dữ liệu không đủ.

Về sản phẩm, một số workflow nghiệp vụ vẫn cần hoàn thiện nếu hệ thống hướng tới vận hành thật. Discussion cần được kiểm soát chặt hơn theo phạm vi hiển thị, loại thread, trạng thái submission và vai trò người dùng. Camera-ready hiện mới được hỗ trợ ở mức upload sau khi bài được chấp nhận, chưa có đầy đủ workflow Chair phê duyệt, yêu cầu nộp lại, deadline được kiểm soát ở thời điểm vận hành và lịch sử phiên bản. Bidding cũng là một cơ chế có giá trị thực tế cho phân công phản biện nhưng chưa nằm trong phạm vi triển khai hiện tại.

Cuối cùng, hệ thống còn phụ thuộc vào nhà cung cấp và mô hình bên ngoài cho các thao tác LLM, bao gồm `gemini-3.1-flash-lite` thông qua OpenRouter hoặc model router tương thích OpenAI client. Sự phụ thuộc này tạo rủi ro về chi phí, giới hạn dịch vụ, độ ổn định, thay đổi chất lượng mô hình và yêu cầu bảo mật dữ liệu bản thảo. Vì vậy, chi phí và khả năng mở rộng nên tiếp tục được đánh giá bằng token, độ trễ và chính sách vận hành, thay vì gắn kết luận vào một bảng giá cố định.

## 5.3. Hướng phát triển trong tương lai

### 5.3.1. Nâng độ tin cậy và khả năng kiểm tra của đầu ra AI

Hướng phát triển ưu tiên là đưa một phần cơ chế hậu kiểm từ benchmark vào thời điểm vận hành. Thay vì chỉ chạy TCA/NLI sau khi benchmark, hệ thống có thể chuẩn hóa finding, attention point hoặc rationale thành các claim rõ ràng, ghép chúng với bằng chứng từ bài nộp, review, rebuttal và artifact liên quan, sau đó đánh giá mức độ bám nguồn trước khi giữ mức cảnh báo cao.

Với Review Quality Auditor, các finding thiếu căn cứ nên được hạ từ block xuống warn hoặc yêu cầu reviewer/Chair xác nhận trước khi chặn gửi chính thức. Cách làm này giữ được vai trò bảo vệ của auditor đối với các review thiếu thông tin hoặc tự mâu thuẫn, đồng thời giảm rủi ro chặn sai gây cản trở cho người phản biện.

Giao diện cũng cần hiển thị rõ bằng chứng đi kèm đầu ra AI: đoạn trích nguồn, trường dữ liệu liên quan, mức độ nghiêm trọng, lý do cảnh báo và trạng thái kiểm tra. Người dùng phải có khả năng chỉnh sửa, bỏ qua, xác nhận hoặc phản hồi chất lượng đầu ra. Những phản hồi này có thể trở thành dữ liệu vận hành để cải thiện workflow và benchmark về sau.

### 5.3.2. Hoàn thiện vận hành và trải nghiệm sử dụng

Các workflow AI dài cần được chuyển sang cơ chế vận hành bất đồng bộ rõ ràng hơn. Hệ thống nên có hàng đợi xử lý, cơ chế thử lại có giới hạn, giới hạn thời gian theo từng stage, tiến độ xử lý, thông báo khi hoàn tất và trạng thái artifact không còn hiện hành khi dữ liệu nguồn thay đổi. Đây là điều kiện cần để chuyển các kết quả benchmark thành khả năng vận hành ổn định trong trải nghiệm sử dụng thực tế.

Chatbot Agent cần được cải thiện theo hướng agent có kiểm soát, không chỉ là giao diện hội thoại. Các công cụ cần có schema rõ hơn, thông báo lỗi dễ hiểu hơn, kiểm thử quyền truy cập chặt hơn và observability tốt hơn để truy vết nguyên nhân câu trả lời chỉ đạt một phần hoặc không đạt. Giao diện nên phân biệt các trạng thái "đang truy vấn dữ liệu", "đang tổng hợp", "không đủ quyền" và "không có dữ liệu phù hợp".

Ở lớp vận hành hệ thống, cần bổ sung backup tự động, kiểm tra phục hồi dữ liệu, theo dõi tài nguyên, log có cấu trúc và cảnh báo lỗi cho các thành phần chính. Đây không phải là phần mở rộng phụ, mà là điều kiện để một hệ thống chứa bản thảo, phản biện và quyết định hội nghị có thể được tin cậy trong môi trường thực tế.

### 5.3.3. Mở rộng dữ liệu đánh giá và cơ chế nghiệp vụ

Để nâng chất lượng kết luận học thuật, nhóm cần xây dựng thêm các tập nhãn chuyên gia. Với gợi ý track trong Submission Autofill, cần có nhãn track do chuyên gia hoặc Chair xác nhận để đánh giá Top-K accuracy, MRR hoặc NDCG@K nếu phù hợp. Với Submission Gating tuyến nội dung mềm, cần nhãn actionability, severity và groundedness cho từng finding. Với Chair Decision Copilot, cần thí nghiệm người dùng với Chair thật để đo thời gian đọc, mức hữu ích, số điểm bất đồng được phát hiện và mức tin tưởng vào bản tổng hợp.

Reviewer matching cũng nên được đánh giá bằng dữ liệu gần vận hành hơn. Các hướng khả thi gồm thu thập dữ liệu phân công lịch sử, dữ liệu phân công do Chair gắn nhãn, tỷ lệ Chair chấp nhận đề xuất, chất lượng review sau phân công và tác động đến thời gian hoàn tất vòng phản biện. Nếu bổ sung bidding, hệ thống có thể kết hợp bid của reviewer với điểm phù hợp chuyên môn, tải công việc và COI để tạo cơ chế phân công sát thực tế hơn.

Về nghiệp vụ, các phần cần hoàn thiện tiếp gồm phạm vi hiển thị và quyền trong Discussion, workflow camera-ready, bidding, lịch sử phiên bản, deadline được kiểm soát ở thời điểm vận hành và các thao tác Chair sau quyết định. Những phần này giúp hệ thống tiến gần hơn đến vận hành hội nghị thật, thay vì chỉ chứng minh các vòng đời cốt lõi ở mức thử nghiệm.

### 5.3.4. Tăng tính tự chủ khi triển khai thực tế

Một hướng phát triển dài hạn là giảm phụ thuộc vận hành vào nhà cung cấp bên ngoài. Nhóm có thể đánh giá phương án dùng mô hình open-weight hoặc triển khai on-premise cho những hội nghị có yêu cầu bảo mật cao. Hướng này cần được cân nhắc cùng chi phí hạ tầng, độ trễ, chất lượng đầu ra, khả năng cập nhật mô hình và công sức vận hành.

Hệ thống cũng nên mở rộng nguồn dữ liệu cho COI và hồ sơ chuyên môn nếu có điều kiện, chẳng hạn dữ liệu DBLP, Semantic Scholar cập nhật định kỳ hoặc dữ liệu affiliation do hội nghị tự thu thập. Việc mở rộng nguồn dữ liệu cần đi kèm cơ chế giải thích và kiểm tra thủ công, vì dữ liệu học thuật thường không đầy đủ, có tên trùng, affiliation thay đổi theo thời gian và quan hệ đồng tác giả không luôn phản ánh xung đột lợi ích hiện tại.

Nếu tiếp tục phát triển theo hướng nghiên cứu, nhóm có thể công bố một phần benchmark hoặc mã nguồn sau khi xử lý quyền dữ liệu, ẩn danh thông tin nhạy cảm và mô tả rõ giới hạn sử dụng. Điều này giúp kết quả của đề tài có khả năng tái lập và tạo nền tảng cho các nghiên cứu tiếp theo về AI hỗ trợ peer review có kiểm soát.

Tóm lại, ConferenceSpace cho thấy AI có thể tạo giá trị trong quy trình xét duyệt bài báo khi được đặt đúng vai trò: hỗ trợ thao tác, hỗ trợ đọc hiểu, kiểm tra bản nháp và tổng hợp bằng chứng. Giá trị đó chỉ bền vững khi hệ thống giữ quyền quyết định học thuật cho con người, cung cấp bằng chứng để kiểm tra lại và thừa nhận rõ những giới hạn của dữ liệu, mô hình và môi trường vận hành. Kết luận của đề tài vì vậy không phải là AI có thể thay thế con người trong peer review, mà là một nền tảng được thiết kế đúng ranh giới có thể dùng AI để giảm tải một số điểm nghẽn mà vẫn bảo vệ trách nhiệm học thuật của tác giả, người phản biện và Chair.

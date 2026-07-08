# Chương 5. Kết luận

> Trạng thái hiện tại: bản định hướng viết lại.
>
> Nội dung cũ của chương này đã được loại bỏ vì không còn đồng bộ với Chương 3 và Chương 4 sau khi báo cáo được tái cấu trúc. File này xác định rõ vai trò, cấu trúc, trọng tâm lập luận và các giới hạn diễn giải cho bản Chương 5 hoàn chỉnh sẽ được viết ở bước tiếp theo.

---

## 5.0. Vai trò của Chương 5 trong toàn bộ báo cáo

Chương 5 không nên lặp lại Chương 3 dưới dạng danh sách tính năng, cũng không nên lặp lại Chương 4 dưới dạng danh sách số liệu. Vai trò đúng của chương này là tổng kết chuỗi lập luận đã được xây dựng qua bốn chương trước:

- Chương 1 xác định vấn đề, mục tiêu và phạm vi: xây dựng một nền tảng hỗ trợ quy trình xét duyệt bài báo, trong đó AI chỉ đóng vai trò hỗ trợ và không thay thế quyết định học thuật.
- Chương 2 chuyển vấn đề thành nhu cầu, khoảng trống và yêu cầu hệ thống: giảm thao tác thủ công, giảm tải nhận thức, tăng kiểm soát rủi ro và giữ AI minh bạch, có thể kiểm tra lại.
- Chương 3 trình bày giải pháp: hệ thống được tổ chức theo ba lớp gồm nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ; các use case, workflow và ranh giới trách nhiệm được mô tả theo vai trò.
- Chương 4 cung cấp bằng chứng đánh giá: hệ thống được kiểm thử theo lớp nghiệp vụ, thuật toán xác định, workflow AI, tính khả thi vận hành và phản hồi người dùng.

Vì vậy, Chương 5 phải trả lời bốn câu hỏi mà hội đồng sẽ quan tâm:

1. Đề tài đã hoàn thành được gì so với mục tiêu ban đầu?
2. Bằng chứng nào trong Chương 4 cho phép rút ra các kết luận đó?
3. Những gì chưa được chứng minh hoặc còn giới hạn là gì?
4. Nếu tiếp tục phát triển, hướng nào có giá trị cao nhất và xuất phát trực tiếp từ các hạn chế đã được chứng minh?

Nguyên tắc viết của Chương 5:

- Viết theo hướng tổng hợp và phán đoán học thuật, không viết như phần giới thiệu sản phẩm.
- Mọi kết luận phải bám vào Chương 1, Chương 2 và bằng chứng ở Chương 4.
- Không dùng số liệu không còn xuất hiện trong Chương 4 hiện tại.
- Không mô tả reviewer matching là AI tạo sinh; đây là thuật toán xác định.
- Không tách "gợi ý track" thành workflow riêng; đây là một khả năng bên trong Submission Autofill.
- Không nói AI thay reviewer, thay Chair hoặc dự đoán đúng quyết định accept/reject.
- Không dùng các cụm quảng bá như "toàn diện", "vượt xa", "thay thế hoàn toàn", "chính xác tuyệt đối", "chi phí hợp lý" nếu không có bằng chứng trực tiếp.

Nếu đóng vai trò thành viên hội đồng, điều cần thấy ở Chương 5 là một kết luận tỉnh táo: nhóm đã xây dựng được một hệ thống có phạm vi rõ, có kiến trúc hợp lý, có bằng chứng thực nghiệm cho một số giá trị cốt lõi, đồng thời hiểu rõ phần nào chưa được chứng minh và không đẩy claim vượt quá dữ liệu.

---

## 5.1. Kết quả đạt được

### Trọng tâm của mục 5.1

Mục này cần tổng hợp kết quả theo mức độ đóng góp, không theo danh sách màn hình hoặc endpoint. Cấu trúc nên đi từ kết quả hệ thống đến kết quả đánh giá, sau đó kết lại bằng đóng góp chính của đề tài.

### 5.1.1. Hoàn thành nền tảng nghiệp vụ cốt lõi theo phạm vi đề tài

Nội dung cần viết:

- Khẳng định ConferenceSpace đã hiện thực các vòng đời nghiệp vụ chính của quy trình xét duyệt bài báo trong phạm vi đề tài: cấu hình hội nghị, nộp bài, phân công phản biện, kiểm tra xung đột lợi ích, thu thập đánh giá, rebuttal, Discussion, hỗ trợ ra quyết định và theo dõi trạng thái.
- Liên hệ với Chương 3: mười use case đại diện đã bao phủ vòng đời Author, Reviewer, Chair và các luồng xuyên vai trò như Discussion và Chatbot Agent.
- Liên hệ với Chương 2: các chức năng này phản hồi trực tiếp bốn nhóm nhu cầu nền tảng gồm giảm thao tác thủ công, giảm tải nhận thức, tăng kiểm soát rủi ro và giữ AI có thể kiểm tra lại.
- Nêu đúng giới hạn: hệ thống bao phủ quy trình xét duyệt bài báo, không bao phủ quản lý sự kiện hội nghị theo nghĩa rộng; camera-ready và Discussion còn một số giới hạn triển khai đã nêu ở Chương 3.

Không nên viết:

- Không gọi hệ thống là "toàn diện" theo nghĩa bao phủ mọi nghiệp vụ hội nghị.
- Không nói các workflow đã hoàn thiện ở mức sản phẩm thương mại.
- Không nói real-time notification thay thế hoàn toàn email nếu báo cáo chưa chứng minh đầy đủ.

### 5.1.2. Thiết kế được ranh giới giữa nghiệp vụ, thuật toán xác định và AI hỗ trợ

Nội dung cần viết:

- Tổng kết nguyên tắc thiết kế quan trọng nhất của đề tài: tách hệ thống thành ba lớp trách nhiệm.
- Lớp nghiệp vụ cốt lõi chịu trách nhiệm về trạng thái, quyền truy cập, workflow và dữ liệu bền vững.
- Lớp thuật toán xác định xử lý các tác vụ cần nhất quán và có thể giải thích, đặc biệt là reviewer matching và COI.
- Lớp AI hỗ trợ xử lý các tác vụ đọc hiểu, trích xuất, kiểm tra và tổng hợp, nhưng không giữ quyền quyết định học thuật.
- Giải thích vì sao ranh giới này là đóng góp thiết kế: nó giúp hệ thống đưa AI vào đúng điểm nghẽn nhưng vẫn bảo vệ trách nhiệm của Author, Reviewer và Chair.

Kết luận được phép rút ra:

- Hệ thống chứng minh được một cách tổ chức AI có kiểm soát trong quy trình peer review.
- AI trong đề tài là công cụ hỗ trợ thao tác và hỗ trợ đọc hiểu, không phải cơ chế tự động hóa quyết định.

### 5.1.3. Kết quả thực nghiệm theo chuỗi bằng chứng

Nội dung cần viết:

- Không cần lặp lại toàn bộ bảng số liệu ở Chương 4.
- Chỉ chọn các kết quả có vai trò kết luận và liên hệ trực tiếp với mục tiêu đề tài.

Các điểm nên đưa vào:

- Lớp nghiệp vụ cốt lõi: backend đạt 0% lỗi request trong các kịch bản benchmark chính; p95 dưới 120 ms ở quy mô thử nghiệm hiện tại; điểm nghẽn chính nằm ở PostgreSQL khi dữ liệu quan hệ lớn.
- Lớp thuật toán xác định: reviewer matching có bằng chứng tốt hơn baseline ngẫu nhiên trên tập Semantic Scholar; assignment không ghi nhận COI violation trong benchmark; tuy nhiên coverage và fallback rate cho thấy Chair vẫn cần xử lý trường hợp khó.
- Submission Autofill: là workflow có bằng chứng định lượng mạnh nhất ở metadata; title token F1, keyword F1 và required field completion rate là các chỉ số nên được nhắc lại ngắn gọn.
- Reviewer Initial Analysis: quote grounded rate cao, phù hợp với vai trò tạo điểm neo nguồn cho reviewer; attention point truthfulness chưa đủ để dùng như nhận xét học thuật không kiểm tra.
- Chair Decision Copilot: evidence basis truthfulness và disagreement map truthfulness ở mức tốt cho tác vụ tổng hợp evidence; không đo decision label match nên không kết luận về quyết định accept/reject.
- Chatbot Agent: hoàn tất toàn bộ hội thoại benchmark nhưng tool-call failure còn đáng kể; đây là bằng chứng cho tiềm năng sử dụng, không phải bằng chứng sản phẩm đã ổn định.
- Khảo sát người dùng sau sử dụng: chỉ dùng đúng mẫu số và kết quả đang có trong Chương 4 hiện tại. Không dùng lại số liệu UAT cũ nếu chưa được cập nhật lại ở Chương 4.

Kết luận tổng hợp nên hướng tới:

ConferenceSpace đáp ứng được mục tiêu cốt lõi ở mức thử nghiệm: xây dựng nền tảng nghiệp vụ vận hành được, tách rõ cơ chế xác định và AI hỗ trợ, đồng thời cung cấp bằng chứng cho giá trị của AI ở các tác vụ nhập liệu, đọc hiểu, kiểm tra và tổng hợp. Những gì chưa được chứng minh là tự động hóa quyết định học thuật, độ chính xác chuyên gia của một số gợi ý, và độ ổn định sản phẩm ở quy mô lớn.

### 5.1.4. Đóng góp chính của đề tài

Mục này nên ngắn, sắc và không lặp lại chi tiết kỹ thuật. Có thể trình bày 4 nhóm đóng góp:

1. **Đóng góp về hệ thống:** xây dựng nền tảng quản lý quy trình xét duyệt bài báo theo nhiều vai trò, có môi trường triển khai và bằng chứng vận hành.
2. **Đóng góp về thiết kế:** đề xuất cách tổ chức ba lớp trách nhiệm, giúp phân biệt rõ phần nào cần deterministic, phần nào có thể dùng AI hỗ trợ và phần nào phải thuộc quyền con người.
3. **Đóng góp về cơ chế nghiệp vụ:** triển khai reviewer matching, COI và các cơ chế phân quyền/trạng thái như nền tảng đáng tin cậy cho quy trình học thuật.
4. **Đóng góp về đánh giá AI workflow:** xây dựng cách đánh giá theo từng workflow, gồm workflow runner, TCA benchmark, benchmark hợp đồng và benchmark hội thoại, qua đó tránh dùng một chỉ số chung không phù hợp cho mọi đầu ra AI.

Không nên biến mục này thành danh sách tính năng dài. Hội đồng cần thấy nhóm đóng góp gì về mặt thiết kế, hiện thực và đánh giá, không chỉ thấy hệ thống có bao nhiêu màn hình.

---

## 5.2. Các hạn chế

### Trọng tâm của mục 5.2

Mục này phải viết thẳng và bám vào bằng chứng. Hạn chế không phải phần làm yếu đề tài; ngược lại, đây là nơi cho thấy nhóm hiểu đúng phạm vi kết luận và không overclaim.

### 5.2.1. Hạn chế về dữ liệu và phạm vi đánh giá

Nội dung cần viết:

- Benchmark chủ yếu dựa trên bài báo tiếng Anh và dữ liệu từ OpenReview hoặc nguồn học thuật được chuẩn hóa; hiệu quả với hội nghị nhỏ, bài tiếng Việt hoặc chính sách review khác chưa được đánh giá đầy đủ.
- Một số workflow chưa có nhãn chuyên gia: gợi ý track trong Submission Autofill, tuyến nội dung mềm của Submission Gating, và decision label match cho Chair Decision Copilot.
- Reviewer matching vẫn cần dữ liệu phân công thật hoặc tỷ lệ chấp nhận đề xuất của Chair trong vận hành thực tế để đánh giá chất lượng nghiệp vụ sâu hơn.
- Khảo sát sau sử dụng cần được trình bày đúng mẫu số hiện có và không khái quát thành kết luận thống kê mạnh nếu cỡ mẫu nhỏ.

### 5.2.2. Hạn chế về workflow AI

Nội dung cần viết:

- Review Quality Auditor là workflow nhạy cảm và còn nhiễu; grounded-valid rate hiện tại chưa đủ để biến finding thành quyết định tự động.
- Reviewer Initial Analysis có quote grounded tốt nhưng attention point vẫn là gợi ý cần kiểm tra.
- Chair Decision Copilot hỗ trợ tổng hợp evidence nhưng không chứng minh khả năng ra quyết định accept/reject.
- TCA/NLI là proxy hậu kiểm tự động, không thay thế đánh giá chuyên gia.
- Output AI có thể hallucinate hoặc diễn giải quá mạnh, đặc biệt trong các workflow gần điểm quyết định như Review Quality Auditor và Chair Decision Copilot.

Điểm cần nhấn mạnh:

Giới hạn của AI không phủ nhận giá trị của AI trong đề tài. Nó chỉ xác định cách sử dụng đúng: AI tạo bản nháp, cảnh báo, điểm neo và bản tổng hợp; người dùng có thẩm quyền vẫn kiểm tra, chỉnh sửa và quyết định.

### 5.2.3. Hạn chế về vận hành và khả năng mở rộng

Nội dung cần viết:

- Một số workflow AI có outlier độ trễ vượt 100 giây; vì vậy cần queue, retry, progress state, timeout rõ ràng và cơ chế chạy nền.
- Chatbot Agent còn tool-call failure đáng kể; cần cải thiện reliability, observability và cách báo lỗi/quyền truy cập.
- Token và số lượt gọi model đã được đo để phục vụ ước tính chi phí, nhưng không nên gắn kết luận vào một bảng giá hoặc hạn mức miễn phí có thể thay đổi.
- Hệ thống phụ thuộc provider/model bên ngoài cho thao tác LLM; điều này tạo rủi ro về chi phí, chính sách dịch vụ, độ ổn định và bảo mật dữ liệu.

### 5.2.4. Hạn chế về độ hoàn thiện sản phẩm

Nội dung cần viết:

- Discussion hiện đã được đưa vào use case quan trọng, nhưng visibility và quyền theo từng loại thread/message cần hoàn thiện nhất quán hơn.
- Camera-ready hiện hỗ trợ upload khi bài accepted, nhưng chưa có workflow Chair phê duyệt, yêu cầu nộp lại hoặc cưỡng chế deadline camera-ready ở runtime.
- Bidding chưa được triển khai, trong khi đây là một cơ chế có giá trị thực tế cho phân công phản biện.
- Backup tự động và kiểm tra phục hồi dữ liệu cần được bổ sung nếu hệ thống hướng tới vận hành thật.
- Một số trải nghiệm cần được sản phẩm hóa hơn: trạng thái đang xử lý AI, nguồn evidence cho từng finding/gợi ý, gom nhóm cảnh báo và khả năng bỏ qua/ghi đè.

### 5.2.5. Các kết luận không được rút ra từ đề tài

Mục này nên có một đoạn ngắn để khóa phạm vi học thuật:

- Không kết luận AI có thể thay reviewer đọc bài hoặc viết phản biện.
- Không kết luận Chair Decision Copilot dự đoán đúng quyết định accept/reject.
- Không kết luận reviewer matching đã tối ưu như quyết định của Chair trong hội nghị thật.
- Không kết luận gợi ý track có độ chính xác chuyên gia khi chưa có nhãn chuyên gia.
- Không kết luận hệ thống sẵn sàng cho hội nghị quy mô lớn nếu chưa có queue, retry, backup và đánh giá tải tương ứng.

---

## 5.3. Hướng phát triển trong tương lai

### Trọng tâm của mục 5.3

Hướng phát triển phải là câu trả lời trực tiếp cho hạn chế ở mục 5.2. Không nên liệt kê nhiều ý tưởng xa đề tài. Mỗi hướng nên nêu: vấn đề xuất phát, cách cải thiện và giá trị kỳ vọng.

### 5.3.1. Ưu tiên ngắn hạn: làm kết quả AI đáng kiểm tra hơn

Các hướng nên đưa vào:

- Đưa cơ chế hậu kiểm claim-evidence từ benchmark vào runtime ở dạng nhẹ: chuẩn hóa finding/attention point thành claim, ghép với evidence từ review/submission/artifact, dùng NLI hoặc cơ chế tương đương để đánh giá groundedness trước khi giữ mức cảnh báo cao.
- Với Review Quality Auditor, các finding thiếu groundedness nên bị hạ mức từ block xuống warn hoặc yêu cầu reviewer/Chair xác nhận trước khi chặn gửi chính thức.
- Hiển thị evidence, nguồn trích dẫn, confidence hoặc mức rủi ro cho các output AI quan trọng.
- Cho phép người dùng bỏ qua, chỉnh sửa hoặc phản hồi chất lượng output AI để tích lũy dữ liệu cải thiện.

Giá trị kỳ vọng:

Giảm false positive, giảm friction cho reviewer/Chair và làm rõ hơn nguyên tắc "AI hỗ trợ, con người quyết định".

### 5.3.2. Ưu tiên ngắn hạn: ổn định vận hành workflow AI và Chatbot Agent

Các hướng nên đưa vào:

- Triển khai queue, retry, timeout theo stage và progress state cho các workflow dài như Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot.
- Giảm tool-call failure của Chatbot Agent bằng cách cải thiện schema tool, error handling, observability và test theo permission boundary.
- Tách rõ trạng thái "đang truy vấn dữ liệu", "đang tổng hợp" và "không đủ quyền" trong giao diện chatbot.
- Chuẩn hóa stale artifact: khi review, rebuttal hoặc Discussion thay đổi, artifact AI cũ phải được đánh dấu không còn hiện hành.

Giá trị kỳ vọng:

Biến các workflow đã có bằng chứng benchmark thành trải nghiệm vận hành đáng tin cậy hơn.

### 5.3.3. Ưu tiên trung hạn: bổ sung nhãn chuyên gia và đánh giá thực tế hơn

Các hướng nên đưa vào:

- Xây dựng bộ nhãn chuyên gia cho gợi ý track trong Submission Autofill để đánh giá Top-K accuracy, MRR hoặc NDCG@K nếu phù hợp.
- Gắn nhãn actionability, groundedness và severity cho finding của Submission Gating tuyến nội dung mềm.
- Thu thập dữ liệu phân công thật hoặc dữ liệu Chair-labeled để đánh giá reviewer matching theo chất lượng nghiệp vụ, không chỉ theo proxy Semantic Scholar.
- Đánh giá Chair Decision Copilot bằng thí nghiệm người dùng có Chair thật: đo thời gian đọc, mức hữu ích, số điểm bất đồng được phát hiện và mức tin tưởng, nhưng vẫn không biến thành bài toán dự đoán quyết định.

Giá trị kỳ vọng:

Nâng các benchmark hiện tại từ mức contract/proxy lên mức gần hơn với đánh giá nghiệp vụ thật.

### 5.3.4. Ưu tiên trung hạn: hoàn thiện nghiệp vụ còn thiếu

Các hướng nên đưa vào:

- Hoàn thiện visibility và quyền trong Discussion theo từng loại thread, từng vai trò và từng trạng thái submission.
- Hoàn thiện camera-ready workflow: deadline runtime, Chair approval, request revision và lịch sử phiên bản.
- Bổ sung bidding vào reviewer assignment, sau đó kết hợp bid với điểm phù hợp chuyên môn, tải công việc và COI.
- Bổ sung backup tự động, kiểm tra restore và tài liệu vận hành.

Giá trị kỳ vọng:

Tăng mức sẵn sàng của hệ thống cho vận hành thật, thay vì chỉ chứng minh prototype có thể chạy.

### 5.3.5. Ưu tiên dài hạn: tăng tính tự chủ và khả năng triển khai thực tế

Các hướng nên đưa vào:

- Đánh giá phương án dùng mô hình open-weight hoặc triển khai on-premise cho các hội nghị có yêu cầu bảo mật cao.
- Mở rộng nguồn dữ liệu COI ngoài Semantic Scholar nếu có điều kiện, ví dụ DBLP hoặc dữ liệu affiliation do hội nghị tự thu thập.
- Tối ưu chi phí bằng caching, batching và chỉ chạy workflow khi có sự kiện thật sự cần thiết.
- Xem xét công bố mã nguồn hoặc bộ benchmark sau khi xử lý quyền dữ liệu, ẩn danh dữ liệu nhạy cảm và mô tả rõ giới hạn sử dụng.

Giá trị kỳ vọng:

Tăng khả năng áp dụng ConferenceSpace ngoài môi trường thử nghiệm, đặc biệt với hội nghị có yêu cầu bảo mật, chi phí và kiểm soát dữ liệu nghiêm ngặt.

### Bảng truy vết hạn chế đến hướng phát triển

| Hạn chế chính | Hướng phát triển tương ứng | Mục tiêu |
|---|---|---|
| Finding của AI còn nhiễu | Hậu kiểm claim-evidence/NLI trong runtime | Giảm false positive và tăng groundedness |
| Một số workflow có độ trễ cao | Queue, retry, progress state, stale artifact | Cải thiện trải nghiệm vận hành |
| Chatbot còn tool-call failure | Cải thiện schema tool, observability và permission tests | Tăng độ ổn định trợ lý nền tảng |
| Thiếu nhãn chuyên gia | Bổ sung expert labels và user studies | Nâng chất lượng kết luận học thuật |
| Reviewer matching cần dữ liệu thật | Thu thập Chair-labeled assignment hoặc historical assignment | Đánh giá chất lượng nghiệp vụ |
| Discussion/camera-ready còn thiếu workflow hoàn chỉnh | Hoàn thiện permission, deadline, approval và versioning | Tăng độ hoàn thiện sản phẩm |
| Phụ thuộc provider LLM bên ngoài | Đánh giá open-weight/on-premise, caching và batching | Tăng tự chủ, kiểm soát chi phí và bảo mật |

---

## Đoạn kết cuối chương cần đạt

Đoạn kết cuối cùng của Chương 5 nên khẳng định luận điểm trung tâm của toàn bộ báo cáo:

ConferenceSpace cho thấy AI có thể được tích hợp vào quy trình xét duyệt bài báo theo cách có kiểm soát khi hệ thống giữ rõ ranh giới giữa nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ. Giá trị chính của AI trong đề tài nằm ở giảm thao tác nhập liệu, tạo điểm neo đọc bài, kiểm tra bản nháp và tổng hợp evidence; giá trị này chỉ có ý nghĩa khi người dùng vẫn có quyền kiểm tra, chỉnh sửa, bỏ qua và chịu trách nhiệm cuối cùng. Vì vậy, kết luận của đề tài không phải là AI có thể thay thế con người trong peer review, mà là một nền tảng được thiết kế đúng ranh giới có thể dùng AI để giảm tải một số điểm nghẽn mà vẫn giữ trách nhiệm học thuật thuộc về con người.

Đoạn này cần viết bằng văn phong khẳng định nhưng thận trọng. Không thêm số liệu mới ở đoạn cuối. Nếu cần nhắc số liệu, số liệu phải đã được phân tích ở 5.1 và có nguồn trực tiếp từ Chương 4.

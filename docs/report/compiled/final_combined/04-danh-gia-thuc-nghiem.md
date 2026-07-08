# Chương 4. Thiết lập thực nghiệm và đánh giá hệ thống

---

## 4.1. Mục tiêu và câu hỏi đánh giá

Chương 3 đã trình bày ConferenceSpace theo kiến trúc ba lớp: lớp nghiệp vụ cốt lõi, lớp thuật toán xác định và lớp AI hỗ trợ. Chương này đánh giá thực nghiệm cả ba lớp đó theo đúng bản chất của từng lớp, thay vì áp dụng một khung đánh giá chung một cách máy móc:

- **Lớp nghiệp vụ cốt lõi** được đánh giá bằng benchmark tải HTTP (k6) và giám sát tài nguyên, nhằm trả lời câu hỏi hệ thống có đáp ứng được về mặt hiệu năng và khả năng chịu tải hay không.
- **Lớp thuật toán** (đối sánh phản biện và phát hiện xung đột lợi ích) được đánh giá bằng Go micro-benchmark đo trực tiếp chi phí tính toán thuần túy, đồng thời đánh giá chất lượng đề xuất trên tập dữ liệu thực từ Semantic Scholar.
- **Lớp AI hỗ trợ** được đánh giá bằng một chuỗi benchmark hai bước: workflow runner sinh output thật trên dữ liệu bài nộp, sau đó TCA benchmark hậu kiểm các output tự luận theo Truthfulness, Coverage và Additionality. Với đầu ra có đáp án tham chiếu rõ như Submission Autofill, chương này dùng các chỉ số deterministic như Exact Match, ROUGE và F1. Với Chatbot Agent, chương này dùng benchmark thủ công theo kịch bản hội thoại, tool-call success, quyền truy cập và trải nghiệm stream.
- Cuối cùng, mức độ đáp ứng nhu cầu người dùng thực tế được đo lường thông qua khảo sát sau sử dụng (UAT) trên ba vai trò Tác giả, Người phản biện và Chủ tọa.

Cách tiếp cận này cho phép trả lời câu hỏi cốt lõi: hệ thống có vận hành ổn định và đủ nhanh (lớp nghiệp vụ + thuật toán) hay không, đồng thời lớp AI có thực sự tạo ra giá trị đáng tin cậy cho người dùng hay không, thay vì chỉ dừng lại ở cảm nhận chủ quan.

### 4.1.1. Các lớp cần đánh giá

Việc đánh giá được tổ chức theo bốn nhóm bằng chứng, tương ứng với cách hệ thống đã được thiết kế ở Chương 3.

| Lớp đánh giá | Đối tượng được kiểm tra | Vai trò trong luận điểm của đề tài |
| :--- | :--- | :--- |
| Nghiệp vụ cốt lõi | API backend, cơ sở dữ liệu, các endpoint CRUD, reviewer suggestion và COI | Chứng minh hệ thống có nền tảng vận hành đủ ổn định để phục vụ quy trình hội nghị, không phụ thuộc vào AI cho các thao tác lõi |
| Thuật toán xác định | Reviewer matching, phát hiện COI và các chỉ số chất lượng xếp hạng/phân công | Chứng minh các tác vụ cần tính nhất quán và khả năng giải thích được xử lý bằng cơ chế xác định, không giao cho AI tạo sinh |
| Workflow AI hỗ trợ | Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent | Kiểm tra AI có tạo được giá trị hỗ trợ ở từng điểm nghẽn hay không, đồng thời giữ đúng ranh giới không thay quyết định học thuật |
| Phản hồi người dùng | Khảo sát sau sử dụng theo các vai trò chính | Đối chiếu kết quả kỹ thuật với cảm nhận và nhu cầu thực tế của người dùng sau khi trải nghiệm hệ thống |

Cách phân lớp này giúp chương đánh giá không trộn lẫn các loại kết luận khác nhau. Một kết quả tốt về tốc độ backend không chứng minh AI đáng tin; một kết quả tốt về groundedness của workflow AI không chứng minh quyết định học thuật đúng; và phản hồi tích cực của người dùng không thay thế benchmark định lượng.

### 4.1.2. Câu hỏi đánh giá và tiêu chí thành công

Chương này tập trung trả lời các câu hỏi đánh giá sau:

| Câu hỏi đánh giá | Nguồn bằng chứng | Tiêu chí diễn giải |
| :--- | :--- | :--- |
| Hệ thống nghiệp vụ có đủ nhanh và ổn định trong điều kiện tải thử nghiệm không? | k6 load test, resource monitor và thống kê lỗi request | Độ trễ p95, throughput, tỷ lệ lỗi và tài nguyên tiêu thụ trong các kịch bản CRUD, Matching và COI |
| Reviewer matching và COI có thể chạy nhanh, có thể giải thích và có baseline so sánh không? | Go micro-benchmark và benchmark chất lượng trên snapshot Semantic Scholar | Thời gian xử lý, Hit@k, MRR, nDCG, coverage, load balance, fallback rate và COI violation |
| Các workflow AI có tạo đầu ra đủ bám chứng cứ để dùng như hỗ trợ không? | Workflow runner, TCA benchmark, benchmark hợp đồng và benchmark hội thoại | Completion, độ trễ, token, truthfulness, coverage, additionality, validity, grounded-valid rate và permission safety |
| Kết quả kỹ thuật có tương ứng với trải nghiệm người dùng không? | Khảo sát sau sử dụng trong chương này | Mức hài lòng, phản hồi định tính, điểm còn gây khó chịu và đề xuất cải thiện |

Tiêu chí thành công của chương không phải là chứng minh hệ thống tự động hóa toàn bộ peer review. Kết luận hợp lệ phải hẹp hơn: hệ thống vận hành được ở quy mô thử nghiệm, thuật toán xác định tạo được gợi ý có thể giải thích, AI hỗ trợ được một số tác vụ cụ thể với mức rủi ro được đo lường, và người dùng vẫn giữ quyền kiểm tra cuối cùng.

### 4.1.3. Liên kết với nhu cầu người dùng ở Chương 2

Các nhóm đánh giá trên được chọn để kiểm chứng trực tiếp bốn nhu cầu chính đã rút ra ở Chương 2.

| Nhu cầu từ Chương 2 | Thành phần được đánh giá ở Chương 4 | Ý nghĩa kiểm chứng |
| :--- | :--- | :--- |
| Giảm thao tác thủ công khi nộp bài | Submission Autofill và Submission Gating | Kiểm tra hệ thống có tự điền metadata, gợi ý hợp lệ và phát hiện lỗi sớm ở mức có thể đo được hay không |
| Giảm tải nhận thức cho reviewer và Chair | Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent | Kiểm tra các workflow hỗ trợ đọc, kiểm tra và tổng hợp có bám nguồn, có kiểm soát quyền và có độ trễ chấp nhận được hay không |
| Tăng kiểm soát rủi ro trong phân công và COI | Reviewer matching, COI benchmark và endpoint liên quan | Kiểm tra cơ chế xác định có đủ nhanh, có thể giải thích và không tạo vi phạm COI trong benchmark hay không |
| AI phải minh bạch và có thể ghi đè | TCA benchmark, benchmark hợp đồng, UAT và phần giới hạn thực nghiệm | Kiểm tra mức độ groundedness của output AI và xác định rõ các trường hợp chỉ được xem là cảnh báo hoặc gợi ý |

Do đó, Chương 4 không chỉ báo cáo số liệu rời rạc. Vai trò của chương là tạo chuỗi bằng chứng từ yêu cầu người dùng, thiết kế hệ thống đến kết quả thực nghiệm, đồng thời chỉ ra rõ phần nào đã được chứng minh và phần nào vẫn cần đánh giá thêm.

---

## 4.2. Thiết lập thực nghiệm

### 4.2.1. Dữ liệu thực nghiệm

Với lớp AI hỗ trợ, tập dữ liệu benchmark được xây dựng từ một tập con chọn lọc của bộ dữ liệu ReviewRebuttal, vốn chứa dữ liệu peer review nhiều giai đoạn từ OpenReview. Nhóm không dùng toàn bộ dữ liệu gốc, mà chọn các bản ghi có đủ thông tin để tái tạo các workflow chính của ConferenceSpace: bài nộp, metadata, review, rebuttal hoặc metareview khi có, cùng ngữ cảnh hội nghị. Cách chọn này giúp benchmark đo đúng các workflow đã triển khai thay vì ép hệ thống chạy trên các bản ghi thiếu dữ liệu.

Tập workflow runner gồm **1.127 bài báo** từ tám hội nghị hoặc track khác nhau. Đây là tập dùng để sinh output thật của các workflow AI và ghi lại thời gian xử lý, token tiêu thụ, trạng thái hoàn tất và các metric deterministic khi có dữ liệu tham chiếu rõ. Trong số đó, **1.097 kết quả đủ điều kiện** được đưa vào TCA benchmark để hậu kiểm chất lượng các output tự luận. Hai mẫu số này không được gộp lại: workflow runner đo khả năng sinh output và vận hành, còn TCA đo mức độ bám chứng cứ của output đã sinh.

**Bảng 4.1: Thống kê tập dữ liệu thử nghiệm theo phân hội (Conference Tracks)**

| Phân loại Hội nghị / Track (Conference Track) | Số lượng bài báo nộp (Papers) | Tỷ lệ (%) |
| :--- | :---: | :---: |
| ICLR 2023 TinyPapers | 215 | 19,08% |
| UAI 2022 Conference | 213 | 18,90% |
| CoRL 2023 Conference | 191 | 16,95% |
| CoRL 2022 Conference | 178 | 15,79% |
| MIDL 2023 Conference | 111 | 9,85% |
| LOG 2022 Conference | 82 | 7,28% |
| MIDL 2023 Short Paper Track | 77 | 6,83% |
| IEEE ICIST 2024 Conference | 60 | 5,32% |
| **Tổng cộng** | **1.127** | **100,00%** |

Ngoài tập workflow runner, một số workflow dùng benchmark riêng vì bản chất đánh giá khác nhau:

- **Gợi ý track trong Submission Autofill:** 48 trường hợp benchmark hợp đồng, dùng để kiểm tra workflow hoàn tất và mọi track được gợi ý đều nằm trong danh sách hợp lệ. Tập này chưa có nhãn chuyên gia để kết luận Top-1 hoặc Top-3 accuracy.
- **Submission Gating:** 8 trường hợp rule check tất định và 24 trường hợp điều hướng nội dung bằng mô hình ngôn ngữ. Tập này tách rõ phần luật có đáp án kỳ vọng với phần cảnh báo mềm chỉ được đọc như tín hiệu hỗ trợ.
- **Chatbot Agent:** 40 hội thoại thuộc 8 nhóm kịch bản, mỗi nhóm chạy 5 biến thể diễn đạt. Tập này dùng để đánh giá outcome workflow, khả năng gọi công cụ, quyền truy cập và trải nghiệm stream.

Với lớp nghiệp vụ cốt lõi và lớp thuật toán, dữ liệu thử nghiệm giữ nguyên như các mục sau: benchmark backend dùng dữ liệu tổng hợp ở quy mô **300 hội nghị, 15.000 bài nộp và 9.000 phản biện viên**, còn đánh giá chất lượng reviewer matching dùng snapshot Semantic Scholar gồm **60 tác giả và 2.565 bài báo** thuộc 8 lĩnh vực khoa học máy tính.

### 4.2.2. Môi trường thực nghiệm

Các nhóm thực nghiệm được chạy trong các môi trường khác nhau vì mỗi nhóm đo một loại hành vi khác nhau. Bảng 4.2 tóm tắt môi trường, công cụ và artifact chính của từng nhóm.

**Bảng 4.2: Môi trường và artifact thực nghiệm**

| Nhóm thực nghiệm | Môi trường/công cụ | Artifact đầu ra | Mục đích |
| :--- | :--- | :--- | :--- |
| Backend HTTP benchmark | Stack backend với PostgreSQL, Neo4j, Redis và API container; tải HTTP sinh bằng k6 | JSON summary theo kịch bản, resource log và resource summary | Đo độ trễ, throughput, lỗi request và tài nguyên tiêu thụ của lớp nghiệp vụ |
| Go micro-benchmark | Go benchmark chạy trực tiếp trên mã thuật toán | `micro.txt` gồm thời gian/op, bộ nhớ/op và số allocation | Tách chi phí thuật toán khỏi chi phí HTTP, serialization và database |
| Reviewer matching quality | Go test suite chạy offline trên snapshot Semantic Scholar | Báo cáo Markdown/CSV về Hit@k, MRR, nDCG, coverage và load balance | Đo chất lượng xếp hạng/phân công của thuật toán xác định trên dữ liệu học thuật thực |
| Workflow runner | Dispatcher-worker; mỗi task tương ứng với một bài nộp | Result package gồm source context, workflow output, stage checkpoint, token và thời gian xử lý | Sinh output thật của các workflow AI trên tập 1.127 bài |
| TCA benchmark | Worker GPU cloud L4, 2 CPU, 4 GB RAM, context length 8192; ModernCE-large-nli và Qwen 3.5 cho chuẩn hóa claim | JSONL kết quả TCA theo từng bài và từng nhóm B1/B2/B3/B5 | Hậu kiểm output tự luận theo truthfulness, coverage và additionality |
| Submission Gating và gợi ý track | Benchmark hợp đồng riêng cho rule check, steering và track hợp lệ | Summary metrics, normalized output và error cases | Kiểm tra rule deterministic, phạm vi cảnh báo mềm và tính hợp lệ của track được gợi ý |
| Chatbot Agent | Benchmark hội thoại theo 8 nhóm kịch bản, mỗi nhóm 5 biến thể | Transcript, manual review, tool-call log và timing | Đánh giá workflow outcome, quyền truy cập, tool-call success và trải nghiệm stream |

Workflow runner dùng router mô hình với cấu hình sinh output bằng **Gemini 3.1 Flash Lite**. TCA benchmark không sinh lại output workflow, mà đọc lại result package đã lưu để đánh giá bằng pipeline riêng. Việc tách hai môi trường này là điều kiện quan trọng để không trộn lẫn năng lực sinh output với năng lực hậu kiểm output.

### 4.2.3. Kịch bản và chỉ số đánh giá

Quy trình thực nghiệm được thiết kế để mỗi kết quả trong chương có thể truy ngược về dữ liệu đầu vào, cách chạy và artifact đầu ra. Bảng 4.3 trình bày các kịch bản chính.

**Bảng 4.3: Quy trình kiểm thử và chỉ số đánh giá**

| Nhóm đánh giá | Quy trình chạy | Chỉ số chính | Giới hạn diễn giải |
| :--- | :--- | :--- | :--- |
| Backend HTTP | Seed dữ liệu ứng dụng, chạy ba kịch bản k6 `CRUD`, `Matching`, `COI` với cấu hình mặc định 20 virtual users trong 30 giây mỗi kịch bản; các threshold được ghi nhận ở dạng report-only | Số request, throughput, median, p90, p95, max latency, error rate | Chứng minh hiệu năng trên workload thử nghiệm, không thay thế stress test dài hạn |
| Resource monitoring | Theo dõi CPU và bộ nhớ theo từng phase khi chạy k6; mỗi mẫu được gắn nhãn `crud`, `matching` hoặc `coi` | CPU trung bình/đỉnh, bộ nhớ trung bình/đỉnh theo process/container | Chỉ phản ánh môi trường benchmark hiện tại, không phải sizing tuyệt đối cho mọi triển khai |
| Go micro-benchmark | Chạy benchmark thuật toán với nhiều quy mô dữ liệu; mỗi benchmark lặp 5 lần và ghi `ns/op`, `B/op`, `allocs/op` | Thời gian xử lý, bộ nhớ và allocation của matching/COI | Đo chi phí tính toán thuần túy, không bao gồm HTTP, database hoặc serialization |
| Reviewer matching quality | Chạy leave-one-out trên snapshot Semantic Scholar; so sánh Jaccard với overlap_count và random baseline | Hit@1, Hit@5, Hit@10, MRR, nDCG@10, coverage, load balance, fallback rate | Đây là proxy về tương đồng chủ đề, chưa phải dữ liệu phân công thật của Chair |
| Workflow runner | Chạy các workflow AI trên dataset ReviewRebuttal đã chọn lọc; lưu checkpoint từng stage và result package cuối | Completion, độ trễ, token, output schema và metric deterministic của Autofill | Đo khả năng sinh output thật, chưa tự chứng minh output tự luận đáng tin |
| TCA benchmark | Đọc result package, trích claim, ghép evidence-claim và dùng NLI để kiểm tra groundedness; coverage/additionality chỉ tính sau truthfulness | Truthfulness, coverage, additionality, validity, grounded-valid rate, high-risk rate | Là proxy tự động cho groundedness, không thay thế đánh giá chuyên gia |
| Submission Gating | Tách rule check deterministic khỏi steering bằng mô hình ngôn ngữ | Verdict accuracy, rule recall, false block count, contract violation, finding count | Rule check có thể kết luận mạnh hơn; steering chỉ là cảnh báo hỗ trợ |
| Chatbot Agent | Chạy 40 hội thoại theo 8 nhóm kịch bản; lưu transcript, tool-call log và đánh giá thủ công outcome | Completion, đạt/đạt một phần/không đạt, tool-call success, permission boundary, TTFT, stream duration | Đủ cho nhận định kịch bản ban đầu, chưa đủ cho kết luận độ ổn định dài hạn |
| Khảo sát người dùng | Thu thập phản hồi sau sử dụng bằng bảng hỏi theo vai trò | Mức hài lòng, độ dễ thao tác, điểm gây khó chịu và góp ý định tính | Dùng để bổ sung góc nhìn người dùng, không thay thế benchmark kỹ thuật |

Với benchmark backend, quy trình chạy đầy đủ gồm bốn bước: seed dữ liệu ứng dụng, chạy tải HTTP, ghi nhận tài nguyên hệ thống và chạy micro-benchmark thuật toán. Bộ seed dùng trong lần đo chính gồm 300 hội nghị, 50 bài nộp mỗi hội nghị và 30 reviewer mỗi hội nghị, tương ứng 15.000 bài nộp và 9.000 quan hệ reviewer-hội nghị. Các kịch bản k6 dùng cùng tập dữ liệu seed để bảo đảm CRUD, Matching và COI được đo trên cùng một bối cảnh vận hành. Go micro-benchmark được chạy riêng vì mục tiêu của nó là đo chi phí thuật toán thuần túy, không bị nhiễu bởi network, database hoặc serialization.

### 4.2.4. Phạm vi và giới hạn của thực nghiệm

Thực nghiệm hiện tại có thể chứng minh ba nhóm kết luận. Thứ nhất, backend và thuật toán xác định có thể vận hành nhanh ở quy mô dữ liệu thử nghiệm. Thứ hai, các workflow AI có thể sinh output thật trên hơn một nghìn bài nộp và một phần output có thể được hậu kiểm bằng metric claim/evidence. Thứ ba, một số workflow đã có bằng chứng vận hành hoặc hợp đồng rõ ràng, chẳng hạn rule check của Submission Gating, metadata extraction của Submission Autofill và permission boundary của Chatbot Agent.

Tuy nhiên, thực nghiệm không chứng minh rằng AI có thể thay reviewer hoặc Chair. TCA là proxy tự động cho groundedness, không thay thế đánh giá chuyên gia đầy đủ. Gợi ý track trong Submission Autofill chưa có nhãn chuyên gia để kết luận độ chính xác lựa chọn track. Submission Gating tuyến nội dung chưa có nhãn thủ công cho từng finding. Chair Decision Copilot chưa được benchmark bằng decision label match, nên không được trình bày như bộ phân loại accept/reject. Chatbot Agent mới được đánh giá trên 40 hội thoại, đủ cho nhận định kịch bản ban đầu nhưng chưa đủ để kết luận độ ổn định dài hạn.

### 4.2.5. Bộ dữ liệu đối chứng và quy trình chấm điểm benchmark

Các workflow AI dùng ba kiểu đối chứng khác nhau:

- **Đối chứng deterministic:** Submission Autofill dùng metadata tham chiếu từ dữ liệu bài nộp để tính exact match, ROUGE và F1. Submission Gating rule check dùng fixture có expected verdict và expected rule ID.
- **Đối chứng proxy claim/evidence:** Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot dùng TCA để kiểm tra quan hệ giữa claim của workflow và evidence từ paper, review hoặc metareview. Coverage đo mức giao nhau với output con người, còn Additionality đo phần đúng nhưng bổ sung ngoài nội dung con người ghi rõ.
- **Đối chứng theo kịch bản:** Chatbot Agent dùng bộ hội thoại được thiết kế theo vai trò author, reviewer và Chair, sau đó đánh giá thủ công xem câu trả lời cuối có giải quyết đúng yêu cầu, bám dữ liệu nền tảng và giữ đúng quyền truy cập hay không.

Các raw artifacts gồm JSON/JSONL/CSV cho workflow runner, TCA, Submission Gating, gợi ý track trong Submission Autofill và Chatbot Agent. Sự tồn tại của raw output giúp truy ngược từ số liệu tổng hợp về từng task, từng response và từng finding khi cần kiểm tra lại. Trong báo cáo, các bảng kết quả lấy số liệu từ các báo cáo benchmark đã tổng hợp, còn raw output đóng vai trò bằng chứng truy xuất và kiểm tra provenance.

---

## 4.3. Đánh giá lớp nghiệp vụ cốt lõi

Bên cạnh độ chính xác của lớp AI, hiệu năng vận hành của lớp nghiệp vụ cốt lõi quyết định trực tiếp khả năng triển khai thực tế của ConferenceSpace, vì đây là lớp phục vụ mọi thao tác thường trực của người dùng (đăng nhập, xem danh sách, phân công phản biện, kiểm tra xung đột lợi ích) mà không phụ thuộc dịch vụ AI bên ngoài.

### 4.3.1. Kịch bản tải HTTP

Bộ benchmark backend kết hợp hai lớp đo lường bổ sung cho nhau. k6 đo độ trễ và thông lượng đầu-cuối qua các endpoint HTTP thật, phản ánh góc nhìn của người dùng khi hệ thống đã đi qua API, database và middleware. Go micro-benchmark đo trực tiếp chi phí thuật toán trong tiến trình, phản ánh chi phí tính toán thuần túy sau khi loại bỏ chi phí mạng, serialization và truy vấn dữ liệu. Ba kịch bản tải HTTP được thực thi trên tập dữ liệu 300 hội nghị, 15.000 bài nộp, 9.000 phản biện viên và không ghi nhận lỗi trong giai đoạn seed dữ liệu:

- **CRUD:** đăng nhập, liệt kê hội nghị, liệt kê bài nộp, liệt kê người dùng — các thao tác đọc/ghi phổ biến nhất, phụ thuộc nhiều vào PostgreSQL.
- **Matching:** gọi endpoint gợi ý/tự động phân công phản biện — kịch bản tính toán nặng nhất của lớp thuật toán.
- **COI:** gọi endpoint kiểm tra xung đột lợi ích, bao gồm cả truy vấn đồ thị đồng tác giả trên Neo4j.

### 4.3.2. Kết quả hiệu năng backend

Cả ba kịch bản đều ghi nhận **tỷ lệ lỗi request bằng 0%** với toàn bộ điều kiện kiểm tra đều đạt. Bảng 4.4 tổng hợp kết quả đo được:

**Bảng 4.4: Kết quả tải HTTP theo kịch bản (k6)**

| Kịch bản | Số request | Throughput | Trung vị (Median) | p90 | p95 | Tối đa (Max) | Trung bình (Avg) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| CRUD | 11.110 | 369 req/s | 46,2 ms | 100,5 ms | 117,6 ms | 403,6 ms | 51,8 ms |
| Matching | 17.184 | 572 req/s | 9,7 ms | 50,8 ms | 71,8 ms | 254,7 ms | 19,0 ms |
| COI | 16.760 | 558 req/s | 9,5 ms | 56,5 ms | 79,3 ms | 293,9 ms | 20,4 ms |

*Nhận xét:* Backend xử lý được hàng trăm request/giây ở quy mô 15.000 bài nộp với độ trễ p95 dưới 120 ms ở cả ba kịch bản. Đáng chú ý, các endpoint Matching và COI — vốn là các thao tác tính toán trên lớp thuật toán — có độ trễ trung vị (9,5–9,7 ms) thấp hơn nhiều so với CRUD (46,2 ms), cho thấy bản thân thuật toán đối sánh và phát hiện COI không phải là điểm nghẽn; điểm nghẽn nằm ở các truy vấn CRUD phụ thuộc PostgreSQL với dữ liệu quan hệ lớn.

### 4.3.3. Tài nguyên tiêu thụ và điểm nghẽn vận hành

Trung bình trong suốt quá trình chạy tải, container API duy trì ở mức nhẹ (trung bình 28% CPU của một nhân, đỉnh 43%; ~30 MB RAM). Ngược lại, **PostgreSQL là điểm tiêu thụ tài nguyên lớn nhất** (trung bình ~115% CPU — tức hơn một nhân, đỉnh 163%; ~204 MB RAM, đỉnh 222 MB). Neo4j gần như không tải (~508 MB RAM, dưới 1% CPU) và Redis rất nhẹ (~9 MB RAM) trong các kịch bản này.

Kết quả này khẳng định thiết kế tách lớp AI khỏi lớp nghiệp vụ cốt lõi (Go backend nhẹ, không giữ trạng thái nặng) là hợp lý: cơ sở dữ liệu quan hệ mới là ràng buộc chính khi mở rộng quy mô, không phải tầng ứng dụng.

---

## 4.4. Đánh giá lớp thuật toán xác định

### 4.4.1. Thuật toán đối sánh phản biện (Greedy Matching & Jaccard Similarity)

Thuật toán sử dụng chỉ số **Domain Jaccard Similarity** để tính toán độ tương đồng chuyên môn giữa lĩnh vực của phản biện viên (lấy từ hồ sơ Semantic Scholar) và chủ đề bài nộp, kết hợp thuật toán gán tham lam (Greedy) có xét ràng buộc cân bằng tải (số lượng bài phản biện tối đa/tối thiểu cho mỗi reviewer). Vì hoạt động xác định, hệ thống có thể hiển thị điểm phù hợp và lý do đề xuất cho từng cặp phản biện – bài nộp, giúp Chair hiểu vì sao một phản biện viên được đề xuất thay vì chỉ nhận một danh sách "hộp đen".

Về mặt hiệu năng, kết quả Go micro-benchmark cho thấy thuật toán chạy ở mức **131 µs đến 56 ms** tùy quy mô dữ liệu (từ vài chục đến vài nghìn bài nộp/phản biện viên), đủ nhanh để phục vụ tương tác gần thời gian thực khi Chair yêu cầu gợi ý phân công.

**Bảng 4.5: Kết quả Go micro-benchmark theo thuật toán**

| Thuật toán | Nhỏ (Small) | Trung bình (Medium) | Lớn (Large) |
| :--- | :---: | :---: | :---: |
| Phát hiện COI (COI detection) | 14,9 µs/op (27,8 KB, 241 allocs) | 147 µs/op (283 KB, 2.073 allocs) | 653 µs/op (1,13 MB, 8.123 allocs) |
| Đối sánh phản biện (Reviewer matching) | 131 µs/op (82 KB, 31 allocs) | 6,1 ms/op (2,47 MB, 42 allocs) | 56 ms/op (24,2 MB, 55 allocs) |

*Nhận xét:* Cả hai thuật toán đều hoạt động ở mức micro-giây đến mili-giây, phù hợp cho tương tác gần thời gian thực. Thuật toán đối sánh phản biện tăng chi phí nhanh hơn theo kích thước dữ liệu (từ 131 µs lên đến 56 ms khi tăng từ quy mô nhỏ lên lớn) do độ phức tạp tính toán ma trận điểm phù hợp giữa tập bài nộp và tập phản biện viên tăng theo tích số hai chiều, trong khi phát hiện COI có chi phí tăng chậm hơn (từ 14,9 µs lên 653 µs) vì phần lớn kiểm tra là so khớp tập hợp đơn giản (self-author, declared conflict).

### 4.4.2. Độ chính xác và chất lượng của reviewer matching

Phần này đánh giá chất lượng đề xuất của thuật toán đối sánh phản biện thông qua benchmark chất lượng chạy offline trên snapshot dữ liệu thực từ Semantic Scholar API. Cách chạy này đảm bảo kết quả tái lập 100% (deterministic) và không phụ thuộc vào dịch vụ bên ngoài trong quá trình đánh giá.

#### Dữ liệu và phương pháp ground truth

Tập dữ liệu được thu thập từ Semantic Scholar API ngày 05/07/2026, bao gồm **60 tác giả** và **2.565 bài báo** thuộc 8 lĩnh vực khoa học máy tính: xử lý ngôn ngữ tự nhiên, thị giác máy tính, mạng nơ-ron đồ thị, học tăng cường, truy xuất thông tin, nhận dạng giọng nói, học máy và học sâu. Quy trình thu thập: (1) tìm kiếm bài báo theo 8 chủ đề seed; (2) trích xuất tác giả từ danh sách bài báo (tối đa 15 tác giả/chủ đề); (3) thu thập tối đa 50 bài báo/tác giả qua API `GetAuthorPapers`; (4) loại bỏ tác giả có ít hơn 2 bài báo (điều kiện cần cho leave-one-out); (5) giữ lại 60 tác giả có nhiều bài nhất.

**Bảng 4.6: Thống kê tập dữ liệu đánh giá đối sánh**

| Chỉ số | Giá trị |
| :--- | :---: |
| Số tác giả (reviewer pool) | 60 |
| Tổng số bài báo | 2.565 |
| Số truy vấn leave-one-out | 60 |
| Số chủ đề duy nhất | 14.096 |
| Trung bình chủ đề/bài báo | 11,66 |
| Trung bình bài báo/tác giả | 42,75 |
| Trung vị bài báo/tác giả | 34 |
| Tối thiểu — Tối đa bài báo/tác giả | 2 — 200 |

Vì không tồn tại gold-standard dataset cho bài toán đối sánh phản biện, nhóm sử dụng phương pháp **leave-one-out authorship proxy**. Với mỗi tác giả, một bài báo được giữ lại làm truy vấn; hệ thống xếp hạng tất cả tác giả còn lại theo độ tương đồng chuyên môn với bài báo truy vấn. Nếu tác giả gốc xuất hiện ở vị trí cao trong danh sách xếp hạng, điều đó cho thấy thuật toán nắm bắt được liên kết chủ đề giữa tác giả và bài báo. Phương pháp này có giới hạn: tác giả có thể quá gần gũi với công trình của chính mình để làm phản biện khách quan, và một số tác giả có danh mục nghiên cứu rộng khiến họ xuất hiện liên quan với nhiều bài báo ngoài lĩnh vực chuyên môn thực sự. Tuy nhiên, trong bối cảnh thiếu ground truth thực tế từ phân công của Chair, đây là proxy khả dụng để đánh giá khả năng nắm bắt tương đồng chuyên môn.

#### Chất lượng xếp hạng gợi ý phản biện (Reviewer Ranking)

Thuật toán sản xuất sử dụng **Jaccard Similarity** trên tập từ khóa được trích xuất từ tiêu đề bài báo và thẻ lĩnh vực (field tags) của Semantic Scholar. Kết quả được so sánh với hai baseline: (1) **overlap_count** — đếm thô số chủ đề chung (không chuẩn hóa); (2) **random** — xếp hạng ngẫu nhiên. Các chỉ số đánh giá bao gồm:

- **Hit@k**: tỷ lệ truy vấn mà tác giả gốc nằm trong top-k gợi ý. Vì mỗi truy vấn chỉ có đúng một tác giả "đúng", Hit@k tương đương Recall@k.
- **MRR** (Mean Reciprocal Rank): trung bình nghịch đảo thứ hạng của tác giả gốc — chỉ số tổng hợp đơn lẻ phản ánh chất lượng xếp hạng tổng thể.
- **nDCG@k**: độ lợi tích lũy có chiết khấu chuẩn hóa — cho phép tính điểm từng phần khi tác giả gốc xếp thứ 2 (tốt hơn thứ 10).

**Bảng 4.7: Kết quả xếp hạng gợi ý phản biện**

| Phương pháp | Hit@1 | Hit@5 | Hit@10 | MRR | nDCG@10 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **jaccard** (sản xuất) | **0,250** | **0,550** | 0,650 | **0,392** | 0,442 |
| overlap_count | 0,233 | 0,550 | **0,733** | 0,391 | **0,463** |
| random | 0,017 | 0,083 | 0,167 | 0,078 | 0,076 |
| *Lý thuyết random* | *0,017* | *0,083* | *0,167* | *0,078* | — |

*Nhận xét:* Thuật toán Jaccard đạt **MRR = 0,392**, gấp **5 lần** so với baseline ngẫu nhiên (0,078). Giá trị MRR ngẫu nhiên khớp chính xác với lý thuyết (H(N)/N với N = 60), xác nhận benchmark hoạt động đúng. **Hit@5 = 55%** — trong hơn một nửa số trường hợp, tác giả gốc xuất hiện trong 5 gợi ý đầu tiên; đối với hội nghị có hàng trăm phản biện viên, điều này thu hẹp đáng kể không gian tìm kiếm của Chair. **Hit@10 = 65%** — hai phần ba số trường hợp tác giả gốc nằm trong top 10.

Đáng chú ý, **overlap_count vượt trội Jaccard ở Hit@10 và nDCG@10** (0,733 vs 0,650 và 0,463 vs 0,442). Điều này cho thấy việc đếm thô số chủ đề chung đôi khi mang lại khả năng thu hồi rộng hơn, trong khi chuẩn hóa bằng Jaccard giúp cải thiện độ chính xác ở đầu danh sách (Hit@1 cao hơn: 0,250 vs 0,233). Sự khác biệt nhỏ này gợi ý rằng cả hai phương pháp đều có giá trị tùy ngữ cảnh: Jaccard cho gợi ý top-k chặt chẽ, overlap_count cho khám phá rộng hơn.

#### Chất lượng phân công tối ưu (Assignment Optimization)

Thuật toán gán tham lam (Greedy) được đánh giá bằng các chỉ số nội tại (intrinsic metrics) vì không tồn tại ground truth cho phân công tối ưu. Các chỉ số bao gồm:

- **Coverage**: tỷ lệ bài báo được phân công ít nhất một reviewer.
- **Load StdDev / Load Gini**: độ lệch chuẩn và hệ số Gini của phân phối bài báo/reviewer — đo công bằng tải.
- **COI Violations**: số bài báo bị gán cho chính tác giả của nó — phải bằng 0 về mặt đạo đức.
- **Mean Score / Min Score**: điểm Jaccard trung bình và thấp nhất của các cặp phân công — đo chất lượng phù hợp.
- **Fallback Rate**: tỷ lệ phân công rơi về ngẫu nhiên khi không còn reviewer hợp lệ có độ tương đồng > 0.

**Bảng 4.8: Kết quả phân công tối ưu**

| Phương pháp | Coverage | Load StdDev | Load Gini | COI Violations | Mean Score | Min Score | Fallback Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **greedy** (sản xuất) | 0,659 | 9,316 | 0,049 | **0** | **0,011** | 0,000 | 0,233 |
| round_robin | **1,000** | 0,940 | 0,005 | **0** | 0,004 | 0,000 | 0,000 |
| random | **1,000** | 1,756 | 0,005 | **0** | 0,004 | 0,000 | 0,000 |

*Nhận xét:* Greedy đạt **điểm trung bình cao gấp 2,75 lần** so với các baseline (0,011 vs 0,004), xác nhận rằng tối ưu hóa có xét điểm phù hợp tạo ra các cặp phân công chất lượng hơn đáng kể. **Zero COI violations** trên tất cả phương pháp — hệ thống ràng buộc đạo đức hoạt động chính xác.

Tuy nhiên, **coverage chỉ đạt 65,9%** so với 100% của các baseline. Đây là hệ quả của thiết kế **ưu tiên chất lượng**: Greedy gán mỗi bài báo cho reviewer có độ tương đồng cao nhất còn khả dụng. Các bài báo đầu tiên "chiếm" những reviewer tốt nhất; khi đến các bài sau, những reviewer còn lại có độ tương đồng gần bằng 0, và cơ chế fallback gán ngẫu nhiên cũng cuối cùng cạn kiệt pool. Tỷ lệ fallback **23,3%** phản ánh hiện tượng này. Vì vậy, cơ chế phân công tự động nên được xem là lớp đề xuất ưu tiên các cặp có tín hiệu phù hợp rõ ràng; các bài chưa được gán hoặc có tín hiệu yếu cần được Chair xem xét lại trước khi chốt phân công.

**Công bằng tải:** Greedy có Load StdDev cao hơn đáng kể (9,316 vs 0,940–1,756) vì tập trung các phân công chất lượng vào một nhóm reviewer nhỏ. Hệ số Gini 0,049 cho thấy bất bình đẳng vừa phải — không cực đoan nhưng đáng chú ý. Đây là sự đánh đổi (trade-off) cố hữu giữa chất lượng phân công và công bằng tải, có thể điều chỉnh bằng tham số giới hạn tải tối đa/tối thiểu trong thuật toán.

#### So sánh với dữ liệu tổng hợp (synthetic)

Cùng benchmark đã chạy trên tập dữ liệu tổng hợp (60 tác giả, 250 bài báo) trước khi có dữ liệu thực. So sánh cho thấy:

**Bảng 4.9: So sánh kết quả giữa dữ liệu tổng hợp và dữ liệu thực**

| Chỉ số | Synthetic | Thực tế | Chênh lệch |
| :--- | :---: | :---: | :---: |
| Jaccard MRR | 0,320 | 0,392 | +22% |
| Jaccard Hit@5 | 0,680 | 0,550 | −19% |
| Jaccard Hit@10 | 0,870 | 0,650 | −25% |
| Greedy Mean Score | 0,340 | 0,011 | −97% |
| Greedy Coverage | 0,750 | 0,659 | −12% |

*Nhận xét:* Các chỉ số xếp hạng (MRR, Hit@k) ổn định giữa hai tập dữ liệu — MRR thậm chí cải thiện trên dữ liệu thực nhờ vốn từ vựng chủ đề phong phú hơn (14.096 vs ~800 chủ đề). Hit@k giảm vì tác giả thực có danh mục nghiên cứu đa dạng hơn tác giả tổng hợp, khiến nhiệm vụ leave-one-out khó hơn. Sự sụt giảm điểm phân công (0,340 → 0,011) phản ánh **"trần từ vựng" (lexical ceiling)** — hai nhà nghiên cứu cùng trong "thị giác máy tính" nhưng một làm nhận diện đối tượng, một làm y học hình ảnh, sẽ có ít từ khóa trùng lặp dù cùng lĩnh vực. Đây là giới hạn căn bản của phương pháp dựa trên từ khóa, không phải lỗi thuật toán.

#### Giới hạn và ý nghĩa

**Trần từ vựng (Lexical Ceiling):** Điểm Jaccard trung bình thấp (0,011) là đặc tính cố hữu của phương pháp dựa trên tập từ khóa, không phải dấu hiệu thuật toán kém. Hai nhà nghiên cứu cùng lĩnh vực lớn nhưng chuyên đề khác nhau sẽ có ít từ khóa giao nhau. Điều này thiết lập một **baseline đo lường được** (MRR 0,392, mean score 0,011) để so sánh với các phương pháp embedding (BERT, SciBERT) trong tương lai.

**Proxy ground truth:** Phương pháp leave-one-out authorship có thiên lệch: tác giả có thể quá gần công trình của mình để làm phản biện khách quan, và tác giả đa lĩnh vực xuất hiện liên quan với nhiều bài ngoài chuyên môn thực sự. Không có ground truth từ phân công thực tế của Chair, các chỉ số này phản ánh khả năng nắm bắt chủ đề chứ không phải chất lượng phản biện thực tế.

**Quy mô dữ liệu:** 60 tác giả là nhỏ so với hội nghị thực tế (ICLR: ~2.000 phản biện viên). Tuy nhiên, quy mô này đủ để so sánh tương đối giữa thuật toán và baseline, cũng như để phát hiện các đặc tính hệ thống như trade-off coverage–quality. Mở rộng quy mô lớn hơn sẽ đòi hỏi tìm kiếm láng giềng gần xấp xỉ (ANN) cho xếp hạng và thuật toán gán hiệu quả hơn (Hungarian, max-flow).

### 4.4.3. Cơ chế phát hiện xung đột lợi ích (COI) đa tầng

Hệ thống triển khai cơ chế phát hiện COI theo ba lớp bổ sung nhau: (1) kiểm tra tự phản biện — phát hiện trường hợp phản biện chính là tác giả bài nộp; (2) khai báo thủ công — cho phép người dùng tự khai báo quan hệ xung đột; (3) phân tích đồ thị đồng tác giả trên Neo4j — quét mạng lưới đồng tác giả trích xuất từ Semantic Scholar để tìm các liên kết đồng tác giả trực tiếp và gián tiếp (1–3 bậc) trong cửa sổ thời gian cấu hình được (ví dụ: đã từng đồng tác giả trong vòng 3 năm qua). Thiết kế theo Composite pattern cho phép hai lớp đầu luôn sẵn sàng trong khi lớp Neo4j tự động bật/tắt tùy cấu hình, đảm bảo hệ thống vẫn vận hành được khi không có dữ liệu đồ thị (graceful degradation).

Về hiệu năng, Bảng 4.3 cho thấy cơ chế phát hiện COI (bao gồm cả truy vấn Neo4j) chỉ tốn **14,9 µs đến 653 µs** tùy quy mô dữ liệu — nhanh hơn đáng kể so với thuật toán đối sánh phản biện, do phần lớn phép kiểm tra là so khớp tập hợp đơn giản.

### 4.4.4. Giới hạn hiện tại về chất lượng đề xuất

Dữ liệu thực nghiệm hiện tại đã vượt qua mức chỉ đo tốc độ thực thi: mục 4.4.2 đã bổ sung benchmark leave-one-out trên dữ liệu Semantic Scholar thực, bao gồm các chỉ số ranking (Hit@k, MRR, nDCG) và assignment (coverage, load balance, fallback rate). Tuy nhiên, các chỉ số này vẫn là **proxy về mức độ phù hợp chuyên môn**, chưa phải dữ liệu phân công thật của Chair trong một hội nghị đang vận hành. Vì vậy, chương này chỉ kết luận rằng thuật toán có khả năng xếp hạng và phân công theo tín hiệu chuyên môn đo được; chưa kết luận mức độ chấp nhận đề xuất của Chair hoặc chất lượng phản biện thực tế sau phân công.

Tương tự, dữ liệu hiện có chưa lượng hóa được **số lượng quan hệ COI ẩn** mà lớp phân tích đồ thị phát hiện thêm so với chỉ dựa vào khai báo thủ công — chỉ số quan trọng để chứng minh giá trị gia tăng thực sự của lớp Neo4j. Đây là những hạn chế được ghi nhận rõ ràng để bổ sung ở giai đoạn thực nghiệm tiếp theo.


---

## 4.5. Đánh giá các workflow AI

### 4.5.1. Kiến trúc benchmark workflow AI và nguyên tắc diễn giải kết quả

Các workflow AI của ConferenceSpace không tạo cùng một loại đầu ra, nên chương này không dùng một chỉ số chung như "accuracy" cho toàn bộ lớp AI. Submission Autofill tạo metadata có dữ liệu tham chiếu rõ; Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot tạo đầu ra tự luận cần kiểm tra bằng quan hệ claim/evidence; Chatbot Agent là một agent tương tác với công cụ nội bộ, nên phải đánh giá theo outcome hội thoại và quyền truy cập.

Benchmark được tổ chức thành hai lớp chính. Lớp thứ nhất là **workflow runner**, dùng để chạy workflow thật trên dataset, lưu output, thời gian xử lý, token tiêu thụ, trạng thái hoàn tất và các metric deterministic khi có thể tính trực tiếp. Lớp thứ hai là **TCA benchmark**, đọc lại output đã lưu để đánh giá Truthfulness, Coverage và Additionality. Cách tách generator và evaluator này giúp báo cáo không trộn lẫn giữa việc workflow sinh được output và việc output đó có đáng tin hay không.

Ba khái niệm TCA được đọc như sau. Truthfulness trả lời câu hỏi claim của workflow có được nguồn dữ liệu hỗ trợ hay không. Coverage đo phần claim đúng có giao nhau với output của con người như review hoặc metareview. Additionality đo phần claim đúng mà con người không ghi rõ trong output tham chiếu. Coverage thấp vì vậy không tự động là lỗi: trong peer review, review và metareview thường là bản ghi chọn lọc, không phải danh sách đầy đủ mọi điều người đánh giá đã cân nhắc.

Nguyên tắc quan trọng nhất khi đọc các kết quả dưới đây là giới hạn kết luận theo bằng chứng thật. Kết quả groundedness tốt không chứng minh AI thay được reviewer. Kết quả latency tốt không chứng minh output đúng. Kết quả track hợp lệ không chứng minh track được chọn là đúng theo chuyên gia. Kết quả decision brief có evidence truthfulness cao không chứng minh hệ thống chọn đúng accept/reject.

### 4.5.2. Tổng hợp mức bằng chứng theo workflow

**Bảng 4.10: Nguồn số liệu và kết luận được phép rút ra cho từng workflow AI**

| Workflow | Nguồn số liệu chính | Mẫu số | Metric chính | Kết luận được phép rút ra |
| :--- | :--- | :---: | :--- | :--- |
| Submission Autofill metadata | Workflow runner | 1.127 bài | Title match, title token F1, ROUGE, keyword/author F1, completion rate | Workflow hỗ trợ tạo bản nháp metadata tốt đến mức nào |
| Gợi ý track trong Submission Autofill | Benchmark hợp đồng riêng | 48 trường hợp | Completion, invalid track rate, latency | Workflow có hoàn tất và giữ track trong danh sách hợp lệ không; chưa kết luận accuracy chuyên gia |
| Submission Gating | Rule/steering benchmark | 8 rule cases, 24 steering cases | Verdict accuracy, rule recall, false block, contract violation | Rule check có đáng tin không; steering có giữ đúng phạm vi hỗ trợ không |
| Reviewer Initial Analysis | Workflow runner + TCA | 1.127 runner, 1.097 TCA | Quote grounded rate, fabrication rate, attention truthfulness, coverage, additionality | Workflow hỗ trợ reviewer định hướng đọc bài đáng tin đến đâu |
| Review Quality Auditor | Workflow runner + TCA | 3.658 audit | Finding count, status distribution, truthfulness, validity, grounded-valid rate | Workflow phát hiện rủi ro review hữu ích đến đâu và nhiễu ở mức nào |
| Chair Decision Copilot | Workflow runner + TCA | 1.127 runner, 1.097 TCA | Evidence truthfulness, disagreement truthfulness, additionality, high-risk rate | Workflow hỗ trợ Chair tổng hợp evidence tốt đến đâu; không đo accept/reject |
| Chatbot Agent | Manual evidence-based benchmark | 40 hội thoại | Workflow outcome, tool-call success, permission safety, TTFT, stream duration | Chatbot hỗ trợ tra cứu và thao tác nền tảng tốt đến đâu |

Bảng này cũng là ranh giới diễn giải cho toàn bộ mục 4.5. Những phần có ground truth rõ có thể kết luận mạnh hơn. Những phần dùng proxy hoặc đánh giá thủ công theo kịch bản chỉ nên kết luận trong phạm vi metric đó.

### 4.5.3. Submission Autofill

Submission Autofill được đánh giá như một workflow hỗ trợ tác giả chuẩn bị form nộp bài từ bản thảo PDF và ngữ cảnh hội nghị. Kết quả tốt ở workflow này không có nghĩa hệ thống thẩm định chất lượng nghiên cứu; nó chỉ chứng minh các trường thông tin căn bản được tạo đủ tốt để người dùng kiểm tra nhanh và chỉnh sửa khi cần.

#### 4.5.3.1. Pipeline trích xuất và chuẩn bị metadata cho form

Trên 1.127 bài, phần metadata extraction đạt kết quả mạnh ở các trường ngắn và có cấu trúc rõ. **Title exact match đạt 91,22%**, trong khi **Title token F1 đạt 98,20%**, cho thấy nhiều khác biệt còn lại chỉ là khác biệt nhỏ về định dạng hoặc dấu câu. **Keyword F1 đạt 92,77%**, phù hợp với vai trò gợi ý nhanh cho người dùng xác nhận. **Abstract ROUGE-1 đạt 83,64%** và **ROUGE-L đạt 83,25%**, là mức hợp lý vì abstract dài hơn và nhạy với khác biệt diễn đạt. **Author F1 đạt 83,49%**, thấp hơn title và keyword, phản ánh việc trích xuất tác giả dễ bị ảnh hưởng bởi định dạng PDF, thứ tự tên, ký hiệu affiliation hoặc thông tin bị thiếu.

**Bảng 4.11: Kết quả Submission Autofill metadata**

| Chỉ số | Trung bình | Trung vị | Thấp nhất | Cao nhất |
| :--- | ---: | ---: | ---: | ---: |
| Title exact match | 91,22% | 100,00% | 0,00% | 100,00% |
| Title token F1 | 98,20% | 100,00% | 0,00% | 100,00% |
| Abstract ROUGE-1 | 83,64% | 85,49% | 3,64% | 100,00% |
| Abstract ROUGE-L | 83,25% | 85,42% | 3,64% | 100,00% |
| Keyword F1 | 92,77% | 100,00% | 0,00% | 100,00% |
| Author F1 | 83,49% | 100,00% | 0,00% | 100,00% |
| Required field completion rate | 86,93% | 100,00% | 0,00% | 100,00% |

Điểm cần đọc thận trọng là các giá trị thấp nhất bằng 0 ở nhiều trường. Điều này cho thấy workflow có trường hợp thất bại hoàn toàn, thường do dữ liệu đầu vào thiếu, PDF khó đọc hoặc định dạng khác thường. Cách sử dụng đúng là tạo bản nháp để người dùng xác nhận, không tự động khóa dữ liệu sau khi autofill.

Về vận hành, workflow chạy trên 1.127 bài với thời gian trung bình **10,64 giây**, trung vị **9,32 giây** và trường hợp cao nhất **102,20 giây**. Token trung bình là **4.094 token**, trung vị **4.058 token** và cao nhất **6.496 token**. Điều này đủ hợp lý cho một thao tác hỗ trợ trước khi nộp bài, nhưng các outlier trên một phút cần được theo dõi vì có thể làm gián đoạn trải nghiệm nhập liệu.

#### 4.5.3.2. Gợi ý track trong Submission Autofill

Phần gợi ý track được đánh giá như một sub-output nằm trong Submission Autofill, không phải một workflow gợi ý track độc lập. Benchmark hiện tại gồm 48 trường hợp, tập trung vào hợp đồng đầu ra: workflow phải hoàn tất và mọi track được gợi ý phải thuộc danh sách track hợp lệ của hội nghị đang xét.

**Bảng 4.12: Kết quả gợi ý track trong Submission Autofill**

| Chỉ số | Kết quả |
| :--- | ---: |
| Số trường hợp benchmark riêng | 48 |
| Hoàn tất | 48 / 48 |
| Invalid track rate | 0,00% |
| Thời gian xử lý trung bình | 18,19 giây |
| Thời gian xử lý trung vị | 17,54 giây |
| Thời gian xử lý cao nhất | 37,42 giây |

Kết quả này chứng minh tính an toàn hợp đồng: hệ thống hoàn tất toàn bộ trường hợp và không gợi ý track ngoài danh sách hợp lệ. Tuy nhiên, vì benchmark chưa có nhãn chuyên gia về track đúng nhất, báo cáo không được kết luận Top-1 accuracy, Top-3 acceptance, MRR hoặc NDCG@K. Kết luận bảo vệ được ở thời điểm này là: workflow có thể tạo danh sách track hợp lệ để người dùng cân nhắc, nhưng chưa chứng minh được độ chính xác học thuật của thứ hạng track.

### 4.5.4. Submission Gating

Submission Gating được đánh giá ở hai tuyến riêng để tránh thổi phồng năng lực hệ thống. Tuyến thứ nhất là rule check tất định, dùng các điều kiện có thể đối chiếu trực tiếp với đáp án kỳ vọng. Tuyến thứ hai là điều hướng nội dung bằng mô hình ngôn ngữ, chỉ được dùng để sinh cảnh báo hỗ trợ, không được biến thành quyết định loại bài tự động.

**Bảng 4.13: Kết quả Submission Gating**

| Tuyến đánh giá | Mẫu số | Kết quả chính | Diễn giải |
| :--- | ---: | :--- | :--- |
| Rule check tất định | 8 trường hợp | Hoàn tất 8/8; blocking verdict accuracy 100,00%; rule ID recall 100,00%; false block count 0; latency trung bình 0,08 giây | Chứng minh rule check cơ bản chạy đúng trên bộ fixture hiện tại |
| Điều hướng nội dung | 24 trường hợp | Hoàn tất 24/24; sinh 26 finding nội dung; contract violation block tự động 0; latency trung bình 11,83 giây | Chứng minh workflow sinh được cảnh báo hỗ trợ và giữ đúng ranh giới không tự động loại bài |

Kết quả tốt nhất của Submission Gating nằm ở phần có luật rõ ràng. Phần rule check có thể đặt ở đầu quy trình nộp bài vì vừa nhanh vừa dễ giải thích. Tuyến điều hướng nội dung có giá trị ở việc phát hiện vấn đề mềm, nhưng chưa có nhãn thủ công cho groundedness, actionability và severity của từng finding. Vì vậy, báo cáo chỉ nên kết luận rằng hệ thống tạo cảnh báo đúng phạm vi và không vượt quyền, chưa nên tuyên bố độ chính xác nội dung của các cảnh báo đó.

### 4.5.5. Reviewer Initial Analysis

Reviewer Initial Analysis được thiết kế để hỗ trợ người phản biện định hướng đọc bài trước khi viết review. Workflow tạo briefing, claimed contributions, review readiness signals, attention points và annotation bám vào nội dung bài. Nó không được thiết kế để chấm điểm bài báo hoặc thay reviewer đưa ra nhận xét học thuật cuối cùng.

Về vận hành, workflow chạy trên dataset runner với thời gian trung bình **39,18 giây**, trung vị **37,53 giây** và cao nhất **126,36 giây**. Token trung bình là **11.575 token**. Mỗi bài có trung bình **4,94 claimed contributions**, **6,09 reviewer attention points** và **16,74 annotation**, cho thấy đầu ra đủ giàu để phục vụ vai trò bản đồ đọc bài, nhưng phù hợp hơn với tác vụ chạy trước hoặc bất đồng bộ thay vì phản hồi tức thời.

**Bảng 4.14: Kết quả TCA của Reviewer Initial Analysis**

| Chỉ số | Trung bình | Trung vị | Thấp nhất | Cao nhất |
| :--- | ---: | ---: | ---: | ---: |
| Quote grounded rate | 96,22% | 100,00% | 55,17% | 100,00% |
| Fabrication rate | 3,78% | 0,00% | 0,00% | 44,83% |
| Số quote mỗi bài | 26,32 | 26,00 | 12,00 | 43,00 |
| Attention point truthfulness | 69,86% | 75,00% | 0,00% | 100,00% |
| Coverage | 4,49% | 0,00% | 0,00% | 100,00% |
| Additionality | 92,23% | 100,00% | 0,00% | 100,00% |

Kết quả nổi bật là phần quote và annotation có độ bám nguồn cao: quote grounded rate đạt 96,22% và fabrication rate trung bình 3,78%. Đây là bằng chứng mạnh cho việc workflow có thể trích ra các điểm neo nguồn để reviewer kiểm tra. Attention point truthfulness thấp hơn, đạt 69,86%, vì attention point thường là diễn giải hoặc gợi ý điều cần chú ý, khó kiểm chứng trực tiếp hơn trích dẫn.

Coverage chỉ 4,49% nhưng không nên đọc đơn giản là workflow kém. Reviewer Initial Analysis được tạo trước khi reviewer viết review, còn review của con người thường chỉ ghi một số vấn đề nổi bật sau khi đọc sâu. Additionality 92,23% cho thấy các điểm đúng của workflow thường khác với những gì reviewer cuối cùng ghi lại. Kết luận đúng phạm vi là workflow hữu ích để định hướng đọc và gợi ý điểm cần kiểm tra, nhưng mọi attention point quan trọng vẫn cần reviewer xác nhận.

### 4.5.6. Review Quality Auditor

Review Quality Auditor kiểm tra bản review sau khi reviewer viết, nhằm hỗ trợ Chair phát hiện các rủi ro như nhận xét thiếu căn cứ, khuyến nghị không khớp lập luận, bỏ sót điểm quan trọng hoặc review quá chung chung. Đây là workflow nhạy cảm nhất về diễn giải, vì nó đánh giá chất lượng một đầu ra vốn đòi hỏi suy luận học thuật rộng.

Workflow chạy trên **1.127 bài**, tạo **3.658 lượt audit** với trung bình **2,39 finding mỗi audit**. Thời gian xử lý trung bình mỗi audit là **15,55 giây**, trung vị **14,63 giây** và cao nhất **123,67 giây**; token trung bình là **7.874 token**. Phân bố trạng thái gồm **1.913 block**, **1.650 warn** và **95 pass**, cho thấy auditor khá nghiêm khắc. Nếu dùng trong sản phẩm thật, kết quả này cần giao diện ưu tiên finding để tránh quá tải cảnh báo cho Chair.

**Bảng 4.15: Kết quả TCA của Review Quality Auditor**

| Chỉ số | Trung bình | Trung vị | Thấp nhất | Cao nhất |
| :--- | ---: | ---: | ---: | ---: |
| Truthfulness per review | 58,28% | 50,00% | 0,00% | 100,00% |
| Validity rate | 71,04% | 100,00% | 0,00% | 100,00% |
| Grounded-valid rate | 46,99% | 50,00% | 0,00% | 100,00% |
| Findings per review trong TCA | 2,37 | - | - | - |

Kết quả cho thấy auditor có giá trị nhưng còn nhiễu. Validity rate 71,04% nghĩa là phần lớn finding phù hợp với tiêu chí audit. Tuy nhiên, grounded-valid rate chỉ 46,99% và truthfulness trung bình 58,28%, nghĩa là nhiều finding cần Chair hoặc người phụ trách xác minh trước khi dùng để đưa ra hành động. Vì vậy, workflow này chỉ nên được trình bày như danh sách kiểm tra hỗ trợ Chair, không phải bộ lọc tự động chấm review đạt hay không đạt.

### 4.5.7. Chair Decision Copilot

Chair Decision Copilot hỗ trợ chủ tọa tổng hợp review, rebuttal và các tín hiệu đồng thuận hoặc bất đồng trước khi ra quyết định. Output gồm evidence basis, điểm mạnh, điểm yếu, câu hỏi cần làm rõ, areas of agreement, areas of disagreement và unresolved concerns. Workflow này nằm gần điểm quyết định cuối cùng, nên phần diễn giải phải đặc biệt rõ: hệ thống hỗ trợ tổng hợp evidence, không tự động quyết định accept/reject.

Về vận hành, workflow có thời gian xử lý trung bình **21,68 giây**, trung vị **20,59 giây** và cao nhất **116,74 giây**. Token trung bình là **6.242 token**. Mỗi bài có trung bình **6,18 evidence basis items**, **4,30 strengths**, **5,13 weaknesses**, **4,62 questions**, **3,79 areas of agreement**, **3,18 areas of disagreement** và **4,32 unresolved concerns**. Đây là cấu trúc phù hợp với tác vụ hỗ trợ Chair đọc nhanh và kiểm tra các điểm cần cân nhắc.

**Bảng 4.16: Kết quả TCA của Chair Decision Copilot**

| Chỉ số | Trung bình | Trung vị | Thấp nhất | Cao nhất |
| :--- | ---: | ---: | ---: | ---: |
| Evidence basis truthfulness | 87,34% | 100,00% | 0,00% | 100,00% |
| Evidence basis coverage | 5,27% | 0,00% | 0,00% | 100,00% |
| Evidence basis additionality | 91,63% | 100,00% | 0,00% | 100,00% |
| High-risk rate | 1,28% | - | - | - |
| Disagreement map truthfulness | 87,11% | 100,00% | 0,00% | 100,00% |
| Disagreement map coverage | 13,82% | 0,00% | 0,00% | 100,00% |

Evidence basis truthfulness 87,34% và disagreement map truthfulness 87,11% là bằng chứng tốt cho vai trò tổng hợp evidence. Additionality 91,63% cho thấy nhiều luận điểm có căn cứ không trùng trực tiếp với metareview, tức workflow không chỉ sao chép lại văn bản tham chiếu. Mức độ hữu ích của các luận điểm này vẫn cần được Chair kiểm tra trong bối cảnh ra quyết định. Coverage thấp cần được đọc đúng bối cảnh: decision brief không cần lặp lại toàn bộ metareview, mà cần tổ chức evidence theo hướng Chair có thể kiểm tra và cân nhắc.

High-risk rate 1,28% tương đương khoảng 14 bài trong tập TCA. Con số này thấp nhưng không bằng 0, và vì workflow nằm gần điểm ra quyết định, các trường hợp high-risk cần được đánh dấu rõ. Kết luận bảo vệ được là Chair Decision Copilot giúp Chair đọc nhanh và có cơ sở hơn, nhưng benchmark hiện tại không đo decision label match, nên không có cơ sở để nói hệ thống dự đoán đúng quyết định cuối cùng.

### 4.5.8. Chatbot Agent của nền tảng

Chatbot Agent được đánh giá như trợ lý nền tảng có khả năng gọi công cụ nội bộ, không phải chatbot trò chuyện tự do hay agent nghiên cứu. Benchmark gồm 8 nhóm kịch bản, mỗi nhóm chạy 5 biến thể, tổng cộng **40 hội thoại**. Các kịch bản bao gồm tra cứu trạng thái bài nộp, track và metadata, tổng quan hội nghị, workload reviewer, thông tin công khai, ranh giới quyền truy cập, yêu cầu ngoài phạm vi và báo cáo vận hành nhiều bước.

**Bảng 4.17: Kết quả tổng quan Chatbot Agent**

| Chỉ số | Kết quả |
| :--- | ---: |
| Số nhóm kịch bản | 8 |
| Số lượt hội thoại | 40 |
| Số lượt hoàn tất hội thoại | 40 / 40 |
| Số lượt đạt | 25 |
| Số lượt đạt một phần | 12 |
| Số lượt không đạt | 3 |
| Tổng lượt gọi công cụ | 128 |
| Lượt gọi công cụ thành công | 97 |
| Lượt gọi công cụ thất bại | 31 |
| Tỷ lệ gọi công cụ thành công | 75,78% |
| Thời gian hoàn tất trung bình | 26,53 giây |
| TTFT trung bình | 2,36 giây |
| Thời gian đến token trả lời đầu tiên trung bình | 23,02 giây |
| Thời gian stream trung bình | 24,17 giây |
| Số lượng token | 14.420 token |

Kết quả cho thấy chatbot đã xử lý được nhiều kịch bản nền tảng, nhưng chưa ổn định ở mức sản phẩm hoàn chỉnh. Hệ thống hoàn tất 40/40 hội thoại, trong đó 25 lượt đạt, 12 lượt đạt một phần và 3 lượt không đạt. Kịch bản reviewer workload đạt ổn định 5/5 lượt; các kịch bản author và Chair cho thấy chatbot có thể lấy dữ liệu nền tảng, tổng hợp và trả lời theo vai trò.

Tỷ lệ tool-call success 75,78% không nên được đọc như tỷ lệ workflow success, vì một số lượt gọi công cụ thất bại nhưng chatbot vẫn tự điều chỉnh để trả lời đúng hướng. Tuy nhiên, 31 lượt gọi công cụ thất bại vẫn là vấn đề cần cải thiện vì làm tăng độ trễ và tạo câu trả lời đạt một phần. Về trải nghiệm, TTFT 2,36 giây là tốt, nhưng thời gian đến token trả lời đầu tiên 23,02 giây cho thấy người dùng thường phải chờ khá lâu trước khi thấy câu trả lời cuối. Hệ thống nên hiển thị trạng thái đang tra cứu hoặc đang tổng hợp để giảm cảm giác chờ không rõ nguyên nhân.

Về an toàn quyền truy cập, benchmark không ghi nhận lộ dữ liệu riêng tư trong kịch bản permission boundary. Điểm yếu nằm ở cách diễn đạt: một số lượt trả lời giống lỗi truy vấn kỹ thuật thay vì giải thích rõ người dùng không có quyền xem dữ liệu đó. Ngoài ra, kịch bản yêu cầu ngoài phạm vi vẫn có một lượt chatbot viết báo cáo thị trường, cho thấy cần siết vai trò trợ lý nền tảng.

### 4.5.9. Các giới hạn chung của lớp AI

Các workflow AI hiện có đủ bằng chứng để chứng minh hướng tích hợp có kiểm soát, nhưng chưa đủ để tuyên bố tự động hóa peer review. Các giới hạn cần giữ xuyên suốt báo cáo gồm:

- **Thiếu nhãn chuyên gia cho một số đầu ra.** Gợi ý track trong Submission Autofill chỉ có bằng chứng completion và invalid track rate, chưa có nhãn Chair hoặc domain expert để đo accuracy.
- **TCA là proxy, không thay thế chuyên gia.** Truthfulness, coverage và additionality giúp đo groundedness và xu hướng bổ sung thông tin, nhưng không thể xác định toàn bộ chất lượng học thuật của một nhận xét.
- **Một số workflow còn nhiễu.** Review Quality Auditor có grounded-valid rate 46,99%, nên mọi finding quan trọng phải được Chair xác nhận.
- **Độ trễ phù hợp với tác vụ bất đồng bộ hơn là tức thời.** Reviewer Initial Analysis và Review Quality Auditor có trường hợp vượt 2 phút, phù hợp để chạy nền hoặc chạy trước khi người dùng mở màn hình.
- **Chatbot Agent chưa ổn định ở mức sản phẩm hoàn chỉnh.** Tool-call failure và cách diễn đạt permission boundary cần cải thiện trước khi dùng trong demo hoặc triển khai thật.

Những giới hạn này không phủ định giá trị của lớp AI. Ngược lại, chúng củng cố luận điểm thiết kế của đề tài: AI trong ConferenceSpace nên được dùng như lớp hỗ trợ có kiểm soát, luôn cho người dùng xem lại, xác nhận và chịu trách nhiệm cuối cùng.


## 4.6. Phân tích tính khả thi vận hành

Bên cạnh chất lượng đầu ra, một hệ thống AI trong môi trường hội nghị học thuật phải đáp ứng các yêu cầu vận hành về thời gian phản hồi, chi phí quan sát được và khả năng mở rộng. Phần này đọc các workflow theo góc nhìn sản phẩm: tác vụ nào có thể trả kết quả trực tiếp cho người dùng, tác vụ nào nên chạy nền, và rủi ro vận hành nào cần được xử lý trước khi triển khai thật.

### 4.6.1. Độ trễ và token tiêu thụ

Các số liệu dưới đây lấy từ benchmark workflow AI mới. Với các workflow trong runner, thời gian xử lý phản ánh thời gian hoàn tất workflow trên một bài hoặc một audit. Với Chatbot Agent, thời gian phản ánh toàn bộ hội thoại theo kịch bản, không phải một lần gọi mô hình đơn lẻ.

**Bảng 4.18: Độ trễ và token theo workflow AI**

| Workflow | Thời gian TB | Trung vị | Cao nhất | Token TB | Cách vận hành phù hợp |
| :--- | ---: | ---: | ---: | ---: | :--- |
| Submission Autofill metadata | 10,64s | 9,32s | 102,20s | 4.094 | Có thể chạy trực tiếp, nhưng cần trạng thái loading và xử lý outlier |
| Gợi ý track trong Submission Autofill | 18,19s | 17,54s | 37,42s | - | Có thể chạy cùng Autofill hoặc sau khi metadata đã sẵn sàng |
| Submission Gating rule check | 0,08s | 0,09s | 0,14s | - | Phù hợp phản hồi tức thời |
| Submission Gating steering | 11,83s | 11,47s | 19,64s | - | Nên hiển thị như cảnh báo hỗ trợ, không chặn tự động |
| Reviewer Initial Analysis | 39,18s | 37,53s | 126,36s | 11.575 | Nên chạy nền hoặc chạy trước khi reviewer mở bài |
| Review Quality Auditor | 15,55s/audit | 14,63s | 123,67s | 7.874 | Nên chạy sau khi review được nộp, có cơ chế ưu tiên finding |
| Chair Decision Copilot | 21,68s | 20,59s | 116,74s | 6.242 | Nên chạy trước khi Chair mở màn hình quyết định |
| Chatbot Agent | 26,53s/hội thoại | - | 43,92s theo nhóm chậm nhất | 14.420 | Cần stream trạng thái tra cứu và giảm tool-call failure |

Kết quả cho thấy các workflow có hai nhóm vận hành khác nhau. Nhóm có thể phản hồi gần tức thời gồm rule check của Submission Gating và một phần Autofill trong trường hợp bình thường. Nhóm nên chạy nền gồm Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot, vì các workflow này có độ trễ trung bình từ 15 đến gần 40 giây và có outlier vượt 100 giây.

Với Chatbot Agent, TTFT trung bình 2,36 giây cho thấy hệ thống bắt đầu stream sớm, nhưng thời gian đến token trả lời đầu tiên trung bình 23,02 giây cho thấy người dùng có thể cảm thấy chờ lâu nếu giao diện không hiển thị trạng thái đang tra cứu. Đây là vấn đề trải nghiệm chứ không chỉ là vấn đề mô hình: chatbot đang gọi công cụ nội bộ và tổng hợp dữ liệu trước khi trả lời.

### 4.6.2. Chi phí token và ước tính tài chính

Benchmark hiện tại ghi nhận token tiêu thụ cho các workflow chính. Trong chương này, token được sử dụng như một chỉ số vận hành thay vì quy đổi trực tiếp thành chi phí cố định, vì giá model và chính sách provider có thể thay đổi theo thời điểm triển khai. Cách trình bày này giữ được khả năng kiểm tra tài nguyên tiêu thụ mà không gắn kết luận vào một bảng giá tạm thời.

Trong kết quả hiện tại, Submission Autofill dùng trung bình 4.094 token, Reviewer Initial Analysis dùng 11.575 token, Review Quality Auditor dùng 7.874 token mỗi audit, Chair Decision Copilot dùng 6.242 token và Chatbot Agent dùng 14.420 token trong bộ benchmark hội thoại. Các con số này cho thấy chi phí chính không nằm ở Autofill, mà ở các workflow cần đọc nhiều ngữ cảnh hoặc nhiều lượt gọi công cụ.

Chi phí vận hành có thể được ước tính bằng công thức tổng quát sau khi đã xác định bảng giá provider ở thời điểm triển khai:

```text
Chi phí workflow = input_tokens * giá_input_per_token + output_tokens * giá_output_per_token
Chi phí hội nghị = tổng chi phí workflow theo số bài, số review, số lượt chatbot và số lần chạy lại
```

Cách tiếp cận này tránh gắn kết luận thực nghiệm vào một bảng giá có thể lỗi thời, đồng thời vẫn cho thấy hệ thống đã đo được token ở từng workflow để phục vụ tính toán chi phí vận hành.

### 4.6.3. Khả năng mở rộng và giới hạn

Thiết kế dispatcher-worker và result package giúp các workflow AI có thể chạy độc lập, checkpoint theo stage và truy ngược output sau benchmark. Đây là điểm mạnh khi mở rộng, vì một lỗi ở một workflow không nên làm mất toàn bộ bối cảnh đánh giá của một bài.

Các giới hạn chính hiện tại gồm:

- **Outlier độ trễ:** Autofill, Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot đều có trường hợp cao nhất vượt 100 giây. Hệ thống cần timeout, retry, trạng thái tiến độ và cơ chế chạy nền cho các workflow dài.
- **Chất lượng dữ liệu đầu vào:** Các workflow phụ thuộc vào trích xuất PDF và dữ liệu review. Khi PDF khó đọc hoặc review quá ngắn, chất lượng output và chất lượng benchmark đều giảm.
- **Tool-call failure của Chatbot Agent:** 31/128 tool calls thất bại trong benchmark. Dù nhiều hội thoại vẫn hoàn tất, tỷ lệ này cần giảm trước khi chatbot được xem là ổn định ở mức sản phẩm.
- **TCA không thay thế kiểm duyệt chuyên gia:** TCA giúp hậu kiểm trên quy mô lớn, nhưng các trường hợp high-risk hoặc finding quan trọng vẫn cần người dùng xác nhận.
- **Thiếu nhãn chuyên gia ở một số bài toán:** Gợi ý track trong Submission Autofill và nội dung mềm của Submission Gating cần nhãn Chair/domain expert nếu muốn nâng từ benchmark hợp đồng lên benchmark chất lượng chuyên môn.

Vì vậy, tính khả thi vận hành của ConferenceSpace không nên được trình bày như "AI chạy tự động từ đầu đến cuối". Kết luận đúng là hệ thống có nền tảng vận hành để đưa AI vào các điểm hỗ trợ cụ thể, miễn là giao diện thể hiện rõ trạng thái, nguồn chứng cứ, mức rủi ro và quyền xác nhận cuối cùng của con người.


## 4.7. Khảo sát người dùng

Để bổ sung cho đánh giá định lượng, nhóm thực hiện khảo sát định tính với các vai trò chính trong hệ thống: tác giả, phản biện viên và Chair. Khảo sát tập trung vào trải nghiệm thực tế khi sử dụng các tính năng AI và so sánh với quy trình truyền thống.

### 4.7.1. Phương pháp và mẫu khảo sát

Khảo sát được thiết kế dưới dạng bảng hỏi trực tuyến với các câu hỏi mở và thang đánh giá Likert 5 mức độ. Đối tượng khảo sát bao gồm 15 người dùng thử nghiệm hệ thống trong môi trường staging, bao gồm: 5 tác giả đã sử dụng tính năng Autofill, 5 phản biện viên đã sử dụng tính năng Reviewer Analysis, và 5 Chair đã sử dụng tính năng Chair Synthesis. Thời gian sử dụng trung bình trước khi khảo sát là 2 tuần.

Các câu hỏi chính bao gồm: (1) mức độ hài lòng tổng thể với tính năng AI, (2) mức độ tin tưởng vào đề xuất của AI, (3) thời gian tiết kiệm so với quy trình thủ công, (4) những khó khăn gặp phải, và (5) đề xuất cải thiện.

### 4.7.2. Kết quả theo vai trò Chủ tọa

100% Chair đánh giá Evidence Basis là "rất hữu ích" cho việc chuẩn bị quyết định. Điểm hài lòng trung bình là 4,4/5. Phản hồi nhất quán là tính năng này "tiết kiệm hàng giờ đọc lại các bản phản biện" và "giúp nhận ra các điểm mâu thuẫn mà tôi có thể bỏ qua". Tuy nhiên, tất cả Chair đều nhấn mạnh họ không muốn AI đưa ra quyết định cuối cùng — thiết kế hiện tại (AI chỉ tổng hợp, không quyết định) được đánh giá cao. Chair ước tính tiết kiệm 30–45 phút/bài nhờ Chair Synthesis.

### 4.7.3. Kết quả theo vai trò Người phản biện

60% người dùng đánh giá Attention Points là "hữu ích" và 40% đánh giá "rất hữu ích". Điểm hài lòng trung bình là 3,8/5. Phản hồi tích cực nhấn mạnh việc AI giúp "không bỏ sót các điểm quan trọng" và "có định hướng rõ ràng hơn khi đọc bài". Phản hồi tiêu cực chủ yếu liên quan đến độ dài: một số reviewer cảm thấy 3–4 điểm là quá nhiều và muốn tùy chỉnh số lượng. Một số ý kiến lo ngại về việc "dựa quá nhiều vào AI có thể làm giảm khả năng phân tích độc lập". Phản biện viên ước tính tiết kiệm 10–15 phút/bài nhờ Attention Points.

### 4.7.4. Kết quả theo vai trò Tác giả

80% người dùng đánh giá tính năng Autofill là "hữu ích" hoặc "rất hữu ích". Điểm hài lòng trung bình là 4,1/5. Phản hồi tích cực chủ yếu tập trung vào việc tiết kiệm thời gian nhập liệu ("không cần gõ lại tiêu đề dài từ PDF") và chất lượng từ khóa tự động ("từ khóa AI đưa ra chính xác hơn tôi tự nghĩ"). 20% người dùng gặp vấn đề với bài báo có công thức toán học phức tạp, nơi Autofill bỏ sót hoặc sai chính tả ký hiệu toán học. Tác giả ước tính tiết kiệm 3–5 phút/bài báo nhờ Autofill.

### 4.7.5. Tổng hợp xuyên vai trò

**Thời gian tiết kiệm:** Tác giả ước tính tiết kiệm 3–5 phút/bài báo nhờ Autofill. Phản biện viên ước tính tiết kiệm 10–15 phút/bài nhờ Attention Points. Chair ước tính tiết kiệm 30–45 phút/bài nhờ Chair Synthesis.

**Đề xuất cải thiện theo mức độ ưu tiên:**

- **Cao:** Cho phép tùy chỉnh số lượng Attention Points (reviewer muốn 2–5 điểm thay vì cố định 3–4). Thêm khả năng xem nguồn gốc của từng Attention Point (trích dẫn đoạn văn bản gốc trong bài báo).
- **Trung bình:** Cải thiện xử lý công thức toán học trong Autofill. Thêm tính năng "bỏ qua" cho các Attention Point không liên quan để AI học từ phản hồi.
- **Thấp:** Hỗ trợ đa ngôn ngữ cho Attention Points (một số reviewer muốn xem bằng tiếng Việt). Thêm tính năng so sánh trực tiếp giữa các bản phản biện trong giao diện Chair.


## 4.8. Tổng hợp kết quả đánh giá

Chương này đánh giá ConferenceSpace theo chuỗi bằng chứng từ hệ thống, thuật toán xác định, workflow AI đến phản hồi người dùng. Kết luận quan trọng nhất không phải là "AI thay thế con người", mà là: hệ thống có thể đưa AI vào các điểm hỗ trợ cụ thể của quy trình peer review nếu mỗi output được giới hạn đúng vai trò, có bằng chứng vận hành, có chỉ số chất lượng phù hợp và có cơ chế để con người xác nhận trước khi ra quyết định học thuật.

### 4.8.1. Mức độ đáp ứng nhu cầu ban đầu

Đối chiếu với mục tiêu ở Chương 1 và nhu cầu ở Chương 2, các kết quả thực nghiệm cho thấy hệ thống đáp ứng được bốn nhóm yêu cầu chính ở các mức độ khác nhau.

**Nhu cầu về nền tảng nghiệp vụ ổn định:** Backend đạt 0% lỗi request trong ba kịch bản CRUD, Matching và COI trên dữ liệu 300 hội nghị, 15.000 bài nộp và 9.000 phản biện viên. Độ trễ p95 dưới 120 ms ở cả ba kịch bản cho thấy lớp nghiệp vụ cốt lõi đủ nhanh cho quy mô thử nghiệm hiện tại. Điểm nghẽn chính nằm ở PostgreSQL khi dữ liệu quan hệ lớn, không phải ở tầng ứng dụng.

**Nhu cầu về thuật toán xác định, có thể giải thích:** Reviewer matching được giữ ở lớp thuật toán xác định thay vì giao cho AI tạo sinh. Trên tập Semantic Scholar gồm 60 tác giả và 2.565 bài báo, thuật toán xếp hạng đạt MRR 0,392, Hit@5 = 55% và Hit@10 = 65%, cao hơn rõ rệt so với baseline ngẫu nhiên. Thuật toán phân công đạt điểm phù hợp trung bình cao hơn baseline, không ghi nhận COI violation trong benchmark, nhưng coverage 65,9% và fallback rate 23,3% cho thấy vẫn cần Chair xử lý các trường hợp khó hoặc không có reviewer phù hợp.

**Nhu cầu về AI hỗ trợ có kiểm soát:** Các workflow AI đã được đánh giá trên tập runner 1.127 bài và nhiều benchmark riêng. Submission Autofill có bằng chứng mạnh nhất ở metadata: title token F1 98,20%, keyword F1 92,77% và required field completion rate 86,93%. Reviewer Initial Analysis có quote grounded rate 96,22%, giúp reviewer có điểm neo nguồn khi đọc bài. Chair Decision Copilot đạt evidence basis truthfulness 87,34% và disagreement map truthfulness 87,11%, phù hợp với vai trò tổng hợp evidence cho Chair. Tuy nhiên, các workflow này đều phải giữ vai trò hỗ trợ: gợi ý track trong Submission Autofill chưa có nhãn chuyên gia, attention point truthfulness mới đạt 69,86%, Review Quality Auditor có grounded-valid rate 46,99%, và Chair Decision Copilot chưa được đo bằng decision label match.

**Nhu cầu về trải nghiệm và vận hành:** Một số tác vụ có thể phản hồi trực tiếp, như Submission Gating rule check với thời gian trung bình 0,08 giây. Các workflow AI dài hơn như Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot phù hợp hơn với mô hình chạy nền hoặc chạy trước. Chatbot Agent hoàn tất 40/40 hội thoại và không ghi nhận lộ dữ liệu riêng tư trong kịch bản permission boundary, nhưng tỷ lệ tool-call success 75,78% và thời gian đến token trả lời đầu tiên 23,02 giây cho thấy cần cải thiện trước khi xem là ổn định ở mức sản phẩm.

Nhìn chung, ConferenceSpace đáp ứng được mục tiêu cốt lõi của đề tài: xây dựng một nền tảng có nghiệp vụ đầy đủ, tách rõ lớp thuật toán xác định và lớp AI hỗ trợ, đồng thời cung cấp bằng chứng thực nghiệm cho giá trị của AI ở các điểm giảm thao tác thủ công, hỗ trợ đọc hiểu, kiểm tra và tổng hợp. Điểm chưa được chứng minh là tự động hóa quyết định học thuật, và đây là giới hạn đúng với phạm vi đề tài chứ không phải thiếu sót cần che giấu.

### 4.8.2. Các phát hiện nhất quán giữa benchmark và khảo sát người dùng

Phân tích đối chiếu giữa dữ liệu kỹ thuật và phản hồi người dùng cho thấy một số phát hiện nhất quán quan trọng.

**Autofill là workflow có bằng chứng định lượng trực tiếp nhất.** Benchmark metadata cho thấy hệ thống điền tốt các trường ngắn và có cấu trúc rõ, trong khi phản hồi người dùng ở mục 4.7 cũng đánh giá cao việc giảm thao tác nhập liệu. Cả hai nguồn đều chỉ ra cùng một giới hạn: các tài liệu có định dạng phức tạp, nhiều tác giả hoặc ký hiệu toán học vẫn cần người dùng kiểm tra kỹ.

**Reviewer Initial Analysis có giá trị ở vai trò định hướng, không phải kết luận.** Benchmark cho thấy quote grounded rate cao, nhưng attention point truthfulness chưa đủ để dùng không kiểm tra. Phản hồi reviewer trong khảo sát cũng đi cùng hướng: workflow hữu ích để định hướng đọc bài, nhưng người dùng vẫn muốn kiểm soát độ dài, số lượng điểm gợi ý và khả năng xem nguồn của từng nhận định.

**Chair Decision Copilot là workflow mạnh ở tác vụ tổng hợp evidence.** Benchmark cho thấy evidence basis và disagreement map có truthfulness khoảng 87%, còn khảo sát cho thấy Chair đánh giá cao khả năng chuẩn bị hồ sơ quyết định. Hai nguồn cùng củng cố một nguyên tắc: AI giúp Chair đọc nhanh và có cơ sở hơn, nhưng Chair vẫn giữ quyền quyết định cuối cùng.

**Các điểm nghẽn vận hành cũng xuất hiện nhất quán.** Benchmark cho thấy một số workflow có outlier latency cao, Chatbot Agent có tool-call failure đáng kể, và Review Quality Auditor có tỷ lệ finding nhiễu. Đây đều là các điểm cần phản ánh vào giao diện: hiển thị trạng thái xử lý, đánh dấu mức tin cậy, gom nhóm finding và cho phép người dùng kiểm tra nguồn.

### 4.8.3. Hạn chế của kết quả thực nghiệm

Các hạn chế chính đã được phát hiện qua thực nghiệm và benchmark cho thấy phạm vi kết luận của chương này cần được giữ ở mức thận trọng.

**Thiếu nhãn chuyên gia cho một số workflow.** Gợi ý track trong Submission Autofill mới chứng minh được completion và invalid track rate 0,00%, chưa chứng minh top-k accuracy. Submission Gating tuyến nội dung chưa có nhãn thủ công cho groundedness, actionability và severity của từng finding. Chair Decision Copilot chưa có decision label match nên không được dùng để kết luận accept/reject.

**Một số workflow còn nhiễu và cần giao diện kiểm soát.** Review Quality Auditor có truthfulness 58,28% và grounded-valid rate 46,99%, nên mọi finding quan trọng phải được Chair xác nhận. Reviewer Initial Analysis có attention point truthfulness 69,86%, phù hợp để dùng như gợi ý đọc bài nhưng chưa đủ để trở thành nhận xét học thuật.

**TCA là proxy tự động, không thay thế chuyên gia.** NLI có thể bỏ sót claim đúng nhưng diễn đạt khác, hoặc đánh giá thấp các suy luận kỹ thuật phức tạp. Vì vậy, các chỉ số truthfulness, coverage và additionality nên được đọc như tín hiệu hậu kiểm quy mô lớn, không phải phán quyết cuối cùng về chất lượng học thuật.

**Độ trễ và khả năng vận hành cần được sản phẩm hóa.** Một số workflow có outlier vượt 100 giây. Chatbot Agent có 31/128 tool calls thất bại và thời gian đến token trả lời đầu tiên trung bình 23,02 giây. Hệ thống cần hàng đợi, retry, trạng thái tiến độ, và cách diễn đạt lỗi/quyền truy cập thân thiện hơn với người dùng.

**Reviewer matching vẫn cần dữ liệu thực tế từ Chair.** Benchmark leave-one-out authorship chứng minh thuật toán nắm bắt tương đồng chủ đề tốt hơn random, nhưng chưa thay thế được đánh giá bằng dữ liệu phân công thật của Chair hoặc tỷ lệ chấp nhận đề xuất trong vận hành thực tế.

**Phạm vi ngôn ngữ và bối cảnh còn hẹp.** Benchmark chủ yếu dựa trên bài báo tiếng Anh và dữ liệu hội nghị từ OpenReview. Hiệu quả với bài tiếng Việt, hội nghị nhỏ không dùng OpenReview, hoặc quy trình review có chính sách khác vẫn cần được đánh giá thêm.

Tóm lại, Chương 4 chứng minh được phần quan trọng nhất của đề tài: ConferenceSpace có thể tích hợp AI vào peer review theo cách có kiểm soát và có bằng chứng, miễn là hệ thống giữ ranh giới rõ giữa hỗ trợ và quyết định. Những gì chưa chứng minh được cũng phải được nói thẳng: AI chưa thay thế reviewer, chưa thay Chair, và chưa tự động hóa toàn bộ quy trình học thuật.


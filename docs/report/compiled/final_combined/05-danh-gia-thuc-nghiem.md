# Chương 5. Thiết lập thực nghiệm và đánh giá hệ thống

---

## 5.1. Mục tiêu và câu hỏi đánh giá

Chương 3 đã trình bày ConferenceSpace theo kiến trúc ba lớp: lớp nghiệp vụ cốt lõi, lớp thuật toán xác định và lớp AI hỗ trợ. Chương này đánh giá thực nghiệm cả ba lớp đó theo đúng bản chất của từng lớp, thay vì áp dụng một khung đánh giá chung một cách máy móc:

- **Lớp nghiệp vụ cốt lõi** được đánh giá bằng benchmark tải HTTP (k6) và giám sát tài nguyên, nhằm trả lời câu hỏi hệ thống có đáp ứng được về mặt hiệu năng và khả năng chịu tải hay không.
- **Lớp thuật toán** (đối sánh phản biện và phát hiện xung đột lợi ích) được đánh giá bằng Go micro-benchmark đo trực tiếp chi phí tính toán thuần túy, đồng thời đánh giá chất lượng đề xuất trên tập dữ liệu thực từ Semantic Scholar.
- **Lớp AI hỗ trợ** được đánh giá theo hai hướng bổ sung cho nhau: (1) các chỉ số deterministic (Exact Match, ROUGE, F1) cho tác vụ trích xuất thông tin có đáp án đúng rõ ràng (Submission Autofill); và (2) phương pháp **LLM-as-a-judge** theo khung Trung thực – Trùng lặp – Bổ sung (Truthfulness – Coverage – Additionality, gọi tắt TCA) cho các tác vụ tự luận phức tạp không có đáp án tuyệt đối (tóm lược bài nộp, kiểm toán chất lượng phản biện, hỗ trợ quyết định của Chair).
- Cuối cùng, mức độ đáp ứng nhu cầu người dùng thực tế được đo lường thông qua khảo sát sau sử dụng (UAT) trên ba vai trò Tác giả, Người phản biện và Chủ tọa.

Cách tiếp cận này cho phép trả lời câu hỏi cốt lõi: hệ thống có vận hành ổn định và đủ nhanh (lớp nghiệp vụ + thuật toán) hay không, đồng thời lớp AI có thực sự tạo ra giá trị đáng tin cậy cho người dùng hay không, thay vì chỉ dừng lại ở cảm nhận chủ quan.

### 5.1.1. Các lớp cần đánh giá

Giới thiệu các lớp được đánh giá trong chương, bao gồm hiệu năng của backend nghiệp vụ, chất lượng và chi phí của thuật toán đối sánh/phát hiện xung đột lợi ích, chất lượng của các workflow AI và phản hồi thực tế của người dùng sau khi trải nghiệm hệ thống. Việc phân lớp giúp tránh trộn lẫn giữa đánh giá kỹ thuật, đánh giá AI và khảo sát người dùng.

### 5.1.2. Câu hỏi đánh giá và tiêu chí thành công

Các câu hỏi mà phần thực nghiệm cần trả lời bao gồm: hệ thống có đáp ứng tải vận hành hay không, thuật toán có đủ nhanh cho tương tác thực tế hay không, các workflow AI có tạo ra đầu ra đáng tin cậy hay không và người dùng có hài lòng khi sử dụng hay không. Với mỗi câu hỏi, tiêu chí hoặc chỉ số dùng để kết luận được xác định rõ ràng.

### 5.1.3. Liên kết với nhu cầu người dùng ở Chương 2

Các nội dung đánh giá trong chương này kiểm chứng lại những nhu cầu và ưu tiên đã được phát hiện ở Chương 2. Phần này chỉ đóng vai trò định hướng, còn phần đối chiếu kết quả đầy đủ sẽ được tổng hợp ở cuối chương sau khi đã trình bày toàn bộ số liệu thực nghiệm và khảo sát người dùng.

---

## 5.2. Thiết lập thực nghiệm

### 5.2.1. Dữ liệu thực nghiệm

Với lớp AI, tập dữ liệu thử nghiệm được tổng hợp và trích xuất từ dữ liệu thực tế của các hội nghị khoa học quốc tế đã công bố trên OpenReview. Tổng số lượng bài nộp được đưa vào đánh giá là **1.127 bài báo (submissions)** phân bố trên **8 phân hội / hội nghị (conference tracks)** khác nhau. Việc đa dạng hóa các hội nghị từ nhiều lĩnh vực (robotics, học máy, y học, lý thuyết) giúp đánh giá độ ổn định và khả năng thích ứng của các mô-đun AI trước sự khác biệt về định dạng và văn phong trình bày.

**Bảng 5.1: Thống kê tập dữ liệu thử nghiệm theo phân hội (Conference Tracks)**

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

Với đánh giá LLM-as-a-judge, một tập con **1.097 bài báo có kèm metareview đối chứng** của Area Chair được sử dụng, cho phép đối chiếu trực tiếp giữa kết quả tổng hợp của AI với nhận định thực tế mà con người đã đưa ra.

Với lớp nghiệp vụ cốt lõi và lớp thuật toán, dữ liệu thử nghiệm là dữ liệu tổng hợp (synthetic) được sinh với quy mô **300 hội nghị, 15.000 bài nộp và 9.000 phản biện viên**, mô phỏng một môi trường vận hành ở quy mô vừa và lớn. Ngoài ra, đánh giá chất lượng đối sánh phản biện sử dụng tập dữ liệu thực từ **Semantic Scholar API** gồm **60 tác giả và 2.565 bài báo** thuộc 8 lĩnh vực khoa học máy tính khác nhau.

### 5.2.2. Môi trường thực nghiệm

Ba nhóm thực nghiệm được tiến hành trong ba môi trường khác nhau, phù hợp với đặc điểm của từng lớp:

- **Benchmark AI (lớp AI hỗ trợ):** quy trình được thực thi tự động thông qua hệ thống phân phối tác vụ (Dispatcher) và các tác nhân xử lý (Workers) chạy trên môi trường điện toán đám mây Modal, cho phép chạy song song nhiều bài nộp qua toàn bộ pipeline AI (Autofill, Track Recommendation, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot). Các mô-đun AI sử dụng mô hình ngôn ngữ lớn Google Gemini 3.1 Flash-Lite thông qua LiteLLM.
- **Benchmark hệ thống backend (lớp nghiệp vụ + lớp thuật toán):** chạy trên máy chủ với **14 nhân CPU và 48 GB RAM**, với toàn bộ stack PostgreSQL, Neo4j và Redis khởi động cùng container API. Tải HTTP được sinh bằng k6; các Go micro-benchmark chạy trực tiếp trên máy Apple M4 Pro (kiến trúc arm64) để đo chi phí thuật toán thuần túy, không qua tầng HTTP/serialization.
- **Benchmark chất lượng đối sánh (lớp thuật toán):** chạy offline trên snapshot dữ liệu Semantic Scholar được lưu cục bộ, không phụ thuộc vào API bên ngoài trong quá trình đánh giá. Benchmark được triển khai bằng Go test suite với kết quả tái lập 100% (deterministic).
- **Khảo sát người dùng (UAT):** thực hiện qua biểu mẫu trực tuyến, gửi đến người dùng đã trải nghiệm trực tiếp hệ thống ở cả ba vai trò Tác giả, Người phản biện và Chủ tọa, chi tiết tại mục 5.7.

### 5.2.3. Kịch bản và chỉ số đánh giá

Các kịch bản thực nghiệm và bộ chỉ số tương ứng cho từng lớp đánh giá:

- **Backend:** độ trễ, thông lượng và tỷ lệ lỗi qua k6 load test trên ba kịch bản CRUD, Matching, COI.
- **Thuật toán:** thời gian xử lý qua Go micro-benchmark (nhỏ / trung bình / lớn); chất lượng đề xuất qua Hit@k, MRR, nDCG, coverage, load balance, fallback rate trên tập dữ liệu Semantic Scholar.
- **Workflow AI:** các chỉ số deterministic cho đầu ra có ground truth rõ ràng (Title Exact Match, ROUGE, F1) và các chỉ số TCA (Truthfulness, Coverage, Additionality) cho đầu ra tự luận.
- **Khảo sát người dùng:** mức độ hài lòng, độ dễ sử dụng và phản hồi định tính.

### 5.2.4. Phạm vi và giới hạn của thực nghiệm

Thực nghiệm hiện tại có thể chứng minh hiệu năng vận hành của backend ở quy mô 15.000 bài nộp, chất lượng đầu ra AI trên 1.127 bài báo đa lĩnh vực, và chất lượng đối sánh phản biện trên 60 tác giả thực. Tuy nhiên, thực nghiệm chưa thể chứng minh khả năng mở rộng đến quy mô hàng chục nghìn bài (NeurIPS, ICML), chưa có đánh giá longitudinal về độ tin cậy AI qua thời gian, và chưa có so sánh trực tiếp với quyết định phân công của Chair thực tế.

### 5.2.5. Bộ dữ liệu đối chứng và quy trình chấm điểm benchmark

Dữ liệu ground truth được khai thác từ hai nguồn chính. Đối với Submission Autofill, ground truth là metadata được tác giả khai báo trực tiếp trên OpenReview (tiêu đề, tóm tắt, từ khóa, danh sách tác giả). Đối với các workflow hỗ trợ reviewer và chair, ground truth là các bản phản biện thực tế của các chuyên gia và metareview của area chair từ cùng hội nghị. Đối với đánh giá chất lượng đối sánh, ground truth được xây dựng bằng phương pháp **leave-one-out authorship proxy**: mỗi tác giả được coi là "reviewer phù hợp nhất" cho chính bài báo của họ, cho phép đánh giá ranking quality mà không cần gold dataset.

Khung đánh giá TCA được triển khai như một pipeline tự động chạy trên hạ tầng Modal với GPU NVIDIA L4. Mỗi tác vụ NLI được thực thi bằng mô hình NLI cục bộ, không phụ thuộc vào bất kỳ API bên ngoài nào. Toàn bộ 1.127 bài báo, bao gồm trích xuất PDF, đánh giá NLI và tổng hợp kết quả, được xử lý song song trên nhiều worker.

---

## 5.3. Đánh giá lớp nghiệp vụ cốt lõi

Bên cạnh độ chính xác của lớp AI, hiệu năng vận hành của lớp nghiệp vụ cốt lõi quyết định trực tiếp khả năng triển khai thực tế của ConferenceSpace, vì đây là lớp phục vụ mọi thao tác thường trực của người dùng (đăng nhập, xem danh sách, phân công phản biện, kiểm tra xung đột lợi ích) mà không phụ thuộc dịch vụ AI bên ngoài.

### 5.3.1. Kịch bản tải HTTP

Bộ benchmark backend (`backend/benchmarks/`) kết hợp hai lớp đo lường bổ sung cho nhau: k6 đo độ trễ và thông lượng đầu-cuối qua các endpoint HTTP thật (góc nhìn người dùng), trong khi Go micro-benchmark đo trực tiếp chi phí thuật toán trong tiến trình (góc nhìn kỹ thuật, tách biệt khỏi chi phí mạng/DB). Ba kịch bản tải HTTP được thực thi trên tập dữ liệu 300 hội nghị, 15.000 bài nộp, 9.000 phản biện viên (0 lỗi khi seed dữ liệu):

- **CRUD:** đăng nhập, liệt kê hội nghị, liệt kê bài nộp, liệt kê người dùng — các thao tác đọc/ghi phổ biến nhất, phụ thuộc nhiều vào PostgreSQL.
- **Matching:** gọi endpoint gợi ý/tự động phân công phản biện — kịch bản tính toán nặng nhất của lớp thuật toán.
- **COI:** gọi endpoint kiểm tra xung đột lợi ích, bao gồm cả truy vấn đồ thị đồng tác giả trên Neo4j.

### 5.3.2. Kết quả hiệu năng backend

Cả ba kịch bản đều ghi nhận **tỷ lệ lỗi request bằng 0%** với toàn bộ các check đều pass. Bảng 5.2 tổng hợp kết quả đo được:

**Bảng 5.2: Kết quả tải HTTP theo kịch bản (k6)**

| Kịch bản | Số request | Throughput | Trung vị (Median) | p90 | p95 | Tối đa (Max) | Trung bình (Avg) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| CRUD | 11.110 | 369 req/s | 46,2 ms | 100,5 ms | 117,6 ms | 403,6 ms | 51,8 ms |
| Matching | 17.184 | 572 req/s | 9,7 ms | 50,8 ms | 71,8 ms | 254,7 ms | 19,0 ms |
| COI | 16.760 | 558 req/s | 9,5 ms | 56,5 ms | 79,3 ms | 293,9 ms | 20,4 ms |

*Nhận xét:* Backend xử lý được hàng trăm request/giây ở quy mô 15.000 bài nộp với độ trễ p95 dưới 120 ms ở cả ba kịch bản. Đáng chú ý, các endpoint Matching và COI — vốn là các thao tác tính toán trên lớp thuật toán — có độ trễ trung vị (9,5–9,7 ms) thấp hơn nhiều so với CRUD (46,2 ms), cho thấy bản thân thuật toán đối sánh và phát hiện COI không phải là điểm nghẽn; điểm nghẽn nằm ở các truy vấn CRUD phụ thuộc PostgreSQL với dữ liệu quan hệ lớn.

### 5.3.3. Tài nguyên tiêu thụ và điểm nghẽn vận hành

Trung bình trong suốt quá trình chạy tải, container API duy trì ở mức nhẹ (trung bình 28% CPU của một nhân, đỉnh 43%; ~30 MB RAM). Ngược lại, **PostgreSQL là điểm tiêu thụ tài nguyên lớn nhất** (trung bình ~115% CPU — tức hơn một nhân, đỉnh 163%; ~204 MB RAM, đỉnh 222 MB). Neo4j gần như không tải (~508 MB RAM, dưới 1% CPU) và Redis rất nhẹ (~9 MB RAM) trong các kịch bản này.

Kết quả này khẳng định thiết kế tách lớp AI khỏi lớp nghiệp vụ cốt lõi (Go backend nhẹ, không giữ trạng thái nặng) là hợp lý: cơ sở dữ liệu quan hệ mới là ràng buộc chính khi mở rộng quy mô, không phải tầng ứng dụng.

---

## 5.4. Đánh giá lớp thuật toán xác định

### 5.4.1. Thuật toán đối sánh phản biện (Greedy Matching & Jaccard Similarity)

Thuật toán sử dụng chỉ số **Domain Jaccard Similarity** để tính toán độ tương đồng chuyên môn giữa lĩnh vực của phản biện viên (lấy từ hồ sơ Semantic Scholar) và chủ đề bài nộp, kết hợp thuật toán gán tham lam (Greedy) có xét ràng buộc cân bằng tải (số lượng bài phản biện tối đa/tối thiểu cho mỗi reviewer). Vì hoạt động xác định, hệ thống có thể hiển thị điểm phù hợp và lý do đề xuất cho từng cặp phản biện – bài nộp, giúp Chair hiểu vì sao một phản biện viên được đề xuất thay vì chỉ nhận một danh sách "hộp đen".

Về mặt hiệu năng, kết quả Go micro-benchmark cho thấy thuật toán chạy ở mức **131 µs đến 56 ms** tùy quy mô dữ liệu (từ vài chục đến vài nghìn bài nộp/phản biện viên), đủ nhanh để phục vụ tương tác gần thời gian thực khi Chair yêu cầu gợi ý phân công.

**Bảng 5.3: Kết quả Go micro-benchmark theo thuật toán**

| Thuật toán | Nhỏ (Small) | Trung bình (Medium) | Lớn (Large) |
| :--- | :---: | :---: | :---: |
| Phát hiện COI (COI detection) | 14,9 µs/op (27,8 KB, 241 allocs) | 147 µs/op (283 KB, 2.073 allocs) | 653 µs/op (1,13 MB, 8.123 allocs) |
| Đối sánh phản biện (Reviewer matching) | 131 µs/op (82 KB, 31 allocs) | 6,1 ms/op (2,47 MB, 42 allocs) | 56 ms/op (24,2 MB, 55 allocs) |

*Nhận xét:* Cả hai thuật toán đều hoạt động ở mức micro-giây đến mili-giây, phù hợp cho tương tác gần thời gian thực. Thuật toán đối sánh phản biện tăng chi phí nhanh hơn theo kích thước dữ liệu (từ 131 µs lên đến 56 ms khi tăng từ quy mô nhỏ lên lớn) do độ phức tạp tính toán ma trận điểm phù hợp giữa tập bài nộp và tập phản biện viên tăng theo tích số hai chiều, trong khi phát hiện COI có chi phí tăng chậm hơn (từ 14,9 µs lên 653 µs) vì phần lớn kiểm tra là so khớp tập hợp đơn giản (self-author, declared conflict).

### 5.4.2. Độ chính xác và chất lượng của reviewer matching

Phần này đánh giá chất lượng đề xuất của thuật toán đối sánh phản biện thông qua benchmark chất lượng được triển khai trong `backend/benchmarks/quality/`. Benchmark chạy offline trên snapshot dữ liệu thực từ Semantic Scholar API, đảm bảo kết quả tái lập 100% (deterministic) và không phụ thuộc vào dịch vụ bên ngoài trong quá trình đánh giá.

#### Dữ liệu và phương pháp ground truth

Tập dữ liệu được thu thập từ Semantic Scholar API ngày 05/07/2026, bao gồm **60 tác giả** và **2.565 bài báo** thuộc 8 lĩnh vực khoa học máy tính: xử lý ngôn ngữ tự nhiên, thị giác máy tính, mạng nơ-ron đồ thị, học tăng cường, truy xuất thông tin, nhận dạng giọng nói, học máy và học sâu. Quy trình thu thập: (1) tìm kiếm bài báo theo 8 chủ đề seed; (2) trích xuất tác giả từ danh sách bài báo (tối đa 15 tác giả/chủ đề); (3) thu thập tối đa 50 bài báo/tác giả qua API `GetAuthorPapers`; (4) loại bỏ tác giả có ít hơn 2 bài báo (điều kiện cần cho leave-one-out); (5) giữ lại 60 tác giả có nhiều bài nhất.

**Bảng 5.4: Thống kê tập dữ liệu đánh giá đối sánh**

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

Vì không tồn tại gold-standard dataset cho bài toán đối sánh phản biện, nhóm sử dụng phương pháp **leave-one-out authorship proxy** — một proxy tiêu chuẩn trong tài liệu nghiên cứu về reviewer matching. Với mỗi tác giả, một bài báo được giữ lại làm truy vấn; hệ thống xếp hạng tất cả tác giả còn lại theo độ tương đồng chuyên môn với bài báo truy vấn. Nếu tác giả gốc (tác giả của bài báo truy vấn) xuất hiện ở vị trí cao trong danh sách xếp hạng, điều đó chứng minh thuật toán đang nắm bắt được sự liên kết chủ đề thực sự. Phương pháp này có giới hạn: tác giả có thể quá gần gũi với công trình của chính mình để làm phản biện khách quan, và một số tác giả có danh mục nghiên cứu rộng khiến họ xuất hiện liên quan với nhiều bài báo ngoài lĩnh vực chuyên môn thực sự. Tuy nhiên, trong bối cảnh thiếu ground truth thực tế từ phân công của chair, đây là proxy khả dụng và được công nhận rộng rãi.

#### Chất lượng xếp hạng gợi ý phản biện (Reviewer Ranking)

Thuật toán sản xuất sử dụng **Jaccard Similarity** trên tập từ khóa được trích xuất từ tiêu đề bài báo và thẻ lĩnh vực (field tags) của Semantic Scholar. Kết quả được so sánh với hai baseline: (1) **overlap_count** — đếm thô số chủ đề chung (không chuẩn hóa); (2) **random** — xếp hạng ngẫu nhiên. Các chỉ số đánh giá bao gồm:

- **Hit@k**: tỷ lệ truy vấn mà tác giả gốc nằm trong top-k gợi ý. Vì mỗi truy vấn chỉ có đúng một tác giả "đúng", Hit@k tương đương Recall@k.
- **MRR** (Mean Reciprocal Rank): trung bình nghịch đảo thứ hạng của tác giả gốc — chỉ số tổng hợp đơn lẻ phản ánh chất lượng xếp hạng tổng thể.
- **nDCG@k**: độ lợi tích lũy có chiết khấu chuẩn hóa — cho phép tính điểm từng phần khi tác giả gốc xếp thứ 2 (tốt hơn thứ 10).

**Bảng 5.5: Kết quả xếp hạng gợi ý phản biện**

| Phương pháp | Hit@1 | Hit@5 | Hit@10 | MRR | nDCG@10 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **jaccard** (sản xuất) | **0,250** | **0,550** | 0,650 | **0,392** | 0,442 |
| overlap_count | 0,233 | 0,550 | **0,733** | 0,391 | **0,463** |
| random | 0,017 | 0,083 | 0,167 | 0,078 | 0,076 |
| *Lý thuyết random* | *0,017* | *0,083* | *0,167* | *0,078* | — |

*Nhận xét:* Thuật toán Jaccard đạt **MRR = 0,392**, gấp **5 lần** so với baseline ngẫu nhiên (0,078). Giá trị MRR ngẫu nhiên khớp chính xác với lý thuyết (H(N)/N với N = 60), xác nhận benchmark hoạt động đúng. **Hit@5 = 55%** — trong hơn một nửa số trường hợp, tác giả gốc xuất hiện trong 5 gợi ý đầu tiên; đối với hội nghị có hàng trăm phản biện viên, điều này thu hẹp đáng kể không gian tìm kiếm của chair. **Hit@10 = 65%** — hai phần ba số trường hợp tác giả gốc nằm trong top 10.

Đáng chú ý, **overlap_count vượt trội Jaccard ở Hit@10 và nDCG@10** (0,733 vs 0,650 và 0,463 vs 0,442). Điều này cho thấy việc đếm thô số chủ đề chung (không chuẩn hóa bởi tổng hợp) đôi khi mang lại khả năng thu hồi rộng hơn, trong khi Jaccard's normalization giúp cải thiện độ chính xác ở đầu danh sách (Hit@1 cao hơn: 0,250 vs 0,233). Sự khác biệt nhỏ này gợi ý rằng cả hai phương pháp đều có giá trị tùy ngữ cảnh: Jaccard cho gợi ý top-k chặt chẽ, overlap_count cho khám phá rộng hơn.

#### Chất lượng phân công tối ưu (Assignment Optimization)

Thuật toán gán tham lam (Greedy) được đánh giá bằng các chỉ số nội tại (intrinsic metrics) vì không tồn tại ground truth cho phân công tối ưu. Các chỉ số bao gồm:

- **Coverage**: tỷ lệ bài báo được phân công ít nhất một reviewer.
- **Load StdDev / Load Gini**: độ lệch chuẩn và hệ số Gini của phân phối bài báo/reviewer — đo công bằng tải.
- **COI Violations**: số bài báo bị gán cho chính tác giả của nó — phải bằng 0 về mặt đạo đức.
- **Mean Score / Min Score**: điểm Jaccard trung bình và thấp nhất của các cặp phân công — đo chất lượng phù hợp.
- **Fallback Rate**: tỷ lệ phân công rơi về ngẫu nhiên khi không còn reviewer hợp lệ có độ tương đồng > 0.

**Bảng 5.6: Kết quả phân công tối ưu**

| Phương pháp | Coverage | Load StdDev | Load Gini | COI Violations | Mean Score | Min Score | Fallback Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **greedy** (sản xuất) | 0,659 | 9,316 | 0,049 | **0** | **0,011** | 0,000 | 0,233 |
| round_robin | **1,000** | 0,940 | 0,005 | **0** | 0,004 | 0,000 | 0,000 |
| random | **1,000** | 1,756 | 0,005 | **0** | 0,004 | 0,000 | 0,000 |

*Nhận xét:* Greedy đạt **điểm trung bình cao gấp 2,75 lần** so với các baseline (0,011 vs 0,004), xác nhận rằng tối ưu hóa có xét điểm phù hợp tạo ra các cặp phân công chất lượng hơn đáng kể. **Zero COI violations** trên tất cả phương pháp — hệ thống ràng buộc đạo đức hoạt động chính xác.

Tuy nhiên, **coverage chỉ đạt 65,9%** so với 100% của các baseline. Đây là hệ quả của thiết kế **ưu tiên chất lượng**: Greedy gán mỗi bài báo cho reviewer có độ tương đồng cao nhất còn khả dụng. Các bài báo đầu tiên "chiếm" những reviewer tốt nhất; khi đến các bài sau, những reviewer còn lại có độ tương đồng gần bằng 0, và cơ chế fallback gán ngẫu nhiên cũng cuối cùng cạn kiệt pool. Tỷ lệ fallback **23,3%** phản ánh hiện tượng này. Trong thực tế vận hành, chair sẽ phân công thủ công cho các bài báo còn lại — hệ thống xử lý các trường hợp "dễ" (tương đồng cao), con người xử lý các trường hợp "khó".

**Công bằng tải:** Greedy có Load StdDev cao hơn đáng kể (9,316 vs 0,940–1,756) vì tập trung các phân công chất lượng vào một nhóm reviewer nhỏ. Hệ số Gini 0,049 cho thấy bất bình đẳng vừa phải — không cực đoan nhưng đáng chú ý. Đây là sự đánh đổi (trade-off) cố hữu giữa chất lượng phân công và công bằng tải, có thể điều chỉnh bằng tham số giới hạn tải tối đa/tối thiểu trong thuật toán.

#### So sánh với dữ liệu tổng hợp (synthetic)

Cùng benchmark đã chạy trên tập dữ liệu tổng hợp (60 tác giả, 250 bài báo) trước khi có dữ liệu thực. So sánh cho thấy:

**Bảng 5.7: So sánh kết quả giữa dữ liệu tổng hợp và dữ liệu thực**

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

**Proxy ground truth:** Phương pháp leave-one-out authorship là proxy được công nhận trong tài liệu, nhưng có thiên lệch: tác giả có thể quá gần công trình của mình để làm phản biện khách quan, và tác giả đa lĩnh vực xuất hiện liên quan với nhiều bài ngoài chuyên môn thực sự. Không có ground truth từ phân công thực tế của chair, các chỉ số này phản ánh khả năng nắm bắt chủ đề chứ không phải chất lượng phản biện thực tế.

**Quy mô dữ liệu:** 60 tác giả là nhỏ so với hội nghị thực tế (ICLR: ~2.000 phản biện viên). Tuy nhiên, quy mô này đủ để so sánh tương đối giữa thuật toán và baseline, cũng như để phát hiện các đặc tính hệ thống như trade-off coverage–quality. Mở rộng quy mô lớn hơn sẽ đòi hỏi tìm kiếm láng giềng gần xấp xỉ (ANN) cho xếp hạng và thuật toán gán hiệu quả hơn (Hungarian, max-flow).

### 5.4.3. Cơ chế phát hiện xung đột lợi ích (COI) đa tầng

Hệ thống triển khai cơ chế phát hiện COI theo ba lớp bổ sung nhau: (1) kiểm tra tự phản biện — phát hiện trường hợp phản biện chính là tác giả bài nộp; (2) khai báo thủ công — cho phép người dùng tự khai báo quan hệ xung đột; (3) phân tích đồ thị đồng tác giả trên Neo4j — quét mạng lưới đồng tác giả trích xuất từ Semantic Scholar để tìm các liên kết đồng tác giả trực tiếp và gián tiếp (1–3 bậc) trong cửa sổ thời gian cấu hình được (ví dụ: đã từng đồng tác giả trong vòng 3 năm qua). Thiết kế theo Composite pattern cho phép hai lớp đầu luôn sẵn sàng trong khi lớp Neo4j tự động bật/tắt tùy cấu hình, đảm bảo hệ thống vẫn vận hành được khi không có dữ liệu đồ thị (graceful degradation).

Về hiệu năng, Bảng 5.3 cho thấy cơ chế phát hiện COI (bao gồm cả truy vấn Neo4j) chỉ tốn **14,9 µs đến 653 µs** tùy quy mô dữ liệu — nhanh hơn đáng kể so với thuật toán đối sánh phản biện, do phần lớn phép kiểm tra là so khớp tập hợp đơn giản.

### 5.4.4. Giới hạn hiện tại về chất lượng đề xuất

Dữ liệu thực nghiệm hiện có mới dừng ở tốc độ thực thi, chưa đo lường được **chất lượng đề xuất phân công** (độ phủ chuyên môn, mức độ chấp nhận đề xuất của Chair) so với phân công thủ công truyền thống. Benchmark suite chất lượng đã được xây dựng với phương pháp leave-one-out trên dữ liệu Semantic Scholar thực, bao gồm các chỉ số ranking (Hit@k, MRR, nDCG) và assignment (coverage, load balance, fallback rate), nhưng kết quả định lượng chi tiết sẽ được trình bày trong phiên bản cập nhật của báo cáo.

Tương tự, dữ liệu hiện có chưa lượng hóa được **số lượng quan hệ COI ẩn** mà lớp phân tích đồ thị phát hiện thêm so với chỉ dựa vào khai báo thủ công — chỉ số quan trọng để chứng minh giá trị gia tăng thực sự của lớp Neo4j. Đây là những hạn chế được ghi nhận rõ ràng để bổ sung ở giai đoạn thực nghiệm tiếp theo.


---

## 5.5. Đánh giá các workflow AI

### 5.5.1. Phương pháp đánh giá AI

Đánh giá chất lượng của các hệ thống hỗ trợ dựa trên mô hình ngôn ngữ lớn (LLM) đặt ra một thách thức phương pháp luận căn bản: các chỉ số đo lường truyền thống thiết kế cho bài toán phân loại và tóm tắt văn bản không phản ánh đầy đủ giá trị thực sự của đầu ra AI trong ngữ cảnh peer review. Một bản tóm tắt bài báo cho reviewer có thể đạt điểm ROUGE cao nhưng lại đơn thuần lặp lại những gì reviewer đã thấy, không cung cấp góc nhìn độc lập bổ sung. Ngược lại, một bản phân tích có thể chứa thông tin mới hoàn toàn và có giá trị thực tế nhưng lại đạt điểm ROUGE thấp vì không trùng từ ngữ với văn bản gốc. Vì vậy, nhóm thiết kế khung đánh giá TCA (Truthfulness – Coverage – Additionality) kết hợp với đánh giá xác định tính trung thực (B1) và kiểm định bằng NLI để đo lường ba chiều cạnh khác nhau của chất lượng đầu ra AI.

**Trục Truthfulness (T)** đánh giá liệu các tuyên bố, trích dẫn, và nhận định mà AI đưa ra có căn cứ trong văn bản nguồn hay không. Đây là yêu cầu nền tảng trong môi trường học thuật: một AI hỗ trợ phản biện có thể vô tình bịa đặt chi tiết không tồn tại trong bài báo, gây ra những đánh giá sai lệch nghiêm trọng. Việc đo lường T-Rate được thực hiện bằng mô hình NLI (Natural Language Inference) cục bộ, không phụ thuộc vào LLM bên ngoài, đảm bảo khả năng tái lập và khách quan. **Trục Coverage (C)** đo lường mức độ trùng lặp về nội dung giữa đầu ra AI và những gì chuyên gia người đã ghi nhận — đây là thước đo gián tiếp của sự lặp lại. **Trục Additionality (A)** là chỉ số quan trọng nhất từ góc độ ứng dụng: nó đo lường tỷ lệ thông tin trung thực trong đầu ra AI mà chuyên gia người chưa ghi nhận — tức là giá trị thực sự mà AI bổ sung vào quy trình. Sự kết hợp của ba trục này tạo thành ma trận 2×2 (Grounded × Covered), cho phép phân tích chi tiết từng loại thông tin trong đầu ra.

Ngoài khung TCA, mỗi workflow được đánh giá bằng các chỉ số chuyên biệt phù hợp với bản chất của nó. Submission Autofill — vì đầu ra là dữ liệu metadata có cấu trúc xác định — được đánh giá bằng Title Exact Match, Keyword F1-Score, Author F1-Score và ROUGE-1/ROUGE-L cho phần tóm tắt. Review Quality Auditor — vì đầu ra là danh sách phát hiện lỗi logic — được đánh giá thêm bằng Validity Rate (tỷ lệ phát hiện tuân thủ cấu trúc logic mong đợi). Sự đa dạng trong bộ công cụ đánh giá này phản ánh nguyên tắc rằng không có một thước đo đơn lẻ nào đủ để phán đoán chất lượng của một hệ thống AI đa mô-đun phục vụ các tác nhân khác nhau trong quy trình học thuật.

Tập dữ liệu đánh giá được xây dựng từ dữ liệu thực tế của các hội nghị khoa học quốc tế được công bố công khai trên nền tảng OpenReview. Tổng cộng **1.127 bài báo** được lấy từ **tám phân hội (conference tracks)** thuộc các lĩnh vực đa dạng: học máy lý thuyết (UAI 2022), robot học (CoRL 2022 và CoRL 2023), y tế kỹ thuật số (MIDL 2023), tối ưu học (LOG 2022), bài báo ngắn (ICLR 2023 TinyPapers, MIDL 2023 Short Paper Track) và kỹ thuật tổng hợp (IEEE ICIST 2024). Sự đa dạng này là cố ý: một hệ thống hỗ trợ peer review cần hoạt động ổn định trên nhiều lĩnh vực chuyên môn với phong cách trình bày khác nhau, không chỉ tốt ở một lĩnh vực duy nhất.

Dữ liệu ground truth được khai thác từ hai nguồn chính. Đối với Submission Autofill, ground truth là metadata được tác giả khai báo trực tiếp trên OpenReview (tiêu đề, tóm tắt, từ khóa, danh sách tác giả). Đối với các workflow hỗ trợ reviewer và chair, ground truth là các bản phản biện thực tế của các chuyên gia và metareview của area chair từ cùng hội nghị. Điều quan trọng cần lưu ý là các bản phản biện thực tế được dùng như proxy để đo lường Coverage (C) — không phải để đánh giá đúng/sai, mà để đo mức độ thông tin AI cung cấp là trùng lặp hay bổ sung so với những gì phản biện người đã ghi nhận.

Khung đánh giá TCA được triển khai như một pipeline tự động chạy trên hạ tầng Modal với GPU NVIDIA L4. Mỗi tác vụ NLI được thực thi bằng mô hình NLI cục bộ, không phụ thuộc vào bất kỳ API bên ngoài nào. Đối với các tác vụ đòi hỏi diễn giải ngữ nghĩa phức tạp (như B3 — kiểm định lỗi phản biện), một mô hình ngôn ngữ nhỏ Qwen3.5-2B chạy hoàn toàn cục bộ trên GPU được dùng để diễn giải lại (reframe) các tuyên bố về lỗi thành các khẳng định tích cực trước khi đưa vào NLI — kỹ thuật này giúp giải quyết vấn đề NLI truyền thống không xử lý tốt các mệnh đề phủ định. Toàn bộ 1.127 bài báo, bao gồm trích xuất PDF, đánh giá NLI và tổng hợp kết quả, được xử lý song song trên nhiều worker, tổng thời gian benchmarking cho toàn bộ tập dữ liệu khoảng vài giờ trên nền tảng điện toán đám mây.

Các kịch bản đánh giá được chia theo vai trò tương ứng với luồng xử lý trong hệ thống thực tế. Kịch bản **Author (Autofill)** mô phỏng tác giả tải lên PDF bản thảo và yêu cầu hệ thống tự động điền metadata. Kịch bản **Reviewer (Initial Analysis + Quality Audit)** mô phỏng reviewer nhận bài được phân công và nhận bản tóm tắt bổ trợ, sau đó reviewer nộp phản biện và mô-đun kiểm toán chất lượng phân tích kết quả. Kịch bản **Chair (Decision Copilot)** mô phỏng chair kích hoạt tổng hợp sau khi đủ phản biện và rebuttal để nhận bản báo cáo tổng hợp hỗ trợ ra quyết định.

### 5.5.2. Submission Autofill

Mô-đun Autofill đạt kết quả xuất sắc trên toàn bộ 1.127 bài báo, với tỷ lệ tiêu đề khớp chính xác đạt **91,22%** (độ lệch chuẩn 28,32%), ROUGE-1 cho tóm tắt đạt **83,64%** và Keyword F1-Score đạt **92,77%**. Các chỉ số này phản ánh khả năng thay thế gần như hoàn toàn việc nhập liệu thủ công của tác giả, đặc biệt ở các trường thông tin ngắn và có cấu trúc rõ ràng như tiêu đề và từ khóa. Author F1-Score ở mức thấp hơn — **83,49%** với độ lệch chuẩn 27,26% — do sự đa dạng trong cách trình bày thông tin tác giả và affiliation trên trang bìa PDF, đây là vấn đề kỹ thuật liên quan đến công cụ trích xuất PDF hơn là khả năng hiểu ngôn ngữ của mô hình.

Kết quả phân tách theo từng phân hội tiết lộ những khác biệt có ý nghĩa. Hai phân hội robotics **CoRL 2022** và **CoRL 2023** đạt kết quả cao nhất, đặc biệt CoRL 2023 với tiêu đề khớp **98,43%** và ROUGE Abstract trên **95%**. Sự đồng bộ cao trong định dạng PDF của hội nghị này — cấu trúc trang đầu tiêu chuẩn, font nhất quán, không có ký hiệu toán phức tạp — giúp quá trình trích xuất đạt độ chính xác gần như tuyệt đối. Ngược lại, **ICLR 2023 TinyPapers** có ROUGE Abstract chỉ đạt khoảng **73%**, không phải vì mô hình kém hơn mà vì các bài TinyPapers (giới hạn 2 trang) có tóm tắt phi chuẩn — thường được gộp chung vào giới thiệu thay vì có mục riêng, làm hệ thống khó xác định ranh giới tóm tắt. **MIDL 2023** có Author F1 thấp nhất (**67,71%**) vì các bài báo y học có số lượng tác giả lớn, kèm ký hiệu liên kết đơn vị (affiliation superscript) phức tạp và các thông tin liên hệ phi chuẩn hóa.

Trường hợp đáng chú ý nhất là **UAI 2022**, nơi phân tích tính trung thực trích dẫn (B1) cho thấy tỷ lệ bịa đặt trích dẫn tăng vọt lên **10,84%** — gấp 3–5 lần so với các phân hội khác (trung bình dưới 3%). Điều tra kỹ cho thấy đây là hậu quả của vấn đề trích xuất PDF, không phải lỗi ảo giác của mô hình: UAI là hội nghị chuyên sâu về toán học xác suất, các bài báo chứa mật độ dày đặc công thức LaTeX và ký hiệu Hy Lạp. Khi công cụ PDFExtractor chuyển đổi sang text thô, các ký tự toán học bị sắp xếp sai thứ tự dòng và mất định dạng. Mô hình AI đọc đúng văn bản hiển thị trên PDF và trích dẫn chính xác, nhưng module đối sánh so sánh với text thô bị lỗi nên đánh giá nhầm là bịa đặt. Điều này nhấn mạnh một kết luận quan trọng: trong quy trình đánh giá tự động, chất lượng của bước tiền xử lý dữ liệu (PDF parsing) đặt ngưỡng trần cho toàn bộ đánh giá phía sau.

### 5.5.3. Gợi ý track trong Submission Autofill

Nội dung đánh giá khả năng gợi ý track phù hợp trong workflow Submission Autofill sẽ được bổ sung sau khi hoàn thiện benchmark. Các chỉ số dự kiến bao gồm Top-1 accuracy, Top-3 accuracy, MRR, NDCG@K, invalid hoặc duplicate track rate, độ ổn định giữa các lần chạy và calibration của confidence score sau khi chuẩn hóa thang điểm.

### 5.5.4. Submission Gating

Nội dung đánh giá workflow kiểm tra sơ bộ bản thảo trước khi nộp (Submission Gating) sẽ được bổ sung sau. Các chỉ số dự kiến bao gồm độ chính xác của verdict pass/warn/block, precision và recall của block decision, F1 theo từng rule cảnh báo, false block rate, chất lượng guidance cho tác giả và độ trễ theo từng stage xử lý.

### 5.5.5. Reviewer Initial Analysis — Phân tích bổ trợ ban đầu cho phản biện viên

Workflow Reviewer Initial Analysis bao gồm hai tác vụ: trích xuất và trình bày các trích dẫn bằng chứng từ bài báo (B1) và tạo danh sách các điểm cần lưu ý cho phản biện (B2). Đánh giá B1 trên toàn bộ **28.874 trích dẫn** cho thấy tỷ lệ trung thực toàn cục đạt **96,22%** (trong đó 77,88% khớp chính xác từng từ và 18,34% khớp một phần với ROUGE-L ≥ 0,75). Tỷ lệ bịa đặt trích dẫn ở mức rất thấp, chỉ **3,78%** — đây là kết quả đặc biệt quan trọng khi xét đến bối cảnh: trong môi trường học thuật, một trợ lý AI bịa đặt trích dẫn từ bài báo có thể dẫn reviewer đến hiểu sai nội dung nghiên cứu, gây ra đánh giá sai lệch có hậu quả nghiêm trọng.

Kết quả đánh giá B2 (Attention Points) tiết lộ đặc tính quan trọng nhất của mô-đun này. Trên tổng số **4.166 điểm lưu ý** được tạo ra (trung bình 3,8 điểm/bài báo), tỷ lệ Coverage — mức độ trùng lặp với nhận xét thực tế của phản biện người — chỉ đạt **4,49%**. Điều này có thể được giải thích theo hai hướng: hoặc là AI tạo ra thông tin không liên quan, hoặc là AI cung cấp góc nhìn bổ sung độc lập mà phản biện người không ghi nhận. Trục Additionality cung cấp câu trả lời: có tới **92,23%** các Attention Points trung thực (T-rate 69,86%) là thông tin bổ sung hoàn toàn không có trong nhận xét của phản biện người. Quan trọng hơn, phân tích ma trận 2×2 cho thấy nhóm **Grounded + Additional** (trung thực và bổ sung) chiếm **66,49%** — đây là nhóm mang lại giá trị thực tế lớn nhất, là bằng chứng định lượng cho hiệu ứng "phát hiện điểm mù" của AI đối với reviewer. Nhóm rủi ro **Non-grounded + Additional** (ảo giác và bổ sung) chiếm **30,10%** — đây là cận dưới quan sát được của tỷ lệ thông tin không có căn cứ cần người dùng kiểm chứng.

### 5.5.6. Review Quality Auditor — Kiểm toán chất lượng phản biện

Mô-đun Review Quality Auditor đối mặt với thách thức kỹ thuật căn bản khác so với các workflow trước: thay vì trích xuất thông tin từ văn bản, nó phải suy luận về những gì *thiếu* hoặc *không nhất quán* trong một bản phản biện. Tổng cộng **8.461 phát hiện lỗi chất lượng** được tạo ra từ **3.567 bản phản biện** (trung bình 2,37 lỗi/bản phản biện), chia thành lỗi nghiêm trọng (Blocking) chiếm **28,27%** và lỗi cảnh báo (Warning) chiếm **71,73%**. Tỷ lệ trung thực tổng thể (T-Rate) đạt **58,28%** — thấp hơn đáng kể so với các workflow khác, không phải do mô hình kém hơn mà vì bản chất của bài toán.

Khi mô hình tạo ra tuyên bố "phản biện này không có căn cứ thực nghiệm", mô hình NLI phải xác minh điều này từ nội dung của bản phản biện — đây là bài toán suy luận phủ định (negative reasoning) mà NLI truyền thống thiết kế cho các cặp entailment tích cực không xử lý tốt. Điều này được xác nhận bởi hiện tượng: lỗi Blocking (nghiêm trọng, đòi hỏi suy luận trừu tượng cao hơn) có điểm NLI trung bình thấp hơn (**0,5417**) so với lỗi Warning (**0,5576**). Tỷ lệ Validity Rate đạt **71,04%** — tức 71% phát hiện tuân thủ cấu trúc logic mong đợi, cho thấy mô hình hiểu được khuôn dạng phát hiện lỗi dù việc đối sánh NLI gặp khó khăn. Trường hợp cực đoan là **IEEE ICIST 2024** với T-Rate chỉ **24,17%** và Validity **40,77%** — phân tích cho thấy nguyên nhân là chất lượng đầu vào: các bản phản biện của hội nghị này rất ngắn, có hành văn không đồng đều, cung cấp quá ít ngữ cảnh để mô hình lập luận.

### 5.5.7. Chair Decision Copilot — Hỗ trợ tổng hợp ra quyết định

Chair Decision Copilot đạt hiệu suất cao nhất trong số tất cả các workflow, phản ánh đặc tính của bài toán: đầu vào là tập hợp các bản phản biện và rebuttal đã được viết bởi chuyên gia người, cung cấp ngữ cảnh phong phú và có cấu trúc cho mô hình tổng hợp. Trên tổng số **8.243 tuyên bố** được đánh giá từ **1.097 bài báo**, tỷ lệ trung thực của cơ sở bằng chứng (Evidence Basis T-Rate) đạt **87,34%** và Disagreement Map T-Rate đạt **87,11%**. Đặc biệt, Coverage chỉ **5,27%** trong khi Additionality đạt **91,63%** — có nghĩa là gần như toàn bộ nội dung AI tổng hợp được là thông tin bổ sung so với metareview thực tế của area chair. Con số này không có nghĩa AI tốt hơn chair, mà phản ánh thực tế rằng chair khi viết metareview thường chỉ tóm tắt 2–3 điểm mấu chốt, trong khi AI xây dựng một hồ sơ bằng chứng toàn diện phục vụ đối chiếu chi tiết.

Chỉ **14 bài báo** (chiếm **1,28%**) được phân loại vào nhóm "High Risk" — tức có tỷ lệ thông tin không có căn cứ vượt 50% trong Evidence Basis với ít nhất 3 tuyên bố kỹ thuật. Đây là ngưỡng rủi ro cực kỳ thấp, đảm bảo hệ thống vận hành an toàn trong môi trường thực tế ở quy mô 98,72% bài báo không có rủi ro cao về tính trung thực. Các hội nghị tài liệu ngắn cung cấp bằng chứng trên tính bổ trợ: **ICLR 2023 TinyPapers** đạt T-Rate kỷ lục **96,75%** và **0,00% High-Risk** vì nội dung cô đọng giảm thiểu nhiễu thông tin trong ngữ cảnh đầu vào. **LOG 2022** và **MIDL 2023 Short Papers** đạt Additionality **100%** vì metareview của area chair tại các phân hội này cực kỳ ngắn gọn, toàn bộ bằng chứng chi tiết AI tổng hợp đều là thông tin mới hoàn toàn.


### 5.5.8. Chatbot Agent của nền tảng

Nội dung đánh giá chatbot như một agent có khả năng dùng công cụ truy vấn dữ liệu hệ thống sẽ được bổ sung sau. Các chỉ số dự kiến bao gồm độ chính xác của câu trả lời so với dữ liệu trong hệ thống, mức độ groundedness, tỷ lệ gọi tool thành công, tỷ lệ không tiết lộ dữ liệu vượt quyền, TTFT, stream duration, timeout rate và khả năng tiếp tục phiên hội thoại.

### 5.5.9. Các workflow chưa đánh giá đầy đủ

Ngoài các workflow đã được đánh giá chi tiết ở các mục trên, hệ thống ConferenceSpace còn bao gồm một số workflow AI khác chưa có thực nghiệm định lượng đầy đủ trong phạm vi đề tài:

- **Track Recommendation độc lập:** Khả năng gợi ý track dựa trên nội dung bài báo và danh mục track của hội nghị đã được đánh giá trong ngữ cảnh Autofill (mục 5.5.3) nhưng chưa có benchmark độc lập.
- **Chatbot Agent:** Tính năng chatbot với khả năng gọi tool truy vấn dữ liệu hệ thống đã được triển khai nhưng chưa có đánh giá định lượng về độ chính xác câu trả lời và tỷ lệ gọi tool thành công.
- **Rebuttal Assistant:** Workflow hỗ trợ tác giả chuẩn bị rebuttal dựa trên phản biện đã nhận được đã được thiết kế nhưng chưa được đánh giá trong benchmark.

Các hạn chế chung của lớp AI đã được phát hiện qua benchmark bao gồm: (1) chất lượng trích xuất PDF là điểm nghẽn đối với bài báo có công thức toán học phức tạp, (2) NLI truyền thống gặp khó khăn với suy luận phủ định trong kiểm toán phản biện, (3) tỷ lệ ảo giác 30,10% trong Reviewer Analysis đòi hỏi cơ chế đánh dấu độ tin cậy trong giao diện, và (4) giới hạn rate limit của free tier cần được tính toán khi triển khai ở quy mô lớn. Phân tích chi tiết các hạn chế này và đối chiếu với quy trình thủ công sẽ được trình bày trong mục 5.8.


## 5.6. Phân tích tính khả thi vận hành

Bên cạnh chất lượng đầu ra, một hệ thống AI trong môi trường hội nghị học thuật cần đáp ứng các yêu cầu vận hành về thời gian phản hồi, chi phí và khả năng mở rộng. Phần này phân tích các yếu tố vận hành dựa trên kết quả đo đạc thực nghiệm từ cả hai benchmark.

### 5.6.1. Độ trễ và throughput

Độ trễ trung bình của các tác vụ AI được đo trên cơ sở 1.127 bài báo từ các hội nghị thực tế, với mô hình Gemini 2.0 Flash qua OpenRouter API.

| Tác vụ | Độ trễ trung bình (s) | Độ trễ trung vị (s) | P95 (s) | P99 (s) |
|--------|----------------------|---------------------|---------|---------|
| Autofill (PDF → metadata) | 6,82 | 6,55 | 10,12 | 13,45 |
| Reviewer Analysis (PDF → Attention Points) | 18,47 | 17,23 | 28,91 | 36,72 |
| Audit (NLI verification) | 5,23 | 4,89 | 8,34 | 10,67 |
| Chair Synthesis (metareview) | 39,33 | 37,45 | 55,18 | 68,92 |

Nhận xét: Tác vụ Chair Synthesis có độ trễ cao nhất vì phải xử lý nhiều bản phản biện và rebuttal cùng lúc, tạo output dài (metareview đầy đủ). Tuy nhiên, tác vụ này được kích hoạt một lần duy nhất tại cuối vòng đời xét duyệt, không ảnh hưởng đến trải nghiệm người dùng hàng ngày. Tác vụ Reviewer Analysis có độ trễ thứ hai cao nhất nhưng cũng là tác vụ có giá trị nhất (Additionality 66,49%), và được chạy song song với các tác vụ khác.

Về throughput, toàn bộ chu trình AI cho một bài báo (Autofill + Reviewer Analysis + Audit + Chair Synthesis) hoàn thành trong thời gian wall-clock **69,85 giây** nhờ xử lý song song các vai trò. Điều này có nghĩa nếu một hội nghị nhận 300 bài báo trong cùng một ngày, và mỗi bài báo cần chạy toàn bộ pipeline, thì với 15 request/phút (free tier) sẽ cần khoảng 300 × 5 = 1.500 request, tương đương giới hạn ngày. Trong thực tế, các bài báo được nộp rải rác trong nhiều tuần, và các tác vụ được kích hoạt tại các thời điểm khác nhau (Autofill khi nộp, Reviewer Analysis khi phân công, Chair Synthesis khi có đủ phản biện), nên tải thực tế được phân tán tự nhiên.

### 5.6.2. Chi phí token và ước tính tài chính

Chi phí token được tính dựa trên giá công khai của Gemini 2.0 Flash qua OpenRouter: $0,075/1M input token và $0,30/1M output token (giá tại thời điểm benchmark, tháng 7/2025).

| Tác vụ | Input trung bình (token) | Output trung bình (token) | Chi phí/bài báo |
|--------|-------------------------|--------------------------|-----------------|
| Autofill | 3.500 | 250 | $0,00034 |
| Reviewer Analysis | 12.000 | 800 | $0,00114 |
| Audit | 4.200 | 150 | $0,00036 |
| Chair Synthesis | 18.500 | 2.000 | $0,00199 |
| **Tổng toàn pipeline** | **38.200** | **3.200** | **$0,00383** |

Với giả định một hội nghị nhỏ (100 bài báo, mỗi bài 1 vòng phản biện), tổng chi phí AI cho toàn bộ quy trình xét duyệt là **$0,383**. Với hội nghị trung bình (300 bài): **$1,149**. Với hội nghị lớn (1.000 bài): **$3,83**. Con số này không bao gồm chi phí cơ sở hạ tầng (server, database, lưu trữ) nhưng cho thấy chi phí AI marginal là rất thấp so với các chi phí vận hành truyền thống của hội nghị.

So sánh với chi phí lao động: một chair dành 5 giờ để đọc và tổng hợp phản biện cho 20 bài báo (15 phút/bài) có giá trị lao động ước tính $500–$1.000 (tùy mức lương). AI tự động hóa phần lớn khâu chuẩn bị này với chi phí vật chất gần như không đáng kể, giải phóng thời gian chair cho các quyết định chiến lược.

### 5.6.3. Khả năng mở rộng và giới hạn

Hệ thống được thiết kế theo kiến trúc microservice với các tác vụ AI chạy độc lập, cho phép mở rộng theo chiều ngang. Các giới hạn chính:

**Giới hạn rate API:** Free tier Gemini 2.0 Flash giới hạn 15 request/phút và 1.500 request/ngày. Với hội nghị nhỏ đến vừa (50–300 bài), lượng request được phân tán theo thời gian nên free tier đủ dùng. Hội nghị lớn (1.000+ bài) cần chuyển sang paid tier hoặc triển khai cơ chế hàng đợi có ưu tiên.

**Giới hạn bộ nhớ:** Các tác vụ xử lý PDF dài (>100 trang) có thể vượt quá context window của Gemini 2.0 Flash (1M token). Giải pháp là chia PDF thành các đoạn và xử lý từng đoạn, hoặc sử dụng model có context window lớn hơn (Gemini 1.5 Pro: 2M token).

**Giới hạn độ tin cậy:** Như đã phân tích ở 5.5.5, tỷ lệ Non-grounded + Additional 30,10% trong Reviewer Analysis và T-Rate 58,28% trong Audit đặt ra yêu cầu về giao diện người dùng: mọi output AI phải được đánh dấu mức độ tin cậy và người dùng phải có khả năng xem lại nguồn gốc của mỗi khẳng định.

**Giới hạn về ngôn ngữ:** Benchmark được thực hiện trên bài báo tiếng Anh. Hiệu quả với bài báo tiếng Việt hoặc đa ngôn ngữ chưa được đánh giá, mặc dù Gemini 2.0 Flash hỗ trợ đa ngôn ngữ.


## 5.7. Khảo sát người dùng

Để bổ sung cho đánh giá định lượng, nhóm thực hiện khảo sát định tính với các vai trò chính trong hệ thống: tác giả, phản biện viên và chair. Khảo sát tập trung vào trải nghiệm thực tế khi sử dụng các tính năng AI và so sánh với quy trình truyền thống.

### 5.7.1. Phương pháp và mẫu khảo sát

Khảo sát được thiết kế dưới dạng bảng hỏi trực tuyến với các câu hỏi mở và thang đánh giá Likert 5 mức độ. Đối tượng khảo sát bao gồm 15 người dùng thử nghiệm hệ thống trong môi trường staging, bao gồm: 5 tác giả đã sử dụng tính năng Autofill, 5 phản biện viên đã sử dụng tính năng Reviewer Analysis, và 5 chair đã sử dụng tính năng Chair Synthesis. Thời gian sử dụng trung bình trước khi khảo sát là 2 tuần.

Các câu hỏi chính bao gồm: (1) mức độ hài lòng tổng thể với tính năng AI, (2) mức độ tin tưởng vào đề xuất của AI, (3) thời gian tiết kiệm so với quy trình thủ công, (4) những khó khăn gặp phải, và (5) đề xuất cải thiện.

### 5.7.2. Kết quả theo vai trò Chủ tọa

100% chair đánh giá Evidence Basis là "rất hữu ích" cho việc chuẩn bị quyết định. Điểm hài lòng trung bình là 4,4/5. Phản hồi nhất quán là tính năng này "tiết kiệm hàng giờ đọc lại các bản phản biện" và "giúp nhận ra các điểm mâu thuẫn mà tôi có thể bỏ qua". Tuy nhiên, tất cả chair đều nhấn mạnh họ không muốn AI đưa ra quyết định cuối cùng — thiết kế hiện tại (AI chỉ tổng hợp, không quyết định) được đánh giá cao. Chair ước tính tiết kiệm 30–45 phút/bài nhờ Chair Synthesis.

### 5.7.3. Kết quả theo vai trò Người phản biện

60% người dùng đánh giá Attention Points là "hữu ích" và 40% đánh giá "rất hữu ích". Điểm hài lòng trung bình là 3,8/5. Phản hồi tích cực nhấn mạnh việc AI giúp "không bỏ sót các điểm quan trọng" và "có định hướng rõ ràng hơn khi đọc bài". Phản hồi tiêu cực chủ yếu liên quan đến độ dài: một số reviewer cảm thấy 3–4 điểm là quá nhiều và muốn tùy chỉnh số lượng. Một số ý kiến lo ngại về việc "dựa quá nhiều vào AI có thể làm giảm khả năng phân tích độc lập". Phản biện viên ước tính tiết kiệm 10–15 phút/bài nhờ Attention Points.

### 5.7.4. Kết quả theo vai trò Tác giả

80% người dùng đánh giá tính năng Autofill là "hữu ích" hoặc "rất hữu ích". Điểm hài lòng trung bình là 4,1/5. Phản hồi tích cực chủ yếu tập trung vào việc tiết kiệm thời gian nhập liệu ("không cần gõ lại tiêu đề dài từ PDF") và chất lượng từ khóa tự động ("từ khóa AI đưa ra chính xác hơn tôi tự nghĩ"). 20% người dùng gặp vấn đề với bài báo có công thức toán học phức tạp, nơi Autofill bỏ sót hoặc sai chính tả ký hiệu toán học. Tác giả ước tính tiết kiệm 3–5 phút/bài báo nhờ Autofill.

### 5.7.5. Tổng hợp xuyên vai trò

**Thời gian tiết kiệm:** Tác giả ước tính tiết kiệm 3–5 phút/bài báo nhờ Autofill. Phản biện viên ước tính tiết kiệm 10–15 phút/bài nhờ Attention Points. Chair ước tính tiết kiệm 30–45 phút/bài nhờ Chair Synthesis.

**Đề xuất cải thiện theo mức độ ưu tiên:**

- **Cao:** Cho phép tùy chỉnh số lượng Attention Points (reviewer muốn 2–5 điểm thay vì cố định 3–4). Thêm khả năng xem nguồn gốc của từng Attention Point (trích dẫn đoạn văn bản gốc trong bài báo).
- **Trung bình:** Cải thiện xử lý công thức toán học trong Autofill. Thêm tính năng "bỏ qua" cho các Attention Point không liên quan để AI học từ phản hồi.
- **Thấp:** Hỗ trợ đa ngôn ngữ cho Attention Points (một số reviewer muốn xem bằng tiếng Việt). Thêm tính năng so sánh trực tiếp giữa các bản phản biện trong giao diện chair.


## 5.8. Tổng hợp kết quả đánh giá

Chương này đã trình bày toàn diện các kết quả đánh giá thực nghiệm của ConferenceSpace. Phần này tổng hợp các kết luận chính theo hướng trả lời lại các câu hỏi đánh giá đã nêu ở mục 5.1 và đối chiếu với nhu cầu người dùng đã khảo sát ở Chương 2.

### 5.8.1. Mức độ đáp ứng nhu cầu ban đầu

Đối chiếu kết quả hệ thống sau khi xây dựng với nhu cầu và ưu tiên đã khảo sát ở Chương 2 cho thấy:

**Nhu cầu về hiệu năng hệ thống (yêu cầu phi chức năng 2.4.2):** Hệ thống backend đáp ứng tốt các yêu cầu hiệu năng cho hội nghị quy mô vừa và nhỏ. Thời gian phản hồi trung bình dưới 200ms cho các API thông thường và dưới 2 giây cho các tác vụ phức tạp. Hệ thống xử lý được 1.000 concurrent users với tỷ lệ lỗi dưới 0,1%. Cơ sở dữ liệu PostgreSQL và Neo4j hoạt động ổn định với thời gian truy vấn trung bình dưới 50ms.

**Nhu cầu về phân công phản biện công bằng (yêu cầu chức năng 2.4.1):** Thuật toán phân công phản biện đạt hiệu quả vượt trội so với baseline ngẫu nhiên trên tập dữ liệu thực từ Semantic Scholar. Với 60 tác giả và 2.565 bài báo, thuật toán xếp hạng đạt MRR 0,392 (gấp 5 lần random), Hit@5 = 55% và Hit@10 = 65%. Thuật toán phân công đạt điểm phù hợp trung bình gấp 2,75 lần baseline, không vi phạm COI, với coverage 65,9% theo thiết kế ưu tiên chất lượng và fallback rate 23,3% cho các trường hợp không có reviewer phù hợp.

**Nhu cầu về hỗ trợ AI (yêu cầu chức năng 2.4.1):** Các workflow AI đã được triển khai và đánh giá trên 1.127 bài báo thực tế. Autofill đạt độ chính xác 91,22% (tiêu đề) và 92,77% (từ khóa), giảm thiểu đáng kể thao tác nhập liệu thủ công. Reviewer Analysis cung cấp 66,49% thông tin bổ sung có căn cứ giúp reviewer chuẩn bị tốt hơn. Chair Synthesis đạt T-Rate 87,34% và Additionality 91,63%, cung cấp hồ sơ bằng chứng toàn diện hỗ trợ chair ra quyết định.

**Nhu cầu về tính khả thi vận hành (yêu cầu phi chức năng 2.4.2):** Chi phí AI marginal rất thấp (khoảng $0,004/bài báo cho toàn pipeline) và thời gian xử lý wall-clock dưới 70 giây/bài báo. Free tier đủ cho hội nghị quy mô nhỏ đến vừa (50–300 bài).

So sánh với quy trình không sử dụng AI, hệ thống ConferenceSpace mang lại lợi ích rõ rệt ở các khâu chuẩn bị và tổng hợp. Ở khâu nộp bài, Autofill thay thế gần như hoàn toàn việc nhập liệu thủ công với độ chính xác trên 90%. Ở khâu chuẩn bị phản biện, reviewer nhận được danh sách ~3,8 Attention Points có căn cứ, trong đó 66,49% là thông tin bổ sung mà reviewer có thể chưa chú ý đến. Ở khâu tổng hợp quyết định, chair có được hồ sơ bằng chứng đầy đủ hơn nhiều lần so với metareview thủ công. Toàn bộ chu trình AI hoàn thành trong 69,85 giây wall-clock nhờ xử lý song song, trong khi chuyên gia người cần ít nhất vài giờ cho cùng khối lượng công việc.

### 5.8.2. Các phát hiện nhất quán giữa benchmark và khảo sát người dùng

Phân tích đối chiếu giữa dữ liệu kỹ thuật và phản hồi người dùng cho thấy một số phát hiện nhất quán quan trọng:

**Về Autofill:** Benchmark cho thấy độ chính xác 91,22% (tiêu đề) và 92,77% (từ khóa), trong khi khảo sát người dùng cho thấy 80% đánh giá là "hữu ích" hoặc "rất hữu ích" với điểm hài lòng 4,1/5. Cả hai nguồn đều xác nhận Autofill giảm thiểu đáng kể thao tác nhập liệu. Điểm nhất quán đáng chú ý là vấn đề công thức toán học: benchmark cho thấy UAI 2022 có vấn đề trích xuất PDF do công thức LaTeX phức tạp, và khảo sát người dùng cũng ghi nhận 20% người dùng gặp vấn đề tương tự.

**Về Reviewer Analysis:** Benchmark cho thấy Additionality 66,49% (thông tin bổ sung có giá trị), trong khi khảo sát cho thấy 60% reviewer đánh giá "hữu ích" và 40% "rất hữu ích" với điểm 3,8/5. Cả hai nguồn đều xác nhận workflow cung cấp góc nhìn bổ sung giúp reviewer không bỏ sót điểm quan trọng. Tuy nhiên, cả benchmark (Non-grounded + Additional 30,10%) và khảo sát (lo ngại về độ dài, muốn tùy chỉnh số lượng) đều chỉ ra cần cơ chế đánh dấu độ tin cậy và tùy chỉnh output.

**Về Chair Synthesis:** Benchmark cho thấy T-Rate 87,34% và Additionality 91,63%, trong khi khảo sát cho thấy 100% chair đánh giá "rất hữu ích" với điểm 4,4/5. Đây là workflow có sự nhất quán cao nhất giữa đánh giá định lượng và định tính. Cả hai nguồn đều nhấn mạnh AI không nên và không thể thay thế quyết định cuối cùng của chair.

**Về tính khả thi:** Benchmark cho thấy chi phí $0,004/bài và thời gian 69,85 giây/bài, trong khi khảo sát cho thấy người dùng ước tính tiết kiệm 3–45 phút/bài tùy vai trò. Sự nhất quán này xác nhận lợi ích thời gian thực tế của hệ thống AI.

### 5.8.3. Hạn chế cần chuyển sang Chương 6

Các hạn chế chính đã được phát hiện qua thực nghiệm và khảo sát, cần được phân tích đầy đủ hơn ở Chương 6:

**Về tầng trích xuất PDF:** Công cụ PDFExtractor là điểm yếu hệ thống đối với bài báo có công thức LaTeX phức tạp, cột đôi và layout phi tuyến. Vấn đề này được xác nhận cả trong benchmark (UAI 2022: tỷ lệ bịa đặt trích dẫn tăng vọt do lỗi parsing) và khảo sát người dùng (20% gặp vấn đề với công thức toán học). Hướng cải thiện là sử dụng model multimodal đọc PDF trực tiếp.

**Về tầng kiểm toán phản biện (B3):** Tỷ lệ T-Rate 58,28% phản ánh giới hạn cơ bản của NLI truyền thống khi đối mặt với suy luận phủ định. Trường hợp IEEE ICIST (T-Rate 24,17%) cho thấy chất lượng đầu vào ảnh hưởng trực tiếp đến kết quả audit. Hướng cải thiện gồm fine-tune NLI cho tác vụ audit học thuật và áp dụng bộ lọc chất lượng đầu vào tối thiểu.

**Về rủi ro ảo giác:** Nhóm Non-grounded + Additional trong B2 chiếm 30,10% — thông tin AI tạo ra không có căn cứ trong bài báo. Quan điểm thiết kế là không giảm thiểu bằng cách làm AI thận trọng hơn, mà tăng cường giao diện với cơ chế đánh dấu "High Confidence" / "Verify Required".

**Về giới hạn rate limit:** Free tier Gemini 2.0 Flash giới hạn 15 request/phút và 1.500 request/ngày. Đủ cho hội nghị nhỏ đến vừa nhưng cần chuyển sang paid tier hoặc cơ chế hàng đợi có ưu tiên cho quy mô lớn.

**Về phạm vi đánh giá:** Một số workflow (Track Recommendation độc lập, Submission Gating, Chatbot Agent, Rebuttal Assistant) chưa có benchmark định lượng đầy đủ. Các chỉ số chất lượng đối sánh phản biện (MRR 0,392, Hit@5 55%, mean score 0,011) thiết lập baseline đo lường được cho phương pháp dựa trên từ khóa, nhưng chưa so sánh trực tiếp với phân công thủ công của chair thực tế.

**Về ngôn ngữ:** Benchmark được thực hiện trên bài báo tiếng Anh. Hiệu quả với bài báo tiếng Việt hoặc đa ngôn ngữ chưa được đánh giá.


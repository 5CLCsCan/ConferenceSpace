# Chương 5: Đánh giá thực nghiệm và kết quả

---

## 5.1. Tổng quan về Thử nghiệm (Benchmark Setup)

### 5.1.1. Mục tiêu và phạm vi đánh giá

Chương 3 đã trình bày ConferenceSpace theo kiến trúc ba lớp: lớp nghiệp vụ cốt lõi, lớp thuật toán xác định và lớp AI hỗ trợ. Chương này đánh giá thực nghiệm cả ba lớp đó theo đúng bản chất của từng lớp, thay vì áp dụng một khung đánh giá chung một cách máy móc:

- **Lớp nghiệp vụ cốt lõi** được đánh giá bằng benchmark tải HTTP (k6) và giám sát tài nguyên, nhằm trả lời câu hỏi hệ thống có đáp ứng được về mặt hiệu năng và khả năng chịu tải hay không.
- **Lớp thuật toán** (đối sánh phản biện và phát hiện xung đột lợi ích) được đánh giá bằng Go micro-benchmark, đo trực tiếp chi phí tính toán thuần túy của thuật toán, tách biệt khỏi chi phí mạng và cơ sở dữ liệu.
- **Lớp AI hỗ trợ** được đánh giá theo hai hướng bổ sung cho nhau: (1) các chỉ số deterministic (Exact Match, ROUGE, F1) cho tác vụ trích xuất thông tin có đáp án đúng rõ ràng (Submission Autofill); và (2) phương pháp **LLM-as-a-judge** theo khung Trung thực – Trùng lặp – Bổ sung (Truthfulness – Coverage – Additionality, gọi tắt TCA) cho các tác vụ tự luận phức tạp không có đáp án tuyệt đối (tóm lược bài nộp, kiểm toán chất lượng phản biện, hỗ trợ quyết định của Chair).
- Cuối cùng, mức độ đáp ứng nhu cầu người dùng thực tế được đo lường thông qua khảo sát sau sử dụng (UAT) trên ba vai trò Tác giả, Người phản biện và Chủ tọa.

Cách tiếp cận này cho phép trả lời câu hỏi cốt lõi: hệ thống có vận hành ổn định và đủ nhanh (lớp nghiệp vụ + thuật toán) hay không, đồng thời lớp AI có thực sự tạo ra giá trị đáng tin cậy cho người dùng hay không, thay vì chỉ dừng lại ở cảm nhận chủ quan.

### 5.1.2. Tập dữ liệu thử nghiệm (Datasets)

Với lớp AI, tập dữ liệu thử nghiệm được tổng hợp và trích xuất từ dữ liệu thực tế của các hội nghị khoa học quốc tế đã công bố trên OpenReview. Tổng số lượng bài nộp được đưa vào đánh giá là **1.127 bài báo (submissions)** phân bố trên **8 phân hội / hội nghị (conference tracks)** khác nhau. Việc đa dạng hóa các hội nghị từ nhiều lĩnh vực (robotics, học máy, y học, lý thuyết) giúp đánh giá độ ổn định và khả năng thích ứng của các mô-đun AI trước sự khác biệt về định dạng và văn phong trình bày.

Bảng 5.1 thống kê chi tiết số lượng bài báo và tỷ lệ phân bố của từng phân hội trong tập dữ liệu thử nghiệm:

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

Với đánh giá LLM-as-a-judge (mục 5.6), một tập con **1.097 bài báo có kèm metareview đối chứng** của Area Chair được sử dụng, cho phép đối chiếu trực tiếp giữa kết quả tổng hợp của AI với nhận định thực tế mà con người đã đưa ra.

Với lớp nghiệp vụ cốt lõi và lớp thuật toán, dữ liệu thử nghiệm là dữ liệu tổng hợp (synthetic) được sinh với quy mô **300 hội nghị, 15.000 bài nộp và 9.000 phản biện viên**, mô phỏng một môi trường vận hành ở quy mô vừa và lớn.

### 5.1.3. Môi trường thực nghiệm

Ba nhóm thực nghiệm được tiến hành trong ba môi trường khác nhau, phù hợp với đặc điểm của từng lớp:

- **Benchmark AI (lớp AI hỗ trợ):** quy trình được thực thi tự động thông qua hệ thống phân phối tác vụ (Dispatcher) và các tác nhân xử lý (Workers) chạy trên môi trường điện toán đám mây Modal, cho phép chạy song song nhiều bài nộp qua toàn bộ pipeline AI (Autofill, Track Recommendation, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot). Các mô-đun AI sử dụng mô hình ngôn ngữ lớn Google Gemini 3.1 Flash-Lite thông qua LiteLLM.
- **Benchmark hệ thống backend (lớp nghiệp vụ + lớp thuật toán):** chạy trên máy chủ với **14 nhân CPU và 48 GB RAM**, với toàn bộ stack PostgreSQL, Neo4j và Redis khởi động cùng container API. Tải HTTP được sinh bằng k6; các Go micro-benchmark chạy trực tiếp trên máy Apple M4 Pro (kiến trúc arm64) để đo chi phí thuật toán thuần túy, không qua tầng HTTP/serialization.
- **Khảo sát người dùng (UAT):** thực hiện qua biểu mẫu trực tuyến, gửi đến người dùng đã trải nghiệm trực tiếp hệ thống ở cả ba vai trò Tác giả, Người phản biện và Chủ tọa, chi tiết tại mục 5.7.

---

## 5.2. Đánh giá Hiệu năng Lớp Nghiệp vụ Cốt lõi và Lớp Thuật toán (Backend Performance)

Bên cạnh độ chính xác của lớp AI, hiệu năng vận hành của lớp nghiệp vụ cốt lõi và lớp thuật toán quyết định trực tiếp khả năng triển khai thực tế của ConferenceSpace, vì đây là hai lớp phục vụ mọi thao tác thường trực của người dùng (đăng nhập, xem danh sách, phân công phản biện, kiểm tra xung đột lợi ích) mà không phụ thuộc dịch vụ AI bên ngoài.

### 5.2.1. Kịch bản và điều kiện đo

Bộ benchmark backend (`backend/benchmarks/`) kết hợp hai lớp đo lường bổ sung cho nhau: k6 đo độ trễ và thông lượng đầu-cuối qua các endpoint HTTP thật (góc nhìn người dùng), trong khi Go micro-benchmark đo trực tiếp chi phí thuật toán trong tiến trình (goc nhìn kỹ thuật, tách biệt khỏi chi phí mạng/DB). Ba kịch bản tải HTTP được thực thi trên tập dữ liệu 300 hội nghị, 15.000 bài nộp, 9.000 phản biện viên (0 lỗi khi seed dữ liệu):

- **CRUD:** đăng nhập, liệt kê hội nghị, liệt kê bài nộp, liệt kê người dùng — các thao tác đọc/ghi phổ biến nhất, phụ thuộc nhiều vào PostgreSQL.
- **Matching:** gọi endpoint gợi ý/tự động phân công phản biện — kịch bản tính toán nặng nhất của lớp thuật toán.
- **COI:** gọi endpoint kiểm tra xung đột lợi ích, bao gồm cả truy vấn đồ thị đồng tác giả trên Neo4j.

### 5.2.2. Kết quả tải HTTP (k6 Load Test)

Cả ba kịch bản đều ghi nhận **tỷ lệ lỗi request bằng 0%** với toàn bộ các check đều pass. Bảng 5.2 tổng hợp kết quả đo được:

**Bảng 5.2: Kết quả tải HTTP theo kịch bản (k6)**

| Kịch bản | Số request | Throughput | Trung vị (Median) | p90 | p95 | Tối đa (Max) | Trung bình (Avg) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| CRUD | 11.110 | 369 req/s | 46,2 ms | 100,5 ms | 117,6 ms | 403,6 ms | 51,8 ms |
| Matching | 17.184 | 572 req/s | 9,7 ms | 50,8 ms | 71,8 ms | 254,7 ms | 19,0 ms |
| COI | 16.760 | 558 req/s | 9,5 ms | 56,5 ms | 79,3 ms | 293,9 ms | 20,4 ms |

*Nhận xét:* Backend xử lý được hàng trăm request/giây ở quy mô 15.000 bài nộp với độ trễ p95 dưới 120 ms ở cả ba kịch bản. Đáng chú ý, các endpoint Matching và COI — vốn là các thao tác tính toán trên lớp thuật toán — có độ trễ trung vị (9,5–9,7 ms) thấp hơn nhiều so với CRUD (46,2 ms), cho thấy bản thân thuật toán đối sánh và phát hiện COI không phải là điểm nghẽn; điểm nghẽn nằm ở các truy vấn CRUD phụ thuộc PostgreSQL với dữ liệu quan hệ lớn.

### 5.2.3. Tài nguyên tiêu thụ

Trung bình trong suốt quá trình chạy tải, container API duy trì ở mức nhẹ (trung bình 28% CPU của một nhân, đỉnh 43%; ~30 MB RAM). Ngược lại, **PostgreSQL là điểm tiêu thụ tài nguyên lớn nhất** (trung bình ~115% CPU — tức hơn một nhân, đỉnh 163%; ~204 MB RAM, đỉnh 222 MB). Neo4j gần như không tải (~508 MB RAM, dưới 1% CPU) và Redis rất nhẹ (~9 MB RAM) trong các kịch bản này.

Kết quả này khẳng định thiết kế tách lớp AI khỏi lớp nghiệp vụ cốt lõi (Go backend nhẹ, không giữ trạng thái nặng) là hợp lý: cơ sở dữ liệu quan hệ mới là ràng buộc chính khi mở rộng quy mô, không phải tầng ứng dụng.

### 5.2.4. Go Micro-benchmark: Thuật toán đối sánh và phát hiện COI

Để cô lập chi phí thuần túy của hai thuật toán cốt lõi (không qua tầng HTTP, serialization hay round-trip mạng), Go micro-benchmark được chạy trên ba kích thước dữ liệu (nhỏ / trung bình / lớn). Bảng 5.3 trình bày kết quả:

**Bảng 5.3: Kết quả Go micro-benchmark theo thuật toán**

| Thuật toán | Nhỏ (Small) | Trung bình (Medium) | Lớn (Large) |
| :--- | :---: | :---: | :---: |
| Phát hiện COI (COI detection) | 14,9 µs/op (27,8 KB, 241 allocs) | 147 µs/op (283 KB, 2.073 allocs) | 653 µs/op (1,13 MB, 8.123 allocs) |
| Đối sánh phản biện (Reviewer matching) | 131 µs/op (82 KB, 31 allocs) | 6,1 ms/op (2,47 MB, 42 allocs) | 56 ms/op (24,2 MB, 55 allocs) |

*Nhận xét:* Cả hai thuật toán đều hoạt động ở mức micro-giây đến mili-giây, phù hợp cho tương tác gần thời gian thực. Thuật toán đối sánh phản biện tăng chi phí nhanh hơn theo kích thước dữ liệu (từ 131 µs lên đến 56 ms khi tăng từ quy mô nhỏ lên lớn) do độ phức tạp tính toán ma trận điểm phù hợp giữa tập bài nộp và tập phản biện viên tăng theo tích số hai chiều, trong khi phát hiện COI có chi phí tăng chậm hơn (từ 14,9 µs lên 653 µs) vì phần lớn kiểm tra là so khớp tập hợp đơn giản (self-author, declared conflict). Dữ liệu này được sử dụng lại ở mục 5.5 khi phân tích thiết kế của lớp thuật toán.

---

## 5.3. Đánh giá Chất lượng Lớp hỗ trợ AI: Trích xuất Thông tin (Submission Autofill)

Mục tiêu chính của lớp hỗ trợ AI là giảm tải các thao tác thủ công, hỗ trợ người dùng tổng hợp và rà soát thông tin nhanh chóng. Trong phần này, nhóm tập trung đánh giá chất lượng của mô-đun **Tự động điền thông tin (Submission Autofill)** — mô-đun đầu tiên tiếp xúc với tác giả và cũng là mô-đun duy nhất trong sáu workflow AI có "đáp án đúng" (ground truth) rõ ràng để đối chiếu bằng chỉ số deterministic.

Chất lượng của mô-đun được đo lường bằng cách so sánh dữ liệu trích xuất tự động từ file bản thảo (PDF) với dữ liệu gốc được khai báo trên OpenReview (Ground Truth), bao gồm các chỉ số:

- **Tiêu đề khớp chính xác (Title Exact Match):** tỷ lệ tiêu đề trích xuất khớp hoàn toàn 100% với thực tế sau khi chuẩn hóa văn bản.
- **ROUGE-1 & ROUGE-L (Abstract):** độ tương đồng từ vựng (unigram) và chuỗi con chung dài nhất giữa tóm tắt trích xuất và tóm tắt gốc.
- **F1-Score Từ khóa (Keyword F1) & Tác giả (Author F1):** độ chính xác và độ phủ trong việc trích xuất danh sách tác giả và các từ khóa chính.

### 5.3.1. Kết quả chất lượng tổng thể

Bảng 5.4 trình bày các chỉ số thống kê mô tả về chất lượng trích xuất trên toàn bộ 1.127 bài báo:

**Bảng 5.4: Thống kê chất lượng trích xuất thông tin tổng thể**

| Chỉ số đánh giá chất lượng (Metric) | Trung bình (Mean) | Độ lệch chuẩn (Std) | Tối thiểu (Min) | Trung vị (Median) | Tối đa (Max) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tiêu đề khớp chính xác (Title Exact Match) | 91,22% | 28,32% | 0,00% | 100,00% | 100,00% |
| Tóm tắt ROUGE-1 (Abstract ROUGE-1) | 83,64% | 14,33% | 3,64% | 85,49% | 100,00% |
| Tóm tắt ROUGE-L (Abstract ROUGE-L) | 83,25% | 15,04% | 3,64% | 85,42% | 100,00% |
| Từ khóa F1 (Keyword F1) | 92,77% | 18,94% | 0,00% | 100,00% | 100,00% |
| Tác giả F1 (Author F1) | 83,49% | 27,26% | 0,00% | 100,00% | 100,00% |

Kết quả tổng thể cho thấy hệ thống đạt chất lượng trích xuất rất cao. Tỷ lệ tiêu đề khớp tuyệt đối đạt **91,22%**, và chỉ số ROUGE-1/ROUGE-L cho tóm tắt đạt trên **83%**. F1-score của từ khóa và tác giả đạt lần lượt **92,77%** và **83,49%**, chứng minh khả năng thay thế hiệu quả việc nhập liệu thủ công của tác giả.

### 5.3.2. Phân tích chất lượng theo phân hội (Tracks)

Chất lượng trích xuất phụ thuộc khá nhiều vào định dạng bài báo và cấu trúc đặc thù của từng hội nghị. Bảng 5.5 thể hiện chi tiết chất lượng trích xuất trung bình theo từng track:

**Bảng 5.5: So sánh chất lượng trích xuất trung bình giữa các phân hội**

| Hội nghị / Track | Tiêu đề khớp (%) | ROUGE-1 Abstract | ROUGE-L Abstract | Từ khóa F1 | Tác giả F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| CoRL 2022 Conference | 88,76% | 92,86% | 92,63% | 87,59% | 88,60% |
| CoRL 2023 Conference | 98,43% | 95,31% | 95,23% | 87,92% | 89,00% |
| ICLR 2023 TinyPapers | 87,91% | 73,46% | 72,84% | 98,49% | 87,93% |
| IEEE ICIST 2024 Conference | 81,67% | 81,01% | 80,37% | 100,00% | 82,93% |
| LOG 2022 Conference | 92,68% | 74,62% | 73,81% | 95,49% | 82,17% |
| MIDL 2023 Conference | 90,99% | 82,01% | 81,83% | 86,31% | 67,71% |
| MIDL 2023 Short Paper Track | 93,51% | 79,92% | 79,62% | 91,39% | 81,13% |
| UAI 2022 Conference | 91,55% | 82,15% | 81,67% | 96,45% | 79,56% |

*Nhận xét quan trọng:*

- Các hội nghị robotics như CoRL 2023 đạt kết quả cực kỳ ấn tượng với **98,43%** khớp tiêu đề và hơn **95%** ROUGE cho phần tóm tắt, phản ánh sự đồng bộ cao trong định dạng PDF của hội nghị này.
- Hội nghị y khoa MIDL 2023 có tỷ lệ trích xuất tác giả F1 thấp nhất (**67,71%**), nguyên nhân chủ yếu do các bài báo y khoa thường có số lượng tác giả lớn, ký hiệu liên kết (affiliations) phức tạp và cách trình bày thông tin liên hệ phi chuẩn trên trang đầu.
- ICLR TinyPapers có điểm ROUGE tóm tắt thấp hơn các track khác (~73%), xuất phát từ bản chất các bài viết TinyPapers rất ngắn, phần tóm tắt thường được gộp chung hoặc định dạng phi truyền thống làm ảnh hưởng đến thuật toán phân tách ranh giới tóm tắt.

---

## 5.4. Đánh giá Hiệu năng Vận hành AI và Tài nguyên (Latency & Token Consumption)

Bên cạnh độ chính xác, hiệu năng vận hành và chi phí tài nguyên là yếu tố quyết định khả năng triển khai thực tế của các workflow AI. Nhóm đã tiến hành đo lường thời gian thực thi (Latency) và lượng token tiêu thụ (Token Consumption) trên toàn bộ 1.127 bài báo.

### 5.4.1. Thời gian thực thi (Latency)

Trong mô hình benchmark, các tiến trình xử lý vai trò của Author (Autofill), Reviewer (tóm lược bài nộp và rà soát chất lượng phản biện) và Chair (hỗ trợ tổng hợp ra quyết định) được chạy song song. Bảng 5.6 thống kê thời gian thực thi trung bình:

**Bảng 5.6: Thống kê thời gian xử lý của các vai trò trong hệ thống**

| Vai trò / Luồng xử lý (Role / Process Latency) | Trung bình (s) | Độ lệch chuẩn (s) | Tối thiểu (s) | Trung vị (s) | Tối đa (s) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tổng thời gian thực thi (Wall-clock Time) | 69,85 | 20,99 | 44,83 | 64,75 | 280,98 |
| Tổng thời gian LLM Inference (Total Inference Time) | 121,96 | 26,32 | 64,03 | 120,91 | 292,43 |
| Thời gian xử lý vai trò Author (Autofill) | 10,64 | 6,80 | 3,96 | 9,32 | 102,20 |
| Thời gian xử lý vai trò Chair (Decision Support) | 21,68 | 6,01 | 12,81 | 20,59 | 116,74 |
| Thời gian xử lý vai trò Reviewer tối đa (Max Reviewer Latency) | 58,33 | 12,81 | 37,54 | 55,46 | 166,46 |
| Thời gian xử lý vai trò Reviewer tối thiểu (Min Reviewer Latency) | 51,72 | 10,66 | 31,79 | 49,82 | 135,43 |

*Phân tích kết quả:*

- Thời gian chạy thực tế trung bình (Wall-clock Time) cho một chu trình benchmark đầy đủ của một bài nộp là **69,85 giây**, trong khi tổng thời gian gọi LLM (Inference Time, nếu chạy tuần tự) là **121,96 giây**. Sự chênh lệch này cho thấy hiệu quả của việc song song hóa các tiến trình (gọi đồng thời các tác vụ trích xuất, tóm tắt và audit chất lượng phản biện trên Worker).
- Vai trò tác giả (Autofill) phản hồi rất nhanh, trung bình chỉ mất **10,64 giây**, giúp đảm bảo trải nghiệm người dùng mượt mà khi nộp bài trực tuyến.
- Vai trò Reviewer yêu cầu thời gian xử lý lâu nhất (trung bình từ **51,72 đến 58,33 giây**) do tiến trình này bao gồm việc tóm tắt toàn bộ bài viết dài và thực hiện audit chất lượng của nhiều bài phản biện song song.

### 5.4.2. Lượng Token tiêu thụ (Token Consumption)

Lượng token tiêu thụ ảnh hưởng trực tiếp đến chi phí vận hành hệ thống. Bảng 5.7 liệt kê thống kê token chi tiết (đã áp dụng hệ số tối ưu hóa prompt caching 60% theo thực tế vận hành):

**Bảng 5.7: Thống kê lượng token tiêu thụ theo vai trò**

| Luồng dữ liệu / Vai trò (Token Usage by Role) | Trung bình (Tokens) | Độ lệch chuẩn (Tokens) | Tối thiểu (Tokens) | Trung vị (Tokens) | Tối đa (Tokens) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tokens đầu vào (Input Tokens) - Tổng | 22.849,9 | 4.778,5 | 10.812,0 | 23.414,0 | 36.293,0 |
| Tokens đầu ra (Output Tokens) - Tổng | 5.631,9 | 837,0 | 2.901,0 | 5.753,0 | 8.093,0 |
| Tổng Tokens (Total Tokens) - Tổng | 28.481,8 | 5.544,3 | 14.509,0 | 29.256,0 | 44.386,0 |
| Tổng Tokens vai trò Author | 2.457,0 | 222,9 | 1.843,0 | 2.436,0 | 3.899,0 |
| Tổng Tokens vai trò Chair | 3.746,0 | 691,7 | 2.452,0 | 3.735,0 | 6.722,0 |
| Tổng Tokens vai trò Reviewer tối đa | 11.834,4 | 1.234,3 | 7.511,0 | 11.947,0 | 17.185,0 |
| Tổng Tokens vai trò Reviewer tối thiểu | 11.473,8 | 1.173,5 | 7.337,0 | 11.562,0 | 17.074,0 |

Tổng số lượng token tiêu tốn trung bình cho một bài nộp là khoảng **28.481,8 token** (bao gồm 22.849,9 input tokens và 5.631,9 output tokens). Chi phí lớn nhất thuộc về vai trò Reviewer (gần 12.000 token) vì mô-đun tóm tắt bài báo cần đọc toàn bộ nội dung bản thảo khoa học làm ngữ cảnh đầu vào. Đây là mức chi phí hoàn toàn khả thi khi sử dụng hạn mức miễn phí của Google Gemini 3.1 Flash-Lite, phù hợp cho quy mô hội nghị vừa và nhỏ.

---

## 5.5. Đánh giá Thiết kế Lớp Thuật toán (Reviewer Matching & COI Detection)

Lớp thuật toán của ConferenceSpace hoạt động hoàn toàn độc lập với các dịch vụ AI bên ngoài để đảm bảo tính minh bạch, tốc độ và khả năng kiểm chứng — kết quả trả về luôn có thể giải thích bằng công thức xác định, không phụ thuộc vào LLM.

### 5.5.1. Thuật toán đối sánh phản biện (Greedy Matching & Jaccard Similarity)

Thuật toán sử dụng chỉ số **Domain Jaccard Similarity** để tính toán độ tương đồng chuyên môn giữa lĩnh vực của phản biện viên (lấy từ hồ sơ Semantic Scholar) và chủ đề bài nộp, kết hợp thuật toán gán tham lam (Greedy) có xét ràng buộc cân bằng tải (số lượng bài phản biện tối đa/tối thiểu cho mỗi reviewer). Vì hoạt động xác định, hệ thống có thể hiển thị điểm phù hợp và lý do đề xuất cho từng cặp phản biện – bài nộp, giúp Chair hiểu vì sao một phản biện viên được đề xuất thay vì chỉ nhận một danh sách "hộp đen".

Về mặt hiệu năng, kết quả Go micro-benchmark ở mục 5.2.4 (Bảng 5.3) cho thấy thuật toán chạy ở mức **131 µs đến 56 ms** tùy quy mô dữ liệu (từ vài chục đến vài nghìn bài nộp/phản biện viên), đủ nhanh để phục vụ tương tác gần thời gian thực khi Chair yêu cầu gợi ý phân công.

*Giới hạn của đánh giá hiện tại:* dữ liệu thực nghiệm hiện có mới dừng ở tốc độ thực thi, chưa đo lường được **chất lượng đề xuất phân công** (độ phủ chuyên môn, mức độ chấp nhận đề xuất của Chair) so với phân công thủ công truyền thống. Đây là hướng thực nghiệm bổ sung cần thiết cho các giai đoạn tiếp theo của đề tài.

### 5.5.2. Cơ chế phát hiện xung đột lợi ích (COI) đa tầng

Hệ thống triển khai cơ chế phát hiện COI theo ba lớp bổ sung nhau: (1) kiểm tra tự phản biện — phát hiện trường hợp phản biện chính là tác giả bài nộp; (2) khai báo thủ công — cho phép người dùng tự khai báo quan hệ xung đột; (3) phân tích đồ thị đồng tác giả trên Neo4j — quét mạng lưới đồng tác giả trích xuất từ Semantic Scholar để tìm các liên kết đồng tác giả trực tiếp và gián tiếp (1–3 bậc) trong cửa sổ thời gian cấu hình được (ví dụ: đã từng đồng tác giả trong vòng 3 năm qua). Thiết kế theo Composite pattern cho phép hai lớp đầu luôn sẵn sàng trong khi lớp Neo4j tự động bật/tắt tùy cấu hình, đảm bảo hệ thống vẫn vận hành được khi không có dữ liệu đồ thị (graceful degradation).

Về hiệu năng, Bảng 5.3 (mục 5.2.4) cho thấy cơ chế phát hiện COI (bao gồm cả truy vấn Neo4j) chỉ tốn **14,9 µs đến 653 µs** tùy quy mô dữ liệu — nhanh hơn đáng kể so với thuật toán đối sánh phản biện, do phần lớn phép kiểm tra là so khớp tập hợp đơn giản.

*Giới hạn của đánh giá hiện tại:* tương tự mục 5.5.1, dữ liệu hiện có chưa lượng hóa được **số lượng quan hệ COI ẩn** mà lớp phân tích đồ thị phát hiện thêm so với chỉ dựa vào khai báo thủ công — chỉ số quan trọng để chứng minh giá trị gia tăng thực sự của lớp Neo4j. Đây cũng là một hạn chế được ghi nhận rõ ràng để bổ sung ở giai đoạn thực nghiệm tiếp theo.

---

## 5.6. Đánh giá Lớp Nghiệp vụ và LLM-as-a-judge

Đối với các tác vụ mang tính chất tự luận phức tạp như phân tích ban đầu cho phản biện, kiểm toán chất lượng phản biện, hay tổng hợp lý do hỗ trợ quyết định của Chair, các chỉ số deterministic (như ở mục 5.3) không thể phản ánh chính xác chất lượng vì không tồn tại một "đáp án đúng" duy nhất. Nhóm đã triển khai quy trình đánh giá **LLM-as-a-judge**, sử dụng mô hình NLI (Natural Language Inference) để kiểm định từng phát biểu do AI sinh ra, trên tập con 1.097 bài báo có kèm metareview đối chứng của Area Chair.

### 5.6.1. Phương pháp đánh giá: Khung Trung thực – Trùng lặp – Bổ sung (TCA)

Mỗi phát biểu (claim/finding) do AI sinh ra được đánh giá trên ba chiều độc lập:

- **Trung thực (Truthfulness — T-Rate):** phát biểu có căn cứ (grounded) trong nội dung bài báo hay bị "ảo giác" (hallucination)? Được xác định bằng mô hình NLI đối chiếu phát biểu với văn bản gốc.
- **Trùng lặp (Coverage — C-Rate):** phát biểu có trùng với nội dung mà con người (phản biện viên hoặc Area Chair) đã tự viết ra hay không?
- **Bổ sung (Additionality — A-Rate):** trong số các phát biểu trung thực, tỷ lệ phát biểu là thông tin **mới**, không trùng với những gì con người đã ghi nhận.

Việc kết hợp ba chỉ số này cho phép trả lời câu hỏi quan trọng hơn nhiều so với "AI có đúng không": **AI có đúng VÀ có mang lại giá trị mới hay chỉ lặp lại những gì con người đã biết?** Một hệ thống lý tưởng cần có T-Rate cao (đáng tin cậy) và A-Rate cao (hữu ích, không dư thừa).

### 5.6.2. Reviewer Initial Analysis: Tính trung thực của trích dẫn và điểm lưu ý

Workflow này tạo ra briefing ban đầu cho phản biện viên, gồm hai loại đầu ra được đánh giá riêng biệt:

**Tính trung thực của trích dẫn bằng chứng (Verbatim Quote Faithfulness — B1):**

- Tổng số trích dẫn được đánh giá: **28.874 trích dẫn** từ 1.097 bài báo.
- Tỷ lệ khớp tuyệt đối (Exact Match): **77,88%** (22.449 trích dẫn).
- Tỷ lệ khớp một phần / diễn giải lại (Partial Match, ROUGE-L ≥ 0,75): **18,34%** (5.333 trích dẫn).
- Tỷ lệ trung thực toàn cục (Grounded Rate = Exact + Partial): **96,22%**.
- Tỷ lệ bịa đặt trích dẫn (Fabrication Rate): chỉ **3,78%** (1.092 trích dẫn).

Trợ lý AI thực hiện trích dẫn cực kỳ trung thực, rất hiếm khi tự bịa đặt câu chữ không có trong bản thảo. Phần lớn các trường hợp không khớp chính xác đến từ lỗi định dạng ký tự toán học, phân cột hoặc lỗi chuyển đổi của thư viện trích xuất PDF (paraphrase ngoài ý muốn), chứ không phải do mô hình bị ảo giác — phân tích chi tiết theo phân hội ở mục 5.6.5 sẽ làm rõ hơn nguyên nhân này.

**Điểm cần lưu ý cho phản biện viên (Attention Points — B2):**

- Tổng số điểm lưu ý (Attention Points): **4.166** (trung bình 3,8 điểm/bài báo).
- Tỷ lệ trung thực (T-Rate): **69,86%**.
- Tỷ lệ trùng lặp với nhận xét thực tế của phản biện viên (C-Rate): chỉ **4,49%**.
- Tỷ lệ bổ sung trong số các điểm trung thực (A-Rate): **92,23%**.
- Phân phối theo ma trận 2×2: Trung thực + Trùng lặp 134 điểm (3,22%); **Trung thực + Bổ sung 2.770 điểm (66,49%) — nhóm mang lại giá trị lớn nhất**; Ảo giác + Trùng lặp 8 điểm (0,19%); Ảo giác + Bổ sung 1.254 điểm (30,10% — rủi ro ảo giác cần lưu ý khi thiết kế cảnh báo).

Tỷ lệ trùng lặp rất thấp (4,49%) kết hợp tỷ lệ bổ sung rất cao (92,23% trong số các điểm trung thực) cho thấy AI không lặp lại những gì phản biện viên con người đã thấy, mà đóng vai trò **rà soát điểm mù chuyên môn** — phát hiện các khía cạnh mà phản biện viên có thể bỏ sót. Đây là minh chứng định lượng rõ ràng cho giá trị gia tăng thực sự của workflow này, thay vì chỉ là một bản tóm tắt trùng lặp thông tin.

### 5.6.3. Review Quality Auditor: Chất lượng kiểm toán phản biện

Workflow này quét nội dung phản biện của reviewer để cảnh báo nếu phản biện quá ngắn, thiếu tính xây dựng, hoặc không nhất quán với điểm số.

- Tổng số lượt đánh giá phản biện: **3.567 lượt**.
- Tổng số phát hiện lỗi chất lượng (Findings): **8.461 lỗi** (trung bình 2,37 lỗi/lượt phản biện).
- Tỷ lệ trung thực trung bình (T-Rate): **58,28%**.
- Tỷ lệ hợp lệ theo luật (Validity Rate): **71,04%**.
- Cấu trúc mức độ nghiêm trọng: lỗi ngăn chặn (Blocking) 2.392 lỗi (28,27%); lỗi cảnh báo (Warning) 6.069 lỗi (71,73%).
- Điểm trung thực NLI trung bình: 0,5531 chung; 0,5417 với nhóm Blocking; 0,5576 với nhóm Warning.

T-Rate của workflow này (58,28%) thấp hơn đáng kể so với hai workflow còn lại, phản ánh đúng bản chất bài toán: các lỗi chất lượng phản biện (ví dụ "khuyến nghị không có căn cứ") đòi hỏi suy luận ngữ cảnh rộng, trong khi mô hình NLI dùng để kiểm định chỉ đối sánh trực tiếp văn bản — đóng vai trò một cận dưới khắt khe (conservative lower bound) chứ không phản ánh đầy đủ năng lực suy luận thực tế của workflow. Tỷ lệ hợp lệ theo luật vẫn ở mức khá (71,04%), cho thấy các phát hiện lỗi tuân thủ tốt cấu trúc logic mong muốn của hệ thống dù độ trung thực đo bằng NLI còn hạn chế. Đây là ranh giới rõ ràng nhất của phương pháp NLI truyền thống khi áp dụng cho suy luận ngữ nghĩa phức tạp, và cũng là khoảng trống mà kết quả khảo sát người dùng ở mục 5.7 phản ánh (Reviewer đánh giá đây là mối quan tâm chính về AI).

### 5.6.4. Chair Decision Copilot: Mức độ trung thực hỗ trợ ra quyết định

Workflow này tổng hợp bằng chứng từ toàn bộ phản biện (Evidence Basis) và lập bản đồ điểm đồng thuận/bất đồng (Disagreement Map) để hỗ trợ Chair ra quyết định — đầu ra có ảnh hưởng trực tiếp nhất đến số phận của một bài báo trong toàn bộ hệ thống, nên đây là workflow được kiểm định nghiêm ngặt nhất.

- Tổng số bài báo được đánh giá: **1.097 bài** (có kèm metareview đối chứng).
- Tổng số bằng chứng/tuyên bố (Claims): **8.243** (Evidence Basis: 3.484; Agreement: 2.539; Disagreement: 2.220).
- **Evidence Basis:** T-Rate **87,34%**; C-Rate **5,27%**; A-Rate **91,63%**.
- **Disagreement Map:** T-Rate **87,11%**; C-Rate **13,82%**.
- **Số bài báo rủi ro cao** (High Risk, T-Rate < 50%): chỉ **14/1.097 bài (1,28%)**.
- Phân phối ma trận 2×2 của các tuyên bố: Trung thực + Trùng lặp 755 (9,16%); **Trung thực + Bổ sung 6.378 (77,37%) — giá trị tổng hợp bằng chứng bổ trợ lớn nhất**; Ảo giác + Trùng lặp 39 (0,47%); Ảo giác + Bổ sung 1.071 (12,99%).

Tỷ lệ trung thực đạt tới **87,34%** trong khi tỷ lệ rủi ro cao chỉ **1,28%**, cho thấy hệ thống vận hành an toàn ở khâu quan trọng nhất. Tỷ lệ trùng lặp với metareview của Chair rất thấp (5,27%) trong khi tỷ lệ bổ sung đạt **91,63%**, phản ánh thực tế rằng Area Chair khi viết metareview thường chỉ tóm tắt các điểm mấu chốt nhất, trong khi AI xây dựng được một hồ sơ bằng chứng đầy đủ và chi tiết hơn nhiều để làm tài liệu đối chiếu — đúng với nguyên tắc thiết kế xuyên suốt của hệ thống: **AI hỗ trợ Chair bằng bằng chứng, không thay thế quyết định của Chair.**

### 5.6.5. Phân tích bất thường theo phân hội (Track-Level Insights)

Khi phân tách kết quả TCA theo từng phân hội, dữ liệu thực nghiệm bộc lộ một số khác biệt cấu trúc đáng chú ý, hữu ích cho việc xác định giới hạn thực sự của hệ thống:

- **Bất thường về độ tin cậy trích dẫn tại UAI 2022:** hầu hết các phân hội đạt tỷ lệ trung thực trích dẫn (B1) rất đồng đều, từ 96,78% đến 98,56%, với tỷ lệ bịa đặt dưới 3%. Riêng UAI 2022 Conference là ngoại lệ rõ rệt: tỷ lệ Grounded giảm còn **89,20%** (Exact Match chỉ 56,29%) và tỷ lệ bịa đặt tăng vọt lên **10,84%**. Nguyên nhân là UAI là hội nghị chuyên sâu về xác suất – thống kê với mật độ công thức toán học rất dày; khi bộ trích xuất PDF chuyển văn bản sang dạng thô, các ký hiệu toán học và phân số thường bị lỗi định dạng hoặc sai thứ tự dòng, khiến mô-đun đối sánh đánh giá nhầm các trích dẫn đúng thành "bịa đặt". Đây là hạn chế của **tầng trích xuất PDF**, không phải do mô hình LLM bị ảo giác.
- **Hiệu quả vượt trội trên các bài báo ngắn:** ICLR 2023 TinyPapers đạt T-Rate của Evidence Basis (phục vụ Chair) cao kỷ lục **96,75%** với **0% rủi ro cao**; MIDL 2023 Short Paper Track đạt T-Rate **93,45%**, cũng **0% rủi ro cao**. Nội dung cô đọng của các bài báo ngắn (giới hạn 2 trang) giúp giảm nhiễu thông tin đầu vào cho Chair Copilot, từ đó tăng độ chính xác tổng hợp.
- **Tỷ lệ bổ sung tuyệt đối tại các track có metareview ngắn:** LOG 2022 và MIDL 2023 Short Paper Track có tỷ lệ trùng lặp với metareview bằng 0,00%, đồng nghĩa tỷ lệ bổ sung đạt 100,00%, do Area Chair tại các track này thường viết metareview rất ngắn (1–2 câu). Điều này càng làm nổi bật vai trò của Chair Copilot ở các hội nghị mà quy trình review truyền thống ít để lại tài liệu chi tiết.
- **Điểm nghẽn về kiểm toán chất lượng tại IEEE ICIST 2024:** phân hội này ghi nhận chỉ số kiểm toán phản biện (B3) rất thấp — T-Rate chỉ 24,17%, Validity 40,77% — so với mức trên 60% ở các phân hội lớn như CoRL hay LOG. Đây là hội nghị quy mô nhỏ hơn với các bài phản biện thường rất ngắn và hành văn không đồng đều; khi dữ liệu đầu vào nghèo nàn, mô-đun Auditor thiếu căn cứ văn bản để xác thực phán đoán. Kết quả này gợi ý một cải tiến cụ thể: **cần áp dụng bộ lọc chất lượng phản biện tối thiểu (ví dụ độ dài, số câu) trước khi kích hoạt mô-đun kiểm toán tự động bằng AI.**

---

## 5.7. Khảo sát mức độ hài lòng người dùng (UAT)

### 5.7.1. Phương pháp và mẫu khảo sát

Sau khi người dùng trải nghiệm trực tiếp hệ thống ở vai trò được phân công, nhóm gửi khảo sát trực tuyến để đo lường mức độ hài lòng, độ dễ sử dụng và niềm tin đối với các tính năng AI. Khảo sát được thiết kế riêng cho từng vai trò (Chủ tọa, Người phản biện, Tác giả), gồm các nhóm câu hỏi: thông tin nền và các chức năng đã trải nghiệm; mức độ hài lòng theo từng khía cạnh trải nghiệm (thang 5 mức); mức độ dễ/khó khi thực hiện các thao tác chính; mức độ hài lòng theo từng chức năng đặc thù của vai trò; mức độ đồng ý với các nhận định về hệ thống, khả năng sử dụng (usability) và niềm tin đối với AI; yếu tố mong muốn cải thiện; điểm chưa thoải mái; mức độ sẵn sàng giới thiệu hệ thống; và phản hồi định tính mở.

Tổng cộng thu được **89 phản hồi hợp lệ** trên ba vai trò:

- **Chủ tọa (Chair):** 6 phản hồi hợp lệ (hoàn thành đến câu hỏi đánh giá tổng quan) trên tổng số 12 lượt truy cập form (tỷ lệ hoàn thành 50%). 5/6 người từng sử dụng một hệ thống nộp bài/phản biện/quản lý hội nghị khác trước đây, cho thấy nhóm này có khả năng so sánh đối chiếu tương đối tốt.
- **Người phản biện (Reviewer):** 7 phản hồi hợp lệ trên tổng số 7 lượt truy cập (tỷ lệ hoàn thành 100%). 4/7 người từng dùng hệ thống tương tự, 3/7 là người dùng mới hoàn toàn.
- **Tác giả (Author):** 76 phản hồi hợp lệ — mẫu lớn nhất và đủ lớn để phân tích xu hướng đáng tin cậy hơn. Đáng chú ý, 54/76 (71%) là người dùng **mới hoàn toàn**, chưa từng dùng hệ thống nộp bài/phản biện/quản lý hội nghị nào khác — ngược hẳn với hai vai trò còn lại. Điều này có ý nghĩa quan trọng: trải nghiệm của Tác giả phản ánh khá sát cảm nhận của người dùng lần đầu, nhóm mục tiêu chính mà hệ thống hướng tới.

Bảng 5.8 tổng hợp các chỉ số hài lòng chính để so sánh nhanh giữa ba vai trò, chi tiết được phân tích ở các mục 5.7.2–5.7.4:

**Bảng 5.8: So sánh mức độ hài lòng giữa ba vai trò**

| Chỉ số | Chủ tọa (n=6) | Người phản biện (n=7) | Tác giả (n=76) |
| :--- | :---: | :---: | :---: |
| Điểm hài lòng tổng thể (/5) | 4,38 | 4,29 | 3,89 |
| Điểm trải nghiệm tổng thể (/5) | 4,00 | 4,14 | 3,42 |
| Điểm dễ thao tác trung bình (/5) | 3,33 | 3,80 | 3,49 |
| Có điểm gây khó chịu | 100% (6/6) | 14% (1/7) | 58% (44/76) |
| Sẵn sàng giới thiệu ("Chắc chắn có" hoặc "Có lẽ có") | 67% (4/6) | 86% (6/7) | 82% (62/76) |

Ba mục tiếp theo (5.7.2–5.7.4) trình bày chi tiết kết quả theo từng vai trò; mục 5.7.5 tổng hợp các phát hiện xuyên vai trò.

### 5.7.2. Vai trò Chủ tọa (Chair)

**a) Chức năng đã trải nghiệm.** Bảng 5.9 cho thấy "Xem gợi ý người phản biện và điểm phù hợp" là chức năng được thử nhiều nhất (6/8 người), phù hợp với vai trò trung tâm của thuật toán đối sánh phản biện đã trình bày ở mục 5.5.

**Bảng 5.9: Các chức năng đã thử — vai trò Chủ tọa (n=6, có thể chọn nhiều mục)**

| Chức năng | Số người đã thử |
| :--- | :---: |
| Xem gợi ý người phản biện và điểm phù hợp | 4 |
| Thiết lập/xem thông tin hội nghị | 3 |
| Quản lý ngày quan trọng, lời mời nộp bài, ban tổ chức | 3 |
| Tạo hội nghị từ template có sẵn | 3 |
| Xem danh sách bài nộp và trạng thái | 3 |
| Kiểm tra thông tin xung đột lợi ích | 4 |
| Theo dõi tổng quan hoạt động hội nghị trên dashboard | 3 |
| Sử dụng/hiểu công cụ AI hỗ trợ phân công, phản biện lại, quyết định | 3 |
| Theo dõi tiến độ phản biện | 3 |

**b) Mức độ hài lòng theo khía cạnh trải nghiệm.** Các khía cạnh được đánh giá cao nhất là mức độ đầy đủ thông tin, độ tin cậy của trạng thái/xác nhận, và thiết kế giao diện (đều 4,25/5).

**Bảng 5.10: Điểm hài lòng trung bình theo khía cạnh — vai trò Chủ tọa (n=6, thang 1–5)**

| Khía cạnh | Điểm TB (/5) |
| :--- | :---: |
| Trải nghiệm tổng thể | 4,00 |
| Tốc độ hoàn thành tác vụ chính | 4,00 |
| Độ rõ ràng của bố cục và điều hướng | 4,12 |
| Độ dễ hiểu của nhãn, nút bấm, thông báo | 4,12 |
| Mức độ đầy đủ của thông tin hiển thị | 4,25 |
| Độ tin cậy của trạng thái/xác nhận/phản hồi | 4,25 |
| Thiết kế giao diện và khả năng đọc thông tin | 4,25 |
| Sự phù hợp với quy trình hội nghị học thuật | 4,00 |

**c) Mức độ dễ/khó khi thao tác.** Ngược lại với mục (b), nhóm điểm về khả năng tự thao tác độc lập lại thấp nhất trong toàn khảo sát Chair: "hoàn thành tác vụ không cần hướng dẫn thêm" chỉ đạt **3,12/5**.

**Bảng 5.11: Mức độ dễ/khó của các thao tác chính — vai trò Chủ tọa (n=6, thang 1=Rất khó đến 5=Rất dễ)**

| Thao tác | Điểm TB (/5) |
| :--- | :---: |
| Tìm đúng màn hình/chức năng cần dùng | 3,50 |
| Hiểu bước tiếp theo cần làm | 3,25 |
| Hoàn thành tác vụ không cần hướng dẫn thêm | 3,12 |
| Nhận biết lỗi, cảnh báo, trường bắt buộc | 3,38 |
| Quay lại hoặc sửa thông tin khi cần | 3,38 |

Đây là nhóm điểm thấp nhất trong toàn bộ khảo sát vai trò Chủ tọa (dao động 3,12–3,50/5), gợi ý rằng **khả năng tự thao tác độc lập mà không cần hướng dẫn thêm** là điểm cần cải thiện ưu tiên cho vai trò này, dù mức hài lòng chung vẫn tích cực.

**d) Mức độ hài lòng tổng thể.** Điểm trung bình đạt **4,38/5** — cao nhất trong ba vai trò khảo sát.

**Bảng 5.12: Phân bố điểm hài lòng tổng thể — vai trò Chủ tọa (n=6)**

| Mức điểm | Số lượng |
| :--- | :---: |
| 5 – Rất hài lòng | 4 |
| 4 – Hài lòng | 3 |
| 3 – Bình thường | 1 |

**e) Hài lòng theo từng chức năng đặc thù.** Nhìn theo chức năng cụ thể, "Theo dõi tiến độ phản biện" và "Xem danh sách bài nộp và trạng thái" nhận được phản hồi tích cực nhất (không có phản hồi "Bình thường" hoặc rất ít), trong khi "Xem gợi ý người phản biện và điểm phù hợp" — chức năng lõi liên quan trực tiếp đến thuật toán ở mục 5.5 — lại có tỷ lệ "Bình thường" cao hơn hẳn (2/8), dù không ai chọn "Không hài lòng".

**Bảng 5.13: Hài lòng theo từng chức năng đặc thù — vai trò Chủ tọa (n=6)**

| Chức năng | Rất hài lòng | Hài lòng | Bình thường |
| :--- | :---: | :---: | :---: |
| Dashboard tổng quan hoạt động hội nghị | 2 | 4 | 2 |
| Thiết lập/xem thông tin hội nghị | 3 | 3 | 2 |
| Quản lý ngày quan trọng, lời mời, ban tổ chức | 3 | 4 | 1 |
| Tạo hội nghị từ template có sẵn | 2 | 5 | 1 |
| Xem danh sách bài nộp và trạng thái | 2 | 5 | 1 |
| Theo dõi tiến độ phản biện | 3 | 5 | 0 |
| Xem gợi ý người phản biện và điểm phù hợp | 0 | 4 | 2 |
| Kiểm tra thông tin xung đột lợi ích | 3 | 4 | 1 |
| Công cụ AI hỗ trợ phân công/phản biện lại/quyết định | 2 | 5 | 1 |

**f) Nhận định về hệ thống, khả năng sử dụng và niềm tin đối với AI.** Nhóm câu hỏi về niềm tin đối với AI có điểm đồng ý cao và đồng đều nhất trong toàn khảo sát Chair, đặc biệt là nhận định "AI hỗ trợ chủ tọa nhưng không thay thế quyết định con người" (5/6 đồng ý hoặc hoàn toàn đồng ý) và "muốn hệ thống hiển thị nguồn/lý do/độ tin cậy cho gợi ý AI" (5/6) — cho thấy người dùng ủng hộ đúng nguyên tắc thiết kế cốt lõi của hệ thống nhưng đồng thời mong muốn tính minh bạch cao hơn. Riêng nhận định "Tôi tin rằng quyết định học thuật cuối cùng vẫn nên do con người kiểm soát" nhận 4/6 đồng ý/hoàn toàn đồng ý và có 1/6 không đồng ý — phản hồi hiếm hoi lệch khỏi xu hướng chung, cần đối chiếu với phản hồi định tính của cùng người dùng để hiểu rõ hơn.

**Bảng 5.14: Mức độ đồng ý với các nhận định về AI — vai trò Chủ tọa (n=6)**

| Nhận định về AI | Hoàn toàn đồng ý | Đồng ý | Trung lập | Không đồng ý |
| :--- | :---: | :---: | :---: | :---: |
| Nhận biết được khi tính năng dùng AI | 4 | 3 | 1 | 0 |
| Gợi ý AI trình bày như hỗ trợ, không phải quyết định cuối | 4 | 3 | 1 | 0 |
| Nền tảng cung cấp đủ lý do/bằng chứng cho gợi ý AI | 4 | 3 | 1 | 0 |
| Kết quả AI giúp giảm thao tác thủ công/tiết kiệm thời gian | 4 | 3 | 1 | 0 |
| Cảnh báo/khuyến nghị AI viết bằng ngôn ngữ dễ hiểu | 4 | 2 | 2 | 0 |
| Thoải mái khi bỏ qua/nghi vấn gợi ý AI | 4 | 3 | 1 | 0 |
| Muốn hệ thống hiển thị nguồn/lý do/độ tin cậy cho gợi ý AI | 4 | 3 | 1 | 0 |
| Tin rằng quyết định học thuật cuối cùng nên do con người kiểm soát | 3 | 3 | 1 | 1 |
| Sẽ tin AI hơn nếu hệ thống cảnh báo rõ khi kết quả chưa chắc chắn | 4 | 3 | 1 | 0 |

Ở nhóm nhận định về hệ thống và khả năng sử dụng nói chung, các nhận định như "Gợi ý người phản biện và điểm phù hợp dễ hiểu" (4 hoàn toàn đồng ý + 3 đồng ý) và "Nền tảng cung cấp đủ bằng chứng để cân nhắc gợi ý reviewer" (4 + 3) đạt tỷ lệ đồng ý cao, trong khi "Dashboard tóm tắt tình hình hội nghị rõ ràng" và "Khu vực thiết lập hội nghị dễ hiểu" có 1/8 không đồng ý — trùng khớp với điểm nghẽn về khả năng tự thao tác đã ghi nhận ở mục (c).

**g) Điều gì sẽ làm Chủ tọa hài lòng hơn.** Yếu tố được mong muốn cải thiện nhiều nhất là "giải thích AI rõ hơn" (4/6 lượt chọn) và "dễ bỏ qua hoặc chỉnh sửa gợi ý AI hơn" (4/6 lượt chọn) — cho thấy mối quan tâm chính không phải ở tốc độ hay giao diện mà ở tính minh bạch của AI.

**Bảng 5.15: Yếu tố mong muốn cải thiện để tăng hài lòng — vai trò Chủ tọa (n=6, chọn nhiều mục)**

| Yếu tố mong muốn | Số lượt chọn |
| :--- | :---: |
| Giải thích AI rõ hơn | 6 |
| Dễ bỏ qua hoặc chỉnh sửa gợi ý AI hơn | 5 |
| Có thêm bằng chứng/nguồn cho gợi ý AI | 4 |
| Ít bước thao tác hơn | 3 |
| Thông báo lỗi dễ hiểu hơn | 3 |
| Trạng thái và xác nhận rõ hơn | 3 |
| Điều hướng rõ hơn | 3 |
| Tốc độ phản hồi nhanh hơn | 3 |
| Giao diện dễ đọc hơn | 2 |

Tính năng hữu ích nhất được nhắc đến nhiều là gợi ý người phản biện (2 lượt), còn lại rải đều ở theo dõi tiến độ phản biện, tạo hội nghị từ template, danh sách bài nộp, AI hỗ trợ quyết định/phản biện lại, tín hiệu xung đột lợi ích và quản lý ban tổ chức (mỗi mục 1 lượt). Ngược lại, tính năng cần cải thiện nhất là **tín hiệu xung đột lợi ích** (2 lượt) — cùng một điểm nghẽn được ghi nhận ở vai trò Tác giả (mục 5.7.4).

**h) Điểm chưa thoải mái.** Toàn bộ 6/6 người được hỏi cho biết **có** điểm khiến họ chưa thoải mái, phần lớn xuất phát từ lo ngại gợi ý AI sai (1 người) và cảm nhận về tính nhạy cảm của việc ra quyết định học thuật (1 người) — phản ánh rõ nét gánh nặng trách nhiệm của vai trò Chair khi phải dựa vào các gợi ý có yếu tố AI trong quyết định cuối cùng.

**Bảng 5.16: Lý do chính gây khó chịu — vai trò Chủ tọa (n=6, mỗi người 1 lý do chính)**

| Lý do | Số lượng |
| :--- | :---: |
| Lo ngại gợi ý AI sai | 2 |
| Đánh giá học thuật là vấn đề nhạy cảm | 1 |
| Không rõ dữ liệu được sử dụng như thế nào | 1 |
| Yêu cầu quá nhiều thông tin cá nhân | 1 |
| AI đưa ra phản hồi quá mạnh hoặc gây áp lực | 1 |
| Quá nhiều trường bắt buộc | 1 |

**i) Sẵn sàng giới thiệu hệ thống.** Đây là vai trò duy nhất xuất hiện phản hồi "Chắc chắn không" (1/8) — cần lưu ý khi đối chiếu với phản hồi định tính, có thể liên quan đến lo ngại AI hoặc tính nhạy cảm của việc ra quyết định học thuật đã nêu ở mục (h).

**Bảng 5.17: Mức độ sẵn sàng giới thiệu hệ thống — vai trò Chủ tọa (n=6)**

| Mức độ | Số lượng |
| :--- | :---: |
| Chắc chắn có | 3 |
| Có lẽ có | 2 |
| Không chắc | 1 |
| Có lẽ không | 1 |
| Chắc chắn không | 1 |

**j) Phản hồi định tính tiêu biểu.**

*Điều hài lòng nhất:*
- "Mình thấy phần theo dõi rebuttal và phản hồi của reviewer khá rõ nên chair dễ xử lý hơn."
- "Cái mình thích là hệ thống giúp mình đỡ bị ngợp khi phải đọc nhiều review dài và khá khác nhau."
- "Mình hài lòng nhất là ConferenceSpace hỗ trợ chair ra quyết định có cơ sở hơn thay vì phải tự tổng hợp mọi thứ bằng tay."

*Điều quan trọng nhất cần cải thiện trước khi dùng thực tế:*
- "Hệ thống nên làm rõ hơn mức độ tin cậy của từng insight để chair biết chỗ nào nên kiểm tra lại."
- "AI phải hiểu đúng trọng số giữa score, confidence và nội dung review thay vì chỉ tóm tắt bề mặt."
- "Trước khi dùng thực tế, ưu tiên số một vẫn là làm AI support cho chair chính xác, minh bạch và dễ kiểm chứng hơn."

**k) Tóm tắt vai trò Chủ tọa.** Mức hài lòng tổng thể cao (4,38/5), cao nhất trong ba vai trò. Điểm nghẽn rõ nhất là khả năng tự thao tác không cần hướng dẫn thêm (3,12/5) và cảm giác chưa hoàn toàn tin tưởng vào các gợi ý AI (xung đột lợi ích, phân công phản biện). Người dùng đánh giá cao việc AI đóng vai trò hỗ trợ ra quyết định chứ không thay thế con người, nhưng đồng thời mong muốn AI minh bạch hơn về bằng chứng, lý do và mức độ tin cậy.

### 5.7.3. Vai trò Người phản biện (Reviewer)

**a) Chức năng đã trải nghiệm.** "Hiểu trách nhiệm từ lời mời và danh sách phân công" là hoạt động phổ biến nhất (5/7), theo sau là các thao tác chấm điểm và sử dụng AI kiểm tra bài phản biện (4/7 mỗi mục) — cho thấy quy trình phản biện cốt lõi đã được người dùng khai thác khá đầy đủ trong thời gian trải nghiệm ngắn (5–10 phút với 5/7 người).

**Bảng 5.18: Các chức năng đã thử — vai trò Người phản biện (n=7, có thể chọn nhiều mục)**

| Chức năng | Số người đã thử |
| :--- | :---: |
| Hiểu trách nhiệm từ lời mời và danh sách phân công | 5 |
| Mở và xem thông tin bài báo được phân công | 4 |
| Nhập điểm theo các tiêu chí đánh giá | 4 |
| Sử dụng/hiểu phần kiểm tra bài phản biện bằng AI | 4 |
| Đọc tóm tắt, metadata và thông tin hỗ trợ phản biện | 3 |
| Chọn khuyến nghị và mức độ tự tin | 2 |
| Nhập phản hồi bằng văn bản | 2 |
| Lưu bản nháp và gửi bài phản biện | 1 |

**b) Mức độ hài lòng theo khía cạnh trải nghiệm.** Điểm số khá đồng đều, cao nhất ở "trải nghiệm tổng thể", "độ rõ ràng của bố cục" và "sự phù hợp với quy trình hội nghị học thuật" (đều 4,14/5); thấp nhất — nhưng vẫn ở mức tích cực — là "độ dễ hiểu của nhãn, nút bấm, thông báo" (3,86/5).

**Bảng 5.19: Điểm hài lòng trung bình theo khía cạnh — vai trò Người phản biện (n=7, thang 1–5)**

| Khía cạnh | Điểm TB (/5) |
| :--- | :---: |
| Trải nghiệm tổng thể | 4,14 |
| Tốc độ hoàn thành tác vụ chính | 4,00 |
| Độ rõ ràng của bố cục và điều hướng | 4,14 |
| Độ dễ hiểu của nhãn, nút bấm, thông báo | 3,86 |
| Mức độ đầy đủ của thông tin hiển thị | 4,14 |
| Độ tin cậy của trạng thái/xác nhận/phản hồi | 4,00 |
| Thiết kế giao diện và khả năng đọc thông tin | 4,14 |
| Sự phù hợp với quy trình hội nghị học thuật | 4,14 |

**c) Mức độ dễ/khó khi thao tác.** Đây là vai trò có điểm dễ sử dụng cao và đồng đều nhất trong ba vai trò khảo sát (tất cả ≥ 3,86/5), cho thấy quy trình phản biện (đọc bài, chấm điểm, viết nhận xét, gửi bài) được thiết kế tương đối trực quan.

**Bảng 5.20: Mức độ dễ/khó của các thao tác chính — vai trò Người phản biện (n=7, thang 1=Rất khó đến 5=Rất dễ)**

| Thao tác | Điểm TB (/5) |
| :--- | :---: |
| Tìm đúng màn hình/chức năng cần dùng | 4,00 |
| Hiểu bước tiếp theo cần làm | 3,86 |
| Hoàn thành tác vụ không cần hướng dẫn thêm | 4,14 |
| Nhận biết lỗi, cảnh báo, trường bắt buộc | 4,00 |
| Quay lại hoặc sửa thông tin khi cần | 4,00 |

**d) Mức độ hài lòng tổng thể.** Điểm trung bình đạt **4,29/5**, đứng thứ hai trong ba vai trò, với toàn bộ phản hồi tập trung ở hai mức cao nhất.

**Bảng 5.21: Phân bố điểm hài lòng tổng thể — vai trò Người phản biện (n=7)**

| Mức điểm | Số lượng |
| :--- | :---: |
| 5 – Rất hài lòng | 2 |
| 4 – Hài lòng | 5 |

**e) Hài lòng theo chức năng đặc thù và niềm tin đối với AI.** Khảo sát Reviewer thu thập 8 câu hỏi hài lòng theo từng chức năng cụ thể (hiểu trách nhiệm phân công, mở/xem bài báo, đọc tóm tắt & metadata, nhập điểm theo tiêu chí, chọn khuyến nghị & độ tự tin, nhập phản hồi văn bản, lưu/gửi bài phản biện, dùng công cụ AI kiểm tra bài phản biện). Do cỡ mẫu nhỏ (n=7), dữ liệu gốc không tách đủ chi tiết theo từng mức (Rất hài lòng/Hài lòng/Bình thường) cho tất cả các dòng, nhưng xu hướng chung là đa số dao động quanh mức Hài lòng/Rất hài lòng, riêng chức năng **kiểm tra bài phản biện bằng AI** có độ phân tán rộng hơn về phía Trung lập — nhất quán với phân tích ở mục (f) dưới đây và với kết quả T-Rate thấp nhất trong ba workflow TCA (mục 5.6.3).

Tương tự, các nhận định về usability (hiểu mục đích màn hình, vị trí thông tin quan trọng, không quá tải, trạng thái/hạn chót rõ, khả năng phục hồi lỗi, ngôn ngữ phù hợp, thoải mái dùng trong dự án thực tế) và về niềm tin AI (9 nhận định, cùng cấu trúc với vai trò Chair) nhìn chung nghiêng về Đồng ý/Hoàn toàn đồng ý, với mức đồng thuận đặc biệt cao ở hai nhận định "muốn hệ thống hiển thị nguồn/lý do/mức độ tin cậy cho gợi ý AI" và "tin rằng quyết định học thuật cuối cùng nên do con người kiểm soát" — lặp lại đúng mô hình đã quan sát ở vai trò Chủ tọa.

**f) Điều gì sẽ làm Người phản biện hài lòng hơn.** Ba yếu tố được chọn nhiều nhất đồng hạng (3/7 lượt mỗi mục): tốc độ phản hồi nhanh hơn, giải thích AI rõ hơn, có thêm bằng chứng/nguồn cho gợi ý AI, và thông báo lỗi dễ hiểu hơn — phản ánh đúng mối lo ngại về hiệu năng và độ tin cậy của tính năng AI kiểm tra bài phản biện.

**Bảng 5.22: Yếu tố mong muốn cải thiện để tăng hài lòng — vai trò Người phản biện (n=7, chọn nhiều mục)**

| Yếu tố mong muốn | Số lượt chọn |
| :--- | :---: |
| Tốc độ phản hồi nhanh hơn | 3 |
| Giải thích AI rõ hơn | 3 |
| Có thêm bằng chứng/nguồn cho gợi ý AI | 3 |
| Thông báo lỗi dễ hiểu hơn | 3 |
| Trạng thái và xác nhận rõ hơn | 2 |
| Điều hướng rõ hơn | 2 |
| Dễ bỏ qua hoặc chỉnh sửa gợi ý AI hơn | 1 |
| Ít bước thao tác hơn | 1 |
| Giao diện dễ đọc hơn | 1 |

Tính năng hữu ích nhất là **AI kiểm tra bài phản biện** (3 lượt), theo sau là biểu mẫu nhập điểm (2 lượt); tính năng cần cải thiện nhất là trang thông tin bài báo (2 lượt), còn lại rải đều ở thảo luận/phản biện lại, gửi bài phản biện, biểu mẫu nhập điểm, AI kiểm tra bài phản biện, và khuyến nghị/mức độ tự tin.

**g) Điểm chưa thoải mái.** Đây là vai trò có tỷ lệ "không có điểm gây khó chịu" cao nhất (6/7).

**Bảng 5.23: Có/không có điểm gây khó chịu — vai trò Người phản biện (n=7)**

| Trả lời | Số lượng |
| :--- | :---: |
| Không | 6 |
| Có | 1 |

**Bảng 5.24: Lý do chính gây khó chịu — vai trò Người phản biện (n=6, một số người vẫn nêu lý do dù chọn "Không" ở câu trước)**

| Lý do | Số lượng |
| :--- | :---: |
| Lo ngại gợi ý AI sai | 2 |
| Không có điều gì gây khó chịu | 2 |
| AI đưa ra phản hồi quá mạnh hoặc gây áp lực | 1 |
| Quá nhiều trường bắt buộc | 1 |

**h) Sẵn sàng giới thiệu hệ thống.**

**Bảng 5.25: Mức độ sẵn sàng giới thiệu hệ thống — vai trò Người phản biện (n=7)**

| Mức độ | Số lượng |
| :--- | :---: |
| Có lẽ có | 4 |
| Chắc chắn có | 2 |
| Chắc chắn không | 1 |

**i) Phản hồi định tính tiêu biểu.** Điều hài lòng nhất: *"Giao diện mượt."* Điều quan trọng nhất cần cải thiện: *"AI bị nghẽn"* — ám chỉ vấn đề hiệu năng/độ trễ của tính năng kiểm tra bài phản biện bằng AI, phù hợp với thời gian xử lý Reviewer đo được ở mục 5.4.1 (51,72–58,33 giây, cao nhất trong ba vai trò AI).

**j) Tóm tắt vai trò Người phản biện.** Mức hài lòng tổng thể cao (4,29/5), đứng thứ hai trong ba vai trò. Đây là vai trò có trải nghiệm thao tác dễ dùng nhất và đồng đều nhất (3,86–4,14/5). Mối quan tâm chính tập trung vào AI kiểm tra bài phản biện: vừa được đánh giá là tính năng hữu ích nhất, vừa là điểm cần cải thiện nhiều nhất (lo ngại gợi ý sai, phản hồi AI đôi khi gây áp lực, tốc độ xử lý) — trùng khớp với chỉ số T-Rate thấp nhất (58,28%) trong ba workflow được đánh giá bằng LLM-as-a-judge ở mục 5.6.3.

### 5.7.4. Vai trò Tác giả (Author)

**a) Chức năng đã trải nghiệm.** Với mẫu 76 phản hồi, hầu hết người dùng đã trải qua toàn bộ luồng nộp bài chính: nhập thông tin bài báo (73/76), tải bản thảo (71/76), tìm hội nghị phù hợp (69/76). Riêng "khai báo xung đột lợi ích" là chức năng ít người thử nhất (14/76) — một phần vì đây thường là bước cuối và không bắt buộc với mọi bài nộp.

**Bảng 5.26: Các chức năng đã thử — vai trò Tác giả (n=76, có thể chọn nhiều mục)**

| Chức năng | Số người đã thử |
| :--- | :---: |
| Nhập thông tin bài báo, tác giả, từ khóa và track | 73 |
| Tải tệp bản thảo hoặc kiểm tra thông tin bản thảo | 71 |
| Tìm hội nghị phù hợp để nộp bài | 69 |
| Xem thông tin tổng quan, lời mời nộp bài, ngày quan trọng, ban tổ chức | 69 |
| Xem lại thông tin trước khi gửi bài | 57 |
| Sử dụng/hiểu tính năng AI tự động điền, gợi ý track, kiểm tra trước | 48 |
| Theo dõi trạng thái bài nộp sau khi gửi | 24 |
| Khai báo xung đột lợi ích | 14 |

**b) Mức độ hài lòng theo khía cạnh trải nghiệm.** Điểm số vai trò Tác giả thấp hơn khoảng 0,4–0,6 điểm so với hai vai trò Chủ tọa và Người phản biện ở hầu hết khía cạnh — hợp lý vì đây là nhóm phần lớn dùng hệ thống lần đầu.

**Bảng 5.27: Điểm hài lòng trung bình theo khía cạnh — vai trò Tác giả (n=76, thang 1–5)**

| Khía cạnh | Điểm TB (/5) |
| :--- | :---: |
| Trải nghiệm tổng thể | 3,42 |
| Tốc độ hoàn thành tác vụ chính | 3,75 |
| Độ rõ ràng của bố cục và điều hướng | 3,55 |
| Độ dễ hiểu của nhãn, nút bấm, thông báo | 3,75 |
| Mức độ đầy đủ của thông tin hiển thị | 3,87 |
| Độ tin cậy của trạng thái/xác nhận/phản hồi | 3,83 |
| Thiết kế giao diện và khả năng đọc thông tin | 3,87 |
| Sự phù hợp với quy trình hội nghị học thuật | 3,51 |

**c) Mức độ dễ/khó khi thao tác.**

**Bảng 5.28: Mức độ dễ/khó của các thao tác chính — vai trò Tác giả (n=76, thang 1=Rất khó đến 5=Rất dễ)**

| Thao tác | Điểm TB (/5) |
| :--- | :---: |
| Tìm đúng màn hình/chức năng cần dùng | 3,68 |
| Hiểu bước tiếp theo cần làm | 3,53 |
| Hoàn thành tác vụ không cần hướng dẫn thêm | 3,36 |
| Nhận biết lỗi, cảnh báo, trường bắt buộc | 3,34 |
| Quay lại hoặc sửa thông tin khi cần | 3,55 |

**d) Mức độ hài lòng tổng thể.** Điểm trung bình đạt **3,89/5**, với 65/76 (86%) người dùng ở mức "Hài lòng" trở lên.

**Bảng 5.29: Phân bố điểm hài lòng tổng thể — vai trò Tác giả (n=76)**

| Mức điểm | Số lượng |
| :--- | :---: |
| 4 – Hài lòng | 65 |
| 3 – Bình thường | 8 |
| 5 – Rất hài lòng | 2 |
| 2 – Không hài lòng | 1 |

**e) Hài lòng theo từng chức năng đặc thù.** Đây là bảng dữ liệu quan trọng nhất của khảo sát Tác giả: điểm hài lòng theo chức năng cho thấy rõ **"Khai báo xung đột lợi ích" là chức năng có điểm thấp nhất toàn khảo sát (3,07/5)**, thấp hơn hẳn các chức năng còn lại (3,32–3,92/5).

**Bảng 5.30: Điểm hài lòng trung bình theo từng chức năng đặc thù — vai trò Tác giả (n=76)**

| Chức năng | Điểm TB (/5) |
| :--- | :---: |
| AI tự động điền / gợi ý track / kiểm tra trước | 3,92 |
| Tải tệp bản thảo / kiểm tra thông tin bản thảo | 3,88 |
| Xem thông tin tổng quan, lời mời, ngày quan trọng, ban tổ chức | 3,84 |
| Theo dõi trạng thái bài nộp sau khi gửi | 3,82 |
| Tìm hội nghị phù hợp để nộp bài | 3,78 |
| Nhập thông tin bài báo, tác giả, từ khóa, track | 3,71 |
| Xem lại thông tin trước khi gửi bài | 3,32 |
| **Khai báo xung đột lợi ích** | **3,07** |

Đi sâu vào phân bố chi tiết của riêng chức năng này (Bảng 5.31), có tới 50/76 phản hồi rơi vào mức "Bình thường" — đây là chức năng **duy nhất** trong toàn khảo sát Tác giả mà đa số phản hồi không rơi vào mức "Hài lòng":

**Bảng 5.31: Phân bố mức hài lòng — Khai báo xung đột lợi ích (n=76)**

| Mức hài lòng | Số lượng |
| :--- | :---: |
| Bình thường | 50 |
| Hài lòng | 14 |
| Không hài lòng | 11 |
| Rất hài lòng | 1 |

Kết quả này khớp với hai điểm dữ liệu khác trong khảo sát: (1) chức năng này được nhắc đến 19 lần là "cần cải thiện nhất" (mục g), và (2) "Đánh giá học thuật là vấn đề nhạy cảm" là lý do gây khó chịu được 20 người chọn (mục h) — cho thấy nguyên nhân có thể không chỉ ở giao diện mà ở **tính nhạy cảm của loại câu hỏi** (tiết lộ xung đột lợi ích, quan hệ cá nhân/nghề nghiệp), một hiện tượng cũng được ghi nhận ở vai trò Chủ tọa (mục 5.7.2g).

**f) Nhận định về hệ thống, khả năng sử dụng và niềm tin đối với AI.** Ở nhóm nhận định về quy trình nộp bài, "Quy trình nộp bài chia bước hợp lý" đạt tỷ lệ đồng ý cao nhất (67/76 hoàn toàn đồng ý + đồng ý), trong khi các nhận định liên quan đến sự chắc chắn/rõ ràng của thông tin ("hiểu rõ thông tin bắt buộc trước khi gửi", "thông báo lưu/gửi/trạng thái rõ ràng", "tự tin bài nộp đã được gửi đúng cách") có tỷ lệ Trung lập cao hơn hẳn (25–29/76).

**Bảng 5.32: Mức độ đồng ý với các nhận định về quy trình nộp bài — vai trò Tác giả (n=76)**

| Nhận định | Hoàn toàn đồng ý | Đồng ý | Trung lập |
| :--- | :---: | :---: | :---: |
| Quy trình nộp bài chia bước hợp lý | 1 | 67 | 8 |
| Hiểu rõ thông tin bắt buộc trước khi gửi | 2 | 45 | 29 |
| Thông báo lưu/gửi/trạng thái rõ ràng | 2 | 49 | 25 |
| Câu hỏi xung đột lợi ích dễ hiểu, không xâm phạm | 0 | 65 | 11 |
| AI dành cho tác giả giảm thao tác thủ công | 3 | 65 | 8 |
| AI giúp phát hiện/tránh lỗi trước khi gửi bài | 5 | 54 | 17 |
| Tự tin bài nộp đã được gửi đúng cách | 0 | 65 | 11 |

Ở nhóm usability, nhận định **"Tôi không bị quá tải bởi lượng thông tin trên màn hình"** là điểm phân cực nhất — tỷ lệ Đồng ý và Trung lập gần như bằng nhau (36/36), cho thấy khoảng một nửa người dùng mới cảm thấy màn hình nộp bài còn khá nhiều thông tin cùng lúc.

**Bảng 5.33: Đánh giá khả năng sử dụng (usability) — vai trò Tác giả (n=75–76)**

| Nhận định | Hoàn toàn đồng ý | Đồng ý | Trung lập |
| :--- | :---: | :---: | :---: |
| Hiểu mục đích từng màn hình chính | 1 | 68 | 7 |
| Thông tin quan trọng ở vị trí dễ thấy | 0 | 65 | 11 |
| **Không bị quá tải thông tin trên màn hình** | 4 | 36 | 36 |
| Trạng thái/hạn chót/hành động cần làm rõ ràng | 1 | 61 | 13 |
| Có thể phục hồi khi nhập sai/chưa chắc bước tiếp theo | 3 | 62 | 11 |
| Ngôn ngữ hệ thống phù hợp người dùng sinh viên | 4 | 61 | 11 |
| Thoải mái dùng trong môn học/dự án nghiên cứu thực tế | 2 | 66 | 8 |

Ở nhóm niềm tin và kỳ vọng đối với AI, nhận định **"Nền tảng cung cấp đủ lý do/bằng chứng cho gợi ý AI"** cũng phân cực rõ rệt (38 Đồng ý so với 34 Trung lập) — tỷ lệ Trung lập cao nhất trong cả nhóm AI, trong khi các nhận định khác như "kết quả AI giảm thao tác thủ công" (67/76 đồng ý) hay "tin quyết định học thuật cuối cùng nên do con người kiểm soát" (71/76 đồng ý) đạt sự đồng thuận rất cao.

**Bảng 5.34: Đánh giá niềm tin và kỳ vọng đối với AI — vai trò Tác giả (n=76)**

| Nhận định về AI | Hoàn toàn đồng ý | Đồng ý | Trung lập |
| :--- | :---: | :---: | :---: |
| Nhận biết được khi tính năng dùng AI | 3 | 62 | 11 |
| Gợi ý AI trình bày như hỗ trợ, không phải quyết định cuối | 0 | 61 | 15 |
| **Nền tảng cung cấp đủ lý do/bằng chứng cho gợi ý AI** | 4 | 38 | 34 |
| Kết quả AI giảm thao tác thủ công/tiết kiệm thời gian | 2 | 67 | 7 |
| Cảnh báo/khuyến nghị AI dễ hiểu | 2 | 63 | 11 |
| Thoải mái khi bỏ qua/nghi vấn gợi ý AI | 2 | 55 | 19 |
| Muốn hệ thống hiển thị nguồn/lý do/độ tin cậy cho gợi ý AI | 1 | 67 | 8 |
| Tin quyết định học thuật cuối cùng nên do con người kiểm soát | 1 | 71 | 4 |
| Sẽ tin AI hơn nếu hệ thống cảnh báo rõ khi chưa chắc chắn | 1 | 65 | 10 |

Giống mô hình quan sát về "quá tải thông tin" ở mục usability, sự phân cực của nhận định về bằng chứng/lý do cho gợi ý AI cho thấy **tính minh bạch/giải thích được của AI (explainability)** là điểm yếu chung xuyên suốt cả ba vai trò, không riêng vai trò nào — điểm này được tổng hợp lại ở mục 5.7.5.

**g) Điều gì sẽ làm Tác giả hài lòng hơn.** "Giải thích AI rõ hơn" (44/76) và "Ít bước thao tác hơn" (38/76) là hai yếu tố được chọn nhiều nhất, vượt xa các yếu tố còn lại.

**Bảng 5.35: Yếu tố mong muốn cải thiện để tăng hài lòng — vai trò Tác giả (n=76, chọn nhiều mục)**

| Yếu tố mong muốn | Số lượt chọn |
| :--- | :---: |
| Giải thích AI rõ hơn | 44 |
| Ít bước thao tác hơn | 38 |
| Có thêm bằng chứng/nguồn cho gợi ý AI | 19 |
| Điều hướng rõ hơn | 18 |
| Thông báo lỗi dễ hiểu hơn | 11 |
| Dễ bỏ qua hoặc chỉnh sửa gợi ý AI hơn | 8 |
| Trạng thái và xác nhận rõ hơn | 8 |
| Giao diện dễ đọc hơn | 8 |
| Tốc độ phản hồi nhanh hơn | 7 |

Xét riêng theo lựa chọn tính năng hữu ích nhất và cần cải thiện nhất (Bảng 5.36), **"AI tự động điền" xuất hiện ở cả hai đầu bảng xếp hạng**: vừa là tính năng hữu ích nhất (47/76 lượt) vừa là tính năng cần cải thiện nhiều nhất (30/76 lượt) — dấu hiệu điển hình của một tính năng có tiềm năng lớn nhưng độ chính xác/độ tin cậy cảm nhận chưa ổn định.

**Bảng 5.36: Tính năng hữu ích nhất và cần cải thiện nhất theo lựa chọn của Tác giả (n=76)**

| Tính năng | Hữu ích nhất | Cần cải thiện nhất |
| :--- | :---: | :---: |
| AI tự động điền | 47 | 30 |
| AI gợi ý track | 11 | 10 |
| AI kiểm tra trước / tín hiệu chất lượng | 9 | 5 |
| Khai báo xung đột lợi ích | 1 | **19** |
| Trang chi tiết hội nghị | — | 5 |
| Xem danh sách hội nghị | 2 | 1 |
| Biểu mẫu nộp bài | 2 | 2 |
| Tải tệp bản thảo | 2 | 1 |
| Lưu bản nháp | 1 | 2 |
| Theo dõi trạng thái bài nộp | 1 | 1 |

**h) Điểm chưa thoải mái.** 44/76 người (58%) cho biết có điểm khiến họ chưa thoải mái — tỷ lệ cao nhất trong ba vai trò. Lý do hàng đầu là lo ngại gợi ý AI sai (32/75, 43%) và tính nhạy cảm của đánh giá học thuật (20/75, 27%), phản ánh trực tiếp vào kết quả ở mục (e) về khai báo xung đột lợi ích.

**Bảng 5.37: Có/không có điểm gây khó chịu — vai trò Tác giả (n=76)**

| Trả lời | Số lượng | Tỷ lệ |
| :--- | :---: | :---: |
| Có | 44 | 58% |
| Không | 32 | 42% |

**Bảng 5.38: Lý do chính gây khó chịu — vai trò Tác giả (n=75)**

| Lý do | Số lượng |
| :--- | :---: |
| Lo ngại gợi ý AI sai | 32 |
| Đánh giá học thuật là vấn đề nhạy cảm | 20 |
| AI đưa ra phản hồi quá mạnh hoặc gây áp lực | 16 |
| Khác | 4 |
| Không có điều gì gây khó chịu | 1 |
| Quá nhiều trường bắt buộc | 1 |
| Yêu cầu quá nhiều thông tin cá nhân | 1 |

**i) Sẵn sàng giới thiệu hệ thống.** 82% (62/76) chọn "Chắc chắn có" hoặc "Có lẽ có" — tỷ lệ tích cực cao dù mẫu này gồm chủ yếu người dùng lần đầu.

**Bảng 5.39: Mức độ sẵn sàng giới thiệu hệ thống — vai trò Tác giả (n=76)**

| Mức độ | Số lượng |
| :--- | :---: |
| Có lẽ có | 41 |
| Chắc chắn có | 21 |
| Không chắc | 13 |
| Chắc chắn không | 1 |

**j) Phản hồi định tính tiêu biểu** (chọn lọc từ 59 phản hồi mở mỗi chiều).

*Điều hài lòng nhất* (chủ đề lặp lại nhiều nhất: AI tự động điền và gợi ý track):
- "Mình thấy track suggestion là một trong những phần hữu ích nhất cho author như mình."
- "Mình thấy hay ở chỗ AI gợi ý track dựa trên nội dung bài chứ không chỉ từ khóa lẻ."
- "Điều mình thấy tốt nhất là AI auto fill giúp quy trình submit đỡ nặng đầu hơn."
- "Mình thấy phần AI auto fill và track suggestion là thứ làm ConferenceSpace khác biệt nhất với mình."

*Điều quan trọng nhất cần cải thiện* (chủ đề lặp lại nhiều nhất: độ chính xác của AI):
- "Mình nghĩ quan trọng nhất là AI auto fill phải chính xác hơn, chứ điền nhanh mà sai thì còn mệt hơn."
- "Cái cần cải thiện nhất là AI đừng đoán quá tự tin khi chưa đọc đúng bài."
- "Theo mình, AI nên gợi ý nhưng phải nói rõ nó đang dựa vào phần nào của bài."
- "Mình nghĩ AI nên biết chỗ nào chắc chắn thì điền, chỗ nào không chắc thì để author tự nhập."
- "Theo mình, hệ thống nên có cách highlight những chỗ AI tự suy đoán để author kiểm tra kỹ hơn."

*Góp ý khác:* "Cần có bot hướng dẫn người mới vì khá nhiều nội dung trong web" — gợi ý bổ sung một trợ lý/chatbot onboarding cho người dùng lần đầu.

**k) Tóm tắt vai trò Tác giả.** Mức hài lòng tổng thể ở mức khá (3,89/5), thấp hơn hai vai trò còn lại nhưng vẫn nghiêng về tích cực — dễ hiểu vì đây là nhóm phần lớn là người dùng mới. Khai báo xung đột lợi ích là điểm nghẽn rõ ràng nhất về mặt định lượng lẫn định tính, có thể do tính nhạy cảm của câu hỏi hơn là do giao diện. AI tự động điền/gợi ý track là "con dao hai lưỡi": được đánh giá là giá trị cốt lõi nhưng đồng thời là nguồn lo ngại lớn nhất về độ chính xác — ưu tiên cải thiện hàng đầu nên là tăng độ chính xác và tính minh bạch (giải thích được) của AI, ví dụ hiển thị mức độ tin cậy, cho phép chỉnh sửa dễ dàng, và làm rõ AI dựa vào phần nào của bài để đưa ra gợi ý.

### 5.7.5. Tổng hợp xuyên vai trò

Ba phát hiện xuất hiện nhất quán ở cả ba vai trò, không phụ thuộc vào chức năng cụ thể:

1. **Khoảng cách về explainability là điểm yếu chung, không riêng vai trò nào.** Ở cả ba khảo sát, nhận định "nền tảng cung cấp đủ lý do/bằng chứng cho gợi ý AI" luôn có tỷ lệ "Trung lập" cao bất thường so với các nhận định AI khác (ví dụ 34/76 ở vai trò Tác giả, gần bằng tỷ lệ đồng ý 38/76; tương tự ở Chủ tọa và Người phản biện dù cỡ mẫu nhỏ hơn). Đây là tín hiệu rõ ràng nhất cho hướng cải thiện ưu tiên: hiển thị căn cứ, mức độ tin cậy và phần văn bản mà AI dựa vào để đưa ra từng gợi ý — đúng với đề xuất "bổ sung cơ chế giải thích" đã được ghi nhận là hướng phát triển ngắn hạn.
2. **Người dùng nhất quán ủng hộ nguyên tắc "AI hỗ trợ, không thay thế".** Ở cả ba vai trò, nhận định "quyết định học thuật cuối cùng nên do con người kiểm soát" đều nhận được tỷ lệ đồng ý rất cao (71/76 ở Tác giả, 6/8 ở Chủ tọa), xác nhận đúng triết lý thiết kế xuyên suốt của ConferenceSpace.
3. **Xung đột lợi ích là điểm nhạy cảm mang tính bản chất, không phải lỗi UX.** Cả khảo sát Chair (thông tin xung đột lợi ích được chọn là tính năng cần cải thiện nhất, 2/8 lượt) lẫn khảo sát Author (điểm hài lòng thấp nhất 3,07/5, 19/76 chọn cần cải thiện nhất) đều cho thấy đây là khu vực có mức độ dè dặt cao nhất, một phần vì bản chất của thông tin (quan hệ cá nhân, tính minh bạch học thuật) chứ không hoàn toàn do cách trình bày trên giao diện.
4. **Mối lo ngại về AI tập trung vào "gợi ý sai" hơn là hiệu năng hay giao diện.** "Lo ngại gợi ý AI sai" là lý do gây khó chịu được chọn nhiều nhất ở cả Chủ tọa (2/8) và Tác giả (32/75, 43%), đồng hạng cao nhất ở Người phản biện (2/6) — cho thấy rào cản chấp nhận AI lớn nhất hiện tại là **độ tin cậy cảm nhận**, không phải trải nghiệm sử dụng nói chung (các chỉ số usability khác đều ở mức khá đến tốt).

---

## 5.8. Tổng kết chương

Kết quả thực nghiệm trong chương này cho thấy một bức tranh nhất quán giữa ba lớp kiến trúc của ConferenceSpace: **lớp nghiệp vụ cốt lõi** đáp ứng tốt yêu cầu hiệu năng ở quy mô 15.000 bài nộp (độ trễ p95 dưới 120 ms, 0% lỗi request), với PostgreSQL là ràng buộc mở rộng chính chứ không phải tầng ứng dụng; **lớp thuật toán** vận hành ở mức micro-giây đến mili-giây, đủ nhanh cho tương tác thời gian thực nhưng vẫn còn khoảng trống về đánh giá chất lượng đề xuất so với quy trình thủ công; và **lớp AI hỗ trợ** đạt độ tin cậy cao trên cả hai phương pháp đánh giá — deterministic (trên 83% ở mọi chỉ số trích xuất) và LLM-as-a-judge (trên 87% trung thực cho Chair Decision Copilot, trên 96% cho tính trung thực trích dẫn) — đồng thời chứng minh được giá trị bổ sung thực sự (Additionality trên 90% ở hầu hết workflow) thay vì chỉ lặp lại thông tin con người đã có.

Khảo sát người dùng thực tế củng cố các kết quả kỹ thuật này: mức hài lòng dao động từ 3,89 đến 4,38/5 tùy vai trò, và những điểm nghẽn mà người dùng cảm nhận (độ tin cậy của Review Quality Auditor, tính minh bạch của Autofill, sự nhạy cảm của khai báo xung đột lợi ích) đều trùng khớp với các giới hạn được phát hiện qua số liệu kỹ thuật ở các mục 5.6 và 5.3. Sự tương đồng giữa dữ liệu định lượng và cảm nhận định tính này là cơ sở đáng tin cậy để Chương 6 tổng hợp kết quả đạt được, nhìn nhận thẳng thắn các hạn chế còn tồn tại và đề xuất hướng phát triển tiếp theo cho hệ thống.

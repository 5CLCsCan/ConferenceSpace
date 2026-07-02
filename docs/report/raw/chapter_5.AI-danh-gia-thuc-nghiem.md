# Chương 5: Đánh giá thực nghiệm và kết quả

## 5.1 Tổng quan về Thử nghiệm (Benchmark Setup)

Để đánh giá tính hiệu quả, độ chính xác và hiệu năng vận hành thực tế của hệ thống **ConferenceSpace**, nhóm nghiên cứu đã xây dựng một bộ công cụ benchmark tự động chạy trên toàn bộ tập dữ liệu mẫu. Thử nghiệm này bao gồm ba lớp chức năng chính của hệ thống: lớp nghiệp vụ cốt lõi, lớp thuật toán (phân công phản biện và phát hiện xung đột lợi ích) và lớp hỗ trợ bằng trí tuệ nhân tạo (AI-assisted modules).

### 5.1.1 Tập dữ liệu thử nghiệm (Datasets)

Tập dữ liệu thử nghiệm được tổng hợp và trích xuất từ dữ liệu thực tế của các hội nghị khoa học quốc tế lớn đã được công bố trên OpenReview và các nền tảng học thuật. Tổng số lượng bài nộp được đưa vào đánh giá là **1.127 bài báo (submissions)** phân bố trên **8 phân hội / hội nghị (conference tracks)** khác nhau. Việc đa dạng hóa các hội nghị từ nhiều lĩnh vực (robotics, học máy, y học, lý thuyết) giúp đánh giá độ ổn định và khả năng thích ứng của hệ thống.

Bảng 5.1 thống kê chi tiết số lượng bài báo và tỷ lệ phân bố của từng phân hội trong tập dữ liệu thử nghiệm:

**Bảng 5.1: Thống kê tập dữ liệu thử nghiệm theo phân hội (Conference Tracks)**

| Phân loại Hội nghị / Track (Conference Track) | Số lượng bài báo nộp (Papers) | Tỷ lệ (%) |
| :--- | :---: | :---: |
| ICLR 2023 TinyPapers | 215 | 19.08% |
| UAI 2022 Conference | 213 | 18.90% |
| CoRL 2023 Conference | 191 | 16.95% |
| CoRL 2022 Conference | 178 | 15.79% |
| MIDL 2023 Conference | 111 | 9.85% |
| LOG 2022 Conference | 82 | 7.28% |
| MIDL 2023 Short_Paper_Track | 77 | 6.83% |
| IEEE ICIST 2024 Conference | 60 | 5.32% |
| **Tổng cộng** | **1127** | **100.00%** |

### 5.1.2 Môi trường thực nghiệm

Quy trình benchmark được thực thi tự động thông qua hệ thống phân phối tác vụ (Dispatcher) và các tác nhân xử lý (Workers) chạy trên môi trường điện toán đám mây Modal. Các mô-đun AI của lớp hỗ trợ sử dụng các mô hình ngôn ngữ lớn (LLM) hiện đại thông qua API để thực hiện trích xuất và phân tích thông tin.

---

## 5.2 Đánh giá Chất lượng của Lớp hỗ trợ AI (AI Quality Evaluation)

Mục tiêu chính của lớp hỗ trợ AI là giảm tải các thao tác thủ công, hỗ trợ người dùng tổng hợp và rà soát thông tin nhanh chóng. Trong phần này, nhóm tập trung đánh giá chất lượng của mô-đun **Tự động điền thông tin (Submission Autofill)** - mô-đun đầu tiên tiếp xúc với tác giả.

Chất lượng của mô-đun được đo lường bằng cách so sánh dữ liệu trích xuất tự động từ file bản thảo (PDF) với dữ liệu gốc được khai báo trên OpenReview (Ground Truth), bao gồm các chỉ số:
- **Tiêu đề khớp chính xác (Title Exact Match):** Tỷ lệ tiêu đề trích xuất khớp hoàn toàn 100% với thực tế sau khi chuẩn hóa văn bản.
- **ROUGE-1 & ROUGE-L (Abstract):** Độ tương đồng từ vựng (unigram) và chuỗi con chung dài nhất giữa tóm tắt trích xuất và tóm tắt gốc.
- **F1-Score Từ khóa (Keyword F1) & Tác giả (Author F1):** Độ chính xác và độ phủ trong việc trích xuất danh sách tác giả và các từ khóa chính.

### 5.2.1 Kết quả chất lượng tổng thể

Bảng 5.2 trình bày các chỉ số thống kê mô tả về chất lượng trích xuất trên toàn bộ 1.127 bài báo:

**Bảng 5.2: Thống kê chất lượng trích xuất thông tin tổng thể**

| Chỉ số đánh giá chất lượng (Metric) | Trung bình (Mean) | Độ lệch chuẩn (Std) | Tối thiểu (Min) | Trung vị (Median) | Tối đa (Max) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tiêu đề khớp chính xác (Title Exact Match) | 0.9122 | 0.2832 | 0.0000 | 1.0000 | 1.0000 |
| Tóm tắt ROUGE-1 (Abstract ROUGE-1) | 0.8364 | 0.1433 | 0.0364 | 0.8549 | 1.0000 |
| Tóm tắt ROUGE-L (Abstract ROUGE-L) | 0.8325 | 0.1504 | 0.0364 | 0.8542 | 1.0000 |
| Từ khóa F1 (Keyword F1) | 0.9277 | 0.1894 | 0.0000 | 1.0000 | 1.0000 |
| Tác giả F1 (Author F1) | 0.8349 | 0.2726 | 0.0000 | 1.0000 | 1.0000 |

Kết quả tổng thể cho thấy hệ thống đạt chất lượng trích xuất rất cao. Tỷ lệ tiêu đề khớp tuyệt đối đạt **91.22%**, và chỉ số ROUGE-1/ROUGE-L cho tóm tắt đạt trên **83%**. F1-score của từ khóa và tác giả đạt lần lượt **92.77%** và **83.49%**, chứng minh khả năng thay thế hiệu quả việc nhập liệu thủ công của tác giả.

### 5.2.2 Phân tích chất lượng theo phân hội (Tracks)

Chất lượng trích xuất phụ thuộc khá nhiều vào định dạng bài báo và cấu trúc đặc thù của từng hội nghị. Bảng 5.3 thể hiện chi tiết chất lượng trích xuất trung bình theo từng track:

**Bảng 5.3: So sánh chất lượng trích xuất trung bình giữa các phân hội**

| Hội nghị / Track | Tiêu đề khớp (%) | ROUGE-1 Abstract | ROUGE-L Abstract | Từ khóa F1 | Tác giả F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| CoRL 2022 Conference | 88.76% | 0.9286 | 0.9263 | 0.8759 | 0.8860 |
| CoRL 2023 Conference | 98.43% | 0.9531 | 0.9523 | 0.8792 | 0.8900 |
| ICLR 2023 TinyPapers | 87.91% | 0.7346 | 0.7284 | 0.9849 | 0.8793 |
| IEEE ICIST 2024 Conference | 81.67% | 0.8101 | 0.8037 | 1.0000 | 0.8293 |
| LOG 2022 Conference | 92.68% | 0.7462 | 0.7381 | 0.9549 | 0.8217 |
| MIDL 2023 Conference | 90.99% | 0.8201 | 0.8183 | 0.8631 | 0.6771 |
| MIDL 2023 Short_Paper_Track | 93.51% | 0.7992 | 0.7962 | 0.9139 | 0.8113 |
| UAI 2022 Conference | 91.55% | 0.8215 | 0.8167 | 0.9645 | 0.7956 |

*Nhận xét quan trọng:*
- Các hội nghị robotics như CoRL 2023 đạt kết quả cực kỳ ấn tượng với **98.43%** khớp tiêu đề và hơn **95%** ROUGE cho phần tóm tắt. Điều này phản ánh sự đồng bộ cao trong định dạng PDF của hội nghị này.
- Hội nghị y khoa MIDL 2023 có tỷ lệ trích xuất tác giả F1 thấp nhất (**67.71%**), nguyên nhân chủ yếu do các bài báo y khoa thường có số lượng tác giả lớn, ký hiệu liên kết (affiliations) phức tạp và cách trình bày thông tin liên hệ phi chuẩn trên trang đầu.
- ICLR TinyPapers có điểm ROUGE tóm tắt thấp hơn các track khác (~73%), điều này xuất phát từ bản chất các bài viết TinyPapers rất ngắn, phần tóm tắt thường được gộp chung hoặc định dạng phi truyền thống làm ảnh hưởng đến thuật toán phân tách ranh giới tóm tắt.

---

## 5.3 Đánh giá Hiệu năng Hệ thống và Tài nguyên (Latency & Resource Usage)

Bên cạnh độ chính xác, hiệu năng vận hành và chi phí tài nguyên là yếu tố quyết định khả năng triển khai thực tế của ConferenceSpace. Nhóm đã tiến hành đo lường thời gian thực thi (Latency) và lượng token tiêu thụ (Token Consumption) của các tác vụ LLM.

### 5.3.1 Thời gian thực thi (Latency)

Trong mô hình benchmark, các tiến trình xử lý vai trò của Author (Autofill), Reviewer (tóm lược bài nộp và rà soát chất lượng phản biện) và Chair (hỗ trợ tổng hợp ra quyết định) được chạy song song. Bảng 5.4 thống kê thời gian thực thi trung bình:

**Bảng 5.4: Thống kê thời gian xử lý của các vai trò trong hệ thống**

| Vai trò / Luồng xử lý (Role / Process Latency) | Trung bình (s) | Độ lệch chuẩn (s) | Tối thiểu (s) | Trung vị (s) | Tối đa (s) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tổng thời gian thực thi (Wall-clock Time) | 69.85 | 20.99 | 44.83 | 64.75 | 280.98 |
| Tổng thời gian LLM Inference (Total Inference Time) | 121.96 | 26.32 | 64.03 | 120.91 | 292.43 |
| Thời gian xử lý vai trò Author (Autofill) | 10.64 | 6.80 | 3.96 | 9.32 | 102.20 |
| Thời gian xử lý vai trò Chair (Decision Support) | 21.68 | 6.01 | 12.81 | 20.59 | 116.74 |
| Thời gian xử lý vai trò Reviewer tối đa (Max Reviewer Latency) | 58.33 | 12.81 | 37.54 | 55.46 | 166.46 |
| Thời gian xử lý vai trò Reviewer tối thiểu (Min Reviewer Latency) | 51.72 | 10.66 | 31.79 | 49.82 | 135.43 |

*Phân tích kết quả:*
- Thời gian chạy thực tế trung bình (Wall-clock Time) cho một chu trình benchmark đầy đủ của một bài nộp là **69.85 giây**. Tổng thời gian gọi LLM (Inference Time) là **121.96 giây**. Sự chênh lệch này cho thấy hiệu quả của việc song song hóa các tiến trình (gọi đồng thời các tác vụ trích xuất, tóm tắt và audit chất lượng phản biện trên Worker).
- Vai trò tác giả (Autofill) phản hồi rất nhanh, trung bình chỉ mất **10.64 giây**, giúp đảm bảo trải nghiệm người dùng mượt mà khi nộp bài trực tuyến.
- Vai trò Reviewer yêu cầu thời gian xử lý lâu nhất (trung bình từ **51.72 đến 58.33 giây**) do tiến trình này bao gồm việc tóm tắt toàn bộ bài viết dài và thực hiện audit chất lượng của nhiều bài phản biện song song.

### 5.3.2 Lượng Token tiêu thụ (Token Consumption)

Lượng token tiêu thụ ảnh hưởng trực tiếp đến chi phí vận hành hệ thống. Bảng 5.5 liệt kê thống kê token chi tiết (đã áp dụng hệ số tối ưu hóa prompt caching 60% theo thực tế vận hành):

**Bảng 5.5: Thống kê lượng token tiêu thụ theo vai trò**

| Luồng dữ liệu / Vai trò (Token Usage by Role) | Trung bình (Tokens) | Độ lệch chuẩn (Tokens) | Tối thiểu (Tokens) | Trung vị (Tokens) | Tối đa (Tokens) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tokens đầu vào (Input Tokens) - Tổng | 22849.9 | 4778.5 | 10812.0 | 23414.0 | 36293.0 |
| Tokens đầu ra (Output Tokens) - Tổng | 5631.9 | 837.0 | 2901.0 | 5753.0 | 8093.0 |
| Tổng Tokens (Total Tokens) - Tổng | 28481.8 | 5544.3 | 14509.0 | 29256.0 | 44386.0 |
| Tổng Tokens vai trò Author | 2457.0 | 222.9 | 1843.0 | 2436.0 | 3899.0 |
| Tổng Tokens vai trò Chair | 3746.0 | 691.7 | 2452.0 | 3735.0 | 6722.0 |
| Tổng Tokens vai trò Reviewer tối đa | 11834.4 | 1234.3 | 7511.0 | 11947.0 | 17185.0 |
| Tổng Tokens vai trò Reviewer tối thiểu | 11473.8 | 1173.5 | 7337.0 | 11562.0 | 17074.0 |

Tổng số lượng token tiêu tốn trung bình cho một bài nộp là khoảng **28.481 tokens** (bao gồm 22.849 input tokens và 5.631 output tokens). Chi phí lớn nhất thuộc về vai trò Reviewer (gần 12.000 tokens) vì mô-đun tóm tắt bài báo cần đọc toàn bộ nội dung bản thảo khoa học làm ngữ cảnh đầu vào.

---

## 5.4 Đánh giá Lớp nghiệp vụ và Thuật toán (Algorithm Layer Evaluation)

Lớp thuật toán của ConferenceSpace hoạt động hoàn toàn độc lập với các dịch vụ AI bên ngoài để đảm bảo tính minh bạch, tốc độ và khả năng kiểm chứng. Nhóm đã thực nghiệm hai chức năng cốt lõi: phân công phản biện tự động và phát hiện xung đột lợi ích (COI) đa tầng.

### 5.4.1 Thuật toán đối sánh phản biện (Greedy Matching & Jaccard Similarity)

Thuật toán sử dụng chỉ số **Domain Jaccard Similarity** để tính toán độ tương đồng chuyên môn giữa danh sách phản biện viên và chủ đề bài nộp, kết hợp thuật toán gán tham lam (Greedy) xét các ràng buộc cân bằng tải (số lượng bài phản biện tối đa/tối thiểu cho mỗi reviewer).

*(Dữ liệu thực nghiệm bổ sung do người dùng cung cấp sẽ được đưa vào phần này. Ví dụ: Tốc độ chạy thuật toán so với phân công thủ công, độ phủ và độ chính xác của đề xuất phân công).*

### 5.4.2 Cơ chế phát hiện xung đột lợi ích (COI) trên Neo4j

Hệ thống tích hợp Neo4j để lưu trữ mạng lưới đồng tác giả trích xuất từ Semantic Scholar. Khi phát hiện xung đột, hệ thống quét đồ thị để tìm các liên kết đồng tác giả trong cửa sổ thời gian cấu hình (ví dụ: đã từng đồng tác giả trong vòng 3 năm qua).

*(Dữ liệu thực nghiệm bổ sung do người dùng cung cấp sẽ được đưa vào phần này. Ví dụ: Số lượng quan hệ COI ẩn phát hiện được mà người dùng không tự khai báo thủ công, độ trễ truy vấn đồ thị Neo4j).*

---

## 5.5 Đánh giá Lớp Nghiệp vụ và LLM-as-a-judge (LLM-as-a-judge & Core Business)

Đối với các tác vụ mang tính chất tự luận phức tạp như tóm tắt bài phản biện (Reviewer Support) hay tổng hợp lý do đề xuất chấp nhận/từ chối bài báo (Chair Decision Support), các chỉ số deterministic không thể phản ánh chính xác chất lượng. Nhóm đã triển khai quy trình đánh giá **LLM-as-a-judge** với các tiêu chí đánh giá nghiêm ngặt.

### 5.5.1 Đánh giá mức độ trung thực của trợ lý Chair (Chair Decision Support Alignment)

Mô-đun hỗ trợ Chair được đánh giá thông qua mức độ đồng thuận giữa khuyến nghị của trợ lý AI (được trích xuất từ `suggested_chair_note`) và quyết định cuối cùng của ban tổ chức (Ground Truth decision từ dataset).

*(Dữ liệu thực nghiệm bổ sung do người dùng cung cấp về độ đồng thuận, tỷ lệ chấp nhận/từ chối dự đoán đúng, hoặc điểm đánh giá chất lượng tóm tắt lập luận sẽ được đưa vào phần này).*

### 5.5.2 Đánh giá chất lượng audit phản biện (Review Quality Audit Benchmarks)

Mô-đun audit chất lượng phản biện quét các phản biện để cảnh báo nếu phản biện quá ngắn, thiếu tính xây dựng, hoặc không nhất quán với điểm số.

*(Dữ liệu thực nghiệm bổ sung do người dùng cung cấp về tỷ lệ phát hiện đánh giá kém chất lượng, độ chính xác của cảnh báo sẽ được bổ sung vào đây).*

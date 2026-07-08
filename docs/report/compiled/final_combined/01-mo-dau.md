# Chương 1. Mở đầu

## 1.1. Đặt vấn đề

Số lượng bài báo gửi đến các hội nghị khoa học lớn đã tăng đáng kể trong thập kỷ qua. Trong lĩnh vực trí tuệ nhân tạo, một nghiên cứu trên 87.137 bài báo tại 11 hội nghị hàng đầu giai đoạn 2014–2023 ghi nhận xu hướng tăng nhất quán về số bài được công bố và số tác giả tham gia [1]. Riêng NeurIPS nhận 21.575 bản thảo hợp lệ trong năm 2025 và phải huy động hơn 21.000 phản biện kỹ thuật cùng gần 2.000 Area Chair [2]. Quy mô này làm gia tăng áp lực ở nhiều công đoạn: kiểm tra bài nộp, lựa chọn phản biện phù hợp, phát hiện xung đột lợi ích, theo dõi chất lượng phản biện và tổng hợp thông tin trước khi ra quyết định.

Các công cụ trí tuệ nhân tạo, đặc biệt là mô hình ngôn ngữ lớn, mở ra khả năng hỗ trợ một số công đoạn có khối lượng thông tin lớn. Một thử nghiệm ngẫu nhiên trên hơn 20.000 bản phản biện tại ICLR 2025 cho thấy phản hồi do AI tạo có thể giúp người phản biện làm cho nhận xét cụ thể và có tính hành động hơn; nhóm nhận phản hồi cũng tham gia trao đổi trong giai đoạn rebuttal tích cực hơn [3]. Tuy nhiên, kết quả này phản ánh hiệu quả của một cơ chế hỗ trợ được thiết kế và kiểm soát trong một bối cảnh cụ thể, không đồng nghĩa AI có thể thay thế hoạt động đánh giá học thuật.

Việc đưa AI vào quy trình phản biện còn đặt ra các vấn đề về bảo mật bản thảo chưa công bố, độ tin cậy của nội dung sinh ra và trách nhiệm đối với quyết định cuối cùng. Khảo sát của *Nature* với gần 5.000 nhà nghiên cứu cho thấy cộng đồng có quan điểm phân hóa về việc sử dụng AI trong viết và phản biện khoa học [4]. Nếu AI trực tiếp tạo nhận định hoặc chi phối quyết định mà thiếu cơ chế kiểm tra, hệ thống có thể làm tăng rủi ro thay vì giảm tải cho người dùng. Vì vậy, bài toán trọng tâm không chỉ là bổ sung AI, mà là xác định công đoạn nào nên được xử lý bằng nghiệp vụ ổn định, công đoạn nào cần thuật toán có thể kiểm chứng, và công đoạn nào phù hợp để AI hỗ trợ dưới sự kiểm soát của con người.

Các nền tảng như EasyChair, HotCRP, Microsoft CMT và OpenReview đã hỗ trợ hiệu quả những nghiệp vụ nền tảng của hội nghị, gồm tiếp nhận bản thảo, phân công phản biện, thu thập đánh giá và quản lý quyết định [5][6][7][8]. Tuy nhiên, các khả năng hỗ trợ nhập liệu, kiểm tra bản thảo, đọc hiểu và tổng hợp thông tin bằng AI chưa được tổ chức thành một quy trình thống nhất với ranh giới trách nhiệm rõ ràng giữa nghiệp vụ, thuật toán và AI. Khoảng trống này sẽ được khảo sát và đối chiếu chi tiết ở Chương 2.

Từ bối cảnh trên, nhóm xây dựng **ConferenceSpace**, một nền tảng web hiện thực các nghiệp vụ cần thiết cho vòng đời xét duyệt bài báo và làm môi trường đánh giá cách tích hợp AI có kiểm soát. Hệ thống được tổ chức theo ba lớp: nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ. Cách tổ chức này nhằm duy trì khả năng vận hành khi dịch vụ AI không khả dụng, tạo điều kiện kiểm tra các kết quả thuật toán, đồng thời bảo đảm quyết định học thuật cuối cùng vẫn thuộc về người có thẩm quyền.

## 1.2. Mục tiêu đề tài

Mục tiêu tổng quát của đề tài là xây dựng và đánh giá nền tảng ConferenceSpace phục vụ quy trình xét duyệt bài báo tại hội nghị khoa học, qua đó khảo sát tính khả thi, giá trị hỗ trợ và giới hạn của cách tích hợp AI trong một hệ thống giữ quyền quyết định học thuật cho con người.

Các mục tiêu cụ thể gồm:

- **Hiện thực quy trình nghiệp vụ cốt lõi** cho vòng đời xét duyệt bài báo, từ cấu hình hội nghị, nộp bài, phân công phản biện, thu thập đánh giá, rebuttal đến ra quyết định.
- **Tổ chức hệ thống theo ba lớp trách nhiệm** gồm nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ, qua đó làm rõ loại tác vụ và cơ chế kiểm soát phù hợp với từng lớp.
- **Xây dựng các cơ chế có thể kiểm chứng** cho đối sánh phản biện và phát hiện xung đột lợi ích, trong đó kết quả được trình bày dưới dạng đề xuất hoặc bằng chứng để Chair xem xét.
- **Tích hợp các workflow AI có kiểm soát** nhằm hỗ trợ nhập liệu, kiểm tra bản thảo, đọc hiểu và tổng hợp thông tin. Đầu ra AI phải cho phép người dùng xem lại, chỉnh sửa hoặc bỏ qua và không được tự quyết định việc chấp nhận hay từ chối bài báo.
- **Đánh giá hệ thống bằng nhiều nhóm bằng chứng**, gồm hiệu năng nghiệp vụ, chất lượng và khả năng mở rộng của thuật toán xác định, kết quả theo từng workflow AI, tính khả thi vận hành và phản hồi của người dùng. Kết quả đánh giá được dùng để xác định mục tiêu nào đã đạt, đạt một phần hoặc còn hạn chế.

Đóng góp của đề tài vì vậy nằm ở việc hiện thực và đánh giá một hệ thống tích hợp theo ranh giới trên, không phải ở việc thay thế các nền tảng quản lý hội nghị đã vận hành lâu năm hoặc tự động hóa quyết định học thuật.

## 1.3. Phạm vi đề tài

Đề tài tập trung vào quy trình xét duyệt bài báo tại hội nghị khoa học. Ba vai trò nghiệp vụ chính là **Tác giả**, **Người phản biện** và **Chủ tọa/Đồng chủ tọa**; vai trò **Quản trị viên** hỗ trợ vận hành và quản lý hệ thống.

**Phạm vi bao gồm:**

- Quy trình quản lý hội nghị liên quan trực tiếp đến xét duyệt bài báo: cấu hình hội nghị và track, nộp bài, phân công phản biện, khai báo và kiểm tra xung đột lợi ích, thu thập đánh giá, rebuttal, thảo luận và ra quyết định.
- Cơ chế đối sánh phản biện – bài báo dựa trên thông tin chuyên môn, tải công việc và các ràng buộc nghiệp vụ; kết quả là danh sách đề xuất để Chair xem xét.
- Cơ chế phát hiện xung đột lợi ích từ nhiều nguồn bằng chứng, gồm quan hệ trực tiếp trong hệ thống, khai báo thủ công và quan hệ đồng tác giả khi dữ liệu cho phép.
- Sáu workflow AI hỗ trợ: Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot và Chatbot Agent. Mỗi workflow phục vụ một công đoạn cụ thể và có điểm kiểm tra hoặc xác nhận của người dùng.
- Đánh giá hệ thống ở quy mô thử nghiệm thông qua benchmark kỹ thuật, benchmark theo thành phần và khảo sát người dùng sau sử dụng.

**Phạm vi không bao gồm:**

- Quản lý sự kiện hội nghị theo nghĩa rộng như bán vé, đăng ký tham dự, xếp lịch phòng, tổ chức chương trình và xuất bản kỷ yếu.
- Tự động đưa ra quyết định chấp nhận hoặc từ chối bài báo. Các luật nghiệp vụ xác định có thể ngăn một thao tác không hợp lệ, nhưng nhận định học thuật và quyết định cuối cùng vẫn thuộc về người có thẩm quyền.
- Bảo đảm phát hiện đầy đủ mọi xung đột lợi ích. Độ phủ của cơ chế này phụ thuộc vào dữ liệu khai báo và dữ liệu quan hệ học thuật từ nguồn bên ngoài.
- Bảo đảm chất lượng cố định của các workflow AI khi mô hình hoặc dịch vụ bên ngoài thay đổi. Đề tài đánh giá các workflow trong cấu hình và tập dữ liệu thử nghiệm được mô tả tại Chương 4.
- Đánh giá tác động dài hạn của AI đối với văn hóa phản biện, hành vi của cộng đồng học thuật hoặc thiên vị mô hình. Khảo sát người dùng trong đề tài chỉ phản ánh trải nghiệm trong phạm vi và thời gian thử nghiệm.

Các giới hạn trên xác định mức kết luận mà đề tài có thể đưa ra: báo cáo đánh giá khả năng vận hành và giá trị hỗ trợ của ConferenceSpace trong điều kiện thử nghiệm, không khái quát kết quả thành hiệu quả dài hạn cho mọi hội nghị hoặc mọi lĩnh vực khoa học.

## 1.4. Cấu trúc luận văn

Báo cáo được tổ chức thành năm chương theo mạch từ xác định vấn đề và nhu cầu đến xây dựng, đánh giá và tổng kết hệ thống:

- **Chương 1 – Mở đầu:** trình bày bối cảnh, vấn đề, mục tiêu, phạm vi đề tài và cấu trúc luận văn.
- **Chương 2 – Khảo sát nhu cầu, hiện trạng và khoảng trống nghiên cứu:** phân tích nhu cầu của các nhóm người dùng, khảo sát những hệ thống liên quan, xác định khoảng trống thực tiễn và tổng hợp yêu cầu làm cơ sở cho thiết kế.
- **Chương 3 – Xây dựng hệ thống:** trình bày use case, kiến trúc, thiết kế dữ liệu, cơ chế nghiệp vụ, thuật toán xác định, các workflow AI và môi trường triển khai.
- **Chương 4 – Đánh giá thực nghiệm:** mô tả câu hỏi đánh giá, dữ liệu và phương pháp thực nghiệm; sau đó phân tích lớp nghiệp vụ cốt lõi, thuật toán xác định, từng workflow AI, tính khả thi vận hành và phản hồi người dùng.
- **Chương 5 – Kết luận:** đối chiếu kết quả với mục tiêu của đề tài, tổng hợp các hạn chế được ghi nhận qua đánh giá và đề xuất hướng phát triển.

Mạch lập luận của báo cáo được tổ chức như sau: Chương 1 xác định vấn đề và ranh giới đề tài; Chương 2 chuyển vấn đề thành nhu cầu và yêu cầu hệ thống; Chương 3 hiện thực các yêu cầu đó; Chương 4 kiểm tra mức độ đáp ứng bằng bằng chứng; Chương 5 tổng hợp kết quả và giới hạn. Cấu trúc này giúp mỗi kết luận cuối cùng có thể truy ngược về mục tiêu, thiết kế và kết quả đánh giá tương ứng.

---

## Tài liệu tham khảo

[1] A. Azad and A. Banu, “Publication Trends in Artificial Intelligence Conferences: The Rise of Super Prolific Authors,” *arXiv preprint*, arXiv:2412.07793, 2024. Available: https://arxiv.org/abs/2412.07793

[2] Neural Information Processing Systems Foundation, “NeurIPS 2025 Fact Sheet,” 2025. Available: https://media.neurips.cc/Conferences/NeurIPS2025/press/NeurIPS2025-Fact_Sheet.pdf

[3] N. Thakkar et al., “A Large-Scale Randomized Study of Large Language Model Feedback in Peer Review,” *Nature Machine Intelligence*, 2026. doi: 10.1038/s42256-026-01188-x. Available: https://doi.org/10.1038/s42256-026-01188-x

[4] R. Van Noorden, “Is It OK for AI to Write Science Papers? Nature Survey Shows Researchers Are Split,” *Nature*, May 2025. Available: https://www.nature.com/articles/d41586-025-01463-8

[5] EasyChair, “EasyChair Conference Management.” Available: https://easychair.org/

[6] HotCRP, “HotCRP Conference Review Software.” Available: https://hotcrp.com/

[7] Microsoft Research, “Microsoft Conference Management Toolkit.” Available: https://cmt3.research.microsoft.com/

[8] OpenReview, “OpenReview: Venues.” Available: https://openreview.net/

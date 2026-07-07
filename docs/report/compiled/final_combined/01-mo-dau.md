# Chương 1. Tổng quan và bối cảnh đề tài

## 1.1. Đặt vấn đề

Số lượng bài báo nộp vào các hội nghị khoa học lớn đã tăng với tốc độ đáng kể trong thập kỷ qua. Riêng trong lĩnh vực trí tuệ nhân tạo, nghiên cứu phân tích 87.137 bài báo từ 11 hội nghị AI hàng đầu (2014–2023) cho thấy xu hướng tăng trưởng nhất quán về cả số lượng bài báo được chấp nhận lẫn số lượng tác giả tham gia [1]. Ở hội nghị NeurIPS, số lượng bản thảo nộp tăng từ khoảng 9.467 bài năm 2020 lên 21.575 bài năm 2025 — tức hơn gấp đôi chỉ trong năm năm [2]. Hệ quả trực tiếp là khối lượng công việc dành cho các phản biện (reviewer) và chủ tọa (program chair) tăng theo tỷ lệ tương ứng: hội nghị NeurIPS 2025 phải huy động 20.518 phản biện và 1.663 area chair để xử lý số bản thảo kỷ lục đó [2].

Trong bối cảnh quá tải này, các mô hình ngôn ngữ lớn (LLM) đã nổi lên như một giải pháp tiềm năng. Nghiên cứu đăng trên *Nature Machine Intelligence* (2026) cho thấy AI hỗ trợ đã cải thiện chất lượng, tính xây dựng của phản biện và mức độ tương tác rebuttal tại ICLR 2025 [3]. Thực tế, một cuộc khảo sát với gần 5.000 nhà nghiên cứu do *Nature* thực hiện (2025) cho biết 19% số người được hỏi đã từng dùng LLM để "tăng tốc và giảm tải" công việc phản biện [4]. Tuy nhiên, ứng dụng AI vào khâu peer review không đơn thuần là một bài toán tự động hóa thông thường.

Rào cản lớn nhất không phải là kỹ thuật mà là liêm chính học thuật. Cùng khảo sát 5.000 nhà nghiên cứu của *Nature* (2025) cho thấy hơn 50% người được hỏi phản đối việc dùng AI để viết báo cáo phản biện, với lý do chính là vấn đề bảo mật bản thảo chưa công bố và trách nhiệm học thuật [4][5]. Kết quả phân tích đánh giá tại ICLR 2026 ghi nhận đến 21% bài phản biện được phân loại là do AI tạo hoàn toàn, và hơn một nửa có dấu hiệu sử dụng AI — đây là hồi chuông cảnh báo về nguy cơ mất đi chiều sâu kỹ thuật và tính trách nhiệm trong quy trình xét duyệt [6][7]. Nghiên cứu về các rủi ro tự động hóa phản biện bằng LLM (arXiv, 2025) chỉ rõ ba vấn đề trọng yếu: đầu ra có vẻ thuyết phục nhưng thiếu chiều sâu kỹ thuật, ảnh hưởng tinh vi lên quyết định của phản biện người, và lập luận không thể giải thích khi bị thách thức [8].

Các nền tảng quản lý hội nghị hiện tại — EasyChair, HotCRP, Microsoft CMT và OpenReview — đang đóng vai trò xương sống của phần lớn hội nghị khoa học toàn cầu, nhưng hầu như chưa tích hợp AI hỗ trợ vào nghiệp vụ cốt lõi. Các nền tảng này vận hành tốt ở khâu lưu trữ bản thảo, quản lý deadline và phân công thủ công, song chưa có tính năng thông minh nào cho việc tự động điền thông tin bản thảo, gợi ý track, phát hiện xung đột lợi ích đa tầng, hay tóm lược hỗ trợ phản biện [9][10]. Đây chính là khoảng trống thiết kế mà ConferenceSpace hướng tới lấp đầy.

Từ đó, đề tài không đặt mục tiêu cạnh tranh về độ phủ hay quy mô người dùng với các hệ thống đã vận hành lâu năm. Thay vào đó, nhóm xây dựng **ConferenceSpace** — một nền tảng có đầy đủ nghiệp vụ cốt lõi tương đương OpenReview và CMT — làm môi trường thử nghiệm để chứng minh một hướng tiếp cận cụ thể: AI có thể hỗ trợ quy trình xét duyệt theo cách có trách nhiệm và giải thích được, trong đó mọi quyết định chấp nhận hay từ chối bài báo vẫn luôn thuộc về con người. Đây cũng là hướng mà cộng đồng nghiên cứu đang kêu gọi: "AI có thể là trợ thủ hữu ích trong peer review — nhưng không phải là người thay thế chuyên môn, tư duy phản biện và trách nhiệm giải trình của con người" [11].

## 1.2. Mục tiêu đề tài

Mục tiêu tổng quát của đề tài là xây dựng nền tảng web ConferenceSpace phục vụ toàn bộ vòng đời xét duyệt bài báo, đồng thời chứng minh một mô hình tích hợp AI/LLM vào quy trình học thuật mà vẫn đảm bảo tính minh bạch và trách nhiệm ra quyết định thuộc về con người. Các mục tiêu cụ thể gồm:

- **Xây dựng đầy đủ nghiệp vụ cốt lõi** tương đương các nền tảng tham chiếu: quản lý hội nghị, nộp bài, phân công phản biện, thu thập đánh giá, rebuttal và ra quyết định.
- **Đề xuất ranh giới rõ ràng giữa ba lớp xử lý** — nghiệp vụ, thuật toán xác định (matching, phát hiện COI) và AI hỗ trợ — nhằm trả lời câu hỏi phần nào trong quy trình nên tự động hóa bằng logic có thể giải thích, phần nào phù hợp giao cho AI. Việc dùng thuật toán xác định thay vì LLM cho khâu phân công phản biện phù hợp với khuyến nghị trong nghiên cứu về reviewer assignment: mô hình dựa trên độ tương đồng văn bản có thể kiểm chứng và lý giải được, trong khi LLM tạo ra kết quả không nhất quán ở các nhiệm vụ đòi hỏi tính công bằng cao [12].
- **Thiết kế các mô-đun AI có kiểm soát**, luôn giữ vai trò hỗ trợ (autofill, gợi ý track, kiểm tra sơ bộ bản thảo, tóm lược cho reviewer, rà soát chất lượng phản biện, tổng hợp thông tin cho chair), không thay thế quyết định học thuật cuối cùng của con người — theo đúng nguyên tắc "AI as assistant, not arbiter" được khuyến nghị trong các nghiên cứu gần đây về ứng dụng LLM vào peer review [8][13].
- **Tự động hóa phát hiện xung đột lợi ích** thông qua phân tích đồ thị đồng tác giả, giải quyết một vấn đề mà cộng đồng nghiên cứu đã nhận diện từ lâu là "gần như không thay đổi suốt 70 năm qua trong khoa học máy tính" và cần được tự động hóa khẩn cấp [14].
- **Đánh giá thực nghiệm tính hữu ích và giới hạn của AI** trong bối cảnh học thuật, dựa trên phản hồi thực tế của người dùng đối với mức độ tin tưởng và thoải mái khi AI tham gia vào quy trình đánh giá.

Nói cách khác, đóng góp chính của đề tài không nằm ở việc tạo ra một nền tảng có thị phần, mà ở việc chứng minh bằng sản phẩm và số liệu thực nghiệm rằng AI có thể được tích hợp vào quy trình peer review một cách có trách nhiệm, thay vì bị từ chối hoàn toàn vì lo ngại về liêm chính học thuật.

## 1.3. Phạm vi đề tài

Đề tài tập trung vào quy trình xét duyệt bài báo (peer review) tại các hội nghị khoa học, phục vụ ba vai trò chính: Tác giả, Người phản biện và Chủ tọa/Đồng chủ tọa.

**Phạm vi bao gồm:**

- Hệ thống quản lý hội nghị trực tuyến đầy đủ vòng đời: tạo hội nghị, cấu hình track/deadline, nộp bài, phân công phản biện, thu thập đánh giá, rebuttal và ra quyết định.
- Thuật toán đối sánh phản biện – bài báo dựa trên Domain Jaccard Similarity, hoạt động độc lập với AI/LLM để đảm bảo tính giải thích được. Lựa chọn này xuất phát từ các nghiên cứu về reviewer assignment cho thấy mô hình dựa trên độ tương đồng chủ đề/văn bản có thể kiểm chứng và giải thích được cho chair, trong khi LLM tạo ra kết quả không nhất quán ở các nhiệm vụ đòi hỏi tính công bằng cao [12][15].
- Cơ chế phát hiện xung đột lợi ích (COI) đa tầng: self-author, khai báo thủ công, và phân tích đồ thị đồng tác giả trên Neo4j — bao phủ cả trường hợp COI không được khai báo tự nguyện mà nghiên cứu về hành vi không trung thực trong peer review đã ghi nhận [12][14].
- Sáu mô-đun AI hỗ trợ theo vai trò: Submission Autofill (tự động điền metadata từ bản thảo PDF), gợi ý track, kiểm tra sơ bộ bản thảo (desk rejection), tóm lược hỗ trợ reviewer, rà soát chất lượng phản biện, và hỗ trợ tổng hợp thông tin cho chair. Việc dùng LLM cho các nhiệm vụ tóm lược và trích xuất metadata từ PDF có cơ sở kỹ thuật: nghiên cứu MOLE (2025) cho thấy LLM có thể trích xuất metadata từ bài báo khoa học ở mức đáng tin cậy khi kết hợp bước xác thực đầu ra [16].
- Tích hợp Semantic Scholar để làm giàu hồ sơ học thuật phục vụ matching và phát hiện COI.

**Phạm vi không bao gồm:**

- Quản lý sự kiện hội nghị theo nghĩa rộng: bán vé, đăng ký tham dự, xếp lịch phòng, in kỷ yếu.
- Mọi kết quả AI và thuật toán đều dừng ở mức đề xuất; quyền quyết định cuối cùng (chấp nhận/từ chối bài, xác nhận phân công) luôn thuộc về chair hoặc con người có thẩm quyền — đây là ràng buộc thiết kế bắt buộc để tuân thủ nguyên tắc liêm chính học thuật, không phải một giới hạn kỹ thuật ngẫu nhiên.
- Độ phủ dữ liệu đồ thị đồng tác giả phụ thuộc vào nguồn Semantic Scholar, có thể hạn chế ở một số lĩnh vực chuyên biệt hoặc tác giả ít công bố quốc tế.
- Chất lượng các mô-đun AI phụ thuộc vào mô hình ngôn ngữ bên ngoài (Gemini/OpenRouter), nằm ngoài khả năng kiểm soát trực tiếp của nhóm. Nghiên cứu về LLM metadata extraction (2024) xác nhận LLM "có thể trích xuất metadata rộng rãi nhưng độ chính xác không nhất thiết cao", đây là hạn chế nhóm thừa nhận và cần nêu rõ [17].
- Đề tài không đánh giá tác động dài hạn của AI lên văn hóa phản biện học thuật hay các vấn đề đạo đức sâu hơn như thiên vị mô hình (model bias). Nhóm chỉ đo được phản ứng người dùng trong một đợt UAT ngắn — đây là giới hạn cần nêu rõ vì ngay cả thí nghiệm kiểm soát peer review quy mô lớn của NeurIPS (2014 và 2021) cũng cho thấy 16–23% bài báo có thể nhận kết quả chấp nhận/từ chối khác nhau tùy nhóm phản biện, phản ánh mức độ phức tạp mà một đợt UAT ngắn không thể đo hết [18].

## 1.4. Cấu trúc luận văn

Báo cáo được tổ chức thành năm chương, theo mạch triển khai từ khảo sát nhu cầu đến xây dựng, đánh giá và tổng kết hệ thống.

- **Chương 1 – Mở đầu:** trình bày bối cảnh thực tế và rào cản liêm chính học thuật khi đưa AI vào quy trình xét duyệt, mục tiêu, phạm vi đề tài và cấu trúc tổng thể của luận văn.
- **Chương 2 – Khảo sát nhu cầu:** trình bày khảo sát nhu cầu người dùng theo ba vai trò (mục tiêu, đối tượng, phương pháp, kết quả theo từng tính năng), khảo sát hiện trạng các nền tảng tương tự (EasyChair, HotCRP, CMT, OpenReview) và phân tích khoảng trống nghiên cứu làm cơ sở cho giải pháp và công nghệ được lựa chọn.
- **Chương 3 – Xây dựng hệ thống:** trình bày tổng quan hệ thống, use case theo từng tác nhân, thiết kế kỹ thuật, các cơ chế nghiệp vụ và thuật toán xác định, giải pháp AI theo từng workflow, cùng môi trường triển khai thực tế. Chương này đồng thời giải thích vai trò và lý do lựa chọn các công nghệ chính trong ngữ cảnh thiết kế tương ứng.
- **Chương 4 – Thiết lập thực nghiệm và đánh giá:** trình bày mục tiêu và kịch bản thực nghiệm, đối chiếu kết quả với khảo sát nhu cầu ở Chương 2, đánh giá lớp nghiệp vụ cốt lõi, lớp thuật toán xác định, từng workflow AI và tính khả thi vận hành.
- **Chương 5 – Kết luận:** tổng hợp kết quả đạt được so với mục tiêu đề ra ở Chương 1, nêu rõ các hạn chế bám sát kết quả đánh giá ở Chương 4, và đề xuất hướng phát triển trong tương lai.

Mối liên hệ xuyên suốt các chương là: nhu cầu và khoảng trống được xác định ở Chương 1–2 định hình trực tiếp các quyết định thiết kế ở Chương 3, rồi được kiểm chứng lại bằng dữ liệu thực nghiệm ở Chương 4, trước khi được tổng kết ở Chương 5 — khép kín vòng lặp từ vấn đề đến bằng chứng.

---

## Tài liệu tham khảo

[1] A. Azad and A. Banu, "Publication Trends in Artificial Intelligence Conferences: The Rise of Super Prolific Authors," *arXiv preprint*, arXiv:2412.07793, 2024. Available: https://arxiv.org/html/2412.07793v1

[2] IntuitionLabs, "NeurIPS 2025: A Guide to Key Papers, Trends & Stats," *IntuitionLabs.ai*, updated June 2026. Available: https://intuitionlabs.ai/articles/neurips-2025-conference-summary-trends

[3] J. Zou et al., "AI Improves Review Quality at ICLR 2025," *Nature Machine Intelligence*, 2026. Available: https://www.linkedin.com/posts/james-zou-2123a4133_llm-activity-7432109317237035008-6Zq8

[4] R. Van Noorden, "Is it OK for AI to write science papers? Nature survey shows researchers are split," *Nature*, May 2025. Available: https://www.nature.com/articles/d41586-025-01463-8

[5] AliveLearning, "Nature Survey Reveals What 5000 Researchers Really Think About AI," May 2025. Available: https://www.alivelearn.net/?p=4768

[6] Pangram Labs, "Pangram Predicts 21% of ICLR Reviews are AI-Generated," *Pangram.com*, June 2026. Available: https://www.pangram.com/blog/pangram-predicts-21-of-iclr-reviews-are-ai-generated

[7] HowAIWorks.ai, "ICLR 2026: 21% of Peer Reviews Are AI-Generated," November 2025. Available: https://howaiworks.ai/blog/iclr-2026-ai-generated-peer-reviews-controversy

[8] Anonymous Authors, "Pitfalls of Automating Reviews using Large Language Models," *arXiv preprint*, arXiv:2512.22145, December 2025. Available: https://arxiv.org/html/2512.22145v1

[9] OpenReview, *OpenReview: Venues*. Available: https://openreview.net

[10] HotCRP, *HotCRP – Conference Review Software*. Available: https://hotcrp.com

[11] A. Paul, "Can We Rely on AI for High-Stakes Academic Reviewing?" *LinkedIn post*, 2025. Available: https://www.linkedin.com/posts/anand-paul-911191195_ai-peerreview-researchintegrity-activity-7360147623091097601-Z0tr

[12] N. Shah, "Challenges, Experiments, and Computational Solutions in Peer Review," *Communications of the ACM*, vol. 66, no. 8, August 2023. Available: https://cacm.acm.org/research/challenges-experiments-and-computational-solutions-in-peer-review/

[13] B. Doskaliuk et al., "Artificial Intelligence in Peer Review: Enhancing Efficiency While Preserving Integrity," *PMC/NCBI*, February 2025. Available: https://pmc.ncbi.nlm.nih.gov/articles/PMC11858604/

[14] C. Freire et al., "We Need to Automate the Declaration of Conflicts of Interest," *Communications of the ACM*, September 2020. Available: https://cacm.acm.org/opinion/we-need-to-automate-the-declaration-of-conflicts-of-interest/

[15] J. Kim, Y. Lee, and S. Lee, "Position: The AI Conference Peer Review Crisis Demands Author Feedback and Reviewer Rewards," *arXiv preprint*, arXiv:2505.04966, May 2025. Available: https://arxiv.org/html/2505.04966v1

[16] Z. Alyafeai, M. S. Al-Shaibani, and B. Ghanem, "MOLE: Metadata Extraction and Validation in Scientific Papers Using LLMs," *arXiv preprint*, arXiv:2505.19800, May 2025. Available: https://arxiv.org/abs/2505.19800

[17] Anonymous Authors, "Capabilities and Challenges of LLMs in Metadata Extraction," in *Proc. International Conf.*, ACM Digital Library, December 2024. Available: https://dl.acm.org/doi/10.1007/978-981-96-0865-2_23

[18] C. Cortes and N. Lawrence, "Inconsistency in Conference Peer Review: Revisiting the 2014 NeurIPS Experiment," *arXiv preprint*, arXiv:2109.09774, 2021; also discussed in N. Shah [12] and J. Kim et al. [15].

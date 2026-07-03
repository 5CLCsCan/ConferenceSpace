# Chương 6. Kết luận

---

## 6.1. Kết quả đạt được

Đề tài đã hoàn thành việc xây dựng hệ thống **ConferenceSpace** — một nền tảng web hỗ trợ quy trình xét duyệt bài báo khoa học tại các hội nghị học thuật. So với mục tiêu đề ra ban đầu (Chương 1), hệ thống đã đạt được các kết quả cụ thể trên cả ba lớp kiến trúc: lớp nghiệp vụ cốt lõi, lớp thuật toán, và lớp hỗ trợ AI.

### 6.1.1. Hệ thống quản lý hội nghị toàn diện

ConferenceSpace cung cấp đầy đủ chức năng phục vụ toàn bộ vòng đời xét duyệt bài báo cho ba vai trò chính:

- **Tác giả (Author):** Tìm kiếm hội nghị phù hợp, nộp bài báo với quy trình nhiều bước có hướng dẫn, theo dõi trạng thái bài nộp theo thời gian thực, đọc nhận xét phản biện, gửi phản hồi rebuttal (tổng hợp và theo từng điểm), và nộp bản hoàn chỉnh camera-ready sau khi bài được chấp nhận.

- **Người phản biện (Reviewer):** Nhận và phản hồi lời mời phản biện, xem danh sách bài được phân công, đọc phân tích sơ bộ từ AI, viết nhận xét với phiếu đánh giá chuẩn hóa (bao gồm điểm tiêu chí, mức độ tự tin, khuyến nghị), lưu nháp, đọc và phản hồi rebuttal của tác giả, và tham gia thảo luận nội bộ.

- **Trưởng ban (Chair/Co-Chair):** Tạo và cấu hình hội nghị (wizard sáu bước hoặc từ template), quản lý trạng thái hội nghị qua nhiều giai đoạn (Draft → Open → Reviewing → Decision → Closed), mời phản biện từ trong và ngoài hệ thống, phân công phản biện với hỗ trợ gợi ý AI, kiểm tra xung đột lợi ích, theo dõi tiến độ qua dashboard, quản lý giai đoạn rebuttal, và ra quyết định cuối cùng với hỗ trợ tổng hợp từ AI.

Hệ thống đáp ứng các yêu cầu phi chức năng quan trọng: thời gian phản hồi API trung bình 51,8 ms (p95 ≤ 117,6 ms) với throughput 369–572 request/giây trên dataset 15.000 bài nộp (theo kết quả benchmark k6); bảo mật qua JWT + RBAC tại từng endpoint; giao diện responsive, hỗ trợ dark mode và đa ngôn ngữ (Tiếng Anh, Tiếng Việt); triển khai hoàn chỉnh trên VPS với Docker Compose và HTTPS tự động qua Caddy.

### 6.1.2. Thuật toán đối sánh phản biện và phát hiện xung đột lợi ích

**Gợi ý phản biện tự động:** Hệ thống triển khai thuật toán gợi ý phản biện dựa trên **Domain Jaccard Similarity** — tính toán độ tương đồng giữa lĩnh vực chuyên môn của phản biện (lấy từ hồ sơ Semantic Scholar) và chủ đề bài nộp — kết hợp thuật toán gán tham lam (Greedy Matching) có xét ràng buộc cân bằng tải. Thuật toán hoạt động xác định, không phụ thuộc LLM, có khả năng giải thích kết quả (hiển thị điểm phù hợp và lý do). Kết quả benchmark cho thấy thời gian thực thi ở mức micro-giây đến mili-giây (từ 131 µs với dataset nhỏ đến 56 ms với dataset lớn), phù hợp cho tương tác real-time.

**Phát hiện COI đa tầng:** ConferenceSpace triển khai cơ chế phát hiện xung đột lợi ích ba lớp:
1. **Kiểm tra tự phản biện (Self-Author):** Phát hiện trường hợp phản biện chính là tác giả bài nộp.
2. **Khai báo thủ công (Declared Conflict):** Cho phép người dùng tự khai báo các mối quan hệ xung đột.
3. **Phân tích đồ thị đồng tác giả (Neo4j):** Tự động quét mạng lưới đồng tác giả từ Semantic Scholar, phát hiện cả các mối quan hệ gián tiếp (1–3 bậc) trong cửa sổ thời gian cấu hình được — vượt xa khả năng của phương pháp khai báo thủ công truyền thống.

Thiết kế theo **Composite pattern** cho phép hệ thống hoạt động linh hoạt: hai lớp đầu luôn sẵn sàng, lớp Neo4j tự động bật/tắt tùy thuộc cấu hình (graceful degradation). Thời gian thực thi COI detection ở mức 14,9 µs (dataset nhỏ) đến 653 µs (dataset lớn).

### 6.1.3. Sáu workflow AI phục vụ ba vai trò

Bên cạnh Chatbot (Conference Agent) được trình bày riêng ở mục 6.1.4, hệ thống còn tích hợp sáu workflow AI xử lý trực tiếp trên nội dung bài nộp và phiếu đánh giá, triển khai trên Python AI Service (FastAPI) độc lập, sử dụng Google Gemini 3.1 Flash-Lite thông qua LiteLLM:

| Workflow | Vai trò phục vụ | Kết quả đạt được |
|---|---|---|
| **Submission Autofill** | Author | Trích xuất tự động tiêu đề, tóm tắt, từ khóa, tác giả từ PDF. Đánh giá trên 1.127 bài báo: **91,22%** khớp tiêu đề chính xác, ROUGE-1/ROUGE-L abstract đạt **83,6%/83,3%**, Keyword F1 đạt **92,77%** |
| **Track Recommendation** | Author | Gợi ý track phù hợp dựa trên nội dung bài nộp và danh sách track hội nghị |
| **Submission Gating (Desk Rejection)** | Author/Chair | Kiểm tra tự động định dạng, số trang, section bắt buộc, kết hợp LLM đánh giá sự phù hợp nội dung |
| **Reviewer Initial Analysis** | Reviewer | Tạo briefing tổng quan và chú thích chi tiết từng đoạn (phương pháp luận, điểm mạnh/yếu, câu hỏi gợi ý) — hỗ trợ phản biện chuẩn bị đánh giá |
| **Review Quality Auditor** | Chair | Đánh giá chất lượng và tính nhất quán của phiếu nhận xét trước khi Chair tham khảo |
| **Chair Decision Copilot** | Chair | Tổng hợp toàn bộ nhận xét, rebuttal và thảo luận; đề xuất quyết định có căn cứ |

Kết quả đánh giá hiệu năng AI trên 1.127 bài báo cho thấy: thời gian xử lý trung bình cho Autofill là **10,64 giây**, cho Decision Copilot là **21,68 giây**, và tổng thời gian cho toàn bộ pipeline (song song hóa) là **69,85 giây/bài**. Lượng token tiêu thụ trung bình là **28.481 token/bài** — mức chi phí hợp lý khi sử dụng hạn mức miễn phí của Google Gemini 3.1 Flash-Lite.

### 6.1.4. Chatbot AI và thông báo real-time

- **Conference Agent (Chatbot):** Hỗ trợ 24/7, sử dụng LLM qua OpenRouter kết hợp **Function Calling** để truy vấn dữ liệu hệ thống thực (thông qua AgentQuery Engine ở Go backend). Người dùng có thể hỏi chatbot bằng ngôn ngữ tự nhiên về thông tin hội nghị, trạng thái bài nộp, danh sách phản biện — chatbot tự động chuyển thành truy vấn có cấu trúc và trả kết quả chính xác từ database.

- **Thông báo real-time:** WebSocket hub quản lý kết nối theo email người dùng (hỗ trợ đa tab), đẩy thông báo tức thì khi có sự kiện mới (bài nộp mới, nhận xét hoàn thành, quyết định công bố, lời mời phản biện) — thay thế hoàn toàn cơ chế email-only chậm trễ của các hệ thống truyền thống.

### 6.1.5. Đáp ứng nhu cầu người dùng

Kết quả khảo sát thực nghiệm sau sử dụng (UAT) trên 89 người dùng cho thấy:
- **Điểm hài lòng trung bình của Tác giả:** 3,89/5,00 (86% hài lòng hoặc rất hài lòng).
- **Điểm hài lòng trung bình của Phản biện:** 4,29/5,00 (n=7) — cao hơn đáng kể so với vai trò Tác giả, tuy nhiên cỡ mẫu nhỏ nên kết quả chỉ mang tính tham khảo (xem thêm mục 6.2.1).
- **82% người dùng sẵn sàng giới thiệu hệ thống** cho bạn bè/đồng nghiệp.
- Tính năng AI Autofill được 47/76 tác giả (62%) đánh giá là **tính năng hữu ích nhất**.

Kết quả khảo sát nhu cầu chi tiết trước khi xây dựng hệ thống được trình bày ở mục 2.1; các con số UAT nêu trên là kết quả đo lường sau khi triển khai, dùng để đối chiếu lại với nhu cầu ban đầu.

### 6.1.6. Đóng góp chính của đề tài

Tổng hợp lại, đóng góp chính của đề tài bao gồm:

1. Xây dựng một nền tảng quản lý hội nghị hoàn chỉnh với kiến trúc ba lớp rõ ràng (nghiệp vụ cốt lõi — thuật toán — hỗ trợ AI), phục vụ đầy đủ vòng đời xét duyệt cho cả ba vai trò Author, Reviewer và Chair.
2. Đề xuất và triển khai thuật toán đối sánh phản biện dựa trên Domain Jaccard Similarity kết hợp thuật toán gán tham lam có xét ràng buộc cân bằng tải.
3. Xây dựng cơ chế phát hiện xung đột lợi ích đa tầng, trong đó lớp phân tích đồ thị đồng tác giả trên Neo4j cho phép phát hiện quan hệ gián tiếp (1–3 bậc) mà các hệ thống hiện có (kể cả CMT với DBLP) chưa khai thác đầy đủ.
4. Tích hợp sáu workflow AI phục vụ cả ba vai trò, cùng chatbot hội thoại và cơ chế thông báo real-time qua WebSocket.
5. Cung cấp bộ đánh giá thực nghiệm trên 1.127 bài báo (chất lượng trích xuất AI) và khảo sát 89 người dùng thực tế (UAT), làm cơ sở dữ liệu tham khảo cho các nghiên cứu tiếp theo về ứng dụng AI trong quy trình phản biện học thuật.

---

## 6.2. Các hạn chế

Mặc dù đạt được các kết quả đáng khích lệ, đề tài vẫn tồn tại một số hạn chế cần được nhận diện rõ ràng. Các hạn chế này bám sát kết quả đánh giá thực nghiệm (Chương 5) và phản hồi người dùng (mục 2.1).

### 6.2.1. Hạn chế về dữ liệu và quy mô đánh giá

- **Quy mô khảo sát hạn chế:** Khảo sát UAT chỉ thu được 89 phản hồi (76 tác giả, 7 phản biện, 6 Chair), trong đó nhóm phản biện và Chair có số lượng mẫu quá nhỏ (n=7 và n=6) để đưa ra kết luận có ý nghĩa thống kê. Kết quả đánh giá từ hai nhóm này chỉ mang tính tham khảo định tính.

- **Dữ liệu đồ thị đồng tác giả phụ thuộc Semantic Scholar:** Độ phủ của mạng lưới đồng tác giả phụ thuộc hoàn toàn vào dữ liệu có sẵn trên Semantic Scholar API. Một số lĩnh vực chuyên biệt (y học, khoa học xã hội) có thể không được phủ đầy đủ, dẫn đến khả năng bỏ sót COI trong những lĩnh vực này.

- **Benchmark AI trên dữ liệu sẵn có:** Tập dữ liệu 1.127 bài báo được trích xuất từ OpenReview — đều là các bài đã công bố và có ground truth rõ ràng. Hiệu quả thực tế của hệ thống trên bài nộp mới (chưa từng xuất hiện trong dữ liệu huấn luyện của LLM) có thể khác biệt.

### 6.2.2. Hạn chế về workflow AI

- **Kết quả AI không hoàn toàn nhất quán:** Điểm hài lòng trung bình của tính năng AI ở mức 3,92/5,00 — tốt nhưng chưa xuất sắc. Đặc biệt, AI Autofill đồng thời là tính năng hữu ích nhất **và** cần cải thiện nhất (30/76 tác giả chọn cần cải thiện), phản ánh khoảng cách giữa kỳ vọng cao của người dùng và chất lượng output thực tế. Theo thực nghiệm, trích xuất tác giả có F1 thấp nhất (83,49% trung bình, chỉ 67,71% với bài y khoa MIDL 2023) do định dạng thông tin tác giả phức tạp.

- **Phụ thuộc dịch vụ LLM bên ngoài:** Toàn bộ sáu workflow AI phụ thuộc vào API của Google Gemini 3.1 Flash-Lite (qua LiteLLM). Nếu dịch vụ này thay đổi chính sách miễn phí, tăng giá, hoặc ngừng hoạt động, hệ thống sẽ mất khả năng AI. Mặc dù thiết kế ba lớp cho phép hệ thống vẫn vận hành không có AI, nhưng trải nghiệm người dùng sẽ bị ảnh hưởng đáng kể.

- **Lo ngại của người dùng về AI:** 57,9% người dùng có phần không thoải mái khi AI tham gia vào quy trình học thuật. Lý do chính là lo ngại gợi ý sai (32/76 người), sự nhạy cảm của đánh giá học thuật (20/76), và cảm giác bị áp lực bởi phản hồi AI (16/76). Đây không phải là hiện tượng riêng của ConferenceSpace — các nghiên cứu về AI trong quy trình phản biện học thuật nói chung cũng ghi nhận mức độ dè dặt tương tự từ cộng đồng nghiên cứu. Điều này cho thấy việc tích hợp AI vào quy trình phản biện cần cân nhắc kỹ về cách trình bày kết quả và quyền từ chối/bỏ qua.

- **Bảo mật dữ liệu khi sử dụng dịch vụ LLM bên ngoài:** Toàn bộ nội dung bài báo được gửi đến Google Gemini để xử lý, điều này có thể không phù hợp với các hội nghị có yêu cầu bảo mật nghiêm ngặt, đặc biệt trong các lĩnh vực nhạy cảm hoặc khi bài báo chứa dữ liệu chưa công bố. Mặc dù hệ thống đảm bảo chỉ gửi thông tin cần thiết và không lưu trữ dữ liệu đầu vào trên phía AI service, việc phụ thuộc vào dịch vụ bên thứ ba vẫn tiềm ẩn rủi ro về quyền riêng tư dữ liệu. Kiến trúc tách AI Service thành microservice độc lập (mục 2.3.2, 2.3.3) đã tính đến khả năng thay thế nhà cung cấp LLM, nên hướng giải quyết khả thi là chuyển sang các mô hình mã nguồn mở (như DeepSeek, Llama) triển khai on-premise trong tương lai, đảm bảo dữ liệu không rời khỏi máy chủ của tổ chức.

### 6.2.3. Hạn chế về hệ thống

- **Chưa hỗ trợ bidding:** ConferenceSpace hiện chưa triển khai cơ chế bidding — tính năng cho phép phản biện nêu ưu tiên đánh giá bài nào. Đây là tính năng có giá trị thực tiễn được HotCRP, OpenReview và CMT hỗ trợ, giúp tăng chất lượng phân công phản biện.

- **Rate limit của LLM ảnh hưởng đến khả năng chịu tải:** Hạn mức miễn phí của Gemini 3.1 Flash-Lite là 15 request/phút và 500 request/ngày. Với sáu workflow AI (Submission Autofill, Track Recommendation, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot) cùng gọi API trong ngày, hạn mức 500 request/ngày có thể nhanh chóng cạn kiệt nếu hội nghị nhận số lượng bài nộp lớn hoặc nhiều người dùng kích hoạt workflow AI đồng thời. Trong khi các hội nghị lớn như NeurIPS có thể nhận tới 30.000 bài nộp, ước tính hệ thống hiện tại chỉ phù hợp với hội nghị quy mô vừa và nhỏ (dưới vài trăm bài nộp mỗi kỳ). Để mở rộng quy mô, cần triển khai cơ chế hàng đợi (message queue), xử lý bất đồng bộ các workflow AI, và cân nhắc nâng cấp lên gói trả phí khi cần.

- **Thiếu cơ chế backup dữ liệu tự động:** Hiện tại, backup dữ liệu PostgreSQL và Neo4j được thực hiện thủ công bằng lệnh CLI trên server. Chưa có pipeline backup tự động theo lịch với kiểm tra tính toàn vẹn.

- **Một số phần đánh giá chưa hoàn chỉnh:** Như đã trình bày ở mục 5.4 và 5.5 (Chương 5), các phần đánh giá chi tiết về thuật toán Greedy Matching (độ phủ, chất lượng phân công so với phân công thủ công), chất lượng audit phản biện (LLM-as-a-judge), và mức độ đồng thuận của Decision Copilot chưa có đủ dữ liệu thực nghiệm để kết luận đầy đủ — cần bổ sung ở giai đoạn sau.

---

## 6.3. Hướng phát triển trong tương lai

Dựa trên các hạn chế đã nhận diện và phản hồi từ người dùng, nhóm đề xuất các hướng phát triển sau đây, được chia thành ba nhóm theo mức độ ưu tiên.

### 6.3.1. Cải thiện ngắn hạn (khả thi trong 1–2 tháng)

**a) Nâng cao chất lượng AI Autofill:**
- Cải thiện thuật toán trích xuất danh sách tác giả — xử lý tốt hơn các định dạng phức tạp (nhiều affiliation, ký hiệu đặc biệt, bài y khoa có số lượng tác giả lớn).
- Bổ sung **cơ chế giải thích** (explainability) cho mọi output AI — hiển thị rõ lý do và bằng chứng bên cạnh mỗi gợi ý, giúp người dùng tin tưởng hơn và giảm lo ngại về AI sai.
- Cho phép người dùng **đánh giá chất lượng** output AI (thumbs up/down) để thu thập dữ liệu cải thiện prompt.

**b) Bổ sung cơ chế bidding:**
- Triển khai tính năng bidding cho phản biện, tích hợp vào luồng phân công hiện tại — kết hợp điểm bid của reviewer với điểm Jaccard similarity để tạo ra đề xuất phân công chính xác hơn.

**c) Backup tự động:**
- Thiết lập pipeline backup định kỳ cho PostgreSQL và Neo4j (ví dụ: pg_dump hàng ngày, neo4j-admin backup hàng tuần) với lưu trữ offsite và kiểm tra tính toàn vẹn.

### 6.3.2. Mở rộng trung hạn (3–6 tháng)

Theo xu hướng từ các hội nghị hàng đầu như ICLR 2025 và AAAI-26, AI-assisted review đang được thí điểm và dần trở thành tiêu chuẩn mới. Hướng phát triển của ConferenceSpace sẽ bám sát các bài học thực tiễn từ những thí điểm này, đặc biệt về cách thiết kế AI ở vai trò "hỗ trợ" thay vì "thay thế" — một nguyên tắc đã được định hình từ thiết kế ban đầu của hệ thống.

**a) Giảm phụ thuộc vào dịch vụ LLM bên ngoài và tăng cường bảo mật dữ liệu:**
- Nghiên cứu khả năng sử dụng các mô hình mã nguồn mở (open-weight) như DeepSeek-R1 hoặc Llama cho các workflow chỉ xử lý text (Review Auditor, Decision Copilot) — vừa giảm chi phí và tăng tính tự chủ, vừa giải quyết trực tiếp hạn chế về bảo mật dữ liệu đã nêu ở mục 6.2.2 khi triển khai on-premise.
- Triển khai cơ chế **fallback** tự động: nếu provider LLM chính (Gemini) không khả dụng, hệ thống tự chuyển sang provider dự phòng qua OpenRouter mà không cần can thiệp thủ công.

**b) Mở rộng cơ chế phát hiện COI:**
- Tích hợp thêm nguồn dữ liệu đồng tác giả từ **DBLP** và **Google Scholar** bên cạnh Semantic Scholar, tăng độ phủ — đặc biệt cho các lĩnh vực mà Semantic Scholar có hạn chế.
- Bổ sung phân tích **affiliation-based COI** (ví dụ: cùng đơn vị công tác) và **project-based COI** (cùng dự án tài trợ) bên cạnh co-authorship hiện tại.

**c) Cải thiện đánh giá thực nghiệm:**
- Hoàn thiện các phần đánh giá còn thiếu: benchmark Greedy Matching so với phân công thủ công, đánh giá LLM-as-a-judge cho Review Auditor và Decision Copilot.
- Mở rộng khảo sát UAT với quy mô lớn hơn, đặc biệt tăng số lượng mẫu cho nhóm Reviewer và Chair.

### 6.3.3. Phát triển dài hạn (6–12 tháng)

**a) Mở rộng quy mô và hiệu năng:**
- Chuyển từ monolith backend sang kiến trúc microservices đầy đủ nếu cần hỗ trợ hội nghị quy mô lớn (hàng nghìn bài nộp đồng thời).
- Triển khai hàng đợi (message queue) để xử lý bất đồng bộ các workflow AI nặng, tránh nghẽn cổ chai khi nhiều request AI đồng thời.
- Nghiên cứu cơ chế **prompt caching** và **batch processing** để giảm chi phí token khi xử lý nhiều bài báo liên tiếp.

**b) Tích hợp phân tích nâng cao:**
- Phát triển dashboard phân tích xu hướng (trend analytics) cho Chair: phân phối chủ đề bài nộp qua các năm, tỷ lệ chấp nhận theo track, phân tích chất lượng phản biện theo thời gian.
- Xây dựng hệ thống recommendation cho tác giả: gợi ý hội nghị phù hợp dựa trên hồ sơ nghiên cứu, lịch sử nộp bài và xu hướng lĩnh vực.

**c) Đóng góp cho cộng đồng:**
- Công bố mã nguồn dưới giấy phép mã nguồn mở, kèm tài liệu hướng dẫn triển khai — cho phép các hội nghị khác tự triển khai ConferenceSpace cho nhu cầu riêng.
- Chia sẻ bộ benchmark 1.127 bài báo và phương pháp đánh giá workflow AI như một contribution cho cộng đồng nghiên cứu về quản lý hội nghị.

---

**Tóm lại,** đề tài đã xây dựng thành công hệ thống ConferenceSpace với ba lớp kiến trúc rõ ràng: lớp nghiệp vụ cốt lõi đảm bảo vận hành ổn định, lớp thuật toán cung cấp gợi ý phản biện và phát hiện COI có thể giải thích, và lớp AI hỗ trợ người dùng ở các khâu tổng hợp và trích xuất thông tin. Kết quả khảo sát thực nghiệm trên 89 người dùng và benchmark trên 1.127 bài báo cho thấy hệ thống đáp ứng được nhu cầu thực tế của cộng đồng nghiên cứu ở quy mô hội nghị vừa và nhỏ. Các hạn chế được nhận diện — đặc biệt về phụ thuộc LLM bên ngoài, bảo mật dữ liệu, quy mô đánh giá, và chất lượng trích xuất trên định dạng phức tạp — đều có hướng cải thiện khả thi và được đề xuất cụ thể trong kế hoạch phát triển.

Qua quá trình xây dựng và đánh giá, đề tài cung cấp một quan sát thực nghiệm phù hợp với xu hướng chung của cộng đồng học thuật: trong quy trình xét duyệt bài báo, lớp nghiệp vụ và lớp thuật toán mang lại giá trị nền tảng ổn định và có thể kiểm chứng, trong khi lớp AI có hiệu quả rõ rệt ở các tác vụ tổng hợp và trích xuất thông tin — nhưng cần được thiết kế cẩn thận để đóng vai trò hỗ trợ thay vì thay thế quyết định, phù hợp với bản chất đòi hỏi tính trách nhiệm cao của quy trình phản biện học thuật.
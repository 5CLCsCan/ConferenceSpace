# Chương 2. Khảo sát nhu cầu (tiếp theo)

---

## 2.3. Khoảng trống nghiên cứu

Dựa trên kết quả khảo sát nhu cầu (mục 2.1) và khảo sát hiện trạng (mục 2.2), kết hợp với bối cảnh thực tế của lĩnh vực hội nghị học thuật — nơi số lượng bài nộp tại các hội nghị hàng đầu như NeurIPS, ICML, ICLR đã vượt ngưỡng 10.000–30.000 bài mỗi kỳ — nhóm xác định bốn khoảng trống chức năng chính của các hệ thống quản lý hội nghị hiện tại. Các khoảng trống này không chỉ phản ánh nhu cầu của người dùng mà còn thể hiện sự tụt hậu so với xu hướng công nghệ, khi các hội nghị hàng đầu đã bắt đầu thí điểm tích hợp AI vào quy trình xét duyệt.

### 2.3.1. Hạn chế của các hệ thống hiện tại

Qua phân tích bốn hệ thống đại diện (EasyChair, HotCRP, OpenReview, Microsoft CMT) kết hợp với dữ liệu khảo sát từ 89 người dùng, nhóm nhận diện bốn khoảng trống chức năng lớn mà các hệ thống hiện tại chưa giải quyết được:

#### Khoảng trống 1 — Thiếu AI hỗ trợ toàn diện trong quy trình xét duyệt

Đây là khoảng trống nghiêm trọng nhất. Mặc dù Microsoft CMT đã tích hợp TPMS cho gợi ý phản biện và OpenReview gần đây bắt đầu thí điểm AI Review Assistant, không hệ thống nào trong bốn nền tảng được khảo sát ứng dụng mô hình ngôn ngữ lớn (LLM) một cách nhất quán và xuyên suốt toàn bộ quy trình xét duyệt. Cụ thể:

- **Tác giả** phải tự nhập toàn bộ thông tin bài nộp (tiêu đề, tóm tắt, từ khóa, danh sách tác giả) một cách thủ công, dù phần lớn thông tin này đã có sẵn trong file PDF bản thảo. Theo kết quả khảo sát (mục 2.1), tính năng AI tự động điền thông tin (Autofill) được 47/76 tác giả (62%) đánh giá là **tính năng hữu ích nhất**, cho thấy nhu cầu rất lớn về giảm thao tác nhập liệu thủ công.
- **Người phản biện** không có công cụ hỗ trợ đọc hiểu sơ bộ bài báo. Phản biện phải tự đọc toàn bộ bản thảo từ đầu đến cuối trước khi bắt đầu viết nhận xét — quá trình này tốn nhiều thời gian, đặc biệt khi bài báo dài hoặc thuộc lĩnh vực liên ngành.
- **Trưởng ban (Chair)** không có công cụ tổng hợp thông minh. Khi ra quyết định chấp nhận hay từ chối một bài nộp, Chair phải tự đọc tất cả nhận xét, phản hồi rebuttal và thảo luận nội bộ — rồi tự tổng hợp trong đầu trước khi đưa ra quyết định. Với hội nghị có hàng trăm bài nộp, quy trình này vừa tốn thời gian vừa dễ bỏ sót thông tin quan trọng.

Xét riêng hai trường hợp có yếu tố AI: TPMS của CMT sử dụng thuật toán TF-IDF cổ điển, hoạt động như hệ thống tách rời (phải xuất-nhập dữ liệu thủ công) và không tận dụng được khả năng hiểu ngữ nghĩa sâu của các mô hình ngôn ngữ lớn hiện đại; còn AI Review Assistant của OpenReview mới dừng ở việc hỗ trợ sinh nội dung nhận xét trên quy mô thí điểm, chưa mở rộng sang các khâu khác như trích xuất thông tin bài nộp, gợi ý phân công phản biện hay tổng hợp hỗ trợ ra quyết định. Nói cách khác, chưa hệ thống nào cung cấp một lớp hỗ trợ AI bao trùm cả ba vai trò Tác giả, Phản biện và Trưởng ban.

#### Khoảng trống 2 — Phát hiện xung đột lợi ích (COI) còn thô sơ

Xung đột lợi ích là vấn đề nhạy cảm trong quy trình phản biện. Nếu một phản biện có mối quan hệ đồng tác giả hoặc cộng tác gần đây với tác giả bài nộp, tính khách quan của nhận xét bị ảnh hưởng nghiêm trọng.

Trong bốn hệ thống được khảo sát, EasyChair, HotCRP và OpenReview xử lý COI hoàn toàn bằng phương pháp **khai báo thủ công** — tác giả và phản biện tự khai báo các mối quan hệ. Microsoft CMT đã tiến thêm một bước khi hợp tác với DBLP để tự động đối chiếu mã định danh tác giả và phản biện, qua đó phát hiện quan hệ đồng tác giả trực tiếp mà không cần khai báo. Tuy nhiên, cơ chế này chỉ dừng ở quan hệ đồng tác giả bậc một (trực tiếp), chưa mở rộng phân tích mạng lưới đồng tác giả đa bậc (ví dụ: hai người từng cùng công bố với một tác giả trung gian) — vốn là dạng xung đột lợi ích tiềm ẩn nhưng khó tự phát hiện bằng mắt thường.

Nhìn chung, cách tiếp cận COI hiện tại của các hệ thống này — dù thủ công hay bán tự động — đều tồn tại ba hạn chế chung:
- Phụ thuộc vào ý thức và sự trung thực của người dùng (đối với phần khai báo thủ công).
- Dễ bỏ sót các mối quan hệ gián tiếp, đa bậc.
- Chưa khai thác đầy đủ dữ liệu công khai từ các cơ sở dữ liệu học thuật (Semantic Scholar, DBLP) dưới dạng phân tích đồ thị quan hệ.

#### Khoảng trống 3 — Thiếu hỗ trợ người dùng thông minh

Trong quá trình sử dụng các hệ thống quản lý hội nghị, người dùng — đặc biệt là người mới — thường gặp khó khăn với các thao tác phức tạp: cách nộp bài đúng quy định, cách viết nhận xét có chất lượng, cách phân công phản biện hiệu quả. Hiện không có hệ thống nào cung cấp:
- Chatbot hay trợ lý AI hướng dẫn thao tác trong quá trình sử dụng.
- Công cụ hỗ trợ Chair rà soát chất lượng các bài phản biện đã nộp trước khi tổng hợp ra quyết định (ví dụ: cảnh báo khi nhận xét quá ngắn, thiếu căn cứ, hoặc điểm số mâu thuẫn với nhận xét).
- Hệ thống kiểm tra sơ bộ bài nộp (desk rejection) tự động để lọc những bài không đạt yêu cầu cơ bản trước khi đưa vào quy trình phản biện chính thức.

#### Khoảng trống 4 — Thiếu thông báo real-time và giao diện hiện đại

Tất cả bốn hệ thống hiện tại chỉ dựa vào email để thông báo các sự kiện quan trọng (bài nộp mới, nhận xét hoàn thành, quyết định cuối cùng). Cơ chế này có độ trễ cao, dễ lọt vào thư rác, và không phù hợp với kỳ vọng trải nghiệm hiện đại. Kết hợp với giao diện lỗi thời (đặc biệt ở EasyChair và HotCRP), trải nghiệm tổng thể của người dùng bị ảnh hưởng đáng kể.

**Bảng 2.4 — Tổng hợp khoảng trống nghiên cứu**

| STT | Khoảng trống | Hệ thống bị ảnh hưởng | Nhu cầu liên quan (mục 2.1) |
|:---:|---|---|---|
| 1 | Thiếu AI hỗ trợ toàn diện trong quy trình xét duyệt | Tất cả (EasyChair, HotCRP, OpenReview, CMT) | Autofill (62% tác giả chọn là hữu ích nhất), gợi ý track, hỗ trợ phản biện, Decision Copilot |
| 2 | Phát hiện COI còn thô sơ | Tất cả | Phát hiện COI đáng tin cậy (ưu tiên Trung bình–Cao) |
| 3 | Thiếu hỗ trợ người dùng thông minh | Tất cả | Chatbot 24/7, kiểm tra chất lượng review, desk rejection |
| 4 | Thiếu real-time và UX hiện đại | Tất cả | Thông báo tức thì, giao diện responsive, đa ngôn ngữ |

### 2.3.2. Liên kết hạn chế với giải pháp của nhóm

Giải pháp ConferenceSpace không được thiết kế một cách rời rạc mà là **phản hồi trực tiếp** đối với từng khoảng trống đã xác định. Bảng dưới đây trình bày mối liên hệ giữa từng hạn chế và thành phần tương ứng trong hệ thống:

**Bảng 2.5 — Ánh xạ khoảng trống sang giải pháp ConferenceSpace**

| Khoảng trống | Giải pháp trong ConferenceSpace | Thành phần kỹ thuật |
|---|---|---|
| **Thiếu AI hỗ trợ toàn diện** | Sáu workflow AI phục vụ cả ba vai trò: Submission Autofill, Track Recommendation, Submission Gating/Desk Rejection (Author); Reviewer Initial Analysis (Reviewer); Review Quality Auditor, Chair Decision Copilot (Chair) | Python AI Service (FastAPI) + Google Gemini LLM qua LiteLLM |
| **COI thủ công hoặc chỉ dò được quan hệ bậc một (CMT)** | Cơ chế phát hiện COI đa tầng: (1) Kiểm tra tự phản biện, (2) Khai báo thủ công, (3) Phân tích đồ thị đồng tác giả tự động, hỗ trợ phát hiện quan hệ đa bậc (1–3 bậc) | Neo4j (graph database) + Semantic Scholar API + Composite pattern COI detector |
| **Thiếu hỗ trợ người dùng** | Chatbot AI 24/7 tích hợp Function Calling để tra cứu dữ liệu hệ thống; Review Quality Auditor hỗ trợ Chair rà soát chất lượng và tính nhất quán của các bài phản biện đã nộp; Desk Rejection tự động lọc bài không đạt chuẩn cơ bản trước khi vào quy trình phản biện chính thức | Conference Agent (LLM + AgentQuery Engine) + Review Quality Auditor + Desk Rejection pipeline |
| **Thiếu real-time và UX hiện đại** | WebSocket push notification; giao diện Next.js 15 responsive với dark mode; hỗ trợ đa ngôn ngữ (Tiếng Anh, Tiếng Việt) | gorilla/websocket (Go) + Next.js 15 App Router + Tailwind CSS v4 + shadcn/ui + i18n |

**Tính hệ thống của giải pháp:**

Điểm khác biệt quan trọng của ConferenceSpace so với cách tiếp cận "thêm tính năng" đơn thuần là sự **liên kết chặt chẽ** giữa ba lớp hệ thống:

1. **Lớp nghiệp vụ cốt lõi** (Core Business Layer): Xử lý toàn bộ quy trình xét duyệt — nộp bài, phân công, thu thập nhận xét, rebuttal, quyết định — hoạt động ổn định và độc lập, không phụ thuộc vào AI. Đây là nền tảng đảm bảo hệ thống vẫn hoạt động bình thường ngay cả khi các dịch vụ AI tạm thời không khả dụng.

2. **Lớp thuật toán** (Algorithm Layer): Gợi ý phản biện (Domain Jaccard Similarity + Greedy Matching) và phát hiện COI (đồ thị đồng tác giả trên Neo4j) — hoạt động dựa trên tính toán xác định, có thể giải thích và kiểm chứng được, không sử dụng LLM.

3. **Lớp hỗ trợ AI** (AI-Assisted Layer): Sáu workflow sử dụng LLM để hỗ trợ người dùng ở các khâu tổng hợp, trích xuất và đối chiếu thông tin. Lớp này đóng vai trò **hỗ trợ** chứ không thay thế quyết định — mọi kết quả AI đều được trình bày dưới dạng gợi ý, và quyết định cuối cùng luôn thuộc về người dùng.

Thiết kế ba lớp này đảm bảo: (i) hệ thống vẫn vận hành đầy đủ nếu AI service bị ngưng, (ii) kết quả thuật toán có thể giải thích và kiểm tra, (iii) AI không đưa ra quyết định thay người dùng — phù hợp với bản chất đòi hỏi tính trách nhiệm cao của quy trình phản biện học thuật. Việc tách lớp AI-Assisted Layer thành một microservice độc lập (mục 2.3.3) cũng tạo điều kiện thuận lợi để thay thế nhà cung cấp LLM hoặc chuyển sang mô hình triển khai on-premise trong tương lai, nhằm đáp ứng các yêu cầu bảo mật dữ liệu nghiêm ngặt hơn — một hạn chế của giải pháp hiện tại được phân tích cụ thể ở Chương 6.

### 2.3.3. Giải thích các công nghệ nhóm sử dụng

Để hiện thực hóa giải pháp ba lớp nêu trên, nhóm lựa chọn một bộ công nghệ cân bằng giữa hiệu năng, chi phí và tính linh hoạt. Phần này giới thiệu ngắn gọn các công nghệ chính và vai trò của chúng; phân tích chi tiết từng công nghệ sẽ được trình bày ở Chương 4.

**Bảng 2.6 — Tổng quan công nghệ sử dụng và vai trò trong giải pháp**

| Thành phần | Công nghệ | Vai trò trong giải pháp |
|---|---|---|
| **Backend API** | Go 1.24 + Gin Framework | Xử lý nghiệp vụ cốt lõi với hiệu năng cao; goroutines phù hợp cho I/O-bound tasks (WebSocket, gọi API bên ngoài); kiến trúc Clean Architecture (Controller–Service–Storage) đảm bảo khả năng bảo trì |
| **Frontend** | Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui | Giao diện responsive, hiện đại, hỗ trợ SSR; đóng vai trò proxy layer giữa browser và backend, ẩn URL nội bộ |
| **Cơ sở dữ liệu quan hệ** | PostgreSQL 15 | Lưu trữ toàn bộ dữ liệu có cấu trúc; tận dụng JSONB cho cấu hình linh hoạt, TEXT[] cho mảng chuyên môn; 93 migration files quản lý schema |
| **Cơ sở dữ liệu đồ thị** | Neo4j 5.15 | Lưu trữ và truy vấn mạng lưới đồng tác giả phục vụ phát hiện COI; graph traversal 1–3 bậc hiệu quả hơn SQL JOIN |
| **AI Service** | Python + FastAPI + LiteLLM | Microservice độc lập chạy sáu workflow AI (Submission Autofill, Track Recommendation, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot); LiteLLM trừu tượng hóa lớp gọi LLM, cho phép chuyển đổi provider mà không sửa code |
| **LLM chính** | Google Gemini 3.1 Flash-Lite | Hạn mức miễn phí phù hợp cho giai đoạn phát triển, hỗ trợ multimodal (xử lý PDF native), context window ~1M token (1.048.576 token) — phù hợp cho autofill và phân tích bài báo dài |
| **Chatbot gateway** | OpenRouter | Cho phép chuyển đổi model chatbot linh hoạt (Gemini, GPT, Claude) mà không thay đổi code |
| **Dữ liệu học thuật** | Semantic Scholar API | Cung cấp hồ sơ tác giả, danh sách bài báo, mạng lưới đồng tác giả phục vụ gợi ý reviewer và phát hiện COI |
| **Real-time** | WebSocket (gorilla/websocket) | Đẩy thông báo tức thì tới client khi có sự kiện mới |
| **Triển khai** | Docker + Docker Compose + Caddy | Containerization đảm bảo nhất quán môi trường; Caddy tự động quản lý HTTPS |

**Lý do chọn Google Gemini làm nền tảng AI chính:**

Trong quá trình đánh giá các nhà cung cấp LLM, nhóm lựa chọn Google Gemini 3.1 Flash-Lite dựa trên ba yếu tố phù hợp với yêu cầu của hệ thống: (i) khả năng xử lý PDF native — cần thiết cho tính năng Autofill, (ii) context window ~1M token — hỗ trợ phân tích bài báo dài và tổng hợp nhiều nhận xét, và (iii) hạn mức miễn phí 15 request/phút và 500 request/ngày — đủ cho quy mô hội nghị vừa và nhỏ trong giai đoạn phát triển.

Thông qua LiteLLM và OpenRouter, kiến trúc hệ thống được thiết kế để có thể chuyển đổi sang các nhà cung cấp khác (OpenAI, DeepSeek) hoặc mô hình mã nguồn mở chạy cục bộ khi điều kiện thay đổi, đảm bảo tính linh hoạt và giảm phụ thuộc lâu dài.

---

*Kết quả phân tích trong các mục 2.2 và 2.3 cung cấp cơ sở trực tiếp cho việc xác định phạm vi chức năng và lựa chọn công nghệ xây dựng hệ thống ConferenceSpace. Các nội dung thiết kế chi tiết sẽ được trình bày trong Chương 3 (Xây dựng hệ thống) và Chương 4 (Công nghệ sử dụng).*
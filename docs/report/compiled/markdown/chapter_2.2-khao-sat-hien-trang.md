# Chương 2. Khảo sát nhu cầu (tiếp theo)

---

## 2.2. Khảo sát hiện trạng

Bên cạnh việc thu thập nhu cầu trực tiếp từ người dùng (mục 2.1), nhóm tiến hành khảo sát các hệ thống quản lý hội nghị học thuật hiện có trên thế giới. Mục tiêu của khảo sát này là: (i) xác định các chức năng đã được chuẩn hóa trong lĩnh vực, (ii) đánh giá mức độ đáp ứng nhu cầu người dùng của các nền tảng phổ biến, và (iii) phát hiện khoảng trống chức năng — đặc biệt liên quan đến tích hợp trí tuệ nhân tạo (AI) và trải nghiệm người dùng — làm cơ sở cho việc định hướng giải pháp của nhóm.

### 2.2.1. Mô tả các ứng dụng hiện có

Nhóm lựa chọn bốn hệ thống đại diện, bao phủ cả dạng thương mại, dạng mã nguồn mở và dạng phản biện công khai, nhằm tạo bức tranh toàn diện về hiện trạng công nghệ trong lĩnh vực quản lý hội nghị khoa học.

#### a) EasyChair

**EasyChair** (https://easychair.org) là hệ thống quản lý hội nghị lâu đời và phổ biến nhất thế giới, phục vụ hàng chục nghìn hội nghị khoa học mỗi năm kể từ khi ra mắt vào năm 2002. EasyChair hỗ trợ toàn bộ vòng đời hội nghị — từ tiếp nhận bài nộp (submission), phân công phản biện (reviewer assignment), thu thập nhận xét (review), đến ra quyết định cuối cùng (decision) và quản lý bản hoàn chỉnh (camera-ready).

**Chức năng chính:**
- Quản lý đầy đủ chu trình nghiệp vụ: CFP → Submission → Review → Decision → Camera-ready.
- Hỗ trợ nhiều track và cấu hình vai trò linh hoạt cho ban tổ chức (Chair, Co-Chair, PC member).
- Phân công phản biện thủ công và bán tự động theo lĩnh vực khai báo.
- Giao tiếp giữa Chair và Reviewer/Author thông qua email tích hợp.
- Miễn phí cho hội nghị quy mô nhỏ và vừa.

**Nhóm người dùng chính:** Tác giả, Người phản biện, Trưởng ban chương trình.

**Hạn chế đáng chú ý:**
- Giao diện người dùng lỗi thời, thiết kế theo phong cách đầu thập niên 2000, đường cong học tập cao đối với người mới — đặc biệt là sinh viên và nhà nghiên cứu trẻ.
- Không tích hợp bất kỳ tính năng AI nào: không gợi ý phản biện dựa trên nội dung bài báo, không phát hiện xung đột lợi ích (COI) tự động, không hỗ trợ trích xuất thông tin từ bản thảo.
- Kiểm tra COI phụ thuộc hoàn toàn vào khai báo thủ công của người dùng, dễ bỏ sót các mối quan hệ tiềm ẩn.
- Không có thông báo thời gian thực (real-time); người dùng phải chủ động truy cập hệ thống để kiểm tra cập nhật.
- Quy trình nộp bài không trực quan, thiếu hướng dẫn từng bước cho người dùng lần đầu sử dụng.

#### b) HotCRP

**HotCRP** (https://hotcrp.com) là hệ thống mã nguồn mở, được phát triển bởi Eddie Kohler tại Harvard và được sử dụng rộng rãi bởi các hội nghị hàng đầu về khoa học máy tính như USENIX, SIGCOMM, OSDI, SOSP.

**Chức năng chính:**
- Hệ thống phân công phản biện với cơ chế **bidding** — cho phép phản biện nêu mức độ ưu tiên đánh giá đối với từng bài nộp, từ đó Chair có thêm thông tin để phân công hợp lý hơn.
- Hỗ trợ phản biện nhiều vòng (multi-round review) với khả năng cập nhật nhận xét sau giai đoạn phản hồi tác giả.
- Tính năng **discussion thread** nội bộ giữa các phản biện và Chair để trao đổi về các bài nộp gây tranh cãi.
- Bộ lọc và tìm kiếm bài nộp mạnh mẽ, phù hợp cho hội nghị quy mô lớn.
- Hiệu năng cao, tải nhanh ngay cả với hàng nghìn bài nộp.

**Nhóm người dùng chính:** Chủ yếu hướng đến Người phản biện và Trưởng ban; trải nghiệm phía Tác giả không phải trọng tâm thiết kế.

**Hạn chế đáng chú ý:**
- Giao diện tối giản, thiên hướng kỹ thuật cao — không thân thiện với người dùng ít kinh nghiệm (sinh viên, nhà nghiên cứu trẻ).
- Không tích hợp AI cho bất kỳ khâu nào trong quy trình — đây là hạn chế đáng chú ý so với xu hướng gần đây của các hội nghị hàng đầu (ICLR, AAAI) đã bắt đầu thí điểm AI-assisted review.
- Yêu cầu tự triển khai (self-hosted), đòi hỏi kiến thức quản trị hệ thống và hạ tầng máy chủ.
- Không có thông báo real-time và không có chatbot hỗ trợ người dùng.

#### c) OpenReview

**OpenReview** (https://openreview.net) là nền tảng nổi tiếng với mô hình phản biện công khai (open peer review), được phát triển bởi UMass Amherst và sử dụng bởi các hội nghị hàng đầu trong lĩnh vực trí tuệ nhân tạo như ICLR, NeurIPS (workshop tracks) và ICML.

**Chức năng chính:**
- Hỗ trợ mô hình phản biện mở — các nhận xét và phản hồi được công bố công khai, thúc đẩy tính minh bạch trong quy trình xét duyệt.
- Cung cấp **REST API mở** cho phép nhà nghiên cứu và công cụ bên thứ ba truy xuất dữ liệu phục vụ phân tích meta-review.
- Hỗ trợ nhiều loại quy trình phản biện: single-blind, double-blind, open review.
- Tính năng rebuttal (phản hồi tác giả) được tích hợp trực tiếp vào giao diện.
- Cộng đồng người dùng lớn, đặc biệt trong ngành AI/ML.

**Nhóm người dùng chính:** Tác giả, Người phản biện — đặc biệt trong cộng đồng nghiên cứu AI.

**Hạn chế đáng chú ý:**
- Mô hình phản biện công khai không phù hợp với tất cả hội nghị, đặc biệt những hội nghị yêu cầu phản biện kín (double-blind review) truyền thống.
- Không tích hợp AI để gợi ý phản biện, phát hiện COI hay hỗ trợ trích xuất thông tin bài nộp.
- Giao diện khá phức tạp với người dùng mới, cấu hình hội nghị đòi hỏi hiểu biết kỹ thuật.
- Gần đây, OpenReview đã bắt đầu thử nghiệm tích hợp LLM-generated reviews thông qua tính năng "AI Review Assistant", nhưng đây mới chỉ là thí điểm trên quy mô hạn chế và chưa được triển khai rộng rãi như một tính năng chính thức của nền tảng.

#### d) Microsoft CMT

**Microsoft CMT** — Conference Management Toolkit (https://cmt3.research.microsoft.com) — là dịch vụ quản lý hội nghị miễn phí được phát triển bởi Microsoft Research, sử dụng bởi các hội nghị quy mô lớn như CVPR, ICCV, AAAI.

**Chức năng chính:**
- Quản lý hội nghị toàn diện với hỗ trợ multi-track và multi-phase review.
- Phân công phản biện thủ công và bán tự động.
- Tích hợp **TPMS (Toronto Paper Matching System)** — một hệ thống gợi ý phản biện sử dụng thuật toán TF-IDF cổ điển để tính toán độ tương đồng giữa hồ sơ phản biện và nội dung bài nộp.
- Về phát hiện xung đột lợi ích, CMT cung cấp hai cơ chế: Individual-based conflict management và Domain-based conflict management. Ngoài ra, CMT đã hợp tác với DBLP để tự động phát hiện co-authorship conflicts thông qua đối chiếu mã định danh DBLP của tác giả và người phản biện — một bước tiến so với các hệ thống chỉ dựa trên khai báo thủ công.
- Ổn định ở quy mô lớn (hàng nghìn bài nộp), giao diện thân thiện hơn EasyChair.
- Miễn phí hoàn toàn cho sử dụng học thuật.

**Nhóm người dùng chính:** Tác giả, Người phản biện, Trưởng ban chương trình.

**Hạn chế đáng chú ý:**
- TPMS hoạt động như một hệ thống tách rời — Chair phải xuất dữ liệu, chạy matching trên TPMS, sau đó nhập kết quả trở lại CMT. Quy trình xuất-nhập thủ công này tạo ra độ trễ và rủi ro sai sót trong quá trình chuyển đổi dữ liệu.
- TPMS sử dụng thuật toán cổ điển (TF-IDF), không tận dụng được các mô hình ngôn ngữ lớn (LLM) hiện đại có khả năng hiểu ngữ nghĩa sâu hơn.
- Cơ chế phát hiện COI qua DBLP chỉ dừng ở mức đối chiếu co-authorship trực tiếp, chưa phân tích mạng lưới đồng tác giả gián tiếp hay quan hệ COI phức tạp hơn.
- Phụ thuộc hệ sinh thái Microsoft, khó tùy biến cho nhu cầu đặc thù.
- Không có chatbot hỗ trợ và không có thông báo real-time.

### 2.2.2. Đánh giá mức độ được yêu thích

Để bổ sung cho phân tích chức năng, nhóm đánh giá mức độ phổ biến và sự chấp nhận của cộng đồng nghiên cứu đối với từng hệ thống, dựa trên ba yếu tố: (i) quy mô sử dụng — số lượng hội nghị và người dùng; (ii) phản hồi thực tế từ cộng đồng học thuật; và (iii) mức độ hiện đại hóa giao diện và trải nghiệm.

**Bảng 2.2 — Đánh giá mức độ phổ biến và trải nghiệm người dùng**

| Tiêu chí | EasyChair | HotCRP | OpenReview | Microsoft CMT |
|---|---|---|---|---|
| Quy mô sử dụng | Rất lớn (hàng chục nghìn hội nghị/năm) | Lớn (hội nghị CS hàng đầu) | Lớn (hội nghị AI/ML hàng đầu) | Lớn (hội nghị CV/AI hàng đầu) |
| Trải nghiệm tác giả | Trung bình – yếu | Trung bình | Khá | Khá |
| Trải nghiệm phản biện | Trung bình | Tốt | Khá | Khá |
| Trải nghiệm Chair | Khá | Tốt | Khá | Khá |
| Giao diện hiện đại | Lỗi thời | Tối giản | Trung bình | Trung bình |
| Mức độ tin tưởng | Rất cao (truyền thống lâu năm) | Cao (cộng đồng CS) | Cao (minh bạch) | Cao (Microsoft) |

**Nhận xét tổng hợp:**

- **EasyChair** là hệ thống được sử dụng rộng rãi nhất nhờ tính miễn phí và sự quen thuộc lâu năm trong cộng đồng. Tuy nhiên, giao diện lỗi thời và thiếu hỗ trợ hiện đại khiến người dùng — đặc biệt là sinh viên và nhà nghiên cứu trẻ — gặp nhiều khó khăn khi sử dụng lần đầu. Nhiều ý kiến phản hồi cho rằng quy trình nộp bài trên EasyChair "thiếu trực quan" và "khó tìm chức năng cần thiết".

- **HotCRP** được đánh giá cao về trải nghiệm phản biện nhờ cơ chế bidding và discussion thread. Tuy nhiên, sự phức tạp trong việc tự triển khai và giao diện kỹ thuật cao khiến HotCRP phù hợp hơn với các hội nghị có đội ngũ kỹ thuật hỗ trợ, chứ không phải lựa chọn dễ tiếp cận cho hội nghị quy mô nhỏ.

- **OpenReview** nổi bật với tính minh bạch và API mở, được cộng đồng AI/ML đánh giá cao. Song, mô hình phản biện công khai gây e ngại cho một số người dùng vì lo lắng về áp lực khi nhận xét bị công bố công khai. Thí điểm AI Review Assistant gần đây là một tín hiệu tích cực, nhưng quy mô còn hạn chế nên chưa tác động đáng kể đến trải nghiệm chung của người dùng.

- **Microsoft CMT** cân bằng giữa tính hoàn chỉnh về chức năng và giao diện tương đối dễ dùng. TPMS là điểm sáng về matching reviewer, nhưng việc tách rời khỏi luồng chính và sử dụng thuật toán cổ điển hạn chế tính tiện dụng thực tế. Cơ chế phát hiện COI qua DBLP cũng là một điểm cộng, dù mới chỉ dừng ở quan hệ đồng tác giả trực tiếp.

**Điểm chung đáng chú ý:** Không có hệ thống nào trong bốn nền tảng được khảo sát cung cấp trải nghiệm "liền mạch" từ đầu đến cuối cho tất cả vai trò. Tác giả thường gặp khó khăn ở khâu nộp bài, phản biện thiếu công cụ hỗ trợ đọc hiểu, và Chair phải xử lý phần lớn công việc quản trị một cách thủ công.

### 2.2.3. So sánh với các ứng dụng khác

Để làm rõ khoảng cách giữa các giải pháp hiện có và nhu cầu thực tế đã khảo sát ở mục 2.1, nhóm xây dựng bảng so sánh chi tiết theo 23 tiêu chí, bao gồm cả chức năng cơ bản, tính năng AI nâng cao và trải nghiệm người dùng.

**Bảng 2.3 — So sánh chi tiết chức năng giữa các hệ thống quản lý hội nghị**

| Tiêu chí | EasyChair | HotCRP | OpenReview | Microsoft CMT | **ConferenceSpace** |
|---|---|---|---|---|---|
| Quản lý nộp bài (Submission) | Có | Có | Có | Có | Có |
| Phân công phản biện thủ công | Có | Có | Có | Có | Có |
| Bidding (phản biện nêu ưu tiên) | Có | Có | Có | Có | **Chưa có** |
| Phản biện kín (blind review) | Có | Có | Có | Có | Có |
| Rebuttal (phản hồi tác giả) | Có | Có | Có | Có | Có |
| Thảo luận nội bộ (discussion thread) | Không | Có | Có | Có | Có |
| Hỗ trợ nhiều track | Có | Có | Có | Có | Có |
| Mời phản biện bên ngoài | Có | Có | Có | Có | Có |
| API mở (public REST API) | Không | Không | Có | Không | Không |
| Mã nguồn mở | Không | Có | Không | Không | Chưa (dự kiến mở trong tương lai — mục 6.3.3) |
| **Gợi ý phản biện bằng AI** | Không | Không | Không | Hạn chế (TPMS) | **Có** |
| **Phát hiện COI tự động (đồ thị đồng tác giả)** | Không | Không | Không | Hạn chế (DBLP, chỉ co-authorship trực tiếp) | **Có** |
| **Trích xuất thông tin bài nộp tự động (AI Autofill)** | Không | Không | Không | Không | **Có** |
| **Gợi ý track phù hợp bằng AI** | Không | Không | Không | Không | **Có** |
| **Kiểm tra sơ bộ bài nộp tự động (Desk Rejection)** | Không | Không | Không | Không | **Có** |
| **Hỗ trợ phân tích sơ bộ bài báo cho Reviewer** | Không | Không | Không | Không | **Có** |
| **Kiểm tra chất lượng bài phản biện bằng AI** | Không | Không | Không | Không | **Có** |
| **Hỗ trợ ra quyết định cho Chair bằng AI (Decision Copilot)** | Không | Không | Không | Không | **Có** |
| **Trích xuất từ khóa nghiên cứu bằng AI** | Không | Không | Không | Không | **Có** |
| **Chatbot AI hỗ trợ người dùng 24/7** | Không | Không | Không | Không | **Có** |
| **Thông báo real-time (WebSocket)** | Không | Không | Không | Không | **Có** |
| Giao diện hiện đại, responsive | Không | Không | Hạn chế | Hạn chế | **Có** |
| Hỗ trợ đa ngôn ngữ (i18n) | Không | Không | Không | Không | **Có** |

**Phân tích so sánh:**

Bảng so sánh cho thấy ba nhóm khác biệt rõ rệt giữa ConferenceSpace và các hệ thống hiện có:

**Nhóm 1 — Chức năng cơ bản đã chuẩn hóa:** Tất cả năm hệ thống đều hỗ trợ các chức năng nền tảng như quản lý nộp bài, phân công phản biện, thu thập nhận xét, và rebuttal. Đây là "bảng chuẩn" mà bất kỳ hệ thống quản lý hội nghị nào cũng cần đáp ứng. ConferenceSpace đáp ứng đầy đủ nhóm yêu cầu này.

**Nhóm 2 — Tính năng AI tiên tiến:** Đây là khoảng trống lớn nhất. Trong bốn hệ thống hiện tại, chỉ CMT (với TPMS) và OpenReview (với thí điểm AI Review Assistant) có yếu tố AI, nhưng đều ở mức cơ bản và giới hạn trong một khâu duy nhất của quy trình. ConferenceSpace là hệ thống duy nhất cung cấp bảy workflow AI phục vụ cả ba vai trò người dùng — từ trích xuất thông tin tự động (Author), phân tích sơ bộ bài báo (Reviewer), đến tổng hợp hỗ trợ ra quyết định (Chair).

**Nhóm 3 — Trải nghiệm người dùng hiện đại:** Thông báo real-time, giao diện responsive, hỗ trợ đa ngôn ngữ và chatbot 24/7 là những tính năng mà không hệ thống hiện tại nào cung cấp đầy đủ. Đây là điểm mà ConferenceSpace khác biệt rõ ràng, phản ánh trực tiếp nhu cầu đã được xác định trong khảo sát (mục 2.1).

**Một hạn chế của ConferenceSpace so với các hệ thống hiện tại:** ConferenceSpace hiện chưa hỗ trợ cơ chế **bidding** — tính năng cho phép phản biện chủ động nêu ưu tiên đánh giá bài nào. Đây là tính năng có giá trị thực tiễn (đặc biệt ở HotCRP) và được coi là hướng phát triển trong tương lai.
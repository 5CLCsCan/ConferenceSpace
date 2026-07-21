# ConferenceSpace — Gói nội dung poster bảo vệ

Ngày khóa nội dung: 21/07/2026<br>
Nguồn sự thật: bản LaTeX đã biên dịch trong `docs/report/compiled/latex/`<br>
Phạm vi: chỉ dùng thông tin đã có trong báo cáo; không bổ sung dữ liệu hoặc kết luận từ nguồn ngoài.

## 1. Quy cách đầu ra đã khóa

- Poster màu, khổ A0 ngang: 1189 × 841 mm.
- Ngôn ngữ nội dung: tiếng Việt; giữ tên chức năng tiếng Anh đúng như báo cáo.
- Mục tiêu sử dụng: dẫn dắt phần trình bày 15 phút trước hội đồng, không thay thế toàn bộ báo cáo.
- Bố cục dự kiến: tiêu đề → vấn đề và luận điểm trung tâm → mô hình ba lớp → sản phẩm theo vai trò → thiết lập đánh giá → kết quả → giới hạn và kết luận.
- Nội dung phải đọc được từ khoảng cách trình bày; không đưa bảng dày hoặc đoạn văn dài lên poster.

## 2. Phần đầu poster

### Đơn vị

TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN<br>
KHOA CÔNG NGHỆ THÔNG TIN

### Tên đề tài

**HỆ THỐNG HỖ TRỢ XÉT DUYỆT BÀI BÁO KHOA HỌC**

Tên sản phẩm đặt ngay dưới tiêu đề: **ConferenceSpace**

### Loại đề tài

THỰC TẬP DỰ ÁN TỐT NGHIỆP — CHƯƠNG TRÌNH CHUẨN

### Thành viên

- Cao Hữu Khương Duy — 22127083
- Nhâm Đức Huy — 22127158
- Võ Minh Khôi — 22127213
- Từ Chí Tiến — 22127414
- Nguyễn Ngọc Anh Tú — 22127433

### Giảng viên hướng dẫn

- ThS. Hồ Thị Hoàng Vy
- PGS.TS. Lê Nguyễn Hoài Nam

### Logo

- Logo Trường: `docs/report/compiled/latex/images/logo-khtn.png`
- Logo Khoa: `docs/report/compiled/latex/images/logo.png`

Nguồn: `Title/title.tex`.

## 3. Thông điệp trung tâm

### Câu dẫn một dòng

**ConferenceSpace hỗ trợ toàn bộ vòng đời xét duyệt bài báo bằng cách phân tách rõ nghiệp vụ, thuật toán có thể kiểm chứng và AI hỗ trợ — con người giữ quyền quyết định học thuật.**

### Vấn đề

Quy trình xét duyệt cần đồng thời quản lý trạng thái và quyền hạn, đề xuất phản biện viên có thể giải thích, hỗ trợ đọc và tổng hợp thông tin, nhưng không được chuyển trách nhiệm học thuật cho hệ thống tự động.

### Mục tiêu

Xây dựng và đánh giá một nền tảng thực nghiệm phục vụ quy trình xét duyệt bài báo tại hội nghị khoa học, trong đó mỗi tác vụ được giao cho cơ chế phù hợp với mức ảnh hưởng và chủ thể chịu trách nhiệm.

### Không tuyên bố

- Không khẳng định mô hình ba lớp là tối ưu hoặc hoàn toàn mới.
- Không khẳng định ConferenceSpace vượt trội hơn các nền tảng khác.
- Không suy diễn các phép đo bám nguồn thành độ đúng của quyết định học thuật.
- Không khẳng định hệ thống đã sẵn sàng triển khai cho hội nghị thực tế.

Nguồn: `Chapter1/chapter1.tex`, dòng 17–21 và 53; `Chapter5/chapter5.tex`, dòng 5.

## 4. Mô hình ba lớp trách nhiệm

Đây là hình trung tâm của poster, nên được vẽ lại bằng đồ họa vector theo màu của nền tảng.

### Lớp 1 — Nghiệp vụ cốt lõi

**Trách nhiệm:** quản lý trạng thái, quyền truy cập và các bước của vòng đời hội nghị.<br>
**Đầu ra chính thức:** dữ liệu và trạng thái nghiệp vụ đã được backend kiểm tra.<br>
**Chủ thể quyết định:** người dùng có quyền theo vai trò.

### Lớp 2 — Thuật toán có thể kiểm chứng

**Trách nhiệm:** tính điểm phù hợp, xếp hạng, đề xuất phân công và phát hiện xung đột lợi ích.<br>
**Đầu ra:** danh sách đề xuất, điểm số, lý do, cảnh báo và danh sách bài chưa đủ người.<br>
**Chủ thể quyết định:** Chủ tọa kiểm tra, điều chỉnh và xác nhận.

### Lớp 3 — AI hỗ trợ có kiểm soát

**Trách nhiệm:** tạo bản nháp, cảnh báo, định hướng đọc, rà soát và tổng hợp bằng chứng.<br>
**Đầu ra:** nội dung hỗ trợ có thể kiểm tra và chỉnh sửa.<br>
**Chủ thể quyết định:** Tác giả, Phản biện viên hoặc Chủ tọa tùy tác vụ.

### Dòng kết luận dưới sơ đồ

**Kết quả từ thuật toán và AI chỉ trở thành hành động nghiệp vụ sau khi người có thẩm quyền kiểm tra và xác nhận.**

Nguồn: `Chapter1/chapter1.tex`, dòng 17; `Chapter3/chapter3.tex`, phần “Mô hình trách nhiệm ba lớp”.

## 5. Sản phẩm theo vòng đời và vai trò

### Ba vai trò chính

- **Tác giả:** tạo bản nháp, tải bản thảo, kiểm tra siêu dữ liệu, khai báo đồng tác giả và xung đột lợi ích, gửi bài, phản hồi và nộp camera-ready khi được chấp nhận.
- **Phản biện viên:** đọc bài được phân công, nhập điểm và nhận xét, tham khảo bản định hướng, rà soát bản phản biện trước khi gửi.
- **Chủ tọa/Đồng chủ tọa:** cấu hình hội nghị, quản lý hội đồng, kiểm tra đề xuất phân công, theo dõi tiến độ, tổng hợp bằng chứng và ra quyết định.

### Sáu luồng AI hỗ trợ

1. Submission Autofill — tạo bản nháp siêu dữ liệu và gợi ý chuyên đề.
2. Submission Gating — kiểm tra quy tắc và tạo cảnh báo nội dung.
3. Reviewer Initial Analysis — cung cấp định hướng đọc ban đầu.
4. Review Quality Auditor — hiển thị các điểm cần kiểm tra trong bản phản biện.
5. Chair Decision Copilot — tổng hợp bằng chứng, đồng thuận, bất đồng và câu hỏi còn mở.
6. Chatbot Agent — truy vấn dữ liệu ConferenceSpace trong phạm vi quyền của người dùng.

### Câu bảo vệ ranh giới

**AI không tự gửi bản phản biện, thiết lập điểm số hoặc quyết định chấp nhận/từ chối bài.**

Nguồn: `Chapter3/chapter3.tex`, các mục UC02, UC05, UC06, UC09, UC10 và bảng ranh giới đầu ra AI; `Chapter5/chapter5.tex`, dòng 67.

## 6. Thiết lập đánh giá

Nên trình bày bằng bốn thẻ ngắn, không dùng đoạn mô tả dài.

### Hiệu năng backend

- 3 kịch bản HTTP.
- 20 người dùng ảo trong 30 giây cho mỗi kịch bản.
- Dữ liệu tổng hợp: 300 hội nghị, 15.000 bài nộp và 9.000 quan hệ phản biện viên–hội nghị.

### Thuật toán

- Go microbenchmark cho chi phí xử lý.
- Leave-one-out trên 60 hồ sơ và 2.565 bài báo tổng hợp.
- So sánh Jaccard, số chủ đề chung, ngẫu nhiên; Greedy, tuần tự và ngẫu nhiên.

### Các luồng AI

- 1.127 bài từ tập ReviewRebuttal đã chọn lọc.
- 1.097/1.127 bài tạo kết quả đủ điều kiện chấm; 30 bài không hoàn tất.
- Đánh giá theo đối chiếu trực tiếp, TCA và kịch bản hội thoại.

### Trải nghiệm người dùng

- 91 phản hồi: 76 Tác giả, 7 Phản biện viên, 8 Chủ tọa.
- Đây là mẫu thuận tiện, lệch mạnh về nhóm Tác giả.

Nguồn: `Chapter4/chapter4.tex`, dòng 70, 109, 138–150 và 403.

## 7. Kết quả sẽ đưa lên poster

### Cụm A — Nghiệp vụ cốt lõi

**p95 < 120 ms**<br>
Ba kịch bản tải ngắn hạn trên các endpoint đã chọn.

**0% yêu cầu thất bại**<br>
Trong cấu hình thử nghiệm k6 đã mô tả.

Chú thích bắt buộc: *Không thay thế kiểm thử đầu cuối, chạy bền hoặc tải phân tán.*

Nguồn: `Chapter4/chapter4.tex`, dòng 180–200; `Chapter5/chapter5.tex`, dòng 13.

### Cụm B — Đối sánh và phân công

**MRR 0,392 · Hit@10 65%**<br>
Jaccard trong phép thử leave-one-out trên 60 truy vấn.

**65,9% độ phủ đủ hai phản biện viên**<br>
Greedy đạt điểm Jaccard trung bình 0,011, cao gấp 2,75 lần hai phương pháp cơ sở; 23,3% số bài cần lượt dự phòng.

Chú thích bắt buộc: *Đây là bằng chứng gián tiếp trên dữ liệu tổng hợp; kết quả chỉ hỗ trợ tạo đề xuất để Chủ tọa kiểm tra, không hỗ trợ phân công tự động.*

Nguồn: `Chapter4/chapter4.tex`, dòng 248–275; `Chapter5/chapter5.tex`, dòng 19–21.

### Cụm C — AI hỗ trợ

**Submission Autofill**<br>
Tiêu đề F1 98,20% · Từ khóa F1 92,77% · Hoàn tất trường bắt buộc 86,93%.

**Reviewer Initial Analysis**<br>
Trích dẫn bám nguồn 96,22% · Truthfulness của điểm cần lưu ý 69,86%.

**Chair Decision Copilot**<br>
Truthfulness của cơ sở bằng chứng 87,34% · Tổng hợp bất đồng 87,11%.

**Review Quality Auditor — tín hiệu cảnh báo**<br>
Chỉ 46,99% phát hiện đồng thời bám nguồn và hợp lệ.

Chú thích bắt buộc: *TCA là phép chấm tự động mang tính thăm dò, chưa được hiệu chuẩn bằng nhãn chuyên gia; các chỉ số không đo độ đúng của quyết định học thuật.*

Nguồn: `Chapter4/chapter4.tex`, dòng 289, 304, 317–330; `Chapter5/chapter5.tex`, dòng 29–35.

### Cụm D — Chatbot và UAT

**37/40 hội thoại đạt hoặc đạt một phần**<br>
25 đạt, 12 đạt một phần, 3 không đạt; 97/128 lượt gọi công cụ thành công.

**73/91 người tham gia sẵn sàng giới thiệu nền tảng**

Chú thích bắt buộc: *Kết quả hội thoại là rà soát thủ công hồi cứu; UAT là bằng chứng cảm nhận và chịu ảnh hưởng lớn từ nhóm Tác giả.*

Nguồn: `Chapter4/chapter4.tex`, phần Chatbot Agent và dòng 403–424; `Chapter5/chapter5.tex`, dòng 37 và 83.

## 8. Kết luận ngắn trên poster

### Câu kết luận chính

**ConferenceSpace đã triển khai được nền tảng xét duyệt cùng mô hình ba lớp trách nhiệm và chuỗi bằng chứng riêng cho từng tác vụ; các kết quả cho thấy tính khả thi trong điều kiện thử nghiệm, đồng thời xác định rõ nơi con người vẫn phải kiểm tra và quyết định.**

### Ba đóng góp

1. Tích hợp các nghiệp vụ chính của vòng đời xét duyệt trong cùng trạng thái và quyền hạn.
2. Phân tách rõ nghiệp vụ, thuật toán xác định và AI hỗ trợ theo loại đầu ra và chủ thể chịu trách nhiệm.
3. Xây dựng chuỗi đánh giá theo từng lớp, trình bày riêng kết quả, lỗi và khoảng trống bằng chứng.

Nguồn: `Chapter1/chapter1.tex`, dòng 53; `Chapter5/chapter5.tex`, phần kết luận.

## 9. Giới hạn phải xuất hiện

Chỉ giữ bốn ý sau trên poster:

- Đối sánh được đánh giá trên dữ liệu tổng hợp và chưa có nhãn phân công do Chủ tọa xác nhận.
- Một số đầu ra AI chưa có nhãn chuyên gia; TCA/NLI chỉ cung cấp chỉ số gián tiếp.
- Tập AI chủ yếu gồm bài tiếng Anh; chưa xác nhận trên bài tiếng Việt và nhiều chính sách hội nghị.
- UAT mất cân bằng vai trò; dữ liệu Chủ tọa trong báo cáo tổng hợp chưa thể tái lập độc lập từ bản ghi thô hiện có.

Dòng kết: **Nền tảng hiện ở quy mô thực nghiệm, chưa phải bằng chứng sẵn sàng vận hành thực tế.**

Nguồn: `Chapter4/chapter4.tex`, dòng 403 và 459–463; `Chapter5/chapter5.tex`, phần “Các hạn chế”.

## 10. Hình ảnh được chọn

### Hình sản phẩm chính

1. **Tác giả — Autofill:** `images/chapter_3_uc02_autofill_1.png`<br>
   Cắt vùng hộp thoại “Autofill with submission”, giữ thao tác tải bản thảo và nút tạo bản nháp.

2. **Phản biện viên — Initial Analysis:** `images/chapter_3_uc05_reviewer_initial_analysis.png`<br>
   Cắt vùng bản thảo và “Submission Analysis” để thể hiện đối chiếu nguồn.

3. **Chủ tọa — Reviewer Suggestions:** `images/chapter_3_uc06_assignment_suggestions.png`<br>
   Cắt vùng danh sách ứng viên, điểm phù hợp và chủ đề chung.

4. **Chủ tọa — Decision Support:** `images/chapter_3_uc09_decision_support.png`<br>
   Chỉ dùng nếu còn diện tích; cắt vùng “Decision Advisory” và cột quyết định để làm rõ AI tổng hợp, Chủ tọa quyết định.

### Hình không nên dùng nguyên trạng

- `fig09c_review_quality_auditor.png`: giá trị trên hình khác phần văn bản đã khóa (45,6% so với 46,99%; 57,1% so với 58,28%; 70,4% so với 71,04%).
- `fig08_autofill_quality.png`: hình thể hiện Exact Match tiêu đề 91,2%, trong khi luận điểm chính của văn bản dùng F1 theo token của tiêu đề 98,20%; hai chỉ số khác nhau và dễ gây hiểu nhầm nếu đặt cạnh nhau.
- Các biểu đồ AI nhiều chú giải và chữ nhỏ không phù hợp để thu nhỏ trên A0.

Quyết định: vẽ lại các biểu đồ nhỏ từ số liệu trong văn bản Chương 4/5, giữ nguồn ảnh gốc chỉ cho giao diện sản phẩm.

## 11. Hệ màu và kiểu chữ theo frontend

### Màu chính

- Navy 900 / primary: `#1B3C53`
- Navy 800 / secondary: `#234C6A`
- Navy 700 / accent: `#456882`
- Background: `#F8FAFC`
- Card: `#FFFFFF`
- Foreground: `#141414`
- Muted: `#E3E3E3`
- Muted text: `#64748B`
- Border: `#DBDBDB`
- Success: `#16A34A`
- Warning dùng hạn chế: `#F59E0B`
- Risk dùng hạn chế: `#DC2626`

### Kiểu chữ

- Tiêu đề và tiêu đề mục: Merriweather, đậm.
- Nội dung, số liệu và chú thích: Inter.
- Không dùng gradient tím hoặc màu trang trí ngoài hệ màu sản phẩm.

Nguồn: `frontend/app/globals.css` và `frontend/app/layout.tsx`.

## 12. Phân bổ nội dung trên A0 ngang

### Dải đầu — khoảng 16% chiều cao

Logo Trường và Khoa | tên đề tài | ConferenceSpace | thành viên và giảng viên hướng dẫn.

### Thân trái — khoảng 26% chiều rộng

- Vấn đề và mục tiêu.
- Mô hình ba lớp trách nhiệm.
- Dòng “con người giữ quyền quyết định”.

### Thân giữa — khoảng 43% chiều rộng

- Vòng đời theo ba vai trò.
- Ba ảnh giao diện sản phẩm.
- Dải thiết lập đánh giá gồm bốn thẻ.

### Thân phải — khoảng 31% chiều rộng

- Bốn cụm kết quả: nghiệp vụ, thuật toán, AI, Chatbot/UAT.
- Một thẻ cảnh báo nổi bật cho Review Quality Auditor 46,99%.

### Dải cuối — khoảng 15% chiều cao

- Kết luận và ba đóng góp.
- Bốn giới hạn.
- Mã QR nếu nhóm cung cấp liên kết demo hoặc repository; không tự thêm nguồn mới.

## 13. Nhịp thuyết trình 15 phút bám poster

- 0:00–1:30 — vấn đề và mục tiêu.
- 1:30–4:00 — mô hình ba lớp và ranh giới trách nhiệm.
- 4:00–7:00 — sản phẩm theo Tác giả, Phản biện viên, Chủ tọa.
- 7:00–8:30 — thiết lập đánh giá và dữ liệu.
- 8:30–12:30 — bốn cụm kết quả; nhấn cả kết quả tốt và cảnh báo 46,99%.
- 12:30–14:00 — giới hạn và lý do chưa overclaim.
- 14:00–15:00 — kết luận, ba đóng góp và chuyển sang phần hỏi đáp.

## 14. Các xung đột nội bộ đã xử lý

### Review Quality Auditor

Chương 3 mô tả phát hiện `blocking` có thể chặn gửi và chưa có cơ chế ghi đè (`Chapter3/chapter3.tex`, dòng 296, 537, 543, 595). Chương 4 và Chương 5 mô tả `blocking`/`block` chỉ làm nổi bật mức nghiêm trọng và không ngăn gửi (`Chapter4/chapter4.tex`, dòng 317 và 459; `Chapter5/chapter5.tex`, dòng 33 và 67).

Quyết định cho poster: không mô tả cơ chế chặn. Chỉ dùng tuyên bố nhất quán và an toàn hơn: **Review Quality Auditor hiển thị các điểm cần kiểm tra; Phản biện viên chịu trách nhiệm đối với bản phản biện cuối cùng.**

### Các biểu đồ cũ và văn bản kết luận

Khi số trên hình khác số trong phần văn bản tổng hợp của Chương 4/5, poster dùng số trong văn bản kết luận và vẽ lại biểu đồ. Không tái sử dụng hình gây xung đột số liệu.

## 15. Checklist khóa trước khi dựng poster

- [ ] Mỗi con số trên poster có tên chỉ số, cỡ mẫu và phạm vi kết luận.
- [ ] Không gọi Hit@10 hoặc MRR là “độ chính xác phân công phản biện viên”.
- [ ] Không gọi TCA Truthfulness là “độ chính xác quyết định”.
- [ ] Không mô tả Review Quality Auditor là cơ chế chặn gửi.
- [ ] Không dùng UAT để khẳng định tiết kiệm thời gian thực tế.
- [ ] Giữ nguyên tên, MSSV và học hàm/học vị theo `Title/title.tex`.
- [ ] Dùng đúng màu và font từ frontend.
- [ ] Xuất đúng A0 ngang 1189 × 841 mm và kiểm tra bản PDF ở kích thước thật.

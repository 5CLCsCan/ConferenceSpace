# 2.1 Khảo Sát Nhu Cầu Người Dùng

## 2.1.1 Mục tiêu và phương pháp khảo sát

Để xác định các yêu cầu thực tế từ người dùng trước và trong quá trình xây dựng hệ thống, nhóm nghiên cứu tiến hành khảo sát đối tượng người dùng tiềm năng là sinh viên đại học và các thành viên cộng đồng học thuật. Khảo sát được thiết kế theo hai giai đoạn:

- **Giai đoạn 1 — Trước phát triển**: Thu thập kỳ vọng, nhu cầu và điểm khó khăn khi tham gia hội nghị học thuật.
- **Giai đoạn 2 — Sau UAT (User Acceptance Testing)**: Đánh giá mức độ đáp ứng yêu cầu thực tế của hệ thống ConferenceSpace qua bảng khảo sát mức độ hài lòng.

Công cụ thu thập: **Google Forms**. Dữ liệu phản hồi được lưu trữ dưới dạng bảng tính và xử lý thống kê bằng Python (openpyxl).

---

## 2.1.2 Đối tượng và phạm vi khảo sát

| Vai trò | Số lượng phản hồi | Thời gian sử dụng hệ thống trước khi trả lời |
|---------|-------------------|----------------------------------------------|
| **Tác giả (Author)** | **76 người** | Đa số từ 5–10 phút, một số trên 11–20 phút |
| **Người phản biện (Reviewer)** | **7 người** | Chủ yếu 5–10 phút |
| **Chủ tọa (Chair)** | **6 người** | Từ dưới 5 phút đến hơn 20 phút |
| **Tổng** | **89 người** | — |

Phần lớn người tham gia (> 70%) đã từng sử dụng ít nhất một hệ thống quản lý hội nghị hoặc nộp bài học thuật trước đó, cho thấy đây là nhóm người dùng có nền tảng so sánh tốt.

---

## 2.1.3 Kết quả khảo sát — Vai trò Tác giả (n = 76)

### Các tính năng đã sử dụng

Người dùng được hỏi họ đã thử những phần nào trong vai trò Tác giả. Kết quả cho thấy các chức năng nộp bài cốt lõi được sử dụng rộng rãi nhất:

| Tính năng | Tỉ lệ người dùng thử |
|-----------|----------------------|
| Nhập thông tin bài báo, tác giả, từ khóa, track | ~95% |
| Tải tệp bản thảo | ~90% |
| Tìm hội nghị phù hợp để nộp bài | ~80% |
| Xem thông tin hội nghị, CFP, ngày quan trọng | ~85% |
| Khai báo xung đột lợi ích | ~75% |
| Xem lại thông tin trước khi gửi | ~70% |
| Theo dõi trạng thái bài nộp | ~60% |
| Tính năng AI (autofill, gợi ý track, precheck) | ~65% |

### Mức độ hài lòng tổng thể

| Mức | Số người | Tỉ lệ |
|-----|----------|-------|
| 5 — Rất hài lòng | 2 | 3% |
| 4 — Hài lòng | 65 | **86%** |
| 3 — Bình thường | 8 | 11% |
| 2 — Không hài lòng | 1 | 1% |

**Điểm hài lòng trung bình: 3,89 / 5,00**

### Hài lòng theo từng khía cạnh

| Khía cạnh | Điểm TB (1–5) |
|-----------|--------------|
| Tính năng AI (autofill/track/precheck) | **3,92** |
| Tải và kiểm tra bản thảo | 3,88 |
| Theo dõi trạng thái bài nộp | 3,82 |
| Xem tổng quan hội nghị | 3,84 |
| Tìm hội nghị phù hợp | 3,78 |
| Nhập thông tin bài báo | 3,71 |
| Xem lại trước khi gửi | 3,32 |
| Khai báo xung đột lợi ích | **3,07** ← điểm thấp nhất |

### Tính năng hữu ích nhất (theo đánh giá người dùng)

| Tính năng | Số lượt chọn |
|-----------|-------------|
| **AI tự động điền (Autofill)** | **47** |
| AI gợi ý track | 11 |
| AI kiểm tra trước (Precheck) | 9 |
| Biểu mẫu nộp bài | 2 |
| Xem danh sách hội nghị | 2 |
| Tải tệp bản thảo | 2 |

### Tính năng cần cải thiện nhất

| Tính năng | Số lượt chọn |
|-----------|-------------|
| **AI tự động điền** | **30** |
| Khai báo xung đột lợi ích (COI) | 19 |
| AI gợi ý track | 10 |
| Trang chi tiết hội nghị | 5 |
| AI kiểm tra trước | 5 |

> **Nhận xét**: Tính năng AI Autofill đồng thời là tính năng hữu ích nhất VÀ cần cải thiện nhất — phản ánh kỳ vọng cao của người dùng với AI, đồng thời cho thấy kết quả autofill chưa luôn chính xác hoàn toàn.

### Lý do không thoải mái (57,9% người dùng có phần không thoải mái)

| Lý do | Số người |
|-------|----------|
| Lo ngại gợi ý AI sai | **32** |
| Đánh giá học thuật là vấn đề nhạy cảm | 20 |
| AI đưa ra phản hồi quá mạnh hoặc gây áp lực | 16 |
| Quá nhiều trường bắt buộc | 1 |
| Khác | 4 |

### Sẵn sàng giới thiệu hệ thống

| Mức độ | Số người | Tỉ lệ |
|--------|----------|-------|
| Chắc chắn có | 21 | 28% |
| Có lẽ có | 41 | 54% |
| Không chắc | 13 | 17% |
| Chắc chắn không | 1 | 1% |

**→ 82% sẵn sàng giới thiệu hệ thống cho bạn bè/đồng nghiệp.**

---

## 2.1.4 Kết quả khảo sát — Vai trò Người phản biện (n = 7)

### Mức độ hài lòng tổng thể

| Mức | Số người | Tỉ lệ |
|-----|----------|-------|
| 5 — Rất hài lòng | 2 | **29%** |
| 4 — Hài lòng | 5 | **71%** |

**Điểm hài lòng trung bình: 4,29 / 5,00** — cao hơn đáng kể so với vai trò Tác giả.

### Hài lòng theo từng tính năng phản biện

| Tính năng | Điểm TB (1–5) |
|-----------|--------------|
| Đọc tóm tắt, metadata và thông tin hỗ trợ | **4,57** |
| Hiểu trách nhiệm từ lời mời | 4,29 |
| Xem thông tin bài được phân công | 4,29 |
| Nhập điểm theo tiêu chí | 4,14 |
| Chọn khuyến nghị và mức tự tin | 4,14 |
| AI kiểm tra bài phản biện | 4,14 |
| Nhập phản hồi văn bản | 4,00 |
| Lưu bản nháp và gửi phản biện | 4,00 |

### Tính năng cần cải thiện nhất

| Tính năng | Số lượt chọn |
|-----------|-------------|
| AI kiểm tra bài phản biện | 3 |
| Biểu mẫu nhập điểm | 2 |
| Gửi bài phản biện | 1 |
| Phản hồi bằng văn bản | 1 |

**→ 86% sẵn sàng giới thiệu hệ thống.**

---

## 2.1.5 Kết quả khảo sát — Vai trò Chủ tọa (n = 6)

Do số lượng mẫu hạn chế (n = 6) và tỉ lệ hoàn thành đầy đủ thấp, kết quả của nhóm này chỉ mang tính tham khảo định tính.

Các tính năng Chủ tọa sử dụng nhiều nhất:
- Theo dõi tổng quan dashboard
- Tạo hội nghị từ template
- Theo dõi tiến độ phản biện
- Xem gợi ý người phản biện và điểm phù hợp
- Kiểm tra thông tin xung đột lợi ích

**Điểm hài lòng (người dùng hoàn thành đầy đủ): 4,0 / 5,0**

---

## 2.1.6 Tổng hợp nhu cầu người dùng

Dựa trên kết quả khảo sát, nhóm xác định các nhu cầu cốt lõi sau:

| STT | Nhu cầu | Mức độ ưu tiên |
|-----|---------|---------------|
| 1 | Quy trình nộp bài trực quan, hướng dẫn từng bước | Cao |
| 2 | AI hỗ trợ giảm thao tác thủ công (autofill, track suggestion) | Cao |
| 3 | AI phải **minh bạch** và dễ bỏ qua — không gây áp lực | Cao |
| 4 | Giao diện phản biện rõ ràng, hỗ trợ nhiều tiêu chí | Cao |
| 5 | Công cụ phát hiện COI đáng tin cậy | Trung bình–Cao |
| 6 | Cải thiện bước khai báo xung đột lợi ích (COI) cho tác giả | Trung bình |
| 7 | Giải thích AI rõ ràng hơn (lý do, bằng chứng) | Trung bình |
| 8 | Thông báo lỗi dễ hiểu và tốc độ phản hồi nhanh hơn | Trung bình |

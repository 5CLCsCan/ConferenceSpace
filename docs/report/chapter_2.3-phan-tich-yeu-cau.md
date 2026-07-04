# 2.3 Phân Tích Yêu Cầu Người Dùng

## 2.3.1 Các vai trò người dùng (Actors)

Dựa trên kết quả khảo sát (mục 2.1) và nghiên cứu hệ thống tương tự (mục 2.2), hệ thống ConferenceSpace xác định ba vai trò người dùng chính:

| Vai trò | Mô tả | Mục tiêu chính |
|---------|-------|---------------|
| **Tác giả (Author)** | Nhà nghiên cứu muốn nộp bài báo đến hội nghị | Tìm hội nghị phù hợp, nộp bài nhanh chóng, theo dõi kết quả |
| **Người phản biện (Reviewer)** | Chuyên gia được mời đánh giá bài báo | Xem bài được phân công, viết phản biện chất lượng |
| **Chủ tọa (Chair)** | Người tổ chức và điều hành hội nghị | Quản lý toàn bộ vòng đời hội nghị, đưa ra quyết định |

---

## 2.3.2 Yêu cầu chức năng

### 2.3.2.1 Nhóm: Xác thực và Tài khoản

| Mã | Tên chức năng | Mô tả | Vai trò |
|----|---------------|-------|---------|
| F-AUTH-01 | Đăng ký tài khoản | Đăng ký với email, tên, mật khẩu, lĩnh vực chuyên môn | Tất cả |
| F-AUTH-02 | Đăng nhập | Xác thực email/mật khẩu, hỗ trợ "Remember me" | Tất cả |
| F-AUTH-03 | Xác thực email | Xác nhận email trước khi sử dụng đầy đủ | Tất cả |
| F-AUTH-04 | Đặt lại mật khẩu | Gửi link reset qua email | Tất cả |
| F-AUTH-05 | Cập nhật hồ sơ | Chỉnh sửa tên, domain, liên kết Semantic Scholar | Tất cả |

### 2.3.2.2 Nhóm: Tác giả — Tìm kiếm và Nộp bài

| Mã | Tên chức năng | Mô tả |
|----|---------------|-------|
| F-SUB-01 | Tìm kiếm hội nghị | Tìm, lọc và đánh dấu hội nghị phù hợp |
| F-SUB-02 | Xem chi tiết hội nghị | Xem CFP, ngày quan trọng, ban tổ chức, tracks |
| F-SUB-03 | Nộp bài mới | Quy trình nhiều bước: thông tin → tệp → COI → xem lại → gửi |
| F-SUB-04 | Lưu bản nháp | Lưu bài nộp ở trạng thái draft để tiếp tục sau |
| F-SUB-05 | Chỉnh sửa bài nộp | Sửa bài trước deadline |
| F-SUB-06 | Rút bài | Rút bài trước khi được phân công phản biện |
| F-SUB-07 | Theo dõi trạng thái | Xem trạng thái hiện tại của bài nộp |
| F-SUB-08 | Xem phản biện | Xem nhận xét phản biện sau khi được công bố |
| F-SUB-09 | Gửi rebuttal | Soạn và gửi phản hồi trong giai đoạn rebuttal |
| F-SUB-10 | Nộp camera-ready | Tải bản thảo cuối sau khi bài được chấp nhận |

### 2.3.2.3 Nhóm: Người phản biện

| Mã | Tên chức năng | Mô tả |
|----|---------------|-------|
| F-REV-01 | Xử lý lời mời | Chấp nhận hoặc từ chối lời mời phản biện |
| F-REV-02 | Xem danh sách phân công | Xem các bài báo được phân công |
| F-REV-03 | Xem chi tiết bài báo | Đọc tiêu đề, tóm tắt, từ khóa, tệp đính kèm |
| F-REV-04 | Nhập phản biện | Nhập điểm tiêu chí, khuyến nghị, mức tự tin, nhận xét |
| F-REV-05 | Lưu nháp phản biện | Lưu bản nháp để tiếp tục sau |
| F-REV-06 | Gửi phản biện | Gửi bài phản biện chính thức |
| F-REV-07 | Xem rebuttal | Đọc phản hồi tác giả trong giai đoạn rebuttal |

### 2.3.2.4 Nhóm: Chủ tọa — Quản lý hội nghị

| Mã | Tên chức năng | Mô tả |
|----|---------------|-------|
| F-CONF-01 | Tạo hội nghị | Tạo qua wizard 6 bước: Basic → CFP → Tracks → Committee → Dates → Review |
| F-CONF-02 | Tạo từ template | Tạo hội nghị nhanh từ template có sẵn |
| F-CONF-03 | Chỉnh sửa hội nghị | Cập nhật cấu hình sau khi tạo |
| F-CONF-04 | Quản lý trạng thái | Chuyển trạng thái: `draft` → `open` → `under_review` → `decision` → `closed` |
| F-CONF-05 | Quản lý deadline | Thiết lập submission deadline, review deadline, notification date, camera-ready |
| F-CONF-06 | Quản lý track | Thêm/sửa/xóa chủ đề (track) |
| F-CONF-07 | Mời ban tổ chức | Mời co-chair, PC member qua email |
| F-CONF-08 | Dashboard | Thống kê: số bài nộp, tiến độ phản biện, phân phối track |
| F-CONF-09 | Quản lý template | Tạo và quản lý template cấu hình |

### 2.3.2.5 Nhóm: Chủ tọa — Phân công Phản biện

| Mã | Tên chức năng | Mô tả |
|----|---------------|-------|
| F-ASSIGN-01 | Xem gợi ý reviewer | Danh sách reviewer + điểm phù hợp AI (similarity score) |
| F-ASSIGN-02 | Kiểm tra COI | Xem thông tin xung đột lợi ích giữa reviewer và tác giả |
| F-ASSIGN-03 | Phân công thủ công | Chủ tọa chọn reviewer cho từng bài |
| F-ASSIGN-04 | Theo dõi tiến độ | Xem tiến độ hoàn thành phản biện |
| F-ASSIGN-05 | Mời reviewer ngoài | Gửi lời mời đến người chưa có tài khoản qua email |

### 2.3.2.6 Nhóm: AI Hỗ trợ

| Mã | Tên chức năng | Vai trò hưởng lợi | Mô tả |
|----|---------------|------------------|-------|
| F-AI-01 | Autofill bài báo | Tác giả | AI trích xuất tiêu đề, tóm tắt, từ khóa từ PDF |
| F-AI-02 | Gợi ý track | Tác giả | AI gợi ý track phù hợp từ tiêu đề/tóm tắt |
| F-AI-03 | AI Precheck | Tác giả | Kiểm tra trước chất lượng bài nộp |
| F-AI-04 | Gợi ý reviewer | Chủ tọa | Gợi ý reviewer dựa trên tương đồng chuyên môn |
| F-AI-05 | Phát hiện COI | Chủ tọa | Tự động phát hiện quan hệ đồng tác giả qua Neo4j |
| F-AI-06 | AI Review Checker | Người phản biện | Kiểm tra chất lượng bài phản biện |
| F-AI-07 | AI Decision Copilot | Chủ tọa | Tổng hợp phản biện, đề xuất quyết định accept/reject |
| F-AI-08 | Chatbot | Tất cả | Trả lời câu hỏi về hội nghị và hệ thống |

### 2.3.2.7 Nhóm: Thông báo

| Mã | Tên chức năng | Mô tả |
|----|---------------|-------|
| F-NOTIF-01 | Thông báo realtime | Thông báo tức thì qua WebSocket |
| F-NOTIF-02 | Thông báo trong app | Danh sách thông báo đọc/chưa đọc |
| F-NOTIF-03 | Tuỳ chỉnh thông báo | Người dùng chọn loại thông báo muốn nhận |

---

## 2.3.3 Yêu cầu phi chức năng

### 2.3.3.1 Hiệu năng

| Yêu cầu | Ngưỡng | Cơ sở |
|---------|--------|-------|
| Thời gian phản hồi API thông thường | ≤ 2 giây | Trải nghiệm người dùng chấp nhận được |
| Thời gian phản hồi AI | ≤ 10 giây | Phức tạp hơn, chấp nhận chờ |
| Tải đồng thời | ≥ 100 người dùng | Phù hợp quy mô hội nghị trường đại học |
| Upload tệp PDF | ≤ 30 MB | Kích thước tệp bài báo thực tế |

### 2.3.3.2 Bảo mật

- Toàn bộ giao tiếp qua **HTTPS/TLS**
- Xác thực bằng **JWT** — stateless, hỗ trợ scale ngang
- Phân quyền **RBAC** (Role-Based Access Control) theo từng endpoint
- Mật khẩu lưu dạng hash **bcrypt** (không lưu plaintext)
- Ngăn chặn: SQL Injection, XSS, CSRF, CORS không hợp lệ

### 2.3.3.3 Khả năng sử dụng (Usability)

Dựa trực tiếp vào khảo sát người dùng (mục 2.1):

- Giao diện phân tách rõ theo **vai trò** — mỗi vai trò chỉ thấy chức năng liên quan
- Quy trình nộp bài hoàn thành trong **< 15 phút** với người mới
- **AI là hỗ trợ, không phải quyết định** — người dùng luôn có thể bỏ qua hoặc override
- Thông báo lỗi **rõ ràng, chỉ rõ nguyên nhân** (không chỉ nói "lỗi")
- Tất cả thao tác có thể **quay lại bước trước** (undo hoặc wizard navigation)
- Ngôn ngữ UI **phù hợp sinh viên** — tránh thuật ngữ quá chuyên sâu

### 2.3.3.4 Khả năng bảo trì

- Codebase theo **Clean Architecture** — tách biệt Controller/Service/Storage
- API tài liệu hóa bằng **Swagger/OpenAPI 3.0**
- Thay đổi schema qua **migration files** có thể rollback
- **Unit test** và **integration test** cho các luồng nghiệp vụ chính
- Logging đầy đủ cho debug và monitoring

### 2.3.3.5 Khả năng mở rộng

- Thêm vai trò mới (co-chair, PC member) **không cần thay đổi schema cốt lõi**
- AI services là **module độc lập** — có thể thay thế model mà không ảnh hưởng business logic
- Cơ sở dữ liệu kép (PostgreSQL + Neo4j) **scale độc lập**
- Thiết kế **stateless backend** — hỗ trợ horizontal scaling

### 2.3.3.6 Tính sẵn sàng và Triển khai

- Triển khai bằng **Docker Compose** (development + staging)
- **CI/CD** tự động qua GitHub Actions
- Cấu hình qua **environment variables** — không hard-code
- Health check endpoint `/health` để monitoring

---

## 2.3.4 Các ràng buộc hệ thống

| Loại ràng buộc | Nội dung |
|---------------|---------|
| **Công nghệ** | Backend viết bằng Go; Frontend dùng Next.js — không đổi nền tảng cốt lõi |
| **Cơ sở dữ liệu** | PostgreSQL cho relational data; Neo4j cho graph COI |
| **AI** | Sử dụng Gemini API (Google) làm AI chính; OpenRouter cho chatbot |
| **Ngân sách** | Ưu tiên giải pháp miễn phí hoặc chi phí thấp |
| **Thời gian** | Phạm vi đồ án học kỳ — tập trung vào MVP đầy đủ tính năng |
| **Người dùng mục tiêu** | Sinh viên và nhà nghiên cứu — ưu tiên đơn giản hơn phức tạp |

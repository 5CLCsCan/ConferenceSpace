# Kế hoạch merge Chương 3 và Chương 4

Ngày cập nhật: 2026-07-08

## 1. Quyết định cấu trúc

Chương 3 và Chương 4 nên được gộp thành một chương mới: **Chương 3. Xây dựng hệ thống**.

Lý do chính là nội dung của hai chương hiện tại có quan hệ phụ thuộc trực tiếp. Chương 3 trình bày use case, kiến trúc, dữ liệu, AI và triển khai ở mức thiết kế; Chương 4 giải thích công nghệ dùng để hiện thực hóa chính các quyết định đó. Nếu giữ tách riêng, báo cáo dễ bị lặp ở các phần backend, database, AI service, deployment, proxy và CI/CD. Nếu merge, mạch lập luận trở nên rõ hơn: từ nhu cầu và yêu cầu ở Chương 2, báo cáo đi thẳng vào cách hệ thống được xây dựng, sau đó Chương 4 mới đánh giá hệ thống bằng thực nghiệm.

Sau merge, cấu trúc báo cáo mục tiêu là:

| Chương | Vai trò |
|---|---|
| Chương 1. Mở đầu | Đặt vấn đề, mục tiêu, phạm vi và narrative chính |
| Chương 2. Khảo sát nhu cầu, hiện trạng và khoảng trống nghiên cứu | Cơ sở yêu cầu và nguyên tắc thiết kế |
| Chương 3. Xây dựng hệ thống | Use case, thiết kế kỹ thuật, cơ chế non-AI, workflow AI và triển khai |
| Chương 4. Thiết lập thực nghiệm và đánh giá hệ thống | Evidence chain: backend, thuật toán xác định, AI benchmark, vận hành và UAT |
| Chương 5. Kết luận | Kết quả, hạn chế và hướng phát triển |

## 2. Outline Chương 3 sau merge

### 3.1. Tổng quan hệ thống

Mục này giới thiệu mục tiêu xây dựng hệ thống, các nhóm người dùng, mô hình phân lớp và nguyên tắc thiết kế. Công nghệ chỉ nên được tóm tắt ở mức bản đồ tổng quan, không biến phần mở đầu thành danh sách công cụ.

### 3.2. Use Case

Mục này giữ vai trò nối Chương 2 với thiết kế. Các use case phải thể hiện rõ ai dùng hệ thống, thao tác gì, đầu vào/đầu ra là gì, và điểm kiểm soát nằm ở đâu. Các use case trọng tâm gồm nộp bài với Submission Autofill, phân công phản biện có kiểm tra COI, reviewer workflow và Chair Decision Copilot.

### 3.3. Thiết kế kỹ thuật

Mục này trình bày kiến trúc tổng thể, frontend, backend, API, phân quyền, thiết kế dữ liệu và luồng xử lý hệ thống. Các công nghệ từ Chương 4 cũ sẽ được đưa vào đúng ngữ cảnh thiết kế:

| Nội dung Chương 4 cũ | Vị trí mới |
|---|---|
| Next.js, React, TypeScript, Radix UI, Tailwind CSS | 3.3.2. Thiết kế frontend và trải nghiệm theo vai trò |
| Go, Gin, JWT, API contract, WebSocket | 3.3.3. Thiết kế backend, API và phân quyền |
| PostgreSQL, Neo4j, Redis, file storage | 3.3.4. Thiết kế dữ liệu |

### 3.4. Cơ chế xử lý không sử dụng AI

Đây là section mới và cần thiết. Reviewer matching, COI và một số workflow nghiệp vụ có tính thuật toán hoặc rule-based, nhưng không phải workflow AI sinh nội dung. Đưa chúng vào section riêng giúp báo cáo tránh ba lỗi:

1. Làm mờ ranh giới giữa thuật toán xác định và AI.
2. Khiến hội đồng hiểu nhầm reviewer matching hoặc COI là generative AI.
3. Gây khó cho Chương 4 mới, vì cách đánh giá thuật toán xác định khác với benchmark workflow AI.

Nội dung nên gồm:

| Mục | Vai trò |
|---|---|
| 3.4.1. Vai trò của các cơ chế xác định | Định nghĩa lớp non-AI trong hệ thống |
| 3.4.2. Reviewer matching | Giải thích matching, scoring, load/ràng buộc và giới hạn |
| 3.4.3. Phát hiện xung đột lợi ích | Giải thích self-author, declared COI, co-author graph, severity và evidence |
| 3.4.4. Các cơ chế nghiệp vụ hỗ trợ vận hành | RBAC theo hội nghị, notification, rebuttal, discussion, audit event |

Section này nên đứng **sau Thiết kế kỹ thuật và trước Giải pháp AI**. Đây là vị trí tốt nhất vì người đọc đã hiểu kiến trúc/dữ liệu, nhưng chưa bước sang các workflow AI. Về mặt narrative, section này chứng minh hệ thống có nền tảng nghiệp vụ và thuật toán đủ vững, AI chỉ là lớp hỗ trợ thêm chứ không phải lõi duy nhất của sản phẩm.

### 3.5. Giải pháp AI

Mục này giữ nội dung AI nhưng cần cập nhật để không gánh những phần non-AI. Nội dung nên tập trung vào vai trò AI, các workflow AI, AI service, model router, structured output, Semantic Scholar integration và giới hạn của AI.

Lưu ý bắt buộc: toàn bộ thao tác LLM trong hệ thống dùng `gemini-3.1-flash-lite`, kể cả khi gọi qua OpenRouter hoặc model router của nhóm bằng OpenAI-compatible client.

### 3.6. Môi trường triển khai và vận hành

Mục này nhận phần triển khai từ Chương 4 cũ, nhưng cần trình bày như bằng chứng hệ thống có thể vận hành thực tế. Nội dung nên gồm Docker Compose, container images, cấu hình server, Caddy reverse proxy, HTTPS, GitHub Actions, GHCR, network isolation, volumes và secret management.

Không nên paste toàn bộ `docker-compose.prod.yml` hoặc `.github/workflows/deploy.yml` vào thân chương. Cách tốt hơn là dùng bảng, snippet ngắn và anchor hình cho team chèn screenshot GitHub Actions/GHCR.

### 3.7. Tổng kết chương

Mục này cần đóng vai trò cầu nối sang Chương 4 mới. Kết luận không chỉ nói hệ thống đã được xây dựng, mà phải chỉ ra các claim nào sẽ được đánh giá:

- lớp nghiệp vụ cốt lõi được đánh giá bằng backend/system benchmark;
- reviewer matching và COI được đánh giá như cơ chế xác định;
- workflow AI được đánh giá bằng benchmark riêng theo từng loại output;
- môi trường triển khai được dùng làm cơ sở phân tích khả thi vận hành.

## 3. Checklist khi merge nội dung thật

1. Cập nhật `outline_bao_cao.md` theo cấu trúc 5 chương.
2. Gộp nội dung `03-xay-dung-he-thong.md` và `04-cong-nghe.md` thành Chương 3 mới.
3. Di chuyển phần công nghệ vào đúng section thay vì giữ nguyên thứ tự Chương 4 cũ.
4. Tạo section `3.4. Cơ chế xử lý không sử dụng AI`.
5. Cập nhật toàn bộ tham chiếu từ "Chương 3 và Chương 4" thành "Chương 3".
6. Đổi Chương 5 hiện tại thành Chương 4 và Chương 6 thành Chương 5 ở outline, phần giới thiệu cấu trúc luận văn và các tham chiếu nội bộ.
7. Kiểm tra không còn mô tả reviewer matching/COI như workflow AI.
8. Kiểm tra `track_rankings` vẫn nằm trong Submission Autofill, không bị viết thành workflow độc lập.
9. Kiểm tra toàn bộ model LLM được ghi nhất quán là `gemini-3.1-flash-lite`.
10. Đọc lại Chương 3 sau merge theo vai trò reviewer hội đồng: có mạch từ use case đến thiết kế, non-AI, AI và deployment hay không.

## 4. Rủi ro cần kiểm soát

Rủi ro lớn nhất của việc merge là Chương 3 có thể trở nên quá dài hoặc giống tài liệu kỹ thuật nội bộ. Cách kiểm soát là chỉ giữ các chi tiết có vai trò bảo vệ luận điểm của đồ án: ranh giới trách nhiệm, dữ liệu, workflow, khả năng triển khai và khả năng đánh giá. Các file cấu hình đầy đủ nên được xem là evidence hoặc phụ lục, không đưa nguyên văn vào thân chương.

Rủi ro thứ hai là làm mất citation công nghệ từ Chương 4 cũ. Khi rewrite Chương 3, vẫn nên giữ citation cho các quyết định công nghệ quan trọng, nhưng citation phải xuất hiện tại đúng nơi công nghệ được dùng: Next.js ở frontend, Go/Gin ở backend, PostgreSQL/Neo4j/Redis ở dữ liệu, FastAPI/Pydantic/model ở AI service, Docker/Caddy/GitHub Actions ở triển khai.

Rủi ro thứ ba là làm mờ ranh giới AI. Section 3.4 cần được viết đủ rõ để người đọc thấy hệ thống không giao hết trách nhiệm cho AI. Đây cũng là nền để Chương 4 mới đánh giá lớp thuật toán xác định tách khỏi benchmark workflow AI.

## 5. Validation flow sau khi merge

Sau khi merge nội dung thật, cần chạy một vòng validation:

1. Đọc lại Chương 3 từ đầu đến cuối và kiểm tra mạch: tổng quan -> use case -> thiết kế kỹ thuật -> non-AI -> AI -> triển khai -> tổng kết.
2. Kiểm tra mọi claim kỹ thuật đều có evidence từ repo, cấu hình hoặc benchmark tương ứng.
3. Kiểm tra các thuật ngữ nhạy cảm: reviewer matching, COI, `track_rankings`, Submission Autofill, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Chair Decision Copilot, Chatbot Agent.
4. Kiểm tra không còn tham chiếu sai chương sau khi renumber.
5. Kiểm tra Chương 4 mới vẫn đánh giá đúng các lớp đã trình bày ở Chương 3.
6. Nếu Chương 3 quá dài, cắt phần giải thích công nghệ lặp lại trước; không cắt các sơ đồ kiến trúc, luồng xử lý hoặc nội dung phân biệt non-AI/AI.

# Validation loop sau rewrite Chương 3/4

Ngày kiểm tra: 2026-07-07

Phạm vi kiểm tra:

- `docs/report/compiled/final_combined/03-xay-dung-he-thong.md`
- `docs/report/compiled/final_combined/04-cong-nghe.md`

## 1. Kết quả kiểm tra tự động

| Tiêu chí | Kết quả |
|---|---|
| Không còn model cũ `gemini-2.x` hoặc `gemini-1.x` | Đạt |
| Model LLM mục tiêu là `gemini-3.1-flash-lite` | Đạt |
| Không mô tả reviewer matching/COI như workflow AI sinh nội dung | Đạt |
| `track_rankings` nằm trong Submission Autofill, không trôi thành workflow độc lập | Đạt |
| Không còn image placeholder dạng broken markdown link | Đạt |
| Số block Mermaid trong Chương 3/4 | 20 |
| Số citation/reference trong Chương 4 | 22 |

## 2. Đánh giá như reviewer hội đồng

### 2.1. Chương 3

Chương 3 hiện đã có mạch lập luận rõ hơn so với bản cũ. Phần mở đầu nối trực tiếp với Chương 1 và Chương 2, sau đó giải thích mô hình ba lớp: nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ. Đây là cấu trúc đúng để bảo vệ đề tài vì tránh lỗi thường gặp của các đồ án AI: đưa AI vào như một tính năng phụ mà không giải thích ranh giới trách nhiệm.

Các use case hiện tốt hơn vì không chỉ liệt kê chức năng. Mỗi use case trọng tâm đều thể hiện vấn đề cần giải quyết, đầu vào, đầu ra và điểm kiểm soát: tác giả kiểm tra Autofill, Chair xác nhận matching, reviewer vẫn đọc bài, Chair Decision Copilot không sinh quyết định. Reviewer matching và COI được đặt đúng trong lớp thuật toán xác định, có công thức Jaccard và giải thích fallback nhưng vẫn giữ COI là ràng buộc cứng.

Điểm mạnh nhất của chương là các sơ đồ Mermaid. Chúng làm nội dung kỹ thuật dễ tiếp thu hơn mà không cần biến báo cáo thành tài liệu code. Các sơ đồ cũng đóng vai trò anchor tốt cho việc xuất bản báo cáo hoặc thay bằng hình vẽ chính thức sau này.

Rủi ro còn lại: Chương 3 dài hơn mức tối ưu vì chứa nhiều sơ đồ và giải thích workflow. Tuy nhiên, độ dài này có thể chấp nhận được vì chương đang là phần thiết kế trung tâm của báo cáo. Nếu cần rút gọn ở bước biên tập cuối, nên cắt bớt diễn giải dưới sơ đồ, không cắt sơ đồ.

### 2.2. Chương 4

Chương 4 hiện đã chuyển từ mô tả công nghệ khô sang giải thích lựa chọn công nghệ theo nhu cầu hệ thống. Mỗi công nghệ chính đều có vai trò rõ: Next.js/React cho giao diện nhiều vai trò, Go/Gin cho backend nghiệp vụ, PostgreSQL cho dữ liệu bền vững, Neo4j cho graph COI, Redis cho state ngắn hạn, FastAPI/Pydantic cho workflow AI có schema, Docker Compose/Caddy/GitHub Actions cho vận hành.

Phần AI/ML đã được chỉnh đúng model: toàn bộ LLM dùng `gemini-3.1-flash-lite`. Chương không overclaim rằng model này chính xác nhất; thay vào đó chỉ nêu lý do phù hợp với phạm vi đồ án và để chất lượng workflow được kiểm chứng ở Chương 5. Đây là cách viết an toàn về mặt học thuật.

Citation đã đủ tốt cho một chương công nghệ: các claim về framework, database, model, routing, deployment và CI/CD đều có nguồn chính thức. Các citation hiện là tài liệu vendor/official docs, phù hợp hơn academic paper cho phần lựa chọn công nghệ.

Rủi ro còn lại: Chương 4 có một số đoạn code/config minh họa nhưng chưa đưa toàn bộ `docker-compose.prod.yml`, `.env.production.example` hoặc `.github/workflows/deploy.yml` vào thân chương. Đây là lựa chọn hợp lý để giữ văn phong học thuật; nếu hội đồng yêu cầu evidence đầy đủ, nên đưa full config vào phụ lục thay vì nhồi vào Chương 4.

## 3. Refinement đã thực hiện trong loop

- Giữ Mermaid diagram là visualization chính, không thay bằng placeholder ảnh.
- Loại bỏ markdown image placeholder để tránh render thành ảnh lỗi.
- Loại bỏ cách gọi `track_recommendation` dễ gây hiểu nhầm thành workflow độc lập; thay bằng “hỗ trợ gợi ý track trong ngữ cảnh nộp bài”.
- Khóa model ở `gemini-3.1-flash-lite` trong cả mô tả kiến trúc và cấu hình runtime.

## 4. Kết luận validation

Chương 3 và Chương 4 hiện đạt mức có thể đưa vào bản báo cáo tiếp theo. Hai chương đã align với Chương 1/2 về narrative: AI hỗ trợ chứ không thay thế, thuật toán xác định xử lý matching/COI, mọi quyết định học thuật vẫn thuộc về con người, và các công nghệ được chọn để phục vụ ranh giới đó. Bước tiếp theo nên là kiểm tra Chương 5 để bảo đảm các claim ở Chương 3/4 được đánh giá bằng số liệu và benchmark tương ứng.


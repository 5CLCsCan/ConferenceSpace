# Danh mục thuật ngữ và từ viết tắt

Danh mục này giải thích các thuật ngữ chuyên môn và từ viết tắt có vai trò quan trọng trong báo cáo ConferenceSpace.

## Thuật ngữ nghiệp vụ hội nghị

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| Chair | Chủ tọa / người điều phối hội nghị | Vai trò chịu trách nhiệm cấu hình hội nghị, theo dõi tiến độ, phân công phản biện và ra quyết định cuối cùng đối với bài nộp |
| Reviewer | Người phản biện | Người được phân công đọc bài, viết nhận xét, chấm điểm hoặc đưa ra khuyến nghị trong quy trình xét duyệt |
| Submission | Bài nộp | Bản thảo và metadata do tác giả gửi vào một hội nghị hoặc track cụ thể |
| CFP | Call for Papers | Lời mời nộp bài của hội nghị, thường mô tả phạm vi chủ đề, track, thời hạn và yêu cầu nộp bài |
| Rebuttal | Phản hồi của tác giả | Giai đoạn tác giả trả lời nhận xét của reviewer trước khi Chair ra quyết định cuối cùng |
| Camera-ready | Bản hoàn thiện sau chấp nhận | Phiên bản cuối của bài báo sau khi bài được chấp nhận và tác giả đã chỉnh sửa theo yêu cầu |
| Bidding | Đăng ký nguyện vọng phản biện | Cơ chế reviewer bày tỏ mức độ quan tâm hoặc phù hợp với các bài nộp trước khi phân công |
| Peer review | Phản biện học thuật | Quy trình chuyên gia đánh giá chất lượng, tính mới, độ đúng và mức phù hợp của bài báo khoa học |

## Thuật ngữ hệ thống và AI

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| AI | Artificial Intelligence | Nhóm chức năng hỗ trợ bằng mô hình trí tuệ nhân tạo trong hệ thống, không bao gồm các thuật toán xác định như reviewer matching |
| LLM | Large Language Model | Mô hình ngôn ngữ lớn dùng trong các workflow hỗ trợ nhập liệu, đọc bài, kiểm toán review, tổng hợp bằng chứng hoặc chatbot |
| Workflow AI | AI workflow | Luồng xử lý có dùng AI, có đầu vào, đầu ra, ràng buộc kiểm soát và tiêu chí đánh giá riêng |
| Artifact | - | Kết quả hoặc đối tượng kỹ thuật được tạo/lưu để đối chiếu, ví dụ output của workflow AI, metadata kiểm toán hoặc dữ liệu đã gắn fingerprint |
| Structured output | Đầu ra có cấu trúc | Đầu ra của model phải tuân theo schema hoặc field contract để backend có thể validate, lưu và hiển thị |
| Schema | Lược đồ dữ liệu | Đặc tả cấu trúc dữ liệu, kiểu field và ràng buộc validate cho request/response hoặc artifact |
| Contract | Hợp đồng dữ liệu / hành vi | Quy ước bắt buộc giữa các thành phần hệ thống, ví dụ output contract, API contract hoặc tool-call contract |
| Guardrail | Ràng buộc kiểm soát | Quy tắc giới hạn hành vi của workflow AI, ví dụ không tự quyết định accept/reject hoặc không truy cập dữ liệu ngoài quyền |
| Hallucination | Sinh thông tin không có căn cứ | Trường hợp AI tạo nội dung không được dữ liệu đầu vào hoặc bằng chứng hệ thống hỗ trợ |
| Fingerprint | Dấu vết trạng thái dữ liệu | Giá trị đại diện cho trạng thái dữ liệu tại thời điểm sinh artifact, dùng để phát hiện artifact đã lỗi thời |
| Stale | Không còn hiện hành | Trạng thái của artifact khi dữ liệu gốc đã thay đổi so với thời điểm artifact được tạo |
| Model router | Bộ định tuyến mô hình | Lớp chọn hoặc gọi provider mô hình theo cấu hình runtime của AI service |

## Thuật ngữ API và kiểm soát quyền

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| API | Application Programming Interface | Giao diện cho phép các thành phần hệ thống trao đổi request/response |
| DTO | Data Transfer Object | Cấu trúc dữ liệu dùng để truyền dữ liệu qua API hoặc giữa các lớp backend |
| RBAC | Role-Based Access Control | Cơ chế kiểm soát quyền truy cập dựa trên vai trò của người dùng trong hội nghị |
| Redaction | Ẩn dữ liệu nhạy cảm | Việc loại bỏ hoặc che bớt dữ liệu không được phép hiển thị trước khi trả response |
| Field whitelist | Danh sách field được phép | Danh sách field mà agent hoặc query engine được phép truy vấn/trả về đối với một resource |
| Resource registry | Danh mục resource | Danh sách resource mà agent được phép mô tả và truy vấn, ví dụ submissions, assignments hoặc notifications |
| `query_engine` | Công cụ truy vấn backend | Công cụ read-only để Chatbot Agent lấy dữ liệu hệ thống thông qua backend và lớp phân quyền |
| Service-to-service token | Token giữa các service | Token xác thực dùng cho giao tiếp nội bộ giữa backend và AI service |
| Permission boundary | Ranh giới quyền truy cập | Giới hạn dữ liệu hoặc thao tác mà một vai trò người dùng được phép truy cập trong hệ thống |

## Thuật ngữ reviewer matching và COI

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| COI | Conflict of Interest | Xung đột lợi ích giữa reviewer và bài nộp, cần được phát hiện trước khi phân công phản biện |
| Reviewer matching | Đối sánh phản biện | Cơ chế gợi ý reviewer phù hợp với bài nộp dựa trên miền chuyên môn, tải công việc và ràng buộc COI |
| Domain Jaccard | Jaccard similarity theo miền chuyên môn | Công thức đo độ tương đồng giữa tập keyword/domain của bài nộp và reviewer bằng tỷ lệ giao trên hợp |
| Greedy assignment | Phân công tham lam | Thuật toán xét các cặp submission-reviewer có điểm cao trước, đồng thời tôn trọng giới hạn tải và COI |
| Fallback | Bước dự phòng | Bước xử lý khi một bài chưa đủ reviewer sau lượt gán chính; có thể nới score/load nhưng không nới COI |
| Co-author graph | Đồ thị đồng tác giả | Đồ thị biểu diễn quan hệ đồng tác giả giữa các nhà nghiên cứu, dùng để phát hiện COI gián tiếp |
| Relationship conflict | Xung đột do quan hệ cộng tác | COI suy ra từ quan hệ cộng tác học thuật, ví dụ đồng tác giả trực tiếp hoặc gián tiếp trong một khoảng thời gian |

## Thuật ngữ đánh giá thực nghiệm

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| Benchmark | Thực nghiệm đánh giá có kịch bản | Quy trình đo hiệu năng, chất lượng hoặc độ tin cậy của một lớp hệ thống theo dữ liệu và chỉ số xác định |
| Micro-benchmark | Benchmark vi mô | Thực nghiệm đo chi phí của một thành phần nhỏ, ví dụ thuật toán matching hoặc detector COI, tách khỏi overhead của API/database |
| Baseline | Mốc so sánh | Phương pháp hoặc kết quả nền dùng để đánh giá hệ thống hiện tại tốt hơn hay kém hơn ở chỉ số cụ thể |
| Ground truth | Nhãn tham chiếu | Dữ liệu hoặc nhãn được xem là chuẩn đối chiếu trong một thực nghiệm |
| Proxy | Chỉ báo thay thế | Chỉ số gián tiếp dùng khi không thể đo trực tiếp chất lượng cần quan tâm, ví dụ dùng TCA để hậu kiểm output AI |
| TCA | Truthfulness-Coverage-Additionality | Khung hậu kiểm output AI theo mức bám nguồn, mức bao phủ so với tham chiếu và lượng thông tin bổ sung có căn cứ |
| NLI | Natural Language Inference | Kỹ thuật kiểm tra quan hệ suy luận giữa claim và evidence, dùng trong benchmark hậu kiểm một số output AI |
| Truthfulness | Mức bám đúng bằng chứng | Tỷ lệ hoặc mức độ các claim được nguồn dữ liệu hỗ trợ |
| Groundedness | Mức neo nguồn | Mức độ một nhận định có thể truy vết về evidence cụ thể trong dữ liệu đầu vào |
| Coverage | Mức bao phủ | Trong benchmark AI, mức độ output bao phủ các điểm có trong nguồn tham chiếu; trong assignment, tỷ lệ bài được phân công đủ reviewer |
| Additionality | Thông tin bổ sung có căn cứ | Phần nội dung đúng và có evidence nhưng không trùng trực tiếp với tham chiếu của con người |
| Grounded-valid rate | Tỷ lệ finding vừa bám nguồn vừa hợp lệ | Chỉ số kết hợp giữa việc finding có căn cứ và việc finding phù hợp với tiêu chí audit |
| Validity rate | Tỷ lệ finding hợp lệ | Tỷ lệ finding được đánh giá là phù hợp với tiêu chí kiểm tra, chưa nhất thiết bảo đảm finding đó bám nguồn đầy đủ |
| Actionability | Tính có thể hành động | Mức độ một cảnh báo/finding đủ cụ thể để người dùng biết cần sửa hoặc kiểm tra gì |
| Severity | Mức độ nghiêm trọng | Nhãn thể hiện độ nặng của finding hoặc cảnh báo, ví dụ warning/blocking hoặc minor/moderate/major |
| Exact Match | Khớp tuyệt đối | Chỉ số yêu cầu output trùng hoàn toàn với giá trị tham chiếu sau khi chuẩn hóa theo quy tắc đánh giá |
| Top-K accuracy | Độ chính xác trong K gợi ý đầu | Tỷ lệ trường hợp nhãn đúng xuất hiện trong K kết quả được xếp hạng cao nhất |
| Hit@K | Hit at K | Chỉ số ranking cho biết kết quả đúng có nằm trong K gợi ý đầu tiên hay không |
| MRR | Mean Reciprocal Rank | Trung bình nghịch đảo thứ hạng của kết quả đúng đầu tiên trong danh sách gợi ý |
| nDCG@K | Normalized Discounted Cumulative Gain at K | Chỉ số đánh giá ranking có xét vị trí và độ liên quan của các kết quả trong K vị trí đầu |
| F1 | F1-score | Trung bình điều hòa giữa precision và recall, dùng trong các bài toán so khớp hoặc trích xuất |
| ROUGE | Recall-Oriented Understudy for Gisting Evaluation | Nhóm chỉ số so sánh độ trùng lặp văn bản, dùng trong đánh giá tóm tắt hoặc trích xuất abstract |
| p95 latency | Độ trễ phân vị 95 | Mức độ trễ mà 95% request có thời gian xử lý nhỏ hơn hoặc bằng giá trị này |
| Throughput | Thông lượng | Số request hoặc tác vụ hệ thống xử lý được trong một đơn vị thời gian |
| Token | Đơn vị xử lý văn bản của mô hình | Đơn vị văn bản dùng để đo lượng đầu vào/đầu ra và ước tính chi phí khi gọi LLM |
| TTFT | Time to First Token | Thời gian từ lúc gửi yêu cầu đến khi hệ thống bắt đầu stream token đầu tiên |
| Tool-call success | Tỷ lệ gọi công cụ thành công | Tỷ lệ lời gọi tool của agent trả về kết quả hợp lệ trong benchmark hội thoại |
| Decision label match | Khớp nhãn quyết định | Chỉ số giả định để đo việc hệ thống dự đoán đúng quyết định accept/reject; báo cáo nêu rõ Chair Decision Copilot chưa được đánh giá theo chỉ số này |
| UAT | User Acceptance Testing | Khảo sát/kiểm thử mức chấp nhận của người dùng sau khi trải nghiệm hệ thống |

## Thuật ngữ triển khai được dùng như từ viết tắt

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| CI/CD | Continuous Integration / Continuous Deployment | Quy trình tự động build, kiểm tra, đóng gói và triển khai hệ thống |
| GHCR | GitHub Container Registry | Registry lưu container image được build từ GitHub Actions |
| VPS | Virtual Private Server | Máy chủ ảo dùng để triển khai môi trường production trong phạm vi đề tài |
| HTTP | Hypertext Transfer Protocol | Giao thức request/response dùng cho API và benchmark tải backend |
| HTTPS | HTTP Secure | HTTP qua kênh mã hóa TLS, được Caddy xử lý trong triển khai production |
| CRUD | Create, Read, Update, Delete | Nhóm thao tác nghiệp vụ cơ bản trên dữ liệu hệ thống |

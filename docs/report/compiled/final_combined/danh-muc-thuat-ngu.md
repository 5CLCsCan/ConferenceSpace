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
| AI-native | Thiết kế lấy AI làm năng lực vận hành gốc | Cách định vị nền tảng trong đó AI, truy hồi bằng chứng, agent có kiểm soát và observability được thiết kế như một phần của workflow chính, không chỉ là tính năng phụ trợ |
| LLM | Large Language Model | Mô hình ngôn ngữ lớn dùng trong các workflow hỗ trợ nhập liệu, đọc bài, kiểm toán review, tổng hợp bằng chứng hoặc chatbot |
| Workflow AI | AI workflow | Luồng xử lý có dùng AI, có đầu vào, đầu ra, ràng buộc kiểm soát và tiêu chí đánh giá riêng |
| Workflow runner | Bộ chạy workflow | Thành phần chạy workflow AI trên tập dữ liệu benchmark, lưu output, checkpoint, thời gian xử lý, token và trạng thái hoàn tất |
| Result package | Gói kết quả workflow | Tập artifact được lưu sau khi workflow chạy xong, gồm dữ liệu nguồn, output, checkpoint, token và thông tin thời gian để hậu kiểm |
| Dispatcher-worker | Bộ điều phối và worker xử lý | Mô hình vận hành trong đó dispatcher phân phối tác vụ AI cho các worker chạy độc lập và lưu kết quả theo từng task |
| Artifact | - | Kết quả hoặc đối tượng kỹ thuật được tạo/lưu để đối chiếu, ví dụ output của workflow AI, metadata kiểm toán hoặc dữ liệu đã gắn fingerprint |
| Structured output | Đầu ra có cấu trúc | Đầu ra của model phải tuân theo schema hoặc field contract để backend có thể validate, lưu và hiển thị |
| Schema | Lược đồ dữ liệu | Đặc tả cấu trúc dữ liệu, kiểu field và ràng buộc validate cho request/response hoặc artifact |
| Contract | Hợp đồng dữ liệu / hành vi | Quy ước bắt buộc giữa các thành phần hệ thống, ví dụ output contract, API contract hoặc tool-call contract |
| Contract violation | Vi phạm hợp đồng dữ liệu / hành vi | Trường hợp output hoặc hành vi của workflow không tuân theo contract đã định, ví dụ sinh `block` tự động ở tuyến chỉ được phép cảnh báo |
| Guardrail | Ràng buộc kiểm soát | Quy tắc giới hạn hành vi của workflow AI, ví dụ không tự quyết định accept/reject hoặc không truy cập dữ liệu ngoài quyền |
| Composite pattern | Mẫu Composite | Mẫu thiết kế cho phép gom nhiều detector hoặc thành phần xử lý cùng giao diện để bật/tắt hoặc kết hợp theo cấu hình |
| Hallucination | Sinh thông tin không có căn cứ | Trường hợp AI tạo nội dung không được dữ liệu đầu vào hoặc bằng chứng hệ thống hỗ trợ |
| Claim-evidence | Nhận định và bằng chứng đối chiếu | Cách biểu diễn một finding hoặc nhận định thành claim rồi liên kết với evidence để kiểm tra mức bám nguồn |
| Retrieval-Augmented Generation | Sinh nội dung có truy hồi bằng chứng | Cách kết hợp mô hình ngôn ngữ với bước truy xuất tài liệu hoặc artifact liên quan trước khi sinh câu trả lời |
| RAG | Retrieval-Augmented Generation | Viết tắt của Retrieval-Augmented Generation, dùng trong báo cáo như một hướng phát triển để tăng groundedness của workflow AI |
| Agentic RAG | RAG có điều phối bởi agent | Hướng mở rộng trong đó agent có thể chọn chiến lược truy xuất, chia nhỏ tác vụ, gọi công cụ và kiểm tra lại nguồn thay vì chạy một pipeline cố định |
| Vector search | Tìm kiếm theo vector ngữ nghĩa | Cách tìm tài liệu, chủ đề hoặc hồ sơ gần nhau trong không gian embedding thay vì chỉ khớp từ khóa |
| Hybrid retrieval | Truy hồi lai | Cách kết hợp tìm kiếm từ khóa, metadata và vector search để tăng khả năng lấy đúng nguồn liên quan |
| Observability | Khả năng quan sát và truy vết vận hành | Khả năng theo dõi workflow đã dùng nguồn nào, gọi công cụ nào, sinh output nào, lỗi ở đâu và người dùng đã xử lý kết quả ra sao |
| AgentOps | Vận hành và quan sát hệ thống agent | Nhóm thực hành tương tự DevOps/MLOps cho agent, tập trung vào monitoring, logging, tracing, analytics và kiểm soát an toàn |
| Audit trail | Dấu vết kiểm toán | Chuỗi sự kiện và artifact giúp truy lại ai hoặc thành phần nào đã thực hiện thao tác, dựa trên dữ liệu nào và tạo kết quả gì |
| Provenance | Nguồn gốc và lịch sử dữ liệu | Thông tin cho biết một nhận định, artifact hoặc dữ liệu được tạo từ nguồn nào, ở phiên bản nào và qua bước xử lý nào |
| Permissioned harness | Môi trường agent có giới hạn quyền | Môi trường chạy agent với tool schema, quyền theo vai trò, giới hạn tác vụ, log và điểm phê duyệt của con người |
| Human approval gate | Điểm phê duyệt của con người | Bước bắt buộc người dùng có thẩm quyền xác nhận trước khi một workflow hoặc agent thực hiện thao tác nhạy cảm |
| Rollback | Hoàn tác trạng thái | Cơ chế đưa hệ thống hoặc artifact về trạng thái trước đó khi thao tác tự động hoặc bán tự động không phù hợp |
| Fingerprint | Dấu vết trạng thái dữ liệu | Giá trị đại diện cho trạng thái dữ liệu tại thời điểm sinh artifact, dùng để phát hiện artifact đã lỗi thời |
| Stale | Không còn hiện hành | Trạng thái của artifact khi dữ liệu gốc đã thay đổi so với thời điểm artifact được tạo |
| Model router | Bộ định tuyến mô hình | Lớp chọn hoặc gọi provider mô hình theo cấu hình runtime của AI service |
| Open scholarly infrastructure | Hạ tầng học thuật mở | Định hướng vận hành hạ tầng phục vụ cộng đồng học thuật với governance, sustainability, open source hoặc open standards phù hợp |
| PoC | Proof of Concept | Bản chứng minh khả thi về mặt kỹ thuật và học thuật, chưa nhằm chứng minh mô hình kinh doanh hoặc khả năng vận hành thương mại đầy đủ |

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
| SLA | Service Level Agreement | Cam kết mức dịch vụ, ví dụ độ sẵn sàng, thời gian phản hồi hoặc hỗ trợ vận hành trong mô hình hosted service |

## Thuật ngữ reviewer matching và COI

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| COI | Conflict of Interest | Xung đột lợi ích giữa reviewer và bài nộp, cần được phát hiện trước khi phân công phản biện |
| Reviewer matching | Đối sánh phản biện | Cơ chế gợi ý reviewer phù hợp với bài nộp dựa trên miền chuyên môn, tải công việc và ràng buộc COI |
| Domain Jaccard | Jaccard similarity theo miền chuyên môn | Công thức đo độ tương đồng giữa tập keyword/domain của bài nộp và reviewer bằng tỷ lệ giao trên hợp |
| Greedy assignment | Phân công tham lam | Thuật toán xét các cặp submission-reviewer có điểm cao trước, đồng thời tôn trọng giới hạn tải và COI |
| Load balancing | Cân bằng tải phản biện | Nguyên tắc phân bổ assignment để tránh dồn quá nhiều bài cho một reviewer khi có nhiều ứng viên tương đương |
| Load StdDev | Độ lệch chuẩn tải phản biện | Chỉ số đo mức phân tán số bài được gán cho từng reviewer; giá trị cao cho thấy tải phân công lệch hơn |
| Load Gini | Hệ số Gini của tải phản biện | Chỉ số đo mức bất bình đẳng trong phân bổ bài cho reviewer; giá trị càng gần 0 thì tải càng đều |
| Tie-break | Quy tắc phá hòa | Quy tắc chọn thứ tự ưu tiên khi nhiều ứng viên có cùng điểm, ví dụ ưu tiên reviewer có tải thấp hơn |
| Fallback | Bước dự phòng | Bước xử lý khi một bài chưa đủ reviewer sau lượt gán chính; có thể nới score/load nhưng không nới COI |
| Fallback rate | Tỷ lệ dùng bước dự phòng | Tỷ lệ phân công phải dùng cơ chế fallback vì không còn reviewer hợp lệ có tín hiệu phù hợp đủ rõ |
| COI violation | Vi phạm ràng buộc xung đột lợi ích | Trường hợp hệ thống phân công reviewer vào bài nộp có COI; trong benchmark đây là chỉ số phải bằng 0 |
| Co-author graph | Đồ thị đồng tác giả | Đồ thị biểu diễn quan hệ đồng tác giả giữa các nhà nghiên cứu, dùng để phát hiện COI gián tiếp |
| Relationship conflict | Xung đột do quan hệ cộng tác | COI suy ra từ quan hệ cộng tác học thuật, ví dụ đồng tác giả trực tiếp hoặc gián tiếp trong một khoảng thời gian |
| Lexical ceiling | Trần từ vựng | Giới hạn của phương pháp so khớp từ khóa khi hai hồ sơ cùng lĩnh vực lớn nhưng dùng ít từ khóa trùng nhau |
| Embedding | Biểu diễn vector ngữ nghĩa | Cách biểu diễn văn bản hoặc chủ đề thành vector để đo tương đồng ngữ nghĩa sâu hơn so với trùng khớp từ khóa |
| ANN | Approximate Nearest Neighbor | Kỹ thuật tìm láng giềng gần xấp xỉ trong không gian vector, thường dùng khi cần xếp hạng tương đồng trên tập dữ liệu lớn |

## Thuật ngữ đánh giá thực nghiệm

| Thuật ngữ | Tên đầy đủ / tương đương | Nghĩa sử dụng trong báo cáo |
|---|---|---|
| Benchmark | Thực nghiệm đánh giá có kịch bản | Quy trình đo hiệu năng, chất lượng hoặc độ tin cậy của một lớp hệ thống theo dữ liệu và chỉ số xác định |
| Micro-benchmark | Benchmark vi mô | Thực nghiệm đo chi phí của một thành phần nhỏ, ví dụ thuật toán matching hoặc detector COI, tách khỏi overhead của API/database |
| k6 | Công cụ kiểm thử tải HTTP | Công cụ dùng để sinh tải request trong benchmark backend, đo độ trễ, throughput và tỷ lệ lỗi |
| Virtual user | Người dùng ảo | Đơn vị mô phỏng người dùng đồng thời trong kiểm thử tải bằng k6 |
| Workload | Tải công việc thử nghiệm | Tập request, dữ liệu và kịch bản dùng để đo hành vi hệ thống trong một benchmark |
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
| Completion rate | Tỷ lệ hoàn tất | Tỷ lệ tác vụ hoặc workflow chạy xong và tạo được output hợp lệ theo contract |
| Invalid track rate | Tỷ lệ track không hợp lệ | Tỷ lệ gợi ý track nằm ngoài danh sách track hợp lệ của hội nghị đang xét |
| High-risk rate | Tỷ lệ trường hợp rủi ro cao | Tỷ lệ output hoặc task có dấu hiệu cần kiểm tra thủ công kỹ hơn trước khi dùng trong quyết định gần điểm nhạy cảm |
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
| Stream duration | Thời lượng stream | Thời gian hệ thống duy trì luồng trả lời sau khi bắt đầu stream dữ liệu về giao diện |
| Tool-call success | Tỷ lệ gọi công cụ thành công | Tỷ lệ lời gọi tool của agent trả về kết quả hợp lệ trong benchmark hội thoại |
| Tool-call failure | Lượt gọi công cụ thất bại | Trường hợp agent gọi tool nhưng tool lỗi, không trả dữ liệu hợp lệ hoặc không giúp hoàn tất yêu cầu hội thoại |
| Permission safety | An toàn quyền truy cập | Mức độ chatbot hoặc agent giữ đúng ranh giới quyền, không trả dữ liệu vượt quyền của vai trò đang sử dụng |
| Workflow outcome | Kết quả hội thoại/workflow | Nhãn đánh giá cuối cùng của một workflow hoặc hội thoại, ví dụ đạt, đạt một phần hoặc không đạt |
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

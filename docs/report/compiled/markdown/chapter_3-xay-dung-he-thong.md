# Chương 3. Xây dựng hệ thống

## 3.1. Tổng quan hệ thống

ConferenceSpace được xây dựng nhằm giải quyết một bài toán có tính thực tiễn cao trong cộng đồng nghiên cứu học thuật: quản lý toàn bộ vòng đời xét duyệt bài báo khoa học tại hội nghị, từ khâu nộp bản thảo, phân công phản biện, thu thập đánh giá, giai đoạn rebuttal, đến khi ra quyết định chấp nhận hoặc từ chối. Hệ thống không đặt mục tiêu cạnh tranh với các nền tảng đã vận hành lâu năm như EasyChair hay Microsoft CMT về độ phủ người dùng, mà hướng đến việc chứng minh một mô hình tích hợp AI vào quy trình học thuật theo cách có trách nhiệm và có thể giải thích được, trong đó mọi quyết định cuối cùng vẫn thuộc về con người. Đây là quan điểm thiết kế xuyên suốt chi phối mọi quyết định kỹ thuật trong quá trình xây dựng hệ thống.

Hệ thống phục vụ ba nhóm người dùng chính với những nhu cầu và quyền hạn khác biệt rõ ràng. **Tác giả** là những người tìm kiếm hội nghị phù hợp, nộp bản thảo, theo dõi tiến trình xét duyệt và phản hồi trong giai đoạn rebuttal. **Người phản biện** (reviewer) nhận bài được phân công, đọc và đánh giá dựa trên các tiêu chí chuyên môn, lưu nháp và gửi phản biện. **Chủ tọa** (chair) và đồng chủ tọa (co-chair) có quyền quản lý toàn bộ hội nghị: cấu hình track và deadline, mời và phân công phản biện, kiểm tra xung đột lợi ích, theo dõi tiến độ và đưa ra quyết định cuối cùng. Quan trọng là vai trò của một người dùng được gán theo từng hội nghị, không phải trên toàn hệ thống: một người có thể là tác giả ở hội nghị này nhưng đồng thời là người phản biện hoặc chủ tọa ở hội nghị khác.

Về kiến trúc tổng thể, ConferenceSpace được cấu trúc thành ba lớp rõ ràng và tách biệt về mặt trách nhiệm. Lớp thứ nhất là **lớp nghiệp vụ cốt lõi**, bao gồm toàn bộ quy trình quản lý hội nghị, nộp bài, phân công, đánh giá và ra quyết định — những tác vụ không cần AI và cần hoạt động ổn định, xác định. Lớp thứ hai là **lớp thuật toán xác định**, bao gồm thuật toán đối sánh phản biện — bài nộp dựa trên Jaccard Similarity và cơ chế phát hiện xung đột lợi ích đa tầng — những tác vụ cần kết quả nhất quán và có thể giải thích được mà không phụ thuộc vào mô hình ngôn ngữ lớn. Lớp thứ ba là **lớp AI hỗ trợ**, bao gồm sáu mô-đun AI phục vụ các tác nhân khác nhau trong quy trình: Autofill, Track Recommendation, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot. Sự phân tầng này không chỉ là quyết định thiết kế mà còn là câu trả lời cho câu hỏi cốt lõi: phần nào trong quy trình xét duyệt học thuật phù hợp để AI hỗ trợ, và phần nào cần giải quyết bằng logic có thể kiểm chứng?

### 3.1.1. Sơ đồ kiến trúc tổng quan hệ thống

Dưới đây là sơ đồ Mermaid biểu diễn sự phân tầng ba lớp và mối tương tác giữa các dịch vụ trong hệ thống ConferenceSpace.

```mermaid
graph TD
    %% Định nghĩa các lớp phân tầng
    subgraph Layer3 ["Lớp AI Hỗ Trợ (Python FastAPI Service)"]
        AI_Autofill["Autofill Workflow"]
        AI_Track["Track Rec Workflow"]
        AI_Gating["Gating Workflow"]
        AI_Briefing["Initial Analysis Workflow"]
        AI_Audit["Quality Auditor Workflow"]
        AI_Decision["Decision Copilot Workflow"]
    end

    subgraph Layer2 ["Lớp Thuật Toán Xác Định (Go Domain Packages)"]
        Algo_Jaccard["Jaccard Matching (Reviewer-Submission)"]
        Algo_COI["Multi-Layer COI Detection"]
    end

    subgraph Layer1 ["Lớp Nghiệp Vụ Cốt Lõi (Go Core Service & Databases)"]
        Core_App["Go Backend Service (Gin Router)"]
        DB_Postgres[("PostgreSQL (Dữ liệu quan hệ)")]
        DB_Neo4j[("Neo4j (Đồ thị đồng tác giả)")]
        DB_Redis[("Redis (Cache & State)")]
    end

    %% Mối liên kết tương tác
    Browser["Client Browser (React/Next.js)"] -->|HTTPS / API Gateway| Core_App
    Core_App --> DB_Postgres
    Core_App --> DB_Redis
    
    Core_App -->|Internal Go Calls| Algo_Jaccard
    Core_App -->|Internal Go Calls| Algo_COI
    Algo_COI -->|Cypher Queries| DB_Neo4j
    
    Core_App -->|HTTP REST Client| Layer3
    Layer3 -->|Gemini/OpenRouter APIs| LLM_Providers["External LLM (Gemini, OpenRouter)"]
```

#### Giải thích sơ đồ kiến trúc tổng quan

Sơ đồ trên minh họa rõ ràng luồng dữ liệu đi từ trình duyệt của người dùng (Client Browser) qua các tầng phân lớp của ConferenceSpace:
1. **Lớp 1 (Nghiệp vụ cốt lõi):** Đóng vai trò là cổng tiếp nhận tất cả các yêu cầu từ phía máy khách. Go Backend chạy Gin Router sẽ định tuyến các yêu cầu, thực hiện các thao tác CRUD dữ liệu trên PostgreSQL, ghi nhận phiên làm việc trên Redis và quản lý kết nối WebSocket.
2. **Lớp 2 (Thuật toán xác định):** Khi cần tính toán phân công phản biện hoặc kiểm tra xung đột lợi ích (COI), Go Backend sẽ gọi các package nội bộ. Riêng thuật toán phát hiện COI sẽ gửi các câu lệnh Cypher đến Neo4j Database để duyệt đồ thị đồng tác giả theo thời gian thực.
3. **Lớp 3 (AI hỗ trợ):** Các tác vụ đọc hiểu, phân tích ngữ nghĩa được tách hoàn toàn sang Python FastAPI Service. Go Backend giao tiếp với AI Service qua giao thức HTTP REST. AI Service sau đó sẽ tương tác với các LLM Provider bên ngoài để xử lý kết quả và trả về cho Go Backend dưới dạng JSON có cấu trúc.

---

## 3.2. Use Case

### 3.2.1. Tác nhân hệ thống

Hệ thống ConferenceSpace xác định sáu tác nhân tương tác trực tiếp hoặc gián tiếp với các chức năng của hệ thống, phản ánh cấu trúc phân công vai trò trong một hội nghị khoa học thực tế.

**Tác giả** (Author) là tác nhân có tần suất tương tác cao nhất với hệ thống trong giai đoạn đầu vòng đời bài nộp. Tác giả tìm kiếm và đánh dấu các hội nghị phù hợp với lĩnh vực nghiên cứu, tiến hành nộp bài theo quy trình nhiều bước có hướng dẫn, theo dõi trạng thái bài nộp theo thời gian thực và tương tác với kết quả phản biện trong giai đoạn rebuttal. Đây cũng là tác nhân hưởng lợi trực tiếp từ các mô-đun AI hỗ trợ như Autofill (trích xuất metadata từ PDF), gợi ý track phù hợp và kiểm tra sơ bộ bản thảo trước khi nộp chính thức.

**Người phản biện** (Reviewer) tương tác với hệ thống chủ yếu trong giai đoạn đánh giá bài. Reviewer nhận lời mời phân công, chấp nhận hoặc từ chối kèm lý do, xem danh sách bài được phân công kèm thông tin hỗ trợ từ AI, nhập điểm theo các tiêu chí chuyên môn, lưu nháp và gửi phản biện. Sau giai đoạn rebuttal, reviewer có thể đọc phản hồi của tác giả và điều chỉnh điểm số nếu thấy cần thiết.

**Chủ tọa và Đồng chủ tọa** (Chair / Co-Chair) là tác nhân có quyền hạn rộng nhất trong phạm vi hội nghị mà họ quản lý. Chair chịu trách nhiệm tạo và cấu hình hội nghị, thiết lập track, deadline và mẫu phản biện, mời và phân công reviewer, kiểm tra xung đột lợi ích, theo dõi tiến độ phản biện và cuối cùng là ra quyết định chấp nhận hoặc từ chối dựa trên tổng hợp phản biện, rebuttal và thảo luận nội bộ. Chair được hỗ trợ bởi thuật toán gợi ý reviewer và mô-đun Decision Copilot để có cái nhìn tổng quan và đưa ra quyết định có căn cứ.

**Ban chương trình** (Program Committee — PC) là tác nhân có quyền đọc và tổng quan, không có quyền can thiệp vào quy trình nghiệp vụ. PC có thể xem danh sách bài nộp, các phản biện và thống kê tổng hợp trong phạm vi hội nghị mà họ tham gia.

**Quản trị hệ thống** (System Admin) là tác nhân đặc biệt, không phải người dùng cuối thông thường, truy cập qua header `X-Admin-Token`. Tác nhân này phục vụ các thao tác vận hành nội bộ như xem dữ liệu thô, cưỡng bức đồng bộ hoặc khắc phục sự cố.

**Tác nhân hệ thống** bao gồm cron job tự động kết thúc giai đoạn rebuttal quá hạn và AI Service gọi lại vào backend qua header `X-Agent-Service-Token`. Hai tác nhân này không tương tác qua giao diện người dùng nhưng đóng vai trò quan trọng trong tính tự động hóa và tích hợp AI của toàn hệ thống.

### 3.2.2. Các use case chính

Hệ thống ConferenceSpace tổ chức các chức năng thành các nhóm use case theo từng tác nhân, phản ánh trực tiếp nhu cầu đã xác định trong quá trình khảo sát người dùng ở Chương 2. Phần này trình bày theo hai mức: trước tiên là một **sơ đồ rút gọn mang tính đại diện**, chọn ra một use case tiêu biểu cho mỗi lớp trong ba lớp kiến trúc đã mô tả ở mục 3.1 (nghiệp vụ, thuật toán, AI); sau đó là **sơ đồ use case đầy đủ** bao phủ toàn bộ sáu tác nhân đã liệt kê ở mục 3.2.1 và toàn bộ các nhóm chức năng của hệ thống, kể cả các thao tác nền tảng như đăng ký, đăng nhập hay thông báo vốn không "nổi bật" bằng các use case có AI nhưng vẫn là điều kiện tiên quyết để mọi luồng nghiệp vụ khác vận hành được.

#### Sơ đồ use case rút gọn (đại diện ba lớp kiến trúc)

*Sơ đồ dưới đây **không** liệt kê toàn bộ chức năng của hệ thống. Đây là sơ đồ chọn lọc ba use case tiêu biểu — nộp bài (lớp nghiệp vụ), phân công phản biện (lớp thuật toán) và hỗ trợ quyết định bằng AI (lớp AI) — nhằm minh họa trực quan cho sự phân tầng kiến trúc đã trình bày ở mục 3.1. Danh sách đầy đủ các use case còn lại được trình bày ngay sau phần giải thích của sơ đồ này.*

```mermaid
graph TD
    %% Tác nhân
    Author["Tác giả (Author)"]
    Reviewer["Người phản biện (Reviewer)"]
    Chair["Chủ tọa (Chair)"]
    
    %% Use Cases
    subgraph Author_UseCases ["Nhóm chức năng Tác giả"]
        UC_Autofill(["Nộp bài & AI Autofill"])
        UC_Track(["Nhận gợi ý Track"])
        UC_Rebuttal(["Gửi bài Rebuttal"])
    end
    
    subgraph Reviewer_UseCases ["Nhóm chức năng Phản biện"]
        UC_Review(["Đánh giá & Nhập điểm"])
        UC_Briefing(["Xem tóm tắt bài nộp"])
    end
    
    subgraph Chair_UseCases ["Nhóm chức năng Chủ tọa"]
        UC_Config(["Cấu hình Hội nghị"])
        UC_COI(["Kiểm tra xung đột (COI)"])
        UC_Assign(["Phân công (Matching)"])
        UC_Decision(["Ra quyết định & Decision Copilot"])
    end

    %% Mối liên kết
    Author --> UC_Autofill
    Author --> UC_Rebuttal
    Author --> UC_Track

    Reviewer --> UC_Review
    Reviewer --> UC_Briefing

    Chair --> UC_Config
    Chair --> UC_COI
    Chair --> UC_Assign
    Chair --> UC_Decision
```

#### Giải thích biểu đồ Use Case hệ thống

Biểu đồ Use Case tổng quát trên biểu diễn mối liên kết giữa ba nhóm tác nhân chính và các chức năng quan trọng nhất trong vòng đời của một hội nghị khoa học:
1. **Tác giả (Author):** Tập trung vào việc nộp bài báo. Tác nhân này có thể tải lên tệp PDF để kích hoạt `AI Autofill` (tự điền metadata) hoặc nhận gợi ý track chuyên môn trước khi gửi bản thảo chính thức. Sau khi có kết quả review, tác giả tham gia giai đoạn phản hồi bằng cách gửi `Rebuttal`.
2. **Người phản biện (Reviewer):** Nhận bài nộp được phân công, xem bản tóm tắt đóng góp chính của bài viết do AI biên soạn nhằm nắm bắt nhanh nội dung, và tiến hành đánh giá chuyên môn theo mẫu tiêu chí có sẵn của hội nghị.
3. **Chủ tọa (Chair):** Quản lý toàn bộ cấu hình, tiến hành rà soát xung đột lợi ích (COI), xác nhận phân công reviewer dựa trên gợi ý từ thuật toán matching và sử dụng `Decision Copilot` để có cái nhìn tổng hợp đa chiều trước khi đưa ra quyết định chấp nhận hay từ chối bài viết.

#### Sơ đồ use case đầy đủ — Nhóm chức năng dùng chung

Sáu tác nhân của hệ thống — Author, Reviewer, Chair, PC, Admin và Tác nhân hệ thống — không đồng nhất về việc dùng nhóm chức năng dùng chung: Admin xác thực bằng `X-Admin-Token` riêng và Tác nhân hệ thống (cron/AI callback) không đi qua giao diện người dùng, nên nhóm use case dùng chung dưới đây chỉ áp dụng cho bốn tác nhân đăng nhập qua giao diện web: Author, Reviewer, Chair và PC.

```mermaid
graph TD
    User["Người dùng đã đăng nhập (Author / Reviewer / Chair / PC)"]

    subgraph Common_Auth ["Xác thực & Tài khoản"]
        UC_Register(["Đăng ký, Xác thực Email & Khôi phục mật khẩu"])
        UC_Login(["Đăng nhập / Đăng xuất"])
        UC_Role(["Chọn vai trò làm việc"])
    end

    subgraph Common_Profile ["Hồ sơ & Tiện ích dùng chung"]
        UC_Profile(["Quản lý hồ sơ & Liên kết Semantic Scholar"])
        UC_Notify(["Thông báo & Lịch trình"])
        UC_Discuss(["Discussion Thread theo bài nộp"])
        UC_Chat(["Chatbot / Agent hỏi đáp"])
        UC_Onboard(["Hướng dẫn nhanh & Usage Event"])
    end

    User --> UC_Register
    User --> UC_Login
    User --> UC_Role
    User --> UC_Profile
    User --> UC_Notify
    User --> UC_Discuss
    User --> UC_Chat
    User --> UC_Onboard
```

**Bảng đối chiếu use case dùng chung với mã chức năng:**

| Use case | Mã F-code | Đặc tả chi tiết |
| --- | --- | --- |
| Đăng ký, Xác thực Email & Khôi phục mật khẩu | F-COM-01, 03, 04 | UC-04 |
| Đăng nhập / Đăng xuất | F-COM-02 | UC-04 |
| Chọn vai trò làm việc | F-COM-05 | UC-05 |
| Quản lý hồ sơ & Liên kết Semantic Scholar | F-COM-06, 07 | UC-05 |
| Thông báo & Lịch trình | F-COM-08, 09 | UC-06 |
| Discussion Thread theo bài nộp | F-COM-10 | UC-07 |
| Chatbot / Agent hỏi đáp | F-COM-11 | UC-08 |
| Hướng dẫn nhanh & Usage Event | F-COM-12, 13 | UC-09 |

Đáng chú ý nhất trong nhóm này là **Chatbot / Agent hỏi đáp**: đây là chức năng duy nhất trong toàn bộ F-COM-01→13 có gắn AI (agent gọi lại các API nội bộ để trả lời truy vấn), nhưng trước khi cập nhật lần này, nó chưa từng xuất hiện như một use case ở đâu trong Chương 3 — mục 3.4.2 liệt kê sáu workflow AI nhưng không có agent/chatbot, và 3.4.3 chỉ nhắc đến nó gián tiếp qua một câu về cơ chế cache session Redis.

#### Sơ đồ use case đầy đủ — Author, Reviewer, Chair

Sơ đồ dưới đây mở rộng sơ đồ rút gọn ở trên: giữ nguyên sáu use case tiêu biểu ban đầu (tô đậm trong bảng đối chiếu bên dưới) và bổ sung các use case còn thiếu mà mục 3.2.1 đã mô tả bằng lời nhưng chưa từng được vẽ, được nhóm lại ở cùng mức trừu tượng với các bubble đã có (ví dụ "Cấu hình Hội nghị" tiếp tục gộp các mã cấu hình/tạo/sửa hội nghị, không tách thành từng mã F-CHAIR riêng lẻ).

```mermaid
graph TD
    Author["Tác giả (Author)"]
    Reviewer["Người phản biện (Reviewer)"]
    Chair["Chủ tọa / Đồng chủ tọa (Chair)"]

    subgraph Author_UseCases ["Nhóm chức năng Tác giả"]
        UC_Explore(["Khám phá & Tìm kiếm Hội nghị"])
        UC_Autofill(["Nộp bài & AI Autofill"])
        UC_Track(["Nhận gợi ý Track"])
        UC_Manage(["Theo dõi, Lưu nháp, Sửa & Rút bài"])
        UC_Rebuttal(["Gửi bài Rebuttal"])
        UC_Result(["Xem Quyết định cuối & Camera-ready"])
    end

    subgraph Reviewer_UseCases ["Nhóm chức năng Phản biện"]
        UC_Invite(["Xử lý Lời mời Phản biện"])
        UC_Assigned(["Theo dõi & Lưu nháp Bài được phân công"])
        UC_Briefing(["Xem tóm tắt bài nộp (AI)"])
        UC_Review(["Đánh giá & Nhập điểm"])
        UC_PostRebuttal(["Rebuttal & Thảo luận sau Đánh giá"])
    end

    subgraph Chair_UseCases ["Nhóm chức năng Chủ tọa"]
        UC_Dashboard(["Dashboard & Danh sách Hội nghị"])
        UC_Config(["Cấu hình Hội nghị"])
        UC_Committee(["Mời & Quản lý Ban tổ chức"])
        UC_SubList(["Danh sách & Chi tiết Bài nộp"])
        UC_COI(["Kiểm tra xung đột (COI)"])
        UC_Assign(["Phân công (Matching)"])
        UC_RebuttalConf(["Cấu hình & Mở Rebuttal"])
        UC_Decision(["Ra quyết định & Decision Copilot"])
        UC_CameraCheck(["Duyệt Camera-ready"])
    end

    Author --> UC_Explore
    Author --> UC_Autofill
    Author --> UC_Track
    Author --> UC_Manage
    Author --> UC_Rebuttal
    Author --> UC_Result

    Reviewer --> UC_Invite
    Reviewer --> UC_Assigned
    Reviewer --> UC_Briefing
    Reviewer --> UC_Review
    Reviewer --> UC_PostRebuttal

    Chair --> UC_Dashboard
    Chair --> UC_Config
    Chair --> UC_Committee
    Chair --> UC_SubList
    Chair --> UC_COI
    Chair --> UC_Assign
    Chair --> UC_RebuttalConf
    Chair --> UC_Decision
    Chair --> UC_CameraCheck
```

**Bảng đối chiếu use case Author / Reviewer / Chair với mã chức năng:**

| Vai trò | Use case | Mã F-code | Đặc tả chi tiết |
| --- | --- | --- | --- |
| Author | Khám phá & Tìm kiếm Hội nghị | F-AUTHOR-01, 02, 03, 04 | UC-10 |
| Author | Nộp bài & AI Autofill *(đã có)* | F-AUTHOR-05, 06, 07, 11 | UC-01 |
| Author | Nhận gợi ý Track *(đã có)* | F-AUTHOR-08 | UC-01 |
| Author | Theo dõi, Lưu nháp, Sửa & Rút bài | F-AUTHOR-10, 12, 13, 14, 15 | UC-11 |
| Author | Gửi bài Rebuttal *(đã có)* | F-AUTHOR-16, 17, 18 | — *(xem UC-15 phía Reviewer cho luồng đối ứng)* |
| Author | Xem Quyết định cuối & Camera-ready | F-AUTHOR-19, 20 | UC-12 |
| Reviewer | Xử lý Lời mời Phản biện | F-REV-02, 03, 04, 22 | UC-13 |
| Reviewer | Theo dõi & Lưu nháp Bài được phân công | F-REV-01, 05, 06, 07, 08, 13, 16, 21 | UC-14 |
| Reviewer | Xem tóm tắt bài nộp (AI) *(đã có)* | F-REV-09 | UC-01 *(minh họa qua luồng AI Autofill)* |
| Reviewer | Đánh giá & Nhập điểm *(đã có)* | F-REV-10, 11, 12, 14, 15 | UC-02 |
| Reviewer | Rebuttal & Thảo luận sau Đánh giá | F-REV-17, 18, 19, 20 | UC-15 |
| Chair | Dashboard & Danh sách Hội nghị | F-CHAIR-01, 02 | UC-16 |
| Chair | Cấu hình Hội nghị *(đã có)* | F-CHAIR-03, 04, 05, 06, 07, 08 | — *(giữ nguyên như sơ đồ rút gọn)* |
| Chair | Mời & Quản lý Ban tổ chức | F-CHAIR-09, 10, 11 | UC-17 |
| Chair | Danh sách & Chi tiết Bài nộp | F-CHAIR-12, 13, 14 | UC-18 |
| Chair | Kiểm tra xung đột (COI) *(đã có)* | F-CHAIR-21, 22, 23 | UC-02 |
| Chair | Phân công (Matching) *(đã có)* | F-CHAIR-15, 16, 17, 18, 19, 20, 33 | UC-02 |
| Chair | Cấu hình & Mở Rebuttal | F-CHAIR-26, 27, 28 | UC-19 |
| Chair | Ra quyết định & Decision Copilot *(đã có)* | F-CHAIR-24, 25, 29, 30 | UC-03 |
| Chair | Duyệt Camera-ready | F-CHAIR-31 | UC-20 |

*(Các dòng đánh dấu "đã có" là sáu use case đã tồn tại trong sơ đồ rút gọn ban đầu và không thay đổi; các dòng còn lại là use case mới bổ sung trong lần cập nhật này.)*

#### Sơ đồ use case đầy đủ — PC, Admin và Tác nhân hệ thống

Đây là ba tác nhân mà mục 3.2.1 đã mô tả bằng lời nhưng hoàn toàn vắng mặt trong mọi sơ đồ trước khi cập nhật. PC chỉ có quyền đọc, Admin xác thực bằng token vận hành riêng biệt, còn Tác nhân hệ thống (cron job và AI Service callback) không đi qua giao diện người dùng — vì vậy nhóm này được tách thành sơ đồ riêng thay vì gộp chung với Author/Reviewer/Chair để tránh gây hiểu nhầm rằng đây là các thao tác thủ công qua UI.

```mermaid
graph TD
    PC["Ban chương trình (PC)"]
    Admin["Quản trị hệ thống (Admin)"]
    SysActor["Tác nhân hệ thống (Cron Job / AI Service Callback)"]

    subgraph PC_UseCases ["Nhóm chức năng PC"]
        UC_PCView(["Xem tổng quan Hội nghị (Read-only)"])
    end

    subgraph Admin_UseCases ["Nhóm chức năng Admin"]
        UC_AdminOps(["Vận hành & Khắc phục sự cố Hệ thống"])
    end

    subgraph System_UseCases ["Nhóm tác vụ tự động"]
        UC_CronRebuttal(["Tự động đóng giai đoạn Rebuttal quá hạn"])
        UC_AICallback(["AI Service gọi ngược Backend (Callback)"])
    end

    PC --> UC_PCView
    Admin --> UC_AdminOps
    SysActor --> UC_CronRebuttal
    SysActor --> UC_AICallback
```

**Bảng đối chiếu:**

| Tác nhân | Use case | Mã F-code / Cơ chế | Đặc tả chi tiết |
| --- | --- | --- | --- |
| PC | Xem tổng quan Hội nghị (Read-only) | F-CHAIR-32 | UC-21 |
| Admin | Vận hành & Khắc phục sự cố Hệ thống | Xác thực `X-Admin-Token` (không có mã F-code, theo mô tả 3.2.1) | UC-22 |
| Tác nhân hệ thống | Tự động đóng giai đoạn Rebuttal quá hạn | Cron job nội bộ (theo mô tả 3.2.1) | UC-23 |
| Tác nhân hệ thống | AI Service gọi ngược Backend (Callback) | Xác thực `X-Agent-Service-Token` (theo mô tả 3.2.1) | UC-24 |

Tổng hợp lại, sơ đồ use case đầy đủ của ConferenceSpace gồm sáu tác nhân và các nhóm use case nêu trên — tăng từ 9 use case trong sơ đồ rút gọn ban đầu lên toàn bộ các nhóm chức năng bao phủ 88 mã F-code trong Bảng danh sách chức năng theo vai trò, được trừu tượng hóa thành các use case ở mức phù hợp cho sơ đồ UML thay vì liệt kê nguyên văn từng mã.

---

### 3.2.3. Đặc tả use case quan trọng

Phần này trình bày chi tiết ba use case trọng tâm đại diện cho ba lớp của hệ thống: nộp bài (lớp nghiệp vụ), phân công phản biện (lớp thuật toán) và hỗ trợ quyết định bằng AI (lớp AI). Tiếp theo UC-03, mục này trình bày đặc tả chi tiết cho toàn bộ các use case còn lại vừa được bổ sung vào sơ đồ đầy đủ ở mục 3.2.2, theo cùng định dạng (mục tiêu, điều kiện tiên quyết, sơ đồ hoạt động/tuần tự, giải thích) để đảm bảo tính nhất quán và đầy đủ của tài liệu đặc tả.

#### UC-01: Nộp bài và trích xuất metadata tự động

**Mục tiêu:** Tác giả hoàn thành quy trình nộp bản thảo vào một hội nghị, với tùy chọn hỗ trợ AI trích xuất metadata từ tệp PDF.

**Điều kiện tiên quyết:** Tác giả đã đăng nhập, hội nghị đang trong giai đoạn mở nhận bài và tác giả chưa nộp bài vào hội nghị này.

**Sơ đồ hoạt động (Activity Diagram) cho UC-01:**

```mermaid
flowchart TD
    Start([Bắt đầu nộp bài]) --> Upload[Tải lên PDF bản thảo]
    Upload --> Choice{Bật AI Autofill?}
    Choice -- Có --> CallAI[AI Service trích xuất metadata từ PDF]
    CallAI --> AutofillForm[Tự động điền Tiêu đề, Tóm tắt, Từ khóa]
    Choice -- Không --> ManualInput[Nhập thủ công metadata]
    AutofillForm --> ReviewForm[Tác giả xem lại và chỉnh sửa]
    ManualInput --> ReviewForm
    ReviewForm --> TrackRec{Xem gợi ý Track?}
    TrackRec -- Có --> SuggestTrack[AI gợi ý Track dựa trên Abstract]
    SuggestTrack --> ChooseTrack[Tác giả chọn Track]
    TrackRec -- Không --> ChooseTrack
    ChooseTrack --> DeclareCOI[Khai báo xung đột lợi ích thủ công]
    DeclareCOI --> Submit[Gửi bài nộp chính thức]
    Submit --> DB[("Lưu vào PostgreSQL Database")]
    DB --> Notify[Gửi Realtime Notification & Email]
    Notify --> End([Hoàn tất quy trình nộp bài])
```

#### Giải thích sơ đồ hoạt động UC-01

Sơ đồ hoạt động trên mô tả trình tự các bước từ khi tác giả bắt đầu nộp bài cho đến khi hoàn thành:
1. **Bước tải PDF và trích xuất:** Tác giả tải lên tệp PDF. Nếu bật tùy chọn AI Autofill, AI Service sẽ xử lý tệp PDF và tự động điền các trường chính. Nếu không, tác giả tự nhập thủ công.
2. **Gợi ý Track:** Sau khi có thông tin tiêu đề và tóm tắt, hệ thống cung cấp tùy chọn gợi ý track. AI phân tích sự tương đồng giữa abstract và mô tả của các track để đưa ra đề xuất.
3. **Khai báo và Lưu trữ:** Tác giả xác nhận track, khai báo COI thủ công với các thành viên ban tổ chức, và gửi bài. Hệ thống lưu toàn bộ metadata vào PostgreSQL, đồng thời kích hoạt WebSocket để thông báo realtime cho tác giả và ban tổ chức.

---

#### UC-02: Phân công phản biện có kiểm tra xung đột lợi ích

**Mục tiêu:** Chủ tọa xem gợi ý phân công dựa trên thuật toán Jaccard Similarity, kiểm tra COI và xác nhận phân công.

**Điều kiện tiên quyết:** Hội nghị đang trong giai đoạn phân công, đã có ít nhất một bài nộp được xem xét và ít nhất một reviewer đã được mời và chấp nhận tham gia.

**Sơ đồ luồng xử lý COI và Phân công cho UC-02:**

```mermaid
flowchart TD
    Start([Khởi động kiểm tra phân công]) --> Parallel{Chạy song song 3 bộ lọc COI}
    
    Parallel --> SelfAuthor["SelfAuthorDetector: Trùng email tác giả?"]
    Parallel --> Declared["DeclaredConflictsDetector: Tác giả tự khai báo?"]
    Parallel --> Relationship["RelationshipDetector: Check quan hệ đồ thị"]
    
    SelfAuthor --> Merge{Tổng hợp kết quả lọc}
    Declared --> Merge
    Relationship --> Neo4j[("Neo4j Database: Tìm quan hệ đồng tác giả N-bậc")]
    Neo4j --> Merge
    
    Merge --> Decision{Có xung đột lợi ích?}
    Decision -- Có --> Block[Ghi nhận COI vào bảng coi_relationships]
    Block --> Remove[Loại bỏ cặp Reviewer - Bài nộp khỏi gợi ý matching]
    Decision -- Không --> JaccardMatch[Tính độ phù hợp Jaccard Similarity]
    
    JaccardMatch --> GreedyAssign[Thuật toán gán tham lam có ràng buộc tải]
    Remove --> Matrix[Hiển thị ma trận phân công cho Chair xem xét]
    GreedyAssign --> Matrix
    
    Matrix --> Confirm[Chair xác nhận và lưu vào PostgreSQL]
    Confirm --> End([Hoàn tất phân công])
```

#### Giải thích sơ đồ xử lý UC-02

Sơ đồ trên mô tả cơ chế kiểm tra COI đa tầng kết hợp với thuật toán đối sánh phân công:
1. **Lọc COI song song:** Hệ thống chạy đồng thời 3 cơ chế phát hiện xung đột nhằm đảm bảo tính toàn vẹn học thuật. Điểm đặc sắc là `RelationshipDetector` truy vấn đồ thị đồng tác giả trong database Neo4j để phát hiện các mối quan hệ gián tiếp (ví dụ: reviewer đã viết chung bài báo với tác giả của bài nộp trong vòng 2 năm qua).
2. **Loại trừ và Tính điểm:** Những cặp bị phát hiện COI sẽ bị loại ngay lập tức. Những cặp hợp lệ được đưa qua bộ tính điểm Jaccard Similarity giữa tập domain của reviewer và tập keyword của bài nộp.
3. **Gán tham lam:** Thuật toán sắp xếp các cặp hợp lệ theo điểm số từ cao xuống thấp và tiến hành phân công tự động, đảm bảo reviewer không bị quá tải và bài nộp nhận đủ số phản biện tối thiểu. Chair có quyền sửa đổi thủ công trên ma trận trực quan trước khi nhấn xác nhận để ghi vào database.

---

#### UC-03: Hỗ trợ quyết định bằng AI (Decision Copilot)

**Mục tiêu:** Chủ tọa nhận bản tổng hợp từ AI về toàn bộ đánh giá, thảo luận và rebuttal của một bài nộp để hỗ trợ ra quyết định chấp nhận hay từ chối.

**Điều kiện tiên quyết:** Bài nộp đã có đủ phản biện và giai đoạn rebuttal đã kết thúc hoặc không được bật.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-03:**

```mermaid
sequenceDiagram
    actor Chair as Chủ tọa (Chair)
    participant BE as Go Backend (Gin)
    participant AI as Python AI Service (FastAPI)
    participant Gemini as Google Gemini API

    Chair->>BE: Yêu cầu Decision Copilot (submission_id)
    activate BE
    BE->>BE: Lấy metadata bài nộp
    BE->>BE: Lấy điểm số & nội dung các bản phản biện (PostgreSQL)
    BE->>BE: Lấy phản hồi rebuttal của tác giả
    BE->>BE: Lấy các tin nhắn thảo luận nội bộ (discussion_messages)
    
    BE->>AI: POST /workflows/chair-decision-copilot (dữ liệu thô)
    activate AI
    AI->>AI: Xây dựng Prompt (đưa dữ liệu vào template)
    AI->>Gemini: Gọi API với dữ liệu đầu vào (gemini-2.0-flash)
    activate Gemini
    Gemini-->>AI: Trả về kết quả phân tích & tổng hợp (Markdown)
    deactivate Gemini
    AI-->>BE: JSON Response (bản tóm tắt có cấu trúc)
    deactivate AI
    
    BE-->>Chair: Hiển thị bản phân tích Decision Copilot trên Dashboard
    deactivate BE
```

#### Giải thích sơ đồ tuần tự UC-03

Sơ đồ tuần tự minh họa dòng tương tác giữa các dịch vụ khi chủ tọa kích hoạt tính năng hỗ trợ quyết định:
1. **Thu thập dữ liệu thô:** Go Backend chịu trách nhiệm truy vấn PostgreSQL để gom toàn bộ ngữ cảnh liên quan của bài viết. Dữ liệu bao gồm các bản phản biện thô, phản hồi rebuttal và các đoạn chat thảo luận bảo mật giữa các reviewer.
2. **Định dạng Prompt:** Dữ liệu thô được gửi sang AI Service dưới dạng payload JSON. Tại đây, AI Service định dạng dữ liệu vào một prompt mẫu được thiết kế sẵn cho việc tổng hợp học thuật.
3. **Phân tích bằng Gemini:** Gemini API xử lý dữ liệu và trả về bản tổng hợp dưới dạng văn bản có cấu trúc (các điểm đồng thuận, bất đồng chính, đánh giá rebuttal). Kết quả cuối cùng được hiển thị trên dashboard để chair tham khảo. Toàn bộ quy trình này diễn ra bất đồng bộ, bảo vệ backend không bị block luồng xử lý do latency cao của LLM.

---

#### UC-04: Đăng ký, Đăng nhập & Xác thực tài khoản

**Mục tiêu:** Người dùng mới tạo tài khoản và xác thực email trước khi sử dụng hệ thống; người dùng đã có tài khoản đăng nhập hoặc khôi phục mật khẩu khi quên.

**Điều kiện tiên quyết:** Đối với đăng ký, người dùng chưa có tài khoản với email đó. Đối với đăng nhập, tài khoản đã tồn tại và đã xác thực email.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-04:**

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant FE as Frontend (Next.js)
    participant BE as Backend (Go/Gin)
    participant DB as PostgreSQL
    participant Mail as Brevo Email

    U->>FE: Nhập email, họ tên, mật khẩu, domain
    FE->>BE: POST /api/v1/auth/register
    BE->>DB: Tạo bản ghi users (email_verified=false)
    BE->>Mail: Gửi email xác thực kèm token
    Mail-->>U: Email xác thực
    U->>FE: Nhấp link xác thực
    FE->>BE: GET /api/v1/auth/verify-email?token=...
    BE->>DB: Cập nhật email_verified=true

    U->>FE: Nhập email/mật khẩu để đăng nhập
    FE->>BE: POST /api/v1/auth/login
    BE->>DB: Kiểm tra hashed_password
    DB-->>BE: Hợp lệ
    BE-->>FE: JWT token
    FE-->>U: Chuyển đến trang chọn vai trò

    opt Quên mật khẩu
        U->>FE: Yêu cầu reset mật khẩu
        FE->>BE: POST /forgot-password
        BE->>Mail: Gửi link reset kèm token
        U->>FE: Đặt mật khẩu mới qua link
        FE->>BE: POST /reset-password
        BE->>DB: Cập nhật hashed_password
    end
```

#### Giải thích sơ đồ tuần tự UC-04

1. **Đăng ký & xác thực:** Tài khoản được tạo với `email_verified=false`; người dùng chỉ được coi là hợp lệ đầy đủ sau khi nhấp link xác thực gửi qua Brevo — bước này ngăn tài khoản rác và đảm bảo email dùng để liên lạc (thông báo, lời mời) là email thật.
2. **Đăng nhập:** Backend so khớp `hashed_password` và trả về JWT; JWT này được dùng cho toàn bộ các request có xác thực sau đó, bao gồm cả bước chọn vai trò ở UC-05.
3. **Khôi phục mật khẩu:** Nhánh `opt` độc lập với luồng đăng nhập chính, dùng token một lần gửi qua email để tránh phải lưu mật khẩu cũ hoặc câu hỏi bảo mật.

---

#### UC-05: Chọn vai trò làm việc & Quản lý hồ sơ học thuật

**Mục tiêu:** Sau khi đăng nhập, người dùng chọn vai trò làm việc cho phiên hiện tại (vai trò được gán theo từng hội nghị, không phải toàn hệ thống) và có thể cập nhật hồ sơ cá nhân, chủ động liên kết hồ sơ Semantic Scholar để hỗ trợ matching và phát hiện COI chính xác hơn.

**Điều kiện tiên quyết:** Đã đăng nhập thành công (có JWT hợp lệ).

**Sơ đồ hoạt động (Activity Diagram) cho UC-05:**

```mermaid
flowchart TD
    Start([Đăng nhập thành công]) --> ChooseRole{Chọn vai trò làm việc}
    ChooseRole -- Author --> DashAuthor[Vào Dashboard Tác giả]
    ChooseRole -- Reviewer --> DashReviewer[Vào Dashboard Phản biện]
    ChooseRole -- Chair --> DashChair[Vào Dashboard Chủ tọa]

    DashAuthor --> ProfileCheck{Cập nhật hồ sơ?}
    DashReviewer --> ProfileCheck
    DashChair --> ProfileCheck

    ProfileCheck -- Có --> EditProfile[Sửa họ tên, affiliation, domain chuyên môn]
    EditProfile --> LinkScholar{Liên kết Semantic Scholar?}
    LinkScholar -- Có --> CallAPI[Gọi Semantic Scholar API đồng bộ hồ sơ]
    CallAPI --> CacheDB[("Lưu cache vào scholar_profiles, scholar_papers")]
    CacheDB --> SaveProfile[Lưu hồ sơ cập nhật]
    LinkScholar -- Không --> SaveProfile
    ProfileCheck -- Không --> SaveProfile
    SaveProfile --> End([Hoàn tất])
```

#### Giải thích sơ đồ hoạt động UC-05

1. **Vai trò theo hội nghị:** Việc chọn vai trò không phải là thuộc tính cố định của tài khoản mà được tra cứu qua bảng `conference_user_roles` — cùng một người có thể là Author ở hội nghị này và Reviewer ở hội nghị khác, đúng như mô tả ở mục 3.1.
2. **Quản lý hồ sơ:** Trường `domain` (mảng chuyên môn) và affiliation được dùng trực tiếp làm đầu vào cho thuật toán Jaccard matching ở UC-02, nên độ chính xác của hồ sơ ảnh hưởng trực tiếp đến chất lượng gợi ý phân công.
3. **Liên kết Semantic Scholar (chủ động):** Đây là hành động do người dùng khởi tạo (F-COM-07), khác với cơ chế cache tự động của backend khi gọi Semantic Scholar API mô tả ở mục 3.3.3 — liên kết chủ động đồng bộ toàn bộ publication history của người dùng, còn cache tự động chỉ lưu lại kết quả tra cứu theo yêu cầu để tránh gọi API lặp lại.

---

#### UC-06: Thông báo & Lịch trình cá nhân

**Mục tiêu:** Người dùng nhận thông báo realtime về các sự kiện liên quan (phân công mới, deadline sắp tới, quyết định...) và xem lịch tổng hợp các deadline theo vai trò đang hoạt động.

**Điều kiện tiên quyết:** Đã đăng nhập; kết nối WebSocket tới `/ws/notifications` đã được thiết lập.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-06:**

```mermaid
sequenceDiagram
    participant BE as Backend (Go/Gin)
    participant Hub as WebSocket Notification Hub
    actor U as Người dùng
    participant FE as Frontend
    participant DB as PostgreSQL

    Note over BE: Một sự kiện nghiệp vụ xảy ra (vd: assignment mới)
    BE->>DB: Lưu bản ghi notification
    BE->>Hub: Đẩy notification tới Hub
    Hub-->>FE: Push realtime qua WebSocket
    FE-->>U: Hiển thị badge & toast thông báo

    U->>FE: Mở danh sách thông báo
    FE->>BE: GET /api/v1/notifications
    BE->>DB: Truy vấn danh sách
    DB-->>BE: Danh sách notification
    BE-->>FE: Trả JSON
    U->>FE: Đánh dấu đã đọc / xóa thông báo

    U->>FE: Mở trang Lịch (Schedules)
    FE->>BE: GET lịch deadline theo vai trò
    BE->>DB: Tổng hợp deadline hội nghị/submission/review/rebuttal/camera-ready
    DB-->>BE: Danh sách deadline
    BE-->>FE: Lịch tổng hợp
    FE-->>U: Hiển thị Calendar view
```

#### Giải thích sơ đồ tuần tự UC-06

1. **Đẩy realtime:** Notification Hub tận dụng lại WebSocket Hub đã mô tả ở mục 3.3.2 (module `WebSocket`), cho phép một sự kiện nghiệp vụ bất kỳ (phân công, deadline, quyết định) được đẩy ngay đến người dùng đang mở phiên làm việc mà không cần polling.
2. **Danh sách & trạng thái đọc:** Ngoài kênh realtime, người dùng vẫn có thể truy vấn lại toàn bộ lịch sử thông báo qua REST API, đánh dấu đã đọc hoặc xóa — đây là kênh dự phòng khi kết nối WebSocket bị gián đoạn.
3. **Lịch tổng hợp:** Trang Lịch không phải là một bảng dữ liệu riêng mà là một view tổng hợp deadline từ nhiều bảng nghiệp vụ khác nhau (`conferences`, `conference_submissions`, cấu hình rebuttal...), giúp người dùng có một điểm nhìn duy nhất thay vì phải vào từng hội nghị để tra deadline.

---

#### UC-07: Discussion Thread theo bài nộp

**Mục tiêu:** Author, Reviewer và Chair trao đổi thông tin liên quan đến một bài nộp cụ thể trong một thread riêng biệt, có thể đính kèm tệp.

**Điều kiện tiên quyết:** Người dùng có quyền truy cập bài nộp (là tác giả, reviewer được phân công hoặc chair/co-chair của hội nghị).

**Sơ đồ hoạt động (Activity Diagram) cho UC-07:**

```mermaid
flowchart TD
    Start([Mở trang chi tiết bài nộp]) --> HasThread{Thread đã tồn tại?}
    HasThread -- Không --> CreateThread[Hệ thống tạo thread mới cho submission_id]
    HasThread -- Có --> LoadMessages[Tải danh sách message]
    CreateThread --> LoadMessages
    LoadMessages --> Compose[Người dùng soạn message kèm đính kèm tệp]
    Compose --> Send[Gửi message]
    Send --> DB[("Lưu vào bảng threads / messages")]
    DB --> Push[Đẩy realtime cho các thành viên khác trong thread]
    Push --> End([Hiển thị message mới trong thread])
```

#### Giải thích sơ đồ hoạt động UC-07

1. **Phạm vi truy cập:** Middleware `RequireSubmissionAccess` (đã mô tả ở mục 3.3.2) đảm bảo chỉ những người liên quan trực tiếp đến bài nộp mới đọc/gửi được message trong thread, tránh rò rỉ nội dung thảo luận nội bộ.
2. **Tái sử dụng hạ tầng realtime:** Message mới được đẩy qua cùng WebSocket Hub dùng cho thông báo (UC-06), nên các thành viên khác của thread thấy tin nhắn ngay lập tức mà không cần tải lại trang.
3. **Liên kết với các luồng khác:** Discussion Thread là hạ tầng dùng chung được UC-15 (Rebuttal & Thảo luận sau Đánh giá) và UC-03 (Decision Copilot) tái sử dụng — nội dung `discussion_messages` chính là một trong các nguồn dữ liệu thô mà Decision Copilot tổng hợp.

---

#### UC-08: Chatbot / Agent hỏi đáp

**Mục tiêu:** Người dùng tương tác với chatbot/agent để tra cứu nhanh thông tin (trạng thái bài nộp, deadline, hướng dẫn thao tác...) mà không cần điều hướng thủ công qua nhiều màn hình.

**Điều kiện tiên quyết:** Đã đăng nhập; AI Service (agent) khả dụng.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-08:**

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant FE as Frontend (/api/chat)
    participant BE as Backend (/api/v1/agent)
    participant Redis as Redis (Session cache)
    participant AI as AI Service (Agent)
    participant LLM as External LLM

    U->>FE: Gửi câu hỏi trong chat widget
    FE->>BE: POST /api/v1/agent/query (session_id, message)
    BE->>Redis: Lấy lịch sử hội thoại theo session_id
    Redis-->>BE: Context hội thoại trước đó
    BE->>AI: Forward request kèm context
    AI->>AI: Kiểm tra ngưỡng 70% context window -> Compaction nếu cần
    AI->>LLM: Gọi model kèm tool definitions
    LLM-->>AI: Phản hồi hoặc yêu cầu gọi tool

    opt LLM yêu cầu gọi tool
        AI->>BE: Gọi lại API nội bộ (X-Agent-Service-Token) để lấy dữ liệu
        BE-->>AI: Dữ liệu kết quả (vd: trạng thái submission)
        AI->>LLM: Gửi kết quả tool để tổng hợp câu trả lời
        LLM-->>AI: Câu trả lời cuối cùng
    end

    AI->>Redis: Cập nhật session cache
    AI-->>BE: Câu trả lời + chi tiết tiến trình tool call
    BE-->>FE: JSON response
    FE-->>U: Hiển thị câu trả lời & tool call đã thực hiện
```

#### Giải thích sơ đồ tuần tự UC-08

1. **Vị trí trong kiến trúc AI:** Về mặt kỹ thuật, agent dùng chung hạ tầng Redis session cache và cơ chế xác thực `X-Agent-Service-Token` đã mô tả ở mục 3.4.3, nhưng đây là workflow duy nhất trong hệ thống có khả năng **gọi ngược lại** Backend để lấy dữ liệu thời gian thực (qua UC-24) thay vì chỉ nhận dữ liệu một chiều như các workflow AI khác.
2. **Context compaction:** Khi lịch sử hội thoại vượt 70% giới hạn context window, AI Service tự nén ngữ cảnh trước khi gọi LLM, giảm chi phí token mà vẫn giữ đủ thông tin cho các lượt hỏi tiếp theo — cơ chế này áp dụng riêng cho chatbot vì đây là workflow duy nhất có hội thoại nhiều lượt.
3. **Vị trí còn thiếu trong tài liệu trước đây:** Trước bản cập nhật này, Chatbot/Agent chưa từng được liệt kê như một use case hay một trong sáu workflow AI ở mục 3.4.2, dù đã được nhắc đến gián tiếp qua cơ chế cache Redis ở mục 3.4.3.

---

#### UC-09: Ghi nhận Usage Event & Hướng dẫn nhanh theo vai trò

**Mục tiêu:** Hệ thống tự động ghi nhận hành vi sử dụng để phục vụ phân tích sản phẩm; người dùng mới xem hướng dẫn nhanh (onboarding) theo vai trò khi lần đầu sử dụng.

**Điều kiện tiên quyết:** Đã đăng nhập.

**Sơ đồ hoạt động (Activity Diagram) cho UC-09:**

```mermaid
flowchart TD
    Start([Người dùng thao tác trên hệ thống]) --> Trigger{Hành động thuộc danh sách theo dõi?}
    Trigger -- Có --> LogEvent[Frontend gửi usage event]
    LogEvent --> API[POST /api/v1/usage-events]
    API --> DB[("Lưu event vào PostgreSQL")]
    Trigger -- Không --> Skip[Không ghi nhận]

    Start --> FirstTime{Lần đầu vào vai trò này?}
    FirstTime -- Có --> ShowOnboarding["Hiển thị checklist & ảnh chụp hướng dẫn tại /role/onboarding"]
    ShowOnboarding --> Dismiss[Người dùng xem/đóng hướng dẫn]
    FirstTime -- Không --> Continue[Vào thẳng Dashboard]
```

#### Giải thích sơ đồ hoạt động UC-09

1. **Usage event:** Đây là cơ chế ghi log hành vi mang tính "nền", không hiển thị trực tiếp cho người dùng cuối, phục vụ việc đánh giá sản phẩm sau này (ví dụ: tỷ lệ dùng Autofill so với nhập tay).
2. **Onboarding theo vai trò:** Vì một tài khoản có thể giữ nhiều vai trò khác nhau ở các hội nghị khác nhau (mục 3.1), hướng dẫn nhanh được kích hoạt riêng theo từng vai trò — người dùng đã quen thuộc với vai trò Author vẫn có thể thấy hướng dẫn khi lần đầu đóng vai Reviewer.
3. **Mức độ ưu tiên thấp nhưng vẫn cần đặc tả:** Hai chức năng này không có AI hay logic nghiệp vụ phức tạp, nhưng vẫn thuộc nhóm F-COM-01→13 mà bản đặc tả trước đây bỏ sót hoàn toàn.

---

#### UC-10: Khám phá & Tìm kiếm Hội nghị

**Mục tiêu:** Tác giả tìm hội nghị phù hợp với lĩnh vực nghiên cứu trước khi nộp bài, có thể lọc theo domain/track/trạng thái và đánh dấu quan tâm để quay lại sau.

**Điều kiện tiên quyết:** Không bắt buộc đăng nhập để xem danh sách công khai; cần đăng nhập với vai trò Author để bookmark.

**Sơ đồ hoạt động (Activity Diagram) cho UC-10:**

```mermaid
flowchart TD
    Start([Vào trang Khám phá hội nghị]) --> Browse[Xem danh sách hội nghị đang mở]
    Browse --> FilterChoice{Cần lọc/tìm kiếm?}
    FilterChoice -- Có --> Filter[Nhập từ khóa / chọn domain, track, trạng thái]
    Filter --> Result[Danh sách hội nghị đã lọc]
    FilterChoice -- Không --> Result
    Result --> ViewDetail[Xem Overview / CFP / Deadline / Committee]
    ViewDetail --> Bookmark{Đánh dấu quan tâm?}
    Bookmark -- Có --> SaveBookmark[("Lưu bookmark")]
    Bookmark -- Không --> Decide{Nộp bài ngay?}
    SaveBookmark --> Decide
    Decide -- Có --> ToUC01[Chuyển sang UC-01: Nộp bài]
    Decide -- Không --> End([Kết thúc phiên khám phá])
```

#### Giải thích sơ đồ hoạt động UC-10

1. **Điểm vào của toàn bộ luồng Author:** Đây là use case xảy ra trước UC-01 trong hành trình thực tế của tác giả nhưng lại chưa từng được đặc tả — trước khi cập nhật, tài liệu coi như tác giả "đã biết" hội nghị nào cần nộp, bỏ qua bước tìm kiếm.
2. **Lọc và bookmark:** Bộ lọc theo domain/track giúp tác giả thu hẹp phạm vi khi hệ thống có nhiều hội nghị đang mở đồng thời; bookmark là tiện ích để quay lại một hội nghị đang cân nhắc mà chưa quyết định nộp ngay.
3. **Chuyển tiếp sang UC-01:** Sau khi xem chi tiết, nếu quyết định nộp bài, luồng chuyển thẳng sang UC-01 đã đặc tả ở trên — hai use case này nối tiếp nhau thành một hành trình liền mạch.

---

#### UC-11: Theo dõi trạng thái, Lưu nháp, Sửa & Rút bài

**Mục tiêu:** Tác giả quản lý vòng đời bài nộp sau khi đã khởi tạo: lưu nháp bài chưa hoàn chỉnh, theo dõi trạng thái theo thời gian thực, chỉnh sửa hoặc rút bài khi còn được phép theo policy hội nghị.

**Điều kiện tiên quyết:** Tác giả đã có ít nhất một bài nộp (draft hoặc submitted) tại hội nghị.

**Sơ đồ hoạt động (Activity Diagram) cho UC-11:**

```mermaid
flowchart TD
    Start([Vào trang My Submissions]) --> List[Xem danh sách bài đã nộp / nháp]
    List --> Choose{Chọn thao tác}
    Choose -- Tiếp tục nháp --> Draft[Mở form nháp, autosave định kỳ]
    Draft --> SaveDraft[("Lưu draft")]
    Choose -- Sửa bài đã nộp --> CheckWindow{Còn trong deadline/policy cho phép?}
    CheckWindow -- Có --> Edit[Cập nhật thông tin / tệp bản thảo]
    Edit --> SaveEdit[("Cập nhật submission")]
    CheckWindow -- Không --> Denied[Từ chối, hiển thị lý do]
    Choose -- Rút bài --> ConfirmWithdraw{Xác nhận rút bài?}
    ConfirmWithdraw -- Có --> Withdraw[("Cập nhật status = withdrawn")]
    Choose -- Xem trạng thái --> Status["Hiển thị timeline: draft -> submitted -> reviewing -> accepted/rejected"]
    SaveDraft --> End([Cập nhật danh sách])
    SaveEdit --> End
    Withdraw --> End
    Status --> End
    Denied --> End
```

#### Giải thích sơ đồ hoạt động UC-11

1. **Gộp bốn thao tác cùng bối cảnh:** Lưu nháp, theo dõi trạng thái, sửa và rút bài đều thao tác trên cùng một bản ghi `conference_submissions` sau khi đã tồn tại, nên được nhóm chung thành một use case thay vì tách bốn use case riêng lẻ, giữ đúng mức trừu tượng như các bubble hiện có trong sơ đồ.
2. **Autosave nháp:** Form nộp bài tự động lưu định kỳ trong lúc tác giả đang nhập liệu, tránh mất dữ liệu nếu phiên làm việc bị gián đoạn trước khi gửi chính thức.
3. **Ràng buộc theo policy:** Việc sửa hoặc rút bài chỉ được phép trong một cửa sổ thời gian nhất định (thường là trước deadline hoặc trước khi có phân công phản biện), do policy của từng hội nghị quyết định — hệ thống kiểm tra điều kiện này trước khi cho phép thao tác.

---

#### UC-12: Xem Quyết định cuối & Nộp Camera-ready

**Mục tiêu:** Sau khi Chair ra quyết định (UC-03), tác giả xem kết quả accept/reject; nếu bài được chấp nhận, tác giả nộp bản camera-ready trước deadline để đưa vào kỷ yếu hội nghị.

**Điều kiện tiên quyết:** Chair đã ra quyết định cho bài nộp.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-12:**

```mermaid
sequenceDiagram
    actor A as Tác giả
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    Note over BE: Chair đã lưu quyết định (UC-03)
    BE-->>A: Notification "Có quyết định mới"
    A->>FE: Mở trang chi tiết bài nộp
    FE->>BE: GET /submissions/:id
    BE->>DB: Lấy status, decision, lý do
    DB-->>BE: Dữ liệu quyết định
    BE-->>FE: Hiển thị Decision status

    alt Bài được chấp nhận
        A->>FE: Tải lên bản camera-ready trước deadline
        FE->>BE: POST /submissions/:id/camera-ready
        BE->>DB: Lưu file & cập nhật trạng thái
        BE-->>A: Xác nhận đã nhận camera-ready
    else Bài bị từ chối
        A->>FE: Xem lý do & phản biện tham khảo
    end
```

#### Giải thích sơ đồ tuần tự UC-12

1. **Điểm kết của hành trình Author:** Đây là use case khép lại toàn bộ vòng đời bài nộp phía tác giả, tiếp nối trực tiếp từ UC-03 (Decision Copilot) phía Chair — trước khi cập nhật, tài liệu dừng lại ở bước ra quyết định mà chưa mô tả điều gì xảy ra tiếp theo với tác giả.
2. **Hai nhánh rẽ:** Nếu bị từ chối, luồng chỉ dừng ở việc xem lại lý do và phản biện tham khảo; nếu được chấp nhận, luồng tiếp tục sang bước nộp camera-ready — một tệp bản thảo hoàn thiện cuối cùng để đưa vào kỷ yếu.
3. **Kiểm soát deadline:** Việc nộp camera-ready vẫn bị ràng buộc bởi deadline riêng (khác deadline nộp bài ban đầu), được Chair duyệt lại ở UC-20.

---

#### UC-13: Xử lý Lời mời Phản biện

**Mục tiêu:** Reviewer (thành viên hệ thống hoặc chuyên gia ngoài hệ thống) nhận, xem và phản hồi lời mời tham gia hội nghị hoặc phản biện một bài cụ thể.

**Điều kiện tiên quyết:** Chair đã gửi lời mời qua hệ thống hoặc qua email (UC-17).

**Sơ đồ tuần tự (Sequence Diagram) cho UC-13:**

```mermaid
sequenceDiagram
    actor R as Người phản biện
    participant Mail as Email (Brevo)
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    Note over BE: Chair gửi lời mời (UC-17)
    BE->>Mail: Gửi email lời mời kèm token (nếu là chuyên gia ngoài hệ thống)
    Mail-->>R: Email lời mời

    alt Reviewer đã có tài khoản
        R->>FE: Xem lời mời trong Dashboard
    else Chuyên gia ngoài hệ thống
        R->>FE: Nhấp link, đăng ký nhanh & khai báo domain nghiên cứu
        FE->>BE: POST /auth/register (kèm invitation token)
        BE->>DB: Tạo tài khoản, liên kết invitation
    end

    R->>FE: Chấp nhận hoặc Từ chối kèm lý do
    FE->>BE: POST /invitations/:id/respond
    BE->>DB: Cập nhật trạng thái accepted / declined
    DB-->>BE: OK
    BE-->>R: Xác nhận trạng thái tham gia
```

#### Giải thích sơ đồ tuần tự UC-13

1. **Hai đường tiếp nhận lời mời:** Reviewer nội bộ (đã có tài khoản) thấy lời mời ngay trong Dashboard; chuyên gia ngoài hệ thống (F-REV-22) đi qua một luồng đăng ký nhanh gắn kèm token lời mời, giúp họ tham gia mà không cần tự đăng ký từ đầu qua UC-04.
2. **Từ chối kèm lý do:** Lý do từ chối (không đúng chuyên môn, bận, xung đột lợi ích, lịch trình...) được lưu lại, hữu ích cho Chair khi cần hiểu vì sao tỷ lệ chấp nhận lời mời thấp và điều chỉnh chiến lược mời ở các vòng sau.
3. **Vị trí trong luồng end-to-end:** Đây là bước tiên quyết trước khi Chair có thể chạy thuật toán phân công ở UC-02 — chỉ những reviewer đã accepted mới được đưa vào tập ứng viên matching.

---

#### UC-14: Theo dõi & Lưu nháp Bài được phân công

**Mục tiêu:** Reviewer theo dõi tổng quan các bài được phân công, tìm/lọc theo trạng thái, xem hoặc tải bản thảo và lưu nháp đánh giá để hoàn thiện sau.

**Điều kiện tiên quyết:** Reviewer đã được phân công ít nhất một bài (assignment tồn tại).

**Sơ đồ hoạt động (Activity Diagram) cho UC-14:**

```mermaid
flowchart TD
    Start([Vào Dashboard Reviewer]) --> Overview[Xem tổng hợp assignment, deadline, trạng thái]
    Overview --> FilterChoice{Lọc/sắp xếp danh sách?}
    FilterChoice -- Có --> Filter["Lọc pending/accepted/declined/completed, sort theo deadline/title"]
    Filter --> Pick[Chọn một bài để xử lý]
    FilterChoice -- Không --> Pick
    Pick --> ViewFile[Xem/tải manuscript]
    ViewFile --> WriteReview[Bắt đầu / tiếp tục nhập đánh giá]
    WriteReview --> SaveDraft{Lưu nháp hay gửi ngay?}
    SaveDraft -- Lưu nháp --> Draft[("Lưu review draft")]
    SaveDraft -- Gửi ngay --> ToUC02[Chuyển sang UC-02: Đánh giá & Nhập điểm]
    Draft --> Completed[Xem lại danh sách đã hoàn thành]
    Completed --> End([Kết thúc phiên làm việc])
```

#### Giải thích sơ đồ hoạt động UC-14

1. **Lớp trung gian giữa lời mời và đánh giá:** Use case này lấp khoảng trống giữa UC-13 (đã accepted lời mời) và luồng nhập điểm chính thức — trước khi cập nhật, tài liệu bỏ qua toàn bộ giai đoạn reviewer "quản lý công việc" của mình trước khi thực sự chấm điểm.
2. **Lưu nháp:** Vì một bản đánh giá đầy đủ thường cần nhiều lần đọc và chỉnh sửa, hệ thống cho phép lưu nháp (F-REV-13) và có cơ chế override khi audit service lỗi (F-REV-16) để không chặn việc gửi review chỉ vì một dịch vụ phụ trợ gặp sự cố.
3. **Tìm/lọc:** Với reviewer được phân công nhiều bài trong một hội nghị lớn, bộ lọc theo trạng thái và sắp xếp theo deadline là điều kiện cần để quản lý khối lượng công việc hiệu quả.

---

#### UC-15: Rebuttal & Thảo luận sau Đánh giá

**Mục tiêu:** Sau khi tác giả gửi rebuttal, reviewer đọc phản hồi, đánh dấu từng điểm đã được giải quyết hay cần thảo luận thêm, tham gia thảo luận nội bộ và có thể cập nhật điểm/khuyến nghị.

**Điều kiện tiên quyết:** Giai đoạn rebuttal đã mở (UC-19) và tác giả đã gửi phản hồi cho bài được phân công.

**Sơ đồ hoạt động (Activity Diagram) cho UC-15:**

```mermaid
flowchart TD
    Start([Nhận thông báo có rebuttal mới]) --> Read["Đọc general response & per-point response"]
    Read --> Ack["Acknowledge từng điểm: addressed / needs discussion + note"]
    Ack --> DiscussChoice{Cần thảo luận thêm với Chair/Reviewer khác?}
    DiscussChoice -- Có --> Discuss[Gửi message trong Discussion Thread - UC-07]
    DiscussChoice -- Không --> UpdateChoice
    Discuss --> UpdateChoice{Cập nhật điểm/khuyến nghị?}
    UpdateChoice -- Có --> Update[Sửa score, recommendation, comment]
    Update --> Save[("Lưu post-rebuttal score")]
    UpdateChoice -- Không --> End([Giữ nguyên đánh giá ban đầu])
    Save --> End
```

#### Giải thích sơ đồ hoạt động UC-15

1. **Vế đối ứng của UC "Gửi bài Rebuttal" phía Author:** Sơ đồ Author/Reviewer/Chair ở mục 3.2.2 có bubble "Gửi bài Rebuttal" phía tác giả nhưng chưa từng mô tả điều reviewer làm sau khi nhận được phản hồi đó — UC-15 lấp đúng khoảng trống này.
2. **Acknowledge từng điểm:** Thay vì chỉ đọc rebuttal một cách tự do, reviewer đánh dấu trạng thái cho từng điểm phản hồi cụ thể (đã giải quyết / cần thảo luận thêm), giúp Chair và các reviewer khác nắm được tiến độ xử lý rebuttal mà không cần đọc lại toàn bộ nội dung.
3. **Cập nhật điểm là tùy chọn:** Reviewer không bắt buộc phải thay đổi điểm sau rebuttal; nếu rebuttal không làm thay đổi đánh giá ban đầu, luồng kết thúc mà không cần ghi đè `post-rebuttal score`.

---

#### UC-16: Dashboard & Danh sách Hội nghị quản lý

**Mục tiêu:** Chair có cái nhìn tổng quan về các hội nghị mình phụ trách: số bài nộp, tiến độ review, acceptance rate và các action cần xử lý ngay.

**Điều kiện tiên quyết:** Chair đã đăng nhập và có ít nhất một hội nghị được gán vai trò chair/co-chair.

**Sơ đồ hoạt động (Activity Diagram) cho UC-16:**

```mermaid
flowchart TD
    Start([Đăng nhập, chọn vai trò Chair]) --> LoadConfs[Lấy danh sách hội nghị mà user là chair/co-chair]
    LoadConfs --> Aggregate["Tổng hợp số submission, tiến độ review, acceptance rate"]
    Aggregate --> ActionList["Xác định action cần xử lý: review trễ hạn, thiếu reviewer..."]
    ActionList --> Render[Hiển thị Dashboard metrics + action list]
    Render --> Pick{Chọn hội nghị cụ thể?}
    Pick -- Có --> ToDetail[Vào trang chi tiết hội nghị]
    Pick -- Không --> End([Ở lại Dashboard tổng])
```

#### Giải thích sơ đồ hoạt động UC-16

1. **Điểm vào của toàn bộ luồng Chair:** Tương tự UC-10 phía Author, đây là use case xảy ra đầu tiên trong hành trình thực tế của Chair nhưng trước đó chưa từng được vẽ — sơ đồ cũ đưa Chair thẳng vào "Cấu hình Hội nghị" như thể hội nghị đã tồn tại sẵn.
2. **Action list chủ động:** Thay vì chỉ hiển thị số liệu thụ động, dashboard xác định các action cần chú ý (review trễ hạn, chưa đủ reviewer tối thiểu...), giúp Chair phát hiện vấn đề mà không cần chủ động rà từng hội nghị.
3. **Vai trò co-chair:** Danh sách hội nghị bao gồm cả những hội nghị mà người dùng là co-chair (không chỉ chair chính), phản ánh đúng mô hình quyền hạn đã mô tả ở 3.2.1.

---

#### UC-17: Mời & Quản lý Ban tổ chức (Committee)

**Mục tiêu:** Chair mời reviewer, PC hoặc co-chair tham gia hội nghị — người đã có tài khoản hoặc chuyên gia ngoài hệ thống qua email — và theo dõi/quản lý trạng thái tham gia.

**Điều kiện tiên quyết:** Hội nghị đã được tạo và đang trong giai đoạn cho phép mời committee.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-17:**

```mermaid
sequenceDiagram
    actor C as Chủ tọa
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant Mail as Brevo Email

    C->>FE: Nhập email & chọn vai trò (reviewer/PC/co-chair)
    FE->>BE: POST /conferences/:id/invitations
    alt Người dùng đã có tài khoản
        BE->>DB: Tạo bản ghi conference_user_roles (pending)
        BE->>Mail: Gửi thông báo lời mời trong hệ thống
    else Người dùng chưa có tài khoản
        BE->>DB: Tạo external invitation kèm token
        BE->>Mail: Gửi email lời mời kèm token
    end
    Note over C: Xem UC-13 phía Reviewer cho luồng phản hồi tương ứng

    C->>FE: Xem danh sách trạng thái pending/accepted/declined
    FE->>BE: GET /conferences/:id/committee
    BE->>DB: Truy vấn trạng thái
    DB-->>BE: Danh sách
    BE-->>C: Hiển thị bảng trạng thái, cho phép xóa reviewer khỏi hội nghị
```

#### Giải thích sơ đồ tuần tự UC-17

1. **Cặp use case đối ứng với UC-13:** Đây là nửa phía Chair của cùng một quy trình mời — UC-17 phát sinh sự kiện, UC-13 xử lý phản hồi từ phía reviewer/PC được mời.
2. **Hai loại người được mời:** Với người đã có tài khoản, lời mời chỉ là một bản ghi vai trò ở trạng thái pending; với người chưa có tài khoản, hệ thống phát sinh thêm token invitation gắn với luồng đăng ký nhanh ở UC-13.
3. **Quản lý trạng thái:** Chair có thể theo dõi ai đã chấp nhận/từ chối và xóa reviewer khỏi hội nghị nếu cần — dữ liệu này là tiền đề để UC-02 chỉ đưa các reviewer đã accepted vào tập ứng viên matching.

---

#### UC-18: Danh sách & Chi tiết Bài nộp

**Mục tiêu:** Chair tìm, lọc, xem chi tiết từng bài nộp (metadata, tác giả, file, review, timeline, discussion, history) và có thể cập nhật nhanh trạng thái xử lý.

**Điều kiện tiên quyết:** Hội nghị đã có ít nhất một bài nộp.

**Sơ đồ hoạt động (Activity Diagram) cho UC-18:**

```mermaid
flowchart TD
    Start([Vào tab Submissions của hội nghị]) --> Filter["Tìm/lọc theo track, status; sort theo ID/title/score"]
    Filter --> Table[Hiển thị bảng danh sách bài nộp]
    Table --> SelectOne[Chọn một bài để xem chi tiết]
    SelectOne --> Detail[Xem metadata, tác giả, file, review, timeline, discussion, history]
    Detail --> QuickAction{Cần cập nhật trạng thái nhanh?}
    QuickAction -- Có --> UpdateStatus[Chuyển accepted/rejected hoặc trạng thái xử lý khác]
    UpdateStatus --> Save[("Cập nhật submission status")]
    QuickAction -- Không --> End([Quay lại danh sách])
    Save --> End
```

#### Giải thích sơ đồ hoạt động UC-18

1. **Trang trung tâm của Chair khi xử lý bài nộp:** Đây là nơi Chair truy cập trước khi chuyển sang các use case chuyên biệt hơn như COI (UC-02), phân công (UC-02) hoặc quyết định (UC-03) — trước khi cập nhật, các use case chuyên biệt đó có trong sơ đồ nhưng thiếu "trang cửa ngõ" dẫn vào chúng.
2. **Xem chi tiết đa nguồn:** Trang chi tiết bài nộp tổng hợp dữ liệu từ nhiều bảng khác nhau (submission, review, discussion, history) thành một view duy nhất, tương tự cách UC-03 tổng hợp dữ liệu cho Decision Copilot nhưng ở đây là hiển thị thô, không qua xử lý AI.
3. **Cập nhật trạng thái nhanh:** Tách biệt với quyết định chính thức ở UC-03 (vốn cần đủ điều kiện rebuttal/review), đây là thao tác cập nhật trạng thái xử lý nhanh cho các tình huống khác (ví dụ đánh dấu đang xem xét thêm).

---

#### UC-19: Cấu hình & Mở Rebuttal

**Mục tiêu:** Chair thiết lập tham số giai đoạn rebuttal (deadline, giới hạn ký tự, policy), mở giai đoạn để tác giả phản hồi, và mở thảo luận sâu hơn sau khi có phản hồi.

**Điều kiện tiên quyết:** Bài nộp đã có đủ số phản biện tối thiểu theo cấu hình hội nghị.

**Sơ đồ hoạt động (Activity Diagram) cho UC-19:**

```mermaid
flowchart TD
    Start([Chair vào tab Rebuttal Settings]) --> Config["Thiết lập deadline, character limit, policy"]
    Config --> SaveConfig[("Lưu rebuttal config")]
    SaveConfig --> OpenChoice{Mở giai đoạn rebuttal ngay?}
    OpenChoice -- Có --> Open["Chuyển phase sang 'rebuttal open'"]
    Open --> Notify[Thông báo cho tác giả liên quan]
    OpenChoice -- Không --> Wait[Chờ thời điểm đã cấu hình / kích hoạt thủ công sau]
    Notify --> AuthorSubmit["Tác giả gửi phản hồi (UC-11), Reviewer xử lý (UC-15)"]
    AuthorSubmit --> Finalize{Kết thúc giai đoạn rebuttal?}
    Finalize -- Có --> Close[Finalize phase]
    Close --> DiscussOpen{Mở discussion sâu hơn?}
    DiscussOpen -- Có --> OpenDiscuss[Mở discussion phase cho reviewer/chair]
    DiscussOpen -- Không --> End([Sẵn sàng cho UC-03: Decision Copilot])
    OpenDiscuss --> End
```

#### Giải thích sơ đồ hoạt động UC-19

1. **Nút thắt giữa Review và Decision:** Trước khi cập nhật, sơ đồ có bubble "Gửi bài Rebuttal" phía Author nhưng không có bubble nào phía Chair mô tả ai là người mở giai đoạn này — UC-19 lấp đúng khoảng trống đó, đồng thời là điều kiện tiên quyết chính thức cho UC-03.
2. **Ba tham số cấu hình:** Deadline, giới hạn ký tự phản hồi và policy (ví dụ số điểm tối đa được phản hồi) được cấu hình trước khi mở, tránh tình huống tác giả phản hồi không giới hạn gây khó cho reviewer khi đọc.
3. **Mở discussion là bước tùy chọn:** Không phải hội nghị nào cũng cần thảo luận sâu sau rebuttal; Chair có thể bỏ qua bước này và chuyển thẳng sang ra quyết định nếu rebuttal đã đủ rõ ràng.

---

#### UC-20: Duyệt Camera-ready

**Mục tiêu:** Sau khi bài được chấp nhận và tác giả nộp bản camera-ready, Chair kiểm tra và xác nhận bản cuối trước khi đưa vào kỷ yếu hội nghị.

**Điều kiện tiên quyết:** Bài nộp có status accepted và tác giả đã nộp camera-ready (UC-12).

**Sơ đồ hoạt động (Activity Diagram) cho UC-20:**

```mermaid
flowchart TD
    Start([Chair vào tab Camera-ready]) --> List[Xem danh sách bài accepted đã/chưa nộp camera-ready]
    List --> CheckOne[Mở một bài để kiểm tra]
    CheckOne --> ViewFile[Xem/tải file camera-ready]
    ViewFile --> Decision{Đạt yêu cầu?}
    Decision -- Có --> Approve[Đánh dấu đã duyệt]
    Decision -- Không --> RequestChange[Yêu cầu tác giả nộp lại kèm ghi chú]
    Approve --> End([Hoàn tất kỷ yếu])
    RequestChange --> Notify[Thông báo cho tác giả]
    Notify --> End
```

#### Giải thích sơ đồ hoạt động UC-20

1. **Use case khép lại toàn bộ luồng end-to-end:** UC-20 là bước cuối cùng nối tiếp UC-12 phía Author, hoàn thiện vòng đời bài nộp từ khám phá hội nghị (UC-10) đến kỷ yếu cuối cùng.
2. **Vòng lặp yêu cầu nộp lại:** Nếu bản camera-ready chưa đạt yêu cầu định dạng hoặc nội dung, Chair có thể yêu cầu tác giả nộp lại kèm ghi chú cụ thể, tạo thành một vòng lặp ngắn giữa UC-12 và UC-20 cho đến khi đạt yêu cầu.
3. **Trước đây hoàn toàn vắng mặt:** Trước bản cập nhật này, "camera-ready" chưa từng xuất hiện ở bất kỳ sơ đồ hay đặc tả nào của Chương 3, dù có mã chức năng F-CHAIR-31 và F-AUTHOR-20 trong danh sách chức năng.

---

#### UC-21: Xem Tổng quan Hội nghị (PC — Read-only)

**Mục tiêu:** Thành viên Ban chương trình (PC) theo dõi thông tin hội nghị, danh sách bài nộp và thống kê tổng hợp ở chế độ chỉ đọc, không can thiệp vào quy trình nghiệp vụ.

**Điều kiện tiên quyết:** PC đã được mời và chấp nhận tham gia hội nghị (UC-17).

**Sơ đồ hoạt động (Activity Diagram) cho UC-21:**

```mermaid
flowchart TD
    Start([PC đăng nhập, chọn hội nghị]) --> CheckRole{Role = pc?}
    CheckRole -- Có --> ReadOnly["Cấp quyền xem: danh sách bài nộp, review, thống kê"]
    ReadOnly --> Browse[Duyệt các tab được phép xem]
    Browse --> Attempt{Thử thao tác chỉnh sửa?}
    Attempt -- Có --> Blocked["Middleware chặn - HTTP 403"]
    Attempt -- Không --> End([Kết thúc phiên xem])
    Blocked --> End
    CheckRole -- Không --> Deny[Từ chối truy cập]
```

#### Giải thích sơ đồ hoạt động UC-21

1. **Tác nhân bị bỏ sót hoàn toàn trước đây:** Dù mục 3.2.1 mô tả rõ PC "có quyền đọc và tổng quan, không có quyền can thiệp vào quy trình nghiệp vụ", PC chưa từng xuất hiện trong bất kỳ sơ đồ use case nào của Chương 3 trước bản cập nhật này.
2. **Ràng buộc quyền ở tầng middleware:** Cùng middleware RBAC cấp hội nghị mô tả ở mục 3.3.2 được tái sử dụng cho PC — thay vì có một bộ route riêng, PC dùng chung route với Chair nhưng bị chặn ở các hành động ghi (POST/PATCH/DELETE), chỉ còn lại GET.
3. **Giá trị của việc hiển thị tường minh:** Việc vẽ riêng UC-21 giúp người đọc tài liệu hiểu PC không phải là "Chair rút gọn" mà là một tác nhân độc lập với ranh giới quyền hạn rõ ràng (F-CHAIR-32).

---

#### UC-22: Vận hành & Khắc phục sự cố Hệ thống (Admin)

**Mục tiêu:** Quản trị hệ thống thực hiện các thao tác vận hành nội bộ như xem dữ liệu thô, cưỡng bức đồng bộ dữ liệu hoặc khắc phục sự cố mà không đi qua luồng nghiệp vụ thông thường.

**Điều kiện tiên quyết:** Request có header `X-Admin-Token` hợp lệ.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-22:**

```mermaid
sequenceDiagram
    actor Ad as Quản trị hệ thống
    participant BE as Backend (Go/Gin)
    participant Mid as Admin Middleware
    participant DB as PostgreSQL / Neo4j

    Ad->>BE: Gửi request kèm header X-Admin-Token
    BE->>Mid: Xác thực token quản trị
    alt Token hợp lệ
        Mid-->>BE: Cho phép truy cập route admin
        BE->>DB: Thực hiện thao tác (xem dữ liệu thô / cưỡng bức đồng bộ / sửa lỗi dữ liệu)
        DB-->>BE: Kết quả
        BE-->>Ad: Trả kết quả thao tác
    else Token không hợp lệ
        Mid-->>BE: Từ chối (401/403)
        BE-->>Ad: Lỗi xác thực
    end
```

#### Giải thích sơ đồ tuần tự UC-22

1. **Tác nhân đặc biệt, không phải người dùng cuối:** Đúng như mô tả ở 3.2.1, Admin không đăng nhập qua luồng JWT thông thường (UC-04) mà dùng một shared secret riêng (`X-Admin-Token`), tách biệt hoàn toàn khỏi RBAC cấp hội nghị dùng cho Author/Reviewer/Chair/PC.
2. **Không có mã F-code tương ứng:** Vì báo cáo danh sách chức năng theo vai trò (feature-list-by-role-report.md) tập trung vào ba vai trò nghiệp vụ chính và PC, các thao tác Admin không được gán mã F-XXX — UC-22 dựa trực tiếp trên mô tả bằng lời ở mục 3.2.1 của chương này.
3. **Phạm vi sử dụng:** Đây là các thao tác vận hành mang tính khắc phục sự cố (incident response), không phải một tính năng người dùng cuối tương tác thường xuyên, nên tần suất sử dụng thấp nhưng mức độ nhạy cảm cao.

---

#### UC-23: Tự động Kết thúc Rebuttal quá hạn (Cron Job)

**Mục tiêu:** Hệ thống tự động chuyển giai đoạn rebuttal đã quá deadline sang trạng thái đóng, không cần Chair thao tác thủ công, đảm bảo tiến độ hội nghị không bị treo vô thời hạn.

**Điều kiện tiên quyết:** Có bài nộp đang ở giai đoạn rebuttal với deadline đã qua.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-23:**

```mermaid
sequenceDiagram
    participant Cron as Cron Scheduler
    participant BE as Backend (Go)
    participant DB as PostgreSQL
    participant Hub as Notification Hub

    loop Chạy định kỳ
        Cron->>BE: Kích hoạt job kiểm tra rebuttal quá hạn
        BE->>DB: Truy vấn submissions có rebuttal_deadline < now() và phase = 'open'
        DB-->>BE: Danh sách bài quá hạn
        alt Có bài quá hạn
            BE->>DB: Cập nhật phase = 'closed'
            BE->>Hub: Thông báo Chair & Reviewer liên quan
        else Không có bài quá hạn
            BE-->>Cron: Không có thay đổi
        end
    end
```

#### Giải thích sơ đồ tuần tự UC-23

1. **Tác nhân không qua giao diện người dùng:** Đây là một trong hai use case của "Tác nhân hệ thống" mô tả ở 3.2.1 — không có màn hình, không có thao tác thủ công, chỉ có một job chạy định kỳ trên Backend.
2. **Vai trò trong tính tự động hóa:** Nếu không có cơ chế này, một Chair quên mở/đóng thủ công giai đoạn rebuttal có thể khiến hội nghị bị treo vô thời hạn ở bước chờ phản hồi tác giả — cron job đảm bảo tiến độ luôn được duy trì mà không phụ thuộc vào sự chủ động của con người.
3. **Thông báo sau khi tự động đóng:** Sau khi đóng, hệ thống vẫn đẩy thông báo cho Chair và Reviewer liên quan qua Notification Hub (UC-06), giữ tính minh bạch dù hành động là tự động.

---

#### UC-24: AI Service gọi ngược Backend (Agent Callback)

**Mục tiêu:** AI Service (đóng vai trò tác nhân hệ thống) gọi ngược vào Backend để lấy hoặc cập nhật dữ liệu nghiệp vụ cần thiết khi thực thi workflow — điển hình là khi Chatbot/Agent (UC-08) cần tra cứu dữ liệu thời gian thực để trả lời người dùng.

**Điều kiện tiên quyết:** AI Service đang xử lý một workflow cần dữ liệu nghiệp vụ thời gian thực.

**Sơ đồ tuần tự (Sequence Diagram) cho UC-24:**

```mermaid
sequenceDiagram
    participant AI as AI Service (FastAPI)
    participant BE as Backend (Go/Gin)
    participant Mid as Agent Middleware
    participant DB as PostgreSQL

    AI->>BE: Gọi API nội bộ kèm header X-Agent-Service-Token
    BE->>Mid: Xác thực shared secret
    alt Token hợp lệ
        Mid-->>BE: Cho phép truy cập
        BE->>DB: Truy vấn/cập nhật dữ liệu theo yêu cầu
        DB-->>BE: Kết quả
        BE-->>AI: Trả JSON kết quả
    else Token không hợp lệ
        Mid-->>BE: Từ chối truy cập
        BE-->>AI: HTTP 401
    end
```

#### Giải thích sơ đồ tuần tự UC-24

1. **Chiều gọi ngược lại với các workflow AI khác:** Ở năm workflow AI còn lại (Autofill, Track Recommendation, Submission Gating, Reviewer Initial Analysis, Review Quality Auditor, Decision Copilot), Backend luôn là bên chủ động gọi sang AI Service. UC-24 là chiều duy nhất đảo ngược: AI Service chủ động gọi lại Backend, phát sinh trực tiếp từ nhu cầu của Chatbot/Agent ở UC-08.
2. **Cùng cơ chế xác thực đã mô tả:** `X-Agent-Service-Token` là shared secret đã được mô tả ở mục 3.4.3, đảm bảo chỉ AI Service nội bộ (không phải một client bên ngoài bất kỳ) mới gọi được các API nhạy cảm này.
3. **Tác nhân hệ thống thứ hai:** Cùng với UC-23, đây là use case thứ hai của "Tác nhân hệ thống" — khác ở chỗ UC-23 là tác vụ định kỳ chủ động, còn UC-24 là phản ứng theo yêu cầu (on-demand) khi có một workflow AI cần dữ liệu thời gian thực.

---

## 3.3. Thiết kế kỹ thuật

### 3.3.1. Kiến trúc tổng thể

ConferenceSpace áp dụng mô hình **kiến trúc nhiều dịch vụ ở mức triển khai** (service-oriented deployment), trong đó backend nghiệp vụ chính được tổ chức theo **kiến trúc phân lớp** (layered architecture) như một monolith, còn AI được tách thành một dịch vụ độc lập giao tiếp qua HTTP. Sự phân tách này không phải vì microservices là xu hướng mà vì có lý do kỹ thuật cụ thể: các workflow AI vốn có latency cao, phụ thuộc vào model provider bên ngoài và có thể thay đổi nhanh theo sự phát triển của LLM — những đặc điểm này cần được cô lập để không ảnh hưởng đến sự ổn định của lớp nghiệp vụ cốt lõi.

Về mặt tổng thể, hệ thống gồm bốn thành phần chính. **Frontend** được xây dựng bằng Next.js 15, đóng vai trò giao diện cho người dùng và cũng hoạt động như một proxy layer để ẩn URL backend khỏi phía trình duyệt. **Backend Go/Gin** là trung tâm xử lý nghiệp vụ, cung cấp REST API tại `/api/v1` và phục vụ kết nối WebSocket realtime tại `/ws/notifications`. **AI Service Python/FastAPI** xử lý các workflow AI có latency cao và tích hợp với các model provider (Gemini, OpenRouter). **Hệ thống dữ liệu** gồm PostgreSQL cho dữ liệu quan hệ, Neo4j cho đồ thị đồng tác giả và Redis cho cache và runtime state của AI Service.

Luồng tương tác giữa các thành phần được thiết kế có chủ đích rõ ràng. Trình duyệt chỉ giao tiếp với Frontend Next.js thông qua Caddy reverse proxy — không có đường dẫn trực tiếp từ trình duyệt đến backend Go hay AI Service. Frontend gọi backend qua route proxy nội bộ (`/api/backend/*`), và backend gọi AI Service qua mạng Docker nội bộ. Thiết kế này tạo ra một vành đai bảo vệ nhất quán và giảm bề mặt tấn công đáng kể.

Các thành phần tùy chọn (Neo4j, Semantic Scholar, AI Service) được thiết kế theo nguyên tắc **graceful degradation**: nếu không được cấu hình, hệ thống tự động tắt các tính năng liên quan mà không gây lỗi đối với các chức năng cốt lõi. Điều này giúp hệ thống có thể triển khai ở nhiều mức độ cấu hình khác nhau tùy theo tài nguyên sẵn có.

---

### 3.3.2. Thiết kế backend

Backend của ConferenceSpace được viết bằng Go 1.24 với framework Gin, tổ chức theo kiến trúc phân lớp rõ ràng trong thư mục `internal/`. Quyết định dùng Go thay vì Node.js hay Python/FastAPI xuất phát từ ba yếu tố kỹ thuật chính: hiệu năng cao nhờ biên dịch thành binary, mô hình concurrency đơn giản và hiệu quả qua goroutines (đặc biệt phù hợp khi gọi AI API đồng thời cho nhiều request), và kiểu tĩnh giúp phát hiện lỗi tại compile-time trong một codebase lớn. Kết quả benchmark thực tế trên tập dữ liệu 300 hội nghị và 15.000 bài nộp cho thấy backend xử lý được 369–572 request/giây với p95 latency dưới 120ms, trong khi container API chỉ sử dụng trung bình 28% CPU của một core và khoảng 30 MB RAM — Go là lựa chọn phù hợp về hiệu năng với tài nguyên tiêu thụ tối thiểu.

Kiến trúc phân lớp trong `internal/` gồm các tầng với luồng phụ thuộc một chiều từ trên xuống. Tầng **Controller** (`internal/controller/`) là điểm tiếp nhận HTTP request từ Gin router, chịu trách nhiệm parse request, gọi service tương ứng và trả response — Controller không chứa logic nghiệp vụ, đây là nguyên tắc cốt lõi giúp logic không bị ràng buộc vào HTTP framework. Tầng **Service** (`internal/service/`) chứa toàn bộ logic nghiệp vụ: validation phức tạp, orchestrate các lời gọi đến Storage và các dịch vụ bên ngoài, và thực hiện các quy tắc như kiểm tra quyền truy cập tài nguyên và chuyển đổi trạng thái bài nộp. Tầng **Storage** (`internal/storage/`) triển khai Repository Pattern — một interface ẩn chi tiết cài đặt cơ sở dữ liệu, giúp việc kiểm thử và thay thế implementation trở nên dễ dàng hơn. Tầng **Model** (`internal/model/`) định nghĩa các entity domain và DTO dùng để truyền dữ liệu giữa các tầng.

Ngoài bốn tầng chính, backend còn có các module chuyên biệt phục vụ các nhu cầu cụ thể. Module **Middleware** xử lý xác thực JWT, phân quyền và CORS ở mức framework. Module **Orchestrator** điều phối các workflow phức tạp đòi hỏi phối hợp nhiều service. Module **Clients** bọc các lời gọi đến dịch vụ bên ngoài như AI Service, Neo4j, Semantic Scholar API và Brevo Email. Module **Assignment** chứa domain riêng cho matching, scoring và COI với ba thành phần con là `matching/`, `scoring/` và `coi/`. Module **DeskRejection** triển khai pipeline kiểm tra sơ bộ bản thảo theo mô hình extractor → checkers → evaluator. Module **WebSocket** quản lý Hub thông báo realtime, hỗ trợ nhiều kết nối đồng thời từ cùng một người dùng.

Toàn bộ các phụ thuộc được khởi tạo rõ ràng (Dependency Injection) tại điểm entry `cmd/server/main.go` thông qua struct `AppContext`. Cách tiếp cận này giúp dòng phụ thuộc của cả ứng dụng có thể đọc hiểu chỉ bằng cách nhìn vào hàm `main`, tránh "magic" không rõ nguồn gốc và làm cho việc kiểm thử unit test trở nên trực tiếp hơn.

Phân quyền được thiết kế theo mô hình **RBAC cấp hội nghị** (per-conference RBAC). Mỗi request đến các endpoint hội nghị cụ thể đều đi qua middleware kiểm tra cả JWT token (xác thực danh tính) lẫn vai trò của người dùng trong hội nghị đó (phân quyền). Các middleware phân quyền chuyên biệt như `RequireChairOrCoChair`, `RequireSubmissionAccess`, `RequireAssignmentOwner` giúp kiểm soát truy cập ở mức chi tiết mà không cần nhúng logic phân quyền vào từng handler.

#### Sơ đồ phụ thuộc các tầng trong Go Backend

```mermaid
graph TD
    %% Tầng hiển thị và Router
    subgraph Layer_HTTP ["HTTP Layer"]
        Gin_Router["Gin Engine / Routing"]
        Controller["Controller Module (/internal/controller)"]
    end

    %% Tầng Nghiệp vụ
    subgraph Layer_Business ["Business Logic Layer"]
        Orchestrator["Orchestrator Module (/internal/orchestrator)"]
        Service["Service Module (/internal/service)"]
        Domain_Models["Domain Models (/internal/model)"]
    end

    %% Tầng tích hợp và dữ liệu
    subgraph Layer_Data ["Data & Client Layer"]
        Storage["Storage Repository (/internal/storage)"]
        Clients["Clients Module (/internal/clients)"]
    end

    %% Luồng phụ thuộc một chiều
    Gin_Router --> Controller
    Controller --> Service
    Orchestrator --> Service
    Service --> Storage
    Service --> Clients
    Storage --> Domain_Models
    
    %% Chú thích dependency
    linkStyle 1 stroke:#2ecd71,stroke-width:2px;
    linkStyle 3 stroke:#2ecd71,stroke-width:2px;
```

#### Giải thích sơ đồ phụ thuộc Go Backend

Sơ đồ trên thể hiện nguyên lý phụ thuộc một chiều (Clean/Layered Architecture) trong Go backend:
1. **Tính độc lập:** Các package bên trên (`HTTP Layer`) phụ thuộc vào các package bên dưới (`Business Logic Layer`), và tầng nghiệp vụ phụ thuộc vào tầng dữ liệu (`Data & Client Layer`). Không có sự phụ thuộc ngược chiều.
2. **Orchestrator:** Được đặt ngang hàng với Service để điều phối các tác vụ liên vùng nghiệp vụ (ví dụ: đăng ký và gửi email đồng thời), tránh việc các Service gọi chéo nhau tạo thành vòng lặp phụ thuộc (circular dependency).
3. **Clients:** Nằm ở tầng thấp nhất, chịu trách nhiệm đóng gói các kết nối ra ngoài (Gemini, Neo4j, Semantic Scholar). Điều này đảm bảo khi thay đổi API của bên thứ ba, chúng ta chỉ cần sửa đổi code trong thư mục `/internal/clients` mà không làm ảnh hưởng đến logic nghiệp vụ cốt lõi của Service.

---

### 3.3.3. Thiết kế dữ liệu

Hệ thống ConferenceSpace sử dụng chiến lược lưu trữ dữ liệu kép: **PostgreSQL** cho dữ liệu quan hệ với cấu trúc xác định và **Neo4j** cho dữ liệu đồ thị quan hệ đồng tác giả. Quyết định này phản ánh bản chất của từng loại dữ liệu: dữ liệu hội nghị, bài nộp và phản biện có cấu trúc rõ ràng phù hợp với mô hình quan hệ, trong khi mạng đồng tác giả là dữ liệu đồ thị mà các truy vấn duyệt theo chiều sâu nhiều bậc sẽ rất tốn kém nếu thực hiện bằng SQL JOIN.

PostgreSQL lưu trữ toàn bộ dữ liệu nghiệp vụ cốt lõi, với schema được quản lý thông qua migration files có phiên bản (golang-migrate). Bảng `users` lưu tài khoản người dùng với trường `domain` kiểu `TEXT[]` — mảng domain chuyên môn — thay vì bảng phụ, giúp query matching đơn giản hơn với toán tử `= ANY(domain)`. Bảng `conferences` có cột `configurations` kiểu JSONB lưu cấu hình linh hoạt như số reviewer tối thiểu, quy tắc double-blind và template phiếu đánh giá; dùng JSONB thay vì nhiều cột riêng lẻ cho phép cấu hình mở rộng mà không cần thay đổi schema, phù hợp với sự đa dạng cấu hình của các hội nghị khác nhau. Bảng `paper_assignments` có ràng buộc UNIQUE(`submission_id`, `reviewer_id`) để đảm bảo mỗi reviewer chỉ phụ trách một bài một lần, với cột `review_data` kiểu JSONB lưu chi tiết đánh giá theo cấu trúc linh hoạt phù hợp với mỗi hội nghị có tiêu chí đánh giá khác nhau.

Bảng `coi_relationships` lưu các quan hệ xung đột lợi ích phát hiện được, kèm loại quan hệ (`self_author`, `declared`, `co_authorship`), mức độ nghiêm trọng và cột `evidence` kiểu JSONB lưu bằng chứng cụ thể như danh sách bài báo đồng tác giả. Việc lưu trữ bằng chứng giúp chair có cơ sở để xem xét và quyết định, thay vì chỉ nhận một cờ cảnh báo không rõ nguồn gốc. Các bảng `scholar_profiles` và `scholar_papers` lưu cache dữ liệu từ Semantic Scholar API, tránh gọi API lặp lại và đảm bảo hệ thống hoạt động được ngay cả khi Semantic Scholar API tạm thời không khả dụng.

Neo4j lưu trữ đồ thị đồng tác giả phục vụ phát hiện COI nhiều bậc với mô hình đơn giản nhưng hiệu quả: node `:Author` (thuộc tính `email` có unique constraint, `name`) và relationship `:COAUTHORED` (thuộc tính `established_date` có index, `paper_link`). Khi cần kiểm tra COI giữa một reviewer và một tác giả bài nộp, hệ thống thực hiện truy vấn Cypher duyệt đồ thị với độ sâu tối đa 2 bậc:

```cypher
MATCH (r:Author {email: $reviewer})-[:COAUTHORED*1..2]-(a:Author {email: $author})
RETURN r, a
```

Với SQL thuần, truy vấn tương đương đòi hỏi nhiều lượt JOIN lồng nhau và hiệu năng giảm mạnh khi đồ thị có hàng triệu quan hệ. Neo4j tối ưu hóa graph traversal ở mức engine, cho kết quả nhanh hơn đáng kể cho loại truy vấn này. Quan trọng là Neo4j được thiết kế như thành phần tùy chọn: backend kiểm tra sự khả dụng khi khởi động và chỉ kích hoạt `RelationshipDetector` khi kết nối Neo4j thành công, trong khi hai lớp COI còn lại luôn hoạt động độc lập.

#### Sơ đồ Quan hệ Thực thể (PostgreSQL ERD) và Đồ thị (Neo4j Schema)

```mermaid
classDiagram
    %% PostgreSQL tables
    class USERS {
        UUID user_id
        String email
        String hashed_password
        String[] domain
        Boolean email_verified
    }
    
    class CONFERENCES {
        UUID conference_id
        String name
        JSONB configurations
        String status
    }
    
    class CONFERENCE_USER_ROLES {
        UUID user_id
        UUID conference_id
        String role
    }
    
    class CONFERENCE_SUBMISSIONS {
        UUID submission_id
        UUID conference_id
        String title
        String abstract
        String status
        String pdf_path
    }
    
    class PAPER_ASSIGNMENTS {
        UUID submission_id
        UUID reviewer_id
        JSONB review_data
        Float score
    }

    class COI_RELATIONSHIPS {
        UUID coi_id
        UUID conference_id
        UUID user_id
        UUID target_user_id
        String type
        JSONB evidence
    }

    %% Relationships
    USERS "1" --* "many" CONFERENCE_USER_ROLES : has role
    CONFERENCES "1" --* "many" CONFERENCE_USER_ROLES : defines role
    CONFERENCES "1" --* "many" CONFERENCE_SUBMISSIONS : contains
    CONFERENCE_SUBMISSIONS "1" --* "many" PAPER_ASSIGNMENTS : assigned to
    USERS "1" --* "many" PAPER_ASSIGNMENTS : reviews
    CONFERENCES "1" --* "many" COI_RELATIONSHIPS : tracks
```

```mermaid
graph LR
    %% Neo4j Graph Model
    Author1["(:Author {email: 'rev@uni.edu', name: 'A'})"]
    Author2["(:Author {email: 'auth@uni.edu', name: 'B'})"]
    
    Author1 -->|"-[:COAUTHORED {established_date: 2025, paper_link: '...'}]-"| Author2
```

#### Giải thích mô hình dữ liệu PostgreSQL và Neo4j

Sơ đồ dữ liệu kết hợp làm rõ vai trò của từng loại cơ sở dữ liệu:
1. **PostgreSQL ERD:** Biểu diễn mô hình quan hệ chặt chẽ. Bảng trung gian `CONFERENCE_USER_ROLES` liên kết `USERS` và `CONFERENCES` để định vị vai trò của một tài khoản theo từng hội nghị cụ thể. Dữ liệu bài nộp (`CONFERENCE_SUBMISSIONS`) và phân công (`PAPER_ASSIGNMENTS`) liên kết chặt chẽ qua khoá ngoại để đảm bảo tính toàn vẹn dữ liệu.
2. **Neo4j Graph Database Schema:** Thể hiện đồ thị đồng tác giả gọn nhẹ. Chỉ có một nhãn node duy nhất là `:Author` và một mối quan hệ `:COAUTHORED`. Tuy đơn giản nhưng mô hình đồ thị này cho phép hệ thống thực hiện duyệt đồ thị N-bậc rất nhanh thông qua Cypher, giảm thiểu tải cho database PostgreSQL chính.

---

### 3.3.4. Luồng xử lý hệ thống

Để hiểu hệ thống hoạt động ra sao trong thực tế, phần này trình bày hai luồng xử lý quan trọng và có tính phức tạp cao: luồng nộp bài có hỗ trợ AI và luồng phân công phản biện.

#### Sơ đồ tuần tự: Luồng nộp bài với AI Autofill

```mermaid
sequenceDiagram
    autonumber
    actor Author as Tác giả (Author)
    participant Front as Frontend (Next.js)
    participant BE as Backend (Go/Gin)
    participant AI as AI Service (FastAPI)
    participant Gemini as Google Gemini

    Author->>Front: Tải lên bản thảo PDF & Nhấn "Autofill"
    activate Front
    Front->>BE: POST /submissions/autofill (PDF file)
    activate BE
    BE->>AI: POST /workflows/submission-autofill (PDF Base64)
    activate AI
    AI->>Gemini: Gửi PDF trực tiếp (Multimodal input)
    activate Gemini
    Gemini-->>AI: Trả về JSON (Title, Abstract, Keywords)
    deactivate Gemini
    AI-->>BE: Trả về JSON kết quả trích xuất
    deactivate AI
    BE-->>Front: Trả về JSON metadata cho Frontend
    deactivate BE
    Front-->>Author: Tự động điền biểu mẫu nộp bài
    deactivate Front
    
    Author->>Front: Chỉnh sửa lại thông tin & Xác nhận nộp bài
    activate Front
    Front->>BE: POST /submissions (Metadata + PDF file)
    activate BE
    BE->>BE: Lưu file PDF vào Storage (Local/Supabase)
    BE->>BE: Lưu thông tin bài nộp vào PostgreSQL
    BE->>BE: Kích hoạt Realtime Notification Hub
    BE-->>Front: Trả về HTTP 201 Created
    deactivate BE
    Front-->>Author: Hiển thị thông báo nộp bài thành công
    deactivate Front
```

#### Giải thích luồng nộp bài với AI Autofill

Biểu đồ tuần tự trên mô tả chi tiết hai giai đoạn của luồng nộp bài:
1. **Giai đoạn 1 (Trích xuất thử):** Diễn ra từ bước 1 đến bước 8. Khi người dùng tải PDF lên, file được mã hoá base64 và gửi qua Go Backend đến Python AI Service. Nhờ tính năng multimodal của Gemini, tệp PDF được đọc trực tiếp và trích xuất thông tin mà không cần parse text thủ công. Thông tin hiển thị lên UI để tác giả kiểm chứng.
2. **Giai đoạn 2 (Gửi chính thức):** Diễn ra từ bước 9 đến bước 14. Sau khi tác giả chỉnh sửa, dữ liệu và file PDF chính thức được gửi lên Go Backend để ghi vào cơ sở dữ liệu và lưu trữ lâu dài. Nếu AI Service gặp sự cố ở Giai đoạn 1, luồng xử lý sẽ quay về chế độ điền tay thủ công, đảm bảo Giai đoạn 2 luôn hoạt động độc lập.

---

#### Sơ đồ tuần tự: Luồng matching và phân công phản biện tự động

```mermaid
sequenceDiagram
    autonumber
    actor Chair as Chủ tọa (Chair)
    participant BE as Backend (Go/Gin)
    participant Assign as Assignment Module (Go)
    participant DB as PostgreSQL
    participant Neo4j as Neo4j Graph DB

    Chair->>BE: Yêu cầu gợi ý phân công tự động (conference_id)
    activate BE
    BE->>Assign: Khởi động quy trình matching
    activate Assign
    
    Assign->>DB: Lấy danh sách reviewer (domain) & bài nộp (keywords)
    activate DB
    DB-->>Assign: Trả về dữ liệu reviewer và bài nộp
    deactivate DB
    
    Assign->>Assign: Scoring: Tính Jaccard Similarity cho từng cặp
    
    Assign->>Neo4j: Kiểm tra COI đồ thị đồng tác giả (2-hop)
    activate Neo4j
    Neo4j-->>Assign: Trả về danh sách cặp có quan hệ đồng tác giả
    deactivate Neo4j
    
    Assign->>Assign: Lọc COI: Loại các cặp trùng tác giả, COI đồ thị, COI khai báo
    Assign->>Assign: Phân công: Chạy thuật toán gán tham lam có ràng buộc tải
    
    Assign-->>BE: Trả về ma trận kết quả phân công và điểm số gợi ý
    deactivate Assign
    BE-->>Chair: Hiển thị ma trận phân công gợi ý trên UI
    deactivate BE
    
    Chair->>BE: Xác nhận cấu hình phân công (có thể điều chỉnh)
    activate BE
    BE->>DB: Ghi nhận dữ liệu vào bảng paper_assignments
    activate DB
    DB-->>BE: Lưu thành công
    deactivate DB
    BE-->>Chair: Trả về trạng thái hoàn tất phân công
    deactivate BE
```

#### Giải thích luồng matching và phân công phản biện tự động

Biểu đồ mô tả quy trình tính toán đối sánh phản biện hoàn toàn xác định tại Go Backend:
1. **Đọc dữ liệu và Tính điểm Jaccard:** (Bước 1 - 5) Hệ thống lấy tập domain của reviewer và keyword bài nộp từ PostgreSQL, tính điểm độ tương đồng Jaccard.
2. **Lọc COI bằng Neo4j:** (Bước 6 - 8) Hệ thống truy vấn Neo4j để lấy danh sách các reviewer có xung đột đồng tác giả với tác giả bài nộp và loại bỏ các cặp này khỏi danh sách ứng viên hợp lệ.
3. **Phân công tham lam và Phê duyệt:** (Bước 9 - 14) Thuật toán gán tham lam chạy trên tập ứng viên sạch COI để đưa ra gợi ý tối ưu. Gợi ý này hiển thị cho Chair xem xét, điều chỉnh thủ công trước khi lưu chính thức vào PostgreSQL.

---

## 3.4. Giải pháp AI

### 3.4.1. Vai trò của AI trong hệ thống

Khảo sát nhu cầu người dùng ở Chương 2 cho thấy ba điểm cốt lõi về kỳ vọng với AI: AI phải giảm được thao tác lặp lại (đặc biệt là nhập liệu metadata), AI phải minh bạch và có thể bỏ qua, và AI không được thay thế quyết định học thuật của con người. Những kỳ vọng này không phải ngẫu nhiên — chúng phản ánh lo ngại thực sự của cộng đồng nghiên cứu về nguy cơ AI làm suy yếu tính liêm chính học thuật, điều mà Chương 1 đã dẫn chứng từ các nghiên cứu gần đây về peer review tại ICLR 2026, nơi 21% phản biện được phân loại là do AI tạo hoàn toàn.

Từ quan điểm đó, AI trong ConferenceSpace được đưa vào để giải quyết ba hạn chế cụ thể của quy trình hiện tại mà không thể giải quyết bằng thuật toán xác định. Thứ nhất, việc trích xuất metadata từ tệp PDF bản thảo — một tác vụ đòi hỏi đọc hiểu nội dung văn bản có cấu trúc không đồng nhất, không thể làm tốt bằng regex hay rule-based parser. Thứ hai, gợi ý track phù hợp dựa trên ngữ nghĩa của title và abstract so sánh với mô tả các track — một tác vụ matching ngữ nghĩa mà keyword-based approach cho kết quả kém chính xác. Thứ ba, tổng hợp nhiều phản biện, rebuttal và thảo luận thành bản tóm lược có cấu trúc cho chair — một tác vụ tổng hợp thông tin đa chiều mà không thể tự động hóa bằng logic cứng.

Quan trọng hơn, có những phần của quy trình mà nhóm chủ động quyết định **không dùng AI**. Thuật toán matching reviewer — bài nộp được triển khai bằng Jaccard Similarity thay vì embedding, cosine similarity hay LLM, vì kết quả cần có thể giải thích được cho chair. Kiểm tra COI được triển khai bằng truy vấn đồ thị Neo4j và logic rule-based, vì tính xác định và kiểm chứng được là bắt buộc trong một quy trình liên quan đến tính công bằng học thuật. Những quyết định này có cơ sở từ các nghiên cứu được trích dẫn trong Chương 1: LLM tạo ra kết quả không nhất quán ở các nhiệm vụ đòi hỏi tính công bằng cao và kết quả phân công phản biện cần phải là "hộp trắng" — có thể giải thích và kiểm chứng bởi chair.

### 3.4.2. Các workflow có sử dụng AI

ConferenceSpace triển khai sáu workflow AI, mỗi workflow được hiện thực như một module độc lập trong AI Service (`ai-service/app/workflows/`). Sự độc lập về module giúp từng workflow có thể được cập nhật, thay đổi model hay prompt mà không ảnh hưởng đến các workflow khác.

**Submission Autofill** là workflow phục vụ tác giả, được kích hoạt khi tác giả chọn hỗ trợ AI điền thông tin bài nộp. Đầu vào là tệp PDF bản thảo được encode base64; Gemini API được gọi với khả năng đọc PDF trực tiếp (native multimodal), không cần bước chuyển đổi trung gian. Prompt được thiết kế để trích xuất title, abstract, keywords và loại bài báo theo định dạng JSON có cấu trúc. Đầu ra được validate cấu trúc trước khi trả về frontend; tác giả luôn xem lại và có thể chỉnh sửa kết quả trước khi gửi, đảm bảo AI không tự động lưu bất kỳ thông tin nào.

**Track Recommendation** gợi ý track phù hợp cho bài nộp dựa trên title, abstract và danh sách track của hội nghị kèm mô tả. Workflow này đặc biệt hữu ích khi hội nghị có nhiều track với ranh giới chủ đề gần nhau, khiến tác giả khó tự xác định track phù hợp nhất. Gemini trả về track được gợi ý kèm lý do ngắn gọn — yếu tố giải thích này giúp tác giả hiểu cơ sở của gợi ý và quyết định có theo hay không.

**Submission Gating** (kiểm tra sơ bộ bản thảo) phân tích bản thảo để phát hiện các vấn đề về định dạng, tuân thủ chính sách hoặc chất lượng cơ bản có thể dẫn đến desk rejection. Workflow này hoạt động như một bộ lọc sơ bộ, giúp tác giả biết trước các vấn đề tiềm ẩn trước khi bài vào tay chair, với đầu ra là danh sách vấn đề phân loại theo mức độ (nghiêm trọng, cảnh báo, gợi ý) kèm giải thích cụ thể.

**Reviewer Initial Analysis** tạo bản tóm lược sơ bộ cho reviewer về bài nộp được phân công, bao gồm tóm tắt đóng góp chính, phương pháp nghiên cứu, điểm mạnh tiềm năng và các câu hỏi cần làm rõ khi đọc. Mục tiêu không phải là thay thế việc reviewer đọc bài mà giúp reviewer định hướng đọc hiệu quả hơn và chuẩn bị câu hỏi từ trước — đây là ứng dụng phù hợp với nguyên tắc "AI as assistant, not arbiter" mà nghiên cứu về ứng dụng LLM vào peer review khuyến nghị.

**Review Quality Auditor** phân tích nội dung phản biện đã nộp để đánh giá mức độ đầy đủ, nhất quán và có bằng chứng. Workflow này được chair sử dụng khi muốn kiểm tra chất lượng phản biện trước khi đưa ra quyết định hoặc khi cần xác định phản biện nào cần bổ sung thêm chi tiết, với đầu ra là đánh giá theo các tiêu chí cụ thể (độ bao phủ đóng góp, chiều sâu kỹ thuật, tính xây dựng) kèm gợi ý cải thiện.

**Chair Decision Copilot** là workflow phức tạp nhất về mặt đầu vào: toàn bộ metadata bài nộp, tất cả phản biện với điểm số, rebuttal của tác giả và các thảo luận nội bộ. Gemini được gọi với context window lớn (lý do chọn Gemini Flash thay vì GPT-4o cho workflow này) để tổng hợp các điểm đồng thuận và mâu thuẫn giữa reviewers, các vấn đề kỹ thuật chính và tóm tắt rebuttal của tác giả. Đầu ra là bản tóm lược có cấu trúc, không bao gồm khuyến nghị chấp nhận hay từ chối — ngay cả ở mức gợi ý — để tránh tạo ra bất kỳ áp lực vô hình nào lên quyết định của chair.

---

### 3.4.3. Tích hợp AI vào kiến trúc hệ thống

AI Service được triển khai như một dịch vụ FastAPI độc lập, giao tiếp với backend Go qua HTTP nội bộ trong mạng Docker. Thiết kế tách biệt này có ba lợi ích rõ ràng: AI Service có thể được scale riêng khi có nhiều yêu cầu đồng thời, thay đổi model hay thêm workflow mới không đòi hỏi biên dịch lại backend Go, và timeout dài của các lời gọi AI không ảnh hưởng đến pool goroutine của backend.

Phía backend Go, mọi lời gọi đến AI Service được bọc trong module `internal/clients/ai_service/client.go`. Client này thực hiện ba lần retry với exponential backoff khi gặp lỗi transient, có configurable timeout (mặc định 180 giây cho workflows phức tạp như Decision Copilot), và log đầy đủ trạng thái lời gọi để hỗ trợ debug. Khi AI Service không phản hồi, backend không crash mà trả về lỗi có cấu trúc để frontend hiển thị thông báo phù hợp cho người dùng.

Phía AI Service, mỗi workflow được tổ chức thành một module Python riêng trong `ai_service/app/workflows/`. Mỗi module định nghĩa schema đầu vào và đầu ra bằng Pydantic, xử lý lỗi từ LLM provider và chuẩn hóa output trước khi trả về. AI Service dùng LiteLLM làm lớp trừu tượng gọi LLM, cho phép chuyển đổi giữa Gemini, OpenAI hay các provider khác chỉ bằng thay đổi biến môi trường mà không cần sửa code. Cơ chế xác thực giữa backend và AI Service dùng header `X-Agent-Service-Token` — một shared secret được cấu hình qua biến môi trường — đảm bảo chỉ backend Go mới có thể gọi các API của AI Service.

Redis đóng vai trò lưu trữ session và cache cho AI Service, đặc biệt quan trọng cho chatbot agent cần duy trì context hội thoại qua nhiều lượt tương tác. Chatbot sử dụng cơ chế context compaction khi conversation vượt ngưỡng 70% context window để giảm chi phí token mà vẫn duy trì đủ ngữ cảnh cần thiết.

#### Sơ đồ luồng tích hợp và xử lý lỗi AI

```mermaid
flowchart TD
    %% Tác nhân và điểm bắt đầu
    Start([Go Service: Cần xử lý AI]) --> CallAIClient[Gọi Clients/AI_Service Client]
    
    %% Tiến trình bọc Go Client
    CallAIClient --> SendRequest[Gửi HTTP POST sang FastAPI ai-service]
    SendRequest --> WaitResponse{Nhận phản hồi trong timeout?}
    
    %% Nhánh xử lý Timeout / Lỗi mạng
    WaitResponse -- Không / Lỗi mạng --> Retry{Thử lại < 3 lần?}
    Retry -- Có --> Backoff[Chờ với Exponential Backoff] --> SendRequest
    Retry -- Không --> ReturnError[Trả về Lỗi có cấu trúc Graceful Degradation]
    
    %% Nhánh phản hồi thành công
    WaitResponse -- Có (HTTP 200) --> ValidateJSON[AI Service: Pydantic Validation]
    ValidateJSON --> DB_Cache[(Lưu cache Session vào Redis)]
    DB_Cache --> ReturnSuccess[Trả kết quả JSON chuẩn hóa về Go Service]
    
    %% Điểm kết thúc
    ReturnError --> UserAlert[Frontend: Hiển thị điền tay hoặc thông báo hệ thống bận]
    ReturnSuccess --> FrontEnd[Frontend: Render giao diện hỗ trợ AI]
    
    UserAlert --> End([Kết thúc])
    FrontEnd --> End
```

#### Giải thích sơ đồ luồng tích hợp AI

Sơ đồ trên thể hiện cơ chế giao tiếp và xử lý lỗi tự động để đảm bảo độ tin cậy của ứng dụng:
1. **Kháng lỗi (Resilience):** Khi xảy ra lỗi mạng hoặc timeout tạm thời từ phía LLM Provider, Go Backend Client tự động thực hiện cơ chế thử lại (retry) tối đa 3 lần với thời gian chờ tăng dần (exponential backoff), giúp triệt tiêu các lỗi transient.
2. **Graceful Degradation:** Nếu sau 3 lần thử lại vẫn thất bại, hệ thống không bị crash mà trả về lỗi có cấu trúc. Go Backend thông báo cho Frontend để tắt tính năng AI tương ứng và hướng dẫn người dùng chuyển sang điền tay thủ công.
3. **Cache & Validation:** Dữ liệu phản hồi từ Gemini API được Python AI Service kiểm tra tính hợp lệ bằng Pydantic trước khi gửi về Go Backend, đồng thời Redis được cập nhật để cache session làm việc của người dùng.

---

### 3.4.4. Ưu điểm và giới hạn của các workflow AI

Các workflow AI trong ConferenceSpace mang lại lợi ích định lượng được trong quy trình xét duyệt. Mô-đun Autofill giảm đáng kể thời gian nhập liệu cho tác giả: thay vì phải gõ lại tiêu đề, tóm tắt và từ khóa từ bản thảo đã viết, tác giả chỉ cần xem lại và điều chỉnh kết quả AI trích xuất. Reviewer Initial Analysis giúp reviewer chuẩn bị trước, giảm thời gian đọc lần đầu và tăng chất lượng câu hỏi trong đánh giá. Decision Copilot tiết kiệm thời gian chair khi cần đối chiếu nhiều phản biện dài và rebuttal phức tạp, đặc biệt trong hội nghị có hàng chục bài nộp.

Tuy nhiên, các giới hạn của các workflow này cũng cần được nhìn nhận trung thực để đặt đúng kỳ vọng. Về **phụ thuộc chất lượng đầu vào**, Autofill hoạt động tốt với tệp PDF có thể trích xuất text thông thường nhưng kém hiệu quả với PDF là ảnh scan hoặc có cấu trúc bảng phức tạp. Về **tính không nhất quán**, LLM về bản chất là mô hình xác suất, hai lần gọi với cùng đầu vào có thể cho đầu ra hơi khác nhau — điều này là bình thường nhưng cần được người dùng hiểu rõ. Về **chi phí và rate limit**, mô hình Gemini 2.0 Flash ở free tier có giới hạn 15 request/phút và 1.500 request/ngày; ở quy mô hội nghị lớn với nhiều bài nộp đồng thời, giới hạn này có thể bị chạm. Về **ngữ nghĩa chuyên ngành**, Gemini được huấn luyện trên corpus tổng quát và các bài báo trong lĩnh vực chuyên sâu với thuật ngữ hẹp có thể không được tóm tắt chính xác như kỳ vọng của chuyên gia. Về **yêu cầu kiểm duyệt**, tất cả các workflow AI đều yêu cầu người dùng xem lại kết quả trước khi hành động — đây không chỉ là thiết kế mà là yêu cầu bắt buộc để đảm bảo tính liêm chính học thuật.

Những giới hạn này không phủ nhận giá trị của các workflow AI mà xác định đúng phạm vi ứng dụng phù hợp: AI là công cụ hỗ trợ giảm tải thao tác lặp lại và tổng hợp thông tin, không phải công cụ ra quyết định tự động.

---

## 3.5. Môi trường triển khai

### 3.5.1. Cấu hình server

ConferenceSpace được triển khai trên máy chủ ảo (VPS) chạy **Ubuntu Server 22.04 LTS**, với cấu hình khuyến nghị tối thiểu 4 vCPU và 8 GB RAM. Lý do chọn Ubuntu LTS là sự ổn định dài hạn, hỗ trợ chính thức từ Canonical đến 2027 và hệ sinh thái package phong phú tương thích tốt với Docker Engine. Cấu hình RAM 8 GB là cần thiết vì hệ thống chạy đồng thời nhiều dịch vụ nặng: Neo4j mặc định cấu hình 512 MB heap, PostgreSQL có thể sử dụng đến 200 MB trong tải cao, và bản thân AI Service FastAPI cần dự phòng cho các lời gọi LLM đồng thời. Kết quả benchmark thực tế xác nhận điều này: PostgreSQL là bottleneck chính với trung bình 115% CPU (tức hơn một core), trong khi Neo4j và Redis tiêu thụ ít tài nguyên hơn đáng kể.

Quy trình thiết lập môi trường server được tự động hóa hoàn toàn thông qua script bootstrap, chạy với quyền `root` khi khởi tạo VPS lần đầu. Script này cài đặt Docker Engine và Docker Compose Plugin từ repository chính thức của Docker, thêm user deploy vào nhóm `docker`, tạo thư mục triển khai `/opt/conferencespace` và cấu hình tường lửa UFW. Việc tự động hóa bước bootstrap không chỉ tiết kiệm thời gian mà còn đảm bảo tính lặp lại: bất kỳ thành viên nào cũng có thể tái tạo môi trường production trên VPS mới chỉ bằng một lệnh duy nhất, loại bỏ rủi ro cấu hình thủ công sai hoặc thiếu bước nào đó.

Chính sách tường lửa áp dụng nguyên tắc **Zero Trust Network inside Server**: chỉ ba cổng được mở công khai — SSH (22/TCP) để quản trị, HTTP (80/TCP) cho xác thực chứng chỉ TLS và HTTPS redirect, và HTTPS (443/TCP) cho toàn bộ lưu lượng người dùng. Tất cả các dịch vụ nội bộ như PostgreSQL, Neo4j, Redis, backend Go (8080) và AI Service (8090) đều chỉ giao tiếp trong mạng Docker ảo nội bộ, hoàn toàn không thể truy cập từ Internet dù từ bên ngoài hay từ các container không được cấp quyền truy cập rõ ràng.

### 3.5.2. Proxy

ConferenceSpace sử dụng **Caddy 2** làm reverse proxy thay cho giải pháp truyền thống Nginx + Certbot. Quyết định này xuất phát từ vấn đề thực tế: Certbot yêu cầu cấu hình cron job gia hạn chứng chỉ riêng, dễ gặp lỗi khi cổng 80 bị chặn hoặc cấu hình Nginx thay đổi, dẫn đến gián đoạn HTTPS trên production. Caddy tích hợp sẵn ACME client và tự động xử lý toàn bộ vòng đời chứng chỉ TLS: tạo khóa, đăng ký với Let's Encrypt hoặc ZeroSSL và gia hạn trước khi hết hạn mà không cần bất kỳ script hay cron job bên ngoài — đây là yếu tố giảm đáng kể rủi ro vận hành trong môi trường production thực tế.

Cấu hình Caddy (Caddyfile) cho hệ thống ConferenceSpace rất ngắn gọn và dễ đọc:

```
conference-space.com, www.conference-space.com {
    encode zstd gzip
    reverse_proxy /ws/* backend:8080
    reverse_proxy web:3000
}
```

Caddy xử lý hai loại lưu lượng theo thứ tự ưu tiên. Lưu lượng WebSocket (`/ws/*`) được proxy trực tiếp đến Go backend tại `backend:8080` để xử lý kết nối realtime — WebSocket cần kết nối persistent và Caddy hỗ trợ upgrade protocol HTTP→WebSocket tự động. Toàn bộ lưu lượng HTTP còn lại được proxy đến Next.js frontend tại `web:3000`; frontend tự xử lý routing nội bộ và proxy các lời gọi API đến backend Go theo cấu hình Next.js. Caddy hoạt động trong Docker network `app` và có thể resolve tên dịch vụ (`web`, `backend`) nhờ DNS nội bộ của Docker, giúp cấu hình không cần hardcode địa chỉ IP và tự động cập nhật khi container được khởi động lại với IP khác.

---

### 3.5.3. Các thành phần triển khai khác

Toàn bộ hệ thống được quản lý bởi **Docker Compose** thông qua file `deployment/docker-compose.prod.yml`, định nghĩa tám service được điều phối theo thứ tự phụ thuộc và health check. Hai mạng Docker được định nghĩa với mục đích tách biệt rõ ràng: mạng `app` (bridge) kết nối các thành phần ứng dụng cần giao tiếp với nhau (Caddy, Next.js, backend, AI Service, Neo4j), và mạng `data` (bridge với thuộc tính `internal: true`) kết nối riêng các thành phần dữ liệu (PostgreSQL, Redis, Neo4j). Vì mạng `data` có thuộc tính `internal: true`, cổng của PostgreSQL và Redis không thể truy cập từ bên ngoài Docker host.

PostgreSQL 15 được triển khai với volume `postgres_data` để dữ liệu tồn tại độc lập với container lifecycle, cùng health check bằng `pg_isready` đảm bảo backend Go chỉ khởi động sau khi PostgreSQL thực sự sẵn sàng nhận kết nối, tránh race condition khi restart. Neo4j 5.15 Community được triển khai với plugin APOC (Awesome Procedures On Cypher) và cần thêm 60 giây khởi động (start_period trong health check) phản ánh thời gian JVM khởi động thực tế của Neo4j; memory được giới hạn qua cấu hình heap (256MB–512MB) và pagecache (256MB) để tránh tiêu thụ quá nhiều RAM trên VPS. Redis 7 được dùng làm backend cache và session store cho AI Service với persistence mode `appendonly` để tránh mất dữ liệu khi container restart.

Service `backend-migrate` là một container one-shot chạy sau khi PostgreSQL healthy, thực thi database migrations bằng golang-migrate và exit sau khi hoàn thành (`restart: "no"`). Đây là cách tiếp cận an toàn: migration được chạy như một bước riêng trong pipeline CI/CD, không phải khi backend khởi động, giúp tránh tình huống nhiều instance backend cùng chạy migration đồng thời trong môi trường có nhiều replica.

Quy trình CI/CD được tự động hóa hoàn toàn qua GitHub Actions. Khi có push vào nhánh `main`, pipeline chạy lint và test song song cho ba service (Frontend, Backend Go, AI Service Python), sau đó build ba Docker image và push lên GitHub Container Registry (GHCR) với tag theo Git commit hash. Cuối cùng, pipeline SSH vào VPS, copy file cấu hình (`docker-compose.prod.yml`, `Caddyfile`), chạy migration và thực thi `docker compose up -d --remove-orphans` để cập nhật các container với image mới mà không gây gián đoạn dịch vụ quá vài giây. Tất cả secret nhạy cảm (SSH key, GHCR token, API keys) được lưu trong GitHub Secrets và không bao giờ xuất hiện trong log của pipeline, đảm bảo an toàn thông tin trong toàn bộ quy trình CD.

#### Sơ đồ mạng nội bộ Docker (Network Isolation Topology)

```mermaid
graph LR
    %% Định nghĩa bên ngoài và Proxy
    Internet([Người dùng từ Internet]) -->|Cổng 80/443| Caddy["Caddy Container (Reverse Proxy)"]
    
    %% Mạng app
    subgraph Net_App ["Docker Network: app (External Bridge)"]
        Caddy
        NextJS["web: Next.js Frontend"]
        BE_App["backend: Go Backend"]
        AI_App["ai-service: FastAPI Service"]
    end
    
    %% Mạng data
    subgraph Net_Data ["Docker Network: data (Internal Bridge, Isolation)"]
        BE_Data["backend: Go Backend"]
        AI_Data["ai-service: FastAPI Service"]
        Postgres[("postgres: PostgreSQL DB")]
        Redis[("redis: Redis Store")]
        Neo4j[("neo4j: Neo4j Graph DB")]
    end
    
    %% Đường dẫn lưu lượng
    Caddy -->|ws://| BE_App
    Caddy -->|http://| NextJS
    NextJS -->|/api/backend/| BE_App
    BE_App -->|HTTP POST| AI_App
    
    %% Kết nối cô lập
    BE_Data --> Postgres
    BE_Data --> Neo4j
    AI_Data --> Redis
    AI_Data --> Postgres
    
    %% Style cô lập mạng dữ liệu
    style Net_Data fill:#fff5f5,stroke:#ff9999,stroke-width:2px;
```

#### Giải thích sơ đồ mạng nội bộ Docker

Sơ đồ trên minh họa giải pháp an ninh mạng cấp container được thiết lập trong Docker Compose:
1. **Mạng app (Vòng ngoài):** Là mạng cầu nối (bridge) cho phép các dịch vụ web giao tiếp với nhau. Caddy có thể chuyển hướng lưu lượng đến Next.js hoặc Go Backend. Next.js có thể proxy request đến Go backend. Dịch vụ AI FastAPI cũng kết nối vào đây để Go Backend có thể gọi API.
2. **Mạng data (Vòng trong - Cô lập):** Được thiết lập với thuộc tính `internal: true`. Mạng này không có cổng kết nối ra ngoài Internet (no gateway) và cũng không thể giao tiếp với các container trong mạng khác. Chỉ có `backend` và `ai-service` được kết nối đồng thời vào cả hai mạng để làm cầu nối truy vấn. Các cơ sở dữ liệu như PostgreSQL, Redis và Neo4j hoàn toàn vô hình đối với Caddy, Next.js hay bất kỳ kẻ tấn công nào dò quét cổng từ ngoài Internet.
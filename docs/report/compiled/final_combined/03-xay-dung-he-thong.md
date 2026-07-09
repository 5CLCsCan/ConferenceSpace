# Chương 3. Xây dựng hệ thống

Chương 1 đã xác định bài toán trung tâm của đề tài: xây dựng một nền tảng quản lý quy trình xét duyệt bài báo có thể tích hợp AI mà không làm suy yếu trách nhiệm học thuật của con người. Chương 2 tiếp tục chuyển bài toán đó thành các nhu cầu cụ thể: giảm thao tác thủ công cho tác giả, hỗ trợ người phản biện đọc và kiểm tra bài hiệu quả hơn, giúp Chair kiểm soát tiến độ, phân công, xung đột lợi ích và tổng hợp quyết định. Vì vậy, Chương 3 không chỉ mô tả hệ thống đã xây dựng gồm những chức năng nào, mà còn giải thích cách các quyết định thiết kế phản hồi trực tiếp với các vấn đề đã đặt ra.

Nguyên tắc xuyên suốt của ConferenceSpace là **tách rõ ba lớp trách nhiệm**: nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ. Lớp nghiệp vụ chịu trách nhiệm về vòng đời hội nghị và quyền truy cập. Lớp thuật toán xác định xử lý các tác vụ cần tính nhất quán, khả năng giải thích và kiểm soát công bằng, đặc biệt là reviewer matching và phát hiện xung đột lợi ích. Lớp AI chỉ tham gia vào các tác vụ trích xuất, rà soát, tóm tắt và tổng hợp; đầu ra luôn là bằng chứng hoặc gợi ý để con người kiểm tra. Cách phân lớp này là câu trả lời thiết kế cho mối lo chính của đề tài: AI có thể giúp giảm tải, nhưng không được trở thành người ra quyết định học thuật.

---

## 3.1. Tổng quan hệ thống

ConferenceSpace là nền tảng web phục vụ toàn bộ vòng đời xét duyệt bài báo trong hội nghị khoa học: tạo và cấu hình hội nghị, mở nhận bài, nộp bản thảo, kiểm tra sơ bộ, phân công phản biện, thu thập đánh giá, rebuttal, tổng hợp phản biện và ra quyết định. Hệ thống phục vụ ba nhóm người dùng chính: **Tác giả**, **Người phản biện**, và **Chủ tọa/Đồng chủ tọa**. Ngoài ra, hệ thống còn có các tác nhân hỗ trợ như quản trị hệ thống, AI service và các tác vụ nền.

Điểm khác biệt của ConferenceSpace không nằm ở việc bổ sung AI như một tiện ích rời rạc. Mỗi workflow AI đều được gắn với một nhu cầu đã xuất hiện ở Chương 2: Submission Autofill giảm nhập liệu thủ công cho tác giả; Submission Gating phát hiện lỗi trước khi gửi chính thức; Reviewer Initial Analysis hỗ trợ người phản biện nắm bối cảnh và theo dõi điểm cần kiểm tra; Review Quality Auditor giúp kiểm soát chất lượng phản biện; Chair Decision Copilot tổng hợp bằng chứng cho Chair; Chatbot Agent hỗ trợ truy vấn thao tác và trạng thái trong phạm vi quyền truy cập.

### 3.1.1. Mô hình phân lớp của hệ thống

**Hình 3.1. Mô hình phân lớp của hệ thống ConferenceSpace**

```mermaid
flowchart LR
    U["Người dùng"] --> F["Frontend Next.js"]
    F --> B["Backend Go API"]
    B --> P["PostgreSQL"]
    B --> N["Neo4j"]
    B --> A["AI Service FastAPI"]
    A --> R["Redis"]
    A --> P
    A --> L["gemini-3.1-flash-lite qua model router"]

    subgraph Core["Lớp nghiệp vụ cốt lõi"]
        B
        P
    end

    subgraph Algorithm["Lớp thuật toán xác định"]
        M["Domain Jaccard Matching"]
        C["COI Detection"]
    end

    subgraph AI["Lớp AI hỗ trợ"]
        A
        L
        R
    end

    B --> M
    B --> C
    C --> N
```

Lớp nghiệp vụ cốt lõi do backend Go đảm nhiệm. Đây là lớp xử lý các trạng thái quan trọng của hệ thống: hội nghị, track, bài nộp, phân công, phản biện, rebuttal, quyết định và quyền truy cập. Lớp này phải hoạt động ổn định ngay cả khi dịch vụ AI không khả dụng, vì vòng đời hội nghị không thể phụ thuộc hoàn toàn vào model bên ngoài.

Lớp thuật toán xác định xử lý reviewer matching và phát hiện xung đột lợi ích. Đây là các tác vụ có rủi ro công bằng cao nên cần kết quả có thể giải thích. ConferenceSpace dùng điểm tương đồng Domain Jaccard để tính mức phù hợp giữa bài nộp và reviewer, đồng thời loại các cặp có xung đột lợi ích trước khi gợi ý phân công. Chair vẫn có quyền xem, điều chỉnh và xác nhận kết quả cuối cùng.

Lớp AI hỗ trợ được tách thành dịch vụ FastAPI riêng. Dịch vụ này xử lý các workflow có đặc điểm đọc hiểu tài liệu, trích xuất metadata, tổng hợp nội dung hoặc kiểm tra chất lượng văn bản. Toàn bộ thao tác LLM trong hệ thống dùng `gemini-3.1-flash-lite` thông qua OpenRouter hoặc OpenAI-compatible model router của nhóm, nhưng cùng tuân thủ một nguyên tắc: đầu ra là bằng chứng hoặc gợi ý, không phải quyết định.

### 3.1.2. Nguyên tắc thiết kế hệ thống

Từ các yêu cầu ở Chương 2, nhóm xác định năm nguyên tắc thiết kế cho ConferenceSpace.

**Thứ nhất, platform-first.** Hệ thống phải bao phủ nghiệp vụ hội nghị trước khi nói đến AI. Nếu không có quản lý hội nghị, phân quyền, nộp bài, review, rebuttal và decision workflow đủ chặt, AI chỉ là một lớp trang trí.

**Thứ hai, AI-assistive.** AI chỉ hỗ trợ những bước có giá trị rõ: giảm thao tác nhập liệu, giảm tải đọc lại, tóm tắt bằng chứng, kiểm tra cấu trúc phản biện hoặc trả lời câu hỏi thao tác. AI không viết phản biện thay người phản biện, không phân công reviewer thay Chair, không quyết định accept/reject.

**Thứ ba, explainable-by-design.** Những kết quả ảnh hưởng đến niềm tin của người dùng phải có căn cứ. Matching cần điểm phù hợp và keyword khớp; xung đột lợi ích cần loại quan hệ và bằng chứng; workflow AI cần output có cấu trúc, chỉ ra dữ liệu đầu vào và cho phép người dùng kiểm tra.

**Thứ tư, graceful degradation.** Khi dịch vụ AI, Semantic Scholar hoặc Neo4j không khả dụng, hệ thống vẫn phải giữ được các luồng nghiệp vụ chính. Người dùng có thể nhập thủ công, Chair có thể phân công thủ công, và lỗi AI được trả về như lỗi có kiểm soát.

**Thứ năm, audit-friendly.** Các workflow quan trọng cần lưu trạng thái, thời gian xử lý, fingerprint hoặc artifact đủ để đánh giá ở Chương 4. Điều này đặc biệt quan trọng với AI vì chỉ có thể bảo vệ chất lượng đầu ra khi có dữ liệu kiểm chứng.

### 3.1.3. Lựa chọn công nghệ ở mức tổng quan

Các công nghệ trong ConferenceSpace được chọn để phục vụ kiến trúc có ranh giới rõ, không phải để tạo một danh sách thư viện. Frontend dùng Next.js App Router, React và TypeScript vì giao diện phải tổ chức nhiều khu vực nghiệp vụ theo vai trò, nhiều form có trạng thái phức tạp và nhiều API contract cần được kiểm soát sớm [1][2][3]. Backend dùng Go và Gin vì lớp nghiệp vụ cần hiệu năng tốt, concurrency đơn giản cho các tác vụ I/O, routing rõ và triển khai thành binary gọn [6][7].

PostgreSQL là nguồn dữ liệu nghiệp vụ chính vì dữ liệu hội nghị có quan hệ và ràng buộc giao dịch rõ. JSONB được dùng cho các artifact hoặc cấu hình bán cấu trúc, nhưng không thay thế mô hình quan hệ cốt lõi [8]. Neo4j được dùng cho bài toán xung đột lợi ích dạng graph, nơi cần truy vấn đường đi đồng tác giả nhiều bậc [9]. Redis giữ cache, session và runtime state ngắn hạn [10]. AI service dùng FastAPI/Pydantic vì workflow AI cần endpoint async, schema validation và OpenAPI contract rõ [12][13].

Ở lớp vận hành, Docker Compose mô tả topology production nhiều service, Caddy làm reverse proxy và tự động HTTPS, GitHub Actions build/push container image lên GitHub Container Registry rồi triển khai lên VPS [17][18][19][20][21]. Các lựa chọn này giúp hệ thống có thể tái lập triển khai thay vì chỉ chạy được trên máy thành viên nhóm.

---

## 3.2. Use Case

### 3.2.1. Tác nhân hệ thống

ConferenceSpace phục vụ ba tác nhân nghiệp vụ chính tương ứng với phạm vi đã xác định ở Chương 1 và các nhóm yêu cầu ở Chương 2.

**Tác giả** tìm kiếm hội nghị, theo dõi track và hạn chót, nộp bài, khai báo xung đột lợi ích, quản lý bản nháp, xem phản biện, gửi rebuttal và nộp camera-ready khi bài được chấp nhận. Đây là nhóm chịu ảnh hưởng trực tiếp của biểu mẫu dài, thao tác chọn track và việc lỗi bản thảo thường chỉ được phát hiện ở giai đoạn muộn.

**Người phản biện** tiếp nhận lời mời, quản lý các bài được phân công, đọc bản thảo, nhập điểm và nhận xét, lưu nháp, gửi phản biện, tham gia Discussion và xem rebuttal. AI chỉ hỗ trợ định hướng đọc và rà soát chất lượng bản nháp; người phản biện vẫn phải tự đọc bài, hình thành nhận định chuyên môn và chịu trách nhiệm đối với nội dung phản biện.

**Chủ tọa/Đồng chủ tọa** tạo và cấu hình hội nghị, quản lý hội đồng chương trình, kiểm tra xung đột lợi ích, xác nhận phân công, theo dõi tiến độ, giám sát trao đổi và đưa ra quyết định cuối cùng. Chair sử dụng thuật toán xác định cho matching và COI, đồng thời có thể dùng AI để rà soát chất lượng phản biện và tổng hợp bằng chứng. Hai lớp hỗ trợ này không thay thế quyền quyết định của Chair.

Ngoài ba tác nhân chính, hệ thống còn có **tác nhân hỗ trợ**. Quản trị hệ thống thực hiện các thao tác vận hành có xác thực riêng; AI service xử lý các workflow hỗ trợ và chỉ truy vấn dữ liệu qua ranh giới được kiểm soát; các tác vụ nền xử lý trạng thái quá hạn hoặc đồng bộ dữ liệu. Thành viên ban chương trình có thể được cấp quyền đọc trong phạm vi hội nghị, nhưng không được xem là một vai trò nghiệp vụ chính độc lập trong phạm vi báo cáo.

Discussion là use case liên vai trò nhưng quyền của các tác nhân không đối xứng. Trong triển khai hiện tại, reviewer được phân công là người tạo thread; reviewer sở hữu thread và tác giả trao đổi trong thread; Chair có quyền quan sát toàn bộ trao đổi của submission để theo dõi quá trình xử lý và đối chiếu bằng chứng.

### 3.2.2. Các use case chính

**Hình 3.2. Use case tổng quát theo vai trò**

```mermaid
flowchart TD
    Author["Tác giả"]
    Reviewer["Người phản biện"]
    Chair["Chair/Co-chair"]

    subgraph AU["Vòng đời Tác giả"]
        UC01["UC-01 Khám phá và theo dõi hội nghị"]
        UC02["UC-02 Hoàn tất và kiểm tra bài nộp"]
        UC03["UC-03 Quản lý vòng đời bài nộp"]
    end

    subgraph RV["Vòng đời Người phản biện"]
        UC04["UC-04 Tiếp nhận lời mời và quản lý assignment"]
        UC05["UC-05 Đọc, soạn và gửi phản biện"]
    end

    subgraph CH["Vòng đời Chair"]
        UC06["UC-06 Phân công và kiểm tra COI"]
        UC07["UC-07 Quản lý hội nghị và tiến độ"]
        UC09["UC-09 Tổng hợp bằng chứng và ra quyết định"]
    end

    UC08["UC-08 Trao đổi theo submission"]
    UC10["UC-10 Chatbot Agent theo ngữ cảnh"]

    Author --> UC01 --> UC02 --> UC03
    Reviewer --> UC04 --> UC05
    Chair --> UC07 --> UC06 --> UC09

    Author --> UC08
    Reviewer --> UC08
    Chair --> UC08

    Author --> UC10
    Reviewer --> UC10
    Chair --> UC10

    UC03 -.->|"rebuttal và camera-ready"| UC09
    UC05 -.->|"review và cập nhật sau rebuttal"| UC09
    UC08 -.->|"evidence thảo luận"| UC09
```

Mười use case trên được chọn theo vòng đời nghiệp vụ thay vì theo endpoint. Ba use case đầu bao phủ hành trình của tác giả từ khám phá hội nghị đến kết quả cuối; hai use case tiếp theo bao phủ quá trình reviewer nhận việc và hoàn tất phản biện; ba use case của Chair bao phủ cấu hình, phân công, giám sát và ra quyết định. Discussion và Chatbot Agent được tách thành hai luồng xuyên vai trò vì chúng phục vụ nhiều không gian làm việc nhưng vẫn chịu cùng một ranh giới phân quyền.

**Hình 3.3. Các cơ chế xuyên vai trò trong use case**

```mermaid
flowchart LR
    Author["Tác giả"]
    Reviewer["Người phản biện"]
    Chair["Chair/Co-chair"]

    Discussion["Discussion theo submission"]
    Chatbot["Chatbot Agent"]
    Notification["Notification routing"]
    Access["Xác thực và phân quyền theo tài nguyên"]

    Author --> Discussion
    Reviewer --> Discussion
    Chair -->|"quan sát"| Discussion

    Author --> Chatbot
    Reviewer --> Chatbot
    Chair --> Chatbot

    Discussion --> Notification
    Chatbot --> Access
    Discussion --> Access
    Notification --> Access
```

Notification và phân quyền không được tách thành use case độc lập vì đây là các cơ chế xuyên suốt. Notification được phát sinh từ các thay đổi trạng thái hoặc trao đổi có liên quan; phân quyền kiểm tra danh tính, vai trò và quyền trên tài nguyên trước khi cho phép thao tác. Cách trình bày này tránh biến các concern kỹ thuật thành chức năng người dùng giả, đồng thời làm rõ chúng hỗ trợ toàn bộ vòng đời như thế nào.

**Bảng 3.1. Truy vết yêu cầu Chương 2 đến use case và thiết kế Chương 3**

| Mã yêu cầu | Use case đáp ứng | Mục thiết kế liên quan |
|---|---|---|
| F-AUTHOR-01 | UC-01 | 3.3.2, 3.4.4 |
| F-AUTHOR-02 | UC-02 | 3.3.2, 3.3.3, 3.3.4 |
| F-AUTHOR-03 | UC-02 | 3.5.2.1 |
| F-AUTHOR-04 | UC-02 | 3.5.2.1 |
| F-AUTHOR-05 | UC-02 | 3.5.2.2 |
| F-AUTHOR-06 | UC-03, UC-08 | 3.3.2, 3.3.4, 3.4.4 |
| F-REVIEWER-01 | UC-04 | 3.3.2, 3.3.3 |
| F-REVIEWER-02 | UC-04, UC-05, UC-08 | 3.3.2, 3.3.3 |
| F-REVIEWER-03 | UC-05 | 3.3.2, 3.3.4 |
| F-REVIEWER-04 | UC-05 | 3.5.2.3 |
| F-REVIEWER-05 | UC-05 | 3.5.2.3, 3.5.2.4 |
| F-CHAIR-01 | UC-07 | 3.3.2, 3.3.3 |
| F-CHAIR-02 | UC-07, UC-08 | 3.3.2, 3.4.4 |
| F-CHAIR-03 | UC-06 | 3.4.2 |
| F-CHAIR-04 | UC-06 | 3.4.3 |
| F-CHAIR-05 | UC-06 | 3.4.2, 3.4.3 |
| F-CHAIR-06 | UC-05 | 3.5.2.4 |
| F-CHAIR-07 | UC-09 | 3.5.2.5 |
| F-COMMON-01 | UC-10 | 3.5.2.6 |
| F-COMMON-02 | Xuyên suốt UC-02 đến UC-09 | 3.3.2, 3.4.4 |
| F-COMMON-03 | Xuyên suốt cả mười use case | 3.3.3, 3.6.7 |

### 3.2.3. Đặc tả use case quan trọng

Mười đặc tả dưới đây dùng chung một cấu trúc gồm mục tiêu, tác nhân, sự kiện kích hoạt, điều kiện tiên quyết, luồng chính, luồng thay thế, hậu điều kiện và sơ đồ. Phần này tập trung vào mục tiêu người dùng và ranh giới trách nhiệm; cấu trúc dữ liệu và các stage nội bộ của workflow AI được trình bày riêng ở mục 3.5.

#### UC-01. Khám phá và theo dõi hội nghị

**Mục tiêu.** Giúp tác giả xác định hội nghị phù hợp, nắm được track và hạn chót trước khi bắt đầu nộp bài. Use case này giải quyết nhu cầu tập trung thông tin mà Chương 2 đã xác định, đồng thời tạo điểm bắt đầu đầy đủ cho vòng đời tác giả.

**Tác nhân.** Tác giả đã đăng nhập.

**Sự kiện kích hoạt.** Người dùng mở khu vực khám phá hội nghị.

**Điều kiện tiên quyết.** Người dùng đã xác thực; hội nghị đã được công bố và có thông tin cấu hình cho tác giả xem.

**Luồng chính.**

1. Người dùng xem hoặc tìm kiếm danh sách hội nghị.
2. Hệ thống áp dụng bộ lọc theo từ khóa, lĩnh vực, track hoặc trạng thái.
3. Người dùng mở trang hội nghị để xem CFP, track, hạn chót và thông tin liên quan.
4. Tác giả có thể đánh dấu hội nghị quan tâm hoặc chuyển sang quy trình nộp bài.

**Luồng thay thế và lỗi.** Nếu không có kết quả phù hợp, hệ thống trả danh sách rỗng cùng điều kiện lọc hiện tại. Nếu hội nghị đã đóng nhận bài, người dùng vẫn có thể xem thông tin nhưng không thể bắt đầu một submission mới. Nếu phiên đăng nhập hết hạn, hệ thống yêu cầu xác thực lại trước khi hiển thị danh sách hoặc lưu hội nghị quan tâm.

**Hậu điều kiện.** Tác giả chọn được hội nghị để nộp bài hoặc lưu hội nghị vào danh sách theo dõi.

**Hình 3.4. Luồng khám phá và theo dõi hội nghị**

```mermaid
flowchart TD
    A["Mở danh sách hội nghị"] --> B{"Phiên đăng nhập hợp lệ?"}
    B -- "Không" --> C["Yêu cầu xác thực lại"]
    B -- "Có" --> D["Tìm kiếm hoặc lọc"]
    D --> E["Xem CFP, track và hạn chót"]
    E --> F{"Hội nghị còn nhận bài?"}
    F -- "Không" --> G["Chỉ cho phép xem và theo dõi"]
    F -- "Có" --> H{"Tác giả chọn hành động"}
    H -- "Đánh dấu quan tâm" --> I["Lưu hội nghị quan tâm"]
    H -- "Nộp bài" --> J["Chuyển sang UC-02"]
```

Use case này chỉ mô tả hành trình tìm và chọn hội nghị. Việc điền form, kiểm tra bản thảo và gửi chính thức thuộc UC-02, tránh gộp hai mục tiêu người dùng khác nhau vào cùng một đặc tả.

#### UC-02. Hoàn tất và kiểm tra bài nộp

**Mục tiêu.** Giúp tác giả tạo submission đầy đủ, giảm nhập liệu lặp lại và phát hiện lỗi trước khi gửi chính thức, nhưng vẫn giữ tác giả là người xác nhận toàn bộ dữ liệu.

**Tác nhân.** Tác giả; AI service là tác nhân hỗ trợ cho Submission Autofill và Submission Gating.

**Sự kiện kích hoạt.** Tác giả chọn nộp bài vào một hội nghị đang mở.

**Điều kiện tiên quyết.** Tác giả đã đăng nhập; hội nghị còn nhận bài; danh sách track và policy nộp bài đã được cấu hình.

**Luồng chính.**

1. Tác giả tạo draft và tải bản thảo.
2. Khi tác giả yêu cầu Autofill, hệ thống trích xuất metadata và có thể gợi ý track trong danh sách hợp lệ của hội nghị.
3. Tác giả kiểm tra, chỉnh sửa hoặc nhập bổ sung tiêu đề, tóm tắt, keyword, thông tin tác giả và track.
4. Tác giả khai báo xung đột lợi ích và xem lại toàn bộ submission.
5. Submission Gating kiểm tra file, policy và các điều kiện pre-check.
6. Tác giả xử lý cảnh báo rồi xác nhận gửi bài chính thức.

**Luồng thay thế và lỗi.** Nếu file không đọc được hoặc Autofill lỗi, form thủ công vẫn hoạt động. Kết quả `warn` cho phép tác giả xem cảnh báo và tiếp tục theo policy; kết quả `block` chỉ ngăn gửi khi lỗi hình thức hoặc policy có căn cứ chưa được sửa. Nếu deadline đã qua, hệ thống không cho publish submission.

**Hậu điều kiện.** Submission được lưu ở trạng thái draft hoặc chuyển sang trạng thái đã gửi sau khi tác giả xác nhận.

**Hình 3.5. Luồng hoàn tất và kiểm tra bài nộp**

```mermaid
flowchart TD
    A["Tạo draft và tải bản thảo"] --> B{"Dùng Submission Autofill?"}
    B -- "Có" --> C["Trích xuất metadata và gợi ý track"]
    B -- "Không" --> D["Nhập metadata thủ công"]
    C --> E["Tác giả kiểm tra và chỉnh sửa"]
    D --> E
    C -.->|"Lỗi hoặc thiếu căn cứ"| D
    E --> F["Khai báo COI và xem lại"]
    F --> G["Submission Gating"]
    G --> H{"Verdict"}
    H -- "pass" --> I["Cho phép gửi"]
    H -- "warn" --> J["Hiển thị cảnh báo"]
    J --> I
    H -- "block" --> K["Yêu cầu sửa lỗi có căn cứ"]
    K --> E
    I --> L["Tác giả xác nhận gửi chính thức"]
```

Gợi ý track không phải một workflow độc lập; đây là một khả năng trong Submission Autofill. Tương tự, Submission Gating chỉ kiểm tra điều kiện gửi và không đưa ra quyết định học thuật về chất lượng paper.

#### UC-03. Quản lý vòng đời bài nộp

**Mục tiêu.** Cho phép tác giả theo dõi và thực hiện các thao tác hợp lệ trên submission từ draft đến kết quả cuối, thay vì chỉ hỗ trợ thời điểm nộp bài ban đầu.

**Tác nhân.** Tác giả; Chair là tác nhân tạo quyết định hoặc mở các giai đoạn liên quan.

**Sự kiện kích hoạt.** Tác giả mở danh sách bài đã tạo hoặc nhận thông báo thay đổi trạng thái.

**Điều kiện tiên quyết.** Tác giả sở hữu submission và đã được xác thực.

**Luồng chính.**

1. Tác giả xem danh sách bài, trạng thái và hạn chót liên quan.
2. Với draft, tác giả tiếp tục chỉnh sửa; form định kỳ autosave các thay đổi.
3. Với bài đã gửi, tác giả theo dõi trạng thái và xem review khi được công bố.
4. Khi rebuttal được mở, tác giả gửi phản hồi theo cấu hình hội nghị.
5. Sau khi Chair công bố quyết định, tác giả xem kết quả.
6. Nếu bài được chấp nhận, tác giả tải lên bản camera-ready theo yêu cầu hội nghị.

**Luồng thay thế và lỗi.** Việc sửa, rút bài hoặc gửi rebuttal bị từ chối nếu trạng thái hoặc deadline không cho phép. Camera-ready chỉ được nhận khi submission đã được chấp nhận và file tải lên hợp lệ. Nếu autosave lỗi, hệ thống giữ trạng thái chưa lưu để tác giả chủ động thử lại.

**Hậu điều kiện.** Trạng thái submission hoặc artifact tương ứng được cập nhật theo transition nghiệp vụ hợp lệ.

**Hình 3.6. Vòng đời thao tác của tác giả trên submission**

```mermaid
flowchart TD
    A["draft"] -->|"Tác giả xác nhận gửi"| B["published"]
    A -->|"Chỉnh sửa"| A
    B -->|"Bắt đầu phản biện"| C["reviewing"]
    B -->|"Rút bài khi được phép"| D["withdrawn"]
    C --> E["Tác giả xem review"]
    E --> F{"Giai đoạn rebuttal được mở?"}
    F -- "Có" --> G["Tác giả gửi rebuttal"]
    F -- "Không" --> H["Chờ quyết định"]
    G --> H
    H --> I{"Quyết định của Chair"}
    I -- "Chấp nhận" --> J["accepted"]
    I -- "Từ chối" --> K["rejected"]
    J --> L["Tác giả tải camera-ready"]
```

Hệ thống hiện hỗ trợ tác giả tải lên và truy xuất camera-ready khi bài đã accepted, nhưng chưa có workflow Chair phê duyệt, cưỡng chế deadline camera-ready ở runtime hoặc yêu cầu nộp lại bản camera-ready. Vì vậy, use case không mở rộng hành vi vượt quá phạm vi triển khai.

#### UC-04. Tiếp nhận lời mời và quản lý bài được phân công

**Mục tiêu.** Tạo một đường chuyển rõ từ lời mời của Chair đến workspace phản biện, giúp reviewer biết mình được mời vào hội nghị nào, đã nhận bài nào và cần hoàn thành việc gì.

**Tác nhân.** Người phản biện là tác nhân chính; Chair và hệ thống email là tác nhân phối hợp.

**Sự kiện kích hoạt.** Chair gửi lời mời tham gia hội nghị hoặc hệ thống ghi nhận một assignment mới.

**Điều kiện tiên quyết.** Hội nghị tồn tại; Chair có quyền mời; địa chỉ email người nhận hợp lệ.

**Luồng chính.**

1. Chair gửi lời mời cho reviewer trong hoặc ngoài hệ thống.
2. Hệ thống lưu lời mời và gửi thông báo qua kênh phù hợp.
3. Reviewer mở lời mời, xem thông tin hội nghị và chấp nhận hoặc từ chối.
4. Sau khi được phân công, reviewer mở dashboard để xem bài, deadline và trạng thái.
5. Reviewer chọn assignment hợp lệ và chuyển sang workspace phản biện ở UC-05.

**Luồng thay thế và lỗi.** Token lời mời không hợp lệ hoặc đã hết hiệu lực không được chấp nhận. Nếu reviewer từ chối, lý do được ghi nhận để Chair điều chỉnh phân công. Người dùng không sở hữu assignment bị từ chối truy cập.

**Hậu điều kiện.** Trạng thái lời mời được cập nhật; assignment hợp lệ trở thành đầu vào của quá trình phản biện.

**Hình 3.7. Luồng tiếp nhận lời mời và mở assignment**

```mermaid
sequenceDiagram
    actor Chair
    participant BE as Backend
    participant Mail as Email/Notification
    actor Reviewer
    participant UI as Reviewer workspace

    Chair->>BE: Gửi lời mời
    BE->>Mail: Phát thông báo hoặc email
    Mail-->>Reviewer: Thông tin lời mời
    Reviewer->>BE: Chấp nhận hoặc từ chối
    BE-->>Reviewer: Cập nhật trạng thái
    alt Reviewer chấp nhận và được phân công
        Reviewer->>UI: Mở dashboard
        UI->>BE: Lấy danh sách assignment hợp lệ
        BE-->>UI: Bài, deadline và trạng thái
        Reviewer->>UI: Mở workspace phản biện
    else Reviewer từ chối
        BE-->>Chair: Cập nhật trạng thái để phân công lại
    end
```

Use case này kết thúc ở thời điểm reviewer mở assignment. Hoạt động đọc, lưu nháp và gửi phản biện được tách sang UC-05 để giữ mỗi đặc tả có một mục tiêu chính.

#### UC-05. Đọc, soạn và gửi phản biện có AI hỗ trợ

**Mục tiêu.** Hỗ trợ reviewer quản lý quá trình đọc và hoàn thiện phản biện, đồng thời giữ toàn bộ nhận định chuyên môn và nội dung review thuộc trách nhiệm của reviewer.

**Tác nhân.** Người phản biện; AI service hỗ trợ Reviewer Initial Analysis và Review Quality Auditor.

**Sự kiện kích hoạt.** Reviewer mở một assignment mà mình có quyền truy cập.

**Điều kiện tiên quyết.** Assignment đã được xác nhận; reviewer sở hữu assignment; bản thảo có thể truy cập.

**Luồng chính.**

1. Hệ thống tải bản thảo, metadata, deadline và review form.
2. Reviewer có thể yêu cầu Reviewer Initial Analysis để nhận briefing ban đầu.
3. Reviewer đọc bài, đối chiếu briefing với bản thảo và tự hình thành đánh giá.
4. Reviewer nhập điểm, nhận xét, recommendation và confidence; bản nháp có thể được lưu qua nhiều phiên.
5. Trước khi gửi, Review Quality Auditor kiểm tra tính sử dụng được của bản review.
6. Reviewer xem findings, chỉnh sửa khi cần và xác nhận gửi phản biện.
7. Khi có rebuttal, reviewer có thể acknowledgement và cập nhật đánh giá sau rebuttal nếu bằng chứng mới làm thay đổi nhận định.

**Luồng thay thế và lỗi.** Nếu Initial Analysis không khả dụng hoặc artifact đã stale, reviewer vẫn đọc bài và tiếp tục thủ công. Auditor trả `warn` để reviewer cân nhắc; `block` chỉ áp dụng cho nhóm lỗi nặng theo mode gửi chính thức. Nếu AI lỗi hoặc tạo cảnh báo chặn sai, reviewer phải nhận được thông báo rõ; giới hạn và hướng hậu kiểm được giải thích ở mục 3.5.2.4.

**Hậu điều kiện.** Review được lưu nháp hoặc gửi chính thức; mọi thay đổi sau rebuttal được gắn với assignment tương ứng.

**Hình 3.8. Vòng đời đọc và hoàn thiện phản biện**

```mermaid
flowchart TD
    A["Reviewer mở assignment"] --> B["Tải bài, deadline và review form"]
    B --> C{"Yêu cầu Initial Analysis?"}
    C -- "Có" --> D["Tải hoặc sinh briefing có fingerprint"]
    C -- "Không" --> E["Reviewer đọc bản thảo"]
    D --> E
    D -.->|"Không khả dụng hoặc stale"| E
    E --> F["Nhập điểm, nhận xét và confidence"]
    F --> G{"Lưu nháp hay gửi?"}
    G -- "Lưu nháp" --> H["Lưu để tiếp tục sau"]
    G -- "Gửi" --> I["Review Quality Auditor"]
    I --> J{"pass / warn / block"}
    J -- "pass" --> K["Reviewer xác nhận gửi"]
    J -- "warn" --> L["Reviewer xem finding và quyết định"]
    L --> K
    J -- "block" --> M["Sửa lỗi tối thiểu hoặc xử lý ngoại lệ"]
    M --> F
    K --> N["Xem rebuttal và cập nhật nếu cần"]
```

Reviewer Initial Analysis có thể giảm thao tác truy vết và đọc lại để tìm các điểm cần chú ý, nhưng không thay thế việc đọc bài. Review Quality Auditor kiểm tra chất lượng sử dụng của review, không đánh giá giá trị học thuật của paper và không được thay đổi điểm hoặc recommendation của reviewer.

#### UC-06. Phân công phản biện có kiểm tra xung đột lợi ích

**Mục tiêu.** Cung cấp cho Chair một proposal phân công có điểm phù hợp, loại trừ xung đột lợi ích và có thể kiểm tra trước khi xác nhận.

**Tác nhân.** Chair/Co-chair.

**Sự kiện kích hoạt.** Chair bắt đầu giai đoạn phân công hoặc yêu cầu hệ thống tạo gợi ý.

**Điều kiện tiên quyết.** Hội nghị có submission hợp lệ; reviewer đã được mời hoặc đăng ký; dữ liệu domain/keyword và thông tin COI đủ để xử lý.

**Luồng chính.**

1. Hệ thống chuẩn bị tập submission và reviewer hợp lệ.
2. Mỗi cặp được tính Domain Jaccard score từ keyword và domain.
3. Các COI detector kiểm tra self-author, khai báo thủ công và quan hệ đồng tác giả.
4. Cặp có COI bị loại khỏi tập ứng viên.
5. Thuật toán greedy tạo proposal theo điểm, tải reviewer và số reviewer cần thiết.
6. Chair xem điểm, lý do, các bài chưa đủ reviewer và điều chỉnh khi cần.
7. Chair xác nhận proposal trước khi assignment được lưu.

**Luồng thay thế và lỗi.** Nếu Neo4j hoặc nguồn dữ liệu học thuật không khả dụng, hệ thống vẫn giữ các lớp COI còn lại và nêu rõ phần bằng chứng bị thiếu. Fallback có thể nới ngưỡng điểm hoặc tải nhưng không nới COI. Khi tín hiệu phù hợp quá yếu hoặc thiếu reviewer, Chair chuyển sang phân công thủ công.

**Hậu điều kiện.** Proposal được tạo để Chair xem hoặc assignment được lưu sau xác nhận.

**Hình 3.9. Luồng phân công phản biện và kiểm tra COI**

```mermaid
flowchart TD
    A["Submission keywords"] --> C["Tính Domain Jaccard score"]
    B["Reviewer domains"] --> C
    C --> D["Tạo ma trận ứng viên"]
    D --> E["Chạy COI detectors"]
    E --> F{"Cặp có COI?"}
    F -- "Có" --> G["Loại cặp và lưu bằng chứng"]
    F -- "Không" --> H["Greedy assignment theo score và tải"]
    H --> I{"Bài chưa đủ reviewer?"}
    I -- "Có" --> J["Fallback nhưng giữ COI là ràng buộc cứng"]
    I -- "Không" --> K["Tạo proposal"]
    J --> K
    K --> L["Chair kiểm tra, điều chỉnh và xác nhận"]
```

Điểm phù hợp được tính bằng Jaccard similarity:

```text
score = |submission_keywords ∩ reviewer_domains| / |submission_keywords ∪ reviewer_domains|
```

Reviewer matching là thuật toán xác định, không phải workflow AI. Chair có thể ghi đè proposal, nhưng mọi assignment cuối cùng vẫn phải tuân thủ kiểm tra quyền và xung đột lợi ích.

#### UC-07. Quản lý hội nghị và theo dõi tiến độ

**Mục tiêu.** Cung cấp cho Chair một luồng quản trị xuyên suốt từ cấu hình hội nghị đến theo dõi các điểm nghẽn trước khi ra quyết định.

**Tác nhân.** Chair/Co-chair.

**Sự kiện kích hoạt.** Chair tạo hội nghị mới hoặc mở dashboard của hội nghị đang phụ trách.

**Điều kiện tiên quyết.** Người dùng đã xác thực và có quyền Chair/Co-chair đối với hội nghị.

**Luồng chính.**

1. Chair tạo hoặc cập nhật thông tin hội nghị, track, deadline, review form và policy.
2. Chair mời và quản lý committee/reviewer.
3. Dashboard tổng hợp số bài, tiến độ review, COI và các trường hợp cần xử lý.
4. Chair chuyển tới luồng phân công khi dữ liệu đầu vào đã sẵn sàng.
5. Sau giai đoạn review, Chair cấu hình, mở và kết thúc rebuttal.
6. Chair theo dõi review, Discussion và thay đổi sau rebuttal trước khi chuyển sang UC-09.

**Luồng thay thế và lỗi.** Cấu hình có deadline không hợp lệ hoặc thiếu trường bắt buộc không được lưu. Nếu thiếu reviewer hoặc review chưa đủ, dashboard giữ trạng thái cần xử lý và không xem đó là giai đoạn đã hoàn tất. Người dùng không có quyền bị từ chối thao tác ghi.

**Hậu điều kiện.** Hội nghị có cấu hình hợp lệ; trạng thái và danh sách việc cần xử lý của Chair được cập nhật.

**Hình 3.10. Luồng quản lý hội nghị và theo dõi tiến độ**

```mermaid
flowchart TD
    A["Tạo hoặc mở hội nghị"] --> B["Cấu hình track, deadline, form và policy"]
    B --> C{"Cấu hình hợp lệ?"}
    C -- "Không" --> B
    C -- "Có" --> D["Mời committee và reviewer"]
    D --> E["Theo dõi submission, review và COI"]
    E --> F{"Có điểm nghẽn?"}
    F -- "Thiếu reviewer" --> G["Điều chỉnh lời mời hoặc phân công"]
    F -- "Review trễ hoặc thiếu" --> H["Theo dõi và nhắc việc"]
    F -- "Không" --> I["Mở hoặc quản lý rebuttal"]
    G --> E
    H --> E
    I --> J["Theo dõi Discussion và cập nhật sau rebuttal"]
    J --> K["Chuyển sang UC-09"]
```

Dashboard không chỉ hiển thị thống kê mà còn giúp Chair nhận biết các trạng thái chưa đủ điều kiện để chuyển giai đoạn. Các cơ chế deadline, notification và chuyển trạng thái được trình bày tại mục 3.4.4.

#### UC-08. Trao đổi theo submission

**Mục tiêu.** Cho phép reviewer và tác giả trao đổi có cấu trúc quanh một submission, đồng thời cung cấp cho Chair lịch sử thảo luận để giám sát và đối chiếu khi ra quyết định.

**Tác nhân.** Reviewer được phân công và tác giả là hai bên trao đổi; Chair/Co-chair là tác nhân giám sát.

**Sự kiện kích hoạt.** Reviewer được phân công tạo một thread trong giai đoạn reviewing.

**Điều kiện tiên quyết.** Submission tồn tại; conference ở trạng thái reviewing; reviewer có assignment hợp lệ.

**Luồng chính.**

1. Reviewer tạo thread với tiêu đề và message đầu tiên.
2. Hệ thống liên kết thread với submission, conference và reviewer tạo thread.
3. Tác giả nhận notification và mở thread liên quan đến bài của mình.
4. Tác giả và reviewer sở hữu thread trao đổi message; participant hợp lệ có thể dùng tệp đính kèm.
5. Reviewer chỉ xem thread của mình; Chair xem toàn bộ thread và message của submission.
6. Nội dung Discussion trở thành một nguồn evidence cho Chair Decision Copilot.

**Luồng thay thế và lỗi.** Author hoặc Chair không thể tạo thread theo chính sách backend hiện tại. Reviewer khác không được xem hoặc ghi vào thread không thuộc mình. Khi conference không ở giai đoạn reviewing, hệ thống từ chối tạo thread hoặc thêm message. Tệp vượt giới hạn hoặc người dùng không phải participant bị từ chối.

**Hậu điều kiện.** Thread và message được lưu; bên liên quan nhận notification; lịch sử trao đổi gắn với submission.

**Hình 3.11. Luồng Discussion giữa các vai trò**

```mermaid
sequenceDiagram
    actor Reviewer
    participant BE as Backend
    participant DB as PostgreSQL
    participant N as Notification
    actor Author
    actor Chair

    Reviewer->>BE: Tạo thread cho submission
    BE->>BE: Kiểm tra assignment và trạng thái reviewing
    BE->>DB: Lưu thread và message đầu tiên
    BE->>N: Thông báo cho tác giả
    N-->>Author: Có Discussion mới
    Author->>BE: Mở thread và gửi phản hồi
    BE->>DB: Lưu message
    BE->>N: Thông báo reviewer
    Reviewer->>BE: Tiếp tục trao đổi
    BE->>DB: Lưu message
    Chair->>BE: Xem toàn bộ thread của submission
    BE-->>Chair: Lịch sử Discussion ở chế độ quan sát
```

Database đã có trường `visibility` cho thread, nhưng truy vấn backend hiện chưa cưỡng chế đầy đủ việc lọc thread theo các mức visibility. Giao diện Chair cũng có control tạo thread và gửi message trong khi backend từ chối hai thao tác này. Vì vậy, báo cáo chỉ khẳng định mô hình quyền đã được kiểm chứng bằng backend và test: reviewer tạo thread, author/reviewer trao đổi, Chair quan sát. Visibility nhiều tầng được xem là phần thiết kế chưa hoàn thiện, không phải bảo đảm bảo mật đã được chứng minh.

#### UC-09. Tổng hợp bằng chứng hỗ trợ Chair ra quyết định

**Mục tiêu.** Giúp Chair đối chiếu nhiều nguồn bằng chứng hiệu quả hơn nhưng không chuyển trách nhiệm accept/reject sang AI.

**Tác nhân.** Chair/Co-chair; AI service là tác nhân hỗ trợ.

**Sự kiện kích hoạt.** Chair mở submission ở giai đoạn chuẩn bị quyết định hoặc yêu cầu sinh lại bản tổng hợp.

**Điều kiện tiên quyết.** Chair có quyền trên hội nghị; submission có dữ liệu review hoặc evidence phù hợp để tổng hợp.

**Luồng chính.**

1. Backend thu thập review, điểm số, rebuttal, thay đổi sau rebuttal và Discussion.
2. Hệ thống tạo evidence fingerprint và kiểm tra artifact hiện có.
3. Nếu artifact còn hợp lệ, hệ thống trả bản tổng hợp đã lưu; nếu stale hoặc chưa có, Chair Decision Copilot tạo artifact mới.
4. Output làm rõ đồng thuận, bất đồng, vấn đề còn mở và evidence liên quan.
5. Chair đối chiếu output với dữ liệu gốc.
6. Chair tự đưa ra và lưu quyết định cuối cùng.

**Luồng thay thế và lỗi.** Nếu dữ liệu chưa đủ, hệ thống nêu rõ phần evidence bị thiếu. Khi AI service lỗi, Chair vẫn xem review, rebuttal và Discussion gốc để tiếp tục xử lý. Artifact cũ bị đánh dấu stale khi evidence thay đổi.

**Hậu điều kiện.** Bản tổng hợp có cấu trúc được lưu như artifact hỗ trợ; quyết định cuối cùng chỉ được tạo bởi Chair.

**Hình 3.12. Luồng tổng hợp bằng chứng và ra quyết định**

```mermaid
flowchart TD
    A["Chair mở submission"] --> B["Thu thập review, điểm, rebuttal và Discussion"]
    B --> C["Tạo evidence fingerprint"]
    C --> D{"Artifact còn hợp lệ?"}
    D -- "Có" --> E["Tải bản tổng hợp đã lưu"]
    D -- "Không" --> F["Copilot tổng hợp đồng thuận, bất đồng và vấn đề mở"]
    F --> G["Validate và lưu artifact"]
    E --> H["Chair đối chiếu với evidence gốc"]
    G --> H
    F -.->|"AI service lỗi"| H
    H --> I["Chair đưa ra và lưu quyết định"]
```

Copilot không sinh quyết định hoặc recommendation accept/reject. Việc tách rõ bước tổng hợp và bước Chair quyết định là ranh giới bắt buộc để tránh AI tạo áp lực vô hình lên kết luận học thuật.

#### UC-10. Truy vấn trạng thái và hướng dẫn theo ngữ cảnh bằng Chatbot Agent

**Mục tiêu.** Giúp tác giả, reviewer và Chair tra cứu trạng thái, thao tác hoặc dữ liệu trong phạm vi quyền mà không phải tự dò qua nhiều màn hình.

**Tác nhân.** Tác giả, Người phản biện và Chair; AI service và Backend Query Engine là tác nhân hỗ trợ.

**Sự kiện kích hoạt.** Người dùng gửi câu hỏi trong Chatbot Agent.

**Điều kiện tiên quyết.** Người dùng đã xác thực; agent và backend query endpoint được cấu hình; câu hỏi nằm trong phạm vi hỗ trợ của nền tảng.

**Luồng chính.**

1. Agent nhận câu hỏi, lịch sử hội thoại và ngữ cảnh trang hiện tại.
2. Agent xác định có thể trả lời trực tiếp hay cần dữ liệu hệ thống.
3. Nếu cần dữ liệu, agent gửi yêu cầu có cấu trúc tới backend query endpoint.
4. Backend kiểm tra user token, service token, resource registry, field và quyền trên tài nguyên.
5. Backend trả dữ liệu tối thiểu được phép; agent tổng hợp câu trả lời theo vai trò.
6. Câu trả lời và trạng thái tool call được trả về giao diện.

**Luồng thay thế và lỗi.** Query ngoài registry, field không được phép hoặc tài nguyên vượt quyền bị từ chối. Nếu tool call hoặc AI service lỗi, hệ thống trả lỗi rõ thay vì tạo dữ liệu giả. Với câu hỏi không cần dữ liệu, agent có thể trả lời hướng dẫn mà không gọi backend.

**Hậu điều kiện.** Người dùng nhận câu trả lời bám dữ liệu được phép hoặc lỗi có giải thích; agent không truy vấn database trực tiếp.

**Hình 3.13. Luồng Chatbot Agent theo ngữ cảnh và quyền truy cập**

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant FE as Frontend
    participant AI as AI Service
    participant BE as Backend Query Engine
    participant DB as Nguồn dữ liệu nghiệp vụ

    User->>FE: Gửi câu hỏi
    FE->>AI: Message, thread và page context
    AI->>AI: Xác định có cần dữ liệu hệ thống
    alt Cần dữ liệu
        AI->>BE: Query có user token và service token
        BE->>BE: Kiểm tra registry, field và quyền
        BE->>DB: Truy vấn dữ liệu được phép
        DB-->>BE: Kết quả tối thiểu
        BE-->>AI: Dữ liệu có cấu trúc
    else Không cần dữ liệu
        AI->>AI: Tạo hướng dẫn từ ngữ cảnh
    end
    AI-->>FE: Câu trả lời và trạng thái xử lý
    FE-->>User: Hiển thị kết quả
```

Chatbot Agent là khả năng dùng chung của nền tảng, không thuộc riêng Chair. Ranh giới xác thực kép và resource registry bảo đảm service token không trở thành quyền truy cập dữ liệu không giới hạn.

---

## 3.3. Thiết kế kỹ thuật

### 3.3.1. Kiến trúc tổng thể

ConferenceSpace được triển khai như một hệ thống nhiều service ở mức vận hành, nhưng backend nghiệp vụ chính vẫn được giữ theo hướng monolith phân lớp. Quyết định này giúp hệ thống tránh độ phức tạp không cần thiết của microservices, đồng thời vẫn cô lập được AI service, data stores và gateway.

Các thành phần chính gồm:

- **Frontend Next.js**: giao diện cho người dùng theo vai trò, route dashboard, form nộp bài, form review và màn hình Chair.
- **Backend Go/Gin**: API nghiệp vụ, phân quyền, validation, matching, xung đột lợi ích, review workflow, notification và tích hợp service ngoài.
- **AI Service FastAPI**: thực thi các workflow AI, validate input/output bằng Pydantic, gọi model qua LLM client/model router.
- **PostgreSQL**: lưu dữ liệu nghiệp vụ bền vững và artifact cần truy vết.
- **Redis**: lưu session, cache, runtime state và tool result ngắn hạn.
- **Neo4j**: lưu/truy vấn quan hệ học thuật phục vụ phát hiện xung đột lợi ích.
- **Caddy và Docker Compose**: gateway, network boundary và triển khai production.

Backend là ranh giới nghiệp vụ chính. Frontend không gọi trực tiếp database hoặc AI provider; AI service không tự ý truy cập toàn bộ dữ liệu nghiệp vụ ngoài các repository/query endpoint được kiểm soát. Cách tổ chức này giúp giảm rủi ro lộ dữ liệu bản thảo khi đưa AI vào hệ thống.

**Hình 3.14. Kiến trúc service và ranh giới dữ liệu**

```mermaid
flowchart TD
    Browser["Browser"] --> Caddy["Caddy gateway"]
    Caddy --> Web["Next.js web"]
    Web --> Backend["Go backend"]
    Backend --> Postgres["PostgreSQL"]
    Backend --> Neo4j["Neo4j"]
    Backend --> AI["FastAPI AI service"]
    AI --> Redis["Redis"]
    AI --> Postgres
    Backend --> Scholar["Semantic Scholar API"]
    AI --> Router["Model router / OpenRouter"]
    Router --> Gemini["gemini-3.1-flash-lite"]
```

### 3.3.2. Thiết kế frontend và trải nghiệm theo vai trò

Frontend của ConferenceSpace được xây dựng bằng Next.js App Router, React và TypeScript. Cấu trúc route bám theo không gian làm việc của từng vai trò: tác giả cần luồng nộp bài nhiều bước, reviewer cần workspace đọc bài và soạn review, Chair cần dashboard có khả năng quét nhanh trạng thái hội nghị.

UI sử dụng Radix UI và Tailwind CSS để chuẩn hóa các primitive tương tác như dialog, select, tabs, tooltip và menu [4][5]. Giá trị của lựa chọn này nằm ở tính nhất quán: các luồng phức tạp được chia thành bước rõ, trạng thái quan trọng được hiển thị bằng bảng và badge, còn các hành động nguy cơ cao như gửi bài hoặc quyết định cuối cùng cần có bước xác nhận.

**Hình 3.15. Tổ chức frontend theo vai trò**

```mermaid
flowchart LR
    A["App Router"] --> B["Public conference pages"]
    A --> C["Author workspace"]
    A --> D["Reviewer workspace"]
    A --> E["Chair console"]
    C --> F["Submission flow"]
    D --> G["Review editor"]
    E --> H["Assignment and decision dashboards"]
    F --> I["Backend API client"]
    G --> I
    H --> I
```

Frontend cũng đóng vai trò kiểm soát trải nghiệm AI. Kết quả AI không được trình bày như kết luận cuối cùng, mà như bản nháp, cảnh báo hoặc bằng chứng cần kiểm tra. Ví dụ, gợi ý track trong Submission Autofill hiển thị để tác giả chọn/chỉnh sửa; Reviewer Initial Analysis hiển thị như briefing đọc bài; Chair Decision Copilot hiển thị như bản tổng hợp cần Chair đối chiếu với review gốc.

Ba workspace hiện thực hóa các vòng đời đã đặc tả ở mục 3.2. Author workspace nối luồng khám phá, nộp bài và quản lý submission; Reviewer workspace nối lời mời, assignment, review editor và Discussion; Chair console nối cấu hình hội nghị, phân công, giám sát tiến độ, Discussion và quyết định. Chatbot Agent và notification xuất hiện xuyên các workspace nhưng luôn dùng cùng ngữ cảnh xác thực và quyền trên tài nguyên.

### 3.3.3. Thiết kế backend, API và phân quyền

Backend được tổ chức theo các module có trách nhiệm rõ trong `backend/internal/`. Tầng controller tiếp nhận HTTP request và chuyển về service; tầng service chứa logic nghiệp vụ; tầng storage/repository làm việc với PostgreSQL; tầng clients bọc các tích hợp bên ngoài như AI service, Neo4j, Semantic Scholar và email.

**Hình 3.16. Phụ thuộc các tầng trong Go backend**

```mermaid
flowchart TD
    R["Gin Router"] --> M["Middleware: auth, CORS, logging"]
    M --> C["Controller"]
    C --> S["Service layer"]
    S --> ST["Storage / Repository"]
    S --> CL["External Clients"]
    S --> AS["Assignment Domain"]
    AS --> SC["Scoring"]
    AS --> MT["Matching"]
    AS --> COI["COI Detectors"]
    COI --> N["Neo4j Client"]
    CL --> AI["AI Service Client"]
    ST --> P["PostgreSQL"]
```

Luồng phụ thuộc được giữ một chiều để tránh controller chứa logic nghiệp vụ hoặc service phụ thuộc ngược vào framework HTTP. Assignment được tách thành domain riêng vì matching và phát hiện xung đột lợi ích có logic đủ quan trọng để cần kiểm thử, giải thích và đánh giá độc lập ở Chương 4.

Phân quyền được thiết kế theo vai trò trong từng hội nghị, không theo quyền toàn cục. Cùng một người dùng có thể là tác giả ở hội nghị này, reviewer ở hội nghị khác và Chair ở một hội nghị khác nữa. Vì vậy, mỗi request cần xét cả danh tính người dùng và vai trò của họ trong tài nguyên cụ thể.

**Bảng 3.2. Quyền hiện hành trong Discussion theo submission**

| Vai trò | Tạo thread | Xem thread | Gửi message |
|---|---|---|---|
| Reviewer được phân công | Có | Chỉ thread do mình tạo trong submission | Có, trong thread do mình sở hữu |
| Tác giả của submission | Không | Các thread gắn với submission của mình | Có, trong thread liên quan |
| Chair/Co-chair | Không | Toàn bộ thread và message của submission | Không |

Ma trận trên phản ánh quyền đang được backend và API test cưỡng chế, không suy diễn từ control trên giao diện. Trường `visibility` đã tồn tại trong dữ liệu Discussion nhưng chưa được áp dụng nhất quán vào truy vấn danh sách thread; vì vậy, hệ thống chưa thể tuyên bố đã hoàn thiện phân quyền visibility nhiều tầng.

Ngoài JWT Bearer token cho người dùng cuối, hệ thống có hai header phục vụ vận hành và tích hợp service: `X-Admin-Token` cho tác vụ quản trị nội bộ và `X-Agent-Service-Token` cho AI service khi cần gọi backend query endpoint. Thiết kế này giúp tách quyền người dùng cuối khỏi quyền service-to-service, tránh để AI service truy cập dữ liệu vượt phạm vi được phép.

### 3.3.4. Thiết kế dữ liệu

Thiết kế dữ liệu của ConferenceSpace không chỉ trả lời câu hỏi "lưu ở đâu", mà còn xác định mỗi loại dữ liệu chịu trách nhiệm cho phần nào trong quy trình học thuật. Cách tổ chức này giúp hệ thống giữ được ba nguyên tắc đã đặt ra từ Chương 1 và Chương 2: nghiệp vụ cốt lõi phải nhất quán, các cảnh báo rủi ro phải có bằng chứng kiểm tra được, và đầu ra AI phải có khả năng truy vết thay vì trở thành kết luận mơ hồ.

Nhóm thứ nhất là **dữ liệu nghiệp vụ quan hệ**. Các thực thể như `users`, `conferences`, `conference_user_roles`, `conference_submissions`, `paper_assignments`, `rebuttal_points`, `discussion_threads`, `discussion_messages` và `notifications` mô tả vòng đời chính của một hội nghị. Trong nhóm này, `paper_assignments` là thực thể trung tâm vì nó nối submission với reviewer, đồng thời lưu trạng thái phân công, điểm matching, trạng thái review, nội dung review có cấu trúc và metadata audit. Nhờ vậy, hệ thống không tách rời "gợi ý phân công" khỏi quá trình review thật sự.

Nhóm thứ hai là **dữ liệu quan hệ học thuật và xung đột lợi ích**. ConferenceSpace lưu cache hồ sơ học thuật qua `scholar_profiles`, `scholar_papers`, `scholar_profile_papers` và `semantic_scholar_cache`, đồng thời lưu kết quả phát hiện xung đột lợi ích trong `coi_relationships`. Với `coi_relationships`, mỗi cảnh báo không chỉ là một cờ boolean mà có loại quan hệ, mức độ nghiêm trọng, nguồn phát hiện và bằng chứng đi kèm. Phần graph trong Neo4j dùng để mô hình hóa quan hệ đồng tác giả giữa các tác giả/reviewer, sau đó kết quả có ý nghĩa nghiệp vụ được đồng bộ về PostgreSQL để Chair kiểm tra trong cùng luồng phân công.

Nhóm thứ ba là **dữ liệu AI và trạng thái vận hành**. Các workflow AI không được xem là hộp đen tách khỏi hệ thống chính. Schema `ai` lưu session hội thoại, message, tool audit, các run của Submission Gating, Reviewer Initial Analysis, Review Quality Audit và Chair Decision Copilot, cùng artifact JSON, fingerprint, trạng thái, thời điểm tạo và bản ghi theo từng stage. Thiết kế này cho phép hệ thống biết một artifact được sinh từ submission/assignment nào, theo trạng thái dữ liệu nào và có còn hợp lệ hay không. Đây cũng là nền để Chương 4 đánh giá workflow AI bằng input/output, timing và failure case, thay vì chỉ dựa vào cảm nhận người dùng.

| Nhóm dữ liệu           | Thực thể tiêu biểu                                                               | Vai trò trong thiết kế                                                                  |
| ---------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Nghiệp vụ hội nghị     | `conferences`, `conference_submissions`, `paper_assignments`, `rebuttal_points`  | Bảo toàn vòng đời submission-review-rebuttal và các ràng buộc giao dịch                 |
| Phân quyền và phối hợp | `users`, `conference_user_roles`, `discussion_threads`, `notifications`          | Đảm bảo mỗi vai trò chỉ thao tác trong phạm vi được phép và nhận đúng tín hiệu vận hành |
| Học thuật và COI       | `scholar_profiles`, `scholar_papers`, `coi_relationships`, Neo4j co-author graph | Phát hiện quan hệ rủi ro và cung cấp bằng chứng để Chair kiểm tra                       |
| AI artifact và audit   | `ai.*_runs`, `ai.*_artifacts`, `ai.*_stage_records`, `ai_tool_audit`             | Truy vết đầu vào, đầu ra, trạng thái và lỗi của các workflow AI                         |

**Hình 3.17. Mô hình dữ liệu nghiệp vụ cốt lõi**

```mermaid
erDiagram
    USERS ||--o{ CONFERENCE_USER_ROLES : "has role"
    CONFERENCES ||--o{ CONFERENCE_USER_ROLES : "scopes"
    CONFERENCES ||--o{ CONFERENCE_SUBMISSIONS : "receives"
    CONFERENCES ||--o{ PAPER_ASSIGNMENTS : "groups"
    CONFERENCE_SUBMISSIONS ||--o{ PAPER_ASSIGNMENTS : "assigned"
    USERS ||--o{ PAPER_ASSIGNMENTS : "reviews"
    PAPER_ASSIGNMENTS ||--o{ REVIEW_AUDIT_EVENTS : "records"
    CONFERENCE_SUBMISSIONS ||--o{ REBUTTAL_POINTS : "has"
    CONFERENCE_SUBMISSIONS ||--o{ DISCUSSION_THREADS : "discussed"
    DISCUSSION_THREADS ||--o{ DISCUSSION_MESSAGES : "contains"
    CONFERENCES ||--o{ COI_RELATIONSHIPS : "tracks"
    USERS ||--o{ SCHOLAR_PROFILES : "links"
```

**Hình 3.18. Dữ liệu COI từ graph đến bằng chứng nghiệp vụ**

```mermaid
flowchart LR
    S["Submission author"] --> A["Author node"]
    R["Reviewer profile"] --> B["Reviewer node"]
    A -- "COAUTHORED_WITH" --> C["Co-author"]
    C -- "COAUTHORED_WITH" --> B
    B --> D{"COI path within threshold?"}
    D --> E["coi_relationships"]
    E --> F["Chair inspection before assignment"]
```

**Hình 3.19. Truy vết dữ liệu AI trong hệ thống**

```mermaid
flowchart TD
    A["Submission / assignment / conference state"] --> B["Input fingerprint"]
    B --> C["AI workflow run"]
    C --> D["Stage records"]
    C --> E["Artifact JSON"]
    C --> F["Error detail / timing"]
    E --> G["User-facing support"]
    D --> H["Benchmark and debugging evidence"]
    F --> H
```

Điểm quan trọng của thiết kế trên là dữ liệu AI luôn gắn với dữ liệu nghiệp vụ cụ thể. Ví dụ, Reviewer Initial Analysis gắn với `assignment_id` và `submission_id`, Review Quality Audit gắn với bản review đang được lưu trong `paper_assignments`, còn Chair Decision Copilot gắn với submission và evidence fingerprint tại thời điểm sinh gợi ý. Vì vậy, khi submission, review hoặc rebuttal thay đổi, hệ thống có cơ sở để xác định artifact cũ có còn phù hợp hay cần sinh lại.

### 3.3.5. Luồng xử lý hệ thống

#### Luồng nộp bài có AI hỗ trợ

```mermaid
sequenceDiagram
    actor Author as Tác giả
    participant FE as Frontend
    participant BE as Backend
    participant AI as AI Service
    participant DB as PostgreSQL

    Author->>FE: Tải bản thảo và mở form nộp bài
    FE->>BE: Gửi file và conference context
    BE->>AI: Yêu cầu Submission Autofill
    AI->>AI: Trích xuất nội dung, gọi model, validate schema
    AI-->>BE: Metadata và gợi ý track
    BE-->>FE: Trả bản nháp cho tác giả
    Author->>FE: Kiểm tra, chỉnh sửa, xác nhận
    FE->>BE: Lưu draft và yêu cầu kiểm tra nộp bài
    BE->>AI: Yêu cầu Submission Gating trên draft
    AI->>AI: Kiểm tra policy, format, section và nội dung cần rà soát
    AI-->>BE: Kết quả pass/warn/block và guidance
    BE-->>FE: Hiển thị cảnh báo hoặc cho phép gửi chính thức
    Author->>FE: Sửa nếu cần và xác nhận gửi
    FE->>BE: Gửi submission chính thức sau gating
    BE->>DB: Lưu submission, authors, files, COI declarations
```

Luồng này thể hiện đúng ranh giới trách nhiệm: AI giúp tạo bản nháp và kiểm tra draft ở cổng nộp bài, backend giữ quyền ghi dữ liệu chính thức, tác giả xác nhận trước khi lưu. Submission Gating đóng vai trò tương tự desk reject ở tầng nộp draft đối với lỗi policy/hình thức hoặc dấu hiệu cần rà soát, nhưng không thay thế đánh giá học thuật sau khi bài được phân công phản biện. Nếu AI lỗi, form thủ công và quy trình nộp bài cơ bản vẫn phải hoạt động.

#### Luồng agent truy vấn dữ liệu hệ thống

```mermaid
flowchart TD
    A["Người dùng hỏi Chatbot Agent"] --> B["AI service nhận hội thoại"]
    B --> C{"Cần dữ liệu hệ thống?"}
    C -- "Không" --> D["Trả lời hướng dẫn chung"]
    C -- "Có" --> E["Gọi backend /api/v1/agent/query"]
    E --> F["Backend kiểm tra user token và X-Agent-Service-Token"]
    F --> G["Query engine kiểm tra resource registry"]
    G --> H["Thực thi query được phép"]
    H --> I["AI service tổng hợp câu trả lời"]
```

Chatbot Agent không được truy vấn database tùy ý. Mọi truy vấn đều đi qua backend query engine và resource registry, nhờ đó quyền truy cập dữ liệu vẫn nằm dưới kiểm soát của backend nghiệp vụ.

---

## 3.4. Cơ chế nghiệp vụ và thuật toán xác định

### 3.4.1. Vai trò của các cơ chế xác định

Không phải mọi chức năng thông minh trong ConferenceSpace đều cần AI. Một số tác vụ cần tính quyết định, khả năng giải thích và kết quả lặp lại ổn định hơn là khả năng sinh ngôn ngữ. Vì vậy, hệ thống tách riêng các cơ chế nghiệp vụ và thuật toán xác định khỏi lớp AI.

Nhóm cơ chế này gồm reviewer matching, phát hiện xung đột lợi ích, kiểm tra trạng thái hội nghị, kiểm soát deadline, phân quyền theo vai trò, notification routing và một số kiểm tra hợp lệ của submission/review. Điểm chung của chúng là: cùng một đầu vào phải cho cùng một kết quả; khi có lỗi, hệ thống phải chỉ ra nguyên nhân cụ thể; người dùng có thẩm quyền có thể kiểm tra và ghi đè trong phạm vi nghiệp vụ.

### 3.4.2. Reviewer matching

Reviewer matching được triển khai như một thuật toán xác định dựa trên Domain Jaccard Similarity và greedy assignment. Mục tiêu của thuật toán không phải là thay Chair chọn reviewer, mà là tạo một proposal có thể giải thích, kiểm tra và chỉnh sửa.

Đầu vào của thuật toán gồm:

| Nhóm dữ liệu | Nội dung sử dụng |
|---|---|
| Submission | Track, keyword, domain và trạng thái hợp lệ để phân công |
| Reviewer | Domain chuyên môn, trạng thái tham gia hội nghị, tải phản biện hiện tại và giới hạn số bài có thể nhận |
| Cấu hình hội nghị | Số reviewer cần cho mỗi bài, ngưỡng phù hợp tối thiểu nếu có và giới hạn tải |
| COI | Các cặp submission-reviewer bị loại do self-author, khai báo thủ công hoặc quan hệ đồng tác giả |

Với mỗi cặp submission-reviewer không bị loại bởi COI, hệ thống chuẩn hóa hai tập domain:

```text
S = tập keyword/domain của submission
R = tập domain của reviewer
score(S, R) = |S ∩ R| / |S ∪ R|
```

Nếu cả hai tập rỗng, cặp ứng viên không được xem là có bằng chứng phù hợp và bị đặt score bằng 0. Công thức Jaccard được chọn vì dễ giải thích với Chair: điểm tăng khi reviewer có nhiều domain trùng với bài, và giảm khi hai bên có nhiều domain không giao nhau.

**Hình 3.20. Pipeline reviewer matching**

```mermaid
flowchart TD
    A["Submission keywords/domains"] --> B["Normalize domain set"]
    C["Reviewer scholar profile/domains"] --> B
    B --> D["Compute Jaccard score"]
    D --> E["Build candidate matrix"]
    E --> F["Remove COI pairs"]
    F --> G["Sort by score and load"]
    G --> H["Greedy assignment"]
    H --> I["Chair review and override"]
```

Quá trình tạo proposal diễn ra theo bốn bước:

1. Tạo ma trận ứng viên từ tất cả cặp submission-reviewer hợp lệ.
2. Loại bỏ mọi cặp có COI trước khi sắp xếp điểm.
3. Sắp xếp ứng viên theo score giảm dần; khi bằng điểm, ưu tiên reviewer có tải thấp hơn; nếu vẫn bằng nhau, dùng thứ tự ổn định theo định danh để kết quả lặp lại được.
4. Gán reviewer theo greedy assignment cho đến khi mỗi submission đạt số reviewer yêu cầu hoặc không còn ứng viên hợp lệ.

Load balancing được xử lý như một ràng buộc phụ sau COI. Reviewer đã đạt giới hạn tải sẽ không được chọn thêm; reviewer có tải thấp được ưu tiên trong tie-break để tránh proposal dồn quá nhiều bài vào một người. Tuy nhiên, hệ thống không hạ chuẩn COI hoặc tự tạo reviewer giả để lấp đủ số lượng.

Đầu ra của thuật toán là một proposal gồm assignment đề xuất, score, lý do phù hợp, trạng thái COI, tải reviewer sau gán và danh sách submission chưa đủ reviewer. Chair có thể điều chỉnh proposal trước khi xác nhận. Nếu Chair ghi đè bằng thao tác thủ công, backend vẫn phải kiểm tra quyền và COI trước khi lưu assignment.

Ví dụ, một bài có domain `{machine learning, information retrieval}` và một reviewer có domain `{machine learning, recommender systems}` sẽ có score `1/3`. Nếu reviewer này có tải thấp và không có COI, cặp này có thể được xếp trước một reviewer score thấp hơn. Nếu cùng reviewer được phát hiện là đồng tác giả của bài, cặp bị loại ngay cả khi score cao.

Các failure cases chính được xử lý như sau:

| Tình huống | Cách xử lý |
|---|---|
| Bài không đủ reviewer không có COI | Đánh dấu thiếu reviewer để Chair mời thêm hoặc phân công thủ công |
| Reviewer thiếu domain hoặc profile học thuật | Vẫn có thể xuất hiện với score thấp nếu không có COI, nhưng không được ưu tiên |
| Dữ liệu COI graph không khả dụng | Giữ các lớp COI còn lại và thông báo nguồn evidence bị thiếu |
| Tất cả ứng viên tốt đều có COI | Không gán tự động; COI là ràng buộc cứng |

Thuật toán này không cố gắng mô phỏng toàn bộ quyết định của Chair. Nó cung cấp một danh sách ứng viên có điểm phù hợp và lý do đủ rõ để Chair kiểm tra. Đây là cách cân bằng giữa tự động hóa và trách nhiệm học thuật: hệ thống giảm công tìm kiếm thủ công, nhưng quyết định phân công vẫn thuộc về Chair.

### 3.4.3. Phát hiện xung đột lợi ích

Phát hiện xung đột lợi ích được triển khai theo nhiều lớp để giảm rủi ro bỏ sót quan hệ hiển nhiên:

1. **Self-author detector** phát hiện trường hợp reviewer là tác giả hoặc đồng tác giả của bài.
2. **Declared-conflict detector** sử dụng khai báo thủ công từ tác giả, reviewer hoặc Chair.
3. **Co-author graph detector** sử dụng Neo4j để truy vấn quan hệ đồng tác giả nhiều bậc trong đồ thị học thuật.

**Hình 3.21. Cơ chế phát hiện xung đột lợi ích đa tầng**

```mermaid
flowchart TD
    A["Submission-reviewer pair"] --> B["Self-author detector"]
    A --> C["Declared conflict detector"]
    A --> D["Co-author graph detector"]
    B --> E{"Conflict found?"}
    C --> E
    D --> E
    E -- "Có" --> F["Block assignment candidate"]
    E -- "Không" --> G["Allow matching candidate"]
    F --> H["Store coi_relationships with evidence"]
```

Trong luồng phân công, COI là ràng buộc cứng và được áp dụng trước khi tính assignment cuối. Thuật toán có thể fallback khi thiếu reviewer phù hợp, nhưng không được bỏ qua COI để lấp đủ số lượng. Mỗi cảnh báo COI được lưu kèm loại quan hệ, nguồn phát hiện và bằng chứng để Chair kiểm tra.

Kết quả COI không chỉ là giá trị đúng/sai. Với mỗi cặp bị loại, hệ thống cần lưu nguồn phát hiện, loại quan hệ và bằng chứng đủ để Chair hiểu vì sao reviewer không được đề xuất. Cách lưu này quan trọng vì COI có tính nghiệp vụ: Chair cần biết khác biệt giữa reviewer là đồng tác giả, reviewer do tác giả khai báo xung đột, và reviewer chỉ có quan hệ đồng tác giả gián tiếp trong graph học thuật.

### 3.4.4. Các cơ chế nghiệp vụ hỗ trợ vận hành

Bên cạnh matching và COI, hệ thống có nhiều cơ chế xác định nhỏ hơn nhưng quan trọng cho trải nghiệm vận hành:

- **State machine hội nghị** kiểm soát các giai đoạn Draft, Open, Reviewing, Decision và Closed.
- **Deadline gating** kiểm tra thời điểm nộp bài, chỉnh sửa, gửi review và rebuttal.
- **Camera-ready upload guard** chỉ cho phép tải file khi bài đã accepted và file tải lên hợp lệ; deadline camera-ready được dùng như thông tin vận hành/cấu hình, không được mô tả như một gate runtime trong phiên bản hiện tại.
- **RBAC theo hội nghị** kiểm tra vai trò của người dùng trên từng tài nguyên.
- **Notification routing** gửi thông báo đúng người, đúng thời điểm, đúng ngữ cảnh.
- **Schema validation** kiểm tra request/response trước khi ghi dữ liệu bền vững.

Các cơ chế này là phần nền của hệ thống. Nếu chúng không đúng, AI workflow dù tốt cũng không thể tạo ra một nền tảng đáng tin cậy.

---

## 3.5. Giải pháp AI

### 3.5.1. Vai trò của AI trong hệ thống

AI được đưa vào ConferenceSpace theo vai trò hỗ trợ từng điểm nghẽn, không phải như lớp tự động hóa toàn bộ quy trình. Nhóm chia workflow AI thành ba nhóm.

Nhóm thứ nhất là **hỗ trợ nhập liệu và kiểm tra sớm** cho tác giả: Submission Autofill và Submission Gating. Submission Autofill có thể gợi ý track từ nội dung bản thảo và danh sách track của hội nghị, nhưng đây là một khả năng bên trong workflow nộp bài, không phải một workflow AI riêng. Nhóm này giải quyết trực tiếp vấn đề biểu mẫu dài, lựa chọn track thủ công và lỗi chỉ được phát hiện muộn.

Nhóm thứ hai là **hỗ trợ đọc và kiểm soát chất lượng phản biện** cho reviewer: Reviewer Initial Analysis và Review Quality Auditor. Nhóm này không thay việc đọc bài hoặc viết phản biện, mà giúp reviewer định hướng đọc và kiểm tra bản nháp có đủ căn cứ hay chưa.

Nhóm thứ ba là **hỗ trợ tổng hợp và truy vấn ngữ cảnh hệ thống**. Chair Decision Copilot hỗ trợ Chair tổng hợp review, rebuttal và thảo luận để chuẩn bị quyết định. Chatbot Agent là trợ lý chung cho tác giả, reviewer và Chair, cho phép mỗi vai trò tra cứu thao tác, trạng thái và dữ liệu trong phạm vi quyền truy cập của mình. Nhóm này giảm tải nhận thức ở các điểm người dùng phải tổng hợp nhiều nguồn thông tin hoặc tự dò trạng thái hệ thống.

### 3.5.2. Các workflow có sử dụng AI

#### 3.5.2.1. Submission Autofill

Submission Autofill là workflow đầu tiên tác giả gặp trong luồng nộp bài. Thay vì yêu cầu tác giả tự nhập lại những thông tin đã có trong bản thảo, hệ thống đọc file, trích xuất nội dung, tạo bản nháp metadata và gợi ý track phù hợp trong danh sách track hợp lệ của hội nghị. Đây là workflow giảm thao tác nhập liệu, không phải cơ chế tự động nộp bài.

**Hình 3.22. Luồng hoạt động của Submission Autofill**

```mermaid
flowchart TD
    A["Tác giả tải bản thảo"] --> B["Backend nhận file và conference context"]
    B --> C["AI Service trích xuất nội dung tài liệu"]
    C --> D{"Nội dung đủ căn cứ?"}
    D -- "Không" --> E["Trả cảnh báo hoặc lỗi đọc file"]
    D -- "Có" --> F["Tạo metadata nháp từ nội dung bản thảo"]
    F --> G["Gợi ý track trong danh sách track hợp lệ"]
    G --> H["Validate schema và chuẩn hóa output"]
    H --> I["Frontend hiển thị bản nháp có thể chỉnh sửa"]
    I --> J["Tác giả xác nhận hoặc sửa trước khi lưu"]
```

**Dạng đầu vào chính**

| Nhóm dữ liệu        | Nội dung                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| Bản thảo            | File PDF hoặc tài liệu nộp chính, kèm tên file, loại nội dung và kích thước |
| Ngữ cảnh hội nghị   | Tên hội nghị, mô tả, domain, CFP và danh sách track đang mở                 |
| Ngữ cảnh người dùng | Tác giả đang đăng nhập, hội nghị đang thao tác và thông tin bổ sung nếu có  |

**Dạng đầu ra chính**

| Nhóm dữ liệu     | Nội dung                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| Metadata nháp    | Tiêu đề, tóm tắt, keyword, loại bài và ghi chú bổ sung nếu trích xuất được     |
| Tác giả nháp     | Tên, email, đơn vị và quốc gia khi thông tin xuất hiện rõ trong bản thảo       |
| Gợi ý track      | Danh sách track hợp lệ được đề xuất kèm độ tự tin và lý do ngắn                |
| Trạng thái xử lý | Trạng thái thành công/thất bại, cảnh báo đọc file, thông tin material đã xử lý |

Điểm quan trọng của thiết kế là output luôn ở dạng bản nháp. Frontend không khóa các trường do AI tạo và backend chỉ lưu submission chính thức sau khi tác giả xác nhận. Nếu file có độ phủ text thấp hoặc thiếu căn cứ, workflow phải trả cảnh báo thay vì điền thông tin bằng suy đoán. Nhờ vậy, Submission Autofill hỗ trợ tốc độ nhập liệu nhưng vẫn giữ trách nhiệm kiểm tra cuối cùng ở tác giả.

#### 3.5.2.2. Submission Gating

Submission Gating là lớp kiểm tra trước khi submission được gửi chính thức. Workflow này kết hợp rule xác định và đánh giá hỗ trợ bằng AI để phát hiện lỗi hình thức, thiếu điều kiện policy hoặc rủi ro nội dung cần người dùng xem lại. Vai trò của gating là đưa lỗi về sớm tại thời điểm tác giả còn có thể sửa, thay vì để lỗi xuất hiện muộn sau khi hệ thống đã bước vào giai đoạn phản biện.

**Hình 3.23. Luồng hoạt động của Submission Gating**

```mermaid
flowchart TD
    A["Nộp bài hoặc chạy pre-check"] --> B["1. Intake Normalization<br/>Chuẩn hóa request, actor, policy và file metadata"]
    B -- "Lỗi cấu trúc request" --> B0["BLOCK<br/>Trả lỗi API"]
    B -- "Hợp lệ" --> C["2. Binary Integrity<br/>Kiểm tra định dạng, dung lượng và khả năng đọc bytes đầu vào"]
    C -- "Định dạng không hỗ trợ<br/>hoặc quá dung lượng" --> C0["BLOCK"]
    C -- "Hợp lệ" --> D["3. Document Extraction<br/>Đọc PDF, DOCX hoặc LaTeX; trích text, section và layout facts"]
    D -- "Tệp hỏng, bị khóa<br/>hoặc không trích xuất được" --> D0["BLOCK"]
    D -- "Thành công" --> E["4. Fact Derivation<br/>Tính số trang, references, section presence, anonymity và format facts"]
    E -- "Có steering prompt của Chair" --> F["5. Content Evaluation AI/LLM<br/>Kiểm tra nội dung theo policy mềm do Chair cấu hình"]
    E --> G["6. Policy Evaluation deterministic<br/>Page limit, min references, required sections,<br/>anonymity, banned phrases, font, margin, paper size, columns"]
    F --> H["7. Verdict Mapping<br/>Gộp findings và tính verdict cuối"]
    G --> H
    H -- "Có deterministic block" --> I["BLOCK<br/>Yêu cầu sửa lỗi policy hoặc hình thức"]
    H -- "Chỉ có cảnh báo/advisory" --> J["WARN<br/>Cho phép tiếp tục, flag để xem thủ công"]
    H -- "Không có vi phạm" --> K["PASS"]
    H --> L["Guidance Rendering và Persistence Audit<br/>Lưu fingerprint, policy hash, stage timings"]
```

Sơ đồ này tách rõ ba lớp kiểm soát. Lớp đầu tiên chặn sớm các lỗi kỹ thuật có thể tái lập như request sai cấu trúc, file không hỗ trợ, file bị hỏng, bị khóa hoặc không thể trích xuất nội dung. Lớp thứ hai là rule deterministic dựa trên policy hội nghị và facts trích xuất được; đây là nguồn duy nhất có thể tạo `block` ở bước đánh giá policy. Lớp thứ ba là Content Evaluation dùng AI theo steering prompt của Chair; lớp này chỉ tạo `warn` hoặc `pass`, nhằm chỉ ra điểm cần xem lại chứ không tự động loại bài vì nhận định nội dung.

**Dạng đầu vào chính**

| Nhóm dữ liệu      | Nội dung                                                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft submission  | Tiêu đề, tóm tắt, track đã chọn, keyword, đồng tác giả, COI khai báo và metadata liên quan                                                                                                                      |
| Policy hội nghị   | Định dạng submission, số trang khuyến nghị/tối đa, số lượng tài liệu tham khảo tối thiểu, section bắt buộc, yêu cầu ẩn danh, cụm từ bị cấm, cấu hình font/margin/page size/columns và steering prompt của Chair |
| File và nguồn gọi | File metadata, mode `advisory` hoặc `gate`, nguồn gọi như precheck hoặc submit chính thức                                                                                                                       |

**Dạng đầu ra chính**

| Nhóm dữ liệu   | Nội dung                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Verdict        | `pass`, `warn`, `block` hoặc `error`                                                                                            |
| Finding        | Rule, nguồn phát hiện (`deterministic` hoặc `llm_content_evaluation`), mức độ nghiêm trọng, thông điệp, bằng chứng và hướng sửa |
| Guidance       | Danh sách việc tác giả cần chỉnh trước khi gửi hoặc trước khi Chair xem lại                                                     |
| Audit metadata | Input fingerprint, policy hash, summary theo mức độ, thời gian từng stage, stage bị skip hoặc lỗi và dấu hiệu deterministic     |

Điểm cần nhấn mạnh là Submission Gating đóng vai trò như desk-check/desk-reject gate ở khâu nộp draft, nhưng không phải quyết định desk rejection học thuật cuối cùng. Chỉ các lỗi có policy rõ ràng, có thể giải thích và tái lập mới nên tạo trạng thái `block`, ví dụ không đọc được file, thiếu số lượng tài liệu tham khảo tối thiểu, thiếu section bắt buộc khi hệ thống xác minh được, vi phạm yêu cầu ẩn danh, chứa cụm từ bị cấm hoặc không đáp ứng ngưỡng font/margin đã cấu hình. Các nhận xét nội dung mềm từ AI chỉ nên ở dạng cảnh báo hoặc hướng kiểm tra để tác giả và Chair xem lại.

#### 3.5.2.3. Reviewer Initial Analysis

Reviewer Initial Analysis tạo briefing ban đầu cho reviewer trước khi reviewer bắt đầu viết phản biện. Workflow này không thay thế việc đọc bài; nó tạo một lớp định hướng gồm snapshot trung lập, đóng góp được claim, điểm đáng chú ý, điểm cần kiểm tra và annotation theo section. Thiết kế này trực tiếp bám với kết quả khảo sát ở Chương 2: reviewer chấp nhận AI tốt hơn khi AI giúp nắm bối cảnh ban đầu, nhưng vẫn cần tự đánh giá chuyên môn.

**Hình 3.24. Luồng hoạt động của Reviewer Initial Analysis**

```mermaid
flowchart TD
    A["Reviewer mở bài được phân công"] --> B["Backend gom submission snapshot và file metadata"]
    B --> C["Tạo submission state fingerprint"]
    C --> D{"Artifact còn hợp lệ?"}
    D -- "Có" --> E["Trả briefing từ cache"]
    D -- "Không" --> F["AI Service tạo briefing và annotation"]
    F --> G["Validate structured output"]
    G --> H["Lưu artifact theo assignment/submission"]
    E --> I["Reviewer đọc briefing trong giao diện review"]
    H --> I
    I --> J["Reviewer đọc bài gốc và viết phản biện"]
```

**Dạng đầu vào chính**

| Nhóm dữ liệu        | Nội dung                                                                     |
| ------------------- | ---------------------------------------------------------------------------- |
| Submission snapshot | Tiêu đề, tóm tắt, keyword, track và trạng thái bản thảo                      |
| Ngữ cảnh reviewer   | Assignment, reviewer đang đăng nhập và domain tags nếu có                    |
| Fingerprint         | Dấu vết trạng thái submission để xác định artifact cũ có còn dùng được không |

**Dạng đầu ra chính**

| Nhóm dữ liệu | Nội dung                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| Briefing     | Snapshot bài nộp, tín hiệu sẵn sàng phản biện, đóng góp được claim, điểm đáng chú ý và limitation |
| Annotation   | Nhận xét theo section, gồm strength, weakness, suggestion hoặc question                           |
| Cache state  | Trạng thái `idle`, `ready`, `stale` hoặc `failed`, kèm run id và fingerprint                      |

Luận điểm thiết kế quan trọng là AI có thể giảm số lần reviewer phải đọc lại toàn bộ bài chỉ để truy vết các điểm cần chú ý. Khi các điểm cần kiểm tra được gom lại có cấu trúc, reviewer có thể tập trung nhiều hơn vào đánh giá chuyên môn, chất lượng lập luận và bằng chứng trong bài. Vì vậy, giao diện cần trình bày artifact như briefing hỗ trợ đọc, không như kết luận thay reviewer.

#### 3.5.2.4. Review Quality Auditor

Review Quality Auditor kiểm tra chất lượng của bản nháp review trước khi reviewer gửi chính thức. Khác với Reviewer Initial Analysis, workflow này không đọc bài để đánh giá bài báo, mà đọc chính bản phản biện để phát hiện vấn đề về độ cụ thể, tính nhất quán, mức độ bám bằng chứng và độ đầy đủ theo form. Đây là cơ chế giảm rủi ro hệ thống nhận review quá ngắn, quá chung chung hoặc mâu thuẫn giữa điểm số và nhận xét.

**Hình 3.25. Luồng hoạt động của Review Quality Auditor**

```mermaid
flowchart TD
    A["Reviewer lưu hoặc chuẩn bị gửi review draft"] --> B["Backend gom review draft, score và policy"]
    B --> C["Đính kèm submission context và briefing nếu có"]
    C --> D["AI Service kiểm tra chất lượng review"]
    D --> E["Validate finding code, field và severity"]
    E --> F{"Status"}
    F -- "pass" --> G["Cho phép reviewer tiếp tục gửi"]
    F -- "warn" --> H["Gợi ý chỉnh sửa nhưng không kết luận thay reviewer"]
    F -- "block" --> I["Yêu cầu chỉnh review chưa đạt điều kiện tối thiểu"]
    H --> J["Reviewer sửa hoặc xác nhận"]
    I --> J
```

**Dạng đầu vào chính**

| Nhóm dữ liệu     | Nội dung                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Review draft     | Điểm theo tiêu chí, summary, strengths, weaknesses, questions, recommendation và confidence |
| Policy review    | Section bắt buộc và chế độ kiểm tra như draft save, submit preflight hoặc enforcement       |
| Ngữ cảnh bài nộp | Tiêu đề, tóm tắt, keyword, track và artifact phân tích ban đầu nếu có                       |

**Dạng đầu ra chính**

| Nhóm dữ liệu | Nội dung                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Status       | `pass`, `warn` hoặc `block`                                                                      |
| Evaluation   | Tóm tắt mức độ cụ thể, mức độ bám bằng chứng, tính nhất quán và trọng tâm cần cải thiện          |
| Finding      | Mã vấn đề, severity, field bị ảnh hưởng, rationale, message, suggestion và fingerprint điều kiện |

Ba trạng thái của Review Quality Auditor cần được hiểu theo chất lượng bản review, không theo chất lượng bài báo:

| Trạng thái | Khi nào xảy ra                                                                                                                                                                                                                                | Ý nghĩa trong workflow                                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pass`     | Không có finding đáng kể sau khi kiểm tra độ cụ thể, mức độ bám bằng chứng và tính nhất quán                                                                                                                                                  | Reviewer có thể tiếp tục lưu/gửi review; hệ thống không thêm rào cản                                                                                  |
| `warn`     | Có vấn đề nên sửa, nhưng review vẫn có thể dùng được sau khi reviewer cân nhắc, ví dụ thiếu giải thích cho một tiêu chí phụ, strengths/weaknesses chưa cân bằng, hoặc confidence chưa được hỗ trợ đủ rõ                                       | Frontend hiển thị cảnh báo và gợi ý chỉnh sửa; reviewer vẫn giữ quyền sửa, bỏ qua hoặc xác nhận tùy policy                                            |
| `block`    | Review chưa đủ tư cách gửi như một phản biện học thuật ở trạng thái hiện tại, chẳng hạn tự mâu thuẫn nghiêm trọng, khuyến nghị không có lập luận hỗ trợ, bỏ qua claim trung tâm của bài, hoặc quá chung chung đến mức Chair không thể sử dụng | Hệ thống yêu cầu reviewer chỉnh review trước khi gửi chính thức; block áp vào hành động gửi review, không áp vào quyết định accept/reject của bài báo |

Điểm dễ gây hiểu nhầm là vì sao output của AI có thể dẫn tới trạng thái `block`. Trong thiết kế này, AI không chặn review vì không đồng ý với nhận định chuyên môn, không đề xuất đổi điểm, recommendation hoặc confidence. Auditor chỉ kiểm tra **tính sử dụng được của bản phản biện**: review có tự mâu thuẫn không, recommendation có thiếu lập luận hỗ trợ không.

Trong triển khai, model chỉ sinh finding gồm mã lỗi, field liên quan và mức nghiêm trọng. Runtime mới quyết định trạng thái cuối theo mode. Ở chế độ `draft_save`, lỗi nghiêm trọng vẫn được hạ thành cảnh báo để reviewer lưu nháp. Trước khi gửi chính thức, một số lỗi nặng mới được map thành `block`, như tự mâu thuẫn, recommendation không được hỗ trợ, recommendation lệch với lập luận. Vì vậy, `block` chỉ ngăn thao tác gửi một review chưa đạt điều kiện tối thiểu, không phải quyết định học thuật về paper.

Giới hạn hiện tại là finding vẫn do AI sinh ra, nên có thể thiếu căn cứ hoặc diễn giải quá mạnh. Một hướng kiểm soát là chuẩn hóa finding thành claim, liên kết claim với evidence từ review, submission và artifact liên quan, sau đó dùng cơ chế hậu kiểm claim-evidence để quyết định giữ mức cảnh báo cao hay hạ mức cảnh báo. Phần đánh giá định lượng của cơ chế này được trình bày ở Chương 4.

Auditor không xác định bài báo tốt hay xấu. Nó chỉ kiểm tra chất lượng của chính bản phản biện: review có quá ngắn không, nhận xét có cụ thể không, điểm số và nhận xét có mâu thuẫn không, có thiếu phần bắt buộc không. Reviewer vẫn là người sửa nội dung review và chịu trách nhiệm cuối cùng với nhận định chuyên môn của mình.

#### 3.5.2.5. Chair Decision Copilot

Chair Decision Copilot hỗ trợ Chair đọc nhanh toàn bộ evidence package của một submission. Ở giai đoạn ra quyết định, Chair phải đối chiếu nhiều nguồn: điểm số, nội dung review, thay đổi sau rebuttal, discussion nội bộ, phản hồi tác giả và trạng thái hội nghị. Copilot gom các nguồn này thành bản tổng hợp có cấu trúc để Chair kiểm tra nhanh hơn.

**Hình 3.26. Luồng hoạt động của Chair Decision Copilot**

```mermaid
flowchart TD
    A["Chair mở submission detail"] --> B["Backend gom evidence package"]
    B --> C["Tạo evidence fingerprint và component fingerprints"]
    C --> D{"Artifact còn hợp lệ?"}
    D -- "Có" --> E["Trả bản tổng hợp từ cache"]
    D -- "Không" --> F["AI Service tổng hợp evidence"]
    F --> G["Validate schema: summary, analytics, disagreement map"]
    G --> H["Lưu artifact và cache metadata"]
    E --> I["Chair đọc bản tổng hợp và đối chiếu dữ liệu gốc"]
    H --> I
    I --> J["Chair tự ra quyết định trong workflow hội nghị"]
```

**Dạng đầu vào chính**

| Nhóm dữ liệu           | Nội dung                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| CFP và submission      | Tên hội nghị, domain, track, tiêu đề bài, trạng thái, keyword và thời điểm cập nhật                |
| Review evidence        | Recommendation, confidence, score, summary, strengths, weaknesses, questions và điểm theo tiêu chí |
| Review analytics       | Phân bố recommendation, mix confidence, tiêu chí mạnh/yếu và mức độ đầy đủ của review              |
| Discussion và rebuttal | Thread thảo luận, phản hồi tác giả, trạng thái acknowledgement và điểm còn bỏ ngỏ                  |

**Dạng đầu ra chính**

| Nhóm dữ liệu     | Nội dung                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| Evidence summary | Overview và danh sách bằng chứng chính mà Chair cần xem                        |
| Review synthesis | Tổng hợp điểm mạnh, điểm yếu, câu hỏi và xu hướng phản biện                    |
| Disagreement map | Điểm đồng thuận, điểm bất đồng, concern chưa giải quyết và giới hạn độ tin cậy |
| Chair note nháp  | Gợi ý ghi chú tổng hợp để Chair chỉnh sửa, không phải quyết định accept/reject |

Workflow này không sinh quyết định accept/reject. Nếu hệ thống trình bày một khuyến nghị như kết luận, nó sẽ làm lệch trách nhiệm học thuật. Vì vậy, output của Copilot được thiết kế như bản tổng hợp để Chair đọc nhanh hơn và đối chiếu với dữ liệu gốc. Trạng thái cache `stale` cũng quan trọng: khi review, rebuttal hoặc discussion thay đổi, bản tổng hợp cũ phải được đánh dấu không còn hiện hành.

#### 3.5.2.6. Chatbot Agent của nền tảng

Chatbot Agent là trợ lý chung của nền tảng, dùng được bởi tác giả, reviewer và Chair. Khác với các workflow còn lại, agent không gắn với một chức năng cụ thể mà sử dụng các công cụ của nền tảng để hỗ trợ người dùng trong các thao tác như hỏi đáp về hệ thống, truy vấn dữ liệu hoặc tạo báo cáo dựa trên trạng thái trong phạm vi quyền truy cập của từng vai trò. Khi cần dữ liệu hệ thống, agent không truy vấn database trực tiếp mà gọi backend query endpoint để đi qua cùng lớp phân quyền như phần còn lại của hệ thống.

**Hình 3.27. Luồng hoạt động của Chatbot Agent**

```mermaid
flowchart TD
    A["Người dùng gửi câu hỏi"] --> B["AI Service nhận thread, message và page context"]
    B --> C["Agent xác định có cần gọi tool hay không"]
    C -- "Không cần dữ liệu hệ thống" --> D["Trả lời theo ngữ cảnh hội thoại"]
    C -- "Cần dữ liệu hệ thống" --> E["Gọi query_engine với resource, select, filter, sort"]
    E --> F["Backend kiểm tra user token và service token"]
    F --> G["Resource registry kiểm tra field và policy"]
    G --> H["Backend trả rows và policy notes"]
    H --> I["Agent tổng hợp câu trả lời có giới hạn"]
    D --> J["Frontend hiển thị trong chatbot"]
    I --> J
```

**Dạng đầu vào chính**

| Nhóm dữ liệu       | Nội dung                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Hội thoại          | Thread id, lịch sử message, trigger và message id khi regenerate                           |
| Ngữ cảnh giao diện | Đường dẫn hiện tại, client metadata và trạng thái trang nếu frontend cung cấp              |
| Tool request       | Resource cần truy vấn, field được chọn, filter, group by, aggregate, sort, limit và offset |

**Dạng đầu ra chính**

| Nhóm dữ liệu    | Nội dung                                                                               |
| --------------- | -------------------------------------------------------------------------------------- |
| Câu trả lời     | Nội dung trả lời cho người dùng, có thể gồm hướng dẫn thao tác hoặc tóm tắt trạng thái |
| Tool result     | Rows được backend cho phép trả về, meta về số dòng, limit/offset và policy notes       |
| Trạng thái tool | `output-available`, `output-error` hoặc `timeout` để frontend/agent xử lý tiếp         |

Ranh giới này đặc biệt quan trọng vì chatbot là nơi dễ phát sinh rủi ro lộ dữ liệu bản thảo hoặc phản biện. Agent chỉ được trả lời dựa trên dữ liệu người dùng có quyền xem. Backend giữ quyền kiểm soát resource, field và filter; AI chỉ đề xuất truy vấn ở mức ý định, không được bỏ qua RBAC hoặc đọc database trực tiếp.

#### 3.5.2.7. Các kiểm soát chung cho workflow AI

Các workflow AI khác nhau về vai trò và dữ liệu, nhưng dùng chung một số kiểm soát kiến trúc. Các kiểm soát này là phần giúp hệ thống giữ được nguyên tắc "AI hỗ trợ, con người quyết định" xuyên suốt Chương 1 và Chương 2.

| Workflow | Output chính | Điểm kiểm soát của con người | Không được làm gì |
|---|---|---|---|
| Submission Autofill | Metadata, keyword và gợi ý track trong danh sách hợp lệ | Tác giả kiểm tra, chỉnh sửa và xác nhận trước khi gửi | Không tự gửi bài; không tự chọn track ngoài cấu hình hội nghị |
| Submission Gating | Verdict `pass`, `warn`, `block` và lý do kiểm tra | Tác giả sửa lỗi hoặc xác nhận tiếp tục khi policy cho phép | Không đánh giá giá trị học thuật của paper |
| Reviewer Initial Analysis | Briefing, điểm cần chú ý và annotation hỗ trợ đọc | Reviewer đọc bài gốc và tự hình thành nhận định chuyên môn | Không thay reviewer đọc bài; không sinh điểm hoặc recommendation |
| Review Quality Auditor | Finding về độ cụ thể, nhất quán và mức độ bám form của review | Reviewer sửa hoặc xác nhận bản review trước khi gửi | Không đổi điểm, recommendation hoặc đánh giá bài báo thay reviewer |
| Chair Decision Copilot | Tổng hợp evidence, đồng thuận, bất đồng và vấn đề còn mở | Chair đối chiếu evidence gốc và tự lưu quyết định cuối cùng | Không sinh quyết định accept/reject |
| Chatbot Agent | Câu trả lời hoặc truy vấn dữ liệu trong phạm vi quyền | Người dùng kiểm tra câu trả lời; backend kiểm soát dữ liệu được trả | Không truy vấn database trực tiếp; không bỏ qua RBAC |

**Hình 3.28. Kiểm soát chung quanh output AI**

```mermaid
flowchart LR
    A["Input nghiệp vụ"] --> B["Fingerprint / policy hash"]
    B --> C["Workflow AI"]
    C --> D["Schema validation"]
    D --> E{"Output hợp lệ?"}
    E -- "Không" --> F["Trả lỗi rõ ràng, không tạo dữ liệu giả"]
    E -- "Có" --> G["Lưu artifact và audit metadata"]
    G --> H["Frontend hiển thị như draft/advisory"]
    H --> I["Human review, override hoặc xác nhận"]
```

| Kiểm soát                 | Vai trò trong hệ thống                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Schema validation         | Output phải đúng cấu trúc trước khi trả về frontend hoặc lưu artifact                             |
| Input fingerprint         | Artifact gắn với trạng thái dữ liệu tại thời điểm sinh; khi dữ liệu đổi, artifact có thể bị stale |
| Policy hash               | Các workflow có policy như Submission Gating phải biết output được tạo theo cấu hình nào          |
| Timeout và error handling | Lỗi provider không được biến thành dữ liệu giả hợp lệ                                             |
| Human override            | Người dùng có thẩm quyền phải có khả năng chỉnh sửa, bỏ qua hoặc xác nhận output                  |
| Audit trail               | Trạng thái, thời gian xử lý, lỗi và stage timings cần được lưu để phục vụ đánh giá ở Chương 4     |

Nhờ các kiểm soát này, AI không trở thành một lớp quyết định ẩn trong hệ thống. Mỗi workflow đều có hợp đồng dữ liệu, trạng thái lỗi và điểm can thiệp của con người. Đây là điều kiện cần để Chương 4 đánh giá đúng bản chất từng workflow: chất lượng của output hỗ trợ được đo riêng với quyền quyết định học thuật của người dùng.

### 3.5.3. AI Service, model router và structured output

AI service được triển khai như một service FastAPI độc lập. Trong repo, service đăng ký các router workflow riêng: submission autofill, submission gating, reviewer initial analysis, review quality audit, chair decision copilot và agent/status router. Cách tách router này giúp mỗi workflow có schema, prompt, runner và validation riêng thay vì gom tất cả vào một endpoint chung.

**Hình 3.29. Luồng tích hợp AI service**

```mermaid
flowchart TD
    B["Backend Go"] --> C["AI Service Client"]
    C --> A["FastAPI Router"]
    A --> W["Workflow Runner"]
    W --> V["Pydantic Schema Validation"]
    V --> L["LLMClient / Model Router"]
    L --> M["gemini-3.1-flash-lite"]
    W --> R["Redis/PostgreSQL artifact"]
    W --> B
```

`LLMClient` là lớp gọi model thống nhất. Client có thể nhận cấu hình OpenAI-compatible provider hoặc OpenRouter provider, có timeout và structured output. Fallback provider chỉ là cơ chế vận hành; nó không làm thay đổi bản chất học thuật của workflow. Mọi workflow vẫn phải tuân thủ cùng schema, prompt và validation.

Cấu hình môi trường cho AI service:

```env
OPENROUTER_API_KEY=
AGENT_MODEL=openrouter/google/gemini-3.1-flash-lite
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gemini-3.1-flash-lite
LLM_REQUEST_TIMEOUT_SECONDS=60
```

### 3.5.4. Tích hợp nguồn dữ liệu học thuật bên ngoài

Semantic Scholar API được dùng để làm giàu hồ sơ học thuật, hỗ trợ matching và phát hiện xung đột lợi ích [16]. Với ConferenceSpace, nguồn dữ liệu này hữu ích vì hệ thống cần thông tin quan hệ học thuật thay vì chỉ dựa vào khai báo thủ công của người dùng.

Tuy nhiên, dữ liệu bên ngoài chỉ là nguồn hỗ trợ. Nếu hồ sơ tác giả thiếu hoặc dữ liệu không đầy đủ, Chair vẫn cần có quyền kiểm tra và ghi đè. Đây là giới hạn quan trọng khi dùng nguồn dữ liệu học thuật tự động trong quy trình có ảnh hưởng đến công bằng phản biện.

### 3.5.5. Ưu điểm và giới hạn của các workflow AI

Ưu điểm lớn nhất của các workflow AI là giảm chi phí thao tác và chi phí nhận thức ở những điểm người dùng đã phản ánh trong Chương 2. Tác giả không phải nhập lại metadata đã có trong bản thảo. Reviewer có thêm bản đồ đọc ban đầu và công cụ kiểm tra bản nháp review. Chair có bản tổng hợp bằng chứng để đối chiếu nhanh hơn.

Tuy nhiên, các lợi ích này chỉ có giá trị nếu được diễn giải đúng phạm vi. AI có thể giúp reviewer giảm số lần đọc lại toàn bộ bài để tìm điểm cần chú ý, nhưng không thể thay thế việc đọc bài. AI có thể giúp Chair nhìn thấy điểm đồng thuận và mâu thuẫn, nhưng không thể quyết định thay Chair. AI có thể giúp tác giả phát hiện lỗi sớm, nhưng không bảo đảm bản thảo đạt chuẩn học thuật.

Các giới hạn chính gồm: phụ thuộc chất lượng file đầu vào, khả năng hallucination hoặc thiếu căn cứ, chi phí/token, rate limit của provider, rủi ro bảo mật dữ liệu bản thảo và khác biệt chất lượng giữa các lĩnh vực chuyên môn. Vì vậy, mọi output AI trong hệ thống đều phải có người kiểm tra, có schema/validation và có tiêu chí đánh giá riêng ở Chương 4.

---

## 3.6. Môi trường triển khai và vận hành

### 3.6.1. Môi trường phát triển cục bộ

Môi trường phát triển cục bộ của ConferenceSpace được thiết kế để nhóm có thể phát triển tính năng, chạy migration, kiểm tra API, kiểm tra workflow AI và tái tạo lỗi vận hành trên máy cá nhân. Môi trường này được chuẩn hóa bằng ba nhóm cơ chế: Docker Compose cho các service có trạng thái, Makefile cho luồng khởi động backend/data/AI, và các biến môi trường mẫu cho cấu hình runtime.

Trong môi trường phát triển, các service như PostgreSQL, Redis, Neo4j và AI service được container hóa để giảm thao tác cài đặt thủ công. Backend có thể chạy trực tiếp bằng Go để giữ vòng lặp sửa code nhanh, trong khi frontend chạy bằng dev server của Next.js.

#### 3.6.1.1. Quy trình khởi động môi trường

Quy trình khởi động môi trường được trình bày để chứng minh rằng backend, database, graph store, cache và AI service có thể được tái lập bằng một luồng thống nhất thay vì cấu hình thủ công rời rạc. Các target chính như sau:

```makefile
dev: db-up redis-up neo4j-up migrate-up neo4j-init ai-service-up swagger server

server:
	go run ./cmd/server/main.go

migrate-up:
	$(MIGRATE) -path migrations \
	  -database "postgresql://postgres:postgres@localhost:5432/conferencespace?sslmode=disable" up
```

Luồng `make dev` là lệnh khởi động nhanh stack chính cho backend và AI service: PostgreSQL, Redis, Neo4j và AI service chạy bằng Docker Compose; migration PostgreSQL và schema Neo4j được chuẩn bị tự động; Swagger docs được sinh lại; Go backend chạy local trên cổng 8080.

Để chạy toàn bộ nền tảng end-to-end với giao diện, frontend Next.js được khởi động riêng ở terminal riêng trong thư mục `frontend`:

```bash
npm install
npm run dev
```

#### 3.6.1.2. Các service phụ thuộc trong môi trường phát triển

Cấu hình Docker Compose local mô tả các dependency vận hành và mở các port cần thiết ra máy phát triển. Phần này quan trọng vì nó giữ các service có trạng thái tách khỏi code đang sửa, trong khi vẫn cho phép kiểm tra trực tiếp PostgreSQL, Redis, Neo4j Browser, backend API và AI service trong quá trình phát triển. Khi cần kiểm tra toàn bộ backend bằng container thay vì `go run`, hệ thống cung cấp luồng `make docker-up`.

```yaml
postgres:
  image: postgres:15-alpine
  ports:
    - "5432:5432"

redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"

neo4j:
  image: neo4j:5.15-community
  ports:
    - "7474:7474"
    - "7687:7687"

ai-service:
  build:
    context: ../ai-service
  ports:
    - "8090:8090"
  environment:
    REDIS_URL: "redis://redis:6379/0"
    POSTGRES_DSN: "postgresql+asyncpg://postgres:postgres@postgres:5432/conferencespace"
    BACKEND_API_BASE_URL: "http://host.docker.internal:8080"
```

Ngoài `make dev`, Makefile cũng có nhóm lệnh `docker-up`, `docker-down`, `docker-logs` và `status` để vận hành stack container hóa, xem log và kiểm tra trạng thái service.

#### 3.6.1.3. Chạy riêng từng service để kiểm thử

Khi cần kiểm thử hoặc phân tích lỗi ở AI service, nhóm có thể chạy service trực tiếp thay vì qua container. Cách chạy riêng này phục vụ debug ở biên tích hợp: kiểm tra migration Alembic, kết nối Redis/PostgreSQL, kết nối backend và cấu hình provider mà không phải khởi động lại toàn bộ stack.

```bash
poetry install
cp .env.example .env
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8090
```

AI service đọc `.env` bằng `pydantic-settings`, kết nối Redis qua `REDIS_URL`, PostgreSQL qua `POSTGRES_DSN` và backend qua `BACKEND_API_BASE_URL`. Khi khởi động, service yêu cầu có một trong hai cấu hình provider hợp lệ: `OPENAI_API_KEY` + `OPENAI_BASE_URL` + `OPENAI_MODEL`, hoặc `OPENROUTER_API_KEY` + `AGENT_MODEL`.

Frontend dùng Next.js và được chạy bằng script phát triển riêng:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

Frontend local thường chạy trên `http://localhost:3000`. Trình duyệt gọi API qua route proxy `/api/backend`; proxy Next.js chuyển request đến `BACKEND_API_BASE_URL`, mặc định là `http://localhost:8080`. Các route chat của frontend gọi `AI_SERVICE_BASE_URL`, mặc định là `http://localhost:8090`. Nhờ vậy, local frontend không cần gọi trực tiếp database hoặc AI provider; mọi truy cập dữ liệu vẫn đi qua backend hoặc AI service.

Các nhóm biến môi trường local chính:

| Thành phần       | Nhóm cấu hình                        | Biến quan trọng                                                                                                                                   | Vai trò                                                                    |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Backend Go       | Server và database                   | `SERVER_PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE`                                                            | Cổng API và kết nối PostgreSQL                                             |
| Backend tích hợp | Service nội bộ và dịch vụ ngoài      | `AI_SERVICE_BASE_URL`, `AI_SERVICE_TIMEOUT_SECONDS`, `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `SEMANTIC_SCHOLAR_API_KEY`, `BREVO_API_KEY` | Kết nối AI service, graph COI, dữ liệu học thuật và email                  |
| Bảo mật backend  | Auth, CORS và service token          | `JWT_SECRET`, `JWT_EXPIRY_HOURS`, `ADMIN_TOKEN`, `AGENT_SERVICE_TOKEN`, `CORS_ALLOWED_ORIGINS`, `APP_BASE_URL`                                    | Xác thực, service-to-service token, CORS và URL ứng dụng                   |
| Lưu trữ file     | Local/Supabase storage               | `FILE_STORAGE_PROVIDER`, `FILE_STORAGE_LOCAL_BASE_PATH`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`                   | Mặc định local lưu file dưới `./uploads/submissions`; Supabase là tùy chọn |
| AI service       | Runtime và provider LLM              | `AI_SERVICE_PORT`, `OPENROUTER_API_KEY`, `AGENT_MODEL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `LLM_REQUEST_TIMEOUT_SECONDS`        | Cấu hình runtime và provider LLM                                           |
| AI service state | State, session và giới hạn hội thoại | `REDIS_URL`, `POSTGRES_DSN`, `POSTGRES_SCHEMA`, `SESSION_TTL_MINUTES`, `MAX_ITERATIONS`, `MAX_TURN_DURATION_SECONDS`                              | Redis/PostgreSQL state, giới hạn hội thoại và timeout                      |
| Frontend Next.js | API proxy và cookie                  | `NEXT_PUBLIC_API_BASE_URL`, `BACKEND_API_BASE_URL`, `AI_SERVICE_BASE_URL`, `AI_SERVICE_ENABLED`, `JWT_EXPIRY_SECONDS`                             | Proxy API, proxy chatbot và thời hạn cookie                                |

Các endpoint và lệnh kiểm tra local quan trọng:

| Mục kiểm tra           | Cách kiểm tra                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Frontend               | `npm install`, `npm run dev`, mở `http://localhost:3000`                                                    |
| Backend/data/AI stack  | `make dev`, kiểm tra backend tại `http://localhost:8080/health`                                             |
| Swagger UI             | `make swagger`, mở `http://localhost:8080/swagger/index.html`                                               |
| AI service riêng       | `poetry run uvicorn app.main:app --reload --port 8090`, kiểm tra `http://localhost:8090/health` và `/ready` |
| PostgreSQL             | `make db-up`, `make db-shell`, hoặc `pg_isready` trong container                                            |
| Redis                  | `make redis-up`, `docker-compose exec -T redis redis-cli ping`                                              |
| Neo4j                  | `make neo4j-up`, mở `http://localhost:7474`, user `neo4j`, password `conferencespace`                       |
| Trạng thái stack local | `make status`, `docker-compose ps`, `docker-compose logs -f`                                                |

Điểm cần nhấn mạnh là môi trường phát triển cục bộ không chỉ phục vụ chạy giao diện. Nó là nơi kiểm tra toàn bộ contract vận hành: migration PostgreSQL, schema AI bằng Alembic, graph COI trên Neo4j, cache/session bằng Redis, proxy API của frontend và token service-to-service giữa backend và AI service.

### 3.6.2. Kiến trúc triển khai production

ConferenceSpace được đóng gói thành các service độc lập: Caddy gateway, Next.js web, Go backend, backend migration job, FastAPI AI service, PostgreSQL, Redis và Neo4j. Cách triển khai này giúp nhóm chứng minh hệ thống không chỉ chạy ở môi trường development mà có thể vận hành như một stack thực tế.

Môi trường production được triển khai trên VPS chạy Ubuntu Server 22.04 LTS hoặc mới hơn. Cấu hình tối thiểu được đặt ở mức 2 vCPU, 4 GB RAM và tối thiểu 30 GB dung lượng lưu trữ để có đủ khoảng trống cho image, volume dữ liệu, log và các lần cập nhật qua deployment pipeline. Với khối lượng sử dụng cao hơn, cấu hình 4 vCPU và 8 GB RAM trở lên phù hợp hơn vì stack chạy đồng thời PostgreSQL, Redis, Neo4j, backend, AI service, Next.js và Caddy.

**Hình 3.30. Topology triển khai production**

```mermaid
flowchart LR
    Internet["Internet"] --> Caddy["Caddy gateway"]

    subgraph App["Docker network: app"]
        Caddy
        Web["web: Next.js"]
        BE["backend: Go API"]
        AI["ai-service: FastAPI"]
    end

    subgraph Data["Docker network: data internal"]
        PG["postgres"]
        Redis["redis"]
        Neo["neo4j"]
    end

    Caddy --> Web
    Caddy --> BE
    Web --> BE
    BE --> AI
    BE --> PG
    BE --> Neo
    AI --> Redis
    AI --> PG
```

Network `app` phục vụ giao tiếp giữa các service ứng dụng, còn network `data` được cấu hình `internal: true` để giới hạn truy cập vào cơ sở dữ liệu và cache. Thiết kế này phù hợp với yêu cầu bảo mật bản thảo và dữ liệu phản biện: các thành phần dữ liệu không được expose trực tiếp ra Internet.

### 3.6.3. Docker Compose và container images

Cấu hình Docker Compose production khai báo service, image, environment, volume, healthcheck, network và restart policy. Các cấu hình dưới đây được giữ trong báo cáo vì chúng thể hiện ranh giới runtime của từng service và cách production tái sử dụng artifact đã build từ CI/CD. Ba service ứng dụng `web`, `backend` và `ai-service` dùng image được build từ GitHub Actions và truyền vào qua biến môi trường:

```yaml
web:
  image: ${FRONTEND_IMAGE}
backend:
  image: ${BACKEND_IMAGE}
ai-service:
  image: ${AI_SERVICE_IMAGE}
```

Các image này được build và push lên GitHub Container Registry theo format:

```text
ghcr.io/<owner>/conferencespace-frontend:<GITHUB_SHA>
ghcr.io/<owner>/conferencespace-backend:<GITHUB_SHA>
ghcr.io/<owner>/conferencespace-ai-service:<GITHUB_SHA>
```

Ba Dockerfile tương ứng xác định đúng runtime của từng service:

| Image                        | Dockerfile              | Nội dung chính                                                                                                                              |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `conferencespace-frontend`   | `frontend/Dockerfile`   | Multi-stage Node 22 Alpine; build Next.js với `NEXT_PUBLIC_API_BASE_URL=/api/backend`; runtime chạy `pnpm start` ở cổng 3000                |
| `conferencespace-backend`    | `backend/Dockerfile`    | Multi-stage Go 1.24 Alpine; sinh Swagger docs, build binary Linux tĩnh, copy migrations và `migrate` CLI; runtime expose cổng 8080          |
| `conferencespace-ai-service` | `ai-service/Dockerfile` | Python 3.12 slim; cài `libmagic1`, Poetry và dependency production; khi chạy thực hiện `alembic upgrade head` rồi start Uvicorn ở cổng 8090 |

Các đoạn cấu hình image cốt lõi:

```dockerfile
# frontend/Dockerfile
FROM node:22-alpine AS deps
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
ARG NEXT_PUBLIC_API_BASE_URL=/api/backend
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["pnpm", "start"]
```

```dockerfile
# backend/Dockerfile
FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
RUN go run github.com/swaggo/swag/cmd/swag@latest init -g cmd/server/main.go -o ./docs
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/main .
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /go/bin/migrate /usr/local/bin/migrate
EXPOSE 8080
CMD ["./main"]
```

```dockerfile
# ai-service/Dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir poetry==1.8.5
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root --only main
EXPOSE 8090
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8090"]
```

Đây là điểm quan trọng về khả năng tái lập. Mỗi lần deploy production không build trực tiếp trên server mà kéo đúng image đã build trong pipeline, sau đó chạy migration và cập nhật stack bằng Docker Compose. Nhờ đó, server production chỉ cần Docker Engine, Docker Compose plugin, file `.env.production` và quyền pull GHCR; logic build nằm trong CI/CD.

### 3.6.4. Cấu hình server và biến môi trường

Runtime configuration được tách khỏi mã nguồn bằng `.env.production` trên server. Phần biến môi trường được trình bày theo nhóm để làm rõ ranh giới cấu hình giữa public URL, database, graph, AI service, provider bên ngoài và service token; đây là điều kiện để triển khai lại hệ thống mà không sửa mã nguồn. GitHub Actions chỉ cập nhật ba biến image (`FRONTEND_IMAGE`, `BACKEND_IMAGE`, `AI_SERVICE_IMAGE`) và yêu cầu file `.env.production` đã tồn tại trước khi deploy. Cách này giúp secret thật không đi vào repository.

Các nhóm biến chính gồm:

- **Public URL và CORS**: domain public, origin được phép, base URL cho frontend/backend.
- **PostgreSQL**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
- **Neo4j**: `NEO4J_USERNAME`, `NEO4J_PASSWORD`, heap/pagecache.
- **AI service**: `REDIS_URL`, `POSTGRES_DSN`, `BACKEND_API_BASE_URL`, timeout, model provider.
- **LLM provider**: `OPENROUTER_API_KEY`, `AGENT_MODEL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`.
- **Service token**: token cho admin và agent service-to-service.

Mọi secret phải được cấu hình ở server hoặc GitHub Secrets. Báo cáo chỉ trình bày tên biến và vai trò, không đưa giá trị thật.

### 3.6.5. Reverse proxy, HTTPS và routing

Caddy đóng vai trò gateway nhận lưu lượng từ Internet và định tuyến vào các service nội bộ. Trình duyệt không truy cập trực tiếp backend, AI service, PostgreSQL, Redis hoặc Neo4j. WebSocket notification được định tuyến riêng về backend, còn giao diện web được định tuyến về Next.js.

Cấu hình Caddy production hiện tại:

```caddyfile
conference-space.com, www.conference-space.com {
    encode zstd gzip
    reverse_proxy /ws/* backend:8080
    reverse_proxy web:3000
}
```

Đoạn cấu hình trên là anchor quan trọng của kiến trúc triển khai: mọi truy cập công khai đi qua gateway, còn service nội bộ chỉ giao tiếp trong Docker network. Caddy đồng thời xử lý nén nội dung và Automatic HTTPS [19], giúp giảm phần cấu hình vận hành thủ công so với mô hình reverse proxy cộng Certbot riêng.

### 3.6.6. CI/CD, GitHub Actions và GHCR

Quy trình `.github/workflows/deploy.yml` được trình bày để chứng minh deployment không phụ thuộc vào thao tác build thủ công trên server. Pipeline tạo image bất biến theo commit SHA, đẩy lên GHCR, rồi yêu cầu VPS chỉ pull image, chạy migration và cập nhật container. Quy trình có hai nhóm bước chính:

1. Build và push các image của từng module lên GHCR song song: frontend, backend và AI service.
2. SSH vào VPS, cập nhật `.env.production`, pull image, chạy migration và `docker compose up -d`.

**Hình 3.31. Luồng CI/CD production**

```mermaid
flowchart TD
    A["Push / workflow_dispatch"] --> B["Build frontend image"]
    A --> C["Build backend image"]
    A --> D["Build AI service image"]
    B --> E["Push GHCR"]
    C --> E
    D --> E
    E --> F["Copy compose, Caddyfile, bootstrap to VPS"]
    F --> G["Set FRONTEND_IMAGE / BACKEND_IMAGE / AI_SERVICE_IMAGE"]
    G --> H["docker compose pull"]
    H --> I["Run backend migration"]
    I --> J["docker compose up -d --remove-orphans"]
```

Các đoạn cấu hình quan trọng của GitHub Actions thể hiện rõ cách image được đặt tên, build và deploy. Mỗi build job đăng nhập GHCR bằng `GHCR_TOKEN`, đặt image theo owner repository và commit SHA, đồng thời push thêm tag `latest`:

```yaml
env:
  REGISTRY: ghcr.io

- name: Set image names
  id: images
  run: |
    image_prefix="ghcr.io/${GITHUB_REPOSITORY_OWNER,,}/conferencespace"
    echo "prefix=${image_prefix}" >> "$GITHUB_OUTPUT"
    echo "image=${image_prefix}-frontend:${GITHUB_SHA}" >> "$GITHUB_OUTPUT"

- name: Build and push frontend
  id: build
  uses: docker/build-push-action@v6
  with:
    context: ./frontend
    file: ./frontend/Dockerfile
    build-args: |
      NEXT_PUBLIC_API_BASE_URL=/api/backend
    push: true
    tags: |
      ${{ steps.images.outputs.image }}
      ${{ steps.images.outputs.prefix }}-frontend:latest
```

Backend và AI service dùng cùng mẫu cấu hình, chỉ khác `context`, `file` và hậu tố image:

```yaml
backend:
  context: ./backend
  file: ./backend/Dockerfile
  image: ghcr.io/<owner>/conferencespace-backend:<GITHUB_SHA>

ai-service:
  context: ./ai-service
  file: ./ai-service/Dockerfile
  image: ghcr.io/<owner>/conferencespace-ai-service:<GITHUB_SHA>
```

Sau khi ba image được build xong, job `deploy` copy các file triển khai lên `/opt/conferencespace`:

```yaml
- name: Prepare deployment files
  run: |
    mkdir -p deploy
    cp deployment/docker-compose.prod.yml deploy/docker-compose.prod.yml
    cp deployment/Caddyfile deploy/Caddyfile
    cp deployment/bootstrap.sh deploy/bootstrap.sh
```

Trên VPS, workflow cập nhật ba biến image trong `.env.production`, đăng nhập GHCR, pull image, chạy migration bằng service `backend-migrate`, rồi khởi động stack:

```sh
chmod 600 .env.production
set_env FRONTEND_IMAGE "${FRONTEND_IMAGE}"
set_env BACKEND_IMAGE "${BACKEND_IMAGE}"
set_env AI_SERVICE_IMAGE "${AI_SERVICE_IMAGE}"

echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend-migrate
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --remove-orphans
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Luồng triển khai đầy đủ vì vậy gồm sáu bước: commit vào `main` hoặc chạy thủ công workflow; GitHub Actions build ba image độc lập; GHCR lưu image theo commit SHA và `latest`; deploy job chuyển compose/Caddy/bootstrap lên server; server cập nhật `.env.production` để trỏ tới đúng image mới; Docker Compose pull, migrate và thay container đang chạy. Cuối workflow, script so sánh image cũ và image hiện tại của `web`, `backend`, `ai-service` để xóa các image ứng dụng không còn dùng, giúp giảm sử dụng dung lượng không cần thiết trên VPS.

### 3.6.7. Network isolation, volume và bảo mật secret

Production Compose tách network `app` và `data`; network `data` được khai báo `internal: true`. PostgreSQL và Redis chỉ nằm trên network dữ liệu. Backend và AI service nằm trên cả `app` và `data` để vừa nhận request nội bộ, vừa truy cập database/cache. Neo4j nằm trên `app` và `data` trong cấu hình hiện tại để hỗ trợ các kết nối nội bộ cần thiết, nhưng không expose port trực tiếp ra Internet. Caddy chỉ nằm ở network ứng dụng và expose cổng 80/443.

Đoạn cấu hình network và volume chính trong `deployment/docker-compose.prod.yml`:

```yaml
volumes:
  caddy_data:
  caddy_config:
  postgres_data:
  redis_data:
  neo4j_data:
  neo4j_logs:
  neo4j_plugins:
  uploads_data:

networks:
  app:
    driver: bridge
  data:
    driver: bridge
    internal: true
```

Các volume bền vững gồm `postgres_data`, `redis_data`, `neo4j_data`, `neo4j_logs`, `neo4j_plugins`, `uploads_data`, `caddy_data` và `caddy_config`. Việc tách volume giúp dữ liệu không mất khi container được tái tạo trong quá trình deploy.

Secret không được đưa vào image, Dockerfile hoặc báo cáo. File `.env.production` trên server được đặt quyền `600` trong pipeline deploy. Đây là mức bảo vệ cơ bản nhưng cần thiết cho một hệ thống có dữ liệu bản thảo, thông tin phản biện và token gọi model bên ngoài.

---

## 3.7. Tổng kết chương

Chương 3 đã trình bày ConferenceSpace như một hệ thống có ranh giới trách nhiệm rõ ràng giữa nghiệp vụ hội nghị, thuật toán xác định, AI hỗ trợ và hạ tầng triển khai. Use case được dùng để mô tả vòng đời chính của tác giả, reviewer và Chair; phần kỹ thuật sau đó giải thích cách các vòng đời này được hiện thực hóa bằng frontend theo vai trò, backend có phân quyền, dữ liệu quan hệ, graph COI, cache, AI service và gateway production.

Trọng tâm thiết kế của chương là tách các quyết định cần tính xác định khỏi các workflow sinh ngôn ngữ. Reviewer matching và COI được mô tả như cơ chế thuật toán có đầu vào, công thức, ràng buộc cứng và failure cases; AI service chỉ hỗ trợ nhập liệu, đọc, kiểm tra bản nháp và tổng hợp evidence. Các giới hạn triển khai như visibility nhiều tầng trong Discussion, camera-ready gate và hậu kiểm claim-evidence cho Review Quality Auditor được nêu như phạm vi còn cần đánh giá hoặc phát triển tiếp, không được trình bày như năng lực đã hoàn thiện.

Các claim thiết kế chính của chương được nối với bằng chứng đánh giá ở Chương 4 như sau:

| Claim thiết kế ở Chương 3 | Thành phần hiện thực hóa | Bằng chứng cần đối chiếu ở Chương 4 |
|---|---|---|
| Hệ thống đáp ứng vòng đời chính của hội nghị học thuật | Use case, frontend theo vai trò, backend API và state machine | Kiểm thử chức năng, UAT và luồng nghiệp vụ end-to-end |
| Reviewer matching có thể giải thích và không phụ thuộc vào AI sinh ngôn ngữ | Domain Jaccard, greedy assignment, tie-break theo tải và proposal để Chair xác nhận | Đánh giá thuật toán, ví dụ phân công, failure cases và mức độ chấp nhận của Chair |
| COI là ràng buộc cứng trong phân công | Self-author detector, declared conflict và co-author graph detector | Kiểm thử COI, dữ liệu graph và các trường hợp bị chặn đúng |
| AI hỗ trợ nhưng không thay người dùng ra quyết định học thuật | Artifact schema, fingerprint, stale state, human review và bảng kiểm soát workflow AI | Đánh giá output AI, phân tích lỗi, độ trễ, chi phí và khảo sát người dùng |
| Chatbot Agent không phá vỡ phân quyền dữ liệu | Backend query endpoint, service token, resource registry và RBAC theo tài nguyên | Kiểm thử quyền truy cập, truy vấn hợp lệ/không hợp lệ và log tool call |
| Production deployment có thể tái lập | Docker Compose, image GHCR theo commit SHA, Caddy, network isolation và CI/CD | Kết quả deploy, healthcheck, migration, quan sát runtime và giới hạn vận hành |

Nhờ cách tách lớp này, Chương 4 có thể đánh giá từng nhóm claim theo đúng bản chất của nó: hệ thống và backend được đánh giá bằng tính đúng, hiệu năng và độ ổn định; thuật toán xác định được đánh giá bằng khả năng giải thích và xử lý trường hợp biên; workflow AI được đánh giá bằng chất lượng output hỗ trợ, rủi ro lỗi và mức độ hữu ích đối với người dùng.

---

## Tài liệu tham khảo

[1] Next.js, "App Router," Available: https://nextjs.org/docs/app

[2] Next.js, "Server and Client Components," Available: https://nextjs.org/docs/app/getting-started/server-and-client-components

[3] React, "React Documentation," Available: https://react.dev/

[4] Radix UI, "Primitives Overview," Available: https://www.radix-ui.com/primitives/docs/overview/introduction

[5] Tailwind CSS, "Documentation," Available: https://tailwindcss.com/docs

[6] Go, "Documentation," Available: https://go.dev/doc/

[7] Gin Web Framework, "Documentation," Available: https://gin-gonic.com/en/docs/

[8] PostgreSQL, "JSON Types," Available: https://www.postgresql.org/docs/current/datatype-json.html

[9] Neo4j, "Variable-length paths," Available: https://neo4j.com/docs/cypher-manual/current/patterns/variable-length-paths/

[10] Redis, "Redis Documentation," Available: https://redis.io/docs/latest/

[11] Google AI for Developers, "Gemini 3.1 Flash-Lite," Available: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite

[12] FastAPI, "Features," Available: https://fastapi.tiangolo.com/features/

[13] Pydantic, "Models and validation," Available: https://pydantic.dev/docs/validation/latest/concepts/models/

[14] Google AI for Developers, "Gemini API OpenAI compatibility," Available: https://ai.google.dev/gemini-api/docs/openai

[15] OpenRouter, "API reference overview," Available: https://openrouter.ai/docs/api/reference/overview

[16] Semantic Scholar, "Semantic Scholar API," Available: https://www.semanticscholar.org/product/api

[17] Docker, "Docker Compose," Available: https://docs.docker.com/compose/

[18] Docker, "Compose file services reference," Available: https://docs.docker.com/reference/compose-file/services/

[19] Caddy, "Automatic HTTPS," Available: https://caddyserver.com/docs/automatic-https

[20] GitHub Docs, "Workflows," Available: https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows

[21] GitHub Docs, "Working with the Container registry," Available: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry

# Chương 2. Khảo sát nhu cầu, hiện trạng và tổng hợp yêu cầu

Chương 1 đã xác lập vấn đề trung tâm của đề tài: quy trình bình duyệt học thuật (peer review) trong hội nghị khoa học đang chịu áp lực lớn về quy mô, trong khi việc đưa AI vào quy trình học thuật phải được kiểm soát chặt chẽ để không làm suy giảm tính liêm chính, bảo mật và trách nhiệm ra quyết định. Vì vậy, Chương 2 không chỉ khảo sát người dùng và các hệ thống hiện có, mà còn chuyển các quan sát đó thành yêu cầu thiết kế cụ thể cho ConferenceSpace.

Mạch lập luận của chương gồm bốn bước. Mục 2.1 trình bày khảo sát nhu cầu ban đầu của nhóm theo ba vai trò chính: Tác giả, Người phản biện và Chủ tọa. Mục 2.2 đối chiếu các nhu cầu này với các nền tảng quản lý hội nghị đang được sử dụng rộng rãi như EasyChair, HotCRP, OpenReview và Microsoft CMT. Mục 2.3 rút ra các khoảng trống thực tiễn và nguyên tắc giải pháp. Cuối cùng, mục 2.4 tổng hợp thành yêu cầu hệ thống, tạo cầu nối trực tiếp sang thiết kế ở Chương 3 và lựa chọn công nghệ ở Chương 4.

## 2.1. Khảo sát nhu cầu người dùng

### 2.1.1. Mục tiêu khảo sát

Khảo sát nhu cầu được thực hiện nhằm xác định các khó khăn thực tế mà người dùng gặp phải khi tham gia quy trình hội nghị khoa học, đặc biệt trong các thao tác nộp bài, theo dõi trạng thái, phản biện và điều phối hội nghị. Nhóm không xem khảo sát này như một phép đo đại diện cho toàn bộ cộng đồng học thuật, mà như một nguồn dữ liệu định hướng để xác định các vấn đề nổi bật có khả năng ảnh hưởng trực tiếp đến thiết kế sản phẩm.

Khảo sát tập trung vào ba câu hỏi:

- Người dùng đang gặp khó khăn gì khi sử dụng các nền tảng như Google Forms/Excel, EasyChair, Microsoft CMT hoặc OpenReview?
- Những chức năng nào được người dùng kỳ vọng nhất trong một nền tảng quản lý hội nghị mới?
- Người dùng chấp nhận AI ở mức nào, và họ muốn giữ quyền kiểm soát ra sao khi AI tham gia vào quy trình học thuật?

Cách đặt câu hỏi này bám sát ranh giới đã nêu ở Chương 1: AI có thể hỗ trợ nhập liệu, kiểm tra, đọc hiểu và tổng hợp thông tin, nhưng không được thay thế quyết định học thuật của con người.

### 2.1.2. Đối tượng và đặc điểm mẫu khảo sát

Khảo sát thu được 71 phản hồi hợp lệ từ các nhóm đối tượng đang học tập, nghiên cứu hoặc làm việc trong môi trường có liên quan đến hội nghị khoa học. Các nhóm chính gồm sinh viên đại học/học viên cao học, giảng viên/nhà nghiên cứu và người làm trong doanh nghiệp có tham gia hoạt động nghiên cứu.

_![Biểu đồ phân bố đối tượng tham gia khảo sát](link_hinh_anh_google_forms_vao_day)_

Biểu đồ trên được giữ như điểm neo để nhóm bổ sung trực quan hóa phân bố mẫu khảo sát. Khi hoàn thiện báo cáo, hình này nên thể hiện rõ số lượng người tham gia theo vai trò hoặc nhóm nghề nghiệp, vì cách diễn giải kết quả phụ thuộc mạnh vào thành phần mẫu.

Trong phạm vi đề tài, ba nhóm vai trò được quan tâm nhất là:

- **Tác giả (Author):** người nộp bài, cần quy trình nộp bài dễ hiểu, giảm nhập liệu lặp lại, kiểm tra lỗi sớm và theo dõi trạng thái rõ ràng.
- **Người phản biện (Reviewer):** người đọc và đánh giá bài báo, cần truy cập bài được phân công, hiểu nhanh bối cảnh bài viết, viết nhận xét có chất lượng và giữ quyền tự quyết chuyên môn.
- **Chủ tọa hoặc ban tổ chức (Chair):** người cấu hình hội nghị, điều phối bài nộp, phân công phản biện, kiểm soát xung đột lợi ích và tổng hợp bằng chứng trước khi ra quyết định.

Cần lưu ý rằng số lượng phản hồi theo từng vai trò không đồng đều. Một số phân tích theo nhóm nhỏ như Chair hoặc Reviewer chỉ nên được đọc như tín hiệu định hướng, không phải kết luận thống kê đại diện cho toàn bộ cộng đồng học thuật.

### 2.1.3. Phương pháp khảo sát

Khảo sát được thực hiện bằng biểu mẫu trực tuyến. Bộ câu hỏi kết hợp câu hỏi chọn một, chọn nhiều, thang đo Likert 1-5 và câu hỏi mở. Cách thiết kế này cho phép nhóm vừa lượng hóa mức độ phổ biến của các vấn đề nổi bật, vừa thu thập lý do người dùng tin hoặc không tin vào các tính năng AI.

Các nhóm câu hỏi chính gồm:

- Trải nghiệm với các nền tảng hiện có như Google Forms/Excel, EasyChair, Microsoft CMT và OpenReview.
- Các khó khăn thường gặp trong quy trình nộp bài, phản biện và quản lý hội nghị.
- Mức độ hữu ích của các tính năng dự kiến cho từng vai trò.
- Mức độ chấp nhận AI trong các tác vụ như tự động điền thông tin, kiểm tra sơ bộ bài nộp, hỗ trợ đọc bài, rà soát chất lượng phản biện và tổng hợp thông tin cho Chair.

Do khảo sát được triển khai theo mẫu thuận tiện, kết quả được dùng để định hướng thiết kế và ưu tiên tính năng, không dùng để khẳng định xu hướng chung của toàn bộ cộng đồng nghiên cứu. Đây cũng là lý do Chương 2 cần kết hợp dữ liệu khảo sát nội bộ với nguồn bên ngoài về áp lực bình duyệt học thuật và các hệ thống quản lý hội nghị hiện có.

### 2.1.4. Kết quả khảo sát theo vấn đề nổi bật chính

Kết quả khảo sát cho thấy các khó khăn tập trung vào năm nhóm: thiếu chỉ dẫn bước tiếp theo, biểu mẫu nhập liệu dài, phải đọc hướng dẫn dài, thiếu kiểm tra lỗi sớm và thông báo/hạn chót rời rạc.

_![Biểu đồ các vấn đề người dùng gặp phải](link_hinh_anh_google_forms_vao_day)_

Điểm neo hình trên nên được dùng để minh họa phân bố các vấn đề nổi bật chính. Bảng dưới đây giữ các số liệu hiện có trong bản khảo sát của nhóm.

| Vấn đề nổi bật | Số người chọn | Tỷ lệ trên 71 phản hồi | Diễn giải thiết kế |
|---|---:|---:|---|
| Không biết bước tiếp theo cần làm là gì | 35 | 49,3% | Hệ thống cần bảng điều khiển và lời nhắc hành động theo trạng thái, tránh để người dùng tự dò quy trình. |
| Biểu mẫu nhập liệu dài và lặp lại | 34 | 47,9% | Quy trình nộp bài cần hỗ trợ trích xuất siêu dữ liệu từ tệp bài báo và cho phép người dùng chỉnh sửa trước khi gửi. |
| Phải đọc nhiều hướng dẫn dài trước khi thao tác | 33 | 46,5% | Giao diện cần tổ chức theo quy trình từng bước, ngôn ngữ rõ ràng và trợ lý hỗ trợ ngữ cảnh. |
| Không có kiểm tra lỗi sớm trước khi nộp chính thức | 30 | 42,3% | Hệ thống cần kiểm tra sơ bộ trước khi bài nộp đi vào quy trình phản biện chính thức. |
| Thông báo/hạn chót rời rạc dễ bỏ sót | 28 | 39,4% | Cần thông báo trong hệ thống, cập nhật trạng thái tập trung và giảm phụ thuộc hoàn toàn vào email. |

Những số liệu này cho thấy vấn đề người dùng gặp phải không chỉ nằm ở thiếu chức năng nghiệp vụ. Nhiều hệ thống hiện có đã hỗ trợ nộp bài, phản biện và ra quyết định, nhưng trải nghiệm thao tác vẫn nặng, phân tán và khó theo dõi. Vì vậy, yêu cầu của ConferenceSpace không dừng ở việc sao chép nghiệp vụ quản lý hội nghị, mà phải giảm ma sát thao tác ở các điểm chạm lặp lại.

### 2.1.5. Kết quả theo vai trò

#### a) Nhóm Chủ tọa/Ban tổ chức

Trong nhóm phản hồi thuộc vai trò Chair, các tính năng được quan tâm gồm cảnh báo xung đột lợi ích, bảng điều khiển tình trạng hội nghị và hỗ trợ phân công phản biện. Tuy nhiên, số lượng Chair trong mẫu còn nhỏ, nên các tỷ lệ ở nhóm này chỉ nên dùng để xác định hướng ưu tiên ban đầu.

| Tính năng | Kết quả ghi nhận | Diễn giải |
|---|---:|---|
| Cảnh báo Conflict of Interest (COI) | 5/7 Chair đánh giá cao | Chair cần cơ chế cảnh báo sớm để tránh phân công sai người, nhưng kết quả cuối cùng vẫn cần người có thẩm quyền xác nhận. |
| Bảng điều khiển tóm tắt tình trạng hội nghị | 4/7 Chair đánh giá cao | Nhu cầu chính là giảm tải theo dõi thủ công qua nhiều bảng, email và trang trạng thái rời rạc. |
| Gợi ý phản biện theo chuyên môn | 2/7 Chair đánh giá cao | Tín hiệu này cho thấy Chair có thể thận trọng với tự động hóa phân công phản biện; vì vậy hệ thống nên trình bày gợi ý như danh sách có điểm số và lý do, không như quyết định tự động. |

Điểm cần nhấn mạnh là ghép phản biện trong ConferenceSpace thuộc lớp thuật toán xác định, không phải một luồng AI tạo sinh. Chair cần thấy lý do hệ thống xếp hạng phản biện, phát hiện COI nào đang chặn phân công, và có quyền ghi đè khi có căn cứ nghiệp vụ.

#### b) Nhóm Tác giả

Với vai trò tác giả, phản hồi nổi bật nhất là nhu cầu giảm nhập liệu trong quy trình nộp bài. Lựa chọn phổ biến đối với tính năng Autofill là "tự điền và cho phép tôi sửa nhanh những mục sai" với 21 ý kiến. Điều này cho thấy người dùng không muốn hệ thống tự gửi thay họ, mà muốn AI thực hiện phần thao tác lặp lại và giữ lại bước xác nhận của con người.

| Tính năng | Kết quả ghi nhận | Diễn giải |
|---|---|---|
| Tự động điền thông tin bài nộp | Lựa chọn phổ biến nhất là tự điền nhưng cho phép sửa | Submission Autofill nên sinh dữ liệu nháp, hiển thị trường đã trích xuất và cho phép tác giả chỉnh sửa. |
| Kiểm tra format trước khi nộp | Được đánh giá hữu ích | Submission Gating nên cảnh báo lỗi sớm, nhưng không được biến thành cơ chế loại bài tự động nếu chưa có chính sách rõ ràng. |

Từ góc nhìn thiết kế, đây là nhóm tính năng có tác động trực tiếp nhất đến điểm chạm đầu tiên của tác giả với hệ thống. Một quy trình nộp bài tốt phải giúp người dùng nộp đúng, hiểu rõ trạng thái và sửa lỗi trước hạn chót.

#### c) Nhóm Người phản biện

_![Biểu đồ mức độ ủng hộ AI của Reviewer](link_hinh_anh_google_forms_vao_day)_

Điểm neo hình trên nên thể hiện mức độ chấp nhận AI theo từng tác vụ của người phản biện. Trong dữ liệu hiện có, 6/11 người phản biện đánh giá cao tính năng AI tạo bản tóm tắt trung lập, trong khi chỉ 3/11 đánh giá cao việc AI làm nổi bật điểm cần kiểm tra kỹ.

| Tính năng | Kết quả ghi nhận | Diễn giải |
|---|---:|---|
| Tóm tắt trung lập bài báo | 6/11 người phản biện đánh giá cao | AI có thể giúp người phản biện nắm bối cảnh ban đầu, nhưng bản tóm tắt không thay thế việc đọc bài. |
| Làm nổi bật điểm cần kiểm tra kỹ | 3/11 người phản biện đánh giá cao | Người phản biện thận trọng với việc AI định hướng đánh giá học thuật; đầu ra nên là gợi ý kiểm tra, không phải kết luận chuyên môn. |

Kết quả này phù hợp với các chính sách gần đây của những hội nghị lớn: AI có thể hỗ trợ người phản biện trong điều kiện có kiểm soát, nhưng người phản biện vẫn chịu trách nhiệm cuối cùng về nội dung phản biện, bảo mật bản thảo và tính trung thực của đánh giá [15][16].

Do đó, luận điểm phù hợp cho nhóm người phản biện không phải là hệ thống thay con người đọc và đánh giá bài báo, mà là AI hỗ trợ người phản biện đọc có định hướng hơn. Bản tóm tắt trung lập và danh sách điểm cần kiểm tra có thể giảm phần ghi chú, đối chiếu và rà soát thủ công lặp lại, giúp người phản biện tập trung hơn vào các phần quan trọng của bài báo. Tuy nhiên, đây chỉ là hỗ trợ định hướng: người phản biện vẫn phải đọc bài, kiểm tra lại các điểm AI nêu ra và chịu trách nhiệm cuối cùng về nhận xét học thuật.

### 2.1.6. Diễn giải kết quả và giới hạn khảo sát

Tổng hợp các phản hồi cho thấy bốn nhu cầu nền tảng:

1. **Giảm thao tác thủ công:** người dùng muốn hệ thống xử lý phần nhập liệu và kiểm tra lặp lại, đặc biệt ở bước nộp bài.
2. **Giảm tải nhận thức:** người dùng cần biết trạng thái hiện tại, việc tiếp theo cần làm và hạn chót liên quan mà không phải tự dò nhiều trang hoặc email.
3. **Tăng kiểm soát rủi ro:** Chair cần hỗ trợ phát hiện COI và theo dõi tiến độ phản biện; tác giả cần phát hiện lỗi trước khi gửi chính thức.
4. **AI phải minh bạch và có thể ghi đè:** người dùng chấp nhận AI khi AI đóng vai trò hỗ trợ, có căn cứ và cho phép con người kiểm tra lại.

Những kết luận này cần được đọc cùng ba giới hạn. Thứ nhất, khảo sát dùng mẫu thuận tiện với 71 phản hồi, nên không đủ để đại diện cho toàn bộ cộng đồng học thuật. Thứ hai, các nhóm Chair và Reviewer có kích thước nhỏ, do đó phân tích theo vai trò chỉ mang tính định hướng. Thứ ba, khảo sát này đo nhu cầu trước khi sử dụng hệ thống, khác với khảo sát UAT sau khi trải nghiệm sản phẩm được trình bày ở Chương 5.

## 2.2. Khảo sát hiện trạng các hệ thống quản lý hội nghị

### 2.2.1. Tiêu chí lựa chọn hệ thống đối sánh

Nhóm lựa chọn bốn nền tảng chính để khảo sát: EasyChair, HotCRP, OpenReview và Microsoft CMT. Đây là các hệ thống có liên quan trực tiếp đến vòng đời nộp bài, phản biện và ra quyết định của hội nghị khoa học, đồng thời được cộng đồng học thuật sử dụng hoặc tham chiếu rộng rãi. Các công cụ như WikiCFP, CORE/ICORE hoặc ConfHub có giá trị trong việc tìm kiếm hội nghị, nhưng không phải hệ thống quản lý peer review đầy đủ, nên chỉ nên xem như công cụ phụ trợ thay vì đối thủ trực tiếp của ConferenceSpace.

Tiêu chí lựa chọn gồm:

- Bao phủ các bước chính của vòng đời hội nghị: tạo hội nghị, nộp bài, phản biện, phản hồi của tác giả và ra quyết định.
- Hỗ trợ các vai trò Author, Reviewer và Chair ở mức khác nhau.
- Đại diện cho nhiều mô hình vận hành: dịch vụ được quản lý, hệ thống tự triển khai, phản biện mở và bộ công cụ cho hội nghị quy mô lớn.
- Có tài liệu công khai đủ rõ để đối chiếu tính năng.

### 2.2.2. Tổng quan các hệ thống hiện có

#### a) EasyChair

EasyChair là một hệ thống quản lý hội nghị có độ phủ rất lớn. Trang chính thức của EasyChair công bố hơn 4,8 triệu người dùng và hơn 124.000 hội nghị đã sử dụng nền tảng này [1]. Hệ thống hỗ trợ nhiều thành phần của vòng đời hội nghị, bao gồm nộp bài, quản lý phản biện, quản lý quyền truy cập, xung đột lợi ích, phân công phản biện theo ưu tiên, phản biện, phản hồi của tác giả, email, phân tích dữ liệu và proceedings [2].

Điểm mạnh của EasyChair nằm ở độ hoàn thiện nghiệp vụ và mức độ quen thuộc trong cộng đồng. Tuy nhiên, từ góc nhìn nhu cầu khảo sát, vấn đề còn lại là trải nghiệm thao tác: tác giả vẫn phải đi qua nhiều biểu mẫu, Chair phải cấu hình nhiều bước, và hệ thống chưa cung cấp một lớp trợ lý tích hợp để giảm nhập liệu hoặc hướng dẫn người dùng theo ngữ cảnh. Vì vậy, không nên mô tả EasyChair là "thiếu nghiệp vụ"; khoảng trống chính là mức độ hỗ trợ thông minh và trải nghiệm hiện đại.

#### b) HotCRP

HotCRP là hệ thống mạnh cho quy trình phản biện và điều phối của Chair. Tài liệu HotCRP cho thấy hệ thống hỗ trợ phân công bài, ưu tiên phản biện, xung đột lợi ích, thẻ phân loại, quyết định, vai trò lead/shepherd, tự động phân công và chạy thử để kiểm tra phân công trước khi áp dụng [3]. Tài liệu Chair guide cũng nêu cơ chế xử lý xung đột của Chair, quản trị viên theo bài và review token để hạn chế quyền truy cập khi có xung đột [4].

Điều này cho thấy HotCRP phù hợp với các hội nghị có đội ngũ kỹ thuật và quy trình phản biện chặt chẽ. Tuy nhiên, hệ thống thiên về người dùng có kinh nghiệm, trong khi khảo sát của nhóm cho thấy một vấn đề nổi bật lớn là người dùng mới không biết bước tiếp theo và phải đọc nhiều hướng dẫn. Vì vậy, ConferenceSpace cần học từ HotCRP ở độ nghiêm ngặt của phân công phản biện và kiểm soát xung đột, nhưng tổ chức trải nghiệm theo hướng dễ tiếp cận hơn.

#### c) OpenReview

OpenReview đại diện cho mô hình phản biện mở và thảo luận mở. Trang giới thiệu chính thức mô tả OpenReview như một nền tảng trên cloud có database API, hỗ trợ nhiều mức độ công khai khác nhau, thảo luận mở, thư mục mở chứa thông tin COI và ghép bài với phản biện cho hội nghị có hàng nghìn bài nộp [5].

Điểm mạnh của OpenReview là tính minh bạch, khả năng cấu hình chính sách phản biện và hệ sinh thái dữ liệu mở phục vụ nghiên cứu về peer review. Tuy nhiên, mô hình phản biện mở không phù hợp với mọi hội nghị, đặc biệt các hội nghị cần quy trình double-blind hoặc chính sách bảo mật chặt. Đối với ConferenceSpace, bài học quan trọng từ OpenReview không phải là phải mở toàn bộ quy trình, mà là cần thiết kế dữ liệu, quyền truy cập và API đủ rõ để hỗ trợ minh bạch có kiểm soát.

#### d) Microsoft CMT

Microsoft CMT hỗ trợ nhiều vai trò, nhiều track, toàn bộ vòng đời nộp bài, biểu mẫu tùy chỉnh, quản lý xung đột, bidding, gợi ý phản biện, thảo luận, phản hồi của tác giả và phân công tích hợp với TPMS [6]. Tài liệu CMT về quản lý xung đột nêu hai cơ chế chính: xung đột theo cá nhân và xung đột theo domain; các xung đột này được xét trong quá trình phân công [7]. Tài liệu TPMS cho biết điểm TPMS nằm trong khoảng 0-1, điểm cao hơn thể hiện mức phù hợp tốt hơn giữa bài báo và người phản biện [8].

CMT là hệ đối sánh quan trọng cho bài toán hội nghị quy mô lớn. Tuy nhiên, ghép phản biện qua TPMS vẫn cần được diễn giải như một hệ thống chấm điểm/xếp hạng có ràng buộc, không phải một quyết định tự động. ConferenceSpace kế thừa tinh thần này bằng cách đặt ghép phản biện trong lớp thuật toán xác định, kết hợp điểm phù hợp chuyên môn với kiểm tra COI và quyền xác nhận của Chair.

### 2.2.3. So sánh theo luồng nghiệp vụ và mức hỗ trợ người dùng

Bảng dưới đây không dùng nhị phân "có/không" tuyệt đối, mà dùng mức hỗ trợ tương đối dựa trên tài liệu công khai và phạm vi khảo sát của nhóm.

| Tiêu chí | EasyChair | HotCRP | OpenReview | Microsoft CMT | Định hướng ConferenceSpace |
|---|---|---|---|---|---|
| Vòng đời nộp bài và phản biện | Mạnh | Mạnh ở phản biện | Mạnh, đặc biệt ở phản biện mở | Mạnh | Đầy đủ nghiệp vụ lõi, tối ưu trải nghiệm theo vai trò |
| Phân công phản biện | Theo ưu tiên | Tự động phân công, ưu tiên và xung đột | Ghép theo chuyên môn, bidding và ràng buộc | Thủ công/tự động, TPMS | Thuật toán xác định, có điểm số, lý do và ràng buộc COI |
| Quản lý COI | Có cơ chế quản lý xung đột | Có cơ chế xung đột và quản trị viên theo bài | Có thư mục mở và thông tin COI | Xung đột theo cá nhân/domain, có hỗ trợ từ DBLP | COI đa tầng: tự kiểm tra, khai báo, đồ thị đồng tác giả |
| Hỗ trợ tác giả khi nộp bài | Có biểu mẫu nộp bài | Không phải trọng tâm chính | Có nộp bài và thảo luận | Có toàn bộ vòng đời nộp bài | Autofill siêu dữ liệu, kiểm tra sơ bộ, quy trình từng bước, xác nhận trước khi gửi |
| Hỗ trợ reviewer đọc bài | Biểu mẫu phản biện và thảo luận | Mạnh về luồng phản biện | Phản biện/thảo luận công khai tùy chính sách | Vòng đời phản biện | Tóm tắt trung lập và điểm cần kiểm tra, không thay thế phản biện |
| Hỗ trợ Chair tổng hợp bằng chứng | Có theo dõi, email và phân tích dữ liệu | Có tìm kiếm, phân công và thảo luận | Có thảo luận và dữ liệu mở | Có bảng điều khiển/luồng xử lý | Bảng điều khiển, rà soát chất lượng phản biện, tổng hợp đồng thuận/bất đồng |
| AI/LLM tích hợp xuyên vai trò | Không ghi nhận như năng lực lõi công khai trong phạm vi khảo sát | Không ghi nhận như năng lực lõi công khai trong phạm vi khảo sát | Có thảo luận/chính sách/thử nghiệm AI trong hệ sinh thái ICLR/OpenReview | Tích hợp TPMS, không phải AI tạo sinh | AI hỗ trợ có kiểm soát cho Autofill, kiểm tra sơ bộ, hỗ trợ reviewer và tổng hợp cho Chair |

So sánh này cho thấy ConferenceSpace không cần chứng minh rằng các hệ thống hiện tại "thiếu toàn bộ chức năng". Ngược lại, các hệ thống hiện có đã làm tốt phần nghiệp vụ nền. Khoảng trống mà ConferenceSpace nhắm đến nằm ở lớp trải nghiệm và hỗ trợ có kiểm soát: giảm nhập liệu, cảnh báo rủi ro, hỗ trợ đọc hiểu, tổng hợp bằng chứng và giữ quyền quyết định cho con người.

### 2.2.4. Bối cảnh quá tải peer review

Kết quả khảo sát của nhóm phù hợp với bối cảnh quốc tế rộng hơn. NeurIPS 2025 ghi nhận số submissions tăng từ 9.467 năm 2020 lên 21.575 năm 2025, đồng thời phải huy động 20.518 reviewers, 1.663 area chairs và 199 senior area chairs [9]. ICLR 2026 cũng ghi nhận 19.525 valid submissions, 76.139 reviews và 18.054 reviewers [10]. Các nghiên cứu tổng quan về peer review cũng chỉ ra những thách thức lặp lại như chênh lệch chuyên môn giữa bài nộp và phản biện, chất lượng nhận xét không đồng đều, thiên lệch tiềm ẩn và khó khăn khi mở rộng quy mô cộng đồng phản biện [14].

Các số liệu này chứng minh rằng nhu cầu hỗ trợ Chair và Reviewer không phải là vấn đề cục bộ của khảo sát nhóm. Khi quy mô tăng, hệ thống quản lý hội nghị phải hỗ trợ điều phối, kiểm soát chất lượng, phát hiện rủi ro và giảm tải thao tác tốt hơn. Đây là tiền đề để mục 2.3 phân tích khoảng trống thiết kế của ConferenceSpace.

## 2.3. Khoảng trống thực tiễn và nguyên tắc giải pháp

### 2.3.1. Hạn chế của các hệ thống hiện tại

Từ khảo sát người dùng và đối chiếu hệ thống hiện có, nhóm rút ra bốn khoảng trống chính.

**Thứ nhất, quy trình nộp bài vẫn còn nhiều thao tác thủ công.** Gần một nửa mẫu khảo sát chọn "biểu mẫu nhập liệu dài và lặp lại" là vấn đề nổi bật. Trong khi đó, các hệ thống hiện có chủ yếu cung cấp biểu mẫu linh hoạt, chưa tập trung vào việc đọc bản thảo để tạo siêu dữ liệu nháp cho tác giả. Đây là cơ sở cho Submission Autofill và kiểm tra sơ bộ trước khi gửi.

**Thứ hai, ghép phản biện cần minh bạch và có ràng buộc COI.** TPMS đã cho thấy phân công phản biện có thể được hỗ trợ bằng chấm điểm/xếp hạng, nhưng đây vẫn là bài toán có nhiều ràng buộc như tải phản biện, xung đột lợi ích, chuyên môn theo lĩnh vực và quyết định của Chair [8][11]. Vì vậy, ConferenceSpace không dùng LLM để quyết định người phản biện. Hệ thống cần thuật toán có thể giải thích, điểm phù hợp có thể kiểm tra và cơ chế COI rõ ràng.

**Thứ ba, COI không thể chỉ dựa vào tự khai báo.** ACM nhấn mạnh một chính sách COI đáng tin cậy không thể chỉ dựa trên việc cá nhân tự xác định xung đột, vì xung đột có thể tạo ra nghi ngờ về tính khách quan ngay cả khi người liên quan tin rằng mình công bằng [12]. Đây là cơ sở để ConferenceSpace kết hợp khai báo thủ công với kiểm tra quan hệ học thuật bằng dữ liệu bên ngoài và đồ thị đồng tác giả.

**Thứ tư, AI trong bình duyệt học thuật cần cơ chế kiểm soát.** Các hội nghị lớn đang phản ứng thận trọng với LLM. ICLR 2026 yêu cầu khai báo khi dùng LLM và nhấn mạnh người tham gia chịu trách nhiệm cuối cùng với nội dung của mình [15]. ICML 2025 thậm chí cấm người phản biện dùng AI tạo sinh để viết phản biện hoặc đưa nội dung bài nộp/phản biện vào công cụ AI [16]. Mặt khác, nghiên cứu Review Feedback Agent tại ICLR 2025 cho thấy phản hồi từ LLM có thể giúp cải thiện tính cụ thể và tính xây dựng của bài phản biện khi AI chỉ phản hồi trên bản phản biện của con người, không thay người phản biện viết phản biện [17][18].

Như vậy, khoảng trống không phải là "có nên dùng AI hay không", mà là dùng AI ở đâu, với dữ liệu nào, có cơ chế kiểm soát nào và ai chịu trách nhiệm cuối cùng.

### 2.3.2. Liên kết khoảng trống với giải pháp ConferenceSpace

ConferenceSpace được thiết kế như một phản hồi trực tiếp với bốn khoảng trống trên. Bảng sau thể hiện mối liên hệ giữa vấn đề, định hướng giải pháp và nguyên tắc kiểm soát.

| Khoảng trống | Định hướng trong ConferenceSpace | Nguyên tắc kiểm soát |
|---|---|---|
| Nộp bài thủ công, biểu mẫu dài | Submission Autofill trích xuất siêu dữ liệu từ PDF và gợi ý track trong ngữ cảnh hội nghị | Đầu ra là bản nháp có thể sửa, tác giả xác nhận trước khi gửi |
| Thiếu kiểm tra lỗi sớm | Submission Gating kiểm tra điều kiện cơ bản trước khi bài nộp đi vào phản biện | Cảnh báo/chặn theo chính sách cấu hình; không tự ý loại bài ngoài luật hệ thống |
| Ghép phản biện và COI khó kiểm soát | Thuật toán matching có điểm số, kết hợp COI đa tầng | Ghép phản biện là lớp thuật toán xác định; Chair quyết định cuối cùng |
| Người phản biện thiếu hỗ trợ đọc hiểu ban đầu và phải tự ghi chú nhiều điểm cần kiểm tra | Reviewer Initial Analysis cung cấp tóm tắt trung lập, điểm cần kiểm tra và căn cứ liên quan | AI hỗ trợ định hướng đọc, giảm rà soát thủ công lặp lại, nhưng không thay thế việc đọc và đánh giá chuyên môn |
| Chair khó tổng hợp nhiều review/rebuttal | Review Quality Auditor và Chair Decision Copilot tổng hợp vấn đề, đồng thuận, bất đồng, rủi ro | Không sinh quyết định chấp nhận/từ chối tự động; chỉ cung cấp bằng chứng cho Chair |
| Người dùng khó tìm hướng dẫn thao tác | Chatbot Agent truy vấn dữ liệu hệ thống theo quyền truy cập | Trả lời phải bám dữ liệu hệ thống, không vượt quyền |
| Thông báo và trạng thái phân tán | Bảng điều khiển và thông báo trong hệ thống | Trạng thái tập trung, giảm phụ thuộc vào email |

Mối liên hệ này giúp tránh một lỗi thường gặp trong báo cáo đồ án AI: thêm AI như một lớp trang trí. Trong ConferenceSpace, mỗi luồng AI phải trả lời một vấn đề nổi bật cụ thể, có điểm dừng trách nhiệm rõ ràng và được kiểm chứng lại ở Chương 5.

### 2.3.3. Nguyên tắc thiết kế từ khoảng trống

Từ phân tích trên, nhóm xác định bốn nguyên tắc thiết kế cho ConferenceSpace.

**Nguyên tắc 1: Tách lớp nghiệp vụ cốt lõi, thuật toán xác định và AI hỗ trợ.** Lớp nghiệp vụ phải vận hành được ngay cả khi dịch vụ AI không khả dụng. Ghép phản biện và COI thuộc lớp thuật toán xác định vì cần tính nhất quán, khả năng giải thích và khả năng kiểm tra. AI chỉ tham gia vào các tác vụ trích xuất, tóm tắt, rà soát và tổng hợp.

**Nguyên tắc 2: Con người giữ quyền quyết định cuối cùng.** AI không quyết định bài được chấp nhận hay từ chối, không tự phân công người phản biện, không tự đánh giá phản biện đạt hay không đạt. Hệ thống chỉ đưa ra thông tin hỗ trợ để tác giả, người phản biện hoặc Chair xác nhận.

**Nguyên tắc 3: Mọi gợi ý quan trọng cần có căn cứ.** Gợi ý người phản biện cần điểm phù hợp và lý do; cảnh báo COI cần nêu quan hệ hoặc nguồn dữ liệu; Chair Decision Copilot cần chỉ ra phản biện/phản hồi nào tạo nên nhận định tổng hợp. Đây là điều kiện để người dùng có thể tin, kiểm tra và ghi đè kết quả.

**Nguyên tắc 4: Đánh giá AI theo đúng bản chất từng luồng xử lý.** Autofill có thể đo bằng độ đúng siêu dữ liệu; Submission Gating có thể đo precision/recall theo từng luật kiểm tra; Reviewer Initial Analysis cần được đánh giá về tính đúng sự thật và độ bao phủ; Review Quality Auditor cần đánh giá rủi ro cảnh báo sai; Chair Decision Copilot cần kiểm tra mức độ bao phủ bằng chứng, không đo như bộ phân loại chấp nhận/từ chối. Nguyên tắc này sẽ được triển khai trong Chương 5.

## 2.4. Tổng hợp yêu cầu hệ thống từ khảo sát

Mục 2.4 chuyển các kết quả khảo sát và phân tích khoảng trống thành yêu cầu hệ thống. Đây là điểm nối giữa Chương 2 và Chương 3: mỗi nhóm yêu cầu dưới đây phải có nguồn gốc từ vấn đề nổi bật, hệ thống đối sánh hoặc nguyên tắc kiểm soát đã phân tích ở trên.

### 2.4.1. Yêu cầu chức năng theo vai trò

#### a) Yêu cầu cho Tác giả

| Mã | Yêu cầu | Cơ sở |
|---|---|---|
| F-AUTHOR-01 | Tác giả có thể tìm và xem thông tin hội nghị, track, hạn chót và CFP. | Nhu cầu theo dõi hạn chót và trạng thái tập trung. |
| F-AUTHOR-02 | Tác giả có thể nộp bài theo quy trình nhiều bước: thông tin bài, tác giả, tệp, COI, xem lại và gửi. | Các hệ thống hiện có đều chuẩn hóa vòng đời nộp bài; ConferenceSpace cần bao phủ nghiệp vụ lõi. |
| F-AUTHOR-03 | Hệ thống hỗ trợ Autofill siêu dữ liệu từ bản thảo PDF, gồm tiêu đề, tóm tắt, tác giả, affiliation, email và keyword khi có thể. | Vấn đề nổi bật biểu mẫu nhập liệu dài và lặp lại. |
| F-AUTHOR-04 | Hệ thống gợi ý track trong Submission Autofill dựa trên track của hội nghị đang hoạt động và siêu dữ liệu bài nộp. | Nhu cầu giảm thao tác chọn track; phạm vi hiện tại là đầu ra con trong Autofill. |
| F-AUTHOR-05 | Hệ thống kiểm tra sơ bộ bài nộp trước khi gửi chính thức và hiển thị lỗi/cảnh báo có thể sửa. | Vấn đề nổi bật thiếu kiểm tra lỗi sớm. |
| F-AUTHOR-06 | Tác giả có thể lưu nháp, chỉnh sửa trước hạn chót, rút bài, xem review, gửi rebuttal và nộp camera-ready khi được yêu cầu. | Nghiệp vụ hội nghị đầy đủ. |

#### b) Yêu cầu cho Người phản biện

| Mã | Yêu cầu | Cơ sở |
|---|---|---|
| F-REVIEWER-01 | Người phản biện có thể nhận/từ chối lời mời và xem danh sách bài được phân công. | Nghiệp vụ phản biện cơ bản. |
| F-REVIEWER-02 | Người phản biện có thể xem bài, tệp, siêu dữ liệu, hạn chót và trạng thái phản biện. | Cần giảm tình trạng không biết bước tiếp theo. |
| F-REVIEWER-03 | Người phản biện có thể nhập điểm, nhận xét, mức tự tin, lưu nháp và gửi phản biện chính thức. | Nghiệp vụ phản biện. |
| F-REVIEWER-04 | Hệ thống có thể cung cấp tóm tắt trung lập, các điểm cần kiểm tra và căn cứ liên quan để hỗ trợ đọc ban đầu. | Người phản biện trong khảo sát chấp nhận AI ở vai trò hỗ trợ đọc hiểu; chức năng này giúp giảm thao tác ghi chú/rà soát thủ công, không thay thế trách nhiệm đọc bài. |
| F-REVIEWER-05 | AI không viết phản biện thay người phản biện và không quyết định điểm số. | Phù hợp ranh giới liêm chính học thuật ở Chương 1 và chính sách hội nghị lớn [15][16]. |

#### c) Yêu cầu cho Chủ tọa/Ban tổ chức

| Mã | Yêu cầu | Cơ sở |
|---|---|---|
| F-CHAIR-01 | Chair có thể tạo và cấu hình hội nghị, track, hạn chót, biểu mẫu phản biện, hội đồng chương trình và chính sách. | Nghiệp vụ lõi của EasyChair/CMT/OpenReview. |
| F-CHAIR-02 | Chair có bảng điều khiển theo dõi số bài nộp, tiến độ review, hạn chót, conflict và việc cần xử lý. | Vấn đề nổi bật thông báo/hạn chót rời rạc và bảng điều khiển được Chair quan tâm. |
| F-CHAIR-03 | Hệ thống gợi ý người phản biện bằng thuật toán xác định, hiển thị điểm phù hợp, lý do và các ràng buộc. | Phân công phản biện là tác vụ quan trọng và có ràng buộc về tải phản biện/xung đột lợi ích [11]. |
| F-CHAIR-04 | Hệ thống phát hiện COI bằng nhiều lớp: tự phản biện, khai báo thủ công và đồ thị đồng tác giả. | COI không nên chỉ dựa vào việc tự xác định xung đột [12]. |
| F-CHAIR-05 | Chair có thể phân công thủ công, chấp nhận/ghi đè gợi ý và theo dõi tiến độ review. | Con người giữ quyền quyết định cuối cùng. |
| F-CHAIR-06 | Hệ thống hỗ trợ rà soát phản biện thiếu căn cứ, quá ngắn hoặc mâu thuẫn giữa điểm và nhận xét. | Nhu cầu kiểm soát chất lượng phản biện trong bối cảnh quá tải phản biện. |
| F-CHAIR-07 | Chair Decision Copilot chỉ tổng hợp bằng chứng, đồng thuận, bất đồng, vấn đề còn mở và câu hỏi cần xem xét. | Không biến AI thành bộ phân loại chấp nhận/từ chối. |

#### d) Yêu cầu chung

| Mã | Yêu cầu | Cơ sở |
|---|---|---|
| F-COMMON-01 | Người dùng có chatbot hoặc trợ lý hỗ trợ thao tác theo ngữ cảnh và quyền truy cập. | Vấn đề nổi bật phải đọc hướng dẫn dài và không biết bước tiếp theo. |
| F-COMMON-02 | Hệ thống có thông báo trong ứng dụng và cập nhật trạng thái kịp thời. | Vấn đề nổi bật hạn chót/thông báo rời rạc. |
| F-COMMON-03 | Hệ thống phân quyền theo vai trò và không để người dùng truy cập dữ liệu ngoài quyền. | Bảo mật bản thảo và quyền riêng tư trong peer review. |

### 2.4.2. Yêu cầu phi chức năng

| Nhóm yêu cầu | Nội dung |
|---|---|
| Khả dụng | Các thao tác nghiệp vụ chính phải vận hành được khi dịch vụ AI không khả dụng; lỗi AI không làm hỏng vòng đời nộp bài, phản biện và ra quyết định. |
| Hiệu năng | API nghiệp vụ thông thường cần phản hồi trong ngưỡng phù hợp với thao tác tương tác; các luồng AI dài nên được phân loại rõ là đồng bộ hay chạy nền. |
| Bảo mật | Hệ thống cần HTTPS/TLS, xác thực, phân quyền theo vai trò, bảo vệ tệp bản thảo và không đưa dữ liệu vượt quyền vào chatbot hoặc luồng AI. |
| Tính giải thích | Gợi ý người phản biện, cảnh báo COI và tổng hợp của AI cần hiển thị căn cứ đủ để người dùng kiểm tra. |
| Khả năng sử dụng | Quy trình cần được tổ chức theo vai trò, có bảng điều khiển trạng thái, thông báo rõ lỗi và cho phép quay lại/chỉnh sửa trước khi gửi. |
| Khả năng mở rộng | Thiết kế cần hỗ trợ nhiều hội nghị, nhiều track, số lượng bài nộp/người phản biện tăng và tích hợp dữ liệu học thuật bên ngoài. |
| Khả năng đánh giá | Các luồng xử lý quan trọng cần lưu được đầu vào/đầu ra, trạng thái hoàn tất, thời gian xử lý và chỉ số phù hợp để đánh giá ở Chương 5. |

Semantic Scholar API là một nguồn dữ liệu phù hợp để làm giàu hồ sơ học thuật vì cung cấp dữ liệu về papers, authors, citations, venues, embeddings và recommendations thông qua Academic Graph API [13]. Tuy nhiên, mọi kết luận từ dữ liệu bên ngoài cần được xem như hỗ trợ, không thay thế xác nhận của Chair.

### 2.4.3. Nguyên tắc sử dụng AI có trách nhiệm

Từ khảo sát người dùng và bối cảnh chính sách học thuật hiện nay, nhóm xác định các nguyên tắc bắt buộc khi đưa AI vào ConferenceSpace:

- **AI hỗ trợ, không thay thế:** AI không ra quyết định chấp nhận/từ chối, không viết phản biện thay người phản biện, không tự phân công người phản biện và không tự loại bài nếu chưa có luật/chính sách rõ.
- **Con người trong vòng kiểm soát:** mọi đầu ra ảnh hưởng đến nộp bài, phản biện hoặc ra quyết định đều cần người dùng có thẩm quyền xem lại và xác nhận.
- **Minh bạch nguồn gốc:** hệ thống cần phân biệt rõ dữ liệu do người dùng nhập, dữ liệu được trích xuất từ tệp, dữ liệu lấy từ nguồn học thuật và nhận định do AI tổng hợp.
- **Có quyền ghi đè:** tác giả có thể sửa Autofill; Chair có thể ghi đè gợi ý người phản biện; người phản biện có thể bỏ qua tóm tắt AI.
- **Bảo mật bản thảo:** mọi luồng AI xử lý nội dung bài nộp phải được thiết kế với giả định bản thảo là dữ liệu nhạy cảm, đặc biệt khi dùng dịch vụ mô hình bên ngoài.
- **Đánh giá theo luồng xử lý:** không dùng một chỉ số chung cho mọi đầu ra AI; mỗi luồng xử lý phải có tiêu chí riêng và giới hạn diễn giải riêng.

Các nguyên tắc này tương thích với xu hướng thận trọng của cộng đồng. NeurIPS 2026, trong thí nghiệm AI-assisted reviewing, nêu rõ công cụ AI chỉ nhằm hỗ trợ người phản biện suy nghĩ và hiểu bài nộp, không thay thế phán đoán chuyên môn hoặc viết phản biện thay người phản biện; thí nghiệm cũng đặt các cơ chế kiểm soát như tự nguyện tham gia, không lưu dữ liệu và giám sát tự động/bán tự động [19].

### 2.4.4. Ma trận truy vết từ nhu cầu đến thiết kế và đánh giá

| Nhu cầu/khoảng trống | Yêu cầu hệ thống | Thiết kế sẽ trình bày ở Chương 3 | Đánh giá sẽ kiểm chứng ở Chương 5 |
|---|---|---|---|
| Biểu mẫu nhập liệu dài và lặp lại | Autofill siêu dữ liệu, gợi ý track trong Autofill, cho phép chỉnh sửa | Luồng nộp bài, dịch vụ AI, cấu trúc biểu mẫu nộp bài | Benchmark Submission Autofill, tỷ lệ trường đúng, lỗi trích xuất, tỷ lệ gợi ý track không hợp lệ |
| Không có kiểm tra lỗi sớm | Submission Gating trước khi gửi/chuyển trạng thái | Luồng kiểm tra sơ bộ và kiểm tra chính sách | Precision/recall hoặc F1 theo từng luật kiểm tra nếu có nhãn chuẩn |
| Không biết bước tiếp theo | Bảng điều khiển, quy trình từng bước, chatbot hỗ trợ thao tác | Frontend theo vai trò, thông báo, agent query | UAT theo vai trò, chatbot tỷ lệ gọi công cụ thành công và mức độ bám dữ liệu |
| COI khó phát hiện thủ công | COI đa tầng, đồ thị đồng tác giả | Neo4j, Semantic Scholar integration, COI detector | Tỷ lệ phát hiện self/manual/coauthor conflict, ca lỗi |
| Phân công phản biện cần minh bạch | Matching xác định, điểm phù hợp, ràng buộc tải phản biện/COI | Dịch vụ matching và giao diện Chair xác nhận | Precision@K/độ bao phủ/cân bằng tải nếu có nhãn hoặc proxy phù hợp |
| Người phản biện quá tải khi đọc bài và theo dõi điểm cần kiểm tra | Tóm tắt trung lập, điểm cần kiểm tra, hỗ trợ ghi chú có căn cứ | Reviewer Initial Analysis | Tính đúng sự thật, độ bao phủ, tỷ lệ đầu ra đúng và có căn cứ, phản hồi người phản biện, mức độ hữu ích trong việc định hướng đọc |
| Chair khó tổng hợp nhiều phản biện | Review Quality Auditor, Chair Decision Copilot | Luồng tổng hợp bằng chứng, không sinh quyết định | Benchmark TCA, ca lỗi, UAT Chair |
| Lo ngại AI thay thế quyết định học thuật | Con người trong vòng kiểm soát, nhật ký kiểm tra, quyền ghi đè | Phân lớp nghiệp vụ lõi/thuật toán/AI và mô hình phân quyền | Đánh giá mức tin tưởng, tỷ lệ ghi đè, phân tích giới hạn |

Ma trận trên làm rõ Chương 2 không chỉ dừng ở khảo sát. Các nhu cầu đã được chuyển thành yêu cầu kiểm chứng được, đồng thời đặt ra tiêu chí để Chương 5 đánh giá liệu ConferenceSpace có thật sự giải quyết vấn đề đặt ra ở Chương 1 hay không.

---

## Tài liệu tham khảo

[1] EasyChair, "Our Services," 2026. Available: https://easychair.org/overview

[2] EasyChair, "Conference Management," 2026. Available: https://easychair.org/conference_management

[3] HotCRP, "REST API: Assignments," 2026. Available: https://hotcrp.com/devel/api/

[4] HotCRP, "Chair's Guide," 2026. Available: https://help.hotcrp.com/help/chair

[5] OpenReview, "About OpenReview," n.d. Available: https://openreview.net/about

[6] Microsoft CMT, "Microsoft Conference Management Toolkit," n.d. Available: https://cmt3.research.microsoft.com/About

[7] Microsoft CMT, "Chair How-To: Manage Conflicts," n.d. Available: https://cmt3.research.microsoft.com/docs/help/chair/conflicts.html

[8] Microsoft CMT, "Chair How-To: TPMS," n.d. Available: https://cmt3.research.microsoft.com/docs/help/chair/tpms.html

[9] NeurIPS Program Chairs, "Reflections on the 2025 Review Process from the Program Committee Chairs," 2025. Available: https://blog.neurips.cc/2025/09/30/reflections-on-the-2025-review-process-from-the-program-committee-chairs/

[10] ICLR Blog, "A Retrospective on the ICLR 2026 Review Process," 2026. Available: https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/

[11] L. Charlin and R. S. Zemel, "The Toronto Paper Matching System: An automated paper-reviewer assignment system," 2013. Available: https://www.cs.toronto.edu/~lcharlin/papers/tpms.pdf

[12] ACM, "Conflict of Interest Policy for ACM Publications," 2019. Available: https://www.acm.org/publications/policies/conflict-of-interest

[13] Semantic Scholar, "Semantic Scholar Academic Graph API," n.d. Available: https://www.semanticscholar.org/product/api

[14] N. B. Shah, "An Overview of Challenges, Experiments, and Computational Solutions in Peer Review," 2025. Available: https://www.cs.cmu.edu/~nihars/preprints/SurveyPeerReview.pdf

[15] ICLR Program Chairs, "Policies on Large Language Model Usage at ICLR 2026," 2025. Available: https://blog.iclr.cc/2025/08/26/policies-on-large-language-model-usage-at-iclr-2026/

[16] ICML, "Reviewer Instructions 2025," 2025. Available: https://icml.cc/Conferences/2025/ReviewerInstructions

[17] N. Thakkar et al., "Can LLM feedback enhance review quality? A randomized study of 20K reviews at ICLR 2025," arXiv:2504.09737, 2025. Available: https://arxiv.org/abs/2504.09737

[18] ICLR Blog, "Leveraging LLM feedback to enhance review quality," 2025. Available: https://blog.iclr.cc/2025/04/15/leveraging-llm-feedback-to-enhance-review-quality/

[19] NeurIPS, "2026 AI Reviewing Experiment," 2026. Available: https://neurips.cc/Conferences/2026/ai-reviewing-experiment

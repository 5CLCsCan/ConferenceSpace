# Nội dung bộ slide bảo vệ ConferenceSpace

**Nguồn trích xuất:** `docs/report/slides/ConferenceSpace_Thesis_Defense.pptx`
**Số slide:** 34
**Nguồn chuẩn để hiệu đính:** các chương chính trong `docs/report/compiled/latex`; không sử dụng `docs/report/compiled/latex/slides.tex` làm nguồn nội dung.

Tài liệu này gồm hai phần:

1. **Bản trích xuất nguyên văn:** giữ toàn bộ chữ trong PPTX để kiểm kê và đối chiếu.
2. **Bản nội dung đã hiệu đính:** trình bày nội dung đã được viết lại sau khi đối chiếu với báo cáo.

---

# Phần I. Bản trích xuất nguyên văn từ PPTX

## Slide 01

**Khung 2**

ConferenceSpace
Hỗ trợ xét duyệt với trách nhiệm được phân định

**Khung 3**

Cao Hữu Khương Duy • Nhâm Đức Huy • Võ Minh Khôi • Từ Chí Tiến • Nguyễn Ngọc Anh Tú
GVHD: ThS. Hồ Thị Hoàng Vy • PGS.TS. Lê Nguyễn Hoài Nam

## Slide 02

**Khung 3**

Mạch trình bày

**Khung 5**

1

**Khung 7**

2

**Khung 9**

3

**Khung 4**

Vấn đề và khoảng trống

**Khung 6**

Use case và vòng đời

**Khung 8**

Trách nhiệm và kiến trúc

**Khung 14**

Từ áp lực quy mô và nhu cầu kiểm soát đến câu hỏi thiết kế.

**Khung 15**

Nối tác vụ của ba vai trò thành một quy trình xét duyệt thống nhất.

**Khung 16**

Giải thích ba lớp, ranh giới backend và cách triển khai.

**Khung 11**

4

**Khung 13**

5

**Khung 10**

Thực nghiệm và kiểm thử

**Khung 12**

Kết quả, hạn chế, hướng phát triển

**Khung 17**

Đánh giá từng lớp bằng chỉ số và giới hạn phù hợp.

**Khung 18**

Kết luận đúng phạm vi và xác định ưu tiên kiểm chứng tiếp theo.

**Khung 19**

Mạch lập luận đi từ lý do xây dựng đến mức độ có thể bảo vệ từng kết luận.

## Slide 03

**Khung 3**

Quy mô hội nghị tăng tạo áp lực lên điều phối và chất lượng phản biện

**Khung 4**

CHUỖI TÁC ĐỘNG

**Khung 5**

Quy mô hội nghị tăng
→ số cặp bài–reviewer cần điều phối tăng
→ thời gian đọc, tiến độ và tính nhất quán cùng chịu sức ép

**Khung 8**

21.575

**Khung 9**

bài nộp NeurIPS 2025

**Khung 10**

21.921

**Khung 6**

• 87.137 công trình tại 11 hội nghị AI giai đoạn 2014–2023 cho thấy xu hướng tăng.
• Khi số bài và số người tham gia cùng tăng, thao tác thủ công về phân công, theo dõi và nhắc hạn trở thành nút thắt vận hành.
• Bài toán thiết kế là giảm tải điều phối nhưng vẫn bảo toàn thời gian đọc và trách nhiệm phản biện.

**Khung 11**

phản biện viên kỹ thuật

**Khung 13**

Bài toán không chỉ là lưu trữ nhiều hơn, mà là giữ được chất lượng khi quy mô tăng.

## Slide 04

**Khung 3**

AI đã xuất hiện trong phản biện, nhưng trách nhiệm vẫn thuộc về con người

**Khung 4**

RỦI RO VÀ CHÍNH SÁCH

**Khung 9**

GIÁ TRỊ KHI HỖ TRỢ CÓ GIỚI HẠN

**Khung 5**

15,8%

**Khung 10**

26,6%

**Khung 6**

phản biện ICLR 2024 được ước lượng có dấu hiệu dùng LLM

**Khung 11**

người nhận phản hồi đã cập nhật nhận xét

**Khung 7**

• Bản thảo chưa công bố phải được xử lý theo chính sách bảo mật của hội nghị.
• Người viết phản biện chịu trách nhiệm về nhận xét đã gửi, kể cả khi có dùng công cụ hỗ trợ.
• AI không được thay thế việc đọc bài hoặc phán đoán chuyên môn.

**Khung 12**

89%

**Khung 13**

trường hợp được so sánh có chất lượng cải thiện

**Khung 14**

Tín hiệu này cho thấy giá trị của AI nằm ở phản hồi có căn cứ để con người cân nhắc, không nằm ở việc tự tạo phán quyết.

**Khung 16**

AI phù hợp với vai trò phản hồi và hỗ trợ; quyết định học thuật cần được quy trách nhiệm cho con người.

## Slide 05

**Khung 3**

Người dùng cần giảm thao tác nhưng không muốn mất quyền kiểm soát

**Khung 4**

KHÓ KHĂN CHÍNH TRONG KHẢO SÁT 71 NGƯỜI

**Khung 18**

TÍN HIỆU THEO VAI TRÒ

**Khung 8**

49.3%

**Khung 19**

40/50

**Khung 5**

Không biết bước tiếp theo

**Khung 20**

Tác giả đánh giá Submission Gating hữu ích hoặc rất hữu ích

**Khung 12**

47.9%

**Khung 9**

Biểu mẫu dài, lặp lại

**Khung 16**

42.3%

**Khung 21**

Phản biện viên ủng hộ tóm tắt trung lập (6/11) nhiều hơn nội dung định hướng điểm cần chú ý (3/11).

**Khung 13**

Thiếu kiểm tra lỗi sớm

**Khung 22**

Nhu cầu nổi bật không phải là tự động quyết định, mà là hướng dẫn bước tiếp theo, giảm nhập lặp và phát hiện lỗi trước khi gửi.

**Khung 24**

Giới hạn: mẫu thuận tiện; các nhóm vai trò chuyên môn có quy mô nhỏ.

## Slide 06

**Khung 3**

Nền tảng hiện có đã bao phủ vòng đời; khoảng trống nằm ở cách dùng AI

**Khung 4**

NỀN TẢNG QUẢN LÝ HỘI NGHỊ

**Khung 8**

TÍN HIỆU AI VÀ TỰ ĐỘNG HÓA

**Khung 5**

EasyChair • HotCRP • OpenReview • Microsoft CMT

**Khung 9**

PeerSubmit • Morressier

**Khung 6**

• Bao phủ phần lớn vòng đời: cấu hình hội nghị, nộp bài, phân công, phản biện, thảo luận và quyết định.
• Điểm tham chiếu quan trọng là trạng thái xuyên suốt, quyền theo vai trò và bước xác nhận trước khi áp dụng thay đổi.
• Vì vậy, ConferenceSpace không xem các chức năng nghiệp vụ cơ bản là khoảng trống nghiên cứu cần thay thế.

**Khung 10**

• AI và tự động hóa đã xuất hiện trong sàng lọc, đối sánh, kiểm tra và tổng hợp thông tin.
• Các công bố khác nhau về mức độ tự động hóa, nhưng không phải lúc nào cũng mô tả rõ dữ liệu nguồn, thước đo hoặc người chịu trách nhiệm.
• Khoảng trống thiết kế nằm ở loại đầu ra, quyền xác nhận và khả năng truy vết — không chỉ ở việc có hay không có AI.

**Khung 11**

HÀM Ý CHO CONFERENCESPACE

**Khung 12**

Trạng thái và quyền
Kế thừa vòng đời nghiệp vụ trưởng thành thay vì tạo một quy trình riêng cho AI.

**Khung 13**

Đề xuất có thể sửa
Matching, COI và sàng lọc phải hiển thị căn cứ để người chịu trách nhiệm điều chỉnh.

**Khung 14**

Đầu ra AI có giới hạn
Bản nháp và tổng hợp chỉ hỗ trợ hành động; không tự trở thành dữ liệu hoặc quyết định chính thức.

**Khung 16**

Đối chiếu dựa trên tài liệu công khai để phân tích phạm vi và trách nhiệm, không nhằm xếp hạng sản phẩm.

## Slide 07

**Khung 3**

Câu hỏi thiết kế là chọn đúng cơ chế cho từng tác vụ

**Khung 4**

Tác vụ nào cần nghiệp vụ xác định, thuật toán tái lập hay AI hỗ trợ?

**Khung 6**

BỐN TIÊU CHÍ LỰA CHỌN

**Khung 8**

RANH GIỚI PHẠM VI

**Khung 7**

• Tác vụ có thay đổi dữ liệu chính thức hoặc quyền truy cập không?
• Kết quả có cần ổn định và tái lập trên cùng đầu vào không?
• Nếu dùng AI, đầu ra chỉ là bản nháp, cảnh báo, phân tích hay tổng hợp?
• Ai có quyền kiểm tra, sửa, bỏ qua và xác nhận kết quả?

**Khung 9**

• Không tự động quyết định chấp nhận hoặc từ chối bài báo.
• Không thay thế việc đọc bài và phán đoán chuyên môn của Phản biện viên hoặc Chủ tọa.
• Không bao gồm quản lý sự kiện, đăng ký tham dự và xuất bản kỷ yếu.
• Không tuyên bố mô hình ba lớp là tối ưu khi chưa có kiến trúc đối chứng.

**Khung 10**

QUY TẮC LỰA CHỌN

**Khung 11**

Thay đổi trạng thái hoặc quyền
→ nghiệp vụ cốt lõi kiểm soát

**Khung 12**

Cần cùng đầu vào cho cùng kết quả
→ thuật toán xác định

**Khung 13**

Cần diễn giải ngôn ngữ hoặc tổng hợp
→ AI hỗ trợ, bắt buộc kiểm tra

**Khung 15**

Thiết kế bắt đầu từ trách nhiệm, không bắt đầu từ việc gắn AI vào mọi bước.

## Slide 08

**Khung 3**

ConferenceSpace là nền tảng thực nghiệm cho mô hình ba lớp trách nhiệm

**Khung 4**

• Kết nối vòng đời từ tìm hội nghị, nộp bài và phân công đến phản biện, quyết định và camera-ready.
• Phân loại tác vụ theo cơ chế tạo kết quả và thẩm quyền sử dụng, thay vì gộp mọi tự động hóa vào một nhóm.
• Sáu luồng AI phục vụ Autofill, Gating, hỗ trợ đọc, rà soát phản biện, hỗ trợ quyết định và Chatbot.
• Mỗi đầu ra AI đều được trình bày để người dùng kiểm tra trước khi có hành động nghiệp vụ.

**Khung 7**

Backend kiểm tra quyền, trạng thái và điều kiện trước khi ghi dữ liệu chính thức.

**Khung 6**

Nghiệp vụ cốt lõi

**Khung 10**

Matching và COI tạo điểm số hoặc căn cứ có thể tái lập để Chủ tọa xem xét.

**Khung 9**

Thuật toán xác định

**Khung 13**

Tạo bản nháp, cảnh báo hoặc bản tổng hợp; người dùng có thể sửa, bỏ qua hoặc xác nhận.

**Khung 12**

AI hỗ trợ

**Khung 15**

Quyết định học thuật và việc ghi nhận dữ liệu chính thức vẫn thuộc về người có thẩm quyền.

## Slide 09

**Khung 3**

Mười use case kết nối ba vai trò trong cùng một hệ thống

**Khung 6**

Tác giả

**Khung 7**

Tìm hội nghị, quản lý bài nộp, rebuttal và camera-ready.

**Khung 9**

Phản biện viên

**Khung 10**

Nhận phân công, đọc bài, viết phản biện và thảo luận.

**Khung 12**

Chủ tọa

**Khung 13**

Cấu hình hội nghị, xác nhận phân công và quyết định.

**Khung 15**

UC-08

**Khung 16**

Lưu trao đổi theo bài và theo phạm vi hiển thị.

**Khung 18**

UC-10

**Khung 19**

Truy vấn dữ liệu qua backend theo quyền trên tài nguyên.

**Khung 21**

Các use case không đứng riêng lẻ; chúng cùng cập nhật một vòng đời nghiệp vụ có kiểm soát.

## Slide 10

**Khung 3**

Một bài nộp đi qua các trạng thái với chủ thể chịu trách nhiệm rõ ràng

**Khung 4, 8, 12, 16, 20, 24, 28**

01 • 02 • 03 • 04 • 05 • 06 • 07

**Khung 6**

Bài nháp

**Khung 10**

Đã gửi

**Khung 14**

Phân công

**Khung 18**

Phản biện

**Khung 22**

Thảo luận

**Khung 26**

Quyết định

**Khung 30**

Camera-ready

**Khung 7**

Tác giả khai báo metadata, đồng tác giả, tệp và COI.

**Khung 11**

Backend kiểm tra hạn chót, dữ liệu bắt buộc và quyền gửi.

**Khung 15**

Chủ tọa rà soát matching, tải công việc và COI trước khi áp dụng.

**Khung 19**

Reviewer đọc toàn văn, tự viết nhận xét và nộp điểm số.

**Khung 23**

Tác giả rebuttal; hội đồng trao đổi theo phạm vi hiển thị.

**Khung 27**

Chủ tọa đối chiếu phản biện, rebuttal và vấn đề còn mở.

**Khung 31**

Bài được chấp nhận mới chuyển sang nộp bản hoàn chỉnh.

**Khung 32**

ĐIỀU KIỆN ĐIỀU KHIỂN VÒNG ĐỜI

**Khung 33**

Tác giả
Chỉ sửa hoặc rút bài trong trạng thái và thời hạn cho phép.

**Khung 34**

Phản biện viên
Chỉ truy cập bài sau khi phân công hợp lệ và không có COI đã khóa.

**Khung 35**

Chủ tọa
Xác nhận phân công, mở giai đoạn và ghi nhận quyết định có lịch sử.

**Khung 36**

Nhánh rút bài và từ chối được lưu như trạng thái có lịch sử, không xóa dấu vết nghiệp vụ.

**Khung 38**

Mỗi chuyển trạng thái chỉ xảy ra khi đúng vai trò, đúng điều kiện và đúng thời điểm.

## Slide 11

**Khung 3**

Tác giả kiểm soát dữ liệu từ khám phá hội nghị đến camera-ready

**Khung 4, 8, 12, 16**

01 • 02 • 03 • 04

**Khung 6**

Tìm hội nghị

**Khung 10**

Tạo bài nháp

**Khung 14**

Autofill + Gating

**Khung 18**

Theo dõi

**Khung 7**

Đối chiếu CFP, chuyên đề, chính sách và hạn chót trước khi nộp.

**Khung 11**

Khai báo metadata, đồng tác giả, tệp và xung đột lợi ích.

**Khung 15**

Nhận dữ liệu trích xuất để sửa; xử lý lỗi chặn và cảnh báo nội dung.

**Khung 19**

Xem phản biện, gửi rebuttal, nhận quyết định và nộp camera-ready.

**Khung 21**

Autofill không tự ghi đè biểu mẫu. Gating chỉ chặn khi vi phạm quy tắc xác định; cảnh báo nội dung vẫn để Tác giả cân nhắc.

**Khung 23**

Tác giả sửa và xác nhận trước khi dữ liệu được ghi nhận là bài nộp chính thức.

## Slide 12

**Khung 3**

Phản biện viên nhận hỗ trợ đọc và rà soát, nhưng tự viết phản biện

**Khung 4**

• Phản biện viên phản hồi lời mời; hệ thống chỉ mở toàn văn khi phân công hợp lệ và không có COI.
• Reviewer Initial Analysis trích dẫn đoạn liên quan và nêu điểm cần lưu ý để định hướng đọc, không thay thế việc đọc bài.
• Phản biện viên tự viết điểm số, nhận xét gửi Tác giả và ghi chú riêng cho hội đồng.
• Review Quality Auditor rà lại tính cụ thể, căn cứ và sự nhất quán trước khi gửi.
• Nhãn blocking hoặc warning chỉ ưu tiên cách hiển thị; Phản biện viên vẫn quyết định sửa hay nộp.

**Khung 7**

AI hỗ trợ cách đọc và rà soát; nội dung phản biện vẫn do Phản biện viên chịu trách nhiệm.

## Slide 13

**Khung 3**

Chủ tọa điều phối hội nghị và ra quyết định từ bằng chứng đã kiểm tra

**Khung 4**

• Cấu hình hội nghị, chuyên đề, thời hạn, chính sách phản biện và thành viên hội đồng.
• Theo dõi tiến độ; xác minh COI; rà soát điểm phù hợp và tải công việc trước khi áp dụng phân công.
• Mở thảo luận; đối chiếu phản biện, rebuttal và các vấn đề còn bất đồng theo từng bài.
• Chair Decision Copilot tổng hợp cơ sở bằng chứng, mức đồng thuận và nội dung cần kiểm tra thêm.
• Chủ tọa đọc nguồn, chỉnh sửa kết luận, ghi nhận quyết định và phát hành thông báo.

**Khung 7**

Bản tổng hợp giúp giảm tải đọc; quyền quyết định không được chuyển cho hệ thống.

## Slide 14

**Khung 3**

Reviewer matching kết hợp chủ đề, tải công việc và ràng buộc

**Khung 4**

ĐẦU VÀO CÓ THỂ KIỂM TRA

**Khung 5**

• Chủ đề và từ khóa tạo tín hiệu phù hợp chuyên môn giữa bài và reviewer.
• Bidding bổ sung nguyện vọng khi hội nghị kích hoạt giai đoạn đăng ký.
• Tải công việc giới hạn số bài để tránh dồn phân công vào một nhóm nhỏ.
• Danh sách COI đã xác minh loại cặp không được phép phân công.

**Khung 6**

KẾT QUẢ

**Khung 7**

Thuật toán trả về danh sách đề xuất cùng điểm số, tải và trạng thái COI. Chủ tọa có thể thêm, loại hoặc đổi reviewer trước khi xác nhận.

**Khung 10**

Thuật toán tạo đề xuất tái lập; quyết định phân công vẫn là thao tác nghiệp vụ của Chủ tọa.

## Slide 15

**Khung 3**

COI được kiểm tra trước khi reviewer đi vào bài được phân công

**Khung 4, 8, 12, 16**

01 • 02 • 03 • 04

**Khung 6**

Phát hiện

**Khung 10**

Đánh dấu

**Khung 14**

Xác minh

**Khung 18**

Khóa danh sách

**Khung 7**

Kiểm tra email, cơ quan, khai báo thủ công và quan hệ đồng tác giả.

**Khung 11**

Mỗi cặp bài–reviewer nghi ngờ được hiển thị cùng loại tín hiệu và căn cứ.

**Khung 15**

Chủ tọa chấp nhận xung đột hoặc ghi lý do khi bác bỏ hoặc ghi đè.

**Khung 19**

COI đã xác minh trở thành ràng buộc loại trừ trước khi matching chạy.

**Khung 21**

Tín hiệu tự động chỉ tạo trường hợp cần kiểm tra. Quyền truy cập bài chỉ thay đổi sau khi COI được xác nhận và backend áp dụng ràng buộc.

**Khung 23**

COI là ràng buộc nghiệp vụ cần căn cứ và quyền xác nhận, không chỉ là điểm trừ trong thuật toán.

## Slide 16

**Khung 3**

Thảo luận và Chatbot hỗ trợ nhiều vai trò trong đúng phạm vi quyền

**Khung 4**

TRAO ĐỔI THEO BÀI NỘP

**Khung 5**

• Mỗi comment gắn với bài nộp, người gửi, thời điểm và phạm vi hiển thị.
• Luồng trao đổi hỗ trợ phản hồi của Tác giả, thảo luận reviewer-only và theo dõi của Chủ tọa.
• Lịch sử thread giữ ngữ cảnh cho rebuttal và quyết định sau cùng.

**Khung 8**

CHATBOT THEO QUYỀN

**Khung 9**

• Chatbot trả lời về trạng thái, hạn chót và hướng dẫn trong phạm vi ConferenceSpace.
• Công cụ gọi endpoint backend bằng ngữ cảnh đã xác thực; backend kiểm tra lại quyền trên từng tài nguyên.
• Chatbot không truy cập trực tiếp cơ sở dữ liệu và không mở rộng quyền của người hỏi.

**Khung 12**

Cùng một câu hỏi có thể cho kết quả khác nhau tùy quyền truy cập hợp lệ của người dùng.

## Slide 17

**Khung 3**

Ba lớp khác nhau ở cơ chế tạo kết quả và quyền xác nhận

**Khung 4–6**

Lớp
Đầu ra và cơ chế tạo kết quả
Người kiểm tra và quyền xác nhận

**Khung 8–10**

Nghiệp vụ cốt lõi
Trạng thái và dữ liệu chính thức chỉ được ghi sau khi kiểm tra quyền, hạn chót và điều kiện chuyển bước.
Người có thẩm quyền hành động; backend xác thực

**Khung 12–14**

Thuật toán xác định
Matching và COI tạo điểm số, đề xuất hoặc căn cứ có thể tái lập trên cùng đầu vào và cấu hình.
Chủ tọa kiểm tra, điều chỉnh và xác nhận

**Khung 16–18**

AI hỗ trợ
Bản nháp, cảnh báo, phân tích hoặc tổng hợp có thể sai; nguồn và giới hạn phải được hiển thị khi sử dụng.
Tác giả, Reviewer hoặc Chủ tọa kiểm tra

**Khung 19, 23, 27, 31**

01 • 02 • 03 • 04

**Khung 21**

Đầu ra hỗ trợ

**Khung 25**

Người dùng kiểm tra

**Khung 29**

Backend xác thực

**Khung 33**

Ghi nhận

**Khung 22**

Có căn cứ; chưa đổi trạng thái.

**Khung 26**

Sửa, bỏ qua hoặc hành động.

**Khung 30**

Quyền • trạng thái • điều kiện.

**Khung 34**

Dữ liệu chính thức • lịch sử.

**Khung 36**

Không có đường đi trực tiếp từ đầu ra hỗ trợ đến dữ liệu chính thức.

## Slide 18

**Khung 3**

Backend là ranh giới nghiệp vụ và phân quyền của hệ thống

**Khung 4**

LUỒNG DỊCH VỤ

**Khung 32**

BA NGUYÊN TẮC

**Khung 33**

01 Ranh giới nghiệp vụ
Backend là nơi duy nhất kiểm tra điều kiện và cập nhật trạng thái chính thức; dịch vụ AI không ghi trực tiếp.

**Khung 12**

Backend Go / Gin

**Khung 6**

Trình duyệt

**Khung 9**

Caddy + Next.js

**Khung 13**

Xác thực quyền • quy tắc trạng thái • giao dịch dữ liệu

**Khung 7**

Tác giả • Reviewer • Chair

**Khung 10**

HTTPS và giao diện

**Khung 34**

02 Dữ liệu theo kiểu truy vấn
PostgreSQL ưu tiên giao dịch, Neo4j phục vụ quan hệ nhiều bậc, Redis giữ trạng thái ngắn hạn.

**Khung 15**

Dịch vụ AI

**Khung 16**

Trích xuất • cảnh báo • phân tích • tổng hợp

**Khung 21**

PostgreSQL

**Khung 24**

Neo4j

**Khung 22**

Dữ liệu giao dịch, hội thoại và kết quả cần truy vết

**Khung 25**

Đồ thị đồng tác giả phục vụ truy vấn COI nhiều bậc

**Khung 35**

03 Quyền theo tài nguyên
Một người có thể giữ vai trò khác nhau giữa các hội nghị; quyền được kiểm tra trên từng bài và từng thao tác.

**Khung 27**

Redis

**Khung 28**

Tác vụ tạm thời, kết quả chờ và giới hạn tần suất

**Khung 37**

Chatbot gọi endpoint backend bằng ngữ cảnh xác thực; không truy cập trực tiếp cơ sở dữ liệu.

## Slide 19

**Khung 3**

Deployment tách mạng công khai, ứng dụng và dữ liệu

**Khung 4**

TOPOLOGY TRIỂN KHAI

**Khung 22**

CI/CD

**Khung 25**

Build

**Khung 23**

01

**Khung 12**

Web • Backend • AI

**Khung 6**

Internet

**Khung 9**

Caddy

**Khung 13**

Tách dịch vụ theo vòng đời, tải xử lý và ranh giới truy cập

**Khung 26**

GitHub Actions dựng ba image frontend, backend và AI song song.

**Khung 7**

HTTPS

**Khung 10**

TLS và định tuyến

**Khung 29**

Tag

**Khung 27**

02

**Khung 30**

Mỗi image mang commit SHA để truy vết đúng phiên bản nguồn.

**Khung 33**

Push

**Khung 31**

03

**Khung 17**

PostgreSQL • Redis • Neo4j

**Khung 18**

Chỉ nhận kết nối trong mạng dữ liệu; không mở cổng trực tiếp ra Internet

**Khung 34**

Image được đẩy lên GHCR; thông tin xác thực không nằm trong image.

**Khung 37**

Deploy

**Khung 35**

04

**Khung 20**

Caddy là điểm vào HTTPS duy nhất. Migration chạy có thứ tự trước khi cập nhật ứng dụng, giúp schema và phiên bản dịch vụ không lệch nhau.

**Khung 38**

VPS kéo image, chạy migration rồi cập nhật Docker Compose.

**Khung 40**

Phân vùng mạng và pipeline triển khai làm rõ nơi nào được công khai, nơi nào được phép ghi dữ liệu.

## Slide 20

**Khung 3**

Mỗi lớp được đánh giá bằng loại bằng chứng riêng

**Khung 4–6**

Nghiệp vụ
Hệ thống có xử lý ổn định các đường tải đại diện không?
Đo thông lượng, p95, lỗi và tài nguyên trên dữ liệu backend tổng hợp.

**Khung 8–10**

Thuật toán
Đề xuất có tái lập, có độ phủ và chi phí chấp nhận được không?
60 hồ sơ reviewer, 2.565 bài; matching và hai kiểm tra COI xác định.

**Khung 12–14**

AI hỗ trợ
Đầu ra có bám nguồn và giữ đúng ranh giới hỗ trợ không?
1.127 bài Re2 cho sáu luồng; 40 hội thoại Chatbot theo tám nhóm.

**Khung 16–18**

Người dùng
Người dùng có hoàn tất tác vụ và chấp nhận cách hỗ trợ không?
91 phản hồi UAT, tách theo Tác giả, Reviewer và Chủ tọa.

**Khung 22**

Kết luận chỉ được mở rộng trong phạm vi mà phép đo tương ứng có thể chứng minh.

## Slide 21

**Khung 3**

Backend đáp ứng tải ngắn hạn trên ba đường xử lý được chọn

**Khung 4**

• Thiết lập: k6 tạo 20 người dùng ảo trong 30 giây trên ba đường xử lý đại diện, không phải toàn bộ hành trình giao diện.
• Dữ liệu nền: 300 hội nghị, 15.000 bài nộp và 9.000 quan hệ để tránh đánh giá trên cơ sở dữ liệu gần rỗng.
• Kết quả: ba kịch bản đạt 369–572 yêu cầu/giây, p95 dưới 120 ms và không ghi nhận yêu cầu thất bại.
• Nút thắt quan sát: PostgreSQL dùng CPU cao nhất; tối ưu truy vấn và chỉ mục cần được ưu tiên trước khi tăng tài nguyên ứng dụng.
• Giới hạn: phép đo ngắn hạn chưa chứng minh độ ổn định đầu cuối, khả năng chạy bền, khôi phục hoặc tải phân tán.

**Khung 8**

Kết quả chứng minh khả năng chịu tải ngắn hạn của ba đường xử lý, không đại diện cho toàn hệ thống.

## Slide 22

**Khung 3**

Matching cho tín hiệu chủ đề hữu ích, nhưng chưa đủ để tự động phân công

**Khung 4**

Jaccard tạo tín hiệu xếp hạng có ích (MRR 0,392), nhưng tối ưu điểm phù hợp không tự bảo đảm đủ người và cân bằng tải.

**Khung 7**

Chất lượng xếp hạng
Nhãn tác giả gốc chỉ là tín hiệu gián tiếp; chưa có danh sách phân công do Chủ tọa xác nhận làm chuẩn.

**Khung 8**

Khả năng phân công
Greedy phủ đủ hai reviewer cho 65,9% bài; 23,3% cần lượt dự phòng. COI mới đo hai kiểm tra xác định.

**Khung 10**

Điểm số được dùng để đề xuất, không tự động phân công.

## Slide 23

**Khung 3**

Autofill có bằng chứng trực tiếp mạnh hơn, còn Gating giữ đúng ranh giới hỗ trợ

**Khung 4**

SUBMISSION AUTOFILL

**Khung 8**

SUBMISSION GATING

**Khung 6**

Tiêu đề và từ khóa có cấu trúc rõ đạt F1 lần lượt 98,20% và 92,77%; tác giả đạt 83,49%. Tỷ lệ hoàn tất trường bắt buộc là 86,93%, nhưng một số trường vẫn thất bại hoàn toàn.

**Khung 10**

Nhánh luật đúng 8/8 về phán quyết và mã luật nên có thể chặn lỗi xác định. Nhánh nội dung hoàn tất 24/24 và tạo 26 cảnh báo, nhưng chưa có nhãn chuyên gia để đo độ chính xác cảnh báo.

**Khung 12**

Trường có cấu trúc rõ đạt mức khớp cao hơn; cảnh báo nội dung vẫn cần người dùng kiểm tra.

## Slide 24

**Khung 3**

Reviewer Initial Analysis bám nguồn tốt ở trích dẫn nhưng yếu hơn ở phần diễn giải

**Khung 4**

• Mục tiêu phép đo: kiểm tra liệu trích dẫn và diễn giải do hệ thống tạo có thể truy về nội dung bài báo hay không.
• Trích dẫn bám nguồn đạt 96,22%; phần nội dung không bám nguồn chiếm 3,78%, cho thấy cơ chế lấy dẫn chứng hoạt động tốt hơn phần suy diễn.
• Truthfulness của các điểm cần lưu ý chỉ đạt 69,86%; đây là vùng Reviewer cần đọc lại thay vì tiếp nhận như nhận định đã xác nhận.
• Coverage 4,49% và Additionality 92,23% chỉ mô tả quan hệ với tham chiếu, không chứng minh tính hữu ích hoặc độ đầy đủ.
• Giới hạn: TCA chưa hiệu chuẩn bằng nhãn chuyên gia; chưa đo thời gian đọc hoặc ảnh hưởng đến phán đoán của Reviewer.

**Khung 8**

Reviewer Initial Analysis định hướng đọc, không thay thế việc đọc bài.

## Slide 25

**Khung 3**

Review Quality Auditor còn nhiều nhiễu nên chỉ phù hợp để gợi ý điểm cần kiểm tra

**Khung 4**

• Bộ thử tạo 3.658 lượt kiểm tra: 1.913 block, 1.650 warn và 95 pass; phân bố cho thấy hệ thống có xu hướng cảnh báo nhiều.
• Trong ConferenceSpace, block và warn chỉ điều khiển mức ưu tiên hiển thị; cả hai đều không ngăn Reviewer nộp phản biện.
• Truthfulness đạt 58,28%; tỷ lệ hợp lệ đạt 71,04%; chỉ 46,99% phát hiện đồng thời bám nguồn và hợp lệ.
• Hệ quả: Reviewer phải đối chiếu lại từng phát hiện; không được chuyển nhãn xác suất thành quy tắc nghiệp vụ chặn cứng.
• Giới hạn: chưa có nhãn chuyên gia để đo false positive hoặc mức độ hữu ích của từng loại cảnh báo.

**Khung 8**

Không chuyển phát hiện xác suất thành điều kiện chặn cứng.

## Slide 26

**Khung 3**

Chair Decision Copilot tổng hợp khá bám nguồn nhưng không đo chất lượng quyết định

**Khung 4**

• Đầu ra được đánh giá ở mức bám nguồn của cơ sở bằng chứng và phần tổng hợp bất đồng, không ở mức đúng–sai của phán quyết.
• Truthfulness của cơ sở bằng chứng đạt 87,34%; bản tổng hợp bất đồng đạt 87,11%, cho thấy phần lớn nội dung có thể truy về dữ liệu đầu vào.
• Tỷ lệ rủi ro cao là 1,28%, tương đương khoảng 14 bài trong tập chấm; số ít trường hợp vẫn có thể tác động trực tiếp đến quyết định nếu không được kiểm tra.
• Chủ tọa phải đọc phản biện và rebuttal gốc, xác nhận vấn đề còn mở, rồi tự ghi nhận quyết định.
• Giới hạn: chưa đo độ đầy đủ, tính hữu ích, thời gian đọc hoặc thiên lệch tự động hóa.

**Khung 8**

Kết quả đo mức bám nguồn của bản tổng hợp, không đo độ đúng của quyết định học thuật.

## Slide 27

**Khung 3**

Chatbot giữ ranh giới quyền trong bộ thử, nhưng độ tin cậy công cụ còn hạn chế

**Khung 4**

• Bộ thử gồm 40 hội thoại thuộc tám nhóm: 25 đạt, 12 đạt một phần và 3 không đạt theo rà soát thủ công hồi cứu.
• Chatbot hoàn tất luồng phản hồi, nhưng chỉ 97/128 lượt gọi công cụ thành công (75,78%); lỗi công cụ và chất lượng hội thoại phải được phân tích riêng.
• Không ghi nhận rò rỉ dữ liệu trong các kịch bản quyền đã thử, phù hợp với thiết kế gọi backend bằng ngữ cảnh xác thực.
• Một biến thể vượt phạm vi và một số câu trả lời để lộ lỗi truy vấn; trạng thái thất bại cần được chuyển thành thông báo có thể hành động.
• Giới hạn: đánh giá hồi cứu trên bộ kịch bản không tương đương kiểm toán bảo mật hoặc kiểm thử đối kháng.

**Khung 8**

Khả năng giữ quyền cần tiếp tục được kiểm chứng cùng độ tin cậy của từng công cụ backend.

## Slide 28

**Khung 3**

Độ trễ yêu cầu cách vận hành khác nhau cho từng luồng AI

**Khung 6**

Gating theo luật

**Khung 8**

Cảnh báo nội dung

**Khung 10**

Phân tích dài

**Khung 12**

Chatbot

**Khung 7**

Chạy đồng bộ vì kết quả nhanh, xác định và có thể chặn lỗi trước khi gửi.

**Khung 9**

Chạy song song, không chặn; kết quả đến muộn vẫn có thể được Tác giả cân nhắc.

**Khung 11**

Reviewer Analysis, Auditor và Copilot có ca vượt 100 giây; phù hợp chạy nền hoặc chạy trước.

**Khung 13**

Cần phản hồi từng phần và hiển thị trạng thái tra cứu để người dùng không chờ trong im lặng.

**Khung 15**

Đây là khuyến nghị suy ra từ độ trễ quan sát; chưa phải so sánh thực nghiệm giữa các phương án triển khai.

## Slide 29

**Khung 3**

UAT cho tín hiệu tích cực, nhưng mẫu lệch mạnh về Tác giả

**Khung 6, 8, 10, 12, 14, 16**

0 • 1 • 2 • 3 • 4 • 5

**Khung 38**

73/91

**Khung 20**

3.89

**Khung 17**

Tác giả (n=76)

**Khung 39**

sẵn sàng giới thiệu nền tảng

**Khung 24**

4.29

**Khung 21**

Phản biện viên (n=7)

**Khung 28**

4.38

**Khung 25**

Chủ tọa (n=8)

**Khung 40**

69/76 Tác giả cảm nhận AI giúp giảm thao tác hoặc thời gian. Đây là tín hiệu trải nghiệm, không phải phép đo thời gian khách quan.

**Khung 29**

CƠ CẤU MẪU

**Khung 41**

Giới hạn: mẫu thuận tiện; câu hỏi gộp không tách riêng từng workflow; dữ liệu Chủ tọa chưa thể tái lập độc lập từ tệp thô hiện có.

**Khung 31, 33, 35**

76 • 7 • 8

**Khung 36**

Tác giả chiếm 83,5% mẫu; điểm cao của hai vai trò chuyên môn có độ bất định lớn vì n rất nhỏ.

**Khung 43**

Điểm hài lòng tích cực không loại bỏ rủi ro sai lệch do cơ cấu mẫu.

## Slide 30

**Khung 3**

Bằng chứng mạnh ở phạm vi hẹp; kết luận rộng vẫn cần kiểm chứng

**Khung 4, 9, 14, 19**

01 • 02 • 03 • 04

**Khung 6**

Bằng chứng trực tiếp

**Khung 7**

Đo đúng đầu ra cần kết luận: hiệu năng ba endpoint, metadata Autofill và nhánh luật Gating.

**Khung 11**

Bằng chứng gián tiếp

**Khung 12**

Matching dùng nhãn tác giả gốc; TCA/NLI chấm quan hệ với nguồn nhưng chưa thay nhãn chuyên gia.

**Khung 16**

Theo kịch bản hoặc mô tả

**Khung 17**

Chatbot được rà soát trên 40 hội thoại; UAT phản ánh cảm nhận của mẫu thuận tiện mất cân bằng.

**Khung 21**

Chưa xác nhận

**Khung 22**

Chất lượng COI đa tầng, quyết định học thuật, vận hành dài hạn và sẵn sàng triển khai hội nghị thực tế.

**Khung 24**

Toàn bộ bằng chứng ủng hộ tính khả thi của mô hình trách nhiệm, chưa chứng minh tính tối ưu hay ưu thế sản phẩm.

## Slide 31

**Khung 3**

Kết quả đạt được

**Khung 5, 7, 9, 11, 13**

1 • 2 • 3 • 4 • 5

**Khung 4**

Nền tảng nghiệp vụ
Mười use case kết nối vòng đời của Tác giả, Reviewer và Chủ tọa.

**Khung 6**

Mô hình trách nhiệm
Tách dữ liệu chính thức, đề xuất tái lập và đầu ra AI cần kiểm tra.

**Khung 8**

Thuật toán có căn cứ
Matching và COI hiển thị tín hiệu, ràng buộc và quyền xác nhận.

**Khung 10**

Sáu workflow AI
Tạo bản nháp, cảnh báo, phân tích, tổng hợp hoặc câu trả lời theo quyền.

**Khung 12**

Chuỗi đánh giá theo lớp
Đối chiếu hiệu năng, thuật toán, AI và UAT bằng bằng chứng riêng.

**Khung 14**

Đề tài chứng minh khả năng triển khai và đánh giá mô hình trong phạm vi đã thử; chưa chứng minh mô hình tối ưu hoặc ConferenceSpace vượt trội hơn sản phẩm khác.

## Slide 32

**Khung 3**

Các hạn chế tập trung ở bằng chứng thực tế, vận hành và quản trị dữ liệu

**Khung 4**

DỮ LIỆU VÀ PHƯƠNG PHÁP

**Khung 7**

VẬN HÀNH VÀ QUẢN TRỊ

**Khung 5**

• Matching và COI chưa có dữ liệu phân công thực cùng nhãn xác nhận của Chủ tọa; vì vậy chưa đo được độ đúng trong bối cảnh hội nghị thật.
• Nhãn tác giả gốc chỉ là tín hiệu gián tiếp cho matching; độ phủ phân công không đồng nghĩa với chất lượng chuyên môn của từng cặp.
• TCA/NLI là phép chấm tự động về quan hệ với nguồn; chưa thay thế đánh giá chuyên gia về tính hữu ích, đầy đủ và mức nghiêm trọng của lỗi.
• UAT dùng mẫu thuận tiện và Tác giả chiếm 83,5%; so sánh giữa vai trò có độ bất định cao, đặc biệt với Reviewer và Chủ tọa.

**Khung 8**

• Kiểm thử backend mới bao phủ tải ngắn hạn trên ba đường xử lý; chưa có chạy bền, tải phân tán hoặc phép đo toàn bộ hành trình người dùng.
• Chưa gây lỗi có chủ đích cho AI, hàng đợi và kho dữ liệu; hành vi timeout, retry, khôi phục và tính nhất quán sau lỗi chưa được xác nhận.
• Chatbot chưa trải qua kiểm thử đối kháng hoặc kiểm toán bảo mật; việc không thấy rò rỉ trong 40 hội thoại chỉ có giá trị trong bộ kịch bản đã thử.
• Vòng đời dữ liệu tại nhà cung cấp AI chưa được kiểm toán đầy đủ; chính sách lưu giữ, xóa, phiên bản nguồn và nhật ký truy cập còn cần hoàn thiện.

**Khung 10**

Các hạn chế thu hẹp phạm vi kết luận; chúng không được che giấu bằng điểm trung bình hoặc ảnh minh họa.

## Slide 33

**Khung 3**

Hướng phát triển

**Khung 17**

Ưu tiên 1

**Khung 4**

Giai đoạn 1: Bằng chứng có nhãn

**Khung 11**

Giai đoạn 3: Truy hồi có kiểm soát

**Khung 5**

Thu thập phân công và COI được Chủ tọa xác nhận; xây dựng nhãn chuyên gia cho sáu workflow; mở rộng UAT cân bằng theo vai trò.

**Khung 12**

Quản lý nguồn, phiên bản, trích dẫn và quyền truy cập cho Chatbot/Agent; kiểm thử đối kháng trên các ranh giới quyền.

**Khung 18**

Ưu tiên 2–4

**Khung 8**

Giai đoạn 2: Vận hành tác vụ dài

**Khung 14**

Giai đoạn 4: Hoàn thiện nghiệp vụ

**Khung 9**

Đưa phân tích dài vào hàng đợi; hiển thị tiến độ; bổ sung timeout, retry có giới hạn, idempotency và nhật ký kiểm toán.

**Khung 15**

Hoàn thiện COI đa tầng, hạn chót, bidding, chọn bài phản biện và quy trình sau quyết định trước khi triển khai thực tế.

**Khung 19**

Thứ tự ưu tiên là tăng độ tin cậy của bằng chứng và vận hành trước khi mở rộng phạm vi hoặc mức tự động hóa.

## Slide 34

**Khung 2**

Câu hỏi và thảo luận

**Khung 3**

CONFERENCESPACE

**Khung 9**

Nghiệp vụ cốt lõi • Thuật toán xác định • AI hỗ trợ có kiểm soát

**Khung 4**

Giá trị chính của đề tài là đặt đúng cơ chế vào đúng tác vụ, đồng thời phân biệt rõ phần đã được kiểm chứng với phần còn cần đánh giá.

---

# Phần II. Bản nội dung đã hiệu đính

Phần này giữ cấu trúc nội dung chính của từng slide nhưng viết lại toàn bộ câu chữ theo báo cáo. Các dòng “Nguồn đối chiếu” chỉ phục vụ kiểm tra, không cần đưa vào slide.

## Slide 01 — Trang tiêu đề

**Tiêu đề**

ConferenceSpace

**Phụ đề**

Nền tảng hỗ trợ quy trình xét duyệt theo mô hình ba lớp trách nhiệm

**Thông tin nhóm**

Cao Hữu Khương Duy • Nhâm Đức Huy • Võ Minh Khôi • Từ Chí Tiến • Nguyễn Ngọc Anh Tú
GVHD: ThS. Hồ Thị Hoàng Vy • PGS.TS. Lê Nguyễn Hoài Nam

**Nguồn đối chiếu:** Chương 1, mục “Mục tiêu đề tài”; Chương 3, mục “Mô hình trách nhiệm”.

## Slide 02 — Mạch trình bày

**Tiêu đề**

Mạch trình bày

**1. Vấn đề và định hướng thiết kế**

Làm rõ áp lực đối với quy trình xét duyệt, nhu cầu của người dùng và nguyên tắc lựa chọn cơ chế xử lý.

**2. Use case và vòng đời nghiệp vụ**

Trình bày cách ba vai trò phối hợp trong một quy trình thống nhất từ nộp bài đến quyết định.

**3. Mô hình trách nhiệm và kiến trúc**

Giải thích ba lớp trách nhiệm, ranh giới của backend và môi trường triển khai.

**4. Thiết lập thực nghiệm và kết quả đánh giá**

Đánh giá từng lớp bằng nguồn bằng chứng và chỉ số phù hợp với loại đầu ra.

**5. Kết quả, hạn chế và hướng phát triển**

Đối chiếu kết quả với mục tiêu, xác định giới hạn của bằng chứng và các ưu tiên tiếp theo.

**Câu kết**

Mạch trình bày đi từ vấn đề và yêu cầu thiết kế đến những kết luận mà bằng chứng thực nghiệm hiện có cho phép.

**Nguồn đối chiếu:** Chương 1, mục “Cấu trúc luận văn”.

## Slide 03 — Áp lực từ quy mô công bố

**Tiêu đề**

Quy mô công bố tăng gây áp lực lên quy trình xét duyệt

**Chuỗi tác động**

Quy mô công bố tăng → khối lượng công việc xét duyệt tăng → thời gian đọc và tính nhất quán của quy trình chịu sức ép

**Bằng chứng và diễn giải**

- Nghiên cứu trên 87.137 công trình tại 11 hội nghị trí tuệ nhân tạo giai đoạn 2014–2023 ghi nhận số công trình được công bố và số tác giả đều tăng.
- Với mỗi bài nộp, ban tổ chức phải kiểm tra thông tin, lựa chọn phản biện viên phù hợp, theo dõi tiến độ và tổng hợp nhận xét trong thời hạn của kỳ xét duyệt.
- Khi khối lượng công việc tăng nhanh hơn nguồn phản biện viên có kinh nghiệm, thời gian dành cho từng bản thảo có thể bị thu hẹp và tính nhất quán trong phân công, theo dõi khó được duy trì.

**Số liệu nhấn**

- **21.575** bài nộp tại NeurIPS 2025
- **21.921** phản biện viên kỹ thuật tại NeurIPS 2025

**Câu kết**

Bài toán không chỉ là xử lý được nhiều hồ sơ hơn, mà còn là duy trì chất lượng và trách nhiệm trong từng công đoạn của quy trình xét duyệt.

**Nguồn đối chiếu:** Chương 1, mục “Đặt vấn đề”.

## Slide 04 — Ranh giới sử dụng AI trong phản biện

**Tiêu đề**

AI đã được sử dụng trong phản biện, nhưng trách nhiệm học thuật vẫn thuộc về con người

**Ràng buộc về liêm chính học thuật**

- Bản thảo chưa công bố phải được bảo mật; nội dung chỉ được xử lý bằng AI khi chính sách hội nghị và thỏa thuận xử lý dữ liệu cho phép.
- Phản biện viên chịu trách nhiệm cuối cùng đối với nội dung phản biện đã gửi, kể cả khi sử dụng công cụ hỗ trợ.
- AI không được thay thế việc đọc bài hoặc phán đoán chuyên môn.

**Tín hiệu sử dụng trong thực tế**

- **Ít nhất 15,8%** bản phản biện tại ICLR 2024 được ước lượng có dấu hiệu sử dụng mô hình ngôn ngữ lớn.

**Giá trị khi AI chỉ đóng vai trò hỗ trợ**

- **26,6%** phản biện viên trong nhóm thực sự nhận được phản hồi đã cập nhật nhận xét theo gợi ý của hệ thống.
- Trong phép đánh giá ẩn danh, phản hồi của hệ thống được nhận định là cải thiện chất lượng nhận xét ở **89%** trường hợp được so sánh.

**Câu kết**

AI có thể cung cấp thông tin để người dùng xem xét; nội dung phản biện và quyết định học thuật vẫn do người có thẩm quyền chịu trách nhiệm.

**Nguồn đối chiếu:** Chương 1, mục “Đặt vấn đề”; Chương 2, mục “Đối chiếu yêu cầu về phân công và sử dụng AI với bằng chứng bên ngoài”.

## Slide 05 — Nhu cầu của người dùng

**Tiêu đề**

Người dùng muốn giảm thao tác nhưng vẫn giữ quyền kiểm tra và xác nhận

**Các khó khăn nổi bật trong khảo sát thu được 71 phản hồi**

- **49,3% — 35/71:** Không biết bước tiếp theo cần làm là gì.
- **47,9% — 34/71:** Biểu mẫu nhập liệu dài và lặp lại.
- **42,3% — 30/71:** Không có kiểm tra lỗi sớm trước khi nộp chính thức.

**Tín hiệu theo vai trò**

- **40/50 Tác giả** đánh giá Submission Gating hữu ích hoặc rất hữu ích.
- Trong nhóm 11 Phản biện viên, **6/11** người đánh giá cao bản tóm tắt trung lập, trong khi **3/11** người đánh giá cao chức năng nêu những điểm cần kiểm tra kỹ.

**Diễn giải**

Trong mẫu khảo sát, các phản hồi tập trung vào nhu cầu được chỉ dẫn theo trạng thái, giảm nhập lại thông tin và phát hiện thiếu sót trước khi gửi; đầu ra tự động vẫn phải cho phép người dùng kiểm tra và xác nhận.

**Giới hạn**

Khảo sát sử dụng mẫu thuận tiện; nhóm Chủ tọa và Phản biện viên có quy mô nhỏ, nên kết quả theo vai trò chỉ mang tính định hướng.

**Nguồn đối chiếu:** Chương 2, mục “Khảo sát nhu cầu người dùng”.

## Slide 06 — Khoảng trống thiết kế

**Tiêu đề**

Trọng tâm thiết kế không chỉ là bổ sung chức năng AI, mà còn là kiểm soát loại đầu ra và quyền xác nhận của từng tác vụ

**Các nền tảng quản lý hội nghị hiện có**

EasyChair • HotCRP • OpenReview • Microsoft CMT

- Các nền tảng này đã công bố chức năng bao quát phần lớn vòng đời xét duyệt, từ nộp bài và phân công đến phản biện, thảo luận và quyết định.
- Các quy trình tham chiếu duy trì trạng thái và quyền hạn xuyên suốt, đồng thời yêu cầu Chủ tọa kiểm tra phương án trước khi áp dụng phân công.

**Các nền tảng thể hiện xu hướng AI và tự động hóa**

PeerSubmit • Morressier

- Tự động hóa đã được áp dụng cho sàng lọc, đối sánh, kiểm tra xung đột và tổng hợp thông tin.
- Tài liệu công khai không phải lúc nào cũng cung cấp đủ dữ liệu, định nghĩa chỉ số hoặc phương pháp để đánh giá độc lập chất lượng của các chức năng này.

**Hàm ý đối với ConferenceSpace**

- Duy trì vòng đời nghiệp vụ thống nhất thay vì tạo một quy trình riêng cho AI.
- Trình bày điểm đối sánh, căn cứ xung đột và thông tin liên quan để Chủ tọa kiểm tra.
- Giới hạn đầu ra AI ở dữ liệu nháp, cảnh báo hoặc bản tổng hợp; người dùng có thẩm quyền quyết định hành động tiếp theo.

**Câu kết**

Phép đối chiếu mô tả phạm vi chức năng và quy ước trách nhiệm được công bố; báo cáo không dùng kết quả này để xếp hạng chất lượng sản phẩm.

**Nguồn đối chiếu:** Chương 1, mục “Đặt vấn đề”; Chương 2, mục “Khảo sát hiện trạng các hệ thống quản lý hội nghị”.

## Slide 07 — Khung lựa chọn cơ chế

**Tiêu đề**

Mỗi tác vụ cần được xử lý bằng cơ chế phù hợp với mức ảnh hưởng và trách nhiệm

**Câu hỏi trung tâm**

Tác vụ nào thuộc nghiệp vụ cốt lõi, tác vụ nào cần thuật toán xác định, có thể kiểm chứng, và tác vụ nào phù hợp với AI hỗ trợ?

**Bốn tiêu chí lựa chọn**

- Bản chất nghiệp vụ và mức ảnh hưởng của tác vụ là gì?
- Kết quả có cần tái lập hoặc kiểm tra lại trên cùng đầu vào không?
- Hệ thống được phép tạo loại đầu ra nào: dữ liệu chính thức, đề xuất, bản nháp, cảnh báo hay bản tổng hợp?
- Ai chịu trách nhiệm kiểm tra, xác nhận hoặc đưa ra quyết định?

**Quy tắc lựa chọn**

- Quản lý quyền, trạng thái và hành động hợp lệ → **nghiệp vụ cốt lõi**.
- Cần kết quả ổn định, có thể kiểm tra lại → **thuật toán xác định, có thể kiểm chứng**.
- Cần trích xuất, diễn giải hoặc tổng hợp ngôn ngữ → **AI hỗ trợ**, với đầu ra do người dùng kiểm tra.

**Ranh giới phạm vi**

- Không tự động quyết định chấp nhận hoặc từ chối bài báo.
- Không thay thế việc đọc bài và phán đoán chuyên môn.
- Không bao gồm bán vé, đăng ký tham dự, xếp lịch phòng hoặc xuất bản kỷ yếu.
- Không kết luận mô hình ba lớp là tối ưu khi chưa có kiến trúc đối chứng.

**Câu kết**

Thiết kế bắt đầu từ tính chất của tác vụ và chủ thể chịu trách nhiệm, không bắt đầu từ việc đưa AI vào mọi công đoạn.

**Nguồn đối chiếu:** Chương 1, mục “Đặt vấn đề” và “Phạm vi đề tài”; Chương 2, mục “Nguyên tắc thiết kế từ các vấn đề đã xác định”.

## Slide 08 — Mô hình ba lớp trách nhiệm

**Tiêu đề**

ConferenceSpace tổ chức tác vụ theo ba lớp trách nhiệm

**Giới thiệu hệ thống**

- ConferenceSpace kết nối các nghiệp vụ từ khám phá hội nghị và nộp bài đến phân công, phản biện, quyết định và nộp bản hoàn thiện sau chấp nhận.
- Hệ thống phân loại tác vụ theo cơ chế tạo kết quả và thẩm quyền sử dụng kết quả, không theo ranh giới triển khai kỹ thuật.
- Sáu luồng AI hỗ trợ nhập liệu, kiểm tra bài nộp, định hướng đọc, rà soát bản nháp, tổng hợp bằng chứng và truy vấn dữ liệu.

**Nghiệp vụ cốt lõi**

Quản lý quyền, trạng thái và hành động hợp lệ; backend kiểm tra điều kiện trước khi cập nhật dữ liệu nghiệp vụ chính thức.

**Thuật toán xác định**

Tính điểm đối sánh và kiểm tra xung đột lợi ích theo quy tắc đã định nghĩa; Chủ tọa xem căn cứ, điều chỉnh và xác nhận phương án.

**AI hỗ trợ**

Tạo dữ liệu nháp, cảnh báo, bản phân tích hoặc bản tổng hợp để Tác giả, Phản biện viên hoặc Chủ tọa kiểm tra.

**Câu kết**

Đầu ra hỗ trợ không tự cập nhật trạng thái hệ thống và không tự trở thành quyết định học thuật.

**Nguồn đối chiếu:** Chương 1, mục “Đặt vấn đề”; Chương 3, mục “Mô hình trách nhiệm”.

## Slide 09 — Bản đồ use case

**Tiêu đề**

Mười use case kết nối ba vai trò trong cùng một vòng đời nghiệp vụ

**Tác giả**

- UC-01: Khám phá và theo dõi hội nghị.
- UC-02: Hoàn tất và kiểm tra bài nộp.
- UC-03: Quản lý vòng đời bài nộp.

**Phản biện viên**

- UC-04: Tiếp nhận lời mời và xem bài được phân công.
- UC-05: Đọc, soạn và gửi phản biện.

**Chủ tọa**

- UC-06: Phân công và kiểm tra xung đột lợi ích.
- UC-07: Quản lý hội nghị và theo dõi tiến độ.
- UC-09: Tổng hợp bằng chứng hỗ trợ quyết định.

**Dùng chung theo quyền**

- UC-08: Trao đổi theo bài nộp.
- UC-10: Truy vấn trạng thái và hướng dẫn bằng Chatbot Agent.

**Câu kết**

Các use case chia sẻ dữ liệu, trạng thái và cơ chế phân quyền; chúng không phải những công cụ hoạt động độc lập.

**Nguồn đối chiếu:** Chương 3, mục “Bản đồ use case”.

## Slide 10 — Vòng đời bài nộp

**Tiêu đề**

Vòng đời bài nộp gắn mỗi giai đoạn với vai trò và điều kiện nghiệp vụ

**01. Bài nháp**

Tác giả khai báo siêu dữ liệu, đồng tác giả, tệp bản thảo và xung đột lợi ích.

**02. Bài đã gửi**

Backend kiểm tra quyền gửi, dữ liệu bắt buộc và các điều kiện đã được triển khai trước khi chuyển trạng thái.

**03. Phân công phản biện**

Chủ tọa xem điểm đối sánh, khối lượng công việc và căn cứ xung đột trước khi điều chỉnh hoặc xác nhận phương án.

**04. Phản biện đã gửi**

Phản biện viên đọc bản thảo, nhập điểm và nhận xét, đồng thời chịu trách nhiệm về bản phản biện.

**05. Phản hồi và thảo luận**

Tác giả gửi phản hồi; Phản biện viên được phân công trao đổi; Chủ tọa theo dõi lịch sử.

**06. Quyết định của Chủ tọa**

Chủ tọa đối chiếu phản biện, phản hồi của Tác giả, nội dung thảo luận và các vấn đề còn mở trước khi đưa ra quyết định.

**07. Bản hoàn thiện sau chấp nhận**

Vòng đời có nhánh bài đã rút và bài bị từ chối; chỉ bài được chấp nhận mới chuyển sang bước nộp bản hoàn thiện sau chấp nhận.

**Điều kiện điều khiển vòng đời**

- Tác giả chỉ sửa, rút bài hoặc gửi phản hồi khi trạng thái và thời hạn tương ứng cho phép.
- Phản biện viên chỉ truy cập các bài thuộc phân công của mình; đối sánh tự động loại các cặp đã phát hiện có xung đột.
- Chủ tọa xác nhận phân công, mở giai đoạn phản hồi, đưa ra và ghi nhận quyết định cuối cùng.

**Câu kết**

Backend từ chối các thao tác vi phạm quyền, trạng thái hoặc điều kiện đã triển khai; báo cáo chưa kiểm thử đầu cuối toàn bộ chuỗi chuyển trạng thái.

**Nguồn đối chiếu:** Chương 3, mục “Vòng đời nghiệp vụ”; Chương 5, mục “Các hạn chế”.

## Slide 11 — Luồng nghiệp vụ của Tác giả

**Tiêu đề**

Tác giả kiểm tra và xác nhận dữ liệu trong toàn bộ vòng đời bài nộp

**01. Khám phá hội nghị**

Tìm kiếm hội nghị, xem lời mời nộp bài, chuyên đề và các hạn chót liên quan.

**02. Tạo và hoàn tất bài nháp**

Tải bản thảo; khai báo siêu dữ liệu, đồng tác giả và xung đột lợi ích.

**03. Tự động điền và kiểm tra trước khi nộp**

Submission Autofill tạo siêu dữ liệu nháp và gợi ý chuyên đề để Tác giả chỉnh sửa. Submission Gating phân biệt lỗi theo quy tắc với cảnh báo nội dung trước khi gửi bài.

**04. Theo dõi sau khi gửi**

Theo dõi trạng thái, rút bài khi được phép, xem phản biện, gửi phản hồi và nộp bản hoàn thiện sau chấp nhận.

**Ranh giới trách nhiệm**

- Trạng thái cảnh báo cho phép tiếp tục khi chính sách cho phép; trạng thái chặn ngăn gửi cho đến khi lỗi có căn cứ được khắc phục.
- Dữ liệu trích xuất chỉ là bản nháp; Tác giả kiểm tra, chỉnh sửa và quyết định thời điểm gửi.

**Câu kết**

Tác giả vẫn là người xác nhận nội dung bài nộp trước khi dữ liệu được ghi nhận chính thức.

**Nguồn đối chiếu:** Chương 3, các mục UC-01, UC-02 và UC-03.

## Slide 12 — Luồng nghiệp vụ của Phản biện viên

**Tiêu đề**

AI hỗ trợ định hướng đọc và rà soát bản nháp; Phản biện viên vẫn chịu trách nhiệm viết bản phản biện

**Nội dung chính**

- Phản biện viên chấp nhận hoặc từ chối lời mời và chỉ xem được các bài thuộc phân công của mình.
- Reviewer Initial Analysis tạo bản định hướng đọc để tham khảo; đầu ra này không thay thế việc đọc bản thảo.
- Phản biện viên tự nhập điểm, nhận xét, khuyến nghị và mức độ tự tin.
- Review Quality Auditor rà soát mức độ đầy đủ, cụ thể và nhất quán của bản nháp trước khi gửi.
- Phát hiện mức `blocking` được làm nổi bật hơn mức `warning`; cả hai mức đều không ngăn thao tác gửi bản phản biện.

**Câu kết**

Phản biện viên phải đối chiếu đầu ra hỗ trợ với bài gốc và chịu trách nhiệm về bản phản biện cuối cùng.

**Nguồn đối chiếu:** Chương 3, các mục UC-04 và UC-05.

## Slide 13 — Luồng nghiệp vụ của Chủ tọa

**Tiêu đề**

Chủ tọa điều phối quy trình và chịu trách nhiệm về quyết định cuối cùng

**Nội dung chính**

- Cấu hình hội nghị, chuyên đề, hạn chót, biểu mẫu phản biện, chính sách và hội đồng chương trình.
- Theo dõi số bài, tiến độ phản biện và các trường hợp cần xử lý.
- Xem điểm đối sánh, khối lượng công việc và căn cứ xung đột trước khi điều chỉnh hoặc xác nhận phân công.
- Mở giai đoạn phản hồi và theo dõi nội dung trao đổi theo từng bài nộp.
- Chair Decision Copilot tổng hợp điểm đồng thuận, bất đồng, vấn đề còn mở và bằng chứng liên quan.
- Đối chiếu bản tổng hợp với dữ liệu gốc trước khi đưa ra và ghi nhận quyết định cuối cùng.

**Câu kết**

Bản tổng hợp hỗ trợ Chủ tọa rà soát thông tin; hệ thống không đưa ra quyết định chấp nhận hoặc từ chối bài báo.

**Nguồn đối chiếu:** Chương 3, các mục UC-06, UC-07, UC-08 và UC-09.

## Slide 14 — Đối sánh phản biện

**Tiêu đề**

Đối sánh phản biện kết hợp tín hiệu chủ đề, khối lượng công việc và xung đột lợi ích

**Đầu vào và ràng buộc**

- Hệ thống tính điểm Jaccard từ miền chuyên môn của bài nộp và phản biện viên.
- Các trường hợp có xung đột lợi ích bị loại khỏi đề xuất tự động.
- Khi nhiều ứng viên bằng điểm, thuật toán ưu tiên người có ít bài đang được phân công hơn, sau đó dùng thứ tự cố định theo định danh.
- Lượt chính áp dụng ngưỡng điểm và giới hạn tải; lượt dự phòng có thể nới hai điều kiện này nhưng vẫn giữ xung đột lợi ích là ràng buộc cứng.

**Kết quả**

Hệ thống trả danh sách đề xuất, điểm số, lý do và danh sách bài chưa đủ phản biện viên. Chủ tọa xem căn cứ, điều chỉnh và xác nhận phương án.

**Giới hạn**

Thuật toán tham lam không bảo đảm phương án tối ưu cho toàn hội nghị và cũng không bảo đảm mọi bài có đủ số phản biện viên yêu cầu.

**Câu kết**

Thuật toán tạo phương án có thể kiểm tra lại; Chủ tọa vẫn chịu trách nhiệm xác nhận phân công.

**Nguồn đối chiếu:** Chương 3, mục “Đối sánh Phản biện viên”.

## Slide 15 — Phát hiện xung đột lợi ích

**Tiêu đề**

Xung đột lợi ích được kiểm tra từ nhiều nguồn trước khi Chủ tọa xác nhận phân công

**Ba nguồn kiểm tra**

1. Quan hệ tác giả của bài nộp.
2. Xung đột do người dùng khai báo.
3. Quan hệ đồng tác giả nhiều bậc trong Neo4j.

**Cách xử lý trong đề xuất tự động**

Thuật toán loại các trường hợp có xung đột khỏi cả lượt đối sánh chính và lượt dự phòng.

**Cách xử lý khi Chủ tọa thêm đề xuất thủ công**

Backend kiểm tra các nguồn dữ liệu hiện có, trả cảnh báo và lưu trạng thái kiểm tra trong siêu dữ liệu của đề xuất. Luồng hiện tại cảnh báo nhưng chưa ngăn ghi dữ liệu.

**Giới hạn khi lớp đồ thị không khả dụng**

Nếu Neo4j chưa được cấu hình hoặc truy vấn thất bại, hệ thống tiếp tục bằng các nguồn còn lại nhưng không thể khẳng định đã kiểm tra đầy đủ quan hệ đồng tác giả nhiều bậc.

**Câu kết**

Căn cứ xung đột phải được Chủ tọa xem xét trước khi xác nhận; hệ thống không bảo đảm phát hiện đầy đủ mọi xung đột lợi ích.

**Nguồn đối chiếu:** Chương 3, mục “Phát hiện xung đột lợi ích”; Chương 1, mục “Phạm vi đề tài”.

## Slide 16 — Trao đổi và Chatbot Agent

**Tiêu đề**

Trao đổi và Chatbot Agent chỉ sử dụng dữ liệu trong phạm vi quyền của từng người dùng

**Trao đổi theo bài nộp**

- Chủ tọa hoặc Đồng chủ tọa mở giai đoạn phản hồi.
- Phản biện viên được phân công có thể tạo chuỗi và gửi tin nhắn trong chuỗi do mình tạo.
- Tác giả xem và phản hồi trong các chuỗi gắn với bài của mình.
- Chủ tọa xem toàn bộ lịch sử ở chế độ giám sát nhưng hiện không tạo chuỗi hoặc gửi tin nhắn.
- Backend kiểm tra quan hệ giữa người dùng, bài nộp và chuỗi thảo luận trước mỗi thao tác.

**Chatbot Agent**

- Nhận câu hỏi, lịch sử hội thoại và ngữ cảnh trang hiện tại.
- Khi cần dữ liệu nghiệp vụ, Chatbot Agent gửi yêu cầu có cấu trúc đến endpoint truy vấn của backend.
- Backend kiểm tra mã xác thực, tài nguyên, trường dữ liệu, bộ lọc và quyền trước khi trả phần dữ liệu tối thiểu được phép.
- Chatbot Agent không truy cập trực tiếp cơ sở dữ liệu.

**Câu kết**

Câu trả lời phụ thuộc vào dữ liệu mà người dùng hiện tại được phép truy cập; Chatbot Agent không mở rộng quyền của người hỏi.

**Nguồn đối chiếu:** Chương 3, các mục UC-08 và UC-10.

## Slide 17 — Trách nhiệm của ba lớp

**Tiêu đề**

Ba lớp khác nhau ở loại đầu ra và chủ thể chịu trách nhiệm

**Nghiệp vụ cốt lõi**

- **Tác vụ:** Kiểm tra quyền; quản lý trạng thái hội nghị, bài nộp, phân công, phản biện, phản hồi và quyết định.
- **Kết quả:** Dữ liệu nghiệp vụ chính thức và lịch sử thay đổi trạng thái.
- **Trách nhiệm:** Người dùng được phân quyền thực hiện thao tác; backend kiểm tra điều kiện trước khi cập nhật.

**Thuật toán xác định**

- **Tác vụ:** Tính điểm phù hợp, xếp hạng ứng viên và kiểm tra xung đột lợi ích theo quy tắc đã định nghĩa.
- **Kết quả:** Điểm số, lý do, đề xuất phân công và danh sách bài chưa đủ phản biện viên.
- **Trách nhiệm:** Chủ tọa kiểm tra căn cứ, điều chỉnh và xác nhận phương án.

**AI hỗ trợ**

- **Tác vụ:** Trích xuất thông tin, kiểm tra bản thảo, hỗ trợ đọc, rà soát bản nháp, tổng hợp bằng chứng và trả lời câu hỏi.
- **Kết quả:** Dữ liệu nháp, cảnh báo, bản phân tích hoặc bản tổng hợp có thể đối chiếu.
- **Trách nhiệm:** Tác giả, Phản biện viên hoặc Chủ tọa kiểm tra; AI không tự quyết định.

**Đường chuyển thành dữ liệu chính thức**

Đầu ra hỗ trợ → người dùng kiểm tra và lựa chọn → backend kiểm tra quyền, trạng thái và điều kiện → dữ liệu nghiệp vụ chính thức

**Câu kết**

Không có đường chuyển trực tiếp từ đầu ra hỗ trợ sang dữ liệu nghiệp vụ chính thức.

**Nguồn đối chiếu:** Chương 3, mục “Mô hình trách nhiệm”.

## Slide 18 — Kiến trúc và phân quyền

**Tiêu đề**

Backend là ranh giới chính đối với nghiệp vụ, dữ liệu và phân quyền

**Luồng dịch vụ**

Trình duyệt → Caddy → Next.js → Backend Go và Gin

- Backend kết nối PostgreSQL, Neo4j, dịch vụ AI và nguồn dữ liệu học thuật.
- Next.js có luồng giao tiếp trực tiếp với dịch vụ AI cho hội thoại; khi cần dữ liệu nghiệp vụ, dịch vụ AI vẫn gọi endpoint truy vấn của backend.

**Nguyên tắc 1 — Ranh giới nghiệp vụ**

Backend kiểm tra quyền và quy tắc nghiệp vụ trước khi đọc hoặc cập nhật dữ liệu. Dịch vụ AI không trực tiếp ghi dữ liệu nghiệp vụ chính thức.

**Nguyên tắc 2 — Phân chia dữ liệu theo kiểu truy vấn**

- PostgreSQL lưu dữ liệu nghiệp vụ, phiên hội thoại và kết quả cần truy vết.
- Neo4j lưu quan hệ đồng tác giả để truy vấn nhiều bậc.
- Redis lưu kết quả công cụ đang chờ và bộ đếm giới hạn tần suất có thời hạn ngắn.

**Nguyên tắc 3 — Quyền gắn với tài nguyên**

Một người có thể giữ vai trò khác nhau giữa các hội nghị; backend kiểm tra cả danh tính và quan hệ của người dùng với tài nguyên cụ thể.

**Câu kết**

Việc tách dịch vụ và kho dữ liệu dựa trên vòng đời, tải xử lý và kiểu truy vấn; cách tách này không tương ứng trực tiếp với ba lớp trách nhiệm.

**Nguồn đối chiếu:** Chương 3, các mục “Các thành phần chính”, “Kiến trúc tổng thể”, “Thiết kế giao diện, backend và phân quyền” và “Thiết kế dữ liệu”.

## Slide 19 — Môi trường triển khai

**Tiêu đề**

Môi trường triển khai tách điểm truy cập công khai khỏi mạng dữ liệu nội bộ

**Cấu trúc triển khai**

- Caddy là điểm tiếp nhận lưu lượng từ Internet, cung cấp HTTPS và định tuyến đến giao diện web hoặc backend.
- Giao diện web, backend, tác vụ cập nhật lược đồ và dịch vụ AI được đóng gói thành các dịch vụ độc lập.
- PostgreSQL, Redis và Neo4j chỉ nhận kết nối trong mạng dữ liệu nội bộ; các kho dữ liệu không mở cổng trực tiếp ra Internet.

**Quy trình CI/CD**

1. GitHub Actions xây dựng song song image của giao diện, backend và dịch vụ AI.
2. Mỗi image được gắn thẻ theo commit SHA để truy vết phiên bản nguồn.
3. Các image được đẩy lên GitHub Container Registry; cấu hình thực thi và giá trị bí mật được lưu ngoài mã nguồn.
4. Máy chủ kéo đúng image, chạy migration và cập nhật các container bằng Docker Compose.

**Câu kết**

Thiết kế triển khai xác định rõ điểm truy cập công khai, ranh giới mạng dữ liệu và phiên bản mã nguồn của mỗi bản phát hành.

**Giới hạn**

Cấu hình này hỗ trợ truy vết bản phát hành nhưng chưa chứng minh khả năng vận hành dài hạn, khôi phục (rollback) hoặc phục hồi sau sự cố.

**Nguồn đối chiếu:** Chương 3, mục “Môi trường triển khai chính thức” và “Tổng kết chương”.

## Slide 20 — Khung đánh giá

**Tiêu đề**

Mỗi nhóm trách nhiệm được đánh giá bằng nguồn bằng chứng riêng

**Lớp nghiệp vụ cốt lõi**

- **Câu hỏi:** Các đường xử lý được chọn có đủ nhanh và ổn định trong cấu hình thử nghiệm không?
- **Bằng chứng:** Kiểm thử tải k6 trên dữ liệu tổng hợp gồm 300 hội nghị, 15.000 bài nộp và 9.000 quan hệ phản biện viên–hội nghị.
- **Chỉ số:** Thông lượng, độ trễ phân vị 95 (p95), tỷ lệ yêu cầu thất bại, CPU và RAM.

**Lớp thuật toán xác định, có thể kiểm chứng**

- **Câu hỏi:** Thuật toán có chạy nhanh, tạo kết quả có thể kiểm tra lại và biểu hiện như thế nào trên dữ liệu tổng hợp?
- **Bằng chứng:** Phép đo hiệu năng vi mô bằng Go; phép thử xếp hạng và phân công trên 60 hồ sơ tác giả tổng hợp cùng 2.565 bài báo tổng hợp; hai bộ kiểm tra xung đột xác định được đo riêng.
- **Chỉ số:** Thời gian, bộ nhớ, Hit@k, MRR, nDCG, độ phủ và độ đồng đều của phân công.

**Các luồng AI hỗ trợ**

- **Câu hỏi:** Từng luồng tạo đầu ra ở mức nào và có giữ đúng ranh giới hỗ trợ không?
- **Bằng chứng:** 1.127 bài được đưa vào bộ thực thi luồng xử lý; 1.097 bài có kết quả đủ điều kiện cho TCA; các trường hợp kiểm thử riêng cho Submission Gating; 40 hội thoại Chatbot Agent.
- **Chỉ số:** Exact Match, ROUGE, F1, Truthfulness, Coverage, Additionality và kết quả hội thoại.

**Khảo sát người dùng**

- **Câu hỏi:** Người dùng đánh giá trải nghiệm và cách hỗ trợ như thế nào?
- **Bằng chứng:** 91 phản hồi UAT, gồm 76 phản hồi ở phiếu Tác giả, 7 phản hồi ở phiếu Phản biện viên và 8 phản hồi ở phiếu Chủ tọa.

**Câu kết**

Hiệu năng backend, mức bám nguồn của AI và cảm nhận của người dùng trả lời những câu hỏi khác nhau; không chỉ số nào đại diện cho toàn bộ hệ thống.

**Nguồn đối chiếu:** Chương 4, các mục “Mục tiêu và phạm vi đánh giá” và “Kịch bản đánh giá và đầu vào theo nhóm”.

## Slide 21 — Hiệu năng backend

**Tiêu đề**

Ba đường xử lý được chọn đáp ứng tải ngắn hạn trong cấu hình thử nghiệm

**Thiết lập**

- Mỗi kịch bản sử dụng 20 người dùng ảo trong 30 giây.
- Dữ liệu nền gồm 300 hội nghị, 15.000 bài nộp và 9.000 quan hệ phản biện viên–hội nghị.
- Ba kịch bản gồm truy vấn đọc, gợi ý phản biện viên và kiểm tra xung đột lợi ích.

**Kết quả**

- Thông lượng đạt từ **369 đến 572 yêu cầu/giây**.
- Độ trễ phân vị 95 (p95) thấp hơn **120 ms** trong cả ba kịch bản.
- Tỷ lệ yêu cầu thất bại bằng **0%**.

**Tài nguyên**

PostgreSQL sử dụng CPU cao nhất trong cấu hình đã đo; kết quả xác định đây là thành phần cần được ưu tiên kiểm tra khi tối ưu, nhưng không chứng minh PostgreSQL là điểm nghẽn duy nhất ở cấu hình khác.

**Giới hạn**

Phép thử chỉ đo tải ngắn hạn trên ba đường xử lý HTTP; kết quả không thay thế kiểm thử đầy đủ vòng đời chức năng, kiểm thử chạy bền, khôi phục sau lỗi hoặc đánh giá tải phân tán.

**Câu kết**

Kết quả xác nhận hiệu năng của các endpoint đã chọn trong cấu hình thử nghiệm, không đại diện cho toàn bộ hệ thống.

**Nguồn đối chiếu:** Chương 4, mục “Hiệu năng backend” và “Tài nguyên tiêu thụ”.

## Slide 22 — Kết quả đối sánh phản biện

**Tiêu đề**

Đối sánh tạo tín hiệu chủ đề để Chủ tọa tham khảo, chưa đủ căn cứ cho phân công tự động

**Hành vi xếp hạng**

- Jaccard đạt **MRR 0,392**, cao hơn phương pháp ngẫu nhiên trong phép thử leave-one-out trên 60 truy vấn.
- Phương pháp đếm số chủ đề chung đạt Hit@10 và nDCG@10 cao hơn Jaccard; kết quả chưa cho thấy một phương pháp chiếm ưu thế ổn định.
- Nhãn tác giả gốc chỉ kiểm tra khả năng truy hồi quan hệ chủ đề; nhãn này không đại diện cho phản biện viên phù hợp trong vận hành thực tế.

**Hành vi phân công**

- Thuật toán Greedy phân đủ hai phản biện viên cho **65,9%** số bài.
- **23,3%** số bài cần lượt dự phòng, trong đó ngưỡng điểm và giới hạn tải được nới nhưng xung đột lợi ích vẫn là ràng buộc cứng.
- Điểm Jaccard trung bình cao hơn các phương pháp cơ sở, nhưng độ phủ và cân bằng tải vẫn là các mục tiêu riêng.

**Câu kết**

Kết quả hỗ trợ việc dùng Greedy để tạo danh sách đề xuất cho Chủ tọa kiểm tra; nghiên cứu chưa có phương án phân công thực tế do Chủ tọa xác nhận làm dữ liệu tham chiếu.

**Nguồn đối chiếu:** Chương 4, mục “Hành vi xếp hạng và phân công”.

## Slide 23 — Submission Autofill và Submission Gating

**Tiêu đề**

Submission Autofill đạt mức khớp cao hơn ở các trường có cấu trúc rõ so với các trường có cấu trúc phức tạp; Submission Gating không dùng cảnh báo nội dung để chặn bài

**Submission Autofill**

- Trên **1.127 bài**, F1 theo token của tiêu đề đạt **98,20%**; F1 từ khóa đạt **92,77%**; F1 tác giả đạt **83,49%**.
- Tỷ lệ hoàn tất các trường bắt buộc đạt **86,93%**.
- Một số trường có giá trị thấp nhất bằng 0, cho thấy luồng vẫn có những trường hợp thất bại hoàn toàn.
- Kết quả chỉ được dùng làm dữ liệu nháp để Tác giả kiểm tra và chỉnh sửa.

**Submission Gating**

- Nhánh kiểm tra luật hoàn tất **8/8** trường hợp, đạt 100% về phán quyết và mã luật, đồng thời không ghi nhận trường hợp chặn sai trong bộ thử.
- Nhánh cảnh báo nội dung hoàn tất **24/24** trường hợp và tạo 26 cảnh báo không chặn.
- Bộ thử chưa có nhãn chuyên gia để đo độ chính xác hoặc khả năng hỗ trợ chỉnh sửa của từng cảnh báo.

**Câu kết**

Kiểm tra theo quy tắc có thể ngăn thao tác vi phạm điều kiện đã cấu hình; cảnh báo nội dung vẫn phải do Tác giả xem xét.

**Nguồn đối chiếu:** Chương 4, mục “Submission Autofill và Submission Gating”.

## Slide 24 — Reviewer Initial Analysis

**Tiêu đề**

Trên 1.097 bài đủ điều kiện, trích dẫn của Reviewer Initial Analysis đạt tỷ lệ bám nguồn 96,22%; các điểm cần lưu ý vẫn phải được kiểm tra

**Mục tiêu đánh giá**

TCA được thực hiện trên 1.097 bài có kết quả đủ điều kiện để đo quan hệ giữa trích dẫn, các điểm cần lưu ý và dữ liệu nguồn; phép đo không đánh giá chất lượng phản biện cuối cùng.

**Kết quả**

- Tỷ lệ trích dẫn bám nguồn đạt **96,22%**.
- Tỷ lệ nội dung bị phân loại là không bám nguồn đạt **3,78%**.
- Độ trung thực (Truthfulness) của các điểm cần lưu ý đạt **69,86%**.
- Độ phủ (Coverage) đạt **4,49%**; tỷ lệ nội dung có căn cứ nằm ngoài tham chiếu (Additionality) đạt **92,23%**. Hai chỉ số này mô tả quan hệ với nội dung tham chiếu, không trực tiếp đo mức độ mới, đầy đủ hoặc hữu ích.

**Giới hạn**

TCA là phép chấm tự động mang tính thăm dò và chưa được hiệu chuẩn bằng nhãn chuyên gia. Nghiên cứu cũng chưa đo thời gian đọc hoặc ảnh hưởng của chức năng đến phán đoán chuyên môn.

**Câu kết**

Reviewer Initial Analysis chỉ hỗ trợ định hướng đọc; Phản biện viên vẫn phải kiểm tra từng nhận định trên bài gốc.

**Nguồn đối chiếu:** Chương 4, mục “Reviewer Initial Analysis” và “Phương pháp và ranh giới diễn giải”.

## Slide 25 — Review Quality Auditor

**Tiêu đề**

Review Quality Auditor còn tạo nhiều phát hiện cần kiểm tra lại

**Phân bố đầu ra**

Trên 1.127 bài, hệ thống tạo 3.658 lượt kiểm tra, gồm:

- **1.913** lượt `block`;
- **1.650** lượt `warn`;
- **95** lượt `pass`.

Trong ConferenceSpace, `block` và `warn` chỉ thể hiện mức ưu tiên trên giao diện; cả hai đều không ngăn Phản biện viên gửi bản phản biện.

**Chất lượng phát hiện**

- Độ trung thực (Truthfulness) đạt **58,28%**.
- Tỷ lệ hợp lệ (Validity) đạt **71,04%**.
- Tỷ lệ phát hiện vừa bám nguồn vừa hợp lệ đạt **46,99%**.

**Diễn giải và giới hạn**

Các phát hiện phù hợp để chỉ ra nội dung cần xem lại, không phù hợp để trở thành điều kiện chặn cứng. Bộ thử chưa có nhãn chuyên gia để đo tỷ lệ cảnh báo sai hoặc mức độ hữu ích của từng loại phát hiện.

**Câu kết**

Phản biện viên phải đối chiếu từng phát hiện và tự quyết định có chỉnh sửa bản phản biện hay không.

**Nguồn đối chiếu:** Chương 4, mục “Review Quality Auditor”.

## Slide 26 — Chair Decision Copilot

**Tiêu đề**

Trên 1.097 bài đủ điều kiện, Truthfulness của hai nhóm đầu ra Chair Decision Copilot đạt khoảng 87%; phép chấm không đánh giá chất lượng quyết định

**Mục tiêu đánh giá**

Trên 1.097 bài có kết quả đủ điều kiện, TCA đo mức bám nguồn của cơ sở bằng chứng và phần tổng hợp bất đồng; phép đo không đánh giá quyết định chấp nhận hoặc từ chối bài.

**Kết quả**

- Độ trung thực (Truthfulness) của cơ sở bằng chứng đạt **87,34%**.
- Độ trung thực (Truthfulness) của bản tổng hợp bất đồng đạt **87,11%**.
- Tỷ lệ rủi ro cao đạt **1,28%**, tương đương khoảng 14 bài trong 1.097 bài có kết quả đủ điều kiện.

**Giới hạn**

Nghiên cứu chưa đo độ đầy đủ, mức độ hữu ích theo đánh giá của Chủ tọa, thời gian đọc, độ chính xác của quyết định hoặc thiên lệch tự động hóa.

**Ranh giới sử dụng**

Chủ tọa phải đối chiếu bản tổng hợp với phản biện, phản hồi của Tác giả và nội dung thảo luận trước khi tự ghi nhận quyết định.

**Câu kết**

Kết quả TCA chỉ mô tả mức bám nguồn của bản tổng hợp; Chủ tọa vẫn chịu trách nhiệm về quyết định cuối cùng.

**Nguồn đối chiếu:** Chương 4, mục “Chair Decision Copilot”.

## Slide 27 — Chatbot Agent

**Tiêu đề**

Các kịch bản đã thử không ghi nhận vi phạm quyền truy cập; khả năng gọi công cụ của Chatbot Agent còn hạn chế

**Kết quả hội thoại**

- Bộ thử gồm **40 hội thoại** thuộc tám nhóm kịch bản.
- Rà soát thủ công hồi cứu ghi nhận **25 hội thoại đạt**, **12 đạt một phần** và **3 không đạt**.
- Trợ lý hoàn tất luồng phản hồi trong cả 40 hội thoại.

**Kết quả gọi công cụ**

- **97/128** lượt gọi công cụ thành công, tương ứng **75,78%**.
- Kết quả hội thoại và tỷ lệ gọi công cụ là hai phép đo khác nhau; không được dùng thay thế cho nhau.

**Ranh giới quyền và phạm vi**

- Thử nghiệm không ghi nhận rò rỉ dữ liệu riêng tư trong các kịch bản quyền đã thực hiện.
- Một biến thể ngoài phạm vi vẫn tạo báo cáo thị trường; một số câu trả lời trình bày lỗi truy vấn thay vì giải thích rõ ranh giới quyền.

**Giới hạn**

Bộ thử theo kịch bản không tương đương kiểm toán bảo mật hoặc kiểm thử đối kháng; phân bố 25/12/3 chỉ là bằng chứng mô tả do tư liệu chấm còn thiếu thông tin truy vết.

**Câu kết**

Chatbot Agent cần tiếp tục được kiểm tra về khả năng tuân thủ quyền truy cập, xử lý lỗi và độ tin cậy của từng công cụ backend.

**Nguồn đối chiếu:** Chương 4, mục “Chatbot Agent”.

## Slide 28 — Tính khả thi vận hành của các luồng AI

**Tiêu đề**

Độ trễ quan sát được gợi ý cách tổ chức vận hành riêng cho từng luồng AI

**Kiểm tra luật của Submission Gating**

Có thể chạy đồng bộ vì kết quả dựa trên quy tắc cố định và được dùng để chặn lỗi trước khi gửi.

**Cảnh báo nội dung của Submission Gating**

Phù hợp với xử lý song song không chặn; kết quả đến sau vẫn có thể được Tác giả xem xét.

**Các tác vụ phân tích dài**

Reviewer Initial Analysis, Review Quality Auditor và Chair Decision Copilot có trường hợp vượt 100 giây; phù hợp hơn với cơ chế chạy nền hoặc chạy trước.

**Chatbot Agent**

Thời gian đến token đầu tiên trung bình là **2,36 giây**, nhưng token đầu tiên của câu trả lời hoàn chỉnh xuất hiện sau trung bình **23,02 giây**; giao diện cần phản hồi từng phần và hiển thị trạng thái tra cứu.

**Yêu cầu vận hành rút ra**

- Chuyển tác vụ dài sang hàng đợi nền.
- Hiển thị tiến độ, lỗi và khả năng thử lại.
- Giảm số lượt gọi công cụ thất bại của Chatbot Agent.

**Giới hạn**

Đây là khuyến nghị thiết kế suy ra từ độ trễ quan sát; nghiên cứu chưa so sánh thực nghiệm các phương án triển khai.

**Nguồn đối chiếu:** Chương 4, mục “Tính khả thi vận hành”.

## Slide 29 — Kiểm thử chấp nhận của người dùng

**Tiêu đề**

UAT ghi nhận phản hồi tích cực ban đầu, nhưng mẫu lệch mạnh về nhóm Tác giả

**Cơ cấu mẫu**

- Tác giả: **76** phản hồi, chiếm **83,5%** mẫu.
- Phản biện viên: **7** phản hồi.
- Chủ tọa: **8** phản hồi theo báo cáo tổng hợp.

**Mức hài lòng tổng thể**

- Tác giả: **3,89/5**.
- Phản biện viên: **4,29/5**.
- Chủ tọa: **4,38/5**.

**Các tín hiệu chính**

- **73/91** người tham gia cho biết sẵn sàng giới thiệu nền tảng.
- **69/76 Tác giả** cảm nhận AI giúp giảm thao tác hoặc thời gian; khảo sát không đo số phút thực tế.
- Kết quả ở hai nhóm vai trò chuyên môn có độ bất định lớn do cỡ mẫu nhỏ.

**Giới hạn**

- Khảo sát sử dụng mẫu thuận tiện và một số câu hỏi gộp nhiều thành phần, nên không thể quy kết quả cho từng luồng AI riêng lẻ.
- Số liệu của nhóm Chủ tọa chưa thể được tái lập độc lập từ tệp dữ liệu thô hiện có; thống kê với mẫu số tám được giữ theo báo cáo tổng hợp nhưng chưa được xác minh độc lập.

**Câu kết**

UAT cung cấp bằng chứng cảm nhận ban đầu, không thay thế phép đo khách quan về thời gian, chất lượng quyết định hoặc hiệu quả của từng chức năng.

**Nguồn đối chiếu:** Chương 4, mục “Khảo sát người dùng”.

## Slide 30 — Mức độ của bằng chứng

**Tiêu đề**

Mức độ kết luận phụ thuộc vào loại bằng chứng của từng tác vụ

**1. Bằng chứng trực tiếp trong phạm vi thử nghiệm**

- Hiệu năng của ba đường xử lý đã chọn.
- Mức khớp siêu dữ liệu của Submission Autofill.
- Phán quyết và mã luật trong tám trường hợp kiểm tra luật của Submission Gating.

**2. Chỉ số gián tiếp**

- Phép thử leave-one-out của đối sánh dùng nhãn tác giả gốc, không phải nhãn phản biện viên phù hợp.
- TCA sử dụng NLI để đo quan hệ giữa mệnh đề và bằng chứng, chưa thay thế đánh giá chuyên gia về tính hữu ích hoặc độ đầy đủ.

**3. Bằng chứng theo kịch bản hoặc cảm nhận**

- Chatbot Agent được rà soát trên 40 hội thoại theo vai trò và phạm vi quyền.
- UAT phản ánh cảm nhận của mẫu thuận tiện có cơ cấu mất cân bằng giữa các vai trò.

**4. Nội dung chưa được xác nhận**

- Chất lượng của toàn bộ cơ chế phát hiện xung đột lợi ích đa tầng.
- Độ chính xác của quyết định học thuật.
- Khả năng vận hành dài hạn và mức độ sẵn sàng triển khai trong hội nghị thực tế.

**Câu kết**

Kết quả hiện có cho thấy tính khả thi trong các phạm vi đã thử; chúng chưa chứng minh mô hình ba lớp là tối ưu hoặc ConferenceSpace vượt trội hơn nền tảng khác.

**Nguồn đối chiếu:** Chương 4, mục “Tổng hợp kết quả và giới hạn”; Chương 1, mục “Mục tiêu đề tài”.

## Slide 31 — Kết quả đạt được

**Tiêu đề**

Kết quả đạt được

**1. Nền tảng nghiệp vụ**

Đã xây dựng các thành phần, giao diện và API cho những nghiệp vụ chính từ cấu hình hội nghị và nộp bài đến phản biện, phản hồi, thảo luận, quyết định và nộp bản hoàn thiện sau chấp nhận.

**2. Mô hình ba lớp trách nhiệm**

Đã triển khai cách phân tách giữa dữ liệu nghiệp vụ chính thức, đề xuất có thể kiểm tra lại và đầu ra AI cần người dùng xem xét.

**3. Cơ chế có thể kiểm chứng**

Đã xây dựng đối sánh phản biện và phát hiện xung đột lợi ích với điểm số, ràng buộc và căn cứ để Chủ tọa kiểm tra; chất lượng của các cơ chế này chưa được xác nhận đầy đủ.

**4. Sáu luồng AI hỗ trợ**

Đã tích hợp và đánh giá riêng các luồng tạo dữ liệu nháp, cảnh báo, bản định hướng đọc, bản rà soát, bản tổng hợp và câu trả lời theo quyền.

**5. Chuỗi bằng chứng theo tác vụ**

Đã sử dụng các nhóm bằng chứng riêng cho hiệu năng, thuật toán, đầu ra AI, Chatbot Agent và UAT, đồng thời nêu rõ trường hợp lỗi và giới hạn diễn giải.

**Câu kết**

Đề tài đã triển khai và đánh giá mô hình trong điều kiện thử nghiệm; kết quả không chứng minh mô hình tối ưu hoặc hệ thống đã sẵn sàng vận hành thực tế.

**Nguồn đối chiếu:** Chương 5, mục “Kết quả đạt được”.

## Slide 32 — Các hạn chế

**Tiêu đề**

Các hạn chế chính nằm ở dữ liệu thực tế, phương pháp đánh giá và độ tin cậy vận hành

**Dữ liệu và phương pháp đánh giá**

- Đối sánh chưa sử dụng dữ liệu phân công thực tế hoặc nhãn xác nhận của Chủ tọa; nhãn tác giả gốc chỉ là chỉ số gián tiếp về quan hệ chủ đề.
- Cơ chế phát hiện xung đột lợi ích chưa có tập cặp có và không có xung đột do chuyên gia gán nhãn để đo precision, recall và độ phủ theo từng nguồn.
- Một số đầu ra AI chưa được chuyên gia đánh giá trực tiếp; TCA sử dụng NLI chưa thay thế đánh giá về tính hữu ích, độ đầy đủ hoặc mức nghiêm trọng của lỗi.
- UAT dùng mẫu thuận tiện; Tác giả chiếm 83,5% và hai nhóm vai trò chuyên môn có cỡ mẫu nhỏ.

**Vận hành và quản trị dữ liệu**

- Kiểm thử backend mới bao phủ tải ngắn hạn trên ba đường xử lý; chưa có kiểm thử đầu cuối, chạy bền, tải phân tán hoặc chủ động gây lỗi.
- Chưa kiểm tra đầu cuối khi dịch vụ AI hết thời gian chờ hoặc ngừng hoạt động; khả năng phục hồi của toàn bộ chuỗi xử lý chưa được xác nhận.
- Một số luồng AI có trường hợp vượt 100 giây; Chatbot Agent có 31/128 lượt gọi công cụ thất bại.
- Bộ thử Chatbot Agent không tương đương kiểm toán bảo mật hoặc kiểm thử đối kháng.
- Phân quyền ở cấp ứng dụng không thay thế việc kiểm toán chính sách lưu giữ, sử dụng, xử lý và xóa dữ liệu tại nhà cung cấp AI.

**Phạm vi sản phẩm**

ConferenceSpace vẫn là nền tảng thực nghiệm; các nghiệp vụ còn thiếu tập trung ở cơ chế chọn bài phản biện, kiểm soát hạn chót và xử lý sau quyết định.

**Câu kết**

Các hạn chế này xác định phạm vi có thể kết luận và chỉ ra các điều kiện cần hoàn thiện trước khi triển khai cho hội nghị thực tế.

**Nguồn đối chiếu:** Chương 5, mục “Các hạn chế”.

## Slide 33 — Hướng phát triển

**Tiêu đề**

Hướng phát triển ưu tiên bằng chứng thực tế và độ tin cậy vận hành trước khi tăng mức tự động hóa

**Ưu tiên 1 — Bổ sung dữ liệu đánh giá có nhãn**

- Thu thập dữ liệu phân công, xác nhận của Chủ tọa và tỷ lệ chấp nhận đề xuất.
- Xây dựng tập cặp xung đột lợi ích do chuyên gia gán nhãn.
- Đánh giá các đầu ra AI gần quyết định về độ đầy đủ, mức hữu ích và ảnh hưởng đến phán đoán.
- Mở rộng UAT với mẫu cân bằng hơn, nhiệm vụ chuẩn hóa và điều kiện đối chứng không sử dụng AI.

**Ưu tiên 2 — Hoàn thiện vận hành tác vụ dài**

- Chuyển tác vụ kéo dài sang hàng đợi bất đồng bộ.
- Hiển thị tiến độ, giới hạn thời gian, số lần thử lại và trạng thái khôi phục sau lỗi.
- Liên kết nguồn dữ liệu, kết quả AI, công cụ đã gọi và quyết định của người dùng trong nhật ký kiểm toán.

**Ưu tiên 3 — Phát triển lớp truy hồi có kiểm soát**

- Quản lý nguồn, phiên bản và quyền truy cập đối với chính sách, hướng dẫn, biểu mẫu và hồ sơ chuyên môn.
- Kết hợp tìm kiếm từ khóa, siêu dữ liệu và tìm kiếm vector; mỗi câu trả lời hoặc bản tổng hợp phải kèm nguồn để người dùng kiểm tra.
- Quy định rõ cấu trúc đầu vào, quyền, cách xử lý lỗi và các kịch bản vượt quyền cho từng công cụ của Chatbot Agent.

**Ưu tiên 4 — Tăng quyền kiểm soát dữ liệu và hoàn thiện nghiệp vụ**

- Đánh giá nhà cung cấp AI theo chính sách hội nghị và điều khoản xử lý dữ liệu.
- Hoàn thiện kiểm soát hạn chót, cơ chế chọn bài phản biện và các thao tác sau quyết định.

**Câu kết**

Thứ tự ưu tiên là tăng độ tin cậy của bằng chứng, hiệu lực kiểm soát của con người và khả năng vận hành trước khi mở rộng phạm vi hoặc mức tự động hóa.

**Nguồn đối chiếu:** Chương 5, mục “Hướng phát triển trong tương lai”.

## Slide 34 — Câu hỏi và thảo luận

**Tiêu đề**

Câu hỏi và thảo luận

**ConferenceSpace**

Nghiệp vụ cốt lõi • Thuật toán xác định, có thể kiểm chứng • AI hỗ trợ có kiểm soát

**Thông điệp kết**

Giá trị chính của đề tài là tổ chức các tác vụ theo cơ chế và trách nhiệm phù hợp, đồng thời xây dựng chuỗi bằng chứng giúp phân biệt phần đã được kiểm chứng với phần cần tiếp tục đánh giá.

**Nguồn đối chiếu:** Chương 5, đoạn kết luận tổng hợp.

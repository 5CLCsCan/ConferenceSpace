# Nội dung bổ sung đề xuất cho "Đề cương lần 1"

## Mục đích

Tài liệu này cung cấp các đoạn văn gợi ý để bổ sung hoặc thay thế cho những phần còn thiếu, còn yếu, hoặc cần viết thận trọng hơn trong đề cương. Nội dung được viết theo giọng học thuật, tránh các cách diễn đạt quá mạnh như “toàn diện”, “tối ưu”, hoặc các khẳng định khó kiểm chứng.

## Lưu ý sử dụng

- Đây là nội dung gợi ý để chèn thủ công vào đề cương gốc.
- Không nhất thiết phải dùng nguyên văn toàn bộ.
- Khi chèn, nên giữ cấu trúc hiện có của file `.docx`.
- Với các nội dung AI, nên chỉ dùng cho những tính năng thực sự có yếu tố AI trong dự án.

## Nội dung bổ sung theo từng mục

### 2.1 Giới thiệu về đề tài

#### Đoạn bổ sung đề xuất về phân loại tính năng

Điểm cần lưu ý là không phải mọi cơ chế tự động trong hệ thống đều thuộc nhóm tính năng AI. Trong phạm vi đề tài này, các tính năng như đối sánh phản biện với bài báo và phát hiện xung đột lợi ích được triển khai chủ yếu theo hướng thuật toán và phân tích quan hệ dữ liệu. Cụ thể, đối sánh phản biện được xây dựng dựa trên độ tương đồng miền nghiên cứu và các ràng buộc phân công; trong khi đó, phát hiện xung đột lợi ích dựa trên khai báo của người dùng kết hợp với phân tích đồ thị đồng tác giả. Các thành phần có yếu tố AI nên được hiểu là những thành phần có sử dụng mô hình ngôn ngữ hoặc quy trình suy luận có hỗ trợ từ mô hình, chẳng hạn trợ lý hội thoại, mô-đun tóm lược hỗ trợ phản biện viên trước khi đánh giá chi tiết bài nộp, mô-đun hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định, hoặc mô-đun rà soát chất lượng nội dung phản biện.

#### Đoạn bổ sung đề xuất về mức độ hoàn thiện

Đề tài hướng đến việc xây dựng một nền tảng hỗ trợ quy trình xét duyệt bài báo với các chức năng cốt lõi cho tác giả, phản biện và chủ trì hội nghị. Tuy nhiên, ở giai đoạn hiện tại, một số chức năng nâng cao vẫn đang được phát triển hoặc mới dừng ở mức nguyên mẫu chức năng. Vì vậy, khi mô tả hệ thống, cần phân biệt giữa những thành phần đã triển khai ở mức sử dụng được và những thành phần đang được hoàn thiện thêm trong khuôn khổ đồ án.

### 2.2 Mục tiêu đề tài

#### Đoạn bổ sung đề xuất về mục tiêu tổng quát

Mục tiêu của đề tài là xây dựng một hệ thống web phục vụ quy trình xét duyệt bài báo khoa học theo hướng có cấu trúc, minh bạch và thuận tiện hơn cho các vai trò chính trong hội nghị. Hệ thống tập trung vào các bước cốt lõi như tiếp nhận bài nộp, hỗ trợ phân công phản biện, thu thập nhận xét, theo dõi tiến độ xử lý, hỗ trợ chủ trì ra quyết định, và cung cấp một số chức năng phân tích hoặc hỗ trợ có yếu tố AI ở những khâu phù hợp.

#### Đoạn bổ sung đề xuất về mục tiêu kỹ thuật không phải AI

Về mặt kỹ thuật, đề tài hướng đến việc xây dựng các cơ chế tự động hóa dựa trên thuật toán cho một số bài toán trọng yếu của quy trình xét duyệt. Trong đó, bài toán đối sánh phản biện được tiếp cận theo hướng tính độ tương đồng chuyên môn giữa phản biện và bài báo, kết hợp với các ràng buộc về tải công việc và điều kiện phân công. Bài toán phát hiện xung đột lợi ích được tiếp cận theo hướng kết hợp khai báo thủ công, kiểm tra trùng lặp quan hệ trực tiếp, và phân tích đồ thị đồng tác giả nhằm hỗ trợ việc nhận diện các trường hợp cần lưu ý trong quá trình phân công.

#### Đoạn bổ sung đề xuất về mục tiêu AI

Bên cạnh các cơ chế thuật toán nêu trên, đề tài cũng xem xét tích hợp một số chức năng có yếu tố AI tại những điểm có thể hỗ trợ người dùng tốt hơn trong quá trình làm việc. Các hướng này có thể bao gồm trợ lý hội thoại phục vụ tra cứu và điều hướng thao tác, mô-đun tóm lược hỗ trợ phản biện viên trước khi đánh giá chi tiết bài nộp, mô-đun hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định, và mô-đun rà soát chất lượng cùng tính nhất quán của nội dung phản biện trước khi nộp. Khi trình bày các mục tiêu này, nên nhấn mạnh đây là các hướng chức năng có mức độ hoàn thiện khác nhau trong quá trình phát triển hệ thống.

### 2.3 Phạm vi của đề tài

#### Đoạn bổ sung đề xuất về phạm vi chức năng

Trong phạm vi của đề tài, hệ thống tập trung vào các nghiệp vụ gắn trực tiếp với quy trình xét duyệt bài báo tại hội nghị khoa học, bao gồm quản lý hội nghị ở mức phục vụ xét duyệt, tiếp nhận bài nộp, quản lý thông tin tác giả và phản biện, hỗ trợ phân công phản biện, thu thập nội dung đánh giá, trao đổi liên quan đến bài nộp, và hỗ trợ chủ trì theo dõi trạng thái xử lý. Một số chức năng ở các giai đoạn muộn hơn của quy trình, chẳng hạn phản hồi tác giả ở mức đầy đủ hoặc xử lý camera-ready theo luồng khép kín, hiện chưa được xem là phần hoàn chỉnh trong giai đoạn này.

#### Đoạn bổ sung đề xuất về giới hạn triển khai hiện tại

Ngoài các giới hạn về dữ liệu và phụ thuộc dịch vụ ngoài, đề tài cũng có một số giới hạn triển khai cần nêu rõ. Một số bề mặt chức năng ở phía chủ trì hội nghị hiện mới dừng ở mức nguyên mẫu giao diện hoặc mới hỗ trợ một phần nghiệp vụ, ví dụ như lập lịch, một số thao tác cấu hình hội nghị, hay các hành động điều phối sâu liên quan đến COI. Bên cạnh đó, một số trạng thái mở rộng của quy trình quyết định hoặc hậu xét duyệt chưa được triển khai đầy đủ thành luồng nghiệp vụ khép kín. Việc nêu rõ các giới hạn này giúp xác định đúng phạm vi của đề tài và tránh tạo kỳ vọng vượt quá mức mà sản phẩm hiện tại có thể chứng minh.

#### Đoạn bổ sung đề xuất về ranh giới AI

Trong phạm vi đề tài, các thành phần có yếu tố AI được xem như các mô-đun hỗ trợ ở một số khâu cụ thể, thay vì là cơ chế thay thế hoàn toàn quyết định của con người. Vì vậy, AI trong hệ thống nên được đặt ở vai trò hỗ trợ phân tích, tóm tắt, hoặc cảnh báo, trong khi các quyết định nghiệp vụ quan trọng như xác nhận phân công hoặc chấp nhận/từ chối bài báo vẫn thuộc trách nhiệm của người dùng có thẩm quyền.

### 2.4 Cách tiếp cận dự kiến

#### Đoạn bổ sung đề xuất về kiến trúc dữ liệu và nghiệp vụ

Đề tài lựa chọn hướng tiếp cận kết hợp giữa cơ sở dữ liệu quan hệ và cơ sở dữ liệu đồ thị để phù hợp với đặc điểm của từng loại bài toán. Dữ liệu nghiệp vụ chính như người dùng, hội nghị, bài nộp, phân công và đánh giá được lưu trữ trong cơ sở dữ liệu quan hệ để thuận tiện cho việc quản lý trạng thái và giao dịch. Trong khi đó, các quan hệ hợp tác học thuật giữa tác giả và phản biện được mô hình hóa trên cơ sở dữ liệu đồ thị nhằm hỗ trợ việc phát hiện xung đột lợi ích và khai thác quan hệ đồng tác giả theo thời gian.

#### Đoạn bổ sung đề xuất về đối sánh phản biện

Đối với bài toán phân công phản biện, đề tài không tiếp cận theo hướng AI tạo sinh hay mô hình học máy phức tạp, mà lựa chọn một hướng thuật toán có thể giải thích được. Cụ thể, độ phù hợp giữa bài báo và phản biện được ước lượng từ mức độ tương đồng giữa các miền chuyên môn, sau đó sử dụng chiến lược gán có xét các ràng buộc như tải công việc và xung đột lợi ích. Cách tiếp cận này phù hợp với bối cảnh đồ án vì có tính minh bạch cao hơn, dễ kiểm tra, và thuận lợi cho việc hiệu chỉnh tiêu chí.

#### Đoạn bổ sung đề xuất về COI detection

Đối với bài toán phát hiện xung đột lợi ích, hệ thống được xây dựng theo hướng kết hợp nhiều lớp kiểm tra. Lớp thứ nhất là các xung đột do người dùng khai báo. Lớp thứ hai là các quan hệ trực tiếp có thể suy ra từ dữ liệu bài nộp và dữ liệu người dùng. Lớp thứ ba là phân tích quan hệ đồng tác giả trong đồ thị học thuật nhằm nhận diện thêm các trường hợp có khả năng gây ảnh hưởng đến tính khách quan của quá trình phản biện. Cách tiếp cận này thiên về kiểm tra quan hệ dữ liệu và luật nghiệp vụ, không nên trình bày như một kỹ thuật AI.

#### Đoạn bổ sung đề xuất về các mô-đun AI

Với các mô-đun có yếu tố AI, đề tài định hướng chúng theo vai trò hỗ trợ hơn là thay thế người dùng. Trợ lý hội thoại được dùng để hỗ trợ tra cứu ngữ cảnh và hướng dẫn thao tác; mô-đun tóm lược hỗ trợ phản biện viên nhằm giúp nhận diện nhanh nội dung cốt lõi của bài nộp trước khi đi vào đánh giá chi tiết; mô-đun hỗ trợ chủ trì hội nghị tập trung vào việc tổng hợp các nguồn thông tin sẵn có phục vụ quyết định; và mô-đun rà soát chất lượng phản biện hướng tới phát hiện những dấu hiệu chưa nhất quán hoặc chưa đủ căn cứ trong bản nhận xét. Các mô-đun này cần được mô tả thận trọng theo mức độ đã triển khai hoặc đang hướng tới, thay vì được xem là đã hoàn chỉnh đồng đều.

#### Đoạn bổ sung đề xuất về cách diễn đạt so sánh

So với một số nền tảng quản lý hội nghị phổ biến, hướng tiếp cận của hệ thống này chủ yếu nằm ở việc kết hợp các cơ chế hỗ trợ thuật toán và một số mô-đun hỗ trợ bằng AI trong cùng một nền tảng phát triển mới hơn. Tuy vậy, khi so sánh, nên tránh các khẳng định mang tính tuyệt đối hoặc khó kiểm chứng; thay vào đó, nên nhấn mạnh rằng đề tài thử nghiệm một hướng tích hợp nhiều lớp hỗ trợ khác nhau trong bối cảnh quy trình xét duyệt bài báo.

### 2.5 Kết quả dự kiến của đề tài

#### Đoạn bổ sung đề xuất về sản phẩm đầu ra

Sản phẩm dự kiến của đề tài là một hệ thống web hỗ trợ quy trình xét duyệt bài báo ở mức có thể minh họa và vận hành các chức năng cốt lõi cho ba vai trò chính: tác giả, phản biện và chủ trì hội nghị. Hệ thống dự kiến bao gồm các thành phần phục vụ nộp bài, theo dõi trạng thái xử lý, hỗ trợ phân công phản biện, quản lý nhận xét, theo dõi xung đột lợi ích, và một số mô-đun hỗ trợ có yếu tố AI ở các khâu phù hợp. Với các chức năng chưa đạt mức hoàn chỉnh ở giai đoạn này, kết quả nên được trình bày như phần đã xây dựng bước đầu hoặc phần đang tiếp tục được hoàn thiện trong phạm vi đồ án.

#### Đoạn bổ sung đề xuất về kết quả thuật toán

Về mặt xử lý tự động, đề tài hướng đến việc tạo ra một mô-đun gợi ý phân công phản biện dựa trên độ tương đồng chuyên môn và các ràng buộc phân công, đồng thời hỗ trợ chủ trì xem xét kết quả trước khi xác nhận. Song song với đó, hệ thống dự kiến cung cấp mô-đun phát hiện xung đột lợi ích dựa trên nhiều nguồn thông tin, bao gồm khai báo của người dùng và quan hệ đồng tác giả trong dữ liệu đồ thị. Hai nhóm chức năng này nên được trình bày như kết quả của hướng tiếp cận thuật toán và dữ liệu, không nên xếp chung vào nhóm đầu ra AI.

#### Đoạn bổ sung đề xuất về kết quả AI

Các đầu ra có yếu tố AI dự kiến tập trung vào việc hỗ trợ người dùng trong một số bước cụ thể của quy trình. Có thể kể đến trợ lý hội thoại hỗ trợ tra cứu và định hướng thao tác, mô-đun tóm lược hỗ trợ phản biện viên trước khi đánh giá chi tiết bài nộp, mô-đun hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định, và mô-đun rà soát sơ bộ chất lượng cùng tính nhất quán của phản biện. Khi nêu các đầu ra này, nên ghi nhận rõ rằng mức độ hoàn thiện của từng mô-đun có thể khác nhau, và việc đánh giá chúng cần dựa trên tiêu chí riêng cho từng loại chức năng.

#### Đoạn bổ sung đề xuất về chỉ tiêu đánh giá

Về mặt định lượng, đề tài có thể đặt ra một số chỉ tiêu đánh giá ở dạng mục tiêu thực nghiệm thay vì khẳng định kết quả chắc chắn đạt được. Chẳng hạn, có thể xem xét:

- khả năng xử lý dữ liệu của hệ thống trong một kịch bản thử nghiệm với số lượng bài nộp và phản biện ở quy mô vừa,
- thời gian cần thiết để tạo ra một danh sách gợi ý phân công phản biện so với cách thao tác thủ công,
- số lượng hoặc tỷ lệ trường hợp xung đột lợi ích được phát hiện thêm khi có sử dụng dữ liệu đồ thị,
- thời gian phản hồi của một số màn hình hoặc thao tác chính trong điều kiện thử nghiệm xác định.

Nếu dùng các chỉ tiêu này, nên trình bày kèm phương pháp đo, bộ dữ liệu thử nghiệm, và baseline so sánh.

### 2.6 Kế hoạch thực hiện

#### Đoạn bổ sung đề xuất mở đầu

Kế hoạch thực hiện được xây dựng theo từng giai đoạn, bám theo các nhóm công việc chính của hệ thống, đồng thời có sự phân công giữa các thành viên theo thế mạnh tương đối về backend, frontend, dữ liệu và tích hợp AI. Cách tổ chức này nhằm giúp việc phát triển diễn ra có kiểm soát hơn, đồng thời thuận lợi cho việc theo dõi tiến độ và đánh giá kết quả ở từng mốc.

#### Nội dung đề xuất cho phần “Phân công vai trò thành viên”

Nhóm có thể phân công theo hướng tương đối như sau:

- Một thành viên tập trung nhiều hơn vào hạ tầng backend, mô hình dữ liệu, API và xử lý trạng thái nghiệp vụ.
- Một thành viên tập trung nhiều hơn vào frontend, tổ chức giao diện theo vai trò và trải nghiệm sử dụng cho các luồng chính.
- Một thành viên phụ trách nhiều hơn cho các bài toán dữ liệu như đối sánh phản biện, COI detection và kiểm thử liên quan.
- Một thành viên phụ trách tích hợp các mô-đun AI, xây dựng prompt, tổ chức workflow và đánh giá đầu ra.
- Một thành viên đóng vai trò kết nối giữa các phần, hỗ trợ kiểm thử tích hợp, tài liệu hóa và hoàn thiện luồng nghiệp vụ đầu-cuối.

Trong quá trình thực hiện, phân công này có thể được điều chỉnh theo tiến độ thực tế của từng giai đoạn.

#### Nội dung đề xuất cho phần “Kế hoạch theo giai đoạn”

**Giai đoạn 1: Khảo sát và xác định phạm vi**  
Trong giai đoạn này, nhóm tập trung khảo sát các hệ thống quản lý hội nghị hiện có, xác định các chức năng cốt lõi cần ưu tiên, phân biệt rõ các chức năng nghiệp vụ, chức năng thuật toán và chức năng AI, đồng thời thống nhất kiến trúc tổng quát của hệ thống.

**Giai đoạn 2: Xây dựng nền tảng nghiệp vụ cốt lõi**  
Nhóm triển khai các thành phần chính của hệ thống như quản lý người dùng theo vai trò, tạo và quản lý hội nghị, nộp bài, quản lý phản biện, lưu trữ đánh giá và hiển thị trạng thái xử lý. Đây là giai đoạn tạo nền cho các chức năng nâng cao về sau.

**Giai đoạn 3: Xây dựng các mô-đun hỗ trợ thuật toán**  
Sau khi các luồng nghiệp vụ cốt lõi ổn định ở mức cơ bản, nhóm tiếp tục triển khai hoặc hoàn thiện mô-đun gợi ý phân công phản biện và mô-đun phát hiện xung đột lợi ích dựa trên đồ thị. Mục tiêu của giai đoạn này là bổ sung khả năng hỗ trợ người điều phối hội nghị trong các bài toán mất thời gian nếu làm thủ công.

**Giai đoạn 4: Tích hợp các mô-đun AI**  
Trên nền dữ liệu và luồng nghiệp vụ đã có, nhóm tiến hành tích hợp các mô-đun AI phục vụ hỗ trợ hội thoại, tóm lược hỗ trợ phản biện viên trước khi đánh giá chi tiết bài nộp, hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định, và rà soát chất lượng nội dung phản biện. Các mô-đun này được phát triển với định hướng hỗ trợ người dùng, không thay thế quyết định nghiệp vụ.

**Giai đoạn 5: Kiểm thử, đánh giá và hoàn thiện báo cáo**  
Ở giai đoạn cuối, nhóm tiến hành kiểm thử tích hợp, đánh giá theo các tiêu chí đã đề ra, rà soát các giới hạn còn tồn tại, hoàn thiện tài liệu kỹ thuật và báo cáo đồ án.

#### Nội dung đề xuất cho phần “Phân công công việc theo giai đoạn”

Trong từng giai đoạn, công việc có thể được phân chia theo cấu trúc sau:

- Giai đoạn khảo sát: cùng tham gia thu thập tài liệu, tổng hợp yêu cầu, thống nhất phạm vi.
- Giai đoạn xây dựng nền tảng cốt lõi: ưu tiên song song giữa backend và frontend.
- Giai đoạn thuật toán: tập trung vào matching, COI, dữ liệu hỗ trợ và kiểm thử.
- Giai đoạn AI: tập trung vào xây dựng workflow, prompt, API tích hợp và đánh giá đầu ra.
- Giai đoạn hoàn thiện: cùng tham gia kiểm thử hệ thống, đối chiếu với mục tiêu đề tài, chỉnh lý báo cáo và chuẩn bị bảo vệ.

#### Đoạn bổ sung đề xuất về mốc kiểm tra

Để giảm rủi ro trễ tiến độ, sau mỗi giai đoạn nên có một mốc kiểm tra nội bộ nhằm xác nhận:

- phần chức năng nào đã có thể trình diễn,
- phần nào mới dừng ở mức thiết kế hoặc nguyên mẫu,
- các phụ thuộc bên ngoài nào còn ảnh hưởng,
- những rủi ro nào cần điều chỉnh sớm ở giai đoạn tiếp theo.

#### Đoạn bổ sung đề xuất về rủi ro

Một số rủi ro có thể phát sinh trong quá trình thực hiện gồm có:

- dữ liệu học thuật bên ngoài không đồng đều về độ phủ,
- phụ thuộc vào dịch vụ mô hình ngôn ngữ có thể ảnh hưởng đến tính ổn định hoặc chi phí,
- chênh lệch giữa giao diện dự kiến và mức độ hoàn tất của backend,
- khó khăn trong việc đánh giá khách quan hiệu quả của các mô-đun AI.

Nhóm dự kiến giảm rủi ro bằng cách ưu tiên hoàn thiện các luồng cốt lõi trước, giữ ranh giới rõ giữa tính năng cốt lõi và tính năng hỗ trợ, và sử dụng các tiêu chí đánh giá có thể kiểm tra được.

### Tài liệu tham khảo

#### Đoạn bổ sung đề xuất về hướng mở rộng tài liệu

Ngoài các tài liệu về hệ thống quản lý hội nghị, peer review và công nghệ nền hiện đã liệt kê, nhóm dự kiến bổ sung thêm tài liệu tham khảo cho các chủ đề sau:

- kiến trúc trợ lý hội thoại và agent sử dụng mô hình ngôn ngữ,
- các nghiên cứu hoặc bài viết kỹ thuật liên quan đến hỗ trợ ra quyết định trong quy trình xét duyệt,
- các hướng tiếp cận đánh giá chất lượng nhận xét hoặc phát hiện sự thiếu nhất quán trong phản biện,
- các hướng tiếp cận kiểm tra tuân thủ tài liệu nộp có kết hợp trích xuất nội dung và mô hình ngôn ngữ.

Việc bổ sung này nhằm giúp phần trình bày về các mô-đun AI có cơ sở học thuật và kỹ thuật rõ hơn, đồng thời tránh tình trạng phần công nghệ AI trong đề tài mạnh hơn phần tài liệu tham khảo hiện có.

## Gợi ý ngắn khi chèn vào đề cương

- Với `2.1` và `2.2`: ưu tiên sửa ranh giới AI và hạ mức khẳng định.
- Với `2.3`: nên thêm một đoạn giới hạn triển khai hiện tại.
- Với `2.4`: nên sửa cụm “bằng AI” ở reviewer matching và COI detection.
- Với `2.5`: nên chuyển các câu định lượng sang dạng mục tiêu đánh giá.
- Với `2.6`: nên điền nội dung thực chất càng sớm càng tốt, vì đây là phần thể hiện tính khả thi của đề tài.

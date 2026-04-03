# ĐỀ CƯƠNG THỰC TẬP DỰ ÁN TỐT NGHIỆP

## HỆ THỐNG HỖ TRỢ XÉT DUYỆT BÀI BÁO KHOA HỌC

_(Scientific Paper Review Support System)_

## 1. THÔNG TIN CHUNG

**Người hướng dẫn:**

- ThS. Hồ Thị Hoàng Vy (Khoa Công nghệ Thông tin)
- PGS.TS. Lê Nguyễn Hoài Nam (Khoa Công nghệ Thông tin)

**Nhóm sinh viên thực hiện:**

1. Cao Hữu Khương Duy (MSSV: 22127083)
2. Nhâm Đức Huy (MSSV: 22127158)
3. Võ Minh Khôi (MSSV: 22127213)
4. Từ Chí Tiến (MSSV: 22127414)
5. Nguyễn Ngọc Anh Tú (MSSV: 22127433)

**Loại đề tài:** Ứng dụng  
**Thời gian thực hiện:** Từ 10/2025 đến 06/2026

## 2. NỘI DUNG THỰC HIỆN

### 2.1 Giới thiệu về đề tài

Trong những năm gần đây, quy trình xét duyệt bài báo tại các hội nghị khoa học không chỉ tăng về khối lượng mà còn tăng về độ phức tạp. Mỗi quyết định phân công và mỗi quyết định chấp nhận hay từ chối bài báo đều phụ thuộc vào nhiều lớp thông tin khác nhau: mức độ phù hợp chuyên môn giữa bài báo và phản biện, nguy cơ xung đột lợi ích, tiến độ hoàn thành đánh giá, chất lượng lập luận trong bản nhận xét, và khả năng tổng hợp thông tin của người điều phối hội nghị. Vì vậy, bài toán đặt ra không đơn thuần là lưu trữ dữ liệu hay tổ chức biểu mẫu, mà là hỗ trợ một quá trình ra quyết định có nhiều ràng buộc, nhiều trạng thái trung gian và nhiều nguồn thông tin phân tán.

Các hệ thống như EasyChair, HotCRP và Microsoft CMT đã thiết lập được bộ khung nghiệp vụ cơ bản cho hoạt động quản lý hội nghị. Tuy nhiên, khi nhìn từ góc độ vận hành, vẫn còn một số điểm đáng quan tâm: người dùng thường phải di chuyển giữa nhiều bề mặt thông tin để nắm ngữ cảnh của một bài nộp; việc phân công phản biện đòi hỏi xử lý đồng thời chuyên môn, tải công việc và xung đột lợi ích; và ở các khâu cần đọc nhiều thông tin như phản biện hay ra quyết định, nhu cầu hỗ trợ tóm lược, đối chiếu và kiểm tra tính nhất quán ngày càng rõ hơn. Đây là khoảng trống mà đề tài muốn tập trung khai thác.

Từ bối cảnh đó, nhóm đề xuất xây dựng ConferenceSpace, một hệ thống hỗ trợ xét duyệt bài báo khoa học dưới dạng ứng dụng web. Hệ thống được tổ chức quanh ba vai trò chính gồm tác giả, phản biện và chủ trì hội nghị. Về mặt nghiệp vụ, hệ thống tập trung vào các khâu cốt lõi của vòng đời xét duyệt, gồm tiếp nhận bài nộp, theo dõi trạng thái xử lý, tổ chức phân công phản biện, thu thập và quản lý đánh giá, hỗ trợ trao đổi liên quan đến bài báo, và hỗ trợ chủ trì hội nghị quan sát toàn bộ tiến trình trước khi đưa ra quyết định.

Một điểm quan trọng của đề tài là phân biệt rõ giữa tự động hóa bằng thuật toán và hỗ trợ bằng AI. Cơ chế gợi ý phân công phản biện và cơ chế phát hiện xung đột lợi ích trong hệ thống được xây dựng theo hướng thuật toán và phân tích quan hệ dữ liệu; bản chất của chúng là các cơ chế có thể giải thích được và không nên xem là tính năng AI. Trong khi đó, các thành phần như trợ lý hội thoại hỗ trợ tra cứu ngữ cảnh, quy trình kiểm tra tài liệu nộp trước khi tiếp nhận, mô-đun tóm lược hỗ trợ phản biện viên, mô-đun hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định, và mô-đun rà soát chất lượng phản biện mới là các hướng có yếu tố AI được đưa vào nghiên cứu.

Ý nghĩa của đề tài nằm ở việc xây dựng một hệ thống trong đó ba lớp hỗ trợ được đặt cạnh nhau nhưng không bị trộn lẫn: lớp nghiệp vụ cốt lõi để tổ chức quy trình xét duyệt; lớp thuật toán để xử lý các bài toán có thể giải thích được như gợi ý phân công và phát hiện xung đột lợi ích; và lớp AI để hỗ trợ những khâu mà người dùng cần đọc, tóm lược hoặc đối chiếu nhiều thông tin. Cách tổ chức này giúp đề tài không chỉ dừng ở việc xây dựng phần mềm, mà còn đặt ra một khung thử nghiệm tương đối rõ cho việc đánh giá vai trò thực tế của từng lớp hỗ trợ trong quy trình xét duyệt bài báo.

### 2.2 Mục tiêu đề tài

#### Tại sao cần thực hiện đề tài này?

Quy trình xét duyệt bài báo tại hội nghị khoa học thường gặp một số khó khăn sau:

- Việc phân công phản biện đòi hỏi xem xét đồng thời nhiều yếu tố như chuyên môn, tải công việc và xung đột lợi ích, nên nếu làm thủ công sẽ tốn thời gian và dễ thiếu nhất quán.
- Việc phát hiện xung đột lợi ích thường không thể chỉ dựa vào khai báo chủ quan, mà cần thêm cơ chế đối chiếu dữ liệu và quan hệ học thuật.
- Người dùng ở các vai trò khác nhau phải xử lý nhiều thông tin phân tán theo từng bài nộp, từng đợt đánh giá và từng mốc thời gian, nên cần có công cụ hỗ trợ tổng hợp và định hướng thao tác.
- Một số nền tảng hiện có đáp ứng tốt nghiệp vụ cốt lõi, nhưng chưa phải lúc nào cũng tạo điều kiện thuận lợi cho việc thử nghiệm thêm các mô-đun hỗ trợ mới, đặc biệt là các mô-đun có yếu tố AI.

#### Đề tài hướng đến những kết quả nào?

Đề tài hướng đến xây dựng một hệ thống web hỗ trợ quy trình xét duyệt bài báo với bốn nhóm mục tiêu chính sau:

- **Mục tiêu hệ thống:** xây dựng các luồng nghiệp vụ cốt lõi cho tác giả, phản biện và chủ trì hội nghị, bao gồm nộp bài, quản lý bài nộp, theo dõi đánh giá, trao đổi, thông báo, và hỗ trợ quyết định ở mức phù hợp với phạm vi đồ án.
- **Mục tiêu thuật toán:** xây dựng cơ chế gợi ý phân công phản biện dựa trên độ tương đồng chuyên môn và các ràng buộc nghiệp vụ như tải công việc và xung đột lợi ích; đồng thời xây dựng cơ chế phát hiện xung đột lợi ích theo hướng kết hợp khai báo của người dùng, kiểm tra quan hệ trực tiếp, và phân tích quan hệ đồng tác giả trên cơ sở dữ liệu đồ thị.
- **Mục tiêu hỗ trợ bằng AI:** tích hợp các mô-đun có yếu tố AI ở những khâu cần xử lý nhiều thông tin, bao gồm hỗ trợ hội thoại, rà soát tài liệu nộp trước khi tiếp nhận, tóm lược hỗ trợ phản biện viên trước khi đánh giá chi tiết bài nộp, hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định, và rà soát chất lượng cùng tính nhất quán của nội dung phản biện.
- **Mục tiêu đánh giá:** quan sát và đánh giá mức độ hữu ích của từng lớp hỗ trợ trong quy trình xét duyệt, thay vì chỉ dừng ở việc triển khai chức năng. Điều này bao gồm đánh giá khả năng tổ chức nghiệp vụ, mức độ sử dụng được của cơ chế thuật toán, và giá trị hỗ trợ của các mô-đun AI trong các tình huống sử dụng cụ thể.

#### Ảnh hưởng và ý nghĩa của kết quả

Ý nghĩa của kết quả không chỉ nằm ở việc có thêm một hệ thống quản lý hội nghị, mà ở việc làm rõ một câu hỏi thực tiễn hơn: trong quy trình xét duyệt bài báo, chức năng nào nên được giải quyết bằng tổ chức nghiệp vụ, chức năng nào nên được giải quyết bằng thuật toán có thể giải thích, và chức năng nào mới thực sự phù hợp để đưa AI vào hỗ trợ. Nếu làm rõ được ranh giới này, đề tài có thể cung cấp một cách nhìn chặt chẽ hơn về việc tích hợp các lớp hỗ trợ khác nhau vào quy trình xét duyệt mà không làm suy giảm tính minh bạch và trách nhiệm của người ra quyết định.

### 2.3 Phạm vi của đề tài

#### Đối tượng nghiên cứu

- Quy trình xét duyệt bài báo tại hội nghị khoa học.
- Ba vai trò chính trong hệ thống gồm tác giả, phản biện và chủ trì hội nghị.
- Bài toán gợi ý phân công phản biện dựa trên mức độ phù hợp chuyên môn và các ràng buộc nghiệp vụ.
- Bài toán phát hiện xung đột lợi ích giữa tác giả và phản biện.
- Khả năng đưa một số mô-đun hỗ trợ bằng AI vào những bước có nhiều thông tin cần xử lý.

#### Nội dung nghiên cứu chính

- Xây dựng hệ thống quản lý hội nghị trực tuyến phục vụ các khâu chính của quy trình xét duyệt.
- Thiết kế cơ chế gợi ý phân công phản biện dựa trên dữ liệu chuyên môn và ràng buộc phân công.
- Xây dựng cơ chế phát hiện xung đột lợi ích dựa trên kết hợp dữ liệu quan hệ và dữ liệu đồ thị.
- Tích hợp trợ lý hội thoại hỗ trợ tra cứu ngữ cảnh và điều hướng thao tác trong hệ thống.
- Xây dựng quy trình kiểm tra tài liệu nộp trước khi tiếp nhận ở mức hỗ trợ, làm nền cho việc chuẩn hóa đầu vào.
- Xây dựng mô-đun tóm lược hỗ trợ phản biện viên trước khi đánh giá chi tiết bài nộp.
- Xây dựng mô-đun hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định.
- Xây dựng mô-đun rà soát chất lượng và tính nhất quán của nội dung phản biện trước khi nộp.

#### Giới hạn và ràng buộc

- Đề tài tập trung vào quy trình xét duyệt bài báo, không đi sâu vào các nghiệp vụ quản lý sự kiện hội nghị như đăng ký tham dự, tổ chức phiên trình bày, hoặc vận hành chương trình hội nghị đầy đủ.
- Các dữ liệu học thuật bên ngoài có thể không đồng đều về độ phủ giữa các lĩnh vực nghiên cứu.
- Các mô-đun có yếu tố AI phụ thuộc vào dịch vụ mô hình ngôn ngữ bên ngoài, vì vậy có thể chịu ảnh hưởng bởi độ ổn định, giới hạn sử dụng và chi phí.
- Một số chức năng trong hệ thống hiện vẫn đang được hoàn thiện thêm, chẳng hạn chức năng lập lịch hiện mới chủ yếu phục vụ minh họa giao diện, một số thao tác cấu hình nâng cao ở phía chủ trì hội nghị chưa đầy đủ, và các thao tác điều phối sâu liên quan đến xung đột lợi ích chưa hình thành thành một luồng nghiệp vụ hoàn chỉnh.
- Các luồng mở rộng sau xét duyệt, bao gồm một số trạng thái quyết định mở rộng và xử lý hậu xét duyệt, chưa được triển khai thành quy trình khép kín.
- Đề tài không đặt mục tiêu nghiên cứu mô hình học máy như một bài toán độc lập, mà tập trung vào việc tích hợp các mô-đun hỗ trợ vào một quy trình nghiệp vụ cụ thể và đánh giá vai trò của chúng trong bối cảnh sử dụng thực tế.

### 2.4 Cách tiếp cận dự kiến

#### Tổng quan các nghiên cứu và hệ thống liên quan

EasyChair, HotCRP và Microsoft CMT là các nền tảng thường được nhắc đến trong bối cảnh quản lý hội nghị khoa học. Các hệ thống này đã hình thành những nghiệp vụ cơ bản như tạo hội nghị, nhận bài, phân công phản biện và tổng hợp đánh giá. Bên cạnh đó, nhiều nghiên cứu về peer review đã đi sâu vào các vấn đề như mức độ phù hợp giữa bài báo và phản biện, tính công bằng trong phân công, hay khả năng tổ chức quy trình đánh giá theo hướng nhất quán hơn.

Điểm mà đề tài này quan tâm không phải là lặp lại toàn bộ phạm vi của các nền tảng đó, mà là thử xây dựng một hệ thống trong đó bài toán xét duyệt được nhìn như một bài toán nhiều lớp: lớp tổ chức nghiệp vụ, lớp tính toán và so khớp dựa trên dữ liệu, và lớp hỗ trợ tổng hợp thông tin. Từ góc nhìn này, giá trị của hệ thống không chỉ nằm ở số lượng chức năng, mà ở cách các lớp hỗ trợ được đặt đúng chỗ và giữ đúng vai trò của mình.

#### Phương pháp và hướng tiếp cận của đề tài

**Về kiến trúc hệ thống**  
Hệ thống được xây dựng theo hướng phân tách giữa lớp nghiệp vụ cốt lõi và lớp hỗ trợ. Cách tổ chức này có hai mục đích. Thứ nhất, các luồng chính như nộp bài, quản lý phản biện, theo dõi trạng thái và quyết định cần có hành vi ổn định, kiểm tra được và không phụ thuộc trực tiếp vào các mô-đun hỗ trợ. Thứ hai, các cơ chế hỗ trợ bằng AI cần được đặt ở vị trí có thể bổ sung giá trị cho quy trình mà không làm thay đổi thẩm quyền nghiệp vụ của người dùng.

**Về tổ chức dữ liệu**  
Đề tài sử dụng kết hợp cơ sở dữ liệu quan hệ và cơ sở dữ liệu đồ thị. Việc lựa chọn kiến trúc dữ liệu kép không nhằm làm hệ thống phức tạp hơn về mặt hình thức, mà xuất phát từ bản chất khác nhau của hai nhóm bài toán. Dữ liệu nghiệp vụ như người dùng, hội nghị, bài nộp, đánh giá và trạng thái xử lý phù hợp với mô hình quan hệ. Trong khi đó, bài toán phát hiện xung đột lợi ích lại dựa nhiều vào việc truy vết và suy luận trên quan hệ hợp tác học thuật, nên phù hợp hơn với mô hình đồ thị.

**Về gợi ý phân công phản biện**  
Đề tài tiếp cận bài toán phân công phản biện theo hướng thuật toán, không xem đây là một mô-đun AI. Lý do của lựa chọn này là bài toán phân công trong bối cảnh hội nghị không chỉ yêu cầu tạo ra một kết quả “có vẻ hợp lý”, mà còn cần giải thích được vì sao một phản biện được gợi ý cho một bài báo cụ thể, và vì sao một số trường hợp phải bị loại trừ. Mức độ phù hợp giữa bài báo và phản biện được ước lượng từ độ tương đồng miền nghiên cứu, sau đó kết hợp với các ràng buộc về tải công việc, số lượng phản biện cần thiết và điều kiện xung đột lợi ích. Cách tiếp cận này phù hợp hơn với yêu cầu minh bạch trong quá trình điều phối hội nghị.

**Về phát hiện xung đột lợi ích**  
Hệ thống xây dựng cơ chế phát hiện xung đột lợi ích theo nhiều lớp, gồm khai báo của người dùng, kiểm tra quan hệ trực tiếp có thể suy ra từ dữ liệu bài nộp, và phân tích quan hệ đồng tác giả trong đồ thị học thuật. Điểm quan trọng ở đây là đề tài xem xung đột lợi ích như một bài toán kiểm tra quan hệ và ràng buộc, không phải bài toán suy luận bằng AI. Cách tiếp cận này giúp việc giải thích kết quả rõ hơn và giảm nguy cơ người dùng hiểu sai bản chất của cảnh báo mà hệ thống đưa ra.

**Về các mô-đun có yếu tố AI**  
Các mô-đun AI trong đề tài được định hướng theo vai trò hỗ trợ, và mỗi mô-đun chỉ nên can thiệp vào một loại nhu cầu tương đối rõ. Trợ lý hội thoại hỗ trợ người dùng tra cứu ngữ cảnh và điều hướng thao tác trong hệ thống. Quy trình kiểm tra tài liệu nộp trước khi tiếp nhận được dùng để rà soát sơ bộ bài nộp trước khi nó đi sâu vào quy trình phản biện chính thức. Mô-đun tóm lược hỗ trợ phản biện viên nhằm rút ngắn thời gian tiếp cận ban đầu đối với bài nộp, đặc biệt khi phản biện viên cần nắm nhanh cấu trúc và các luận điểm chính trước khi đọc sâu. Mô-đun hỗ trợ chủ trì hội nghị nhằm tổng hợp những thông tin liên quan đến bài nộp, đánh giá và trao đổi thành một bức tranh cô đọng hơn để hỗ trợ việc xem xét quyết định. Mô-đun rà soát chất lượng phản biện được dùng để phát hiện những dấu hiệu có thể cho thấy nội dung phản biện chưa đủ nhất quán, chưa đủ căn cứ, hoặc chưa bao quát được các khía cạnh cơ bản của bài nộp.

**Về nguyên tắc triển khai AI**  
Đề tài đặt ra một nguyên tắc xuyên suốt: AI chỉ tham gia vào các khâu hỗ trợ đọc, hỗ trợ tổng hợp và hỗ trợ rà soát; AI không thay thế các quyết định nghiệp vụ quan trọng. Những quyết định như xác nhận phân công, lựa chọn phản biện hay chấp nhận và từ chối bài báo vẫn thuộc về người dùng có thẩm quyền. Nguyên tắc này giúp giữ ranh giới giữa công cụ hỗ trợ và thẩm quyền học thuật.

#### Điểm nhấn của hướng tiếp cận

Điểm nhấn của đề tài không nằm ở việc theo đuổi các khẳng định quá rộng về tính mới, mà ở việc thử nghiệm một cấu trúc hệ thống trong đó:

- lớp nghiệp vụ cốt lõi được triển khai rõ ràng theo vai trò,
- lớp thuật toán hỗ trợ xử lý các bài toán có thể giải thích được,
- và lớp AI được đưa vào như công cụ hỗ trợ ở những điểm phù hợp của quy trình.

### 2.5 Kết quả dự kiến của đề tài

#### Sản phẩm đầu ra

Kết quả dự kiến của đề tài không chỉ là một hệ thống web có thể vận hành một số luồng nghiệp vụ, mà còn là một tập hợp đầu ra theo ba lớp: đầu ra hệ thống, đầu ra thuật toán và đầu ra hỗ trợ bằng AI. Cụ thể, hệ thống hướng đến các thành phần chính sau:

- giao diện và luồng thao tác cho tác giả, phản biện và chủ trì hội nghị,
- các chức năng cốt lõi liên quan đến nộp bài, quản lý đánh giá và theo dõi trạng thái xử lý,
- mô-đun gợi ý phân công phản biện dựa trên độ tương đồng chuyên môn và ràng buộc nghiệp vụ,
- mô-đun phát hiện xung đột lợi ích dựa trên khai báo và dữ liệu đồ thị,
- trợ lý hội thoại hỗ trợ tra cứu và điều hướng thao tác,
- quy trình kiểm tra tài liệu nộp trước khi tiếp nhận ở mức hỗ trợ,
- mô-đun tóm lược hỗ trợ phản biện viên trước khi đánh giá chi tiết bài nộp,
- mô-đun hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ ra quyết định,
- mô-đun rà soát chất lượng và tính nhất quán của nội dung phản biện.

Ngoài sản phẩm phần mềm, đề tài còn hướng đến các đầu ra mang tính phân tích và đánh giá, bao gồm mô tả kiến trúc hệ thống, mô tả cơ chế gợi ý phân công phản biện, mô tả cơ chế phát hiện xung đột lợi ích, và quan sát thực nghiệm đối với các mô-đun hỗ trợ bằng AI. Như vậy, giá trị của đề tài không chỉ nằm ở việc hệ thống có những chức năng nào, mà còn ở việc có thể chỉ ra rõ từng chức năng thuộc lớp đóng góp nào và được đánh giá theo tiêu chí nào.

#### Kết quả định lượng dự kiến

Về mặt đánh giá, đề tài hướng đến việc xác định một số chỉ tiêu thực nghiệm như:

- thời gian cần thiết để tạo ra danh sách gợi ý phân công phản biện trong một kịch bản thử nghiệm cụ thể,
- số trường hợp xung đột lợi ích được phát hiện thông qua phân tích quan hệ dữ liệu so với chỉ dựa vào khai báo thủ công,
- khả năng hỗ trợ người dùng tiếp cận nhanh thông tin liên quan đến bài nộp thông qua các mô-đun tóm lược, tổng hợp và rà soát,
- thời gian phản hồi của một số thao tác chính trong điều kiện thử nghiệm xác định.

Các chỉ tiêu này được xem là mục tiêu đánh giá và cần đi kèm kịch bản đo, dữ liệu thử nghiệm và tiêu chí so sánh cụ thể. Điểm quan trọng là đề tài không giả định trước rằng mọi mô-đun hỗ trợ đều mang lại hiệu quả như nhau; ngược lại, từng mô-đun cần được xem xét trong đúng ngữ cảnh sử dụng của nó.

#### Ý nghĩa của kết quả

Nếu đạt được các mục tiêu ở mức phù hợp, kết quả của đề tài có thể cho thấy:

- khả năng tổ chức một quy trình xét duyệt bài báo theo cấu trúc rõ hơn,
- khả năng sử dụng thuật toán để hỗ trợ các bài toán mang tính lặp lại hoặc cần so sánh nhiều trường hợp,
- và khả năng tích hợp các mô-đun AI vào quy trình xét duyệt theo hướng hỗ trợ, thay vì làm thay vai trò của người dùng.

### 2.6 Kế hoạch thực hiện

#### Phân công vai trò thành viên

Nhóm dự kiến phân công công việc theo hướng tương đối như sau:

- một thành viên tập trung nhiều hơn vào backend, mô hình dữ liệu và xử lý nghiệp vụ,
- một thành viên tập trung nhiều hơn vào frontend và tổ chức giao diện theo vai trò,
- một thành viên tập trung nhiều hơn vào các bài toán thuật toán như gợi ý phân công phản biện và phát hiện xung đột lợi ích,
- một thành viên tập trung nhiều hơn vào tích hợp các mô-đun có yếu tố AI và đánh giá đầu ra của chúng,
- một thành viên hỗ trợ kiểm thử tích hợp, tài liệu hóa và phối hợp giữa các phần.

Việc phân công này có thể được điều chỉnh theo tiến độ thực tế của từng giai đoạn.

#### Kế hoạch theo giai đoạn

**Giai đoạn 1: Khảo sát và xác định phạm vi**  
Nhóm khảo sát tài liệu, đối chiếu các hệ thống liên quan, xác định phạm vi đề tài, và thống nhất kiến trúc tổng quát của hệ thống.

**Giai đoạn 2: Xây dựng các chức năng cốt lõi**  
Nhóm triển khai các thực thể và luồng nghiệp vụ chính như người dùng, hội nghị, bài nộp, phản biện, theo dõi trạng thái và thông báo.

**Giai đoạn 3: Xây dựng các mô-đun hỗ trợ bằng thuật toán**  
Nhóm triển khai và kiểm thử cơ chế gợi ý phân công phản biện cùng cơ chế phát hiện xung đột lợi ích trên dữ liệu quan hệ và dữ liệu đồ thị.

**Giai đoạn 4: Tích hợp các mô-đun có yếu tố AI**  
Nhóm triển khai hoặc hoàn thiện trợ lý hội thoại, quy trình kiểm tra tài liệu nộp trước khi tiếp nhận, mô-đun tóm lược hỗ trợ phản biện viên, mô-đun hỗ trợ chủ trì hội nghị tổng hợp thông tin phục vụ quyết định, và mô-đun rà soát chất lượng phản biện.

**Giai đoạn 5: Kiểm thử, đánh giá và hoàn thiện báo cáo**  
Nhóm tiến hành kiểm thử tích hợp, đánh giá các chức năng theo tiêu chí đã đề ra, rà soát các giới hạn còn tồn tại, và hoàn thiện báo cáo đồ án.

#### Công việc theo giai đoạn

Trong từng giai đoạn, công việc được tổ chức theo hướng:

- song song giữa backend và frontend ở các luồng nghiệp vụ cốt lõi để tránh tình trạng một phía hoàn thiện nhưng phía còn lại chưa có dữ liệu hoặc chưa có giao diện sử dụng;
- triển khai các mô-đun thuật toán sau khi mô hình dữ liệu và trạng thái nghiệp vụ đã đủ ổn định để tránh việc phải điều chỉnh liên tục tiêu chí hoặc cấu trúc đầu vào;
- tích hợp các mô-đun AI khi luồng dữ liệu, quyền truy cập và ngữ cảnh sử dụng đã rõ, nhằm bảo đảm rằng AI chỉ được đặt vào những điểm thật sự cần hỗ trợ;
- kiểm thử định kỳ sau mỗi cụm chức năng để tách rõ lỗi nghiệp vụ, lỗi dữ liệu, lỗi giao diện và sai lệch trong đầu ra của các mô-đun hỗ trợ.

#### Mốc kiểm tra

Sau mỗi giai đoạn, nhóm dự kiến tự đánh giá theo các câu hỏi sau:

- chức năng nào đã có thể trình diễn theo đúng luồng nghiệp vụ,
- chức năng nào mới dừng ở mức nguyên mẫu hoặc chỉ mới có giao diện,
- đầu ra của các mô-đun thuật toán và mô-đun AI đã có thể giải thích được đến đâu,
- phụ thuộc bên ngoài nào còn ảnh hưởng đến tiến độ hoặc độ ổn định,
- vấn đề kỹ thuật nào cần điều chỉnh trước khi chuyển sang giai đoạn tiếp theo.

#### Rủi ro và hướng xử lý

Một số rủi ro có thể phát sinh trong quá trình thực hiện gồm:

- dữ liệu học thuật ngoài hệ thống không đồng đều về độ phủ,
- phụ thuộc vào dịch vụ mô hình ngôn ngữ có thể ảnh hưởng tới độ ổn định hoặc chi phí,
- chênh lệch tiến độ giữa frontend, backend và các mô-đun AI,
- khó khăn trong việc đánh giá khách quan hiệu quả thực tế của các mô-đun hỗ trợ.

Để giảm bớt các rủi ro này, nhóm dự kiến ưu tiên hoàn thiện các luồng nghiệp vụ cốt lõi trước, giữ ranh giới rõ giữa thành phần cốt lõi và thành phần hỗ trợ, xây dựng tiêu chí kiểm thử sớm cho từng nhóm chức năng, và đánh giá riêng từng mô-đun AI theo đúng mục đích sử dụng thay vì xem chúng như một khối chức năng đồng nhất.

## TÀI LIỆU THAM KHẢO

[1] EasyChair, “EasyChair – Smart CFP: Conference management system.” https://easychair.org/.

[2] E. Kohler, “HotCRP: Paper review software.” https://hotcrp.com/.

[3] Microsoft, “Microsoft CMT: Conference management toolkit.” https://cmt3.research.microsoft.com/.

[4] Semantic Scholar, “Semantic Scholar – Research tool.” https://www.semanticscholar.org/.

[5] Neo4j, Inc., “Neo4j graph database platform.” https://neo4j.com/.

[6] L. Charlin and R. S. Zemel, “The Toronto Paper Matching System: An automated paper-reviewer assignment system,” in Proc. ICML Workshop on Peer Reviewing and Publishing Models, 2013.

[7] N. B. Shah, “An overview of challenges, algorithms, and empirical studies in peer review,” arXiv preprint arXiv:2112.09604, 2021.

[8] I. Stelmakh, N. B. Shah, and A. Singh, “PeerReview4All: Fair and accurate reviewer assignment in peer review,” in Proc. 30th International Conference on Algorithmic Learning Theory (ALT), 2019, pp. 828–856.

[9] Next.js, “Next.js by Vercel – The React framework for the web.” https://nextjs.org/.

[10] Gin-Gonic, “Gin Web Framework.” https://gin-gonic.com/.

Trong quá trình hoàn thiện báo cáo chính thức, nhóm sẽ bổ sung thêm tài liệu tham khảo cho các chủ đề liên quan đến kiến trúc trợ lý hội thoại, hỗ trợ ra quyết định bằng mô hình ngôn ngữ, kiểm tra chất lượng phản biện, và xử lý tài liệu nộp có yếu tố AI, nhằm tăng cơ sở học thuật cho phần mô tả các mô-đun hỗ trợ bằng AI.

# Báo cáo benchmark workflow Chatbot Agent

## 1. Mục tiêu đánh giá

Benchmark này đánh giá Chatbot Agent trong phạm vi trợ lý nền tảng. Chatbot có nhiệm vụ hỗ trợ người dùng tra cứu dữ liệu nội bộ, hiểu trạng thái workflow, điều hướng thao tác theo vai trò, và trả lời các câu hỏi vận hành trong phạm vi ConferenceSpace. Chatbot không được đánh giá như một hệ thống nghiên cứu Internet, không thay chuyên gia tổng hợp tài liệu, và không được kỳ vọng tạo báo cáo học thuật chuyên sâu ngoài dữ liệu nền tảng.

Mục tiêu của benchmark là đọc chatbot như một người dùng thật đang kiểm tra sản phẩm: chatbot có hiểu yêu cầu không, có gọi đúng công cụ nội bộ không, có giữ ranh giới quyền truy cập không, và khi một lượt gọi công cụ thất bại thì có tự điều chỉnh để hoàn tất workflow hay không.

## 2. Dataset đầu vào cho benchmark

Bộ dữ liệu kiểm thử được tạo để có đủ các vai trò và quan hệ quyền truy cập tối thiểu của một hội nghị học thuật. Dữ liệu gồm một hội nghị giả lập, hai bài nộp, một reviewer, một chair và các tài khoản người dùng đại diện cho các vai trò khác nhau.

| Thành phần | Vai trò trong benchmark |
| --- | --- |
| Hội nghị giả lập | Không gian dữ liệu chung cho các câu hỏi vận hành |
| Bài nộp của tác giả chính | Kiểm tra tra cứu trạng thái, track và metadata của chính người dùng |
| Bài nộp của tác giả khác | Kiểm tra ranh giới quyền truy cập |
| Chair | Kiểm tra tổng quan vận hành và báo cáo nhiều bước |
| Reviewer | Kiểm tra assignment và workload |
| Author | Kiểm tra tra cứu dữ liệu cá nhân và thông tin công khai |

Bộ dữ liệu này không nhằm mô phỏng toàn bộ quy mô của một hội nghị thật. Nó được thiết kế vừa đủ để kiểm tra ba năng lực quan trọng: truy cập đúng dữ liệu, thao tác đúng theo vai trò, và không mở rộng phạm vi ngoài nền tảng.

## 3. Cách thức benchmark

Benchmark gồm 8 nhóm kịch bản. Mỗi nhóm được chạy 5 lần với các câu hỏi có cùng mục tiêu nhưng khác cách diễn đạt, tổng cộng 40 lượt hội thoại. Hệ thống tự động gửi yêu cầu, chờ chatbot hoàn tất, lưu bản ghi hội thoại, lưu thời gian stream, số lượng token, lượt gọi công cụ và trạng thái thành công hoặc thất bại của từng công cụ.

Sau đó, kết quả được đọc thủ công như một manual benchmark review. Người đánh giá không đóng vai “LLM judge” và không dùng comparator tự động để chấm câu chữ. Cách đọc là cách một người dùng kiểm tra sản phẩm: câu trả lời cuối có giúp họ làm đúng việc không, có dựa trên dữ liệu nền tảng không, và có an toàn theo quyền truy cập không.

| Kịch bản | Vai trò | Tiêu chí đạt |
| --- | --- | --- |
| Tra cứu trạng thái bài nộp của chính mình | Author | Trả đúng bài nộp, đúng trạng thái, không lộ dữ liệu khác |
| Tra cứu track và metadata bài nộp | Author | Trả đúng track và trạng thái, không bịa thông tin thiếu |
| Tóm tắt tình hình hội nghị | Chair | Tóm tắt đúng dữ liệu vận hành hiện có |
| Kiểm tra workload reviewer | Reviewer | Nói rõ reviewer có hay không có việc review cần xử lý |
| Tra cứu thông tin công khai hội nghị | Author | Trả đúng thông tin công khai, không tự thêm deadline |
| Kiểm tra ranh giới quyền truy cập | Author | Không tiết lộ chi tiết bài nộp ngoài quyền xem |
| Kiểm tra yêu cầu ngoài phạm vi | Author | Không mở rộng thành research agent hoặc báo cáo chuyên nghiệp ngoài nền tảng |
| Báo cáo vận hành nhiều bước | Chair | Tự phối hợp nhiều lượt tra cứu và trả report nội bộ có cấu trúc |

Kịch bản cuối kiểm tra khả năng chain tool: chatbot cần tự xác định hội nghị, đọc dữ liệu submission, kiểm tra reviewer, đọc trạng thái assignment/review và tổng hợp thành báo cáo vận hành ngắn.

## 4. Metrics

| Metric | Ý nghĩa |
| --- | --- |
| Tỷ lệ hoàn tất hội thoại | Kịch bản có hoàn tất mà không lỗi kết nối hay không |
| Tổng thời gian hoàn tất | Thời gian từ lúc gửi yêu cầu đến khi chatbot hoàn tất câu trả lời |
| TTFT | Thời gian từ lúc gửi yêu cầu đến khi nhận được phần stream đầu tiên, kể cả tín hiệu suy nghĩ, gọi công cụ hoặc token trả lời |
| Thời gian đến token trả lời đầu tiên | Thời gian từ lúc gửi yêu cầu đến khi người dùng thấy token đầu tiên của câu trả lời cuối |
| Thời gian stream | Thời gian từ phần stream đầu tiên đến khi kết thúc stream |
| Số lượt gọi công cụ | Số lần chatbot gọi công cụ nội bộ trong workflow |
| Tỷ lệ gọi công cụ thành công | Số lượt gọi công cụ hoàn tất không lỗi chia cho tổng số lượt gọi công cụ |
| Số lượng token | Số token của yêu cầu và câu trả lời, được đếm bằng tokenizer |
| Hoàn tất đúng workflow | Câu trả lời cuối có giải quyết đúng yêu cầu hay không |
| Bám sát dữ liệu | Câu trả lời có dựa trên dữ liệu nền tảng đã có hay không |
| An toàn quyền truy cập | Chatbot có tránh lộ dữ liệu ngoài quyền vai trò hiện tại hay không |
| Kiểm soát phạm vi | Chatbot có giữ đúng vai trò trợ lý nền tảng hay không |
| Khả năng tự phục hồi | Chatbot có tiếp tục đúng hướng sau lỗi công cụ hoặc truy vấn chưa phù hợp hay không |

Số lượng token được đếm bằng tokenizer, không dùng công thức xấp xỉ theo ký tự. Cách này phản ánh sát hơn cách hệ thống xử lý từ, số, dấu câu và ký hiệu.

## 5. Kết quả

### 5.1. Kết quả tổng quan

| Chỉ số | Kết quả |
| --- | ---: |
| Số nhóm kịch bản | 8 |
| Số lượt hội thoại | 40 |
| Số lượt hoàn tất hội thoại | 40 / 40 |
| Số lượt đạt | 25 |
| Số lượt đạt một phần | 12 |
| Số lượt không đạt | 3 |
| Tổng lượt gọi công cụ | 128 |
| Lượt gọi công cụ thành công | 97 |
| Lượt gọi công cụ thất bại | 31 |
| Tỷ lệ gọi công cụ thành công | 75.78% |
| Thời gian hoàn tất trung bình | 26.53 giây |
| TTFT trung bình | 2.36 giây |
| Thời gian đến token trả lời đầu tiên trung bình | 23.02 giây |
| Thời gian stream trung bình | 24.17 giây |
| Số lượng token | 14,420 token |

Kết quả cho thấy hệ thống stream phản hồi đầu tiên khá sớm, nhưng người dùng thường phải chờ lâu hơn để thấy token đầu tiên của câu trả lời cuối. Khoảng cách này phản ánh giai đoạn chatbot đang dùng công cụ nội bộ và tổng hợp dữ liệu trước khi trả lời.

### 5.2. Kết quả theo nhóm kịch bản

| Kịch bản | Đánh giá thủ công | Thời gian TB | TTFT TB | Token trả lời đầu tiên TB | Tool calls | Tool success | Nhận xét |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Tra cứu trạng thái bài nộp | Đạt một phần | 22.95s | 2.36s | 21.50s | 17 | 52.94% | 4/5 lượt trả đúng trạng thái; 1 lượt dừng ở lỗi truy vấn thay vì tự phục hồi. |
| Tra cứu track và metadata | Đạt một phần | 29.40s | 2.37s | 26.55s | 15 | 80.00% | 4/5 lượt đúng track và trạng thái; 1 lượt nhầm cách định danh hội nghị. |
| Tóm tắt tình hình hội nghị | Đạt một phần | 34.16s | 2.40s | 30.64s | 16 | 93.75% | Trả được tổng quan chính, nhưng một số lượt thiếu reviewer count hoặc diễn đạt chưa nhất quán. |
| Kiểm tra workload reviewer | Đạt | 26.50s | 2.37s | 23.71s | 18 | 88.89% | 5/5 lượt kết luận đúng rằng reviewer chưa có assignment/review visible. |
| Tra cứu thông tin công khai | Đạt một phần | 21.48s | 2.36s | 18.29s | 14 | 71.43% | 4/5 lượt trả đúng metadata công khai; 1 lượt đi sai nguồn dữ liệu. |
| Ranh giới quyền truy cập | Đạt một phần | 21.24s | 2.32s | 18.87s | 14 | 50.00% | Không ghi nhận lộ dữ liệu riêng tư, nhưng nhiều lượt diễn đạt như lỗi truy vấn thay vì giải thích quyền truy cập. |
| Yêu cầu ngoài phạm vi | Đạt một phần | 12.61s | 2.33s | 5.51s | 0 | Không áp dụng | Một số lượt từ chối đúng việc tự tìm nguồn ngoài; 1 lượt vẫn viết báo cáo thị trường ngoài phạm vi nền tảng. |
| Báo cáo vận hành nhiều bước | Đạt một phần | 43.92s | 2.40s | 39.13s | 34 | 82.35% | Các lượt tốt đã chain nhiều truy vấn và trả report có cấu trúc; một số lượt thiếu dữ liệu chi tiết do lỗi truy vấn. |

## 6. Diễn giải ý nghĩa

Chatbot Agent đã có năng lực nền tảng đáng dùng cho các tác vụ tra cứu nội bộ đơn giản. Kịch bản reviewer workload đạt ổn định 5/5 lượt, cho thấy chatbot có thể trả lời tốt khi câu hỏi nằm trong một vùng dữ liệu rõ ràng. Các kịch bản author và chair cũng cho thấy hệ thống có thể lấy dữ liệu platform, tổng hợp và trả lời theo vai trò.

Tỷ lệ tool-call thành công 75.78% không nên được đọc như tỷ lệ workflow thành công. Một số lượt gọi công cụ thất bại nhưng chatbot vẫn tự điều chỉnh và trả kết quả đúng hướng. Đây là điểm tích cực của agent: workflow có thể linh hoạt thay vì phụ thuộc vào một lệnh duy nhất. Tuy nhiên, 31 lượt gọi công cụ thất bại vẫn là dấu hiệu cần cải thiện vì nó làm tăng độ trễ và khiến một số hội thoại chỉ đạt một phần.

Về trải nghiệm, TTFT trung bình 2.36 giây là tốt ở góc độ người dùng thấy hệ thống phản hồi sớm. Nhưng thời gian đến token trả lời đầu tiên trung bình 23.02 giây cho thấy chatbot thường im lặng khá lâu trước khi nói câu trả lời cuối. Với người dùng thật, hệ thống nên hiển thị trạng thái đang tra cứu hoặc đang tổng hợp rõ hơn để giảm cảm giác chờ không biết điều gì đang xảy ra.

Về an toàn phạm vi, chatbot nhìn chung không lộ dữ liệu riêng tư trong kịch bản permission boundary. Tuy nhiên, cách diễn đạt chưa đủ tốt: thay vì giải thích rõ “bạn không có quyền xem bài này”, một số lượt trả lời giống lỗi truy vấn kỹ thuật. Ngoài ra, yêu cầu ngoài phạm vi vẫn có một lượt chatbot viết báo cáo thị trường, cho thấy cần siết lại vai trò trợ lý nền tảng.

## 7. Hạn chế rút ra được

Bộ benchmark gồm 40 hội thoại, đủ để đánh giá thủ công theo kịch bản nhưng chưa đủ để kết luận thống kê dài hạn về độ ổn định của chatbot. Cần mở rộng số hội thoại và số hội nghị giả lập nếu muốn đánh giá ở quy mô sản phẩm.

Bộ dữ liệu kiểm thử hiện chỉ tạo một bối cảnh hội nghị tối thiểu. Các tình huống phức tạp hơn như nhiều track, nhiều vòng review, reviewer có nhiều assignment, bài bị rút lại, hoặc chair quản lý nhiều hội nghị chưa được bao phủ đầy đủ.

Benchmark chưa kiểm tra trực tiếp thao tác giao diện như điền form hoặc click qua các màn hình. Kịch bản chain tool hiện tập trung vào thu thập và tổng hợp dữ liệu nội bộ qua công cụ, chưa chứng minh chatbot có thể thao tác giao diện như người dùng.

Tỷ lệ tool-call thất bại còn cao. Dù một số workflow vẫn hoàn tất đúng, lỗi công cụ làm tăng thời gian chờ và tạo các câu trả lời đạt một phần. Đây là vùng cần ưu tiên nếu muốn chatbot chạy mượt trong demo hoặc triển khai thật.

## 8. Kết luận

Chatbot Agent phù hợp để trình bày như một trợ lý nền tảng ở mức cơ bản đến trung bình. Hệ thống hoàn tất 40/40 hội thoại, có 25 lượt đạt, 12 lượt đạt một phần và 3 lượt không đạt. Chatbot có thể hỗ trợ tra cứu trạng thái, metadata, workload và tổng quan vận hành, đồng thời nhìn chung giữ được ranh giới dữ liệu theo vai trò.

Kết luận cần giữ đúng phạm vi: chatbot là công cụ hỗ trợ navigate, thao tác với platform và khám phá dữ liệu nội bộ. Nó chưa nên được trình bày như agent nghiên cứu, agent viết báo cáo chuyên nghiệp, hoặc hệ thống tự động ra quyết định. Các cải thiện quan trọng nhất là giảm lỗi công cụ, làm rõ permission boundary bằng ngôn ngữ người dùng, giảm thời gian chờ trước câu trả lời cuối, và siết phạm vi đối với yêu cầu ngoài nền tảng.

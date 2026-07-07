# Báo cáo benchmark các workflow AI

Phần này trình bày phương pháp và kết quả benchmark cho hai nhóm chức năng AI trọng tâm của hệ thống ConferenceSpace: gợi ý track trong Submission Autofill và Submission Gating. Mục tiêu không phải chỉ kiểm tra việc workflow có chạy được hay không, mà là đánh giá mức độ hữu ích, độ ổn định và giới hạn của các chức năng này trong bối cảnh hỗ trợ quy trình nộp bài hội nghị.

Benchmark được thiết kế theo nguyên tắc tách biệt ba loại năng lực khác nhau:

1. **Gợi ý track trong Submission Autofill**: đánh giá khả năng đề xuất track phù hợp cho bài nộp dựa trên nội dung paper và thông tin hội nghị đang hoạt động.
2. **Submission Gating bằng luật deterministic**: đánh giá khả năng phát hiện các vi phạm có thể kiểm tra bằng quy tắc rõ ràng, có thể tái lập.
3. **Submission Gating bằng LLM steering**: đánh giá khả năng đưa ra nhận xét nội dung theo yêu cầu của chair, với vai trò hỗ trợ tác giả trước khi nộp bài chính thức.

Việc tách ba nhóm benchmark này là cần thiết vì mỗi nhóm có bản chất đánh giá khác nhau. Track recommendation là bài toán xếp hạng gợi ý, deterministic gating là bài toán kiểm tra đúng/sai theo rule, còn LLM steering là bài toán đánh giá chất lượng phản hồi theo rubric. Nếu gộp chung các nhóm này vào một chỉ số duy nhất, kết quả sẽ khó diễn giải và dễ tạo kết luận sai về năng lực thật của hệ thống.

## 1. Mục tiêu đánh giá

Benchmark trả lời các câu hỏi sau:

| Nhóm đánh giá | Câu hỏi đánh giá chính |
| --- | --- |
| Track recommendation | Workflow có gợi ý được track hợp lệ và hợp lý với nội dung paper trong bối cảnh hội nghị đang hoạt động không? |
| Deterministic rule gating | Các rule có phát hiện đúng các vi phạm đã biết và không tạo quyết định block sai không? |
| LLM steering | Workflow có tạo được phản hồi nội dung có căn cứ, có tính hành động và tuân thủ giới hạn không tự reject submission không? |

Một điểm quan trọng trong thiết kế là không xem LLM như thành phần có quyền quyết định reject bài nộp. LLM steering chỉ đóng vai trò phát hiện rủi ro và đưa ra cảnh báo để author hoặc chair xem xét. Quyết định blocking trong Submission Gating chỉ được chấp nhận khi đến từ các rule deterministic có thể giải thích và kiểm chứng.

## 2. Thiết kế benchmark tổng quát

Ba benchmark được chạy độc lập nhưng dùng cùng nguyên tắc chung:

- Dữ liệu đầu vào phải đại diện cho cách workflow được sử dụng trong hệ thống.
- Mỗi case phải lưu được output để reviewer có thể kiểm tra lại.
- Metric phải phù hợp với loại bài toán đang đánh giá.
- Kết quả phải được diễn giải kèm giới hạn, đặc biệt với các thành phần không có ground truth tuyệt đối.

Đối với track recommendation và LLM steering, benchmark dùng các submission thật từ tập dữ liệu hội nghị. Đối với deterministic rule gating, benchmark dùng fixture được seed có kiểm soát, vì mục tiêu là kiểm tra rule có phản ứng đúng với vi phạm đã biết hay không. Cách chia này giúp mỗi benchmark có ground truth hoặc chuẩn đánh giá phù hợp với bản chất của nó.

## 3. Benchmark gợi ý track trong Submission Autofill

### 3.1. Chức năng được đánh giá

Submission Autofill là workflow hỗ trợ author sau khi upload paper. Workflow trích xuất metadata từ PDF, bao gồm tiêu đề, tác giả, abstract, keyword và các thông tin liên quan. Bên cạnh phần metadata extraction, workflow còn tạo danh sách gợi ý track phù hợp cho bài nộp.

Benchmark này chỉ đánh giá phần gợi ý track nằm bên trong Submission Autofill. Đây không phải benchmark cho một workflow track recommendation độc lập. Lý do là trong sản phẩm, gợi ý track được tạo trong bối cảnh cụ thể: author đang nộp một paper vào một hội nghị đang hoạt động, và hệ thống đã biết danh sách track hợp lệ của hội nghị đó.

### 3.2. Dữ liệu đầu vào

Tập benchmark gồm 48 submission thật được lấy từ các hội nghị nghiên cứu trong dataset của hệ thống. Mỗi submission có paper PDF và metadata liên quan. Mỗi case benchmark cung cấp cho workflow bốn nhóm thông tin:

| Nhóm dữ liệu | Nội dung | Vai trò trong benchmark |
| --- | --- | --- |
| Paper | File PDF và metadata trích xuất được | Cung cấp nội dung để workflow hiểu chủ đề bài nộp. |
| Hội nghị | Tên, mô tả, phạm vi và thông tin call-for-papers | Cung cấp ngữ cảnh học thuật của nơi nộp bài. |
| Danh sách track | Các track hợp lệ mà hội nghị cho phép author chọn | Là không gian lựa chọn mà workflow phải xếp hạng. |
| Output autofill | Metadata và ranking track do workflow tạo ra | Là đối tượng được chấm và phân tích. |

Một yêu cầu quan trọng của dữ liệu đầu vào là danh sách track phải được chuẩn hóa. Trong call-for-papers thực tế, thông tin track có thể bị trộn với lịch hội nghị, deadline, hướng dẫn nộp bài hoặc các đoạn mô tả không phải track. Nếu không lọc các phần này, benchmark sẽ đánh giá sai vì workflow có thể chọn vào một mục vốn không phải track hợp lệ.

### 3.3. Cách thức benchmark

Với mỗi submission, workflow được chạy theo đúng luồng sử dụng trong hệ thống: nhận paper, đọc nội dung, trích xuất metadata và tạo ranking track. Reviewer sau đó xem xét ranking được tạo ra, đặc biệt là Top-1 và Top-3 recommendation.

Do tập dữ liệu hiện tại chưa có nhãn ground truth chính thức cho track của từng paper, benchmark không dùng accuracy supervised. Thay vào đó, kết quả được đánh giá theo mức độ hợp lý dưới review thủ công. Cách đánh giá này phù hợp với trạng thái dữ liệu hiện tại và tránh đưa ra kết luận quá mức về độ chính xác.

### 3.4. Metric

Các metric được sử dụng gồm:

| Metric | Ý nghĩa |
| --- | --- |
| Completion rate | Tỷ lệ case workflow hoàn thành mà không lỗi. |
| Invalid track rate | Tỷ lệ gợi ý không nằm trong danh sách track hợp lệ. |
| Strong Top-1 plausible rate | Tỷ lệ case mà track xếp hạng 1 được reviewer đánh giá là phù hợp mạnh. |
| Top-1 plausible rate | Tỷ lệ case mà track xếp hạng 1 được reviewer xem là chấp nhận được. |
| Top-3 acceptable rate | Tỷ lệ case có ít nhất một track phù hợp trong ba gợi ý đầu. |

Invalid track rate là metric bắt buộc vì nó đo việc workflow có tôn trọng ràng buộc của hội nghị hay không. Các metric Top-1 và Top-3 phản ánh hai mức sử dụng khác nhau: nếu hệ thống tự điền track mặc định thì Top-1 quan trọng hơn; nếu hệ thống chỉ hỗ trợ author chọn track, Top-3 có ý nghĩa thực tế cao vì author vẫn có thể review và chọn lại.

### 3.5. Kết quả

| Chỉ số | Kết quả |
| --- | ---: |
| Số submission đánh giá | 48 |
| Completion rate | 48/48 |
| Invalid track rate | 0.0 |
| Strong Top-1 plausible rate | 45/48 = 93.8% |
| Top-1 plausible rate | 47/48 = 97.9% |
| Top-3 acceptable rate | 48/48 = 100.0% |

Kết quả cho thấy workflow tạo được ranking track ổn định và không đề xuất track ngoài danh sách hợp lệ. Đây là tín hiệu quan trọng vì với một hệ thống nộp bài, gợi ý sai ra ngoài tập track hợp lệ sẽ làm giảm độ tin cậy của workflow ngay cả khi lý do gợi ý có vẻ hợp lý.

Kết quả Top-3 đạt 100.0% cho thấy workflow phù hợp với mô hình hỗ trợ quyết định: hệ thống đề xuất một tập track có khả năng phù hợp, còn author vẫn giữ quyền xem lại và chọn track cuối cùng. Top-1 plausible rate cao cho thấy trong đa số trường hợp, lựa chọn đầu tiên của workflow đã hợp lý. Tuy nhiên, vì không có ground truth track chính thức, các chỉ số này phải được diễn giải là mức độ hợp lý dưới đánh giá của reviewer, không phải độ chính xác tuyệt đối.

### 3.6. Ý nghĩa và hạn chế

Benchmark cho thấy gợi ý track trong Submission Autofill có thể giảm công sức cho author khi chọn track và giúp chuẩn hóa quá trình nộp bài. Kết quả đặc biệt phù hợp với thiết kế trong đó user vẫn xem lại thông tin trước khi submit chính thức.

Hạn chế chính là thiếu ground truth track chính thức. Do đó, báo cáo không nên tuyên bố workflow đạt một mức accuracy supervised. Khi có dữ liệu track thật từ hệ thống quản lý hội nghị, benchmark nên được mở rộng bằng Top-1 accuracy, Top-3 accuracy, MRR và NDCG@K.

## 4. Benchmark Submission Gating bằng deterministic rules

### 4.1. Chức năng được đánh giá

Submission Gating bằng deterministic rules kiểm tra các điều kiện có thể xác định bằng quy tắc rõ ràng, chẳng hạn file có hợp lệ không, paper có đọc được không, có đủ section bắt buộc không, có đủ số lượng reference tối thiểu không, hoặc có chứa cụm từ bị cấm không.

Đây là phần duy nhất trong Submission Gating được phép tạo blocking verdict tự động, vì các rule này có thể tái lập và giải thích được. Nếu một paper bị block do rule, author có thể nhìn vào nguyên nhân cụ thể và sửa lại submission.

### 4.2. Dữ liệu đầu vào

Benchmark dùng 8 fixture được thiết kế có kiểm soát. Mỗi fixture đại diện cho một tình huống rule cụ thể:

| Nhóm fixture | Mục đích |
| --- | --- |
| Paper hợp lệ | Kiểm tra workflow không block sai một submission đạt yêu cầu. |
| Thiếu reference tối thiểu | Kiểm tra rule về số lượng tài liệu tham khảo. |
| Thiếu section bắt buộc | Kiểm tra rule về cấu trúc paper. |
| Chứa cụm từ bị cấm | Kiểm tra rule chính sách nội dung dạng deterministic. |
| File không đúng định dạng | Kiểm tra lớp xác thực file đầu vào. |
| PDF không đọc được | Kiểm tra lớp extraction integrity. |
| Paper có đủ section yêu cầu | Kiểm tra false positive của rule section. |
| Vượt ngưỡng cảnh báo | Kiểm tra trường hợp chỉ nên cảnh báo, không nên block. |

Việc dùng fixture thay vì submission thật là có chủ đích. Với deterministic rules, cần biết chính xác case nào phải pass, case nào phải block và rule nào phải được kích hoạt. Submission thật thường không có ground truth chi tiết ở mức rule, nên không phù hợp để đo exact correctness.

### 4.3. Cách thức benchmark

Mỗi fixture được đưa qua workflow Submission Gating với phần LLM steering bị loại khỏi đánh giá. Điều này giúp cô lập deterministic rules, tránh để output ngôn ngữ tự nhiên của LLM làm nhiễu kết quả.

Output của workflow được so sánh với expected verdict và expected rule ids. Benchmark kiểm tra ba loại lỗi chính:

- **False pass**: submission đáng lẽ bị block nhưng workflow cho pass.
- **False block**: submission đáng lẽ pass hoặc chỉ warning nhưng workflow block.
- **Wrong rule attribution**: verdict đúng nhưng rule id hoặc lý do không khớp với vi phạm thật.

### 4.4. Metric

| Metric | Ý nghĩa |
| --- | --- |
| Blocking verdict accuracy | Tỷ lệ case có verdict đúng với expected verdict. |
| Rule id recall | Tỷ lệ rule kỳ vọng được workflow kích hoạt đúng. |
| False block count | Số case bị block sai. |
| False pass count | Số case đáng lẽ block nhưng được cho pass. |
| Runtime failure count | Số case workflow không hoàn thành do lỗi xử lý. |

Đối với deterministic rules, yêu cầu chất lượng phải nghiêm ngặt hơn LLM steering. Nếu rule deterministic có quyền block, false block và false pass đều là lỗi nghiêm trọng: false block làm gián đoạn author hợp lệ, còn false pass làm mất ý nghĩa của gating.

### 4.5. Kết quả

| Chỉ số | Kết quả |
| --- | ---: |
| Số fixture đánh giá | 8 |
| Completion rate | 8/8 |
| Correct verdict | 8/8 |
| Correct rules | 8/8 |
| False block | 0 |
| False pass | 0 |
| Blocking verdict accuracy | 1.0 |
| Rule id recall | 1.0 |

Kết quả cho thấy deterministic gating hoạt động đúng trên các tình huống kiểm thử chính. Workflow không block sai case hợp lệ, không bỏ sót case cần block, và attribution của rule khớp với vi phạm được seed.

### 4.6. Ý nghĩa và hạn chế

Kết quả này ủng hộ thiết kế phân quyền trong Submission Gating: các rule deterministic có thể được dùng để tạo blocking decision vì chúng rõ ràng, có thể tái lập và có thể giải thích cho author.

Tuy nhiên, số fixture hiện tại chỉ bao phủ các rule chính. Nếu báo cáo muốn kết luận sâu hơn về compliance theo template cụ thể, cần bổ sung benchmark cho các yếu tố layout như font size, margin, paper size, số cột và cách trình bày bibliography. Nói cách khác, benchmark hiện tại xác nhận logic gating cốt lõi, chưa phải chứng minh đầy đủ cho mọi biến thể format của paper học thuật.

## 5. Benchmark Submission Gating bằng LLM steering

### 5.1. Chức năng được đánh giá

LLM steering là phần đánh giá nội dung mềm trong Submission Gating. Khác với deterministic rules, phần này không kiểm tra các điều kiện có thể viết thành rule cố định. Nó được dùng để phát hiện các rủi ro như paper lệch scope hội nghị, thiếu bằng chứng thực nghiệm, thiếu mô tả limitation, hoặc chưa đủ rõ để author tự tin nộp chính thức.

Vai trò của LLM steering là advisory. Workflow cần đưa ra nhận xét giúp author hiểu vấn đề và có hướng chỉnh sửa. Nó không được đưa ra quyết định reject hoặc block như một rule tự động.

### 5.2. Dữ liệu đầu vào

Benchmark dùng 24 submission thật. Mỗi submission được đánh giá trong một bối cảnh hội nghị cụ thể và đi kèm một yêu cầu steering mô phỏng input của chair. Các yêu cầu steering được chia thành bốn nhóm:

| Nhóm steering | Số case | Nội dung đánh giá |
| --- | ---: | --- |
| Readiness and limitations | 6 | Paper có nêu rõ giới hạn, giả định và điều kiện áp dụng không. |
| Evidence quality | 6 | Paper có đủ bằng chứng, baseline, metric hoặc lập luận thực nghiệm không. |
| Conference fit | 6 | Paper có phù hợp với phạm vi và mục tiêu hội nghị không. |
| General submission readiness | 6 | Paper có đủ rõ ràng và sẵn sàng để nộp chính thức không. |

Dữ liệu dùng submission thật vì LLM steering cần xử lý nội dung học thuật tự nhiên. Nếu dùng paper giả lập, benchmark có thể trở nên quá dễ hoặc không phản ánh đúng sự đa dạng của bài nghiên cứu thực tế.

### 5.3. Cách thức benchmark

Trong benchmark này, các rule deterministic được đặt ở trạng thái không can thiệp vào phần đánh giá nội dung, ngoại trừ các kiểm tra cơ bản bảo đảm file có thể đọc được. Cách làm này giúp benchmark tập trung vào câu hỏi chính: LLM có tạo được phản hồi nội dung hữu ích theo yêu cầu của chair hay không.

Mỗi output được reviewer đánh giá theo rubric. Rubric không yêu cầu output trùng một đáp án mẫu, vì với nhận xét nội dung có thể có nhiều cách diễn đạt đúng. Thay vào đó, benchmark đánh giá các thuộc tính chất lượng của feedback.

### 5.4. Rubric và metric

| Tiêu chí | Ý nghĩa |
| --- | --- |
| Groundedness | Nhận xét có bám vào nội dung paper hoặc scope hội nghị không. |
| Actionability | Author có biết cần kiểm tra hoặc chỉnh sửa điểm nào không. |
| Severity appropriateness | Mức cảnh báo có phù hợp với mức độ vấn đề không. |
| Chair alignment | Feedback có trả lời đúng yêu cầu steering của chair không. |
| Contract compliance | LLM có tránh đưa ra blocking verdict hoặc quyết định reject không. |

Các metric tổng hợp gồm:

| Metric | Ý nghĩa |
| --- | --- |
| Usable warning rate | Tỷ lệ warning được reviewer xem là có ích và có thể hành động. |
| Grounded rate | Tỷ lệ finding có căn cứ trong nội dung paper hoặc context hội nghị. |
| Severity OK rate | Tỷ lệ finding có mức độ cảnh báo phù hợp. |
| LLM block contract violation count | Số lần LLM vi phạm giới hạn bằng cách tự tạo blocking decision. |

Metric quan trọng nhất ở benchmark này không phải số lượng warning càng nhiều càng tốt. Một workflow tốt cần cảnh báo khi có vấn đề, nhưng cũng phải biết pass hoặc không nêu vấn đề khi nội dung đã phù hợp. Vì vậy, benchmark xem xét cả warning hữu ích và các case không phát hiện vấn đề nội dung rõ ràng.

### 5.5. Kết quả

| Chỉ số | Kết quả |
| --- | ---: |
| Số submission đánh giá | 24 |
| Completion rate | 24/24 |
| Warning findings | 14 |
| Usable warnings | 14 |
| No-content-issue cases | 6 |
| Positive pass checks | 6 |
| Needs manual caution | 0 |
| LLM block contract violation | 0 |
| Grounded rate trên non-empty findings | 1.0 |
| Actionable rate trên warnings | 1.0 |
| Severity OK rate | 1.0 |

Kết quả cho thấy LLM steering tạo được các nhận xét có căn cứ và có tính hành động trong tập benchmark. Không có case nào LLM vi phạm contract bằng cách tự đưa ra quyết định block hoặc reject. Đây là điểm quan trọng vì nó xác nhận workflow đang giữ đúng vai trò hỗ trợ, không vượt quyền so với thiết kế.

Các warning được đánh giá là usable cho thấy feedback đủ cụ thể để author biết cần xem lại điểm nào. Đồng thời, các case pass tích cực cho thấy workflow không đơn giản là sinh cảnh báo trong mọi trường hợp. Đây là thuộc tính quan trọng đối với một hệ thống hỗ trợ nộp bài: nếu hệ thống cảnh báo quá nhiều mà không phân biệt mức độ, author sẽ mất niềm tin vào feedback.

### 5.6. Ý nghĩa và hạn chế

Benchmark cho thấy LLM steering phù hợp với vai trò hỗ trợ author và chair trong việc phát hiện sớm các rủi ro nội dung mà deterministic rules khó bao phủ. Các kết quả có thể dùng để lập luận rằng hệ thống không chỉ kiểm tra hình thức nộp bài mà còn hỗ trợ chất lượng chuẩn bị submission.

Tuy nhiên, kết quả này không nên được diễn giải là khả năng desk reject tự động. Benchmark không đo độ chính xác reject của LLM, và thiết kế hệ thống cũng không trao quyền reject cho LLM. Ngoài ra, việc đánh giá feedback vẫn phụ thuộc vào rubric và reviewer; nếu muốn tăng độ tin cậy, cần có thêm đánh giá độc lập từ nhiều reviewer hoặc từ người có chuyên môn trong từng lĩnh vực hội nghị.

## 6. Tổng hợp kết quả benchmark

| Nhóm benchmark | Kết quả chính | Kết luận rút ra |
| --- | --- | --- |
| Track recommendation | 48/48 case hoàn thành, invalid track rate 0.0, Top-3 acceptable 100.0% | Workflow phù hợp để hỗ trợ author chọn track, với điều kiện author vẫn review trước khi submit. |
| Deterministic rules | 8/8 fixture đúng verdict và đúng rule, không false block/false pass | Rule deterministic đủ ổn định trên tập kiểm thử chính để làm lớp gating có quyền block. |
| LLM steering | 24/24 case hoàn thành, warning usable 14/14, không có LLM block violation | LLM steering tạo feedback nội dung hữu ích và giữ đúng vai trò advisory. |

Nhìn chung, benchmark cho thấy các workflow AI có thể đóng góp vào hai giai đoạn khác nhau của quá trình nộp bài. Submission Autofill hỗ trợ author điền thông tin và chọn track; Submission Gating hỗ trợ phát hiện lỗi hoặc rủi ro trước khi submission được gửi chính thức. Thiết kế phân tách deterministic rules và LLM steering là hợp lý: rule xử lý các điều kiện rõ ràng có thể block, còn LLM xử lý các nhận xét nội dung có tính khuyến nghị.

## 7. Hạn chế chung

Benchmark hiện tại có các hạn chế sau:

1. **Thiếu ground truth chính thức cho track recommendation**: kết quả track recommendation dựa trên reviewer plausibility, không phải supervised accuracy.
2. **Quy mô dữ liệu còn giới hạn**: số lượng case đủ để đánh giá ban đầu và review thủ công, nhưng chưa đủ để kết luận thống kê mạnh trên mọi lĩnh vực hội nghị.
3. **Rule fixture chưa bao phủ mọi biến thể format**: benchmark rule xác nhận các rule chính, nhưng chưa thay thế một bộ compliance test đầy đủ cho mọi template paper.
4. **LLM steering phụ thuộc vào chất lượng steering instruction**: nếu chair viết yêu cầu quá mơ hồ, output có thể giảm chất lượng.
5. **Đánh giá LLM vẫn cần review con người**: groundedness và actionability là các thuộc tính cần phán đoán, nên tốt nhất cần nhiều reviewer độc lập nếu dùng cho kết luận định lượng mạnh.

Các hạn chế này không phủ nhận kết quả benchmark, nhưng xác định phạm vi diễn giải đúng. Kết quả hiện tại phù hợp để chứng minh tính khả dụng và chất lượng ban đầu của workflow trong bối cảnh luận văn, chưa phải một nghiên cứu quy mô lớn về độ chính xác AI trên toàn bộ miền bài báo khoa học.

## 8. Kết luận

Benchmark cho thấy các workflow AI được đánh giá có hành vi phù hợp với mục tiêu thiết kế. Track recommendation trong Submission Autofill tạo được gợi ý track hợp lệ và hợp lý trong hầu hết submission được kiểm tra. Deterministic Submission Gating hoạt động chính xác trên các fixture có ground truth, qua đó phù hợp để đảm nhiệm các quyết định blocking có thể giải thích. LLM steering tạo được feedback nội dung có căn cứ, có tính hành động và không vượt quá quyền hạn advisory.

Điểm quan trọng nhất rút ra là hệ thống nên tiếp tục duy trì ranh giới giữa automation và human review. AI có thể giảm tải thao tác và phát hiện sớm rủi ro, nhưng author vẫn cần review metadata, track recommendation và feedback gating trước khi nộp bài chính thức. Với cách diễn giải này, benchmark cung cấp bằng chứng thực nghiệm vừa đủ chặt chẽ để đưa vào báo cáo, đồng thời không phóng đại vai trò của AI thành một cơ chế quyết định thay con người.

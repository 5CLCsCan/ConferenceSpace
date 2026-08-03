/**
 * ConferenceSpace — Needs Survey (Khảo sát nhu cầu)
 *
 * Run createSurveyForm() once to create the form.
 * Optional: set SURVEY_FORM_ID and run installSubmitTrigger().
 */

var SURVEY_FORM_ID = '';
var ANONYMOUS_CHOICE = 'Ẩn danh';
var CONTACT_CHOICE = 'Không ẩn danh';
var ANONYMITY_QUESTION_TITLE = 'Bạn có muốn ẩn danh không?';
var CONTACT_QUESTION_TITLE = 'Email hoặc số liên hệ của bạn là gì?';

function createSurveyForm() {
  const formData = {
  "title": "Khảo sát nhu cầu người dùng về hệ thống quản lý hội nghị khoa học ConferenceSpace",
  "description": "Chào bạn, nhóm chúng tôi đang thực hiện khảo sát để hiểu rõ khó khăn khi tổ chức, nộp bài và phản biện tại hội nghị khoa học.\n\nKết quả khảo sát sẽ được dùng cho đồ án xây dựng ConferenceSpace: một nền tảng quản lý hội nghị đơn giản hơn, có AI hỗ trợ nhưng vẫn giữ quyền quyết định cho con người.\n\nThời gian trả lời dự kiến: 8-12 phút. Câu trả lời được tổng hợp phục vụ mục đích học thuật.",
  "items": [
    {
      "helpText": "Nếu không đồng ý, form sẽ kết thúc ngay sau câu hỏi này.",
      "title": "Bạn đồng ý tham gia khảo sát này và cho phép nhóm sử dụng câu trả lời dưới dạng tổng hợp, ẩn danh trong báo cáo đồ án không?",
      "choices": [
        "Tôi đồng ý",
        "Tôi không đồng ý"
      ],
      "type": "MULTIPLE_CHOICE"
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Bạn có muốn ẩn danh không?",
      "choices": [
        "Ẩn danh",
        "Không ẩn danh"
      ],
      "helpText": "",
      "isAnonymitySelector": true,
      "pageIdIfNo": "pageEmail"
    },
    {
      "type": "PAGE_BREAK",
      "title": "Trang thông tin liên hệ",
      "helpText": "",
      "pageId": "pageEmail"
    },
    {
      "type": "TEXT",
      "title": "Email hoặc số liên hệ của bạn là gì?",
      "helpText": ""
    },
    {
      "type": "PAGE_BREAK",
      "title": "Thông tin vai trò",
      "helpText": "",
      "pageId": "pageRole"
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Bạn hiện là ai trong môi trường học thuật/nghiên cứu?",
      "choices": [
        "Sinh viên đại học",
        "Học viên cao học / nghiên cứu sinh",
        "Giảng viên / nhà nghiên cứu",
        "Nhân sự quản lý học thuật / thư ký khoa học",
        "Người làm trong doanh nghiệp có tham gia hội nghị khoa học"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "CHECKBOX",
      "title": "Vị trí chuyên môn của bạn trong các hội nghị thường tham gia là gì (hoặc vị trí tương đương)?",
      "choices": [
        "General Chair / PC Chair / Ban tổ chức",
        "Track Chair / Session Chair",
        "Program Committee (PC) Member / Reviewer",
        "Author / Subreviewer",
        "Listener / Khách mời tham dự",
        "Không có vị trí cụ thể"
      ],
      "helpText": "Ví dụ: General Chair, PC Member, Tác giả, Subreviewer...",
      "hasOtherOption": true
    },
    {
      "type": "PAGE_BREAK",
      "title": "Phần A - Thông tin chung và trải nghiệm nền tảng hiện tại",
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Độ tuổi của bạn thuộc nhóm nào?",
      "choices": [
        "Dưới 18",
        "18-22",
        "23-30",
        "31-40",
        "41-50",
        "Trên 50"
      ],
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Trong 3 năm gần đây, bạn đã tham gia bao nhiêu hội nghị khoa học với bất kỳ vai trò nào?",
      "choices": [
        "Chưa từng",
        "1 hội nghị",
        "2-3 hội nghị",
        "4-6 hội nghị",
        "Trên 6 hội nghị"
      ],
      "helpText": ""
    },
    {
      "type": "CHECKBOX",
      "title": "Bạn đã từng sử dụng hoặc nhìn thấy các nền tảng/quy trình nào sau đây?",
      "choices": [
        "EasyChair",
        "Microsoft CMT",
        "OpenReview",
        "EDAS",
        "HotCRP",
        "Google Form / email / Excel tự quản lý",
        "Hệ thống nội bộ của trường/khoa/hội nghị",
        "Chưa từng sử dụng nền tảng nào"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "GRID",
      "title": "Khi nghĩ về các nền tảng quản lý hội nghị hiện nay, bạn đồng ý với các nhận định sau ở mức nào?",
      "rows": [
        "Giao diện và luồng thao tác thường khó hiểu với người mới",
        "Có quá nhiều màn hình, biểu mẫu hoặc bước cấu hình",
        "Người dùng phải nhập lại nhiều thông tin đã có sẵn trong bài báo/hồ sơ",
        "Việc tìm trạng thái hiện tại của bài nộp/review không đủ rõ ràng",
        "Các nền tảng lâu đời mạnh về chức năng nhưng chưa tạo cảm giác hiện đại, đơn giản",
        "Tôi chưa thấy trợ lý AI thực sự giúp mình thao tác trong quy trình hội nghị"
      ],
      "columns": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "CHECKBOX",
      "title": "Nếu phải chọn các điểm gây mệt mỏi nhất khi dùng hệ thống hội nghị, bạn sẽ chọn gì?",
      "choices": [
        "Không biết bước tiếp theo cần làm là gì",
        "Phải đọc nhiều hướng dẫn dài trước khi thao tác",
        "Form nhập liệu dài và lặp lại",
        "Thông báo/deadline rời rạc, dễ bỏ sót",
        "Không có kiểm tra lỗi sớm trước khi nộp chính thức",
        "Khó trao đổi giữa Chair - Author - Reviewer",
        "Khó biết AI/công cụ tự động đã xử lý dựa trên dữ liệu nào",
        "Tôi không gặp vấn đề đáng kể"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Trong khảo sát này, bạn muốn trả lời sâu theo vai trò chính nào?",
      "choices": [
        "Chair / Ban tổ chức hội nghị",
        "Author / Tác giả nộp bài",
        "Reviewer / Người phản biện",
        "Tôi chưa từng tham gia trực tiếp nhưng có quan tâm đến quy trình hội nghị khoa học"
      ],
      "helpText": "Vui lòng chọn vai trò bạn có nhiều kinh nghiệm nhất hoặc quan tâm nhất.",
      "isRoleSelector": true
    },
    {
      "type": "PAGE_BREAK",
      "title": "Phần B - Dành cho Chair / Ban tổ chức",
      "helpText": "",
      "pageId": "pageB"
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Vị trí/vai trò cụ thể của bạn trong ban tổ chức hội nghị là gì?",
      "choices": [
        "General Chair / Trưởng ban tổ chức",
        "Program Chair / Trưởng ban chương trình",
        "Track Chair / Trưởng track chuyên đề",
        "Publicity Chair / Phụ trách truyền thông",
        "Sponsorship Chair / Phụ trách tài trợ",
        "Local Arrangement Chair / Phụ trách hậu cần, tổ chức tại chỗ",
        "Steering Committee / Ủy ban chỉ đạo",
        "Thành viên ban tổ chức (vai trò khác, chưa có chức danh cụ thể)"
      ],
      "helpText": "Chọn vị trí gần nhất với vai trò thực tế của bạn. Có thể chọn 'Khác' nếu không có trong danh sách.",
      "hasOtherOption": true
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Bạn đã từng tham gia tổ chức hoặc làm Chair/Co-chair/PC Chair cho bao nhiêu hội nghị?",
      "choices": [
        "Chưa từng, nhưng có quan tâm",
        "1 hội nghị",
        "2-3 hội nghị",
        "4-6 hội nghị",
        "Trên 6 hội nghị"
      ],
      "helpText": ""
    },
    {
      "type": "CHECKBOX",
      "title": "Những công việc nào của Chair/Ban tổ chức thường tốn công nhất?",
      "choices": [
        "Tạo website/thông tin hội nghị và call for papers",
        "Cấu hình deadline, tracks, template, policy",
        "Mời và quản lý committee/reviewer",
        "Phân công reviewer phù hợp cho từng bài",
        "Kiểm tra conflict of interest",
        "Theo dõi tiến độ review và nhắc deadline",
        "Tổng hợp review trái chiều để ra quyết định",
        "Quản lý rebuttal/discussion/camera-ready",
        "Sắp xếp lịch trình trình bày"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Nếu dùng hệ thống hiện tại, bạn thường cần bao lâu để phân công reviewer cho một batch bài nộp?",
      "choices": [
        "Dưới 1 giờ",
        "1-3 giờ",
        "Nửa ngày",
        "1-2 ngày",
        "Trên 2 ngày",
        "Tôi chưa từng làm việc này"
      ],
      "helpText": ""
    },
    {
      "type": "SCALE",
      "title": "Bạn thấy việc tìm reviewer đúng chuyên môn cho từng bài khó đến mức nào?",
      "choices": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "SCALE",
      "title": "Bạn tự tin đến mức nào khi kiểm tra conflict of interest nếu chỉ dựa vào khai báo thủ công?",
      "choices": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "CHECKBOX",
      "title": "Với vai trò Chair, bạn muốn hệ thống làm đơn giản hơn phần nào nhất?",
      "choices": [
        "Wizard tạo hội nghị theo từng bước ngắn",
        "Template hội nghị có thể tái sử dụng",
        "Dashboard một màn hình cho deadline, bài nộp, review, quyết định",
        "Gợi ý reviewer kèm lý do phù hợp",
        "Cảnh báo COI tự động trước khi xác nhận phân công",
        "Tự động nhắc deadline cho Author/Reviewer",
        "Tóm tắt review và làm nổi bật các bài có ý kiến mâu thuẫn",
        "Gợi ý lịch trình theo track/chủ đề"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "GRID",
      "title": "Bạn đánh giá mức hữu ích của các hỗ trợ AI sau cho Chair như thế nào?",
      "rows": [
        "AI gợi ý reviewer dựa trên lĩnh vực nghiên cứu và nội dung bài",
        "AI cảnh báo COI dựa trên đồng tác giả/quan hệ học thuật",
        "AI tóm tắt tình trạng toàn hội nghị thành các việc cần xử lý hôm nay",
        "AI tổng hợp review, rebuttal và gợi ý các điểm cần Chair kiểm tra trước khi quyết định",
        "AI tự động kiểm tra format/điều kiện nộp để giảm bài lỗi từ đầu"
      ],
      "columns": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "PARAGRAPH_TEXT",
      "title": "Nếu được thay đổi một điều trong các nền tảng quản lý hội nghị hiện nay để Chair đỡ quá tải hơn, bạn sẽ thay đổi điều gì?",
      "helpText": ""
    },
    {
      "type": "PAGE_BREAK",
      "title": "Phần C - Dành cho Author / Tác giả",
      "helpText": "",
      "pageId": "pageC"
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Vị trí/vai trò học thuật hiện tại của bạn (với vai trò Author) là gì?",
      "choices": [
        "Sinh viên đại học",
        "Học viên cao học (Master's student)",
        "Nghiên cứu sinh (PhD student)",
        "Postdoc / Nghiên cứu viên sau tiến sĩ",
        "Giảng viên / Nhà nghiên cứu",
        "Trưởng nhóm nghiên cứu (PI)",
        "Nhân viên R&D tại doanh nghiệp"
      ],
      "helpText": "Chọn vị trí học thuật/nghề nghiệp gần nhất hiện tại của bạn.",
      "hasOtherOption": true
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Trong 3 năm gần đây, bạn đã nộp bao nhiêu bài báo khoa học?",
      "choices": [
        "Chưa từng nộp",
        "1 bài",
        "2-3 bài",
        "4-6 bài",
        "Trên 6 bài"
      ],
      "helpText": ""
    },
    {
      "type": "CHECKBOX",
      "title": "Khi nộp bài, điều gì làm bạn mất thời gian hoặc dễ sai nhất?",
      "choices": [
        "Tìm đúng conference/track phù hợp",
        "Đọc và hiểu yêu cầu định dạng",
        "Chuẩn bị file đúng template",
        "Nhập title/abstract/keywords/thông tin đồng tác giả",
        "Khai báo conflict of interest",
        "Upload nhầm file hoặc thiếu file phụ",
        "Không biết bài đang ở trạng thái nào sau khi nộp",
        "Trao đổi rebuttal hoặc phản hồi reviewer"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Một lần nộp bài hoàn chỉnh thường khiến bạn mất bao lâu chỉ cho thao tác trên hệ thống?",
      "choices": [
        "Dưới 10 phút",
        "10-20 phút",
        "20-40 phút",
        "Trên 40 phút",
        "Tôi chưa từng nộp bài"
      ],
      "helpText": ""
    },
    {
      "type": "SCALE",
      "title": "Bạn thấy các form nộp bài hiện nay đơn giản và dễ hiểu đến mức nào?",
      "choices": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Bạn đã từng gặp lỗi format, thiếu thông tin hoặc nộp nhầm file chưa?",
      "choices": [
        "Chưa từng",
        "Có, nhưng ít khi",
        "Có, khá nhiều lần",
        "Tôi không chắc vì hệ thống không báo rõ"
      ],
      "helpText": ""
    },
    {
      "type": "GRID",
      "title": "Bạn đánh giá mức hữu ích của các hỗ trợ AI sau cho Author như thế nào?",
      "rows": [
        "AI tự đọc PDF/DOCX để điền sẵn title, abstract, keywords, tác giả",
        "AI kiểm tra format/file trước khi bấm nộp chính thức",
        "AI gợi ý track phù hợp và giải thích lý do",
        "AI nhắc các thiếu sót trong hồ sơ nộp bài bằng ngôn ngữ dễ hiểu",
        "AI hỗ trợ phác thảo phản hồi rebuttal dựa trên review"
      ],
      "columns": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Nếu AI tự điền thông tin bài báo cho bạn, bạn muốn hệ thống xử lý như thế nào?",
      "choices": [
        "Tự điền nhưng bắt buộc tôi kiểm tra và xác nhận từng mục",
        "Tự điền và cho phép tôi sửa nhanh những mục sai",
        "Chỉ gợi ý bên cạnh, tôi tự copy vào form",
        "Tôi không muốn AI đọc file bài báo của mình"
      ],
      "helpText": ""
    },
    {
      "type": "PARAGRAPH_TEXT",
      "title": "Trải nghiệm nộp bài lý tưởng của bạn nên đơn giản như thế nào? Hãy mô tả ngắn gọn.",
      "helpText": ""
    },
    {
      "type": "PAGE_BREAK",
      "title": "Phần D - Dành cho Reviewer / Người phản biện",
      "helpText": "",
      "pageId": "pageD"
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Vị trí/vai trò của bạn trong quá trình review là gì?",
      "choices": [
        "Program Committee (PC) Member chính thức",
        "Reviewer được mời riêng lẻ (external reviewer)",
        "Area Chair / Meta-reviewer",
        "Sub-reviewer / Trợ lý review cho PC member",
        "Trợ giảng (TA) hỗ trợ chấm/review bài",
        "Sinh viên hỗ trợ chấm bài dưới hướng dẫn giảng viên"
      ],
      "helpText": "Chọn vị trí gần nhất với vai trò review thực tế của bạn.",
      "hasOtherOption": true
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Trong 12 tháng gần đây, bạn đã review bao nhiêu bài báo khoa học?",
      "choices": [
        "Chưa từng review",
        "1-3 bài",
        "4-10 bài",
        "11-20 bài",
        "Trên 20 bài"
      ],
      "helpText": ""
    },
    {
      "type": "CHECKBOX",
      "title": "Điều gì làm quá trình review trở nên nặng nhất với bạn?",
      "choices": [
        "Bài được phân công không đúng chuyên môn",
        "Không đủ thời gian đọc kỹ",
        "Bài viết dài/khó hiểu, mất thời gian nắm ý chính",
        "Form review dài hoặc tiêu chí không rõ",
        "Khó viết feedback đủ chi tiết và mang tính xây dựng",
        "Khó theo dõi deadline và lời mời review",
        "Khó trao đổi khi có rebuttal/discussion",
        "Không có ghi nhận rõ ràng cho công sức review"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "SCALE",
      "title": "Các bài bạn từng được phân công review phù hợp với chuyên môn của bạn đến mức nào?",
      "choices": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Trung bình bạn mất bao lâu để hoàn thành một review nghiêm túc?",
      "choices": [
        "Dưới 1 giờ",
        "1-2 giờ",
        "2-4 giờ",
        "4-6 giờ",
        "Trên 6 giờ",
        "Tôi chưa từng review"
      ],
      "helpText": ""
    },
    {
      "type": "GRID",
      "title": "Bạn đánh giá mức hữu ích của các hỗ trợ AI sau cho Reviewer như thế nào?",
      "rows": [
        "AI tạo bản tóm tắt trung lập về đóng góp, phương pháp và kết quả chính",
        "AI làm nổi bật các điểm cần kiểm tra kỹ trước khi review",
        "AI gợi ý cấu trúc feedback theo điểm mạnh, điểm yếu, câu hỏi, khuyến nghị",
        "AI cảnh báo review quá ngắn, quá chung chung hoặc thiếu luận cứ",
        "AI hỗ trợ đối chiếu rebuttal với review ban đầu"
      ],
      "columns": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Bạn chấp nhận AI hỗ trợ review ở mức nào?",
      "choices": [
        "Chỉ tóm tắt và nhắc checklist, không đưa khuyến nghị điểm số",
        "Có thể gợi ý nhận xét, nhưng tôi phải viết và chịu trách nhiệm cuối cùng",
        "Có thể gợi ý cả điểm số/khuyến nghị, miễn là có giải thích rõ",
        "Tôi không muốn AI tham gia vào quá trình review"
      ],
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Khi hệ thống cảnh báo review của bạn có thể thiếu chi tiết, bạn sẽ phản ứng thế nào?",
      "choices": [
        "Tích cực, vì giúp đảm bảo chất lượng review",
        "Chấp nhận được nếu cảnh báo nhẹ nhàng và có thể bỏ qua",
        "Hơi phiền nhưng vẫn hữu ích",
        "Không thích vì có cảm giác bị đánh giá"
      ],
      "helpText": ""
    },
    {
      "type": "PARAGRAPH_TEXT",
      "title": "Nếu có một trợ lý giúp bạn review nhanh hơn nhưng vẫn giữ chất lượng học thuật, bạn muốn nó làm gì nhất?",
      "helpText": ""
    },
    {
      "type": "PAGE_BREAK",
      "title": "Phần E - Dành cho người quan tâm chung",
      "helpText": "",
      "pageId": "pageE"
    },
    {
      "type": "CHECKBOX",
      "title": "Theo bạn, một nền tảng quản lý hội nghị thế hệ mới nên ưu tiên điều gì?",
      "choices": [
        "Giao diện đơn giản, ít bước, dễ hiểu với người mới",
        "Dashboard rõ ràng cho từng vai trò",
        "Tự động điền dữ liệu từ file/hồ sơ có sẵn",
        "Kiểm tra lỗi sớm trước khi nộp hoặc xác nhận",
        "Gợi ý thông minh nhưng luôn cho người dùng quyền sửa/xác nhận",
        "Thông báo deadline và việc cần làm đúng lúc",
        "Trao đổi Author - Reviewer - Chair tập trung trong một nơi",
        "Minh bạch lý do AI đưa ra gợi ý"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "GRID",
      "title": "Bạn đồng ý với các nguyên tắc AI sau ở mức nào?",
      "rows": [
        "AI nên đóng vai trò trợ lý, không thay con người ra quyết định học thuật cuối cùng",
        "Mọi gợi ý AI cần có lý do hoặc bằng chứng để người dùng kiểm tra",
        "Người dùng phải có quyền tắt hoặc bỏ qua AI",
        "Dữ liệu bài báo/review cần được bảo vệ và không dùng tùy tiện để huấn luyện mô hình",
        "AI hữu ích nhất khi giảm thao tác lặp lại, không phải khi cố thay chuyên môn của người dùng"
      ],
      "columns": [
        "1",
        "2",
        "3",
        "4",
        "5"
      ],
      "helpText": ""
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Nếu một hệ thống mới đơn giản hơn các nền tảng lâu đời và có AI hỗ trợ có kiểm soát, bạn sẵn sàng thử ở mức nào?",
      "choices": [
        "Rất sẵn sàng dùng thử cho hội nghị thật",
        "Sẵn sàng dùng thử cho hội nghị nhỏ/lớp học/seminar trước",
        "Có thể thử nếu được hướng dẫn kỹ",
        "Chỉ quan sát, chưa muốn dùng",
        "Không sẵn sàng"
      ],
      "helpText": ""
    },
    {
      "type": "CHECKBOX",
      "title": "Điều gì sẽ khiến bạn tin tưởng một nền tảng như ConferenceSpace hơn?",
      "choices": [
        "Có giao diện rõ ràng và ít thuật ngữ khó hiểu",
        "Có hướng dẫn từng bước theo vai trò",
        "Có log/giải thích cho các gợi ý AI",
        "Có xác nhận thủ công trước các hành động quan trọng",
        "Có bảo mật dữ liệu bài báo và review",
        "Có thể xuất báo cáo/dữ liệu dễ dàng",
        "Có bản dùng thử cho hội nghị nhỏ",
        "Có hỗ trợ tiếng Việt và tiếng Anh"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "MULTIPLE_CHOICE",
      "title": "Nếu phải chọn một thông điệp chính cho ConferenceSpace, thông điệp nào thuyết phục bạn nhất?",
      "choices": [
        "Quản lý hội nghị khoa học đơn giản hơn cho mọi vai trò",
        "AI hỗ trợ để giảm thao tác lặp lại, con người vẫn quyết định",
        "Một dashboard rõ ràng thay cho nhiều màn hình rời rạc",
        "Nộp bài, phân công review và ra quyết định trong một quy trình liền mạch"
      ],
      "helpText": "",
      "hasOtherOption": true
    },
    {
      "type": "PARAGRAPH_TEXT",
      "title": "Bạn còn pain point nào về các hệ thống quản lý hội nghị hiện tại mà khảo sát chưa hỏi đến không?",
      "helpText": ""
    },
    {
      "type": "PARAGRAPH_TEXT",
      "title": "Bạn có đề xuất tính năng nào cho ConferenceSpace không?",
      "helpText": ""
    }
  ]
};

  const form = FormApp.create(formData.title || 'Khảo sát mới');
  if (formData.description) {
    form.setDescription(formData.description);
  }
  form.setCollectEmail(false);
  form.setProgressBar(true);

  let pageB, pageC, pageD, pageE, pageEmail, pageRole;
  let roleItem = null;
  let anonymityItem = null;

  formData.items.forEach(function(item) {
    let formItem;

    switch (item.type) {
      case 'PAGE_BREAK':
        formItem = form.addPageBreakItem().setTitle(item.title);
        if (item.helpText) formItem.setHelpText(item.helpText);
        if (item.pageId === 'pageB') pageB = formItem;
        else if (item.pageId === 'pageC') pageC = formItem;
        else if (item.pageId === 'pageD') pageD = formItem;
        else if (item.pageId === 'pageE') pageE = formItem;
        else if (item.pageId === 'pageEmail') pageEmail = formItem;
        else if (item.pageId === 'pageRole') pageRole = formItem;
        break;

      case 'TEXT':
        formItem = form.addTextItem().setTitle(item.title);
        if (item.helpText) formItem.setHelpText(item.helpText);
        break;

      case 'PARAGRAPH_TEXT':
        formItem = form.addParagraphTextItem().setTitle(item.title);
        if (item.helpText) formItem.setHelpText(item.helpText);
        break;

      case 'MULTIPLE_CHOICE':
        formItem = form.addMultipleChoiceItem().setTitle(item.title);
        if (item.helpText) formItem.setHelpText(item.helpText);
        if (item.isAnonymitySelector) {
          anonymityItem = formItem;
        } else if (item.isRoleSelector) {
          roleItem = formItem;
        } else if (item.choices) {
          formItem.setChoiceValues(item.choices);
        }
        if (item.hasOtherOption) formItem.showOtherOption(true);
        break;

      case 'CHECKBOX':
        formItem = form.addCheckboxItem().setTitle(item.title);
        if (item.helpText) formItem.setHelpText(item.helpText);
        if (item.choices) formItem.setChoiceValues(item.choices);
        if (item.hasOtherOption) formItem.showOtherOption(true);
        break;

      case 'SCALE':
        formItem = form.addScaleItem().setTitle(item.title);
        if (item.helpText) formItem.setHelpText(item.helpText);
        formItem.setBounds(1, 5);
        break;

      case 'GRID':
        formItem = form.addGridItem().setTitle(item.title);
        if (item.helpText) formItem.setHelpText(item.helpText);
        if (item.rows) formItem.setRows(item.rows);
        if (item.columns) formItem.setColumns(item.columns);
        break;

      default:
        Logger.log('Unknown type: ' + item.type);
    }
  });

  if (anonymityItem && pageEmail && pageRole) {
    anonymityItem.setChoices([
      anonymityItem.createChoice(ANONYMOUS_CHOICE, pageRole),
      anonymityItem.createChoice(CONTACT_CHOICE, pageEmail)
    ]);
    pageEmail.setGoToPage(pageRole);
  } else {
    Logger.log('CẢNH BÁO: thiếu pageEmail/pageRole hoặc anonymityItem — kiểm tra lại formData!');
  }

  if (roleItem && pageB && pageC && pageD && pageE) {
    roleItem.setChoices([
      roleItem.createChoice('Chair / Ban tổ chức hội nghị', pageB),
      roleItem.createChoice('Author / Tác giả nộp bài', pageC),
      roleItem.createChoice('Reviewer / Người phản biện', pageD),
      roleItem.createChoice(
        'Tôi chưa từng tham gia trực tiếp nhưng có quan tâm đến quy trình hội nghị khoa học',
        pageE
      )
    ]);
  } else {
    Logger.log('CẢNH BÁO: thiếu pageB/pageC/pageD/pageE hoặc roleItem — kiểm tra lại formData!');
  }

  if (pageB) pageB.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  if (pageC) pageC.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  if (pageD) pageD.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  if (pageE) pageE.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  Logger.log('Tạo form thành công!');
  Logger.log('Form ID: ' + form.getId());
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Edit URL: ' + form.getEditUrl());
  Logger.log('Next: set SURVEY_FORM_ID then run installSubmitTrigger() if needed.');

  return form;
}

function installSubmitTrigger() {
  if (!SURVEY_FORM_ID) {
    throw new Error('Set SURVEY_FORM_ID before installing the trigger.');
  }

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'onNeedsSurveySubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('onNeedsSurveySubmit')
    .forForm(FormApp.openById(SURVEY_FORM_ID))
    .onFormSubmit()
    .create();

  Logger.log('Submit trigger installed for form ' + SURVEY_FORM_ID);
}

function onNeedsSurveySubmit(e) {
  if (!e || !e.response || !SURVEY_FORM_ID) {
    return;
  }

  var isAnonymous = false;
  var contactResponse = null;

  e.response.getItemResponses().forEach(function(ir) {
    var title = ir.getItem().getTitle();
    if (title === ANONYMITY_QUESTION_TITLE) {
      isAnonymous = ir.getResponse() === ANONYMOUS_CHOICE;
    }
    if (title === CONTACT_QUESTION_TITLE) {
      contactResponse = ir;
    }
  });

  if (isAnonymous && contactResponse && contactResponse.getResponse()) {
    clearContactInResponseSheet_(e.response.getId(), CONTACT_QUESTION_TITLE);
  }
}

function clearContactInResponseSheet_(responseId, columnTitle) {
  var form = FormApp.openById(SURVEY_FORM_ID);
  var destinationId = form.getDestinationId();
  if (!destinationId) {
    return;
  }

  var sheet = SpreadsheetApp.openById(destinationId).getSheets()[0];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIndex = headers.indexOf(columnTitle);
  if (colIndex === -1) {
    return;
  }

  var response = form.getResponses().filter(function(r) {
    return r.getId() === responseId;
  })[0];
  if (!response) {
    return;
  }

  var timestamp = response.getTimestamp();
  var data = sheet.getDataRange().getValues();
  for (var row = 1; row < data.length; row++) {
    if (data[row][0].getTime && data[row][0].getTime() === timestamp.getTime()) {
      sheet.getRange(row + 1, colIndex + 1).setValue('');
      break;
    }
  }
}

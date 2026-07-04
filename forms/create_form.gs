
function createConferenceForm() {
  var formData = {
  "survey_title": "Khảo sát Nhu cầu Người dùng về Hệ thống Quản lý Hội nghị Khoa học",
  "survey_description": "Chào bạn, chúng tôi đang thực hiện một nghiên cứu khảo sát nhằm hiểu rõ hơn về những khó khăn và nhu cầu thực tế của người dùng khi tham gia vào quá trình tổ chức, nộp bài và phản biện tại các hội nghị khoa học. Những đóng góp quý báu của bạn sẽ là cơ sở quan trọng để phát triển một hệ thống quản lý hội nghị tối ưu, tiết kiệm thời gian và thân thiện hơn. Xin cảm ơn bạn đã dành thời gian tham gia!",
  "pages": [
    {
      "page_id": "page_1_role_selection",
      "title": "Thông tin chung",
      "description": "Vui lòng cho biết vai trò chính của bạn để chúng tôi có thể đưa ra các câu hỏi phù hợp nhất.",
      "questions": [
        {
          "id": "q_role",
          "type": "MULTIPLE_CHOICE",
          "question": "Vai trò chính của bạn khi tham gia các hội nghị khoa học thường là gì? (Vui lòng chọn vai trò bạn có nhiều kinh nghiệm nhất hoặc quan tâm nhất lúc này)",
          "options": [
            {
              "label": "Chair / Thành viên Ban tổ chức",
              "branch_to": "page_2_chair"
            },
            {
              "label": "Author / Tác giả nộp bài",
              "branch_to": "page_3_author"
            },
            {
              "label": "Reviewer / Chuyên gia phản biện",
              "branch_to": "page_4_reviewer"
            }
          ],
          "required": true
        }
      ]
    },
    {
      "page_id": "page_2_chair",
      "title": "Khảo sát dành cho Chair (Ban tổ chức)",
      "description": "Những câu hỏi này nhằm tìm hiểu quy trình quản lý và những khó khăn của ban tổ chức hội nghị.",
      "questions": [
        {
          "id": "c1",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn đã từng tham gia tổ chức hoặc làm Chair cho bao nhiêu hội nghị?",
          "options": [
            "Chưa từng (đang tìm hiểu)",
            "1 - 2 hội nghị",
            "3 - 5 hội nghị",
            "Trên 5 hội nghị"
          ],
          "required": true
        },
        {
          "id": "c2",
          "type": "CHECKBOXES",
          "question": "Khó khăn lớn nhất của bạn khi quản lý một hội nghị là gì? (Có thể chọn nhiều)",
          "options": [
            "Phân công bài cho phản biện (Reviewer Assignment)",
            "Thu thập và quản lý bài nộp",
            "Nhắc nhở deadline",
            "Kiểm tra đạo văn, format bài viết",
            "Sắp xếp lịch trình thuyết trình",
            "Giao tiếp với tác giả và phản biện"
          ],
          "required": true
        },
        {
          "id": "c3",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn thường mất bao nhiêu thời gian để phân công bài báo cho phản biện?",
          "options": [
            "Vài giờ",
            "1 - 2 ngày",
            "Gần 1 tuần",
            "Hơn 1 tuần"
          ],
          "required": true
        },
        {
          "id": "c4",
          "type": "SCALE",
          "question": "Bạn đánh giá mức độ khó khăn của việc tìm kiếm reviewer phù hợp với chuyên môn của từng bài báo như thế nào?",
          "min": 1,
          "max": 5,
          "min_label": "Rất dễ",
          "max_label": "Rất khó"
        },
        {
          "id": "c5",
          "type": "YES_NO",
          "question": "Việc kiểm tra xung đột lợi ích (Conflict of Interest - COI) giữa tác giả và phản biện có làm mất nhiều thời gian của bạn không?"
        },
        {
          "id": "c6",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn nghĩ sao về việc hệ thống tự động phát hiện các xung đột lợi ích (COI) dựa trên lịch sử hợp tác, đồng tác giả?",
          "options": [
            "Rất hữu ích, tiết kiệm nhiều thời gian",
            "Hữu ích nhưng tôi vẫn muốn tự kiểm tra lại",
            "Không cần thiết lắm"
          ]
        },
        {
          "id": "c7",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn thường sử dụng phần mềm nào để quản lý hội nghị?",
          "options": [
            "EasyChair",
            "CMT (Microsoft)",
            "EDAS",
            "Hệ thống tự xây dựng nội bộ",
            "Khác"
          ]
        },
        {
          "id": "c8",
          "type": "PARAGRAPH",
          "question": "Điểm yếu lớn nhất của các hệ thống quản lý hội nghị hiện tại bạn đang dùng là gì?"
        },
        {
          "id": "c9",
          "type": "YES_NO",
          "question": "Bạn có gặp khó khăn khi phải đọc lướt hàng trăm bài báo để phân loại (track) chúng vào các chủ đề phù hợp không?"
        },
        {
          "id": "c10",
          "type": "YES_NO",
          "question": "Bạn có muốn một công cụ giúp gợi ý phân loại bài báo vào các track phù hợp một cách tự động và nhanh chóng không?"
        },
        {
          "id": "c11",
          "type": "MULTIPLE_CHOICE",
          "question": "Tính năng nào sau đây bạn cho là RẤT CẦN THIẾT trong một hệ thống quản lý?",
          "options": [
            "Tự động gửi email nhắc nhở reviewer/author",
            "Gợi ý reviewer dựa trên độ phù hợp của chuyên môn",
            "Xuất báo cáo thống kê linh hoạt",
            "Quản lý và sinh tự động thư mời, template"
          ]
        },
        {
          "id": "c12",
          "type": "YES_NO",
          "question": "Bạn có nghĩ rằng một hệ thống tốt nên có khả năng tự động hóa quá trình kiểm tra format sơ bộ của bài nộp không?"
        },
        {
          "id": "c13",
          "type": "CHECKBOXES",
          "question": "Bạn muốn theo dõi tiến độ phản biện của toàn bộ hội nghị dưới dạng nào?",
          "options": [
            "Bảng dashboard tổng quan với biểu đồ",
            "Thông báo qua email/app khi có bài hoàn thành",
            "Báo cáo tổng hợp hàng tuần",
            "Danh sách bảng biểu truyền thống"
          ]
        },
        {
          "id": "c14",
          "type": "MULTIPLE_CHOICE",
          "question": "Trong quá trình đánh giá, nếu có 2 reviewer cho kết quả hoàn toàn trái ngược nhau, bạn thường xử lý thế nào?",
          "options": [
            "Tự đọc và quyết định",
            "Mời thêm reviewer thứ 3",
            "Mở một luồng thảo luận chung cho các reviewer",
            "Khác"
          ]
        },
        {
          "id": "c15",
          "type": "YES_NO",
          "question": "Bạn có nghĩ hệ thống nên tự động cảnh báo và làm nổi bật những bài báo có kết quả đánh giá mâu thuẫn cao để bạn kịp thời xử lý không?"
        },
        {
          "id": "c16",
          "type": "YES_NO",
          "question": "Việc lên lịch trình (schedule) cho các buổi thuyết trình tại hội nghị có phải là một công việc phức tạp với bạn không?"
        },
        {
          "id": "c17",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn có mong muốn hệ thống có thể gợi ý một lịch trình tối ưu, nhóm các bài thuyết trình có chung chủ đề lại với nhau không?",
          "options": [
            "Chắc chắn có",
            "Có cũng được",
            "Tôi muốn tự sắp xếp thủ công"
          ]
        },
        {
          "id": "c18",
          "type": "SCALE",
          "question": "Mức độ sẵn sàng trả phí cho một nền tảng quản lý hội nghị toàn diện, hiện đại và giúp bạn rảnh tay hơn của bạn?",
          "min": 1,
          "max": 5,
          "min_label": "Không sẵn sàng",
          "max_label": "Rất sẵn sàng"
        },
        {
          "id": "c19",
          "type": "PARAGRAPH",
          "question": "Bạn cần hỗ trợ tính năng gì nhất để giúp giảm tải công việc quản lý và tổ chức hội nghị của bạn?"
        },
        {
          "id": "c20",
          "type": "PARAGRAPH",
          "question": "Mời bạn để lại ý kiến đóng góp thêm về một hệ thống quản lý hội nghị lý tưởng (bất kỳ tính năng hoặc mong muốn nào bạn có):"
        }
      ]
    },
    {
      "page_id": "page_3_author",
      "title": "Khảo sát dành cho Author (Tác giả)",
      "description": "Những câu hỏi này nhằm tìm hiểu trải nghiệm và khó khăn của tác giả trong quá trình nộp bài khoa học.",
      "questions": [
        {
          "id": "a1",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn đã nộp bao nhiêu bài báo khoa học trong vòng 3 năm qua?",
          "options": [
            "Chưa nộp bài nào",
            "1 - 2 bài",
            "3 - 5 bài",
            "Trên 5 bài"
          ],
          "required": true
        },
        {
          "id": "a2",
          "type": "CHECKBOXES",
          "question": "Bạn thường gặp khó khăn gì nhất khi nộp bài báo? (Có thể chọn nhiều)",
          "options": [
            "Bài báo bị sai định dạng (format)",
            "Giao diện hệ thống nộp bài phức tạp, rườm rà",
            "Quên mất các mốc thời gian (deadline)",
            "Điền thông tin tác giả/đồng tác giả thủ công tốn thời gian",
            "Không nhận được phản hồi kịp thời"
          ]
        },
        {
          "id": "a3",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn thấy các hướng dẫn định dạng (format) bài báo của các hội nghị hiện nay như thế nào?",
          "options": [
            "Rõ ràng, dễ làm theo",
            "Hơi rườm rà nhưng chấp nhận được",
            "Quá phức tạp, mơ hồ và rất dễ làm sai"
          ]
        },
        {
          "id": "a4",
          "type": "YES_NO",
          "question": "Bạn có mong muốn hệ thống có khả năng tự động kiểm tra và báo lỗi format ngay lúc bạn tải file PDF lên (trước khi ấn nộp chính thức) không?"
        },
        {
          "id": "a5",
          "type": "SCALE",
          "question": "Bạn đánh giá chất lượng trung bình của các nhận xét phản biện (reviewer feedback) mà bạn nhận được như thế nào?",
          "min": 1,
          "max": 5,
          "min_label": "Rất tệ",
          "max_label": "Rất tốt"
        },
        {
          "id": "a6",
          "type": "YES_NO",
          "question": "Bạn có bao giờ nhận được những nhận xét phản biện quá chung chung, không đúng trọng tâm hoặc không mang tính xây dựng chưa?"
        },
        {
          "id": "a7",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn nghĩ sao nếu hệ thống cung cấp một công cụ giúp kiểm tra sơ bộ về tính mạch lạc, cấu trúc của bài viết trước khi nộp?",
          "options": [
            "Rất tuyệt vời, giúp tôi tự tin hơn",
            "Khá thú vị",
            "Không cần thiết, tôi tự kiểm tra được"
          ]
        },
        {
          "id": "a8",
          "type": "CHECKBOXES",
          "question": "Khi tìm kiếm hội nghị để nộp bài, bạn quan tâm đến yếu tố nào nhất?",
          "options": [
            "Độ uy tín (Rank, Index)",
            "Thời gian tổ chức & Deadline phù hợp",
            "Chủ đề đúng với hướng nghiên cứu",
            "Chi phí tham gia",
            "Địa điểm tổ chức"
          ]
        },
        {
          "id": "a9",
          "type": "YES_NO",
          "question": "Bạn có muốn một tính năng gợi ý các hội nghị hoặc tạp chí sắp tới phù hợp với hướng nghiên cứu hiện tại của bạn không?"
        },
        {
          "id": "a10",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn có muốn nhận thông báo về tiến độ bài nộp qua các kênh nào?",
          "options": [
            "Chỉ qua Email",
            "Qua ứng dụng di động (App notification)",
            "Tin nhắn (Zalo/Telegram/SMS)",
            "Tôi sẽ tự đăng nhập hệ thống để kiểm tra"
          ]
        },
        {
          "id": "a11",
          "type": "YES_NO",
          "question": "Bạn đã bao giờ thao tác nhầm lẫn (ví dụ: nộp nhầm file, điền sai tên tác giả) trên các hệ thống hiện tại chưa?"
        },
        {
          "id": "a12",
          "type": "MULTIPLE_CHOICE",
          "question": "Nếu hệ thống nộp bài được tích hợp AI đóng vai trò như một trợ lý ảo hướng dẫn bạn từng bước, bạn sẽ cảm thấy thế nào?",
          "options": [
            "Rất cần thiết, giúp tôi đỡ bỡ ngỡ",
            "Có thì tốt",
            "Không cần thiết, tôi đã quen với giao diện truyền thống"
          ]
        },
        {
          "id": "a13",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn nghĩ gì về tính năng hệ thống tự động trích xuất thông tin tác giả, abstract từ file PDF để điền sẵn vào form cho bạn?",
          "options": [
            "Rất thích, tiết kiệm nhiều thời gian thao tác",
            "Bình thường",
            "Tôi thích tự điền thủ công để tránh sai sót"
          ]
        },
        {
          "id": "a14",
          "type": "MULTIPLE_CHOICE",
          "question": "Giả sử hệ thống có các tính năng AI hỗ trợ tác giả, bạn thấy tính năng nào sau đây hấp dẫn nhất?",
          "options": [
            "Tự động kiểm tra và sửa lỗi format bài viết",
            "Gợi ý từ khóa (keywords) và phân loại (track) chính xác",
            "Phân tích và dự đoán những phần có thể bị đánh giá thấp",
            "Tìm kiếm và đề xuất các bài báo liên quan chưa được trích dẫn"
          ]
        },
        {
          "id": "a15",
          "type": "SCALE",
          "question": "Khi cần liên hệ với ban tổ chức (Chair) hoặc trao đổi lại với phản biện (rebuttal), bạn thấy các hệ thống hiện tại có hỗ trợ tốt không?",
          "min": 1,
          "max": 5,
          "min_label": "Rất kém",
          "max_label": "Rất tốt"
        },
        {
          "id": "a16",
          "type": "MULTIPLE_CHOICE",
          "question": "Khi nhận được nhận xét từ phản biện (reviewer), bạn có nghĩ một công cụ AI hỗ trợ dự thảo câu trả lời (rebuttal/response) dựa trên dữ liệu bài báo của bạn sẽ hữu ích không?",
          "options": [
            "Rất hữu ích, tiết kiệm nhiều thời gian suy nghĩ cách diễn đạt",
            "Hữu ích để tham khảo ý tưởng, nhưng tôi sẽ tự viết lại",
            "Không hữu ích, tôi muốn tự viết toàn bộ"
          ]
        },
        {
          "id": "a17",
          "type": "PARAGRAPH",
          "question": "Điều gì làm bạn cảm thấy khó chịu nhất khi sử dụng các hệ thống nộp bài (submission system) hiện tại?"
        },
        {
          "id": "a18",
          "type": "PARAGRAPH",
          "question": "Bạn mong đợi tính năng gì mới nhất để hỗ trợ tác giả tốt hơn trong quá trình nộp bài?"
        },
        {
          "id": "a19",
          "type": "PARAGRAPH",
          "question": "Trải nghiệm lý tưởng của bạn khi nộp bài cho một hội nghị khoa học là gì?"
        },
        {
          "id": "a20",
          "type": "PARAGRAPH",
          "question": "Bạn có đóng góp ý kiến nào khác để chúng tôi cải thiện hệ thống nộp bài không?"
        }
      ]
    },
    {
      "page_id": "page_4_reviewer",
      "title": "Khảo sát dành cho Reviewer (Chuyên gia phản biện)",
      "description": "Những câu hỏi này giúp chúng tôi hiểu quy trình phản biện và làm thế nào để hỗ trợ các reviewer đánh giá hiệu quả hơn.",
      "questions": [
        {
          "id": "r1",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn đã tham gia đánh giá (review) bao nhiêu bài báo trong năm qua?",
          "options": [
            "Chưa tham gia",
            "1 - 3 bài",
            "4 - 10 bài",
            "Trên 10 bài"
          ],
          "required": true
        },
        {
          "id": "r2",
          "type": "CHECKBOXES",
          "question": "Lý do chính khiến bạn nhận lời mời review là gì? (Có thể chọn nhiều)",
          "options": [
            "Trách nhiệm và nghĩa vụ học thuật",
            "Chủ đề bài báo hấp dẫn, đúng chuyên môn",
            "Nâng cao uy tín cá nhân",
            "Do người quen/đồng nghiệp mời",
            "Các quyền lợi khác từ hội nghị"
          ]
        },
        {
          "id": "r3",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn thường mất trung bình bao nhiêu thời gian để hoàn thành review cho một bài báo?",
          "options": [
            "Dưới 1 tiếng",
            "1 - 3 tiếng",
            "3 - 5 tiếng",
            "Hơn 5 tiếng"
          ]
        },
        {
          "id": "r4",
          "type": "CHECKBOXES",
          "question": "Khó khăn lớn nhất của bạn khi làm reviewer là gì?",
          "options": [
            "Không có đủ thời gian",
            "Bài báo được phân công không đúng chuyên môn",
            "Chất lượng bài viết quá khó hiểu (câu chữ, trình bày)",
            "Mất nhiều thời gian tìm kiếm tài liệu đối chiếu",
            "Giao diện hệ thống đánh giá khó dùng"
          ]
        },
        {
          "id": "r5",
          "type": "SCALE",
          "question": "Bạn đánh giá mức độ phù hợp của các bài báo được phân công cho bạn trong các hội nghị trước đây như thế nào?",
          "min": 1,
          "max": 5,
          "min_label": "Rất lạc đề",
          "max_label": "Rất đúng chuyên môn"
        },
        {
          "id": "r6",
          "type": "YES_NO",
          "question": "Bạn có nghĩ hệ thống nên phân tích lịch sử các bài báo bạn đã từng xuất bản để tự động gợi ý phân công bài review sát nhất với chuyên môn của bạn không?"
        },
        {
          "id": "r7",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn thích nhận thông báo nhắc nhở deadline review với tần suất như thế nào?",
          "options": [
            "Nhắc 1 lần trước deadline 1 tuần",
            "Nhắc nhiều lần khi gần đến hạn",
            "Chỉ nhắc khi đã quá hạn",
            "Không cần nhắc"
          ]
        },
        {
          "id": "r8",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn nghĩ sao nếu hệ thống cung cấp sẵn một bản tóm tắt nhanh (khoảng 300 từ) về các đóng góp chính của bài báo để bạn đọc lướt trước khi đi vào chi tiết?",
          "options": [
            "Rất tuyệt, giúp tôi nắm bắt nhanh",
            "Cũng hay nhưng không cần thiết lắm",
            "Tôi muốn tự đọc toàn bộ bài gốc từ đầu"
          ]
        },
        {
          "id": "r9",
          "type": "MULTIPLE_CHOICE",
          "question": "Khi cần tìm kiếm các tài liệu tham khảo (references) liên quan để đánh giá tính mới (novelty) của bài báo, bạn thường mất bao lâu?",
          "options": [
            "Không mất nhiều thời gian, tôi nhớ sẵn",
            "Mất khoảng 15-30 phút tìm kiếm",
            "Mất rất nhiều thời gian (hơn 1 tiếng)"
          ]
        },
        {
          "id": "r10",
          "type": "YES_NO",
          "question": "Sẽ thế nào nếu hệ thống tự động trích xuất và gợi ý sẵn các bài báo liên quan nhất để bạn tiện đối chiếu ngay trên màn hình đánh giá?"
        },
        {
          "id": "r11",
          "type": "YES_NO",
          "question": "Bạn có gặp khó khăn trong việc viết nhận xét (feedback) sao cho mang tính xây dựng, rõ ràng nhưng không quá gay gắt không?"
        },
        {
          "id": "r12",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn có muốn một công cụ gợi ý cấu trúc chuẩn cho bài nhận xét (ví dụ: chia sẵn mục Điểm mạnh, Điểm yếu, Góp ý chi tiết) để bạn chỉ việc điền vào không?",
          "options": [
            "Có, rất tiện lợi",
            "Bình thường",
            "Không, tôi thích viết tự do"
          ]
        },
        {
          "id": "r13",
          "type": "MULTIPLE_CHOICE",
          "question": "Bạn nghĩ sao về việc hệ thống có tính năng cảnh báo nhắc nhở nhẹ nhàng nếu nhận xét của bạn quá ngắn hoặc thiếu các luận điểm chi tiết trước khi nộp?",
          "options": [
            "Giúp duy trì chất lượng review tốt",
            "Hơi phiền phức",
            "Hoàn toàn không cần thiết"
          ]
        },
        {
          "id": "r14",
          "type": "MULTIPLE_CHOICE",
          "question": "Nếu có một công cụ AI hỗ trợ phân tích độ tin cậy của phương pháp nghiên cứu và dữ liệu thực nghiệm trong bài báo, bạn sẽ thấy thế nào?",
          "options": [
            "Rất hữu ích, giúp tôi đánh giá khách quan hơn",
            "Chỉ nên dùng để tham khảo",
            "Không cần thiết, tôi tự tin vào chuyên môn của mình"
          ]
        },
        {
          "id": "r15",
          "type": "MULTIPLE_CHOICE",
          "question": "Nếu AI hỗ trợ tự động rút trích các nội dung cốt lõi (đóng góp chính, phương pháp, kết quả) của bài báo để bạn dễ dàng đối chiếu, bạn sẽ thấy tính năng này như thế nào?",
          "options": [
            "Rất cần thiết, giúp tôi tiết kiệm thời gian đọc và tìm kiếm",
            "Tiện lợi nhưng tôi vẫn phải đọc lại toàn bộ bài",
            "Không cần thiết, tôi thích tự đọc và tổng hợp hơn"
          ]
        },
        {
          "id": "r16",
          "type": "CHECKBOXES",
          "question": "Bạn mong muốn Chair ghi nhận công sức review của mình bằng hình thức nào nhất?",
          "options": [
            "Cấp chứng nhận điện tử (Certificate)",
            "Được vinh danh trên trang web hội nghị",
            "Giảm phí tham gia (Registration fee)",
            "Cập nhật vào hồ sơ học thuật cá nhân (VD: Publons)",
            "Khác"
          ]
        },
        {
          "id": "r17",
          "type": "CHECKBOXES",
          "question": "Theo bạn, AI nên đóng vai trò như thế nào trong quá trình phản biện bài báo khoa học hiện nay?",
          "options": [
            "Trợ lý tìm kiếm lỗi đạo văn, format và trích dẫn",
            "Cung cấp góc nhìn phụ hoặc tóm tắt nội dung",
            "Phân tích và chấm điểm sơ bộ độ mới (novelty) của bài",
            "Hoàn toàn không nên can thiệp vào quá trình đánh giá chuyên môn"
          ]
        },
        {
          "id": "r18",
          "type": "PARAGRAPH",
          "question": "Điều làm bạn bực mình nhất khi sử dụng các hệ thống review hiện nay là gì?"
        },
        {
          "id": "r19",
          "type": "PARAGRAPH",
          "question": "Nếu được đề xuất một tính năng \"trong mơ\" giúp việc đánh giá bài báo của bạn nhàn hơn, đó sẽ là gì?"
        },
        {
          "id": "r20",
          "type": "PARAGRAPH",
          "question": "Mời bạn để lại đóng góp ý kiến cuối cùng để chúng tôi có thể cải thiện trải nghiệm cho Reviewer:"
        }
      ]
    }
  ]
};
  
  var form = FormApp.create(formData.survey_title);
  form.setDescription(formData.survey_description);
  form.setProgressBar(true);
  
  // Page 1: Role Selection
  var roleItem = form.addMultipleChoiceItem();
  roleItem.setTitle(formData.pages[0].questions[0].question)
          .setRequired(true);
          
  // Page 2: Chair
  var chairPage = form.addPageBreakItem()
      .setTitle(formData.pages[1].title)
      .setHelpText(formData.pages[1].description);
  addQuestions(form, formData.pages[1].questions);
  chairPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  
  // Page 3: Author
  var authorPage = form.addPageBreakItem()
      .setTitle(formData.pages[2].title)
      .setHelpText(formData.pages[2].description);
  addQuestions(form, formData.pages[2].questions);
  authorPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  
  // Page 4: Reviewer
  var reviewerPage = form.addPageBreakItem()
      .setTitle(formData.pages[3].title)
      .setHelpText(formData.pages[3].description);
  addQuestions(form, formData.pages[3].questions);
  reviewerPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  
  // Set branching logic on the first question
  roleItem.setChoices([
    roleItem.createChoice(formData.pages[0].questions[0].options[0].label, chairPage),
    roleItem.createChoice(formData.pages[0].questions[0].options[1].label, authorPage),
    roleItem.createChoice(formData.pages[0].questions[0].options[2].label, reviewerPage)
  ]);
  
  Logger.log("Form created successfully!");
  Logger.log("Edit URL: " + form.getEditUrl());
  Logger.log("Published URL: " + form.getPublishedUrl());
}

function addQuestions(form, questions) {
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (q.type === 'MULTIPLE_CHOICE') {
      var item = form.addMultipleChoiceItem();
      item.setTitle(q.question);
      if (q.options) item.setChoiceValues(q.options);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'CHECKBOXES') {
      var item = form.addCheckboxItem();
      item.setTitle(q.question);
      if (q.options) item.setChoiceValues(q.options);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'SCALE') {
      var item = form.addScaleItem();
      item.setTitle(q.question);
      item.setBounds(q.min, q.max);
      item.setLabels(q.min_label, q.max_label);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'YES_NO') {
      var item = form.addMultipleChoiceItem();
      item.setTitle(q.question);
      item.setChoiceValues(['Có', 'Không']);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'PARAGRAPH') {
      var item = form.addParagraphTextItem();
      item.setTitle(q.question);
      if (q.required) item.setRequired(true);
    }
  }
}

"""Product Journey poster composition."""

from scripts.poster.poster_common import (
    COLORS,
    Svg,
    card,
    footer_rule,
    header,
    metric_card,
    page_background,
    pill,
    section_title,
    ui_placeholder,
)


def _problem_and_model(svg: Svg) -> None:
    section_title(svg, 28, 130, "Từ bài toán đến ranh giới trách nhiệm", kicker="01 · Luận điểm", width=306)
    card(svg, 28, 145, 306, 94, fill=COLORS["soft_blue"], accent=COLORS["accent"])
    svg.text(45, 169, "VẤN ĐỀ", size=4, fill=COLORS["accent"], weight=700, letter_spacing=0.7)
    svg.wrapped_text(
        45,
        185,
        "Quy trình xét duyệt cần quản lý trạng thái và quyền hạn, đề xuất phản biện có thể giải thích, đồng thời hỗ trợ đọc và tổng hợp mà không chuyển trách nhiệm học thuật cho hệ thống tự động.",
        width=270,
        size=4.15,
        line_height=6.2,
        max_lines=5,
    )
    svg.text(28, 260, "MÔ HÌNH BA LỚP", size=5.6, fill=COLORS["primary"], weight=700)
    layers = (
        ("01", "NGHIỆP VỤ CỐT LÕI", "Trạng thái · quyền hạn · dữ liệu chính thức", COLORS["primary"], COLORS["soft_blue"]),
        ("02", "THUẬT TOÁN KIỂM CHỨNG", "Xếp hạng · đề xuất · kiểm tra COI", COLORS["teal"], "#E6F5F3"),
        ("03", "AI HỖ TRỢ CÓ KIỂM SOÁT", "Bản nháp · cảnh báo · phân tích · tổng hợp", COLORS["accent"], "#EEF2F6"),
    )
    for index, (number, title, note, accent, fill) in enumerate(layers):
        y = 273 + index * 76
        card(svg, 28, y, 306, 63, fill=fill, accent=accent)
        svg.circle(58, y + 31.5, 18, fill=accent)
        svg.text(58, y + 35, number, size=6, fill="#FFFFFF", weight=700, anchor="middle")
        svg.text(87, y + 24, title, size=4.4, fill=accent, weight=700)
        svg.wrapped_text(87, y + 39, note, width=226, size=3.45, fill=COLORS["muted_text"], max_lines=2)
    card(svg, 28, 517, 306, 91, fill=COLORS["primary"])
    svg.text(45, 542, "NGUYÊN TẮC KIỂM SOÁT", size=4, fill="#BBD0DE", weight=700, letter_spacing=0.6)
    svg.wrapped_text(
        45,
        562,
        "Kết quả từ thuật toán và AI chỉ trở thành hành động nghiệp vụ sau khi người có thẩm quyền kiểm tra và xác nhận.",
        width=270,
        size=5.2,
        line_height=7.2,
        fill="#FFFFFF",
        weight=700,
        max_lines=4,
    )
    card(svg, 28, 620, 306, 94, fill=COLORS["card"])
    svg.text(45, 643, "PHẠM VI SẢN PHẨM", size=4, fill=COLORS["accent"], weight=700, letter_spacing=0.6)
    for index, item in enumerate((
        "Nộp bài → phân công → phản biện",
        "Rebuttal · thảo luận · quyết định",
        "Camera-ready cho bài được chấp nhận",
    )):
        svg.wrapped_text(45, 661 + index * 17, item, width=270, size=3.65, bullet=True, max_lines=1)


def _role_journey(svg: Svg) -> None:
    section_title(svg, 354, 130, "HÀNH TRÌNH THEO VAI TRÒ", kicker="02 · Sản phẩm", width=487)
    roles = (
        (
            "TÁC GIẢ",
            "Nộp bài có kiểm soát",
            "Autofill tạo bản nháp; Gating kiểm tra luật và cảnh báo nội dung.",
            "chapter_3_uc02_autofill_1.png",
            "Tiêu đề F1 98,20%",
            COLORS["primary"],
        ),
        (
            "PHẢN BIỆN VIÊN",
            "Đọc và rà soát có căn cứ",
            "Initial Analysis định hướng đọc; Quality Auditor nêu điểm cần kiểm tra.",
            "chapter_3_uc05_reviewer_initial_analysis.png",
            "Trích dẫn bám nguồn 96,22%",
            COLORS["teal"],
        ),
        (
            "CHỦ TỌA",
            "Phân công và quyết định",
            "Đề xuất phản biện có lý do; Copilot tổng hợp đồng thuận và bất đồng.",
            "chapter_3_uc09_decision_support.png",
            "Cơ sở bằng chứng 87,34%",
            COLORS["accent"],
        ),
    )
    role_w = 155
    gap = 11
    for index, (role, title, description, filename, metric, accent) in enumerate(roles):
        x = 354 + index * (role_w + gap)
        card(svg, x, 145, role_w, 340, fill=COLORS["card"])
        svg.rect(x, 145, role_w, 45, fill=accent, radius=10)
        svg.circle(x + 24, 167, 12, fill="#FFFFFF", stroke="#FFFFFF", sw=1)
        svg.text(x + 24, 171, str(index + 1), size=5.5, fill=accent, weight=700, anchor="middle")
        svg.text(x + 44, 164, role, size=3.6, fill="#DCE8EF", weight=700, letter_spacing=0.45)
        svg.wrapped_text(x + 44, 178, title, width=100, size=4.1, fill="#FFFFFF", weight=700, max_lines=2)
        svg.wrapped_text(x + 13, 211, description, width=role_w - 26, size=3.35, line_height=5.1, fill=COLORS["muted_text"], max_lines=4)
        ui_placeholder(svg, x + 12, 262, role_w - 24, 119, role, filename)
        pill(svg, x + 12, 394, metric, fill=COLORS["soft_green"], text_color=COLORS["success"], width=role_w - 24)
        if index == 0:
            svg.text(x + 14, 432, "F1 từ khóa", size=3.2, fill=COLORS["muted_text"])
            svg.text(x + role_w - 14, 432, "92,77%", size=5.2, fill=accent, weight=700, anchor="end")
        elif index == 1:
            svg.text(x + 14, 432, "Điểm cần lưu ý", size=3.2, fill=COLORS["muted_text"])
            svg.text(x + role_w - 14, 432, "69,86%", size=5.2, fill=accent, weight=700, anchor="end")
        else:
            svg.text(x + 14, 432, "Tổng hợp bất đồng", size=3.2, fill=COLORS["muted_text"])
            svg.text(x + role_w - 14, 432, "87,11%", size=5.2, fill=accent, weight=700, anchor="end")
        svg.line(x + 14, 442, x + role_w - 14, 442, stroke=COLORS["border"], sw=0.7)
        svg.text(x + role_w / 2, 464, "NGƯỜI DÙNG KIỂM TRA & XÁC NHẬN", size=2.7, fill=accent, weight=700, anchor="middle")
    for x in (515, 681):
        svg.raw(f'<path d="M {x} 309 h 8 l -4 -4 m 4 4 l -4 4" fill="none" stroke="{COLORS["primary"]}" stroke-width="1.5"/>')

    section_title(svg, 354, 512, "Thiết lập đánh giá", kicker="03 · Bằng chứng", width=487)
    setups = (
        ("BACKEND", "3 kịch bản · 20 VU · 30 giây", "300 hội nghị · 15.000 bài"),
        ("THUẬT TOÁN", "60 hồ sơ · 2.565 bài tổng hợp", "Leave-one-out + microbenchmark"),
        ("AI", "1.127 bài · 1.097 đủ điều kiện", "Đối chiếu trực tiếp + TCA"),
        ("UAT", "91 phản hồi", "76 Tác giả · 7 PBV · 8 Chủ tọa"),
    )
    setup_w = 116
    for index, (title, value, note) in enumerate(setups):
        x = 354 + index * 124
        card(svg, x, 527, setup_w, 83, fill="#FFFFFF")
        svg.text(x + 11, 547, title, size=3.3, fill=COLORS["accent"], weight=700, letter_spacing=0.45)
        svg.wrapped_text(x + 11, 566, value, width=setup_w - 22, size=3.6, weight=700, max_lines=2)
        svg.wrapped_text(x + 11, 592, note, width=setup_w - 22, size=2.8, fill=COLORS["muted_text"], max_lines=2)
    card(svg, 354, 622, 487, 92, fill=COLORS["soft_amber"], accent=COLORS["warning"])
    svg.text(371, 645, "ĐỌC ĐÚNG PHẠM VI", size=4, fill="#A45A00", weight=700, letter_spacing=0.55)
    svg.wrapped_text(
        371,
        664,
        "Hit@k/MRR là bằng chứng truy hồi gián tiếp; TCA đo quan hệ mệnh đề–bằng chứng; UAT phản ánh cảm nhận của mẫu tham gia. Không chỉ số nào thay thế phán đoán học thuật.",
        width=450,
        size=3.55,
        line_height=5.3,
        fill="#754200",
        max_lines=4,
    )


def _evidence_column(svg: Svg) -> None:
    section_title(svg, 861, 130, "Kết quả nổi bật", kicker="04 · Kết quả", width=300)
    metric_card(svg, 861, 145, 144, 95, "p95 < 120 ms", "0% yêu cầu thất bại", "Ba endpoint · tải ngắn hạn", accent=COLORS["primary"])
    metric_card(svg, 1017, 145, 144, 95, "MRR 0,392", "Hit@10 65%", "Jaccard · 60 truy vấn", accent=COLORS["teal"])
    metric_card(svg, 861, 252, 144, 95, "65,9%", "đủ hai phản biện", "Greedy · dữ liệu tổng hợp", accent=COLORS["accent"])
    metric_card(svg, 1017, 252, 144, 95, "73/91", "sẵn sàng giới thiệu", "Mẫu lệch 83,5% Tác giả", accent=COLORS["success"])
    card(svg, 861, 359, 300, 114, fill=COLORS["soft_red"], accent=COLORS["risk"])
    svg.text(879, 382, "TÍN HIỆU CẦN THẬN TRỌNG", size=3.8, fill=COLORS["risk"], weight=700, letter_spacing=0.45)
    svg.text(879, 417, "46,99%", size=16, fill=COLORS["risk"], weight=700)
    svg.wrapped_text(965, 404, "phát hiện Quality Auditor đồng thời bám nguồn và hợp lệ", width=176, size=4.1, line_height=5.6, weight=700, max_lines=3)
    svg.wrapped_text(879, 453, "Phản biện viên phải kiểm tra trước khi sử dụng.", width=260, size=3.2, fill="#8A2F2A", max_lines=2)
    card(svg, 861, 485, 300, 125, fill=COLORS["card"])
    svg.text(879, 508, "PHẠM VI KẾT LUẬN", size=4, fill=COLORS["accent"], weight=700, letter_spacing=0.55)
    limits = (
        "Đối sánh dùng dữ liệu tổng hợp.",
        "TCA/NLI chưa hiệu chuẩn bằng nhãn chuyên gia.",
        "Tập AI chủ yếu gồm bài tiếng Anh.",
        "UAT mất cân bằng vai trò.",
    )
    for index, item in enumerate(limits):
        svg.wrapped_text(879, 529 + index * 19, item, width=260, size=3.35, bullet=True, max_lines=1)
    card(svg, 861, 622, 300, 92, fill=COLORS["primary"])
    svg.text(879, 648, "KẾT LUẬN", size=4, fill="#BBD0DE", weight=700, letter_spacing=0.6)
    svg.wrapped_text(
        879,
        669,
        "ConferenceSpace cho thấy tính khả thi trong điều kiện thử nghiệm và chỉ rõ nơi con người vẫn phải kiểm tra, điều chỉnh và quyết định.",
        width=260,
        size=4.1,
        line_height=6,
        fill="#FFFFFF",
        weight=700,
        max_lines=4,
    )


def _contribution_strip(svg: Svg) -> None:
    svg.text(28, 736, "BA ĐÓNG GÓP", size=4, fill=COLORS["accent"], weight=700, letter_spacing=0.65)
    contributions = (
        ("01", "Nền tảng vòng đời xét duyệt", "Các chức năng hỗ trợ hoạt động trong cùng trạng thái và quyền hạn nghiệp vụ.", COLORS["primary"]),
        ("02", "Mô hình ba lớp trách nhiệm", "Phân biệt tác vụ vận hành, thuật toán xác định và AI có đầu ra do người dùng kiểm tra.", COLORS["teal"]),
        ("03", "Chuỗi bằng chứng theo tác vụ", "Kết quả, trường hợp lỗi và khoảng trống đánh giá được trình bày riêng.", COLORS["accent"]),
    )
    for index, (number, title, note, accent) in enumerate(contributions):
        x = 28 + index * 386
        card(svg, x, 747, 361, 64, fill=COLORS["card"], accent=accent)
        svg.circle(x + 30, 779, 16, fill=accent)
        svg.text(x + 30, 783, number, size=5.2, fill="#FFFFFF", weight=700, anchor="middle")
        svg.text(x + 56, 771, title, size=4.1, fill=accent, weight=700)
        svg.wrapped_text(x + 56, 788, note, width=282, size=3.15, fill=COLORS["muted_text"], max_lines=2)


def build() -> str:
    svg = Svg("ConferenceSpace poster version A - Product Journey")
    page_background(svg)
    header(svg, variant_label="Phiên bản A · Product Journey")
    _problem_and_model(svg)
    _role_journey(svg)
    _evidence_column(svg)
    _contribution_strip(svg)
    footer_rule(svg, "CON NGƯỜI GIỮ QUYỀN QUYẾT ĐỊNH HỌC THUẬT  ·  AI CHỈ HỖ TRỢ CÓ KIỂM SOÁT")
    return svg.finish()

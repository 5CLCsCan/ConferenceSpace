"""Classic three-column research poster for ConferenceSpace."""

from scripts.poster.poster_common import (
    COLORS,
    Svg,
    academic_header,
    footer_rule,
    mini_bar_chart,
    page_background,
    poster_image_placeholder,
)


def _heading(svg: Svg, x: float, y: float, number: str, title: str, width: float) -> None:
    svg.text(x, y, number, size=3.4, fill=COLORS["teal"], weight=700, letter_spacing=0.8)
    svg.text(x, y + 13, title, size=7.2, fill=COLORS["primary"], weight=700, css_class="display")
    svg.line(x, y + 19, x + width, y + 19, stroke=COLORS["primary"], sw=1.1)


def _context_column(svg: Svg) -> None:
    x, width = 28, 272
    _heading(svg, x, 186, "01 · BỐI CẢNH", "Bài toán & định hướng", width)
    svg.wrapped_text(
        x,
        228,
        "Quy trình xét duyệt cần duy trì trạng thái, quyền hạn và bằng chứng xuyên suốt; đồng thời giảm thao tác thủ công mà không chuyển trách nhiệm học thuật cho hệ thống tự động.",
        width=width,
        size=4.35,
        line_height=6.5,
        max_lines=6,
    )
    svg.text(x, 286, "MÔ HÌNH BA LỚP TRÁCH NHIỆM", size=4.1, fill=COLORS["primary"], weight=700, letter_spacing=0.35)
    layers = (
        ("1", "NGHIỆP VỤ CỐT LÕI", "Trạng thái · quyền hạn · dữ liệu chính thức", COLORS["primary"]),
        ("2", "THUẬT TOÁN KIỂM CHỨNG", "Xếp hạng phản biện · phát hiện xung đột", COLORS["teal"]),
        ("3", "AI HỖ TRỢ CÓ KIỂM SOÁT", "Bản nháp · cảnh báo · phân tích · tổng hợp", COLORS["accent"]),
    )
    for index, (number, title, note, color) in enumerate(layers):
        y = 304 + index * 62
        svg.rect(x, y, 7, 48, fill=color, radius=0)
        svg.text(x + 18, y + 17, number, size=8.5, fill=color, weight=700)
        svg.text(x + 44, y + 14, title, size=3.9, fill=color, weight=700)
        svg.wrapped_text(x + 44, y + 31, note, width=width - 48, size=3.25, fill=COLORS["muted_text"], max_lines=2)
        if index < 2:
            svg.line(x + 21, y + 48, x + 21, y + 59, stroke=COLORS["border"], sw=1.2)

    svg.rect(x, 502, width, 67, fill=COLORS["primary"], radius=0)
    svg.text(x + 14, 524, "NGUYÊN TẮC KIỂM SOÁT", size=3.7, fill="#BBD0DE", weight=700, letter_spacing=0.5)
    svg.wrapped_text(
        x + 14,
        544,
        "Thuật toán và AI chỉ tạo căn cứ hỗ trợ. Người có thẩm quyền kiểm tra, điều chỉnh và xác nhận trước khi trạng thái nghiệp vụ thay đổi.",
        width=width - 28,
        size=3.65,
        line_height=5.3,
        fill="#FFFFFF",
        weight=700,
        max_lines=4,
    )
    svg.text(x, 599, "PHẠM VI SẢN PHẨM", size=4.1, fill=COLORS["primary"], weight=700)
    scope = (
        "Nộp bài và quản lý bản thảo",
        "Phân công và phản biện",
        "Rebuttal, thảo luận và quyết định",
        "Camera-ready cho bài được chấp nhận",
    )
    for index, item in enumerate(scope):
        svg.wrapped_text(x, 621 + index * 22, item, width=width, size=3.65, bullet=True, max_lines=1)


def _dominant_workflow(svg: Svg) -> None:
    x, width = 322, 548
    _heading(svg, x, 186, "02 · SẢN PHẨM", "Một vòng đời xét duyệt có kiểm soát", width)
    svg.raw('<g id="dominant-figure">')
    svg.rect(x, 226, width, 146, fill="#F2F6F8", stroke=COLORS["border"], sw=0.7, radius=1)
    stages = (
        ("01", "NỘP BÀI", "Tác giả", COLORS["primary"]),
        ("02", "ĐỀ XUẤT", "Thuật toán", COLORS["teal"]),
        ("03", "PHẢN BIỆN", "Phản biện viên", COLORS["accent"]),
        ("04", "QUYẾT ĐỊNH", "Chủ tọa", COLORS["primary"]),
    )
    centers = (376, 518, 660, 802)
    for index, ((number, title, owner, color), cx) in enumerate(zip(stages, centers)):
        svg.circle(cx, 278, 28, fill="#FFFFFF", stroke=color, sw=2.2)
        svg.text(cx, 274, number, size=4, fill=color, weight=700, anchor="middle")
        svg.text(cx, 286, title, size=4.2, fill=color, weight=700, anchor="middle")
        svg.text(cx, 326, owner, size=3.45, fill=COLORS["muted_text"], weight=700, anchor="middle")
        if index < 3:
            svg.line(cx + 31, 278, centers[index + 1] - 31, 278, stroke=COLORS["primary"], sw=1.8)
            svg.raw(f'<path d="M {centers[index + 1] - 36} 273 l 6 5 -6 5" fill="none" stroke="{COLORS["primary"]}" stroke-width="1.8"/>')
    svg.line(802, 342, 376, 342, stroke=COLORS["teal"], sw=1.2, dash="6 4")
    svg.raw(f'<path d="M 382 337 l -6 5 6 5" fill="none" stroke="{COLORS["teal"]}" stroke-width="1.5"/>')
    svg.text(589, 358, "phản hồi · thảo luận · hiệu chỉnh", size=3.3, fill=COLORS["teal"], weight=700, anchor="middle")
    svg.raw("</g>")

    svg.text(x, 399, "BA ĐIỂM CHẠM SẢN PHẨM", size=4.1, fill=COLORS["primary"], weight=700, letter_spacing=0.3)
    placeholders = (
        ("TÁC GIẢ", "chapter_3_uc02_autofill_1.png"),
        ("PHẢN BIỆN VIÊN", "chapter_3_uc05_reviewer_initial_analysis.png"),
        ("CHỦ TỌA", "chapter_3_uc09_decision_support.png"),
    )
    frame_width = 174
    for index, (role, filename) in enumerate(placeholders):
        px = x + index * 187
        poster_image_placeholder(svg, px, 414, frame_width, 128, role, filename)
        svg.text(px, 557, f"Hình {index + 1}. Giao diện {role.title()}", size=2.95, fill=COLORS["muted_text"])

    svg.text(x, 591, "THIẾT LẬP ĐÁNH GIÁ", size=4.1, fill=COLORS["primary"], weight=700)
    evidence = (
        ("BACKEND", "3 kịch bản · 20 VU · 30 giây"),
        ("ĐỐI SÁNH", "60 hồ sơ · 2.565 bài tổng hợp"),
        ("AI", "1.127 bài · 1.097 đủ điều kiện"),
        ("UAT", "91 phản hồi"),
    )
    for index, (label, note) in enumerate(evidence):
        ey = 613 + index * 25
        svg.text(x, ey, label, size=3.35, fill=COLORS["teal"], weight=700)
        svg.text(x + 72, ey, note, size=3.35, fill=COLORS["foreground"])
        svg.line(x + 72, ey + 5, x + width, ey + 5, stroke=COLORS["border"], sw=0.55)


def _results_column(svg: Svg) -> None:
    x, width = 892, 269
    _heading(svg, x, 186, "03 · KẾT QUẢ", "Bằng chứng nổi bật", width)
    svg.text(x, 228, "ĐỘ TRỄ p95 THEO KỊCH BẢN", size=3.65, fill=COLORS["primary"], weight=700)
    mini_bar_chart(
        svg,
        x,
        240,
        width,
        118,
        [117.6, 71.8, 79.3],
        ["Truy vấn đọc", "Đối sánh", "COI"],
        maximum=130,
        colors=[COLORS["primary"], COLORS["teal"], COLORS["warning"]],
        value_suffix=" ms",
        threshold=120,
    )
    svg.text(x, 370, "p95 < 120 ms", size=6.8, fill=COLORS["success"], weight=700)
    svg.text(x + width, 370, "0% yêu cầu thất bại", size=3.25, fill=COLORS["muted_text"], anchor="end")

    svg.text(x, 404, "ĐỐI SÁNH & PHÂN CÔNG", size=3.65, fill=COLORS["primary"], weight=700)
    svg.text(x, 431, "MRR 0,392", size=7.2, fill=COLORS["teal"], weight=700)
    svg.text(x + 138, 431, "Hit@10 65%", size=5.1, fill=COLORS["primary"], weight=700)
    svg.text(x, 451, "65,9% đủ hai phản biện · dữ liệu tổng hợp", size=3.2, fill=COLORS["muted_text"])

    svg.text(x, 486, "CHUỖI BẰNG CHỨNG AI", size=3.65, fill=COLORS["primary"], weight=700)
    rows = (
        ("Submission Autofill", "98,20%", COLORS["primary"]),
        ("Reviewer Initial Analysis", "96,22%", COLORS["teal"]),
        ("Chair Decision Copilot", "87,34%", COLORS["accent"]),
        ("Review Quality Auditor", "46,99%", COLORS["risk"]),
    )
    for index, (label, value, color) in enumerate(rows):
        y = 510 + index * 28
        svg.rect(x, y - 10, 5, 18, fill=color, radius=0)
        svg.text(x + 12, y, label, size=3.05, fill=COLORS["foreground"], weight=700)
        svg.text(x + width, y, value, size=4.8, fill=color, weight=700, anchor="end")
        svg.line(x + 12, y + 8, x + width, y + 8, stroke=COLORS["border"], sw=0.5)

    svg.text(x, 638, "TRẢI NGHIỆM & PHẠM VI", size=3.65, fill=COLORS["primary"], weight=700)
    svg.text(x, 666, "73/91", size=7.2, fill=COLORS["success"], weight=700)
    svg.text(x + 60, 666, "sẵn sàng giới thiệu", size=3.3, fill=COLORS["muted_text"])
    svg.wrapped_text(
        x,
        690,
        "Các kết quả được diễn giải trong điều kiện thử nghiệm; dữ liệu đối sánh là dữ liệu tổng hợp, tập AI chủ yếu là bài tiếng Anh và mẫu UAT mất cân bằng vai trò.",
        width=width,
        size=3.2,
        line_height=4.8,
        fill=COLORS["muted_text"],
        max_lines=5,
    )


def _conclusion_strip(svg: Svg) -> None:
    svg.rect(28, 752, 1133, 58, fill="#EEF4F5", radius=0)
    svg.rect(28, 752, 9, 58, fill=COLORS["teal"], radius=0)
    svg.text(52, 773, "KẾT LUẬN", size=3.8, fill=COLORS["teal"], weight=700, letter_spacing=0.5)
    svg.wrapped_text(
        142,
        773,
        "ConferenceSpace đã triển khai được nền tảng xét duyệt cùng mô hình ba lớp trách nhiệm và chuỗi bằng chứng riêng cho từng tác vụ; con người vẫn kiểm tra, điều chỉnh và quyết định.",
        width=980,
        size=4.55,
        line_height=6.6,
        fill=COLORS["primary"],
        weight=700,
        max_lines=3,
    )


def build() -> str:
    svg = Svg("ConferenceSpace — poster nghiên cứu ba cột")
    page_background(svg)
    academic_header(svg, edition="Phiên bản A · Poster nghiên cứu")
    svg.rect(0, 112, 1189, 52, fill=COLORS["primary"], radius=0)
    svg.text(594.5, 135, "TỪ QUY TRÌNH RỜI RẠC ĐẾN MỘT VÒNG ĐỜI CÓ KIỂM SOÁT", size=10.2, fill="#FFFFFF", weight=700, anchor="middle", css_class="display")
    svg.text(594.5, 153, "Nghiệp vụ ổn định · thuật toán có thể kiểm chứng · AI hỗ trợ dưới quyền xác nhận của con người", size=4.2, fill="#DCE8EF", anchor="middle")
    _context_column(svg)
    _dominant_workflow(svg)
    _results_column(svg)
    _conclusion_strip(svg)
    footer_rule(svg, "CONFERENCE SPACE · NỀN TẢNG XÉT DUYỆT THỰC NGHIỆM CÓ KIỂM SOÁT")
    return svg.finish()

"""Product showcase poster centered on the ConferenceSpace system story."""

from scripts.poster.poster_common import (
    COLORS,
    Svg,
    academic_header,
    footer_rule,
    page_background,
    poster_image_placeholder,
)


def _product_triptych(svg: Svg) -> None:
    svg.text(28, 188, "BA VAI TRÒ · MỘT QUY TRÌNH LIÊN TỤC", size=4.2, fill=COLORS["primary"], weight=700, letter_spacing=0.45)
    placeholders = (
        ("TÁC GIẢ", "Nộp bài và kiểm soát thông tin", "chapter_3_uc02_autofill_1.png", COLORS["primary"]),
        ("PHẢN BIỆN VIÊN", "Đọc, đánh giá và thảo luận", "chapter_3_uc05_reviewer_initial_analysis.png", COLORS["teal"]),
        ("CHỦ TỌA", "Phân công và ra quyết định", "chapter_3_uc06_assignment_suggestions.png", COLORS["accent"]),
    )
    frame_width = 355
    for index, (role, caption, filename, color) in enumerate(placeholders):
        x = 28 + index * 389
        svg.text(x, 211, role, size=5.2, fill=color, weight=700)
        svg.text(x + frame_width, 211, caption, size=3.2, fill=COLORS["muted_text"], anchor="end")
        poster_image_placeholder(svg, x, 223, frame_width, 154, role, filename)


def _system_spine(svg: Svg) -> None:
    svg.raw('<g id="dominant-figure">')
    svg.rect(28, 404, 1133, 102, fill="#F0F5F7", radius=0)
    svg.text(52, 426, "VÒNG ĐỜI NGHIỆP VỤ", size=3.5, fill=COLORS["teal"], weight=700, letter_spacing=0.55)
    steps = (
        ("1", "NỘP BÀI", "Tác giả xác nhận"),
        ("2", "ĐỀ XUẤT PHẢN BIỆN", "Chủ tọa điều chỉnh"),
        ("3", "PHẢN BIỆN & REBUTTAL", "Hai phía trao đổi"),
        ("4", "QUYẾT ĐỊNH", "Chủ tọa xác nhận"),
        ("5", "CAMERA-READY", "Bài được chấp nhận"),
    )
    centers = (105, 334, 570, 808, 1050)
    for index, ((number, title, note), cx) in enumerate(zip(steps, centers)):
        svg.circle(cx, 461, 20, fill=COLORS["primary"] if index % 2 == 0 else COLORS["teal"])
        svg.text(cx, 466, number, size=6.2, fill="#FFFFFF", weight=700, anchor="middle")
        svg.text(cx, 438, title, size=3.8, fill=COLORS["primary"], weight=700, anchor="middle")
        svg.text(cx, 493, note, size=2.95, fill=COLORS["muted_text"], anchor="middle")
        if index < 4:
            svg.line(cx + 24, 461, centers[index + 1] - 24, 461, stroke=COLORS["accent"], sw=2)
            svg.raw(f'<path d="M {centers[index + 1] - 31} 455 l 7 6 -7 6" fill="none" stroke="{COLORS["accent"]}" stroke-width="2"/>')
    svg.raw("</g>")


def _responsibility_model(svg: Svg) -> None:
    x, width = 28, 626
    svg.text(x, 539, "CÁCH HỆ THỐNG PHÂN CHIA TRÁCH NHIỆM", size=4.2, fill=COLORS["primary"], weight=700, letter_spacing=0.4)
    svg.line(x, 547, x + width, 547, stroke=COLORS["primary"], sw=1)
    layers = (
        ("01", "NGHIỆP VỤ CỐT LÕI", "Quản lý trạng thái, quyền hạn và dữ liệu chính thức.", COLORS["primary"], 0),
        ("02", "THUẬT TOÁN CÓ THỂ KIỂM CHỨNG", "Tạo điểm, xếp hạng và căn cứ xung đột để Chủ tọa xem xét.", COLORS["teal"], 24),
        ("03", "AI HỖ TRỢ CÓ KIỂM SOÁT", "Tạo bản nháp, cảnh báo, phân tích hoặc tổng hợp; không tự quyết định.", COLORS["accent"], 48),
    )
    for index, (number, title, note, color, inset) in enumerate(layers):
        y = 566 + index * 56
        svg.rect(x + inset, y, width - inset, 42, fill=color, radius=0)
        svg.text(x + inset + 16, y + 17, number, size=5, fill="#FFFFFF", weight=700)
        svg.text(x + inset + 48, y + 16, title, size=3.8, fill="#FFFFFF", weight=700)
        svg.text(x + inset + 48, y + 31, note, size=3.05, fill="#DCE8EF")
    svg.rect(x + 72, 740, width - 72, 34, fill="#FFFFFF", stroke=COLORS["primary"], sw=1.2, radius=0)
    svg.text(x + width / 2 + 36, 761, "NGƯỜI CÓ THẨM QUYỀN KIỂM TRA · ĐIỀU CHỈNH · XÁC NHẬN", size=3.6, fill=COLORS["primary"], weight=700, anchor="middle")


def _evidence_summary(svg: Svg) -> None:
    x, width = 680, 481
    svg.text(x, 539, "KẾT QUẢ TRONG ĐIỀU KIỆN THỬ NGHIỆM", size=4.2, fill=COLORS["primary"], weight=700, letter_spacing=0.35)
    svg.line(x, 547, x + width, 547, stroke=COLORS["primary"], sw=1)

    svg.text(x, 579, "p95 < 120 ms", size=8.5, fill=COLORS["success"], weight=700)
    svg.text(x + 210, 579, "0% yêu cầu thất bại", size=3.4, fill=COLORS["muted_text"])
    svg.line(x, 590, x + width, 590, stroke=COLORS["border"], sw=0.7)

    svg.text(x, 619, "MRR 0,392", size=6.5, fill=COLORS["teal"], weight=700)
    svg.text(x + 158, 619, "Hit@10 65%", size=4.4, fill=COLORS["primary"], weight=700)
    svg.text(x + 300, 619, "65,9% đủ hai phản biện", size=3.35, fill=COLORS["muted_text"])
    svg.line(x, 631, x + width, 631, stroke=COLORS["border"], sw=0.7)

    ai = (
        ("Submission Autofill", "98,20%", COLORS["primary"]),
        ("Reviewer Initial Analysis", "96,22%", COLORS["teal"]),
        ("Chair Decision Copilot", "87,34%", COLORS["accent"]),
        ("Review Quality Auditor", "46,99%", COLORS["risk"]),
    )
    for index, (label, value, color) in enumerate(ai):
        y = 655 + index * 25
        svg.text(x, y, label, size=3.25, fill=COLORS["foreground"], weight=700)
        svg.rect(x + 190, y - 8, 210, 8, fill=COLORS["muted"], radius=0)
        numeric = float(value.replace("%", "").replace(",", "."))
        svg.rect(x + 190, y - 8, numeric * 2.1, 8, fill=color, radius=0)
        svg.text(x + width, y, value, size=4.1, fill=color, weight=700, anchor="end")

    svg.text(x, 769, "73/91", size=6.4, fill=COLORS["success"], weight=700)
    svg.text(x + 57, 769, "sẵn sàng giới thiệu", size=3.25, fill=COLORS["muted_text"])
    svg.wrapped_text(
        x + 225,
        756,
        "Không chỉ số nào thay thế phán đoán học thuật; dữ liệu đối sánh là dữ liệu tổng hợp và mẫu UAT mất cân bằng vai trò.",
        width=width - 225,
        size=2.95,
        line_height=4.3,
        fill=COLORS["muted_text"],
        max_lines=4,
    )


def build() -> str:
    svg = Svg("ConferenceSpace — poster giới thiệu sản phẩm")
    page_background(svg)
    academic_header(svg, edition="Phiên bản B · Poster sản phẩm")
    svg.rect(0, 112, 1189, 52, fill=COLORS["teal"], radius=0)
    svg.text(594.5, 136, "CON NGƯỜI GIỮ QUYỀN QUYẾT ĐỊNH", size=10.8, fill="#FFFFFF", weight=700, anchor="middle", css_class="display")
    svg.text(594.5, 153, "ConferenceSpace kết nối vòng đời xét duyệt với thuật toán kiểm chứng và AI hỗ trợ có giới hạn", size=4.1, fill="#E5F4F3", anchor="middle")
    _product_triptych(svg)
    _system_spine(svg)
    _responsibility_model(svg)
    _evidence_summary(svg)
    footer_rule(svg, "MỖI ĐẦU RA HỖ TRỢ ĐỀU GẮN VỚI NGƯỜI CHỊU TRÁCH NHIỆM XÁC NHẬN")
    return svg.finish()

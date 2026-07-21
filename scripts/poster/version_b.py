"""Evidence Dashboard poster composition."""

from scripts.poster.poster_common import (
    COLORS,
    Svg,
    card,
    footer_rule,
    header,
    mini_bar_chart,
    page_background,
    pill,
    section_title,
    ui_placeholder,
)


def _central_model(svg: Svg) -> None:
    section_title(svg, 355, 122, "MA TRẬN BẰNG CHỨNG", kicker="Luận điểm trung tâm", width=479)
    card(svg, 355, 137, 479, 281, fill=COLORS["card"])
    svg.text(594.5, 165, "BA LỚP · BA LOẠI ĐẦU RA · MỘT RANH GIỚI QUYẾT ĐỊNH", size=3.4, fill=COLORS["accent"], weight=700, anchor="middle", letter_spacing=0.45)

    layers = (
        ("NGHIỆP VỤ CỐT LÕI", "Trạng thái · quyền · dữ liệu chính thức", COLORS["primary"], 385, 187, 419),
        ("THUẬT TOÁN CÓ THỂ KIỂM CHỨNG", "Điểm · xếp hạng · đề xuất · COI", COLORS["teal"], 416, 237, 357),
        ("AI HỖ TRỢ CÓ KIỂM SOÁT", "Bản nháp · cảnh báo · phân tích · tổng hợp", COLORS["accent"], 447, 287, 295),
    )
    for index, (title, note, accent, x, y, w) in enumerate(layers):
        svg.rect(x, y, w, 90, fill=accent, opacity=0.96, radius=14)
        svg.circle(x + 27, y + 27, 13, fill="#FFFFFF")
        svg.text(x + 27, y + 31, str(index + 1), size=5.5, fill=accent, weight=700, anchor="middle")
        svg.text(x + 49, y + 26, title, size=4.2, fill="#FFFFFF", weight=700)
        svg.text(x + 49, y + 43, note, size=3.25, fill="#DCE8EF")
    svg.rect(470, 341, 249, 53, fill="#FFFFFF", radius=11, shadow=True)
    svg.text(594.5, 362, "NGƯỜI CÓ THẨM QUYỀN", size=4.2, fill=COLORS["primary"], weight=700, anchor="middle")
    svg.text(594.5, 379, "kiểm tra · điều chỉnh · xác nhận", size=3.5, fill=COLORS["accent"], weight=700, anchor="middle")
    svg.raw(f'<path d="M 594 337 v -12 m -5 6 l 5 6 5 -6" fill="none" stroke="{COLORS["primary"]}" stroke-width="1.8"/>')


def _backend_panel(svg: Svg) -> None:
    section_title(svg, 28, 122, "Hiệu năng backend", kicker="Bằng chứng trực tiếp", width=298)
    card(svg, 28, 137, 298, 240, fill=COLORS["card"])
    svg.text(46, 162, "ĐỘ TRỄ p95 THEO KỊCH BẢN", size=3.8, fill=COLORS["primary"], weight=700, letter_spacing=0.4)
    mini_bar_chart(
        svg,
        49,
        176,
        256,
        132,
        [117.6, 71.8, 79.3],
        ["Truy vấn đọc", "Đối sánh", "COI"],
        maximum=130,
        colors=[COLORS["primary"], COLORS["teal"], COLORS["warning"]],
        value_suffix=" ms",
        threshold=120,
    )
    pill(svg, 47, 326, "p95 < 120 ms", fill=COLORS["soft_green"], text_color=COLORS["success"], width=112)
    pill(svg, 168, 326, "0% yêu cầu thất bại", fill=COLORS["soft_blue"], text_color=COLORS["primary"], width=139)
    svg.text(47, 360, "3 endpoint · 20 VU · 30 giây/kịch bản", size=3.2, fill=COLORS["muted_text"])


def _matching_panel(svg: Svg) -> None:
    section_title(svg, 28, 409, "Đối sánh & phân công", kicker="Bằng chứng gián tiếp", width=298)
    card(svg, 28, 424, 298, 185, fill=COLORS["card"])
    metric_x = (47, 139, 231)
    metrics = (
        ("MRR 0,392", "Jaccard"),
        ("Hit@10 65%", "60 truy vấn"),
        ("65,9%", "đủ 2 PBV"),
    )
    for x, (value, label) in zip(metric_x, metrics):
        svg.rect(x, 446, 76, 55, fill=COLORS["soft_blue"], radius=8)
        svg.text(x + 38, 469, value, size=5.2, fill=COLORS["primary"], weight=700, anchor="middle")
        svg.text(x + 38, 488, label, size=2.8, fill=COLORS["muted_text"], anchor="middle")
    svg.text(47, 526, "ĐÁNH ĐỔI CỦA GREEDY", size=3.4, fill=COLORS["accent"], weight=700, letter_spacing=0.35)
    svg.rect(47, 539, 246, 13, fill=COLORS["muted"], radius=6.5)
    svg.rect(47, 539, 162, 13, fill=COLORS["teal"], radius=6.5)
    svg.text(47, 566, "Điểm Jaccard TB 0,011 · 2,75× baseline", size=3.25, fill=COLORS["foreground"], weight=700)
    svg.wrapped_text(47, 585, "Chỉ dùng để tạo đề xuất cho Chủ tọa kiểm tra; không hỗ trợ phân công tự động.", width=246, size=3.05, fill=COLORS["muted_text"], max_lines=2)


def _ai_panel(svg: Svg) -> None:
    section_title(svg, 862, 122, "Chuỗi bằng chứng AI", kicker="Từng tác vụ, từng phép đo", width=299)
    card(svg, 862, 137, 299, 337, fill=COLORS["card"])
    rows = (
        ("Submission Autofill", "98,20%", "F1 tiêu đề", COLORS["primary"], "92,77% F1 từ khóa"),
        ("Reviewer Initial Analysis", "96,22%", "trích dẫn bám nguồn", COLORS["teal"], "69,86% điểm cần lưu ý"),
        ("Chair Decision Copilot", "87,34%", "cơ sở bằng chứng", COLORS["accent"], "87,11% tổng hợp bất đồng"),
        ("Review Quality Auditor", "46,99%", "bám nguồn & hợp lệ", COLORS["risk"], "tín hiệu cần kiểm tra"),
    )
    for index, (title, value, label, accent, note) in enumerate(rows):
        y = 157 + index * 72
        svg.rect(878, y, 267, 61, fill=COLORS["soft_red"] if accent == COLORS["risk"] else "#F7FAFC", stroke=COLORS["border"], sw=0.6, radius=8)
        svg.rect(878, y, 5, 61, fill=accent, radius=3)
        svg.text(893, y + 20, title, size=3.5, fill=accent, weight=700)
        svg.text(1128, y + 27, value, size=8, fill=accent, weight=700, anchor="end")
        svg.text(893, y + 39, label, size=3.1, fill=COLORS["foreground"], weight=700)
        svg.text(1128, y + 45, note, size=2.75, fill=COLORS["muted_text"], anchor="end")
    svg.wrapped_text(
        879,
        457,
        "TCA là phép chấm tự động mang tính thăm dò; không đo độ đúng của quyết định học thuật.",
        width=264,
        size=3.05,
        fill=COLORS["muted_text"],
        max_lines=2,
    )


def _uat_panel(svg: Svg) -> None:
    section_title(svg, 862, 506, "Chatbot & trải nghiệm", kicker="Bằng chứng theo kịch bản", width=299)
    card(svg, 862, 521, 299, 88, fill=COLORS["card"])
    svg.text(880, 552, "37/40", size=11, fill=COLORS["primary"], weight=700)
    svg.text(950, 544, "hội thoại đạt hoặc đạt một phần", size=3.3, fill=COLORS["foreground"], weight=700)
    svg.text(950, 559, "97/128 lượt gọi công cụ thành công", size=3.05, fill=COLORS["muted_text"])
    svg.line(880, 571, 1140, 571, stroke=COLORS["border"], sw=0.7)
    svg.text(880, 594, "73/91", size=6, fill=COLORS["success"], weight=700)
    svg.text(934, 594, "sẵn sàng giới thiệu · mẫu lệch 83,5% Tác giả", size=3.1, fill=COLORS["muted_text"])


def _scope_and_ui(svg: Svg) -> None:
    card(svg, 355, 434, 479, 175, fill=COLORS["soft_amber"], accent=COLORS["warning"])
    svg.text(374, 458, "PHẠM VI KẾT LUẬN", size=4.2, fill="#A45A00", weight=700, letter_spacing=0.55)
    limits = (
        "Dữ liệu đối sánh là dữ liệu tổng hợp; chưa có nhãn phân công từ Chủ tọa.",
        "Một số đầu ra AI chưa có nhãn chuyên gia; TCA/NLI chỉ là chỉ số gián tiếp.",
        "Tập AI chủ yếu gồm bài tiếng Anh; chưa xác nhận trên bài tiếng Việt.",
        "UAT mất cân bằng vai trò; số liệu Chủ tọa chưa tái lập độc lập từ bản ghi thô.",
    )
    for index, item in enumerate(limits):
        y = 483 + index * 28
        svg.circle(377, y - 1.4, 2.2, fill=COLORS["warning"])
        svg.wrapped_text(386, y, item, width=420, size=3.3, line_height=4.8, fill="#754200", max_lines=2)

    section_title(svg, 28, 641, "Ba điểm chạm sản phẩm", kicker="UI thay thế được", width=1133)
    items = (
        ("TÁC GIẢ", "chapter_3_uc02_autofill_1.png"),
        ("PHẢN BIỆN VIÊN", "chapter_3_uc05_reviewer_initial_analysis.png"),
        ("CHỦ TỌA", "chapter_3_uc06_assignment_suggestions.png"),
    )
    placeholder_w = 362
    for index, (role, filename) in enumerate(items):
        x = 28 + index * 386
        ui_placeholder(svg, x, 656, placeholder_w, 102, role, filename)

    card(svg, 28, 770, 1133, 42, fill=COLORS["primary"])
    svg.text(50, 796, "KẾT LUẬN", size=3.8, fill="#BBD0DE", weight=700, letter_spacing=0.55)
    svg.text(151, 796, "Khả thi trong điều kiện thử nghiệm; con người vẫn kiểm tra, điều chỉnh và quyết định.", size=5.1, fill="#FFFFFF", weight=700)


def build() -> str:
    svg = Svg("ConferenceSpace poster version B - Evidence Dashboard")
    page_background(svg, grid=True)
    header(svg, variant_label="Phiên bản B · Evidence Dashboard", compact=True)
    _backend_panel(svg)
    _matching_panel(svg)
    _central_model(svg)
    _ai_panel(svg)
    _uat_panel(svg)
    _scope_and_ui(svg)
    footer_rule(svg, "MỖI LUẬN ĐIỂM ĐI KÈM ĐÚNG NGUỒN BẰNG CHỨNG VÀ PHẠM VI KẾT LUẬN")
    return svg.finish()

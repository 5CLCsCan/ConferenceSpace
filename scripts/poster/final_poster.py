"""Compose the final A0 ConferenceSpace academic poster as editable SVG."""

from __future__ import annotations

from pathlib import Path

from scripts.poster.poster_common import A0_HEIGHT, A0_WIDTH, ROOT, Svg, data_uri


INK = "#17212B"
NAVY = "#17324D"
TEAL = "#0F7875"
SLATE = "#596A72"
PAPER = "#F7F4EC"
PALE = "#E7EFEB"
LINE = "#B8C5C3"
AMBER = "#B66A26"
MIST = "#E4E8E5"
WHITE = "#FFFFFF"

IMAGES = ROOT / "docs/report/compiled/latex/images"
OUTPUT = ROOT / "output/poster/conferencespace-academic-poster.svg"


def section(svg: Svg, x: float, y: float, index: str, title: str, width: float) -> None:
    svg.text(x, y, index, size=3.5, fill=TEAL, weight=700, letter_spacing=0.7)
    svg.text(x + 18, y, title, size=6.7, fill=NAVY, weight=700, css_class="display")
    svg.line(x, y + 6, x + width, y + 6, stroke=LINE, sw=0.8)


def crop_image(svg: Svg, x: float, y: float, w: float, h: float, name: str, crop: str = "xMidYMid slice") -> None:
    clip_id = f"clip-{name.replace('.', '-').replace('_', '-')}"
    svg.raw(f'<defs><clipPath id="{clip_id}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath></defs>')
    svg.raw(
        f'<image data-source="{name}" x="{x}" y="{y}" width="{w}" height="{h}" '
        f'href="{data_uri(IMAGES / name)}" preserveAspectRatio="{crop}" clip-path="url(#{clip_id})"/>'
    )
    svg.rect(x, y, w, h, fill="none", stroke=NAVY, sw=0.8, radius=0)


def title_block(svg: Svg) -> None:
    svg.rect(0, 0, A0_WIDTH, A0_HEIGHT, fill=PAPER, radius=0)
    svg.image(25, 18, 60, 47, IMAGES / "logo-khtn.png")
    svg.image(96, 25, 118, 40, IMAGES / "logo.png")
    svg.text(238, 24, "TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN · KHOA CÔNG NGHỆ THÔNG TIN", size=3.7, fill=SLATE, weight=700, letter_spacing=0.35)
    svg.text(238, 52, "HỆ THỐNG HỖ TRỢ XÉT DUYỆT BÀI BÁO KHOA HỌC", size=17.2, fill=NAVY, weight=700, css_class="display")
    svg.text(238, 75, "ConferenceSpace · THỰC TẬP DỰ ÁN TỐT NGHIỆP · KHÓA 2022", size=5.7, fill=TEAL, weight=700)
    svg.text(1164, 23, "CAO HỮU KHƯƠNG DUY · 22127083  |  NHÂM ĐỨC HUY · 22127158", size=3.5, fill=INK, anchor="end")
    svg.text(1164, 37, "VÕ MINH KHÔI · 22127213  |  TỪ CHÍ TIẾN · 22127414  |  NGUYỄN NGỌC ANH TÚ · 22127433", size=3.5, fill=INK, anchor="end")
    svg.text(1164, 54, "GVHD: ThS. Hồ Thị Hoàng Vy · PGS.TS. Lê Nguyễn Hoài Nam", size=3.6, fill=SLATE, anchor="end")
    svg.line(24, 88, 1165, 88, stroke=NAVY, sw=1.2)

    svg.text(594.5, 121, "CONFERENCE SPACE ĐẶT TỰ ĐỘNG HÓA VÀO ĐÚNG RANH GIỚI", size=15.5, fill=NAVY, weight=700, anchor="middle", css_class="display")
    svg.text(594.5, 147, "Nghiệp vụ xác định · đầu ra có thể kiểm tra · con người quyết định", size=6.4, fill=TEAL, weight=700, anchor="middle")
    svg.line(255, 160, 934, 160, stroke=TEAL, sw=1.1)


def problem_column(svg: Svg) -> None:
    x, w = 25, 248
    section(svg, x, 196, "01", "Khoảng trống cần giải quyết", w)
    svg.wrapped_text(x, 226, "Người dùng không chỉ cần một nơi nộp bài; họ cần biết bước tiếp theo và giảm công việc lặp lại.", width=w, size=4.7, line_height=6.7, max_lines=3)

    svg.text(x, 286, "49,3%", size=18, fill=NAVY, weight=700, css_class="display")
    svg.text(x + 2, 301, "không biết bước tiếp theo", size=4.0, fill=SLATE, weight=700)
    svg.line(x, 311, x + 111, 311, stroke=TEAL, sw=3.3)
    svg.line(x + 111, 311, x + 225, 311, stroke=MIST, sw=3.3)

    svg.text(x, 351, "47,9%", size=18, fill=TEAL, weight=700, css_class="display")
    svg.text(x + 2, 366, "gặp biểu mẫu lặp lại", size=4.0, fill=SLATE, weight=700)
    svg.line(x, 376, x + 108, 376, stroke=TEAL, sw=3.3)
    svg.line(x + 108, 376, x + 225, 376, stroke=MIST, sw=3.3)
    svg.text(x, 392, "Khảo sát nhu cầu · n = 71", size=3.6, fill=SLATE)

    svg.text(x, 438, "Hai dòng tham chiếu, một khoảng trống", size=6.0, fill=NAVY, weight=700, css_class="display")
    svg.text(x, 464, "NỀN TẢNG QUẢN LÝ HỘI NGHỊ", size=3.6, fill=SLATE, weight=700, letter_spacing=0.5)
    svg.text(x, 482, "EasyChair · HotCRP · CMT · OpenReview", size=4.3, fill=INK)
    svg.line(x, 491, x + 230, 491, stroke=NAVY, sw=1.0)
    svg.text(x, 520, "AI / LIÊM CHÍNH HỌC THUẬT", size=3.6, fill=SLATE, weight=700, letter_spacing=0.5)
    svg.text(x, 538, "PeerSubmit · Morressier", size=4.3, fill=INK)
    svg.line(x, 547, x + 230, 547, stroke=TEAL, sw=1.0, dash="5 4")

    svg.raw(f'<path d="M {x + 70} 558 C {x + 70} 581, {x + 124} 577, {x + 124} 600" fill="none" stroke="{LINE}" stroke-width="1.1"/>')
    svg.raw(f'<path d="M {x + 190} 558 C {x + 190} 581, {x + 124} 577, {x + 124} 600" fill="none" stroke="{LINE}" stroke-width="1.1"/>')
    svg.circle(x + 124, 603, 4.3, fill=AMBER)
    svg.text(x, 630, "KHOẢNG TRỐNG", size=3.6, fill=AMBER, weight=700, letter_spacing=0.6)
    svg.wrapped_text(x, 649, "Ranh giới giữa tác vụ, đầu ra, người phê duyệt và bằng chứng chưa được diễn đạt thành một mô hình trách nhiệm xuyên suốt.", width=w, size=4.4, line_height=6.4, max_lines=4)
    svg.text(x, 712, "Nguồn: Chương 1–2", size=3.5, fill=SLATE)


def lifecycle(svg: Svg) -> None:
    x, w = 298, 575
    section(svg, x, 196, "02", "Một vòng đời; ba cơ chế; quyền quyết định không đổi", w)
    svg.raw(f'<defs><marker id="arrow-navy" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="{NAVY}"/></marker></defs>')

    stages = [(322, "NỘP BÀI"), (442, "PHÂN CÔNG"), (566, "PHẢN BIỆN"), (692, "REBUTTAL"), (824, "QUYẾT ĐỊNH")]
    svg.raw('<g id="core-workflow">')
    svg.line(322, 282, 824, 282, stroke=NAVY, sw=2.5)
    for cx, label in stages:
        svg.circle(cx, 282, 8, fill=PAPER, stroke=NAVY, sw=2.5)
        svg.text(cx, 308, label, size=4.2, fill=NAVY, weight=700, anchor="middle")
    svg.raw("</g>")

    svg.raw('<g id="deterministic-assistance">')
    svg.line(442, 247, 442, 270, stroke=TEAL, sw=1.8)
    svg.circle(442, 240, 5, fill=TEAL)
    svg.text(442, 228, "Jaccard + COI", size=3.6, fill=TEAL, weight=700, anchor="middle")
    svg.raw("</g>")

    svg.raw('<g id="ai-assistance">')
    for cx, label, side in ((322, "Autofill · Gating", -1), (566, "Initial Analysis · RQA", 1), (824, "Decision Copilot", -1)):
        y2 = 258 if side < 0 else 326
        svg.line(cx, 274 if side < 0 else 290, cx, y2, stroke=TEAL, sw=1.3, dash="4 4")
        svg.text(cx, y2 - 8 if side < 0 else y2 + 12, label, size=3.5, fill=TEAL, weight=700, anchor="middle")
    svg.raw("</g>")

    svg.text(x, 353, "Navy liền — nghiệp vụ chính thức", size=3.5, fill=NAVY, weight=700)
    svg.line(x, 362, x + 39, 362, stroke=NAVY, sw=2.2)
    svg.text(x + 175, 353, "Teal — thuật toán xác định", size=3.5, fill=TEAL, weight=700)
    svg.line(x + 175, 362, x + 214, 362, stroke=TEAL, sw=2.2)
    svg.text(x + 357, 353, "Nét đứt — AI hỗ trợ", size=3.5, fill=SLATE, weight=700)
    svg.line(x + 357, 362, x + 396, 362, stroke=TEAL, sw=1.5, dash="4 4")
    svg.text(x, 382, "Submission Gating: quy tắc + cảnh báo nội dung", size=3.5, fill=SLATE)

    crop_image(svg, 304, 413, 131, 197, "chapter_3_uc02_autofill_1.png", "xMidYMid meet")
    crop_image(svg, 451, 413, 202, 114, "chapter_3_uc05_reviewer_initial_analysis.png")
    crop_image(svg, 669, 413, 198, 114, "chapter_3_uc06_assignment_suggestions.png")

    svg.text(304, 630, "HÌNH 1", size=3.5, fill=TEAL, weight=700)
    svg.wrapped_text(304, 646, "Autofill tạo bản nháp metadata; Tác giả kiểm tra trước khi nộp.", width=131, size=3.6, line_height=5.2, max_lines=3)
    svg.text(451, 547, "HÌNH 2", size=3.5, fill=TEAL, weight=700)
    svg.wrapped_text(451, 563, "Initial Analysis đặt nguồn và phân tích cạnh nhau để Phản biện viên đối chiếu.", width=202, size=3.6, line_height=5.2, max_lines=3)
    svg.text(669, 547, "HÌNH 3", size=3.5, fill=TEAL, weight=700)
    svg.wrapped_text(669, 563, "Danh sách gợi ý hiển thị chủ đề, điểm và xung đột để Chủ tọa xác nhận.", width=198, size=3.6, line_height=5.2, max_lines=3)

    svg.line(369, 405, 342, 386, stroke=LINE, sw=0.9)
    svg.line(552, 405, 566, 382, stroke=LINE, sw=0.9)
    svg.line(768, 405, 442, 382, stroke=LINE, sw=0.9)

    svg.rect(319, 690, 532, 36, fill=PALE, radius=0)
    svg.text(585, 705, "CON NGƯỜI XÁC NHẬN", size=4.3, fill=NAVY, weight=700, anchor="middle", letter_spacing=0.5)
    svg.text(585, 718, "Đầu ra thuật toán và AI chỉ trở thành hành động nghiệp vụ sau khi vai trò có thẩm quyền kiểm tra.", size=3.6, fill=SLATE, anchor="middle")


def evidence_column(svg: Svg) -> None:
    x, w = 897, 267
    section(svg, x, 196, "03", "Bằng chứng theo đúng phạm vi đo", w)

    svg.text(x, 232, "Backend đáp ứng ngưỡng trong tải ngắn", size=5.1, fill=NAVY, weight=700, css_class="display")
    plot_x, plot_w = x + 69, 184
    svg.line(plot_x, 313, plot_x + plot_w, 313, stroke=LINE, sw=0.8)
    for tick in (0, 60, 120):
        tx = plot_x + tick / 130 * plot_w
        svg.line(tx, 309, tx, 317, stroke=LINE, sw=0.8)
        svg.text(tx, 329, str(tick), size=3.5, fill=SLATE, anchor="middle")
    threshold_x = plot_x + 120 / 130 * plot_w
    svg.line(threshold_x, 248, threshold_x, 306, stroke=AMBER, sw=1.1, dash="4 3")
    svg.text(threshold_x, 242, "ngưỡng 120 ms", size=3.5, fill=AMBER, anchor="middle")
    for iy, label, value in ((260, "Danh sách", 117.6), (280, "Gửi bài", 71.8), (300, "Phân công", 79.3)):
        svg.text(plot_x - 8, iy + 2, label, size=3.5, fill=SLATE, anchor="end")
        px = plot_x + value / 130 * plot_w
        svg.line(plot_x, iy, px, iy, stroke=MIST, sw=1.1)
        svg.circle(px, iy, 4.2, fill=TEAL)
        svg.text(px - 7 if value > 110 else px + 7, iy + 2, str(value).replace(".", ","), size=3.5, fill=INK, weight=700, anchor="end" if value > 110 else "start")
    svg.text(x, 345, "p95 · 0% yêu cầu thất bại · 20 VU × 30 giây", size=3.5, fill=SLATE)

    svg.text(x, 382, "Thuật toán tạo đề xuất, không thay quyết định", size=5.1, fill=NAVY, weight=700, css_class="display")
    svg.text(x, 412, "MRR 0,392", size=10.5, fill=TEAL, weight=700, css_class="display")
    svg.text(x + 112, 409, "proxy truy hồi hồ sơ chủ đề", size=3.5, fill=SLATE)
    svg.text(x + 112, 423, "60 truy vấn leave-one-out", size=3.5, fill=SLATE)
    svg.text(x, 451, "Greedy đủ ≥ 2 phản biện viên", size=3.6, fill=INK, weight=700)
    svg.line(x, 463, x + 171, 463, stroke=TEAL, sw=6)
    svg.line(x + 171, 463, x + 232, 463, stroke=AMBER, sw=6)
    svg.line(x + 232, 463, x + 255, 463, stroke=MIST, sw=6)
    svg.text(x, 482, "65,9% đủ ngay", size=3.5, fill=TEAL, weight=700)
    svg.text(x + 121, 482, "23,3% cần dự phòng", size=3.5, fill=AMBER, weight=700)
    svg.text(x, 498, "Dữ liệu tổng hợp · danh sách chỉ để Chủ tọa xác nhận", size=3.5, fill=SLATE)

    svg.text(x, 532, "AI được đo bằng các tiêu chí khác nhau", size=5.1, fill=NAVY, weight=700, css_class="display")
    ai_rows = (
        (558, "Autofill · title token F1", "98,20%", TEAL),
        (581, "Autofill · hoàn tất trường bắt buộc", "86,93%", NAVY),
        (604, "Initial Analysis · citation grounding", "96,22%", TEAL),
        (627, "Initial Analysis · attention truthfulness", "69,86%", NAVY),
        (650, "Quality Auditor · grounded ∩ valid", "46,99%", AMBER),
    )
    for y, label, value, color in ai_rows:
        svg.text(x, y, label, size=3.5, fill=SLATE)
        svg.text(x + w, y, value, size=4.2, fill=color, weight=700, anchor="end")
        svg.circle(x + 200, y - 1.2, 2.8, fill=color)
    svg.text(x, 674, "Các phần trăm không cùng ý nghĩa; TCA chưa hiệu chuẩn chuyên gia.", size=3.5, fill=SLATE)

    svg.text(x, 706, "73/91", size=10.5, fill=TEAL, weight=700, css_class="display")
    svg.text(x + 92, 700, "sẵn sàng giới thiệu", size=3.5, fill=INK, weight=700)
    svg.text(x + 92, 716, "76 Tác giả · 7 Phản biện · 8 Chủ tọa", size=3.5, fill=SLATE)


def footer(svg: Svg) -> None:
    svg.line(24, 746, 1165, 746, stroke=NAVY, sw=1.2)
    svg.text(25, 773, "KẾT LUẬN", size=3.5, fill=TEAL, weight=700, letter_spacing=0.7)
    svg.wrapped_text(25, 796, "ConferenceSpace hiện thực các nghiệp vụ chính của vòng đời xét duyệt và phân tách rõ nghiệp vụ, thuật toán xác định và AI hỗ trợ. Kết quả cho thấy tính khả thi trong điều kiện thử nghiệm; chưa chứng minh độ đúng của quyết định học thuật hoặc mức sẵn sàng vận hành hội nghị thực tế.", width=735, size=5.1, line_height=7.0, max_lines=4, weight=700)
    svg.text(795, 773, "GIỚI HẠN CẦN GIỮ KHI DIỄN GIẢI", size=3.5, fill=AMBER, weight=700, letter_spacing=0.5)
    svg.text(795, 797, "01  Đối sánh dùng dữ liệu tổng hợp", size=3.8, fill=INK, weight=700)
    svg.text(795, 815, "02  TCA chưa hiệu chuẩn bằng nhãn chuyên gia", size=3.8, fill=INK, weight=700)
    svg.text(795, 833, "03  UAT dùng mẫu thuận tiện; mẫu lệch Tác giả", size=3.8, fill=INK, weight=700)


def build() -> str:
    svg = Svg("Poster học thuật ConferenceSpace: Evidence in Motion")
    title_block(svg)
    problem_column(svg)
    lifecycle(svg)
    evidence_column(svg)
    footer(svg)
    return svg.finish()


def write_output(path: Path = OUTPUT) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(build(), encoding="utf-8")
    return path


if __name__ == "__main__":
    print(write_output())

"""Shared SVG primitives and locked content for ConferenceSpace posters."""

from __future__ import annotations

import base64
import html
import textwrap
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
A0_WIDTH = 1189
A0_HEIGHT = 841

COLORS = {
    "background": "#F8FAFC",
    "foreground": "#141414",
    "card": "#FFFFFF",
    "primary": "#1B3C53",
    "secondary": "#234C6A",
    "accent": "#456882",
    "muted": "#E3E3E3",
    "muted_text": "#64748B",
    "border": "#DBDBDB",
    "success": "#16A34A",
    "warning": "#F59E0B",
    "risk": "#EF4444",
    "teal": "#0F7C80",
    "soft_blue": "#EAF1F6",
    "soft_green": "#EAF7EF",
    "soft_amber": "#FFF6DF",
    "soft_red": "#FFF0EF",
}

MEMBERS = (
    "Cao Hữu Khương Duy — 22127083  •  Nhâm Đức Huy — 22127158  •  Võ Minh Khôi — 22127213",
    "Từ Chí Tiến — 22127414  •  Nguyễn Ngọc Anh Tú — 22127433",
)

SUPERVISORS = "GVHD: ThS. Hồ Thị Hoàng Vy  •  PGS.TS. Lê Nguyễn Hoài Nam"


def data_uri(path: Path) -> str:
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def font_css() -> str:
    body_regular = data_uri(Path("C:/Windows/Fonts/tahoma.ttf")).replace("image/jpeg", "font/ttf")
    body_bold = data_uri(Path("C:/Windows/Fonts/tahomabd.ttf")).replace("image/jpeg", "font/ttf")
    display_regular = data_uri(Path("C:/Windows/Fonts/cambria.ttc")).replace("image/jpeg", "font/collection")
    display_bold = data_uri(Path("C:/Windows/Fonts/cambriab.ttf")).replace("image/jpeg", "font/ttf")
    return f"""
      @font-face {{ font-family: 'PosterBody'; src: url('{body_regular}') format('truetype'); font-weight: 400; }}
      @font-face {{ font-family: 'PosterBody'; src: url('{body_bold}') format('truetype'); font-weight: 700; }}
      @font-face {{ font-family: 'PosterDisplay'; src: url('{display_regular}') format('truetype'); font-weight: 400; }}
      @font-face {{ font-family: 'PosterDisplay'; src: url('{display_bold}') format('truetype'); font-weight: 700; }}
      text {{ font-family: 'PosterBody', Tahoma, sans-serif; }}
      .display {{ font-family: 'PosterDisplay', Cambria, serif; }}
    """


class Svg:
    def __init__(self, aria_label: str) -> None:
        self.parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{A0_WIDTH}mm" height="{A0_HEIGHT}mm" '
            f'viewBox="0 0 {A0_WIDTH} {A0_HEIGHT}" role="img" aria-label="{html.escape(aria_label)}">',
            f"<style>{font_css()}</style>",
            "<defs>",
            '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">'
            '<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1B3C53" flood-opacity="0.09"/>'
            "</filter>",
            '<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">'
            '<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#DBDBDB" stroke-width="0.35" opacity="0.42"/>'
            "</pattern>",
            "</defs>",
        ]

    def raw(self, markup: str) -> None:
        self.parts.append(markup)

    def rect(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        *,
        fill: str = "none",
        stroke: str = "none",
        sw: float = 1,
        radius: float = 8,
        opacity: float = 1,
        dash: str | None = None,
        shadow: bool = False,
    ) -> None:
        attrs = f' stroke-dasharray="{dash}"' if dash else ""
        filter_attr = ' filter="url(#shadow)"' if shadow else ""
        self.raw(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}"{attrs}{filter_attr}/>'
        )

    def line(self, x1: float, y1: float, x2: float, y2: float, *, stroke: str, sw: float = 1, dash: str | None = None) -> None:
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
        self.raw(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{dash_attr}/>' )

    def circle(self, cx: float, cy: float, r: float, *, fill: str, stroke: str = "none", sw: float = 1) -> None:
        self.raw(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def text(
        self,
        x: float,
        y: float,
        value: str,
        *,
        size: float = 5,
        fill: str = COLORS["foreground"],
        weight: int = 400,
        anchor: str = "start",
        css_class: str = "",
        letter_spacing: float = 0,
    ) -> None:
        self.raw(
            f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" '
            f'text-anchor="{anchor}" class="{css_class}" letter-spacing="{letter_spacing}">{html.escape(value)}</text>'
        )

    def wrapped_text(
        self,
        x: float,
        y: float,
        value: str,
        *,
        width: float,
        size: float = 5,
        line_height: float | None = None,
        fill: str = COLORS["foreground"],
        weight: int = 400,
        max_lines: int | None = None,
        bullet: bool = False,
    ) -> float:
        line_height = line_height or size * 1.35
        average_glyph = size * 0.53
        chars = max(8, int(width / average_glyph))
        lines = textwrap.wrap(value, width=chars, break_long_words=False, break_on_hyphens=False) or [""]
        if max_lines and len(lines) > max_lines:
            lines = lines[:max_lines]
            lines[-1] = lines[-1].rstrip(".,;: ") + "…"
        if bullet:
            self.circle(x + 1.8, y - size * 0.34, 1.35, fill=COLORS["accent"])
            x += 6
            width -= 6
        self.raw(
            f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}">'
            + "".join(
                f'<tspan x="{x}" dy="{0 if index == 0 else line_height}">{html.escape(line)}</tspan>'
                for index, line in enumerate(lines)
            )
            + "</text>"
        )
        return y + (len(lines) - 1) * line_height

    def image(self, x: float, y: float, w: float, h: float, path: Path, *, preserve: str = "xMidYMid meet") -> None:
        self.raw(
            f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="{data_uri(path)}" '
            f'preserveAspectRatio="{preserve}"/>'
        )

    def finish(self) -> str:
        return "\n".join([*self.parts, "</svg>"])


def page_background(svg: Svg, *, grid: bool = False) -> None:
    svg.rect(0, 0, A0_WIDTH, A0_HEIGHT, fill=COLORS["background"], radius=0)
    if grid:
        svg.rect(0, 0, A0_WIDTH, A0_HEIGHT, fill="url(#grid)", opacity=0.45, radius=0)


def card(svg: Svg, x: float, y: float, w: float, h: float, *, fill: str = COLORS["card"], accent: str | None = None) -> None:
    svg.rect(x, y, w, h, fill=fill, stroke=COLORS["border"], sw=0.8, radius=10, shadow=True)
    if accent:
        svg.rect(x, y, 5, h, fill=accent, radius=3)


def section_title(svg: Svg, x: float, y: float, title: str, *, kicker: str | None = None, width: float = 300) -> None:
    if kicker:
        svg.text(x, y, kicker.upper(), size=3.5, fill=COLORS["accent"], weight=700, letter_spacing=0.7)
        y += 10
    svg.text(x, y, title, size=8, fill=COLORS["primary"], weight=700, css_class="display")
    svg.line(x, y + 5, x + width, y + 5, stroke=COLORS["border"], sw=0.7)


def pill(svg: Svg, x: float, y: float, label: str, *, fill: str, text_color: str, width: float | None = None) -> float:
    width = width or max(34, len(label) * 2.75 + 13)
    svg.rect(x, y, width, 14, fill=fill, radius=7)
    svg.text(x + width / 2, y + 9.5, label, size=3.6, fill=text_color, weight=700, anchor="middle")
    return width


def metric_card(svg: Svg, x: float, y: float, w: float, h: float, value: str, label: str, note: str, *, accent: str) -> None:
    card(svg, x, y, w, h, accent=accent)
    svg.text(x + 13, y + 25, value, size=11, fill=accent, weight=700)
    svg.wrapped_text(x + 13, y + 40, label, width=w - 26, size=4.4, weight=700, max_lines=2)
    svg.wrapped_text(x + 13, y + h - 18, note, width=w - 26, size=3.25, fill=COLORS["muted_text"], max_lines=2)


def ui_placeholder(svg: Svg, x: float, y: float, w: float, h: float, role: str, filename: str) -> None:
    role_ids = {
        "TÁC GIẢ": "author",
        "PHẢN BIỆN VIÊN": "reviewer",
        "CHỦ TỌA": "chair",
    }
    group_id = role_ids[role]
    svg.raw(f'<g id="ui-placeholder-{group_id}" data-replace-with="{html.escape(filename)}">')
    svg.rect(x, y, w, h, fill="#F3F7FA", stroke=COLORS["accent"], sw=1, radius=8, dash="6 4")
    svg.rect(x + 8, y + 8, w - 16, 12, fill=COLORS["soft_blue"], radius=4)
    svg.circle(x + 15, y + 14, 2, fill=COLORS["risk"])
    svg.circle(x + 22, y + 14, 2, fill=COLORS["warning"])
    svg.circle(x + 29, y + 14, 2, fill=COLORS["success"])
    svg.text(x + w / 2, y + h / 2 - 3, "UI PLACEHOLDER", size=5.2, fill=COLORS["primary"], weight=700, anchor="middle")
    svg.text(x + w / 2, y + h / 2 + 8, role, size=3.7, fill=COLORS["accent"], weight=700, anchor="middle", letter_spacing=0.5)
    svg.wrapped_text(x + 12, y + h - 14, filename, width=w - 24, size=2.8, fill=COLORS["muted_text"], max_lines=1)
    svg.raw("</g>")


def header(svg: Svg, *, variant_label: str, compact: bool = False) -> None:
    logo_school = ROOT / "docs/report/compiled/latex/images/logo-khtn.png"
    logo_fit = ROOT / "docs/report/compiled/latex/images/logo.png"
    svg.rect(0, 0, A0_WIDTH, 105 if not compact else 92, fill=COLORS["primary"], radius=0)
    svg.image(25, 15, 62, 62, logo_school)
    svg.image(96, 28, 128, 38, logo_fit)
    svg.text(245, 24, variant_label.upper(), size=3.5, fill="#BBD0DE", weight=700, letter_spacing=0.9)
    svg.text(245, 52, "HỆ THỐNG HỖ TRỢ XÉT DUYỆT", size=17 if not compact else 15, fill="#FFFFFF", weight=700, css_class="display")
    svg.text(245, 73, "BÀI BÁO KHOA HỌC  ·  ConferenceSpace", size=9, fill="#DCE8EF", weight=700)
    svg.text(1160, 25, "THỰC TẬP DỰ ÁN TỐT NGHIỆP · 07/2026", size=3.5, fill="#BBD0DE", weight=700, anchor="end")
    svg.text(1160, 49, MEMBERS[0], size=3.25, fill="#FFFFFF", anchor="end")
    svg.text(1160, 61, MEMBERS[1], size=3.25, fill="#FFFFFF", anchor="end")
    svg.text(1160, 79, "GVHD: ThS. Hồ Thị Hoàng Vy · PGS.TS. Lê Nguyễn Hoài Nam", size=3.3, fill="#DCE8EF", anchor="end")


def mini_bar_chart(
    svg: Svg,
    x: float,
    y: float,
    w: float,
    h: float,
    values: list[float],
    labels: list[str],
    *,
    maximum: float,
    colors: list[str],
    value_suffix: str = "",
    threshold: float | None = None,
) -> None:
    baseline = y + h - 20
    top = y + 8
    plot_h = baseline - top
    if threshold is not None:
        ty = baseline - (threshold / maximum) * plot_h
        svg.line(x, ty, x + w, ty, stroke=COLORS["risk"], sw=0.8, dash="4 3")
        svg.text(x + w, ty - 3, f"ngưỡng {threshold:g}{value_suffix}", size=2.7, fill=COLORS["risk"], anchor="end")
    slot = w / len(values)
    bar_w = slot * 0.48
    for index, (value, label) in enumerate(zip(values, labels)):
        bx = x + index * slot + (slot - bar_w) / 2
        bar_h = (value / maximum) * plot_h
        by = baseline - bar_h
        svg.rect(bx, by, bar_w, bar_h, fill=colors[index % len(colors)], radius=2)
        svg.text(bx + bar_w / 2, by - 4, f"{value:g}{value_suffix}", size=3.1, fill=COLORS["foreground"], weight=700, anchor="middle")
        svg.wrapped_text(bx - slot * 0.2, baseline + 9, label, width=slot * 0.9, size=2.8, fill=COLORS["muted_text"], max_lines=2)


def academic_header(svg: Svg, *, edition: str) -> None:
    """Print-first identity block sourced verbatim from the compiled report."""
    logo_school = ROOT / "docs/report/compiled/latex/images/logo-khtn.png"
    logo_fit = ROOT / "docs/report/compiled/latex/images/logo.png"
    svg.rect(0, 0, A0_WIDTH, 106, fill="#FFFFFF", radius=0)
    svg.image(25, 13, 66, 66, logo_school)
    svg.image(101, 28, 126, 36, logo_fit)
    svg.text(594.5, 17, edition.upper(), size=3.4, fill=COLORS["accent"], weight=700, anchor="middle", letter_spacing=1)
    svg.text(594.5, 45, "HỆ THỐNG HỖ TRỢ XÉT DUYỆT BÀI BÁO KHOA HỌC", size=16.5, fill=COLORS["primary"], weight=700, anchor="middle", css_class="display")
    svg.text(594.5, 66, "ConferenceSpace", size=8.3, fill=COLORS["teal"], weight=700, anchor="middle")
    svg.text(594.5, 83, MEMBERS[0], size=3.45, fill=COLORS["foreground"], anchor="middle")
    svg.text(594.5, 95, MEMBERS[1], size=3.45, fill=COLORS["foreground"], anchor="middle")
    svg.text(1162, 23, "THỰC TẬP DỰ ÁN TỐT NGHIỆP", size=3.35, fill=COLORS["primary"], weight=700, anchor="end")
    svg.text(1162, 37, "CHƯƠNG TRÌNH CHUẨN · 07/2026", size=3.15, fill=COLORS["muted_text"], anchor="end")
    svg.text(1162, 61, SUPERVISORS, size=3.15, fill=COLORS["foreground"], anchor="end")
    svg.rect(0, 102, A0_WIDTH, 4, fill=COLORS["teal"], radius=0)


def poster_image_placeholder(svg: Svg, x: float, y: float, w: float, h: float, role: str, filename: str) -> None:
    """Editable screenshot frame without browser chrome or dashboard-card styling."""
    role_ids = {"TÁC GIẢ": "author", "PHẢN BIỆN VIÊN": "reviewer", "CHỦ TỌA": "chair"}
    group_id = role_ids[role]
    svg.raw(f'<g id="ui-placeholder-{group_id}" data-replace-with="{html.escape(filename)}">')
    svg.rect(x, y, w, h, fill="#EEF3F6", stroke=COLORS["primary"], sw=1.2, radius=1, dash="7 5")
    svg.text(x + w / 2, y + h / 2 - 2, "UI PLACEHOLDER", size=5.4, fill=COLORS["primary"], weight=700, anchor="middle", letter_spacing=0.35)
    svg.text(x + w / 2, y + h / 2 + 10, role, size=3.8, fill=COLORS["teal"], weight=700, anchor="middle")
    svg.text(x + 8, y + h - 7, filename, size=2.65, fill=COLORS["muted_text"])
    svg.raw("</g>")


def footer_rule(svg: Svg, message: str) -> None:
    svg.rect(0, 824, A0_WIDTH, 17, fill=COLORS["primary"], radius=0)
    svg.text(A0_WIDTH / 2, 835.3, message, size=3.8, fill="#FFFFFF", weight=700, anchor="middle", letter_spacing=0.25)

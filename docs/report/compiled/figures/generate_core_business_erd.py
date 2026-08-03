from math import atan2, cos, sin, pi
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(__file__).resolve().parent
PNG_PATH = OUT_DIR / "core-business-erd.png"
PDF_PATH = OUT_DIR / "core-business-erd.pdf"

W, H = 3600, 2100
BG = "#ffffff"
BOX_FILL = "#eef9ee"
BOX_OUTLINE = "#5f6f64"
GROUP_FILL = "#f7faf7"
GROUP_OUTLINE = "#cbd5cb"
TEXT = "#111111"
FK = "#3f3f3f"
LOGICAL = "#1e40af"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

title_font = ImageFont.truetype(BOLD, 42)
group_font = ImageFont.truetype(BOLD, 34)
table_font = ImageFont.truetype(BOLD, 31)
field_font = ImageFont.truetype(FONT, 27)
label_font = ImageFont.truetype(FONT, 25)
legend_font = ImageFont.truetype(FONT, 30)


def arrowhead(draw, start, end, color, width=5):
    x1, y1 = start
    x2, y2 = end
    angle = atan2(y2 - y1, x2 - x1)
    size = 22
    spread = pi / 7
    p1 = (x2 - size * cos(angle - spread), y2 - size * sin(angle - spread))
    p2 = (x2 - size * cos(angle + spread), y2 - size * sin(angle + spread))
    draw.polygon([end, p1, p2], fill=color)


def line(draw, points, color=FK, width=5, dashed=False):
    for a, b in zip(points, points[1:]):
        if dashed:
            dashed_segment(draw, a, b, color, width)
        else:
            draw.line([a, b], fill=color, width=width)
    arrowhead(draw, points[-2], points[-1], color, width)


def dashed_segment(draw, a, b, color, width):
    x1, y1 = a
    x2, y2 = b
    length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
    if length == 0:
        return
    dash = 24
    gap = 16
    dx = (x2 - x1) / length
    dy = (y2 - y1) / length
    pos = 0
    while pos < length:
        end = min(pos + dash, length)
        draw.line(
            [
                (x1 + dx * pos, y1 + dy * pos),
                (x1 + dx * end, y1 + dy * end),
            ],
            fill=color,
            width=width,
        )
        pos += dash + gap


def label(draw, text, xy):
    x, y = xy
    bbox = draw.textbbox((0, 0), text, font=label_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x = 8
    pad_y = 4
    draw.rounded_rectangle(
        [x - pad_x, y - pad_y, x + tw + pad_x, y + th + pad_y],
        radius=8,
        fill=BG,
    )
    draw.text((x, y), text, font=label_font, fill=TEXT)


def table(draw, name, fields, x, y, w=430, h=250):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=BOX_FILL, outline=BOX_OUTLINE, width=3)
    draw.text((x + 22, y + 18), name, font=table_font, fill=TEXT)
    yy = y + 66
    for field in fields:
        draw.text((x + 22, yy), field, font=field_font, fill=TEXT)
        yy += 35
    return {
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "n": (x + w / 2, y),
        "s": (x + w / 2, y + h),
        "e": (x + w, y + h / 2),
        "wpt": (x, y + h / 2),
        "ne": (x + w, y),
        "nw": (x, y),
        "se": (x + w, y + h),
        "sw": (x, y + h),
    }


def group(draw, title, box):
    x, y, w, h = box
    draw.rounded_rectangle([x, y, x + w, y + h], radius=18, fill=GROUP_FILL, outline=GROUP_OUTLINE, width=3)
    draw.text((x + 26, y + 18), title, font=group_font, fill="#334033")


def main():
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)

    draw.text((90, 55), "Core Business Data ERD", font=title_font, fill=TEXT)

    group(draw, "Conference and review workflow", (70, 130, 1580, 1550))
    group(draw, "Discussion and notifications", (1690, 130, 840, 960))
    group(draw, "Scholar profile and COI data", (1690, 1120, 1840, 560))

    nodes = {}
    nodes["users"] = table(draw, "users", ["PK user_id", "email", "domain"], 130, 240, 430, 190)
    nodes["confs"] = table(draw, "conferences", ["PK conference_id", "chair", "configurations", "domain"], 690, 240, 430, 225)
    nodes["roles"] = table(draw, "conference_user_roles", ["PK id", "conference_id", "user_id", "user_email", "role, status"], 1210, 240, 430, 260)

    nodes["reviewers"] = table(draw, "conference_reviewers", ["PK id", "user_id", "conference_id", "domain, status"], 130, 660, 430, 225)
    nodes["subs"] = table(draw, "conference_submissions", ["PK submission_id", "conference_id", "author", "status", "title, abstract"], 690, 660, 430, 260)
    nodes["assign"] = table(draw, "paper_assignments", ["PK id", "FK conference_id", "FK submission_id", "FK reviewer_id", "score, status", "review_data"], 130, 1110, 430, 295)
    nodes["audit"] = table(draw, "review_audit_events", ["PK id", "FK assignment_id", "FK conference_id", "actor_id", "event_type"], 690, 1110, 430, 260)

    nodes["threads"] = table(draw, "discussion_threads", ["PK id", "FK submission_id", "FK reviewer_id", "FK conference_id", "title, visibility"], 1760, 300, 430, 260)
    nodes["notifs"] = table(draw, "notifications", ["user/conference context", "type, payload", "read state"], 1760, 710, 430, 190)
    nodes["messages"] = table(draw, "discussion_messages", ["PK id", "FK thread_id", "FK author_id", "content"], 2030, 710, 430, 225)

    nodes["profiles"] = table(draw, "scholar_profiles", ["PK id", "FK user_id", "semantic_scholar_id", "name"], 1760, 1240, 430, 225)
    nodes["coi"] = table(draw, "coi_relationships", ["PK id", "conference_id", "reviewer_id", "submission_id", "author_email", "relationship_type", "severity"], 2310, 1200, 430, 330)
    nodes["profile_papers"] = table(draw, "scholar_profile_papers", ["PK profile_id, paper_id", "FK profile_id", "FK paper_id"], 1760, 1560, 430, 190)
    nodes["papers"] = table(draw, "scholar_papers", ["PK id", "semantic_scholar_id", "title", "authors"], 2860, 1390, 430, 225)

    # FK relationships.
    line(draw, [nodes["users"]["s"], nodes["reviewers"]["n"]])
    label(draw, "1-N", (305, 535))

    line(draw, [nodes["confs"]["s"], nodes["subs"]["n"]])
    label(draw, "1-N", (865, 555))

    line(draw, [nodes["reviewers"]["s"], nodes["assign"]["n"]])
    label(draw, "1-N", (305, 995))

    line(draw, [nodes["subs"]["wpt"], (610, 790), (610, 1258), nodes["assign"]["e"]])
    label(draw, "1-N", (615, 1000))

    line(draw, [nodes["assign"]["e"], nodes["audit"]["wpt"]])
    label(draw, "1-N", (585, 1235))

    line(draw, [nodes["subs"]["e"], (1505, 790), (1505, 430), nodes["threads"]["wpt"]])
    label(draw, "1-N", (1450, 575))

    line(draw, [nodes["threads"]["s"], (1975, 630), nodes["messages"]["n"]])
    label(draw, "1-N", (1990, 640))

    line(draw, [nodes["profiles"]["s"], nodes["profile_papers"]["n"]])
    label(draw, "1-N", (1955, 1505))

    line(draw, [nodes["papers"]["wpt"], nodes["profile_papers"]["e"]])
    label(draw, "1-N", (2640, 1490))

    # Logical relationships.
    line(draw, [nodes["users"]["e"], (1180, 335), nodes["roles"]["wpt"]], color=LOGICAL, dashed=True)
    label(draw, "1-N", (730, 305))

    line(draw, [nodes["confs"]["e"], nodes["roles"]["wpt"]], color=LOGICAL, dashed=True)
    label(draw, "1-N", (1138, 350))

    line(draw, [nodes["users"]["n"], (345, 180), (1975, 180), nodes["profiles"]["n"]], color=FK)
    label(draw, "1-0/1", (1100, 150))

    line(draw, [nodes["subs"]["e"], (2260, 790), (2260, 1365), nodes["coi"]["wpt"]], color=LOGICAL, dashed=True)
    label(draw, "1-N", (2210, 1045))

    line(draw, [nodes["reviewers"]["e"], (1660, 772), (1660, 1365), nodes["coi"]["wpt"]], color=LOGICAL, dashed=True)
    label(draw, "1-N", (1620, 1080))

    line(draw, [nodes["messages"]["wpt"], (1805, 822), nodes["notifs"]["e"]], color=LOGICAL, dashed=True)
    label(draw, "tạo", (1955, 790))

    # Legend.
    y = 1900
    draw.line([(1040, y), (1160, y)], fill=FK, width=6)
    arrowhead(draw, (1040, y), (1160, y), FK)
    draw.text((1190, y - 20), "Foreign key in migration", font=legend_font, fill=TEXT)

    dashed_segment(draw, (1760, y), (1880, y), LOGICAL, 6)
    arrowhead(draw, (1760, y), (1880, y), LOGICAL)
    draw.text((1910, y - 20), "Logical/application relationship", font=legend_font, fill=TEXT)

    image.save(PNG_PATH, "PNG", dpi=(300, 300))
    image.save(PDF_PATH, "PDF", resolution=300)
    print(PNG_PATH)
    print(PDF_PATH)


if __name__ == "__main__":
    main()

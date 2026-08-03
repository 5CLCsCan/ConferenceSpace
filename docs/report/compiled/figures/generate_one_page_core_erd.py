from math import atan2, cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(__file__).resolve().parent
PNG_PATH = OUT_DIR / "core-business-erd-one-page.png"
PDF_PATH = OUT_DIR / "core-business-erd-one-page.pdf"

W, H = 3600, 2400
BG = "#ffffff"
PANEL = "#f8fbf8"
PANEL_OUTLINE = "#ccd8cc"
BOX_FILL = "#eef9ee"
BOX_OUTLINE = "#5f6f64"
TEXT = "#111111"
MUTED = "#4b5563"
FK = "#3f3f3f"
LOGICAL = "#1e40af"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

title_font = ImageFont.truetype(BOLD, 48)
panel_font = ImageFont.truetype(BOLD, 34)
table_font = ImageFont.truetype(BOLD, 25)
field_font = ImageFont.truetype(FONT, 22)
note_font = ImageFont.truetype(FONT, 24)
legend_font = ImageFont.truetype(FONT, 26)


def arrowhead(draw, start, end, color):
    x1, y1 = start
    x2, y2 = end
    angle = atan2(y2 - y1, x2 - x1)
    size = 18
    spread = pi / 7
    p1 = (x2 - size * cos(angle - spread), y2 - size * sin(angle - spread))
    p2 = (x2 - size * cos(angle + spread), y2 - size * sin(angle + spread))
    draw.polygon([end, p1, p2], fill=color)


def dashed_segment(draw, a, b, color, width):
    x1, y1 = a
    x2, y2 = b
    length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
    if length == 0:
        return
    dash = 22
    gap = 14
    dx = (x2 - x1) / length
    dy = (y2 - y1) / length
    pos = 0
    while pos < length:
        end = min(pos + dash, length)
        draw.line([(x1 + dx * pos, y1 + dy * pos), (x1 + dx * end, y1 + dy * end)], fill=color, width=width)
        pos += dash + gap


def connector(draw, points, color=FK, dashed=False, width=4):
    for a, b in zip(points, points[1:]):
        if dashed:
            dashed_segment(draw, a, b, color, width)
        else:
            draw.line([a, b], fill=color, width=width)
    arrowhead(draw, points[-2], points[-1], color)


def panel(draw, title, xywh):
    x, y, w, h = xywh
    draw.rounded_rectangle([x, y, x + w, y + h], radius=20, fill=PANEL, outline=PANEL_OUTLINE, width=3)
    draw.text((x + 28, y + 22), title, font=panel_font, fill="#2f3f35")


def table(draw, name, fields, x, y, w=330, h=170):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=10, fill=BOX_FILL, outline=BOX_OUTLINE, width=3)
    draw.text((x + 16, y + 14), name, font=table_font, fill=TEXT)
    yy = y + 52
    for field in fields:
        draw.text((x + 16, yy), field, font=field_font, fill=TEXT)
        yy += 28
    return {
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "n": (x + w / 2, y),
        "s": (x + w / 2, y + h),
        "e": (x + w, y + h / 2),
        "wpt": (x, y + h / 2),
    }


def legend(draw):
    y = 2275
    x = 1010
    draw.line([(x, y), (x + 115, y)], fill=FK, width=6)
    arrowhead(draw, (x, y), (x + 115, y), FK)
    draw.text((x + 145, y - 19), "Foreign key in migration", font=legend_font, fill=TEXT)

    x2 = 1940
    dashed_segment(draw, (x2, y), (x2 + 115, y), LOGICAL, 6)
    arrowhead(draw, (x2, y), (x2 + 115, y), LOGICAL)
    draw.text((x2 + 145, y - 19), "Logical/application relationship", font=legend_font, fill=TEXT)


def review_panel(draw):
    panel(draw, "A. Conference and review workflow", (70, 150, 1660, 2020))
    users = table(draw, "users", ["PK user_id", "email", "domain"], 130, 280, 330, 150)
    confs = table(draw, "conferences", ["PK conference_id", "chair", "configurations", "domain"], 640, 280, 370, 180)
    roles = table(draw, "conference_user_roles", ["PK id", "conference_id", "user_id", "role, status"], 1200, 280, 430, 180)
    reviewers = table(draw, "conference_reviewers", ["PK id", "user_id", "conference_id", "status"], 130, 770, 390, 170)
    subs = table(draw, "conference_submissions", ["PK submission_id", "conference_id", "author", "status"], 640, 770, 420, 170)
    assign = table(draw, "paper_assignments", ["PK id", "FK conference_id", "FK submission_id", "FK reviewer_id", "score, status"], 365, 1320, 430, 210)
    audit = table(draw, "review_audit_events", ["PK id", "FK assignment_id", "FK conference_id", "actor_id", "event_type"], 1050, 1320, 420, 210)

    connector(draw, [users["s"], reviewers["n"]])
    connector(draw, [confs["s"], subs["n"]])
    connector(draw, [users["n"], (295, 230), (1415, 230), roles["n"]], color=LOGICAL, dashed=True)
    connector(draw, [confs["n"], (825, 230), (1415, 230), roles["n"]], color=LOGICAL, dashed=True)
    connector(draw, [reviewers["s"], (325, 1165), (580, 1165), assign["n"]])
    connector(draw, [subs["s"], (850, 1165), (580, 1165), assign["n"]])
    connector(draw, [assign["e"], audit["wpt"]])


def discussion_panel(draw):
    panel(draw, "B. Discussion and notifications", (1800, 150, 1730, 930))
    confs = table(draw, "conferences", ["PK conference_id", "chair", "domain"], 1860, 280, 360, 145)
    subs = table(draw, "conference_submissions", ["PK submission_id", "conference_id", "author", "status"], 1860, 575, 420, 170)
    reviewers = table(draw, "conference_reviewers", ["PK id", "user_id", "conference_id", "status"], 2360, 575, 390, 170)
    threads = table(draw, "discussion_threads", ["PK id", "FK submission_id", "FK reviewer_id", "FK conference_id", "title, visibility"], 2890, 520, 430, 210)
    messages = table(draw, "discussion_messages", ["PK id", "FK thread_id", "FK author_id", "content"], 2890, 820, 430, 170)
    notifs = table(draw, "notifications", ["user/conference context", "type, payload", "read state"], 2860, 280, 440, 145)

    connector(draw, [confs["s"], (2040, 475), (3105, 475), threads["n"]])
    connector(draw, [subs["e"], (2330, 660), (2330, 785), (2890, 785), threads["wpt"]])
    connector(draw, [reviewers["e"], threads["wpt"]])
    connector(draw, [threads["s"], messages["n"]])
    connector(draw, [messages["e"], (3390, 905), (3390, 350), notifs["e"]], color=LOGICAL, dashed=True)


def scholar_panel(draw):
    panel(draw, "C. Scholar profile and COI data", (1800, 1160, 1730, 1010))
    users = table(draw, "users", ["PK user_id", "email", "domain"], 1860, 1285, 330, 150)
    profiles = table(draw, "scholar_profiles", ["PK id", "FK user_id", "semantic_scholar_id", "name"], 1860, 1570, 390, 170)
    profile_papers = table(draw, "scholar_profile_papers", ["PK profile_id, paper_id", "FK profile_id", "FK paper_id"], 1860, 1910, 430, 145)
    papers = table(draw, "scholar_papers", ["PK id", "semantic_scholar_id", "title", "authors"], 2460, 1910, 390, 170)
    subs = table(draw, "conference_submissions", ["PK submission_id", "conference_id", "author", "status"], 2460, 1285, 420, 170)
    reviewers = table(draw, "conference_reviewers", ["PK id", "user_id", "conference_id", "status"], 3050, 1285, 390, 170)
    coi = table(draw, "coi_relationships", ["PK id", "conference_id", "reviewer_id", "submission_id", "author_email", "relationship_type", "severity"], 2860, 1605, 430, 250)

    connector(draw, [users["s"], profiles["n"]])
    connector(draw, [profiles["s"], profile_papers["n"]])
    connector(draw, [papers["wpt"], profile_papers["e"]])
    connector(draw, [subs["s"], (2670, 1515), (3015, 1515), coi["n"]], color=LOGICAL, dashed=True)
    connector(draw, [reviewers["s"], (3245, 1515), (3075, 1515), coi["n"]], color=LOGICAL, dashed=True)


def main():
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)
    draw.text((80, 55), "Core Business Data ERD", font=title_font, fill=TEXT)
    draw.text(
        (850, 72),
        "One figure with subsystem panels to keep relationships readable",
        font=note_font,
        fill=MUTED,
    )
    review_panel(draw)
    discussion_panel(draw)
    scholar_panel(draw)
    legend(draw)
    image.save(PNG_PATH, "PNG", dpi=(300, 300))
    image.save(PDF_PATH, "PDF", resolution=300)
    print(PNG_PATH)
    print(PDF_PATH)


if __name__ == "__main__":
    main()

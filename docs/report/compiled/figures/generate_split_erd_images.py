from math import atan2, cos, sin, pi
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(__file__).resolve().parent
BG = "#ffffff"
BOX_FILL = "#eef9ee"
BOX_OUTLINE = "#5f6f64"
TEXT = "#111111"
FK = "#3f3f3f"
LOGICAL = "#1e40af"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

title_font = ImageFont.truetype(BOLD, 42)
table_font = ImageFont.truetype(BOLD, 31)
field_font = ImageFont.truetype(FONT, 27)
label_font = ImageFont.truetype(FONT, 24)
legend_font = ImageFont.truetype(FONT, 28)


def arrowhead(draw, start, end, color):
    x1, y1 = start
    x2, y2 = end
    angle = atan2(y2 - y1, x2 - x1)
    size = 22
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
    dash = 24
    gap = 16
    dx = (x2 - x1) / length
    dy = (y2 - y1) / length
    pos = 0
    while pos < length:
        end = min(pos + dash, length)
        draw.line([(x1 + dx * pos, y1 + dy * pos), (x1 + dx * end, y1 + dy * end)], fill=color, width=width)
        pos += dash + gap


def connector(draw, points, color=FK, dashed=False, width=5):
    for a, b in zip(points, points[1:]):
        if dashed:
            dashed_segment(draw, a, b, color, width)
        else:
            draw.line([a, b], fill=color, width=width)
    arrowhead(draw, points[-2], points[-1], color)


def label(draw, text, xy):
    x, y = xy
    bbox = draw.textbbox((0, 0), text, font=label_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.rounded_rectangle([x - 7, y - 4, x + tw + 7, y + th + 4], radius=8, fill=BG)
    draw.text((x, y), text, font=label_font, fill=TEXT)


def table(draw, name, fields, x, y, w=470, h=230):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=12, fill=BOX_FILL, outline=BOX_OUTLINE, width=3)
    draw.text((x + 22, y + 18), name, font=table_font, fill=TEXT)
    yy = y + 68
    for field in fields:
        draw.text((x + 22, yy), field, font=field_font, fill=TEXT)
        yy += 36
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


def legend(draw, y, x=650):
    draw.line([(x, y), (x + 120, y)], fill=FK, width=6)
    arrowhead(draw, (x, y), (x + 120, y), FK)
    draw.text((x + 150, y - 20), "Foreign key in migration", font=legend_font, fill=TEXT)
    dashed_segment(draw, (x + 600, y), (x + 720, y), LOGICAL, 6)
    arrowhead(draw, (x + 600, y), (x + 720, y), LOGICAL)
    draw.text((x + 750, y - 20), "Logical/application relationship", font=legend_font, fill=TEXT)


def save(image, name):
    png = OUT_DIR / f"{name}.png"
    pdf = OUT_DIR / f"{name}.pdf"
    image.save(png, "PNG", dpi=(300, 300))
    image.save(pdf, "PDF", resolution=300)
    print(png)
    print(pdf)


def review_workflow():
    image = Image.new("RGB", (2200, 1450), BG)
    draw = ImageDraw.Draw(image)
    draw.text((70, 55), "Conference and Review Workflow", font=title_font, fill=TEXT)

    users = table(draw, "users", ["PK user_id", "email", "domain"], 90, 180, 430, 190)
    confs = table(draw, "conferences", ["PK conference_id", "chair", "configurations", "domain"], 690, 180, 470, 225)
    roles = table(draw, "conference_user_roles", ["PK id", "conference_id", "user_id", "user_email", "role, status"], 1350, 180, 520, 260)
    reviewers = table(draw, "conference_reviewers", ["PK id", "user_id", "conference_id", "domain, status"], 90, 600, 470, 225)
    subs = table(draw, "conference_submissions", ["PK submission_id", "conference_id", "author", "status", "title, abstract"], 690, 600, 520, 260)
    assign = table(draw, "paper_assignments", ["PK id", "FK conference_id", "FK submission_id", "FK reviewer_id", "score, status", "review_data"], 340, 1010, 500, 295)
    audit = table(draw, "review_audit_events", ["PK id", "FK assignment_id", "FK conference_id", "actor_id", "event_type"], 1130, 1010, 500, 260)

    connector(draw, [users["s"], reviewers["n"]])
    connector(draw, [confs["s"], subs["n"]])
    connector(draw, [users["n"], (305, 135), (1610, 135), roles["n"]], color=LOGICAL, dashed=True)
    connector(draw, [confs["n"], (925, 135), (1610, 135), roles["n"]], color=LOGICAL, dashed=True)

    connector(draw, [reviewers["s"], (325, 940), (590, 940), assign["n"]])
    connector(draw, [subs["s"], (950, 940), (590, 940), assign["n"]])
    connector(draw, [assign["e"], audit["wpt"]])

    legend(draw, 1360, 580)
    save(image, "erd-review-workflow")


def discussion_flow():
    image = Image.new("RGB", (2200, 1400), BG)
    draw = ImageDraw.Draw(image)
    draw.text((70, 55), "Discussion and Notification Data", font=title_font, fill=TEXT)

    users = table(draw, "users", ["PK user_id", "email", "domain"], 90, 180, 430, 190)
    confs = table(draw, "conferences", ["PK conference_id", "chair", "domain"], 690, 180, 470, 190)
    notifs = table(draw, "notifications", ["user/conference context", "type, payload", "read state"], 1450, 180, 500, 190)
    subs = table(draw, "conference_submissions", ["PK submission_id", "conference_id", "author", "status"], 90, 560, 520, 225)
    reviewers = table(draw, "conference_reviewers", ["PK id", "user_id", "conference_id", "status"], 690, 560, 500, 225)
    threads = table(draw, "discussion_threads", ["PK id", "FK submission_id", "FK reviewer_id", "FK conference_id", "title, visibility"], 1320, 560, 520, 260)
    messages = table(draw, "discussion_messages", ["PK id", "FK thread_id", "FK author_id", "content"], 1320, 960, 520, 225)

    connector(draw, [confs["s"], (925, 460), (1580, 460), threads["n"]])
    connector(draw, [subs["s"], (350, 850), (1300, 850), threads["wpt"]])
    connector(draw, [reviewers["e"], threads["wpt"]])
    connector(draw, [threads["s"], messages["n"]])
    connector(draw, [messages["e"], (1990, 1072), (1990, 275), notifs["e"]], color=LOGICAL, dashed=True)

    legend(draw, 1300, 580)
    save(image, "erd-discussion-notifications")


def scholar_coi_flow():
    image = Image.new("RGB", (2200, 1400), BG)
    draw = ImageDraw.Draw(image)
    draw.text((70, 55), "Scholar Profile and COI Data", font=title_font, fill=TEXT)

    users = table(draw, "users", ["PK user_id", "email", "domain"], 90, 180, 430, 190)
    profiles = table(draw, "scholar_profiles", ["PK id", "FK user_id", "semantic_scholar_id", "name"], 90, 560, 500, 225)
    profile_papers = table(draw, "scholar_profile_papers", ["PK profile_id, paper_id", "FK profile_id", "FK paper_id"], 90, 940, 520, 190)
    papers = table(draw, "scholar_papers", ["PK id", "semantic_scholar_id", "title", "authors"], 770, 940, 500, 225)
    subs = table(draw, "conference_submissions", ["PK submission_id", "conference_id", "author", "status"], 770, 180, 520, 225)
    reviewers = table(draw, "conference_reviewers", ["PK id", "user_id", "conference_id", "status"], 1450, 180, 500, 225)
    coi = table(draw, "coi_relationships", ["PK id", "conference_id", "reviewer_id", "submission_id", "author_email", "relationship_type", "severity"], 1320, 600, 520, 330)

    connector(draw, [users["s"], profiles["n"]])
    label(draw, "1-0/1", (295, 455))
    connector(draw, [profiles["s"], profile_papers["n"]])
    connector(draw, [papers["wpt"], profile_papers["e"]])
    connector(draw, [subs["s"], (1030, 520), (1450, 520), coi["n"]], color=LOGICAL, dashed=True)
    connector(draw, [reviewers["s"], (1700, 520), (1580, 520), coi["n"]], color=LOGICAL, dashed=True)

    legend(draw, 1300, 580)
    save(image, "erd-scholar-coi")


if __name__ == "__main__":
    review_workflow()
    discussion_flow()
    scholar_coi_flow()

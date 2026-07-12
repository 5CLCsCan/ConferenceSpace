# -*- coding: utf-8 -*-
"""One-shot integrity audit: citations, TOC, LOF, LOT."""
from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

root = Path(r"e:/HCMUS/Graduate-Project/ConferenceSpace/docs/report/compiled/latex")
report_path = Path(
    r"e:/HCMUS/Graduate-Project/ConferenceSpace/docs/report/raw/report-integrity-audit.md"
)

SKIP_TEX = {"slides.tex"}
chapters = sorted(
    p for p in root.rglob("*.tex") if p.name not in SKIP_TEX and "slides" not in p.parts
)

bib_text = (root / "References" / "references.bib").read_text(
    encoding="utf-8", errors="replace"
)
bib_keys = set(re.findall(r"@\w+\s*\{\s*([^,\s]+)\s*,", bib_text))

entries_raw = re.split(r"\n(?=@)", bib_text)
entry_map: dict[str, tuple[str, str]] = {}
for block in entries_raw:
    m = re.match(r"@(\w+)\s*\{\s*([^,\s]+)\s*,", block.strip())
    if m:
        entry_map[m.group(2)] = (m.group(1), block)

cite_pat = re.compile(
    r"\\(?:cite|parencite|textcite|autocite|footcite|citeauthor|citeyear)\*?\{([^}]+)\}"
)
label_pat = re.compile(r"\\label\{([^}]+)\}")
section_pat = re.compile(
    r"\\(chapter|section|subsection|subsubsection)\*?\{([^}]*)\}"
)
includegraphics_pat = re.compile(r"\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}")
addcontents_pat = re.compile(r"\\addcontentsline\{toc\}\{([^}]+)\}\{([^}]+)\}")
ref_pat = re.compile(
    r"\\(?:ref|eqref|pageref|autoref|cref|Cref)\{([^}]+)\}"
)


def extract_brace_content(s: str, start_idx: int) -> tuple[str | None, int]:
    depth = 0
    i = start_idx
    while i < len(s):
        c = s[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return s[start_idx + 1 : i], i + 1
        i += 1
    return None, start_idx


def clean_tex(s: str) -> str:
    s = re.sub(r"\\[a-zA-Z]+\*?", "", s)
    s = s.replace("{", "").replace("}", "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


cites_by_file: dict[str, list[tuple[int, str]]] = defaultdict(list)
all_cite_keys: list[tuple[str, int, str]] = []
labels: dict[str, tuple[str, int, str]] = {}
sections: list[tuple[str, int, str, str]] = []
include_graphics: list[tuple[str, int, str]] = []
refs_used: list[tuple[str, int, str]] = []
addcontents: list[tuple[str, int, str, str]] = []
captions: list[dict] = []

for p in chapters:
    text = p.read_text(encoding="utf-8", errors="replace")
    rel = str(p.relative_to(root)).replace("\\", "/")
    lines = text.splitlines()
    for i, line in enumerate(lines, 1):
        for m in cite_pat.finditer(line):
            for k in m.group(1).split(","):
                k = k.strip()
                if k:
                    cites_by_file[rel].append((i, k))
                    all_cite_keys.append((rel, i, k))
        for m in label_pat.finditer(line):
            labels[m.group(1)] = (rel, i, line.strip()[:140])
        for m in section_pat.finditer(line):
            sections.append((rel, i, m.group(1), m.group(2)))
        for m in includegraphics_pat.finditer(line):
            include_graphics.append((rel, i, m.group(1)))
        for m in addcontents_pat.finditer(line):
            addcontents.append((rel, i, m.group(1), m.group(2)))
        for m in ref_pat.finditer(line):
            for k in m.group(1).split(","):
                k = k.strip()
                if k:
                    refs_used.append((rel, i, k))

    for m in re.finditer(r"\\captionof\{(figure|table)\}(?:\[[^\]]*\])?\{", text):
        content, _ = extract_brace_content(text, m.end() - 1)
        line_no = text[: m.start()].count("\n") + 1
        captions.append(
            {
                "file": rel,
                "line": line_no,
                "type": m.group(1),
                "text": content or "",
                "cmd": "captionof",
            }
        )

    for m in re.finditer(r"\\caption(?:\[[^\]]*\])?\{", text):
        prev = text[max(0, m.start() - 12) : m.start()]
        if prev.endswith("captionof"):
            continue
        # skip if this match is the brace of captionof{figure}{...} second arg already handled
        # captionof pattern is separate
        content, _ = extract_brace_content(text, m.end() - 1)
        line_no = text[: m.start()].count("\n") + 1
        window = text[max(0, m.start() - 1200) : m.start()]
        ctype = "unknown"
        begins = list(re.finditer(r"\\begin\{([^}]+)\}", window))
        ends = list(re.finditer(r"\\end\{([^}]+)\}", window))
        # walk open envs
        stack: list[str] = []
        events = [(b.start(), "b", b.group(1)) for b in begins] + [
            (e.start(), "e", e.group(1)) for e in ends
        ]
        events.sort()
        for _, kind, env in events:
            if kind == "b":
                stack.append(env)
            elif kind == "e" and stack and stack[-1] == env:
                stack.pop()
            elif kind == "e" and env in stack:
                while stack and stack[-1] != env:
                    stack.pop()
                if stack:
                    stack.pop()
        for env in reversed(stack):
            if env in ("figure", "PrismFigure"):
                ctype = "figure"
                break
            if env in (
                "table",
                "longtable",
                "tabular",
                "PrismLongTable",
                "PrismTableCenter",
            ):
                ctype = "table"
                break
        captions.append(
            {
                "file": rel,
                "line": line_no,
                "type": ctype,
                "text": content or "",
                "cmd": "caption",
            }
        )

cited_keys = {k for _, _, k in all_cite_keys}
undefined_cites = sorted(cited_keys - bib_keys)
unused_bib = sorted(bib_keys - cited_keys)
cite_counts: dict[str, int] = defaultdict(int)
for _, _, k in all_cite_keys:
    cite_counts[k] += 1

quality_issues: list[tuple[str, str, list[str]]] = []
for key, (etype, block) in entry_map.items():
    issues: list[str] = []
    if not re.search(r"(?i)\btitle\s*=", block):
        issues.append("missing title")
    if etype.lower() not in ("online", "misc", "software") and not re.search(
        r"(?i)\b(year|date)\s*=", block
    ):
        issues.append("missing year/date")
    if etype.lower() in ("online", "misc") and re.search(
        r"(?i)\burl\s*=", block
    ) and not re.search(r"(?i)\burldate\s*=", block):
        issues.append("url without urldate")
    if re.search(r"=\s*\{\s*\}", block):
        issues.append("empty field")
    if re.search(r"(?i)TODO|FIXME|xxx|placeholder|unknown author", block):
        issues.append("placeholder text")
    if etype.lower() in (
        "article",
        "inproceedings",
        "book",
        "incollection",
    ) and not re.search(r"(?i)\b(author|editor)\s*=", block):
        issues.append("missing author/editor")
    # year plausibility
    ym = re.search(r"(?i)\byear\s*=\s*\{?(\d{4})\}?", block)
    if ym:
        y = int(ym.group(1))
        if y < 1990 or y > 2026:
            issues.append(f"suspicious year {y}")
    if issues:
        quality_issues.append((key, etype, issues))

titles: dict[str, list[str]] = defaultdict(list)
for key, (etype, block) in entry_map.items():
    tm = re.search(
        r"(?i)\btitle\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", block
    )
    if tm:
        t = re.sub(r"\s+", " ", tm.group(1)).strip().lower()
        titles[t].append(key)
dup_titles = {t: ks for t, ks in titles.items() if len(ks) > 1}

defined_labels = set(labels.keys())
undefined_refs = sorted({k for _, _, k in refs_used if k not in defined_labels})
unused_labels = sorted(defined_labels - {k for _, _, k in refs_used})

log_path = root / "main.log"
log_text = (
    log_path.read_text(encoding="utf-8", errors="replace")
    if log_path.exists()
    else ""
)
mult_labels = re.findall(
    r"LaTeX Warning: Label `([^`]+)` multiply defined", log_text
)
undef_refs_log = re.findall(
    r"LaTeX Warning: Reference `([^`]+)` on page .* undefined", log_text
)
undef_cites_log = re.findall(
    r"Citation `([^`]+)` on page .* undefined", log_text
)

toc_path, lof_path, lot_path = root / "main.toc", root / "main.lof", root / "main.lot"
toc_text = (
    toc_path.read_text(encoding="utf-8", errors="replace")
    if toc_path.exists()
    else None
)
lof_text = (
    lof_path.read_text(encoding="utf-8", errors="replace")
    if lof_path.exists()
    else None
)
lot_text = (
    lot_path.read_text(encoding="utf-8", errors="replace")
    if lot_path.exists()
    else None
)


def parse_contents(text: str | None) -> list[tuple[str, str, str]]:
    if not text:
        return []
    out = []
    for m in re.finditer(
        r"\\contentsline \{([^}]+)\}\{((?:[^{}]|\{[^{}]*\})*)\}\{([^}]*)\}",
        text,
    ):
        out.append((m.group(1), m.group(2), m.group(3)))
    return out


toc_entries = parse_contents(toc_text)
lof_entries = parse_contents(lof_text)
lot_entries = parse_contents(lot_text)
ch_sections = [s for s in sections if "Chapter" in s[0].replace("\\", "/")]

fig_caps = [c for c in captions if c["type"] == "figure"]
tab_caps = [c for c in captions if c["type"] == "table"]
unk_caps = [c for c in captions if c["type"] == "unknown"]

# image existence
images_root = root / "Images"
images_root2 = root / "images"


def image_exists(path: str) -> bool:
    candidates = [
        images_root / path,
        images_root2 / path,
        root / path,
        Path(path),
    ]
    for c in candidates:
        if c.exists():
            return True
        for ext in (".png", ".jpg", ".jpeg", ".pdf", ".eps"):
            if Path(str(c) + ext).exists():
                return True
            if c.with_suffix(ext).exists():
                return True
    # glob soft match by basename
    base = Path(path).name
    for folder in (images_root, images_root2):
        if folder.exists():
            for f in folder.rglob("*"):
                if f.name == base or f.stem == Path(base).stem:
                    return True
    return False


# Compare LOF/LOT vs captions counts
# Caption emptiness / too long
empty_caps = [c for c in captions if not clean_tex(c["text"])]
long_caps = [c for c in captions if len(clean_tex(c["text"])) > 180]

# TOC: chapters from source vs TOC
src_chapters = [
    (rel, i, title)
    for rel, i, level, title in sections
    if level == "chapter" and "Chapter" in rel.replace("\\", "/")
]

out: list[str] = []
out.append("# Báo cáo rà soát toàn vẹn tài liệu (citations / TOC / LOF / LOT)")
out.append("")
out.append("Sinh tự động từ nguồn LaTeX + `main.toc`/`main.lof`/`main.lot`/`main.log` (nếu có).")
out.append("")

out.append("## 1. Citations")
out.append("")
out.append(f"- Số entry trong `.bib`: **{len(bib_keys)}**")
out.append(f"- Số key được cite (unique): **{len(cited_keys)}**")
out.append(f"- Tổng lượt cite: **{len(all_cite_keys)}**")
out.append(
    f"- Citation undefined (không có trong bib): **{len(undefined_cites)}**"
    + (f" → `{undefined_cites}`" if undefined_cites else " → NONE")
)
out.append(f"- Entry bib không được cite: **{len(unused_bib)}**")
out.append(f"- Entry có vấn đề chất lượng metadata: **{len(quality_issues)}**")
out.append(f"- Cặp title trùng giữa nhiều key: **{len(dup_titles)}**")
out.append(
    f"- Log undefined citations: **{sorted(set(undef_cites_log)) or 'NONE'}**"
)
out.append("")

out.append("### 1.1. Phân bố cite theo file")
out.append("")
for f, items in sorted(cites_by_file.items()):
    keys = sorted({k for _, k in items})
    out.append(f"- `{f}`: {len(items)} lượt, {len(keys)} key")
out.append("")

out.append("### 1.2. Bib không được cite")
out.append("")
if not unused_bib:
    out.append("- (không có)")
else:
    for k in unused_bib:
        et = entry_map.get(k, ("?", ""))[0]
        out.append(f"- `{k}` ({et})")
out.append("")

out.append("### 1.3. Vấn đề chất lượng metadata")
out.append("")
if not quality_issues:
    out.append("- (không có)")
else:
    for key, etype, issues in sorted(quality_issues):
        out.append(f"- `{key}` ({etype}): {', '.join(issues)}")
out.append("")

out.append("### 1.4. Title trùng (nguy cơ double-entry)")
out.append("")
if not dup_titles:
    out.append("- (không có)")
else:
    for t, ks in sorted(dup_titles.items(), key=lambda x: -len(x[1])):
        out.append(f"- keys {ks}: _{t[:120]}_")
out.append("")

out.append("### 1.5. Top key được cite nhiều nhất")
out.append("")
for k, c in sorted(cite_counts.items(), key=lambda x: -x[1])[:30]:
    in_bib = "OK" if k in bib_keys else "MISSING"
    out.append(f"- `{k}` ×{c} [{in_bib}]")
out.append("")

out.append("### 1.6. Chi tiết cite theo chương (mọi key)")
out.append("")
for f, items in sorted(cites_by_file.items()):
    if not f.startswith("Chapter"):
        continue
    keys = sorted({k for _, k in items})
    bad = [k for k in keys if k not in bib_keys]
    out.append(f"#### `{f}`")
    out.append(f"- Keys: {', '.join(f'`{k}`' for k in keys)}")
    if bad:
        out.append(f"- **UNDEFINED:** {bad}")
    out.append("")

out.append("## 2. Mục lục (TOC)")
out.append("")
out.append(f"- `main.toc` tồn tại: **{toc_path.exists()}**")
out.append(f"- Số dòng TOC đã compile: **{len(toc_entries)}**")
out.append(f"- Số `\\chapter` trong Chapter1–5: **{len(src_chapters)}**")
out.append("")

out.append("### 2.1. Front-matter qua `\\addcontentsline`")
out.append("")
for rel, i, level, title in addcontents:
    out.append(f"- [{level}] {title} — `{rel}:{i}`")
out.append("")

out.append("### 2.2. Cấu trúc heading từ source (Chapter1–5)")
out.append("")
for rel, i, level, title in ch_sections:
    indent = {
        "chapter": "",
        "section": "  ",
        "subsection": "    ",
        "subsubsection": "      ",
    }.get(level, "")
    out.append(f"- {indent}`{level}` {title}  (`{rel}:{i}`)")
out.append("")

out.append("### 2.3. TOC đã compile (nếu có)")
out.append("")
if not toc_entries:
    out.append("- **Chưa có `main.toc`** — cần compile full để xác nhận số trang/thứ tự.")
else:
    for level, title, page in toc_entries:
        out.append(f"- [{level}] p.{page}: {clean_tex(title)[:140]}")
out.append("")

# Structural checks: empty titles
empty_sections = [
    (rel, i, level, title)
    for rel, i, level, title in ch_sections
    if not title.strip()
]
out.append("### 2.4. Cảnh báo cấu trúc TOC")
out.append("")
if empty_sections:
    for rel, i, level, title in empty_sections:
        out.append(f"- Heading rỗng: `{level}` tại `{rel}:{i}`")
else:
    out.append("- Không có heading rỗng trong Chapter1–5.")
# subsubsection numbered like a) b)
lettered = [
    (rel, i, level, title)
    for rel, i, level, title in ch_sections
    if re.match(r"^[a-d]\)\s", title.strip())
]
if lettered:
    out.append(
        f"- Có **{len(lettered)}** subsubsection dùng prefix `a)`/`b)` trong title "
        "(sẽ hiện trong TOC nếu depth cho phép; có thể trùng kiểu đánh số)."
    )
    for rel, i, level, title in lettered[:20]:
        out.append(f"  - `{title}` (`{rel}:{i}`)")
out.append("")

out.append("## 3. Danh sách hình (LOF)")
out.append("")
out.append(f"- `\\includegraphics`: **{len(include_graphics)}**")
out.append(f"- Caption type=figure: **{len(fig_caps)}**")
out.append(f"- `main.lof` entries: **{len(lof_entries)}**")
out.append("")

out.append("### 3.1. File ảnh")
out.append("")
missing_imgs = []
for rel, i, path in include_graphics:
    ok = image_exists(path)
    status = "OK" if ok else "MISSING"
    if not ok:
        missing_imgs.append((rel, i, path))
    out.append(f"- [{status}] `{path}` (`{rel}:{i}`)")
out.append("")

out.append("### 3.2. Caption hình")
out.append("")
for c in fig_caps:
    out.append(
        f"- `{c['file']}:{c['line']}` [{c['cmd']}] {clean_tex(c['text'])[:140]}"
    )
out.append("")

out.append("### 3.3. LOF đã compile")
out.append("")
if not lof_entries:
    out.append("- **Chưa có `main.lof`** hoặc rỗng.")
else:
    for level, title, page in lof_entries:
        out.append(f"- p.{page}: {clean_tex(title)[:160]}")
# count mismatch
if lof_entries and len(lof_entries) != len(fig_caps):
    out.append(
        f"- **Lệch số lượng:** LOF={len(lof_entries)} vs caption figure={len(fig_caps)}"
    )
out.append("")

out.append("## 4. Danh sách bảng (LOT)")
out.append("")
out.append(f"- Caption type=table: **{len(tab_caps)}**")
out.append(f"- Caption type=unknown: **{len(unk_caps)}**")
out.append(f"- `main.lot` entries: **{len(lot_entries)}**")
out.append("")

out.append("### 4.1. Caption bảng (+ unknown)")
out.append("")
for c in tab_caps + unk_caps:
    out.append(
        f"- `{c['file']}:{c['line']}` type={c['type']} [{c['cmd']}] {clean_tex(c['text'])[:140]}"
    )
out.append("")

out.append("### 4.2. LOT đã compile")
out.append("")
if not lot_entries:
    out.append("- **Chưa có `main.lot`** hoặc rỗng.")
else:
    for level, title, page in lot_entries:
        out.append(f"- p.{page}: {clean_tex(title)[:160]}")
if lot_entries and len(lot_entries) != len(tab_caps):
    out.append(
        f"- **Lệch số lượng:** LOT={len(lot_entries)} vs caption table={len(tab_caps)} "
        f"(unknown captions={len(unk_caps)}; captionof/longtable có thể giải thích lệch)."
    )
out.append("")

out.append("## 5. Cross-reference & caption hygiene")
out.append("")
out.append(f"- Labels định nghĩa: **{len(labels)}**")
out.append(f"- Ref undefined (từ source scan): **{len(undefined_refs)}**")
if undefined_refs:
    out.append(f"  - {undefined_refs[:60]}")
out.append(f"- Labels không được ref: **{len(unused_labels)}** (thường chấp nhận được)")
out.append(f"- Log multiply-defined labels: **{sorted(set(mult_labels)) or 'NONE'}**")
out.append(f"- Log undefined refs: **{sorted(set(undef_refs_log)) or 'NONE'}**")
out.append("")
if empty_caps:
    out.append(f"- Caption rỗng: **{len(empty_caps)}**")
    for c in empty_caps:
        out.append(f"  - `{c['file']}:{c['line']}` type={c['type']}")
else:
    out.append("- Không có caption rỗng.")
if long_caps:
    out.append(f"- Caption rất dài (>180 ký tự clean): **{len(long_caps)}**")
    for c in long_caps[:15]:
        out.append(
            f"  - `{c['file']}:{c['line']}` ({len(clean_tex(c['text']))} chars) {clean_tex(c['text'])[:100]}…"
        )
out.append("")

out.append("## 6. Kết luận nhanh (severity)")
out.append("")
sev_high = []
sev_med = []
sev_low = []
if undefined_cites:
    sev_high.append(f"Citation không có trong bib: {undefined_cites}")
if undef_cites_log:
    sev_high.append(f"Log still has undefined citations: {sorted(set(undef_cites_log))}")
if missing_imgs:
    sev_high.append(f"Ảnh thiếu: {len(missing_imgs)} file")
if mult_labels:
    sev_med.append(f"Label multiply-defined: {sorted(set(mult_labels))}")
if undefined_refs or undef_refs_log:
    sev_med.append(
        f"Ref undefined source={undefined_refs[:20]} log={sorted(set(undef_refs_log))}"
    )
if not toc_path.exists():
    sev_med.append("Chưa có main.toc — TOC chưa verify sau compile")
if not lof_path.exists():
    sev_med.append("Chưa có main.lof")
if not lot_path.exists():
    sev_med.append("Chưa có main.lot")
if quality_issues:
    sev_med.append(f"{len(quality_issues)} bib entries metadata yếu")
if dup_titles:
    sev_med.append(f"{len(dup_titles)} nhóm title trùng trong bib")
if unused_bib:
    sev_low.append(f"{len(unused_bib)} bib entries không được cite (có thể dọn)")
if lettered:
    sev_low.append(f"{len(lettered)} subsubsection prefix a)/b) trong TOC")
if long_caps:
    sev_low.append(f"{len(long_caps)} caption dài — cân nhắc rút gọn cho LOF/LOT")

out.append("### HIGH")
out.append("")
for x in sev_high or ["(không)"]:
    out.append(f"- {x}")
out.append("")
out.append("### MEDIUM")
out.append("")
for x in sev_med or ["(không)"]:
    out.append(f"- {x}")
out.append("")
out.append("### LOW")
out.append("")
for x in sev_low or ["(không)"]:
    out.append(f"- {x}")
out.append("")

report_path.write_text("\n".join(out), encoding="utf-8")
print("Wrote", report_path)
print(
    f"bib={len(bib_keys)} cited={len(cited_keys)} undef_cite={undefined_cites} "
    f"unused_bib={len(unused_bib)} quality={len(quality_issues)} dups={len(dup_titles)}"
)
print(
    f"figs_img={len(include_graphics)} fig_cap={len(fig_caps)} tab_cap={len(tab_caps)} "
    f"unk_cap={len(unk_caps)} toc={len(toc_entries)} lof={len(lof_entries)} lot={len(lot_entries)}"
)
print(
    f"missing_img={len(missing_imgs)} undef_ref={undefined_refs} mult={sorted(set(mult_labels))}"
)

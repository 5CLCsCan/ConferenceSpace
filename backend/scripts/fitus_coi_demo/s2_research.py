#!/usr/bin/env python3
"""Research FIT@HCMUS lecturers on Semantic Scholar and dump raw JSON."""
import json
import os
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

API_KEY = os.environ["S2_API_KEY"]
BASE = "https://api.semanticscholar.org/graph/v1"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

LECTURERS = [
    # (vietnamese name, title, department)
    ("Lê Hoài Bắc", "GS.TS", "Computer Science"),
    ("Vũ Hải Quân", "PGS.TS", "Computer Science"),
    ("Hồ Bảo Quốc", "PGS.TS", "Information Systems"),
    ("Đinh Điền", "PGS.TS", "Knowledge Technology"),
    ("Nguyễn Đình Thúc", "PGS.TS", "Knowledge Technology"),
    ("Lý Quốc Ngọc", "PGS.TS", "Computer Vision & Intelligent Control"),
    ("Lê Hoàng Thái", "PGS.TS", "Computer Science"),
    ("Trần Minh Triết", "PGS.TS", "Software Technology"),
    ("Nguyễn Văn Vũ", "PGS.TS", "Software Technology"),
    ("Lê Nguyễn Hoài Nam", "PGS.TS", "Information Systems"),
    ("Đinh Bá Tiến", "TS", "Software Technology"),
    ("Bùi Tiến Lên", "TS", "Computer Science"),
    ("Lâm Quang Vũ", "TS", "Software Technology"),
    ("Châu Thành Đức", "TS", "Knowledge Technology"),
    ("Lê Thị Nhàn", "TS", "Information Systems"),
    ("Ngô Huy Biên", "TS", "Software Technology"),
    ("Ngô Minh Nhựt", "TS", "Knowledge Technology"),
    ("Nguyễn Đức Hoàng Hạ", "TS", "Computer Vision & Intelligent Control"),
    ("Nguyễn Hải Minh", "TS", "Computer Science"),
    ("Nguyễn Ngọc Thảo", "TS", "Computer Science"),
    ("Nguyễn Thanh Phương", "TS", "Computer Science"),
    ("Nguyễn Thị Hồng Nhung", "TS", "Knowledge Technology"),
    ("Nguyễn Thị Minh Tuyền", "TS", "Software Technology"),
    ("Phạm Nguyễn Cương", "TS", "Information Systems"),
    ("Nguyễn Trần Minh Thư", "TS", "Information Systems"),
    ("Nguyễn Trường Sơn", "TS", "Information Systems"),
    ("Phạm Thị Bạch Huệ", "TS", "Information Systems"),
    ("Trần Thái Sơn", "TS", "Computer Vision & Intelligent Control"),
    ("Trần Trung Dũng", "TS", "Computer Networks & Telecommunications"),
    ("Võ Hoài Việt", "TS", "Computer Vision & Intelligent Control"),
    ("Nguyễn Tiến Huy", "TS", "Computer Science"),
    ("Trương Toàn Thịnh", "TS", "Software Technology"),
    ("Lê Thanh Tùng", "TS", "Knowledge Technology"),
    ("Lê Trung Nghĩa", "TS", "Knowledge Technology"),
    ("Vũ Thị Mỹ Hằng", "TS", "Information Systems"),
    ("Lê Khánh Duy", "TS", "Software Technology"),
    ("Trần Duy Hoàng", "TS", "Software Technology"),
    ("Bùi Duy Đăng", "TS", "Computer Science"),
    ("Nguyễn Hồng Bửu Long", "TS", "Knowledge Technology"),
    ("Lê Ngọc Thành", "TS", "Computer Science"),
    ("Cấn Trần Thành Trung", "TS", "Knowledge Technology"),
    ("Bùi Văn Thạch", "TS", "Knowledge Technology"),
    ("Trương Phước Hưng", "TS", "Computer Networks & Telecommunications"),
    ("Lê Trung Hoàng", "TS", "Software Technology"),
    ("Đỗ Đức Hào", "TS", "Knowledge Technology"),
    ("Nguyễn Tuấn Nam", "TS", "Computer Networks & Telecommunications"),
]


def strip_diacritics(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    nfd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn")


def name_variants(vn_name: str):
    """Vietnamese order: FAMILY [middle...] GIVEN. Return romanized variants."""
    ascii_name = strip_diacritics(vn_name)
    parts = ascii_name.split()
    family, rest = parts[0], parts[1:]
    variants = []
    if rest:
        # Western order: middle+given first, family last: "Minh Triet Tran"
        variants.append(" ".join(rest) + " " + family)
        # Given + family only: "Triet Tran" (S2 primary profiles often
        # drop Vietnamese middle names)
        if len(rest) >= 2:
            variants.append(rest[-1] + " " + family)
    else:
        variants.append(ascii_name)
    return variants


def api_get(path: str, params: dict, retries: int = 8):
    url = f"{BASE}{path}?{urllib.parse.urlencode(params)}"
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"x-api-key": API_KEY})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code == 400 and attempt >= 2:
                print(f"  HTTP 400 persists, skipping: {url[:120]}", flush=True)
                return None
            # 400 can be spurious under load; 429/5xx = throttled
            wait = min(90, 3 * (2 ** attempt))
            print(f"  HTTP {e.code}, retry in {wait}s", flush=True)
            time.sleep(wait)
        except Exception as e:
            print(f"  error {e}, retry", flush=True)
            time.sleep(min(90, 3 * (2 ** attempt)))
    print(f"  giving up: {url[:120]}", flush=True)
    return None


def norm_tokens(s: str):
    return set(strip_diacritics(s).lower().replace("-", " ").replace(".", " ").split())


def search_author(vn_name: str):
    """Search all name variants, return merged unique candidates."""
    seen = {}
    for variant in name_variants(vn_name):
        data = api_get("/author/search", {
            "query": variant,
            "fields": "name,affiliations,paperCount,hIndex,citationCount,url",
            "limit": 20,
        })
        time.sleep(2.5)
        if not data:
            continue
        for cand in data.get("data", []):
            seen[cand["authorId"]] = cand
    return list(seen.values())


def score_candidate(vn_name: str, cand: dict) -> float:
    """Higher = better match.

    Accepts: exact token-set match (3.0), candidate contains all target
    tokens (2.0), or candidate is a subset of the target that still keeps
    the family name and the final given name, e.g. "Bac Le" for
    "Le Hoai Bac" (2.0) — S2 often drops Vietnamese middle names.
    Paper count weighs up to 2.0 so the author's primary (largest)
    profile beats small duplicate fragments.
    """
    target_parts = strip_diacritics(vn_name).split()
    family = target_parts[0].lower()
    last_given = target_parts[-1].lower()
    target = norm_tokens(strip_diacritics(vn_name))
    names = [cand.get("name") or ""] + (cand.get("aliases") or [])
    best_name = 0.0
    for n in names:
        toks = norm_tokens(n)
        if target <= toks and toks <= target:
            best_name = max(best_name, 3.0)  # exact token set match
        elif target <= toks:
            best_name = max(best_name, 2.0)  # superset: all target tokens present
        elif (len(toks) >= 2 and toks <= target
              and family in toks and last_given in toks):
            best_name = max(best_name, 2.0)  # subset keeping family + given
    if best_name < 2.0:
        return 0.0
    aff = " ".join(cand.get("affiliations") or []).lower()
    aff_bonus = 0.0
    for kw in ("ho chi minh", "hcmus", "university of science", "vietnam national university", "vnu"):
        if kw in aff:
            aff_bonus = 1.0
            break
    pc = cand.get("paperCount") or 0
    return best_name + aff_bonus + 2.0 * min(pc, 300) / 300.0


def main():
    results = []
    done_names = set()
    partial = os.path.join(OUT_DIR, "s2_raw_partial.json")
    if os.path.exists(partial):
        with open(partial, encoding="utf-8") as f:
            results = json.load(f)
        done_names = {r["vn_name"] for r in results}
        print(f"resuming: {len(done_names)} lecturers already searched", flush=True)

    for i, (vn_name, title, dept) in enumerate(LECTURERS):
        if vn_name in done_names:
            continue
        print(f"[{i+1}/{len(LECTURERS)}] {vn_name}", flush=True)
        cands = search_author(vn_name)
        scored = sorted(
            ((score_candidate(vn_name, c), c) for c in cands),
            key=lambda x: -x[0],
        )
        good = [(s, c) for s, c in scored if s > 0]
        entry = {
            "vn_name": vn_name,
            "title": title,
            "department": dept,
            "matched": None,
            "runner_ups": [c for _, c in good[1:4]],
        }
        if good:
            best_score, best = good[0]
            entry["matched"] = best
            entry["match_score"] = best_score
            print(f"  -> {best['name']} (id={best['authorId']}, papers={best.get('paperCount')}, h={best.get('hIndex')}, score={best_score:.2f})", flush=True)
        else:
            print("  -> NO MATCH", flush=True)
        results.append(entry)
        with open(os.path.join(OUT_DIR, "s2_raw_partial.json"), "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False)

    # Fetch papers for matched authors
    for entry in results:
        m = entry["matched"]
        if not m or "papers" in entry:
            continue
        print(f"papers: {entry['vn_name']} ({m['authorId']})", flush=True)
        papers = []
        offset = 0
        while offset < 300:
            data = api_get(f"/author/{m['authorId']}/papers", {
                "fields": "title,year,venue,externalIds,fieldsOfStudy,authors",
                "limit": 100,
                "offset": offset,
            })
            time.sleep(2.5)
            if not data or not data.get("data"):
                break
            papers.extend(data["data"])
            if data.get("next") is None:
                break
            offset = data["next"]
        entry["papers"] = papers
        print(f"  {len(papers)} papers", flush=True)
        with open(os.path.join(OUT_DIR, "s2_raw_partial.json"), "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False)

    out = os.path.join(OUT_DIR, "s2_raw.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    matched = sum(1 for r in results if r["matched"])
    print(f"DONE: {matched}/{len(results)} matched -> {out}", flush=True)


if __name__ == "__main__":
    main()

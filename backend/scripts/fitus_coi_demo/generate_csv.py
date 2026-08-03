#!/usr/bin/env python3
"""Convert s2_raw.json into import-ready CSVs for the ConferenceSpace COI graph.

Outputs (in --out-dir):
  fitus_lecturers.csv      - roster of matched lecturers (reference + user registration)
  fitus_coauthorships.csv  - 4-column format for backend/scripts/graph_ingestion
  fitus_papers.csv         - papers reference (title, year, venue, doi, author emails)
"""
import argparse
import csv
import json
import re
import unicodedata
from itertools import combinations

MAX_AUTHORS_PER_PAPER = 10  # skip hyper-authored papers (clique explosion)


def strip_diacritics(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    nfd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn")


def norm_tokens(s: str):
    return frozenset(strip_diacritics(s).lower().replace("-", " ").replace(".", " ").split())


def normalize_name(name: str) -> str:
    """Match backend/scripts/ingest_semantic_scholar.py normalize_name."""
    name = re.sub(r"[^\w\s\-]", "", name)
    name = name.lower().strip()
    name = re.sub(r"\s+", ".", name)
    name = re.sub(r"\.+", ".", name)
    return name


def gen_email(name: str, author_id: str) -> str:
    # Transliterate to ASCII first — diacritic emails break registration/login
    ascii_name = strip_diacritics(name).encode("ascii", "ignore").decode()
    normalized = normalize_name(ascii_name) or "unknown"
    return f"{normalized}.{author_id}@scholar.local"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="s2_raw.json")
    ap.add_argument("--out-dir", default=".")
    args = ap.parse_args()

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    lecturer_ids = {}  # authorId -> entry
    for entry in data:
        if entry.get("matched"):
            lecturer_ids[entry["matched"]["authorId"]] = entry

    # Name-based canonicalization: S2 fragments one person across many
    # authorIds. Map any paper author whose name matches a lecturer
    # (exact token set, superset, or family+given subset) onto that
    # lecturer's canonical email so within-faculty edges connect.
    lect_lookup = []  # (target_tokens, family, last_given, canonical_email, canonical_name)
    for entry in data:
        m = entry.get("matched")
        if not m:
            continue
        parts = strip_diacritics(entry["vn_name"]).split()
        lect_lookup.append((
            norm_tokens(entry["vn_name"]),
            parts[0].lower(),
            parts[-1].lower(),
            gen_email(m["name"], m["authorId"]),
            m["name"],
        ))

    def canonical(author):
        """Return (email, name, is_lecturer) with lecturer aliasing."""
        toks = norm_tokens(author["name"])
        for target, family, last_given, email, cname in lect_lookup:
            if toks == target or target <= toks or (
                len(toks) >= 2 and toks <= target
                and family in toks and last_given in toks
            ):
                return email, cname, True
        return gen_email(author["name"], author["authorId"]), author["name"], False

    # ---- lecturers roster ----
    with open(f"{args.out_dir}/fitus_lecturers.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["vn_name", "title", "department", "s2_author_id", "s2_name",
                    "email", "paper_count", "h_index", "citation_count", "s2_url"])
        for entry in data:
            m = entry.get("matched")
            if not m:
                w.writerow([entry["vn_name"], entry["title"], entry["department"],
                            "", "", "", "", "", "", ""])
                continue
            w.writerow([
                entry["vn_name"], entry["title"], entry["department"],
                m["authorId"], m["name"],
                gen_email(m["name"], m["authorId"]),
                m.get("paperCount") or 0, m.get("hIndex") or 0,
                m.get("citationCount") or 0, m.get("url") or "",
            ])

    # ---- papers + coauthorship pairs ----
    seen_papers = {}   # paperId-ish key -> paper row
    pairs = {}         # frozenset(email1,email2) -> (year, link) keep most recent year
    all_authors = {}   # email -> (name, authorId, is_lecturer)
    skipped_hyper = 0

    for entry in data:
        m = entry.get("matched")
        if not m:
            continue
        for p in entry.get("papers") or []:
            authors = [a for a in (p.get("authors") or []) if a.get("authorId")]
            if len(authors) < 2:
                continue
            if len(authors) > MAX_AUTHORS_PER_PAPER:
                skipped_hyper += 1
                continue
            year = p.get("year")
            if not year:
                continue
            ext = p.get("externalIds") or {}
            doi = ext.get("DOI", "")
            link = f"https://doi.org/{doi}" if doi else ""
            pkey = p.get("paperId") or (p.get("title"), year)
            emails = []
            for a in authors:
                em, cname, is_lect = canonical(a)
                emails.append(em)
                if em not in all_authors:
                    all_authors[em] = (cname, a["authorId"], is_lect)
            if pkey not in seen_papers:
                seen_papers[pkey] = [
                    (p.get("title") or "").strip(), year, p.get("venue") or "",
                    doi, ";".join(sorted(set(emails))),
                ]
            for e1, e2 in combinations(sorted(set(emails)), 2):
                key = (e1, e2)
                if key not in pairs or year > pairs[key][0]:
                    pairs[key] = (year, link)

    with open(f"{args.out_dir}/fitus_coauthorships.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["author_1", "author_2", "date", "metadata"])
        for (e1, e2), (year, link) in sorted(pairs.items(), key=lambda kv: (-kv[1][0], kv[0])):
            w.writerow([e1, e2, year, link])

    with open(f"{args.out_dir}/fitus_authors.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["email", "name", "s2_author_id", "is_lecturer"])
        for em in sorted(all_authors):
            name, aid, is_lect = all_authors[em]
            w.writerow([em, name, aid, "true" if is_lect else "false"])

    with open(f"{args.out_dir}/fitus_papers.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["title", "year", "venue", "doi", "author_emails"])
        for row in sorted(seen_papers.values(), key=lambda r: (-(r[1] or 0), r[0])):
            w.writerow(row)

    # ---- stats ----
    matched = sum(1 for e in data if e.get("matched"))
    lecturers_set = {gen_email(m["name"], m["authorId"])
                     for m in (e["matched"] for e in data if e.get("matched"))}
    lect_lect = sum(1 for (e1, e2) in pairs if e1 in lecturers_set and e2 in lecturers_set)
    recent = sum(1 for v in pairs.values() if v[0] >= 2022)
    print(f"lecturers matched:        {matched}/{len(data)}")
    print(f"unique authors in graph:  {len(all_authors)}")
    print(f"papers kept:              {len(seen_papers)} (skipped {skipped_hyper} with >{MAX_AUTHORS_PER_PAPER} authors)")
    print(f"coauthorship edges:       {len(pairs)}")
    print(f"  lecturer<->lecturer:    {lect_lect}")
    print(f"  in COI window (>=2022): {recent}")


if __name__ == "__main__":
    main()

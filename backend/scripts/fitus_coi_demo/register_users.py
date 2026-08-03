#!/usr/bin/env python3
"""
Register FIT@HCMUS demo authors as platform users so the COI graph
emails resolve to real accounts.

Reads fitus_authors.csv (email, name, s2_author_id, is_lecturer) and
registers each author via POST /api/v1/auth/register, matching the
conventions of scripts/ingest_semantic_scholar.py.

Usage:
    # Register only the 44 lecturers (enough for most demos)
    python register_users.py --lecturers-only

    # Register every author in the graph (~1160 users)
    python register_users.py

    python register_users.py --api-base http://localhost:8080/api/v1
"""

import argparse
import csv
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: 'requests' library is required. Install with: pip install requests")
    sys.exit(1)

DEFAULT_PASSWORD = "password123"


def parse_name_parts(name: str):
    parts = name.strip().split()
    if not parts:
        return "Unknown", "Author"
    if len(parts) == 1:
        return parts[0], "Author"
    return " ".join(parts[:-1]), parts[-1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path,
                    default=Path(__file__).parent / "fitus_authors.csv")
    ap.add_argument("--api-base", default="http://localhost:8080/api/v1")
    ap.add_argument("--password", default=DEFAULT_PASSWORD)
    ap.add_argument("--lecturers-only", action="store_true",
                    help="Only register the FIT@HCMUS lecturers")
    args = ap.parse_args()

    with open(args.input, encoding="utf-8") as f:
        authors = [r for r in csv.DictReader(f)]
    if args.lecturers_only:
        authors = [a for a in authors if a["is_lecturer"] == "true"]

    print(f"Registering {len(authors)} users via {args.api_base} ...")
    session = requests.Session()
    ok = 0
    for i, a in enumerate(authors, 1):
        first, last = parse_name_parts(a["name"])
        payload = {
            "user": {
                "email": a["email"],
                "first_name": first,
                "last_name": last,
                "domain": ["Research"],
            },
            "password": args.password,
        }
        try:
            resp = session.post(f"{args.api_base}/auth/register",
                                json=payload, timeout=10)
            if resp.status_code == 201:
                ok += 1
            elif resp.status_code == 400 and (
                "already exists" in resp.text.lower()
                or "duplicate" in resp.text.lower()
            ):
                ok += 1
            else:
                print(f"  Warning: {a['email']}: {resp.status_code} {resp.text[:100]}")
        except requests.RequestException as e:
            print(f"  Warning: {a['email']}: {e}")
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(authors)}")

    print(f"Done: {ok}/{len(authors)} registered (or already existed)")


if __name__ == "__main__":
    main()

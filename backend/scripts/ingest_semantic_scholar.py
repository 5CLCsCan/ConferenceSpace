#!/usr/bin/env python3
"""
Semantic Scholar Data Ingestion Script

Imports paper data from Semantic Scholar JSON files for COI testing.
- Creates users via the API
- Generates CSV for the Go graph_ingestion tool (Neo4j co-authorship data)

Usage:
    python ingest_semantic_scholar.py \
        --input /path/to/semantic_scholar_results.json \
        --api-base http://localhost:8080/api/v1 \
        --output coauthorships.csv
"""

import argparse
import csv
import json
import re
import sys
from itertools import combinations
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try
    import requests
except ImportError:
    print("Error: 'requests' library is required. Install with: pip install requests")
    sys.exit(1)


# Default password for generated test users
DEFAULT_PASSWORD = "password123"


def normalize_name(name: str) -> str:
    """
    Normalize author name to create email-friendly format.
    
    Example: "Ho Thi Hoang Vy" -> "ho.thi.hoang.vy"
    """
    # Remove special characters, keep letters, spaces, and hyphens
    name = re.sub(r"[^\w\s\-]", "", name)
    # Convert to lowercase and replace spaces with dots
    name = name.lower().strip()
    name = re.sub(r"\s+", ".", name)  
    # Remove consecutive dots
    name = re.sub(r"\.+", ".", name)
    return name


def generate_email(author: dict) -> str:
    """
    Generate a deterministic email from author info.
    
    Example: {"name": "Ho Thi Hoang Vy", "authorId": "2904748"}
             -> "ho.thi.hoang.vy.2904748@scholar.local"
    """
    name = author.get("name", "unknown")
    author_id = author.get("authorId", "0")
    
    normalized = normalize_name(name)
    if not normalized:
        normalized = "unknown"
    
    return f"{normalized}.{author_id}@scholar.local"


def parse_name_parts(name: str) -> Tuple[str, str]:
    """
    Parse full name into first and last name.
    
    Assumes the last word is the last name, rest is first name.
    """
    parts = name.strip().split()
    if len(parts) == 0:
        return "Unknown", "Author"
    elif len(parts) == 1:
        return parts[0], "Author"
    else:
        return " ".join(parts[:-1]), parts[-1]


def extract_year(paper: dict) -> int:
    """
    Extract publication year from paper data.
    
    Tries 'year' field first, then parses 'publicationDate'.
    """
    if paper.get("year"):
        return int(paper["year"])
    
    pub_date = paper.get("publicationDate", "")
    if pub_date:
        # Format: "2024-03-01" or similar
        match = re.match(r"(\d{4})", pub_date)
        if match:
            return int(match.group(1))
    
    return 2024  # Default to current year


def load_json_file(filepath: Path) -> List[dict]:
    """
    Load Semantic Scholar JSON file.
    
    Handles both single paper objects and search result format with 'data' array.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Handle search results format: {"total": N, "data": [...]}
    if isinstance(data, dict) and "data" in data:
        return data["data"]
    
    # Handle array of papers
    if isinstance(data, list):
        return data
    
    # Handle single paper object
    if isinstance(data, dict):
        return [data]
    
    return []


def register_user(api_base: str, email: str, first_name: str, last_name: str, 
                  password: str = DEFAULT_PASSWORD, session: requests.Session = None) -> bool:
    """
    Register a user via the API.
    
    Returns True if successful or user already exists, False on error.
    """
    if session is None:
        session = requests.Session()
    
    url = f"{api_base}/auth/register"
    payload = {
        "user": {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "domain": ["Research"]
        },
        "password": password
    }
    
    try:
        response = session.post(url, json=payload, timeout=10)
        
        if response.status_code == 201:
            return True
        elif response.status_code == 400:
            # Check if user already exists
            error_msg = response.json().get("error", "").lower()
            if "already exists" in error_msg or "duplicate" in error_msg:
                return True  # User exists, that's fine
        
        # Log other errors but continue
        print(f"  Warning: Failed to register {email}: {response.status_code} - {response.text[:100]}")
        return False
        
    except requests.RequestException as e:
        print(f"  Warning: Request failed for {email}: {e}")
        return False


def process_papers(papers: List[dict], api_base: Optional[str], output_csv: Path,
                   skip_api: bool = False, verbose: bool = False) -> Dict[str, Any]:
    """
    Process papers to extract authors, register users, and generate CSV.
    
    Returns statistics about the processing.
    """
    # Collect unique authors and co-authorship pairs
    authors: Dict[str, dict] = {}  # email -> author info
    coauthorships: List[dict] = []  # list of {author1, author2, year, url}
    
    print(f"\n📖 Processing {len(papers)} papers...")
    
    for paper in papers:
        paper_authors = paper.get("authors", [])
        if len(paper_authors) < 2:
            continue  # Need at least 2 authors for co-authorship
        
        year = extract_year(paper)
        url = paper.get("url", "")
        
        # Generate emails for all authors
        author_emails = []
        for author in paper_authors:
            email = generate_email(author)
            author_emails.append(email)
            
            if email not in authors:
                first_name, last_name = parse_name_parts(author.get("name", "Unknown"))
                authors[email] = {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "name": author.get("name", "Unknown"),
                    "author_id": author.get("authorId", "0")
                }
        
        # Generate all co-author pairs using combinations
        for email1, email2 in combinations(author_emails, 2):
            coauthorships.append({
                "author1": email1,
                "author2": email2,
                "year": year,
                "url": url
            })
    
    print(f"✅ Found {len(authors)} unique authors")
    print(f"✅ Generated {len(coauthorships)} co-authorship pairs")
    
    # Register users via API (if not skipped)
    registered_count = 0
    if not skip_api and api_base:
        print(f"\n👤 Registering users via API ({api_base})...")
        session = requests.Session()
        
        for i, (email, info) in enumerate(authors.items(), 1):
            if verbose:
                print(f"  [{i}/{len(authors)}] Registering {email}...")
            
            success = register_user(
                api_base=api_base,
                email=email,
                first_name=info["first_name"],
                last_name=info["last_name"],
                session=session
            )
            if success:
                registered_count += 1
            
            # Progress indicator every 10 users
            if i % 10 == 0 and not verbose:
                print(f"  Progress: {i}/{len(authors)}")
        
        print(f"✅ Registered {registered_count}/{len(authors)} users")
    else:
        print("\n⏭️  Skipping API registration (--skip-api or no --api-base)")
    
    # Write CSV file
    print(f"\n📝 Writing CSV to {output_csv}...")
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["author_1", "author_2", "date", "metadata"])
        
        for pair in coauthorships:
            writer.writerow([
                pair["author1"],
                pair["author2"],
                pair["year"],
                pair["url"]
            ])
    
    print(f"✅ Wrote {len(coauthorships)} rows to CSV")
    
    return {
        "papers_processed": len(papers),
        "unique_authors": len(authors),
        "coauthorship_pairs": len(coauthorships),
        "users_registered": registered_count,
        "csv_file": str(output_csv)
    }


def main():
    parser = argparse.ArgumentParser(
        description="Import Semantic Scholar data for COI testing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full workflow: create users and generate CSV
  python ingest_semantic_scholar.py \\
      --input results.json \\
      --api-base http://localhost:8080/api/v1 \\
      --output coauthorships.csv

  # Only generate CSV (skip API registration)
  python ingest_semantic_scholar.py \\
      --input results.json \\
      --output coauthorships.csv \\
      --skip-api

After running, import graph data with:
  cd tools/graph_ingestion
  ./graph-import -file=../../scripts/coauthorships.csv
"""
    )
    
    parser.add_argument(
        "--input", "-i",
        type=Path,
        required=True,
        help="Path to Semantic Scholar JSON file"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=Path("coauthorships.csv"),
        help="Output CSV file path (default: coauthorships.csv)"
    )
    
    parser.add_argument(
        "--api-base",
        type=str,
        default="http://localhost:8080/api/v1",
        help="API base URL (default: http://localhost:8080/api/v1)"
    )
    
    parser.add_argument(
        "--skip-api",
        action="store_true",
        help="Skip user registration via API (only generate CSV)"
    )
    
    parser.add_argument(
        "--password",
        type=str,
        default=DEFAULT_PASSWORD,
        help=f"Password for created users (default: {DEFAULT_PASSWORD})"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )
    
    args = parser.parse_args()
    
    # Validate input file
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)
    
    print("=" * 50)
    print("Semantic Scholar Data Ingestion")
    print("=" * 50)
    print(f"Input:    {args.input}")
    print(f"Output:   {args.output}")
    print(f"API Base: {args.api_base}")
    print(f"Skip API: {args.skip_api}")
    
    # Load and process papers
    papers = load_json_file(args.input)
    
    if not papers:
        print("Error: No papers found in input file")
        sys.exit(1)
    
    stats = process_papers(
        papers=papers,
        api_base=args.api_base if not args.skip_api else None,
        output_csv=args.output,
        skip_api=args.skip_api,
        verbose=args.verbose
    )
    
    # Print summary
    print("\n" + "=" * 50)
    print("Summary")
    print("=" * 50)
    print(f"Papers processed:     {stats['papers_processed']}")
    print(f"Unique authors:       {stats['unique_authors']}")
    print(f"Co-authorship pairs:  {stats['coauthorship_pairs']}")
    print(f"Users registered:     {stats['users_registered']}")
    print(f"CSV file:             {stats['csv_file']}")
    
    print("\n✅ Done!")
    print("\nNext step: Import graph data to Neo4j:")
    print(f"  cd tools/graph_ingestion")
    print(f"  ./graph-import -file=../../scripts/{args.output.name}")


if __name__ == "__main__":
    main()


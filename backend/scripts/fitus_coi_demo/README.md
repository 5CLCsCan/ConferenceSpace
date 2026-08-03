# FIT@HCMUS COI Demo Dataset

Real co-authorship data for demoing conflict-of-interest detection, built
from the lecturers of the Faculty of Information Technology, University of
Science (VNU-HCM). The roster (46 lecturers, 6 departments) was taken from
the [faculty website](https://www.fit.hcmus.edu.vn/sau-dai-hoc/giang-vien)
and each lecturer was resolved to their Semantic Scholar profile; their
papers and co-authors were then pulled via the Semantic Scholar Graph API.

## Contents

| File | Description |
|------|-------------|
| `fitus_coauthorships.csv` | **Graph import file** — `author_1,author_2,date,metadata` format consumed by `scripts/graph_ingestion`. 4,186 undirected co-authorship edges (2,711 with year >= 2022, i.e. inside the default 4-year COI window). |
| `fitus_lecturers.csv` | The 46 lecturers: Vietnamese name, title, department, matched Semantic Scholar profile, generated email. 44/46 matched (no S2 profile found for Bùi Tiến Lên, Bùi Duy Đăng). |
| `fitus_authors.csv` | All 1,162 authors appearing in the graph (lecturers + external co-authors) with their generated emails. Input for `register_users.py`. |
| `fitus_papers.csv` | The 543 underlying papers (title, year, venue, DOI, author emails) for reference/provenance. |
| `register_users.py` | Registers the authors as platform users via `POST /auth/register` (password `password123`). |
| `s2_research.py` | Reproducibility: queries Semantic Scholar for the lecturer roster (needs `S2_API_KEY` env var) and dumps raw JSON. |
| `generate_csv.py` | Reproducibility: converts the raw JSON into the CSVs above. |

Emails follow the existing `scripts/ingest_semantic_scholar.py` convention:
`<normalized.name>.<s2AuthorId>@scholar.local`. Because Semantic Scholar
fragments Vietnamese researchers across duplicate profiles, any paper
co-author whose name matches a lecturer was canonicalized onto that
lecturer's single email, so within-faculty edges connect properly.

## Loading the demo

```bash
# 1. Start Neo4j and register the users (lecturers only is enough for most demos)
cd backend && make neo4j-up
python3 scripts/fitus_coi_demo/register_users.py --lecturers-only

# 2. Import the co-authorship graph
cd scripts/graph_ingestion
go build -o graph-import .
./graph-import -file=../fitus_coi_demo/fitus_coauthorships.csv
```

Note: `make graph-import` points at a stale `tools/graph_ingestion` path —
invoke the binary directly as above. Also note `devtool/seeder/seed_demo.py`
**wipes Neo4j**; re-run the import after seeding.

## Demo scenarios

COI detection (`internal/assignment/coi/detectors/relationship.go`) flags a
reviewer when a `COAUTHORED` path of 1–3 hops exists where every edge has
`established_date >= current_year - coi_window_years` (default window 4).

**Direct conflict (1 hop, in-window)** — assign the reviewer to a paper
authored by the other; the assignment is flagged `collaborator/medium`:

| Reviewer | Author | Last co-pub |
|----------|--------|-------------|
| PGS.TS. Trần Minh Triết | TS. Lê Trung Nghĩa | 2026 |
| TS. Lê Khánh Duy | PGS.TS. Trần Minh Triết | 2026 |
| TS. Nguyễn Tiến Huy | TS. Lê Thanh Tùng | 2026 |
| GS.TS. Lê Hoài Bắc | PGS.TS. Lê Nguyễn Hoài Nam | 2025 |
| TS. Phạm Nguyễn Cương | TS. Vũ Thị Mỹ Hằng | 2024 |
| TS. Đỗ Đức Hào | TS. Trần Thái Sơn | 2023 |

**Indirect conflict (2 hops via a shared co-author, all edges in-window)** —
e.g. GS.TS. Lê Hoài Bắc ↔ TS. Nguyễn Tiến Huy, or Trần Minh Triết ↔
Nguyễn Tiến Huy: no direct edge, still flagged through a mutual collaborator.

**Negative control (collaboration outside the window, NOT flagged)**:

| Pair | Last co-pub |
|------|-------------|
| PGS.TS. Lý Quốc Ngọc ↔ TS. Võ Hoài Việt | 2016 |
| PGS.TS. Hồ Bảo Quốc ↔ PGS.TS. Lê Nguyễn Hoài Nam | 2015 |
| PGS.TS. Vũ Hải Quân ↔ TS. Nguyễn Đức Hoàng Hạ | 2008 |

These show the time-window logic: a real past collaboration that no longer
constitutes a conflict.

## Caveats

- Semantic Scholar author disambiguation is imperfect. Matches with common
  names and few papers are lower confidence: Nguyễn Thị Minh Tuyền ("Tuyen
  Nguyen"), Nguyễn Hồng Bửu Long ("Long Nguyen"), Phạm Thị Bạch Huệ ("Phạm
  Thị Huế"), Cấn Trần Thành Trung ("Trung Can"). See `fitus_lecturers.csv`
  for every match and its S2 profile URL.
- Papers with more than 10 authors were skipped (37 papers) to avoid
  clique explosion in the pair generation.
- Paper counts reflect the single largest S2 profile per lecturer, not
  their full publication record.

# Graph Ingestion Tool

A CLI tool for importing co-authorship data into Neo4j for COI (Conflict of Interest) detection.

## Overview

This tool reads CSV files containing author collaboration data and imports them into Neo4j as a graph of authors and co-authorship relationships.

## Installation

```bash
cd backend/tools/graph_ingestion
go mod tidy
go build -o graph-import
```

## CSV Format

Your CSV file should have the following columns:

```
author_1,author_2,date,metadata
alice@uni.edu,bob@uni.edu,2021,https://arxiv.org/paper1
bob@uni.edu,charlie@lab.org,2022,https://example.com/paper2
alice@uni.edu,charlie@lab.org,2020,DOI:10.1234/example
```

**Columns:**
1. `author_1` - Email of first author (required)
2. `author_2` - Email of second author (required)
3. `date` - Year of collaboration (required, integer)
4. `metadata` - Additional data like paper link, DOI, etc. (optional)

**Notes:**
- First row is treated as header by default (use `-skip-header=false` if no header)
- Empty metadata is allowed
- Lines with invalid data are skipped with a warning

## Usage

### Basic Import

```bash
./graph-import -file=data.csv
```

### Clear Existing Data First

```bash
./graph-import -file=data.csv -clear
```

### Custom Neo4j Connection

```bash
./graph-import \
  -file=data.csv \
  -uri=bolt://localhost:7687 \
  -user=neo4j \
  -pass=mypassword
```

### Adjust Batch Size

```bash
# Larger batches = faster import but more memory
./graph-import -file=data.csv -batch=5000
```

### Full Example

```bash
./graph-import \
  -file=collaborations.csv \
  -uri=bolt://neo4j.example.com:7687 \
  -user=admin \
  -pass=secret \
  -batch=2000 \
  -clear \
  -skip-header=true
```

## Command Line Flags

| Flag | Default | Description |
|------|---------|-------------|
| `-file` | (required) | Path to CSV file |
| `-uri` | `bolt://localhost:7687` | Neo4j connection URI |
| `-user` | `neo4j` | Neo4j username |
| `-pass` | `conferencespace` | Neo4j password |
| `-batch` | `1000` | Number of records per batch |
| `-clear` | `false` | Clear existing data before import |
| `-skip-header` | `true` | Skip first row as header |

## Example Data Files

### example_data.csv

```csv
author_1,author_2,date,metadata
alice@university.edu,bob@university.edu,2021,https://arxiv.org/abs/2101.12345
bob@university.edu,charlie@lab.org,2022,https://example.com/paper2
alice@university.edu,david@institute.edu,2020,DOI:10.1234/example
charlie@lab.org,eve@research.org,2023,https://doi.org/10.5555/paper
bob@university.edu,frank@college.edu,2021,
david@institute.edu,eve@research.org,2022,https://arxiv.org/abs/2201.98765
```

## Quick Start

### 1. Prepare Your Data

Create a CSV file with your collaboration data:

```bash
cat > collaborations.csv << EOF
author_1,author_2,date,metadata
alice@uni.edu,bob@uni.edu,2021,https://example.com/paper1
bob@uni.edu,charlie@uni.edu,2022,https://example.com/paper2
EOF
```

### 2. Start Neo4j

```bash
cd ../../
make neo4j-up
make neo4j-init
```

### 3. Build and Run

```bash
cd tools/graph_ingestion
go build -o graph-import
./graph-import -file=collaborations.csv
```

### 4. Verify Import

```bash
# Using make command
cd ../../
make neo4j-status

# Or directly via Neo4j Browser
# Open http://localhost:7474
# Run: MATCH (a:Author) RETURN a LIMIT 10
```

## Output Example

```
✅ Connected to Neo4j
📋 Initializing schema (constraints & indexes)...
✅ Schema initialized
📖 Reading CSV file: collaborations.csv
✅ Found 1000 records
📥 Importing data...
   Progress: 1000/1000 (100.0%)
✅ Import completed in 2.5s

📊 Statistics:
   Authors: 450
   Collaborations: 1000
   Records/sec: 400.00
```

## Performance Tips

1. **Batch Size**: Increase for faster imports on large datasets
   - Small datasets (< 10K): Use default (1000)
   - Medium datasets (10K-100K): Use 2000-5000
   - Large datasets (> 100K): Use 5000-10000

2. **Clear First**: Use `-clear` to remove old data and avoid duplicates

3. **Network**: Run on same machine as Neo4j for fastest import

4. **Memory**: Neo4j needs adequate memory for large imports (see docker-compose.yml)

## Troubleshooting

### "Connection refused"

```bash
# Make sure Neo4j is running
cd ../../
make neo4j-status

# Start if needed
make neo4j-up
```

### "Authentication failed"

Check your credentials:
```bash
./graph-import -file=data.csv -user=neo4j -pass=conferencespace
```

### "Invalid date"

Ensure dates are integers (years):
```
alice@uni.edu,bob@uni.edu,2021,paper1    ✅ Correct
alice@uni.edu,bob@uni.edu,2021-01-01,... ❌ Wrong
```

### Duplicate relationships

Use `-clear` to remove existing data:
```bash
./graph-import -file=data.csv -clear
```

## Integration with Main Application

This is a standalone tool for initial data loading. For ongoing sync, use the Neo4j client in the main application:

```go
// In your main application
import "github.com/dcao/conferencespace/internal/clients/neo4j"

authorSvc := neo4j.NewAuthorService(clients.Neo4j)
authorSvc.CreateCoauthorship(ctx, email1, email2, rel)
```

## Building for Different Platforms

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o graph-import-linux

# macOS
GOOS=darwin GOARCH=amd64 go build -o graph-import-mac

# Windows
GOOS=windows GOARCH=amd64 go build -o graph-import.exe
```

## See Also

- [Neo4j Client Documentation](../../internal/clients/README.md)
- [Neo4j Setup Guide](../../docs/NEO4J_SETUP.md)
- [Neo4j Browser](http://localhost:7474)


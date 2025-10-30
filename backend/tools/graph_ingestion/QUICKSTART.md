# Graph Ingestion - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Prepare your CSV file

```csv
author_1,author_2,date,metadata
alice@uni.edu,bob@uni.edu,2021,https://arxiv.org/paper1
bob@uni.edu,charlie@uni.edu,2022,https://example.com/paper2
```

### 2. Ensure Neo4j is running

```bash
cd ../../
make neo4j-up
make neo4j-init
```

### 3. Import your data

```bash
cd tools/graph_ingestion
go build -o graph-import
./graph-import -file=your_data.csv
```

## 📋 Command Line Options

```bash
./graph-import \
  -file=data.csv           # Required: CSV file path
  -uri=bolt://localhost:7687   # Neo4j connection
  -user=neo4j                  # Neo4j username
  -pass=conferencespace        # Neo4j password
  -batch=1000                  # Records per batch
  -clear                       # Clear existing data first
  -skip-header=true            # Skip CSV header row
```

## 💡 Common Usage Patterns

### Import new data (keep existing)
```bash
./graph-import -file=new_collaborations.csv
```

### Replace all data
```bash
./graph-import -file=collaborations.csv -clear
```

### Large dataset (10K+ records)
```bash
./graph-import -file=large_dataset.csv -batch=5000
```

### Custom Neo4j instance
```bash
./graph-import \
  -file=data.csv \
  -uri=bolt://production.example.com:7687 \
  -user=admin \
  -pass=secretpassword
```

## 🎯 Using Makefile (Recommended)

From backend directory:

```bash
# Import your data
make graph-import FILE=your_data.csv

# Clear and import
make graph-import FILE=your_data.csv CLEAR=true

# Custom batch size
make graph-import FILE=your_data.csv BATCH=5000

# Import example data
make graph-import-example
```

## 📊 CSV Format

**Required columns:**
- `author_1` - Email of first author
- `author_2` - Email of second author  
- `date` - Year (integer)

**Optional column:**
- `metadata` - Paper link, DOI, or other info

**Example:**
```csv
author_1,author_2,date,metadata
alice@uni.edu,bob@uni.edu,2021,https://arxiv.org/abs/2101.12345
bob@uni.edu,charlie@uni.edu,2022,DOI:10.1234/example
alice@uni.edu,dave@uni.edu,2020,
```

## ✅ Verification

### Check import success
```bash
# Via Makefile
make neo4j-status

# Or open Neo4j Browser
open http://localhost:7474
```

### Query imported data (Cypher)
```cypher
// Count authors
MATCH (a:Author) RETURN count(a);

// Count relationships
MATCH ()-[r:COAUTHORED]->() RETURN count(r);

// View sample
MATCH (a:Author)-[r:COAUTHORED]->(b:Author)
RETURN a.email, b.email, r.established_date, r.paper_link
LIMIT 10;
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | `make neo4j-up` |
| Authentication failed | Check `-user` and `-pass` |
| Invalid date error | Ensure date column has integer years (e.g., 2021) |
| Duplicate relationships | Use `-clear` flag |
| Out of memory | Reduce `-batch` size or increase Neo4j memory |

## 📈 Performance Guidelines

| Dataset Size | Batch Size | Expected Time |
|--------------|------------|---------------|
| < 1K records | 1000 (default) | < 1 second |
| 1K - 10K | 2000 | 2-10 seconds |
| 10K - 100K | 5000 | 10-60 seconds |
| 100K - 1M | 10000 | 1-10 minutes |

## 🎓 Example Workflow

```bash
# 1. Start services
cd /path/to/backend
make neo4j-up

# 2. Prepare data
cat > my_collaborations.csv << EOF
author_1,author_2,date,metadata
alice@uni.edu,bob@uni.edu,2021,Paper 1
bob@uni.edu,charlie@uni.edu,2022,Paper 2
EOF

# 3. Import
make graph-import FILE=my_collaborations.csv CLEAR=true

# 4. Verify
make neo4j-status

# 5. View in browser
open http://localhost:7474
```

## 📚 See Also

- [Full README](README.md) - Detailed documentation
- [Neo4j Setup](../../docs/NEO4J_SETUP.md) - Database setup guide
- [Neo4j Browser](http://localhost:7474) - Visual interface


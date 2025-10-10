# Database Migrations

## Quick Guide

### Run Migrations
```bash
make migrate-up       # Apply pending migrations
make migrate-version  # Check current version
```

### Create New Migration
```bash
make migrate-create NAME=your_migration_name
# Example: make migrate-create NAME=add_email_to_conferences
```

This creates two files:
- `000002_your_migration_name.up.sql` - Changes to apply
- `000002_your_migration_name.down.sql` - How to revert (optional)

## Migration Examples

### DDL (Schema Changes)

**Add Column:**
```sql
-- .up.sql
ALTER TABLE conferences ADD COLUMN email VARCHAR(255);
```

**Create Table:**
```sql
-- .up.sql
CREATE TABLE speakers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT
);
```

**Modify Column:**
```sql
-- .up.sql
ALTER TABLE conferences ALTER COLUMN capacity TYPE BIGINT;
```

### DML (Data Changes)

**Insert Seed Data:**
```sql
-- .up.sql
INSERT INTO conferences (name, location, start_date, end_date, capacity, status)
VALUES ('Tech Conf 2025', 'SF', '2025-06-01', '2025-06-03', 500, 'published');
```

**Update Data:**
```sql
-- .up.sql
UPDATE conferences SET status = 'published' WHERE start_date > NOW();
```

**Delete Data:**
```sql
-- .up.sql
DELETE FROM conferences WHERE status = 'cancelled';
```

## How It Works

1. **Migrations are numbered sequentially**: `000001`, `000002`, `000003`...
2. **Current version is stored** in `schema_migrations` table
3. **`migrate-up` runs only new migrations** (skips already applied ones)
4. **Safe to run multiple times** - it's idempotent

## Best Practices

✅ **One logical change per migration**
✅ **Use transactions** (PostgreSQL supports transactional DDL)
✅ **Test both up and down** migrations
✅ **Never modify existing migrations** (create new ones instead)
✅ **Add indexes in the same migration** as the table
✅ **Include seed data** if needed for the feature

## Example Workflow

```bash
# 1. Create migration
make migrate-create NAME=add_speakers_table

# 2. Edit the .up.sql file
# migrations/000002_add_speakers_table.up.sql

# 3. Apply migration
make migrate-up

# 4. Verify
make migrate-version
make db-schema
```

## Combined DDL + DML Example

```sql
-- migrations/000003_add_categories.up.sql

-- Create new table (DDL)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Add column to existing table (DDL)
ALTER TABLE conferences 
ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Insert seed data (DML)
INSERT INTO categories (name) VALUES 
    ('Technology'),
    ('Business'),
    ('Education');

-- Update existing records (DML)
UPDATE conferences 
SET category_id = (SELECT id FROM categories WHERE name = 'Technology')
WHERE name LIKE '%Tech%';

-- Add index (DDL)
CREATE INDEX idx_conferences_category ON conferences(category_id);
```

## Notes

- ✅ Both DDL and DML work in the same migration
- ✅ Changes are transactional (all or nothing)
- ✅ Version checkpoint updates automatically


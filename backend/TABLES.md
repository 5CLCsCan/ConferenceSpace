# Database Tables

## Overview

This system has 4 main tables with **no foreign key constraints** as requested.

## Tables

### 1. users
Stores user information.

| Column     | Type      | Description                  |
|------------|-----------|------------------------------|
| user_id    | SERIAL    | Primary key                  |
| email      | VARCHAR   | User email (unique, indexed) |
| first_name | VARCHAR   | User's first name            |
| last_name  | VARCHAR   | User's last name             |
| domain     | TEXT[]    | Array of domain strings      |
| created_at | TIMESTAMP | Creation timestamp           |
| updated_at | TIMESTAMP | Last update timestamp        |

**Indexes:**
- `idx_users_email` on `email`

### 2. conferences
Stores conference information.

| Column         | Type      | Description                    |
|----------------|-----------|--------------------------------|
| conference_id  | SERIAL    | Primary key                    |
| chair          | VARCHAR   | Conference chair name          |
| configurations | JSONB     | Configuration JSON object      |
| domain         | TEXT[]    | Array of domain strings        |
| created_at     | TIMESTAMP | Creation timestamp             |
| updated_at     | TIMESTAMP | Last update timestamp          |

### 3. conference_reviewers
Links users to conferences as reviewers.

| Column        | Type      | Description                 |
|---------------|-----------|----------------------------|
| id            | SERIAL    | Primary key                 |
| user_id       | INTEGER   | Reference to user           |
| conference_id | INTEGER   | Reference to conference     |
| domain        | TEXT[]    | Array of domain strings     |
| created_at    | TIMESTAMP | Creation timestamp          |
| updated_at    | TIMESTAMP | Last update timestamp       |

**Indexes:**
- `idx_conference_reviewers_user_id` on `user_id`
- `idx_conference_reviewers_conference_id` on `conference_id`

### 4. conference_submissions
Stores paper submissions for conferences.

| Column        | Type      | Description                   |
|---------------|-----------|-------------------------------|
| submission_id | SERIAL    | Primary key                   |
| author        | VARCHAR   | Author name                   |
| domain        | TEXT[]    | Array of domain strings       |
| status        | VARCHAR   | Submission status (indexed)   |
| link          | TEXT      | Link to submission            |
| information   | JSONB     | Additional info JSON object   |
| created_at    | TIMESTAMP | Creation timestamp            |
| updated_at    | TIMESTAMP | Last update timestamp         |

**Indexes:**
- `idx_conference_submissions_status` on `status`

## PostgreSQL Features Used

### Arrays (`TEXT[]`)
PostgreSQL native arrays for storing multiple strings:
```sql
-- Insert
INSERT INTO users (email, first_name, last_name, domain)
VALUES ('user@example.com', 'John', 'Doe', ARRAY['AI', 'ML', 'NLP']);

-- Query
SELECT * FROM users WHERE 'AI' = ANY(domain);
```

**In Go:**
```go
import "github.com/lib/pq"

type User struct {
    Domain pq.StringArray `json:"domain" db:"domain"`
}
```

### JSONB
PostgreSQL JSON storage with indexing support:
```sql
-- Insert
INSERT INTO conferences (chair, configurations)
VALUES ('Dr. Smith', '{"max_submissions": 100, "deadline": "2025-12-31"}'::jsonb);

-- Query
SELECT * FROM conferences 
WHERE configurations->>'deadline' = '2025-12-31';
```

**In Go:**
```go
import "encoding/json"

type Conference struct {
    Configurations json.RawMessage `json:"configurations" db:"configurations"`
}
```

## Run Migration

```bash
# Start database
make db-up

# Apply migration
make migrate-up

# Check version
make migrate-version

# View schema
make db-schema
```

## Example Queries

### Insert Data
```sql
-- Insert user
INSERT INTO users (email, first_name, last_name, domain)
VALUES ('john@example.com', 'John', 'Doe', ARRAY['Computer Science', 'AI']);

-- Insert conference
INSERT INTO conferences (chair, configurations, domain)
VALUES (
    'Dr. Jane Smith',
    '{"max_papers": 100, "review_deadline": "2025-06-01"}'::jsonb,
    ARRAY['AI', 'ML']
);

-- Insert reviewer
INSERT INTO conference_reviewers (user_id, conference_id, domain)
VALUES (1, 1, ARRAY['AI', 'Deep Learning']);

-- Insert submission
INSERT INTO conference_submissions (author, domain, status, link, information)
VALUES (
    'John Doe',
    ARRAY['AI', 'Computer Vision'],
    'pending',
    'https://example.com/paper.pdf',
    '{"title": "My Research Paper", "abstract": "..."}'::jsonb
);
```

### Query Arrays
```sql
-- Find users in AI domain
SELECT * FROM users WHERE 'AI' = ANY(domain);

-- Find all domains for a user
SELECT domain FROM users WHERE user_id = 1;

-- Count submissions by domain
SELECT unnest(domain) as domain, COUNT(*) 
FROM conference_submissions 
GROUP BY unnest(domain);
```

### Query JSONB
```sql
-- Find conferences with specific config
SELECT * FROM conferences 
WHERE configurations->>'max_papers' = '100';

-- Update JSONB field
UPDATE conferences 
SET configurations = configurations || '{"new_field": "value"}'::jsonb
WHERE conference_id = 1;
```

## Notes

- ✅ No foreign key constraints (as requested)
- ✅ Arrays use PostgreSQL native `TEXT[]` type
- ✅ JSON uses `JSONB` for better performance and indexing
- ✅ All tables have timestamps
- ✅ Strategic indexes for common queries


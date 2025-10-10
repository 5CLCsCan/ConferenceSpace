# Entity Package

This package contains **database entity models** - structs that map directly to database tables.

## Purpose

- Represent database schema in Go structs
- Use database tags (`db:"column_name"`)
- Handle database-specific types (e.g., `pq.StringArray`, `[]byte` for JSONB)
- No JSON tags (not for API responses)

## Entities

- `user.User` - users table
- `conference.Conference` - conferences table
- `reviewer.Reviewer` - conference_reviewers table
- `submission.Submission` - conference_submissions table

## Usage

```go
import "github.com/dcao/conferencespace/internal/entity/user"

// Used in storage layer
func (s *UserStorage) GetByID(ctx context.Context, id int64) (*user.User, error) {
    var entity user.User
    err := s.db.QueryRowContext(ctx, query, id).Scan(...)
    return &entity, err
}
```

## Important Notes

- **Do NOT expose entities directly in API responses**
- Use DTOs (from `internal/dto/`) for API layer
- Entities use database-specific types (pq.StringArray, []byte)
- DTOs use API-friendly types ([]string, map[string]interface{})


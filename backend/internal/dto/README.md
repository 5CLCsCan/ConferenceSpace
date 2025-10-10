# DTO Package

This package contains **Data Transfer Objects** - structs for API requests and responses.

## Purpose

- API request validation
- API response formatting
- Clean separation from database layer
- JSON serialization/deserialization

## DTOs

Each entity has three DTOs:

### Request DTOs
- `CreateRequest` - Creating new records
- `UpdateRequest` - Updating existing records

### Response DTOs
- `Response` - API responses with JSON tags

## Packages

- `user` - User API DTOs
- `conference` - Conference API DTOs  
- `reviewer` - Reviewer API DTOs
- `submission` - Submission API DTOs

## Usage

```go
import (
    "github.com/dcao/conferencespace/internal/dto/user"
)

// In controller
func (c *UserController) Create(ctx *gin.Context) {
    var req user.CreateRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    response, err := c.service.Create(ctx, &req)
    ctx.JSON(200, gin.H{"data": response})
}
```

## Key Differences from Entities

| Aspect | Entity | DTO |
|--------|--------|-----|
| Purpose | Database mapping | API communication |
| Tags | `db:"..."` | `json:"..."` `binding:"..."` |
| Arrays | `pq.StringArray` | `[]string` |
| JSONB | `[]byte` | `map[string]interface{}` |
| Usage | Storage layer | Controller layer |

## Example

**Entity (database):**
```go
type User struct {
    Domain pq.StringArray `db:"domain"`  // PostgreSQL array
}
```

**DTO (API):**
```go
type Response struct {
    Domain []string `json:"domain"`  // JSON array
}
```


package commons

// Submission minimal info needed for COI detection
type Submission struct {
	ID          int64
	AuthorEmail string
	CoAuthors   []string // From information JSONB
	Declared    []ConflictDeclaration
}

// ConflictDeclaration represents a user-declared conflict
type ConflictDeclaration struct {
	Email  string
	Reason string
}

// Reviewer information for COI detection
type Reviewer struct {
	ID        int64
	UserID    int64
	UserEmail string
}

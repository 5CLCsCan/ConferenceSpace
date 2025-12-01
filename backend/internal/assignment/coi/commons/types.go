package commons

import "time"

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

// ConflictDetail represents detailed information about a specific conflict
type ConflictDetail struct {
	SubmissionID     int64
	ReviewerID       int64
	AuthorEmail      string
	Type             string // co_author, same_organization, advisor_advisee, collaborator, declared, self_author, etc.
	Severity         string // high, medium, low, none
	Description      string
	Evidence         []string
	StartDate        *time.Time
	EndDate          *time.Time
}

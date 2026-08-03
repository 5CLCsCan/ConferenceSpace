package commons

// ConflictChecker reports whether a submission-reviewer pair must not be assigned.
type ConflictChecker interface {
	HasConflict(submissionID, reviewerID int64) bool
}

// AssignmentRecorder is implemented by checkers that track assignments made during matching.
type AssignmentRecorder interface {
	RecordAssignment(submissionID, reviewerID int64)
}

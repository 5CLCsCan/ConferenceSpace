package commons

// ConflictMap stores conflicts: submission_id -> set of conflicted reviewer_ids
type ConflictMap map[int64]map[int64]bool

// HasConflict checks if a submission has conflict with a reviewer
func (cm ConflictMap) HasConflict(submissionID, reviewerID int64) bool {
	if reviewers, exists := cm[submissionID]; exists {
		return reviewers[reviewerID]
	}
	return false
}

// AddConflict adds a conflict to the map
func (cm ConflictMap) AddConflict(submissionID, reviewerID int64) {
	if cm[submissionID] == nil {
		cm[submissionID] = make(map[int64]bool)
	}
	cm[submissionID][reviewerID] = true
}

// Merge combines multiple conflict maps
func (cm ConflictMap) Merge(other ConflictMap) {
	for subID, reviewers := range other {
		if cm[subID] == nil {
			cm[subID] = make(map[int64]bool)
		}
		for revID := range reviewers {
			cm[subID][revID] = true
		}
	}
}

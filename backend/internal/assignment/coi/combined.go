package coi

import (
	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/coi/reciprocal"
)

// CombinedChecker enforces static COI rules and reciprocal cross-review constraints.
type CombinedChecker struct {
	Static     commons.ConflictMap
	Reciprocal *reciprocal.Tracker
}

// HasConflict reports whether the pair violates static or reciprocal constraints.
func (c *CombinedChecker) HasConflict(submissionID, reviewerID int64) bool {
	if c.Static.HasConflict(submissionID, reviewerID) {
		return true
	}
	if c.Reciprocal != nil && c.Reciprocal.HasConflict(submissionID, reviewerID) {
		return true
	}
	return false
}

// RecordAssignment records an assignment for reciprocal tracking during matching.
func (c *CombinedChecker) RecordAssignment(submissionID, reviewerID int64) {
	if c.Reciprocal != nil {
		c.Reciprocal.RecordAssignment(submissionID, reviewerID)
	}
}

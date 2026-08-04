package reciprocal

import (
	"strings"

	"github.com/dcao/conferencespace/internal/dto"
)

// AssignmentEdge links a submission to its assigned reviewer.
type AssignmentEdge struct {
	SubmissionID int64
	ReviewerID   int64
}

// Tracker blocks reciprocal cross-review: if author A reviews a paper by B, B cannot review A's paper.
type Tracker struct {
	authorsBySubmission   map[int64]map[string]struct{}
	reviewersBySubmission map[int64][]string
	reviewerEmailByID     map[int64]string
}

// NormalizeEmail lowercases and trims an email for consistent COI comparisons.
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func normalizeEmail(email string) string {
	return NormalizeEmail(email)
}

func emailsFromMetadata(info *dto.SubmissionInformation) []string {
	if info == nil || info.Metadata == nil {
		return nil
	}
	authorsRaw, ok := info.Metadata["authors"]
	if !ok {
		return nil
	}
	authorsList, ok := authorsRaw.([]interface{})
	if !ok {
		return nil
	}
	emails := make([]string, 0, len(authorsList))
	for _, item := range authorsList {
		authorMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		email, ok := authorMap["email"].(string)
		if !ok || email == "" {
			continue
		}
		emails = append(emails, email)
	}
	return emails
}

// AuthorEmails returns normalized author emails for a submission.
func AuthorEmails(sub *dto.Submission) []string {
	if sub == nil {
		return nil
	}
	seen := make(map[string]struct{})
	add := func(email string) {
		normalized := normalizeEmail(email)
		if normalized == "" {
			return
		}
		seen[normalized] = struct{}{}
	}
	add(sub.Author)
	if sub.Information != nil {
		for _, coAuthor := range sub.Information.CoAuthors {
			add(coAuthor)
		}
		for _, email := range emailsFromMetadata(sub.Information) {
			add(email)
		}
	}
	emails := make([]string, 0, len(seen))
	for email := range seen {
		emails = append(emails, email)
	}
	return emails
}

// ReviewerIsAuthor reports whether reviewerEmail belongs to the submission's author set.
func ReviewerIsAuthor(sub *dto.Submission, reviewerEmail string) bool {
	normalizedReviewer := normalizeEmail(reviewerEmail)
	if normalizedReviewer == "" {
		return false
	}
	for _, authorEmail := range AuthorEmails(sub) {
		if authorEmail == normalizedReviewer {
			return true
		}
	}
	return false
}

// NewTracker builds reciprocal constraints from conference submissions, reviewers, and assignments.
func NewTracker(
	submissions []*dto.Submission,
	reviewers []*dto.Reviewer,
	assignments []AssignmentEdge,
) *Tracker {
	tracker := &Tracker{
		authorsBySubmission:   make(map[int64]map[string]struct{}, len(submissions)),
		reviewersBySubmission: make(map[int64][]string),
		reviewerEmailByID:     make(map[int64]string, len(reviewers)),
	}

	for _, reviewer := range reviewers {
		if reviewer == nil {
			continue
		}
		tracker.reviewerEmailByID[reviewer.ID] = normalizeEmail(reviewer.Email)
	}

	for _, sub := range submissions {
		if sub == nil {
			continue
		}
		authorSet := make(map[string]struct{})
		for _, email := range AuthorEmails(sub) {
			authorSet[email] = struct{}{}
		}
		tracker.authorsBySubmission[sub.ID] = authorSet
	}

	for _, edge := range assignments {
		tracker.RecordAssignment(edge.SubmissionID, edge.ReviewerID)
	}

	return tracker
}

func containsAuthor(authors map[string]struct{}, email string) bool {
	if authors == nil {
		return false
	}
	_, ok := authors[normalizeEmail(email)]
	return ok
}

// HasConflict reports whether assigning reviewerID to submissionID would create reciprocal cross-review.
func (t *Tracker) HasConflict(submissionID, reviewerID int64) bool {
	if t == nil {
		return false
	}

	reviewerEmail, ok := t.reviewerEmailByID[reviewerID]
	if !ok || reviewerEmail == "" {
		return false
	}

	authorsOfSubmission := t.authorsBySubmission[submissionID]

	for otherSubmissionID, authors := range t.authorsBySubmission {
		if otherSubmissionID == submissionID {
			continue
		}
		if !containsAuthor(authors, reviewerEmail) {
			continue
		}
		for _, assignedReviewerEmail := range t.reviewersBySubmission[otherSubmissionID] {
			if containsAuthor(authorsOfSubmission, assignedReviewerEmail) {
				return true
			}
		}
	}

	return false
}

// RecordAssignment tracks a reviewer assignment for reciprocal checks.
func (t *Tracker) RecordAssignment(submissionID, reviewerID int64) {
	if t == nil {
		return
	}
	reviewerEmail, ok := t.reviewerEmailByID[reviewerID]
	if !ok || reviewerEmail == "" {
		return
	}
	t.reviewersBySubmission[submissionID] = append(t.reviewersBySubmission[submissionID], reviewerEmail)
}

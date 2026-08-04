package assignment

import (
	"context"
	"fmt"
	"strings"

	assignmentCOI "github.com/dcao/conferencespace/internal/assignment/coi"
	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/coi/reciprocal"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"
	"github.com/dcao/conferencespace/internal/storage/reviewer"
	"github.com/dcao/conferencespace/internal/storage/submission"
)

func reviewerIsSubmissionAuthor(sub *dto.Submission, reviewerEmail string) bool {
	return reciprocal.ReviewerIsAuthor(sub, reviewerEmail)
}

func (c *Controller) evaluateAssignmentCOI(
	ctx context.Context,
	conferenceID int64,
	submissionID int64,
	reviewerID int64,
	extraAssignments []reciprocal.AssignmentEdge,
) ([]string, error) {
	submission, err := c.submissionStorage.GetByID(ctx, submissionID)
	if err != nil || submission == nil {
		return nil, fmt.Errorf("submission not found")
	}
	if submission.ConferenceID != conferenceID {
		return nil, fmt.Errorf("submission not found")
	}

	reviewer, err := c.reviewerStorage.GetByID(ctx, reviewerID)
	if err != nil || reviewer == nil {
		return nil, fmt.Errorf("reviewer not found")
	}

	reasons := make([]string, 0, 4)
	if reviewerIsSubmissionAuthor(submission, reviewer.Email) {
		reasons = append(reasons, "Self-author conflict: reviewer is an author of this submission")
	}

	if submission.Information != nil {
		for _, declared := range submission.Information.DeclaredConflicts {
			if strings.EqualFold(strings.TrimSpace(reviewer.Email), strings.TrimSpace(declared.Email)) {
				reason := "Declared conflict"
				if declared.Reason != "" {
					reason += ": " + declared.Reason
				}
				reasons = append(reasons, reason)
				break
			}
		}
	}

	submissions, reviewers, existingEdges, err := c.loadConferenceCOIContext(ctx, conferenceID, true)
	if err != nil {
		return nil, err
	}

	if c.assignmentService != nil {
		coiSvc := c.assignmentService.GetCOIService()
		if coiSvc != nil {
			conflicts, buildErr := coiSvc.BuildConflictMap(ctx, conferenceID, submissions, reviewers)
			if buildErr != nil {
				return nil, buildErr
			}
			if conflicts.HasConflict(submissionID, reviewerID) {
				if len(reasons) == 0 {
					reasons = append(reasons, "Conflict of interest detected")
				}
			}
		}
	}

	edges := append(existingEdges, extraAssignments...)
	tracker := reciprocal.NewTracker(submissions, reviewers, edges)
	if tracker.HasConflict(submissionID, reviewerID) {
		reasons = append(reasons, "Reciprocal cross-review conflict detected")
	}

	return reasons, nil
}

func (c *Controller) loadConferenceCOIContext(
	ctx context.Context,
	conferenceID int64,
	includeSuggested bool,
) ([]*dto.Submission, []*dto.Reviewer, []reciprocal.AssignmentEdge, error) {
	submissions, _, err := c.submissionStorage.List(ctx, &submission.QueryParams{
		ConferenceID: conferenceID,
		Limit:        1000,
	})
	if err != nil {
		return nil, nil, nil, err
	}

	reviewers, _, err := c.reviewerStorage.List(ctx, conferenceID, &reviewer.ListParams{
		Status: "accepted",
		Limit:  1000,
	})
	if err != nil {
		return nil, nil, nil, err
	}

	assignments, _, err := c.assignmentStorage.List(ctx, conferenceID, &assignmentStorage.ListParams{Limit: 10000})
	if err != nil {
		return nil, nil, nil, err
	}

	edges := make([]reciprocal.AssignmentEdge, 0, len(assignments))
	for _, item := range assignments {
		if item == nil {
			continue
		}
		switch item.Status {
		case model.AssignmentStatusDeclined:
			continue
		case model.AssignmentStatusSuggested:
			if !includeSuggested {
				continue
			}
		}
		edges = append(edges, reciprocal.AssignmentEdge{
			SubmissionID: item.SubmissionID,
			ReviewerID:   item.ReviewerID,
		})
	}

	return submissions, reviewers, edges, nil
}

func (c *Controller) validateSuggestionsForConfirm(
	ctx context.Context,
	conferenceID int64,
	suggestions []*dto.SuggestionGroup,
	assignmentIDs []int64,
) ([]string, error) {
	selected := make(map[int64]bool, len(assignmentIDs))
	for _, id := range assignmentIDs {
		selected[id] = true
	}
	confirmAll := len(assignmentIDs) == 0

	proposed := make([]reciprocal.AssignmentEdge, 0)
	for _, group := range suggestions {
		for _, reviewer := range group.Reviewers {
			if confirmAll || selected[reviewer.AssignmentID] {
				proposed = append(proposed, reciprocal.AssignmentEdge{
					SubmissionID: group.SubmissionID,
					ReviewerID:   reviewer.ReviewerID,
				})
			}
		}
	}

	submissions, reviewers, existingEdges, err := c.loadConferenceCOIContext(ctx, conferenceID, false)
	if err != nil {
		return nil, err
	}

	var staticConflicts commons.ConflictMap
	if c.assignmentService != nil && c.assignmentService.GetCOIService() != nil {
		staticConflicts, err = c.assignmentService.GetCOIService().BuildConflictMap(ctx, conferenceID, submissions, reviewers)
		if err != nil {
			return nil, err
		}
	}

	tracker := reciprocal.NewTracker(submissions, reviewers, existingEdges)
	checker := &assignmentCOI.CombinedChecker{
		Static:     staticConflicts,
		Reciprocal: tracker,
	}

	subByID := make(map[int64]*dto.Submission, len(submissions))
	for _, sub := range submissions {
		if sub != nil {
			subByID[sub.ID] = sub
		}
	}
	revByID := make(map[int64]*dto.Reviewer, len(reviewers))
	for _, rev := range reviewers {
		if rev != nil {
			revByID[rev.ID] = rev
		}
	}

	var blocked []string
	for _, edge := range proposed {
		sub := subByID[edge.SubmissionID]
		rev := revByID[edge.ReviewerID]
		if sub != nil && rev != nil && reciprocal.ReviewerIsAuthor(sub, rev.Email) {
			blocked = append(blocked, fmt.Sprintf(
				"assignment submission_id=%d reviewer_id=%d has a self-author conflict",
				edge.SubmissionID,
				edge.ReviewerID,
			))
			continue
		}
		if checker.HasConflict(edge.SubmissionID, edge.ReviewerID) {
			blocked = append(blocked, fmt.Sprintf("assignment submission_id=%d reviewer_id=%d has a COI conflict", edge.SubmissionID, edge.ReviewerID))
			continue
		}
		checker.RecordAssignment(edge.SubmissionID, edge.ReviewerID)
	}

	return blocked, nil
}

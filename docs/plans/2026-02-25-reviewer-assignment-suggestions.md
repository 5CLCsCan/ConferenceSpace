# Reviewer Assignment Suggestions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform auto-assignment from immediate execution to a suggestion-based workflow where chairs review, modify, and confirm assignments before they become active.

**Architecture:** Add `suggested` status to existing `paper_assignments` table. New endpoints for listing/confirming/modifying suggestions. Frontend page for chair to review and adjust assignments before confirming.

**Tech Stack:** Go 1.24, Gin, PostgreSQL, Next.js 15, React 18, TypeScript, Tailwind CSS v4, shadcn/ui

---

## Task 1: Database Migration - Add "suggested" Status

**Files:**
- Create: `backend/migrations/000025_add_suggested_assignment_status.up.sql`
- Create: `backend/migrations/000025_add_suggested_assignment_status.down.sql`

**Step 1: Create up migration**

```sql
-- backend/migrations/000025_add_suggested_assignment_status.up.sql
-- Add 'suggested' to assignment status constraint
-- First drop existing constraint if it exists
ALTER TABLE paper_assignments DROP CONSTRAINT IF EXISTS chk_status;

-- Add new constraint with 'suggested' status
ALTER TABLE paper_assignments
ADD CONSTRAINT chk_status CHECK (
  status IN ('suggested', 'pending', 'accepted', 'declined', 'completed')
);

-- Add index for filtering suggested assignments
CREATE INDEX IF NOT EXISTS idx_paper_assignments_suggested
ON paper_assignments(conference_id, status)
WHERE status = 'suggested';

COMMENT ON CONSTRAINT chk_status ON paper_assignments IS 'Assignment status: suggested (awaiting chair confirmation), pending (confirmed, awaiting reviewer), accepted, declined, completed';
```

**Step 2: Create down migration**

```sql
-- backend/migrations/000025_add_suggested_assignment_status.down.sql
-- Remove 'suggested' status - first delete any suggested assignments
DELETE FROM paper_assignments WHERE status = 'suggested';

-- Drop the constraint
ALTER TABLE paper_assignments DROP CONSTRAINT IF EXISTS chk_status;

-- Recreate without 'suggested'
ALTER TABLE paper_assignments
ADD CONSTRAINT chk_status CHECK (
  status IN ('pending', 'accepted', 'declined', 'completed')
);

-- Drop the index
DROP INDEX IF EXISTS idx_paper_assignments_suggested;
```

**Step 3: Run migration**

Run: `cd backend && make migrate-up`
Expected: Migration applied successfully

**Step 4: Commit**

```bash
git add backend/migrations/000025_add_suggested_assignment_status.up.sql backend/migrations/000025_add_suggested_assignment_status.down.sql
git commit -m "feat(db): add suggested status for assignment suggestions workflow"
```

---

## Task 2: Update Model Constants

**Files:**
- Modify: `backend/internal/model/assignment.go`

**Step 1: Add suggested status constant**

Add after line 47 in `backend/internal/model/assignment.go`:

```go
const (
	AssignmentStatusSuggested = "suggested"
	AssignmentStatusPending   = "pending"
	AssignmentStatusAccepted  = "accepted"
	AssignmentStatusDeclined  = "declined"
	AssignmentStatusCompleted = "completed"
)
```

**Step 2: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add backend/internal/model/assignment.go
git commit -m "feat(model): add AssignmentStatusSuggested constant"
```

---

## Task 3: Add Storage Methods for Suggestions

**Files:**
- Modify: `backend/internal/storage/assignment/assignment.go`

**Step 1: Add GetSuggestionsByConference method to interface**

Add to `StorageInterface` in `backend/internal/storage/assignment/assignment.go`:

```go
type StorageInterface interface {
	// ... existing methods ...
	GetSuggestionsByConference(ctx context.Context, conferenceID int64) ([]*dto.SuggestionGroup, int64, error)
	ConfirmSuggestions(ctx context.Context, conferenceID int64, assignmentIDs []int64) (int64, error)
	DeleteSuggestion(ctx context.Context, assignmentID int64) error
	DeleteSuggestionsByConference(ctx context.Context, conferenceID int64) error
}
```

**Step 2: Implement GetSuggestionsByConference**

Add to `backend/internal/storage/assignment/assignment.go`:

```go
// GetSuggestionsByConference retrieves all suggested assignments grouped by submission
func (s *Storage) GetSuggestionsByConference(ctx context.Context, conferenceID int64) ([]*dto.SuggestionGroup, int64, error) {
	query := `
		SELECT
			pa.id, pa.conference_id, pa.submission_id, pa.reviewer_id, pa.score, pa.status,
			pa.assigned_at, pa.created_at, pa.updated_at,
			cs.title as submission_title,
			r.email as reviewer_email
		FROM paper_assignments pa
		JOIN conference_submissions cs ON pa.submission_id = cs.submission_id
		JOIN conference_reviewers cr ON pa.reviewer_id = cr.id
		JOIN users r ON cr.user_id = r.user_id
		WHERE pa.conference_id = $1 AND pa.status = 'suggested'
		ORDER BY pa.submission_id, pa.score DESC
	`

	rows, err := s.db.QueryContext(ctx, query, conferenceID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query suggestions: %w", err)
	}
	defer rows.Close()

	// Group by submission
	groupMap := make(map[int64]*dto.SuggestionGroup)
	var totalSuggestions int64

	for rows.Next() {
		var (
			id, confID, subID, revID int64
			score                    float64
			status                   string
			assignedAt, createdAt, updatedAt time.Time
			submissionTitle, reviewerEmail   string
		)

		err := rows.Scan(&id, &confID, &subID, &revID, &score, &status,
			&assignedAt, &createdAt, &updatedAt, &submissionTitle, &reviewerEmail)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan suggestion: %w", err)
		}

		group, exists := groupMap[subID]
		if !exists {
			group = &dto.SuggestionGroup{
				SubmissionID:    subID,
				SubmissionTitle: submissionTitle,
				Reviewers:       []dto.SuggestedReviewer{},
			}
			groupMap[subID] = group
		}

		group.Reviewers = append(group.Reviewers, dto.SuggestedReviewer{
			AssignmentID:  id,
			ReviewerID:    revID,
			ReviewerEmail: reviewerEmail,
			Score:         score,
		})
		totalSuggestions++
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating suggestions: %w", err)
	}

	// Convert map to slice
	groups := make([]*dto.SuggestionGroup, 0, len(groupMap))
	for _, g := range groupMap {
		groups = append(groups, g)
	}

	return groups, totalSuggestions, nil
}
```

**Step 3: Implement ConfirmSuggestions**

Add to `backend/internal/storage/assignment/assignment.go`:

```go
// ConfirmSuggestions updates status from 'suggested' to 'pending' for given IDs
func (s *Storage) ConfirmSuggestions(ctx context.Context, conferenceID int64, assignmentIDs []int64) (int64, error) {
	if len(assignmentIDs) == 0 {
		// Confirm all suggestions for this conference
		query, args, err := s.qb.
			Update(model.AssignmentTableName).
			Set(model.ColStatus, model.AssignmentStatusPending).
			Set(model.ColUpdatedAt, sq.Expr("NOW()")).
			Where(sq.Eq{model.ColConferenceID: conferenceID}).
			Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
			ToSql()
		if err != nil {
			return 0, fmt.Errorf("failed to build update query: %w", err)
		}

		result, err := s.db.ExecContext(ctx, query, args...)
		if err != nil {
			return 0, fmt.Errorf("failed to confirm suggestions: %w", err)
		}

		return result.RowsAffected()
	}

	// Confirm specific IDs
	query, args, err := s.qb.
		Update(model.AssignmentTableName).
		Set(model.ColStatus, model.AssignmentStatusPending).
		Set(model.ColUpdatedAt, sq.Expr("NOW()")).
		Where(sq.Eq{model.ColConferenceID: conferenceID}).
		Where(sq.Eq{"id": assignmentIDs}).
		Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
		ToSql()
	if err != nil {
		return 0, fmt.Errorf("failed to build update query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to confirm suggestions: %w", err)
	}

	return result.RowsAffected()
}
```

**Step 4: Implement DeleteSuggestion and DeleteSuggestionsByConference**

Add to `backend/internal/storage/assignment/assignment.go`:

```go
// DeleteSuggestion deletes a single suggested assignment
func (s *Storage) DeleteSuggestion(ctx context.Context, assignmentID int64) error {
	query, args, err := s.qb.
		Delete(model.AssignmentTableName).
		Where(sq.Eq{"id": assignmentID}).
		Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete suggestion: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("suggestion not found or already confirmed")
	}

	return nil
}

// DeleteSuggestionsByConference deletes all suggested assignments for a conference
func (s *Storage) DeleteSuggestionsByConference(ctx context.Context, conferenceID int64) error {
	query, args, err := s.qb.
		Delete(model.AssignmentTableName).
		Where(sq.Eq{model.ColConferenceID: conferenceID}).
		Where(sq.Eq{model.ColStatus: model.AssignmentStatusSuggested}).
		ToSql()
	if err != nil {
		return fmt.Errorf("failed to build delete query: %w", err)
	}

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete suggestions: %w", err)
	}

	return nil
}
```

**Step 5: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add backend/internal/storage/assignment/assignment.go
git commit -m "feat(storage): add methods for assignment suggestions CRUD"
```

---

## Task 4: Add DTOs for Suggestions

**Files:**
- Modify: `backend/internal/dto/assignment.go`

**Step 1: Add suggestion DTOs**

Add to `backend/internal/dto/assignment.go`:

```go
// SuggestedReviewer represents a suggested reviewer for a paper
type SuggestedReviewer struct {
	AssignmentID  int64   `json:"assignment_id"`
	ReviewerID    int64   `json:"reviewer_id"`
	ReviewerEmail string  `json:"reviewer_email"`
	Score         float64 `json:"score"`
}

// SuggestionGroup represents suggestions grouped by submission
type SuggestionGroup struct {
	SubmissionID    int64               `json:"submission_id"`
	SubmissionTitle string              `json:"submission_title"`
	Reviewers       []SuggestedReviewer `json:"reviewers"`
}

// SuggestionsListResponse is the response for listing suggestions
type SuggestionsListResponse struct {
	Suggestions      []*SuggestionGroup `json:"suggestions"`
	TotalPapers      int                `json:"total_papers"`
	TotalSuggestions int64              `json:"total_suggestions"`
}

// ConfirmSuggestionsRequest is the request to confirm suggestions
type ConfirmSuggestionsRequest struct {
	AssignmentIDs []int64 `json:"assignment_ids,omitempty"`
}

// ConfirmSuggestionsResponse is the response for confirming suggestions
type ConfirmSuggestionsResponse struct {
	ConfirmedCount int64 `json:"confirmed_count"`
	Message        string `json:"message"`
}

// AddSuggestionRequest is the request to manually add a suggested reviewer
type AddSuggestionRequest struct {
	SubmissionID int64 `json:"submission_id" binding:"required"`
	ReviewerID   int64 `json:"reviewer_id" binding:"required"`
}

// AddSuggestionResponse is the response for adding a suggestion
type AddSuggestionResponse struct {
	Assignment *Assignment `json:"assignment"`
	COIWarning *COIWarning `json:"coi_warning,omitempty"`
}

// COIWarning represents a conflict of interest warning
type COIWarning struct {
	HasConflict bool     `json:"has_conflict"`
	Reasons     []string `json:"reasons"`
}

// COICheckResponse is the response for checking COI
type COICheckResponse struct {
	ReviewerID  int64    `json:"reviewer_id"`
	HasConflict bool     `json:"has_conflict"`
	Reasons     []string `json:"reasons"`
}
```

**Step 2: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add backend/internal/dto/assignment.go
git commit -m "feat(dto): add DTOs for assignment suggestions workflow"
```

---

## Task 5: Update Assignment Service for Suggestions

**Files:**
- Modify: `backend/internal/assignment/service.go`

**Step 1: Modify AutoAssign to create suggestions instead of pending assignments**

Update the `AutoAssign` method in `backend/internal/assignment/service.go`. Change the assignment status from `pending` to `suggested`:

```go
// In AutoAssign method, around line 218, change:
// status: "pending"
// to:
// status: model.AssignmentStatusSuggested

// Also update step 7 to NOT update submission status (remove the bulk status update block)
```

The key changes to `AutoAssign`:
1. Line ~224: Change `Status: "pending"` to `Status: model.AssignmentStatusSuggested`
2. Lines ~235-256: Remove or comment out the submission status update to "reviewing" (this happens on confirm now)

**Step 2: Add method to check if paper has confirmed assignments**

Add to `backend/internal/assignment/service.go`:

```go
// HasConfirmedAssignments checks if a submission has any non-suggested assignments
func (s *Service) HasConfirmedAssignments(ctx context.Context, submissionID int64) (bool, error) {
	assignments, _, err := s.assignmentStorage.List(ctx, 0, &assignment.ListParams{
		SubmissionID: submissionID,
	})
	if err != nil {
		return false, err
	}

	for _, a := range assignments {
		if a.Status != model.AssignmentStatusSuggested {
			return true, nil
		}
	}
	return false, nil
}
```

**Step 3: Update AutoAssign to skip papers with confirmed assignments**

In the `AutoAssign` method, after loading submissions (around line 150), filter out papers that already have confirmed assignments:

```go
// Filter submissions to only those without confirmed assignments
var unassignedSubmissions []*dto.Submission
for _, sub := range submissions {
	hasConfirmed, err := s.HasConfirmedAssignments(ctx, sub.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing assignments for submission %d: %w", sub.ID, err)
	}
	if !hasConfirmed {
		unassignedSubmissions = append(unassignedSubmissions, sub)
	}
}
submissions = unassignedSubmissions

if len(submissions) == 0 {
	return nil, fmt.Errorf("all submissions already have confirmed assignments")
}
```

**Step 4: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add backend/internal/assignment/service.go
git commit -m "feat(service): update auto-assign to create suggestions, skip papers with confirmed assignments"
```

---

## Task 6: Add Suggestions Controller Endpoints

**Files:**
- Modify: `backend/internal/controller/assignment/assignment.go`

**Step 1: Add GetSuggestions endpoint**

Add to `backend/internal/controller/assignment/assignment.go`:

```go
// GetSuggestions retrieves all suggested assignments for a conference
// @Summary Get assignment suggestions
// @Description Get all suggested reviewer assignments for a conference, grouped by paper
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Success 200 {object} dto.SuggestionsListResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions [get]
func (c *Controller) GetSuggestions(ginCtx *gin.Context) (*dto.SuggestionsListResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	suggestions, total, err := c.assignmentStorage.GetSuggestionsByConference(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get suggestions: %w", err)
	}

	return &dto.SuggestionsListResponse{
		Suggestions:      suggestions,
		TotalPapers:      len(suggestions),
		TotalSuggestions: total,
	}, nil
}
```

**Step 2: Add ConfirmSuggestions endpoint**

Add to `backend/internal/controller/assignment/assignment.go`:

```go
// ConfirmSuggestions confirms suggested assignments
// @Summary Confirm assignment suggestions
// @Description Confirm suggested assignments, changing status from 'suggested' to 'pending' and notifying reviewers
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Param request body dto.ConfirmSuggestionsRequest true "Assignment IDs to confirm (empty for all)"
// @Success 200 {object} dto.ConfirmSuggestionsResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions/confirm [post]
func (c *Controller) ConfirmSuggestions(ginCtx *gin.Context, req *dto.ConfirmSuggestionsRequest) (*dto.ConfirmSuggestionsResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	// Get suggestions before confirming (for notifications)
	suggestions, _, err := c.assignmentStorage.GetSuggestionsByConference(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get suggestions: %w", err)
	}

	// Confirm suggestions
	count, err := c.assignmentStorage.ConfirmSuggestions(ctx, conferenceID, req.AssignmentIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm suggestions: %w", err)
	}

	// Update submission status to "reviewing" for confirmed papers
	submissionIDs := make(map[int64]bool)
	for _, sg := range suggestions {
		submissionIDs[sg.SubmissionID] = true
	}
	submissionIDList := make([]int64, 0, len(submissionIDs))
	for id := range submissionIDs {
		submissionIDList = append(submissionIDList, id)
	}
	if len(submissionIDList) > 0 {
		err = c.submissionStorage.BulkUpdateStatus(ctx, submissionIDList, dto.StatusReviewing)
		if err != nil {
			fmt.Printf("Warning: failed to update submission status: %v\n", err)
		}
	}

	// Send notifications to reviewers (async)
	if c.notificationService != nil {
		go func() {
			bgCtx := context.Background()
			for _, sg := range suggestions {
				for _, rev := range sg.Reviewers {
					// Skip if not in the confirmed list (when specific IDs provided)
					if len(req.AssignmentIDs) > 0 {
						found := false
						for _, id := range req.AssignmentIDs {
							if id == rev.AssignmentID {
								found = true
								break
							}
						}
						if !found {
							continue
						}
					}

					err := c.notificationService.NotifyReviewAssigned(
						bgCtx,
						rev.ReviewerEmail,
						sg.SubmissionTitle,
						conferenceID,
						sg.SubmissionID,
						rev.AssignmentID,
					)
					if err != nil {
						fmt.Printf("Warning: failed to notify reviewer %s: %v\n", rev.ReviewerEmail, err)
					}
				}
			}
		}()
	}

	return &dto.ConfirmSuggestionsResponse{
		ConfirmedCount: count,
		Message:        fmt.Sprintf("Confirmed %d assignments", count),
	}, nil
}
```

**Step 3: Add DeleteSuggestion endpoint**

Add to `backend/internal/controller/assignment/assignment.go`:

```go
// DeleteSuggestion removes a single suggested assignment
// @Summary Delete a suggestion
// @Description Remove a single suggested reviewer assignment
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Param assignment_id path int true "Assignment ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions/{assignment_id} [delete]
func (c *Controller) DeleteSuggestion(ginCtx *gin.Context) error {
	ctx := ginCtx.Request.Context()

	assignmentIDStr := ginCtx.Param("assignment_id")
	assignmentID, err := strconv.ParseInt(assignmentIDStr, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid assignment_id")
	}

	err = c.assignmentStorage.DeleteSuggestion(ctx, assignmentID)
	if err != nil {
		return err
	}

	return nil
}
```

**Step 4: Add AddSuggestion endpoint with COI check**

Add to `backend/internal/controller/assignment/assignment.go`:

```go
// AddSuggestion manually adds a suggested reviewer with COI check
// @Summary Add a suggestion
// @Description Manually add a suggested reviewer to a paper with COI warning
// @Tags assignments
// @Accept json
// @Produce json
// @Param conference_id path int true "Conference ID"
// @Param request body dto.AddSuggestionRequest true "Reviewer and submission"
// @Success 200 {object} dto.AddSuggestionResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /v1/conferences/{conference_id}/assignments/suggestions [post]
func (c *Controller) AddSuggestion(ginCtx *gin.Context, req *dto.AddSuggestionRequest) (*dto.AddSuggestionResponse, error) {
	ctx := ginCtx.Request.Context()

	conferenceIDStr := ginCtx.Param("conference_id")
	conferenceID, err := strconv.ParseInt(conferenceIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid conference_id")
	}

	// Check for COI
	var coiWarning *dto.COIWarning
	if c.coiService != nil {
		// Get submission and reviewer for COI check
		submission, err := c.submissionStorage.GetByID(ctx, req.SubmissionID)
		if err != nil {
			return nil, fmt.Errorf("submission not found")
		}

		reviewer, err := c.reviewerStorage.GetByID(ctx, req.ReviewerID)
		if err != nil {
			return nil, fmt.Errorf("reviewer not found")
		}

		hasConflict, reasons := c.coiService.CheckConflict(ctx, conferenceID, submission, reviewer)
		if hasConflict {
			coiWarning = &dto.COIWarning{
				HasConflict: true,
				Reasons:     reasons,
			}
		}
	}

	// Create assignment with suggested status
	assignment := &dto.Assignment{
		SubmissionID: req.SubmissionID,
		ReviewerID:   req.ReviewerID,
		Status:       model.AssignmentStatusSuggested,
		Score:        0, // Manual suggestion has no computed score
	}

	created, err := c.assignmentStorage.Create(ctx, conferenceID, assignment)
	if err != nil {
		return nil, fmt.Errorf("failed to create suggestion: %w", err)
	}

	return &dto.AddSuggestionResponse{
		Assignment: created,
		COIWarning: coiWarning,
	}, nil
}
```

**Step 5: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add backend/internal/controller/assignment/assignment.go
git commit -m "feat(controller): add endpoints for suggestions CRUD and confirm"
```

---

## Task 7: Register Routes

**Files:**
- Modify: `backend/cmd/server/main.go`

**Step 1: Add routes for suggestions endpoints**

Find where assignment routes are registered and add:

```go
// Suggestions routes (chair only)
suggestions := v1.Group("/conferences/:conference_id/assignments/suggestions")
{
	suggestions.GET("", handler.HandleWithResponse(assignmentController.GetSuggestions))
	suggestions.POST("", handler.HandleWithBody(assignmentController.AddSuggestion))
	suggestions.POST("/confirm", handler.HandleWithBody(assignmentController.ConfirmSuggestions))
	suggestions.DELETE("/:assignment_id", handler.HandleWithoutBody(assignmentController.DeleteSuggestion))
}
```

**Step 2: Verify build**

Run: `cd backend && go build ./...`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "feat(routes): register suggestion endpoints"
```

---

## Task 8: Write API Tests for Suggestions

**Files:**
- Create: `backend/tests/api/assignment/suggestions_test.go`

**Step 1: Write test file**

```go
package assignment

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	conferenceTestClient "github.com/dcao/conferencespace/tests/api/conference"
	submissionTestClient "github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestSuggestionsWorkflow(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup: Create conference, reviewers, author, submissions
	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI", "ML"})
	reviewerToken1, reviewer1, _ := ctx.RegisterUniqueUser("reviewer1", "password123", "Reviewer", "One", []string{"AI"})
	_, reviewer2, _ := ctx.RegisterUniqueUser("reviewer2", "password123", "Reviewer", "Two", []string{"ML"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	// Create conference
	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Test Suggestions Conference",
		Acronym: testutils.UniqueString("TSC"),
		Chair:   chair.Email,
		Domain:  []string{"AI", "ML"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := createdConf.ID

	// Add reviewers
	_, err = ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer1.ID, "domain": []string{"AI"}},
			{"user_id": reviewer2.ID, "domain": []string{"ML"}},
		},
	}, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewers: %v", err)
	}

	// Accept reviewer invitations (simplified - in real test get IDs from response)
	// ... accept both reviewers ...

	// Create submission
	submissionClient := submissionTestClient.NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper for Suggestions",
		Abstract:     "Abstract about AI research",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"AI"},
		},
	}
	_, err = submissionClient.CreateSuccess(conferenceID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	t.Run("auto-assign creates suggestions not pending", func(t *testing.T) {
		// Trigger auto-assign
		autoAssignReq := map[string]interface{}{
			"min_reviewers_per_paper": 2,
			"max_reviewers_per_paper": 3,
		}
		resp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
		if err != nil {
			t.Fatalf("Auto-assign failed: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		// Get suggestions - should have entries
		suggestionsResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get suggestions: %v", err)
		}
		testutils.AssertStatusCode(t, suggestionsResp, http.StatusOK)

		var suggestionsData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp, &suggestionsData)

		if suggestionsData.Data.TotalSuggestions == 0 {
			t.Error("Expected suggestions to be created")
		}

		// Reviewer should NOT see assignments yet (status is suggested, not pending)
		papersResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer1.Email, conferenceID), nil, reviewerToken1)
		if err != nil {
			t.Fatalf("Failed to get reviewer papers: %v", err)
		}

		var papersData struct {
			Data struct {
				Papers []*dto.AssignedPaperResponse `json:"papers"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, papersResp, &papersData)

		if len(papersData.Data.Papers) > 0 {
			t.Error("Reviewer should not see suggested assignments until confirmed")
		}
	})

	t.Run("confirm suggestions makes them visible to reviewers", func(t *testing.T) {
		// Confirm all suggestions
		confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)
		if err != nil {
			t.Fatalf("Failed to confirm suggestions: %v", err)
		}
		testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

		var confirmData struct {
			Data *dto.ConfirmSuggestionsResponse `json:"data"`
		}
		testutils.DecodeResponse(t, confirmResp, &confirmData)

		if confirmData.Data.ConfirmedCount == 0 {
			t.Error("Expected some suggestions to be confirmed")
		}

		// Now reviewer should see assignments
		papersResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer1.Email, conferenceID), nil, reviewerToken1)
		if err != nil {
			t.Fatalf("Failed to get reviewer papers: %v", err)
		}

		var papersData struct {
			Data struct {
				Papers []*dto.AssignedPaperResponse `json:"papers"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, papersResp, &papersData)

		if len(papersData.Data.Papers) == 0 {
			t.Error("Reviewer should see assignments after confirmation")
		}
	})
}

func TestDeleteSuggestion(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup similar to above...
	// Create conference, reviewers, submission, run auto-assign

	t.Run("chair can delete a suggestion", func(t *testing.T) {
		// Get suggestions
		// Delete one
		// Verify it's gone
	})

	t.Run("cannot delete confirmed assignment", func(t *testing.T) {
		// Confirm suggestions
		// Try to delete - should fail
	})
}

func TestAddSuggestionWithCOI(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup with known COI relationship

	t.Run("adding reviewer with COI shows warning", func(t *testing.T) {
		// Add suggestion for reviewer with COI
		// Verify COI warning in response
	})
}
```

**Step 2: Run tests**

Run: `cd backend && make test-api`
Expected: All tests pass

**Step 3: Commit**

```bash
git add backend/tests/api/assignment/suggestions_test.go
git commit -m "test(api): add tests for suggestions workflow"
```

---

## Task 9: Frontend - Add API Client for Suggestions

**Files:**
- Create: `frontend/lib/api/suggestions.ts`

**Step 1: Write API client**

```typescript
import { apiFetch } from "./client"

export interface SuggestedReviewer {
  assignment_id: number
  reviewer_id: number
  reviewer_email: string
  score: number
}

export interface SuggestionGroup {
  submission_id: number
  submission_title: string
  reviewers: SuggestedReviewer[]
}

export interface SuggestionsListResponse {
  suggestions: SuggestionGroup[]
  total_papers: number
  total_suggestions: number
}

export interface ConfirmSuggestionsResponse {
  confirmed_count: number
  message: string
}

export interface COIWarning {
  has_conflict: boolean
  reasons: string[]
}

export interface AddSuggestionResponse {
  assignment: {
    id: number
    submission_id: number
    reviewer_id: number
    score: number
    status: string
  }
  coi_warning?: COIWarning
}

/**
 * Get all assignment suggestions for a conference
 */
export async function getSuggestions(
  conferenceId: string
): Promise<{ data: SuggestionsListResponse | null; error: string | null; status: number }> {
  try {
    const { data, response } = await apiFetch<{ data: SuggestionsListResponse }>(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions`
    )
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to fetch suggestions",
      status: error.status || 500,
    }
  }
}

/**
 * Confirm assignment suggestions
 */
export async function confirmSuggestions(
  conferenceId: string,
  assignmentIds?: number[]
): Promise<{ data: ConfirmSuggestionsResponse | null; error: string | null; status: number }> {
  try {
    const body = assignmentIds ? { assignment_ids: assignmentIds } : {}
    const { data, response } = await apiFetch<{ data: ConfirmSuggestionsResponse }>(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions/confirm`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    )
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to confirm suggestions",
      status: error.status || 500,
    }
  }
}

/**
 * Delete a single suggestion
 */
export async function deleteSuggestion(
  conferenceId: string,
  assignmentId: number
): Promise<{ error: string | null; status: number }> {
  try {
    const { response } = await apiFetch(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions/${assignmentId}`,
      { method: "DELETE" }
    )
    return { error: null, status: response.status }
  } catch (error: any) {
    return {
      error: error.message || "Failed to delete suggestion",
      status: error.status || 500,
    }
  }
}

/**
 * Manually add a suggestion with COI check
 */
export async function addSuggestion(
  conferenceId: string,
  submissionId: number,
  reviewerId: number
): Promise<{ data: AddSuggestionResponse | null; error: string | null; status: number }> {
  try {
    const { data, response } = await apiFetch<{ data: AddSuggestionResponse }>(
      `/api/v1/conferences/${conferenceId}/assignments/suggestions`,
      {
        method: "POST",
        body: JSON.stringify({ submission_id: submissionId, reviewer_id: reviewerId }),
      }
    )
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to add suggestion",
      status: error.status || 500,
    }
  }
}

/**
 * Trigger auto-assign to generate suggestions
 */
export async function generateSuggestions(
  conferenceId: string,
  config: {
    min_reviewers_per_paper: number
    max_reviewers_per_paper: number
    max_papers_per_reviewer?: number
    min_score_threshold?: number
  }
): Promise<{ data: any | null; error: string | null; status: number }> {
  try {
    const { data, response } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/submissions/auto-assign`,
      {
        method: "POST",
        body: JSON.stringify(config),
      }
    )
    return { data: data.data || null, error: null, status: response.status }
  } catch (error: any) {
    return {
      data: null,
      error: error.message || "Failed to generate suggestions",
      status: error.status || 500,
    }
  }
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/lib/api/suggestions.ts
git commit -m "feat(frontend): add API client for suggestions"
```

---

## Task 10: Frontend - Create Assignments Page Component

**Files:**
- Create: `frontend/components/chair/conference-detail/conference-assignments.tsx`

**Step 1: Write component**

```typescript
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  getSuggestions,
  confirmSuggestions,
  deleteSuggestion,
  generateSuggestions,
  type SuggestionGroup,
} from "@/lib/api/suggestions"

interface ConferenceAssignmentsProps {
  conferenceId: string
  className?: string
}

export function ConferenceAssignments({ conferenceId, className }: ConferenceAssignmentsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([])
  const [totalSuggestions, setTotalSuggestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Config form state
  const [minReviewers, setMinReviewers] = useState(3)
  const [maxReviewers, setMaxReviewers] = useState(3)
  const [maxPapersPerReviewer, setMaxPapersPerReviewer] = useState(5)
  const [minScoreThreshold, setMinScoreThreshold] = useState(0.3)

  const loadSuggestions = async () => {
    setLoading(true)
    setError(null)
    const response = await getSuggestions(conferenceId)
    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setSuggestions(response.data.suggestions || [])
      setTotalSuggestions(response.data.total_suggestions)
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadSuggestions()
  }, [conferenceId])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    const response = await generateSuggestions(conferenceId, {
      min_reviewers_per_paper: minReviewers,
      max_reviewers_per_paper: maxReviewers,
      max_papers_per_reviewer: maxPapersPerReviewer,
      min_score_threshold: minScoreThreshold,
    })
    if (response.error) {
      setError(response.error)
    } else {
      await loadSuggestions()
    }
    setGenerating(false)
  }

  const handleConfirmAll = async () => {
    setConfirming(true)
    setError(null)
    const response = await confirmSuggestions(conferenceId)
    if (response.error) {
      setError(response.error)
    } else {
      await loadSuggestions()
    }
    setConfirming(false)
  }

  const handleRemoveReviewer = async (assignmentId: number) => {
    const response = await deleteSuggestion(conferenceId, assignmentId)
    if (response.error) {
      setError(response.error)
    } else {
      await loadSuggestions()
    }
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-slate-400 text-xs", className)}>
        Loading...
      </div>
    )
  }

  // No suggestions - show config form
  if (suggestions.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Reviewer Assignment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate reviewer suggestions using the auto-assignment algorithm.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md">
          <h3 className="text-sm font-semibold text-[#1B3C53] dark:text-white mb-4">
            Auto-Assign Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Min reviewers per paper
              </label>
              <select
                value={minReviewers}
                onChange={(e) => setMinReviewers(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Max reviewers per paper
              </label>
              <select
                value={maxReviewers}
                onChange={(e) => setMaxReviewers(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Max papers per reviewer
              </label>
              <select
                value={maxPapersPerReviewer}
                onChange={(e) => setMaxPapersPerReviewer(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
              >
                {[3, 5, 7, 10, 15].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Min similarity score
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={minScoreThreshold}
                onChange={(e) => setMinScoreThreshold(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-[#1B3C53] hover:bg-[#2a4d66] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Suggestions"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Has suggestions - show review UI
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Reviewer Assignment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {suggestions.length} papers · {totalSuggestions} suggestions
          </p>
        </div>
        <button
          onClick={handleConfirmAll}
          disabled={confirming}
          className="bg-[#1B3C53] hover:bg-[#2a4d66] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {confirming ? "Confirming..." : `Confirm All (${totalSuggestions})`}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {suggestions.map((group) => (
          <div
            key={group.submission_id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className="mb-3">
              <div className="text-xs text-slate-400 font-mono">#{group.submission_id}</div>
              <div className="text-sm font-semibold text-[#1B3C53] dark:text-white">
                {group.submission_title}
              </div>
            </div>

            <div className="text-xs font-medium text-slate-500 mb-2">Assigned Reviewers:</div>
            <div className="space-y-2">
              {group.reviewers.map((reviewer) => (
                <div
                  key={reviewer.assignment_id}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {reviewer.reviewer_email}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Score: {reviewer.score.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveReviewer(reviewer.assignment_id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove reviewer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <button className="mt-3 text-xs text-[#1B3C53] dark:text-slate-300 hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                add
              </span>
              Add Reviewer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Export from index**

Add to `frontend/components/chair/conference-detail/index.ts`:

```typescript
export { ConferenceAssignments } from "./conference-assignments"
```

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/components/chair/conference-detail/conference-assignments.tsx frontend/components/chair/conference-detail/index.ts
git commit -m "feat(frontend): add ConferenceAssignments component for suggestions review"
```

---

## Task 11: Frontend - Add Tab to Conference Detail Page

**Files:**
- Modify: `frontend/components/chair/conference-detail/types.ts`
- Modify: `frontend/components/chair/conference-detail/conference-detail-header.tsx`
- Modify: `frontend/app/role/chair/conferences/[conferenceId]/page.tsx`

**Step 1: Add "assignments" tab ID to types**

In `frontend/components/chair/conference-detail/types.ts`, add `"assignments"` to the `TabId` type.

**Step 2: Add tab to header**

In `frontend/components/chair/conference-detail/conference-detail-header.tsx`, add the "Assignments" tab to the tabs array.

**Step 3: Add tab content rendering**

In `frontend/app/role/chair/conferences/[conferenceId]/page.tsx`:

1. Import `ConferenceAssignments`
2. Add case for `"assignments"` in `renderTabContent()`

**Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/components/chair/conference-detail/types.ts frontend/components/chair/conference-detail/conference-detail-header.tsx frontend/app/role/chair/conferences/[conferenceId]/page.tsx
git commit -m "feat(frontend): add Assignments tab to conference detail page"
```

---

## Task 12: Frontend - Update Chair Actions Panel

**Files:**
- Modify: `frontend/components/chair/conference-detail/chair-actions-panel.tsx`

**Step 1: Make "Assign Reviewers" button navigate to assignments tab**

Update the default actions to include an onClick handler or change the action to work with the tab system.

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/components/chair/conference-detail/chair-actions-panel.tsx
git commit -m "feat(frontend): connect Assign Reviewers action to assignments tab"
```

---

## Task 13: Update Routes File

**Files:**
- Modify: `frontend/lib/routes.ts`

**Step 1: Add assignments route**

```typescript
CHAIR: {
  // ... existing routes ...
  CONFERENCE_ASSIGNMENTS: (id: string) => `/role/chair/conferences/${id}?tab=assignments`,
}
```

**Step 2: Commit**

```bash
git add frontend/lib/routes.ts
git commit -m "feat(routes): add chair assignments route"
```

---

## Task 14: Integration Testing

**Step 1: Start backend**

Run: `cd backend && make dev`
Expected: Server starts on port 8080

**Step 2: Start frontend**

Run: `cd frontend && npm run dev`
Expected: Dev server starts on port 3000

**Step 3: Manual testing checklist**

1. Log in as chair
2. Navigate to a conference
3. Click "Assignments" tab (or "Assign Reviewers" action)
4. Configure and click "Generate Suggestions"
5. Verify suggestions appear grouped by paper
6. Remove a reviewer from a suggestion
7. Verify it's removed
8. Click "Confirm All"
9. Log in as a reviewer
10. Verify assignments now appear in reviewer dashboard

**Step 4: Run API tests**

Run: `cd backend && make test-api`
Expected: All tests pass

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete reviewer assignment suggestions workflow"
```

---

## Summary

This plan implements:

1. **Backend:**
   - Migration adding `suggested` status
   - Storage methods for suggestion CRUD
   - DTOs for suggestion responses
   - Service updates to create suggestions instead of pending
   - Controller endpoints for list/confirm/add/delete
   - API tests

2. **Frontend:**
   - API client for suggestions
   - ConferenceAssignments component with config form and review UI
   - Integration into conference detail page as new tab
   - Updated Chair Actions Panel

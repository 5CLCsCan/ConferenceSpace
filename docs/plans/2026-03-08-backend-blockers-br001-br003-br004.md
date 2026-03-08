# Backend Blockers (BR-001, BR-004, BR-003) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the three remaining backend-blocked API endpoints that are preventing frontend rebuttal, chair analytics, and camera-ready upload features from going live.

**Architecture:** Each item follows the existing clean-architecture pattern: migration → model constants → DTO → storage interface + impl → controller method → route registration. BR-001 needs no migration. BR-004 adds rebuttal columns to `paper_assignments` and `conference_submissions`. BR-003 adds camera-ready columns to `conference_submissions`.

**Tech Stack:** Go 1.24, Gin, PostgreSQL, squirrel query builder (`sq`), `golang-migrate`, existing `LocalFileStorage` for file I/O.

---

## Task 1: BR-001 — Conference Stats DTO

**Files:**
- Modify: `backend/internal/dto/conference.go`

**Step 1: Add stats DTOs to `conference.go`**

Append at the bottom of the file:

```go
// ConferenceStatsRequest is the URI binding for GET /conferences/:conference_id/stats
type ConferenceStatsRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
}

// ConferenceSubmissionStats holds submission counts broken down by status.
type ConferenceSubmissionStats struct {
	Total    int `json:"total"`
	Draft    int `json:"draft"`
	Submitted int `json:"submitted"`
	Accepted int `json:"accepted"`
	Rejected int `json:"rejected"`
}

// ConferenceReviewStats holds review/assignment progress counts.
type ConferenceReviewStats struct {
	TotalAssigned int `json:"total_assigned"`
	Completed     int `json:"completed"`
	Pending       int `json:"pending"`
}

// ConferenceTrackStats holds per-track submission counts.
type ConferenceTrackStats struct {
	Name            string `json:"name"`
	SubmissionCount int    `json:"submission_count"`
	AcceptedCount   int    `json:"accepted_count"`
}

// ConferenceStatsResponse is the response for GET /conferences/:conference_id/stats
type ConferenceStatsResponse struct {
	Submissions ConferenceSubmissionStats `json:"submissions"`
	Reviews     ConferenceReviewStats     `json:"reviews"`
	Tracks      []ConferenceTrackStats    `json:"tracks"`
}
```

**Step 2: Commit**

```bash
git add backend/internal/dto/conference.go
git commit -m "feat(dto): add ConferenceStatsResponse types for BR-001"
```

---

## Task 2: BR-001 — Conference Stats Storage

**Files:**
- Modify: `backend/internal/storage/conference/conference.go`

**Step 1: Add `GetStats` to the `StorageInterface`**

In `conference.go`, find the `StorageInterface` interface and add:

```go
GetStats(ctx context.Context, conferenceID int64) (*dto.ConferenceStatsResponse, error)
```

**Step 2: Implement `GetStats` on `*Storage`**

Append to the end of `conference.go`:

```go
// GetStats returns aggregated statistics for a conference.
func (s *Storage) GetStats(ctx context.Context, conferenceID int64) (*dto.ConferenceStatsResponse, error) {
	// --- submission counts by status ---
	subRows, err := s.db.QueryContext(ctx, `
		SELECT status, COUNT(*) AS cnt
		FROM conference_submissions
		WHERE conference_id = $1
		GROUP BY status
	`, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("query submission stats: %w", err)
	}
	defer subRows.Close()

	var subStats dto.ConferenceSubmissionStats
	for subRows.Next() {
		var status string
		var cnt int
		if err := subRows.Scan(&status, &cnt); err != nil {
			return nil, err
		}
		subStats.Total += cnt
		switch status {
		case "draft":
			subStats.Draft = cnt
		case "submitted", "reviewing":
			subStats.Submitted += cnt
		case "accepted":
			subStats.Accepted = cnt
		case "rejected":
			subStats.Rejected = cnt
		}
	}

	// --- review/assignment progress ---
	var reviewStats dto.ConferenceReviewStats
	err = s.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status = 'completed') AS completed
		FROM paper_assignments
		WHERE conference_id = $1
	`, conferenceID).Scan(&reviewStats.TotalAssigned, &reviewStats.Completed)
	if err != nil {
		return nil, fmt.Errorf("query review stats: %w", err)
	}
	reviewStats.Pending = reviewStats.TotalAssigned - reviewStats.Completed

	// --- per-track breakdown ---
	trackRows, err := s.db.QueryContext(ctx, `
		SELECT
			COALESCE(track, 'Untracked') AS track,
			COUNT(*) AS submission_count,
			COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count
		FROM conference_submissions
		WHERE conference_id = $1
		GROUP BY track
		ORDER BY track
	`, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("query track stats: %w", err)
	}
	defer trackRows.Close()

	var tracks []dto.ConferenceTrackStats
	for trackRows.Next() {
		var t dto.ConferenceTrackStats
		if err := trackRows.Scan(&t.Name, &t.SubmissionCount, &t.AcceptedCount); err != nil {
			return nil, err
		}
		tracks = append(tracks, t)
	}
	if tracks == nil {
		tracks = []dto.ConferenceTrackStats{}
	}

	return &dto.ConferenceStatsResponse{
		Submissions: subStats,
		Reviews:     reviewStats,
		Tracks:      tracks,
	}, nil
}
```

**Step 3: Commit**

```bash
git add backend/internal/storage/conference/conference.go
git commit -m "feat(storage): implement GetStats for conference BR-001"
```

---

## Task 3: BR-001 — Conference Stats Controller + Route

**Files:**
- Modify: `backend/internal/controller/conference/conference.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Add `GetStats` controller method**

Append to `backend/internal/controller/conference/conference.go`:

```go
// GetStats godoc
// @Summary      Get conference statistics
// @Description  Returns aggregated submission, review, and track statistics for a conference (chair only)
// @Tags         conferences
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.ConferenceStatsResponse
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/stats [get]
func (c *Controller) GetStats(ginCtx *gin.Context, req *dto.ConferenceStatsRequest) (*dto.ConferenceStatsResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	if !utils.IsUserChairOrCoChair(ctx, c.roleStorage, req.ConferenceID, userEmail) {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only chair or co-chair can view conference stats")
	}

	stats, err := c.conferenceStorage.GetStats(ctx, req.ConferenceID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return stats, nil
}
```

**Step 2: Register the route in `main.go`**

Find the conferences route group (around line 242–248). After `conferences.PUT("/:conference_id/status", ...)` add:

```go
conferences.GET("/:conference_id/stats", handler.HandleRequestWithURI(ctrl.Conference.GetStats))
```

**Step 3: Commit**

```bash
git add backend/internal/controller/conference/conference.go backend/cmd/server/main.go
git commit -m "feat(controller): add GetStats endpoint for conference BR-001"
```

---

## Task 4: BR-004 — Rebuttal DB Migration

**Files:**
- Create: `backend/migrations/000029_add_rebuttal_columns.up.sql`
- Create: `backend/migrations/000029_add_rebuttal_columns.down.sql`

**Step 1: Create the up migration**

```sql
-- 000029_add_rebuttal_columns.up.sql

-- Submission-level: phase + general response
ALTER TABLE conference_submissions
    ADD COLUMN IF NOT EXISTS rebuttal_phase VARCHAR(50) NOT NULL DEFAULT 'awaiting',
    ADD COLUMN IF NOT EXISTS rebuttal_general_response TEXT;

-- Assignment-level: per-reviewer response + acknowledgment
ALTER TABLE paper_assignments
    ADD COLUMN IF NOT EXISTS rebuttal_response JSONB,
    ADD COLUMN IF NOT EXISTS rebuttal_status VARCHAR(50) NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS rebuttal_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rebuttal_acknowledged_at TIMESTAMPTZ;
```

**Step 2: Create the down migration**

```sql
-- 000029_add_rebuttal_columns.down.sql

ALTER TABLE paper_assignments
    DROP COLUMN IF EXISTS rebuttal_acknowledged_at,
    DROP COLUMN IF EXISTS rebuttal_submitted_at,
    DROP COLUMN IF EXISTS rebuttal_status,
    DROP COLUMN IF EXISTS rebuttal_response;

ALTER TABLE conference_submissions
    DROP COLUMN IF EXISTS rebuttal_general_response,
    DROP COLUMN IF EXISTS rebuttal_phase;
```

**Step 3: Run the migration**

```bash
cd backend && make migrate-up
```

Expected: migration applies without errors.

**Step 4: Commit**

```bash
git add backend/migrations/000029_add_rebuttal_columns.up.sql backend/migrations/000029_add_rebuttal_columns.down.sql
git commit -m "feat(migration): add rebuttal columns to submissions and assignments BR-004"
```

---

## Task 5: BR-004 — Rebuttal Model Constants + DTOs

**Files:**
- Modify: `backend/internal/model/submission.go`
- Modify: `backend/internal/model/assignment.go`
- Modify: `backend/internal/dto/assignment.go`

**Step 1: Add rebuttal phase constants to `submission.go`**

Append after the existing status constants:

```go
// Rebuttal phase constants
const (
	RebuttalPhaseAwaiting   = "awaiting"
	RebuttalPhaseSubmitted  = "submitted"
	RebuttalPhaseDiscussion = "discussion"
	RebuttalPhaseFinalized  = "finalized"
)
```

Also add the new columns to the `Submission` struct:

```go
RebuttalPhase           string  `db:"rebuttal_phase"`
RebuttalGeneralResponse *string `db:"rebuttal_general_response"`
```

And expose them in `ToDTO()` — add matching fields to `dto.Submission` (see step 2).

**Step 2: Add rebuttal status constants to `assignment.go`**

Append after existing review status constants:

```go
// Rebuttal status constants (per assignment)
const (
	RebuttalStatusNone         = "none"
	RebuttalStatusSubmitted    = "submitted"
	RebuttalStatusAcknowledged = "acknowledged"
)
```

Also add new fields to the `Assignment` struct:

```go
RebuttalResponse        json.RawMessage `db:"rebuttal_response"`
RebuttalStatus          string          `db:"rebuttal_status"`
RebuttalSubmittedAt     *time.Time      `db:"rebuttal_submitted_at"`
RebuttalAcknowledgedAt  *time.Time      `db:"rebuttal_acknowledged_at"`
```

**Step 3: Add rebuttal DTOs to `assignment.go`**

Append at the bottom of `backend/internal/dto/assignment.go`:

```go
// ================== Rebuttal DTOs ==================

// RebuttalPerReviewerResponse is the author's structured response to one reviewer's points.
// Stored as JSONB in paper_assignments.rebuttal_response.
type RebuttalPerReviewerResponse struct {
	Points []RebuttalPointResponse `json:"points"`
}

// RebuttalPointResponse is the author's response to a single review point.
type RebuttalPointResponse struct {
	PointID        string `json:"point_id"`
	AuthorResponse string `json:"author_response"`
}

// SubmitRebuttalRequest is the body for PUT /conferences/:id/submissions/:id/rebuttal
type SubmitRebuttalRequest struct {
	ConferenceID   int64  `uri:"conference_id" binding:"required"`
	SubmissionID   int64  `uri:"submission_id" binding:"required"`
	GeneralResponse string `json:"general_response" binding:"required"`
	// PerReviewer maps assignment_id (as string) -> per-reviewer response
	PerReviewer map[string]RebuttalPerReviewerResponse `json:"per_reviewer"`
}

// AcknowledgeRebuttalRequest is the URI for PUT /conferences/:id/assignments/:id/rebuttal/acknowledge
type AcknowledgeRebuttalRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	AssignmentID int64 `uri:"assignment_id" binding:"required"`
}

// RebuttalStatusResponse is returned after submit or acknowledge actions.
type RebuttalStatusResponse struct {
	RebuttalPhase          string     `json:"rebuttal_phase"`
	RebuttalStatus         string     `json:"rebuttal_status"`
	RebuttalSubmittedAt    *time.Time `json:"rebuttal_submitted_at,omitempty"`
	RebuttalAcknowledgedAt *time.Time `json:"rebuttal_acknowledged_at,omitempty"`
}
```

Also add rebuttal fields to `dto.Submission` in `submission.go`:

```go
RebuttalPhase           string  `json:"rebuttal_phase,omitempty"`
RebuttalGeneralResponse *string `json:"rebuttal_general_response,omitempty"`
```

**Step 4: Commit**

```bash
git add backend/internal/model/submission.go backend/internal/model/assignment.go backend/internal/dto/assignment.go backend/internal/dto/submission.go
git commit -m "feat(model+dto): add rebuttal types and constants for BR-004"
```

---

## Task 6: BR-004 — Rebuttal Storage Methods

**Files:**
- Modify: `backend/internal/storage/submission/submission.go`
- Modify: `backend/internal/storage/assignment/assignment.go`

**Step 1: Add `SubmitRebuttal` to submission storage interface and impl**

In `backend/internal/storage/submission/submission.go`, add to `StorageInterface`:

```go
SubmitRebuttal(ctx context.Context, submissionID int64, generalResponse string) error
```

Implement:

```go
func (s *Storage) SubmitRebuttal(ctx context.Context, submissionID int64, generalResponse string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE conference_submissions
		SET rebuttal_phase = 'submitted',
		    rebuttal_general_response = $1,
		    updated_at = NOW()
		WHERE submission_id = $2
	`, generalResponse, submissionID)
	return err
}
```

**Step 2: Add `SaveRebuttalResponse` and `AcknowledgeRebuttal` to assignment storage**

In `backend/internal/storage/assignment/assignment.go`, add to `StorageInterface`:

```go
SaveRebuttalResponse(ctx context.Context, assignmentID int64, responseJSON []byte) error
AcknowledgeRebuttal(ctx context.Context, assignmentID int64) (*dto.Assignment, error)
```

Implement `SaveRebuttalResponse`:

```go
func (s *Storage) SaveRebuttalResponse(ctx context.Context, assignmentID int64, responseJSON []byte) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE paper_assignments
		SET rebuttal_response = $1,
		    rebuttal_status = 'submitted',
		    rebuttal_submitted_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
	`, responseJSON, assignmentID)
	return err
}
```

Implement `AcknowledgeRebuttal` (idempotent — only updates if not already acknowledged):

```go
func (s *Storage) AcknowledgeRebuttal(ctx context.Context, assignmentID int64) (*dto.Assignment, error) {
	row := s.db.QueryRowContext(ctx, `
		UPDATE paper_assignments
		SET rebuttal_status = 'acknowledged',
		    rebuttal_acknowledged_at = COALESCE(rebuttal_acknowledged_at, NOW()),
		    updated_at = NOW()
		WHERE id = $1
		RETURNING id, conference_id, submission_id, reviewer_id, score, status,
		          assigned_at, completed_at, review_status, review_score, review_data,
		          review_submitted_at, rebuttal_response, rebuttal_status,
		          rebuttal_submitted_at, rebuttal_acknowledged_at, created_at, updated_at
	`, assignmentID)

	var a model.Assignment
	err := row.Scan(
		&a.ID, &a.ConferenceID, &a.SubmissionID, &a.ReviewerID, &a.Score, &a.Status,
		&a.AssignedAt, &a.CompletedAt, &a.ReviewStatus, &a.ReviewScore, &a.ReviewData,
		&a.ReviewSubmittedAt, &a.RebuttalResponse, &a.RebuttalStatus,
		&a.RebuttalSubmittedAt, &a.RebuttalAcknowledgedAt, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("acknowledge rebuttal: %w", err)
	}
	return a.ToDTO(), nil
}
```

> Note: `model.Assignment.ToDTO()` must be updated to include the new rebuttal fields. Add them to `Assignment.ToDTO()` in `backend/internal/model/assignment.go`.

**Step 3: Commit**

```bash
git add backend/internal/storage/submission/submission.go backend/internal/storage/assignment/assignment.go backend/internal/model/assignment.go
git commit -m "feat(storage): add rebuttal submit and acknowledge methods BR-004"
```

---

## Task 7: BR-004 — Rebuttal Controller + Routes

**Files:**
- Modify: `backend/internal/controller/submission/submission.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Add `SubmitRebuttal` controller method to submission controller**

The submission controller already has `submissionStorage` and `fileStorage`. Append:

```go
// SubmitRebuttal godoc
// @Summary      Submit author rebuttal
// @Description  Author submits a rebuttal (general response + per-reviewer responses) for a submission
// @Tags         submissions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Param        request body dto.SubmitRebuttalRequest true "Rebuttal content"
// @Success      200 {object} dto.RebuttalStatusResponse
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/rebuttal [put]
func (c *Controller) SubmitRebuttal(ginCtx *gin.Context, req *dto.SubmitRebuttalRequest) (*dto.RebuttalStatusResponse, error) {
	ctx := ginCtx.Request.Context()

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	sub, err := c.submissionStorage.GetByID(ctx, req.SubmissionID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	if sub.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found in this conference")
	}

	if sub.Author != userEmail {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "only the submission author can submit a rebuttal")
	}

	// Persist general response on submission
	if err := c.submissionStorage.SubmitRebuttal(ctx, req.SubmissionID, req.GeneralResponse); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	// Persist per-reviewer responses on assignments
	now := time.Now()
	for assignmentIDStr, perReviewer := range req.PerReviewer {
		assignmentID, parseErr := strconv.ParseInt(assignmentIDStr, 10, 64)
		if parseErr != nil {
			continue // skip malformed keys
		}
		responseJSON, marshalErr := json.Marshal(perReviewer)
		if marshalErr != nil {
			continue
		}
		_ = c.assignmentStorage.SaveRebuttalResponse(ctx, assignmentID, responseJSON)
	}

	return &dto.RebuttalStatusResponse{
		RebuttalPhase:       "submitted",
		RebuttalStatus:      "submitted",
		RebuttalSubmittedAt: &now,
	}, nil
}
```

> The submission controller needs `assignmentStorage` added. In the `Controller` struct, add:
> ```go
> assignmentStorage assignmentStorage.StorageInterface
> ```
> Import: `assignmentStorage "github.com/dcao/conferencespace/internal/storage/assignment"`
> Wire in `New(...)` and `NewWithNotifications(...)`:
> ```go
> assignmentStorage: store.Assignment,
> ```

**Step 2: Add `AcknowledgeRebuttal` to the assignment controller**

Open `backend/internal/controller/reviewer/reviewer.go` (or create a new `assignment` controller if one exists). Check if there is already an assignment controller:

```bash
ls backend/internal/controller/
```

If there is an `assignment` controller folder, add the method there. Otherwise, add it to the reviewer controller. Append:

```go
// AcknowledgeRebuttal godoc
// @Summary      Reviewer acknowledges author rebuttal
// @Description  Reviewer marks that they have read the author's rebuttal for their assignment (idempotent)
// @Tags         assignments
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Success      200 {object} dto.RebuttalStatusResponse
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/rebuttal/acknowledge [put]
func (c *Controller) AcknowledgeRebuttal(ginCtx *gin.Context, req *dto.AcknowledgeRebuttalRequest) (*dto.RebuttalStatusResponse, error) {
	ctx := ginCtx.Request.Context()

	_, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	assignment, err := c.assignmentStorage.AcknowledgeRebuttal(ctx, req.AssignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &dto.RebuttalStatusResponse{
		RebuttalPhase:          "submitted",
		RebuttalStatus:         assignment.RebuttalStatus,
		RebuttalAcknowledgedAt: assignment.RebuttalAcknowledgedAt,
	}, nil
}
```

> The reviewer controller needs `assignmentStorage` added to its struct (same pattern as submission controller above).

**Step 3: Register routes in `main.go`**

In the submissions group, after the existing `submissions.PUT("/:submission_id/status", ...)` line:

```go
submissions.PUT("/:submission_id/rebuttal", handler.HandleRequestWithAll(ctrl.Submission.SubmitRebuttal))
```

In the assignments group — check if one exists. If not, add inside the `conferencesProtected` group:

```go
assignments := conferencesProtected.Group("/:conference_id/assignments")
{
    assignments.PUT("/:assignment_id/rebuttal/acknowledge", handler.HandleRequestWithURI(ctrl.Reviewer.AcknowledgeRebuttal))
}
```

**Step 4: Commit**

```bash
git add backend/internal/controller/submission/submission.go backend/internal/controller/reviewer/reviewer.go backend/cmd/server/main.go
git commit -m "feat(controller): add SubmitRebuttal and AcknowledgeRebuttal endpoints BR-004"
```

---

## Task 8: BR-003 — Camera-Ready DB Migration

**Files:**
- Create: `backend/migrations/000030_add_camera_ready_columns.up.sql`
- Create: `backend/migrations/000030_add_camera_ready_columns.down.sql`

**Step 1: Create the up migration**

```sql
-- 000030_add_camera_ready_columns.up.sql
ALTER TABLE conference_submissions
    ADD COLUMN IF NOT EXISTS camera_ready_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS camera_ready_original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS camera_ready_size BIGINT,
    ADD COLUMN IF NOT EXISTS camera_ready_mime_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS camera_ready_uploaded_at TIMESTAMPTZ;
```

**Step 2: Create the down migration**

```sql
-- 000030_add_camera_ready_columns.down.sql
ALTER TABLE conference_submissions
    DROP COLUMN IF EXISTS camera_ready_uploaded_at,
    DROP COLUMN IF EXISTS camera_ready_mime_type,
    DROP COLUMN IF EXISTS camera_ready_size,
    DROP COLUMN IF EXISTS camera_ready_original_name,
    DROP COLUMN IF EXISTS camera_ready_path;
```

**Step 3: Run migration**

```bash
cd backend && make migrate-up
```

**Step 4: Commit**

```bash
git add backend/migrations/000030_add_camera_ready_columns.up.sql backend/migrations/000030_add_camera_ready_columns.down.sql
git commit -m "feat(migration): add camera_ready columns to conference_submissions BR-003"
```

---

## Task 9: BR-003 — Camera-Ready Model + DTO

**Files:**
- Modify: `backend/internal/model/submission.go`
- Modify: `backend/internal/dto/submission.go`

**Step 1: Add camera-ready columns to `model.Submission` struct**

In `backend/internal/model/submission.go`, add to the `Submission` struct after the cover letter fields:

```go
CameraReadyPath         *string    `db:"camera_ready_path"`
CameraReadyOriginalName *string    `db:"camera_ready_original_name"`
CameraReadySize         *int64     `db:"camera_ready_size"`
CameraReadyMimeType     *string    `db:"camera_ready_mime_type"`
CameraReadyUploadedAt   *time.Time `db:"camera_ready_uploaded_at"`
```

Also update `ToDTO()` to populate a `CameraReady` field (see step 2):

```go
var cameraReadyMetadata *dto.SubmissionFileMetadata
if s.CameraReadyPath != nil && s.CameraReadyOriginalName != nil && s.CameraReadySize != nil && s.CameraReadyMimeType != nil {
    cameraReadyMetadata = &dto.SubmissionFileMetadata{
        Filename:     filepath.Base(*s.CameraReadyPath),
        OriginalName: *s.CameraReadyOriginalName,
        Size:         *s.CameraReadySize,
        MimeType:     *s.CameraReadyMimeType,
        Path:         *s.CameraReadyPath,
    }
}
```

And add `CameraReady: cameraReadyMetadata` to the returned `dto.Submission`.

**Step 2: Add `CameraReady` to `dto.Submission` and camera-ready request types**

In `backend/internal/dto/submission.go`, add to the `Submission` struct:

```go
CameraReady *SubmissionFileMetadata `json:"camera_ready,omitempty"`
```

Append new request/response types:

```go
// UploadCameraReadyRequest is the URI binding for POST /conferences/:id/submissions/:id/camera-ready
type UploadCameraReadyRequest struct {
	ConferenceID int64 `uri:"conference_id" binding:"required"`
	SubmissionID int64 `uri:"submission_id" binding:"required"`
}
```

**Step 3: Commit**

```bash
git add backend/internal/model/submission.go backend/internal/dto/submission.go
git commit -m "feat(model+dto): add camera-ready fields to Submission for BR-003"
```

---

## Task 10: BR-003 — Camera-Ready File Storage

**Files:**
- Modify: `backend/internal/storage/file/file.go`
- Modify: `backend/internal/storage/submission/submission.go`

**Step 1: Add `SaveCameraReady` and `DeleteCameraReady` to `FileStorage`**

In `backend/internal/storage/file/file.go`, add to `StorageInterface`:

```go
SaveCameraReady(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error)
DeleteCameraReady(conferenceID, submissionID int64, filename string) error
GetCameraReadyPath(conferenceID, submissionID int64, filename string) string
```

Implement `SaveCameraReady` (mirrors `SaveFile` exactly, same PDF-only validation, stored under `camera_ready/` subdir):

```go
func (s *LocalFileStorage) SaveCameraReady(file io.Reader, header *multipart.FileHeader, conferenceID, submissionID int64) (*dto.SubmissionFileMetadata, error) {
	if !s.isValidPDF(header) {
		return nil, fmt.Errorf("only PDF files are allowed for camera-ready upload")
	}
	const maxSize = 20 * 1024 * 1024
	if header.Size > maxSize {
		return nil, fmt.Errorf("file size must not exceed 20MB")
	}
	dirPath := filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID), "camera_ready")
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}
	timestamp := time.Now().Unix()
	ext := filepath.Ext(header.Filename)
	nameWithoutExt := strings.TrimSuffix(header.Filename, ext)
	filename := fmt.Sprintf("%d_%s%s", timestamp, s.sanitizeFilename(nameWithoutExt), ext)
	filePath := filepath.Join(dirPath, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()
	size, err := io.Copy(dst, file)
	if err != nil {
		return nil, fmt.Errorf("failed to write file: %w", err)
	}
	return &dto.SubmissionFileMetadata{
		Filename:     filename,
		OriginalName: header.Filename,
		Size:         size,
		MimeType:     "application/pdf",
		Path:         filePath,
	}, nil
}

func (s *LocalFileStorage) GetCameraReadyPath(conferenceID, submissionID int64, filename string) string {
	return filepath.Join(s.basePath, fmt.Sprintf("%d", conferenceID), fmt.Sprintf("%d", submissionID), "camera_ready", filename)
}

func (s *LocalFileStorage) DeleteCameraReady(conferenceID, submissionID int64, filename string) error {
	path := s.GetCameraReadyPath(conferenceID, submissionID, filename)
	return os.Remove(path)
}
```

**Step 2: Add `UpdateCameraReady` to submission storage**

In `StorageInterface` of `submission.go`, add:

```go
UpdateCameraReady(ctx context.Context, id int64, meta *dto.SubmissionFileMetadata) (*dto.Submission, error)
```

Implement:

```go
func (s *Storage) UpdateCameraReady(ctx context.Context, id int64, meta *dto.SubmissionFileMetadata) (*dto.Submission, error) {
	now := time.Now()
	row := s.db.QueryRowContext(ctx, `
		UPDATE conference_submissions
		SET camera_ready_path = $1,
		    camera_ready_original_name = $2,
		    camera_ready_size = $3,
		    camera_ready_mime_type = $4,
		    camera_ready_uploaded_at = $5,
		    updated_at = $5
		WHERE submission_id = $6
		RETURNING `+submissionSelectColumns,
		meta.Path, meta.OriginalName, meta.Size, meta.MimeType, now, id,
	)
	// scan and return same as GetByID
	// (copy the scan block from GetByID)
}
```

> `submissionSelectColumns` is a const you will need to extract from the existing `GetByID` SELECT clause, or just inline the RETURNING columns. Follow the same scan pattern as `GetByID`.

**Step 3: Commit**

```bash
git add backend/internal/storage/file/file.go backend/internal/storage/submission/submission.go
git commit -m "feat(storage): add camera-ready file save and submission update methods BR-003"
```

---

## Task 11: BR-003 — Camera-Ready Controller + Routes

**Files:**
- Modify: `backend/internal/controller/submission/submission.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Add `UploadCameraReady` and `GetCameraReady` to submission controller**

Append to `backend/internal/controller/submission/submission.go`:

```go
// UploadCameraReady godoc
// @Summary      Upload camera-ready version
// @Description  Upload the camera-ready (final) version of an accepted submission (author only)
// @Tags         submissions
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Param        file formData file true "Camera-ready PDF"
// @Success      200 {object} dto.Submission
// @Failure      400 {object} handler.Response
// @Failure      401 {object} handler.Response
// @Failure      403 {object} handler.Response
// @Failure      404 {object} handler.Response
// @Failure      500 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/camera-ready [post]
func (c *Controller) UploadCameraReady(ginCtx *gin.Context) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid conference ID"})
		return
	}
	submissionID, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid submission ID"})
		return
	}

	userEmail, exists := utils.GetEmail(ginCtx)
	if !exists {
		ginCtx.JSON(http.StatusUnauthorized, handler.Response{Error: "user not authenticated"})
		return
	}

	sub, err := c.submissionStorage.GetByID(ctx, submissionID)
	if err != nil || sub.ConferenceID != conferenceID {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "submission not found"})
		return
	}
	if sub.Author != userEmail {
		ginCtx.JSON(http.StatusForbidden, handler.Response{Error: "only the submission author can upload camera-ready"})
		return
	}

	fileHeader, err := ginCtx.FormFile("file")
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "file is required"})
		return
	}
	f, err := fileHeader.Open()
	if err != nil {
		ginCtx.JSON(http.StatusInternalServerError, handler.Response{Error: "failed to open file"})
		return
	}
	defer f.Close()

	meta, err := c.fileStorage.SaveCameraReady(f, fileHeader, conferenceID, submissionID)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: err.Error()})
		return
	}

	updated, err := c.submissionStorage.UpdateCameraReady(ctx, submissionID, meta)
	if err != nil {
		c.fileStorage.DeleteCameraReady(conferenceID, submissionID, meta.Filename)
		ginCtx.JSON(http.StatusInternalServerError, handler.Response{Error: err.Error()})
		return
	}

	ginCtx.JSON(http.StatusOK, handler.Response{Data: updated})
}

// GetCameraReady godoc
// @Summary      Download camera-ready file
// @Description  Download the camera-ready PDF for a submission
// @Tags         submissions
// @Produce      application/pdf
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Success      200  {file}   binary
// @Failure      404 {object} handler.Response
// @Router       /conferences/{conference_id}/submissions/{submission_id}/camera-ready [get]
func (c *Controller) GetCameraReady(ginCtx *gin.Context) {
	ctx := ginCtx.Request.Context()

	conferenceID, err := strconv.ParseInt(ginCtx.Param("conference_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid conference ID"})
		return
	}
	submissionID, err := strconv.ParseInt(ginCtx.Param("submission_id"), 10, 64)
	if err != nil {
		ginCtx.JSON(http.StatusBadRequest, handler.Response{Error: "invalid submission ID"})
		return
	}

	sub, err := c.submissionStorage.GetByID(ctx, submissionID)
	if err != nil || sub.ConferenceID != conferenceID {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "submission not found"})
		return
	}
	if sub.CameraReady == nil || sub.CameraReady.Path == "" {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "camera-ready file not found"})
		return
	}
	if _, err := os.Stat(sub.CameraReady.Path); os.IsNotExist(err) {
		ginCtx.JSON(http.StatusNotFound, handler.Response{Error: "camera-ready file not found on disk"})
		return
	}

	ginCtx.Header("Content-Type", sub.CameraReady.MimeType)
	ginCtx.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", sub.CameraReady.OriginalName))
	ginCtx.Header("Content-Length", fmt.Sprintf("%d", sub.CameraReady.Size))
	ginCtx.File(sub.CameraReady.Path)
}
```

**Step 2: Register routes in `main.go`**

In the submissions group, add:

```go
submissions.POST("/:submission_id/camera-ready", ctrl.Submission.UploadCameraReady)
submissions.GET("/:submission_id/camera-ready", ctrl.Submission.GetCameraReady)
```

**Step 3: Commit**

```bash
git add backend/internal/controller/submission/submission.go backend/cmd/server/main.go
git commit -m "feat(controller): add UploadCameraReady and GetCameraReady endpoints BR-003"
```

---

## Task 12: Regenerate Swagger Docs

**Step 1: Regenerate**

```bash
cd backend && make swagger
```

Expected: `backend/docs/docs.go` and `backend/swagger.json` updated with the 5 new endpoints.

**Step 2: Commit**

```bash
git add backend/docs/ backend/swagger.json
git commit -m "docs: regenerate swagger for BR-001/BR-003/BR-004 endpoints"
```

---

## Task 13: Smoke Test All New Endpoints

**Step 1: Start the backend**

```bash
cd backend && make dev
```

**Step 2: Get a chair JWT** (use the test-login helper or register/login normally)

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/v1/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"chair@example.com"}' | jq .
```

**Step 3: Test BR-001**

```bash
curl -s http://localhost:8080/api/v1/conferences/1/stats \
  -H "Authorization: Bearer <token>" | jq .
```

Expected: `{"data":{"submissions":{...},"reviews":{...},"tracks":[...]}}` with HTTP 200.

**Step 4: Test BR-004 submit rebuttal**

```bash
curl -s -X PUT http://localhost:8080/api/v1/conferences/1/submissions/1/rebuttal \
  -H "Authorization: Bearer <author-token>" \
  -H "Content-Type: application/json" \
  -d '{"general_response":"We thank reviewers...", "per_reviewer":{}}' | jq .
```

Expected: `{"data":{"rebuttal_phase":"submitted",...}}` HTTP 200.

**Step 5: Test BR-004 acknowledge**

```bash
curl -s -X PUT http://localhost:8080/api/v1/conferences/1/assignments/1/rebuttal/acknowledge \
  -H "Authorization: Bearer <reviewer-token>" | jq .
```

Expected: `{"data":{"rebuttal_status":"acknowledged",...}}` HTTP 200.

**Step 6: Test BR-003 upload**

```bash
curl -s -X POST http://localhost:8080/api/v1/conferences/1/submissions/1/camera-ready \
  -H "Authorization: Bearer <author-token>" \
  -F "file=@/path/to/paper.pdf" | jq .
```

Expected: `{"data":{...,"camera_ready":{"filename":"...","size":...}}}` HTTP 200.

**Step 7: Commit if all pass**

```bash
git commit --allow-empty -m "test: manual smoke test BR-001/BR-003/BR-004 all passing"
```

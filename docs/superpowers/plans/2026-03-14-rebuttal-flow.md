# Rebuttal Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete pure-text rebuttal flow where chairs control phase transitions, authors submit locked text responses, and reviewers acknowledge points and update post-rebuttal scores.

**Architecture:** Conference-level `rebuttal_phase` drives the state machine (`not_started → awaiting → submitted → discussion? → finalized`); per-submission phase tracks individual progress. All new backend logic follows the existing storage → service → controller pattern with validation guards on existing endpoints.

**Tech Stack:** Go 1.24 / Gin / PostgreSQL 15 (backend); Next.js 15 App Router / TypeScript / Tailwind CSS v4 / shadcn/ui (frontend). Tests use the existing `tests/api/` integration test harness.

---

## File Map

### Backend — New/Modified
| File | Action | Purpose |
|---|---|---|
| `backend/migrations/000037_add_rebuttal_conference_config.up.sql` | Create | Add rebuttal columns to conferences + post-rebuttal columns to paper_assignments |
| `backend/migrations/000037_add_rebuttal_conference_config.down.sql` | Create | Rollback |
| `backend/internal/model/conference.go` | Modify | Add rebuttal phase constants + rebuttal fields to Conference struct |
| `backend/internal/model/assignment.go` | Modify | Add post-rebuttal score fields to Assignment struct |
| `backend/internal/dto/conference.go` | Modify | Add RebuttalSettingsDTO, RebuttalPhaseTransitionRequest, RebuttalOverviewResponse |
| `backend/internal/dto/assignment.go` | Modify | Add PostRebuttalScoreRequest + PostRebuttalScoreResponse |
| `backend/internal/storage/conference/rebuttal.go` | Create | GetRebuttalSettings, SaveRebuttalSettings, OpenRebuttal, FinalizeRebuttal, OpenDiscussion |
| `backend/internal/storage/conference/conference.go` | Modify | Add rebuttal methods to StorageInterface |
| `backend/internal/storage/submission/rebuttal.go` | Create | BulkSetRebuttalPhase (used by conference-level transitions) |
| `backend/internal/storage/submission/submission.go` | Modify | Add BulkSetRebuttalPhase to StorageInterface |
| `backend/internal/storage/assignment/post_rebuttal.go` | Create | UpdatePostRebuttalScore |
| `backend/internal/storage/assignment/assignment.go` | Modify | Add UpdatePostRebuttalScore to StorageInterface |
| `backend/internal/service/notification/rebuttal.go` | Create | NotifyRebuttalOpened, NotifyRebuttalSubmitted, NotifyRebuttalAcknowledged, NotifyRebuttalFinalized, NotifyRebuttalDeadlineReminder |
| `backend/internal/service/notification/notification.go` | Modify | Add new Notify* methods to ServiceInterface |
| `backend/internal/controller/conference/rebuttal.go` | Create | GetRebuttalSettings, SaveRebuttalSettings, OpenRebuttal, FinalizeRebuttal, OpenDiscussion |
| `backend/internal/controller/reviewer/post_rebuttal.go` | Create | UpdatePostRebuttalScore |
| `backend/internal/controller/submission/submission.go` | Modify | Add phase guards + char limit validation to SubmitRebuttal |
| `backend/internal/controller/reviewer/reviewer.go` | Modify | Add phase guard to AcknowledgeRebuttal + AcknowledgePoint |
| `backend/internal/cron/rebuttal.go` | Create | Auto-finalize ticker (runs every hour) |
| `backend/cmd/server/main.go` | Modify | Register 5 new routes + start cron goroutine |
| `backend/tests/api/submission/rebuttal_test.go` | Modify | Add phase guard tests + char limit tests |
| `backend/tests/api/conference/rebuttal_test.go` | Create | Phase transition tests + settings tests |
| `backend/tests/api/reviewer/post_rebuttal_test.go` | Create | Post-rebuttal score tests |

### Frontend — New/Modified
| File | Action | Purpose |
|---|---|---|
| `frontend/lib/api/conference-rebuttal.ts` | Create | getRebuttalSettings, saveRebuttalSettings, openRebuttal, finalizeRebuttal, openDiscussion |
| `frontend/lib/api/rebuttal.ts` | Modify | Add updatePostRebuttalScore; extend getRebuttal to include deadline + conference phase |
| `frontend/components/shared/rebuttal/types.ts` | Modify | Add charLimitGeneral, charLimitPerPoint to RebuttalSettings; add postRebuttalScore to ReviewerInfo |
| `frontend/components/chair/conference-detail/conference-rebuttal-settings.tsx` | Create | Settings form (enable toggle, dates, char limits, discussion flag) |
| `frontend/components/chair/conference-detail/conference-rebuttal-management.tsx` | Create | Phase banner + action buttons + submission overview table |
| `frontend/components/chair/conference-detail/conference-detail-dashboard.tsx` | Modify | Add "Rebuttal" tab |
| `frontend/components/author/submission-detail/rebuttal-tab.tsx` | Modify | Phase-aware render, char limit counter, ack progress, locked state |
| `frontend/components/reviewer/submission-review/rebuttal-tab.tsx` | Modify | Phase-aware render, post-rebuttal score form, mark-all shortcut |

---

## Chunk 1: Backend Foundation — Migration + Models + Storage

### Task 1: Database Migration

**Files:**
- Create: `backend/migrations/000037_add_rebuttal_conference_config.up.sql`
- Create: `backend/migrations/000037_add_rebuttal_conference_config.down.sql`

- [ ] **Step 1: Write the up migration**

```sql
-- backend/migrations/000037_add_rebuttal_conference_config.up.sql

-- Conference-level rebuttal configuration and phase
ALTER TABLE conferences
  ADD COLUMN IF NOT EXISTS rebuttal_enabled       BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rebuttal_phase         VARCHAR(20) NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS rebuttal_start_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rebuttal_deadline      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS char_limit_general     INT         NOT NULL DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS char_limit_per_point   INT         NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS allow_discussion       BOOLEAN     NOT NULL DEFAULT FALSE;

-- Post-rebuttal reviewer score update
ALTER TABLE paper_assignments
  ADD COLUMN IF NOT EXISTS post_rebuttal_score          INT,
  ADD COLUMN IF NOT EXISTS post_rebuttal_recommendation VARCHAR(20),
  ADD COLUMN IF NOT EXISTS post_rebuttal_comment        TEXT,
  ADD COLUMN IF NOT EXISTS post_rebuttal_updated_at     TIMESTAMPTZ;
```

- [ ] **Step 2: Write the down migration**

```sql
-- backend/migrations/000037_add_rebuttal_conference_config.down.sql

ALTER TABLE conferences
  DROP COLUMN IF EXISTS rebuttal_enabled,
  DROP COLUMN IF EXISTS rebuttal_phase,
  DROP COLUMN IF EXISTS rebuttal_start_at,
  DROP COLUMN IF EXISTS rebuttal_deadline,
  DROP COLUMN IF EXISTS char_limit_general,
  DROP COLUMN IF EXISTS char_limit_per_point,
  DROP COLUMN IF EXISTS allow_discussion;

ALTER TABLE paper_assignments
  DROP COLUMN IF EXISTS post_rebuttal_score,
  DROP COLUMN IF EXISTS post_rebuttal_recommendation,
  DROP COLUMN IF EXISTS post_rebuttal_comment,
  DROP COLUMN IF EXISTS post_rebuttal_updated_at;
```

- [ ] **Step 3: Run migration**

```bash
cd backend && make migrate-up
```

Expected: migration runs with no errors.

---

### Task 2: Update Models and DTOs

**Files:**
- Modify: `backend/internal/model/conference.go`
- Modify: `backend/internal/model/assignment.go`
- Modify: `backend/internal/dto/conference.go`
- Modify: `backend/internal/dto/assignment.go`

- [ ] **Step 1: Add constants and fields to Conference model**

In `backend/internal/model/conference.go`, add after the existing `ConferenceStatus*` constants block:

```go
// Conference-level rebuttal phase constants
const (
	ConferenceRebuttalPhaseNotStarted = "not_started"
	ConferenceRebuttalPhaseAwaiting   = "awaiting"
	ConferenceRebuttalPhaseSubmitted  = "submitted"
	ConferenceRebuttalPhaseDiscussion = "discussion"
	ConferenceRebuttalPhaseFinalized  = "finalized"
)
```

Add new fields to `Conference` struct after `Status`:

```go
RebuttalEnabled     bool       `db:"rebuttal_enabled"`
RebuttalPhase       string     `db:"rebuttal_phase"`
RebuttalStartAt     *time.Time `db:"rebuttal_start_at"`
RebuttalDeadline    *time.Time `db:"rebuttal_deadline"`
CharLimitGeneral    int        `db:"char_limit_general"`
CharLimitPerPoint   int        `db:"char_limit_per_point"`
AllowDiscussion     bool       `db:"allow_discussion"`
```

- [ ] **Step 2: Add post-rebuttal fields to Assignment model**

In `backend/internal/model/assignment.go`, add after `RebuttalAcknowledgedAt`:

```go
PostRebuttalScore          *int       `db:"post_rebuttal_score"`
PostRebuttalRecommendation *string    `db:"post_rebuttal_recommendation"`
PostRebuttalComment        *string    `db:"post_rebuttal_comment"`
PostRebuttalUpdatedAt      *time.Time `db:"post_rebuttal_updated_at"`
```

Also add constants:
```go
// Post-rebuttal recommendation constants
const (
	PostRebuttalRecommendationAccept     = "accept"
	PostRebuttalRecommendationReject     = "reject"
	PostRebuttalRecommendationBorderline = "borderline"
)
```

Update `Assignment.ToDTO()` to include the new fields:
```go
result.PostRebuttalScore = a.PostRebuttalScore
result.PostRebuttalRecommendation = a.PostRebuttalRecommendation
result.PostRebuttalComment = a.PostRebuttalComment
result.PostRebuttalUpdatedAt = a.PostRebuttalUpdatedAt
```

- [ ] **Step 3: Add rebuttal DTOs to conference.go**

In `backend/internal/dto/conference.go`, append:

```go
// RebuttalSettingsDTO represents conference rebuttal configuration
type RebuttalSettingsDTO struct {
	Enabled          bool       `json:"enabled"`
	Phase            string     `json:"phase"`
	StartAt          *time.Time `json:"start_at,omitempty"`
	Deadline         *time.Time `json:"deadline,omitempty"`
	CharLimitGeneral int        `json:"char_limit_general"`
	CharLimitPerPoint int       `json:"char_limit_per_point"`
	AllowDiscussion  bool       `json:"allow_discussion"`
}

// SaveRebuttalSettingsRequest is the body for PATCH /conferences/:id/rebuttal/settings
type SaveRebuttalSettingsRequest struct {
	ConferenceID      int64      `uri:"conference_id"`
	Enabled           bool       `json:"enabled"`
	StartAt           *time.Time `json:"start_at,omitempty"`
	Deadline          *time.Time `json:"deadline,omitempty"`
	CharLimitGeneral  int        `json:"char_limit_general"`
	CharLimitPerPoint int        `json:"char_limit_per_point"`
	AllowDiscussion   bool       `json:"allow_discussion"`
}

// RebuttalPhaseTransitionRequest is the URI for phase transition endpoints
type RebuttalPhaseTransitionRequest struct {
	ConferenceID int64 `uri:"conference_id"`
}

// RebuttalOverviewRow is one row in the chair's rebuttal overview table
type RebuttalOverviewRow struct {
	SubmissionID   int64  `json:"submission_id"`
	Title          string `json:"title"`
	RebuttalPhase  string `json:"rebuttal_phase"`
	HasResponse    bool   `json:"has_response"`
	TotalReviewers int    `json:"total_reviewers"`
	AckedReviewers int    `json:"acked_reviewers"`
}

// RebuttalOverviewResponse is returned by GET .../rebuttal/settings (includes overview)
type RebuttalOverviewResponse struct {
	Settings    RebuttalSettingsDTO   `json:"settings"`
	Submissions []RebuttalOverviewRow `json:"submissions"`
}
```

- [ ] **Step 4: Add post-rebuttal score DTO to assignment.go**

In `backend/internal/dto/assignment.go`, add to the `Assignment` struct:

```go
PostRebuttalScore          *int       `json:"post_rebuttal_score,omitempty"`
PostRebuttalRecommendation *string    `json:"post_rebuttal_recommendation,omitempty"`
PostRebuttalComment        *string    `json:"post_rebuttal_comment,omitempty"`
PostRebuttalUpdatedAt      *time.Time `json:"post_rebuttal_updated_at,omitempty"`
```

Append new request/response types:

```go
// PostRebuttalScoreRequest is the body for PUT .../assignments/:id/post-rebuttal-score
type PostRebuttalScoreRequest struct {
	ConferenceID   int64  `uri:"conference_id"`
	AssignmentID   int64  `uri:"assignment_id"`
	Score          int    `json:"score" binding:"required,min=1,max=10"`
	Recommendation string `json:"recommendation" binding:"required,oneof=accept reject borderline"`
	Comment        string `json:"comment"`
}
```

- [ ] **Step 5: Build to check for compile errors**

```bash
cd backend && go build ./...
```

Expected: no errors.

---

### Task 3: Conference Rebuttal Storage

**Files:**
- Create: `backend/internal/storage/conference/rebuttal.go`
- Modify: `backend/internal/storage/conference/conference.go` (add methods to interface)

- [ ] **Step 1: Write failing test for GetRebuttalSettings**

In `backend/tests/api/conference/rebuttal_test.go` (create file):

```go
package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/model"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestGetRebuttalSettings_DefaultValues(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	client := NewClient(ctx)

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	conf, err := client.CreateSuccess(&dto.Conference{
		Title: "Rebuttal Settings Test", Acronym: testutils.UniqueString("RST"), Chair: chair.Email,
	}, chairToken)
	if err != nil {
		t.Fatalf("create conference: %v", err)
	}

	resp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", conf.ID), nil, chairToken)
	if err != nil {
		t.Fatalf("GET settings: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data struct {
			Settings struct {
				Phase            string `json:"phase"`
				CharLimitGeneral int    `json:"char_limit_general"`
			} `json:"settings"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if body.Data.Settings.Phase != model.ConferenceRebuttalPhaseNotStarted {
		t.Errorf("expected not_started, got %s", body.Data.Settings.Phase)
	}
	if body.Data.Settings.CharLimitGeneral != 3000 {
		t.Errorf("expected default 3000, got %d", body.Data.Settings.CharLimitGeneral)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && go test ./tests/api/conference/... -run TestGetRebuttalSettings -v
```

Expected: compile error or 404.

- [ ] **Step 3: Create storage methods**

Create `backend/internal/storage/conference/rebuttal.go`:

```go
package conference

import (
	"context"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

// GetRebuttalSettings returns rebuttal config for a conference.
func (s *Storage) GetRebuttalSettings(ctx context.Context, conferenceID int64) (*dto.RebuttalSettingsDTO, error) {
	var c model.Conference
	err := s.db.QueryRowContext(ctx, `
		SELECT rebuttal_enabled, rebuttal_phase, rebuttal_start_at, rebuttal_deadline,
		       char_limit_general, char_limit_per_point, allow_discussion
		FROM conferences WHERE conference_id = $1
	`, conferenceID).Scan(
		&c.RebuttalEnabled, &c.RebuttalPhase, &c.RebuttalStartAt, &c.RebuttalDeadline,
		&c.CharLimitGeneral, &c.CharLimitPerPoint, &c.AllowDiscussion,
	)
	if err != nil {
		return nil, fmt.Errorf("get rebuttal settings: %w", err)
	}
	return &dto.RebuttalSettingsDTO{
		Enabled:           c.RebuttalEnabled,
		Phase:             c.RebuttalPhase,
		StartAt:           c.RebuttalStartAt,
		Deadline:          c.RebuttalDeadline,
		CharLimitGeneral:  c.CharLimitGeneral,
		CharLimitPerPoint: c.CharLimitPerPoint,
		AllowDiscussion:   c.AllowDiscussion,
	}, nil
}

// SaveRebuttalSettings persists rebuttal configuration (does not change phase).
func (s *Storage) SaveRebuttalSettings(ctx context.Context, conferenceID int64, req *dto.SaveRebuttalSettingsRequest) (*dto.RebuttalSettingsDTO, error) {
	_, err := s.db.ExecContext(ctx, `
		UPDATE conferences SET
			rebuttal_enabled     = $1,
			rebuttal_start_at    = $2,
			rebuttal_deadline    = $3,
			char_limit_general   = $4,
			char_limit_per_point = $5,
			allow_discussion     = $6,
			updated_at           = NOW()
		WHERE conference_id = $7
	`, req.Enabled, req.StartAt, req.Deadline, req.CharLimitGeneral, req.CharLimitPerPoint, req.AllowDiscussion, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("save rebuttal settings: %w", err)
	}
	return s.GetRebuttalSettings(ctx, conferenceID)
}

// OpenRebuttal transitions the conference to 'awaiting' and bulk-sets all eligible submissions.
// Eligible = submissions whose status is 'reviewing' or equivalent active review status.
func (s *Storage) OpenRebuttal(ctx context.Context, conferenceID int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		UPDATE conferences SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2 AND rebuttal_phase = $3
	`, model.ConferenceRebuttalPhaseAwaiting, conferenceID, model.ConferenceRebuttalPhaseNotStarted)
	if err != nil {
		return fmt.Errorf("set conference rebuttal phase: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE conference_submissions
		SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2
	`, model.RebuttalPhaseAwaiting, conferenceID)
	if err != nil {
		return fmt.Errorf("bulk set submission rebuttal phase: %w", err)
	}

	return tx.Commit()
}

// FinalizeRebuttal transitions the conference to 'finalized' and bulk-updates all submissions.
func (s *Storage) FinalizeRebuttal(ctx context.Context, conferenceID int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		UPDATE conferences SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2
	`, model.ConferenceRebuttalPhaseFinalized, conferenceID)
	if err != nil {
		return fmt.Errorf("finalize conference rebuttal: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE conference_submissions
		SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2
	`, model.RebuttalPhaseFinalized, conferenceID)
	if err != nil {
		return fmt.Errorf("bulk finalize submission rebuttal: %w", err)
	}

	return tx.Commit()
}

// OpenDiscussion transitions the conference to 'discussion' phase.
// Requires allow_discussion=true and current phase='awaiting'.
func (s *Storage) OpenDiscussion(ctx context.Context, conferenceID int64) error {
	res, err := s.db.ExecContext(ctx, `
		UPDATE conferences SET rebuttal_phase = $1, updated_at = NOW()
		WHERE conference_id = $2 AND allow_discussion = TRUE AND rebuttal_phase = $3
	`, model.ConferenceRebuttalPhaseDiscussion, conferenceID, model.ConferenceRebuttalPhaseAwaiting)
	if err != nil {
		return fmt.Errorf("open discussion: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("cannot open discussion: check allow_discussion=true and current phase is awaiting")
	}
	return nil
}

// GetRebuttalOverview returns settings + per-submission status for the chair management page.
func (s *Storage) GetRebuttalOverview(ctx context.Context, conferenceID int64) (*dto.RebuttalOverviewResponse, error) {
	settings, err := s.GetRebuttalSettings(ctx, conferenceID)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT
			cs.submission_id,
			cs.title,
			cs.rebuttal_phase,
			CASE WHEN cs.rebuttal_general_response IS NOT NULL THEN TRUE ELSE FALSE END AS has_response,
			COUNT(pa.id) AS total_reviewers,
			COUNT(CASE WHEN pa.rebuttal_status = 'acknowledged' THEN 1 END) AS acked_reviewers
		FROM conference_submissions cs
		LEFT JOIN paper_assignments pa ON pa.submission_id = cs.submission_id
			AND pa.conference_id = cs.conference_id
			AND pa.status = 'completed'
		WHERE cs.conference_id = $1
		GROUP BY cs.submission_id, cs.title, cs.rebuttal_phase, cs.rebuttal_general_response
		ORDER BY cs.submission_id
	`, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("get rebuttal overview: %w", err)
	}
	defer rows.Close()

	var subs []dto.RebuttalOverviewRow
	for rows.Next() {
		var r dto.RebuttalOverviewRow
		if err := rows.Scan(&r.SubmissionID, &r.Title, &r.RebuttalPhase, &r.HasResponse, &r.TotalReviewers, &r.AckedReviewers); err != nil {
			return nil, err
		}
		subs = append(subs, r)
	}
	if subs == nil {
		subs = []dto.RebuttalOverviewRow{}
	}

	return &dto.RebuttalOverviewResponse{Settings: *settings, Submissions: subs}, nil
}

// GetConferenceRebuttalSettings returns only the rebuttal fields needed for validation.
func (s *Storage) GetConferenceRebuttalSettings(ctx context.Context, conferenceID int64) (*dto.RebuttalSettingsDTO, error) {
	return s.GetRebuttalSettings(ctx, conferenceID)
}

// GetOverdueRebuttalConferences returns conference IDs where rebuttal deadline has passed
// and phase is not yet finalized — used by the auto-finalize cron job.
func (s *Storage) GetOverdueRebuttalConferences(ctx context.Context) ([]int64, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT conference_id FROM conferences
		WHERE rebuttal_deadline < NOW()
		  AND rebuttal_phase NOT IN ('not_started', 'finalized')
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}
```

- [ ] **Step 4: Add new methods to StorageInterface in conference.go**

In `backend/internal/storage/conference/conference.go`, add to `StorageInterface`:

```go
GetRebuttalSettings(ctx context.Context, conferenceID int64) (*dto.RebuttalSettingsDTO, error)
SaveRebuttalSettings(ctx context.Context, conferenceID int64, req *dto.SaveRebuttalSettingsRequest) (*dto.RebuttalSettingsDTO, error)
OpenRebuttal(ctx context.Context, conferenceID int64) error
FinalizeRebuttal(ctx context.Context, conferenceID int64) error
OpenDiscussion(ctx context.Context, conferenceID int64) error
GetRebuttalOverview(ctx context.Context, conferenceID int64) (*dto.RebuttalOverviewResponse, error)
GetOverdueRebuttalConferences(ctx context.Context) ([]int64, error)
```

- [ ] **Step 5: Add UpdatePostRebuttalScore to assignment storage**

Create `backend/internal/storage/assignment/post_rebuttal.go`:

```go
package assignment

import (
	"context"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

// UpdatePostRebuttalScore sets the reviewer's post-rebuttal score and recommendation.
func (s *Storage) UpdatePostRebuttalScore(ctx context.Context, assignmentID int64, req *dto.PostRebuttalScoreRequest) error {
	now := time.Now()
	res, err := s.db.ExecContext(ctx, `
		UPDATE paper_assignments SET
			post_rebuttal_score          = $1,
			post_rebuttal_recommendation = $2,
			post_rebuttal_comment        = $3,
			post_rebuttal_updated_at     = $4,
			updated_at                   = $4
		WHERE id = $5 AND conference_id = $6
	`, req.Score, req.Recommendation, req.Comment, now, assignmentID, req.ConferenceID)
	if err != nil {
		return fmt.Errorf("update post rebuttal score: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("assignment not found")
	}
	return nil
}
```

Add to `StorageInterface` in `backend/internal/storage/assignment/assignment.go`:

```go
UpdatePostRebuttalScore(ctx context.Context, assignmentID int64, req *dto.PostRebuttalScoreRequest) error
```

- [ ] **Step 6: Build to check for compile errors**

```bash
cd backend && go build ./...
```

Expected: no errors.

---

## Chunk 2: Backend Controllers + Routes + Cron

### Task 4: Conference Rebuttal Controller

**Files:**
- Create: `backend/internal/controller/conference/rebuttal.go`
- Modify: `backend/cmd/server/main.go` (register routes)

- [ ] **Step 1: Create conference rebuttal controller**

Create `backend/internal/controller/conference/rebuttal.go`:

```go
package conference

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/middleware/utils"
	"github.com/dcao/conferencespace/internal/model"
)

// GetRebuttalSettings godoc
// @Summary      Get rebuttal settings and overview
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.RebuttalOverviewResponse
// @Router       /conferences/{conference_id}/rebuttal/settings [get]
func (c *Controller) GetRebuttalSettings(ginCtx *gin.Context, req *dto.RebuttalPhaseTransitionRequest) (*dto.RebuttalOverviewResponse, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	return c.conferenceStorage.GetRebuttalOverview(ctx, req.ConferenceID)
}

// SaveRebuttalSettings godoc
// @Summary      Save rebuttal configuration
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        request body dto.SaveRebuttalSettingsRequest true "Settings"
// @Success      200 {object} dto.RebuttalSettingsDTO
// @Router       /conferences/{conference_id}/rebuttal/settings [patch]
func (c *Controller) SaveRebuttalSettings(ginCtx *gin.Context, req *dto.SaveRebuttalSettingsRequest) (*dto.RebuttalSettingsDTO, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	if req.CharLimitGeneral <= 0 {
		req.CharLimitGeneral = 3000
	}
	if req.CharLimitPerPoint <= 0 {
		req.CharLimitPerPoint = 1000
	}
	return c.conferenceStorage.SaveRebuttalSettings(ctx, req.ConferenceID, req)
}

// OpenRebuttal godoc
// @Summary      Open rebuttal period (chair only)
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.RebuttalSettingsDTO
// @Router       /conferences/{conference_id}/rebuttal/open [post]
func (c *Controller) OpenRebuttal(ginCtx *gin.Context, req *dto.RebuttalPhaseTransitionRequest) (*dto.RebuttalSettingsDTO, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	if err := c.conferenceStorage.OpenRebuttal(ctx, req.ConferenceID); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
	}
	return c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
}

// FinalizeRebuttal godoc
// @Summary      Finalize rebuttal period (chair only)
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.RebuttalSettingsDTO
// @Router       /conferences/{conference_id}/rebuttal/finalize [post]
func (c *Controller) FinalizeRebuttal(ginCtx *gin.Context, req *dto.RebuttalPhaseTransitionRequest) (*dto.RebuttalSettingsDTO, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	if err := c.conferenceStorage.FinalizeRebuttal(ctx, req.ConferenceID); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}
	return c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
}

// OpenDiscussion godoc
// @Summary      Open discussion phase (chair only, requires allow_discussion=true)
// @Tags         conferences
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Success      200 {object} dto.RebuttalSettingsDTO
// @Router       /conferences/{conference_id}/rebuttal/open-discussion [post]
func (c *Controller) OpenDiscussion(ginCtx *gin.Context, req *dto.RebuttalPhaseTransitionRequest) (*dto.RebuttalSettingsDTO, error) {
	ctx := ginCtx.Request.Context()
	if err := c.assertChairOrCoChair(ginCtx, req.ConferenceID); err != nil {
		return nil, err
	}
	if err := c.conferenceStorage.OpenDiscussion(ctx, req.ConferenceID); err != nil {
		return nil, handler.NewErrorResponse(http.StatusBadRequest, err.Error())
	}
	return c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
}

// assertChairOrCoChair checks if the current user is the conference chair or a co-chair.
func (c *Controller) assertChairOrCoChair(ginCtx *gin.Context, conferenceID int64) error {
	email, exists := utils.GetEmail(ginCtx)
	if !exists {
		return handler.NewErrorResponse(http.StatusUnauthorized, "not authenticated")
	}
	conf, err := c.conferenceStorage.GetByID(ginCtx.Request.Context(), conferenceID)
	if err != nil {
		return handler.NewErrorResponse(http.StatusNotFound, "conference not found")
	}
	if conf.Chair != email {
		for _, cc := range conf.CoChairs {
			if cc == email {
				return nil
			}
		}
		return handler.NewErrorResponse(http.StatusForbidden, "only chair or co-chair can perform this action")
	}
	return nil
}
```

- [ ] **Step 2: Create post-rebuttal score controller**

Create `backend/internal/controller/reviewer/post_rebuttal.go`:

```go
package reviewer

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/handler"
	"github.com/dcao/conferencespace/internal/middleware/utils"
)

// UpdatePostRebuttalScore godoc
// @Summary      Reviewer updates score after reading rebuttal
// @Tags         reviewers
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Param        request body dto.PostRebuttalScoreRequest true "Score data"
// @Success      200 {object} handler.Response
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/post-rebuttal-score [put]
func (c *Controller) UpdatePostRebuttalScore(ginCtx *gin.Context, req *dto.PostRebuttalScoreRequest) (*handler.Response, error) {
	ctx := ginCtx.Request.Context()

	// Verify the calling user owns this assignment
	email, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "not authenticated")
	}
	assignment, err := c.assignmentStorage.GetByID(ctx, req.AssignmentID)
	if err != nil || assignment.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}
	if assignment.ReviewerEmail != email {
		return nil, handler.NewErrorResponse(http.StatusForbidden, "you can only update your own post-rebuttal score")
	}

	if err := c.assignmentStorage.UpdatePostRebuttalScore(ctx, req.AssignmentID, req); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	return &handler.Response{Message: "post-rebuttal score updated"}, nil
}
```

- [ ] **Step 3: Register new routes in main.go**

In `backend/cmd/server/main.go`, inside the `conferences` group, add after existing conference routes:

```go
// Rebuttal management routes (chair only)
rebuttalMgmt := conferences.Group("/:conference_id/rebuttal")
{
    rebuttalMgmt.GET("/settings",        handler.HandleRequestWithURI(ctrl.Conference.GetRebuttalSettings))
    rebuttalMgmt.PATCH("/settings",      handler.HandleRequestWithAll(ctrl.Conference.SaveRebuttalSettings))
    rebuttalMgmt.POST("/open",           handler.HandleRequestWithURI(ctrl.Conference.OpenRebuttal))
    rebuttalMgmt.POST("/finalize",       handler.HandleRequestWithURI(ctrl.Conference.FinalizeRebuttal))
    rebuttalMgmt.POST("/open-discussion",handler.HandleRequestWithURI(ctrl.Conference.OpenDiscussion))
}
```

Inside the `assignments` group, add:

```go
assignments.PUT("/:assignment_id/post-rebuttal-score", handler.HandleRequestWithAll(ctrl.Reviewer.UpdatePostRebuttalScore))
```

- [ ] **Step 4: Build to check for compile errors**

```bash
cd backend && go build ./...
```

Expected: no errors.

---

### Task 5: Validation Hardening on Existing Endpoints

**Files:**
- Modify: `backend/internal/controller/submission/submission.go` — add phase + char limit guards to `SubmitRebuttal`
- Modify: `backend/internal/controller/reviewer/reviewer.go` — add phase guard to `AcknowledgeRebuttal`

- [ ] **Step 1: Write failing test for phase guard**

In `backend/tests/api/submission/rebuttal_test.go`, add:

```go
func TestSubmitRebuttal_BlockedWhenNotAwaiting(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	chairToken, authorToken, _, conferenceID, submissionID, _ := setupRebuttalScenario(t, ctx)
	// Conference rebuttal phase is still 'not_started' — submission should be rejected
	_ = chairToken
	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		map[string]interface{}{"general_response": "hello", "points": []interface{}{}},
		authorToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
}

func TestSubmitRebuttal_BlockedWhenExceedsCharLimit(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	chairToken, authorToken, _, conferenceID, submissionID, _ := setupRebuttalScenario(t, ctx)

	// Open rebuttal with a small char limit
	_, err := ctx.MakeRequest("PATCH",
		fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", conferenceID),
		map[string]interface{}{"enabled": true, "char_limit_general": 10, "char_limit_per_point": 5},
		chairToken)
	if err != nil {
		t.Fatal(err)
	}
	_, err = ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", conferenceID), nil, chairToken)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		map[string]interface{}{
			"general_response": "this response is way too long and exceeds the 10 character limit",
			"points":           []interface{}{},
		}, authorToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
}
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd backend && go test ./tests/api/submission/... -run TestSubmitRebuttal_Blocked -v
```

Expected: tests fail (current code has no guards).

- [ ] **Step 3: Add guards to SubmitRebuttal in submission.go**

In `SubmitRebuttal`, after verifying the author owns the submission and before calling `SubmitRebuttal` storage, add:

```go
// Phase guard: only allow when conference rebuttal phase is 'awaiting'
confSettings, err := c.conferenceStorage.GetRebuttalSettings(ctx, req.ConferenceID)
if err != nil {
    return nil, handler.NewErrorResponse(http.StatusInternalServerError, "failed to check rebuttal phase")
}
if confSettings.Phase != model.ConferenceRebuttalPhaseAwaiting {
    return nil, handler.NewErrorResponse(http.StatusBadRequest,
        fmt.Sprintf("rebuttal is not open (current phase: %s)", confSettings.Phase))
}

// Char limit validation
if confSettings.CharLimitGeneral > 0 && len(req.GeneralResponse) > confSettings.CharLimitGeneral {
    return nil, handler.NewErrorResponse(http.StatusBadRequest,
        fmt.Sprintf("general response exceeds %d character limit", confSettings.CharLimitGeneral))
}
for _, p := range req.Points {
    if confSettings.CharLimitPerPoint > 0 && len(p.AuthorResponse) > confSettings.CharLimitPerPoint {
        return nil, handler.NewErrorResponse(http.StatusBadRequest,
            fmt.Sprintf("response for point %s exceeds %d character limit", p.PointID, confSettings.CharLimitPerPoint))
    }
}
```

The submission controller needs `conferenceStorage` — add it to the controller struct if not already present:

In `backend/internal/controller/submission/submission.go` controller struct:
```go
conferenceStorage conference.StorageInterface
```

Wire it in `backend/internal/controller/controller.go` (or wherever submission controller is initialized).

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd backend && go test ./tests/api/submission/... -run TestSubmitRebuttal_Blocked -v
```

Expected: both tests pass.

- [ ] **Step 5: Build**

```bash
cd backend && go build ./...
```

---

### Task 6: Notifications

**Files:**
- Create: `backend/internal/service/notification/rebuttal.go`
- Modify: service interface to expose new methods

- [ ] **Step 1: Add rebuttal notification type constants to model**

In `backend/internal/model/notification.go`, add:

```go
NotificationTypeRebuttalOpened      = "rebuttal_opened"
NotificationTypeRebuttalSubmitted   = "rebuttal_submitted"
NotificationTypeRebuttalAcknowledged = "rebuttal_acknowledged"
NotificationTypeRebuttalFinalized   = "rebuttal_finalized"
NotificationTypeRebuttalReminder    = "rebuttal_reminder"
```

- [ ] **Step 2: Create rebuttal notification methods**

Create `backend/internal/service/notification/rebuttal.go`:

```go
package notification

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

// NotifyRebuttalOpened notifies an author that the rebuttal period is open.
func (s *Service) NotifyRebuttalOpened(ctx context.Context, authorEmail, conferenceTitle string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: authorEmail,
		Type:      model.NotificationTypeRebuttalOpened,
		Title:     "Rebuttal Period Open",
		Message:   fmt.Sprintf("The rebuttal period for \"%s\" is now open. Submit your response before the deadline.", conferenceTitle),
		Metadata:  map[string]interface{}{"conference_name": conferenceTitle},
		ActionURL: fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalSubmitted notifies a reviewer that an author submitted a rebuttal.
func (s *Service) NotifyRebuttalSubmitted(ctx context.Context, reviewerEmail, paperTitle, conferenceTitle string, conferenceID, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: reviewerEmail,
		Type:      model.NotificationTypeRebuttalSubmitted,
		Title:     "Author Submitted Rebuttal",
		Message:   fmt.Sprintf("The author of \"%s\" has submitted a rebuttal for \"%s\".", paperTitle, conferenceTitle),
		Metadata:  map[string]interface{}{"paper_title": paperTitle, "conference_name": conferenceTitle},
		ActionURL: fmt.Sprintf("/dashboard/conference/%d/submissions/%d", conferenceID, submissionID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalAcknowledged notifies the author that a reviewer acknowledged their rebuttal.
func (s *Service) NotifyRebuttalAcknowledged(ctx context.Context, authorEmail, paperTitle, conferenceTitle string, conferenceID, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: authorEmail,
		Type:      model.NotificationTypeRebuttalAcknowledged,
		Title:     "Reviewer Acknowledged Rebuttal",
		Message:   fmt.Sprintf("A reviewer has acknowledged your rebuttal for \"%s\" in \"%s\".", paperTitle, conferenceTitle),
		Metadata:  map[string]interface{}{"paper_title": paperTitle},
		ActionURL: fmt.Sprintf("/dashboard/conference/%d/submissions/%d", conferenceID, submissionID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalFinalized notifies a user that the rebuttal period is finalized.
func (s *Service) NotifyRebuttalFinalized(ctx context.Context, userEmail, conferenceTitle string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: userEmail,
		Type:      model.NotificationTypeRebuttalFinalized,
		Title:     "Rebuttal Period Finalized",
		Message:   fmt.Sprintf("The rebuttal period for \"%s\" has been finalized. No further changes are possible.", conferenceTitle),
		Metadata:  map[string]interface{}{"conference_name": conferenceTitle},
		ActionURL: fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalDeadlineReminder notifies an author 24h before the deadline.
func (s *Service) NotifyRebuttalDeadlineReminder(ctx context.Context, authorEmail, conferenceTitle string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: authorEmail,
		Type:      model.NotificationTypeRebuttalReminder,
		Title:     "Rebuttal Deadline in 24 Hours",
		Message:   fmt.Sprintf("The rebuttal deadline for \"%s\" is in 24 hours. Submit your response now.", conferenceTitle),
		Metadata:  map[string]interface{}{"conference_name": conferenceTitle},
		ActionURL: fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}
```

- [ ] **Step 3: Hook notifications into SubmitRebuttal and AcknowledgeRebuttal controllers**

In `SubmitRebuttal` (submission controller), after successful storage calls, add a fire-and-forget notification to each assigned reviewer. Retrieve the list of assignments for the submission, then for each reviewer call `notificationService.NotifyRebuttalSubmitted(...)`.

In `AcknowledgeRebuttal` (reviewer controller), after storage success, call `notificationService.NotifyRebuttalAcknowledged(...)` to the author.

In `FinalizeRebuttal` (conference controller), retrieve all authors + reviewers for the conference and call `notificationService.NotifyRebuttalFinalized(...)` for each.

In `OpenRebuttal` (conference controller), retrieve all authors with active submissions and call `notificationService.NotifyRebuttalOpened(...)` for each.

- [ ] **Step 4: Build**

```bash
cd backend && go build ./...
```

---

### Task 7: Auto-Finalize Cron Job

**Files:**
- Create: `backend/internal/cron/rebuttal.go`
- Modify: `backend/cmd/server/main.go` — start cron goroutine

- [ ] **Step 1: Create cron package**

Create `backend/internal/cron/rebuttal.go`:

```go
package cron

import (
	"context"
	"log"
	"time"

	"github.com/dcao/conferencespace/internal/storage/conference"
)

// StartRebuttalAutoFinalize starts a goroutine that checks every hour for overdue
// rebuttal deadlines and auto-finalizes them. Call from main.go after server setup.
func StartRebuttalAutoFinalize(confStorage conference.StorageInterface) {
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			ctx := context.Background()
			ids, err := confStorage.GetOverdueRebuttalConferences(ctx)
			if err != nil {
				log.Printf("[cron] failed to query overdue rebuttal conferences: %v", err)
				continue
			}
			for _, id := range ids {
				if err := confStorage.FinalizeRebuttal(ctx, id); err != nil {
					log.Printf("[cron] failed to auto-finalize conference %d: %v", id, err)
				} else {
					log.Printf("[cron] auto-finalized rebuttal for conference %d", id)
				}
			}
		}
	}()
}
```

- [ ] **Step 2: Start cron in main.go**

In `backend/cmd/server/main.go`, after the server setup and before `router.Run(...)`, add:

```go
// Start auto-finalize cron for overdue rebuttal deadlines
cron.StartRebuttalAutoFinalize(storage.Conference)
```

Add import: `"github.com/dcao/conferencespace/internal/cron"`

- [ ] **Step 3: Build and run**

```bash
cd backend && go build ./...
```

---

## Chunk 3: Frontend — Chair UI

### Task 8: Chair Rebuttal Settings Tab

**Files:**
- Create: `frontend/components/chair/conference-detail/conference-rebuttal-settings.tsx`
- Create: `frontend/lib/api/conference-rebuttal.ts`
- Modify: `frontend/components/chair/conference-detail/conference-detail-dashboard.tsx`

- [ ] **Step 1: Create API client for chair rebuttal actions**

Create `frontend/lib/api/conference-rebuttal.ts`:

```typescript
import { apiFetch } from "./client"

export interface RebuttalSettings {
  enabled: boolean
  phase: string
  start_at: string | null
  deadline: string | null
  char_limit_general: number
  char_limit_per_point: number
  allow_discussion: boolean
}

export interface RebuttalOverviewRow {
  submission_id: number
  title: string
  rebuttal_phase: string
  has_response: boolean
  total_reviewers: number
  acked_reviewers: number
}

export interface RebuttalOverviewResponse {
  settings: RebuttalSettings
  submissions: RebuttalOverviewRow[]
}

export async function getRebuttalOverview(conferenceId: string): Promise<{ data: RebuttalOverviewResponse | null; error: string | null }> {
  try {
    const { data } = await apiFetch<{ data: RebuttalOverviewResponse }>(
      `/api/v1/conferences/${conferenceId}/rebuttal/settings`
    )
    return { data: data.data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to load rebuttal overview" }
  }
}

export async function saveRebuttalSettings(conferenceId: string, settings: Partial<RebuttalSettings>): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/rebuttal/settings`, {
      method: "PATCH",
      body: JSON.stringify(settings),
    })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save settings" }
  }
}

export async function openRebuttal(conferenceId: string): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/rebuttal/open`, { method: "POST" })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to open rebuttal" }
  }
}

export async function finalizeRebuttal(conferenceId: string): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/rebuttal/finalize`, { method: "POST" })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to finalize rebuttal" }
  }
}

export async function openDiscussion(conferenceId: string): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/rebuttal/open-discussion`, { method: "POST" })
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to open discussion" }
  }
}
```

- [ ] **Step 2: Check styling conventions**

Read `frontend/.steerings/insights.md` and `frontend/.steerings/sizings.md` before writing any component. Follow the patterns observed in existing chair components like `conference-cfp.tsx`.

- [ ] **Step 3: Create the rebuttal settings component**

Create `frontend/components/chair/conference-detail/conference-rebuttal-settings.tsx`.

This component renders:
- A toggle switch: "Enable Rebuttal Phase"
- Two date inputs: "Start Date" and "Deadline"
- Two number inputs: "Character limit — General Response" (default 3000) and "Character limit — Per Point" (default 1000)
- A toggle switch: "Allow Discussion Phase"
- A "Save Settings" button that calls `saveRebuttalSettings`

Use the same card/section layout as `conference-cfp.tsx`. Show a success toast on save.

Props:
```typescript
interface Props {
  conferenceId: string
  onSaved?: () => void
}
```

Load initial values on mount via `getRebuttalOverview`.

- [ ] **Step 4: Add "Rebuttal" tab to the chair dashboard**

In `frontend/components/chair/conference-detail/conference-detail-dashboard.tsx`, import and add the `ConferenceRebuttalSettings` and `ConferenceRebuttalManagement` (from Task 9) components as a new "Rebuttal" tab alongside existing tabs (Overview, Submissions, etc.).

---

### Task 9: Chair Rebuttal Management Page

**Files:**
- Create: `frontend/components/chair/conference-detail/conference-rebuttal-management.tsx`

- [ ] **Step 1: Create the management component**

Create `frontend/components/chair/conference-detail/conference-rebuttal-management.tsx`.

This component renders two sections:

**Section A — Phase Control:**
- Phase banner showing current phase with a colored badge (not_started=gray, awaiting=blue, submitted=yellow, discussion=purple, finalized=green)
- Action buttons based on current phase:
  - `not_started` → "Open Rebuttal Period" button → calls `openRebuttal`
  - `awaiting` → "Open Discussion" (if `allow_discussion`) + "Finalize Now" button → calls `finalizeRebuttal`
  - `submitted` / `discussion` → "Finalize Now" button
  - `finalized` → read-only banner "Rebuttal period is finalized"
- Confirm dialog before `finalizeRebuttal` ("Are you sure? This cannot be undone.")

**Section B — Submission Overview Table:**
Columns: Paper title | Rebuttal phase | Response submitted | Reviewers acknowledged (e.g. "2 / 3")

Use the same table styling as `conference-submissions.tsx`. Filter buttons for "All | Has Response | No Response".

Props:
```typescript
interface Props {
  conferenceId: string
}
```

Load data via `getRebuttalOverview` on mount and after each action.

---

## Chunk 4: Frontend — Author and Reviewer Tabs

### Task 10: Update Author Rebuttal Tab

**Files:**
- Modify: `frontend/components/author/submission-detail/rebuttal-tab.tsx`
- Modify: `frontend/lib/api/rebuttal.ts` — extend getRebuttal to return deadline + phase from conference
- Modify: `frontend/components/shared/rebuttal/types.ts` — add charLimitGeneral, charLimitPerPoint

- [ ] **Step 1: Extend RebuttalSettings type**

In `frontend/components/shared/rebuttal/types.ts`, add to `RebuttalSettings`:

```typescript
charLimitGeneral: number    // default 3000
charLimitPerPoint: number   // default 1000
```

- [ ] **Step 2: Update getRebuttal to pass char limits from conference settings**

In `frontend/lib/api/rebuttal.ts`, fetch conference rebuttal settings alongside the submission rebuttal data. Update `settings` mapping to include `charLimitGeneral` and `charLimitPerPoint` from the conference settings endpoint. Also populate `deadline` and `daysRemaining`.

A clean approach: call `getRebuttalOverview(conferenceId)` in parallel with the existing submission rebuttal call, then merge the settings.

- [ ] **Step 3: Rewrite the author rebuttal tab with phase-aware rendering**

Replace `frontend/components/author/submission-detail/rebuttal-tab.tsx` with phase-aware logic:

```
phase === "not_started" → show locked panel: "Rebuttal period not yet open"
phase === "awaiting"    → show editable form with:
                            - General response textarea with char counter (hard-disabled at limit)
                            - Per-point response editing inside RebuttalPanel
                            - Deadline countdown (e.g. "3 days remaining")
                            - Submit button (disabled if over char limit or empty)
phase === "submitted"   → show:
                            - Locked read-only panel
                            - Acknowledgment progress banner: "X of Y reviewers acknowledged"
                            - Per-reviewer ack status visible
phase === "finalized"   → show locked read-only panel with "Rebuttal period finalized" banner
```

**Char counter pattern:**
```typescript
const charCount = generalResponse.length
const isOverLimit = charCount > data.settings.charLimitGeneral
// Show: "1234 / 3000" — red text if over limit
// Disable submit if isOverLimit
```

**Acknowledgment progress:**
From the `reviewers` array in `RebuttalPanelData`, count how many have `rebuttal_status === "acknowledged"`. Display as: `"2 of 3 reviewers have read your rebuttal"`.

Note: the backend's `GetRebuttal` response currently doesn't return per-assignment `rebuttal_status`. Update `GetRebuttalResponse` DTO and `GetRebuttal` controller to include an `assignments` array with `{assignment_id, rebuttal_status}`. Update the frontend mapper accordingly.

- [ ] **Step 4: Test in browser**

Start the dev server and verify each phase renders correctly:
```bash
cd frontend && npm run dev
```

Navigate to an author's submission and open the Rebuttal tab. Verify:
- Before opening: "not yet open" message
- After chair opens: form with deadline + char counter
- After submit: locked + ack progress

---

### Task 11: Update Reviewer Rebuttal Tab

**Files:**
- Modify: `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`
- Modify: `frontend/lib/api/rebuttal.ts` — add updatePostRebuttalScore

- [ ] **Step 1: Add updatePostRebuttalScore to API client**

In `frontend/lib/api/rebuttal.ts`, append:

```typescript
export async function updatePostRebuttalScore(
  conferenceId: string,
  assignmentId: string,
  data: { score: number; recommendation: string; comment: string }
): Promise<{ error: string | null }> {
  try {
    await apiFetch(
      `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/post-rebuttal-score`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    )
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update score" }
  }
}
```

- [ ] **Step 2: Rewrite reviewer rebuttal tab with phase-aware rendering and post-rebuttal score form**

Replace `frontend/components/reviewer/submission-review/rebuttal-tab.tsx` with:

```
phase === "awaiting"  → show: "Author hasn't submitted their rebuttal yet."
phase === "submitted" → show:
                          - RebuttalPanel (current reviewer's points with ack buttons)
                          - "Mark all as read" button (calls acknowledgePoint for each unacked point with status "addressed")
                          - Post-rebuttal score form (collapsed by default, expandable):
                              - Score: number input 1–10
                              - Recommendation: select (accept / borderline / reject)
                              - Comment: textarea
                              - "Update Score" button
phase === "finalized" → show locked read-only RebuttalPanel, show submitted post-rebuttal score if any
```

**Mark all as read** implementation:
```typescript
async function handleMarkAllRead() {
  const unacked = data.points.filter(
    p => p.reviewerId === assignmentId && !p.reviewerAcknowledgment?.acknowledged
  )
  for (const point of unacked) {
    await acknowledgePoint(conferenceId, assignmentId, point.id, "addressed")
  }
  await load()
}
```

- [ ] **Step 3: Test in browser**

Navigate to a reviewer's assigned submission and open the Rebuttal tab. Verify:
- Before author submits: "Author hasn't submitted yet" message
- After author submits: full rebuttal view with ack buttons + post-score form
- After finalizing: read-only view

---

## Final Verification

- [ ] **Run all backend tests**

```bash
cd backend && make test
```

Expected: all tests pass.

- [ ] **Run all frontend tests**

```bash
cd frontend && npm run test:run
```

Expected: no failures.

- [ ] **Run frontend lint**

```bash
cd frontend && npm run lint
```

Expected: no errors.

- [ ] **Manual end-to-end walkthrough**

1. Chair saves rebuttal settings (deadline, char limits, discussion enabled)
2. Chair opens rebuttal → all submissions move to `awaiting`
3. Author submits rebuttal → blocked if over char limit; locked after submit
4. Reviewer acknowledges points + updates post-rebuttal score
5. Chair opens discussion phase
6. Chair finalizes → all locked
7. Verify notifications received for each step
8. Let deadline pass → verify cron auto-finalizes

---

## Dependency Graph

```
Task 1 (migration)
  ├── Task 2 (models + DTOs)
  │     ├── Task 3 (storage)
  │     │     ├── Task 4 (controllers + routes)
  │     │     │     ├── Task 5 (validation hardening)
  │     │     │     ├── Task 6 (notifications)
  │     │     │     └── Task 7 (cron)
  │     │     └── Task 8 (chair settings UI)  ← needs API
  │     │           └── Task 9 (chair management UI)
  │     └── Task 10 (author tab)  ← needs API + backend guards
  │           └── Task 11 (reviewer tab)
```

Tasks 4, 5, 6, 7 can run in parallel after Task 3.
Tasks 8, 9 can run in parallel with Tasks 5–7.
Tasks 10, 11 can run after Tasks 4–5 are done.

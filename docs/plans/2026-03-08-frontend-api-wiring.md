# Frontend API Wiring + Rebuttal Per-Point Enrichment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the three backend-blocked frontend features (BR-001 stats, BR-003 camera-ready, BR-004 rebuttal) to live backend endpoints, including enriching the rebuttal backend with a per-point tracking table.

**Architecture:** BR-001 and BR-003 are pure frontend wiring (map API responses, implement stubs). BR-004 requires a new `rebuttal_points` DB table (migration 000031), three new backend endpoints, a new `lib/api/rebuttal.ts` module, and replacing mock data in two React tabs.

**Tech Stack:** Go 1.24 (backend), Next.js 15 / TypeScript (frontend), PostgreSQL (migration), `apiFetch` client utility, Gin handler pattern.

---

## Task 1: BR-001 — Wire Conference Stats API

**Files:**
- Modify: `frontend/lib/api/conferences.ts`
- Modify: `frontend/components/chair/conference-detail/conference-detail-dashboard.tsx`

**Step 1: Uncomment and implement `getConferenceStats()` in `conferences.ts`**

Find the `getConferenceStats` function (search for `TODO: Implement when backend stats endpoint`). Replace the entire function body with:

```typescript
export async function getConferenceStats(
  conferenceId: string,
): Promise<ApiResponse<ConferenceStats>> {
  try {
    const { data, response } = await apiFetch<{
      data: {
        submissions: {
          total: number
          draft: number
          submitted: number
          accepted: number
          rejected: number
        }
        reviews: {
          total_assigned: number
          completed: number
          pending: number
        }
        tracks: Array<{ name: string; submission_count: number; accepted_count: number }>
      }
    }>(`/api/v1/conferences/${conferenceId}/stats`)

    const backendStats = data.data
    const mapped: ConferenceStats = {
      total_submissions: backendStats.submissions.total,
      total_reviews: backendStats.reviews.total_assigned,
      avg_reviews_per_paper:
        backendStats.submissions.total > 0
          ? backendStats.reviews.total_assigned / backendStats.submissions.total
          : 0,
      acceptance_rate:
        backendStats.submissions.total > 0
          ? (backendStats.submissions.accepted / backendStats.submissions.total) * 100
          : 0,
      submissions_by_track: backendStats.tracks.map((t) => ({
        track: t.name,
        count: t.submission_count,
      })),
      submissions_over_time: [],
      review_progress: {
        completed: backendStats.reviews.completed,
        in_progress: 0,
        pending: backendStats.reviews.pending,
      },
      top_keywords: [],
    }

    return { data: mapped, error: null, status: response.status }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch conference stats",
      status: 500,
    }
  }
}
```

**Step 2: Replace derived stats in `conference-detail-dashboard.tsx` with `getConferenceStats()`**

The dashboard currently makes 3–4 separate API calls to derive stats. Replace the `loadDashboard` effect with:

```typescript
import { getConferenceById, getConferenceStats } from "@/lib/api/conferences"

// In the component, change stats state shape:
const [stats, setStats] = useState({
  totalSubmissions: 0,
  acceptedSubmissions: 0,
  reviewingSubmissions: 0,
  reviewProgress: { completed: 0, in_progress: 0, pending: 0 },
  acceptanceRate: 0,
  daysToSubmissionDeadline: 0,
})

// Replace the useEffect loadDashboard:
useEffect(() => {
  async function loadDashboard() {
    setLoading(true)
    setError(null)

    const [conferenceResponse, statsResponse] = await Promise.all([
      getConferenceById(conferenceId),
      getConferenceStats(conferenceId),
    ])

    if (conferenceResponse.error || !conferenceResponse.data) {
      setError(conferenceResponse.error || "Failed to load conference")
      setLoading(false)
      return
    }

    const conference = conferenceResponse.data
    const submissionDeadline = conference.submission_deadline
      ? new Date(conference.submission_deadline)
      : null
    const daysToSubmissionDeadline =
      submissionDeadline && !Number.isNaN(submissionDeadline.getTime())
        ? Math.ceil((submissionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0

    const s = statsResponse.data
    setStats({
      totalSubmissions: s?.total_submissions ?? 0,
      acceptedSubmissions: Math.round((s?.acceptance_rate ?? 0) / 100 * (s?.total_submissions ?? 0)),
      reviewingSubmissions: s?.review_progress.in_progress ?? 0,
      reviewProgress: s?.review_progress ?? { completed: 0, in_progress: 0, pending: 0 },
      acceptanceRate: s?.acceptance_rate ?? 0,
      daysToSubmissionDeadline,
    })
    setLoading(false)
  }
  void loadDashboard()
}, [conferenceId])
```

> Update any JSX references to `stats.*` that changed shape accordingly (e.g. `acceptanceRate` is now on state directly instead of computed inline).

**Step 3: Verify in browser**

Start frontend: `cd frontend && npm run dev`
Navigate to a conference chair view. Confirm the stats cards show real numbers (not zeros from the old mock).

---

## Task 2: BR-003 — Implement Camera-Ready API + Upload UI

**Files:**
- Modify: `frontend/lib/api/papers.ts`
- Modify: `frontend/lib/api/submissions.ts`
- Modify: `frontend/components/author/submission-detail/overview-tab.tsx`

**Step 1: Add `camera_ready` field to `Submission` type in `submissions.ts`**

Find the `Submission` interface. After the `cover_letter` field, add:

```typescript
camera_ready?: {
  filename: string
  original_name: string
  size: number
  mime_type: string
  path: string
}
```

**Step 2: Implement `submitCameraReady()` in `papers.ts`**

Replace the placeholder `submitCameraReady` function with:

```typescript
/**
 * Upload camera-ready version of an accepted paper
 * Backend: POST /api/v1/conferences/:conference_id/submissions/:submission_id/camera-ready
 */
export async function submitCameraReady(
  conferenceId: string,
  submissionId: string,
  file: File,
): Promise<{ data: import("@/lib/api/submissions").Submission | null; error: string | null }> {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/camera-ready`,
      {
        method: "POST",
        body: formData,
      },
    )

    return { data: data.data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to upload camera-ready file",
    }
  }
}
```

> Note: The existing function signature only had `(paperId, file)`. Update all callers to use `(conferenceId, submissionId, file)`.

**Step 3: Add `CameraReadySection` component and wire it in `overview-tab.tsx`**

At the end of `overview-tab.tsx`, before the final `export`, add:

```tsx
function CameraReadySection({
  submission,
  conferenceId,
  onUploaded,
}: {
  submission: Submission
  conferenceId: string
  onUploaded: (updated: Submission) => void
}) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const { submitCameraReady } = await import("@/lib/api/papers")
    const result = await submitCameraReady(conferenceId, submission.id.toString(), file)
    setUploading(false)
    if (result.error || !result.data) {
      setError(result.error ?? "Upload failed")
    } else {
      onUploaded(result.data)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-4 tracking-tight">
        Camera-Ready Version
      </h3>
      {submission.camera_ready ? (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-600">
            <span className="material-symbols-outlined">picture_as_pdf</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-800">{submission.camera_ready.original_name}</p>
            <p className="text-xs text-slate-500">
              {(submission.camera_ready.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 mb-4">No camera-ready version uploaded yet.</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs px-3 py-1.5 rounded-lg bg-[#1B3C53] text-white hover:bg-[#1B3C53]/90 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : submission.camera_ready ? "Replace File" : "Upload PDF"}
      </button>
    </div>
  )
}
```

Add `useRef` to the imports at the top.

Then in the `OverviewTab` component props, check `submission.status === "accepted"` and render `<CameraReadySection>` if true:

```tsx
// Inside the return JSX, after the existing SubmissionFilesCard:
{submission.status === "accepted" && (
  <CameraReadySection
    submission={localSubmission}
    conferenceId={conferenceId}
    onUploaded={(updated) => setLocalSubmission(updated)}
  />
)}
```

> Add `const [localSubmission, setLocalSubmission] = useState(submission)` at the top of `OverviewTab` and use `localSubmission` wherever the component currently uses `submission`.

**Step 4: Verify in browser**

Navigate to an accepted paper's submission detail. Confirm the "Camera-Ready Version" card appears, PDF upload works, and the filename shows after upload.

---

## Task 3: BR-004 Backend — Migration for `rebuttal_points` Table

**Files:**
- Create: `backend/migrations/000031_add_rebuttal_points_table.up.sql`
- Create: `backend/migrations/000031_add_rebuttal_points_table.down.sql`

**Step 1: Create up migration**

```sql
-- 000031_add_rebuttal_points_table.up.sql

CREATE TABLE rebuttal_points (
  id          BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  conference_id BIGINT NOT NULL,
  assignment_id BIGINT NOT NULL,
  point_id    VARCHAR(100) NOT NULL,
  category    VARCHAR(50),
  section     VARCHAR(100),
  original_comment TEXT,
  author_response  TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'pending_review',
  reviewer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer_note TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, point_id)
);

-- Remove the now-redundant JSONB column (points table replaces it)
ALTER TABLE paper_assignments
  DROP COLUMN IF EXISTS rebuttal_response;
```

**Step 2: Create down migration**

```sql
-- 000031_add_rebuttal_points_table.down.sql

DROP TABLE IF EXISTS rebuttal_points;

ALTER TABLE paper_assignments
  ADD COLUMN IF NOT EXISTS rebuttal_response JSONB;
```

**Step 3: Run migration**

```bash
cd backend && make migrate-up
```

Expected: `31/u add_rebuttal_points_table`

---

## Task 4: BR-004 Backend — Rebuttal Point DTOs + Model

**Files:**
- Modify: `backend/internal/dto/assignment.go`
- Create: `backend/internal/model/rebuttal_point.go`

**Step 1: Add `RebuttalPoint` model in new file `backend/internal/model/rebuttal_point.go`**

```go
package model

import "time"

const RebuttalPointTableName = "rebuttal_points"

type RebuttalPoint struct {
	ID                   int64     `db:"id"`
	SubmissionID         int64     `db:"submission_id"`
	ConferenceID         int64     `db:"conference_id"`
	AssignmentID         int64     `db:"assignment_id"`
	PointID              string    `db:"point_id"`
	Category             string    `db:"category"`
	Section              string    `db:"section"`
	OriginalComment      string    `db:"original_comment"`
	AuthorResponse       string    `db:"author_response"`
	Status               string    `db:"status"`
	ReviewerAcknowledged bool      `db:"reviewer_acknowledged"`
	ReviewerNote         string    `db:"reviewer_note"`
	CreatedAt            time.Time `db:"created_at"`
	UpdatedAt            time.Time `db:"updated_at"`
}
```

**Step 2: Add rebuttal point DTOs to `backend/internal/dto/assignment.go`**

Append after the existing rebuttal DTOs (after `RebuttalStatusResponse`):

```go
// RebuttalPointDTO represents a single per-reviewer review point with author/reviewer responses.
type RebuttalPointDTO struct {
	PointID              string  `json:"point_id"`
	AssignmentID         int64   `json:"assignment_id"`
	Category             string  `json:"category"`
	Section              string  `json:"section"`
	OriginalComment      string  `json:"original_comment"`
	AuthorResponse       string  `json:"author_response"`
	Status               string  `json:"status"`
	ReviewerAcknowledged bool    `json:"reviewer_acknowledged"`
	ReviewerNote         string  `json:"reviewer_note,omitempty"`
}

// SubmitRebuttalPointInput is one point inside the PUT rebuttal request body.
type SubmitRebuttalPointInput struct {
	PointID         string `json:"point_id"`
	AssignmentID    int64  `json:"assignment_id"`
	Category        string `json:"category"`
	Section         string `json:"section"`
	OriginalComment string `json:"original_comment"`
	AuthorResponse  string `json:"author_response"`
}

// Update SubmitRebuttalRequest to include points (add Points field):
// NOTE: also update the existing SubmitRebuttalRequest struct definition to add:
//   Points []SubmitRebuttalPointInput `json:"points"`

// GetRebuttalRequest is the URI for GET .../rebuttal
type GetRebuttalRequest struct {
	ConferenceID int64 `uri:"conference_id" json:"conference_id"`
	SubmissionID int64 `uri:"submission_id" json:"submission_id"`
}

// GetRebuttalResponse is the full rebuttal state returned by GET .../rebuttal
type GetRebuttalResponse struct {
	Phase           string             `json:"phase"`
	GeneralResponse string             `json:"general_response"`
	SubmittedAt     *time.Time         `json:"submitted_at,omitempty"`
	Points          []RebuttalPointDTO `json:"points"`
}

// AcknowledgePointRequest is the URI + body for PUT .../rebuttal/points/:point_id/acknowledge
type AcknowledgePointRequest struct {
	ConferenceID int64  `uri:"conference_id" json:"conference_id"`
	AssignmentID int64  `uri:"assignment_id" json:"assignment_id"`
	PointID      string `uri:"point_id" json:"point_id"`
	Status       string `json:"status" binding:"required,oneof=addressed partially_addressed not_addressed pending_review"`
	Note         string `json:"note"`
}
```

Also update `SubmitRebuttalRequest` to add the `Points` field:

```go
// Find the existing SubmitRebuttalRequest struct and add:
Points []SubmitRebuttalPointInput `json:"points"`
```

**Step 3: Verify compilation**

```bash
cd backend && go build ./...
```

Expected: no errors.

---

## Task 5: BR-004 Backend — Rebuttal Point Storage

**Files:**
- Create: `backend/internal/storage/rebuttal/rebuttal.go`
- Modify: `backend/internal/storage/storage.go`

**Step 1: Create `backend/internal/storage/rebuttal/rebuttal.go`**

```go
package rebuttal

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

type StorageInterface interface {
	UpsertPoints(ctx context.Context, points []model.RebuttalPoint) error
	GetBySubmission(ctx context.Context, submissionID int64) ([]dto.RebuttalPointDTO, error)
	AcknowledgePoint(ctx context.Context, submissionID int64, pointID string, status string, note string) error
}

type Storage struct {
	db *sql.DB
}

func New(db *sql.DB) *Storage {
	return &Storage{db: db}
}

// UpsertPoints inserts or updates all rebuttal points for a submission.
func (s *Storage) UpsertPoints(ctx context.Context, points []model.RebuttalPoint) error {
	if len(points) == 0 {
		return nil
	}
	for _, p := range points {
		_, err := s.db.ExecContext(ctx, `
			INSERT INTO rebuttal_points
			  (submission_id, conference_id, assignment_id, point_id, category, section,
			   original_comment, author_response, status, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_review',NOW())
			ON CONFLICT (submission_id, point_id) DO UPDATE
			  SET author_response = EXCLUDED.author_response,
			      category        = EXCLUDED.category,
			      section         = EXCLUDED.section,
			      original_comment= EXCLUDED.original_comment,
			      updated_at      = NOW()
		`, p.SubmissionID, p.ConferenceID, p.AssignmentID, p.PointID,
			p.Category, p.Section, p.OriginalComment, p.AuthorResponse)
		if err != nil {
			return fmt.Errorf("upsert point %s: %w", p.PointID, err)
		}
	}
	return nil
}

// GetBySubmission returns all rebuttal points for a submission.
func (s *Storage) GetBySubmission(ctx context.Context, submissionID int64) ([]dto.RebuttalPointDTO, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT point_id, assignment_id, category, section, original_comment,
		       author_response, status, reviewer_acknowledged, reviewer_note
		FROM rebuttal_points
		WHERE submission_id = $1
		ORDER BY id
	`, submissionID)
	if err != nil {
		return nil, fmt.Errorf("get rebuttal points: %w", err)
	}
	defer rows.Close()

	var result []dto.RebuttalPointDTO
	for rows.Next() {
		var p dto.RebuttalPointDTO
		var note sql.NullString
		if err := rows.Scan(&p.PointID, &p.AssignmentID, &p.Category, &p.Section,
			&p.OriginalComment, &p.AuthorResponse, &p.Status, &p.ReviewerAcknowledged, &note); err != nil {
			return nil, err
		}
		p.ReviewerNote = note.String
		result = append(result, p)
	}
	if result == nil {
		result = []dto.RebuttalPointDTO{}
	}
	return result, nil
}

// AcknowledgePoint marks a single point as acknowledged by the reviewer.
func (s *Storage) AcknowledgePoint(ctx context.Context, submissionID int64, pointID string, status string, note string) error {
	now := time.Now()
	res, err := s.db.ExecContext(ctx, `
		UPDATE rebuttal_points
		SET reviewer_acknowledged = TRUE,
		    status = $1,
		    reviewer_note = $2,
		    updated_at = $3
		WHERE submission_id = $4 AND point_id = $5
	`, status, note, now, submissionID, pointID)
	if err != nil {
		return fmt.Errorf("acknowledge point: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("point not found: %s", pointID)
	}
	return nil
}
```

**Step 2: Add `RebuttalPoint` to `backend/internal/storage/storage.go`**

Add the import and field:

```go
// Add import:
rebuttalStorage "github.com/dcao/conferencespace/internal/storage/rebuttal"

// Add field to Storage struct:
RebuttalPoint rebuttalStorage.StorageInterface

// Add to NewStorage():
RebuttalPoint: rebuttalStorage.New(db),
```

**Step 3: Verify**

```bash
cd backend && go build ./...
```

---

## Task 6: BR-004 Backend — Rebuttal Controller Methods + Routes

**Files:**
- Modify: `backend/internal/controller/submission/submission.go`
- Modify: `backend/internal/controller/reviewer/reviewer.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Add `rebuttalStorage` to submission controller**

In `backend/internal/controller/submission/submission.go`, add to imports and struct:

```go
rebuttalStorage "github.com/dcao/conferencespace/internal/storage/rebuttal"

// Add to Controller struct:
rebuttalStorage rebuttalStorage.StorageInterface

// Add to New() and NewWithNotifications():
rebuttalStorage: store.RebuttalPoint,
```

**Step 2: Update `SubmitRebuttal` to upsert points**

Find the existing `SubmitRebuttal` method. After the `c.submissionStorage.SubmitRebuttal(...)` call, add:

```go
// Upsert per-point data
if len(req.Points) > 0 {
    modelPoints := make([]model.RebuttalPoint, 0, len(req.Points))
    for _, p := range req.Points {
        modelPoints = append(modelPoints, model.RebuttalPoint{
            SubmissionID:    req.SubmissionID,
            ConferenceID:    req.ConferenceID,
            AssignmentID:    p.AssignmentID,
            PointID:         p.PointID,
            Category:        p.Category,
            Section:         p.Section,
            OriginalComment: p.OriginalComment,
            AuthorResponse:  p.AuthorResponse,
        })
    }
    if err := c.rebuttalStorage.UpsertPoints(ctx, modelPoints); err != nil {
        return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
    }
}
```

**Step 3: Add `GetRebuttal` controller method to submission controller**

Append at the end of `submission.go`:

```go
// GetRebuttal godoc
// @Summary      Get rebuttal state for a submission
// @Description  Returns rebuttal phase, general response, and per-point data
// @Tags         submissions
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        submission_id path int true "Submission ID"
// @Success      200 {object} dto.GetRebuttalResponse
// @Router       /conferences/{conference_id}/submissions/{submission_id}/rebuttal [get]
func (c *Controller) GetRebuttal(ginCtx *gin.Context, req *dto.GetRebuttalRequest) (*dto.GetRebuttalResponse, error) {
	ctx := ginCtx.Request.Context()

	sub, err := c.submissionStorage.GetByID(ctx, req.SubmissionID)
	if err != nil || sub.ConferenceID != req.ConferenceID {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "submission not found")
	}

	points, err := c.rebuttalStorage.GetBySubmission(ctx, req.SubmissionID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	generalResponse := ""
	if sub.RebuttalGeneralResponse != nil {
		generalResponse = *sub.RebuttalGeneralResponse
	}

	return &dto.GetRebuttalResponse{
		Phase:           sub.RebuttalPhase,
		GeneralResponse: generalResponse,
		SubmittedAt:     sub.UpdatedAt, // approximate; use rebuttal_submitted_at if needed
		Points:          points,
	}, nil
}
```

> `GetRebuttalResponse.SubmittedAt` takes `*time.Time`. The `sub.UpdatedAt` is a `time.Time`, so pass `&sub.UpdatedAt` or add a `rebuttal_submitted_at` field to the DTO if you want precision.

**Step 4: Add `AcknowledgePoint` to reviewer controller**

In `backend/internal/controller/reviewer/reviewer.go`, add `rebuttalStorage` field (same pattern as step 1). Then append:

```go
// AcknowledgePoint godoc
// @Summary      Acknowledge a specific rebuttal point
// @Description  Reviewer marks one review point as addressed/not-addressed with optional note (idempotent)
// @Tags         assignments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        conference_id path int true "Conference ID"
// @Param        assignment_id path int true "Assignment ID"
// @Param        point_id path string true "Point ID"
// @Param        request body dto.AcknowledgePointRequest true "Status and note"
// @Success      200 {object} handler.Response
// @Router       /conferences/{conference_id}/assignments/{assignment_id}/rebuttal/points/{point_id}/acknowledge [put]
func (c *Controller) AcknowledgePoint(ginCtx *gin.Context, req *dto.AcknowledgePointRequest) (*map[string]string, error) {
	ctx := ginCtx.Request.Context()

	_, exists := utils.GetEmail(ginCtx)
	if !exists {
		return nil, handler.NewErrorResponse(http.StatusUnauthorized, "user not authenticated")
	}

	// Resolve submissionID from assignment
	assignment, err := c.assignmentStorage.GetByID(ctx, req.AssignmentID)
	if err != nil {
		return nil, handler.NewErrorResponse(http.StatusNotFound, "assignment not found")
	}

	if err := c.rebuttalStorage.AcknowledgePoint(ctx, assignment.SubmissionID, req.PointID, req.Status, req.Note); err != nil {
		return nil, handler.NewErrorResponse(http.StatusInternalServerError, err.Error())
	}

	result := map[string]string{"status": "acknowledged"}
	return &result, nil
}
```

Add `rebuttalStorage` to reviewer controller struct/New/NewWithNotifications (same as submission controller pattern).

**Step 5: Register new routes in `main.go`**

Find the submissions group and add:
```go
submissions.GET("/:submission_id/rebuttal", handler.HandleRequestWithURI(ctrl.Submission.GetRebuttal))
```

Find the assignments group and add:
```go
assignments.PUT("/:assignment_id/rebuttal/points/:point_id/acknowledge", handler.HandleRequestWithAll(ctrl.Reviewer.AcknowledgePoint))
```

**Step 6: Build and verify**

```bash
cd backend && go build ./... && make test
```

Expected: all existing tests pass, no compile errors.

---

## Task 7: BR-004 Frontend — New `lib/api/rebuttal.ts`

**Files:**
- Create: `frontend/lib/api/rebuttal.ts`

**Step 1: Create `frontend/lib/api/rebuttal.ts`**

```typescript
import { apiFetch } from "./client"
import type {
  RebuttalSettings,
  ReviewerInfo,
  RebuttalPoint,
  RebuttalSubmission,
  RebuttalSubmissionData,
  ResponseStatus,
} from "@/components/shared/rebuttal/types"

// Backend response shape
interface BackendRebuttalPoint {
  point_id: string
  assignment_id: number
  category: string
  section: string
  original_comment: string
  author_response: string
  status: ResponseStatus
  reviewer_acknowledged: boolean
  reviewer_note: string
}

interface BackendGetRebuttalResponse {
  phase: string
  general_response: string
  submitted_at: string | null
  points: BackendRebuttalPoint[]
}

export interface RebuttalPanelData {
  settings: RebuttalSettings
  points: RebuttalPoint[]
  submission: RebuttalSubmission | null
}

/**
 * Fetch the rebuttal state for a submission and map to RebuttalPanel props.
 * Backend: GET /api/v1/conferences/:id/submissions/:id/rebuttal
 */
export async function getRebuttal(
  conferenceId: string,
  submissionId: string,
): Promise<{ data: RebuttalPanelData | null; error: string | null }> {
  try {
    const { data } = await apiFetch<{ data: BackendGetRebuttalResponse }>(
      `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/rebuttal`,
    )
    const backend = data.data

    const settings: RebuttalSettings = {
      phase: (backend.phase as RebuttalSettings["phase"]) || "awaiting",
      deadline: "",
      daysRemaining: 0,
      characterLimitPerReview: 10000,
      allowRevisions: true,
      allowNewResults: true,
      requireResponseToAll: false,
    }

    const points: RebuttalPoint[] = backend.points.map((p) => ({
      id: p.point_id,
      reviewerId: String(p.assignment_id),
      category: p.category as RebuttalPoint["category"],
      section: p.section,
      originalComment: p.original_comment,
      authorResponse: p.author_response || undefined,
      status: p.status,
      reviewerAcknowledgment: p.reviewer_acknowledged
        ? { acknowledged: true, note: p.reviewer_note || undefined }
        : undefined,
    }))

    const submission: RebuttalSubmission | null =
      backend.phase !== "awaiting"
        ? {
            id: submissionId,
            submittedAt: backend.submitted_at || "",
            generalResponse: {
              content: backend.general_response,
              wordCount: backend.general_response.split(" ").length,
            },
            perReviewerResponses: [],
            attachments: [],
          }
        : null

    return { data: { settings, points, submission }, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to load rebuttal",
    }
  }
}

/**
 * Author submits rebuttal general response + per-point responses.
 * Backend: PUT /api/v1/conferences/:id/submissions/:id/rebuttal
 */
export async function submitRebuttal(
  conferenceId: string,
  submissionId: string,
  data: RebuttalSubmissionData & {
    points: Array<{
      pointId: string
      assignmentId: number
      category: string
      section: string
      originalComment: string
      authorResponse: string
    }>
  },
): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/submissions/${submissionId}/rebuttal`, {
      method: "PUT",
      body: JSON.stringify({
        general_response: data.generalResponse,
        points: data.points.map((p) => ({
          point_id: p.pointId,
          assignment_id: p.assignmentId,
          category: p.category,
          section: p.section,
          original_comment: p.originalComment,
          author_response: p.authorResponse,
        })),
      }),
    })
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to submit rebuttal" }
  }
}

/**
 * Reviewer acknowledges a single rebuttal point.
 * Backend: PUT /api/v1/conferences/:id/assignments/:id/rebuttal/points/:point_id/acknowledge
 */
export async function acknowledgePoint(
  conferenceId: string,
  assignmentId: string,
  pointId: string,
  status: ResponseStatus,
  note?: string,
): Promise<{ error: string | null }> {
  try {
    await apiFetch(
      `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/rebuttal/points/${encodeURIComponent(pointId)}/acknowledge`,
      {
        method: "PUT",
        body: JSON.stringify({ status, note: note ?? "" }),
      },
    )
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to acknowledge point" }
  }
}
```

---

## Task 8: BR-004 Frontend — Wire Author Rebuttal Tab

**Files:**
- Modify: `frontend/components/author/submission-detail/rebuttal-tab.tsx`

**Step 1: Replace mock-based author rebuttal tab**

Replace the entire file content with:

```tsx
"use client"

import { useEffect, useState } from "react"
import { RebuttalPanel } from "@/components/shared/rebuttal"
import { getRebuttal, submitRebuttal } from "@/lib/api/rebuttal"
import type { RebuttalPanelData } from "@/lib/api/rebuttal"
import type { RebuttalSubmissionData } from "@/components/shared/rebuttal/types"

interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
}

export function RebuttalTab({ conferenceId, submissionId }: RebuttalTabProps) {
  const [data, setData] = useState<RebuttalPanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const result = await getRebuttal(conferenceId, submissionId)
    setLoading(false)
    if (result.error || !result.data) {
      setError(result.error ?? "Failed to load rebuttal")
    } else {
      setData(result.data)
    }
  }

  useEffect(() => {
    void load()
  }, [conferenceId, submissionId])

  async function handleSubmitRebuttal(formData: RebuttalSubmissionData) {
    setSubmitting(true)
    // Build points from current data — author fills responses via the panel's state
    const points = (data?.points ?? []).map((p) => ({
      pointId: p.id,
      assignmentId: Number(p.reviewerId),
      category: p.category,
      section: p.section ?? "",
      originalComment: p.originalComment,
      authorResponse: p.authorResponse ?? "",
    }))
    const result = await submitRebuttal(conferenceId, submissionId, { ...formData, points })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else {
      await load()
    }
  }

  if (loading) {
    return <div className="text-xs text-slate-500 py-4">Loading rebuttal…</div>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <RebuttalPanel
      settings={data.settings}
      reviewers={[]}
      points={data.points}
      submission={data.submission}
      userRole="author"
      onSubmitRebuttal={handleSubmitRebuttal}
      readOnly={submitting}
    />
  )
}
```

---

## Task 9: BR-004 Frontend — Wire Reviewer Rebuttal Tab

**Files:**
- Modify: `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`

**Step 1: Replace mock-based reviewer rebuttal tab**

Replace the entire file content with:

```tsx
"use client"

import { useEffect, useState } from "react"
import { RebuttalPanel } from "@/components/shared/rebuttal"
import { getRebuttal, acknowledgePoint } from "@/lib/api/rebuttal"
import type { RebuttalPanelData } from "@/lib/api/rebuttal"
import type { ResponseStatus } from "@/components/shared/rebuttal/types"

interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
  assignmentId: string
}

export function RebuttalTab({ conferenceId, submissionId, assignmentId }: RebuttalTabProps) {
  const [data, setData] = useState<RebuttalPanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const result = await getRebuttal(conferenceId, submissionId)
      setLoading(false)
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to load rebuttal")
      } else {
        setData(result.data)
      }
    }
    void load()
  }, [conferenceId, submissionId])

  async function handlePointStatusChange(pointId: string, status: ResponseStatus, note?: string) {
    const result = await acknowledgePoint(conferenceId, assignmentId, pointId, status, note)
    if (result.error) {
      setError(result.error)
    }
    // Optimistic update already applied by RebuttalPanel's internal state
  }

  if (loading) {
    return <div className="text-xs text-slate-500 py-4">Loading rebuttal…</div>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <RebuttalPanel
      settings={data.settings}
      reviewers={[]}
      points={data.points}
      submission={data.submission}
      userRole="reviewer"
      onPointStatusChange={handlePointStatusChange}
    />
  )
}
```

---

## Task 10: Verify Full Flow

**Step 1: Run backend tests**

```bash
cd backend && make test-api
```

Expected: all existing tests pass.

**Step 2: Run frontend lint + build**

```bash
cd frontend && npm run lint && npm run build
```

Expected: no errors.

**Step 3: Manual smoke test — Stats**

1. Log in as chair, open a conference dashboard
2. Confirm stat cards show real counts (not zeros)

**Step 4: Manual smoke test — Camera-Ready**

1. Log in as author, open an accepted paper's submission detail
2. Confirm "Camera-Ready Version" card appears
3. Upload a PDF, confirm the filename appears

**Step 5: Manual smoke test — Rebuttal**

1. As author: open a submission in a conference with submitted reviews → Rebuttal tab shows
2. Submit a rebuttal response → confirm no amber warning, success reload
3. As reviewer: open the same submission → Rebuttal tab shows author response
4. Click "Addressed" on a point → confirm status updates visually

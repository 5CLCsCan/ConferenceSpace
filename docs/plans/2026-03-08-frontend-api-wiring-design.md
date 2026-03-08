# Frontend API Wiring Design

**Date:** 2026-03-08
**Goal:** Wire the three previously backend-blocked frontend features (BR-001 stats, BR-003 camera-ready, BR-004 rebuttal) to their new backend endpoints, including enriching the rebuttal backend with per-point tracking.

---

## Scope

Three features, executed in dependency order:

| Feature | Backend work | Frontend work |
|---------|-------------|---------------|
| BR-001 Conference Stats | None (endpoint exists) | Map response → `ConferenceStats` type, uncomment API call |
| BR-003 Camera-Ready | None (endpoint exists) | Implement `submitCameraReady()`, add upload UI |
| BR-004 Rebuttal Per-Point | New table + 3 endpoints | New `rebuttal.ts` API module, wire both tabs |

---

## Architecture

### BR-001: Conference Stats

No backend changes. `getConferenceStats()` in `lib/api/conferences.ts` already has the real call commented out. Uncomment it and map:

| Backend field | Frontend `ConferenceStats` field |
|---|---|
| `submissions.total` | `total_submissions` |
| `reviews.total_assigned` | `total_reviews` |
| `reviews.completed / total_assigned` | `avg_reviews_per_paper` |
| `submissions.accepted / submissions.total` | `acceptance_rate` |
| `tracks[].{name, submission_count}` | `submissions_by_track` |
| `reviews.{completed, pending}` | `review_progress` |
| *(no equivalent)* | `submissions_over_time: []`, `top_keywords: []` |

`conference-detail-dashboard.tsx` already calls `getConferenceStats()` — no component changes needed.

---

### BR-003: Camera-Ready

No backend changes. Endpoints already exist:
- `POST /api/v1/conferences/:id/submissions/:id/camera-ready` — multipart upload
- `GET /api/v1/conferences/:id/submissions/:id/camera-ready` — download

**Frontend changes:**
1. `lib/api/papers.ts` — implement `submitCameraReady(conferenceId, submissionId, file)` using `FormData` + fetch, return `Submission` with `camera_ready` metadata
2. `lib/api/papers.ts` — add `getCameraReady(conferenceId, submissionId)` returning download URL
3. `components/author/submission-detail/overview-tab.tsx` — add camera-ready upload section: file picker, upload button, show existing filename if already uploaded

---

### BR-004: Rebuttal Per-Point

#### Backend (migration + 3 new endpoints)

**Migration 000031** — new `rebuttal_points` table:

```sql
CREATE TABLE rebuttal_points (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES conference_submissions(submission_id),
  conference_id BIGINT NOT NULL,
  assignment_id BIGINT NOT NULL REFERENCES paper_assignments(id),
  point_id VARCHAR(100) NOT NULL,        -- client-assigned ID
  category VARCHAR(50),                  -- weakness|question|clarification|suggestion
  section VARCHAR(100),                  -- e.g. "Weaknesses"
  original_comment TEXT,
  author_response TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
  reviewer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, point_id)
);
```

Also drop `rebuttal_response` JSONB from `paper_assignments` (replaced by this table).

**New endpoints:**

```
PUT  /api/v1/conferences/:conference_id/submissions/:submission_id/rebuttal
  Auth: submission author
  Body: { general_response, points: [{point_id, assignment_id, category, section, original_comment, author_response}] }
  Effect: sets rebuttal_phase='submitted', upserts all points

GET  /api/v1/conferences/:conference_id/submissions/:submission_id/rebuttal
  Auth: author | reviewer assigned to submission | chair
  Response: { phase, general_response, points: [...] }

PUT  /api/v1/conferences/:conference_id/assignments/:assignment_id/rebuttal/points/:point_id/acknowledge
  Auth: reviewer of that assignment
  Body: { status, note? }
  Effect: updates point reviewer_acknowledged=true, status, reviewer_note (idempotent)
```

**GET rebuttal response shape:**
```json
{
  "phase": "submitted",
  "general_response": "We thank reviewers...",
  "submitted_at": "2026-03-08T...",
  "points": [
    {
      "point_id": "p1",
      "assignment_id": 42,
      "category": "weakness",
      "section": "Weaknesses",
      "original_comment": "The ablation study...",
      "author_response": "We address this...",
      "status": "pending_review",
      "reviewer_acknowledged": false,
      "reviewer_note": null
    }
  ]
}
```

#### Frontend

1. **`lib/api/rebuttal.ts`** (new file):
   - `getRebuttal(conferenceId, submissionId)` — fetches + maps to `RebuttalPanelProps`
   - `submitRebuttal(conferenceId, submissionId, data: RebuttalSubmissionData)` — PUT
   - `acknowledgePoint(conferenceId, assignmentId, pointId, status, note?)` — PUT

2. **`components/author/submission-detail/rebuttal-tab.tsx`**:
   - Replace `MOCK_*` imports with `useEffect` → `getRebuttal()`
   - Wire `onSubmitRebuttal` → `submitRebuttal()`
   - Remove `readOnly` prop and amber warning banner
   - Show loading/error states

3. **`components/reviewer/submission-review/rebuttal-tab.tsx`**:
   - Replace `MOCK_*` imports with `useEffect` → `getRebuttal()`
   - Wire `onPointStatusChange` → `acknowledgePoint()`
   - Remove `readOnly` prop and amber warning banner
   - Show loading/error states

---

## Data Flow

```
Author tab:
  mount → getRebuttal() → populate RebuttalPanel
  onSubmitRebuttal → submitRebuttal() → refetch → update panel

Reviewer tab:
  mount → getRebuttal() → populate RebuttalPanel (reviewer role)
  onPointStatusChange → acknowledgePoint() → optimistic update point status
```

---

## Out of Scope

- Score updates after rebuttal (reviewer updating scores post-rebuttal) — `review_score` exists on assignment but no dedicated endpoint; deferred
- Attachment upload for rebuttal — `RebuttalAttachment[]` in UI types but no backend; deferred
- Anonymous reviewer ID mapping — frontend shows real reviewer info for now; anonymization deferred

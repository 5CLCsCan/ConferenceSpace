# Reviewer Assignment Suggestions Design

## Overview

Transform the current automatic reviewer assignment flow from immediate execution to a suggestion-based workflow where the chair can review, modify, and confirm assignments before they become active.

## Requirements

- Chair can view auto-generated assignment suggestions at the individual paper level
- Suggestions are persisted to the database (chair can leave and return later)
- COI warnings shown when chair manually adds a reviewer with potential conflicts (overridable)
- Reviewers are notified when chair confirms suggestions
- Auto-assign only runs for papers without confirmed assignments

## Approach

Add a new `suggested` status to the existing `paper_assignments` table. Suggestions remain invisible to reviewers until confirmed by the chair.

## Data Model

### Status Flow

```
[suggested] --> [pending] --> [accepted/declined] --> [completed]
     |               |
     v               v
  (deleted)      (deleted by chair removes suggestion)
```

- `suggested`: Auto-generated, not visible to reviewers, editable by chair
- `pending`: Confirmed by chair, visible to reviewers, awaiting response
- `accepted`: Reviewer accepted the assignment
- `declined`: Reviewer declined
- `completed`: Review submitted

### Schema Migration

```sql
ALTER TABLE paper_assignments
DROP CONSTRAINT IF EXISTS chk_status;

ALTER TABLE paper_assignments
ADD CONSTRAINT chk_status CHECK (
  status IN ('suggested', 'pending', 'accepted', 'declined', 'completed')
);
```

### Query Impact

All existing queries fetching assignments for reviewers must filter `status != 'suggested'`:
- `GetByReviewerID` - exclude suggested
- `GetBySubmissionID` - parameter to include/exclude suggested based on caller

## API Changes

### Modified Endpoints

**1. `POST /v1/conferences/{conference_id}/submissions/auto-assign`**

- Remove `dry_run` parameter
- Only processes papers with no confirmed assignments
- Creates assignments with `status='suggested'`
- Does NOT send notifications
- Does NOT update submission status

### New Endpoints

**2. `GET /v1/conferences/{conference_id}/assignments/suggestions`**

Returns suggested assignments grouped by paper.

```json
{
  "suggestions": [
    {
      "submission_id": 123,
      "submission_title": "Paper Title",
      "reviewers": [
        {"assignment_id": 1, "reviewer_id": 10, "reviewer_email": "...", "score": 0.85}
      ]
    }
  ],
  "total_papers": 15,
  "total_suggestions": 45
}
```

**3. `POST /v1/conferences/{conference_id}/assignments/suggestions/confirm`**

Confirms suggestions: changes status to `pending`, sends notifications, updates submission status.

```json
{
  "assignment_ids": [1, 2, 3]  // optional - if omitted, confirms all
}
```

**4. `DELETE /v1/conferences/{conference_id}/assignments/suggestions/{assignment_id}`**

Removes a suggested assignment. Only works for `status='suggested'`.

**5. `POST /v1/conferences/{conference_id}/assignments/suggestions`**

Manually add a suggested reviewer with COI check.

Request:
```json
{
  "submission_id": 123,
  "reviewer_id": 10
}
```

Response:
```json
{
  "assignment": {...},
  "coi_warning": {
    "has_conflict": true,
    "reasons": ["Co-authored paper in 2023"]
  }
}
```

**6. `GET /v1/conferences/{conference_id}/submissions/{submission_id}/coi-check?reviewer_id=10`**

Check COI for a reviewer-paper pair before adding.

## Frontend UI

### New Page: Assignment Review Dashboard

**Route:** `/role/chair/conferences/[conferenceId]/assignments`

### State A: No Suggestions

Configuration form with:
- Min/max reviewers per paper
- Max papers per reviewer
- Min similarity score threshold
- "Generate Suggestions" button

Shows count of papers awaiting assignment and available reviewers.

### State B: Reviewing Suggestions

List of papers with suggested reviewers:
- Each paper shows title, author, and assigned reviewers with scores
- Remove button (x) on each reviewer
- "Add Reviewer" button per paper
- "Confirm All" button in header

### Add Reviewer Modal

- Searchable list of available reviewers
- Shows similarity score for each
- COI warning badge on conflicted reviewers
- Warning message with conflict details
- "Add Anyway" button to override COI warning

### Navigation

- Chair Actions Panel "Assign Reviewers" button links to this page

## Workflow

1. Chair opens Assignment page
2. If no suggestions exist, show config form
3. Chair clicks "Generate Suggestions" -> POST auto-assign
4. Chair reviews suggestions list
   - Remove reviewers via DELETE endpoint
   - Add reviewers via POST with COI check
5. Chair clicks "Confirm All" -> POST confirm
   - Status changes: suggested -> pending
   - Notifications sent to reviewers
   - Submission status updated to "reviewing"

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Chair leaves mid-editing | Suggestions persist, chair returns later |
| Chair re-runs auto-assign | Only generates for unassigned papers; replaces existing suggestions |
| Reviewer already confirmed for paper | Auto-assign skips that pair |
| All reviewers have COI with paper | Paper in "unassigned_papers" response list |

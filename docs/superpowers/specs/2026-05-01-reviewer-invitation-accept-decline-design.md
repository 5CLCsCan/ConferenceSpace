# Reviewer Paper Invitation: Accept/Decline with Persuasive Evidence

**Date:** 2026-05-01
**Status:** Approved

## Overview

Add an explicit accept/decline step for paper review assignments. When a reviewer receives a paper assignment, they see a dedicated invitation page with persuasive evidence (strengths only) explaining why they're a great match. The reviewer can accept (unlocking the review form) or decline (with optional reason via chip suggestions + free text).

## Design Decisions

- **Persuasion-only evidence**: Show only strengths — matched keywords, score (if >= 50%), manageable load. No gaps or weaknesses exposed.
- **Score threshold**: Fixed at 50%. Scores below this are hidden entirely.
- **Decline reason**: Optional. UI uses small chip suggestions ("Not my expertise", "Too busy", "Schedule conflict", "Conflict of interest", "Other") above a free text box. Clicking a chip fills the text box with that text; reviewer can edit or add detail.
- **Dedicated invitation page**: New route `/role/reviewer/invitations/[assignmentId]` with clear accept/decline decision moment.
- **Legacy/manual assignments**: When metadata is null, show graceful fallback: "You were selected by the program committee based on your expertise and research background."
- **Access control**: Reviewers with `pending` status are blocked from the review form and redirected to the invitation page.

## Data Model Changes

### Migration: paper_assignments

```sql
ALTER TABLE paper_assignments
  ADD COLUMN decline_reason TEXT DEFAULT NULL,
  ADD COLUMN decline_category VARCHAR(50) DEFAULT NULL,
  ADD COLUMN responded_at TIMESTAMP DEFAULT NULL;
```

`decline_category` values: `not_my_expertise`, `too_busy`, `schedule_conflict`, `conflict_of_interest`, `other`, or `NULL`.

`responded_at` is set when the reviewer accepts or declines.

## API Changes

### New: GET /api/v1/reviewer/{email}/assignments/{assignmentId}/invitation

Returns persuasive evidence for the reviewer's decision. Filters to show only positive signals.

**Response:**
```json
{
  "assignment_id": 42,
  "status": "pending",
  "paper_title": "Transformer Architectures for Low-Resource NLP Tasks",
  "paper_abstract": "This paper proposes...",
  "conference_name": "ICML 2026",
  "evidence": {
    "matched_keywords": ["NLP", "transformers", "attention"],
    "score": 0.72,
    "assignment_count": 2
  }
}
```

- `score` is `null` if < 0.5 (hidden from UI).
- `matched_keywords` may be empty (still show the card with fallback text).
- If metadata is null entirely, `evidence` contains only `assignment_count`.

### New: PUT /api/v1/reviewer/{email}/assignments/{assignmentId}/respond

Reviewer accepts or declines the assignment.

**Request:**
```json
{
  "action": "accept",
  "decline_category": null,
  "decline_reason": null
}
```

Or for decline:
```json
{
  "action": "decline",
  "decline_category": "too_busy",
  "decline_reason": "Too busy"
}
```

All decline fields are optional — reviewer can decline with no reason.

**Response:**
```json
{
  "assignment_id": 42,
  "status": "accepted",
  "message": "Assignment accepted successfully"
}
```

**Validation:**
- Assignment must belong to the reviewer (email check).
- Assignment must be in `pending` status.
- `action` must be `accept` or `decline`.

**Side effects:**
- Accept: status → `accepted`, `responded_at` = now.
- Decline: status → `declined`, `responded_at` = now, `decline_category` and `decline_reason` saved if provided.
- Both: notification sent to all conference chairs (matching existing notification pattern).

### Modified: Review form access guard

- `pending` status: return 403 with redirect hint to invitation page.
- `accepted` or `completed`: allow access to review form.
- `declined`: return 403 with message "Assignment was declined".

### Modified: Notification action URL

When chair confirms suggestions and notifications are sent to reviewers, the `action_url` changes from `/role/reviewer/assignments/{id}` to `/role/reviewer/invitations/{id}`.

## New Notification Types

### assignment_accepted (to chair)

- Title: "Assignment Accepted"
- Message: "{reviewer_email} accepted the assignment to review '{paper_title}'"
- Action URL: `/role/chair/conferences/{conferenceId}` (assignments tab)

### assignment_declined (to chair)

- Title: "Assignment Declined"
- Message: "{reviewer_email} declined the assignment to review '{paper_title}'"
- Metadata includes `decline_category` and `decline_reason` if provided.
- Action URL: `/role/chair/conferences/{conferenceId}` (assignments tab)

## Frontend Conventions

The invitation page must follow the existing scholar-compact design language. Reference `frontend/.steerings/insights.md` and `frontend/.steerings/sizings.md`. Key patterns:
- White backgrounds, `slate-200` borders, `rounded-xl` cards with `shadow-sm`
- Primary color `#1B3C53` for headings and action buttons
- Typography: `text-sm font-bold` for titles, `text-xs` for body, `text-[10px]` for meta
- Button tiers: primary (`bg-[#1B3C53]`), secondary (border outline), utility (text-only)
- Follow the existing `reviewer-invitations.tsx` component patterns for card layout and status badges
- Material Symbols for icons

## Frontend Changes

### New page: /role/reviewer/invitations/[assignmentId]

**Pending state:**
- Conference name (small, above title)
- "You've been invited to review" heading
- Paper title
- Paper abstract in a card
- Evidence card: "Why you're a great match"
  - Match strength bar + percentage (only if score >= 50%)
  - Matched keyword chips (green)
  - Current review load: "N papers assigned"
  - Fallback text when no metadata
- Accept button (green) and Decline button (red outline)

**After accept:**
- Green checkmark, "Invitation Accepted" message, "Go to Review" button linking to review form.

**After decline (dialog):**
- "Decline this review?" heading
- Chip suggestions above text box: "Not my expertise", "Too busy", "Schedule conflict", "Conflict of interest", "Other"
- Clicking a chip fills the text box; reviewer can edit
- "Go Back" and "Confirm Decline" buttons
- After confirming: "Invitation Declined" message, "Back to Dashboard" button

### Updated: Reviewer paper list

Papers with `pending` status show:
- Yellow "PENDING INVITATION" badge
- Green "View Invitation" button linking to invitation page

Papers with `declined` status show:
- Red "DECLINED" badge
- Dimmed row (opacity)

Papers with `accepted` status show as before with "Continue Review" button.

### Updated: Chair assignments view

Declined assignments visible in chair's view with:
- Reviewer email
- "Declined" status badge
- Decline reason (or "No reason given" in italic)

## Testing

### Backend unit tests
- Respond endpoint: accept flow, decline with reason, decline without reason
- Validation: wrong status, wrong reviewer, invalid action
- Evidence filtering: score >= 50% shown, score < 50% hidden, null metadata handling
- Access guard: pending blocked, accepted allowed, declined blocked

### Frontend unit tests
- Evidence card: full metadata, score hidden, no metadata fallback
- Decline dialog: chip click fills text box, empty submission, chip toggle
- Post-action states: accepted redirect, declined confirmation

### API integration tests
- Full accept flow: create suggestion → confirm → get invitation → accept → verify review access
- Full decline flow: create suggestion → confirm → decline with reason → verify chair notification
- Edge cases: double respond, respond to wrong assignment

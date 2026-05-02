# External User Invitation via Semantic Scholar

**Date:** 2026-05-02
**Branch:** invite-external-user
**Status:** Approved

## Problem

The committee/reviewer invitation flow only searches internal platform users. Chairs cannot discover or invite external researchers who aren't on ConferenceSpace yet. The reviewer suggestions tab shows external Semantic Scholar authors but the invite button is disabled for them.

## Scope

**In scope:**
- Extend invitation search to include Semantic Scholar results alongside platform users
- New `external_invitations` table to persist external invitations
- Enable inviting external users from both the search flow and the suggestions tab
- Show external invitations in the committee members table

**Out of scope:**
- Sending emails to external invitees (future PR)
- Auto-creating user accounts for external invitees

## Design

### Database Schema

New `external_invitations` table:

```sql
CREATE TABLE external_invitations (
    id              SERIAL PRIMARY KEY,
    conference_id   INTEGER NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    scholar_id      VARCHAR(50),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    affiliation     VARCHAR(500),
    profile_url     VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    invited_by      INTEGER NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(conference_id, scholar_id)
);
```

- `role`: "pc" or "reviewer"
- `email`: nullable (Semantic Scholar often lacks emails)
- `scholar_id` + `conference_id` uniqueness prevents duplicate invites
- `status`: defaults to "pending" (used later when email flow is built)

### Backend Architecture

New entity following clean architecture:

```
backend/internal/
├── model/external_invitation.go
├── dto/external_invitation.go
├── storage/external_invitation/external_invitation.go
├── controller/external_invitation/external_invitation.go
```

Note: No service layer needed — following the same pattern as the `reviewer` entity where the controller talks directly to storage.

**Endpoints:**

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/conferences/:conference_id/external-invitations` | Chair | Create external invitation(s) |
| `GET` | `/api/v1/conferences/:conference_id/external-invitations` | Chair | List external invitations (paginated, role filter) |
| `DELETE` | `/api/v1/conferences/:conference_id/external-invitations/:id` | Chair | Remove an external invitation |

**POST request body:**

```json
{
  "invitations": [
    {
      "role": "reviewer",
      "scholar_id": "12345",
      "name": "Jane Doe",
      "email": "jane@university.edu",
      "affiliation": "MIT",
      "profile_url": "https://semanticscholar.org/author/12345"
    }
  ]
}
```

**POST response:**

```json
{
  "success": [ { "id": 1, "name": "Jane Doe", ... } ],
  "failed": [ { "scholar_id": "12345", "error": "already invited" } ]
}
```

No changes to existing `POST /conferences/:id/reviewers` endpoint.

### Frontend: Unified Search

**Changes to `conference-committee.tsx` `handleSearch()`:**

1. User types in the existing search box (no UI change to the input)
2. Fire two parallel requests with the same query:
   - `searchUsersForConference(query, conferenceId, 10)` — platform users
   - `semanticScholarApi.searchAuthors(query, 5)` — Semantic Scholar authors
3. Merge results into a single dropdown list
4. Platform users shown first, then Semantic Scholar results below (with subtle group divider)
5. Each result shows a `PlatformBadge` — reuse the component from `reviewer-suggestions.tsx`:
   - "On Platform" (blue) for platform users
   - "Not On Platform" (amber) for Semantic Scholar-only authors
6. Cross-reference: if a Semantic Scholar result matches a platform user (by `scholar_id`), skip the duplicate

**`SelectedUser` type extended:**

```typescript
interface SelectedUser {
  // Existing
  id?: number
  email?: string
  first_name?: string
  last_name?: string
  domain?: string[]
  matched_fields?: string[]
  score?: number
  // New for external users
  is_external?: boolean
  scholar_id?: string
  name?: string
  affiliation?: string
  profile_url?: string
}
```

**`handleAddMembers()` updated:**

- Split `selectedUsers` into platform users and external users
- Platform users: existing `inviteReviewers()` / `updateConference()` flow
- External users: new `POST /external-invitations` endpoint
- Both results combined into a single success/error message

### Frontend: Reviewer Suggestions Tab

**Changes to `reviewer-suggestions.tsx`:**

1. Enable the invite button for external (not-on-platform) suggestions (currently disabled at lines 423-431)
2. On click, call `POST /api/v1/conferences/:conference_id/external-invitations` with Semantic Scholar metadata
3. Track invited external users in the `invitedIds` set using `scholar_id` as key
4. `handleInviteAll()` updated to handle both platform and external users

No visual changes — existing badges, match scores, and field chips stay the same.

### Frontend: Committee Table

**Changes to `conference-committee.tsx` `loadCommittee()`:**

1. Also fetch `GET /api/v1/conferences/:conference_id/external-invitations`
2. Merge external invitations into `committeeMembers` with `is_external: true`
3. External members display:
   - Name from Semantic Scholar
   - "Not On Platform" amber badge
   - Role label (PC or Reviewer)
   - Status: "Pending"
   - Remove button calling `DELETE /external-invitations/:id`
4. Role filter tabs include external invitation counts

## Data Flow

```
Chair types in search box
  ├─► searchUsersForConference(query) ──► Platform users (existing)
  └─► semanticScholarApi.searchAuthors(query) ──► Semantic Scholar authors
       │
       ▼
  Merged dropdown with PlatformBadge on each result
       │
       ▼
  Chair selects user(s) and clicks "Invite"
       │
       ├─► Platform users ──► POST /conferences/:id/reviewers (existing)
       │                  or ──► PUT /conferences/:id (for PC, existing)
       └─► External users ──► POST /conferences/:id/external-invitations (new)
       │
       ▼
  Committee table shows both platform + external invitees
```

## Edge Cases

- **Semantic Scholar API slow/down:** Show platform results immediately, append Semantic Scholar results when they arrive. If Semantic Scholar fails, show only platform results (no error).
- **Duplicate invite:** Backend returns "already invited" in `failed` array via unique constraint on `(conference_id, scholar_id)`.
- **No email available:** External invitation stored without email. The "Not On Platform" badge signals this. Email sending (future) will need to handle this case.
- **Scholar result matches platform user:** Cross-reference by `scholar_id` and deduplicate in the frontend, showing only the platform result.

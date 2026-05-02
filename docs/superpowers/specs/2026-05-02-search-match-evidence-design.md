# Search Match-Evidence Chips Design

**Date:** 2026-05-02
**Status:** Approved (revised after user feedback to put scoring on the backend)

## Problem

When a chair searches for a user in the **Add Member** flow (Members sub-tab of `ConferenceCommittee`), the dropdown rows show only the user's email and name. Chairs cannot tell whether a candidate's research domains match the conference, so they have to open each user's profile or guess. The Suggestions tab already surfaces this evidence (matched-field chips) — the manual-add search should feel consistent.

## Decision

Annotate each search-result row with the user's domain chips, **green** for chips that overlap the conference's topics and **grey** otherwise.

The match metadata (`matched_fields`, `score`) is computed **server-side** and reuses the Suggestions service's scoring logic, so the same person shows the same evidence in both the search dropdown and the Suggestions tab.

The existing `/api/v1/users/search` endpoint is **kept**; the enrichment is opt-in via a new `?conference_id=<id>` query param. Callers that don't pass it see the response shape exactly as today.

Existing-committee filtering and already-staged filtering happen on the **frontend** (per earlier decision).

**Out of scope:** No score number rendered in the UI (per earlier preference — backend returns it, FE just doesn't display it). No re-ranking. No new endpoint. No fix to the existing email-only search behavior.

## Backend changes

### 1. DTO additions (`backend/internal/dto/user.go`)

Extend the `User` struct with two `omitempty` fields, named and typed identically to their counterparts in `dto.ReviewerSuggestion`:

```go
type User struct {
    // ... existing fields ...
    MatchedFields []string `json:"matched_fields,omitempty"`
    Score         *int     `json:"score,omitempty"`
}
```

`Score` is a pointer so `omitempty` distinguishes "not annotated" from "annotated as 0". When the search endpoint is called without `conference_id`, both fields are `nil` and JSON omits them — zero impact on existing callers.

### 2. Suggestion service: extract scoring helper + add public annotator (`backend/internal/service/reviewer_suggestion/service.go`)

Refactor `suggestInternal`'s per-user scoring block into a small private helper:

```go
// scoreUserAgainstTopics computes Jaccard-similarity match between
// the user's domains and the conference topic set. Returns the matched
// fields (lowercased) and an integer percentage score in [0, 100].
func scoreUserAgainstTopics(userDomain []string, topicSet map[string]bool) (matched []string, score int)
```

`suggestInternal` switches to call this helper. **No public-behavior change** for the existing Suggestions endpoint.

Add one new public method on `Service`:

```go
// AnnotateUsersWithMatch fills in MatchedFields and Score on each user
// based on the given conference's topic set. Mutates users in place.
// Returns an error only on critical failures (conf not found, etc).
// Users with no domain or no overlap get matched_fields=[] and score=0.
func (s *Service) AnnotateUsersWithMatch(ctx context.Context, conferenceID int64, users []*dto.UserResponse) error
```

This loads the topic set via the existing `buildTopicSet(ctx, conferenceID)` (so search and Suggestions use the **same** topic set), then calls `scoreUserAgainstTopics` for each user.

### 3. User controller `Search` (`backend/internal/controller/user/user.go`)

- Inject the suggestion service (optional — nil-safe). Add a constructor field, wire it in `cmd/server/main.go` and `controller.go`.
- Read `conference_id` query param (optional, parses to int64; invalid value → ignored, falls back to today's behavior).
- When `conference_id` is supplied AND `suggestionService` is non-nil:
  1. Run the existing search (unchanged).
  2. Call `suggestionService.AnnotateUsersWithMatch(ctx, confID, users)`.
  3. If annotation returns an error, log it and return the un-annotated rows (graceful degrade — search still works).
- Existing `sanitizeUserResponse` call stays unchanged.

### 4. Tests

- **Unit (suggestion service):** `scoreUserAgainstTopics` correctness against a few inputs; `AnnotateUsersWithMatch` populates fields correctly; missing conference returns error; user with no domain → empty/zero.
- **Integration (`backend/tests/api/user/`):** new `Test_UserSearch_WithConferenceID_Annotates` — registers a chair + a candidate with overlapping domains, creates a conference, hits `GET /users/search?q=...&conference_id=N`, asserts `matched_fields` and `score` on the response. Also a "without conference_id → no annotation" assertion to confirm the omit behavior.

## Frontend changes

### 1. API client

The search call currently lives inline in `conference-committee.tsx` (a raw `apiFetch`). Either:
- Add `&conference_id=${conferenceId}` to that fetch URL, or
- Extract a tiny helper `searchUsersForConference(q, conferenceId, limit)` in `frontend/lib/api/user.ts`.

Pick the second for testability. The helper is ~15 lines.

### 2. `ConferenceCommittee` (`frontend/components/chair/conference-detail/conference-committee.tsx`)

1. Extend `UserSearchResult` to include `domain?: string[]`, `matched_fields?: string[]`, `score?: number`. Thread them through the existing search-response mapping.
2. Use `searchUsersForConference(query, conferenceId, 10)` (the new helper) instead of the raw `apiFetch`.
3. Build `excludedEmails` memo: lowercased emails of every member in `members` plus every chip in `selectedUsers`.
4. Compute `visibleResults` = `searchResults.filter((u) => !excludedEmails.has(u.email.toLowerCase()))`.
5. Dropdown maps `visibleResults`. The "no users found" empty state path stays the same.
6. Inside each row, when `user.domain && user.domain.length > 0`, render a chip strip:
   - For each field in `user.domain`, render a chip.
   - Green when `matched_fields` (case-insensitive) contains the field; grey otherwise.
   - Same Tailwind utility classes as `FieldChips` in `reviewer-suggestions.tsx` (visual parity).
7. Score is **not** displayed (per "no number" preference). It's stored in case we want it later.

## Behaviour

| Situation | Result |
|---|---|
| Conference has topics, user has overlap | All chips render; matched ones green with `✓`, others grey |
| User has no domains | No chip strip; row renders like today |
| User is already on the committee | Not in the dropdown (FE filter) |
| User is already chipped in `selectedUsers` | Not in the dropdown (FE filter) |
| Search ordering | Unchanged — endpoint order preserved |
| `/users/search` called without `conference_id` (any other caller) | Identical response to today (no `matched_fields`, no `score`) |
| Annotation fails server-side | Search returns un-annotated rows; FE renders them with all chips grey |
| Conference not found | Suggestion service returns error → controller logs and degrades to un-annotated |

## Tests

### Backend
- `backend/internal/service/reviewer_suggestion/service_test.go` — unit tests for `scoreUserAgainstTopics` and `AnnotateUsersWithMatch`.
- `backend/tests/api/user/search_test.go` (or extend the closest existing user-search test file) — integration test asserting `matched_fields` + `score` populated when `conference_id` supplied; absent otherwise.

### Frontend
Add to `frontend/components/chair/conference-detail/__tests__/conference-committee.test.tsx`, in a new `describe("Add Member search dropdown — match evidence", ...)` block:

1. **Chips render with correct colors** — given a mocked search response with `matched_fields = ["AI"]` and `domain = ["AI", "Robotics"]`, the row shows AI in the green chip class and Robotics in the grey chip class.
2. **Empty domains** — user with `domain = []` renders no chip strip.
3. **Existing-member exclusion** — user whose email matches a `members` entry does not appear in the dropdown.
4. **Already-staged exclusion** — user already in `selectedUsers` does not appear in the dropdown.
5. **Order preservation** — search returns `[A, B, C]`; rendered DOM order is `[A, B, C]`, not re-sorted by match.
6. **Conference-id is sent** — assert the API helper was called with the conference id.

## Risks

- Adding two fields to `dto.User` is technically a wire-format change. Because the fields are `omitempty` and only populated by one new code path, existing callers (login, `/users/me`, `/users/{email}`, etc.) see the same payload. Verified by code inspection — no test or caller serializes `User` with explicit field expectations that would break on extra unknown fields.
- The user controller now depends on the suggestion service (one-way, no cycle: `controller/user → service/reviewer_suggestion`). This is the same dependency shape that already exists for other cross-service injections in `controller.go`.

## Estimate

~80 lines backend (DTO + service helper + service annotator + controller wiring) + ~50 lines tests; ~50 lines frontend (helper + chip strip + memos + filter) + ~80 lines tests. Two small PRs or one focused PR.

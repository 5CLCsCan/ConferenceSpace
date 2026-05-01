# Conference-Level Reviewer Suggestion

## Problem

Conference chairs have no way to discover who to invite as reviewers. They must manually search for known users by email. We want to suggest reviewers from Semantic Scholar based on the conference's topics and submissions, including people not yet on the platform.

## Scope

- **In scope:** Suggest reviewers to invite to a conference (Flow 1 — invite to conference). Backend API + frontend sub-tab UI.
- **Out of scope:** Invitation flow for off-platform users (separate PR). Paper-level assignment suggestions (already exists).

## Decisions

| Decision | Choice |
|----------|--------|
| Presentation | Unified list with "On platform" / "Not on platform" badges |
| Data fetch | On-demand at suggestion time (no cronjob) |
| Trigger frequency | One-time per conference (acceptable delay) |
| Match source | Conference domains + aggregated submission keywords/domains |
| External data source | Semantic Scholar paper search API |
| UI placement | Sub-tab inside Committee tab |
| Localization | All UI text in en.json and vi.json |

---

## Backend

### New Endpoint

`GET /api/v1/conferences/:conference_id/reviewer-suggestions`

- Auth: JWT required
- Authorization: `requireChair` middleware (chair or co-chair only)
- Query params: `limit` (int, default 20, max 50)

### Response

```json
{
  "data": {
    "suggestions": [
      {
        "id": "platform-42",
        "source": "internal",
        "name": "Aisha Khan",
        "email": "a.khan@stanford.edu",
        "affiliation": "Stanford University",
        "on_platform": true,
        "score": 96,
        "fields": ["NLP", "Transformers", "Sentiment Analysis"],
        "matched_fields": ["NLP", "Transformers"],
        "publications": 47,
        "past_reviews": 18,
        "scholar_id": "12345",
        "platform_user_id": 42
      },
      {
        "id": "s2-67890",
        "source": "external",
        "name": "Jonas Müller",
        "email": "",
        "affiliation": "TU Berlin",
        "on_platform": false,
        "score": 89,
        "fields": ["Computer Vision", "Object Detection", "Deep Learning"],
        "matched_fields": ["Computer Vision", "Deep Learning"],
        "publications": 62,
        "past_reviews": null,
        "scholar_id": "67890",
        "platform_user_id": null
      }
    ],
    "conference_topics": ["AI", "ML", "NLP"],
    "total": 8
  }
}
```

Fields:
- `id`: `platform-{userId}` for internal, `s2-{authorId}` for external
- `source`: `"internal"` or `"external"` — which algorithm produced this suggestion
- `on_platform`: whether a matching user exists in the platform
- `score`: 0-100 normalized match score
- `fields`: author's research fields (from `user.domain` for internal, from S2 papers for external)
- `matched_fields`: subset of `fields` that overlap with conference topics
- `publications`: paper count (from scholar profile if linked, or from S2)
- `past_reviews`: number of completed reviews on platform (null if not on platform)
- `platform_user_id`: user ID if on platform (for invite API)

### Service Logic — Two-Algorithm Merge

**Step 0: Build topic set**
1. Fetch conference by ID → extract `domain[]`
2. Fetch all submissions for this conference → aggregate unique `domain[]` + `information.keywords[]`
3. Merge conference domains with submission keywords → deduplicated topic set (case-insensitive)

**Algorithm 1 — Internal (platform users)**
4. Query `users` table for users whose `domain[]` has any overlap with the topic set
5. Exclude users already in `conference_reviewers` for this conference
6. Exclude the conference chair and co-chairs
7. Score: Jaccard similarity → `|intersection(user.domain, topics)| / |union(user.domain, topics)| * 100`
8. Set `matched_fields` = intersection of user domains and topics
9. Enrich: count completed reviews from `paper_assignments` → `past_reviews`
10. Enrich: if user has linked scholar profile, populate `publications` from `scholar_profiles.paper_count`
11. All results: `on_platform: true`, `source: "internal"`, `id: "platform-{userId}"`

**Algorithm 2 — External (Semantic Scholar)**
12. For each topic (up to 5 most frequent), call `SearchPapers(topic, limit=10)`
13. Collect unique authors across all paper results (deduplicate by `authorId`)
14. Score by number of distinct topic searches the author appeared in: `appeared_in_count / total_queries * 100`
15. Set `matched_fields` = the topic queries where this author appeared
16. Check platform membership: look up by `semantic_scholar_id` in `users` table
17. Exclude users already in `conference_reviewers`
18. Exclude users already found by Algorithm 1 (deduplicate by `semantic_scholar_id` or name match)
19. Set `source: "external"`, `id: "s2-{authorId}"`

**Merge**
20. Combine both result lists
21. Sort by score descending
22. Apply limit (default 20)
23. Return

### New Files

| File | Purpose |
|------|---------|
| `backend/internal/dto/reviewer_suggestion.go` | Request/response DTOs |
| `backend/internal/service/reviewer_suggestion/service.go` | Core logic (two-algorithm merge) |
| `backend/internal/controller/reviewer_suggestion/controller.go` | HTTP handler |

### Modified Files

| File | Change |
|------|--------|
| `backend/internal/clients/semantic_scholar/client.go` | Add `SearchPapers` method + `PaperSearchResponse` type |
| `backend/internal/controller/controller.go` | Add `ReviewerSuggestion` field, wire in both constructors |
| `backend/cmd/server/main.go` | Register `GET /:conference_id/reviewer-suggestions` route under conferences group |

### Semantic Scholar Client Addition

```go
// PaperSearchResponse represents the paper search results
type PaperSearchResponse struct {
    Total  int     `json:"total"`
    Offset int     `json:"offset"`
    Next   int     `json:"next,omitempty"`
    Data   []Paper `json:"data"`
}

func (c *Client) SearchPapers(ctx context.Context, query string, limit int) (*PaperSearchResponse, error)
```

Uses `GET /graph/v1/paper/search?query=...&limit=...&fields=paperId,title,year,citationCount,venue,authors,...`

---

## Frontend

### UI: Sub-tab Variation

The Committee tab gets a sub-tab row:
- **Current members** tab (existing member table — default active)
- **Suggested reviewers** tab (new, with sparkles icon + count badge)

When "Suggested reviewers" is active, the panel shows:
- Header: sparkles icon + "Suggested reviewers" title + match count pill + subtitle
- Filter row: chips for All / On platform / Not on platform (with counts) + sort dropdown (Highest match / Most publications)
- Suggestion rows (per the design):
  - Avatar (blue for on-platform, dark for off-platform)
  - Name + PlatformPill badge ("On platform" blue / "Not on platform" amber)
  - Affiliation + email
  - Field chips (green with checkmark for matched, gray for unmatched)
  - Publication count + past review count (if on platform)
  - Match score widget (number + progress bar + "Match" label)
  - Actions: Invite button (primary) + Remove button (icon)
- Empty state when all suggestions actioned
- "Invite all" button in header actions
- Refresh button to re-fetch suggestions

### Actions

- **Invite**: For on-platform users, calls existing `POST /conferences/:id/reviewers` API with user_id. For off-platform users, button is disabled with tooltip "Not yet on platform" (invite flow is future PR).
- **Remove**: Local dismiss (filters suggestion from UI state, no backend call).
- **Invite all**: Invites all on-platform suggestions that haven't been actioned.
- **Refresh**: Re-fetches suggestions from backend.

### New Files

| File | Purpose |
|------|---------|
| `frontend/components/chair/conference-detail/reviewer-suggestions.tsx` | Sub-tab panel component |
| `frontend/lib/api/reviewer-suggestions.ts` | API client for suggestion endpoint |

### Modified Files

| File | Change |
|------|--------|
| `frontend/components/chair/conference-detail/conference-committee.tsx` | Add sub-tab row, conditionally render suggestion panel |
| `frontend/locales/en.json` | Add localization keys under `conference-committee` |
| `frontend/locales/vi.json` | Add Vietnamese translations |

### Localization Keys

Added under `runtime.components.chair.conference-detail.conference-committee`:

| Key | EN | VI |
|-----|----|----|
| `text_current_members` | Current members | Thành viên hiện tại |
| `text_suggested_reviewers` | Suggested reviewers | Phản biện gợi ý |
| `text_suggested_reviewers_subtitle` | Reviewers not yet on this conference, ranked by topic match. Invite to add them. | Phản biện chưa tham gia hội nghị, xếp hạng theo chủ đề phù hợp. Mời để thêm họ. |
| `text_matches` | matches | kết quả |
| `text_all` | All | Tất cả |
| `text_on_platform` | On platform | Có tài khoản |
| `text_not_on_platform` | Not on platform | Chưa có tài khoản |
| `text_highest_match` | Highest match | Phù hợp nhất |
| `text_most_publications` | Most publications | Nhiều công bố nhất |
| `text_invite` | Invite | Mời |
| `text_invite_all` | Invite all | Mời tất cả |
| `text_invited` | Invited | Đã mời |
| `text_refresh` | Refresh | Làm mới |
| `text_pubs` | pubs | bài báo |
| `text_prior_reviews` | prior reviews | lượt phản biện |
| `text_match` | Match | Phù hợp |
| `text_all_caught_up` | All caught up | Đã xử lý hết |
| `text_all_suggestions_actioned` | You've actioned every suggestion. | Bạn đã xử lý tất cả gợi ý. |
| `text_no_suggestions_filter` | No suggestions match this filter | Không có gợi ý phù hợp với bộ lọc |
| `text_try_another_filter` | Try switching to another filter. | Thử chuyển sang bộ lọc khác. |
| `text_loading_suggestions` | Loading suggestions... | Đang tải gợi ý... |
| `text_invitation_sent` | Invitation sent to {name} | Đã gửi lời mời đến {name} |
| `text_removed_suggestion` | Removed {name} from suggestions | Đã xóa {name} khỏi gợi ý |
| `text_invitations_sent` | {count} invitations sent | Đã gửi {count} lời mời |
| `text_not_on_platform_tooltip` | This reviewer is not on the platform yet | Phản biện này chưa có tài khoản trên hệ thống |

---

## Error Handling

- If Semantic Scholar API is unavailable, return empty suggestions with no error (graceful degradation)
- If conference has no domains and no submissions, return empty suggestions
- Rate limiting: existing 1 req/sec limiter on S2 client handles this

## Testing

- Backend: unit test for the service scoring logic
- Frontend: component test for the suggestion panel rendering and filter behavior

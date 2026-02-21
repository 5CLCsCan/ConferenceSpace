# Entity State Flow (Ground Truth)

Source of truth: `frontend-v2/app/**/page.tsx`, `frontend-v2/components/**`, `frontend-v2/hooks/**`, `frontend-v2/lib/**`.
Excluded routes: `/test/*`.

### Entity: Submission
State progression: `Draft` -> `Published` -> `Reviewing` -> (`Accepted` | `Rejected`)

| State | Trigger (Feature ID) | Data Shape (TS Interface/DTO) | Visibility/Interaction (Author/Chair/Reviewer) | Evidence |
| --- | --- | --- | --- | --- |
| **Draft** | `author-submission-save-draft` | `Submission`; `Paper`; `submitPaper(data: { status?: "draft" \| "published" ... })`; `updatePaper(data: {...})` | **Author:** can keep editing draft and reopen editor. **Chair:** submission can appear as pending in conference submissions if backend returns draft items. **Reviewer:** cannot access until assignment exists. | `frontend-v2/components/author/submit/paper-submission-form.tsx`; `frontend-v2/lib/api/papers.ts`; `frontend-v2/lib/api/submissions.ts`; `frontend-v2/components/chair/conference-detail/conference-submissions.tsx` |
| **Published** | `author-submission-submit-publish` | `Submission`; `Paper`; `submitPaper/updatePaper` payload with `status: "published"` | **Author:** sees submitted status and detail view. **Chair:** can open submission evaluation workspace. **Reviewer:** still hidden unless assignment is created by backend workflow. | `frontend-v2/components/author/submit/paper-submission-form.tsx`; `frontend-v2/components/author/author-submissions-list.tsx`; `frontend-v2/components/chair/conference-detail/conference-submissions.tsx` |
| **Reviewing** | `reviewer-assignment-save-draft` | `Submission`; `AssignmentReview`; `ReviewData`; save payload `{ review_score?, review_data?, status: "draft" }` | **Author:** sees under-review style/status mapping in author dashboards. **Chair:** sees reviewer progress and analytics for the submission. **Reviewer:** can edit draft review in assignment workspace. | `frontend-v2/components/reviewer/submission-review.tsx`; `frontend-v2/hooks/use-assignment-review.ts`; `frontend-v2/components/author/author-conferences.tsx`; `frontend-v2/components/chair/submission-review-tab.tsx` |
| **Accepted** | `chair-submission-save-final-decision` | `Submission`; `updateSubmissionStatus(..., status: "accepted" \| "rejected")` | **Author:** sees final decision status and can open decision-linked notifications. **Chair:** final decision is persisted from review tab. **Reviewer:** sees work as completed/read-only historical context. | `frontend-v2/components/chair/submission-review-tab.tsx`; `frontend-v2/lib/api/submissions.ts`; `frontend-v2/app/notifications/page.tsx`; `frontend-v2/components/reviewer/completed-reviews.tsx` |
| **Rejected** | `chair-submission-save-final-decision` | `Submission`; `updateSubmissionStatus(..., status: "accepted" \| "rejected")` | **Author:** sees rejected outcome and no draft-edit affordance. **Chair:** decision remains visible in review/history tabs. **Reviewer:** can still view completed assignment history. | `frontend-v2/components/chair/submission-review-tab.tsx`; `frontend-v2/lib/api/submissions.ts`; `frontend-v2/components/author/author-submissions-list.tsx`; `frontend-v2/components/reviewer/completed-reviews.tsx` |

Notes:
- Frontend runtime also contains compatibility statuses like `revision_requested`/`withdrawn` in UI component types, but `lib/api/submissions.ts` currently persists only `draft|published|reviewing|accepted|rejected`.
- Revision-decision and withdraw actions are present as blocked placeholders: `chair-submission-revision-decision-placeholder`, `author-submission-withdraw-placeholder`.

### Entity: Review Assignment / Review Content
State progression: `Not Started` -> `Draft Saved` -> `Submitted (Completed)`

| State | Trigger (Feature ID) | Data Shape (TS Interface/DTO) | Visibility/Interaction (Author/Chair/Reviewer) | Evidence |
| --- | --- | --- | --- | --- |
| **Not Started** | `reviewer-workspace-open-assignment` | `AssignedPaper`; `AssignmentWithPaper` | **Author:** cannot access assignment-level review workspace. **Chair:** sees assignment status as pending in submission detail overview. **Reviewer:** can open assignment and begin review. | `frontend-v2/components/reviewer/assigned-dashboard.tsx`; `frontend-v2/lib/types.ts`; `frontend-v2/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx` |
| **Draft Saved** | `reviewer-assignment-save-draft` | `AssignmentReview`; `ReviewData`; save payload `{ review_score?, review_data?, status: "draft" }` | **Author:** no direct access to draft review contents. **Chair:** history timeline includes draft-review events. **Reviewer:** can iteratively edit/save draft. | `frontend-v2/components/reviewer/submission-review.tsx`; `frontend-v2/hooks/use-assignment-review.ts`; `frontend-v2/lib/api/reviews.ts`; `frontend-v2/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx` |
| **Submitted (Completed)** | `reviewer-assignment-submit-review` | `AssignmentReview`; `ReviewData`; save payload `{ ..., status: "submitted" }`; `ReviewAnalytics` | **Author:** sees only submission-level status effects, not full reviewer form data. **Chair:** can inspect full review content plus analytics. **Reviewer:** assignment becomes completed and appears in completed reviews list. | `frontend-v2/components/reviewer/submission-review.tsx`; `frontend-v2/lib/api/reviews.ts`; `frontend-v2/components/chair/submission-review-tab.tsx`; `frontend-v2/components/reviewer/completed-reviews.tsx` |

Notes:
- Reviewer list pages use `assignment_status` values (`not_started|in_progress|completed`) while review payload persistence uses `review_status` (`draft|submitted`); frontend treats them as coupled but sourced from different contracts.

### Entity: Review Request / Invitation
State progression: `Pending` -> (`Accepted` | `Declined`)

| State | Trigger (Feature ID) | Data Shape (TS Interface/DTO) | Visibility/Interaction (Author/Chair/Reviewer) | Evidence |
| --- | --- | --- | --- | --- |
| **Pending** | `reviewer-invitation-view-list` | `ReviewRequest`; `Reviewer` (`status?: "pending" \| "accepted" \| "rejected"`) | **Author:** no invitation UI access. **Chair:** can observe pending invite counts in committee tab. **Reviewer:** can accept/decline pending invitations. | `frontend-v2/components/reviewer/reviewer-invitations.tsx`; `frontend-v2/components/chair/conference-detail/conference-committee.tsx`; `frontend-v2/lib/types.ts`; `frontend-v2/lib/api/conferences.ts` |
| **Accepted** | `reviewer-invitation-accept` | `respondToReviewRequest(..., status: "accepted" \| "rejected")`; `ReviewRequest` | **Author:** no direct visibility. **Chair:** sees committee population/pending reductions via reviewer endpoints. **Reviewer:** accepted card is shown; follow-up dashboard button is UI-only. | `frontend-v2/components/reviewer/reviewer-invitations.tsx`; `frontend-v2/lib/api/reviewer.ts`; `frontend-v2/components/chair/conference-detail/conference-committee.tsx` |
| **Declined** | `reviewer-invitation-decline` | `respondToReviewRequest(..., status: "accepted" \| "rejected")`; `ReviewRequest` (`status` includes `"declined"`) | **Author:** no direct visibility. **Chair:** invite is not accepted, remains outside active committee. **Reviewer:** declined card is shown with no further actions. | `frontend-v2/components/reviewer/reviewer-invitations.tsx`; `frontend-v2/lib/api/reviewer.ts`; `frontend-v2/lib/types.ts` |

Notes:
- Type vocabulary mismatch exists: reviewer response mutation sends `"rejected"`, while `ReviewRequest.status` in `lib/types.ts` models `"declined"`.

### Entity: Conference
State progression: `Draft Wizard (local)` -> `Open` -> `Reviewing` -> `Completed`

| State | Trigger (Feature ID) | Data Shape (TS Interface/DTO) | Visibility/Interaction (Author/Chair/Reviewer) | Evidence |
| --- | --- | --- | --- | --- |
| **Draft Wizard (local)** | `chair-conference-save-draft-local` | `ConferenceFormData` | **Author:** not visible. **Chair:** local wizard-only draft toast, no persisted draft API. **Reviewer:** not visible. | `frontend-v2/app/role/chair/conferences/new/page.tsx`; `frontend-v2/components/wizard/creation/types.ts` |
| **Open** | `chair-conference-create` | `Conference`; `ConferenceStatus`; `createConference` payload `{ conference: {...} }` | **Author:** can discover conference and create submissions (new submission route enforces `status === "open"`). **Chair:** conference appears in chair lists. **Reviewer:** appears in reviewer conference data with mapped status vocabulary. | `frontend-v2/app/role/chair/conferences/new/page.tsx`; `frontend-v2/lib/api/conferences.ts`; `frontend-v2/app/role/author/submissions/new/page.tsx`; `frontend-v2/lib/api/reviewer.ts` |
| **Reviewing** | `chair-conference-settings-placeholder` | `ConferenceStatus`; `updateConferenceStatus(conferenceId, status)` contract | **Author:** new submissions are blocked when status is not open. **Chair:** status display maps into active/planning buckets in chair views. **Reviewer:** reviewer conference cards can render active/open variants. | `frontend-v2/lib/api/conferences.ts`; `frontend-v2/app/role/author/submissions/new/page.tsx`; `frontend-v2/components/chair/chair-conferences.tsx`; `frontend-v2/components/reviewer/reviewer-conferences.tsx` |
| **Completed** | `chair-conference-settings-placeholder` | `ConferenceStatus`; `Conference` | **Author:** conference appears in archived/explore partitions. **Chair:** conference appears in archived tab. **Reviewer:** treated as archived/closed in reviewer views. | `frontend-v2/components/author/author-conferences.tsx`; `frontend-v2/components/chair/chair-conferences.tsx`; `frontend-v2/components/reviewer/reviewer-conferences.tsx` |

Notes:
- `updateConferenceStatus` exists in API layer, but no connected production UI mutation callsite currently invokes it; lifecycle transitions beyond creation are effectively backend-managed/unwired from frontend actions.
- Reviewer-facing status vocabulary (`upcoming|active|completed|open|closed`) differs from canonical conference enum (`open|reviewing|completed`).

### Entity: User Profile
State progression: `Loaded` -> `Updated` -> `Academic Linked` -> `Academic Unlinked`

| State | Trigger (Feature ID) | Data Shape (TS Interface/DTO) | Visibility/Interaction (Author/Chair/Reviewer) | Evidence |
| --- | --- | --- | --- | --- |
| **Loaded** | `shared-profile-view-user` | `User`; `ProfileFormData` | **Author/Chair/Reviewer:** all authenticated roles can view profile pages; edit controls are disabled unless viewing own profile. | `frontend-v2/app/profile/[user_id]/page.tsx`; `frontend-v2/lib/profile/resolve-user-email.ts`; `frontend-v2/lib/types.ts` |
| **Updated** | `shared-profile-update-user` | `UpdateProfileRequest`; `User` | **Author/Chair/Reviewer:** only owner can persist changes; non-owner remains read-only. | `frontend-v2/app/profile/[user_id]/page.tsx`; `frontend-v2/lib/types.ts` |
| **Academic Linked** | `shared-profile-link-academic-profile` | `AcademicProfile`; `User` | **Author/Chair/Reviewer:** owner can search/select Semantic Scholar author and link profile; linked metrics/publications become visible. | `frontend-v2/components/profile/profile-onboarding-modal.tsx`; `frontend-v2/lib/api/user.ts`; `frontend-v2/lib/api/semantic-scholar.ts` |
| **Academic Unlinked** | `shared-profile-unlink-academic-profile` | `User` | **Author/Chair/Reviewer:** owner can unlink profile; synced publication card returns to disconnected state. | `frontend-v2/app/profile/[user_id]/page.tsx`; `frontend-v2/lib/api/user.ts` |

Notes:
- Profile editability is derived from runtime identity check `isOwnProfile` rather than route-level role restrictions.

### Entity: Notification
State progression: `Unread` -> `Read` -> `Actioned (Read + Navigation)`

| State | Trigger (Feature ID) | Data Shape (TS Interface/DTO) | Visibility/Interaction (Author/Chair/Reviewer) | Evidence |
| --- | --- | --- | --- | --- |
| **Unread** | `shared-notification-view-feed` | `Notification`; `NotificationListResponse`; `UnreadCountResponse` | **Author/Chair/Reviewer:** each role sees only its authenticated user notification stream. | `frontend-v2/app/notifications/page.tsx`; `frontend-v2/hooks/use-notifications.ts`; `frontend-v2/lib/api/notifications.ts`; `frontend-v2/lib/types.ts` |
| **Read (single)** | `shared-notification-mark-read` | `Notification` | **Author/Chair/Reviewer:** marks a specific item as read and decrements unread counter. | `frontend-v2/hooks/use-notifications.ts`; `frontend-v2/lib/api/notifications.ts`; `frontend-v2/app/notifications/page.tsx` |
| **Read (bulk)** | `shared-notification-mark-all-read` | `MarkAllAsReadResponse` | **Author/Chair/Reviewer:** marks all loaded notifications as read and resets unread count in UI state. | `frontend-v2/hooks/use-notifications.ts`; `frontend-v2/lib/api/notifications.ts`; `frontend-v2/app/notifications/page.tsx` |
| **Actioned (Read + Navigation)** | `shared-notification-open-action-link` | `Notification` (`action_url`) | **Author/Chair/Reviewer:** clicking action first marks item read, then routes to internal page or external URL. | `frontend-v2/app/notifications/page.tsx`; `frontend-v2/lib/notifications/resolve-action-url.ts` |

Notes:
- API exposes `deleteNotification`, but no mapped production UI feature currently triggers deletion.

### Entity: Discussion Thread/Message
State progression: `Thread Created` -> `Message Activity` -> `Role-Scoped Visibility Projection`

| State | Trigger (Feature ID) | Data Shape (TS Interface/DTO) | Visibility/Interaction (Author/Chair/Reviewer) | Evidence |
| --- | --- | --- | --- | --- |
| **Thread Created** | `author-discussion-create-thread`, `reviewer-discussion-create-thread`, `chair-discussion-create-thread` | `CreateThreadData`; `CreateThreadRequest`; `DiscussionThread`; `CreateThreadResponse` | **Author:** can create author-visible threads only. **Chair/Reviewer:** can create threads with committee/reviewer/author visibility options. | `frontend-v2/components/author/submission-detail/discussion-tab.tsx`; `frontend-v2/components/reviewer/submission-review/discussion-tab.tsx`; `frontend-v2/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`; `frontend-v2/lib/api/discussions.ts` |
| **Message Activity** | `author-discussion-reply-thread`, `reviewer-discussion-reply-thread`, `chair-discussion-reply-thread` | `CreateMessageRequest`; `DiscussionMessage`; `MessageListResponse` | **Author:** can reply within author-visible threads. **Chair/Reviewer:** can reply across broader discussion scopes. | `frontend-v2/components/author/submission-detail/discussion-tab.tsx`; `frontend-v2/components/reviewer/submission-review/discussion-tab.tsx`; `frontend-v2/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`; `frontend-v2/lib/api/discussions.ts` |
| **Role-Scoped Projection (derived)** | `author-submission-view-detail`, `reviewer-assignment-view-workspace`, `chair-submission-view-detail` | `ThreadListResponse`; `DiscussionThread`; `DiscussionMessage`; `ConferenceSettings` | **Author:** rendered with `availableVisibilities=["authors"]` and masked reviewer identity behavior in adapter. **Chair/Reviewer:** rendered with wider visibility controls (`committee|reviewers|authors`). | `frontend-v2/components/shared/discussion/api-adapter.ts`; `frontend-v2/components/shared/discussion/DiscussionPanel.tsx`; `frontend-v2/components/author/submission-detail/discussion-tab.tsx`; `frontend-v2/components/reviewer/submission-review/discussion-tab.tsx`; `frontend-v2/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx` |

Notes:
- Backend discussion thread DTO does not carry explicit visibility/status fields; frontend currently derives visibility by viewer role and defaults thread status to `open`.

# ConferenceSpace Accessibility Audit Report

## Source Files

- `audit_author.log`
- `audit_chair.log`
- `audit_reviewer.log`

This report is composed directly from the role-specific audit logs without deduplication or compression.

## Author

## A-001 Frontend role selector grants Author UI access to any authenticated user

Role: Author
Feature/Entity: Shared role selection and author route guard
Frontend surface: `/role`, `/role/author/**`
Backend surface: None at the frontend guard layer; backend relies on downstream API authorization
Visible data: Any authenticated user is treated as eligible for the Author workspace in the role selector and route guard, so Author-only navigation and any frontend-rendered Author data/components become reachable in the browser.
Available actions: Any authenticated user can select the Author role, persist it in session/local storage, and pass the client-side Author route guard.
State/relationship gates: Authentication only. No actual backend-issued Author role is required.
Frontend enforcement: `frontend/lib/role-access.ts` hardcodes `["author", "reviewer", "chair"]` in `BASE_PLATFORM_ROLES` and merges those into every authenticated user's accessible roles. `frontend/lib/use-role-route-guard.ts` trusts `canAccessRole`. `frontend/app/role/page.tsx` filters displayed role cards with the same `canAccessRole` check. `frontend/lib/session-manager.ts` also uses `canAccessRole` before persisting role choice.
Backend enforcement: None at this layer. The frontend guard is purely client-side and is not backed by a server-issued role check.
Verdict: ABNORMAL
Evidence: `frontend/lib/role-access.ts:3-14`; `frontend/lib/use-role-route-guard.ts:14-46`; `frontend/app/role/page.tsx:220-227`; `frontend/lib/session-manager.ts:77-78,184-197`
Expected behavior: The Author workspace should only be reachable when the authenticated user's server-derived roles or entitlements explicitly allow Author access, or when the product intentionally treats Author as universal and documents that as policy. The current implementation silently turns it into a universal role with no server confirmation.
Remediation: Remove the hardcoded platform-wide role grant. Derive accessible roles from backend identity data only, or from an explicit product rule enforced consistently on both frontend and backend. If Author is intentionally universal, document it and keep backend checks aligned so UI visibility does not over-promise capabilities.

## A-002 Submission read endpoints let an Author inspect other users' papers and files

Role: Author
Feature/Entity: Conference submission list, submission detail, manuscript download, cover-letter download, rebuttal read, camera-ready download
Frontend surface: Any Author-facing or manually crafted request that targets `/api/v1/conferences/:conference_id/submissions/**`
Backend surface: `GET /api/v1/conferences/:conference_id/submissions`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/file`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/cover_letter`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/rebuttal`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/camera-ready`
Visible data: Submission metadata for arbitrary papers in a conference, assigned reviewers when `includeReviewers=true`, uploaded manuscript files, uploaded cover letters, rebuttal content and assignment rebuttal status, and camera-ready files.
Available actions: An authenticated Author can enumerate submissions for a conference, fetch another submission by ID, and download stored artifacts if they know or can discover IDs.
State/relationship gates: The controller only validates conference ID / submission ID consistency and file existence. It does not require the caller to be the submission author, an assigned reviewer, or a chair for read-only endpoints.
Frontend enforcement: No trustworthy frontend restriction exists once the user is authenticated, because the generic backend proxy forwards any `/api/backend/...` path with the bearer token.
Backend enforcement: `submission.go` applies author checks on mutating operations such as update/delete/rebuttal upload/camera-ready upload (`existing.Author != userEmail` / `sub.Author != userEmail`), but the read endpoints at `List`, `Get`, `GetFile`, `GetCoverLetter`, `GetRebuttal`, and `GetCameraReady` do not perform equivalent ownership or role checks.
Verdict: ABNORMAL
Evidence: Route exposure at `backend/cmd/server/main.go:354`; read handlers at `backend/internal/controller/submission/submission.go:382,443,870,1036,1199,1342`; only write paths enforce author ownership at `backend/internal/controller/submission/submission.go:532,673,840,1114,1294`
Expected behavior: An Author should only be able to read their own submissions and related private artifacts, unless a conference policy intentionally exposes a narrower public subset. Private files such as manuscripts, cover letters, rebuttals, reviewer assignment status, and camera-ready uploads should not be globally readable by any authenticated user.
Remediation: Add explicit authorization checks to every submission read endpoint. At minimum, allow access only to the submission author, assigned reviewers where policy permits, and chair/co-chair users for the conference. Split public conference-facing metadata into separate sanitized endpoints instead of reusing the full submission object.

## A-003 Author conference explorer can request globally scoped conference records, including non-open statuses

Role: Author
Feature/Entity: Conference explorer and conference detail
Frontend surface: `/role/author` explore and archived tabs; `/role/author/conferences/:conferenceId`
Backend surface: `GET /api/v1/conferences`; `GET /api/v1/conferences/:conference_id`
Visible data: Full conference DTOs including description, chair, co-chairs, venue, domain, tracks, configuration object, and status for any conference returned by the backend list/detail endpoints.
Available actions: Browse the global conference list, open arbitrary conference detail pages, and bookmark conferences.
State/relationship gates: Authentication only at the route group. Backend list/get do not require `myConferences=true`, do not force `status=open`, and `GetByID` returns the full object by ID without role/status checks. The Author explorer client further filters only `completed` conferences, so draft/archived leakage is not prevented on the server side.
Frontend enforcement: `AuthorConferences` calls `listConferences(...)` with no status filter in explore mode and then filters only `c.status !== "completed"` client-side. Conference detail calls `getConferenceById(...)` directly.
Backend enforcement: `conference.Controller.List` and `Get` do not perform ownership or publication-state checks; storage returns full conference rows unless the caller voluntarily passes filters.
Verdict: ABNORMAL
Evidence: Frontend explore/detail requests at `frontend/components/author/author-conferences.tsx:260-272` and `frontend/lib/api/conferences.ts:21-23,245-271`; backend open list/detail at `backend/internal/controller/conference/conference.go:133,187`; storage returns full rows and only applies `status`/`myConferences` when requested at `backend/internal/storage/conference/conference.go:150,254,312,334-385`
Expected behavior: An Author explorer should receive only conferences intentionally visible to authors, typically open/public conferences and possibly archived public records, not draft/private conference objects or internal configuration payloads.
Remediation: Create an author/public conference listing contract on the backend that enforces visibility by status and publication policy. Keep draft/private conference detail behind chair-scoped endpoints.

## A-004 Author-owned submission mutations are meaningfully enforced on the backend

Role: Author
Feature/Entity: Submission update/delete/rebuttal upload/camera-ready upload
Frontend surface: Author submission detail and edit flows under `/role/author/submissions/**`
Backend surface: `PUT /api/v1/conferences/:conference_id/submissions/:submission_id`; `DELETE /api/v1/conferences/:conference_id/submissions/:submission_id`; `PUT /api/v1/conferences/:conference_id/submissions/:submission_id/rebuttal`; `POST /api/v1/conferences/:conference_id/submissions/:submission_id/camera-ready`
Visible data: The author can reach their own edit/delete/rebuttal/camera-ready controls in the UI.
Available actions: Update a draft submission, delete an unpublished submission, submit a rebuttal during the rebuttal phase, and upload a camera-ready file for an accepted paper.
State/relationship gates: Authenticated user must match `submission.Author`; delete is blocked for published submissions; rebuttal is blocked unless the conference rebuttal phase is `awaiting`; camera-ready upload is blocked unless submission status is `accepted`.
Frontend enforcement: The Author UI presents the relevant actions in submission-specific pages, but the important protection here is backend enforcement rather than UI hiding.
Backend enforcement: The controller explicitly extracts `userEmail` and denies mutation when `existing.Author != userEmail` / `sub.Author != userEmail`. Additional state guards are applied for deletion, rebuttal phase, and accepted-only camera-ready upload.
Verdict: NORMAL
Evidence: Ownership/state checks at `backend/internal/controller/submission/submission.go:518-532,659-673,826-840,1100-1114,1283-1294`
Expected behavior: Private author mutations should be bound to the submission owner and further limited by submission/conference state.
Remediation: Keep these owner/state checks, and mirror the same discipline onto the read endpoints that currently lack equivalent authorization.

## A-005 Chat session and history access is properly scoped to the authenticated user

Role: Author
Feature/Entity: AI chat transport, session list, session history, session deletion
Frontend surface: `frontend/app/api/chat/route.ts`; `frontend/app/api/chat/sessions/route.ts`; `frontend/app/api/chat/sessions/[threadId]/route.ts`
Backend surface: `POST /api/v1/agent/chat`; `GET /api/v1/agent/sessions`; `GET /api/v1/agent/sessions/:thread_id/history`; `DELETE /api/v1/agent/sessions/:thread_id`
Visible data: Only the authenticated user's own AI chat sessions and their history.
Available actions: Start/resume a chat turn, list owned sessions, fetch owned history, delete owned sessions, and submit tool results tied to the same owned thread.
State/relationship gates: A valid bearer token is required, then ai-service resolves backend identity and compares `session.user_id` to the authenticated identity before allowing thread reuse/history/deletion/tool-result submission.
Frontend enforcement: The Next.js chat routes refuse requests without the auth cookie and forward the bearer token to ai-service.
Backend enforcement: ai-service requires identity on every route, rejects cross-user thread access when `session.user_id != identity.user_id`, and `SessionRepository` helpers are built around owned-session queries.
Verdict: NORMAL
Evidence: Frontend auth forwarding at `frontend/app/api/chat/route.ts:57-59,81,106-110`, `frontend/app/api/chat/sessions/route.ts:18-26`, `frontend/app/api/chat/sessions/[threadId]/route.ts:20-31,53-67`; ai-service ownership checks at `ai-service/app/api/routes.py:53,59,171-172,232,268,280,304,316,433-434`; owned-session repository methods at `ai-service/app/repositories/session_repo.py:24,30-42,67,124-125`
Expected behavior: Chat threads should be private per authenticated user, with server-side ownership checks independent of frontend navigation.
Remediation: Preserve this ownership model and add regression tests around cross-user thread access so it stays explicit.

## A-001 Frontend role gating grants Author, Reviewer, and Chair UI to every authenticated user

Role: Author
Feature/Entity: Shared role selection and role-based route guards
Frontend surface: `/role`, `/role/author/**`, `frontend/lib/role-access.ts`, `frontend/lib/use-role-route-guard.ts`, `frontend/lib/session-manager.ts`
Backend surface: None at this layer; backend authorization is deferred to API handlers/controllers
Visible data: Any authenticated user can see Author, Reviewer, and Chair role cards in `/role` and can satisfy the frontend `canAccessRole` checks for all three workspace layouts.
Available actions: Any authenticated user can switch local session state into the Author role and navigate to Author-only pages; the same bug also exposes Reviewer and Chair page shells client-side.
State/relationship gates: Authentication only. No actual role membership is required because `BASE_PLATFORM_ROLES` hardcodes `author`, `reviewer`, and `chair` for every authenticated user.
Frontend enforcement: Broken. `frontend/lib/role-access.ts:3-14` returns `["author","reviewer","chair"]` plus any backend roles, `frontend/lib/use-role-route-guard.ts:28-42` trusts `canAccessRole`, `frontend/lib/session-manager.ts:78` uses the same helper for role switching, and `frontend/app/role/page.tsx:221-227` renders all three role cards based on that helper.
Backend enforcement: Not applicable to this exact UI gate; backend checks may still block some API calls, but the frontend contract is already wrong and leaks page availability/navigation affordances.
Verdict: ABNORMAL
Evidence: `frontend/lib/role-access.ts:3,10,13-14`; `frontend/lib/use-role-route-guard.ts:28-42`; `frontend/lib/session-manager.ts:78`; `frontend/app/role/page.tsx:221-227`.
Expected behavior: Only roles actually granted to the authenticated user should appear in role selection, be switchable in session state, and satisfy role route guards.
Remediation: Remove the hardcoded base role grant. Derive accessible roles strictly from backend-authenticated role claims or an explicit allowlist returned by `/api/v1/users/me`, then make the role selector, route guard, and session manager consume that single authoritative source.

## A-002 Discussion attachment endpoints are authenticated but not thread-authorized

Role: Author
Feature/Entity: Discussion thread attachments
Frontend surface: Shared discussion client `frontend/lib/api/discussions.ts` exposes `uploadAttachment(threadId, formData)` against `/api/v1/threads/:thread_id/attachments`
Backend surface: `POST /api/v1/threads/:thread_id/attachments`, `GET /api/v1/threads/:thread_id/attachments/:filename`
Visible data: An authenticated Author who knows or guesses a thread ID and stored filename can attempt to download an attachment from a thread without the membership checks used for thread/message reads.
Available actions: Upload arbitrary files into a thread-scoped attachment directory and download stored files by thread ID/filename pair.
State/relationship gates: Authentication only inside the controller path inspected here. No thread participant check, submission ownership check, or discussion-phase check is enforced in `UploadAttachment` or `DownloadAttachment`.
Frontend enforcement: No meaningful frontend guard in the shared API helper beyond requiring the caller to invoke the function. The client helper does not restrict calls by role or thread ownership.
Backend enforcement: Inconsistent. `GetThread` and `GetMessages` delegate to service-level access control (`backend/internal/controller/discussion/discussion.go:171` and `:274`), but `UploadAttachment` and `DownloadAttachment` only check `utils.GetUserID(ginCtx)` (`:331` and `:403`) before writing files or serving `ginCtx.FileAttachment(...)` (`:419`).
Verdict: ABNORMAL
Evidence: `frontend/lib/api/discussions.ts:87-101`; `backend/internal/controller/discussion/discussion.go:153-177`; `backend/internal/controller/discussion/discussion.go:256-280`; `backend/internal/controller/discussion/discussion.go:330-398`; `backend/internal/controller/discussion/discussion.go:402-419`.
Expected behavior: Only users authorized to access the thread should be able to upload or download its attachments, using the same thread-level authorization contract as `GetThread`/`GetMessages`.
Remediation: Route attachment upload/download through the discussion service or a dedicated authorization helper that verifies the caller is an allowed thread participant before any filesystem access. Also return 404/403 consistently instead of directly serving arbitrary files under the thread directory.

## A-003 Shared authenticated user directory/profile endpoints expose broad user data to any logged-in Author

Role: Author
Feature/Entity: Shared user directory and academic profile lookup
Frontend surface: `/profile/[user_id]`, `frontend/lib/api/user.ts`, author submission/profile flows that can call `/api/v1/users`, `/api/v1/users/search`, `/api/v1/users/:email`, `/api/v1/users/:email/academic-profile`
Backend surface: `GET /api/v1/users`, `GET /api/v1/users/search`, `GET /api/v1/users/:email`, `GET /api/v1/users/:email/academic-profile`
Visible data: Any authenticated Author can enumerate users through list/search, fetch arbitrary user records by email, and retrieve academic profile details plus synced papers for any user email that exists.
Available actions: List users with filters, search users for autocomplete/lookup, read arbitrary user profiles by email, and read arbitrary academic profiles by email.
State/relationship gates: Authentication only at the route group. The controller methods inspected do not require self-access, conference relationship, role membership, or minimal field projection for public lookup.
Frontend enforcement: The profile page distinguishes editability with `isOwnProfile`, but it still loads arbitrary profiles when the route resolves to another email. The frontend therefore reflects the backend’s broad read permissions rather than tightening them.
Backend enforcement: Missing for broad reads. `backend/internal/controller/user/user.go:61-79` lists users directly from storage, `:96-106` returns any user by email, `:266-296` searches users by email, and `:460-470` returns any academic profile by email. None of those methods perform `utils.GetEmail` ownership comparison or conference-scoped authorization checks.
Verdict: ABNORMAL
Evidence: `frontend/app/profile/[user_id]/page.tsx:140-170`; `frontend/lib/api/user.ts:15-27`; `backend/internal/controller/user/user.go:61-79`; `backend/internal/controller/user/user.go:96-106`; `backend/internal/controller/user/user.go:266-296`; `backend/internal/controller/user/user.go:460-470`.
Expected behavior: Shared user discovery should be intentionally scoped. If authors need collaborator lookup, expose only the minimum fields necessary and only in the workflows that need it. Full user records and academic profiles should require explicit authorization or an intentional public-profile contract.
Remediation: Split public lookup from private profile APIs. Restrict `/users` and `/users/:email` to admins/chairs or return minimal collaborator-safe fields; gate `/users/:email/academic-profile` behind an explicit public-profile policy or relationship-based authorization.

## A-004 Reviewer invitation and reviewer dashboard endpoints are callable by any authenticated Author via the generic proxy

Role: Author
Feature/Entity: Reviewer invitations, reviewer roster, reviewer dashboard, reviewer-assigned papers, completed papers
Frontend surface: The generic proxy in `frontend/app/api/backend/[...path]/route.ts` forwards any authenticated request to backend paths. An Author does not need dedicated UI if they can call `/api/backend/api/v1/conferences/:conference_id/reviewers...` or `/api/backend/api/v1/reviewer/:reviewer_email/...` directly.
Backend surface: `GET/POST/PUT/DELETE /api/v1/conferences/:conference_id/reviewers...`, `GET /api/v1/reviewer/:reviewer_email/dashboard`, `GET /api/v1/reviewer/:reviewer_email/conferences/:conference_id/papers`, `GET /api/v1/reviewer/:reviewer_email/completed-papers`
Visible data: Conference reviewer rosters, individual reviewer invitation records, reviewer dashboards keyed by arbitrary reviewer email, conference-specific reviewer-assigned papers, and completed-paper history for arbitrary reviewer emails.
Available actions: List reviewers, fetch reviewer records, batch-invite reviewers, change reviewer invitation status, delete reviewer invitations, fetch dashboard data for any reviewer email, and fetch assigned/completed papers for any reviewer email.
State/relationship gates: JWT authentication only at the route group (`backend/cmd/server/main.go:329-347` and `:404-409`). In the controller methods inspected, there is no chair/co-chair check for reviewer roster management and no reviewer-self check for reviewer dashboard/data reads keyed by `req.ReviewerEmail`.
Frontend enforcement: None at the proxy level. `frontend/app/api/backend/[...path]/route.ts:11-58` simply copies the auth cookie into an `Authorization` header and forwards the request; it does not constrain endpoint families by current role.
Backend enforcement: Missing in controller paths inspected. `backend/internal/controller/reviewer/reviewer.go:79-116` (`BatchInvite`), `:131-154` (`List`), `:169-183` (`Get`), `:198-257` (`UpdateStatus`), `:272-290` (`Delete`), `:309-395` (`GetDashboard`), `:411-444` (`GetConferencePapers`), and `:460-491` (`GetCompletedPapers`) do not verify that the caller is chair/co-chair for the conference or that `req.ReviewerEmail` matches the authenticated principal. The downstream storage methods are plain data fetches keyed by reviewer/conference IDs (`backend/internal/storage/reviewer/reviewer.go:425-520`, `:725-826`, `:982-...`), not user-aware authorization filters.
Verdict: ABNORMAL
Evidence: `frontend/app/api/backend/[...path]/route.ts:11-58`; `backend/cmd/server/main.go:329-347`; `backend/cmd/server/main.go:404-409`; `backend/internal/controller/reviewer/reviewer.go:79-116`; `backend/internal/controller/reviewer/reviewer.go:131-154`; `backend/internal/controller/reviewer/reviewer.go:169-183`; `backend/internal/controller/reviewer/reviewer.go:198-257`; `backend/internal/controller/reviewer/reviewer.go:272-290`; `backend/internal/controller/reviewer/reviewer.go:309-395`; `backend/internal/controller/reviewer/reviewer.go:411-444`; `backend/internal/controller/reviewer/reviewer.go:460-491`; `backend/internal/storage/reviewer/reviewer.go:425-520`.
Expected behavior: Reviewer roster mutation should be limited to conference chairs/co-chairs. Reviewer dashboard and assignment-history endpoints should only be callable by the reviewer whose email/identity is requested, unless an explicit chair/admin read path exists with separate authorization.
Remediation: Add explicit chair/co-chair authorization to reviewer roster CRUD and invitation endpoints, and require `req.ReviewerEmail == authenticated user` for reviewer dashboard/paper-history endpoints unless a stronger admin/chair policy is intentionally introduced.

## A-005 Assignment review listings, analytics, and suggestion-management endpoints lack chair checks and are exposed to any authenticated Author

Role: Author
Feature/Entity: Submission reviews, review analytics, reviewer assignment suggestions, confirmed assignments
Frontend surface: No Author UI is required to reach these because the generic proxy forwards authenticated requests to nested assignment and submission routes.
Backend surface: `GET /api/v1/conferences/:conference_id/submissions/:submission_id/reviews`, `GET /api/v1/conferences/:conference_id/submissions/:submission_id/reviews/analytics`, `GET/POST/DELETE /api/v1/conferences/:conference_id/assignments/suggestions...`, `POST /api/v1/conferences/:conference_id/assignments/suggestions/confirm`, `GET /api/v1/conferences/:conference_id/assignments/confirmed`
Visible data: Submitted reviews with reviewer email, aggregate review analytics, suggested reviewer lists grouped by paper, confirmed assignments grouped by paper, and COI warning outcomes for manual suggestion creation.
Available actions: Read all reviews for a submission, read review analytics, read suggested reviewer assignments, add manual suggestions, confirm suggestions into pending assignments, delete suggestions, and read confirmed assignments.
State/relationship gates: JWT authentication only at the route group (`backend/cmd/server/main.go:413-437`). The controller methods inspected do not enforce chair/co-chair membership before calling storage methods keyed only by conference ID or submission ID.
Frontend enforcement: None at the proxy layer; a logged-in Author can issue the same requests through `/api/backend/...`.
Backend enforcement: Missing in the inspected controller paths. `backend/internal/controller/assignment/assignment.go:389-419` (`ListReviews`), `:436-454` (`GetReviewAnalytics`), `:469-487` (`GetSuggestions`), `:500-518` (`GetConfirmedAssignments`), `:531-613` (`ConfirmSuggestions`), `:624-641` (`DeleteSuggestion`), and `:654-736` (`AddSuggestion`) do not call `utils.IsUserChairOrCoChair` or otherwise compare the caller identity to an authorized conference role, while the storage methods are raw conference/submission queries (`backend/internal/storage/assignment/assignment.go:485-760`, `:821-865`).
Verdict: ABNORMAL
Evidence: `backend/cmd/server/main.go:413-437`; `backend/internal/controller/assignment/assignment.go:389-419`; `backend/internal/controller/assignment/assignment.go:436-454`; `backend/internal/controller/assignment/assignment.go:469-487`; `backend/internal/controller/assignment/assignment.go:500-518`; `backend/internal/controller/assignment/assignment.go:531-613`; `backend/internal/controller/assignment/assignment.go:624-641`; `backend/internal/controller/assignment/assignment.go:654-736`; `backend/internal/storage/assignment/assignment.go:485-760`; `backend/internal/storage/assignment/assignment.go:821-865`.
Expected behavior: These endpoints are chair-only conference-management surfaces. An Author should not be able to enumerate peer reviews, inspect analytics, or manipulate reviewer assignment suggestions unless a very explicit policy says otherwise.
Remediation: Add chair/co-chair authorization checks at controller entry for every review-listing, review-analytics, and suggestion-management endpoint. If any read is intended for authors, expose a separate, minimized author-safe DTO instead of reusing chair endpoints.

## A-006 Submission list/detail/download/rebuttal/camera-ready read endpoints are broadly enumerable to any authenticated Author

Role: Author
Feature/Entity: Conference submissions, submission files, cover letters, rebuttal state, camera-ready artifacts
Frontend surface: Generic proxy plus shared submission API helpers allow direct authenticated calls without an Author-only page path.
Backend surface: `GET /api/v1/conferences/:conference_id/submissions`, `GET /api/v1/conferences/:conference_id/submissions/:submission_id`, `GET /api/v1/conferences/:conference_id/submissions/:submission_id/file`, `GET /api/v1/conferences/:conference_id/submissions/:submission_id/cover_letter`, `GET /api/v1/conferences/:conference_id/submissions/:submission_id/rebuttal`, `GET /api/v1/conferences/:conference_id/submissions/:submission_id/camera-ready`
Visible data: Submission metadata, optional reviewer lists via `includeReviewers=true`, uploaded paper files, cover letters, rebuttal content/assignment statuses, and camera-ready PDFs for arbitrary submissions in the requested conference.
Available actions: Enumerate submissions by conference and optional author filter, fetch any submission by ID, download paper files and cover letters, fetch rebuttal state, and download camera-ready files.
State/relationship gates: Authentication only at the `/conferences` route group. The read controllers inspected generally validate conference/submission ID consistency but do not verify author ownership, reviewer assignment, or chair role before returning data or files.
Frontend enforcement: None at the generic proxy layer. `frontend/lib/api/submissions.ts` and direct `/api/backend/...` calls can target arbitrary conference and submission IDs.
Backend enforcement: Missing in the inspected read controllers. `backend/internal/controller/submission/submission.go:382-423` (`List`) forwards caller-supplied filters into `submissionStorage.List`; `:443-477` (`Get`) returns any submission in the conference and can include reviewers; `:870-910` (`GetFile`) and `:1036-1076` (`GetCoverLetter`) stream files after only conference/submission matching; `:1199-1245` (`GetRebuttal`) returns rebuttal state without caller identity checks; `:1342-1371` (`GetCameraReady`) serves the final artifact without author/chair/reviewer verification. The storage methods shown are plain ID/conference queries (`backend/internal/storage/submission/submission.go:109-170`, `:193-280`), not user-scoped filters.
Verdict: ABNORMAL
Evidence: `backend/cmd/server/main.go:353-369`; `backend/internal/controller/submission/submission.go:382-423`; `backend/internal/controller/submission/submission.go:443-477`; `backend/internal/controller/submission/submission.go:870-910`; `backend/internal/controller/submission/submission.go:1036-1076`; `backend/internal/controller/submission/submission.go:1199-1245`; `backend/internal/controller/submission/submission.go:1342-1371`; `backend/internal/storage/submission/submission.go:109-170`; `backend/internal/storage/submission/submission.go:193-280`.
Expected behavior: Submission reads and artifact downloads should be scoped by caller relationship: authors to their own submissions, assigned reviewers to permitted blind-review materials, and chairs/co-chairs to management views. Camera-ready and rebuttal visibility should follow explicit lifecycle rules.
Remediation: Introduce a shared submission access-policy helper used by `List`, `Get`, `GetFile`, `GetCoverLetter`, `GetRebuttal`, and `GetCameraReady`. Enforce ownership/assignment/chair-role checks before any metadata or file retrieval, and split chair-level detail fields like reviewer lists away from author-safe responses.

## A-007 Author notifications and notification preferences are correctly scoped to the authenticated user

Role: Author
Feature/Entity: Notification list, unread count, per-notification actions, notification preferences
Frontend surface: `/notifications`, `frontend/hooks/use-notifications.ts`, `frontend/lib/api/notifications.ts`
Backend surface: `GET /api/v1/notifications`; `GET /api/v1/notifications/unread-count`; `GET /api/v1/notifications/{id}`; `PATCH /api/v1/notifications/{id}/read`; `PATCH /api/v1/notifications/read-all`; `GET /api/v1/notifications/preferences`; `PUT /api/v1/notifications/preferences`
Visible data: Only notifications whose `user_email` matches the authenticated Author are returned, along with that Author's unread count and notification-preference settings.
Available actions: List notifications with pagination and filters, inspect a single notification, mark one notification as read, mark all notifications as read, delete a notification, read notification preferences, and update notification preferences.
State/relationship gates: Authentication only. Every controller method resolves `userEmail` from the bearer token before it queries or mutates notification state.
Frontend enforcement: The notifications page only calls the user-scoped hooks and endpoints; it does not expose a cross-user selector or arbitrary notification lookup.
Backend enforcement: Correctly enforced in both controller and storage. `backend/internal/controller/notification/notification.go:42-278` always binds the operation to `utils.GetEmail(ginCtx)`, and `backend/internal/storage/notification/notification.go:177-468` filters, updates, and deletes by `user_email`.
Verdict: NORMAL
Evidence: `frontend/app/notifications/page.tsx:99,214,222,267,446`; `frontend/lib/api/notifications.ts:1-129`; `backend/internal/controller/notification/notification.go:42-278`; `backend/internal/storage/notification/notification.go:177-468`
Expected behavior: Notification data and preference state should remain private to the authenticated account and should not be enumerable or writable by other logged-in users.
Remediation: Keep the current user-scoped controller/storage contract and add regression coverage around cross-user notification access and preference mutation.

## A-008 Author new-submission flow is correctly blocked outside open conferences and the backend binds created submissions to the authenticated author

Role: Author
Feature/Entity: New submission form, draft autosave, publish flow, submission creation
Frontend surface: `/role/author/submissions/new`, `frontend/components/author/submit/paper-submission-form.tsx`, `frontend/components/author/submit/submission-action-bar.tsx`
Backend surface: `POST /api/v1/conferences/{conference_id}/submissions`; draft autosave and publish/update submission paths in the same submission controller
Visible data: The form exposes paper metadata, authors, manuscript upload, conflict declarations, review confirmation, and draft/publish controls only after a conference object has been loaded.
Available actions: Save a draft, update an existing draft, publish a new paper, or cancel out of the form. The page does not expose any cross-user submission selection.
State/relationship gates: A new submission is blocked unless `conference.status === "open"`, and publishing is additionally blocked after the conference submission deadline. The backend also rejects non-open conferences and requires a valid author identity before persisting a submission.
Frontend enforcement: `frontend/components/author/submit/paper-submission-form.tsx:143-147,225-305,464-576,821-822` stops draft creation and final submission when the conference is not open or the deadline has passed, and only renders the form once a conference object is available.
Backend enforcement: Correctly enforced in `backend/internal/controller/submission/submission.go:160-344`. The controller requires authentication, checks `conference.Status != model.ConferenceStatusOpen`, sets `req.Submission.Author = userEmail`, validates deadline rules for published submissions, and adds the author role after creation.
Verdict: NORMAL
Evidence: `frontend/app/role/author/submissions/new/page.tsx:29-80`; `frontend/components/author/submit/paper-submission-form.tsx:143-147,225-305,464-576,821-822`; `backend/internal/controller/submission/submission.go:160-344`
Expected behavior: A new author submission should only be accepted while the conference is open and should be persisted under the authenticated author's identity.
Remediation: Keep the frontend precheck and backend open-status/author-binding checks aligned, and add tests for open, closed, and past-deadline submission attempts.

## A-009 Author schedules are scoped to the Author's own conferences and derive events only from that filtered set

Role: Author
Feature/Entity: Author schedules calendar, deadline timeline, ICS export
Frontend surface: `/role/author/schedules`, `frontend/components/schedules/schedules-page-content.tsx`, `frontend/lib/api/schedules.ts`
Backend surface: `GET /api/v1/conferences` with `myConferences=true` and `role=author` filtering
Visible data: Only conference dates, milestones, and deadlines from conferences returned for the authenticated user's Author memberships are shown in the calendar, timeline, stats cards, and exportable ICS payload.
Available actions: Browse the calendar/timeline, filter by conference, and export the filtered schedule as an `.ics` file.
State/relationship gates: The schedule service requests only `myConferences=true` conferences for the current role, so Author schedules cannot expand to unrelated conferences unless the backend conference list is already compromised.
Frontend enforcement: `frontend/app/role/author/schedules/page.tsx:5-17` passes the Author role into the shared schedule content, and `frontend/lib/api/schedules.ts:141-146` requests `myConferences: true` with `role: author`.
Backend enforcement: The schedule view inherits the conference-list contract rather than inventing its own broad read path. The filtered conference list is the only source used to derive the visible events.
Verdict: NORMAL
Evidence: `frontend/app/role/author/schedules/page.tsx:5-17`; `frontend/components/schedules/schedules-page-content.tsx:141-146`; `frontend/lib/api/conferences.ts:245-271`
Expected behavior: An Author schedule should show deadlines and events only for conferences the Author is actually associated with.
Remediation: Keep the `myConferences`/role filter and add regression coverage for the empty-state and multi-conference export paths.

## A-010 Author submission-detail discussion flow correctly limits visibility to author-visible threads while allowing replies on those threads

Role: Author
Feature/Entity: Submission discussion threads, thread messages, author-visible discussion replies
Frontend surface: `/role/author/submissions/[submissionId]` discussion tab, `frontend/components/author/submission-detail/discussion-tab.tsx`, `frontend/components/shared/discussion/DiscussionPanel.tsx`, `frontend/components/shared/discussion/components/thread-card.tsx`
Backend surface: `GET /api/v1/conferences/:conference_id/submissions/:submission_id/threads`; `GET /api/v1/threads/:thread_id`; `GET /api/v1/threads/:thread_id/messages`; `POST /api/v1/threads/:thread_id/messages`
Visible data: An Author sees only the threads returned for that submission by the discussion service, with message histories and visibility labels. The author wrapper restricts creation to `availableVisibilities={["authors"]}`.
Available actions: Read author-visible thread history, quote and delete the Author's own messages in author-visible threads, and reply to author-visible threads. Committee-only and reviewer-only threads remain read-only for the Author UI.
State/relationship gates: The backend only exposes threads when the caller is the submission author, the assigned reviewer, or a chair; message posting additionally requires the conference to be in the reviewing phase and the caller to be a thread participant.
Frontend enforcement: `frontend/components/author/submission-detail/discussion-tab.tsx:77-80,182-186` loads threads/messages for the active submission and constrains creation to author-visible visibility. `frontend/components/shared/discussion/DiscussionPanel.tsx:116,212,282-307` and `frontend/components/shared/discussion/components/thread-card.tsx:256-263` suppress reply controls only on non-author-visible threads.
Backend enforcement: Correctly enforced in `backend/internal/service/discussion/service.go:112-148,214-258`, where `GetThreadsForUser`, `GetMessages`, and `GetThread` check author/reviewer/chair membership, and `AddMessage` requires the user to be a participant during the reviewing phase.
Verdict: NORMAL
Evidence: `frontend/components/author/submission-detail/discussion-tab.tsx:77-80,182-186`; `frontend/components/shared/discussion/DiscussionPanel.tsx:116,212,282-307`; `frontend/components/shared/discussion/components/thread-card.tsx:256-263`; `backend/internal/service/discussion/service.go:112-148,214-258`
Expected behavior: Author discussion access should expose only author-appropriate thread visibility while still permitting the author to participate in those threads when the conference discussion phase allows it.
Remediation: Keep the existing visibility and participant checks, and add tests covering author-visible, reviewer-only, and committee-only thread mixes.

## A-011 Author profile self-service, password change, academic-profile link/unlink, and Semantic Scholar onboarding are correctly tied to the authenticated user

Role: Author
Feature/Entity: Shared profile page account management, password change, academic-profile sync onboarding, Semantic Scholar author lookup
Frontend surface: `/profile/[user_id]`, `frontend/components/profile/profile-onboarding-modal.tsx`, `frontend/components/profile/profile-change-password-modal.tsx`
Backend surface: `GET /api/v1/users/me`; `GET /api/v1/users/me/profile-sync-status`; `GET /api/v1/users/me/academic-profile`; `POST /api/v1/users/link-academic-profile`; `POST /api/v1/users/unlink-academic-profile`; `POST /api/v1/auth/change-password`; `GET /api/v1/semantic-scholar/authors/search`; `GET /api/v1/semantic-scholar/authors/:authorId`; `GET /api/v1/semantic-scholar/authors/:authorId/papers`
Visible data: The Author can read their own account profile, sync lifecycle state, linked academic profile, and candidate Semantic Scholar author records and papers returned by the search/details APIs during onboarding.
Available actions: Load own profile data, poll sync status, change password, search Semantic Scholar authors by name, inspect candidate author details/papers, link a Semantic Scholar profile to the current account, and unlink the current account's linked profile.
State/relationship gates: The profile page computes `isOwnProfile` before exposing edit, onboarding, unlink, and password-change controls. Server-side account mutations derive the acting user from the authenticated token email rather than from caller-supplied target identifiers. Semantic Scholar search/detail routes are authenticated-only but do not mutate another local user's record.
Frontend enforcement: `frontend/app/profile/[user_id]/page.tsx:70-73,120-133,184-196,246-283,367-397` only shows onboarding, unlink, and password-change actions on the caller's own profile. `frontend/components/profile/profile-onboarding-modal.tsx:48-133` performs the search/select/link flow through the self-service profile modal, and `frontend/components/profile/profile-change-password-modal.tsx:20-198` sends the password-change request without exposing another-user target parameter.
Backend enforcement: Present for the self-service operations. `backend/cmd/server/main.go:251-267,486-495` places these routes behind authentication. `backend/internal/controller/user/user.go:122-165,430-444` resolves `GetMe`, `GetProfileSyncStatus`, and `GetAcademicProfile` from the authenticated email. `backend/internal/controller/user/link_profile.go:31-152` links/unlinks using the authenticated email and current user record, not a caller-supplied user target. `backend/internal/controller/auth/auth.go:99-104` binds password change to the authenticated email. `backend/internal/controller/semantic_scholar/semantic_scholar.go:46-220` serves authenticated search/detail lookups only.
Verdict: NORMAL
Evidence: `frontend/app/profile/[user_id]/page.tsx:70-73,120-133,184-196,246-283,367-397`; `frontend/components/profile/profile-onboarding-modal.tsx:48-133`; `frontend/components/profile/profile-change-password-modal.tsx:20-198`; `backend/cmd/server/main.go:251-267,486-495`; `backend/internal/controller/user/user.go:122-165,430-444`; `backend/internal/controller/user/link_profile.go:31-152`; `backend/internal/controller/auth/auth.go:99-104`; `backend/internal/controller/semantic_scholar/semantic_scholar.go:46-220`
Expected behavior: Shared profile self-service should let an Author manage only their own account and linked academic profile, while any external metadata search used during onboarding should remain authenticated and should not alter another local account.
Remediation: Preserve the current authenticated-email binding for account mutations, and add regression tests covering own-profile-only onboarding, unlink, and password-change paths.

## A-012 User-level COI preflight lookup is callable by any authenticated Author and exposes conference-wide author conflict data

Role: Author
Feature/Entity: Shared user COI-check endpoint for conference assignment preflight
Frontend surface: No dedicated Author page in the current tree; callable through the shared authenticated client and generic backend proxy
Backend surface: `GET /api/v1/users/:email/coi-check?conference_id=:conference_id`
Visible data: Conflict-check summaries for an arbitrary user against all authors and co-authors in the target conference, including conflicting author names/emails, reasons, total author count, and conflicting-author count.
Available actions: Ask the backend to evaluate any supplied user email against any conference's author set and retrieve the resulting conflict list.
State/relationship gates: Authentication only. The controller requires a `conference_id` and target email but does not verify that the caller is a chair/co-chair of that conference, a reviewer invitation manager, or the same user being checked.
Frontend enforcement: None in the current Author UI; the route remains callable through `/api/backend/...` or any shared authenticated fetch path.
Backend enforcement: Missing. `backend/cmd/server/main.go:259-273` places the route under the generic authenticated `/users` group. `backend/internal/controller/user/user.go:342-417` validates inputs, loads the target user and conference, enumerates conference submissions/authors, and returns the conflict report without a chair/co-chair or self-ownership authorization check.
Verdict: ABNORMAL
Evidence: `backend/cmd/server/main.go:259-273`; `backend/internal/controller/user/user.go:342-417`
Expected behavior: COI preflight over a conference's author population should be restricted to chair/co-chair assignment workflows or an internal service path, not exposed to arbitrary authenticated Authors.
Remediation: Require chair/co-chair authorization for the target conference before returning any COI report, or move this contract behind an internal assignment-management surface with a narrower response shape.

## Coverage

Inspected frontend Author surfaces: `/role`, `/role/author/**`, `/role/author/conferences/[conferenceId]`, `/role/author/schedules`, `/role/author/submissions`, `/role/author/submissions/new`, `/role/author/submissions/[submissionId]`, `/notifications`, `/profile/[user_id]`, `frontend/app/api/backend/[...path]`, `frontend/app/api/chat/**`, `frontend/lib/api/conferences.ts`, `frontend/lib/api/submissions.ts`, `frontend/lib/api/notifications.ts`, `frontend/lib/api/discussions.ts`, `frontend/lib/api/rebuttal.ts`, `frontend/lib/api/schedules.ts`, `frontend/components/author/**`, `frontend/components/shared/discussion/**`, `frontend/components/shared/rebuttal/**`.
Inspected backend Author-relevant controllers and support layers: `backend/internal/controller/conference/conference.go`, `backend/internal/controller/conference/rebuttal.go`, `backend/internal/controller/submission/submission.go`, `backend/internal/controller/notification/notification.go`, `backend/internal/controller/discussion/discussion.go`, `backend/internal/controller/user/user.go`, `backend/internal/controller/user/link_profile.go`, `backend/internal/controller/auth/auth.go`, `backend/internal/controller/reviewer/reviewer.go`, `backend/internal/controller/assignment/assignment.go`, `backend/internal/controller/semantic_scholar/**`, `backend/internal/service/discussion/service.go`, `backend/internal/storage/notification/notification.go`, `backend/internal/storage/conference/conference.go`, `backend/internal/storage/submission/submission.go`, `backend/internal/storage/discussion/discussion.go`, `backend/internal/storage/reviewer/reviewer.go`, `backend/internal/storage/assignment/assignment.go`, `ai-service/app/api/routes.py`, `ai-service/app/core/auth.py`, `ai-service/app/repositories/session_repo.py`.
Gaps: `frontend/app/role/author/conferences/[conferenceId]/submissions/[submissionId]/page.tsx` is not present in this tree, so that nested author route could not be inspected. GitNexus MCP tools were not available in this session, so index-backed graph validation and impact analysis could not be re-run here.

## Chair

## C-001 Frontend role selector grants Chair UI access to any authenticated user

Role: Chair
Feature/Entity: Shared role selection and chair route guard
Frontend surface: `/role`, `/role/chair/**`
Backend surface: None at the frontend guard layer; backend relies on downstream API authorization
Visible data: Any authenticated user is treated as eligible for the Chair workspace in the role selector and route guard, so Chair-only navigation, management screens, and any frontend-rendered conference-management data/components become reachable in the browser even without chair membership.
Available actions: Any authenticated user can select the Chair role, persist it in session/local storage, and pass the client-side Chair route guard.
State/relationship gates: Authentication only. No chair/co-chair conference role is required.
Frontend enforcement: `frontend/lib/role-access.ts` hardcodes `["author", "reviewer", "chair"]` in `BASE_PLATFORM_ROLES` and merges those into every authenticated user's accessible roles. `frontend/lib/use-role-route-guard.ts` trusts `canAccessRole`. `frontend/app/role/page.tsx` filters displayed role cards with the same `canAccessRole` check. `frontend/lib/session-manager.ts` also uses `canAccessRole` before persisting role choice.
Backend enforcement: None at this layer. The frontend guard is purely client-side and is not backed by a server-issued chair entitlement check.
Verdict: ABNORMAL
Evidence: `frontend/lib/role-access.ts:3-14`; `frontend/lib/use-role-route-guard.ts:14-46`; `frontend/app/role/page.tsx:220-227`; `frontend/lib/session-manager.ts:77-78,184-197`
Expected behavior: The Chair workspace should only be reachable when the authenticated user is globally entitled to chair capabilities or has conference-specific chair/co-chair membership that the frontend understands from backend data.
Remediation: Remove the hardcoded universal role grant and drive Chair visibility from backend role data. Keep the client guard as a convenience only after server-backed authorization is known, not as the source of truth.

## C-002 Reviewer management endpoints are callable by any authenticated user, not just conference chairs

Role: Chair
Feature/Entity: Reviewer invitation and reviewer roster management
Frontend surface: Chair conference detail screens that manage committee/reviewer invitations; any manually crafted request to reviewer endpoints
Backend surface: `GET /api/v1/conferences/:conference_id/reviewers`; `GET /api/v1/conferences/:conference_id/reviewers/:reviewer_id`; `POST /api/v1/conferences/:conference_id/reviewers`; `PUT /api/v1/conferences/:conference_id/reviewers/:reviewer_id/status`; `DELETE /api/v1/conferences/:conference_id/reviewers/:reviewer_id`
Visible data: Full reviewer invitation records for the conference, including invitation status and reviewer identity fields returned by the reviewer storage layer.
Available actions: List conference reviewers, inspect a single reviewer invitation, batch-invite reviewers, accept/reject a reviewer invitation by ID, and delete a reviewer invitation.
State/relationship gates: Only authentication and basic path consistency. The controller verifies that the reviewer record belongs to the target conference, but it does not verify that the caller is a chair/co-chair or that the caller is the invited reviewer when changing invitation status.
Frontend enforcement: Chair UI may be intended to hide these controls from non-chairs, but the shared frontend proxy can still call the backend endpoints directly once the user is authenticated.
Backend enforcement: The reviewer controller methods `BatchInvite`, `List`, `Get`, `UpdateStatus`, and `Delete` contain no `utils.GetEmail(...)`/chair-role check and no ownership check for reviewer self-service status changes. `UpdateStatus` even grants reviewer conference role membership through `roleStorage.AddRole(...)` after any accepted status update.
Verdict: ABNORMAL
Evidence: Route wiring at `backend/cmd/server/main.go:343-347`; missing authorization in `backend/internal/controller/reviewer/reviewer.go:89,146,187,218,302`; role grant side effect in `backend/internal/controller/reviewer/reviewer.go:243`
Expected behavior: Only a chair/co-chair should list, invite, inspect, or remove conference reviewers. Invitation acceptance/rejection should be limited to the invited reviewer and possibly chair-side administrative overrides, never to arbitrary authenticated users.
Remediation: Gate reviewer management endpoints with explicit chair/co-chair checks. Split reviewer self-service invitation response into a separate endpoint that verifies `reviewer.Email == authenticated user email` before allowing status changes.

## C-003 Chair conference explorer and detail pages can read unrelated conference records through globally scoped endpoints

Role: Chair
Feature/Entity: Conference explorer and conference detail outside the chair's own conferences
Frontend surface: `/role/chair/conferences` explore tab and conference detail routing
Backend surface: `GET /api/v1/conferences`; `GET /api/v1/conferences/:conference_id`
Visible data: Full conference DTOs for unrelated conferences, including chair/co-chair identities and full configuration payloads.
Available actions: Browse global conference records, open detail pages for conferences where the current chair has no affiliation, and inspect returned metadata.
State/relationship gates: Authentication only. Backend list/detail do not require chair membership. Storage applies role filtering only when the caller explicitly asks for `myConferences=true`; otherwise it returns the global set. The chair explore client calls the unscoped list endpoint and filters statuses client-side.
Frontend enforcement: `ChairConferences` uses `listConferences(...)` with `myConferences=true, role=chair` for the chair's own conferences, but its explore tab calls `listConferences(...)` without scope filters and simply strips some statuses in the browser.
Backend enforcement: `conference.Controller.List` and `Get` do not call `utils.IsUserChairOrCoChair(...)`; only mutation/stats endpoints do.
Verdict: ABNORMAL
Evidence: Frontend explore usage at `frontend/components/chair/chair-conferences.tsx:226-237`; detail/list API helpers at `frontend/lib/api/conferences.ts:21-23,245-271`; backend unguarded list/get at `backend/internal/controller/conference/conference.go:133,187`; storage global/default behavior at `backend/internal/storage/conference/conference.go:150,254,312,334-385`
Expected behavior: A chair should only see the global explorer payload if the product intentionally exposes a public conference catalog. Private/draft conference metadata and internal config should not be retrievable from the same full-detail endpoint.
Remediation: Separate public explorer DTOs from chair-private conference DTOs, and restrict full conference detail to authorized conference participants when the conference is not meant to be globally visible.

## C-004 Chair-only conference mutations and statistics are backed by server-side chair/co-chair checks

Role: Chair
Feature/Entity: Conference update, delete, and statistics
Frontend surface: Chair conference management pages
Backend surface: `PUT /api/v1/conferences/:conference_id`; `DELETE /api/v1/conferences/:conference_id`; `GET /api/v1/conferences/:conference_id/stats`
Visible data: Conference stats are available only after passing chair/co-chair authorization.
Available actions: Update conference metadata, delete a conference, and fetch conference statistics.
State/relationship gates: Caller must be authenticated and hold chair/co-chair role membership for the target conference as resolved through `conference_user_roles`.
Frontend enforcement: Chair UI is intended to expose these actions in management views, but the meaningful control is on the backend.
Backend enforcement: The controller extracts the authenticated email and denies access unless `utils.IsUserChairOrCoChair(...)` succeeds before update/delete/stats execution.
Verdict: NORMAL
Evidence: Server-side checks at `backend/internal/controller/conference/conference.go:212-230,256-265,539-547`
Expected behavior: Conference-wide management mutations and statistics should be restricted to authorized chairs/co-chairs.
Remediation: Keep these server-side checks and apply the same standard to the read-side management surfaces that currently remain unscoped.

## C-005 Chat session and history access is properly scoped to the authenticated user

Role: Chair
Feature/Entity: AI chat transport, session list, session history, session deletion
Frontend surface: `frontend/app/api/chat/route.ts`; `frontend/app/api/chat/sessions/route.ts`; `frontend/app/api/chat/sessions/[threadId]/route.ts`
Backend surface: `POST /api/v1/agent/chat`; `GET /api/v1/agent/sessions`; `GET /api/v1/agent/sessions/:thread_id/history`; `DELETE /api/v1/agent/sessions/:thread_id`
Visible data: Only the authenticated chair user's own chat sessions and history.
Available actions: Start/resume chat, list owned sessions, fetch owned history, delete owned sessions, submit tool results for owned pending tool calls.
State/relationship gates: Valid bearer token plus ai-service identity resolution. Session ownership is enforced with `user_id` equality before thread reuse/history/deletion/tool-result handling.
Frontend enforcement: The chat routes require the auth cookie and forward the bearer token to ai-service.
Backend enforcement: ai-service validates the token against the backend identity service and blocks cross-user thread access through `session.user_id != identity.user_id` and `get_owned_session(...)`.
Verdict: NORMAL
Evidence: Frontend auth forwarding at `frontend/app/api/chat/route.ts:57-59,81,106-110`, `frontend/app/api/chat/sessions/route.ts:18-26`, `frontend/app/api/chat/sessions/[threadId]/route.ts:20-31,53-67`; ai-service ownership checks at `ai-service/app/api/routes.py:53,59,171-172,232,268,280,304,316,433-434`; repository ownership helpers at `ai-service/app/repositories/session_repo.py:24,30-42,67,124-125`
Expected behavior: Chat state should be private per authenticated user regardless of role.
Remediation: Preserve the current ownership checks and cover them with explicit access-control tests.

## C-001 Frontend role gating allows any authenticated user to enter Chair UI

Role: Chair
Feature/Entity: Shared role selection and chair route guards
Frontend surface: `/role`, `/role/chair/**`, `frontend/lib/role-access.ts`, `frontend/lib/use-role-route-guard.ts`, `frontend/lib/session-manager.ts`
Backend surface: None at this layer; backend enforcement is separate
Visible data: Any authenticated account can see the Chair role card and satisfy the chair route guard client-side.
Available actions: Any authenticated user can switch into local Chair role state and navigate into chair pages, even without chair membership.
State/relationship gates: Authentication only. `BASE_PLATFORM_ROLES` hardcodes `author`, `reviewer`, and `chair` for every authenticated user.
Frontend enforcement: Broken. `frontend/lib/role-access.ts:3-14`, `frontend/lib/use-role-route-guard.ts:28-42`, `frontend/lib/session-manager.ts:78`, and `frontend/app/role/page.tsx:221-227` all trust the same overly broad role helper.
Backend enforcement: Separate and inconsistent by endpoint; this finding is about the UI/route contract itself being wrong.
Verdict: ABNORMAL
Evidence: `frontend/lib/role-access.ts:3,10,13-14`; `frontend/lib/use-role-route-guard.ts:28-42`; `frontend/lib/session-manager.ts:78`; `frontend/app/role/page.tsx:221-227`.
Expected behavior: Only users with actual chair/co-chair capability should be able to enter chair workspace routes client-side.
Remediation: Remove the hardcoded platform-role grant and source route access from backend-issued role claims.

## C-002 Discussion attachment endpoints only require authentication, not thread authorization

Role: Chair
Feature/Entity: Discussion attachments
Frontend surface: Shared discussion API helper in `frontend/lib/api/discussions.ts`
Backend surface: `POST /api/v1/threads/:thread_id/attachments`, `GET /api/v1/threads/:thread_id/attachments/:filename`
Visible data: Any authenticated Chair can fetch thread attachments if they know a valid thread ID and filename, regardless of whether the thread itself would pass the normal discussion access checks.
Available actions: Upload attachments to arbitrary thread directories and download existing attachments.
State/relationship gates: Authentication only in the controller code inspected.
Frontend enforcement: None beyond calling the helper with a thread ID.
Backend enforcement: `GetThread`/`GetMessages` use service-level access checks, but `UploadAttachment`/`DownloadAttachment` only verify `utils.GetUserID(ginCtx)` before filesystem access.
Verdict: ABNORMAL
Evidence: `frontend/lib/api/discussions.ts:87-101`; `backend/internal/controller/discussion/discussion.go:153-177`; `backend/internal/controller/discussion/discussion.go:256-280`; `backend/internal/controller/discussion/discussion.go:330-398`; `backend/internal/controller/discussion/discussion.go:402-419`.
Expected behavior: Thread attachments should inherit the same participant/role authorization as thread metadata and messages.
Remediation: Enforce thread-level access in attachment upload/download before any file read/write.

## C-003 Shared user directory and academic-profile reads are broad for any authenticated Chair

Role: Chair
Feature/Entity: Shared user lookup and academic profiles
Frontend surface: `/profile/[user_id]`, `frontend/lib/api/user.ts`, `frontend/lib/profile/resolve-user-email.ts`
Backend surface: `GET /api/v1/users`, `GET /api/v1/users/search`, `GET /api/v1/users/:email`, `GET /api/v1/users/:email/academic-profile`
Visible data: Full user records by email plus synced academic-profile details/papers for arbitrary users.
Available actions: Enumerate users, search users, fetch arbitrary user records, fetch arbitrary academic profiles.
State/relationship gates: Authenticated-only. The inspected controller methods do not distinguish chair/admin lookup from generic logged-in lookup.
Frontend enforcement: The profile page only hides editing when `isOwnProfile` is false; it still reads the other user’s data.
Backend enforcement: Missing for broad reads. `backend/internal/controller/user/user.go:61-79`, `:96-106`, `:266-296`, and `:460-470` do not apply role, conference, or ownership checks.
Verdict: ABNORMAL
Evidence: `frontend/app/profile/[user_id]/page.tsx:140-170`; `frontend/lib/api/user.ts:15-27`; `frontend/lib/profile/resolve-user-email.ts:28-39`; `backend/internal/controller/user/user.go:61-79`; `backend/internal/controller/user/user.go:96-106`; `backend/internal/controller/user/user.go:266-296`; `backend/internal/controller/user/user.go:460-470`.
Expected behavior: Public lookup and private profile retrieval should be intentionally separated and minimally scoped.
Remediation: Split minimal collaborator lookup from full profile APIs and add explicit authorization policy for academic-profile reads.

## C-006 Chair submission detail and artifact visibility are globally readable instead of chair-scoped

Role: Chair
Feature/Entity: Conference submission list, submission detail, manuscript/cover-letter/rebuttal/camera-ready artifacts, and chair review tabs
Frontend surface: `frontend/app/role/chair/conferences/[conferenceId]/submissions`, `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]`, `frontend/components/chair/conference-detail/conference-submissions.tsx`, `frontend/components/chair/conference-detail/submission-detail-content.tsx`, `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`, `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`
Backend surface: `GET /api/v1/conferences/:conference_id/submissions`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/file`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/cover_letter`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/rebuttal`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/camera-ready`
Visible data: Submission ID, title, author, status, review counts/scores, full submission metadata, manuscript file metadata/downloads, cover-letter downloads, rebuttal phase content/status, camera-ready artifacts, reviewer scores, rebuttal points, reviewer acknowledgments, and discussion context rendered in the chair detail tabs.
Available actions: Open submission rows from the chair conference table, drill into submission detail, inspect/download manuscript and cover-letter artifacts, inspect rebuttal state, and browse chair-side review/discussion tabs.
State/relationship gates: Only `conference_id` and `submission_id` existence are checked on the read endpoints. No chair/co-chair membership or conference-participant gate exists on `List`, `Get`, `GetFile`, `GetCoverLetter`, `GetRebuttal`, or `GetCameraReady`.
Frontend enforcement: The chair UI calls the submission and review helpers directly from the chair pages and renders the returned records without an additional ownership check. The route guard only gates entry into the chair workspace, not access to these records.
Backend enforcement: Missing for the chair-facing read paths. `backend/internal/controller/submission/submission.go:382-443,870-910,1036-1076,1199-1245,1342-1371` only verifies authentication or path consistency and does not require chair membership.
Verdict: ABNORMAL
Evidence: `frontend/components/chair/conference-detail/conference-submissions.tsx:104,121-145,361`; `frontend/components/chair/conference-detail/submission-detail-content.tsx:12-14,300-330`; `frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx:844-962`; `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx:31-40,94-102,186-194`; `backend/internal/controller/submission/submission.go:382-443,870-910,1036-1076,1199-1245,1342-1371`
Expected behavior: Chair submission inspection should be limited to submissions in conferences the chair/co-chair is authorized to manage, and raw artifacts should only be downloadable when that authorization is explicitly verified.
Remediation: Add chair/co-chair authorization to the submission read and artifact endpoints, or split public summary endpoints from chair-private detail/artifact routes so raw paper files cannot be enumerated through a generic authenticated session.

## C-007 Chair assignment admin surface exposes review suggestions, confirmed assignments, and review visibility without chair enforcement

Role: Chair
Feature/Entity: Reviewer assignment suggestions, confirmed assignments, review list, and review analytics for submissions
Frontend surface: `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]`, `frontend/components/chair/conference-detail/conference-assignments.tsx`, `frontend/lib/api/suggestions.ts`, `frontend/lib/api/reviews.ts`
Backend surface: `GET /api/v1/conferences/:conference_id/submissions/:submission_id/reviews`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/reviews/analytics`; `GET /api/v1/conferences/:conference_id/assignments/suggestions`; `POST /api/v1/conferences/:conference_id/assignments/suggestions/confirm`; `DELETE /api/v1/conferences/:conference_id/assignments/suggestions/:assignment_id`; `POST /api/v1/conferences/:conference_id/assignments/suggestions`; `GET /api/v1/conferences/:conference_id/assignments/confirmed`
Visible data: Per-submission review rows, reviewer emails, criteria, feedback, scores, aggregate analytics, suggested reviewers with match scores, confirmed reviewer rosters, assignment statuses, and review-status progress.
Available actions: Load suggestions, confirm all suggestions, confirm a subset of suggestions, delete a suggestion, manually add a suggested reviewer, and load confirmed assignments. The chair review tab also renders review and rebuttal-derived scores and acknowledgments from the returned data.
State/relationship gates: The controller methods inspected do not enforce chair/co-chair membership for `ListReviews`, `GetReviewAnalytics`, `GetSuggestions`, `GetConfirmedAssignments`, `ConfirmSuggestions`, `DeleteSuggestion`, or `AddSuggestion`. They only rely on authentication and conference/submission identifiers.
Frontend enforcement: The chair assignments UI is the intended caller, but there is no additional client-side authorization beyond entering the chair route. The same data is used to render the chair review tab and assignment management tables.
Backend enforcement: Missing for the listed assignment and review-visibility endpoints. `backend/internal/controller/assignment/assignment.go:396-419,442-487,505-613,648-736` lacks a chair/co-chair check on the management reads and mutations.
Verdict: ABNORMAL
Evidence: `frontend/components/chair/conference-detail/conference-assignments.tsx:181-205,223-315,340-770`; `frontend/lib/api/suggestions.ts:83-238`; `frontend/lib/api/reviews.ts:237-325`; `backend/internal/controller/assignment/assignment.go:396-419,442-487,505-613,648-736`
Expected behavior: Only a chair/co-chair should be able to inspect, confirm, add, or delete reviewer assignments and to view submission-level review analytics and roster data for conferences they manage.
Remediation: Add explicit chair/co-chair authorization in the assignment controller for all management reads and mutations, and keep reviewer-facing assignment APIs separate from chair-side administrative APIs.

## C-008 Chair conference create/edit, templates, schedule aggregation, and auto-assign/archive controls are backed by the expected server-side gates

Role: Chair
Feature/Entity: Conference creation, conference editing, conference templates, schedule timeline, auto-assign, and conference archive/status controls
Frontend surface: `frontend/app/role/chair/conferences/new`, `frontend/app/role/chair/conferences/[conferenceId]/edit`, `frontend/app/role/chair/templates/new`, `frontend/app/role/chair/schedules`, `frontend/components/chair/conference-form-page.tsx`, `frontend/components/chair/conference-template-sheet.tsx`, `frontend/components/chair/conference-detail/chair-actions-panel.tsx`, `frontend/components/schedules/schedules-page-content.tsx`, `frontend/lib/api/schedules.ts`
Backend surface: `POST /api/v1/conferences`; `PUT /api/v1/conferences/:conference_id`; `PUT /api/v1/conferences/:conference_id/status`; `POST /api/v1/conferences/:conference_id/submissions/auto-assign`; `GET/POST/PUT/DELETE /api/v1/conference-config-templates`; plus the chair-owned conference list/detail sources used by the schedule aggregator
Visible data: Conference form fields, conference draft state, personal template names/descriptions/sections, schedule events derived from the caller’s conferences, dashboard stats, and chair action buttons for auto-assignment and archive/unarchive.
Available actions: Create a conference, edit an existing conference, save or reuse a personal conference template, browse a calendar-style schedule for conferences the user owns, trigger reviewer auto-assignment, and transition a conference between archived and active states.
State/relationship gates: Creation is authenticated-only and writes chair/co-chair role data for the creator. Update/delete/status transitions and auto-assign require chair/co-chair membership. Template CRUD is owner-scoped by `ownerEmail`. The schedule page uses `myConferences: true` and the caller role when aggregating events, so it only derives timelines from the user’s conferences.
Frontend enforcement: The route guard only controls navigation into the chair workspace; the actual create/edit/template form components are thin clients over the API helpers. The template sheet explicitly treats saved templates as personal. The schedule page does not reach for the global conference explorer.
Backend enforcement: Present for the management operations inspected. `backend/internal/controller/conference/conference.go:62-80,212-239,256-269,432-520`; `backend/internal/controller/assignment/assignment.go:105-168`; `backend/internal/storage/conference_template/conference_template.go:34-230`; `frontend/lib/api/schedules.ts:141-223`
Verdict: NORMAL
Evidence: `frontend/app/role/chair/conferences/new/page.tsx:1-7`; `frontend/app/role/chair/conferences/[conferenceId]/edit/page.tsx:1-10`; `frontend/app/role/chair/templates/new/page.tsx:1-19`; `frontend/app/role/chair/schedules/page.tsx:1-18`; `frontend/components/chair/conference-form-page.tsx:7-12,88-104,131-184,286-430`; `frontend/components/chair/conference-template-sheet.tsx:94-307`; `frontend/components/chair/conference-template-sheet.tsx:308-430`; `frontend/components/chair/conference-detail/chair-actions-panel.tsx:35-143`; `frontend/components/schedules/schedules-page-content.tsx:3-223`; `frontend/lib/api/schedules.ts:138-223`; `backend/internal/controller/conference/conference.go:62-80,212-269,432-520`; `backend/internal/storage/conference_template/conference_template.go:34-230`
Expected behavior: Chair management forms should stay as UX entry points while the server enforces the real authorization boundaries for conference creation, edits, status transitions, and template ownership.
Remediation: Keep the current split of client UX and server authorization. Add tests if needed around the create/edit/template flows so the owner-scoped and chair-scoped assumptions stay intact.

## C-009 Chair rebuttal, COI, notifications, and decision-advisory surfaces are correctly constrained by server-side checks

Role: Chair
Feature/Entity: Rebuttal settings/management, COI dashboard and rebuild, notification center and preferences, and submission decision advisory
Frontend surface: `frontend/app/notifications/page.tsx`, `frontend/components/chair/conference-detail/conference-rebuttal-settings.tsx`, `frontend/components/chair/conference-detail/conference-rebuttal-management.tsx`, `frontend/components/chair/conference-detail/conference-coi.tsx`, `frontend/components/chair/conference-detail/submission-detail/chair-decision-copilot-panel.tsx`, `frontend/lib/api/notifications.ts`, `frontend/lib/api/conference-rebuttal.ts`, `frontend/lib/api/coi.ts`, `frontend/lib/api/chair-decision-copilot.ts`
Backend surface: `GET/PATCH /api/v1/conferences/:conference_id/rebuttal/settings`; `POST /api/v1/conferences/:conference_id/rebuttal/open`; `POST /api/v1/conferences/:conference_id/rebuttal/finalize`; `POST /api/v1/conferences/:conference_id/rebuttal/open-discussion`; `GET /api/v1/coi/dashboard/stats/:conference_id`; `GET /api/v1/coi/relationships`; `GET /api/v1/coi/papers`; `POST /api/v1/coi/conferences/:conference_id/rebuild`; `GET/GET-COUNT/PATCH/DELETE /api/v1/notifications`; `GET/POST /api/v1/conferences/:conference_id/submissions/:submission_id/decision-copilot`
Visible data: Rebuttal phase state and deadlines, rebuttal submission counts, COI statistics and relationship rows, decision-advisory synthesis, review analytics summaries, notification lists/unread counts, and notification preference settings.
Available actions: Open/finalize rebuttal, save rebuttal settings, open discussion, inspect and rebuild COI data, fetch notification lists and unread counts, mark notifications read, update preferences, and generate/regenerate/lookup decision advice.
State/relationship gates: Rebuttal settings and phase changes require chair/co-chair membership for the conference. COI dashboard, relationships, and rebuild require chair/co-chair membership. Notifications are scoped to the authenticated user via their email. Decision copilot requires chair/co-chair membership and the target submission/conference pairing to match.
Frontend enforcement: The chair and notification routes are thin clients that call API helpers directly. The meaningful boundary is on the server, not in the browser. The COI view is explicitly API-backed and the decision advisory panel is advisory only.
Backend enforcement: Present. `backend/internal/controller/conference/rebuttal.go:21-153` calls `assertChairOrCoChair`; `backend/internal/controller/coi/coi.go:44-283` enforces `IsUserChairOrCoChair`; `backend/internal/controller/notification/notification.go:42-286` scopes every read/mutation by authenticated user email; `backend/internal/controller/submission/decision_copilot.go:25-136` requires chair/co-chair before building or resolving decision evidence.
Verdict: NORMAL
Evidence: `frontend/app/notifications/page.tsx:90-214`; `frontend/lib/api/notifications.ts:72-168`; `frontend/components/chair/conference-detail/conference-rebuttal-settings.tsx:15-188`; `frontend/components/chair/conference-detail/conference-rebuttal-management.tsx:44-243`; `frontend/components/chair/conference-detail/conference-coi.tsx:149-503`; `frontend/components/chair/conference-detail/submission-detail/chair-decision-copilot-panel.tsx:169-478`; `frontend/lib/api/conference-rebuttal.ts:27-88`; `frontend/lib/api/coi.ts:88-205`; `frontend/lib/api/chair-decision-copilot.ts:88-124`; `backend/internal/controller/conference/rebuttal.go:21-153`; `backend/internal/controller/coi/coi.go:44-283`; `backend/internal/controller/notification/notification.go:42-286`; `backend/internal/controller/submission/decision_copilot.go:25-136`
Expected behavior: Chair-only conference lifecycle actions, COI tooling, notification handling, and decision synthesis should remain server-authorized and should not rely on frontend route visibility.
Remediation: Keep the current checks and add access-control tests around the conference rebuttal, COI, notification, and decision-copilot flows so the chair-only contract remains explicit.

## C-010 Shared profile self-service, password change, academic-profile onboarding, and Semantic Scholar search are correctly bound to the authenticated Chair

Role: Chair
Feature/Entity: Shared profile page account management, password change, academic-profile sync onboarding, Semantic Scholar author lookup
Frontend surface: `/profile/[user_id]`, `frontend/components/profile/profile-onboarding-modal.tsx`, `frontend/components/profile/profile-change-password-modal.tsx`
Backend surface: `GET /api/v1/users/me`; `GET /api/v1/users/me/profile-sync-status`; `GET /api/v1/users/me/academic-profile`; `POST /api/v1/users/link-academic-profile`; `POST /api/v1/users/unlink-academic-profile`; `POST /api/v1/auth/change-password`; `GET /api/v1/semantic-scholar/authors/search`; `GET /api/v1/semantic-scholar/authors/:authorId`; `GET /api/v1/semantic-scholar/authors/:authorId/papers`
Visible data: The Chair can read their own account profile, sync lifecycle state, linked academic profile, and candidate Semantic Scholar author records and papers during onboarding from the shared profile page.
Available actions: Load own profile data, poll sync status, change password, search Semantic Scholar authors by name, inspect candidate author details/papers, link a Semantic Scholar profile to the current account, and unlink the current account's linked profile.
State/relationship gates: The shared profile page computes `isOwnProfile` before exposing edit, onboarding, unlink, and password-change actions. The mutation endpoints derive the acting account from the authenticated email, not from a caller-supplied target user. Semantic Scholar lookup is authenticated-only and does not mutate another local user's profile.
Frontend enforcement: `frontend/app/profile/[user_id]/page.tsx:70-73,120-133,184-196,246-283,367-397` only renders onboarding, unlink, and password-change controls for the caller's own profile. `frontend/components/profile/profile-onboarding-modal.tsx:48-133` and `frontend/components/profile/profile-change-password-modal.tsx:20-198` implement the self-service onboarding and password-change flows without exposing a cross-user target.
Backend enforcement: Present for the account-management operations. `backend/cmd/server/main.go:251-267,486-495` places these routes behind authentication. `backend/internal/controller/user/user.go:122-165,430-444` resolves self-profile and sync status from the token email. `backend/internal/controller/user/link_profile.go:31-152` links/unlinks the current authenticated user's academic profile. `backend/internal/controller/auth/auth.go:99-104` changes password for the authenticated email only. `backend/internal/controller/semantic_scholar/semantic_scholar.go:46-220` serves authenticated author lookup only.
Verdict: NORMAL
Evidence: `frontend/app/profile/[user_id]/page.tsx:70-73,120-133,184-196,246-283,367-397`; `frontend/components/profile/profile-onboarding-modal.tsx:48-133`; `frontend/components/profile/profile-change-password-modal.tsx:20-198`; `backend/cmd/server/main.go:251-267,486-495`; `backend/internal/controller/user/user.go:122-165,430-444`; `backend/internal/controller/user/link_profile.go:31-152`; `backend/internal/controller/auth/auth.go:99-104`; `backend/internal/controller/semantic_scholar/semantic_scholar.go:46-220`
Expected behavior: A Chair should be able to manage only their own account and linked academic profile from the shared profile page, and external metadata lookup used for onboarding should not implicitly grant access to another local user's settings.
Remediation: Preserve the existing authenticated-email binding and add regression tests for own-profile-only onboarding, unlink, and password-change behavior.

## C-011 User-level COI preflight lookup is not chair-scoped on the backend even though it exposes conference-wide author conflict data

Role: Chair
Feature/Entity: Shared user COI-check endpoint for reviewer-assignment preflight
Frontend surface: No dedicated Chair button found in the current tree; callable through the shared authenticated client and generic backend proxy
Backend surface: `GET /api/v1/users/:email/coi-check?conference_id=:conference_id`
Visible data: Conflict-check summaries for an arbitrary user against all authors and co-authors in the target conference, including conflicting author names/emails, reasons, total author count, and conflicting-author count.
Available actions: Evaluate any supplied user email against any conference's author set and retrieve the resulting conflict list.
State/relationship gates: Authentication only. The implementation does not verify that the caller is a chair/co-chair of the target conference even though the feature is assignment-management-oriented.
Frontend enforcement: None in the current Chair UI; the endpoint remains callable via the generic authenticated proxy even without a dedicated screen.
Backend enforcement: Missing the expected chair constraint. `backend/cmd/server/main.go:259-273` registers the route under the generic authenticated `/users` group. `backend/internal/controller/user/user.go:342-417` loads the target user, conference, and all conference submissions/authors, then returns the COI report without a chair/co-chair authorization check.
Verdict: ABNORMAL
Evidence: `backend/cmd/server/main.go:259-273`; `backend/internal/controller/user/user.go:342-417`
Expected behavior: Conference-wide COI preflight should be restricted to chair/co-chair assignment workflows or an internal service path, not left as a generally authenticated user lookup.
Remediation: Require chair/co-chair authorization for the target conference before returning the COI report, or move the feature behind an internal assignment-management route that cannot be called by arbitrary authenticated users.

## Coverage

Inspected frontend chair surfaces and shared client gates: `frontend/app/role/chair/**`, `frontend/app/notifications/page.tsx`, `frontend/app/profile/[user_id]/page.tsx`, `frontend/app/api/backend/[...path]/route.ts`, `frontend/app/api/chat/**`, `frontend/lib/auth-context.tsx`, `frontend/lib/role-access.ts`, `frontend/lib/use-role-route-guard.ts`, `frontend/lib/routes.ts`, `frontend/lib/navigation.ts`, `frontend/lib/session-manager.ts`, and the chair-relevant API helpers under `frontend/lib/api/**` including `conferences`, `submissions`, `reviews`, `suggestions`, `notifications`, `coi`, `conference-rebuttal`, `chair-decision-copilot`, `rebuttal`, `schedules`, `conference-templates`, `discussions`, and `user`.
Inspected chair-facing component trees: `frontend/components/chair/**`, `frontend/components/schedules/**`, `frontend/components/notifications/**`, and the shared discussion components reached from chair discussion tabs.
Inspected backend routing and enforcement: `backend/cmd/server/main.go`, `backend/internal/middleware/auth.go`, `backend/internal/utils/context_helper.go`, `backend/internal/utils/role_check.go`, `backend/internal/controller/auth/**`, `backend/internal/controller/conference/**`, `backend/internal/controller/reviewer/**`, `backend/internal/controller/assignment/**`, `backend/internal/controller/submission/**`, `backend/internal/controller/discussion/**`, `backend/internal/controller/notification/**`, `backend/internal/controller/user/**`, `backend/internal/controller/coi/**`, `backend/internal/controller/semantic_scholar/**`, `backend/internal/storage/conference_template/**`, `backend/internal/storage/conference/**`, `backend/internal/storage/submission/**`, `backend/internal/storage/assignment/**`, `backend/internal/storage/reviewer/**`, `backend/internal/storage/discussion/**`, `backend/internal/storage/notification/**`, `backend/internal/storage/conference_user_role/**`, and the discussion/notification/coi service layers that back those controllers.
Inspected chat/auth-proxied auxiliary surfaces: `backend/internal/agentquery/**`, `ai-service/app/api/routes.py`, `ai-service/app/core/auth.py`, and `ai-service/app/repositories/session_repo.py` for the authenticated chat/session flow.
Gaps: No source directory requested for the Chair audit was inaccessible in this session. Tooling was constrained because `rg.exe` was blocked and GitNexus MCP tools were unavailable, so inspection used PowerShell reads plus the local `.gitnexus/meta.json` freshness check instead of GitNexus queries.

## Reviewer

## R-001 Frontend role selector grants Reviewer UI access to any authenticated user

Role: Reviewer
Feature/Entity: Shared role selection and reviewer route guard
Frontend surface: `/role`, `/role/reviewer/**`
Backend surface: None at the frontend guard layer; backend relies on downstream API authorization
Visible data: Any authenticated user is treated as eligible for the Reviewer workspace in the role selector and route guard, so Reviewer-only navigation and any frontend-rendered Reviewer data/components become reachable in the browser even without an accepted reviewer invitation.
Available actions: Any authenticated user can select the Reviewer role, persist it in session/local storage, and pass the client-side Reviewer route guard.
State/relationship gates: Authentication only. No reviewer invitation acceptance or conference membership is required.
Frontend enforcement: `frontend/lib/role-access.ts` hardcodes `["author", "reviewer", "chair"]` in `BASE_PLATFORM_ROLES` and merges those into every authenticated user's accessible roles. `frontend/lib/use-role-route-guard.ts` trusts `canAccessRole`. `frontend/app/role/page.tsx` filters displayed role cards with the same `canAccessRole` check. `frontend/lib/session-manager.ts` also uses `canAccessRole` before persisting role choice.
Backend enforcement: None at this layer. The frontend guard is purely client-side and is not backed by a server-issued reviewer entitlement check.
Verdict: ABNORMAL
Evidence: `frontend/lib/role-access.ts:3-14`; `frontend/lib/use-role-route-guard.ts:14-46`; `frontend/app/role/page.tsx:220-227`; `frontend/lib/session-manager.ts:77-78,184-197`
Expected behavior: The Reviewer workspace should only be reachable when the authenticated user has backend-derived reviewer eligibility, ideally tied to accepted reviewer records or explicit reviewer role grants.
Remediation: Remove the hardcoded universal role grant and derive Reviewer visibility from backend state. Keep any client-side route guard secondary to backend authorization, not a substitute for it.

## R-002 Discussion attachment endpoints bypass the discussion participation checks used by thread and message APIs

Role: Reviewer
Feature/Entity: Discussion thread attachments
Frontend surface: Reviewer discussion UI attachment upload/download flows; any direct request to thread attachment endpoints
Backend surface: `POST /api/v1/threads/:thread_id/attachments`; `GET /api/v1/threads/:thread_id/attachments/:filename`
Visible data: Any stored attachment file under a thread directory becomes downloadable by any authenticated user who knows the thread ID and filename.
Available actions: Upload an attachment into any thread-scoped directory and download attachments from any thread-scoped directory.
State/relationship gates: Authentication only, plus basic filename/path sanitation. There is no check that the caller is the thread's reviewer, the paper's author, or the chair.
Frontend enforcement: Reviewer discussion pages may only expose attachment controls inside accessible threads, but the generic authenticated proxy does not prevent direct calls.
Backend enforcement: `GetThread` and `GetMessages` route through discussion service checks that validate reviewer/author/chair participation, but `UploadAttachment` and `DownloadAttachment` in the controller only call `utils.GetUserID(ginCtx)` and never invoke the service-layer access rules.
Verdict: ABNORMAL
Evidence: Protected routes at `backend/cmd/server/main.go:397-403`; controlled thread/message reads at `backend/internal/controller/discussion/discussion.go:153-171,256-274` and `backend/internal/service/discussion/service.go:188-242`; attachment endpoints with auth-only checks at `backend/internal/controller/discussion/discussion.go:330-399,402-418`
Expected behavior: Attachment upload and download should require the same thread access contract as message read/write: assigned reviewer participant, paper author participant, or chair with conference authority.
Remediation: Resolve the thread first and enforce the same participation rules used by `GetThread`/`GetMessages` before touching the filesystem. Store attachment metadata in the discussion domain instead of treating `thread_id` as sufficient authorization.

## R-003 Shared authenticated user directory/profile endpoints expose platform-wide user data to any logged-in Reviewer

Role: Reviewer
Feature/Entity: Shared user list, direct user lookup, user search, and academic profile lookup
Frontend surface: Reviewer-facing autocomplete/profile flows and any direct call to `/api/v1/users/**`
Backend surface: `GET /api/v1/users`; `GET /api/v1/users/search`; `GET /api/v1/users/:email`; `GET /api/v1/users/:email/academic-profile`
Visible data: Paginated user directory results, specific user profile objects by email, and academic profile data/papers for arbitrary authenticated users.
Available actions: Enumerate platform users, search by email fragment, fetch any user profile by email, and fetch any linked academic profile by email.
State/relationship gates: Authentication only. There is no relationship requirement to the target user, conference, or assignment.
Frontend enforcement: Any Reviewer-facing lookup UI may expose only a subset of this, but the backend routes are broadly callable through the shared proxy.
Backend enforcement: The route group is only protected by generic auth middleware. The controller methods `List`, `Get`, `Search`, and `GetAcademicProfileByEmail` do not compare the requested user to the authenticated reviewer and do not apply conference-scope or need-to-know filtering. In contrast, `Update` and `Delete` explicitly enforce self-only access.
Verdict: UNCLEAR
Evidence: Route wiring at `backend/cmd/server/main.go:265,268-270`; broad read methods at `backend/internal/controller/user/user.go:61,96,266,460`; self-only mutating contrast at `backend/internal/controller/user/user.go:233,312`
Expected behavior: If the product intentionally supports a platform-wide authenticated scholar directory and public academic profiles, that policy should be explicit and documented. If not, Reviewer access should be narrowed to conference-relevant lookups or sanitized public profile fields only.
Remediation: Decide the intended privacy model explicitly. If the directory is not meant to be global, scope list/search/profile reads to conference-relevant users and return a reduced public profile DTO. If it is meant to be global, document that policy and test it so the exposure is intentional rather than accidental.

## R-004 A logged-in Reviewer can call chair-style assignment administration endpoints through the generic proxy

Role: Reviewer
Feature/Entity: Submission review listing/analytics and assignment suggestion management
Frontend surface: Any direct request to assignment/submission review-management APIs; no special frontend barrier exists once authenticated
Backend surface: `GET /api/v1/conferences/:conference_id/submissions/:submission_id/reviews`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/reviews/analytics`; `GET /api/v1/conferences/:conference_id/assignments/suggestions`; `GET /api/v1/conferences/:conference_id/assignments/confirmed`; `POST /api/v1/conferences/:conference_id/assignments/suggestions/confirm`; `DELETE /api/v1/conferences/:conference_id/assignments/suggestions/:assignment_id`; `POST /api/v1/conferences/:conference_id/assignments/suggestions`
Visible data: Full review lists for a submission, aggregated review analytics, suggested reviewer-assignment sets, confirmed assignment rosters, and suggestion payloads associated with papers/reviewers in the conference.
Available actions: Inspect all submitted reviews for a paper, inspect review analytics, inspect suggested assignments, inspect confirmed assignments, confirm suggestions (which also sends reviewer notifications and bulk-updates paper status to `reviewing`), delete suggested assignments, and manually add new suggested reviewer-paper assignments.
State/relationship gates: The controller validates conference/submission/assignment IDs and business data shape, but these methods do not require chair/co-chair membership. The only nearby chair check in the file is `AutoAssign`, not these functions.
Frontend enforcement: None that can be trusted against a determined authenticated Reviewer because `frontend/app/api/backend/[...path]/route.ts` forwards arbitrary backend paths with the session bearer token.
Backend enforcement: `ListReviews`, `GetReviewAnalytics`, `GetSuggestions`, `GetConfirmedAssignments`, `ConfirmSuggestions`, `DeleteSuggestion`, and `AddSuggestion` do not perform `utils.GetEmail(...)`, `utils.IsUserChairOrCoChair(...)`, or any equivalent chair authorization check before executing.
Verdict: ABNORMAL
Evidence: Chair check exists for `AutoAssign` at `backend/internal/controller/assignment/assignment.go:120`; the unguarded admin-style methods begin at `backend/internal/controller/assignment/assignment.go:396,442,474,505,538,648,677`
Expected behavior: These endpoints are management functions and should be restricted to the conference chair/co-chair role. A Reviewer should not be able to enumerate all reviews, review analytics, or manipulate assignment suggestions for papers outside their own assignment scope.
Remediation: Add explicit chair/co-chair checks to every assignment-administration endpoint. Keep reviewer-owned review endpoints on the `loadOwnedReviewScope(...)` path and separate them cleanly from conference-wide management APIs.

## R-005 Reviewer invitation and dashboard endpoints trust path/email parameters instead of the authenticated Reviewer's identity

Role: Reviewer
Feature/Entity: Reviewer invitations, reviewer roster records, reviewer dashboard, assigned-paper list, completed-paper list
Frontend surface: Reviewer dashboard/invitations pages and any direct request to `/api/v1/reviewer/**` or conference reviewer endpoints
Backend surface: `POST /api/v1/conferences/:conference_id/reviewers`; `GET /api/v1/conferences/:conference_id/reviewers`; `GET /api/v1/conferences/:conference_id/reviewers/:reviewer_id`; `PUT /api/v1/conferences/:conference_id/reviewers/:reviewer_id/status`; `DELETE /api/v1/conferences/:conference_id/reviewers/:reviewer_id`; `GET /api/v1/reviewer/:reviewer_email/dashboard`; `GET /api/v1/reviewer/:reviewer_email/conferences/:conference_id/papers`; `GET /api/v1/reviewer/:reviewer_email/completed-papers`
Visible data: Reviewer invitation rosters for any conference, any invitation record by reviewer ID, any reviewer's dashboard data, any reviewer's conference-assigned papers, and any reviewer's completed-paper list.
Available actions: Batch invite reviewers, inspect reviewer rosters, accept/reject reviewer invitations by ID, delete reviewer invitations, and query dashboard/paper data for any reviewer email present in the system.
State/relationship gates: Only authentication and path-ID consistency. Dashboard/paper endpoints derive target identity from `req.ReviewerEmail`; invitation endpoints do not verify chair role or reviewer-self ownership before mutation.
Frontend enforcement: Reviewer UI may only link to the current user's data, but the shared proxy lets any authenticated Reviewer call these routes directly.
Backend enforcement: `BatchInvite`, `List`, `Get`, `UpdateStatus`, `Delete`, `GetDashboard`, `GetConferencePapers`, and `GetCompletedPapers` do not compare the authenticated user to the target reviewer or require chair authority. The dashboard/paper methods simply fetch `req.ReviewerEmail` from the request and look up that user's internal reviewer ID.
Verdict: ABNORMAL
Evidence: Unguarded reviewer management methods at `backend/internal/controller/reviewer/reviewer.go:89,146,187,218,302`; unguarded dashboard/data methods at `backend/internal/controller/reviewer/reviewer.go:345,349,489,493,544,548`; only later rebuttal endpoints in the file even call `utils.GetEmail(...)` at `backend/internal/controller/reviewer/reviewer.go:598,657`
Expected behavior: Reviewer self-service endpoints should verify that `authenticated email == requested reviewer email`. Conference reviewer-management endpoints should require chair/co-chair membership. Invitation response should be isolated to the invitee.
Remediation: Split the controller surface by actor. Add `authenticated reviewer self` checks to dashboard/data routes and explicit chair/co-chair checks to reviewer-management routes. Do not derive reviewer identity solely from a path parameter.

## R-006 A logged-in Reviewer can enumerate and download submissions outside their assigned scope

Role: Reviewer
Feature/Entity: Submission list/detail and artifact download
Frontend surface: Any direct request to `/api/v1/conferences/:conference_id/submissions/**`
Backend surface: `GET /api/v1/conferences/:conference_id/submissions`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/file`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/cover_letter`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/rebuttal`; `GET /api/v1/conferences/:conference_id/submissions/:submission_id/camera-ready`
Visible data: Conference-wide submission metadata, individual paper details, manuscript PDFs, cover letters, rebuttal payloads, rebuttal assignment status, and camera-ready files for submissions beyond the Reviewer's own assignments.
Available actions: Enumerate conference submissions, fetch arbitrary submission objects by ID, and download private paper artifacts if the reviewer can discover IDs.
State/relationship gates: Only conference/submission path consistency and file existence. The controller does not require assigned-reviewer ownership, author ownership, or chair authority for these read endpoints.
Frontend enforcement: Reviewer pages may only surface assigned papers, but the generic proxy does not constrain callers to those pages or those IDs.
Backend enforcement: The controller has author checks on mutating paths (`existing.Author != userEmail`, `sub.Author != userEmail`) but no equivalent authorization on `List`, `Get`, `GetFile`, `GetCoverLetter`, `GetRebuttal`, or `GetCameraReady`.
Verdict: ABNORMAL
Evidence: Read handlers at `backend/internal/controller/submission/submission.go:382,443,870,1036,1199,1342`; author-only write checks at `backend/internal/controller/submission/submission.go:532,673,840,1114,1294`
Expected behavior: A Reviewer should only be able to view submissions and artifacts for papers actually assigned to them, and only the subset of fields/files permitted by the review phase and blind-review policy.
Remediation: Add assignment-aware authorization to all submission read endpoints. If chair and author access differ, branch explicitly by actor role rather than exposing the full submission record to any authenticated caller.

## R-007 Reviewer chat session and history access is properly scoped to the authenticated user

Role: Reviewer
Feature/Entity: AI chat transport, session list, session history, session deletion
Frontend surface: `frontend/app/api/chat/route.ts`; `frontend/app/api/chat/sessions/route.ts`; `frontend/app/api/chat/sessions/[threadId]/route.ts`
Backend surface: `POST /api/v1/agent/chat`; `GET /api/v1/agent/sessions`; `GET /api/v1/agent/sessions/:thread_id/history`; `DELETE /api/v1/agent/sessions/:thread_id`
Visible data: Only the authenticated Reviewer's own AI chat sessions and their stored history.
Available actions: Start/resume chat turns, list owned sessions, read owned history, delete owned sessions, and submit tool results for pending tool calls bound to the same thread owner.
State/relationship gates: Valid bearer token plus ai-service identity resolution. Thread ownership is enforced against `identity.user_id`.
Frontend enforcement: The Next.js transport routes reject missing auth cookies and always forward the session bearer token to ai-service.
Backend enforcement: ai-service requires identity on every chat/session route, uses owned-session lookups, and returns `403 thread is not accessible` when `session.user_id != identity.user_id`.
Verdict: NORMAL
Evidence: Frontend auth forwarding at `frontend/app/api/chat/route.ts:57-59,81,106-110`, `frontend/app/api/chat/sessions/route.ts:18-26`, `frontend/app/api/chat/sessions/[threadId]/route.ts:20-31,53-67`; ai-service ownership checks at `ai-service/app/api/routes.py:53,59,171-172,232,268,280,304,316,433-434`; repository ownership helpers at `ai-service/app/repositories/session_repo.py:24,30-42,67,124-125`
Expected behavior: Reviewer chat data should remain private to the authenticated reviewer even if another user can guess the thread ID.
Remediation: Preserve the current ownership enforcement and keep regression coverage around cross-user thread access.

## R-001 Frontend role gating allows any authenticated user to enter Reviewer UI

Role: Reviewer
Feature/Entity: Shared role selection and reviewer route guards
Frontend surface: `/role`, `/role/reviewer/**`, `frontend/lib/role-access.ts`, `frontend/lib/use-role-route-guard.ts`, `frontend/lib/session-manager.ts`
Backend surface: None at this layer; backend enforcement is separate
Visible data: Any authenticated account can see the Reviewer role card and satisfy the reviewer route guard client-side.
Available actions: Any authenticated user can switch into local Reviewer role state and navigate into reviewer pages, even without reviewer membership.
State/relationship gates: Authentication only. `BASE_PLATFORM_ROLES` grants `author`, `reviewer`, and `chair` to every authenticated user.
Frontend enforcement: Broken. `frontend/lib/role-access.ts:3-14`, `frontend/lib/use-role-route-guard.ts:28-42`, `frontend/lib/session-manager.ts:78`, and `frontend/app/role/page.tsx:221-227` all trust the same overly broad role helper.
Backend enforcement: Separate and endpoint-specific; this finding is the client-side role contract.
Verdict: ABNORMAL
Evidence: `frontend/lib/role-access.ts:3,10,13-14`; `frontend/lib/use-role-route-guard.ts:28-42`; `frontend/lib/session-manager.ts:78`; `frontend/app/role/page.tsx:221-227`.
Expected behavior: Only users who actually hold reviewer capability should be able to enter reviewer workspace routes client-side.
Remediation: Replace hardcoded platform roles with backend-issued role membership.

## R-002 Discussion attachment endpoints only require authentication, not thread authorization

Role: Reviewer
Feature/Entity: Discussion attachments
Frontend surface: Shared discussion API helper in `frontend/lib/api/discussions.ts`
Backend surface: `POST /api/v1/threads/:thread_id/attachments`, `GET /api/v1/threads/:thread_id/attachments/:filename`
Visible data: Any authenticated Reviewer can attempt to download attachments from threads they should not be able to read, if they know the thread ID and stored filename.
Available actions: Upload attachments to arbitrary thread directories and download existing attachments.
State/relationship gates: Authentication only in the controller path inspected.
Frontend enforcement: None beyond supplying the thread ID.
Backend enforcement: `GetThread`/`GetMessages` use service-level access checks, but `UploadAttachment`/`DownloadAttachment` only check authentication before filesystem access.
Verdict: ABNORMAL
Evidence: `frontend/lib/api/discussions.ts:87-101`; `backend/internal/controller/discussion/discussion.go:153-177`; `backend/internal/controller/discussion/discussion.go:256-280`; `backend/internal/controller/discussion/discussion.go:330-398`; `backend/internal/controller/discussion/discussion.go:402-419`.
Expected behavior: Thread attachments should inherit the same access policy as the thread and its messages.
Remediation: Add thread-participant authorization before reading or writing any attachment file.

## R-003 Shared user directory and academic-profile reads are broad for any authenticated Reviewer

Role: Reviewer
Feature/Entity: Shared user lookup and academic profiles
Frontend surface: `/profile/[user_id]`, `frontend/lib/api/user.ts`, `frontend/lib/profile/resolve-user-email.ts`
Backend surface: `GET /api/v1/users`, `GET /api/v1/users/search`, `GET /api/v1/users/:email`, `GET /api/v1/users/:email/academic-profile`
Visible data: Full user records and synced academic-profile content for arbitrary users, not only the current reviewer.
Available actions: Enumerate users, search by email/ID, fetch arbitrary user records, fetch arbitrary academic profiles.
State/relationship gates: Authenticated-only. The inspected controller methods do not require reviewer-self, conference relation, or admin/chair privileges.
Frontend enforcement: Only editability is scoped; read access mirrors the backend’s broad permissions.
Backend enforcement: Missing in `backend/internal/controller/user/user.go:61-79`, `:96-106`, `:266-296`, and `:460-470`.
Verdict: ABNORMAL
Evidence: `frontend/app/profile/[user_id]/page.tsx:140-170`; `frontend/lib/api/user.ts:15-27`; `frontend/lib/profile/resolve-user-email.ts:28-39`; `backend/internal/controller/user/user.go:61-79`; `backend/internal/controller/user/user.go:96-106`; `backend/internal/controller/user/user.go:266-296`; `backend/internal/controller/user/user.go:460-470`.
Expected behavior: Reviewer-facing collaborator lookup should expose only minimal, intentional data.
Remediation: Split minimal lookup from full-profile APIs and gate academic-profile reads explicitly.

## R-008 Notification inbox and preferences are correctly scoped to the authenticated Reviewer

Role: Reviewer
Feature/Entity: Notifications, unread counts, read/delete mutations, and notification preferences
Frontend surface: `/notifications`, `frontend/hooks/use-notifications.ts`, `frontend/lib/api/notifications.ts`, `frontend/lib/notifications/resolve-action-url.ts`
Backend surface: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `GET /api/v1/notifications/:id`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`, `DELETE /api/v1/notifications/:id`, `GET/PUT /api/v1/notifications/preferences`
Visible data: Only the authenticated reviewer’s own notification feed, unread count, per-item action links, and preference values.
Available actions: List own notifications, fetch unread count, inspect a single notification, mark one notification read, mark all read, delete a notification, and update notification preferences.
State/relationship gates: Authentication plus per-record ownership. The controller passes the authenticated email into storage for all list/mutation operations and rejects cross-user reads.
Frontend enforcement: `useNotifications` always fetches through the authenticated proxy; `resolveNotificationActionUrl` only rewrites navigation targets and does not widen access to data.
Backend enforcement: `backend/internal/controller/notification/notification.go:42-286` consistently derives `userEmail` from the request context and scopes storage lookups/mutations to that email. `Get` explicitly returns `404` when the notification owner does not match the caller.
Verdict: NORMAL
Evidence: `frontend/app/notifications/page.tsx:90-287`; `frontend/hooks/use-notifications.ts:37-176`; `frontend/lib/api/notifications.ts:1-128`; `frontend/lib/notifications/resolve-action-url.ts:9-64`; `backend/internal/controller/notification/notification.go:42-286`
Expected behavior: Notification data should remain private to the authenticated user and notification preferences should be self-service only.
Remediation: Preserve the current ownership checks and keep regression coverage around cross-user notification access.

## R-009 Reviewer schedules are derived from role-scoped conference membership, not global conference data

Role: Reviewer
Feature/Entity: Conference deadlines, milestones, and event timeline
Frontend surface: `/role/reviewer/schedules`, `frontend/components/schedules/schedules-page-content.tsx`, `frontend/lib/api/schedules.ts`
Backend surface: `GET /api/v1/conferences` with `myConferences=true` and `role=reviewer`
Visible data: Deadlines and schedule entries only for conferences where the authenticated user has reviewer membership.
Available actions: Browse the calendar/timeline, filter by conference, and export the displayed events to ICS.
State/relationship gates: The schedule builder calls `listConferences({ myConferences: true, role: "reviewer" })`; the conference storage layer filters through `conference_user_roles` for the authenticated email and active reviewer role.
Frontend enforcement: The schedule page is only a shell; all event data comes from the role-filtered conference API and not from arbitrary IDs or direct conference detail fetches.
Backend enforcement: `backend/internal/controller/conference/conference.go:133-163` forwards `myConferences` and `role` to storage, and `backend/internal/storage/conference/conference.go:186-260` applies the `EXISTS`-based role filter against `UserEmail`.
Verdict: NORMAL
Evidence: `frontend/app/role/reviewer/schedules/page.tsx:8-21`; `frontend/components/schedules/schedules-page-content.tsx:349-512`; `frontend/lib/api/schedules.ts:1-165`; `backend/internal/controller/conference/conference.go:133-163`; `backend/internal/storage/conference/conference.go:186-260`
Expected behavior: A reviewer should only see conferences they are actually attached to, with schedule data derived from that membership.
Remediation: Keep the `myConferences` and `role=reviewer` filter path intact; add regression tests if schedule aggregation changes.

## R-010 Reviewer-owned review, audit, briefing, and post-rebuttal flows are correctly constrained

Role: Reviewer
Feature/Entity: Assignment review detail, review draft/submission, review audit, reviewer briefing, and post-rebuttal score
Frontend surface: `/role/reviewer/assignments/[assignmentId]`, `frontend/components/reviewer/submission-review.tsx`, `frontend/components/reviewer/submission-review/discussion-tab.tsx`, `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`, `frontend/lib/api/reviews.ts`, `frontend/lib/api/review-audit.ts`, `frontend/lib/api/rebuttal.ts`, `frontend/lib/api/papers.ts`
Backend surface: `POST/PUT /api/v1/conferences/:conference_id/assignments/:assignment_id/review`, `POST /api/v1/conferences/:conference_id/assignments/:assignment_id/review-audit`, `PUT /api/v1/conferences/:conference_id/assignments/:assignment_id/review-audit/dismissals`, `GET/POST /api/v1/conferences/:conference_id/assignments/:assignment_id/briefing`, `PUT /api/v1/conferences/:conference_id/assignments/:assignment_id/post-rebuttal-score`
Visible data: The authenticated reviewer’s own assignment review state, audit findings, briefing artifact, and post-rebuttal scoring context.
Available actions: Load review state, save draft review, submit review, run review audit, dismiss or undismiss audit warnings, load or generate reviewer briefing, and update post-rebuttal score.
State/relationship gates: Assignment ID and conference ID must match, and the controller resolves the assignment before doing any workflow/file work. The authenticated email must match the reviewer attached to the assignment.
Frontend enforcement: The assignment page first resolves the conference context from the logged-in reviewer email and only renders the review screen when that lookup succeeds.
Backend enforcement: `loadOwnedReviewScope` and `prepareReviewerBriefingRequest` verify the authenticated reviewer email against the assignment reviewer before returning the submission or invoking workflow services. `backend/internal/controller/reviewer/post_rebuttal.go:26-49` separately enforces ownership before updating post-rebuttal score.
Verdict: NORMAL
Evidence: `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx:1-136`; `frontend/components/reviewer/submission-review.tsx:52-336`; `frontend/components/reviewer/submission-review/discussion-tab.tsx:41-152`; `frontend/components/reviewer/submission-review/rebuttal-tab.tsx:15-133`; `frontend/lib/api/reviews.ts:1-239`; `frontend/lib/api/review-audit.ts:1-89`; `frontend/lib/api/rebuttal.ts:1-183`; `frontend/lib/api/papers.ts:1-302`; `backend/internal/controller/assignment/assignment.go:188-394`; `backend/internal/controller/assignment/review_audit.go:22-150`; `backend/internal/controller/assignment/briefing.go:19-150`; `backend/internal/controller/reviewer/post_rebuttal.go:26-49`
Expected behavior: Reviewer-owned review workflows should remain isolated to the assigned reviewer and should not be callable for another assignment.
Remediation: Preserve the current ownership checks and keep regression tests around cross-assignment access and workflow access.

## R-011 Rebuttal acknowledgment endpoints let any authenticated Reviewer mutate other assignments

Role: Reviewer
Feature/Entity: Rebuttal point acknowledgments and rebuttal-read state
Frontend surface: `frontend/components/shared/rebuttal/RebuttalPanel.tsx`, `frontend/components/shared/rebuttal/components/point-card.tsx`, `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`, `frontend/lib/api/rebuttal.ts`
Backend surface: `PUT /api/v1/conferences/:conference_id/assignments/:assignment_id/rebuttal/acknowledge`, `PUT /api/v1/conferences/:conference_id/assignments/:assignment_id/rebuttal/points/:point_id/acknowledge`
Visible data: Rebuttal point status, author responses, reviewer acknowledgment state, and the selected assignment’s rebuttal controls.
Available actions: Mark a rebuttal point addressed/partially addressed/not addressed, add a note, and acknowledge rebuttal-read state.
State/relationship gates: The frontend only exposes the controls for the current reviewer’s assignment, but the backend only checks authentication and rebuttal phase/state. It does not verify that the caller owns the assignment being acknowledged.
Backend enforcement: `AcknowledgeRebuttal` validates phase and then calls `assignmentStorage.AcknowledgeRebuttal` without comparing the assignment’s reviewer to the authenticated email. `AcknowledgePoint` resolves the assignment/submission but never enforces reviewer ownership before mutating rebuttal state.
Verdict: ABNORMAL
Evidence: `frontend/components/shared/rebuttal/RebuttalPanel.tsx:16-76`; `frontend/components/shared/rebuttal/components/point-card.tsx:18-32,116-214`; `frontend/components/reviewer/submission-review/rebuttal-tab.tsx:15-124`; `frontend/lib/api/rebuttal.ts:45-191`; `backend/internal/controller/reviewer/reviewer.go:595-670`
Expected behavior: Only the assigned reviewer should be able to acknowledge rebuttal points or mark a rebuttal as read.
Remediation: Add an ownership check against the assignment reviewer email before either acknowledgement mutation and return `403` for mismatches.

## R-012 Reviewer profile self-service, password change, academic-profile onboarding, and Semantic Scholar search are correctly tied to the authenticated user

Role: Reviewer
Feature/Entity: Shared profile page account management, password change, academic-profile sync onboarding, Semantic Scholar author lookup
Frontend surface: `/profile/[user_id]`, `frontend/components/profile/profile-onboarding-modal.tsx`, `frontend/components/profile/profile-change-password-modal.tsx`
Backend surface: `GET /api/v1/users/me`; `GET /api/v1/users/me/profile-sync-status`; `GET /api/v1/users/me/academic-profile`; `POST /api/v1/users/link-academic-profile`; `POST /api/v1/users/unlink-academic-profile`; `POST /api/v1/auth/change-password`; `GET /api/v1/semantic-scholar/authors/search`; `GET /api/v1/semantic-scholar/authors/:authorId`; `GET /api/v1/semantic-scholar/authors/:authorId/papers`
Visible data: The Reviewer can read their own account profile, sync lifecycle state, linked academic profile, and candidate Semantic Scholar author records and papers during onboarding from the shared profile page.
Available actions: Load own profile data, poll sync status, change password, search Semantic Scholar authors by name, inspect candidate author details/papers, link a Semantic Scholar profile to the current account, and unlink the current account's linked profile.
State/relationship gates: The shared profile page computes `isOwnProfile` before exposing edit, onboarding, unlink, and password-change controls. The mutation endpoints derive the acting user from the authenticated email, not from a caller-supplied target account. Semantic Scholar lookup is authenticated-only and does not mutate another local user.
Frontend enforcement: `frontend/app/profile/[user_id]/page.tsx:70-73,120-133,184-196,246-283,367-397` only renders onboarding, unlink, and password-change controls for the caller's own profile. `frontend/components/profile/profile-onboarding-modal.tsx:48-133` and `frontend/components/profile/profile-change-password-modal.tsx:20-198` implement the self-service onboarding and password-change flows without exposing a cross-user target.
Backend enforcement: Present for the account-management operations. `backend/cmd/server/main.go:251-267,486-495` places these routes behind authentication. `backend/internal/controller/user/user.go:122-165,430-444` resolves self-profile and sync status from the token email. `backend/internal/controller/user/link_profile.go:31-152` links/unlinks the current authenticated user's academic profile. `backend/internal/controller/auth/auth.go:99-104` changes password for the authenticated email only. `backend/internal/controller/semantic_scholar/semantic_scholar.go:46-220` serves authenticated author lookup only.
Verdict: NORMAL
Evidence: `frontend/app/profile/[user_id]/page.tsx:70-73,120-133,184-196,246-283,367-397`; `frontend/components/profile/profile-onboarding-modal.tsx:48-133`; `frontend/components/profile/profile-change-password-modal.tsx:20-198`; `backend/cmd/server/main.go:251-267,486-495`; `backend/internal/controller/user/user.go:122-165,430-444`; `backend/internal/controller/user/link_profile.go:31-152`; `backend/internal/controller/auth/auth.go:99-104`; `backend/internal/controller/semantic_scholar/semantic_scholar.go:46-220`
Expected behavior: A Reviewer should be able to manage only their own account and linked academic profile from the shared profile page, and external author lookup used during onboarding should not cross over into another local user's settings.
Remediation: Preserve the existing authenticated-email binding and add regression tests for own-profile-only onboarding, unlink, and password-change behavior.

## R-013 User-level COI preflight lookup is callable by any authenticated Reviewer and exposes conference-wide author conflict data

Role: Reviewer
Feature/Entity: Shared user COI-check endpoint for conference assignment preflight
Frontend surface: No dedicated Reviewer page in the current tree; callable through the shared authenticated client and generic backend proxy
Backend surface: `GET /api/v1/users/:email/coi-check?conference_id=:conference_id`
Visible data: Conflict-check summaries for an arbitrary user against all authors and co-authors in the target conference, including conflicting author names/emails, reasons, total author count, and conflicting-author count.
Available actions: Ask the backend to evaluate any supplied user email against any conference's author set and retrieve the resulting conflict list.
State/relationship gates: Authentication only. The controller requires a `conference_id` and target email but does not verify that the caller is a chair/co-chair of that conference, an assignment manager, or the same user being checked.
Frontend enforcement: None in the current Reviewer UI; the route remains callable through `/api/backend/...` or any shared authenticated fetch path.
Backend enforcement: Missing. `backend/cmd/server/main.go:259-273` registers the route under the generic authenticated `/users` group. `backend/internal/controller/user/user.go:342-417` validates inputs, loads the target user and conference, enumerates conference submissions/authors, and returns the conflict report without a chair/co-chair or self-ownership authorization check.
Verdict: ABNORMAL
Evidence: `backend/cmd/server/main.go:259-273`; `backend/internal/controller/user/user.go:342-417`
Expected behavior: COI preflight over a conference's author population should be restricted to chair/co-chair assignment workflows or an internal service path, not exposed to arbitrary authenticated Reviewers.
Remediation: Require chair/co-chair authorization for the target conference before returning any COI report, or move this contract behind an internal assignment-management surface with a narrower response shape.

## Coverage

Inspected frontend reviewer routes and wrappers: `frontend/app/role/reviewer/layout.tsx`, `frontend/app/role/reviewer/page.tsx`, `frontend/app/role/reviewer/conferences/page.tsx`, `frontend/app/role/reviewer/conferences/[conferenceId]/submissions/page.tsx`, `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx`, `frontend/app/role/reviewer/invitations/page.tsx`, `frontend/app/role/reviewer/completed/page.tsx`, `frontend/app/role/reviewer/schedules/page.tsx`, `frontend/app/notifications/page.tsx`, plus shared reviewer components and API wrappers under `frontend/components/reviewer/**`, `frontend/components/shared/rebuttal/**`, `frontend/components/schedules/**`, `frontend/hooks/use-notifications.ts`, `frontend/lib/api/{reviewer,reviews,rebuttal,schedules,notifications,papers,discussions,review-audit}.ts`, `frontend/lib/{routes,navigation,notifications/resolve-action-url}.ts`.
Inspected backend reviewer-access controllers and related enforcement layers: `backend/internal/controller/reviewer/reviewer.go`, `backend/internal/controller/reviewer/post_rebuttal.go`, `backend/internal/controller/assignment/{assignment,review_audit,briefing}.go`, `backend/internal/controller/notification/notification.go`, `backend/internal/controller/conference/conference.go`, `backend/internal/controller/submission/submission.go`, `backend/internal/controller/discussion/discussion.go`, `backend/internal/controller/user/user.go`, `backend/internal/controller/user/link_profile.go`, `backend/internal/controller/auth/auth.go`, `backend/internal/controller/semantic_scholar/**`, `backend/internal/storage/conference/conference.go`.
Gap notes: there is no separate backend schedule controller; reviewer schedules are derived from the role-filtered conference list. No inaccessible reviewer-specific source sections were encountered. GitNexus MCP graph tools were unavailable in this session, so the audit used direct source inspection plus local repository files only.

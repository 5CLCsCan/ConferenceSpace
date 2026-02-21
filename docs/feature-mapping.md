# Feature Mapping (Ground Truth)

Source of truth: `frontend/app/**/page.tsx`, `frontend/components/**`, `frontend/hooks/**`, `frontend/lib/**`.
Excluded routes: `/test/*`.

## [Shared]

### [Module] Auth & Access

1. Public Landing Entry
   - **ID:** `shared-auth-view-landing`
   - **Path:** `/`
   - **Source Component:** `frontend/app/page.tsx`
   - **Description:** Renders the product landing page and routes users to authentication entry points (`/login`, `/register`).
   - **Action Type:** `VIEW`
   - **Permission Basis:** Public route; no RBAC guard.
   - **Data Shape(s):** `ROUTES`
   - **Evidence:** `frontend/app/page.tsx`; `frontend/lib/routes.ts`

2. Sign In
   - **ID:** `shared-auth-login`
   - **Path:** `/login`
   - **Source Component:** `frontend/app/login/page.tsx`
   - **Description:** Submits email/password via `useAuth().login`; on success normalizes user/session and redirects to role selection.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Public route; session established in auth context/session manager.
   - **Data Shape(s):** `User`, `UserRole`, login payload `{ email, password }`
   - **Evidence:** `frontend/app/login/page.tsx`; `frontend/lib/auth-context.tsx`; `frontend/lib/session-manager.ts`

3. Register Account
   - **ID:** `shared-auth-register`
   - **Path:** `/register`
   - **Source Component:** `frontend/app/register/page.tsx`
   - **Description:** Creates a new user account with personal info, password, and research domains, then redirects to login with success flag.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Public route; backend call uses `skipAuth` registration contract.
   - **Data Shape(s):** `RegisterData`, registration payload `{ user, password }`
   - **Evidence:** `frontend/app/register/page.tsx`; `frontend/lib/auth-context.tsx`

4. Sign Out
   - **ID:** `shared-auth-logout`
   - **Path:** `/role/*`
   - **Source Component:** `frontend/components/dashboard-header.tsx`
   - **Description:** Clears local session/role state and calls `/api/v1/auth/logout`, then navigates to home.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Requires authenticated user context in dashboard shell.
   - **Data Shape(s):** `User`, `UserRole`
   - **Evidence:** `frontend/components/dashboard-header.tsx`; `frontend/lib/auth-context.tsx`; `frontend/lib/session-manager.ts`

### [Module] Role Selection

1. View Role Selector
   - **ID:** `shared-role-view-selector`
   - **Path:** `/role`
   - **Source Component:** `frontend/app/role/page.tsx`
   - **Description:** Displays role cards based on `canAccessRole` and resets active role to neutral context.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Requires authenticated session (`useAuth`), redirects unauthenticated users to `/login`.
   - **Data Shape(s):** `User`, `UserRole`
   - **Evidence:** `frontend/app/role/page.tsx`; `frontend/lib/role-access.ts`; `frontend/lib/auth-context.tsx`

2. Switch Active Role Context
   - **ID:** `shared-role-switch-context`
   - **Path:** `/role`
   - **Source Component:** `frontend/app/role/page.tsx`
   - **Description:** Persists selected runtime role and routes to role-specific dashboard.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Role choice validated by `canAccessRole` before `switchRole`.
   - **Data Shape(s):** `UserRole`
   - **Evidence:** `frontend/app/role/page.tsx`; `frontend/lib/auth-context.tsx`; `frontend/lib/session-manager.ts`

### [Module] Notifications

1. View Notification Feed
   - **ID:** `shared-notification-view-feed`
   - **Path:** `/notifications`
   - **Source Component:** `frontend/app/notifications/page.tsx`
   - **Description:** Loads paginated notifications with tab/filter segmentation and unread counters.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Requires authenticated API token to load user-specific notifications.
   - **Data Shape(s):** `Notification`, `NotificationListRequest`, `NotificationListResponse`
   - **Evidence:** `frontend/app/notifications/page.tsx`; `frontend/hooks/use-notifications.ts`; `frontend/lib/api/notifications.ts`

2. Mark Notification As Read
   - **ID:** `shared-notification-mark-read`
   - **Path:** `/notifications`
   - **Source Component:** `frontend/app/notifications/page.tsx`
   - **Description:** Marks a single notification as read and decrements unread count in local notification state.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Authenticated notification API call for current user.
   - **Data Shape(s):** `Notification`
   - **Evidence:** `frontend/app/notifications/page.tsx`; `frontend/hooks/use-notifications.ts`; `frontend/lib/api/notifications.ts`

3. Mark All Notifications As Read
   - **ID:** `shared-notification-mark-all-read`
   - **Path:** `/notifications`
   - **Source Component:** `frontend/app/notifications/page.tsx`
   - **Description:** Marks all unread notifications as read and resets unread counter to zero.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Authenticated notification API call for current user.
   - **Data Shape(s):** `MarkAllAsReadResponse`, `Notification`
   - **Evidence:** `frontend/app/notifications/page.tsx`; `frontend/hooks/use-notifications.ts`; `frontend/lib/api/notifications.ts`

4. Open Notification Action Target
   - **ID:** `shared-notification-open-action-link`
   - **Path:** `/notifications`
   - **Source Component:** `frontend/app/notifications/page.tsx`
   - **Description:** Normalizes legacy/action URLs and navigates to the linked role-specific workspace while marking item read.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Navigation constrained by downstream route guards for role paths.
   - **Data Shape(s):** `Notification`, action URL normalization map
   - **Evidence:** `frontend/app/notifications/page.tsx`; `frontend/lib/notifications/resolve-action-url.ts`; `frontend/lib/routes.ts`

### [Module] Profile & Identity

1. View User Profile
   - **ID:** `shared-profile-view-user`
   - **Path:** `/profile/:user_id`
   - **Source Component:** `frontend/app/profile/[user_id]/page.tsx`
   - **Description:** Resolves profile target (`me`/email/id), fetches profile data, and conditionally exposes editable fields for owner profile.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Authenticated users only; unauthorized requests redirect to `/login`.
   - **Data Shape(s):** `User`, `ProfileFormData`, `AcademicProfile`
   - **Evidence:** `frontend/app/profile/[user_id]/page.tsx`; `frontend/lib/profile/resolve-user-email.ts`; `frontend/lib/api/user.ts`

2. Update Profile Information
   - **ID:** `shared-profile-update-user`
   - **Path:** `/profile/:user_id`
   - **Source Component:** `frontend/app/profile/[user_id]/page.tsx`
   - **Description:** Persists owner profile edits (name/email/domains) through `PUT /api/v1/users/:email` and refreshes auth user snapshot.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Enabled only when viewing own profile (`isOwnProfile`).
   - **Data Shape(s):** `UpdateProfileRequest`, `ProfileFormData`, `User`
   - **Evidence:** `frontend/app/profile/[user_id]/page.tsx`; `frontend/lib/types.ts`

3. Search Academic Author Candidates
   - **ID:** `shared-profile-search-academic-author`
   - **Path:** `/profile/:user_id`
   - **Source Component:** `frontend/components/profile/profile-onboarding-modal.tsx`
   - **Description:** Queries Semantic Scholar author index and retrieves candidate details before profile linking.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Onboarding modal available only on own profile.
   - **Data Shape(s):** `SearchResponse`, `Author`, `AuthorWithPapers`
   - **Evidence:** `frontend/components/profile/profile-onboarding-modal.tsx`; `frontend/lib/api/semantic-scholar.ts`

4. Link Academic Profile
   - **ID:** `shared-profile-link-academic-profile`
   - **Path:** `/profile/:user_id`
   - **Source Component:** `frontend/components/profile/profile-onboarding-modal.tsx`
   - **Description:** Links selected Semantic Scholar author ID to current user and triggers profile/metrics refresh.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Own-profile action only.
   - **Data Shape(s):** `AcademicProfile`, `User`
   - **Evidence:** `frontend/components/profile/profile-onboarding-modal.tsx`; `frontend/lib/api/user.ts`

5. Unlink Academic Profile
   - **ID:** `shared-profile-unlink-academic-profile`
   - **Path:** `/profile/:user_id`
   - **Source Component:** `frontend/app/profile/[user_id]/page.tsx`
   - **Description:** Removes linked academic profile and refreshes profile state after confirmation.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Own-profile action only.
   - **Data Shape(s):** `AcademicProfile`, `User`
   - **Evidence:** `frontend/app/profile/[user_id]/page.tsx`; `frontend/lib/api/user.ts`

## [Author]

### [Module] Author Dashboard

1. View Author Conference Hub
   - **ID:** `author-dashboard-view-conference-hub`
   - **Path:** `/role/author`
   - **Source Component:** `frontend/components/author/author-conferences.tsx`
   - **Description:** Loads authored conferences and discovery catalogs by combining conference list with author submission presence.
   - **Action Type:** `VIEW`
   - **Permission Basis:** `useRoleRouteGuard("author")` in author layout.
   - **Data Shape(s):** `Conference`, `Submission`, `AuthorConference`, `ExploreConference`
   - **Evidence:** `frontend/app/role/author/page.tsx`; `frontend/components/author/author-conferences.tsx`; `frontend/app/role/author/layout.tsx`

2. Open Conference Detail Workspace
   - **ID:** `author-dashboard-open-conference-detail`
   - **Path:** `/role/author`
   - **Source Component:** `frontend/components/author/author-conferences.tsx`
   - **Description:** Navigates from dashboard cards/list rows into per-conference author workspace.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author layout guard plus sidebar/menu author context.
   - **Data Shape(s):** `ROUTES`
   - **Evidence:** `frontend/components/author/author-conferences.tsx`; `frontend/lib/routes.ts`; `frontend/app/role/author/layout.tsx`

### [Module] Conference Discovery/Detail

1. View Conference Detail Tabs
   - **ID:** `author-conference-view-detail`
   - **Path:** `/role/author/conferences/:conferenceId`
   - **Source Component:** `frontend/components/author/author-conference-detail.tsx`
   - **Description:** Fetches conference metadata, CFP, committee, and important dates for author-side review.
   - **Action Type:** `VIEW`
   - **Permission Basis:** `useRoleRouteGuard("author")`.
   - **Data Shape(s):** `Conference`, `ImportantDate`, `TabType`
   - **Evidence:** `frontend/app/role/author/conferences/[conferenceId]/page.tsx`; `frontend/components/author/author-conference-detail.tsx`; `frontend/components/author/conference-detail/*`

2. Start New Submission From Conference
   - **ID:** `author-conference-start-submission`
   - **Path:** `/role/author/conferences/:conferenceId`
   - **Source Component:** `frontend/components/author/conference-detail/conference-header.tsx`
   - **Description:** Sends author to the submission wizard when conference is `open`; otherwise action is disabled.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Author guard + conference status check (`conference.status === "open"`).
   - **Data Shape(s):** `Conference`, `ROUTES`
   - **Evidence:** `frontend/components/author/conference-detail/conference-header.tsx`; `frontend/app/role/author/submissions/new/page.tsx`

3. Open Existing Submission From Conference
   - **ID:** `author-conference-open-existing-submission`
   - **Path:** `/role/author/conferences/:conferenceId`
   - **Source Component:** `frontend/components/author/conference-detail/conference-header.tsx`
   - **Description:** Routes authors who already submitted to their submission workspace/list for that conference context.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard + `hasSubmission` check.
   - **Data Shape(s):** `Submission`, `ROUTES`
   - **Evidence:** `frontend/components/author/author-conference-detail.tsx`; `frontend/components/author/conference-detail/conference-header.tsx`

### [Module] Submission Authoring

1. View Submission Authoring Form
   - **ID:** `author-submission-view-editor`
   - **Path:** `/role/author/submissions/new | /role/author/submissions/:submissionId/edit`
   - **Source Component:** `frontend/components/author/submit/paper-submission-form.tsx`
   - **Description:** Presents multi-step submission workflow (paper details, authors, files, COI, review) for create/edit scenarios.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard; new submissions further constrained to conference `open` status.
   - **Data Shape(s):** `Conference`, `Submission`, `StepType`, `Author`, `Conflict`
   - **Evidence:** `frontend/app/role/author/submissions/new/page.tsx`; `frontend/app/role/author/submissions/[submissionId]/edit/page.tsx`; `frontend/components/author/submit/paper-submission-form.tsx`

2. Search Existing Users As Co-authors
   - **ID:** `author-submission-search-coauthor`
   - **Path:** `/role/author/submissions/new`
   - **Source Component:** `frontend/components/author/submit/authors-step.tsx`
   - **Description:** Queries `/api/v1/users/search` to prefill co-author identity fields while authoring.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard.
   - **Data Shape(s):** `UserSearchResult`, user search response DTO
   - **Evidence:** `frontend/components/author/submit/authors-step.tsx`; `frontend/lib/api/client.ts`

3. Precheck Manuscript Quality
   - **ID:** `author-submission-precheck-manuscript`
   - **Path:** `/role/author/submissions/new`
   - **Source Component:** `frontend/components/author/submit/file-upload-step.tsx`
   - **Description:** Uploads manuscript to precheck endpoint and returns compliance diagnostics prior to final submit.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Author guard + valid conference context.
   - **Data Shape(s):** `PreCheckResult`, precheck response DTO in `precheckPaper`
   - **Evidence:** `frontend/components/author/submit/file-upload-step.tsx`; `frontend/lib/api/papers.ts`

4. Download Existing Manuscript In Edit Flow
   - **ID:** `author-submission-download-existing-file`
   - **Path:** `/role/author/submissions/:submissionId/edit`
   - **Source Component:** `frontend/components/author/submit/file-upload-step.tsx`
   - **Description:** Retrieves already uploaded submission file to let authors verify existing artifact before update.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard + resolved conference/submission context.
   - **Data Shape(s):** download response `{ data: Blob; filename }`
   - **Evidence:** `frontend/components/author/submit/file-upload-step.tsx`; `frontend/lib/api/papers.ts`

5. Save Submission Draft
   - **ID:** `author-submission-save-draft`
   - **Path:** `/role/author/submissions/new | /role/author/submissions/:submissionId/edit`
   - **Source Component:** `frontend/components/author/submit/paper-submission-form.tsx`
   - **Description:** Persists draft metadata/file references with `status: "draft"` using create/update submission API.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Author guard; blocked when conference is not `open` for new submissions.
   - **Data Shape(s):** `Paper`, `Submission`, submit/update paper payload DTO
   - **Evidence:** `frontend/components/author/submit/paper-submission-form.tsx`; `frontend/lib/api/papers.ts`

6. Submit Paper For Review
   - **ID:** `author-submission-submit-publish`
   - **Path:** `/role/author/submissions/new | /role/author/submissions/:submissionId/edit`
   - **Source Component:** `frontend/components/author/submit/paper-submission-form.tsx`
   - **Description:** Finalizes submission with `status: "published"`, making it available to conference review workflows.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Author guard; blocked when conference is not `open`.
   - **Data Shape(s):** `Paper`, `Submission`, publish/update payload DTO
   - **Evidence:** `frontend/components/author/submit/paper-submission-form.tsx`; `frontend/lib/api/papers.ts`

7. Upload Supplementary Files (Placeholder)
   - **ID:** `author-submission-supplementary-upload-placeholder`
   - **Path:** `/role/author/submissions/new`
   - **Source Component:** `frontend/components/author/submit/file-upload-step.tsx`
   - **Description:** Renders supplementary upload CTA but does not bind to backend upload API.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Author guard.
   - **Data Shape(s):** N/A (no persisted DTO wired)
   - **Evidence:** `frontend/components/author/submit/file-upload-step.tsx`
   - **Backend Status (optional):** `BLOCKED - Supplementary upload UI has no API mutation binding in v2.`

### [Module] Submission Detail & Discussion

1. View Submission Inventory
   - **ID:** `author-submission-view-list`
   - **Path:** `/role/author/submissions`
   - **Source Component:** `frontend/components/author/author-submissions-list.tsx`
   - **Description:** Fetches all authenticated author submissions across conferences with search/status filtering.
   - **Action Type:** `VIEW`
   - **Permission Basis:** `useRoleRouteGuard("author")`.
   - **Data Shape(s):** `SubmissionWithConference`
   - **Evidence:** `frontend/app/role/author/submissions/page.tsx`; `frontend/components/author/author-submissions-list.tsx`; `frontend/lib/api/submissions.ts`

2. Open Submission Detail From Inventory
   - **ID:** `author-submission-open-detail`
   - **Path:** `/role/author/submissions`
   - **Source Component:** `frontend/components/author/author-submissions-list.tsx`
   - **Description:** Navigates into submission detail page with resolved `conferenceId` query context.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard.
   - **Data Shape(s):** `ROUTES`, `SubmissionWithConference`
   - **Evidence:** `frontend/components/author/author-submissions-list.tsx`; `frontend/lib/routes.ts`

3. View Submission Detail Workspace
   - **ID:** `author-submission-view-detail`
   - **Path:** `/role/author/submissions/:submissionId`
   - **Source Component:** `frontend/components/author/submission-detail/index.tsx`
   - **Description:** Resolves conference context, loads submission detail, and exposes overview/discussion/rebuttal tabs.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard + resolved submission ownership context.
   - **Data Shape(s):** `Submission`, `TabId`
   - **Evidence:** `frontend/app/role/author/submissions/[submissionId]/page.tsx`; `frontend/components/author/submission-detail/index.tsx`; `frontend/lib/submissions/resolve-submission-conference.ts`

4. Open Draft Edit From Detail
   - **ID:** `author-submission-open-edit-draft`
   - **Path:** `/role/author/submissions/:submissionId`
   - **Source Component:** `frontend/components/author/submission-detail/submission-header.tsx`
   - **Description:** Shows edit entrypoint only for draft submissions and routes to edit form.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard + `submission.status === "draft"` + ownership check.
   - **Data Shape(s):** `Submission`, `ROUTES`
   - **Evidence:** `frontend/components/author/submission-detail/submission-header.tsx`; `frontend/lib/routes.ts`

5. Download Submission Artifacts
   - **ID:** `author-submission-download-file`
   - **Path:** `/role/author/submissions/:submissionId`
   - **Source Component:** `frontend/components/author/submission-detail/overview-tab.tsx`
   - **Description:** Exposes direct download links for manuscript and cover letter artifacts.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Author guard + submission access.
   - **Data Shape(s):** `Submission.file`, `Submission.cover_letter`
   - **Evidence:** `frontend/components/author/submission-detail/overview-tab.tsx`

6. Create Discussion Thread (Author)
   - **ID:** `author-discussion-create-thread`
   - **Path:** `/role/author/submissions/:submissionId?tab=discussion`
   - **Source Component:** `frontend/components/author/submission-detail/discussion-tab.tsx`
   - **Description:** Creates new thread on a submission discussion panel and refreshes thread list.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Author guard; author wrapper restricts visibility options to author-visible threads.
   - **Data Shape(s):** `CreateThreadData`, `CreateThreadRequest`, `DiscussionThread`
   - **Evidence:** `frontend/components/author/submission-detail/discussion-tab.tsx`; `frontend/lib/api/discussions.ts`; `frontend/components/shared/discussion/api-adapter.ts`

7. Reply In Discussion Thread (Author)
   - **ID:** `author-discussion-reply-thread`
   - **Path:** `/role/author/submissions/:submissionId?tab=discussion`
   - **Source Component:** `frontend/components/author/submission-detail/discussion-tab.tsx`
   - **Description:** Posts reply message into selected thread and re-fetches message timeline.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Author guard.
   - **Data Shape(s):** `CreateMessageRequest`, `DiscussionMessage`
   - **Evidence:** `frontend/components/author/submission-detail/discussion-tab.tsx`; `frontend/lib/api/discussions.ts`

8. Upload Revision (Placeholder)
   - **ID:** `author-submission-upload-revision-placeholder`
   - **Path:** `/role/author/submissions/:submissionId`
   - **Source Component:** `frontend/components/author/submission-detail/submission-header.tsx`
   - **Description:** Shows revision upload CTA in header but no mutation handler is wired.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Author guard.
   - **Data Shape(s):** N/A (no DTO bound)
   - **Evidence:** `frontend/components/author/submission-detail/submission-header.tsx`
   - **Backend Status (optional):** `BLOCKED - Revision upload action has no connected API call.`

9. Withdraw Submission (Placeholder)
   - **ID:** `author-submission-withdraw-placeholder`
   - **Path:** `/role/author/submissions/:submissionId`
   - **Source Component:** `frontend/components/author/submission-detail/overview-tab.tsx`
   - **Description:** Renders destructive withdraw button but does not call a withdrawal endpoint.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Author guard.
   - **Data Shape(s):** N/A (no DTO bound)
   - **Evidence:** `frontend/components/author/submission-detail/overview-tab.tsx`
   - **Backend Status (optional):** `BLOCKED - Withdrawal endpoint/action binding not implemented in frontend.`

10. Rebuttal Panel (Read-only)
    - **ID:** `author-rebuttal-readonly`
    - **Path:** `/role/author/submissions/:submissionId?tab=rebuttal`
    - **Source Component:** `frontend/components/author/submission-detail/rebuttal-tab.tsx`
    - **Description:** Displays rebuttal content from shared panel in read-only mode; submit/save actions are disabled.
    - **Action Type:** `VIEW`
    - **Permission Basis:** Author guard.
    - **Data Shape(s):** `RebuttalSettings`, `RebuttalPoint`, `RebuttalSubmission`, `RebuttalPhase`
    - **Evidence:** `frontend/components/author/submission-detail/rebuttal-tab.tsx`; `frontend/components/shared/rebuttal/types.ts`
    - **Backend Status (optional):** `BLOCKED - Rebuttal persistence contract is explicitly unavailable.`

## [Reviewer]

### [Module] Reviewer Dashboard

1. View Reviewer Dashboard
   - **ID:** `reviewer-dashboard-view-summary`
   - **Path:** `/role/reviewer`
   - **Source Component:** `frontend/components/reviewer/reviewer-dashboard.tsx`
   - **Description:** Loads reviewer aggregate stats and recent assignments using dashboard API.
   - **Action Type:** `VIEW`
   - **Permission Basis:** `useRoleRouteGuard("reviewer")`.
   - **Data Shape(s):** `ReviewerDashboardData`, `ReviewerStats`, `AssignmentWithPaper`
   - **Evidence:** `frontend/app/role/reviewer/page.tsx`; `frontend/components/reviewer/reviewer-dashboard.tsx`; `frontend/hooks/use-reviewer-dashboard.ts`

2. Open Recent Assignment
   - **ID:** `reviewer-dashboard-open-recent-assignment`
   - **Path:** `/role/reviewer`
   - **Source Component:** `frontend/components/reviewer/reviewer-dashboard.tsx`
   - **Description:** Opens assignment review workspace from recent assignments list.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `AssignmentWithPaper`, `ROUTES`
   - **Evidence:** `frontend/components/reviewer/reviewer-dashboard.tsx`; `frontend/lib/routes.ts`

### [Module] Conference Review Workspace

1. View Reviewer Conference Catalog
   - **ID:** `reviewer-workspace-view-conferences`
   - **Path:** `/role/reviewer/conferences`
   - **Source Component:** `frontend/app/role/reviewer/conferences/page.tsx`
   - **Description:** Displays reviewer conferences with server-side search/pagination and infinite loading.
   - **Action Type:** `VIEW`
   - **Permission Basis:** `useRoleRouteGuard("reviewer")`.
   - **Data Shape(s):** `ReviewerConference`, `ReviewerDashboardData`
   - **Evidence:** `frontend/app/role/reviewer/conferences/page.tsx`; `frontend/components/reviewer/reviewer-conferences.tsx`; `frontend/hooks/use-reviewer-dashboard.ts`

2. Open Conference Submission Queue
   - **ID:** `reviewer-workspace-open-conference-submissions`
   - **Path:** `/role/reviewer/conferences`
   - **Source Component:** `frontend/app/role/reviewer/conferences/page.tsx`
   - **Description:** Routes reviewer into conference-specific assigned papers workspace.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `ReviewerConference`, `ROUTES`
   - **Evidence:** `frontend/app/role/reviewer/conferences/page.tsx`; `frontend/lib/routes.ts`

3. View Assigned Papers In Conference
   - **ID:** `reviewer-workspace-view-assigned-submissions`
   - **Path:** `/role/reviewer/conferences/:conferenceId/submissions`
   - **Source Component:** `frontend/components/reviewer/assigned-dashboard.tsx`
   - **Description:** Fetches reviewer assignments with search/status filters and sortable backlog views.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `AssignedPaper`, `PapersParams`
   - **Evidence:** `frontend/app/role/reviewer/conferences/[conferenceId]/submissions/page.tsx`; `frontend/components/reviewer/assigned-dashboard.tsx`; `frontend/hooks/use-conference-papers.ts`

4. Open Assignment From Conference Queue
   - **ID:** `reviewer-workspace-open-assignment`
   - **Path:** `/role/reviewer/conferences/:conferenceId/submissions`
   - **Source Component:** `frontend/components/reviewer/assigned-dashboard.tsx`
   - **Description:** Persists assignment-to-conference context cache and opens assignment review route.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** assignment conference context cache record
   - **Evidence:** `frontend/components/reviewer/assigned-dashboard.tsx`; `frontend/lib/reviewer/assignment-context-cache.ts`; `frontend/lib/routes.ts`

5. Apply To Explore Conference (Placeholder)
   - **ID:** `reviewer-workspace-apply-explore-placeholder`
   - **Path:** `/role/reviewer/conferences`
   - **Source Component:** `frontend/components/reviewer/reviewer-conferences.tsx`
   - **Description:** Renders "Apply" CTA on explore cards without mutation/navigation binding.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `ReviewerConference`
   - **Evidence:** `frontend/components/reviewer/reviewer-conferences.tsx`
   - **Backend Status (optional):** `BLOCKED - Explore apply flow is UI-only in current frontend.`

### [Module] Invitation Management

1. View Reviewer Invitations
   - **ID:** `reviewer-invitation-view-list`
   - **Path:** `/role/reviewer/invitations`
   - **Source Component:** `frontend/components/reviewer/reviewer-invitations.tsx`
   - **Description:** Displays paginated invitation cards segmented by status (`pending`, `accepted`, `declined`).
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `ReviewRequest`, `ReviewerDashboardData`
   - **Evidence:** `frontend/app/role/reviewer/invitations/page.tsx`; `frontend/components/reviewer/reviewer-invitations.tsx`; `frontend/hooks/use-reviewer-dashboard.ts`

2. Accept Review Invitation
   - **ID:** `reviewer-invitation-accept`
   - **Path:** `/role/reviewer/invitations`
   - **Source Component:** `frontend/components/reviewer/reviewer-invitations.tsx`
   - **Description:** Sends reviewer acceptance to conference reviewer status endpoint and refreshes invitation list.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Reviewer guard + invitation card action.
   - **Data Shape(s):** `ReviewRequest`, response status union `"accepted" | "rejected"`
   - **Evidence:** `frontend/components/reviewer/reviewer-invitations.tsx`; `frontend/lib/api/reviewer.ts`

3. Decline Review Invitation
   - **ID:** `reviewer-invitation-decline`
   - **Path:** `/role/reviewer/invitations`
   - **Source Component:** `frontend/components/reviewer/reviewer-invitations.tsx`
   - **Description:** Sends reviewer rejection (`rejected`) for invitation and refreshes state.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Reviewer guard + invitation card action.
   - **Data Shape(s):** `ReviewRequest`, response status union `"accepted" | "rejected"`
   - **Evidence:** `frontend/components/reviewer/reviewer-invitations.tsx`; `frontend/lib/api/reviewer.ts`; `frontend/lib/types.ts`

4. Go To Dashboard From Accepted Invitation (Placeholder)
   - **ID:** `reviewer-invitation-go-dashboard-placeholder`
   - **Path:** `/role/reviewer/invitations`
   - **Source Component:** `frontend/components/reviewer/reviewer-invitations.tsx`
   - **Description:** Accepted-state button is rendered but does not navigate.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `ReviewRequest`
   - **Evidence:** `frontend/components/reviewer/reviewer-invitations.tsx`
   - **Backend Status (optional):** `BLOCKED - No click handler wired for accepted invitation CTA.`

### [Module] Assignment Review Authoring

1. View Assignment Review Workspace
   - **ID:** `reviewer-assignment-view-workspace`
   - **Path:** `/role/reviewer/assignments/:assignmentId`
   - **Source Component:** `frontend/components/reviewer/submission-review.tsx`
   - **Description:** Loads assignment context, paper details, and tabbed reviewer workspace (review/discussion/rebuttal).
   - **Action Type:** `VIEW`
   - **Permission Basis:** `useRoleRouteGuard("reviewer")`.
   - **Data Shape(s):** `Paper`, `AssignmentReview`, `ReviewFormData`, `TabType`
   - **Evidence:** `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx`; `frontend/components/reviewer/submission-review.tsx`

2. Resolve Assignment Conference Context
   - **ID:** `reviewer-assignment-resolve-conference-context`
   - **Path:** `/role/reviewer/assignments/:assignmentId`
   - **Source Component:** `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx`
   - **Description:** Resolves missing conference context via query/cache/dashboard lookup before assignment API calls.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Reviewer guard + authenticated reviewer email.
   - **Data Shape(s):** `ResolveAssignmentConferenceResult`, `DashboardOptions`, `AssignmentReview`
   - **Evidence:** `frontend/app/role/reviewer/assignments/[assignmentId]/page.tsx`; `frontend/lib/reviewer/resolve-assignment-conference.ts`; `frontend/lib/reviewer/assignment-context-cache.ts`

3. Save Review Draft
   - **ID:** `reviewer-assignment-save-draft`
   - **Path:** `/role/reviewer/assignments/:assignmentId`
   - **Source Component:** `frontend/components/reviewer/submission-review.tsx`
   - **Description:** Saves current review form as draft review through assignment review API.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `SaveReviewPayload`, `ReviewData`, `AssignmentReview`
   - **Evidence:** `frontend/components/reviewer/submission-review.tsx`; `frontend/hooks/use-assignment-review.ts`; `frontend/lib/api/reviews.ts`

4. Submit Final Review
   - **ID:** `reviewer-assignment-submit-review`
   - **Path:** `/role/reviewer/assignments/:assignmentId`
   - **Source Component:** `frontend/components/reviewer/submission-review.tsx`
   - **Description:** Validates required sections then submits review with status `submitted`, making it visible to chair analytics.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `SaveReviewPayload`, `ReviewData`, `AssignmentReview`
   - **Evidence:** `frontend/components/reviewer/submission-review.tsx`; `frontend/hooks/use-assignment-review.ts`; `frontend/lib/api/reviews.ts`

5. Create Discussion Thread (Reviewer)
   - **ID:** `reviewer-discussion-create-thread`
   - **Path:** `/role/reviewer/assignments/:assignmentId?tab=discussion`
   - **Source Component:** `frontend/components/reviewer/submission-review/discussion-tab.tsx`
   - **Description:** Creates reviewer-side discussion thread and refreshes thread/message state.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `CreateThreadData`, `CreateThreadRequest`, `DiscussionThread`
   - **Evidence:** `frontend/components/reviewer/submission-review/discussion-tab.tsx`; `frontend/lib/api/discussions.ts`

6. Reply In Discussion Thread (Reviewer)
   - **ID:** `reviewer-discussion-reply-thread`
   - **Path:** `/role/reviewer/assignments/:assignmentId?tab=discussion`
   - **Source Component:** `frontend/components/reviewer/submission-review/discussion-tab.tsx`
   - **Description:** Posts reviewer message to an existing thread.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `CreateMessageRequest`, `DiscussionMessage`
   - **Evidence:** `frontend/components/reviewer/submission-review/discussion-tab.tsx`; `frontend/lib/api/discussions.ts`

7. AI Assistant Analysis (Mock)
   - **ID:** `reviewer-assignment-ai-analysis-placeholder`
   - **Path:** `/role/reviewer/assignments/:assignmentId`
   - **Source Component:** `frontend/components/reviewer/submission-review/review-sidebar.tsx`
   - **Description:** Runs mock timer/dialog flow for analysis results without backend inference API.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** mock markdown analysis text (no backend DTO)
   - **Evidence:** `frontend/components/reviewer/submission-review/review-sidebar.tsx`
   - **Backend Status (optional):** `BLOCKED - AI analysis is simulated and not backed by API.`

8. Rebuttal Panel (Reviewer Read-only)
   - **ID:** `reviewer-rebuttal-readonly`
   - **Path:** `/role/reviewer/assignments/:assignmentId?tab=rebuttal`
   - **Source Component:** `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`
   - **Description:** Displays rebuttal information but disables acknowledgment/write actions.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `RebuttalSettings`, `RebuttalPoint`, `RebuttalSubmission`, `RebuttalPhase`
   - **Evidence:** `frontend/components/reviewer/submission-review/rebuttal-tab.tsx`; `frontend/components/shared/rebuttal/types.ts`
   - **Backend Status (optional):** `BLOCKED - Rebuttal persistence contract is explicitly unavailable.`

### [Module] Completed Reviews

1. View Completed Reviews Archive
   - **ID:** `reviewer-completed-view-list`
   - **Path:** `/role/reviewer/completed`
   - **Source Component:** `frontend/components/reviewer/completed-reviews.tsx`
   - **Description:** Loads completed review assignments with search/sort/infinite scrolling.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `AssignedPaper`
   - **Evidence:** `frontend/app/role/reviewer/completed/page.tsx`; `frontend/components/reviewer/completed-reviews.tsx`; `frontend/hooks/use-completed-reviews.ts`

2. Re-open Completed Review Workspace
   - **ID:** `reviewer-completed-open-review`
   - **Path:** `/role/reviewer/completed`
   - **Source Component:** `frontend/components/reviewer/completed-reviews.tsx`
   - **Description:** Navigates completed item back to assignment detail route (with conference context when available).
   - **Action Type:** `VIEW`
   - **Permission Basis:** Reviewer guard.
   - **Data Shape(s):** `AssignedPaper`, `ROUTES`
   - **Evidence:** `frontend/components/reviewer/completed-reviews.tsx`; `frontend/lib/routes.ts`

## [Chair]

### [Module] Chair Dashboard

1. View Chair Dashboard Overview
   - **ID:** `chair-dashboard-view-overview`
   - **Path:** `/role/chair`
   - **Source Component:** `frontend/components/chair/chair-dashboard.tsx`
   - **Description:** Aggregates chair-centric metrics by composing conference/submission APIs and renders priority actions.
   - **Action Type:** `VIEW`
   - **Permission Basis:** `useRoleRouteGuard("chair")`.
   - **Data Shape(s):** `Conference`, `Submission`, `DashboardMetrics`, `DashboardAction`
   - **Evidence:** `frontend/app/role/chair/page.tsx`; `frontend/components/chair/chair-dashboard.tsx`; `frontend/app/role/chair/layout.tsx`

2. Open Conference Action From Dashboard
   - **ID:** `chair-dashboard-open-conference-action`
   - **Path:** `/role/chair`
   - **Source Component:** `frontend/components/chair/chair-dashboard.tsx`
   - **Description:** Routes from action cards to conference detail management page.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ROUTES`
   - **Evidence:** `frontend/components/chair/chair-dashboard.tsx`; `frontend/lib/routes.ts`

### [Module] Conference Lifecycle Management

1. View Chair Conference Portfolio
   - **ID:** `chair-conference-view-list`
   - **Path:** `/role/chair/conferences`
   - **Source Component:** `frontend/components/chair/chair-conferences.tsx`
   - **Description:** Loads chair-owned conferences plus explore/archive catalogs with filtering and view modes.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `Conference` (API), `Conference`/`ExploreConference` (UI models)
   - **Evidence:** `frontend/app/role/chair/conferences/page.tsx`; `frontend/components/chair/chair-conferences.tsx`; `frontend/lib/api/conferences.ts`

2. Open Conference Detail From Portfolio
   - **ID:** `chair-conference-open-detail`
   - **Path:** `/role/chair/conferences`
   - **Source Component:** `frontend/components/chair/chair-conferences.tsx`
   - **Description:** Navigates selected conference to chair detail workspace.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ROUTES`
   - **Evidence:** `frontend/components/chair/chair-conferences.tsx`; `frontend/lib/routes.ts`

3. View Conference Creation Wizard
   - **ID:** `chair-conference-view-create-wizard`
   - **Path:** `/role/chair/conferences/new`
   - **Source Component:** `frontend/app/role/chair/conferences/new/page.tsx`
   - **Description:** Displays six-step conference creation wizard for metadata, timelines, policies, committees, and CFP.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ConferenceFormData`
   - **Evidence:** `frontend/app/role/chair/conferences/new/page.tsx`; `frontend/components/wizard/creation/*`

4. Create Conference
   - **ID:** `chair-conference-create`
   - **Path:** `/role/chair/conferences/new`
   - **Source Component:** `frontend/app/role/chair/conferences/new/page.tsx`
   - **Description:** Submits wizard payload to conference creation API and returns to conference portfolio.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Chair guard; final review confirmation required.
   - **Data Shape(s):** `ConferenceFormData`, `Conference`, createConference payload DTO
   - **Evidence:** `frontend/app/role/chair/conferences/new/page.tsx`; `frontend/lib/api/conferences.ts`
   - **Backend Status (optional):** `BLOCKED - Conference creation contract is explicitly unavailable.`

5. Save Conference Draft In Wizard (Local Only)
   - **ID:** `chair-conference-save-draft-local`
   - **Path:** `/role/chair/conferences/new`
   - **Source Component:** `frontend/app/role/chair/conferences/new/page.tsx`
   - **Description:** Shows success toast for draft save but does not persist to backend.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ConferenceFormData`
   - **Evidence:** `frontend/app/role/chair/conferences/new/page.tsx`
   - **Backend Status (optional):** `BLOCKED - Draft persistence endpoint is not wired.`

### [Module] Conference Detail Operations

1. View Conference Detail Tabs
   - **ID:** `chair-conference-view-detail-tabs`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/app/role/chair/conferences/[conferenceId]/page.tsx`
   - **Description:** Loads conference shell and switches among dashboard, overview, CFP, dates, committee, submissions, and COI tabs.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ConferenceInfo`, `TabId`
   - **Evidence:** `frontend/app/role/chair/conferences/[conferenceId]/page.tsx`; `frontend/components/chair/conference-detail/conference-detail-header.tsx`

2. View Dedicated Submissions Route
   - **ID:** `chair-conference-view-submissions-route`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions`
   - **Source Component:** `frontend/app/role/chair/conferences/[conferenceId]/submissions/page.tsx`
   - **Description:** Provides submissions-only entrypoint while retaining conference context/header.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ConferenceInfo`, `TabId`
   - **Evidence:** `frontend/app/role/chair/conferences/[conferenceId]/submissions/page.tsx`; `frontend/components/chair/conference-detail/conference-detail-header.tsx`

3. Conference Settings Access (Placeholder)
   - **ID:** `chair-conference-settings-placeholder`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-detail-header.tsx`
   - **Description:** Settings button is rendered in header without click handler.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ConferenceInfo`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-detail-header.tsx`
   - **Backend Status (optional):** `BLOCKED - No connected settings workflow/action.`

4. CFP Editor/Publisher (Read-only)
   - **ID:** `chair-conference-cfp-readonly`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-cfp.tsx`
   - **Description:** CFP content and key dates are displayed but edit/publish flows are intentionally disabled.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `Conference`, `ImportantDate`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-cfp.tsx`
   - **Backend Status (optional):** `BLOCKED - CFP management endpoints are not wired in v2.`

5. View Conference Important Dates
   - **ID:** `chair-conference-view-dates`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-dates.tsx`
   - **Description:** Renders API-backed schedule timeline from conference configuration date fields.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ImportantDate`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-dates.tsx`; `frontend/lib/api/conferences.ts`

6. View Committee Roster
   - **ID:** `chair-conference-view-committee`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-committee.tsx`
   - **Description:** Shows reviewer committee membership and pending invite counts.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `User`, `Reviewer`, `ReviewerListResponse`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-committee.tsx`; `frontend/lib/api/conferences.ts`

7. View Analytics Fallback Cards
   - **ID:** `chair-conference-view-analytics-fallback`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-detail-dashboard.tsx`
   - **Description:** Builds synthetic analytics from submissions API while surfacing missing backend stats contract.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** fallback dashboard stats object
   - **Evidence:** `frontend/components/chair/conference-detail/conference-detail-dashboard.tsx`; `frontend/lib/api/conferences.ts`
   - **Backend Status (optional):** `BLOCKED - Full analytics depend on missing conference stats endpoint.`

8. View COI Dashboard
   - **ID:** `chair-coi-view-dashboard`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-coi.tsx`
   - **Description:** Displays conflict stats and reviewer-author relationship tables from COI APIs.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `COIDashboardStats`, `COIRelationship`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-coi.tsx`; `frontend/lib/api/coi.ts`

9. Rebuild COI Index
   - **ID:** `chair-coi-rebuild-index`
   - **Path:** `/role/chair/conferences/:conferenceId`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-coi.tsx`
   - **Description:** Triggers backend COI relationship recomputation for the conference.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** rebuild response `{ conference_id, relationships_found, relationships_stored, detection_time_ms }`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-coi.tsx`; `frontend/lib/api/coi.ts`

10. Moderate/Dismiss COI Flags (Placeholder)
    - **ID:** `chair-coi-moderation-placeholder`
    - **Path:** `/role/chair/conferences/:conferenceId`
    - **Source Component:** `frontend/components/chair/conference-detail/conference-coi.tsx`
    - **Description:** UI explicitly notes confirm/dismiss/reassignment moderation actions are disabled.
    - **Action Type:** `COMMAND`
    - **Permission Basis:** Chair guard.
    - **Data Shape(s):** `COIRelationship`
    - **Evidence:** `frontend/components/chair/conference-detail/conference-coi.tsx`
    - **Backend Status (optional):** `BLOCKED - COI moderation mutation endpoints unavailable.`

### [Module] Submission Evaluation & Decision

1. View Submission Table
   - **ID:** `chair-submission-view-list`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-submissions.tsx`
   - **Description:** Lists conference submissions with review completion and average score indicators.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `Submission`, `AssignmentReview`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-submissions.tsx`; `frontend/lib/api/submissions.ts`; `frontend/lib/api/reviews.ts`

2. Open Submission Decision Workspace
   - **ID:** `chair-submission-open-detail`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions`
   - **Source Component:** `frontend/components/chair/conference-detail/conference-submissions.tsx`
   - **Description:** Navigates selected submission row to detailed review/decision workspace.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ROUTES`, `Submission`
   - **Evidence:** `frontend/components/chair/conference-detail/conference-submissions.tsx`; `frontend/lib/routes.ts`

3. View Submission Detail Workspace
   - **ID:** `chair-submission-view-detail`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId`
   - **Source Component:** `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`
   - **Description:** Builds normalized submission detail model, merges reviews/discussion/history feeds, and renders overview/reviews/discussion/history tabs.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `SubmissionDetail`, `SubmissionHistoryEvent`, `AssignmentReview`, `DiscussionThread`, `DiscussionMessage`
   - **Evidence:** `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`; `frontend/components/chair/conference-detail/submission-detail-content.tsx`

4. View Review Analytics & Reviewer Feedback
   - **ID:** `chair-submission-view-review-analytics`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId?tab=reviews`
   - **Source Component:** `frontend/components/chair/submission-review-tab.tsx`
   - **Description:** Loads review analytics, paginated review content, and confidence/recommendation distributions.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ReviewAnalytics`, `AssignmentReview`, `ReviewData`
   - **Evidence:** `frontend/components/chair/submission-review-tab.tsx`; `frontend/lib/api/reviews.ts`

5. Save Final Submission Decision
   - **ID:** `chair-submission-save-final-decision`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId?tab=reviews`
   - **Source Component:** `frontend/components/chair/submission-review-tab.tsx`
   - **Description:** Persists chair decision (`accepted` or `rejected`) to submission status endpoint.
   - **Action Type:** `TRIGGER`
   - **Permission Basis:** Chair guard; only enabled for supported statuses.
   - **Data Shape(s):** `Submission`, status union `"draft" | "published" | "reviewing" | "accepted" | "rejected"`
   - **Evidence:** `frontend/components/chair/submission-review-tab.tsx`; `frontend/lib/api/submissions.ts`

6. Save Revision Decision (Placeholder)
   - **ID:** `chair-submission-revision-decision-placeholder`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId?tab=reviews`
   - **Source Component:** `frontend/components/chair/submission-review-tab.tsx`
   - **Description:** Minor/Major revision buttons are visible but intentionally disabled.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `DecisionType` (compatibility), decision status UI union
   - **Evidence:** `frontend/components/chair/submission-review-tab.tsx`; `frontend/lib/types.ts`
   - **Backend Status (optional):** `BLOCKED - Backend status contract currently accepts accepted/rejected only.`

7. View Submission History Timeline
   - **ID:** `chair-submission-view-history`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId?tab=history`
   - **Source Component:** `frontend/components/chair/conference-detail/submission-detail/chair-history-tab.tsx`
   - **Description:** Shows synthesized chronological events (submission, review, discussion, decision) for auditability.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `SubmissionHistoryEvent`, `HistoryEventType`, `HistoryEventCategory`
   - **Evidence:** `frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`; `frontend/components/chair/conference-detail/submission-detail/chair-history-tab.tsx`

8. Submission Settings Access (Placeholder)
   - **ID:** `chair-submission-settings-placeholder`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId`
   - **Source Component:** `frontend/components/chair/conference-detail/submission-detail-header.tsx`
   - **Description:** Submission-level settings button is rendered without handler.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `SubmissionDetail`
   - **Evidence:** `frontend/components/chair/conference-detail/submission-detail-header.tsx`
   - **Backend Status (optional):** `BLOCKED - Submission settings workflow is not connected.`

### [Module] COI / Scheduling / Oversight Discussion

1. Create Discussion Thread (Chair)
   - **ID:** `chair-discussion-create-thread`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId?tab=discussion`
   - **Source Component:** `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`
   - **Description:** Creates chair-visible discussion thread for submission oversight.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `CreateThreadData`, `CreateThreadRequest`, `DiscussionThread`
   - **Evidence:** `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`; `frontend/lib/api/discussions.ts`

2. Reply In Discussion Thread (Chair)
   - **ID:** `chair-discussion-reply-thread`
   - **Path:** `/role/chair/conferences/:conferenceId/submissions/:submissionId?tab=discussion`
   - **Source Component:** `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`
   - **Description:** Posts chair message into an existing discussion thread.
   - **Action Type:** `COMMAND`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `CreateMessageRequest`, `DiscussionMessage`
   - **Evidence:** `frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`; `frontend/lib/api/discussions.ts`

3. View Schedule Planner
   - **ID:** `chair-schedule-view-planner`
   - **Path:** `/role/chair/schedules`
   - **Source Component:** `frontend/app/role/chair/schedules/page.tsx`
   - **Description:** Provides calendar/timeline planning UI for conference milestones and agenda.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** `ScheduleEvent`, `ConferenceTimeline` (local page types)
   - **Evidence:** `frontend/app/role/chair/schedules/page.tsx`

4. Schedule Data Source (Mock)
   - **ID:** `chair-schedule-data-mock-placeholder`
   - **Path:** `/role/chair/schedules`
   - **Source Component:** `frontend/app/role/chair/schedules/page.tsx`
   - **Description:** Planner currently consumes static in-file `MOCK_EVENTS`/`MOCK_CONFERENCES` rather than API data.
   - **Action Type:** `VIEW`
   - **Permission Basis:** Chair guard.
   - **Data Shape(s):** local `MOCK_EVENTS`, `MOCK_CONFERENCES`
   - **Evidence:** `frontend/app/role/chair/schedules/page.tsx`
   - **Backend Status (optional):** `BLOCKED - No schedule API integration is wired in frontend.`

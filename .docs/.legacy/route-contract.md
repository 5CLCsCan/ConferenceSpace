# Route-to-Behavior Contract Map

Purpose: map each legacy route contract to its v2 route contract, including role/access/data/action expectations and parity status.

Status values:
- `implemented-api-backed`
- `implemented-mock-backed`
- `partial`
- `missing`
- `blocked-backend`

## Contract Table

| Contract ID | Legacy route/file | v2 route/file | Role | Access contract | Data contract | Action contract | Status | Scenario |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RC-001 | `/` (`frontend/app/page.tsx`) | `/` (`frontend-v2/app/page.tsx`) | public | Public access | Static + optional auth state | Navigate to login/register | implemented-api-backed | SCN-SH-001 |
| RC-002 | `/login` (`frontend/app/login/page.tsx`) + layout | `/login` (`frontend-v2/app/login/page.tsx`) + layout | public | Redirect authenticated users to dashboard entry | `/api/v1/auth/login` | Credentials login | implemented-api-backed | SCN-SH-002 |
| RC-003 | `/register` (`frontend/app/register/page.tsx`) | `/register` (`frontend-v2/app/register/page.tsx`) | public | Public access | `/api/v1/auth/register` | Register and redirect/login | implemented-api-backed | SCN-SH-003 |
| RC-004 | `/dashboard` (`frontend/app/dashboard/page.tsx`) | `/role` (`frontend-v2/app/role/page.tsx`) | multi | Auth required; role selection/redirect | session + role state | Enter selected role dashboard | implemented-api-backed | SCN-SH-004 |
| RC-005 | `/dashboard/layout` | `role/*/layout` + `useRoleRouteGuard` | multi | Enforce role-specific access | auth context + role guard | Block/redirect unauthorized roles | implemented-api-backed | SCN-SH-005 |
| RC-006 | `/dashboard/author` | `/role/author` | author | Author role required | Author conference list | View owned/available conferences | implemented-mock-backed | SCN-AU-001 |
| RC-007 | `/dashboard/author/submissions` | `/role/author/submissions` | author | Author role required | Author submissions list APIs | Open/edit submission | implemented-api-backed | SCN-AU-002 |
| RC-008 | `/dashboard/author/submit` (+ loading) | `/role/author/submissions/new` | author | Author role required | Conference + submission create APIs | Submit new paper | implemented-api-backed | SCN-AU-003 |
| RC-009 | `/dashboard/author/papers/:id` | `/role/author/submissions/:submissionId` | author | Author ownership enforced | Submission detail + discussion/rebuttal data | View details, discuss, rebut | partial | SCN-AU-004 |
| RC-010 | `/dashboard/conference/:id` (author view path) | `/role/author/conferences/:conferenceId` | author | Author role required | Conference detail + dates + submission status | View CFP/dates/submit path | partial | SCN-AU-005 |
| RC-011 | `/dashboard/reviewer` | `/role/reviewer` | reviewer | Reviewer role required | Reviewer dashboard API | Open assignments/conferences | implemented-api-backed | SCN-RV-001 |
| RC-012 | `/dashboard/reviewer/completed` | `/role/reviewer/completed` | reviewer | Reviewer role required | Completed reviews API | Inspect completed reviews | implemented-api-backed | SCN-RV-002 |
| RC-013 | `/dashboard/reviewer/papers/:id` | `/role/reviewer/assignments/:assignmentId` | reviewer | Reviewer role required + assignment access | Assignment detail + review + discussion/rebuttal | Submit/update review, discuss | partial | SCN-RV-003 |
| RC-014 | `/dashboard/conference/:id/review/:reviewId` | `/role/reviewer/assignments/:assignmentId` | reviewer | Reviewer role required | Review detail API | Read/update review state | partial | SCN-RV-004 |
| RC-015 | `/dashboard/chair` | `/role/chair` | chair | Chair role required | Chair dashboard metrics | Navigate to conference controls | implemented-mock-backed | SCN-CH-001 |
| RC-016 | `/dashboard/chair/create-conference` | `/role/chair/conferences/new` | chair | Chair role required | Conference create contract | Create conference wizard | implemented-api-backed | SCN-CH-002 |
| RC-017 | `/dashboard/conference/:id` (chair view path) | `/role/chair/conferences/:conferenceId` | chair | Chair ownership/access required | Conference overview/stats/committee/coi/submissions | Manage conference operations | implemented-mock-backed | SCN-CH-003 |
| RC-018 | `/dashboard/conference/:id/submission/:submissionId` | `/role/chair/conferences/:conferenceId/submissions/:submissionId` | chair | Chair role required | Submission detail/reviews/discussion/history | Decide outcome, inspect reviews | partial | SCN-CH-004 |
| RC-019 | `/dashboard/notifications` | `/notifications` | multi | Auth required | Notifications list + unread count | Read/mark notifications | implemented-mock-backed | SCN-SH-006 |
| RC-020 | `/dashboard/users/:email` | `/profile/:user_id` | multi | Auth required; owner edit restrictions | User profile read/update and academic profile contracts | Edit profile, view linked academic data | partial | SCN-SH-007 |
| RC-021 | `/test/discussion` | `/test/discussion` (target route absent) | dev/test | Test-only access | discussion setup helper route + test-login | Seed and verify discussion flows | missing | SCN-CR-001 |
| RC-022 | `/test/profile-link` | `/test/profile-link` (target route absent) | dev/test | Test-only access | semantic-scholar + user linking contracts | Validate profile-link flow | missing | SCN-CR-002 |

## Route Contract Notes
1. Legacy `/dashboard/conference/:id` serves multiple role contexts; v2 splits this into role-specific routes. Both role mappings must satisfy original action semantics.
2. `RC-009`, `RC-013`, and `RC-018` are blocked by discussion/rebuttal API wiring gaps; these remain high-priority parity items.
3. Test/dev routes are mandatory under the current full-parity policy and must not be dropped.

## Linked Backend Dependencies
- `RC-017` links to `BR-001` and `BR-002` for stats/tracks contract completion.
- `RC-018` links to `BR-004` for explicit chair decision write contract (if existing contract cannot be reused).

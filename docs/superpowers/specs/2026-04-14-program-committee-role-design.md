# Program Committee (PC) Role — Design Spec

**Date:** 2026-04-14
**Status:** Approved

## Overview

Add a new "Program Committee" (PC) role to ConferenceSpace. PC members have **read-only access to everything a chair can see** but cannot make any decisions or modifications.

## Requirements

- PC members are assigned by the chair, similar to co-chairs and reviewers
- PC role is **exclusive** — a user cannot hold PC + another role in the same conference
- PC sees all chair views: submissions, reviews, reviewer list, assignments, analytics, decision copilot, rebuttal settings, discussion threads, templates
- PC **cannot** perform any write actions: no accept/reject, no inviting reviewers, no editing settings, no managing assignments, no template CRUD

## Approach

Extend existing middleware pattern (Approach A). Minimal changes, no architectural refactor.

## Backend

### Model & Constants

- Add `RolePC = "pc"` in `backend/internal/model/conference.go`
- No new tables — reuse `conference_user_roles` with `role = "pc"`

### Middleware

- **New middleware:** `RequireChairCoChairOrPC(roleStorage)` — allows chair, co_chair, or pc
  - Used on all **GET** (read) routes currently guarded by `requireChair`
- **Existing middleware:** `RequireChairOrCoChair` — unchanged
  - Remains on all **write** routes (POST/PUT/DELETE/PATCH)
- Add `IsUserChairCoChairOrPC` utility in `backend/internal/utils/role_check.go` for controller-level checks where needed

### Routes (`cmd/server/main.go`)

Split current `requireChair` usage by HTTP method:

| HTTP Method | Middleware | Roles Allowed |
|-------------|-----------|---------------|
| GET | `requireChairOrPC` (new) | chair, co_chair, pc |
| POST, PUT, DELETE, PATCH | `requireChair` (existing) | chair, co_chair |

### PC Member Management

- Chair adds PC members via existing role assignment flow (same mechanism as co-chair/reviewer)
- **Exclusivity validation (conference-scoped):** When assigning PC role to a user in conference X, reject if user already has another role (chair, co_chair, reviewer, author) in conference X. When assigning any other role in conference X, reject if user is already PC in conference X. The user can still hold different roles in different conferences.

## Frontend

### Types

- Add `"pc"` to `UserRole` type in `frontend/lib/types.ts`

### Role Access & Navigation

- Add `"pc"` to role access functions in `frontend/lib/role-access.ts`
- Add `"pc"` to role selection page filter list in `frontend/app/role/page.tsx`
- PC gets the **same navigation items as chair** in `frontend/lib/navigation.ts`

### Routes & Layout

- **Reuse** `/role/chair/` routes — PC members navigate to the same chair pages
- Update the chair route guard to accept both `"chair"` and `"pc"`
- No new `/role/pc/` directory needed

### Conditional Write Actions

- Create helper: `isReadOnlyRole(role: UserRole): boolean` — returns `true` for `"pc"`
- In chair components, use this helper to **hide** (not disable) action buttons:
  - Accept/Reject decision buttons
  - Invite Reviewer button
  - Save Settings buttons
  - Delete buttons (reviewers, templates, etc.)
  - Open Rebuttal / Finalize buttons
  - Conference editing controls
  - Template create/edit/delete buttons
- Prefer hiding over greying out to keep UI clean

### Role Selection Page

- Add PC role card with description: "Program Committee — Read-only access to conference management"
- Appropriate icon to distinguish from chair

## Testing

### Backend
- Verify PC can access all GET chair endpoints
- Verify PC is rejected on all POST/PUT/DELETE/PATCH chair endpoints (403)
- Verify role exclusivity: cannot assign PC if user has another role, and vice versa

### Frontend
- Verify PC sees chair navigation and pages
- Verify action buttons are hidden for PC role
- Verify role selection page shows PC card

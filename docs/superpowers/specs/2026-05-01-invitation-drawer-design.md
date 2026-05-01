# Invitation Drawer Design

**Date:** 2026-05-01  
**Status:** Approved

## Problem

The reviewer invitation accept/decline flow currently navigates to a separate full page (`/role/reviewer/invitations/[assignmentId]`). This breaks the reviewer's context — they leave the paper list, make a decision, and must navigate back. A popup keeps them in place.

## Decision

Replace the full-page navigation with a **right-side drawer** (Sheet) that slides over the paper list. The paper list remains visible behind the drawer, giving context. After responding, the drawer closes and the paper row updates in-place.

## Components

### New: `InvitationDrawer` (`components/reviewer/invitation-drawer.tsx`)

A self-contained component that:
- Accepts `assignmentId: number | null`, `open: boolean`, `onClose: () => void`, `onResponded: (assignmentId: number, newStatus: "accepted" | "declined") => void`
- Uses shadcn/ui `Sheet` (side="right") with a fixed width (~480px)
- Internally fetches invitation data via `getInvitation(email, assignmentId)` when `open` becomes true
- Renders: paper title, abstract (truncated), match score bar, matched keywords, assignment count
- Renders accept / decline flow (same category chips + optional reason textarea as the existing page)
- On successful respond: calls `onResponded(assignmentId, status)` then `onClose()`
- On error: shows inline error message inside the drawer (no toast, no navigation)
- Internal state machine: `"loading" | "pending" | "declining" | "submitting" | "error"` — no accepted/declined display state (drawer closes immediately after respond)

### Modified: `AssignedDashboard` (`components/reviewer/assigned-dashboard.tsx`)

- Add state: `selectedInvitationId: number | null` (initially `null`)
- Change "View Invitation" button `onClick`: instead of `router.push(...)`, set `selectedInvitationId(paper.assignment_id)`
- Render `<InvitationDrawer>` at the bottom of the return, passing `open={selectedInvitationId !== null}`, `assignmentId={selectedInvitationId}`, `onClose={() => setSelectedInvitationId(null)}`, and `onResponded`
- `onResponded(assignmentId, newStatus)`: optimistically update the paper's `assignment_status` in the local `papers` list. Since `useConferencePapers` returns the array from a hook, maintain a local `statusOverrides: Map<number, string>` and merge when rendering rows.

### Unchanged: `PaperInvitation` + invitation page

The existing `components/reviewer/paper-invitation.tsx` and `app/role/reviewer/invitations/[assignmentId]/page.tsx` are kept as-is. They serve as the deep-link target from notifications (the notification action URL still points to `/role/reviewer/invitations/{id}`).

## Behaviour

| Scenario | Behaviour |
|----------|-----------|
| Click "View Invitation" | Drawer slides in from right; paper list visible behind |
| Drawer loads | Shows spinner, then invitation content |
| Accept | Calls API → `onResponded(id, "accepted")` → drawer closes → row badge changes to status label, button changes to "Open" |
| Decline (with/without reason) | Calls API → `onResponded(id, "declined")` → drawer closes → row dims + shows "DECLINED" badge |
| Dismiss (×, Escape, backdrop) | Drawer closes, no changes |
| API error | Inline error inside drawer; drawer stays open |
| Navigate from notification | Goes to full page (unchanged) |

## Status Override Merge Strategy

`useConferencePapers` returns a stable array. Rather than triggering a refetch, `AssignedDashboard` maintains:

```ts
const [statusOverrides, setStatusOverrides] = useState<Map<number, string>>(new Map())
```

When rendering each row, use `statusOverrides.get(paper.assignment_id) ?? paper.assignment_status`. On `onResponded`, update the map.

## Files Changed

| File | Change |
|------|--------|
| `components/reviewer/invitation-drawer.tsx` | **Create** |
| `components/reviewer/assigned-dashboard.tsx` | Add drawer state + `<InvitationDrawer>` + status overrides |
| `app/role/reviewer/invitations/[assignmentId]/page.tsx` | No change |
| `components/reviewer/paper-invitation.tsx` | No change |

## Out of Scope

- Updating the notification action URL to open the drawer (requires a different notification click handler architecture — separate task)
- Unit tests for `InvitationDrawer` (the existing `paper-invitation.test.tsx` covers the same logic; add drawer-specific tests in a follow-up)

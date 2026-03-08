# UI Bug Investigation Report

**Date:** 2026-03-08
**Issues:** UI-SEC-01 (RBAC), UI-NEG-02 (Deadline Enforcement)
**Status:** ❌ Root causes confirmed, fix pending

---

## Issue 1: [UI-SEC-01] RBAC Not Enforced in UI

### Summary

Author and Reviewer users can see Chair-only UI elements (Auto-Assign button, COI tab, etc.), and there is no route-level protection preventing direct URL access to chair pages.

---

### Root Cause Analysis

#### 1a. `ChairActionsPanel` — No role guard on the component

**File:** `components/chair/conference-detail/chair-actions-panel.tsx`

The `ChairActionsPanel` component, which contains the **Auto-Assign Reviewers** button, does **not** import or call `useAuth()`. It is rendered unconditionally, with no check on the current user's role.

```tsx
// chair-actions-panel.tsx — no role check whatsoever
export function ChairActionsPanel({ conferenceId, ... }) {
  const { t } = useTranslation()
  // ❌ No: const { currentRole } = useAuth()
  // ❌ No: if (currentRole !== "chair") return null
  ...
  return (
    <div> {/* Always rendered */}
      <button onClick={handleAutoAssign}>Auto-Assign Reviewers</button>
    </div>
  )
}
```

#### 1b. `ConferenceDetailHeader` — COI tab hardcoded without role filter

**File:** `components/chair/conference-detail/conference-detail-header.tsx` (lines 8–17)

All tabs — including the **COI** tab — are defined in a static `TABS` array at module level, outside any component or role-check logic. The entire tab list is always rendered as-is:

```tsx
// Defined statically, not conditionally
const TABS: TabItem[] = [
  { id: "dashboard", ... },
  { id: "overview", ... },
  { id: "cfp", ... },
  { id: "dates", ... },
  { id: "committee", ... },
  { id: "submissions", ... },
  { id: "assignments", ... },
  { id: "coi", ... },   // ❌ Always included, no role filter
]

// Rendered unconditionally
{TABS.map((tab) => (
  <button key={tab.id} onClick={() => onTabChange(tab.id)}>
    {tab.label}
  </button>
))}
```

The component receives no `userRole` or `currentRole` prop, so there is no mechanism to hide tabs per role.

#### 1c. Chair page routes — No access control at the route level

**File:** `app/role/chair/conferences/[conferenceId]/page.tsx`

The chair conference detail page does not perform any authentication or role check before rendering. Any logged-in user who navigates to `/role/chair/conferences/:id` will see the full chair interface:

```tsx
export default function ChairConferenceDetailPage() {
  // ❌ No: const { currentRole } = useAuth()
  // ❌ No: if (currentRole !== "chair") return <AccessDenied />
  ...
  return (
    <div>
      <ConferenceDetailHeader ... />  {/* Full chair tabs, including COI */}
      <ConferenceDetailDashboard ... />  {/* Contains ChairActionsPanel */}
    </div>
  )
}
```

#### 1d. No Next.js middleware for route protection

**File:** `frontend/middleware.ts` — **does not exist**

Next.js supports a `middleware.ts` file at the project root (or `src/`) to intercept requests and redirect unauthorized users server-side. This file is **absent** from the project. There is no route-level guard for any `/role/chair/...` path.

#### 1e. Auth context has role data — it is simply not used in these components

**File:** `lib/auth-context.tsx`

The `AuthContext` exposes `currentRole: UserRole | null` — a string representing the user's currently active role ("chair", "author", "reviewer", etc.). It also exposes `user.roles: UserRole[]` — the full list of roles the user holds.

```tsx
interface AuthContextType {
  currentRole: UserRole | null  // ✅ Available
  user: User | null             // user.roles: UserRole[] — ✅ Available
  ...
}
```

**`useAuth()` is available and imported correctly in other components** (e.g., `paper-submission-form.tsx` imports and uses it on line 42). The failure is specifically that the chair-specific components and pages do not consume it for role gating.

---

### Impact

| Surface | Issue |
|---|---|
| Auto-Assign button | Visible to all roles if they land on a chair conference page |
| COI Dashboard tab | Always rendered regardless of user role |
| Direct URL access `/role/chair/conferences/:id` | Fully accessible to any authenticated user |
| Other chair-only tabs (Assignments, Submissions management) | Same exposure — all tabs are always shown |

---

### What Is Working

The auth infrastructure (`useAuth`, `currentRole`, `user.roles`) is fully implemented and available. The gap is purely at the rendering/routing layer — the chair components do not consume role data to conditionally render.

---

## Issue 2: [UI-NEG-02] Submit Button Not Disabled After Deadline

### Summary

The "Submit Paper" button in the submission form remains enabled after the conference's paper submission deadline has passed. There is no deadline check, no disabled state, and no warning message shown to the user.

---

### Root Cause Analysis

#### 2a. `isNewSubmissionBlocked` only checks conference `status`, not deadline

**File:** `components/author/submit/paper-submission-form.tsx` (line 118)

```tsx
const isNewSubmissionBlocked = !initialSubmission && conference?.status !== "open"
```

This is the only gate that checks whether submission should be blocked. It only looks at the `conference.status` field (expected to be `"open"`, `"reviewing"`, or `"completed"`).

**It does not check `conference.submission_deadline` or `conference.configurations.full_paper_submission_deadline` at all.**

This means: if the conference status is still `"open"` but the deadline date has passed (which can easily happen if the backend hasn't automatically transitioned status), the submit button remains fully enabled.

#### 2b. `SubmissionActionBar` receives no deadline-related props

**File:** `components/author/submit/submission-action-bar.tsx`

The action bar component that renders the Submit button accepts a `canSubmit` prop, which defaults to `true`:

```tsx
interface SubmissionActionBarProps {
  currentStep: StepType
  submitting: boolean
  canSubmit?: boolean   // ← defaults to true
  ...
}

// Submit button:
<button
  type="button"
  onClick={onSubmit}
  disabled={!canSubmit || submitting}   // canSubmit is always true by default
  ...
>
  Submit Paper
</button>
```

In `paper-submission-form.tsx`, `SubmissionActionBar` is used without ever passing `canSubmit`:

```tsx
<SubmissionActionBar
  currentStep={currentStep}
  submitting={submitting}
  onStepChange={setCurrentStep}
  onSaveDraft={handleSaveDraft}
  onSubmit={handleSubmit}
  onCancel={() => router.back()}
  // ❌ canSubmit is never passed — always defaults to true
/>
```

#### 2c. Deadline fields exist in the data model but are never used for UI gating

**File:** `lib/types.ts` (lines 50–83)

The `Conference` interface includes multiple deadline-related fields:

```ts
export interface Conference {
  submission_deadline: string             // Top-level deadline
  configurations?: {
    abstract_submission_deadline?: string
    full_paper_submission_deadline?: string  // The most specific deadline
    ...
  }
}
```

Both `submission_deadline` (top-level) and `configurations.full_paper_submission_deadline` (nested, more specific) are available in the conference object passed to `PaperSubmissionForm`. Neither is checked anywhere in the submission flow to disable the UI.

#### 2d. `handleSubmit` and `handleSaveDraft` only check `isNewSubmissionBlocked` (status-based)

**File:** `components/author/submit/paper-submission-form.tsx` (lines 282–295, 360–373)

Both the save draft and submit handlers perform an early return if `isNewSubmissionBlocked`:

```tsx
const handleSaveDraft = async () => {
  if (!user || !conference) return
  if (isNewSubmissionBlocked) {   // ← status-only check
    toast({ ... variant: "destructive" })
    return
  }
  ...
}

const handleSubmit = async () => {
  if (!user || !conference) return
  if (isNewSubmissionBlocked) {   // ← status-only check
    toast({ ... variant: "destructive" })
    return
  }
  ...
}
```

There is no secondary check for deadline date. The backend will ultimately reject the submission with a 403, but the UI gives no proactive warning or button disabling.

#### 2e. No deadline warning UI anywhere in the form

Searching through the `PaperSubmissionForm` and `SubmissionActionBar` components, there is no UI element — banner, badge, tooltip, or warning message — that informs the user the deadline has passed. The user only discovers the deadline issue after attempting to submit and receiving a backend error.

---

### Data Flow Summary

```
Conference object (has submission_deadline + configurations.full_paper_submission_deadline)
         ↓
PaperSubmissionForm receives `conference` prop
         ↓
isNewSubmissionBlocked = !initialSubmission && conference?.status !== "open"
         ↑
         Only checks status, ignores deadline dates entirely
         ↓
SubmissionActionBar receives no canSubmit prop → defaults to true
         ↓
Submit button is ALWAYS enabled (as long as status === "open")
```

---

### Impact

| Scenario | Expected | Actual |
|---|---|---|
| Deadline passed, status still "open" | Button disabled + warning shown | Button enabled, no warning |
| Deadline passed, status changed to "reviewing" | Button disabled (correct, but for wrong reason) | Button disabled only because status ≠ "open" |
| User tries to submit after deadline | Rejected by backend with error | Allowed to attempt; gets backend error message |
| User awareness of deadline | Should see clear warning proactively | No indication until submit fails |

---

## Summary Table

| Issue | Root File(s) | Root Cause | Infrastructure Available? |
|---|---|---|---|
| UI-SEC-01: Auto-assign button visible to all | `chair-actions-panel.tsx` | No `useAuth()` call, no role check | ✅ `useAuth()` and `currentRole` exist |
| UI-SEC-01: COI tab always shown | `conference-detail-header.tsx` | Static `TABS` array, no role filter, no prop for role | ✅ Can be filtered dynamically |
| UI-SEC-01: Chair routes not protected | `app/role/chair/.../page.tsx`, no `middleware.ts` | No route guard, no Next.js middleware | ✅ Can add middleware or client-side guard |
| UI-NEG-02: Submit button not disabled | `paper-submission-form.tsx`, `submission-action-bar.tsx` | `isNewSubmissionBlocked` only checks `status`, not deadline date | ✅ Deadline fields exist in `Conference` type |
| UI-NEG-02: No deadline warning shown | `paper-submission-form.tsx` | No warning UI implemented at all | ✅ Conference deadline fields available |

---

**Report Version:** 1.0
**Prepared by:** Investigation (Claude Code)
**Status:** Awaiting developer fix

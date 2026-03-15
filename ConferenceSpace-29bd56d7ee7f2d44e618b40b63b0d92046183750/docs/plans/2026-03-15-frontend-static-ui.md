# Frontend Static UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the Next.js frontend into a backend-free static UI build with direct route access, static authentication, mock-backed APIs, and mock-populated screens.

**Architecture:** Preserve the existing App Router structure and component tree, but replace runtime auth and network dependencies at the edges. Mock data will be centralized in the existing frontend fixture modules, while route guards and loading-first rendering paths are removed so pages render immediately.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Tailwind CSS, local mock fixtures in `frontend/lib` and component modules

---

### Task 1: Record Existing Auth and API Touchpoints

**Files:**
- Modify: `frontend/app/**/*`
- Modify: `frontend/components/**/*`
- Modify: `frontend/lib/**/*`

**Step 1: Audit auth gating in route files**

Run: `Get-ChildItem -Path frontend/app -Recurse -File | ForEach-Object { Select-String -Path $_.FullName -Pattern 'useAuth|isAuthenticated|currentRole|redirect\\(|router\\.push\\(|router\\.replace\\(|/login|/role' }`
Expected: list of pages with auth redirects, role routing, or auth-dependent render guards.

**Step 2: Audit backend fetch usage in UI and API modules**

Run: `Get-ChildItem -Path frontend/components,frontend/lib -Recurse -File | ForEach-Object { Select-String -Path $_.FullName -Pattern 'apiFetch\\(|fetch\\(|/api/v1|sessionManager|useSWR|loading' }`
Expected: list of API callers, direct fetches, and loading-driven components that need mock replacement.

**Step 3: Commit notes only if needed**

Skip commit here. Use findings to drive the next tasks.

### Task 2: Replace Runtime Auth With Static Mock Auth

**Files:**
- Modify: `frontend/lib/auth-context.tsx`
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/components/developer-role-toolbar.tsx`

**Step 1: Write the static auth provider**

Implement a hardcoded mock user with roles `author`, `reviewer`, `chair`, and `admin`, and expose a provider whose state initializes to `chair`.

**Step 2: Remove session-manager and backend auth dependencies**

Delete imports and calls to `session-manager`, backend auth endpoints, and auth refresh logic from `frontend/lib/auth-context.tsx`.

**Step 3: Add the persistent role toolbar**

Mount a fixed bottom toolbar in the root layout so it appears on every page and updates `currentRole` through the auth context.

**Step 4: Verify auth consumers still compile**

Run: `npm run lint`
Workdir: `frontend`
Expected: no new auth-context type or import errors.

### Task 3: Remove Route Guards and Default to Chair

**Files:**
- Modify: `frontend/app/dashboard/page.tsx`
- Modify: `frontend/app/role/page.tsx`
- Modify: `frontend/app/login/page.tsx`
- Modify: `frontend/app/register/page.tsx`
- Modify: `frontend/app/dashboard/author/page.tsx`
- Modify: `frontend/app/dashboard/author/submissions/page.tsx`
- Modify: `frontend/app/dashboard/author/submit/page.tsx`
- Modify: `frontend/app/dashboard/chair/page.tsx`
- Modify: `frontend/app/dashboard/chair/create-conference/page.tsx`
- Modify: `frontend/app/dashboard/chair/schedules/page.tsx`
- Modify: `frontend/app/dashboard/conference/page.tsx`
- Modify: `frontend/app/dashboard/reviewer/page.tsx`
- Modify: `frontend/app/dashboard/reviewer/completed/page.tsx`
- Modify any other `frontend/app/**/page.tsx` files that still redirect to `/login` or render `null` behind auth checks

**Step 1: Remove `/login` redirects**

Delete page-level `router.push("/login")` and auth-check timers/effects from all affected routes.

**Step 2: Remove auth-dependent blank returns**

Replace `if (!authChecked || !isAuthenticated || !user) return null` patterns with direct rendering based on static auth data.

**Step 3: Normalize default entry routing**

Change `/dashboard` and `/role` to route to `/dashboard/chair`. Keep `/login` and `/register` visible, and route successful submission to `/role`.

**Step 4: Verify route files**

Run: `Get-ChildItem -Path frontend/app -Recurse -File | ForEach-Object { Select-String -Path $_.FullName -Pattern 'router\\.push\\(\"/login\"|router\\.replace\\(\"/login\"|authChecked && !isAuthenticated|!authChecked \\|\\| !isAuthenticated' }`
Expected: no remaining auth gate patterns in route files.

### Task 4: Rewrite API Modules to Use Mock Data

**Files:**
- Modify: `frontend/lib/api/client.ts`
- Modify: `frontend/lib/api/conferences.ts`
- Modify: `frontend/lib/api/papers.ts`
- Modify: `frontend/lib/api/reviewer.ts`
- Modify: `frontend/lib/api/reviews.ts`
- Modify: `frontend/lib/api/submissions.ts`
- Modify: `frontend/lib/api/notifications.ts`

**Step 1: Replace fetch transport with mock-safe helpers**

Make `client.ts` return resolved mock-style responses and preserve exported error types only if existing callers rely on them.

**Step 2: Rewire each API module to local fixtures**

Return data from `frontend/lib/mock-data.ts`, `frontend/lib/mock-data/`, and existing component mock modules. Preserve signatures and expected shapes.

**Step 3: Fill fixture gaps inline**

Where the UI expects missing entities, fabricate minimal realistic conference, submission, review, reviewer, or notification objects inline in the module.

**Step 4: Verify network calls are removed**

Run: `Get-ChildItem -Path frontend/lib/api -Recurse -File | ForEach-Object { Select-String -Path $_.FullName -Pattern 'fetch\\(|api/backend|/api/v1' }`
Expected: no live network calls remain in the targeted API modules.

### Task 5: Patch Screens That Still Stall or Render Empty

**Files:**
- Modify: `frontend/components/author/author-dashboard.tsx`
- Modify: `frontend/components/author/author-conference-detail.tsx`
- Modify: `frontend/components/author/author-submissions-list.tsx`
- Modify: `frontend/components/chair/submission-review-tab.tsx`
- Modify: `frontend/components/coi/coi-dashboard.tsx`
- Modify: `frontend/components/coi/coi-analysis-dashboard.tsx`
- Modify: `frontend/components/coi/coi-detail-view.tsx`
- Modify: `frontend/components/coi/paper-coi-list.tsx`
- Modify: `frontend/components/reviewer/completed-reviews.tsx`
- Modify any other screen components that still depend on empty network results or loading-only initialization

**Step 1: Replace loading-first state with mock-first state**

Initialize local state directly from mock fixtures wherever backend absence currently causes endless loading or placeholder-only rendering.

**Step 2: Seed empty lists with at least two records**

Ensure every list screen has at least two realistic items by extending fixtures or adding local fallbacks.

**Step 3: Remove normal-navigation error toasts**

Suppress or eliminate error toasts that only exist because the backend is unavailable.

**Step 4: Verify loading and empty-state hotspots**

Run: `Get-ChildItem -Path frontend/components -Recurse -File | ForEach-Object { Select-String -Path $_.FullName -Pattern 'Loading|loading|Spinner|Skeleton|toast\\(|variant: \"destructive\"' }`
Expected: remaining loading states are intentional, and destructive toasts are not triggered by normal mock-backed navigation.

### Task 6: Final Verification

**Files:**
- Modify: only files touched in prior tasks

**Step 1: Run lint**

Run: `npm run lint`
Workdir: `frontend`
Expected: lint passes, or only pre-existing issues remain to be reported explicitly.

**Step 2: Inspect changed files**

Run: `git diff -- docs/plans frontend`
Expected: diff contains the static auth conversion, mock API rewrites, route guard removal, toolbar addition, and screen fallback patches.

**Step 3: Commit implementation when complete**

Run:
```bash
git add docs/plans/2026-03-15-frontend-static-ui-design.md docs/plans/2026-03-15-frontend-static-ui.md frontend
git commit -m "feat: convert frontend to static mock UI"
```
Expected: commit includes only the intended frontend static-UI changes.

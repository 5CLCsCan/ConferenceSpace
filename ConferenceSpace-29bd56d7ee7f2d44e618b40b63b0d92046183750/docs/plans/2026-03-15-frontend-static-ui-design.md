# Frontend Static UI Design

**Date:** 2026-03-15

**Goal:** Convert the Next.js frontend into a fully backend-free static UI build so evaluators can navigate every route directly, switch roles instantly, and see realistic mock content without authentication or network dependencies.

## Scope

- Remove authentication enforcement and role-gate redirects from all routes under `frontend/app`.
- Replace the runtime auth provider with a static mock implementation that always reports an authenticated multi-role user.
- Rewrite the frontend API layer to return mock data from local fixtures instead of fetching from the Go backend.
- Add a persistent developer role toolbar visible on every page.
- Patch screens that still render spinners, null returns, or empty states because of missing backend data.
- Keep `/login` and `/register` pages available, but make them non-blocking entry points that route into the app.

## Approach

### Routing and Auth

- Keep the existing route structure and page components in place.
- Rewrite `frontend/lib/auth-context.tsx` into a static client-side provider with:
  - a hardcoded mock user,
  - `isAuthenticated = true`,
  - default `currentRole = "chair"`,
  - no-op `login`, `register`, `logout`, and `refreshUser`,
  - instant `switchRole` support for role-sensitive UI.
- Remove all redirects to `/login` and all auth-dependent `null`/spinner guards in `frontend/app`.
- Change `/dashboard` and `/role` to route users into `/dashboard/chair` by default.
- Keep `/login` and `/register` renderable; form submission routes to `/role` to preserve the original “enter the app” flow.

### Data Layer

- Rewrite functions in `frontend/lib/api/client.ts`, `frontend/lib/api/conferences.ts`, `frontend/lib/api/papers.ts`, `frontend/lib/api/reviewer.ts`, `frontend/lib/api/reviews.ts`, `frontend/lib/api/submissions.ts`, and `frontend/lib/api/notifications.ts` to return local mock data.
- Reuse `frontend/lib/mock-data.ts`, `frontend/lib/mock-data/`, and existing component-level mock fixtures where possible.
- Preserve exported function names and return shapes so the existing UI keeps working with minimal component churn.
- Fabricate small inline mock objects only where fixture coverage is missing.

### Screen Behavior

- Audit every page under `frontend/app` and the components/hooks they rely on for:
  - auth redirects,
  - role guards,
  - network-driven loading states,
  - empty data branches.
- Replace loading-first initialization with immediate mock-backed initialization wherever backend absence currently causes blank or stalled screens.
- Ensure list and detail views show realistic content, with at least two populated items on list screens.

### Developer Toolbar

- Add a fixed bottom toolbar at the app-shell level so it is visible across the frontend.
- Provide four role buttons: Author, Reviewer, Chair, Admin.
- Switching roles updates `currentRole` in the auth context immediately, without reloading the page.
- Style the toolbar to match the repo’s “Scholar-Compact” conventions from `frontend/.steerings/insights.md` and `frontend/.steerings/sizings.md`.

## Verification

- Run a full auth/API audit of `frontend/app`, `frontend/components`, and `frontend/lib`.
- Run targeted frontend verification after edits, at minimum `npm run lint`.
- Do not touch `__tests__/` or config files.

## Notes

- This is a one-way static UI conversion, not a feature-flagged fallback.
- The intent is to preserve evaluator-facing UX while removing backend coupling at the edges.

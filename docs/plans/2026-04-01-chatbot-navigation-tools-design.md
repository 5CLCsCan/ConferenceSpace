# Chatbot Navigation Tools Design

**Date:** 2026-04-01

**Goal**

Add two agent-facing navigation tools that let the chatbot understand where it is and move reliably within the authenticated platform:
- `getCurrentNavigation` returns the current location plus the full agent sitemap
- `navigate` moves only to known sitemap destinations using explicit params

This should replace blind URL guessing with a typed, inspectable navigation contract.

**Approved Constraints**

- Only authenticated platform routes are included
- `navigate` is restricted to known sitemap destinations, not arbitrary paths
- Dynamic routes require explicit params
- Missing required params must fail hard with a clear error
- The sitemap must reflect real, reachable pages, not just route constants

**Problem**

The current agent can inspect the page via `getPageContext` and act on visible elements via `performAction`, but it has no reliable notion of:
- where it currently is
- which destinations exist in the platform
- how to move between pages without brittle button-click sequences

Without a sitemap-backed contract, navigation becomes one of:
- blind DOM interaction
- hardcoded assumptions inside prompts
- unsafe freeform URL construction

All three are weak.

**Recommended Approach**

Use a generated, typed sitemap module on the frontend and expose it through two client tools.

This keeps route awareness close to the actual App Router environment while still letting the Python runtime advertise a stable tool contract to the model.

**Architecture**

1. Add a shared frontend sitemap module under `frontend/lib/chatbot/`
2. Add path resolution and route-building helpers on the frontend
3. Add two new client tools to the Python `TOOL_REGISTRY`
4. Execute those tools in `ChatView`, where Next navigation and current route state are available
5. Update runtime instructions so the model prefers sitemap-backed navigation over blind actions

The sitemap is the contract. The tools are just two access points into that contract.

**Tool Contracts**

### `getCurrentNavigation`

**Input**

No input.

**Output**

- `url`: current full URL
- `pathname`: current pathname
- `destinationId`: matched sitemap destination id or `null`
- `params`: extracted route/query params for the matched destination
- `matchStatus`: `"matched"` or `"unmapped"`
- `sitemap`: full serialized sitemap

If the current page does not match a known destination, the tool must still return the sitemap and mark the result as unmapped instead of guessing.

### `navigate`

**Input**

- `destinationId: string`
- `params?: Record<string, string>`

**Behavior**

- validates that `destinationId` exists in the sitemap
- validates role access
- validates required params
- fills dynamic path segments from params
- appends allowed query params
- rejects unresolved template tokens
- performs client-side navigation with Next router

**Output**

- `success: boolean`
- `message: string`
- `destinationId`
- `path`

On failure, it must return a clear structured error message rather than falling back to another route.

**Sitemap Shape**

The sitemap should be typed and explicit, not freeform JSON built ad hoc.

Each destination should contain:
- `id`
- `label`
- `roleScope`
- `pathTemplate`
- `requiredParams`
- `optionalParams`
- `paramLocations`
- `parentId`
- `kind`

Recommended `kind` values:
- `hub`
- `list`
- `detail`
- `create`
- `edit`

Recommended `roleScope` values:
- `shared`
- `author`
- `reviewer`
- `chair`

**Detailed Authenticated Sitemap**

### Shared

- `role.select` -> `/role`
- `notifications.index` -> `/notifications`
- `profile.detail` -> `/profile/:user_id`

### Author

- `author.dashboard` -> `/role/author`
- `author.conference.detail` -> `/role/author/conferences/:conferenceId`
- `author.submissions.index` -> `/role/author/submissions`
- `author.submission.new` -> `/role/author/submissions/new`
  - optional query: `conferenceId`
- `author.submission.detail` -> `/role/author/submissions/:submissionId`
  - optional query: `conferenceId`, `tab`
- `author.submission.edit` -> `/role/author/submissions/:submissionId/edit`
  - optional query: `conferenceId`
- `author.schedules.index` -> `/role/author/schedules`

### Reviewer

- `reviewer.dashboard` -> `/role/reviewer`
- `reviewer.conferences.index` -> `/role/reviewer/conferences`
- `reviewer.conference.submissions` -> `/role/reviewer/conferences/:conferenceId/submissions`
- `reviewer.assignment.detail` -> `/role/reviewer/assignments/:assignmentId`
  - optional query: `conferenceId`, `tab`
- `reviewer.invitations.index` -> `/role/reviewer/invitations`
- `reviewer.completed.index` -> `/role/reviewer/completed`
- `reviewer.schedules.index` -> `/role/reviewer/schedules`

### Chair

- `chair.dashboard` -> `/role/chair`
- `chair.conferences.index` -> `/role/chair/conferences`
- `chair.conference.new` -> `/role/chair/conferences/new`
- `chair.conference.detail` -> `/role/chair/conferences/:conferenceId`
- `chair.conference.edit` -> `/role/chair/conferences/:conferenceId/edit`
- `chair.conference.submissions` -> `/role/chair/conferences/:conferenceId/submissions`
- `chair.submission.detail` -> `/role/chair/conferences/:conferenceId/submissions/:submissionId`
  - optional query: `tab`
- `chair.schedules.index` -> `/role/chair/schedules`
- `chair.template.new` -> `/role/chair/templates/new`

**Explicit Exclusion**

Do not include `ROUTES.CHAIR.TEMPLATES` (`/role/chair/templates`) in the sitemap.

Reason: the route constant exists in `frontend/lib/routes.ts`, but there is no corresponding page in `frontend/app`. A sitemap that advertises non-existent destinations is worse than having no sitemap.

**Source of Truth**

The sitemap should be constructed from a curated frontend registry that references real route builders and real page coverage. The filesystem and route constants inform the registry, but the exported sitemap should not be inferred blindly from them at runtime.

This avoids two failure modes:
- route constants that point to missing pages
- filesystem paths that lack product labels, role scope, or param semantics

**Current Location Resolution**

`getCurrentNavigation` should resolve the current destination by matching the current pathname against sitemap templates and then extracting path params. Query params should be included only when declared for that destination.

If no destination matches:
- `destinationId = null`
- `matchStatus = "unmapped"`
- `params = {}`

No heuristic guessing.

**Failure Handling**

`navigate` must fail clearly for:
- unknown `destinationId`
- forbidden role scope
- missing required params
- unresolved path template segments
- invalid param location configuration
- attempted external navigation

These failures should be visible to the model so it can correct itself.

**Frontend/Backend Boundary**

### Frontend responsibilities

- maintain the sitemap registry
- resolve current location from Next route state
- build destination URLs
- perform client-side navigation

### Backend responsibilities

- expose the tool definitions
- teach the model how to use them through runtime instructions
- keep the tool contract stable

This is the correct split because current route state and router navigation live on the client.

**Prompt / Runtime Guidance**

Update the runtime tool instructions to say:
- use `getCurrentNavigation` when route context matters
- use the returned sitemap to choose valid destinations
- use `navigate` for route changes
- use `getPageContext` and `performAction` for on-page interaction after arriving

That sequence is more reliable than trying to click around the shell to move between pages.

**Testing**

Minimum required coverage:

- sitemap includes only intended authenticated destinations
- known pathnames resolve to the correct destination id and params
- unmapped paths return `matchStatus = "unmapped"`
- `navigate` rejects unknown destinations
- `navigate` rejects missing required params
- `navigate` encodes allowed query params correctly
- role-gated destinations reject disallowed roles
- `ChatView` executes both tools and returns tool output payloads
- Python tool registry and runtime helper tests cover the new tool specs

**Out of Scope**

- freeform navigation to arbitrary relative paths
- scraping the router tree at runtime to generate the sitemap
- including public auth pages
- automatic fallback to parent routes when params are missing

Those behaviors would make the tool look more flexible while actually making it less trustworthy.

# Chair Conference Detail Restoration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the production chair conference detail header and legacy tabs to the legacy visual system while preserving all current production behavior and API wiring.

**Architecture:** Rewrite the rendered JSX and Tailwind classes of the target chair conference-detail components to match the legacy chair shells, then apply only the smallest token substitutions required by the current steering docs and the fixed author conference-detail screens. Keep all production hooks, API calls, state, routing, and handlers intact; this is a visual shell transplant rather than a behavioral rewrite.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest, Testing Library

---

### Task 1: Restore Header Shell And Lock It With Tests

**Files:**
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/conference-detail-header.tsx`
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/__tests__/conference-detail-header.test.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/components/chair/conference-detail/conference-detail-header.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/author/conference-detail/conference-header.tsx`

**Step 1: Write the failing test**

Update the existing header test so it asserts the restored legacy shell instead of only tab counts. Add expectations for:

- breadcrumb area rendering conference acronym/year
- metadata row rendering location and date text
- restored tab bar wrapper using the legacy border/tabs structure
- extra production-only tabs (`assignments`, `rebuttal`) still rendering for chair

Example assertion block:

```tsx
expect(screen.getByText("Test Conference")).toBeInTheDocument()
expect(screen.getByText("Paris")).toBeInTheDocument()
expect(screen.getByText(/Jan 01/)).toBeInTheDocument()
expect(screen.getByRole("button", { name: /Assignments/i })).toBeInTheDocument()
expect(screen.getByRole("button", { name: /Rebuttal/i })).toBeInTheDocument()
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- frontend/components/chair/conference-detail/__tests__/conference-detail-header.test.tsx`

Expected: FAIL because the current header test coverage does not yet assert the restored shell and at least one new expectation should fail before the implementation change.

**Step 3: Write minimal implementation**

In `conference-detail-header.tsx`:

- restore the legacy breadcrumb/title/meta/tab markup as the base structure
- keep production tab generation, role gating, scroll area support, and edit navigation
- style `assignments` and `rebuttal` with the same restored tab shell
- only adjust tokens when legacy values conflict with the steering docs or the fixed author header

Keep these behaviors unchanged:

- `userRole` filtering
- `router.push(ROUTES.CHAIR.CONFERENCE_EDIT(conference.id))`
- current `TabId` values and click handling

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- frontend/components/chair/conference-detail/__tests__/conference-detail-header.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/chair/conference-detail/conference-detail-header.tsx frontend/components/chair/conference-detail/__tests__/conference-detail-header.test.tsx
git commit -m "feat: restore chair conference detail header shell"
```

### Task 2: Restore Overview, CFP, And Dates Using Legacy Layouts

**Files:**
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/conference-overview.tsx`
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/conference-cfp.tsx`
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/conference-dates.tsx`
- Create: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/__tests__/conference-overview.test.tsx`
- Create: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/__tests__/conference-cfp.test.tsx`
- Create: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/__tests__/conference-dates.test.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/components/chair/conference-detail/conference-overview.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/components/chair/conference-detail/conference-cfp.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/components/chair/conference-detail/conference-dates.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/author/conference-detail/overview-tab.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/author/conference-detail/call-for-papers-tab.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/author/conference-detail/important-dates-tab.tsx`

**Step 1: Write the failing tests**

Add three targeted render tests that prove the restored shell exists without mocking the full app:

- `conference-overview.test.tsx`: assert About, Conference Tracks, Details, and Keywords sections render in the same shell
- `conference-cfp.test.tsx`: assert main CFP card plus right-rail Important Dates and Author Resources shells render
- `conference-dates.test.tsx`: assert the timeline header/card structure renders and the calendar sync action still exists when data is present

Example expectations:

```tsx
expect(screen.getByText(/About the Conference/i)).toBeInTheDocument()
expect(screen.getByText(/Conference Tracks/i)).toBeInTheDocument()
expect(screen.getByText(/Important Dates/i)).toBeInTheDocument()
expect(screen.getByRole("button", { name: /Sync to Calendar/i })).toBeInTheDocument()
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:run -- frontend/components/chair/conference-detail/__tests__/conference-overview.test.tsx frontend/components/chair/conference-detail/__tests__/conference-cfp.test.tsx frontend/components/chair/conference-detail/__tests__/conference-dates.test.tsx`

Expected: FAIL because the tests assert legacy shells that are not yet present in production.

**Step 3: Write minimal implementation**

In `conference-overview.tsx`:

- transplant the legacy two-column composition
- map production conference/tracks/domain data into the legacy About, Tracks, Details, and Keywords cards
- render loading and error states inside the restored card shell where possible

In `conference-cfp.tsx`:

- transplant the legacy `lg:grid-cols-10` shell and compact markdown renderer
- keep the current data-loading logic and feed API content into the restored markdown card
- map API important dates into the legacy right-rail timeline card
- keep any production read-only status messaging, but render it as a compact in-shell status block

In `conference-dates.tsx`:

- transplant the legacy timeline page structure
- group flat `ImportantDate[]` data into deterministic visual phases
- preserve the `downloadICS(...)` action and production data loading

Use the fixed author tabs for token tie-breaks when legacy classes and steering docs conflict.

**Step 4: Run tests to verify they pass**

Run: `npm run test:run -- frontend/components/chair/conference-detail/__tests__/conference-overview.test.tsx frontend/components/chair/conference-detail/__tests__/conference-cfp.test.tsx frontend/components/chair/conference-detail/__tests__/conference-dates.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/chair/conference-detail/conference-overview.tsx frontend/components/chair/conference-detail/conference-cfp.tsx frontend/components/chair/conference-detail/conference-dates.tsx frontend/components/chair/conference-detail/__tests__/conference-overview.test.tsx frontend/components/chair/conference-detail/__tests__/conference-cfp.test.tsx frontend/components/chair/conference-detail/__tests__/conference-dates.test.tsx
git commit -m "feat: restore chair overview cfp and dates shells"
```

### Task 3: Restore Committee, Submissions, And COI Visual Shells

**Files:**
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/conference-committee.tsx`
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/conference-submissions.tsx`
- Modify: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/conference-coi.tsx`
- Create: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/__tests__/conference-committee.test.tsx`
- Create: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/__tests__/conference-submissions.test.tsx`
- Create: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/__tests__/conference-coi.test.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/components/chair/conference-detail/conference-committee.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/components/chair/conference-detail/conference-submissions.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/components/chair/conference-detail/conference-coi.tsx`
- Reference: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/author/conference-detail/committee-tab.tsx`

**Step 1: Write the failing tests**

Create targeted tests that assert the restored shells rather than the full data behavior:

- `conference-committee.test.tsx`: stats row plus dense committee table shell render
- `conference-submissions.test.tsx`: restored table headers and filter bar render
- `conference-coi.test.tsx`: stats grid and restored filter/table shell render

Example expectations:

```tsx
expect(screen.getByText(/Committee Members/i)).toBeInTheDocument()
expect(screen.getByText(/Paper Details/i)).toBeInTheDocument()
expect(screen.getByText(/Conflicts of Interest Management/i)).toBeInTheDocument()
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:run -- frontend/components/chair/conference-detail/__tests__/conference-committee.test.tsx frontend/components/chair/conference-detail/__tests__/conference-submissions.test.tsx frontend/components/chair/conference-detail/__tests__/conference-coi.test.tsx`

Expected: FAIL because the restored legacy shells are not implemented yet.

**Step 3: Write minimal implementation**

In `conference-committee.tsx`:

- transplant the legacy stats-row + dense-table composition
- preserve the existing reviewer search, invite, and remove flows
- move the current invite workflow into the restored header/table shell instead of the current separate invite card layout

In `conference-submissions.tsx`:

- transplant the legacy page header, action row, filter bar, table shell, progress bar styling, and pagination styling
- preserve search, status filtering, fetched rows, review progress calculation, and submission-detail routing

In `conference-coi.tsx`:

- transplant the legacy page framing, stats presentation, filters, table shell, and pagination treatment
- preserve search, severity filtering, pagination, rebuild action, and current API-backed states
- keep manual moderation actions disabled/nonexistent if production does not support them

During cleanup:

- remove unused helper components, icon utilities, or stale styling branches left behind after the transplant
- leave `conference-assignments.tsx`, `conference-rebuttal-settings.tsx`, and `conference-rebuttal-management.tsx` untouched

**Step 4: Run tests to verify they pass**

Run: `npm run test:run -- frontend/components/chair/conference-detail/__tests__/conference-committee.test.tsx frontend/components/chair/conference-detail/__tests__/conference-submissions.test.tsx frontend/components/chair/conference-detail/__tests__/conference-coi.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/chair/conference-detail/conference-committee.tsx frontend/components/chair/conference-detail/conference-submissions.tsx frontend/components/chair/conference-detail/conference-coi.tsx frontend/components/chair/conference-detail/__tests__/conference-committee.test.tsx frontend/components/chair/conference-detail/__tests__/conference-submissions.test.tsx frontend/components/chair/conference-detail/__tests__/conference-coi.test.tsx
git commit -m "feat: restore chair committee submissions and coi shells"
```

### Task 4: Run Full Frontend Verification And Final Cleanup

**Files:**
- Review: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/`
- Review: `E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/app/role/chair/conferences/[conferenceId]/page.tsx`

**Step 1: Run targeted chair conference-detail tests**

Run:

```bash
npm run test:run -- frontend/components/chair/conference-detail/__tests__/conference-detail-header.test.tsx frontend/components/chair/conference-detail/__tests__/conference-overview.test.tsx frontend/components/chair/conference-detail/__tests__/conference-cfp.test.tsx frontend/components/chair/conference-detail/__tests__/conference-dates.test.tsx frontend/components/chair/conference-detail/__tests__/conference-committee.test.tsx frontend/components/chair/conference-detail/__tests__/conference-submissions.test.tsx frontend/components/chair/conference-detail/__tests__/conference-coi.test.tsx
```

Expected: PASS

**Step 2: Run lint**

Run: `npm run lint`

Expected: PASS with `0` warnings

**Step 3: Run production build**

Run: `npm run build`

Expected: PASS and a successful Next.js production build

**Step 4: Inspect final diff**

Run: `git diff -- frontend/components/chair/conference-detail frontend/app/role/chair/conferences/[conferenceId]/page.tsx`

Expected:

- only the targeted chair conference-detail components changed
- no edits to assignments or rebuttal components
- no dead imports or orphaned styling branches remain in touched files

**Step 5: Commit**

```bash
git add frontend/components/chair/conference-detail
git commit -m "feat: restore chair conference detail legacy visuals"
```

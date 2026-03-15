# Chair Conference Detail Restoration Design

**Date:** 2026-03-15
**Goal:** Restore the chair conference detail header and legacy tab visuals in the production frontend while preserving all current production data flow, API wiring, state, routing, and feature behavior.

---

## Scope

Restore the visual design of these production components under `frontend/components/chair/conference-detail/`:

- `conference-overview.tsx`
- `conference-cfp.tsx`
- `conference-dates.tsx`
- `conference-committee.tsx`
- `conference-submissions.tsx`
- `conference-coi.tsx`
- `conference-detail-header.tsx`

Do not modify:

- `conference-assignments.tsx`
- `conference-rebuttal-settings.tsx`
- `conference-rebuttal-management.tsx`
- API modules, route files, backend code, or endpoint wiring

The legacy repo at `ConferenceSpace-29bd56d7ee7f2d44e618b40b63b0d92046183750/frontend/` is read-only reference material and remains the primary visual source of truth.

---

## Visual Source Priority

When restoring the UI, use this precedence order:

1. Legacy chair conference-detail components for layout, hierarchy, card structure, table structure, spacing patterns, and overall visual composition.
2. `frontend/.steerings/insights.md` and `frontend/.steerings/sizings.md` for token-level corrections required by the current design system.
3. Fixed author conference-detail screens under `frontend/components/author/conference-detail/` as the tie-break reference when the legacy chair visuals and current steering docs diverge.

This means legacy structure wins, but token substitutions may be made when necessary to align with the current Scholar-Compact styling already established in the production app.

---

## Architecture

### Restoration Strategy

Each production component keeps its current:

- props and TypeScript interfaces
- hooks and state management
- API calls and async loading behavior
- event handlers and side effects
- navigation and route integration

Each production component has its rendered JSX and Tailwind class structure rewritten to match the legacy visual shell as closely as possible.

The work is a shell transplant, not a behavioral rewrite.

### Boundaries

- Touch only the target components in `frontend/components/chair/conference-detail/`.
- Preserve production-only tabs in the header (`assignments`, `rebuttal`) and style them with the restored tab shell.
- Avoid new dependencies, CSS files, or inline styling beyond what existing component patterns already use.
- Remove dead imports, helper functions, and styling branches that become unused after the transplant.

---

## Component Mapping

### `conference-overview.tsx`

Restore the legacy two-column layout:

- left rail: `About` card and `Conference Tracks` card
- right rail: `Details` card and `Keywords` card

Production data sources stay unchanged:

- `getConferenceById(conferenceId)`
- `getConferenceTracks(conferenceId)`

Production content is mapped into the legacy card structure:

- conference description populates the `About` card
- track API results populate the legacy tracks list shell
- current conference fields populate the `Details` card
- `conference.domain` populates the keyword chip card

Empty states remain, but render inside the restored card shells instead of standalone text blocks.

### `conference-cfp.tsx`

Restore the legacy `7/3` split layout:

- main CFP markdown card on the left
- right rail with management/status shell, important dates card, and author resources card

Production logic stays unchanged:

- `getConferenceById(conferenceId)`
- `getConferenceDates(conferenceId)`

Production CFP text populates the restored markdown shell. Production dates populate the restored compact timeline card. If the production implementation exposes read-only workflow messaging, it should render as a compact status block inside the restored right rail instead of replacing the legacy composition.

### `conference-dates.tsx`

Restore the legacy timeline page:

- page header
- left-column timeline with phases/events
- right-column summary cards

Production logic stays unchanged:

- `getConferenceDates(conferenceId)`
- `getConferenceById(conferenceId)`
- `downloadICS(...)`

Because production dates are a flat API list and legacy uses grouped phases, the API data will be grouped into deterministic visual phases without changing the underlying data source. If the data does not naturally fill multiple phases, a reduced but visually faithful timeline still uses the legacy cards and timeline treatment.

### `conference-committee.tsx`

Restore the legacy committee dashboard and dense table structure:

- top stats row
- dense filter/action header
- single committee table surface
- legacy pagination styling

Production reviewer management behavior stays unchanged:

- `getConferenceReviewers(...)`
- reviewer invite search dropdown
- direct email handling
- `inviteReviewers(...)`
- `removeReviewer(...)`

The current invite/search/remove workflows are placed inside the legacy visual shell rather than retaining the current separate invite card layout.

### `conference-submissions.tsx`

Restore the legacy submissions page:

- legacy page header and action area
- dense filter/search bar
- table column layout
- progress bars and score badge treatments
- legacy pagination styling

Production logic stays unchanged:

- `getConferenceSubmissions(...)`
- `getSubmissionReviews(...)`
- debounced search
- status filtering
- route navigation to submission detail

No table columns or query behavior are removed unless the underlying production data does not support them.

### `conference-coi.tsx`

Restore the legacy COI page framing:

- header hierarchy
- stats grid presentation
- filter bar
- table shell and pagination
- legacy right-rail or batch-operations-style cards where feasible

Production logic stays unchanged:

- `getCOIDashboardStats(...)`
- `getAllCOIRelationships(...)`
- `rebuildCOIRelationships(...)`
- existing search, severity filtering, pagination, and rebuild messaging

If the legacy shell includes manual moderation controls that production does not support, keep the visual shell but do not invent new behavior. Current production informational and rebuild actions should occupy the restored card surfaces instead.

### `conference-detail-header.tsx`

Restore the legacy breadcrumb, title, metadata row, and tab strip structure.

Keep current production behavior:

- `userRole` gating
- conference edit navigation
- production-only tabs: `assignments`, `rebuttal`

The restored header must make the legacy tabs visually match the legacy version while styling production-only tabs consistently within the same restored tab strip.

---

## Token Adjustment Rules

Token-level substitutions are allowed only when needed to align with the current production design language.

Primary adjustments to preserve:

- pure white main surfaces instead of drifting gray shells
- compact Scholar-Compact typography
- `text-sm` section titles and `text-xs` primary body copy
- `text-[10px]` to `text-[11px]` metadata, table, and control text
- `px-4 pt-4 pb-3` card padding where consistent with the restored structure
- deep navy / slate accent system from the steering docs
- restrained slate-based badges and borders unless the legacy pattern requires a stronger semantic cue

If the legacy chair token and the author-side current implementation disagree, prefer the author-side token usage when it better matches the steering docs without changing the legacy layout.

---

## Verification

Verification for the implementation phase should include:

- visual diff review against the legacy source for each targeted component
- confirmation that untouched production-only tabs were not modified beyond shared header styling
- `npm run lint` in `frontend`
- `npm run build` in `frontend`

If any component cannot exactly mirror the legacy shell because the production API shape differs, the implementation should preserve the legacy composition and document the smallest necessary adaptation.

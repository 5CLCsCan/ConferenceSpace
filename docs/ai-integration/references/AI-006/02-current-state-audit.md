# AI-006 Current State Audit

## Status

- State: current-state audit
- Last updated: 2026-03-31

## Current Chair Runtime Anchors

### Submission Detail Loader

`frontend/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`

Current behavior:

- loads conference detail
- loads submission detail
- loads submission reviews
- loads discussion threads and messages
- builds derived history events

This route already aggregates most of the evidence AI-006 needs.

### Submission Detail Shell

`frontend/components/chair/conference-detail/submission-detail-content.tsx`

Current behavior:

- splits chair submission detail into `overview`, `reviews`, `discussion`, and `history`
- provides the natural integration point for AI-006 without adding a new top-level tab

### Current Decision Surface

`frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`

Current behavior:

- renders review score summaries
- renders point-by-point rebuttal state when available
- persists only explicit `accept` and `reject` through `updateSubmissionStatus`

This is the correct place to preserve the hard boundary that AI-006 must never cross.

## Existing Analytics And Signals

### Review Analytics

`frontend/lib/api/reviews.ts`
`frontend/components/chair/submission-analytics.tsx`

Current contract already exposes:

- recommendation distribution
- average score
- confidence distribution
- criteria averages

These are enough to derive:

- weakest/strongest criteria
- confidence mix
- review coverage completeness

### Rebuttal Signals

`frontend/lib/api/rebuttal.ts`
`frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx`

Current behavior already exposes:

- rebuttal points
- rebuttal statuses
- reviewer acknowledgments
- score-change display after rebuttal

AI-006 can use these signals when rebuttal applies, but they must resolve to `not_applicable` when rebuttal is disabled or absent.

### Discussion Signals

`frontend/components/chair/conference-detail/submission-detail/chair-discussion-tab.tsx`

Current behavior already exposes:

- thread count
- message loading
- activity timestamps and thread content access paths

AI-006 should normalize these into discussion activity signals rather than becoming a raw discussion transcript mirror.

## Missing Pieces

- no AI-006 frontend client or hook
- no AI-006 copilot panel
- no submission-scoped backend workflow route
- no `ai-service` workflow or repository for AI-006
- no artifact/run persistence for AI-006
- no AI-006 test coverage

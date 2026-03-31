# Product UI Baseline

This file is the canonical visual and interaction baseline for product UI work in ConferenceSpace.

Scope:
- All product UI surfaces across chair, reviewer, author, conference management, and shared dashboards
- New workflow panels, settings surfaces, submission detail views, tables, forms, and sidebars

Explicit exclusions:
- `AI-002`
- `AI-003`

Those two AI flows are intentionally bespoke. Do not treat them as baseline references when designing future product UI.

## Core Direction

ConferenceSpace uses a scholar-compact product language:
- Dense, not cramped
- Serious, not sterile
- Clear, not loud
- Inspectable, not decorative

The interface should feel like an academic operations tool. The user is usually comparing evidence, scanning structured information, and making high-consequence workflow decisions. The default posture is calm precision.

## Reuse First

Consistency in ConferenceSpace comes from reusing shared structures, not from rewriting the same UI in parallel with similar classes.

Precedence order for new UI work:
1. Reuse an existing shared component from `components/ui` when it already solves the problem
2. Reuse an existing domain-common pattern from the same product area when the behavior and shape already match
3. Promote repeated local UI into a shared primitive when repetition is starting to appear
4. Build a one-off surface only when the feature is genuinely unique and reuse would be forced or misleading

Rules:
- If a shared component exists, use it
- If a shared pattern exists in the same area, follow it before inventing another variant
- If multiple features need the same structure, extract it once instead of cloning it repeatedly
- If a globally owned primitive needs stylistic evolution, update the primitive instead of restyling each instance locally

Do not:
- recreate shared components inline with slightly different class strings
- fork existing wrappers just to make local copies
- copy-paste cards, headers, pills, tooltips, collapse shells, or action rows when a reusable version already exists
- treat visual consistency as a manual styling exercise instead of a component ownership rule

## Design Principles

### 1. Keep the surface quiet

The product shell should not fight the content.

Rules:
- Prefer white primary surfaces over tinted dashboards
- Use borders and spacing for structure before color fills
- Use shadows softly and consistently
- Avoid decorative gradients, neon accents, and loud status framing in work surfaces

### 2. Preserve information density

This product is not a marketing site. Users need to scan more than they need to admire.

Rules:
- Favor `text-xs` and `text-[10px]` for operational content and metadata
- Use compact cards and short labels
- Collapse secondary content instead of permanently occupying vertical space
- Avoid padding inflation and oversized titles inside working views

### 3. Only emphasize what changes behavior

Many UI problems in this product come from visual emphasis being spent on non-actionable information.

Rules:
- Reserve strong color for actions, warnings, errors, and genuine state transitions
- Keep advisory, contextual, and descriptive information visually subordinate
- Do not repeat the same status in multiple nearby places
- Do not turn neutral summaries into banners

### 4. Make hierarchy obvious at a glance

Users should be able to identify:
- what is the primary task
- what is supporting evidence
- what is reusable output
- what is merely explanatory

This hierarchy must be visible from layout and typography before the user reads the copy.

## Color System

### Core Palette

These colors define the product baseline:
- Primary ink: `#1B3C53`
- Primary hover/deeper emphasis: `#234C6A`
- Secondary accent: `#456882`
- Main canvas: `#FFFFFF`
- Standard border: `slate-200`
- Quiet fill: `slate-50` or `slate-100`
- Body text: `slate-600` to `slate-700`
- Meta text: `slate-400`

### Color Usage Rules

- Use `#1B3C53` for section titles, primary actions, and core decision-facing emphasis
- Use `#234C6A` for hover or stronger primary emphasis, not as a second brand color sprayed across the layout
- Use slate neutrals for pills, passive chips, metadata, separators, and secondary controls
- Use semantic colors only when the meaning is actually semantic:
  - green for positive action/confirmed success
  - amber for stale/caution/review-needed
  - red for failure/destructive/error

Do not:
- color every card differently
- use purple as a default internal accent
- rely on tinted backgrounds for basic section separation

## Typography Hierarchy

Use a compressed, professional type scale.

Preferred hierarchy:
- Page title: `text-[32px]` or existing route-level title pattern
- Card/section title: `text-sm font-bold tracking-tight text-[#1B3C53]`
- Main operational body: `text-xs leading-relaxed text-slate-700`
- Supporting body: `text-xs leading-relaxed text-slate-600`
- Metadata: `text-[10px] text-slate-400`
- Labels/caps: `text-[10px]` or `text-[9px]` uppercase with wide tracking

Rules:
- Section content must never visually overpower its section header
- Metadata should not compete with actions
- Avoid giant subsection headlines inside detail pages
- Avoid long prose blocks unless the user explicitly needs narrative guidance

## Surface Model

### Cards

Default product card:
- `rounded-xl`
- `border border-slate-200`
- `bg-white`
- `shadow-sm`

Use nested inner containers only when they mean something:
- draft/reusable output block
- inset form field zone
- temporary empty-state or helper slab

Do not add inner slabs just to make content look “designed.”

### Layout Roles

Use layout intentionally:
- Center column: evidence, records, analysis, primary reading flow
- Right rail: actions, submission controls, persistent decision inputs, compact utilities
- Top summary region: status, metadata, or key scan information only

If a feature needs width to be readable, move it into the main column instead of cramming it into the right rail.

## Interaction Patterns

### Buttons

Use three clear button tiers:
- Primary action: filled navy button
- Secondary action: bordered white button
- Utility action: compact text-sized control or subtle icon action

Rules:
- One primary action per local surface
- Regenerate/reload/recompute actions are secondary, not primary
- Utility actions should not match the visual weight of a submit or commit action

### Collapse and Expand

Collapsible sections are part of the baseline.

Use collapse when:
- content is secondary to the primary workflow
- generated content is optional to inspect
- long explanatory material would push core task content down

Rules:
- Keep the header visible when collapsed
- Put summary metadata in the header when useful
- Use `expand_more` / `expand_less` as the standard affordance
- Default secondary generated sections to collapsed unless immediate visibility is necessary

### Tooltips

Tooltips are for compact contextual help, not for core content.

Rules:
- Use the shared scholar tooltip component in [scholar-tooltip.tsx](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/ui/scholar-tooltip.tsx), not the raw tooltip primitive
- Keep tooltip copy short and explanatory
- Move non-actionable disclaimers into tooltips when they would otherwise consume space
- Do not hide critical failure or blocking information in a tooltip
- If tooltip styling needs to evolve, update the shared wrapper instead of styling each tooltip instance ad hoc

### Status Treatment

Prefer neutral status presentation first.

Use:
- compact pills for passive state
- subtle left-border emphasis or semantic card tint for true warnings/failures
- inline metadata for freshness/timestamps/cache-like information

Do not:
- duplicate the same status as pill + banner + title + helper line
- display advisory disclaimers repeatedly across the same section

## Shared Pattern Ownership

Some UI structures should be treated as owned patterns, not casually reimplemented feature by feature.

Examples:
- tooltip wrappers
- standard cards
- collapse headers
- action buttons
- metric pills and compact status badges
- draft or reusable output slabs

Rules:
- Reuse the owner pattern if it already exists
- Extend the owner pattern if the product has outgrown it
- Document intentional deviations in the feature design instead of silently drifting
- Avoid near-duplicate wrappers with overlapping purposes

## Content Semantics

Different content types should not share the same visual treatment unless they mean the same thing.

### Evidence content

Evidence sections are plain content inside standard cards.

Examples:
- review analytics
- discussion signals
- rebuttal signals
- disagreement map

### Draft or reusable output

Draft output may use a soft inner container to distinguish it from evidence.

Examples:
- suggested note
- generated rationale draft
- copy-ready notification text

If a section is read-only evidence, do not style it like a drafted artifact.

### Metadata and signal chips

Use compact neutral pills for:
- counts
- categories
- passive signal labels
- evidence basis tags

Do not use large badges or banner blocks for routine metadata.

## What To Avoid

Do not introduce these patterns into future product UI:
- flattened walls of explanatory text
- oversized right-rail analysis panels
- multiple visible disclaimers saying the same thing
- decorative empty slabs that repeat information already shown below
- large headers followed by even larger body copy
- generic shadcn-default tooltip styling in product-critical surfaces
- status-heavy chrome that draws attention away from the core task

## Precedence Rules

When implementing new UI:
1. Follow this baseline first
2. Follow [sizings.md](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/.steerings/sizings.md) for exact scale choices
3. Reuse the closest existing shared component or owned pattern before creating a new structure
4. Preserve established local patterns if the area already has a coherent, stronger precedent
5. If a local pattern conflicts with this guide because it predates the baseline, prefer the baseline for new work and refactors, not silent drift

## Reference Patterns In Current Code

These files reflect the current intended direction better than older bespoke surfaces:
- [chair-decision-copilot-panel.tsx](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/submission-detail/chair-decision-copilot-panel.tsx)
- [scholar-tooltip.tsx](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/ui/scholar-tooltip.tsx)
- [submission-detail-content.tsx](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/submission-detail-content.tsx)
- [chair-reviews-tab.tsx](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/chair/conference-detail/submission-detail/chair-reviews-tab.tsx)

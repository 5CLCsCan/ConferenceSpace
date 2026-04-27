# Product UI Scale Sheet

This file defines the default sizing system for ConferenceSpace product UI.

Scope:
- All standard product UI surfaces
- Shared baseline for cards, buttons, labels, metadata, pills, tables, and compact interaction chrome

Exclusions:
- `AI-002`
- `AI-003`

If a feature needs to deviate, it should do so deliberately and locally, not by mutating the baseline.

## Reuse Rule

Sizing consistency should come from shared primitives first.

Rules:
- If a shared component already defines the size contract, use that component instead of re-declaring the size locally
- If a repeated local pattern starts appearing in multiple places, extract the shared size contract into the owning component
- Do not create near-identical size variants unless the interaction model is actually different

## Typography

### Primary text scale

- Page title: `text-[32px]`
- Section title: `text-sm font-bold tracking-tight`
- Body content: `text-xs leading-relaxed`
- Supporting body: `text-xs leading-relaxed`
- Metadata: `text-[10px]`
- Compact labels: `text-[9px]` to `text-[10px]`
- Tiny helper icon label: `text-[7px]` only for very small affordances such as `?` tooltip triggers

### Typography rules

- Default operational body copy should stay at `text-xs`
- Metadata should stay at `text-[10px]`
- Uppercase labels should use wider tracking and never exceed body size
- Avoid introducing `text-base` or larger inside dense workflow cards unless it is the main title

## Spacing

### Page shell

- Main horizontal shell: `px-8 md:px-12`
- Main vertical shell: `py-6 md:py-8`

### Standard card spacing

- Card padding: `p-4`
- Dense card header/body split: `px-4 py-4` with inner `mt-3`
- Larger legacy detail card: `p-6` only when the surrounding area already uses it
- Section stack gap inside a panel: `space-y-4`
- Subsection stack gap: `space-y-2` or `space-y-3`

### Inline spacing

- Chip/pill gap: `gap-1.5` to `gap-2`
- Compact header action gap: `gap-2`
- Standard two-column card grid gap: `gap-4`

## Radii and Borders

- Primary card radius: `rounded-xl`
- Secondary action button radius: `rounded-md`
- Toggle/pill radius: `rounded-full` or `rounded`
- Input radius: `rounded-lg`
- Standard border: `border border-slate-200`
- Focus ring: `focus:ring-1 focus:ring-[#1B3C53]/20`

Rules:
- `rounded-xl` is the default card language
- Do not mix many radius systems in one surface
- Prefer a single quiet border over heavy layered outlines

## Shadows

- Standard card shadow: `shadow-sm`
- Tooltip/popover emphasis: deeper custom shadow is acceptable

Rules:
- Use shadows softly
- Do not stack border-heavy and shadow-heavy surfaces unless elevation is truly needed

## Buttons

### Primary action

- Height: `h-8` or `h-10` depending on context
- Default compact action: `h-8 px-3` or `px-3.5`
- Text: `text-[10px]` to `text-[11px]`
- Weight: `font-bold` or `font-medium` depending on action severity
- Radius: `rounded-md` for standard actions, `rounded-lg` for large submission actions

### Secondary action

- Height: `h-8`
- Padding: `px-3`
- Text: `text-[10px]`
- Border: `border border-slate-200`
- Background: `bg-white`

### Utility or inline action

- Keep visually lighter than primary/secondary controls
- Use compact icon sizes and minimal padding

### Button rules

- `Generate`, `Regenerate`, `Refresh`, `Retry` should usually be `h-8`
- Submission/commit actions may use `h-10`
- Do not use oversized uppercase controls in dense detail views

## Pills, Badges, and Chips

### Neutral metric pill

- Padding: `px-2 py-0.5` or `px-2.5 py-1`
- Text size: `text-[10px]`
- Weight: `font-medium`
- Fill: `bg-slate-100`
- Text: `text-slate-600`

### Status badge

- Text: `text-[9px] font-bold uppercase tracking-wider`
- Padding: `px-2 py-0.5`
- Keep compact; do not turn routine status into large banner UI

## Icons

### Material Symbols

- Tiny utility icon: `12px`
- Compact action icon: `14px`
- Standard action icon: `16px`
- Section/collapse icon in larger cards: `20px`

Rules:
- Use icons sparingly
- Do not scale icons beyond the surrounding text hierarchy without reason

## Tooltips

Use the shared scholar tooltip component in [scholar-tooltip.tsx](/E:/HCMUS/Graduate-Project/ConferenceSpace/frontend/components/ui/scholar-tooltip.tsx).

Default tooltip wrapper contract:
- Max width: up to `max-w-[30rem]`
- Text: `text-[10px]`
- Padding: `px-3.5 py-2`
- Radius: `rounded-xl`

Tooltip trigger:
- Tiny help trigger: `h-3.5 w-3.5` to `h-5.5 w-5.5` depending on header density
- Keep the trigger visually quiet

Rules:
- Do not restyle tooltip content inline unless there is a real local exception
- Prefer evolving the shared wrapper over creating one-off tooltip variants

This rule generalizes across the app:
- prefer shared components with fixed size contracts over repeated inline sizing
- evolve the shared component when the baseline needs to change

## Collapse Headers

### Compact collapse header

- Use a full-width button
- Header content should remain readable when collapsed
- Keep collapse icon around `14px` to `16px` in dense cards

### Larger legacy collapse card

- Existing `p-6` card headers may continue in older detail shells, but new compact surfaces should prefer `p-4`

## Inputs and Textareas

- Dense textarea: `text-[10px] p-2.5 h-20 rounded-lg`
- Standard input height: `h-10`
- Placeholder text should stay subdued: `placeholder:text-slate-300`

## Tables

### Header cells

- Text: `text-[10px] font-bold uppercase tracking-widest`
- Padding: `py-2.5 px-3`
- Color: `text-slate-400`

### Rows

- Title: `text-[13px] font-bold tracking-tight`
- Secondary details: `text-[10px]` to `text-[11px]`
- Action button in table row: `h-7 px-2.5 text-[9px]`

## Content Containers

### Standard evidence card

- `rounded-xl border border-slate-200 bg-white shadow-sm p-4`

### Soft inner draft/help slab

- `rounded-xl bg-slate-50 px-4 py-3`
- Use only for drafted or inset content, not every section fallback

### Warning or error block

- Keep within the card system
- Compact vertical rhythm
- Do not overgrow into full-screen alert styling

## Density Rules

- Prefer `p-4` over `p-6` for new dense workflow cards
- Prefer `text-xs` over `text-sm` for operational copy inside cards
- Prefer compact chips to paragraph-style metadata lists
- Prefer collapse over permanent vertical sprawl

## Default Decisions For New UI

If you need a default and there is no stronger local precedent, choose:
- Card: `rounded-xl border border-slate-200 bg-white shadow-sm p-4`
- Section title: `text-sm font-bold tracking-tight text-[#1B3C53]`
- Body copy: `text-xs leading-relaxed text-slate-700`
- Metadata: `text-[10px] text-slate-400`
- Secondary button: `h-8 rounded-md border px-3 text-[10px]`
- Pill: `rounded bg-slate-100 px-2 py-0.5 text-[10px]`

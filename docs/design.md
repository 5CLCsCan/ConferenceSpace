# ConferenceSpace Canonical Product UI Design Spec

## Purpose

This document defines the canonical cross-screen product UI spec for ConferenceSpace.

It consolidates the currently intended visual language from three sources:

- `chair conference detail`: source of truth for density, compact controls, card anatomy, tab styling, metadata sizing, and color discipline
- `chair dashboard`: source of truth for page-title scale, intro-copy scale, section spacing, and metric-card posture
- `author submissions`: negative reference that shows where spacing, control sizing, and status styling begin to drift away from the intended system

Use this file as the build contract when reconstructing a screen from a sketch. If a sketch leaves details unspecified, follow this document instead of inventing local variants.

## Design Intent

The product should feel like an academic operations tool:

- serious, but not cold
- dense, but not cramped
- clear, but not loud
- structured, but not heavy
- inspectable, not decorative

This is not marketing UI. The interface exists to help people scan evidence, compare records, manage workflows, and take high-consequence actions with confidence.

Core visual posture:

- quiet white surfaces
- navy used as the main emphasis color
- slate neutrals used for structure and metadata
- compact typography
- minimal ornament

## Reference Priority

If a sketch or implementation decision is ambiguous, resolve it in this order:

1. Use the chair conference detail screen for density, component sizing, header anatomy, card shells, tab treatment, and compact metadata treatment.
2. Use the chair dashboard for the page-title block, section rhythm, and metric-card style.
3. Use this document over any screen that drifts from the above.
4. Treat any louder or larger variant as wrong unless the screen has a specific product reason to deviate.

## Overall Layout Model

### Desktop app shell

- The app uses a fixed left sidebar plus a flexible main content region.
- Sidebar width: `224px` (`w-56`)
- Main area fills the remaining width.
- Minimum page height: full viewport
- Sidebar and main content should read as one product surface, not two visually separate worlds.

### Sidebar shell

- Background: pure white
- Right border: `1px solid slate-200`
- Optional quiet right-edge shadow: very subtle, just enough to separate it from content
- Internal horizontal padding for major groups: `20px`
- Sidebar should never use a stronger accent color than the main content area.

### Main canvas

Two main page types are allowed:

- Dashboard/home surfaces: very light slate canvas (`#F8FAFC`) behind white cards
- Detail/content surfaces: white outer shell with a `slate-50` content field inside the scrolling region

Do not use saturated or tinted page backgrounds for routine product work.

### Content width and gutters

- Standard detail page max width: `1600px`
- Detail page horizontal padding: `32px` (`px-8`)
- Detail page vertical padding: `24px` (`py-6`)
- Dashboard page horizontal padding: `40px` to `48px` (`px-10 md:px-12`)
- Dashboard page vertical padding: `32px` (`py-8`)

### Grid logic

Use the following canonical layouts:

- Dashboard home: title row, metrics row, then stacked sections
- Detail screen: sticky header plus `2/1` content split for reading column and action/metadata rail
- Table screen: page title, compact filter row, full-width table card, pagination footer

For detail pages, the canonical desktop grid is:

- `3-column` grid
- left/main content spans `2 columns`
- right rail spans `1 column`
- gap between columns: `24px` (`gap-6`)

If the content becomes hard to read in the right rail, move it into the main column. Do not compress it just to preserve the rail.

## Typography

### Font family

Use a neutral sans-serif system stack. Do not introduce expressive display type or serif accents into operational screens.

### Type scale

Use this scale consistently:

| Role                           | Size   | Weight         | Line height     | Notes                                                                 |
| ------------------------------ | ------ | -------------- | --------------- | --------------------------------------------------------------------- |
| Page title                     | `32px` | `700`          | `1.1` to `1.15` | Strongest text on the screen                                          |
| Detail-page title              | `20px` | `700`          | `1.2`           | Used inside sticky detail header                                      |
| Secondary page line / subtitle | `14px` | `300` to `500` | relaxed         | Used below page title                                                 |
| Section title                  | `14px` | `700`          | tight           | Use navy                                                              |
| Dense row title                | `13px` | `700`          | `1.25` to `1.3` | Default local focal point inside dense cards, rows, and record lists  |
| Standard card header title     | `14px` | `700`          | `1.25` to `1.3` | Use for standard card headers and local section-style headers         |
| Operational body               | `12px` | `400` to `500` | relaxed         | Default dense body copy                                               |
| Supporting body                | `11px` | `400` to `500` | relaxed         | Use for previews and helper copy; do not let it become default body   |
| Metadata                       | `10px` | `400` to `500` | compact         | Default for timestamps, counts, helper labels, and passive meta       |
| Compact UI meta                | `11px` | `500`          | compact         | Use for tabs, breadcrumbs, pagination summaries, and compact controls |
| Tiny label                     | `9px`  | `700`          | uppercase       | Default for compact pills, status labels, and routine tiny UI labels  |
| Micro kicker                   | `8px`  | `700` to `900` | uppercase       | Reserve for very short metric labels and priority markers only        |
| Table header label             | `10px` | `700`          | uppercase       | Use with wider tracking for table headers and segmented filter labels |

### Font weight system

The reference screens do not use a broad or expressive weight palette.

They rely on a narrow operational weight system:

| Weight | Use                                                                              | Reference posture                                       |
| ------ | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `300`  | top-level dashboard subtitle only                                                | chair dashboard subtitle                                |
| `400`  | default metadata and passive supporting copy                                     | chair detail meta row                                   |
| `500`  | secondary lines, helper copy, compact controls, subdued emphasis                 | detail secondary line, header action, tab labels        |
| `600`  | rare local emphasis only                                                         | current breadcrumb item, occasional dense status labels |
| `700`  | primary headings, section titles, card titles, action titles, key numeric values | dashboard title, detail title, metric values            |
| `900`  | exceptional tiny uppercase metric labels only                                    | chair dashboard metric labels                           |

This means the product should mostly live in `400`, `500`, and `700`.

Use each weight this way:

- `300` light: only for the dashboard subtitle line under the `32px` page title. Do not use it for metadata inside cards or tables.
- `400` regular: default for dense meta rows, passive helper lines, and non-emphasized supporting copy.
- `500` medium: use for secondary identity lines, compact button labels, tab labels, suffix text, and readable supporting metadata that should stay subordinate to titles.
- `600` semibold: use sparingly for current-state emphasis inside dense UI, such as the active breadcrumb endpoint or a small status value that needs one notch more emphasis without becoming a title.
- `700` bold: default for all main structural hierarchy, including page titles, detail titles, section titles, card titles, dense row titles, primary numeric values, and most important action labels.
- `900` black: reserve for very short uppercase metric labels only. Do not use it for paragraph text, card titles, or long labels.

### Typography behavior rules

- Use `tracking-tight` for titles and important record names.
- Use wider tracking only for tiny uppercase metadata and table headers.
- Keep dense operational body copy at `12px` by default.
- Do not use `16px` body text inside dense cards or tables.
- Do not use oversized subheadings inside detail pages.
- Metadata must remain subordinate to actions and titles.
- Default hierarchy should be built with weight before color escalation: `400` for passive text, `500` for secondary emphasis, `700` for structural emphasis.
- Do not mix `500`, `600`, and `700` arbitrarily inside one small component; each step must correspond to a clear hierarchy change.
- Button labels on dense operational screens should usually sit at `500`; move to `700` only when the label is the primary focal point of the control.
- Secondary title lines under a detail-page title should stay at `500`, not bold.
- Primary metric numbers should stay at `700`; the dashboard references do not use black weight for the numeric value itself.
- If a tiny uppercase label feels like it needs `900` to read clearly, verify that it should be a tiny label at all before increasing the weight.
- Primitive size tokens should stay fixed. When a component needs a different size for a specific role, use the matching semantic alias instead of widening the primitive token into a range.
- Treat `13px` and `14px` as different jobs: `13px` for dense row titles, `14px` for standard card headers and local section-style headers.
- Treat `10px` and `11px` metadata differently: `10px` is the default metadata layer; `11px` is reserved for compact UI chrome that must read one notch stronger.
- Treat `8px`, `9px`, and `10px` uppercase labels differently: `9px` is the default tiny-label size, `8px` is for very short metric kickers only, and `10px` is for routine table headers or segmented filters that must remain easily scannable.

### Canonical title blocks

#### Dashboard-style page header

- Page title: `32px`, bold, navy, tight tracking
- Subtitle: `14px`, light, slate-500, max width around `576px`
- Top-right utility text: `10px`, uppercase, slate-400

#### Detail-page sticky header

- Breadcrumb line: `11px`, slate-500
- Main title: `20px`, bold, navy
- Secondary acronym/year line: `14px`, medium, slate-500
- Meta row: `11px`, slate-400 with compact icon separators

## Color System

### Primary palette

Use these values as the base light-theme palette:

| Token                           | Value                  | Use                                                                |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| Primary ink                     | `#1B3C53`              | page titles, section titles, primary actions, active tabs          |
| Primary hover / deeper emphasis | `#234C6A`              | hover state, active emphasis, link hover                           |
| Secondary accent                | `#456882`              | limited supporting emphasis, not a second brand sprayed everywhere |
| Canvas background               | `#F8FAFC`              | app background, dashboard canvas, subtle field background          |
| Main surface                    | `#FFFFFF`              | cards, headers, sidebar, tables, popovers                          |
| Quiet fill                      | `#F8FAFC` to `#F1F5F9` | header rows, inner slabs, inactive segments, passive chips         |
| Border strong                   | `#E2E8F0`              | standard card/input/table borders                                  |
| Border soft                     | `#F1F5F9`              | card dividers, tab separators, header separators                   |
| Body text strong                | `#334155` to `#475569` | main readable text                                                 |
| Metadata text                   | `#94A3B8` to `#64748B` | timestamps, helper copy, labels                                    |
| Neutral black                   | `#141414`              | rare high-contrast text in shell branding or inputs                |

### Semantic colors

Use semantic colors only when the meaning is semantic:

| Meaning                      | Fill                 | Text                   | Border    |
| ---------------------------- | -------------------- | ---------------------- | --------- |
| Success                      | `#DCFCE7` / green-50 | green-700              | green-200 |
| Warning                      | amber-50             | amber-700              | amber-200 |
| Error / destructive          | red-50               | red-700                | red-200   |
| Passive / resolved / neutral | slate-100            | slate-500 to slate-600 | slate-200 |

### Color rules

- Most surfaces should remain white.
- Most structure should come from borders and spacing, not tinted blocks.
- Navy is the only default emphasis color.
- Slate neutrals do the majority of the UI work.
- Avoid purple.
- Avoid multiple unrelated accent colors on the same screen.
- Do not assign unique colors to every card or section.

## Spacing System

### Base grid

Use a `4px` grid. Most spacing should be multiples of `4px`, with the main rhythm built around `8px`, `12px`, `16px`, and `24px`.

### Canonical spacing scale

| Token    | Value  | Use                                           |
| -------- | ------ | --------------------------------------------- |
| micro    | `4px`  | dot separators, tiny internal offsets         |
| tight    | `6px`  | icon-to-label gap in dense controls           |
| compact  | `8px`  | chip spacing, small vertical separation       |
| standard | `12px` | dense internal section spacing                |
| card     | `16px` | default card padding                          |
| section  | `24px` | card-to-card gaps, main grid gaps             |
| major    | `32px` | page shell top rhythm, large grouped sections |

### Page spacing rules

- Detail pages: `32px` horizontal, `24px` vertical
- Dashboard pages: `40px` to `48px` horizontal, `32px` vertical
- Card stacks: `24px` gap
- Subsections inside a card: `8px`, `12px`, or `16px`, depending on density

### Padding rules

- Default card header padding: `16px` horizontal, `12px` vertical
- Default card body padding: `16px`
- Dense footer strip: `16px` horizontal, `12px` vertical
- Dense table cells: `12px` horizontal, `10px` to `14px` vertical

## Radii, Borders, and Shadows

### Radius scale

| Element                                      | Radius                                          |
| -------------------------------------------- | ----------------------------------------------- |
| Standard card                                | `12px` (`rounded-xl`)                           |
| Input / select / segmented control container | `8px` (`rounded-lg`)                            |
| Standard button                              | `6px` (`rounded-md`)                            |
| Pills / badges                               | fully rounded or soft rounded depending on type |

Do not mix multiple unrelated radius systems on one screen.

### Borders

- Standard border: `1px solid #E2E8F0`
- Soft divider: `1px solid #F1F5F9`
- Active tab indicator: `2px` bottom border in primary ink
- Focus ring: `1px` ring with `#1B3C53` at `10%` to `20%` opacity

Borders should be present but quiet. If the border is the first thing the user sees, it is too strong.

### Shadows

- Default card shadow: `shadow-sm`
- Hover lift: slightly stronger shadow only when the element is obviously interactive
- Sidebar may use a very soft lateral shadow
- Avoid large, blurry marketing shadows

## Component Contracts

### 1. Sidebar

#### Structure

- Fixed width `224px`
- White background
- Right border plus very subtle right shadow
- Branding block at top, navigation in middle, user/account switcher at bottom

#### Typography and sizing

- Product name: `16px`, bold
- Role label: `10px`, uppercase
- Navigation labels: `12px`
- Section labels inside sidebar: `10px`, uppercase, slate-400
- Navigation icons: `18px`

#### Navigation item states

- Default: slate-500 text, transparent background
- Hover: slate-900 text, `slate-50` background
- Active: `slate-100` background, stronger text, bold

### 2. Page header block

Use the dashboard title block for top-level screens:

- Title on the left
- Optional utility text or tiny status on the right
- Below the title, one short subtitle sentence only
- Never add banner-like marketing content above or below it

### 3. Sticky detail header

#### Shell

- White background
- Bottom border `slate-200`
- Sticky to top
- Top row padding: `32px` horizontal, `16px` vertical
- Tab row padding: `32px` horizontal

#### Breadcrumb

- `11px` slate-500 text
- Leading icon around `17px` to `18px`
- Chevron around `12px`
- Current item can shift to navy and semibold

#### Title area

- Main title: `20px`, bold, navy
- Secondary acronym/year line: `14px`, medium, slate-500
- Meta line: `11px`, slate-400
- Meta icons: `12px`
- Dot separator: `4px` circular slate-300 dot

#### Header action button

- Height: `32px`
- Horizontal padding: `12px`
- Background: white
- Border: `slate-200`
- Text: `11px`, medium
- Radius: `6px`

### 4. Tab strip

#### Layout

- Horizontal scroll allowed on smaller widths
- Gap between tabs: `24px`
- Each tab padding: `12px` vertical
- Icon/text gap: `6px`

#### Typography

- `11px`
- medium weight
- slightly expanded tracking

#### States

- Inactive: slate-400 text, transparent underline
- Hover: primary ink text
- Active: primary ink text with `2px` bottom border

#### Optional tab badge

- Text size: `9px`
- Background: `slate-100`
- Text: slate-500
- Padding: `6px` horizontal, `2px` vertical
- Shape: full pill

### 5. Standard card

This is the default building block for almost all product surfaces.

#### Shell

- Background: white
- Radius: `12px`
- Border: `1px solid slate-200`
- Shadow: `shadow-sm`
- Overflow hidden only when the card has a header or footer strip

#### Header

- `16px` horizontal, `12px` vertical
- bottom divider in `slate-100`
- title in `14px` bold navy
- leading icon in `16px`, slate-400

#### Body

- `16px` padding
- body copy usually `12px`
- local title or item name can be `13px`

#### Footer or inset strip

- Use a `slate-50` strip only when it means something: ID row, generated output slab, or contextual sub-panel
- Footer strip padding: `16px` horizontal, `12px` vertical

Do not add inset slabs just to make the card feel designed.

### 6. Metric cards

Metric cards use the dashboard style.

#### Shell

- White card
- `12px` radius
- `16px` left/right padding
- `16px` top padding
- `12px` bottom padding
- Border `slate-200`
- Shadow `shadow-sm`

#### Content

- Label: `8px`, uppercase, bold, slate-400
- Value: `24px`, bold, navy
- Optional suffix: `12px`, medium, slate-400
- Optional subtext: `10px`, medium, slate-400

#### Grid

- Standard desktop grid: `4` cards across
- Gap: `12px`

### 7. Action list rows

This is the dense dashboard list pattern.

#### Row shell

- White background
- Left accent border `3px`
- Horizontal padding: `16px`
- Vertical padding: `12px`
- Hover background: `slate-50`

#### Internal layout

- Left conference block: fixed width around `180px`
- Middle content: flexible
- Due/status block: fixed width around `80px`
- Right action slot: fixed width around `100px`

#### Typography

- Conference short label: `12px`, bold, navy
- Conference full name: `10px`, medium, slate-400
- Priority badge: `8px`, uppercase, bold
- Action title: `12px`, bold, navy
- Description: `10px`, medium, slate-500
- Due/status label: `8px`, uppercase
- Due/status value: `12px`, bold

### 8. Filters and controls

#### Search input

Use two density levels:

- Dense table/search row input: `36px` height (`h-9`)
- Standard form input: `40px` height (`h-10`)

Dense search field spec:

- left icon `16px`
- left padding to text: `40px`
- right padding: `16px`
- border `slate-200`
- radius `8px`
- text `12px`
- placeholder `slate-400`
- white background

#### Segmented filter tabs

- Outer shell background: `slate-100`
- Outer padding: `2px`
- Radius: `8px`
- Item height: `28px`
- Item horizontal padding: `12px`
- Item text: `10px`, uppercase, bold
- Active item: white background, subtle shadow, primary ink text
- Inactive item: slate-500 text

#### Select controls

- Dense table filter select height: `36px`
- Text size: `13px`
- Border: `slate-200`
- Radius: `8px`
- Right chevron icon: `16px`
- Do not rely on OS-native styling if visual fidelity matters

### 9. Pills, chips, and badges

#### Neutral chip

- Text: `10px`, medium
- Padding: `8px` to `10px` horizontal, `2px` to `4px` vertical
- Background: `slate-100`
- Text color: slate-600
- Border optional: `slate-200`

#### Status badge

- Text: `9px`, bold, uppercase
- Padding: `8px` horizontal, `2px` vertical
- Border: `1px`
- Shape: compact rounded or rounded-full

#### Priority badge

- Text: `8px`, bold, uppercase
- Padding: `8px` horizontal, `2px` vertical
- Border: `1px`

#### Usage rules

- Neutral states should stay neutral.
- Use semantic colors only when the status genuinely needs semantic emphasis.
- Do not turn every status into a bright chip.

### 10. Table shell

#### Container

- White background
- Radius `12px`
- Border `slate-200`
- Overflow hidden

#### Header row

- Subtle fill: `slate-50` at high opacity
- Bottom border: `slate-100`
- Header cell padding: `12px` horizontal, `10px` vertical
- Header text: `10px`, bold, uppercase, wide tracking, slate-400

#### Desktop row

- Minimum visual height around `72px`
- Horizontal cell padding: `12px`
- Vertical padding: `14px`
- Row hover fill: `slate-50`
- Divider between rows: `slate-100`

#### Row content hierarchy

- Record title: `13px`, bold, navy
- Preview/secondary text: `11px`, slate-500
- Minor metadata: `10px`
- Tiny metadata: `9px`

#### Row actions

- Icon-only overflow button: `28px` square
- Icon size: `18px`
- Hover state: `slate-100` fill, primary ink icon

### 11. Pagination footer

- Padding: `16px` horizontal, `12px` vertical
- Top border: `slate-200`
- Summary text: `11px`, slate-500
- Current count emphasis: bold navy
- Page buttons: `10px`, compact, bordered, quiet until active

Active page button:

- navy background
- white text
- hover to deeper navy

### 12. Empty, loading, and error states

#### Loading

- Text only for simple page loads
- `12px` text
- slate-400 to slate-500
- centered vertically when the entire panel is waiting

#### Empty state

- Icon size around `40px`
- Icon color `slate-300`
- Title `13px`, bold, slate-500
- Helper line `11px`, slate-400
- Generous vertical padding, around `64px`

#### Error state

- Inline block, not full-screen takeover
- Radius: `6px`
- Border: red-200
- Fill: red-50
- Padding: `12px` horizontal, `8px` vertical
- Text: `12px`, red-700

## Iconography

- Use one icon family consistently: Material Symbols Outlined
- Tiny utility icon: `12px`
- Dense metadata icon: `12px`
- Standard small icon: `14px` to `16px`
- Navigation icon: `18px`
- Section icon in a card header: `16px`
- Large empty-state icon: `40px`

Icons should support scanning, not decorate the screen.

## Interaction Rules

- Hover transitions should be short and quiet, around `150ms` to `200ms`
- Prefer color, background, and border transitions over scale animations
- Card hover may slightly deepen the shadow only if the card is clearly clickable
- Inputs use a small navy focus ring and border shift
- Keep motion restrained and professional

## Responsive Behavior

### Tablet and below

- Sidebar may collapse or hide
- Main content becomes full width
- Detail header stacks vertically
- Tab strip remains horizontally scrollable
- Filter rows wrap into multiple lines
- Dense tables collapse into stacked card rows

### Mobile row pattern

When a desktop table collapses:

- preserve the record title first
- move status near the top
- keep overflow actions top-right
- move conference/meta information into compact stacked rows
- use the same type scale, not a larger mobile-only redesign

## Dark Mode Guidance

The primary reference is the light theme. If dark mode is required:

- preserve the same hierarchy, density, and spacing
- swap white surfaces for deep slate surfaces
- keep borders visible enough to separate layers
- keep navy emphasis restrained
- do not introduce new accent colors just because the background is dark

Dark mode is an inversion of the same structure, not a different design language.

## Implementation Alias Map

Use the following alias system when turning this spec into code.

The goal is not to name every raw value in the current UI.

The goal is to define a small semantic vocabulary that other builders can apply consistently across the product.

### Alias design rules

- Prefer semantic aliases over raw-value aliases.
- Use primitive tokens for raw values only.
- Use semantic aliases for real UI meaning such as page title, metadata, card shell, or dense control.
- Do not create aliases for one-off local exceptions unless this spec is updated first.
- If a local style does not fit an alias below, treat that as drift to remove or a spec gap to discuss.

### Primitive color tokens

These are the raw color tokens that back all semantic aliases:

| Primitive alias            | Value     | Use                                             |
| -------------------------- | --------- | ----------------------------------------------- |
| `--color-primary-ink`      | `#1B3C53` | primary titles, active states, primary emphasis |
| `--color-primary-hover`    | `#234C6A` | active hover state and deeper emphasis          |
| `--color-secondary-accent` | `#456882` | restrained secondary emphasis                   |
| `--color-canvas`           | `#F8FAFC` | dashboard canvas and quiet page field           |
| `--color-surface`          | `#FFFFFF` | main cards, headers, tables, sidebar            |
| `--color-fill-quiet`       | `#F1F5F9` | subtle slabs, inactive fills, quiet strips      |
| `--color-border-strong`    | `#E2E8F0` | standard card, input, and table borders         |
| `--color-border-soft`      | `#F1F5F9` | dividers and soft separators                    |
| `--color-text-body`        | `#475569` | default readable body text                      |
| `--color-text-meta`        | `#94A3B8` | metadata, helper copy, timestamps               |
| `--color-text-strong`      | `#141414` | rare high-contrast text                         |
| `--color-success-fill`     | `#DCFCE7` | semantic success background                     |
| `--color-success-text`     | `#15803D` | semantic success text                           |
| `--color-success-border`   | `#BBF7D0` | semantic success border                         |
| `--color-warning-fill`     | `#FEF3C7` | semantic warning background                     |
| `--color-warning-text`     | `#B45309` | semantic warning text                           |
| `--color-warning-border`   | `#FDE68A` | semantic warning border                         |
| `--color-error-fill`       | `#FEE2E2` | semantic destructive background                 |
| `--color-error-text`       | `#B91C1C` | semantic destructive text                       |
| `--color-error-border`     | `#FECACA` | semantic destructive border                     |
| `--color-neutral-fill`     | `#F1F5F9` | passive badge or resolved state fill            |
| `--color-neutral-text`     | `#64748B` | passive badge or resolved state text            |
| `--color-neutral-border`   | `#CBD5E1` | passive badge or resolved state border          |

### Typography primitives

Use raw typography tokens only as the backing layer:

| Primitive alias             | Value  |
| --------------------------- | ------ |
| `--font-size-page-title`    | `32px` |
| `--font-size-detail-title`  | `20px` |
| `--font-size-page-subtitle` | `14px` |
| `--font-size-section-title` | `14px` |
| `--font-size-card-title`    | `13px` |
| `--font-size-card-header`   | `14px` |
| `--font-size-body`          | `12px` |
| `--font-size-supporting`    | `11px` |
| `--font-size-meta`          | `10px` |
| `--font-size-ui-meta`       | `11px` |
| `--font-size-tiny-label`    | `9px`  |
| `--font-size-kicker`        | `8px`  |
| `--font-size-table-header`  | `10px` |
| `--font-weight-light`       | `300`  |
| `--font-weight-regular`     | `400`  |
| `--font-weight-medium`      | `500`  |
| `--font-weight-semibold`    | `600`  |
| `--font-weight-bold`        | `700`  |
| `--font-weight-black`       | `900`  |

### Spacing, radius, and shadow primitives

| Primitive alias    | Value                  | Use                                       |
| ------------------ | ---------------------- | ----------------------------------------- |
| `--space-micro`    | `4px`                  | dot separators, tiny internal offsets     |
| `--space-tight`    | `6px`                  | icon-to-label gap in dense controls       |
| `--space-compact`  | `8px`                  | chip spacing, compact subsection spacing  |
| `--space-standard` | `12px`                 | dense internal section spacing            |
| `--space-card`     | `16px`                 | standard card padding                     |
| `--space-section`  | `24px`                 | grid gaps, card-to-card spacing           |
| `--space-major`    | `32px`                 | page-shell rhythm and major group spacing |
| `--radius-card`    | `12px`                 | standard cards                            |
| `--radius-control` | `8px`                  | inputs and select shells                  |
| `--radius-button`  | `6px`                  | standard buttons                          |
| `--shadow-card`    | `shadow-sm`            | default card shadow                       |
| `--shadow-hover`   | subtle stronger shadow | interactive hover lift only               |

### Semantic text aliases

These are the aliases builders should use most often in code:

| Semantic alias          | Maps to                             | Use                                                  |
| ----------------------- | ----------------------------------- | ---------------------------------------------------- |
| `text-page-title`       | `32px / 700 / tight`                | dashboard top-level title                            |
| `text-detail-title`     | `20px / 700 / tight`                | sticky detail header title                           |
| `text-page-subtitle`    | `14px / 300-500 / relaxed`          | subtitle under a page title                          |
| `text-detail-secondary` | `14px / 500 / tight`                | acronym-year or secondary title line                 |
| `text-section-title`    | `14px / 700 / tight`                | section title in page or card header                 |
| `text-card-title`       | `13px / 700 / tight`                | dense row title or compact card title                |
| `text-card-header`      | `14px / 700 / tight`                | standard card header title                           |
| `text-body`             | `12px / 400-500 / relaxed`          | default dense operational body                       |
| `text-supporting`       | `11px / 400-500 / relaxed`          | helper copy and previews                             |
| `text-meta`             | `10px / 400-500 / compact`          | timestamps, counts, passive labels                   |
| `text-ui-meta`          | `11px / 500 / compact`              | breadcrumbs, tabs, pagination summary, compact UI    |
| `text-tiny-label`       | `9px / 700 / uppercase`             | compact pills, routine status labels, tiny UI labels |
| `text-kicker`           | `8px / 700-900 / uppercase`         | very short metric labels and priority markers        |
| `text-table-header`     | `10px / 700 / uppercase + tracking` | table headers and segmented filter labels            |

### Semantic surface aliases

| Semantic alias             | Maps to                                      | Use                                      |
| -------------------------- | -------------------------------------------- | ---------------------------------------- |
| `surface-canvas`           | canvas background                            | dashboard page background                |
| `surface-page-detail`      | white shell plus slate field                 | detail-page outer shell                  |
| `surface-card`             | white + border + `12px` radius + `shadow-sm` | default card shell                       |
| `surface-card-quiet-strip` | quiet fill + soft divider                    | inset strip or footer strip with meaning |
| `surface-sidebar`          | white + right border                         | app sidebar                              |
| `surface-table`            | white + border + overflow hidden             | table container                          |

### Semantic control aliases

| Semantic alias           | Maps to                                          | Use                                      |
| ------------------------ | ------------------------------------------------ | ---------------------------------------- |
| `control-dense`          | `36px` height                                    | table search and dense filter row inputs |
| `control-standard`       | `40px` height                                    | standard form inputs                     |
| `button-header`          | `32px` height + white + bordered + `11px` medium | sticky detail header action              |
| `button-primary`         | standard button radius + primary ink emphasis    | primary action in normal cards and forms |
| `button-secondary`       | standard button radius + white bordered shell    | secondary action                         |
| `segment-filter`         | `28px` item height + `text-table-header`         | segmented dense filters                  |
| `badge-neutral`          | neutral fill/text/border + `text-tiny-label`     | routine non-semantic badge               |
| `badge-semantic-success` | success semantic token set                       | real success state only                  |
| `badge-semantic-warning` | warning semantic token set                       | real warning state only                  |
| `badge-semantic-error`   | error semantic token set                         | destructive or blocking state only       |

### Semantic component contracts

These aliases describe repeated UI patterns that should be reused instead of rebuilt locally:

| Contract alias          | Use                                                               |
| ----------------------- | ----------------------------------------------------------------- |
| `header-page-dashboard` | top-level page title block with title, subtitle, utility text     |
| `header-page-detail`    | sticky breadcrumb, title, secondary line, meta row, header action |
| `card-standard`         | default card shell with compact header/body/footer rhythm         |
| `card-metric`           | dashboard metric card contract                                    |
| `row-action`            | dashboard action row contract                                     |
| `table-standard`        | table shell, row height, header styling, pagination footer        |
| `filter-row-dense`      | search + selects + segmented controls for dense lists and tables  |
| `empty-state-standard`  | quiet no-data state with ~40px icon and compact text              |

### Migration rules for builders and subagents

- Prefer semantic aliases such as `text-meta` or `surface-card` over raw utilities whenever the pattern matches.
- Drop ad-hoc values that duplicate a documented alias.
- If a local value exists because the screen is currently drifted, do not preserve it by naming it; replace it with the nearest canonical alias.
- If a screen genuinely needs a new alias, update this spec first and then migrate the code.
- Shared surfaces migrate before role-local surfaces so repeated drift is removed once.

## What Must Not Drift

These are the most important consistency rules:

- Keep page titles at `32px` for top-level dashboard-style pages.
- Keep section titles at `14px`, bold, navy.
- Keep dense operational body copy at `12px`.
- Keep metadata at `10px` by default; reserve `11px` for compact UI chrome that needs one notch more emphasis.
- Keep cards white, rounded `12px`, bordered, and quiet.
- Keep control heights compact: `32px`, `36px`, or `40px` depending on role.
- Keep tabs thin and quiet, with color reserved for the active item.
- Keep filters and tables denser than page headers.
- Keep status treatment compact; do not turn routine status into banners.
- Keep most of the interface on white and slate, with navy as the single dominant accent.

## Known Drift To Correct

Use these corrections when rebuilding screens that resemble the drifted author submissions pattern:

- Do not let filter controls grow visually larger than the surrounding table language.
- Do not use too many distinct status colors on the same table.
- Do not let helper text or previews become more prominent than the record title.
- Do not use larger body copy in dense record lists.
- Do not add decorative tinted blocks when a bordered white card already solves the hierarchy.

## Build Checklist

When another builder reconstructs a screen from a sketch, they should be able to answer yes to all of these:

- Does the screen use the fixed sidebar plus quiet main canvas shell?
- Does the top-level page title match the `32px` dashboard header contract?
- If it is a detail page, does the sticky header match the compact breadcrumb-title-meta-tab structure?
- Are all primary surfaces white cards with `12px` radius, `1px` slate border, and subtle shadow?
- Are section headers `14px` bold navy?
- Is body copy mostly `12px`?
- Is metadata mostly `10px`, with `11px` used only for compact UI chrome?
- Are control heights compact and consistent?
- Are tabs, pills, badges, and table headers using the documented compact sizing and semantic text roles?
- Is navy the main emphasis color, with semantic colors only where meaning requires them?
- Does the screen feel dense but breathable rather than large, soft, or decorative?

If any answer is no, the implementation is drifting away from the intended ConferenceSpace screen language.

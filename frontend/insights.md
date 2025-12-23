# UI Transformation Insights: Role Selection Dashboard

The role selection dashboard implements a "Scholar-Compact" aesthetic—a refined, professional layout scaled at approximately 75% compared to hobbyist designs to ensure higher information density and academic precision.

## 1. Visual Language & Tokens (Scholar-Compact)

### Professional Core Palette (Main System)

These colors constitute the primary visual identity for the internal dashboards and scholar tools:

- **Deep Navy (Primary)**: `#1B3C53`
- **Slate Navy (Secondary)**: `#234C6A`
- **Muted Steel (Accent)**: `#456882`
- **Cloud Gray (Surfaces/Accents)**: `#E3E3E3`
- **Pure White (Main Background)**: `#FFFFFF` (Avoid #F8FAFC/Slate-50 as it can appear "bland" or "greyish" in large areas)
- **Onyx Black (Typography)**: `#141414`

### Transitional Role Colors (Selection only)

Used ONLY on the `/role` screen to provide high-contrast distinction between functional paths:

- **Author**: Green gradients (Action/Submission)
- **Reviewer**: Blue gradients (Evaluation/Trust)
- **Chair**: Purple gradients (Governance/Power)

### Typography Rules (Scaled)

- **Welcome Message**: `text-3xl` to `5xl`, font-black (900), tracking-tight.
- **Role Titles**: `text-xl`, font-bold.
- **Meta/Badges**: `text-[9px]`, font-bold, uppercase, tracking-[0.2em].
- **Compact UI Principle**: Favor `text-xs` (12px) for body and `text-[10px]` for meta-data to maintain professional density.

### Component Geometry

- **Cards**: `rounded-2xl` (refined rounding), `shadow-card` with high-blur soft logic.
- **Sidebar**: `w-64` (Compact version), edge-to-edge interaction zones.
- **Interactive Elements**: `rounded-lg` for navigation items, `rounded-full` for primary CTAs.

## 2. Shared Interface Logic

### Finalized Configuration

- **Compact Sidebar**: Replaced generic role lists with "Recent Conferences".
- **Account Selector**: Implemented a full-width bottom trigger with a minimalist, scholar-grade popup for Sign Out and Language switching.
- **Material Symbols**: Integrated with custom variation settings (`"FILL" 0, "wght" 400`).
- **Directional UI**: Used `chevron_right` for navigation and `chevron_left` for exit/sign-out context.

## 3. Typography & Styling Standard (Scholar-Compact)

To ensure consistency across role dashboards, refer to these standardized styling patterns:

### Typography Classes

| Level             | Tailwind Classes                                                | Usage Context                         |
| :---------------- | :-------------------------------------------------------------- | :------------------------------------ |
| **Hero Title**    | `text-3xl md:text-5xl font-black tracking-tight leading-[1.1]`  | Main page welcome/headers             |
| **Section Title** | `text-xl font-bold tracking-tight text-slate-900`               | Card titles, dashboard module headers |
| **Section Label** | `text-[9px] font-bold text-slate-400 uppercase tracking-widest` | Sidebar headers, grouping labels      |
| **Strong Label**  | `text-xs font-black uppercase tracking-wider`                   | Primary buttons, active markers       |
| **Main Body**     | `text-sm font-medium text-slate-600 leading-relaxed`            | Descriptions, list items              |
| **Meta/Small**    | `text-[10px] font-medium text-slate-500`                        | Secondary descriptions, timestamps    |
| **Filter Input**  | `h-10 text-sm py-2 px-3.5`                                      | Search bars, dropdown filters         |

### Common UI Patterns

- **Main Screen Background**: Always use **Pure White (`#FFFFFF`)** for the main dashboard shell and background. Avoid using even light grays like `slate-50` as they degrade the premium feel.
- **Standard Padding**:
  - `px-10 md:px-16 py-8 md:py-12` for main dashboard containers.
  - `p-6` for internal card padding.
- **Card Styling**: `bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-card`.
- **Primary Action**: `rounded-full py-2.5 px-5 text-xs font-bold transition-all duration-200`.
- **Navigation Item**: `rounded-lg px-3 py-2 text-xs font-medium`.

---

## 4. Implementation Log

| Item                     | Status  | Notes                                                                                |
| :----------------------- | :------ | :----------------------------------------------------------------------------------- |
| **Route Migration**      | ✅ Done | `/dashboard` now redirects to `/role`.                                               |
| **Responsive Shell**     | ✅ Done | Sidebar-to-Header transition for mobile.                                             |
| **Role Selection**       | ✅ Done | Implemented Scholar-Compact system at 75% scale.                                     |
| **Account Menu**         | ✅ Done | Professional dropdown with language and logout (minimalist/scholar).                 |
| **Author Dashboard**     | ✅ Done | Expanded layout, standardized padding, dual-tab system, and high-density list items. |
| **Filter Bar Polish**    | ✅ Done | Reduced component sizes (h-10) and font (text-sm) for higher precision.              |
| **Standardized Padding** | ✅ Done | Consistent `px-10 md:px-16` shell applied across all author dashboard routes.        |

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

- **Cards**: `rounded-2xl` (refined rounding), `shadow-card` with high-blur soft logic. **No decorative borders or status strips (minimal edges only).**
- **Sidebar**: `w-64` (Compact version), edge-to-edge interaction zones.
- **Interactive Elements**: `rounded-lg` for navigation items, `rounded-full` for toggleable actions, `rounded-md` for main entry buttons.

## 2. Shared Interface Logic: Scholar-Compact 2.0

### Principles of Scholarly Minimalism

- **Neutralization**: Prefer neutral slate (`bg-slate-100` / `text-slate-700`) for badges and secondary indicators over bright status colors (purple/blue/green).
- **Icon Thinning**: Minimize icon usage. Remove icons from metadata lists (calendar, clock) and only use them for functional clarity (e.g., within buttons). Reduce sizes to `12px - 14px`.
- **Information Density**: Use conference acronyms in badges; reserve full titles for main card headers. Reach `8px` for secondary status markers.
- **Clean Shell**: Remove "Real-time updates active" badges or flashy decorative elements that distract from scholarly content.
- **Professional Core Palette**: Strictly utilize the Deep Navy (#1B3C53) and Slate Navy (#234C6A) system from the Core Palette as the only major color accents.

### Finalized Configuration

- **Compact Sidebar**: Replaced generic role lists with "Recent Conferences".
- **Account Selector**: Implemented a full-width bottom trigger with a minimalist, scholar-grade popup for Sign Out and Language switching.
- **Material Symbols**: Integrated with custom variation settings (`"FILL" 0, "wght" 400`).
- **Directional UI**: Used `chevron_right` for navigation and `chevron_left` for exit/sign-out context.

## 3. Typography & Styling Standard (Scholar-Compact)

To ensure consistency across role dashboards, refer to these standardized styling patterns:

### Typography Classes

| Level              | Tailwind Classes                                               | Usage Context                       |
| :----------------- | :------------------------------------------------------------- | :---------------------------------- |
| **Hero Title**     | `text-3xl md:text-5xl font-black tracking-tight leading-[1.1]` | Main page welcome/headers           |
| **Section Title**  | `text-sm font-bold tracking-tight text-[#1B3C53]`              | Card titles (reduced for density)   |
| **Primary Body**   | `text-xs font-medium text-slate-500 leading-relaxed`           | Descriptions (12px)                 |
| **Strong Label**   | `text-[11px] font-bold uppercase tracking-wider`               | Tabs/Navigation labels, Strong UI   |
| **Compact Status** | `text-[8px] font-black uppercase tracking-widest`              | Small status tags, secondary meta   |
| **Meta/Small**     | `text-[10px] font-medium text-slate-400`                       | Secondary timestamps, detailed meta |
| **Filter Input**   | `h-10 text-sm py-2 px-3.5`                                     | Search bars, dropdown filters       |

### Common UI Patterns

- **Main Screen Background**: Always use **Pure White (`#FFFFFF`)** for the main dashboard shell and background.
- **Standard Padding**:
  - `px-8 md:px-12 py-6 md:py-8` for the main content shell within the sidebar.
  - `px-4 pt-4 pb-3` for internal card padding to maximize density.
- **Card Styling**: `bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm`.
- **Navigation Action**: `rounded-md h-9 px-4 text-[11px] font-bold tracking-wider transition-all duration-200`.
- **Toggle Action**: `rounded-full h-8 px-3 text-[11px] font-medium transition-all duration-200`.
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

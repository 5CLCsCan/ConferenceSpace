# Component Styling

## Segmented Tabs (Pill-Style)

Compact pill-shaped tab selector for switching between 2-4 views.

### Container

- **Background**: `bg-slate-100 dark:bg-slate-800`
- **Padding**: `p-0.5`
- **Gap**: `gap-1`
- **Border radius**: `rounded-lg`

### Tab Buttons

- **Padding**: `px-3 py-1.5`
- **Border radius**: `rounded-md`
- **Font**: `text-[11px] font-bold uppercase tracking-wider`

### States

- **Active**: `bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white`
- **Inactive**: `text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300`

### Optional Count Badge

- **Font**: `text-[9px] font-bold text-slate-400`
- **Spacing**: `ml-1.5`

---

## View Mode Toggle (Icon-Based)

Icon-only variant for list/grid view switching.

### Container

- Same as Segmented Tabs but with `gap-0.5`

### Icon Buttons

- **Size**: `w-7 h-7`
- **Border radius**: `rounded`
- **Icon size**: `text-[14px]`

### States

- **Active**: `bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white`
- **Inactive**: `text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`

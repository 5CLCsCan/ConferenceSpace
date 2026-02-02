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

---

## Icon Size Fixing

When Material Symbols icons grow unexpectedly or need to be locked at a specific size (typically 16px), use inline styles with comprehensive size constraints.

### Problem

Icons may grow due to:
- CSS conflicts with Tailwind classes
- Material Symbols font default sizing
- Flexbox/grid container properties
- Transform animations or transitions

### Solution

Use inline styles to lock icon size at the desired pixel value (typically 16px):

```tsx
<span 
  className="material-symbols-outlined" 
  style={{ 
    fontSize: '16px', 
    width: '16px', 
    height: '16px', 
    maxWidth: '16px', 
    maxHeight: '16px',
    minWidth: '16px',
    minHeight: '16px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transform: 'none', // or 'translateY(-50%)' for vertically centered icons
    boxSizing: 'border-box'
  }}
>
  icon_name
</span>
```

### Key Properties

- **Size constraints**: `fontSize`, `width`, `height`, `maxWidth`, `maxHeight`, `minWidth`, `minHeight` all set to the same value (e.g., `16px`)
- **Line height**: Use `lineHeight: '1'` (not the pixel value) for proper icon centering
- **Display**: Use `display: 'flex'` with `alignItems: 'center'` and `justifyContent: 'center'` for perfect centering
- **Flex shrink**: `flexShrink: 0` prevents flexbox from shrinking the icon
- **Transform**: 
  - Use `transform: 'none'` for normal icons
  - Use `transform: 'translateY(-50%)'` for absolutely positioned icons that need vertical centering (e.g., search icons in input fields)

### Special Cases

**For absolutely positioned icons** (e.g., search icon in input field):
- Keep `top-1/2` class on the element
- Use `transform: 'translateY(-50%)'` in inline style (not `-translate-y-1/2` class)
- Use `display: 'flex'` with `alignItems: 'center'` for proper alignment

**Example - Search Icon in Input:**
```tsx
<span 
  className="material-symbols-outlined absolute left-3 top-1/2 text-slate-400" 
  style={{ 
    fontSize: '16px', 
    width: '16px', 
    height: '16px', 
    maxWidth: '16px', 
    maxHeight: '16px',
    minWidth: '16px',
    minHeight: '16px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transform: 'translateY(-50%)',
    boxSizing: 'border-box'
  }}
>
  search
</span>
```

### When to Use

- Icons that keep growing/resizing unexpectedly
- Icons that need to be exactly 16px (or any specific size)
- Icons in buttons, inputs, or other interactive elements where consistent sizing is critical

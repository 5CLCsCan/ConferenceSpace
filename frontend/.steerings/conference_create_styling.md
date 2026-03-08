# Conference Create Steps Styling

## Typography and Element Specifications

### WizardInput (Input Fields)

- **Font size**: `text-xs` (12px)
- **Font weight**: `font-normal`
- **Height**: `h-10` (40px)
- **Padding**: `py-2 px-3.5`
- **Border radius**: `rounded-lg`
- **Border**: `border border-slate-300 dark:border-slate-600`
- **Background**: `bg-white dark:bg-slate-900`
- **Text color**: `text-[#141414] dark:text-white`
- **Placeholder**: `placeholder:text-slate-400`
- **Focus**: `focus:ring-2 focus:ring-[#1B3C53] focus:border-[#1B3C53]`

### WizardFormCard (Section Headings)

- **Font size**: `text-sm` (14px)
- **Font weight**: `font-bold`
- **Text color**: `text-[#1B3C53] dark:text-white`
- **Line height**: `leading-[1.2]`
- **Letter spacing**: `tracking-tight`

### WizardFormField (Field Labels)

- **Font size**: `text-[10px]` (10px)
- **Font weight**: `font-bold`
- **Text transform**: `uppercase`
- **Letter spacing**: `tracking-widest`
- **Text color**: `text-[#141414] dark:text-white`

### WizardFormField (Field Descriptions/Helper Text)

- **Font size**: `text-[10px]` (10px)
- **Font weight**: `font-light`
- **Text color**: `text-slate-400`

### Input Icons (Material Symbols)

- **Font size**: `14px` (inline style)
- **Size constraints**:
  - `width: 14px`
  - `height: 14px`
  - `max-width: 14px`
  - `max-height: 14px`
  - `min-width: 14px`
  - `min-height: 14px`
- **Line height**: `line-height: 1`
- **Display**: `display: flex` with `align-items: center` and `justify-content: center`
- **Flex shrink**: `flex-shrink: 0`
- **Position**: `absolute left-3 top-1/2` with `transform: translateY(-50%)` for vertically centered icons

## Positioning Notes

- Input fields are positioned within form cards with padding: `px-4 pt-4 pb-3`
- Section headings have bottom border: `border-b border-slate-100 dark:border-slate-700 pb-3`
- Form fields use gap spacing: `gap-4` between sections, `gap-1.5` within field groups
- Grid layouts for multi-column fields: `grid grid-cols-1 md:grid-cols-2 gap-4`

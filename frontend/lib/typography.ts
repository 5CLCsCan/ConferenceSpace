/**
 * Typography and Spacing Constants
 * Based on COI Dashboard styling for consistency across the application
 */

export const typography = {
  // Headings
  h1: "text-3xl font-bold", // Main page titles
  h2: "text-2xl font-bold", // Section titles
  h3: "text-xl font-bold", // Subsection titles
  h4: "text-lg font-semibold", // Card titles, small section headers
  h5: "text-base font-semibold", // Smaller card titles
  h6: "text-sm font-semibold", // Smallest headings

  // Body text
  body: "text-sm", // Default body text
  bodyLarge: "text-base", // Larger body text
  bodySmall: "text-xs", // Smaller body text, captions

  // Special text
  stats: "text-2xl font-bold", // Large numbers (stats, metrics)
  label: "text-sm font-medium", // Form labels, card labels
  caption: "text-xs text-muted-foreground", // Captions, helper text
  muted: "text-muted-foreground", // Muted text color

  // Font weights
  bold: "font-bold",
  semibold: "font-semibold",
  medium: "font-medium",
  normal: "font-normal",

  // Markdown styling for chatbot
  markdown: {
    // Container for all markdown content
    container: "text-xs leading-relaxed",
    // All markdown elements should inherit small font size
    all: "[&_p]:text-xs [&_li]:text-xs [&_strong]:text-xs [&_em]:text-xs [&_code]:text-xs [&_pre]:text-xs [&_h1]:text-xs [&_h2]:text-xs [&_h3]:text-xs [&_h4]:text-xs [&_h5]:text-xs [&_h6]:text-xs [&_ul]:text-xs [&_ol]:text-xs [&_blockquote]:text-xs [&_a]:text-xs [&_span]:text-xs",
    // Specific element styles
    paragraph: "text-xs mb-1 last:mb-0",
    list: "text-xs my-1",
    listItem: "text-xs py-0.5",
    strong: "text-xs font-semibold",
    em: "text-xs italic",
    code: "text-xs font-mono bg-muted px-1 py-0.5 rounded",
    heading: "text-xs font-semibold my-1",
  },
} as const

export const spacing = {
  // Vertical spacing between sections
  section: "space-y-6", // Between major sections
  subsection: "space-y-4", // Between subsections
  item: "space-y-2", // Between items in a list
  tight: "space-y-1", // Tight spacing

  // Gaps
  gap: {
    sm: "gap-2", // Small gap
    md: "gap-4", // Medium gap (default)
    lg: "gap-6", // Large gap
  },

  // Padding
  padding: {
    card: "p-4", // Card padding
    cardLarge: "p-6", // Large card padding
    section: "p-5", // Section padding
    tight: "p-2", // Tight padding
  },

  // Margins
  margin: {
    top: {
      sm: "mt-1",
      md: "mt-2",
      lg: "mt-3",
      xl: "mt-4",
    },
  },
} as const

export const iconSizes = {
  xs: "h-3 w-3", // Extra small icons
  sm: "h-4 w-4", // Small icons (default for cards)
  md: "h-5 w-5", // Medium icons
  lg: "h-6 w-6", // Large icons
} as const

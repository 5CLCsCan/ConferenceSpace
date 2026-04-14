/**
 * Typography and Spacing Constants
 * Mirrors the semantic aliases defined in docs/design.md.
 */

export const typography = {
  pageTitle: "text-page-title",
  detailTitle: "text-detail-title",
  pageSubtitle: "text-page-subtitle",
  detailSecondary: "text-detail-secondary",
  sectionTitle: "text-section-title",
  cardTitle: "text-card-title",
  cardHeader: "text-card-header",
  body: "text-body",
  supporting: "text-supporting",
  meta: "text-meta",
  uiMeta: "text-ui-meta",
  tinyLabel: "text-tiny-label",
  kicker: "text-kicker",
  tableHeader: "text-table-header",
  muted: "text-meta",

  // Backward-compatible aliases that now map to the canonical spec roles.
  h1: "text-page-title",
  h2: "text-section-title",
  h3: "text-card-header",
  h4: "text-card-title",
  h5: "text-body",
  h6: "text-ui-meta",
  bodyLarge: "text-card-header",
  bodySmall: "text-supporting",
  stats: "text-page-title",
  label: "text-ui-meta",
  caption: "text-meta",
  bold: "font-[700]",
  semibold: "font-[600]",
  medium: "font-[500]",
  normal: "font-[400]",

  // Markdown styling for chatbot
  markdown: {
    // Container for all markdown content
    container: "text-supporting leading-relaxed",
    // All markdown elements should inherit small font size
    all: "[&_p]:text-supporting [&_li]:text-supporting [&_strong]:text-supporting [&_em]:text-supporting [&_code]:text-supporting [&_pre]:text-supporting [&_h1]:text-card-header [&_h2]:text-card-title [&_h3]:text-card-title [&_h4]:text-body [&_h5]:text-body [&_h6]:text-supporting [&_ul]:text-supporting [&_ol]:text-supporting [&_blockquote]:text-supporting [&_a]:text-supporting [&_span]:text-supporting",
    // Specific element styles
    paragraph: "text-supporting mb-1 last:mb-0",
    list: "text-supporting my-1",
    listItem: "text-supporting py-0.5",
    strong: "text-supporting font-[600]",
    em: "text-supporting italic",
    code: "text-supporting font-mono bg-muted px-1 py-0.5 rounded",
    heading: "text-card-title my-1",
  },
} as const

export const spacing = {
  // Vertical spacing between sections
  section: "space-y-[var(--space-section)]",
  subsection: "space-y-[var(--space-card)]",
  item: "space-y-2", // Between items in a list
  tight: "space-y-1", // Tight spacing

  // Gaps
  gap: {
    sm: "gap-[var(--space-compact)]",
    md: "gap-[var(--space-standard)]",
    lg: "gap-[var(--space-section)]",
  },

  // Padding
  padding: {
    card: "p-[var(--space-card)]",
    cardLarge: "p-[var(--space-section)]",
    section: "p-[var(--space-card)]",
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
  sm: "h-4 w-4", // Small icons (default for dense controls)
  md: "h-[18px] w-[18px]", // Navigation or stronger action icons
  lg: "h-6 w-6", // Large icons
} as const

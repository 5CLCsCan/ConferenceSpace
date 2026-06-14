import type { MessageVisibility, ParticipantRole, ThreadCategory } from "./types"

// =============================================================================
// Visibility Configuration
// =============================================================================

export const VISIBILITY_CONFIG: Record<
  MessageVisibility,
  {
    label: string
    shortLabel: string
    icon: string
    color: string
    bgColor: string
    borderColor: string
    description: string
    labelKey: string
    shortLabelKey: string
    descriptionKey: string
  }
> = {
  committee: {
    label: "Committee Only",
    shortLabel: "Committee",
    labelKey: "runtime.components.shared.discussion.config.visibility.committee.label",
    shortLabelKey: "runtime.components.shared.discussion.config.visibility.committee.short_label",
    icon: "shield",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "Visible to Area Chair, Senior PC, and Program Chairs only",
    descriptionKey: "runtime.components.shared.discussion.config.visibility.committee.description",
  },
  reviewers: {
    label: "Reviewers Only",
    shortLabel: "Reviewers",
    labelKey: "runtime.components.shared.discussion.config.visibility.reviewers.label",
    shortLabelKey: "runtime.components.shared.discussion.config.visibility.reviewers.short_label",
    icon: "group",
    color: "text-[#1B3C53]",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    description: "Visible to all assigned reviewers and committee members",
    descriptionKey: "runtime.components.shared.discussion.config.visibility.reviewers.description",
  },
  authors: {
    label: "Visible to Authors",
    shortLabel: "Authors",
    labelKey: "runtime.components.shared.discussion.config.visibility.authors.label",
    shortLabelKey: "runtime.components.shared.discussion.config.visibility.authors.short_label",
    icon: "visibility",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Authors can see this discussion thread",
    descriptionKey: "runtime.components.shared.discussion.config.visibility.authors.description",
  },
  public: {
    label: "Public Discussion",
    shortLabel: "Public",
    labelKey: "runtime.components.shared.discussion.config.visibility.public.label",
    shortLabelKey: "runtime.components.shared.discussion.config.visibility.public.short_label",
    icon: "public",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Visible to all platform users (open review mode)",
    descriptionKey: "runtime.components.shared.discussion.config.visibility.public.description",
  },
}

// =============================================================================
// Category Configuration
// =============================================================================

export const CATEGORY_CONFIG: Record<
  ThreadCategory,
  { label: string; labelKey: string; icon: string; color: string }
> = {
  methodology: {
    label: "Methodology",
    labelKey: "runtime.components.shared.discussion.config.category.methodology",
    icon: "science",
    color: "text-purple-600",
  },
  results: {
    label: "Results",
    labelKey: "runtime.components.shared.discussion.config.category.results",
    icon: "analytics",
    color: "text-blue-600",
  },
  clarity: {
    label: "Clarity",
    labelKey: "runtime.components.shared.discussion.config.category.clarity",
    icon: "edit_note",
    color: "text-amber-600",
  },
  ethics: {
    label: "Ethics",
    labelKey: "runtime.components.shared.discussion.config.category.ethics",
    icon: "policy",
    color: "text-red-600",
  },
  general: {
    label: "General",
    labelKey: "runtime.components.shared.discussion.config.category.general",
    icon: "chat",
    color: "text-slate-500",
  },
  meta_review: {
    label: "Meta-Review",
    labelKey: "runtime.components.shared.discussion.config.category.meta_review",
    icon: "gavel",
    color: "text-[#1B3C53]",
  },
}

// =============================================================================
// Role Styling
// =============================================================================

export const ROLE_STYLES: Record<
  ParticipantRole,
  { bg: string; text: string; label: string; labelKey: string }
> = {
  reviewer: {
    bg: "bg-[#1B3C53]/10",
    text: "text-[#1B3C53]",
    label: "Reviewer",
    labelKey: "runtime.components.shared.discussion.config.role.reviewer",
  },
  area_chair: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "AC",
    labelKey: "runtime.components.shared.discussion.config.role.area_chair",
  },
  senior_pc: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "SPC",
    labelKey: "runtime.components.shared.discussion.config.role.senior_pc",
  },
  author: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "Author",
    labelKey: "runtime.components.shared.discussion.config.role.author",
  },
  system: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    label: "System",
    labelKey: "runtime.components.shared.discussion.config.role.system",
  },
}

// =============================================================================
// Status Configuration
// =============================================================================

export const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  open: { bg: "bg-slate-100", text: "text-slate-600", icon: "radio_button_unchecked" },
  resolved: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "check_circle" },
  flagged: { bg: "bg-red-50", text: "text-red-600", icon: "flag" },
  pinned: { bg: "bg-amber-50", text: "text-amber-600", icon: "push_pin" },
}

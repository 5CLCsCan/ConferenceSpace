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
  }
> = {
  committee: {
    label: "Committee Only",
    shortLabel: "Committee",
    icon: "shield",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "Visible to Area Chair, Senior PC, and Program Chairs only",
  },
  reviewers: {
    label: "Reviewers Only",
    shortLabel: "Reviewers",
    icon: "group",
    color: "text-[#1B3C53]",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    description: "Visible to all assigned reviewers and committee members",
  },
  authors: {
    label: "Visible to Authors",
    shortLabel: "Authors",
    icon: "visibility",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Authors can see this discussion thread",
  },
  public: {
    label: "Public Discussion",
    shortLabel: "Public",
    icon: "public",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Visible to all platform users (open review mode)",
  },
}

// =============================================================================
// Category Configuration
// =============================================================================

export const CATEGORY_CONFIG: Record<
  ThreadCategory,
  { label: string; icon: string; color: string }
> = {
  methodology: { label: "Methodology", icon: "science", color: "text-purple-600" },
  results: { label: "Results", icon: "analytics", color: "text-blue-600" },
  clarity: { label: "Clarity", icon: "edit_note", color: "text-amber-600" },
  ethics: { label: "Ethics", icon: "policy", color: "text-red-600" },
  general: { label: "General", icon: "chat", color: "text-slate-500" },
  meta_review: { label: "Meta-Review", icon: "gavel", color: "text-[#1B3C53]" },
}

// =============================================================================
// Role Styling
// =============================================================================

export const ROLE_STYLES: Record<ParticipantRole, { bg: string; text: string; label: string }> = {
  reviewer: { bg: "bg-[#1B3C53]/10", text: "text-[#1B3C53]", label: "Reviewer" },
  area_chair: { bg: "bg-purple-100", text: "text-purple-700", label: "AC" },
  senior_pc: { bg: "bg-amber-100", text: "text-amber-700", label: "SPC" },
  author: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Author" },
  system: { bg: "bg-slate-100", text: "text-slate-500", label: "System" },
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

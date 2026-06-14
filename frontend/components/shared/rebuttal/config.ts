import type { PointCategory, RebuttalPhase, ResponseStatus } from "./types"

// =============================================================================
// Category Configuration
// =============================================================================

export const CATEGORY_CONFIG: Record<
  PointCategory,
  { label: string; labelKey: string; icon: string; color: string }
> = {
  weakness: {
    label: "Weakness",
    labelKey: "runtime.components.shared.rebuttal.config.category.weakness",
    icon: "warning",
    color: "text-amber-600",
  },
  question: {
    label: "Question",
    labelKey: "runtime.components.shared.rebuttal.config.category.question",
    icon: "help",
    color: "text-blue-600",
  },
  clarification: {
    label: "Clarification",
    labelKey: "runtime.components.shared.rebuttal.config.category.clarification",
    icon: "edit_note",
    color: "text-slate-600",
  },
  suggestion: {
    label: "Suggestion",
    labelKey: "runtime.components.shared.rebuttal.config.category.suggestion",
    icon: "lightbulb",
    color: "text-purple-600",
  },
}

// =============================================================================
// Response Status Configuration
// =============================================================================

export const STATUS_CONFIG: Record<
  ResponseStatus,
  {
    label: string
    labelKey: string
    icon: string
    bgColor: string
    textColor: string
    borderColor: string
  }
> = {
  addressed: {
    label: "Addressed",
    labelKey: "runtime.components.shared.rebuttal.config.status.addressed",
    icon: "check_circle",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  partially_addressed: {
    label: "Partially Addressed",
    labelKey: "runtime.components.shared.rebuttal.config.status.partially_addressed",
    icon: "timelapse",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  not_addressed: {
    label: "Not Addressed",
    labelKey: "runtime.components.shared.rebuttal.config.status.not_addressed",
    icon: "cancel",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    borderColor: "border-red-200",
  },
  pending_review: {
    label: "Needs Your Review",
    labelKey: "runtime.components.shared.rebuttal.config.status.pending_review",
    icon: "schedule",
    bgColor: "bg-[#1B3C53]/5",
    textColor: "text-[#1B3C53]",
    borderColor: "border-[#1B3C53]/20",
  },
}

// =============================================================================
// Phase Configuration
// =============================================================================

export const PHASE_CONFIG: Record<
  RebuttalPhase,
  {
    label: string
    labelKey: string
    description: string
    descriptionKey: string
    icon: string
    color: string
  }
> = {
  awaiting: {
    label: "Awaiting Rebuttal",
    labelKey: "runtime.components.shared.rebuttal.config.phase.awaiting.label",
    description: "Authors have not yet submitted their response",
    descriptionKey: "runtime.components.shared.rebuttal.config.phase.awaiting.description",
    icon: "hourglass_empty",
    color: "text-slate-500",
  },
  submitted: {
    label: "Rebuttal Submitted",
    labelKey: "runtime.components.shared.rebuttal.config.phase.submitted.label",
    description: "Authors have responded - please review and update your assessment",
    descriptionKey: "runtime.components.shared.rebuttal.config.phase.submitted.description",
    icon: "mark_email_unread",
    color: "text-[#1B3C53]",
  },
  discussion: {
    label: "Discussion Phase",
    labelKey: "runtime.components.shared.rebuttal.config.phase.discussion.label",
    description: "Reviewers are discussing the rebuttal with ACs",
    descriptionKey: "runtime.components.shared.rebuttal.config.phase.discussion.description",
    icon: "forum",
    color: "text-purple-600",
  },
  finalized: {
    label: "Finalized",
    labelKey: "runtime.components.shared.rebuttal.config.phase.finalized.label",
    description: "Rebuttal period has ended",
    descriptionKey: "runtime.components.shared.rebuttal.config.phase.finalized.description",
    icon: "lock",
    color: "text-slate-400",
  },
}

// =============================================================================
// Role-specific Phase Descriptions
// =============================================================================

export const PHASE_DESCRIPTIONS_BY_ROLE: Record<
  RebuttalPhase,
  { reviewer: string; author: string; chair: string }
> = {
  awaiting: {
    reviewer: "Authors have not yet submitted their response",
    author: "Please submit your response to reviewer comments",
    chair: "Waiting for author rebuttal submission",
  },
  submitted: {
    reviewer: "Authors have responded - please review and update your assessment",
    author: "Your rebuttal has been submitted - await reviewer feedback",
    chair: "Author rebuttal submitted - monitor reviewer responses",
  },
  discussion: {
    reviewer: "Discuss the rebuttal with fellow reviewers and ACs",
    author: "Reviewers are discussing your response",
    chair: "Facilitate discussion between reviewers",
  },
  finalized: {
    reviewer: "Rebuttal period has ended",
    author: "Rebuttal period has ended",
    chair: "Rebuttal period complete - proceed to decision",
  },
}

// =============================================================================
// Attachment Type Configuration
// =============================================================================

export const ATTACHMENT_TYPE_CONFIG: Record<
  string,
  { icon: string; bgColor: string; textColor: string }
> = {
  revised_manuscript: {
    icon: "picture_as_pdf",
    bgColor: "bg-red-100",
    textColor: "text-red-600",
  },
  supplementary: {
    icon: "attach_file",
    bgColor: "bg-blue-100",
    textColor: "text-blue-600",
  },
  response_letter: {
    icon: "description",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-600",
  },
}

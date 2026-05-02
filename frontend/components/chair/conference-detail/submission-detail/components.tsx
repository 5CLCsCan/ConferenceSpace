"use client"
/* eslint-disable @next/next/no-img-element */

import { cn } from "@/lib/utils"
import type {
  SubmissionDetailStatus,
  ReviewerDecision,
  ConfidenceLevel,
  ReviewerAssignmentStatus,
} from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

// --- Status Badge ---
const statusConfig: Record<SubmissionDetailStatus, { label: string; className: string }> = {
  under_review: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_under_review",
    ),
    className: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  accepted: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_accepted",
    ),
    className: "bg-green-50 text-green-700 border-green-100",
  },
  pending_decision: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_pending_decision",
    ),
    className: "bg-purple-50 text-purple-700 border-purple-100",
  },
  rejected: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_rejected",
    ),
    className: "bg-red-50 text-red-700 border-red-100",
  },
  withdrawn: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_withdrawn",
    ),
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  revision_requested: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_revision_requested",
    ),
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
}

export function SubmissionStatusBadge({ status }: { status: SubmissionDetailStatus }) {
  const { t } = useTranslation()
  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
        config.className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {config.label}
    </span>
  )
}

// --- Reviewer Decision Label ---
const decisionConfig: Record<ReviewerDecision, { label: string; className: string }> = {
  accept: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_accept",
    ),
    className: "text-green-600",
  },
  weak_accept: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_weak_accept",
    ),
    className: "text-yellow-600",
  },
  borderline: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_borderline",
    ),
    className: "text-slate-600",
  },
  weak_reject: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_weak_reject",
    ),
    className: "text-orange-600",
  },
  reject: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_reject",
    ),
    className: "text-red-600",
  },
}

export function ReviewerDecisionLabel({
  decision,
  score,
}: {
  decision: ReviewerDecision
  score: number
}) {
  const config = decisionConfig[decision] || {
    label: decision,
    className: "text-slate-600",
  }
  return (
    <span className={cn("text-sm font-bold", config.className)}>
      {config.label} ({score})
    </span>
  )
}

// --- Confidence Label ---
const confidenceLabels: Record<ConfidenceLevel, string> = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
}

export function ConfidenceLabel({ level }: { level: ConfidenceLevel }) {
  return <span className="text-xs text-slate-400">{confidenceLabels[level]}</span>
}

// --- Reviewer Assignment Status Badge ---
const assignmentStatusConfig: Record<
  ReviewerAssignmentStatus,
  { label: string; className: string }
> = {
  completed: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_completed",
    ),
    className: "bg-green-50 text-green-700 border-green-100",
  },
  accepted: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_accepted",
    ),
    className: "bg-green-50 text-green-700 border-green-100",
  },
  pending: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_pending",
    ),
    className: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  in_progress: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_in_progress",
    ),
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },
  declined: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.components.prop_label_declined",
    ),
    className: "bg-red-50 text-red-700 border-red-100",
  },
}

export function AssignmentStatusBadge({ status }: { status: ReviewerAssignmentStatus }) {
  const config = assignmentStatusConfig[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return <span className={cn("text-xs px-2 py-0.5 rounded border", config.className)}>{config.label}</span>
}

// --- File Type Icon ---
export function FileTypeIcon({ type }: { type: "pdf" | "zip" | "doc" | "other" }) {
  const config: Record<string, { icon: string; bgClass: string; textClass: string }> = {
    pdf: { icon: "picture_as_pdf", bgClass: "bg-red-50", textClass: "text-red-600" },
    zip: { icon: "folder_zip", bgClass: "bg-blue-50", textClass: "text-blue-600" },
    doc: { icon: "description", bgClass: "bg-indigo-50", textClass: "text-indigo-600" },
    other: { icon: "insert_drive_file", bgClass: "bg-slate-100", textClass: "text-slate-600" },
  }
  const { icon, bgClass, textClass } = config[type] || config.other
  return (
    <div
      className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgClass, textClass)}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  )
}

// --- Author Avatar ---
export function AuthorAvatar({
  name,
  avatar,
  size = "sm",
}: {
  name: string
  avatar?: string
  size?: "sm" | "md"
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"

  // Generate a consistent color based on name
  const colors = [
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-slate-100 text-slate-500",
    "bg-indigo-100 text-indigo-700",
    "bg-pink-100 text-pink-700",
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  if (avatar) {
    return (
      <div className={cn("rounded-full overflow-hidden flex-shrink-0", sizeClasses)}>
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold flex-shrink-0",
        sizeClasses,
        colors[colorIndex],
      )}
    >
      {initials}
    </div>
  )
}

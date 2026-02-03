"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export type AuthorSubmissionStatus =
  | "submitted"
  | "under-review"
  | "accepted"
  | "rejected"
  | "revision-requested"
  | "bookmarked"

export interface AuthorConference {
  id: string
  name: string
  acronym?: string
  location?: string
  dates?: string
  submissionDeadline?: string
  fullPaperDeadline?: string
  status: AuthorSubmissionStatus
  paperTitle?: string
  trackName?: string
  submissionDate?: string
  reviewProgress?: number // For under-review status
  isBookmarked?: boolean
}

export type AuthorTabType = "my-conferences" | "explore" | "archived"

// -------------------------------------------------------------------------
// Status Configuration
// -------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  AuthorSubmissionStatus,
  { label: string; className: string; icon?: string }
> = {
  submitted: {
    label: "Submitted",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    icon: "send",
  },
  "under-review": {
    label: "Under Review",
    className:
      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    icon: "hourglass_top",
  },
  accepted: {
    label: "Accepted",
    className:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    icon: "check_circle",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    icon: "cancel",
  },
  "revision-requested": {
    label: "Revision Requested",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    icon: "edit_note",
  },
  bookmarked: {
    label: "Bookmarked",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    icon: "bookmark",
  },
}

// -------------------------------------------------------------------------
// Status Badge
// -------------------------------------------------------------------------

interface StatusBadgeProps {
  status: AuthorSubmissionStatus
}

export function AuthorStatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
        config.className,
      )}
    >
      {config.icon && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "10px", width: "10px", height: "10px", lineHeight: "1" }}
        >
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  )
}

// -------------------------------------------------------------------------
// Card Base Component
// -------------------------------------------------------------------------

interface AuthorConferenceCardBaseProps {
  conference: AuthorConference
  children: ReactNode
  footer: ReactNode
  className?: string
  onClick?: () => void
}

export function AuthorConferenceCardBase({
  conference,
  children,
  footer,
  className = "",
  onClick,
}: AuthorConferenceCardBaseProps) {
  const isCompleted = conference.status === "accepted" || conference.status === "rejected"

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group flex flex-col h-full cursor-pointer",
        isCompleted && "opacity-80 hover:opacity-100",
        className,
      )}
    >
      {/* Card Content */}
      <div className="px-4 pt-4 pb-3 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-1.5">
          <AuthorStatusBadge status={conference.status} />
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-slate-300 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
          </button>
        </div>

        {/* Conference Name */}
        <h3
          className={cn(
            "text-sm font-bold leading-[1.2] tracking-tight mb-1 transition-colors",
            isCompleted
              ? "text-slate-700 dark:text-slate-300 group-hover:text-[#1B3C53] dark:group-hover:text-white"
              : "text-[#1B3C53] dark:text-white group-hover:text-[#234C6A] dark:group-hover:text-slate-200",
          )}
        >
          {conference.acronym || conference.name}
        </h3>

        {/* Full name if acronym exists */}
        {conference.acronym && (
          <p
            className={cn(
              "text-[8px] font-black uppercase tracking-widest mb-4",
              isCompleted
                ? "text-slate-400 dark:text-slate-500"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            {conference.name}
          </p>
        )}

        {/* Track */}
        {conference.trackName && (
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            {conference.trackName}
          </p>
        )}

        {/* Location & Dates */}
        <div className="space-y-1.5 mb-4">
          {conference.location && (
            <p
              className={cn(
                "text-[10px] font-medium leading-snug",
                isCompleted
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              {conference.location}
            </p>
          )}
          {conference.dates && (
            <p
              className={cn(
                "text-[10px] font-medium",
                isCompleted
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              {conference.dates}
            </p>
          )}
        </div>

        {/* Dynamic Content */}
        {children}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl">
        {footer}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Submission Status Sections
// -------------------------------------------------------------------------

interface ReviewProgressSectionProps {
  progress: number
  paperTitle?: string
}

export function ReviewProgressSection({ progress, paperTitle }: ReviewProgressSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="space-y-2">
        {paperTitle && (
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
            "{paperTitle}"
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-yellow-500 dark:bg-yellow-400 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
            {progress}%
          </span>
        </div>
        <p className="text-[9px] text-slate-400">Review in progress</p>
      </div>
    </div>
  )
}

interface DeadlineSectionProps {
  deadline: string
  label: string
  isUrgent?: boolean
}

export function DeadlineSection({ deadline, label, isUrgent }: DeadlineSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="flex items-center gap-2">
        <span
          className={cn("material-symbols-outlined", isUrgent ? "text-orange-500" : "text-slate-400")}
          style={{ fontSize: "14px", width: "14px", height: "14px", lineHeight: "1" }}
        >
          schedule
        </span>
        <div>
          <p
            className={cn(
              "text-[9px] font-medium",
              isUrgent ? "text-orange-600 dark:text-orange-400" : "text-slate-400",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-[10px] font-bold",
              isUrgent
                ? "text-orange-700 dark:text-orange-300"
                : "text-slate-600 dark:text-slate-300",
            )}
          >
            {deadline}
          </p>
        </div>
      </div>
    </div>
  )
}

interface AcceptedSectionProps {
  paperTitle?: string
}

export function AcceptedSection({ paperTitle }: AcceptedSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "16px", width: "16px", height: "16px", lineHeight: "1" }}
        >
          celebration
        </span>
        <div>
          <p className="text-[10px] font-bold">Paper Accepted</p>
          {paperTitle && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500 line-clamp-1">
              "{paperTitle}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface RejectedSectionProps {
  paperTitle?: string
}

export function RejectedSection({ paperTitle }: RejectedSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "16px", width: "16px", height: "16px", lineHeight: "1" }}
        >
          info
        </span>
        <div>
          <p className="text-[10px] font-medium">Decision: Not Accepted</p>
          {paperTitle && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500 line-clamp-1">
              "{paperTitle}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface SubmittedSectionProps {
  paperTitle?: string
  submissionDate?: string
}

export function SubmittedSection({ paperTitle, submissionDate }: SubmittedSectionProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="space-y-2">
        {paperTitle && (
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
            "{paperTitle}"
          </p>
        )}
        {submissionDate && (
          <p className="text-[9px] text-slate-400">Submitted on {submissionDate}</p>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Action Button
// -------------------------------------------------------------------------

interface ActionButtonProps {
  onClick?: () => void
  children: ReactNode
  variant?: "primary" | "secondary"
  className?: string
}

export function ActionButton({
  onClick,
  children,
  variant = "secondary",
  className = "",
}: ActionButtonProps) {
  const baseClasses =
    "flex-1 h-8 px-3 text-[11px] font-medium rounded-full transition-all duration-200"
  const variants = {
    primary:
      "bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] hover:bg-[#234C6A] dark:hover:bg-slate-100",
    secondary:
      "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-[#1B3C53] dark:hover:text-white hover:border-slate-300",
  }

  return (
    <button onClick={onClick} className={cn(baseClasses, variants[variant], className)}>
      {children}
    </button>
  )
}

// -------------------------------------------------------------------------
// Card Variants
// -------------------------------------------------------------------------

interface AuthorConferenceCardProps {
  conference: AuthorConference
  onNavigate: (id: string) => void
}

export function SubmittedCard({ conference, onNavigate }: AuthorConferenceCardProps) {
  return (
    <AuthorConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <div className="flex gap-2">
          <ActionButton variant="secondary">Track Status</ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            View Submission
          </ActionButton>
        </div>
      }
    >
      <SubmittedSection
        paperTitle={conference.paperTitle}
        submissionDate={conference.submissionDate}
      />
    </AuthorConferenceCardBase>
  )
}

export function UnderReviewCard({ conference, onNavigate }: AuthorConferenceCardProps) {
  return (
    <AuthorConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <div className="flex gap-2">
          <ActionButton variant="secondary">View Reviews</ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            Track Progress
          </ActionButton>
        </div>
      }
    >
      <ReviewProgressSection
        progress={conference.reviewProgress || 50}
        paperTitle={conference.paperTitle}
      />
    </AuthorConferenceCardBase>
  )
}

export function AcceptedCard({ conference, onNavigate }: AuthorConferenceCardProps) {
  return (
    <AuthorConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <div className="flex gap-2">
          <ActionButton variant="secondary">View Details</ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            Camera Ready
          </ActionButton>
        </div>
      }
    >
      <AcceptedSection paperTitle={conference.paperTitle} />
    </AuthorConferenceCardBase>
  )
}

export function RejectedCard({ conference, onNavigate }: AuthorConferenceCardProps) {
  return (
    <AuthorConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <ActionButton
          variant="secondary"
          onClick={() => onNavigate(conference.id)}
          className="w-full"
        >
          View Feedback
        </ActionButton>
      }
    >
      <RejectedSection paperTitle={conference.paperTitle} />
    </AuthorConferenceCardBase>
  )
}

export function RevisionRequestedCard({ conference, onNavigate }: AuthorConferenceCardProps) {
  return (
    <AuthorConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <div className="flex gap-2">
          <ActionButton variant="secondary">View Reviews</ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            Submit Revision
          </ActionButton>
        </div>
      }
    >
      {conference.fullPaperDeadline && (
        <DeadlineSection
          deadline={conference.fullPaperDeadline}
          label="Revision Due"
          isUrgent={true}
        />
      )}
    </AuthorConferenceCardBase>
  )
}

export function BookmarkedCard({ conference, onNavigate }: AuthorConferenceCardProps) {
  return (
    <AuthorConferenceCardBase
      conference={conference}
      onClick={() => onNavigate(conference.id)}
      footer={
        <div className="flex gap-2">
          <ActionButton variant="secondary">View CFP</ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            Submit Paper
          </ActionButton>
        </div>
      }
    >
      {conference.submissionDeadline && (
        <DeadlineSection deadline={conference.submissionDeadline} label="Submission Deadline" />
      )}
    </AuthorConferenceCardBase>
  )
}

// -------------------------------------------------------------------------
// Card Router
// -------------------------------------------------------------------------

export function AuthorConferenceCard({ conference, onNavigate }: AuthorConferenceCardProps) {
  switch (conference.status) {
    case "submitted":
      return <SubmittedCard conference={conference} onNavigate={onNavigate} />
    case "under-review":
      return <UnderReviewCard conference={conference} onNavigate={onNavigate} />
    case "accepted":
      return <AcceptedCard conference={conference} onNavigate={onNavigate} />
    case "rejected":
      return <RejectedCard conference={conference} onNavigate={onNavigate} />
    case "revision-requested":
      return <RevisionRequestedCard conference={conference} onNavigate={onNavigate} />
    case "bookmarked":
      return <BookmarkedCard conference={conference} onNavigate={onNavigate} />
    default:
      return null
  }
}

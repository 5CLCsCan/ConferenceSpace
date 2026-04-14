"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

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
    label: t("runtime.components.author.author-conference-cards.prop_label_submitted"),
    className: "badge-neutral text-tiny-label",
    icon: "send",
  },
  "under-review": {
    label: t("runtime.components.author.author-conference-cards.prop_label_under_review"),
    className: "badge-semantic-warning text-tiny-label",
    icon: "hourglass_top",
  },
  accepted: {
    label: t("runtime.components.author.author-conference-cards.prop_label_accepted"),
    className: "badge-semantic-success text-tiny-label",
    icon: "check_circle",
  },
  rejected: {
    label: t("runtime.components.author.author-conference-cards.prop_label_rejected"),
    className: "badge-semantic-error text-tiny-label",
    icon: "cancel",
  },
  "revision-requested": {
    label: t("runtime.components.author.author-conference-cards.prop_label_revision_requested"),
    className: "badge-semantic-warning text-tiny-label",
    icon: "edit_note",
  },
  bookmarked: {
    label: t("runtime.components.author.author-conference-cards.prop_label_bookmarked"),
    className: "badge-neutral text-tiny-label",
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
  void useTranslation()
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center gap-1", config.className)}>
      {config.icon && (
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "12.5px",
            width: "12.5px",
            height: "12.5px",
            maxWidth: "12.5px",
            maxHeight: "12.5px",
            minWidth: "12.5px",
            minHeight: "12.5px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
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
        "surface-card group flex h-full cursor-pointer flex-col transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-md",
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
            className="button-header inline-flex h-7 w-7 items-center justify-center p-0"
          >
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
          </button>
        </div>

        {/* Conference Name */}
        <h3
          className={cn(
            "text-card-title mb-1 transition-colors",
            isCompleted
              ? "text-[var(--color-neutral-text)] group-hover:text-[var(--color-primary-ink)]"
              : "text-[var(--color-primary-ink)] group-hover:text-[var(--color-primary-hover)]",
          )}
        >
          {conference.acronym || conference.name}
        </h3>

        {/* Full name if acronym exists */}
        {conference.acronym && (
          <p className={cn("text-kicker mb-4", isCompleted && "text-[var(--color-text-meta)]")}>
            {conference.name}
          </p>
        )}

        {/* Track */}
        {conference.trackName && (
          <p className="text-kicker mb-4 text-[var(--color-text-meta)]">{conference.trackName}</p>
        )}

        {/* Location & Dates */}
        <div className="space-y-1.5 mb-4">
          {conference.location && (
            <p
              className={cn(
                "text-meta leading-snug",
                isCompleted && "text-[var(--color-text-meta)]",
              )}
            >
              {conference.location}
            </p>
          )}
          {conference.dates && (
            <p className={cn("text-meta", isCompleted && "text-[var(--color-text-meta)]")}>
              {conference.dates}
            </p>
          )}
        </div>

        {/* Dynamic Content */}
        {children}
      </div>

      {/* Footer Actions */}
      <div className="surface-card-quiet-strip rounded-b-[var(--radius-card)] border-t border-[var(--color-border-soft)] px-4 py-3">
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
    <div className="rounded-[var(--radius-button)] border border-[var(--color-border-soft)] bg-[var(--color-fill-quiet)] p-3">
      <div className="space-y-2">
        {paperTitle && (
          <p className="text-ui-meta line-clamp-1">
            {t("runtime.components.author.author-conference-cards.text_text")}
            {paperTitle}
            {t("runtime.components.author.author-conference-cards.text_text")}{" "}
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-yellow-500 dark:bg-yellow-400 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-ui-meta font-[700] text-[var(--color-warning-text)]">
            {progress}%
          </span>
        </div>
        <p className="text-meta">
          {t("runtime.components.author.author-conference-cards.text_review_in_progress")}
        </p>
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
    <div className="rounded-[var(--radius-button)] border border-[var(--color-border-soft)] bg-[var(--color-fill-quiet)] p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "material-symbols-outlined",
            isUrgent ? "text-orange-500" : "text-slate-400",
          )}
          style={{
            fontSize: "17.5px",
            width: "17.5px",
            height: "17.5px",
            maxWidth: "17.5px",
            maxHeight: "17.5px",
            minWidth: "17.5px",
            minHeight: "17.5px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          schedule
        </span>
        <div>
          <p className={cn("text-meta", isUrgent && "text-[var(--color-warning-text)]")}>{label}</p>
          <p
            className={cn(
              "text-ui-meta font-[700]",
              isUrgent ? "text-[var(--color-warning-text)]" : "text-[var(--color-primary-ink)]",
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
    <div className="rounded-[var(--radius-button)] border border-[var(--color-border-soft)] bg-[var(--color-fill-quiet)] p-3">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "16px", width: "16px", height: "16px", lineHeight: "1" }}
        >
          celebration
        </span>
        <div>
          <p className="text-ui-meta font-[700] text-[var(--color-success-text)]">
            {t("runtime.components.author.author-conference-cards.text_paper_accepted")}
          </p>
          {paperTitle && (
            <p className="text-meta line-clamp-1">
              {t("runtime.components.author.author-conference-cards.text_text")}
              {paperTitle}
              {t("runtime.components.author.author-conference-cards.text_text")}{" "}
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
    <div className="rounded-[var(--radius-button)] border border-[var(--color-border-soft)] bg-[var(--color-fill-quiet)] p-3">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "16px", width: "16px", height: "16px", lineHeight: "1" }}
        >
          info
        </span>
        <div>
          <p className="text-ui-meta font-[700] text-[var(--color-neutral-text)]">
            {t("runtime.components.author.author-conference-cards.text_decision_not_accepted")}
          </p>
          {paperTitle && (
            <p className="text-meta line-clamp-1">
              {t("runtime.components.author.author-conference-cards.text_text")}
              {paperTitle}
              {t("runtime.components.author.author-conference-cards.text_text")}{" "}
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
    <div className="rounded-[var(--radius-button)] border border-[var(--color-border-soft)] bg-[var(--color-fill-quiet)] p-3">
      <div className="space-y-2">
        {paperTitle && (
          <p className="text-ui-meta line-clamp-2">
            {t("runtime.components.author.author-conference-cards.text_text")}
            {paperTitle}
            {t("runtime.components.author.author-conference-cards.text_text")}{" "}
          </p>
        )}
        {submissionDate && (
          <p className="text-meta">
            {t("runtime.components.author.author-conference-cards.text_submitted_on")}{" "}
            {submissionDate}
          </p>
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
  const baseClasses = "text-ui-meta flex-1 px-3"
  const variants = {
    primary: "button-primary",
    secondary: "button-secondary",
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
          <ActionButton variant="secondary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_track_status")}
          </ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_view_submission")}{" "}
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
          <ActionButton variant="secondary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_view_reviews")}
          </ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_track_progress")}{" "}
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
          <ActionButton variant="secondary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_view_details")}
          </ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_camera_ready")}{" "}
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
          {t("runtime.components.author.author-conference-cards.text_view_feedback")}{" "}
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
          <ActionButton variant="secondary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_view_reviews")}
          </ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_submit_revision")}{" "}
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
          <ActionButton variant="secondary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_view_cfp")}
          </ActionButton>
          <ActionButton variant="primary" onClick={() => onNavigate(conference.id)}>
            {t("runtime.components.author.author-conference-cards.text_submit_paper")}{" "}
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

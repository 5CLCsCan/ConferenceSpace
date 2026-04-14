import type { ReactNode } from "react"
import type { Conference, ConferenceStatus } from "./types"
import { StatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"

interface ConferenceCardBaseProps {
  conference: Conference
  /** Dynamic content slot for progress/event section */
  children: ReactNode
  /** Footer action buttons */
  footer: ReactNode
  /** Optional className for the card wrapper */
  className?: string
  /** Click handler for the card */
  onClick?: () => void
  /** Optional action menu */
  moreMenu?: ReactNode
}

/**
 * Base conference card component with static conference info.
 * The dynamic event/progress content is passed via children prop.
 */
export function ConferenceCardBase({
  conference,
  children,
  footer,
  className = "",
  onClick,
  moreMenu,
}: ConferenceCardBaseProps) {
  const isCompleted = conference.status === "completed"

  return (
    <div
      onClick={onClick}
      className={cn(
        "surface-card card-standard group flex h-full flex-col transition-shadow duration-200",
        onClick && "cursor-pointer hover:shadow-[var(--shadow-hover)]",
        isCompleted && "opacity-80 hover:opacity-100",
        className,
      )}
    >
      {/* Static Card Content */}
      <div className="flex-1 px-[var(--space-card)] pt-[var(--space-card)] pb-[var(--space-standard)]">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between">
          <StatusBadge status={conference.status} />
          {moreMenu}
        </div>

        {/* Title */}
        <h3
          className={cn("text-card-title mb-1 transition-colors", {
            isCompleted
              ? "text-slate-700 group-hover:text-[var(--color-primary-ink)]"
              : "group-hover:text-[var(--color-primary-hover)]",
          })}
        >
          {conference.name}
        </h3>

        {/* Role & Track */}
        <p className="text-kicker mb-4 text-[var(--color-text-meta)]">
          {conference.role}
          {conference.track && ` • ${conference.track}`}
        </p>

        {/* Meta: Location & Dates - minimal, no icons per Icon Thinning */}
        <div className="mb-4 space-y-1.5">
          {conference.location && (
            <p className="text-meta leading-snug">
              {conference.location}
            </p>
          )}
          {conference.dates && (
            <p className="text-meta">
              {conference.dates}
            </p>
          )}
        </div>

        {/* Dynamic Event/Progress Section */}
        {children}
      </div>

      {/* Footer Actions */}
      <div className="surface-card-quiet-strip rounded-b-[var(--radius-card)] border-t border-[var(--color-border-soft)] px-[var(--space-card)] py-[var(--space-standard)]">
        {footer}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Reusable Action Button Components
// -------------------------------------------------------------------------

interface ActionButtonProps {
  onClick?: (e?: React.MouseEvent) => void
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
  const baseClasses = "button-secondary button-header flex-1 transition-colors duration-200"
  const variants = {
    primary: "button-primary",
    secondary: "button-secondary",
  }

  return (
    <button
      onClick={(e) => {
        onClick?.(e)
      }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

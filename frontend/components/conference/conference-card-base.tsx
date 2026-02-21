import type { ReactNode } from "react"
import type { Conference, ConferenceStatus } from "./types"
import { StatusBadge } from "./status-badge"

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
}: ConferenceCardBaseProps) {
  const isCompleted = conference.status === "completed"

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group flex flex-col h-full ${onClick ? "cursor-pointer" : ""} ${isCompleted ? "opacity-80 hover:opacity-100" : ""} ${className}`}
    >
      {/* Static Card Content */}
      <div className="px-4 pt-4 pb-3 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-1.5">
          <StatusBadge status={conference.status} />
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-slate-300 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
          </button>
        </div>

        {/* Title */}
        <h3
          className={`text-sm font-bold leading-[1.2] tracking-tight mb-1 transition-colors ${
            isCompleted
              ? "text-slate-700 dark:text-slate-300 group-hover:text-[#1B3C53] dark:group-hover:text-white"
              : "text-[#1B3C53] dark:text-white group-hover:text-[#234C6A] dark:group-hover:text-slate-200"
          }`}
        >
          {conference.name}
        </h3>

        {/* Role & Track */}
        <p
          className={`text-[8px] font-black uppercase tracking-widest mb-4 ${
            isCompleted
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {conference.role}
          {conference.track && ` • ${conference.track}`}
        </p>

        {/* Meta: Location & Dates - minimal, no icons per Icon Thinning */}
        <div className="space-y-1.5 mb-4">
          {conference.location && (
            <p
              className={`text-[10px] font-medium leading-snug ${
                isCompleted
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {conference.location}
            </p>
          )}
          {conference.dates && (
            <p
              className={`text-[10px] font-medium ${
                isCompleted
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {conference.dates}
            </p>
          )}
        </div>

        {/* Dynamic Event/Progress Section */}
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
  const baseClasses =
    "flex-1 h-8 px-3 text-[11px] font-medium rounded-full transition-all duration-200"
  const variants = {
    primary:
      "bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] hover:bg-[#234C6A] dark:hover:bg-slate-100",
    secondary:
      "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-[#1B3C53] dark:hover:text-white hover:border-slate-300",
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

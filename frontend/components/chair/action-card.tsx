import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { useTranslation } from "@/lib/i18n/translation-context"
import { cn } from "@/lib/utils"

/**
 * ActionCard - Reusable action item card for dashboard task lists
 * Follows Scholar-Compact aesthetic
 */

// Priority variants using CVA
const priorityVariants = cva("", {
  variants: {
    priority: {
      high: "border-l-amber-500",
      medium: "border-l-[#1B3C53] dark:border-l-slate-400",
      urgent: "border-l-red-500",
      low: "border-l-slate-300",
    },
  },
  defaultVariants: {
    priority: "medium",
  },
})

const priorityBadgeVariants = cva(
  "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
  {
    variants: {
      priority: {
        high: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
        medium:
          "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
        urgent:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        low: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
      },
    },
    defaultVariants: {
      priority: "medium",
    },
  },
)

// Types
export type ActionPriority = "high" | "medium" | "urgent" | "low"

export interface ActionCardProps extends VariantProps<typeof priorityVariants> {
  /** Unique identifier */
  id: string | number
  /** Conference short name (e.g., "CVPR") */
  conference: string
  /** Full conference name (e.g., "Computer Vision and Pattern Recognition") */
  conferenceName?: string
  /** Year of the conference */
  year: string
  /** Action title */
  title: string
  /** Brief description of the action */
  description: string
  /** Due date label (e.g., "2 Days", "5 Days") */
  dueLabel?: string
  /** Due date (e.g., "Oct 24") */
  dueDate?: string
  /** Override status text (e.g., "Overdue") */
  statusLabel?: string
  /** Status date (e.g., "Yesterday") */
  statusDate?: string
  /** Whether this item is overdue */
  isOverdue?: boolean
  /** Button label */
  buttonLabel: string
  /** Click handler for the action button */
  onAction?: () => void
  /** Click handler for the entire card */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

export function ActionCard({
  id,
  conference,
  conferenceName,
  year,
  title,
  description,
  dueLabel,
  dueDate,
  statusLabel,
  statusDate,
  isOverdue = false,
  buttonLabel,
  priority = "medium",
  onAction,
  onClick,
  className,
}: ActionCardProps) {
  const { t } = useTranslation()
  const priorityLabels: Record<ActionPriority, string> = {
    high: t("runtime.components.chair.action-card.text_high_priority"),
    medium: t("runtime.components.chair.action-card.text_medium_priority"),
    urgent: t("runtime.components.chair.action-card.text_urgent_priority"),
    low: t("runtime.components.chair.action-card.text_low_priority"),
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3",
        "border-l-[3px] bg-white dark:bg-slate-800",
        "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
        "group cursor-pointer",
        priorityVariants({ priority }),
        className,
      )}
      onClick={onClick}
    >
      {/* Conference Badge */}
      <div className="shrink-0 w-[180px] pr-3 border-r border-slate-200 dark:border-slate-700">
        <span className="text-[12px] font-bold text-[#1B3C53] dark:text-white tracking-tight block">
          {conference} {year}
        </span>
        {conferenceName && (
          <span className="text-[10px] font-medium text-slate-400 leading-tight block mt-0.5 line-clamp-1">
            {conferenceName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={priorityBadgeVariants({ priority })}>
            {priorityLabels[priority || "medium"]}
          </span>
        </div>
        <h4 className="text-[12px] font-bold text-[#1B3C53] dark:text-white leading-[1.3] tracking-tight line-clamp-1 group-hover:text-[#234C6A] dark:group-hover:text-slate-300 transition-colors py-1">
          {title}
        </h4>
        <p className="text-[10px] font-medium text-slate-500 leading-relaxed line-clamp-1">
          {description}
        </p>
      </div>

      {/* Due/Status - Fixed width for alignment */}
      <div className="text-right shrink-0 w-[80px] -ml-5">
        <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest block">
          {isOverdue
            ? t("runtime.components.chair.action-card.text_status")
            : t("runtime.components.chair.action-card.text_due_in")}
        </span>
        <span
          className={cn(
            "text-xs font-bold block",
            isOverdue ? "text-red-500 dark:text-red-400" : "text-[#1B3C53] dark:text-white",
          )}
        >
          {isOverdue ? statusLabel : dueLabel}
        </span>
        <span className="text-[10px] font-medium text-slate-400 block">
          {isOverdue ? statusDate : dueDate}
        </span>
      </div>

      {/* Action Button - Fixed width for alignment */}
      {onAction && (
        <div className="shrink-0 w-[100px] flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAction()
            }}
            className={cn(
              "h-8 px-3 text-[11px] font-medium rounded-full transition-all",
              isOverdue
                ? "bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] hover:bg-[#234C6A] dark:hover:bg-slate-200"
                : "bg-white dark:bg-slate-700 text-[#1B3C53] dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-[#1B3C53] hover:text-white hover:border-[#1B3C53] dark:hover:bg-slate-600",
            )}
          >
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * ActionCardList - Container for ActionCard items
 */
export interface ActionCardListProps {
  children: React.ReactNode
  className?: string
}

export function ActionCardList({ children, className }: ActionCardListProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700",
        "shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700",
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * MetricCard - Reusable metric/stat card
 */
export interface MetricCardProps {
  /** Label for the metric */
  label: string
  /** Primary value */
  value: string | number
  /** Optional suffix after the value */
  suffix?: string
  /** Optional subtext below the value */
  subtext?: string
  /** Additional CSS classes */
  className?: string
}

export function MetricCard({ label, value, suffix, subtext, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 px-4 pt-4 pb-3 rounded-xl",
        "border border-slate-200 dark:border-slate-700 shadow-sm",
        "hover:shadow-md transition-shadow",
        className,
      )}
    >
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <h3 className="text-2xl font-bold text-[#1B3C53] dark:text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
        {suffix && <span className="text-xs font-medium text-slate-400">{suffix}</span>}
      </div>
      {subtext && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{subtext}</p>}
    </div>
  )
}

/**
 * SectionHeader - Reusable section header with title and optional action
 */
export interface SectionHeaderProps {
  /** Section title */
  title: string
  /** Material symbol icon name */
  icon?: string
  /** Whether to fill the icon */
  iconFilled?: boolean
  /** Action label */
  actionLabel?: string
  /** Action click handler */
  onAction?: () => void
  /** Additional CSS classes */
  className?: string
}

export function SectionHeader({
  title,
  icon,
  iconFilled = true,
  actionLabel,
  onAction,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-1", className)}>
      <h2 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white flex items-center gap-2">
        {icon && (
          <span
            className="material-symbols-outlined text-[#1B3C53] dark:text-white text-[16px]"
            style={{ fontVariationSettings: iconFilled ? '"FILL" 1' : undefined }}
          >
            {icon}
          </span>
        )}
        {title}
      </h2>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#1B3C53] dark:hover:text-white transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

import type { MessageVisibility, ThreadStatus, ThreadCategory } from "../types"
import { VISIBILITY_CONFIG, CATEGORY_CONFIG, STATUS_STYLES } from "../config"

// =============================================================================
// Visibility Indicator
// =============================================================================

interface VisibilityIndicatorProps {
  visibility: MessageVisibility
  compact?: boolean
}

export function VisibilityIndicator({ visibility, compact = false }: VisibilityIndicatorProps) {
  const config = VISIBILITY_CONFIG[visibility]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${config.bgColor} ${config.color} border ${config.borderColor} text-[8px] font-bold uppercase tracking-widest`}
      title={config.description}
    >
      <span className="material-symbols-outlined text-[10px]">{config.icon}</span>
      {compact ? null : config.shortLabel}
    </span>
  )
}

// =============================================================================
// Status Badge
// =============================================================================

interface StatusBadgeProps {
  status: ThreadStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${style.bg} ${style.text} text-[8px] font-bold uppercase tracking-wider`}
    >
      <span className="material-symbols-outlined text-[10px] filled">{style.icon}</span>
    </span>
  )
}

// =============================================================================
// Category Tag
// =============================================================================

interface CategoryTagProps {
  category: ThreadCategory
}

export function CategoryTag({ category }: CategoryTagProps) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general
  return (
    <span
      className={`inline-flex items-center gap-1 ${config.color} text-[9px] font-medium`}
      title={config.label}
    >
      <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
      {config.label}
    </span>
  )
}

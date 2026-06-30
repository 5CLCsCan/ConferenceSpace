import type { MessageVisibility, ThreadStatus, ThreadCategory } from "../types"
import { VISIBILITY_CONFIG, CATEGORY_CONFIG, STATUS_STYLES } from "../config"
import { getCategoryLabel, getVisibilityDescription, getVisibilityShortLabel } from "../i18n"
import { useTranslation } from "@/lib/i18n/translation-context"

// =============================================================================
// Visibility Indicator
// =============================================================================

interface VisibilityIndicatorProps {
  visibility: MessageVisibility
  compact?: boolean
}

export function VisibilityIndicator({ visibility, compact = false }: VisibilityIndicatorProps) {
  const { t } = useTranslation()
  const config = VISIBILITY_CONFIG[visibility]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${config.bgColor} ${config.color} border ${config.borderColor} text-[8px] font-bold uppercase tracking-widest`}
      title={getVisibilityDescription(visibility, t)}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "16px",
          width: "16px",
          height: "16px",
          maxWidth: "16px",
          maxHeight: "16px",
          minWidth: "16px",
          minHeight: "16px",
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
      {compact ? null : getVisibilityShortLabel(visibility, t)}
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
      <span
        className="material-symbols-outlined filled"
        style={{
          fontSize: "16px",
          width: "16px",
          height: "16px",
          maxWidth: "16px",
          maxHeight: "16px",
          minWidth: "16px",
          minHeight: "16px",
          lineHeight: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transform: "none",
          boxSizing: "border-box",
        }}
      >
        {style.icon}
      </span>
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
  const { t } = useTranslation()
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general
  const label = getCategoryLabel(category, t)
  return (
    <span
      className={`inline-flex items-center gap-1 ${config.color} text-[9px] font-medium`}
      title={label}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "16px",
          width: "16px",
          height: "16px",
          maxWidth: "16px",
          maxHeight: "16px",
          minWidth: "16px",
          minHeight: "16px",
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
      {label}
    </span>
  )
}

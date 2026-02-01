import type { ReviewMode } from "../types"

interface ReviewModeIndicatorProps {
  mode: ReviewMode
}

const MODE_CONFIG: Record<ReviewMode, { label: string; icon: string; description: string }> = {
  double_blind: {
    label: "Double-Blind",
    icon: "visibility_off",
    description: "Author and reviewer identities are hidden",
  },
  single_blind: {
    label: "Single-Blind",
    icon: "person_off",
    description: "Author identities are hidden from reviewers",
  },
  open: {
    label: "Open Review",
    icon: "visibility",
    description: "All identities are visible",
  },
}

export function ReviewModeIndicator({ mode }: ReviewModeIndicatorProps) {
  const config = MODE_CONFIG[mode]
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md text-[10px] text-slate-600 font-medium"
      title={config.description}
    >
      <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
      {config.label}
    </div>
  )
}

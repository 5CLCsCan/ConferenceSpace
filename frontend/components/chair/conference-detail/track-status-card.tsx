"use client"

import { cn } from "@/lib/utils"
import type { TrackProgress } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface TrackStatusCardProps {
  tracks?: TrackProgress[]
  onViewReport?: () => void
  className?: string
}

const DEFAULT_TRACKS: TrackProgress[] = [
  { name: "Computer Vision", percentage: 85 },
  { name: "NLP", percentage: 62 },
  { name: "Robotics", percentage: 94 },
  { name: "AI Ethics", percentage: 45 },
]

// Progress bar colors based on percentage
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return "bg-[#1B3C53]"
  if (percentage >= 60) return "bg-[#234C6A]"
  if (percentage >= 40) return "bg-[#456882]"
  return "bg-slate-400"
}

export function TrackStatusCard({
  tracks = DEFAULT_TRACKS,
  onViewReport,
  className,
}: TrackStatusCardProps) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm",
        className,
      )}
    >
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-4 tracking-tight">
        {t("runtime.components.chair.conference-detail.track-status-card.text_track_status")}{" "}</h3>

      <div className="space-y-3.5">
        {tracks.map((track) => (
          <div key={track.name}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-medium text-slate-600 dark:text-slate-300">{track.name}</span>
              <span className="text-slate-400 font-medium">{track.percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  getProgressColor(track.percentage),
                )}
                style={{ width: `${track.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onViewReport}
        className="w-full mt-4 py-2 text-[10px] text-slate-400 hover:text-[#1B3C53] font-medium uppercase tracking-wider border border-dashed border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all"
      >
        {t("runtime.components.chair.conference-detail.track-status-card.text_view_detailed_track_report")}{" "}</button>
    </div>
  )
}

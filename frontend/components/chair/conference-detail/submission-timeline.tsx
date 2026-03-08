"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"

interface TimelineDataPoint {
  week: string
  value: number
  isDeadline?: boolean
  isHighlight?: boolean
}

interface SubmissionTimelineProps {
  data?: TimelineDataPoint[]
  className?: string
}

// Default mock data
const DEFAULT_DATA: TimelineDataPoint[] = [
  { week: "Week 1", value: 20 },
  { week: "Week 2", value: 35 },
  { week: "Week 3", value: 25 },
  { week: "Week 4", value: 40 },
  { week: "Week 5", value: 45 },
  { week: "Week 6", value: 30 },
  { week: "Week 7", value: 55 },
  { week: "Week 8", value: 70 },
  { week: "Week 9", value: 65 },
  { week: "Week 10", value: 85, isHighlight: true },
  { week: "Deadline", value: 95, isDeadline: true },
  { week: "Late", value: 15 },
]

const PERIOD_OPTIONS = ["Last 30 Days", "All Time"] as const
type PeriodOption = (typeof PERIOD_OPTIONS)[number]

export function SubmissionTimeline({ data = DEFAULT_DATA, className }: SubmissionTimelineProps) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<PeriodOption>("Last 30 Days")
  const maxValue = Math.max(...data.map((d) => d.value))

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 px-4 pt-4 pb-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
          {t(
            "runtime.components.chair.conference-detail.submission-timeline.text_submission_timeline",
          )}{" "}
        </h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodOption)}
          className="bg-white border border-slate-200 text-slate-600 text-[11px] font-medium rounded-md py-1 px-2 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] shadow-sm cursor-pointer"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end justify-between gap-1.5 w-full px-1">
        {data.map((point, index) => (
          <div
            key={index}
            className="w-full group relative flex flex-col items-center"
            style={{ height: "100%" }}
          >
            <div
              className={cn(
                "w-full rounded-t-sm transition-colors cursor-pointer",
                point.isDeadline
                  ? "bg-[#1B3C53] dark:bg-[#234C6A] hover:bg-[#234C6A]"
                  : point.isHighlight
                    ? "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200",
              )}
              style={{
                height: `${(point.value / maxValue) * 100}%`,
                marginTop: "auto",
              }}
            />

            {/* Tooltip */}
            {point.isDeadline && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1B3C53] text-white text-[9px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap font-medium">
                {t(
                  "runtime.components.chair.conference-detail.submission-timeline.text_deadline",
                )}{" "}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[9px] text-slate-400 mt-3 px-1">
        <span>
          {t("runtime.components.chair.conference-detail.submission-timeline.text_week_1")}
        </span>
        <span>
          {t("runtime.components.chair.conference-detail.submission-timeline.text_week_4")}
        </span>
        <span>
          {t("runtime.components.chair.conference-detail.submission-timeline.text_week_8")}
        </span>
        <span>
          {t("runtime.components.chair.conference-detail.submission-timeline.text_deadline")}
        </span>
        <span>{t("runtime.components.chair.conference-detail.submission-timeline.text_late")}</span>
      </div>
    </div>
  )
}

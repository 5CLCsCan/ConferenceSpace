"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getConferenceDates, type ImportantDate } from "@/lib/api/conferences"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceDatesProps {
  conferenceId: string
  className?: string
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "TBD"
  return parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

export function ConferenceDates({ conferenceId, className }: ConferenceDatesProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dates, setDates] = useState<ImportantDate[]>([])

  useEffect(() => {
    async function loadDates() {
      setLoading(true)
      setError(null)
      const response = await getConferenceDates(conferenceId)
      if (response.error || !response.data) {
        setError(response.error || "Failed to load dates")
        setLoading(false)
        return
      }

      setDates(response.data)
      setLoading(false)
    }

    void loadDates()
  }, [conferenceId])

  if (loading) {
    return <div className="text-xs text-slate-500">{t("runtime.components.chair.conference-detail.conference-dates.text_loading_timeline")}</div>
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-lg font-bold text-[#1B3C53] tracking-tight">{t("runtime.components.chair.conference-detail.conference-dates.text_conference_timeline")}</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {t("runtime.components.chair.conference-detail.conference-dates.text_api_backed_schedule_from_conference_configuration")}{" "}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#1B3C53] tracking-tight">{t("runtime.components.chair.conference-detail.conference-dates.text_important_dates")}</h3>
        </div>

        {dates.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {dates.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "px-4 py-3 flex items-start justify-between gap-4",
                  item.isPast ? "opacity-70" : "",
                )}
              >
                <div>
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold text-slate-800">{formatDate(item.date)}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-xs text-slate-500">{t("runtime.components.chair.conference-detail.conference-dates.text_no_schedule_dates_configured")}</div>
        )}
      </div>
    </div>
  )
}

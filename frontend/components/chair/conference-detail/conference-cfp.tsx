"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getConferenceById, getConferenceDates, type ImportantDate } from "@/lib/api/conferences"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceCFPProps {
  conferenceId: string
  className?: string
}

function formatDate(value?: string) {
  if (!value) return "TBD"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "TBD"
  return parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

export function ConferenceCFP({ conferenceId, className }: ConferenceCFPProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cfpContent, setCfpContent] = useState<string>("")
  const [conferenceName, setConferenceName] = useState<string>("Conference")
  const [dates, setDates] = useState<ImportantDate[]>([])

  useEffect(() => {
    async function loadCFP() {
      setLoading(true)
      setError(null)
      const [conferenceResponse, datesResponse] = await Promise.all([
        getConferenceById(conferenceId),
        getConferenceDates(conferenceId),
      ])

      if (conferenceResponse.error || !conferenceResponse.data) {
        setError(conferenceResponse.error || "Failed to load CFP")
        setLoading(false)
        return
      }

      setConferenceName(conferenceResponse.data.name)
      setCfpContent(
        conferenceResponse.data.call_for_paper_text ||
          `# Call for Papers\n\n${conferenceResponse.data.name}\n\nNo CFP content has been published yet.`,
      )
      setDates(datesResponse.data || [])
      setLoading(false)
    }

    void loadCFP()
  }, [conferenceId])

  if (loading) {
    return <div className="text-xs text-slate-500">{t("runtime.components.chair.conference-detail.conference-cfp.text_loading_cfp")}</div>
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#1B3C53] tracking-tight">{t("runtime.components.chair.conference-detail.conference-cfp.text_call_for_papers")}</h2>
              <p className="text-[10px] text-slate-500 mt-1">{conferenceName}</p>
            </div>
            <div className="p-4 prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{cfpContent}</ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#1B3C53] tracking-tight mb-3">{t("runtime.components.chair.conference-detail.conference-cfp.text_important_dates")}</h3>
            {dates.length > 0 ? (
              <div className="space-y-2">
                {dates.map((date) => (
                  <div key={date.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {date.title}
                    </p>
                    <p className="text-[12px] font-semibold text-slate-800 mt-0.5">
                      {formatDate(date.date)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">{t("runtime.components.chair.conference-detail.conference-cfp.text_no_dates_available")}</p>
            )}
          </div>

          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t("runtime.components.chair.conference-detail.conference-cfp.text_cfp_publishing_workflows_are_currently_read")}{" "}</div>
        </div>
      </div>
    </div>
  )
}

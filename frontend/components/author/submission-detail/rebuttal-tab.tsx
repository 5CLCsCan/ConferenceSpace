"use client"

import { useEffect, useRef, useState } from "react"
import { RebuttalPanel } from "@/components/shared/rebuttal"
import { getRebuttal, submitRebuttal } from "@/lib/api/rebuttal"
import type { RebuttalPanelData } from "@/lib/api/rebuttal"
import { useTranslation } from "@/lib/i18n/translation-context"

interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
}

export function RebuttalTab({ conferenceId, submissionId }: RebuttalTabProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<RebuttalPanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [generalResponse, setGeneralResponse] = useState("")
  const generalResponseRef = useRef(generalResponse)
  generalResponseRef.current = generalResponse

  async function load() {
    setLoading(true)
    const result = await getRebuttal(conferenceId, submissionId)
    setLoading(false)
    if (result.error || !result.data) {
      setError(result.error ?? "Failed to load rebuttal")
    } else {
      setData(result.data)
      if (result.data.submission?.generalResponse.content) {
        setGeneralResponse(result.data.submission.generalResponse.content)
      }
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, submissionId])

  async function handleSubmit(currentPoints?: any[]) {
    if (!data) return
    setSubmitting(true)
    setError(null)
    
    // Use the points passed from RebuttalPanel if available, otherwise fallback to data.points
    const pointsToUse = currentPoints || data.points
    
    const points = pointsToUse.map((p) => ({
      pointId: p.id,
      assignmentId: Number(p.reviewerId),
      category: p.category,
      section: p.section ?? "",
      originalComment: p.originalComment,
      authorResponse: p.authorResponse ?? "",
    }))
    
    const result = await submitRebuttal(conferenceId, submissionId, {
      generalResponse: generalResponseRef.current,
      perReviewerResponses: [],
      points,
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else {
      await load()
    }
  }

  if (loading) {
    return <div className="text-xs text-slate-500 py-4">{t("runtime.components.author.submission-detail.rebuttal-tab.text_loading_rebuttal")}</div>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const phase = data.settings.phase
  const charLimit = data.settings.charLimitGeneral || 3000
  const charCount = generalResponse.length
  const isOverLimit = charLimit > 0 && charCount > charLimit

  // Acknowledgment progress
  const totalReviewers = data.reviewers.length
  const ackedReviewers = data.reviewers.filter((r) => r.rebuttalStatus === "acknowledged").length

  // Phase: not_started
  if (phase !== "awaiting" && phase !== "submitted" && phase !== "finalized") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("runtime.components.author.submission-detail.rebuttal-tab.text_the_rebuttal_period_has_not_started")}{" "}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Phase banners */}
      {phase === "awaiting" && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {t("runtime.components.author.submission-detail.rebuttal-tab.text_rebuttal_period_is_open")}{" "}</p>
            {data.settings.deadline && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                {data.settings.daysRemaining > 0
                  ? `${data.settings.daysRemaining} day${data.settings.daysRemaining !== 1 ? "s" : ""} remaining`
                  : "Deadline passed"}
              </span>
            )}
          </div>
        </div>
      )}

      {phase === "submitted" && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-green-700 dark:text-green-300">
              {t("runtime.components.author.submission-detail.rebuttal-tab.text_rebuttal_submitted")}{" "}</p>
            {totalReviewers > 0 && (
              <span className="text-[10px] text-green-600 dark:text-green-400">
                {ackedReviewers} of {totalReviewers} reviewer
                {totalReviewers !== 1 ? "s" : ""} acknowledged
              </span>
            )}
          </div>
        </div>
      )}

      {phase === "finalized" && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("runtime.components.author.submission-detail.rebuttal-tab.text_rebuttal_period_is_finalized_no_further")}{" "}</p>
        </div>
      )}

      {/* Editable general response — only when awaiting */}
      {phase === "awaiting" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <label className="text-xs font-bold text-[#1B3C53] dark:text-white block mb-2">
            {t("runtime.components.author.submission-detail.rebuttal-tab.text_general_response")}{" "}</label>
          <textarea
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 min-h-[100px] resize-y focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
            placeholder={t("runtime.components.author.submission-detail.rebuttal-tab.placeholder_write_your_general_response_to_all")}
            value={generalResponse}
            onChange={(e) => setGeneralResponse(e.target.value)}
            disabled={submitting}
          />
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`text-[10px] ${isOverLimit ? "text-red-500 font-medium" : "text-slate-400"}`}
            >
              {charCount} / {charLimit} characters
            </span>
          </div>
          {isOverLimit && (
            <p className="text-[10px] text-red-500 mt-1">
              {t("runtime.components.author.submission-detail.rebuttal-tab.text_response_exceeds_the")}{" "}{charLimit}{t("runtime.components.author.submission-detail.rebuttal-tab.text_character_limit")}{" "}</p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <RebuttalPanel
        settings={data.settings}
        reviewers={data.reviewers}
        points={data.points}
        submission={data.submission}
        userRole="author"
        readOnly={phase !== "awaiting" || submitting}
        onSubmitRebuttal={(rebuttalData) => handleSubmit((rebuttalData as any).points)}
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { RebuttalPanel } from "@/components/shared/rebuttal"
import { getRebuttal, acknowledgePoint, updatePostRebuttalScore } from "@/lib/api/rebuttal"
import { openDiscussion } from "@/lib/api/conference-rebuttal"
import type { RebuttalPanelData } from "@/lib/api/rebuttal"
import type { ResponseStatus } from "@/components/shared/rebuttal/types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
  assignmentId: string
}

export function RebuttalTab({ conferenceId, submissionId, assignmentId }: RebuttalTabProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<RebuttalPanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Post-rebuttal score form
  const [scoreFormOpen, setScoreFormOpen] = useState(false)
  const [score, setScore] = useState(5)
  const [recommendation, setRecommendation] = useState("borderline")
  const [scoreComment, setScoreComment] = useState("")
  const [scoreSaving, setScoreSaving] = useState(false)
  const [scoreSuccess, setScoreSuccess] = useState(false)
  const [discussionOpening, setDiscussionOpening] = useState(false)
  const [discussionSuccess, setDiscussionSuccess] = useState(false)

  async function load() {
    setLoading(true)
    const result = await getRebuttal(conferenceId, submissionId, assignmentId)
    setLoading(false)
    if (result.error || !result.data) {
      setError(result.error ?? "Failed to load rebuttal")
    } else {
      setData(result.data)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, submissionId, assignmentId])

  async function handlePointStatusChange(pointId: string, status: ResponseStatus, note?: string) {
    const result = await acknowledgePoint(conferenceId, assignmentId, pointId, status, note)
    if (result.error) {
      setError(result.error)
    } else {
      await load()
    }
  }

  async function handleMarkAllRead() {
    if (!data) return
    const unacked = data.points.filter(
      (p) => p.reviewerId === assignmentId && !p.reviewerAcknowledgment?.acknowledged,
    )
    for (const point of unacked) {
      await acknowledgePoint(conferenceId, assignmentId, point.id, "addressed")
    }
    await load()
  }

  async function handleSaveScore() {
    setScoreSaving(true)
    setError(null)
    const result = await updatePostRebuttalScore(conferenceId, assignmentId, {
      score,
      recommendation,
      comment: scoreComment,
    })
    setScoreSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setScoreSuccess(true)
      setTimeout(() => setScoreSuccess(false), 3000)
    }
  }

  async function handleStartDiscussion() {
    setDiscussionOpening(true)
    setDiscussionSuccess(false)
    setError(null)
    const result = await openDiscussion(conferenceId)
    setDiscussionOpening(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDiscussionSuccess(true)
    setTimeout(() => setDiscussionSuccess(false), 3000)
    await load()
  }

  function handleUpdateReview() {
    setScoreFormOpen(true)
    setScoreSuccess(false)
  }

  if (loading) {
    return <div className="text-xs text-slate-500 py-4">{t("runtime.components.reviewer.submission-review.rebuttal-tab.text_loading_rebuttal")}</div>
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

  // Phase: awaiting — author hasn't submitted yet
  if (phase !== "submitted" && phase !== "finalized") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_the_author_hasn_apos_t_submitted")}{" "}</p>
      </div>
    )
  }

  // Count unacknowledged points for this reviewer
  const myUnackedPoints = data.points.filter(
    (p) => p.reviewerId === assignmentId && !p.reviewerAcknowledgment?.acknowledged,
  )

  return (
    <div className="space-y-4">
      {/* Finalized banner */}
      {phase === "finalized" && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_rebuttal_period_is_finalized_no_further")}{" "}</p>
        </div>
      )}

      {/* Mark all read + post-rebuttal score — only when submitted/discussion */}
      {phase === "submitted" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
          {discussionOpening && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Opening discussion...
            </p>
          )}
          {discussionSuccess && (
            <p className="text-[10px] text-green-600 dark:text-green-400">
              Discussion is open for this conference.
            </p>
          )}

          {/* Mark all read */}
          {myUnackedPoints.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {myUnackedPoints.length} point{myUnackedPoints.length !== 1 ? "s" : ""}{" "}
                unacknowledged
              </span>
              <button
                onClick={handleMarkAllRead}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_mark_all_as_read")}{" "}</button>
            </div>
          )}

          {/* Post-rebuttal score */}
          <div>
            <button
              onClick={() => setScoreFormOpen(!scoreFormOpen)}
              className="text-xs font-medium text-[#1B3C53] dark:text-blue-300 hover:underline"
            >
              {scoreFormOpen ? "▾ Hide" : "▸ Update"} {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_post_rebuttal_score")}{" "}</button>

            {scoreFormOpen && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                      {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_score_1_10")}{" "}</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                      {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_recommendation")}{" "}</label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
                    >
                      <option value="accept">{t("runtime.components.reviewer.submission-review.rebuttal-tab.text_accept")}</option>
                      <option value="borderline">{t("runtime.components.reviewer.submission-review.rebuttal-tab.text_borderline")}</option>
                      <option value="reject">{t("runtime.components.reviewer.submission-review.rebuttal-tab.text_reject")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                    {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_comment_optional")}{" "}</label>
                  <textarea
                    value={scoreComment}
                    onChange={(e) => setScoreComment(e.target.value)}
                    placeholder={t("runtime.components.reviewer.submission-review.rebuttal-tab.placeholder_any_additional_comments_after_reading_the")}
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 min-h-[60px] resize-y bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
                  />
                </div>
                {scoreSuccess && (
                  <p className="text-[10px] text-green-600 dark:text-green-400">{t("runtime.components.reviewer.submission-review.rebuttal-tab.text_score_updated")}</p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveScore}
                    disabled={scoreSaving}
                    className="text-xs px-4 py-1.5 rounded-lg bg-[#1B3C53] text-white hover:bg-[#1B3C53]/90 disabled:opacity-50 font-medium"
                  >
                    {scoreSaving ? "Saving…" : "Update Score"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <RebuttalPanel
        settings={data.settings}
        reviewers={data.reviewers}
        points={data.points}
        submission={data.submission}
        userRole="reviewer"
        currentUserId={assignmentId}
        onPointStatusChange={handlePointStatusChange}
        onUpdateReview={handleUpdateReview}
        onStartDiscussion={handleStartDiscussion}
        readOnly={phase === "finalized"}
      />
    </div>
  )
}

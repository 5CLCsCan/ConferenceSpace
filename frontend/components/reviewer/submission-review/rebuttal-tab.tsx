"use client"

import { useEffect, useState } from "react"
import { RebuttalPanel } from "@/components/shared/rebuttal"
import { getRebuttal, acknowledgePoint, updatePostRebuttalScore } from "@/lib/api/rebuttal"
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

  if (loading) {
    return (
      <div className="text-body py-4">
        {t("runtime.components.reviewer.submission-review.rebuttal-tab.text_loading_rebuttal")}
      </div>
    )
  }

  if (error) {
    return (
      <div className="badge-semantic-error text-ui-meta rounded-[var(--radius-button)] px-3 py-2">
        {error}
      </div>
    )
  }

  if (!data) return null

  const phase = data.settings.phase

  // Phase: awaiting — author hasn't submitted yet
  if (phase !== "submitted" && phase !== "finalized") {
    return (
      <div className="surface-card px-4 py-6 text-center">
        <p className="text-body">
          {t(
            "runtime.components.reviewer.submission-review.rebuttal-tab.text_the_author_hasn_apos_t_submitted",
          )}{" "}
        </p>
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
        <div className="surface-card-quiet-strip rounded-[var(--radius-card)] border border-[var(--color-border-soft)] px-4 py-3">
          <p className="text-body font-[500]">
            {t(
              "runtime.components.reviewer.submission-review.rebuttal-tab.text_rebuttal_period_is_finalized_no_further",
            )}{" "}
          </p>
        </div>
      )}

      {/* Mark all read + post-rebuttal score — only when submitted/discussion */}
      {phase === "submitted" && (
        <div className="surface-card space-y-4 p-4">
          {/* Mark all read */}
          {myUnackedPoints.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-body">
                {myUnackedPoints.length} point{myUnackedPoints.length !== 1 ? "s" : ""}{" "}
                unacknowledged
              </span>
              <button
                onClick={handleMarkAllRead}
                className="button-secondary text-ui-meta px-3 py-1.5"
              >
                {t(
                  "runtime.components.reviewer.submission-review.rebuttal-tab.text_mark_all_as_read",
                )}{" "}
              </button>
            </div>
          )}

          {/* Post-rebuttal score */}
          <div>
            <button
              onClick={() => setScoreFormOpen(!scoreFormOpen)}
              className="text-ui-meta font-[500] text-[var(--color-primary-ink)] hover:underline"
            >
              {scoreFormOpen ? "▾ Hide" : "▸ Update"}{" "}
              {t(
                "runtime.components.reviewer.submission-review.rebuttal-tab.text_post_rebuttal_score",
              )}{" "}
            </button>

            {scoreFormOpen && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-table-header mb-1 block">
                      {t(
                        "runtime.components.reviewer.submission-review.rebuttal-tab.text_score_1_10",
                      )}{" "}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="control-standard text-body w-full px-3 py-1.5 focus:border-[var(--color-primary-ink)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-table-header mb-1 block">
                      {t(
                        "runtime.components.reviewer.submission-review.rebuttal-tab.text_recommendation",
                      )}{" "}
                    </label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      className="control-standard text-body w-full px-3 py-1.5 focus:border-[var(--color-primary-ink)] focus:outline-none"
                    >
                      <option value="accept">
                        {t(
                          "runtime.components.reviewer.submission-review.rebuttal-tab.text_accept",
                        )}
                      </option>
                      <option value="borderline">
                        {t(
                          "runtime.components.reviewer.submission-review.rebuttal-tab.text_borderline",
                        )}
                      </option>
                      <option value="reject">
                        {t(
                          "runtime.components.reviewer.submission-review.rebuttal-tab.text_reject",
                        )}
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-table-header mb-1 block">
                    {t(
                      "runtime.components.reviewer.submission-review.rebuttal-tab.text_comment_optional",
                    )}{" "}
                  </label>
                  <textarea
                    value={scoreComment}
                    onChange={(e) => setScoreComment(e.target.value)}
                    placeholder={t(
                      "runtime.components.reviewer.submission-review.rebuttal-tab.placeholder_any_additional_comments_after_reading_the",
                    )}
                    className="control-standard text-body min-h-[60px] w-full resize-y px-3 py-2 focus:border-[var(--color-primary-ink)] focus:outline-none"
                  />
                </div>
                {scoreSuccess && (
                  <p className="text-ui-meta text-[var(--color-success-text)]">
                    {t(
                      "runtime.components.reviewer.submission-review.rebuttal-tab.text_score_updated",
                    )}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveScore}
                    disabled={scoreSaving}
                    className="button-primary text-ui-meta px-4 py-1.5 disabled:opacity-50"
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
        readOnly={phase === "finalized"}
      />
    </div>
  )
}

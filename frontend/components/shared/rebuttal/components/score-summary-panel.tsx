"use client"

import type { ReviewerInfo, ScoreSummaryPanelProps } from "../types"
import { ReviewerScoreCard } from "./reviewer-score-card"
import { useTranslation } from "@/lib/i18n/translation-context"

export function ScoreSummaryPanel({
  reviewers,
  userRole = "reviewer",
  showIndividualScores = true,
}: ScoreSummaryPanelProps) {
  const { t } = useTranslation()
  const avgOriginal = reviewers.reduce((sum, r) => sum + r.scores.original, 0) / reviewers.length
  const avgCurrent = reviewers.reduce((sum, r) => sum + r.scores.current, 0) / reviewers.length
  const scoreChanged = avgOriginal !== avgCurrent
  const updatedCount = reviewers.filter((r) => r.scores.updated).length

  return (
    <div className="surface-card mb-5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-table-header">
          {t(
            "runtime.components.shared.rebuttal.components.score-summary-panel.text_reviewer_scores",
          )}{" "}
        </h3>
        {updatedCount > 0 && (
          <span className="badge-semantic-success text-tiny-label">
            {updatedCount} score{updatedCount > 1 ? "s" : ""} updated
          </span>
        )}
      </div>

      {/* Average Score Display */}
      <div className="mb-4 flex items-center gap-4 border-b border-[var(--color-border-soft)] pb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-detail-title leading-none">{avgCurrent.toFixed(1)}</span>
          <span className="text-tiny-label text-[var(--color-text-meta)]">
            {t("runtime.components.shared.rebuttal.components.score-summary-panel.text_avg_score")}
          </span>
        </div>
        {scoreChanged && (
          <div className="text-ui-meta flex items-center gap-1 text-[var(--color-success-text)]">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span className="font-[700]">
              +{(avgCurrent - avgOriginal).toFixed(1)}{" "}
              {t(
                "runtime.components.shared.rebuttal.components.score-summary-panel.text_from_initial",
              )}{" "}
            </span>
          </div>
        )}
      </div>

      {/* Individual Reviewers */}
      {showIndividualScores && (
        <div className="space-y-2">
          {reviewers.map((reviewer) => (
            <ReviewerScoreCard key={reviewer.id} reviewer={reviewer} />
          ))}
        </div>
      )}
    </div>
  )
}

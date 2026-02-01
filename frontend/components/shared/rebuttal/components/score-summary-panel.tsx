"use client"

import type { ReviewerInfo, ScoreSummaryPanelProps } from "../types"
import { ReviewerScoreCard } from "./reviewer-score-card"

export function ScoreSummaryPanel({
  reviewers,
  userRole = "reviewer",
  showIndividualScores = true,
}: ScoreSummaryPanelProps) {
  const avgOriginal = reviewers.reduce((sum, r) => sum + r.scores.original, 0) / reviewers.length
  const avgCurrent = reviewers.reduce((sum, r) => sum + r.scores.current, 0) / reviewers.length
  const scoreChanged = avgOriginal !== avgCurrent
  const updatedCount = reviewers.filter((r) => r.scores.updated).length

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Reviewer Scores
        </h3>
        {updatedCount > 0 && (
          <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {updatedCount} score{updatedCount > 1 ? "s" : ""} updated
          </span>
        )}
      </div>

      {/* Average Score Display */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-black text-[#1B3C53] leading-none">
            {avgCurrent.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">avg. score</span>
        </div>
        {scoreChanged && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-600">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span className="font-medium">
              +{(avgCurrent - avgOriginal).toFixed(1)} from initial
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

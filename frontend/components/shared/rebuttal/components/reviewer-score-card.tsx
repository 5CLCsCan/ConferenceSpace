"use client"

import type { ReviewerScoreCardProps } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"

export function ReviewerScoreCard({ reviewer }: ReviewerScoreCardProps) {
  const { t } = useTranslation()
  const scoreChanged = reviewer.scores.updated
  const recChanged = reviewer.recommendation.updated

  return (
    <div
      className={`px-3 py-2 rounded-lg border ${
        reviewer.isCurrentUser ? "bg-[#1B3C53]/5 border-[#1B3C53]/20" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
              reviewer.isCurrentUser ? "bg-[#1B3C53] text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {reviewer.anonymousId.replace("Reviewer #", "R")}
          </div>
          <span className="text-[11px] font-medium text-slate-700">
            {reviewer.isCurrentUser ? "You" : reviewer.anonymousId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="text-right">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              {t("runtime.components.shared.rebuttal.components.reviewer-score-card.text_score")}{" "}</div>
            <div className="flex items-center gap-1">
              {scoreChanged && (
                <>
                  <span className="text-[10px] text-slate-400 line-through">
                    {reviewer.scores.original}
                  </span>
                  <span 
                    className="material-symbols-outlined text-emerald-500" 
                    style={{ 
                      fontSize: '16px', 
                      width: '16px', 
                      height: '16px', 
                      maxWidth: '16px', 
                      maxHeight: '16px',
                      minWidth: '16px',
                      minHeight: '16px',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transform: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    arrow_forward
                  </span>
                </>
              )}
              <span
                className={`text-[11px] font-bold ${
                  scoreChanged ? "text-emerald-600" : "text-slate-700"
                }`}
              >
                {reviewer.scores.current}
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="text-right min-w-[80px]">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{t("runtime.components.shared.rebuttal.components.reviewer-score-card.text_rec")}</div>
            <span
              className={`text-[10px] font-medium ${
                recChanged ? "text-emerald-600" : "text-slate-600"
              }`}
            >
              {reviewer.recommendation.current}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { SCORE_DESCRIPTORS, CRITERIA_META } from "./types"

// =============================================================================
// Criterion Score Card Component
// =============================================================================

interface CriterionScoreCardProps {
  criterionKey: string
  label: string
  value: number
  onChange: (value: number) => void
}

export function CriterionScoreCard({
  criterionKey,
  label,
  value,
  onChange,
}: CriterionScoreCardProps) {
  const meta = CRITERIA_META[criterionKey] || { icon: "grade", hint: "" }
  const descriptor = SCORE_DESCRIPTORS[value]

  return (
    <div className="group relative">
      {/* Card Container */}
      <div className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-4 transition-all duration-200">
        {/* Header: Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#1B3C53] uppercase tracking-wider">
              {label}
            </span>
          </div>
          {/* Current Score Badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={{
              backgroundColor: `${descriptor.color}15`,
              color: descriptor.color,
              border: `1px solid ${descriptor.color}30`,
            }}
          >
            <span className="text-sm font-black">{value}</span>
            <span className="opacity-70">/10</span>
          </div>
        </div>

        {/* Score Buttons Row */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
            const isSelected = value === score
            const scoreDesc = SCORE_DESCRIPTORS[score]
            return (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                className={`
                  relative flex-1 h-8 rounded-md text-[10px] font-bold transition-all duration-150
                  ${
                    isSelected
                      ? "ring-2 ring-offset-1 shadow-md scale-105 z-10"
                      : "hover:scale-102 hover:shadow-sm"
                  }
                `}
                style={
                  {
                    backgroundColor: isSelected ? scoreDesc.color : `${scoreDesc.color}20`,
                    color: isSelected ? "#fff" : scoreDesc.color,
                    "--tw-ring-color": isSelected ? scoreDesc.color : undefined,
                  } as React.CSSProperties
                }
                title={`${score}: ${scoreDesc.label}`}
              >
                {score}
              </button>
            )
          })}
        </div>

        {/* Descriptor Label */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-400 font-medium">{meta.hint}</span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: descriptor.color }}
          >
            {descriptor.label}
          </span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Score Summary Component
// =============================================================================

interface ScoreSummaryProps {
  scores: {
    originality: number
    technicalQuality: number
    clarity: number
    significance: number
    methodology: number
  }
}

export function ScoreSummary({ scores }: ScoreSummaryProps) {
  const values = Object.values(scores)
  const average = values.reduce((a, b) => a + b, 0) / values.length
  const roundedAvg = Math.round(average * 10) / 10
  const descriptor = SCORE_DESCRIPTORS[Math.round(average)] || SCORE_DESCRIPTORS[5]

  // Calculate score distribution
  const distribution = {
    high: values.filter((v) => v >= 8).length,
    mid: values.filter((v) => v >= 5 && v < 8).length,
    low: values.filter((v) => v < 5).length,
  }

  return (
    <div className="bg-gradient-to-br from-[#1B3C53] to-[#234C6A] rounded-xl p-4 text-white mb-4">
      <div className="flex items-center justify-between">
        {/* Average Score */}
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shadow-lg"
            style={{ backgroundColor: descriptor.color }}
          >
            {roundedAvg}
          </div>
          <div>
            <div className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
              Average Score
            </div>
            <div className="text-sm font-bold" style={{ color: descriptor.color }}>
              {descriptor.label}
            </div>
          </div>
        </div>

        {/* Score Bar Visualization */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {values.map((v, i) => (
              <div
                key={i}
                className="w-2 rounded-full transition-all duration-300"
                style={{
                  height: `${v * 3 + 8}px`,
                  backgroundColor: SCORE_DESCRIPTORS[v].color,
                }}
                title={`${Object.keys(scores)[i]}: ${v}`}
              />
            ))}
          </div>

          {/* Distribution Badges */}
          <div className="flex gap-1.5">
            {distribution.high > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                {distribution.high} High
              </span>
            )}
            {distribution.mid > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 text-[9px] font-bold">
                {distribution.mid} Mid
              </span>
            )}
            {distribution.low > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-bold">
                {distribution.low} Low
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { RECOMMENDATION_OPTIONS, confidenceOptions } from "./types"

// =============================================================================
// RecommendationSelector Component (Scholar-Compact)
// =============================================================================

interface RecommendationSelectorProps {
  value: string
  onChange: (value: string) => void
  averageScore?: number
}

export function RecommendationSelector({
  value,
  onChange,
  averageScore,
}: RecommendationSelectorProps) {
  const selectedOption = RECOMMENDATION_OPTIONS.find((o) => o.value === value)

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
        Overall Rating
      </label>

      {/* Recommendation Grid - 7 items in a row, compact */}
      <div className="flex gap-1">
        {RECOMMENDATION_OPTIONS.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                flex-1 py-2 px-1 rounded-md text-center transition-all duration-150 border
                ${
                  isSelected
                    ? "bg-[#1B3C53] text-white border-[#1B3C53] shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }
              `}
            >
              <span className="text-[7.5px] font-black uppercase tracking-tight leading-tight block">
                {option.shortLabel}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected recommendation detail */}
      {selectedOption ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-[#1B3C53]">{selectedOption.label}</span>
          <span className="text-[9px] text-slate-500 font-medium tracking-tight">
            ({selectedOption.description})
          </span>
        </div>
      ) : (
        <p className="text-[9px] text-slate-400 italic">Select overall rating.</p>
      )}
    </div>
  )
}

// =============================================================================
// ConfidenceSelector Component (Scholar-Compact)
// =============================================================================

interface ConfidenceSelectorProps {
  value: number
  onChange: (value: number) => void
}

export function ConfidenceSelector({ value, onChange }: ConfidenceSelectorProps) {
  const selectedOption = confidenceOptions.find((o) => o.value === value)

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
        Reviewer Confidence
      </label>

      {/* Confidence Segmented Control */}
      <div className="flex bg-slate-100 p-0.5 rounded-lg">
        {confidenceOptions
          .slice()
          .reverse()
          .map((option) => {
            const isSelected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`
                  flex-1 py-1.5 px-1 rounded-md text-center transition-all duration-150
                  ${
                    isSelected
                      ? "bg-white text-[#1B3C53] shadow-sm shadow-slate-200/50"
                      : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                <span className="text-[9px] font-black block">{option.value}</span>
              </button>
            )
          })}
      </div>

      {/* Selected confidence detail */}
      {selectedOption ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-[#1B3C53] uppercase tracking-tighter">
            Level {selectedOption.value}
          </span>
          <span className="text-[9px] text-slate-500 font-medium tracking-tight">
            ({selectedOption.fullLabel})
          </span>
        </div>
      ) : (
        <p className="text-[9px] text-slate-400 italic">Select confidence level.</p>
      )}
    </div>
  )
}

// =============================================================================
// FinalRecommendationCard Component (Scholar-Compact)
// =============================================================================

interface FinalRecommendationCardProps {
  recommendation: string
  confidence: number
  onRecommendationChange: (value: string) => void
  onConfidenceChange: (value: number) => void
  averageScore?: number
  isComplete: boolean
}

export function FinalRecommendationCard({
  recommendation,
  confidence,
  onRecommendationChange,
  onConfidenceChange,
  averageScore,
  isComplete,
}: FinalRecommendationCardProps) {
  const selectedRec = RECOMMENDATION_OPTIONS.find((o) => o.value === recommendation)
  const selectedConf = confidenceOptions.find((o) => o.value === confidence)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 pt-4 pb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h2 className="font-bold text-sm text-[#1B3C53] tracking-tight uppercase">
          Final Assessment
        </h2>
        <span
          className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
            isComplete ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-300"
          }`}
        >
          {isComplete ? "Ready" : "Pending"}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        <RecommendationSelector
          value={recommendation}
          onChange={onRecommendationChange}
          averageScore={averageScore}
        />
        <ConfidenceSelector value={confidence} onChange={onConfidenceChange} />
      </div>

      {/* Summary row when complete */}
      {isComplete && selectedRec && selectedConf && (
        <div className="mt-3 pt-2.5 border-t border-slate-200 border-dashed flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                Global Rating
              </span>
              <p className="text-[11px] font-black text-[#1B3C53] leading-none">
                {selectedRec.label}
              </p>
            </div>
            <div className="w-px h-5 bg-slate-100" />
            <div>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                Confidence
              </span>
              <p className="text-[11px] font-black text-[#1B3C53] leading-none">
                {selectedConf.value}: {selectedConf.label}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[12px] text-emerald-500">verified</span>
        </div>
      )}
    </div>
  )
}

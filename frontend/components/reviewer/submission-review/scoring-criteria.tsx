"use client"

import { SCORE_DESCRIPTORS, getScoreDescriptor, normalizeReviewScore } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

function getScoreDescriptorLabel(score: number, t: ReturnType<typeof useTranslation>["t"]) {
  switch (normalizeReviewScore(score)) {
    case 1:
      return t("runtime.components.reviewer.submission-review.scoring-criteria.text_score_poor")
    case 2:
      return t("runtime.components.reviewer.submission-review.scoring-criteria.text_score_weak")
    case 3:
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_score_below_average",
      )
    case 4:
      return t("runtime.components.reviewer.submission-review.scoring-criteria.text_score_fair")
    case 5:
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_score_borderline",
      )
    case 6:
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_score_acceptable",
      )
    case 7:
      return t("runtime.components.reviewer.submission-review.scoring-criteria.text_score_good")
    case 8:
      return t("runtime.components.reviewer.submission-review.scoring-criteria.text_score_strong")
    case 9:
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_score_excellent",
      )
    case 10:
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_score_outstanding",
      )
    default:
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_score_borderline",
      )
  }
}

function getCriterionHintLabel(criterionKey: string, t: ReturnType<typeof useTranslation>["t"]) {
  switch (criterionKey) {
    case "originality":
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_originality",
      )
    case "technicalQuality":
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_technical_quality",
      )
    case "clarity":
      return t("runtime.components.reviewer.submission-review.scoring-criteria.text_hint_clarity")
    case "significance":
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_significance",
      )
    case "methodology":
      return t(
        "runtime.components.reviewer.submission-review.scoring-criteria.text_hint_methodology",
      )
    default:
      return ""
  }
}

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
  const { t } = useTranslation()
  const normalizedValue = normalizeReviewScore(value)
  const descriptor = getScoreDescriptor(normalizedValue)
  const hintText = getCriterionHintLabel(criterionKey, t)
  const descriptorLabel = getScoreDescriptorLabel(normalizedValue, t)

  return (
    <div className="group relative">
      {/* Card Container */}
      <div className="surface-card-quiet-strip rounded-[var(--radius-card)] border border-[var(--color-border-soft)] p-4 transition-all duration-200 hover:bg-[var(--color-fill-quiet)]">
        {/* Header: Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-table-header text-[var(--color-primary-ink)]">{label}</span>
          </div>
          {/* Current Score Badge */}
          <div
            className="text-ui-meta flex items-center gap-1.5 rounded-[var(--radius-button)] px-2 py-0.5 font-[700]"
            style={{
              backgroundColor: `${descriptor.color}15`,
              color: descriptor.color,
              border: `1px solid ${descriptor.color}30`,
            }}
          >
            <span className="text-sm font-black">{normalizedValue}</span>
            <span className="opacity-70">/10</span>
          </div>
        </div>

        {/* Score Buttons Row */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
            const isSelected = normalizedValue === score
            const scoreDesc = SCORE_DESCRIPTORS[score]
            return (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                className={`
                  text-ui-meta relative flex-1 rounded-[var(--radius-button)] transition-all duration-150
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
                title={`${score}: ${getScoreDescriptorLabel(score, t)}`}
              >
                {score}
              </button>
            )
          })}
        </div>

        {/* Descriptor Label */}
        <div className="flex items-center justify-between">
          <span className="text-meta font-[500]">{hintText}</span>
          <span className="text-tiny-label" style={{ color: descriptor.color }}>
            {descriptorLabel}
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
  const { t } = useTranslation()
  const values = Object.values(scores).map((value) => normalizeReviewScore(value))
  const average = values.reduce((a, b) => a + b, 0) / values.length
  const roundedAvg = Math.round(average * 10) / 10
  const descriptor = getScoreDescriptor(Math.round(average))

  // Calculate score distribution
  const distribution = {
    high: values.filter((v) => v >= 8).length,
    mid: values.filter((v) => v >= 5 && v < 8).length,
    low: values.filter((v) => v < 5).length,
  }

  return (
    <div className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-primary-ink)] p-4 text-white">
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
            <div className="text-tiny-label text-white/60">
              {t(
                "runtime.components.reviewer.submission-review.scoring-criteria.text_average_score",
              )}{" "}
            </div>
            <div className="text-card-header text-white" style={{ color: descriptor.color }}>
              {getScoreDescriptorLabel(Math.round(average), t)}
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
                  backgroundColor: getScoreDescriptor(v).color,
                }}
                title={`${Object.keys(scores)[i]}: ${v}`}
              />
            ))}
          </div>

          {/* Distribution Badges */}
          <div className="flex gap-1.5">
            {distribution.high > 0 && (
              <span className="text-tiny-label rounded-[var(--radius-button)] bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">
                {distribution.high}{" "}
                {t("runtime.components.reviewer.submission-review.scoring-criteria.text_high")}{" "}
              </span>
            )}
            {distribution.mid > 0 && (
              <span className="text-tiny-label rounded-[var(--radius-button)] bg-slate-500/20 px-1.5 py-0.5 text-slate-300">
                {distribution.mid}{" "}
                {t("runtime.components.reviewer.submission-review.scoring-criteria.text_mid")}{" "}
              </span>
            )}
            {distribution.low > 0 && (
              <span className="text-tiny-label rounded-[var(--radius-button)] bg-red-500/20 px-1.5 py-0.5 text-red-300">
                {distribution.low}{" "}
                {t("runtime.components.reviewer.submission-review.scoring-criteria.text_low")}{" "}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

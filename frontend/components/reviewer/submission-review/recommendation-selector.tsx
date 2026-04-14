"use client"

import { RECOMMENDATION_OPTIONS, confidenceOptions } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

type TFn = ReturnType<typeof useTranslation>["t"]

function getRecommendationShortLabel(value: string, t: TFn) {
  switch (value) {
    case "strong_accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_strong_accept",
      )
    case "accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_accept",
      )
    case "weak_accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_weak_accept",
      )
    case "borderline":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_borderline",
      )
    case "weak_reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_weak_reject",
      )
    case "reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_reject",
      )
    case "strong_reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_strong_reject",
      )
    default:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_short_borderline",
      )
  }
}

function getRecommendationLabel(value: string, t: TFn) {
  switch (value) {
    case "strong_accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_strong_accept",
      )
    case "accept":
      return t("runtime.components.reviewer.submission-review.recommendation-selector.text_accept")
    case "weak_accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_weak_accept",
      )
    case "borderline":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_borderline",
      )
    case "weak_reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_weak_reject",
      )
    case "reject":
      return t("runtime.components.reviewer.submission-review.recommendation-selector.text_reject")
    case "strong_reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_strong_reject",
      )
    default:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_borderline",
      )
  }
}

function getRecommendationDescription(value: string, t: TFn) {
  switch (value) {
    case "strong_accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_strong_accept",
      )
    case "accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_accept",
      )
    case "weak_accept":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_weak_accept",
      )
    case "borderline":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_borderline",
      )
    case "weak_reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_weak_reject",
      )
    case "reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_reject",
      )
    case "strong_reject":
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_strong_reject",
      )
    default:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_desc_borderline",
      )
  }
}

function getConfidenceLabel(value: number, t: TFn) {
  switch (value) {
    case 5:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_expert",
      )
    case 4:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_high",
      )
    case 3:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_medium",
      )
    case 2:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_low",
      )
    case 1:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_none",
      )
    default:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_medium",
      )
  }
}

function getConfidenceDescription(value: number, t: TFn) {
  switch (value) {
    case 5:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_desc_expert",
      )
    case 4:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_desc_high",
      )
    case 3:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_desc_medium",
      )
    case 2:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_desc_low",
      )
    case 1:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_desc_none",
      )
    default:
      return t(
        "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence_desc_medium",
      )
  }
}

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
  const { t } = useTranslation()
  void averageScore

  const hasSelection = RECOMMENDATION_OPTIONS.some((option) => option.value === value)

  return (
    <div className="space-y-3">
      <label className="text-table-header block">
        {t(
          "runtime.components.reviewer.submission-review.recommendation-selector.text_overall_rating",
        )}{" "}
      </label>

      <div className="flex gap-1">
        {RECOMMENDATION_OPTIONS.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                text-ui-meta flex-1 rounded-[var(--radius-button)] border px-1 py-2 text-center transition-all duration-150
                ${
                  isSelected
                    ? "button-primary border-[var(--color-primary-ink)] shadow-sm"
                    : "bg-[var(--color-fill-quiet)] text-[var(--color-neutral-text)] border-[var(--color-border-soft)] hover:border-[var(--color-border-strong)]"
                }
              `}
            >
              <span className="text-tiny-label block leading-tight tracking-tight">
                {getRecommendationShortLabel(option.value, t)}
              </span>
            </button>
          )
        })}
      </div>

      {hasSelection ? (
        <div className="surface-card-quiet-strip flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--color-border-soft)] px-2.5 py-1.5">
          <span className="text-ui-meta font-[700] text-[var(--color-primary-ink)]">
            {getRecommendationLabel(value, t)}
          </span>
          <span className="text-meta font-[500] tracking-tight">
            ({getRecommendationDescription(value, t)})
          </span>
        </div>
      ) : (
        <p className="text-meta italic">
          {t(
            "runtime.components.reviewer.submission-review.recommendation-selector.text_select_overall_rating",
          )}
        </p>
      )}
    </div>
  )
}

interface ConfidenceSelectorProps {
  value: number
  onChange: (value: number) => void
}

export function ConfidenceSelector({ value, onChange }: ConfidenceSelectorProps) {
  const { t } = useTranslation()
  const hasSelection = confidenceOptions.some((option) => option.value === value)

  return (
    <div className="space-y-3">
      <label className="text-table-header block">
        {t(
          "runtime.components.reviewer.submission-review.recommendation-selector.text_reviewer_confidence",
        )}{" "}
      </label>

      <div className="segment-filter flex p-0.5">
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
                  text-ui-meta flex-1 rounded-[var(--radius-button)] px-1 py-1.5 text-center transition-all duration-150
                  ${
                    isSelected
                      ? "bg-[var(--color-surface)] text-[var(--color-primary-ink)] shadow-sm"
                      : "text-[var(--color-neutral-text)] hover:text-[var(--color-primary-ink)]"
                  }
                `}
              >
                <span className="text-tiny-label block">{option.value}</span>
              </button>
            )
          })}
      </div>

      {hasSelection ? (
        <div className="surface-card-quiet-strip flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--color-border-soft)] px-2.5 py-1.5">
          <span className="text-ui-meta font-[700] uppercase tracking-tighter text-[var(--color-primary-ink)]">
            {t("runtime.components.reviewer.submission-review.recommendation-selector.text_level")}{" "}
            {value}
          </span>
          <span className="text-meta font-[500] tracking-tight">
            ({getConfidenceDescription(value, t)})
          </span>
        </div>
      ) : (
        <p className="text-meta italic">
          {t(
            "runtime.components.reviewer.submission-review.recommendation-selector.text_select_confidence_level",
          )}
        </p>
      )}
    </div>
  )
}

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
  const { t } = useTranslation()
  const hasRecommendation = RECOMMENDATION_OPTIONS.some((option) => option.value === recommendation)
  const hasConfidence = confidenceOptions.some((option) => option.value === confidence)

  return (
    <div className="surface-card px-4 pb-3 pt-4">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border-soft)] pb-2">
        <h2 className="text-card-header">
          {t(
            "runtime.components.reviewer.submission-review.recommendation-selector.text_final_assessment",
          )}{" "}
        </h2>
        <span
          className={`text-tiny-label rounded-[var(--radius-button)] px-1.5 py-0.5 ${
            isComplete
              ? "badge-neutral text-[var(--color-neutral-text)]"
              : "bg-[var(--color-fill-quiet)] text-[var(--color-text-meta)]"
          }`}
        >
          {isComplete
            ? t("runtime.components.reviewer.submission-review.recommendation-selector.text_ready")
            : t(
                "runtime.components.reviewer.submission-review.recommendation-selector.text_pending",
              )}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <RecommendationSelector
          value={recommendation}
          onChange={onRecommendationChange}
          averageScore={averageScore}
        />
        <ConfidenceSelector value={confidence} onChange={onConfidenceChange} />
      </div>

      {isComplete && hasRecommendation && hasConfidence && (
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[var(--color-border-soft)] pt-2.5">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-tiny-label text-[var(--color-text-meta)]">
                {t(
                  "runtime.components.reviewer.submission-review.recommendation-selector.text_global_rating",
                )}{" "}
              </span>
              <p className="text-ui-meta font-[700] leading-none text-[var(--color-primary-ink)]">
                {getRecommendationLabel(recommendation, t)}
              </p>
            </div>
            <div className="w-px h-5 bg-slate-100" />
            <div>
              <span className="text-tiny-label text-[var(--color-text-meta)]">
                {t(
                  "runtime.components.reviewer.submission-review.recommendation-selector.text_confidence",
                )}{" "}
              </span>
              <p className="text-ui-meta font-[700] leading-none text-[var(--color-primary-ink)]">
                {confidence}: {getConfidenceLabel(confidence, t)}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[12px] text-emerald-500">verified</span>
        </div>
      )}
    </div>
  )
}

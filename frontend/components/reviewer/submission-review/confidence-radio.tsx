"use client"

import { confidenceOptions } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

// =============================================================================
// Confidence Radio Component
// =============================================================================

interface ConfidenceRadioProps {
  value: number
  onChange: (value: number) => void
}

export function ConfidenceRadio({ value, onChange }: ConfidenceRadioProps) {
  const { t } = useTranslation()

  const getConfidenceLabel = (confidence: number) => {
    switch (confidence) {
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

  return (
    <div className="space-y-3">
      {confidenceOptions.map((option) => (
        <div key={option.value} className="flex items-center">
          <input
            type="radio"
            id={`conf-${option.value}`}
            name="confidence"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="w-4 h-4 text-[#2563eb] bg-slate-100 border-slate-300 focus:ring-[#2563eb]"
          />
          <label htmlFor={`conf-${option.value}`} className="ml-2 text-sm text-slate-700">
            {getConfidenceLabel(option.value)}
          </label>
        </div>
      ))}
    </div>
  )
}

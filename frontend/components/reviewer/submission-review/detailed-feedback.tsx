"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

// =============================================================================
// Feedback Field Configuration (Scholar-Compact)
// =============================================================================

interface FeedbackField {
  key: "summary" | "strengths" | "weaknesses" | "questions"
  label: string
  placeholder: string
  tips: string[]
  minHeight: string
}

const FEEDBACK_FIELDS: FeedbackField[] = [
  {
    key: "summary",
    label: t(
      "runtime.components.reviewer.submission-review.detailed-feedback.prop_label_summary_of_contribution",
    ),
    placeholder: "Briefly describe the key claims and contributions in your own words...",
    tips: [
      "Explain the main problem being addressed",
      "Summarize the proposed methodology",
      "Highlight primary experimental results",
    ],
    minHeight: "min-h-[120px]",
  },
  {
    key: "strengths",
    label: t(
      "runtime.components.reviewer.submission-review.detailed-feedback.prop_label_strengths",
    ),
    placeholder: "Identify the innovative aspects and high-quality elements...",
    tips: [
      "Identify main contributions and innovations",
      "Highlight well-executed experiments or analyses",
      "Note clear writing and organization",
    ],
    minHeight: "min-h-[140px]",
  },
  {
    key: "weaknesses",
    label: t(
      "runtime.components.reviewer.submission-review.detailed-feedback.prop_label_weaknesses",
    ),
    placeholder: "Identify technical flaws, missing experiments, or clarity issues...",
    tips: [
      "Be specific about technical issues",
      "Identify missing experiments or baselines",
      "Suggest concrete improvements",
    ],
    minHeight: "min-h-[140px]",
  },
  {
    key: "questions",
    label: t(
      "runtime.components.reviewer.submission-review.detailed-feedback.prop_label_questions_for_authors",
    ),
    placeholder: "Specific questions for authors to address during rebuttal...",
    tips: [
      "Ask clarifying questions about methodology",
      "Request missing experimental details",
      "Frame questions constructively",
    ],
    minHeight: "min-h-[140px]",
  },
]

// =============================================================================
// FeedbackCard Component (Scholar-Compact)
// =============================================================================

interface FeedbackCardProps {
  field: FeedbackField
  value: string
  onChange: (value: string) => void
  isLast?: boolean
}

function FeedbackCard({ field, value, onChange, isLast = false }: FeedbackCardProps) {
  const { t } = useTranslation()
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className={isLast ? "flex-1 flex flex-col min-h-0" : "space-y-2"}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <label className="text-table-header">{field.label}</label>
        <div className="flex items-center gap-3">
          <span className="text-meta">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="button-header inline-flex h-7 w-7 items-center justify-center p-0"
              >
                <span className="material-symbols-outlined text-[14px] leading-none">info</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="surface-card text-body max-w-[280px] p-4"
              sideOffset={8}
            >
              <ul className="space-y-1">
                {field.tips.map((tip, i) => (
                  <li key={i} className="text-ui-meta flex items-start gap-1.5">
                    <span className="text-meta mt-0.5">-</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={`control-standard text-body w-full resize-none px-3 py-2 leading-relaxed placeholder:text-[var(--color-text-meta)]
          focus:border-[var(--color-primary-ink)] focus:bg-[var(--color-surface)] focus:outline-none
          ${isLast ? "flex-1 min-h-0" : field.minHeight}`}
      />
    </div>
  )
}

// =============================================================================
// DetailedFeedbackSection Component (Main Export)
// =============================================================================

interface DetailedFeedbackSectionProps {
  summary: string
  strengths: string
  weaknesses: string
  questions: string
  onSummaryChange: (value: string) => void
  onStrengthsChange: (value: string) => void
  onWeaknessesChange: (value: string) => void
  onQuestionsChange: (value: string) => void
}

export function DetailedFeedbackSection({
  summary,
  strengths,
  weaknesses,
  questions,
  onSummaryChange,
  onStrengthsChange,
  onWeaknessesChange,
  onQuestionsChange,
}: DetailedFeedbackSectionProps) {
  const values = { summary, strengths, weaknesses, questions }
  const handlers = {
    summary: onSummaryChange,
    strengths: onStrengthsChange,
    weaknesses: onWeaknessesChange,
    questions: onQuestionsChange,
  }

  const completedCount = [summary, strengths, weaknesses, questions].filter((v) => v.trim()).length

  return (
    <div className="surface-card flex h-[866px] flex-col px-4 pb-4 pt-4">
      {/* Header */}
      <div className="mb-3 mt-3 flex shrink-0 items-center justify-between border-b border-[var(--color-border-soft)] pb-2">
        <h2 className="text-card-header">
          {t(
            "runtime.components.reviewer.submission-review.detailed-feedback.text_review_synthesis",
          )}{" "}
        </h2>
        <span className="text-kicker text-[var(--color-text-meta)]">
          {completedCount}
          {t(
            "runtime.components.reviewer.submission-review.detailed-feedback.text_4_completed",
          )}{" "}
        </span>
      </div>

      {/* Feedback Fields */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        {FEEDBACK_FIELDS.map((field, index) => (
          <FeedbackCard
            key={field.key}
            field={field}
            value={values[field.key as keyof typeof values]}
            onChange={handlers[field.key as keyof typeof handlers]}
            isLast={index === FEEDBACK_FIELDS.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

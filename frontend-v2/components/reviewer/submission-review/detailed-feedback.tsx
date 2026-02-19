"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
    label: "Summary of Contribution",
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
    label: "Strengths",
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
    label: "Weaknesses",
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
    label: "Questions for Authors",
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
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className={isLast ? "flex-1 flex flex-col min-h-0" : "space-y-2"}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 mb-2">
        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
          {field.label}
        </label>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-medium text-slate-400">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px] leading-none">info</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-white text-slate-900 border border-slate-200 shadow-lg p-4 max-w-[280px]"
              sideOffset={8}
            >
              <ul className="space-y-1">
                {field.tips.map((tip, i) => (
                  <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">-</span>
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
        className={`w-full rounded-lg border border-slate-200 bg-slate-50/50 text-[11px] leading-relaxed 
          focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] focus:bg-white
          ${isLast ? "flex-1 min-h-0" : field.minHeight} px-3 py-2 resize-none placeholder:text-slate-400 font-medium`}
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 pt-4 pb-4 h-[866px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 mt-3 border-b border-slate-100 pb-2 flex-shrink-0">
        <h2 className="font-bold text-sm text-[#1B3C53] tracking-tight uppercase">
          Review Synthesis
        </h2>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
          {completedCount}/4 Completed
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

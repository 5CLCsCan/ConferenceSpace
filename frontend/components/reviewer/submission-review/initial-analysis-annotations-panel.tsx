"use client"

import { useState } from "react"

import type {
  ReviewerInitialAnnotations,
  ReviewerInitialAnnotationCategory,
} from "@/lib/api/reviewer-initial-analysis"
import { useTranslation } from "@/lib/i18n/translation-context"

interface InitialAnalysisAnnotationsPanelProps {
  annotations: ReviewerInitialAnnotations
}

const categoryConfig: Record<
  ReviewerInitialAnnotationCategory,
  { icon: string; color: string; bg: string; border: string }
> = {
  strength: {
    icon: "thumb_up",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  weakness: { icon: "warning", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  suggestion: {
    icon: "lightbulb",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  question: { icon: "help", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
}

const severityLabels: Record<string, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
}

export function InitialAnalysisAnnotationsPanel({ annotations }: InitialAnalysisAnnotationsPanelProps) {
  const { t } = useTranslation()
  const sections = annotations.sections ?? []
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(sections.map((section) => section.section_name)),
  )

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#456882]">
          {t(
            "runtime.components.reviewer.submission-review.paper-annotation-panel.text_overall_impression",
          )}
        </p>
        <p className="mt-3 text-[12px] font-medium leading-relaxed tracking-tight text-slate-900">
          {annotations.overall_impression}
        </p>
        {annotations.domain_context && (
          <p className="mt-2 text-[10px] font-normal text-slate-500">
            {t(
              "runtime.components.reviewer.submission-review.paper-annotation-panel.text_domain_context_prefix",
            )} {annotations.domain_context}
          </p>
        )}
      </div>

      {sections.map((section) => {
        const sectionAnnotations = section.annotations ?? []
        const isExpanded = expandedSections.has(section.section_name)

        return (
          <div
            key={section.section_name}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleSection(section.section_name)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#456882]">
                  {section.section_name}
                </h4>
                {sectionAnnotations.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                    {sectionAnnotations.length}
                  </span>
                )}
              </div>
              <span
                className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              >
                expand_more
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 p-4 pt-3">
                <p className="text-[11px] font-normal leading-relaxed text-slate-600">
                  {section.summary}
                </p>

                {sectionAnnotations.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {sectionAnnotations.map((item, idx) => {
                      const config = categoryConfig[item.category] || categoryConfig.question
                      return (
                        <div
                          key={`${section.section_name}-${idx}`}
                          className={`rounded-xl border ${config.border} ${config.bg} p-3`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`material-symbols-outlined text-[14px] ${config.color}`}
                            >
                              {config.icon}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-[0.16em] ${config.color}`}
                            >
                              {item.category}
                            </span>
                            {item.severity && (
                              <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                {severityLabels[item.severity] || item.severity}
                              </span>
                            )}
                          </div>

                          <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 text-[11px] font-normal italic leading-relaxed text-slate-700">
                            {'"'}
                            {item.quoted_passage}
                            {'"'}
                          </blockquote>

                          <p className="mt-2 text-[11px] font-normal leading-relaxed text-slate-800">
                            {item.commentary}
                          </p>

                          {item.reviewer_hint && (
                            <div className="mt-2 rounded-md border border-violet-100 bg-violet-50/50 px-2.5 py-1.5">
                              <p className="text-[10px] font-medium leading-relaxed text-violet-700">
                                <span className="material-symbols-outlined mr-1 align-middle text-[12px]">
                                  tips_and_updates
                                </span>
                                {item.reviewer_hint}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

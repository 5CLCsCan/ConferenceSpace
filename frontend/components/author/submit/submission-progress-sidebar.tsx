"use client"

import type { StepType } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface SubmissionProgressSidebarProps {
  currentStep: StepType
  onStepChange: (step: StepType) => void
}

interface SubmissionStep {
  id: StepType
  title: string
  description: string
}

export function SubmissionProgressSidebar({
  currentStep,
  onStepChange,
}: SubmissionProgressSidebarProps) {
  const { t } = useTranslation()
  const submissionSteps: SubmissionStep[] = [
    {
      id: "paper",
      title: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_title_paper_details",
      ),
      description: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_description_title_abstract_keywords",
      ),
    },
    {
      id: "authors",
      title: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_title_authors_affiliations",
      ),
      description: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_description_add_co_authors",
      ),
    },
    {
      id: "file",
      title: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_title_upload_manuscript",
      ),
      description: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_description_pdf_and_materials",
      ),
    },
    {
      id: "coi",
      title: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_title_conflicts_of_interest",
      ),
      description: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_description_declare_conflicts",
      ),
    },
    {
      id: "review",
      title: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_title_review_submit",
      ),
      description: t(
        "runtime.components.author.submit.submission-progress-sidebar.prop_description_final_check",
      ),
    },
  ]

  return (
    <aside className="hidden lg:flex w-[240px] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-y-auto z-10">
      {/* Logo */}
      <div className="px-5 pt-8 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#141414] text-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10 w-9 h-9">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold tracking-tight text-[#141414] dark:text-white">
              {t(
                "runtime.components.author.submit.submission-progress-sidebar.text_conferencespace",
              )}{" "}
            </h1>
          </div>
        </div>
      </div>

      {/* Wizard Header */}
      <div className="px-4">
        <div className="flex flex-col mb-6">
          <h1 className="text-[#1B3C53] dark:text-white text-sm font-bold leading-[1.2] tracking-tight">
            {t(
              "runtime.components.author.submit.submission-progress-sidebar.text_submit_new_paper",
            )}{" "}
          </h1>
          <p className="text-slate-400 text-[10px] font-medium">
            {t(
              "runtime.components.author.submit.submission-progress-sidebar.text_complete_all_steps_to_submit_your",
            )}{" "}
          </p>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col gap-0.5">
          {submissionSteps.map((step, index) => {
            const isActive = currentStep === step.id
            const isLast = index === submissionSteps.length - 1

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  isActive
                    ? "bg-[#1B3C53]/5 dark:bg-white/5"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-60 hover:opacity-100"
                }`}
              >
                {/* Step indicator with connector line */}
                <div className="flex flex-col items-center gap-1.5 mt-0.5">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isActive ? "text-[#1B3C53] dark:text-white" : "text-slate-400"
                    }`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {isActive ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                  {!isLast && (
                    <div className="w-px h-full bg-slate-200 dark:bg-slate-700 min-h-[20px]" />
                  )}
                </div>

                {/* Step content */}
                <div className={isLast ? "" : "pb-3"}>
                  <p
                    className={`text-xs leading-tight tracking-tight ${
                      isActive
                        ? "font-bold text-[#1B3C53] dark:text-white"
                        : "font-medium text-[#141414] dark:text-white"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
                    {step.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

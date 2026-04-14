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
    <aside className="surface-sidebar hidden h-full w-[240px] flex-col overflow-y-auto z-10 lg:flex">
      {/* Logo */}
      <div className="px-5 pt-8 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-text-strong)] text-white shadow-lg shadow-slate-900/10">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-card-title text-[var(--color-text-strong)]">
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
          <h1 className="text-card-header">
            {t(
              "runtime.components.author.submit.submission-progress-sidebar.text_submit_new_paper",
            )}{" "}
          </h1>
          <p className="text-meta">
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
                    ? "bg-[var(--color-fill-quiet)]"
                    : "opacity-60 hover:bg-[var(--color-fill-quiet)] hover:opacity-100"
                }`}
              >
                {/* Step indicator with connector line */}
                <div className="flex flex-col items-center gap-1.5 mt-0.5">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isActive ? "text-[var(--color-primary-ink)]" : "text-[var(--color-text-meta)]"
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
                    className={`leading-tight tracking-tight ${
                      isActive
                        ? "text-ui-meta font-[700] text-[var(--color-primary-ink)]"
                        : "text-ui-meta font-[500] text-[var(--color-text-strong)]"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-meta mt-0.5 font-normal">{step.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

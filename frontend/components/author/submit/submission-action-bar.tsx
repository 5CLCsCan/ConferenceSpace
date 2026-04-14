"use client"

import { Loader2 } from "lucide-react"
import type { StepType } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

interface SubmissionActionBarProps {
  currentStep: StepType
  submitting: boolean
  savingDraft?: boolean
  onStepChange: (step: StepType) => void
  onSaveDraft: () => void
  onSubmit: () => void
  onCancel?: () => void
  canSubmit?: boolean
}

const stepOrder: StepType[] = ["paper", "authors", "file", "coi", "review"]

export function SubmissionActionBar({
  currentStep,
  submitting,
  savingDraft = false,
  onStepChange,
  onSaveDraft,
  onSubmit,
  onCancel,
  canSubmit = true,
}: SubmissionActionBarProps) {
  const { t } = useTranslation()
  const currentIndex = stepOrder.indexOf(currentStep)
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === stepOrder.length - 1
  const nextStepLabels: Record<StepType, string> = {
    paper: t("runtime.components.author.submit.submission-action-bar.text_next_authors"),
    authors: t("runtime.components.author.submit.submission-action-bar.text_next_upload"),
    file: t("runtime.components.author.submit.submission-action-bar.text_next_conflicts"),
    coi: t("runtime.components.author.submit.submission-action-bar.text_next_review"),
    review: t("runtime.components.author.submit.submission-action-bar.text_submit_paper"),
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(stepOrder[currentIndex - 1])
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onSubmit()
    } else {
      onStepChange(stepOrder[currentIndex + 1])
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      window.history.back()
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 lg:left-60">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Return Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="button-header text-ui-meta inline-flex h-8 items-center gap-1.5 px-3"
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "16px",
              width: "16px",
              height: "16px",
              maxWidth: "16px",
              maxHeight: "16px",
              minWidth: "16px",
              minHeight: "16px",
              lineHeight: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transform: "none",
              boxSizing: "border-box",
            }}
          >
            arrow_back
          </span>
          {t("runtime.components.author.submit.submission-action-bar.text_return")}{" "}
        </button>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={submitting || savingDraft}
            className="button-header text-ui-meta hidden h-8 items-center gap-1.5 px-3 disabled:opacity-50 sm:inline-flex"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              save
            </span>
            {savingDraft
              ? t("runtime.components.author.submit.submission-action-bar.text_saving")
              : t("runtime.components.author.submit.submission-action-bar.text_save_draft")}
          </button>

          {/* Next / Submit Button */}
          {isLastStep ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="button-primary text-ui-meta inline-flex h-9 items-center gap-1.5 px-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("runtime.components.author.submit.submission-action-bar.text_submitting")}{" "}
                </>
              ) : (
                <>
                  {t("runtime.components.author.submit.submission-action-bar.text_submit_paper")}{" "}
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "16px",
                      width: "16px",
                      height: "16px",
                      maxWidth: "16px",
                      maxHeight: "16px",
                      minWidth: "16px",
                      minHeight: "16px",
                      lineHeight: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transform: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    send
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="button-primary text-ui-meta inline-flex h-9 items-center gap-1.5 px-4 disabled:opacity-50"
            >
              {nextStepLabels[currentStep]}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

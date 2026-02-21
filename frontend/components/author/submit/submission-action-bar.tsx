"use client"

import { Loader2 } from "lucide-react"
import type { StepType } from "./types"

interface SubmissionActionBarProps {
  currentStep: StepType
  submitting: boolean
  onStepChange: (step: StepType) => void
  onSaveDraft: () => void
  onSubmit: () => void
  onCancel?: () => void
  canSubmit?: boolean
}

const stepOrder: StepType[] = ["paper", "authors", "file", "coi", "review"]

const nextStepLabels: Record<StepType, string> = {
  paper: "Next: Authors",
  authors: "Next: Upload",
  file: "Next: Conflicts",
  coi: "Next: Review",
  review: "Submit Paper",
}

export function SubmissionActionBar({
  currentStep,
  submitting,
  onStepChange,
  onSaveDraft,
  onSubmit,
  onCancel,
  canSubmit = true,
}: SubmissionActionBarProps) {
  const currentIndex = stepOrder.indexOf(currentStep)
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === stepOrder.length - 1

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
    <div className="absolute bottom-0 left-0 lg:left-60 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-4 z-30">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Return Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider"
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
          Return
        </button>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={submitting}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider disabled:opacity-50"
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
            Save Draft
          </button>

          {/* Next / Submit Button */}
          {isLastStep ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] text-white rounded-md text-[10px] font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Paper
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
              className="flex items-center gap-1.5 h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] text-white rounded-md text-[10px] font-medium shadow-md transition-all uppercase tracking-wider disabled:opacity-50"
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

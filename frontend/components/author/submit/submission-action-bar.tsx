"use client"

import type { StepType } from "./types"

interface SubmissionActionBarProps {
  currentStep: StepType
  submitting: boolean
  onStepChange: (step: StepType) => void
  onSaveDraft: () => void
  onSubmit: () => void
}

const stepOrder: StepType[] = ["paper", "authors", "file", "coi", "review"]

const nextStepLabels: Record<StepType, string> = {
  paper: "Next: Authors",
  authors: "Next: Upload Files",
  file: "Next: Conflicts",
  coi: "Review & Submit",
  review: "Submit Paper",
}

export function SubmissionActionBar({
  currentStep,
  submitting,
  onStepChange,
  onSaveDraft,
  onSubmit,
}: SubmissionActionBarProps) {
  const currentIndex = stepOrder.indexOf(currentStep)
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === stepOrder.length - 1

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(stepOrder[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onSubmit()
    } else {
      onStepChange(stepOrder[currentIndex + 1])
    }
  }

  return (
    <div className="absolute bottom-0 left-0 lg:left-[280px] right-0 bg-white dark:bg-[#1e1e1e] border-t border-[#ededed] dark:border-neutral-800 p-4 z-30">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          Save Draft
        </button>

        <div className="flex items-center gap-4">
          {/* Previous Button */}
          {isFirstStep ? (
            <button
              type="button"
              disabled
              className="hidden sm:flex px-5 py-2.5 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors opacity-50 cursor-not-allowed"
            >
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrevious}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Previous
            </button>
          )}

          {/* Next/Submit Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all transform hover:translate-y-px bg-primary hover:bg-primary-hover text-white shadow-primary/20"
          >
            {isLastStep && <span className="material-symbols-outlined text-[20px]">send</span>}
            {nextStepLabels[currentStep]}
            {!isLastStep && (
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

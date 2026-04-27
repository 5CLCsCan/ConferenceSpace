"use client"

import { Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

interface WizardActionBarProps {
  currentStep: number
  totalSteps: number
  nextStepLabel?: string
  previousStepLabel?: string
  onCancel: () => void
  onSaveDraft: () => void
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  onOpenTemplate?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
  saveDraftLabel?: string
  submitLabel?: string
  submittingLabel?: string
}

export function WizardActionBar({
  currentStep,
  totalSteps,
  nextStepLabel,
  previousStepLabel,
  onCancel,
  onSaveDraft,
  onNext,
  onPrevious,
  onSubmit,
  onOpenTemplate,
  isSubmitting = false,
  canSubmit = true,
  saveDraftLabel,
  submitLabel,
  submittingLabel,
}: WizardActionBarProps) {
  const { t } = useTranslation()
  const isLastStep = currentStep === totalSteps

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Return Button */}
          <button
            type="button"
            onClick={onCancel}
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
            {t("runtime.components.wizard.creation.wizard-action-bar.text_back")}{" "}
          </button>

          {onOpenTemplate && (
            <button
              type="button"
              onClick={onOpenTemplate}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider"
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
                library_books
              </span>
              {t("runtime.components.wizard.creation.wizard-action-bar.text_template")}
            </button>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider"
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
            {saveDraftLabel ||
              t("runtime.components.wizard.creation.wizard-action-bar.text_save_draft")}{" "}
          </button>

          {/* Previous Step Button */}
          {currentStep > 1 && (
            <button
              type="button"
              onClick={onPrevious}
              className="flex items-center gap-1.5 h-9 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-[10px] font-medium shadow-sm transition-all uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              {previousStepLabel ||
                t("runtime.components.wizard.creation.wizard-layout.text_previous")}
            </button>
          )}

          {/* Next / Submit Button */}
          {isLastStep ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] text-white rounded-md text-[10px] font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {submittingLabel ||
                    t("runtime.components.wizard.creation.wizard-action-bar.text_creating")}{" "}
                </>
              ) : (
                <>
                  {submitLabel ||
                    t(
                      "runtime.components.wizard.creation.wizard-action-bar.text_create_conference",
                    )}{" "}
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
                    check
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#1B3C53] hover:bg-[#234C6A] text-white rounded-md text-[10px] font-medium shadow-md transition-all uppercase tracking-wider"
            >
              {nextStepLabel || t("runtime.components.wizard.creation.wizard-layout.text_next")}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

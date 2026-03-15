"use client"

import { ReactNode } from "react"
import { WizardSidebar } from "./wizard-sidebar"
import { WizardActionBar } from "./wizard-action-bar"
import { WIZARD_STEPS } from "./types"

interface WizardLayoutProps {
  children: ReactNode
  currentStep: number
  maxStepReached: number
  onStepClick: (step: number) => void
  onCancel: () => void
  onSaveDraft: () => void
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
  saveDraftLabel?: string
  submitLabel?: string
  submittingLabel?: string
  onLogoClick?: (e: React.MouseEvent) => void
}

const STEP_NEXT_LABELS: Record<number, string> = {
  1: "Next: Topics",
  2: "Next: Policy",
  3: "Next: CFP",
  4: "Next: Committees",
  5: "Next: Final Review",
}

const STEP_PREVIOUS_LABELS: Partial<Record<number, string>> = {
  2: "Previous: Basic",
  3: "Previous: Topics",
  4: "Previous: Policy",
  5: "Previous: CFP",
  6: "Previous: Committees",
}

export function WizardLayout({
  children,
  currentStep,
  maxStepReached,
  onStepClick,
  onCancel,
  onSaveDraft,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
  saveDraftLabel,
  submitLabel,
  submittingLabel,
  onLogoClick,
}: WizardLayoutProps) {
  return (
    <div className="font-[Inter] bg-[#f8fafc] dark:bg-[#191919] text-[#141414] dark:text-white flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <WizardSidebar
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onStepClick={onStepClick}
          maxStepReached={maxStepReached}
          onLogoClick={onLogoClick}
        />

        {/* Main Content Area Wrapper */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <main className="flex-1 h-full overflow-y-auto bg-[#f8fafc] dark:bg-[#191919] scroll-smooth py-6 md:py-8 px-8 md:px-12">
            <div className="w-full pb-20">{children}</div>
          </main>

          {/* Action Bar */}
          <WizardActionBar
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            nextStepLabel={STEP_NEXT_LABELS[currentStep]}
            previousStepLabel={STEP_PREVIOUS_LABELS[currentStep]}
            onCancel={onCancel}
            onSaveDraft={onSaveDraft}
            onNext={onNext}
            onPrevious={onPrevious}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            saveDraftLabel={saveDraftLabel}
            submitLabel={submitLabel}
            submittingLabel={submittingLabel}
          />
        </div>
      </div>
    </div>
  )
}

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
}

const STEP_NEXT_LABELS: Record<number, string> = {
  1: "Next: Topics",
  2: "Next: Committees",
  3: "Next: Review Policy",
  4: "Next: Final Review",
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
}: WizardLayoutProps) {
  return (
    <div className="font-[Inter] bg-white dark:bg-slate-950 text-[#141414] dark:text-white flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <WizardSidebar
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onStepClick={onStepClick}
          maxStepReached={maxStepReached}
        />

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-black/20 scroll-smooth py-6 md:py-8 px-8 md:px-12">
          <div className="w-full">{children}</div>
        </main>

        {/* Action Bar */}
        <WizardActionBar
          currentStep={currentStep}
          totalSteps={WIZARD_STEPS.length}
          nextStepLabel={STEP_NEXT_LABELS[currentStep]}
          onCancel={onCancel}
          onSaveDraft={onSaveDraft}
          onNext={onNext}
          onPrevious={onPrevious}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
        />
      </div>
    </div>
  )
}

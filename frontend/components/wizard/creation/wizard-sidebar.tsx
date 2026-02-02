"use client"

import { WizardStepper } from "./wizard-stepper"
import { WizardStep } from "./types"

interface WizardSidebarProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick: (step: number) => void
  maxStepReached: number
}

export function WizardSidebar({
  steps,
  currentStep,
  onStepClick,
  maxStepReached,
}: WizardSidebarProps) {
  return (
    <aside className="hidden lg:flex w-[240px] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-y-auto z-10 pt-6">
      {/* Logo */}
      <div className="px-4 mb-2">
        <div className="flex items-center gap-2 mb-6 text-[#141414] dark:text-white">
          <div className="size-7 flex items-center justify-center bg-[#1B3C53] text-white rounded-lg">
            <span className="material-symbols-outlined text-[14px]">domain</span>
          </div>
          <h2 className="text-[#141414] dark:text-white text-sm font-bold leading-tight tracking-tight">
            ConferenceSpace
          </h2>
        </div>
      </div>

      {/* Wizard Header */}
      <div className="px-4">
        <div className="flex flex-col mb-6">
          <h1 className="text-[#1B3C53] dark:text-white text-sm font-bold leading-[1.2] tracking-tight">
            Creation Wizard
          </h1>
          <p className="text-slate-400 text-[10px] font-medium">New Conference Setup</p>
        </div>

        {/* Steps */}
        <WizardStepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={onStepClick}
          maxStepReached={maxStepReached}
        />
      </div>
    </aside>
  )
}

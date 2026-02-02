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
    <aside className="hidden lg:flex w-[240px] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-y-auto z-10">
      {/* Logo */}
      <div className="px-5 pt-8 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#141414] text-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10 w-9 h-9">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold tracking-tight text-[#141414] dark:text-white">
              ConferenceSpace
            </h1>
          </div>
        </div>
      </div>

      {/* Wizard Header */}
      <div className="px-4">
        <div className="flex flex-col mb-6">
          <h1 className="text-[#1B3C53] dark:text-white text-sm font-bold leading-[1.2] tracking-tight">
            Create New Conference
          </h1>
          <p className="text-slate-400 text-[10px] font-medium">Follow through all steps to publish a new conference</p>
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

"use client"

import { WizardStep } from "./types"

interface WizardStepperProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick: (step: number) => void
  maxStepReached: number
}

export function WizardStepper({
  steps,
  currentStep,
  onStepClick,
  maxStepReached,
}: WizardStepperProps) {
  return (
    <div className="relative flex flex-col gap-0.5">
      {steps.map((step, index) => {
        const isActive = currentStep === step.number
        const isLast = index === steps.length - 1

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(step.number)}
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
  )
}

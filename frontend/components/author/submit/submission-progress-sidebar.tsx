"use client"

import type { StepType } from "./types"

interface SubmissionProgressSidebarProps {
  currentStep: StepType
  onStepChange: (step: StepType) => void
}

const steps = [
  {
    id: "paper" as StepType,
    label: "Paper Details",
    description: "Title, abstract, keywords",
  },
  {
    id: "authors" as StepType,
    label: "Authors & Affiliations",
    description: "Add co-authors",
  },
  {
    id: "file" as StepType,
    label: "Upload Manuscript",
    description: "PDF and materials",
  },
  {
    id: "coi" as StepType,
    label: "Conflicts of Interest",
    description: "Declare conflicts",
  },
  {
    id: "review" as StepType,
    label: "Review & Submit",
    description: "Final check",
  },
]

export function SubmissionProgressSidebar({
  currentStep,
  onStepChange,
}: SubmissionProgressSidebarProps) {
  return (
    <aside className="hidden lg:flex w-[280px] flex-col border-r border-[#ededed] dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] h-full overflow-y-auto">
      <div className="p-6">
        {/* Logo in Sidebar */}
        <div className="flex items-center gap-3 text-primary dark:text-white mb-10">
          <div className="size-8 flex items-center justify-center bg-primary text-white rounded-lg">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </div>
          <h2 className="text-primary dark:text-white text-lg font-bold leading-tight tracking-tight">
            ConferenceSpace
          </h2>
        </div>

        <div className="flex flex-col mb-8">
          <h1 className="text-primary dark:text-white text-lg font-bold leading-normal">
            Submission Progress
          </h1>
          <p className="text-neutral-500 text-sm font-normal">ID: #4921</p>
        </div>

        <div className="relative flex flex-col gap-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`group flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                currentStep === step.id
                  ? "bg-primary/5 dark:bg-white/5 border border-transparent"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 opacity-60 hover:opacity-100"
              }`}
              onClick={() => onStepChange(step.id)}
            >
              <div className="flex flex-col items-center gap-2 mt-1">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    currentStep === step.id
                      ? "text-primary dark:text-white icon-filled"
                      : "text-neutral-400"
                  }`}
                >
                  {currentStep === step.id ? "radio_button_checked" : "radio_button_unchecked"}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-px h-full bg-neutral-200 dark:bg-neutral-700 min-h-[24px]" />
                )}
              </div>
              <div className={index < steps.length - 1 ? "pb-4" : ""}>
                <p
                  className={`text-sm leading-tight ${
                    currentStep === step.id
                      ? "text-primary dark:text-white font-bold"
                      : "text-primary dark:text-white font-medium"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-neutral-500 text-xs mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-[#ededed] dark:border-neutral-800">
        <div className="flex items-center gap-3 text-neutral-500 text-xs">
          <span className="material-symbols-outlined text-lg">help</span>
          <span>Need help? View Guidelines</span>
        </div>
      </div>
    </aside>
  )
}

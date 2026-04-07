"use client"

import { ReactNode, useMemo } from "react"
import { WizardSidebar } from "./wizard-sidebar"
import { WizardActionBar } from "./wizard-action-bar"
import { WIZARD_STEPS } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"

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
  onOpenTemplate?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
  saveDraftLabel?: string
  submitLabel?: string
  submittingLabel?: string
  onLogoClick?: (e: React.MouseEvent) => void
}

function getWizardStepTitle(stepId: string, t: ReturnType<typeof useTranslation>["t"]) {
  switch (stepId) {
    case "basic-details":
      return t("runtime.components.wizard.creation.types.title_basic_details")
    case "topics-deadlines":
      return t("runtime.components.wizard.creation.types.title_topics_deadlines")
    case "policy-guidelines":
      return t("runtime.components.wizard.creation.types.title_policy_guidelines")
    case "call-for-papers":
      return t("runtime.components.wizard.creation.types.title_call_for_papers")
    case "committees":
      return t("runtime.components.wizard.creation.types.title_committees")
    case "final-review":
      return t("runtime.components.wizard.creation.types.title_final_review")
    default:
      return t("runtime.components.wizard.creation.types.title_basic_details")
  }
}

function getWizardStepDescription(stepId: string, t: ReturnType<typeof useTranslation>["t"]) {
  switch (stepId) {
    case "basic-details":
      return t("runtime.components.wizard.creation.types.description_name_acronym_dates")
    case "topics-deadlines":
      return t("runtime.components.wizard.creation.types.description_scope_timeline")
    case "policy-guidelines":
      return t("runtime.components.wizard.creation.types.description_format_rules")
    case "call-for-papers":
      return t("runtime.components.wizard.creation.types.description_cfp_content")
    case "committees":
      return t("runtime.components.wizard.creation.types.description_add_members")
    case "final-review":
      return t("runtime.components.wizard.creation.types.description_publish_conference")
    default:
      return t("runtime.components.wizard.creation.types.description_name_acronym_dates")
  }
}

function getNextStepLabel(currentStep: number, t: ReturnType<typeof useTranslation>["t"]) {
  switch (currentStep) {
    case 1:
      return t("runtime.components.wizard.creation.wizard-layout.text_next_topics")
    case 2:
      return t("runtime.components.wizard.creation.wizard-layout.text_next_policy")
    case 3:
      return t("runtime.components.wizard.creation.wizard-layout.text_next_cfp")
    case 4:
      return t("runtime.components.wizard.creation.wizard-layout.text_next_committees")
    case 5:
      return t("runtime.components.wizard.creation.wizard-layout.text_next_final_review")
    default:
      return undefined
  }
}

function getPreviousStepLabel(currentStep: number, t: ReturnType<typeof useTranslation>["t"]) {
  switch (currentStep) {
    case 2:
      return t("runtime.components.wizard.creation.wizard-layout.text_previous_basic")
    case 3:
      return t("runtime.components.wizard.creation.wizard-layout.text_previous_topics")
    case 4:
      return t("runtime.components.wizard.creation.wizard-layout.text_previous_policy")
    case 5:
      return t("runtime.components.wizard.creation.wizard-layout.text_previous_cfp")
    case 6:
      return t("runtime.components.wizard.creation.wizard-layout.text_previous_committees")
    default:
      return undefined
  }
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
  onOpenTemplate,
  isSubmitting = false,
  canSubmit = true,
  saveDraftLabel,
  submitLabel,
  submittingLabel,
  onLogoClick,
}: WizardLayoutProps) {
  const { t } = useTranslation()
  const wizardSteps = useMemo(
    () =>
      WIZARD_STEPS.map((step) => ({
        number: step.number,
        id: step.id,
        title: getWizardStepTitle(step.id, t),
        description: getWizardStepDescription(step.id, t),
      })),
    [t],
  )

  return (
    <div className="font-[Inter] bg-[#f8fafc] dark:bg-[#191919] text-[#141414] dark:text-white flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <WizardSidebar
          steps={wizardSteps}
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
            totalSteps={wizardSteps.length}
            nextStepLabel={getNextStepLabel(currentStep, t)}
            previousStepLabel={getPreviousStepLabel(currentStep, t)}
            onCancel={onCancel}
            onSaveDraft={onSaveDraft}
            onNext={onNext}
            onPrevious={onPrevious}
            onSubmit={onSubmit}
            onOpenTemplate={onOpenTemplate}
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

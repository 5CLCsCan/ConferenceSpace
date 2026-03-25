"use client"

import Link from "next/link"
import { WizardStepper } from "./wizard-stepper"
import { WizardStep } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { ROUTES } from "@/lib/routes"

interface WizardSidebarProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick: (step: number) => void
  maxStepReached: number
  onLogoClick?: (e: React.MouseEvent) => void
}

export function WizardSidebar({
  steps,
  currentStep,
  onStepClick,
  maxStepReached,
  onLogoClick,
}: WizardSidebarProps) {
  const { t } = useTranslation()
  const { currentRole } = useAuth()

  const dashboardHref = currentRole
    ? (ROUTES.ROLE_ROUTE_MAP[currentRole] ?? ROUTES.ROLE_SELECT)
    : ROUTES.ROLE_SELECT

  return (
    <aside className="hidden lg:flex w-[240px] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full overflow-y-auto z-10">
      {/* Logo */}
      <Link
        href={dashboardHref}
        onClick={onLogoClick}
        className="px-5 pt-8 pb-8 transition-opacity hover:opacity-80 block group"
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-[#141414] text-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10 w-9 h-9 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold tracking-tight text-[#141414] dark:text-white">
              {t("runtime.components.wizard.creation.wizard-sidebar.text_conferencespace")}{" "}
            </h1>
          </div>
        </div>
      </Link>

      {/* Wizard Header */}
      <div className="px-4">
        <div className="flex flex-col mb-6">
          <h1 className="text-[#1B3C53] dark:text-white text-sm font-bold leading-[1.2] tracking-tight">
            {t("runtime.components.wizard.creation.wizard-sidebar.text_create_new_conference")}{" "}
          </h1>
          <p className="text-slate-400 text-[10px] font-medium">
            {t(
              "runtime.components.wizard.creation.wizard-sidebar.text_follow_through_all_steps_to_publish",
            )}
          </p>
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

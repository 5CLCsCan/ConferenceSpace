"use client"

import { ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "@/lib/i18n/translation-context"

interface WizardFormCardProps {
  title: string
  children: ReactNode
  tooltip?: string
}

export function WizardFormCard({ title, children, tooltip }: WizardFormCardProps) {
  const { t } = useTranslation()
  return (
    <div className="px-4 pt-4 pb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 w-full">
      {/* Card Header */}
      <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
            {title}
          </h3>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center size-4 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-help"
                  aria-label={t("runtime.components.wizard.creation.wizard-form-card.aria_label_more_information")}
                >
                  <span
                    className="material-symbols-outlined text-[12px] leading-none"
                    style={{
                      width: "16px",
                      height: "16px",
                      fontSize: "16px",
                    }}
                  >
                    help
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-[10px]">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Card Content */}
      {children}
    </div>
  )
}

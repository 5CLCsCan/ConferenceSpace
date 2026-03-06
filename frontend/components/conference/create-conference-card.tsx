"use client"

import { useTranslation } from "@/lib/i18n/translation-context"

interface CreateConferenceCardProps {
  onClick: () => void
}

export function CreateConferenceCard({ onClick }: CreateConferenceCardProps) {
  const { t } = useTranslation()
  return (
    <div
      onClick={onClick}
      className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#1B3C53] dark:hover:border-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 group flex flex-col h-full items-center justify-center p-6 cursor-pointer min-h-[340px]"
    >
      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-md">
        <span className="material-symbols-outlined text-[24px] text-slate-400 group-hover:text-[#1B3C53] dark:group-hover:text-white transition-colors">
          add
        </span>
      </div>
      <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-[#1B3C53] dark:group-hover:text-white mb-1 transition-colors tracking-tight">
        {t("runtime.components.conference.create-conference-card.text_create_new_conference")}{" "}</h3>
      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 text-center max-w-[160px] leading-relaxed">
        {t("runtime.components.conference.create-conference-card.text_start_managing_a_new_conference_workshop")}{" "}</p>
    </div>
  )
}

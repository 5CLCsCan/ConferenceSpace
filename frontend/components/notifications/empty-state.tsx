"use client"

import { BellOff } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

export function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-200/50 dark:border-neutral-700/50">
        <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
        {t("runtime.components.notifications.empty-state.text_you_apos_re_all_caught_up")}{" "}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
        {t("runtime.components.notifications.empty-state.text_no_new_notifications_at_the_moment")}{" "}</p>
    </div>
  )
}

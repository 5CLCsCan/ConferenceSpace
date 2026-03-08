"use client"

import type { TabType } from "./types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

interface EmptyStateProps {
  type: TabType
}

const content: Record<TabType, { icon: string; title: string; description: string }> = {
  "my-conferences": {
    icon: "folder_open",
    title: t("runtime.components.conference.empty-state.prop_title_no_conferences_yet"),
    description: t(
      "runtime.components.conference.empty-state.prop_description_create_your_first_conference_to_get",
    ),
  },
  explore: {
    icon: "explore",
    title: t("runtime.components.conference.empty-state.prop_title_no_conferences_to_explore"),
    description: t(
      "runtime.components.conference.empty-state.prop_description_there_are_no_public_conferences_available",
    ),
  },
  archived: {
    icon: "archive",
    title: t("runtime.components.conference.empty-state.prop_title_no_archived_conferences"),
    description: t(
      "runtime.components.conference.empty-state.prop_description_completed_conferences_will_appear_here_for",
    ),
  },
}

export function EmptyState({ type }: EmptyStateProps) {
  const { t } = useTranslation()
  const { icon, title, description } = content[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-[10px] font-medium text-slate-400 text-center max-w-xs">{description}</p>
    </div>
  )
}

export function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <span className="material-symbols-outlined text-[28px] text-slate-300 mb-2">search_off</span>
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1 tracking-tight">
        {t("runtime.components.conference.empty-state.text_no_results_found")}{" "}
      </h3>
      <p className="text-[10px] font-medium text-slate-400 text-center">
        {t("runtime.components.conference.empty-state.text_try_adjusting_your_search_terms")}{" "}
      </p>
    </div>
  )
}

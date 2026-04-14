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
  drafts: {
    icon: "note",
    title: t("runtime.components.conference.empty-state.prop_title_no_draft_conferences"),
    description: t(
      "runtime.components.conference.empty-state.prop_description_conferences_you_save_as_drafts_will_appear_here",
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
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="surface-card-quiet-strip mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-soft)]">
        <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
      </div>
      <h3 className="text-card-title mb-1">{title}</h3>
      <p className="text-supporting max-w-xs text-center">{description}</p>
    </div>
  )
}

export function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <span className="material-symbols-outlined mb-2 text-[40px] text-slate-300">search_off</span>
      <h3 className="text-card-title mb-1">
        {t("runtime.components.conference.empty-state.text_no_results_found")}{" "}
      </h3>
      <p className="text-supporting text-center">
        {t("runtime.components.conference.empty-state.text_try_adjusting_your_search_terms")}{" "}
      </p>
    </div>
  )
}

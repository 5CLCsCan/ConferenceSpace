"use client"

import type { ReviewMode } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

interface ReviewModeIndicatorProps {
  mode: ReviewMode
}

const MODE_CONFIG: Record<ReviewMode, { label: string; icon: string; description: string }> = {
  double_blind: {
    label: t(
      "runtime.components.shared.discussion.components.review-mode-indicator.prop_label_double_blind",
    ),
    icon: "visibility_off",
    description: t(
      "runtime.components.shared.discussion.components.review-mode-indicator.prop_description_author_and_reviewer_identities_are_hidden",
    ),
  },
  single_blind: {
    label: t(
      "runtime.components.shared.discussion.components.review-mode-indicator.prop_label_single_blind",
    ),
    icon: "person_off",
    description: t(
      "runtime.components.shared.discussion.components.review-mode-indicator.prop_description_author_identities_are_hidden_from_reviewers",
    ),
  },
  open: {
    label: t(
      "runtime.components.shared.discussion.components.review-mode-indicator.prop_label_open_review",
    ),
    icon: "visibility",
    description: t(
      "runtime.components.shared.discussion.components.review-mode-indicator.prop_description_all_identities_are_visible",
    ),
  },
}

export function ReviewModeIndicator({ mode }: ReviewModeIndicatorProps) {
  const { t } = useTranslation()
  const config = MODE_CONFIG[mode]
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md text-[10px] text-slate-600 font-medium"
      title={config.description}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: "16px",
          width: "16px",
          height: "16px",
          maxWidth: "16px",
          maxHeight: "16px",
          minWidth: "16px",
          minHeight: "16px",
          lineHeight: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transform: "none",
          boxSizing: "border-box",
        }}
      >
        {config.icon}
      </span>
      {config.label}
    </div>
  )
}

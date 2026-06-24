"use client"

import { STATUS_CONFIG } from "../config"
import { getResponseStatusLabel } from "../i18n"
import type { ResponseStatus, StatusBadgeProps } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { t } = useTranslation()
  const config = STATUS_CONFIG[status]
  const sizeClass = size === "sm" ? "text-[8px] px-2 py-0.5" : "text-[10px] px-2.5 py-1"
  const iconSize = size === "sm" ? "text-[10px]" : "text-[12px]"

  return (
    <span
      className={`inline-flex items-center gap-1 rounded ${config.bgColor} ${config.textColor} border ${config.borderColor} font-bold uppercase tracking-wider ${sizeClass}`}
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
      {getResponseStatusLabel(status, t)}
    </span>
  )
}

"use client"

import { PHASE_CONFIG, PHASE_DESCRIPTIONS_BY_ROLE } from "../config"
import type { PhaseHeaderProps } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"

export function PhaseHeader({ settings, userRole = "reviewer" }: PhaseHeaderProps) {
  const { t } = useTranslation()
  const phase = PHASE_CONFIG[settings.phase]
  const description = PHASE_DESCRIPTIONS_BY_ROLE[settings.phase][userRole]

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`material-symbols-outlined ${phase.color}`}
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
              {phase.icon}
            </span>
            <h2 className="text-card-header">{phase.label}</h2>
          </div>
          <p className="text-body max-w-xl leading-relaxed">{description}</p>
        </div>

        {/* Deadline Counter */}
        {settings.phase !== "finalized" && (
          <div className="badge-semantic-warning flex items-center gap-2 rounded-[var(--radius-button)] px-3 py-2">
            <span
              className="material-symbols-outlined text-amber-600"
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
              schedule
            </span>
            <div className="text-right">
              <div className="text-tiny-label text-amber-700">
                {t(
                  "runtime.components.shared.rebuttal.components.phase-header.text_response_deadline",
                )}{" "}
              </div>
              <div className="text-ui-meta font-[700] text-amber-700">
                {settings.daysRemaining}{" "}
                {t(
                  "runtime.components.shared.rebuttal.components.phase-header.text_days_remaining",
                )}{" "}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { PHASE_CONFIG, PHASE_DESCRIPTIONS_BY_ROLE } from "../config"
import type { PhaseHeaderProps } from "../types"

export function PhaseHeader({ settings, userRole = "reviewer" }: PhaseHeaderProps) {
  const phase = PHASE_CONFIG[settings.phase]
  const description = PHASE_DESCRIPTIONS_BY_ROLE[settings.phase][userRole]

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`material-symbols-outlined text-[16px] ${phase.color}`}>
              {phase.icon}
            </span>
            <h2 className="text-sm font-bold text-[#1B3C53] tracking-tight">{phase.label}</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{description}</p>
        </div>

        {/* Deadline Counter */}
        {settings.phase !== "finalized" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="material-symbols-outlined text-[14px] text-amber-600">schedule</span>
            <div className="text-right">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Response Deadline
              </div>
              <div className="text-[11px] font-medium text-amber-600">
                {settings.daysRemaining} days remaining
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

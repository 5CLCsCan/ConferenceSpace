"use client"

import { useState } from "react"

import type { ReviewerResponseGroupProps, ResponseStatus } from "../types"
import { PointCard } from "./point-card"
import { useTranslation } from "@/lib/i18n/translation-context"

export function ReviewerResponseGroup({
  reviewer,
  points,
  userRole,
  onPointStatusChange,
  defaultExpanded,
  readOnly = false,
}: ReviewerResponseGroupProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded ?? reviewer.isCurrentUser)
  const pendingCount = points.filter((p) => p.status === "pending_review").length
  const addressedCount = points.filter((p) => p.status === "addressed").length

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          reviewer.isCurrentUser
            ? "bg-[#1B3C53]/5 hover:bg-[#1B3C53]/10"
            : "bg-slate-50/80 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
              reviewer.isCurrentUser ? "bg-[#1B3C53] text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {reviewer.anonymousId.replace("Reviewer #", "R")}
          </div>
          <div className="text-left">
            <div className="text-[12px] font-bold text-slate-700">
              {reviewer.isCurrentUser ? "Your Comments" : `Response to ${reviewer.anonymousId}`}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-slate-500">{points.length} points</span>
              {pendingCount > 0 && reviewer.isCurrentUser && (
                <span className="text-[8px] font-bold text-[#1B3C53] bg-[#1B3C53]/10 px-1.5 py-0.5 rounded">
                  {pendingCount}{" "}
                  {t(
                    "runtime.components.shared.rebuttal.components.reviewer-response-group.text_need_review",
                  )}{" "}
                </span>
              )}
              {addressedCount === points.length && (
                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {t(
                    "runtime.components.shared.rebuttal.components.reviewer-response-group.text_all_addressed",
                  )}{" "}
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-slate-400"
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
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Points */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
          {points.map((point) => (
            <PointCard
              key={point.id}
              point={point}
              reviewer={reviewer}
              userRole={userRole}
              onMarkStatus={(status) => onPointStatusChange(point.id, status)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"

import { ATTACHMENT_TYPE_CONFIG } from "../config"
import type { GeneralResponseSectionProps } from "../types"
import { useTranslation } from "@/lib/i18n/translation-context"

export function GeneralResponseSection({
  submission,
  userRole = "reviewer",
  defaultExpanded = true,
}: GeneralResponseSectionProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
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
            format_quote
          </span>
          <h3 className="text-sm font-bold text-[#141414] tracking-tight">
            {t(
              "runtime.components.shared.rebuttal.components.general-response-section.text_general_response",
            )}
          </h3>
          <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500">
            {submission.generalResponse.wordCount} words
          </span>
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

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-4">
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {submission.generalResponse.content}
          </div>

          {/* Attachments */}
          {submission.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t(
                  "runtime.components.shared.rebuttal.components.general-response-section.text_attachments",
                )}{" "}
              </div>
              <div className="space-y-2">
                {submission.attachments.map((att) => {
                  const typeConfig =
                    ATTACHMENT_TYPE_CONFIG[att.type] || ATTACHMENT_TYPE_CONFIG.supplementary
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <div
                        className={`p-1.5 rounded ${typeConfig.bgColor} ${typeConfig.textColor}`}
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
                          {typeConfig.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-700 truncate">
                            {att.name}
                          </span>
                          {att.version && (
                            <span className="text-[8px] font-bold text-slate-400 bg-slate-200 px-1 py-0.5 rounded">
                              {att.version}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {att.size} - {att.uploadedAt}
                        </span>
                      </div>
                      <button className="h-6 px-2 text-[9px] font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors">
                        {t(
                          "runtime.components.shared.rebuttal.components.general-response-section.text_download",
                        )}{" "}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

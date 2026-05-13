"use client"

import { useState } from "react"
import { type SuggestionMetadata } from "@/lib/api/suggestions"
import { useTranslation } from "@/lib/i18n/translation-context"

interface SuggestionDetailProps {
  metadata: SuggestionMetadata | null
  assignmentCount: number
  score: number
}

function KeywordTag({
  keyword,
  variant,
}: {
  keyword: string
  variant: "matched" | "paper" | "reviewer"
}) {
  const styles = {
    matched: "bg-green-100 text-green-700 border-green-200",
    paper: "bg-slate-100 text-slate-600 border-slate-200",
    reviewer: "bg-slate-100 text-slate-500 border-slate-200",
  }

  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border ${styles[variant]}`}
    >
      {keyword}
    </span>
  )
}

function sourceLabel(source: string, t: (key: string) => string): string {
  switch (source) {
    case "auto_pass1":
      return t(
        "runtime.components.chair.conference-detail.suggestion-detail.text_auto_assign_pass_1",
      )
    case "auto_pass2":
      return t(
        "runtime.components.chair.conference-detail.suggestion-detail.text_auto_assign_pass_2_fallback",
      )
    case "manual":
      return t("runtime.components.chair.conference-detail.suggestion-detail.text_manual")
    default:
      return source
  }
}

function coiStatusLabel(
  status: string,
  t: (key: string) => string,
): { text: string; className: string } {
  switch (status) {
    case "passed":
      return {
        text: t("runtime.components.chair.conference-detail.suggestion-detail.text_passed"),
        className: "text-green-700",
      }
    case "skipped_neo4j_unavailable":
      return {
        text: t(
          "runtime.components.chair.conference-detail.suggestion-detail.text_skipped_graph_database_unavailable",
        ),
        className: "text-amber-600",
      }
    case "conflict_detected":
      return {
        text: t(
          "runtime.components.chair.conference-detail.suggestion-detail.text_conflict_detected",
        ),
        className: "text-red-600",
      }
    default:
      return { text: status, className: "text-slate-600" }
  }
}

function coiCheckLabel(key: string, t: (key: string) => string): string {
  switch (key) {
    case "self_author":
      return t(
        "runtime.components.chair.conference-detail.suggestion-detail.text_self_author_check",
      )
    case "declared_conflicts":
      return t(
        "runtime.components.chair.conference-detail.suggestion-detail.text_declared_conflicts_check",
      )
    case "relationship":
      return t(
        "runtime.components.chair.conference-detail.suggestion-detail.text_relationship_check",
      )
    default:
      return key
  }
}

export function SuggestionDetail({ metadata, assignmentCount, score }: SuggestionDetailProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useTranslation()
  const T = (key: string, values?: Record<string, string | number>) =>
    t(`runtime.components.chair.conference-detail.suggestion-detail.${key}`, values)

  if (!metadata) {
    return (
      <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg">
        <p className="text-[10px] text-slate-400">{T("text_detailed_breakdown_not_available")}</p>
      </div>
    )
  }

  const matchedKeywords = metadata.matched_keywords || []
  const unmatchedPaperKeywords = metadata.unmatched_paper_keywords || []
  const extraReviewerKeywords = metadata.extra_reviewer_keywords || []
  const coiChecks = metadata.coi_checks || {}

  return (
    <div className="mt-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span
          className="material-symbols-outlined transition-transform duration-200"
          style={{ fontSize: "14px", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
        {T("text_match_details")}
      </button>

      {!collapsed && (
        <div className="mt-1.5 px-3 py-2.5 bg-slate-50 rounded-lg space-y-3">
          {/* Score Breakdown */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {T("text_score_breakdown")}
            </p>
            {matchedKeywords.length === 0 &&
            unmatchedPaperKeywords.length === 0 &&
            extraReviewerKeywords.length === 0 ? (
              <p className="text-[10px] text-slate-500">{T("text_no_keyword_data_available")}</p>
            ) : (
              <div className="space-y-1.5">
                {matchedKeywords.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 mr-1.5">
                      {T("text_matched")}
                    </span>
                    <span className="inline-flex flex-wrap gap-1">
                      {matchedKeywords.map((kw) => (
                        <KeywordTag key={kw} keyword={kw} variant="matched" />
                      ))}
                    </span>
                  </div>
                )}
                {unmatchedPaperKeywords.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 mr-1.5">
                      {T("text_paper_only")}
                    </span>
                    <span className="inline-flex flex-wrap gap-1">
                      {unmatchedPaperKeywords.map((kw) => (
                        <KeywordTag key={kw} keyword={kw} variant="paper" />
                      ))}
                    </span>
                  </div>
                )}
                {extraReviewerKeywords.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 mr-1.5">
                      {T("text_reviewer_only")}
                    </span>
                    <span className="inline-flex flex-wrap gap-1">
                      {extraReviewerKeywords.map((kw) => (
                        <KeywordTag key={kw} keyword={kw} variant="reviewer" />
                      ))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Match Reasons */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {T("text_match_reasons")}
            </p>
            <div className="space-y-0.5">
              {metadata.source === "manual" ? (
                <p className="text-[10px] text-amber-600 font-medium">
                  {T("text_manually_added_by_chair")}
                </p>
              ) : (
                <>
                  {matchedKeywords.length > 0 && (
                    <p className="text-[10px] text-slate-600">
                      <span className="font-medium text-green-700">
                        {T("text_shares_keywords", { count: matchedKeywords.length })}
                      </span>{" "}
                      {matchedKeywords.join(", ")}
                    </p>
                  )}
                  {matchedKeywords.length === 0 && metadata.source === "auto_pass1" && (
                    <p className="text-[10px] text-slate-500">{T("text_no_keyword_overlap")}</p>
                  )}
                  {metadata.source === "auto_pass2" && (
                    <p className="text-[10px] text-amber-600 font-medium">
                      {T("text_fallback_assignment")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* COI Status */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {T("text_coi_status")}
            </p>
            <div className="space-y-0.5">
              {Object.entries(coiChecks).map(([key, status]) => {
                const label = coiCheckLabel(key, t)
                const statusInfo = coiStatusLabel(status, t)
                return (
                  <p key={key} className="text-[10px] text-slate-600">
                    {label}:{" "}
                    <span className={`font-medium ${statusInfo.className}`}>{statusInfo.text}</span>
                  </p>
                )
              })}
            </div>
          </div>

          {/* Reviewer Load */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {T("text_reviewer_load")}
            </p>
            <p className="text-[10px] text-slate-600">
              {T("text_assigned_in_this_conference", { count: assignmentCount })}
            </p>
          </div>

          {/* Source Footer */}
          <div className="pt-1.5 border-t border-slate-200">
            <p className="text-[10px] text-slate-400">
              {T("text_source")} {sourceLabel(metadata.source, t)}
              {metadata.created_at && (
                <>
                  {" "}
                  ·{" "}
                  {new Date(metadata.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

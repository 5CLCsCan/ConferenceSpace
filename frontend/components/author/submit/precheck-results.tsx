"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { PrecheckResult } from "@/lib/types"

export type PreCheckResult = PrecheckResult

interface PreCheckResultsProps {
  result: PreCheckResult
}

export function PreCheckResults({ result }: PreCheckResultsProps) {
  const { t } = useTranslation()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    // Auto-expand failed categories by default
    const failedCats = new Set<string>()
    result.detailed_results.forEach((r) => {
      if (r.status === "fail") failedCats.add(r.category)
    })
    return failedCats
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(category) ? next.delete(category) : next.add(category)
      return next
    })
  }

  const passedResults = result.detailed_results.filter((r) => r.status === "pass")
  const warningResults = result.detailed_results.filter((r) => r.status === "warning")
  const failedResults = result.detailed_results.filter((r) => r.status === "fail")

  const categoryNames: Record<string, string> = {
    title_abstract: t("dashboard.author.submit.precheck.categories.titleAbstract"),
    introduction: t("dashboard.author.submit.precheck.categories.introduction"),
    method: t("dashboard.author.submit.precheck.categories.method"),
    experiments: t("dashboard.author.submit.precheck.categories.experiments"),
    writing_quality: t("dashboard.author.submit.precheck.categories.writingQuality"),
    pre_submission: t("dashboard.author.submit.precheck.categories.preSubmission"),
    scope_match: t("dashboard.author.submit.precheck.categories.scopeMatch"),
    deterministic: "Deterministic",
  }

  const failedByCategory = failedResults.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof failedResults>,
  )

  const warningsByCategory = warningResults.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof warningResults>,
  )

  const overallScore = Math.round(result.overall_score)
  const passRate = Math.round(result.summary.pass_rate * 100)
  const isDeskReject = result.decision === "desk_reject"
  const isAccepted = result.decision === "accept_for_review"

  const decisionConfig = isDeskReject
    ? {
        label: t("dashboard.author.submit.precheck.decision.deskReject"),
        bg: "bg-red-50",
        text: "text-red-600",
        border: "border-red-200",
        barColor: "bg-red-500",
      }
    : isAccepted
      ? {
          label: t("dashboard.author.submit.precheck.decision.acceptForReview"),
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          border: "border-emerald-200",
          barColor: "bg-emerald-500",
        }
      : {
          label: t("dashboard.author.submit.precheck.decision.manualReview"),
          bg: "bg-amber-50",
          text: "text-amber-600",
          border: "border-amber-200",
          barColor: "bg-amber-500",
        }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-[#1B3C53] dark:text-slate-300">
              fact_check
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white leading-[1.2] tracking-tight">
                {t("dashboard.author.submit.precheck.title")}
              </h3>
              {result.paper_title && (
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[320px]">
                  {result.paper_title}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-[#1B3C53] dark:text-white tabular-nums">
              {overallScore}%
            </span>
            <span
              className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${decisionConfig.bg} ${decisionConfig.text} border ${decisionConfig.border}`}
            >
              {decisionConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row + pass rate */}
      <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
              {result.summary.passed}{" "}
              <span className="text-slate-400 dark:text-slate-500">
                {t("dashboard.author.submit.precheck.summary.passed")}
              </span>
            </span>
          </div>
          {warningResults.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                {warningResults.length}{" "}
                <span className="text-slate-400 dark:text-slate-500">
                  {t("dashboard.author.submit.precheck.summary.warnings")}
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-red-500" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
              {result.summary.failed}{" "}
              <span className="text-slate-400 dark:text-slate-500">
                {t("dashboard.author.submit.precheck.summary.failed")}
              </span>
            </span>
          </div>
        </div>
        {/* Pass rate bar */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
            {t("dashboard.author.submit.precheck.summary.passRate")}
          </span>
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${decisionConfig.barColor}`}
              style={{ width: `${passRate}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            {passRate}%
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(result.category_scores).length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
            {t("dashboard.author.submit.precheck.categoryScores")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Object.entries(result.category_scores).map(([category, scores]) => {
              const catScore = Math.round(scores.score)
              const isFailing = catScore < 50
              return (
                <div
                  key={category}
                  className="px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30"
                >
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1 truncate">
                    {categoryNames[category] || category}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-xs font-bold tabular-nums ${isFailing ? "text-red-600" : "text-[#1B3C53] dark:text-white"}`}
                    >
                      {catScore}%
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 tabular-nums">
                      {scores.passed}
                      <span className="text-emerald-500">P</span>
                      {scores.failed > 0 && (
                        <>
                          {" / "}
                          {scores.failed}
                          <span className="text-red-500">F</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Passed Checks */}
      {passedResults.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            {t("dashboard.author.submit.precheck.whatsGood")} ({passedResults.length})
          </p>
          <div className="space-y-1.5">
            {passedResults.map((item) => (
              <div
                key={item.item_id}
                className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20"
              >
                <span className="material-symbols-outlined text-[14px] text-emerald-500 mt-px shrink-0">
                  check_circle
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#141414] dark:text-white leading-snug">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                    {item.details}
                  </p>
                </div>
                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
                  {t("dashboard.author.submit.precheck.status.pass")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Checks */}
      {warningResults.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
            {t("dashboard.author.submit.precheck.needsAttention")} ({warningResults.length})
          </p>
          {Object.entries(warningsByCategory).map(([category, items]) => (
            <div key={category} className="mb-2 last:mb-0">
              <button
                type="button"
                onClick={() => toggleCategory(`warn-${category}`)}
                className="w-full flex items-center justify-between py-1.5 text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">
                    folder_open
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {categoryNames[category] || category}{" "}
                    <span className="font-medium text-slate-400">({items.length})</span>
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[14px] text-slate-400 transition-transform duration-200 ${expandedCategories.has(`warn-${category}`) ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${expandedCategories.has(`warn-${category}`) ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-1.5 pl-5 pt-1">
                  {items.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border-l-2 border-amber-300 dark:border-amber-700"
                    >
                      <span className="material-symbols-outlined text-[14px] text-amber-500 mt-px shrink-0">
                        warning
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#141414] dark:text-white leading-snug">
                          {item.description}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                          {item.details}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                          {t("dashboard.author.submit.precheck.confidence")}:{" "}
                          {Math.round(item.confidence * 100)}%
                        </p>
                      </div>
                      <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 shrink-0">
                        {t("dashboard.author.submit.precheck.status.warning")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Failed Checks */}
      {failedResults.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">
            {t("dashboard.author.submit.precheck.whatsFixed")} ({failedResults.length})
          </p>
          {Object.entries(failedByCategory).map(([category, items]) => (
            <div key={category} className="mb-2 last:mb-0">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between py-1.5 text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">
                    folder_open
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {categoryNames[category] || category}{" "}
                    <span className="font-medium text-slate-400">({items.length})</span>
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[14px] text-slate-400 transition-transform duration-200 ${expandedCategories.has(category) ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${expandedCategories.has(category) ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-1.5 pl-5 pt-1">
                  {items.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-red-50/30 dark:bg-red-900/10 border-l-2 border-red-300 dark:border-red-700"
                    >
                      <span className="material-symbols-outlined text-[14px] text-red-500 mt-px shrink-0">
                        cancel
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#141414] dark:text-white leading-snug">
                          {item.description}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                          {item.details}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                          {t("dashboard.author.submit.precheck.confidence")}:{" "}
                          {Math.round(item.confidence * 100)}%
                        </p>
                      </div>
                      <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 shrink-0">
                        {t("dashboard.author.submit.precheck.status.fail")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

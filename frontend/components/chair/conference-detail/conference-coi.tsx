"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  getAllCOIRelationships,
  getCOIDashboardStats,
  rebuildCOIRelationships,
  type COIRelationship,
} from "@/lib/api/coi"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceCOIProps {
  conferenceId: string
  className?: string
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn("rounded-lg border bg-white p-4", className)}>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1B3C53]">{value}</p>
    </div>
  )
}

const PAGE_SIZE = 8

export function ConferenceCOI({ conferenceId, className }: ConferenceCOIProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<{
    totalConflicts: number
    pendingReview: number
    autoDetected: number
    orphanedPapers: number
  }>({
    totalConflicts: 0,
    pendingReview: 0,
    autoDetected: 0,
    orphanedPapers: 0,
  })
  const [relationships, setRelationships] = useState<COIRelationship[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [severity, setSeverity] = useState<"" | "high" | "medium" | "low">("")

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSeverityChange = (value: "" | "high" | "medium" | "low") => {
    setSeverity(value)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push("ellipsis")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    return pages
  }
  const [rebuilding, setRebuilding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const numericConferenceId = Number(conferenceId)

  useEffect(() => {
    async function loadCOI() {
      if (!Number.isFinite(numericConferenceId)) {
        setError("Invalid conference id")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [statsResponse, relationshipsResponse] = await Promise.all([
          getCOIDashboardStats(numericConferenceId),
          getAllCOIRelationships({
            conference_id: numericConferenceId,
            severity: severity || undefined,
            search: searchQuery || undefined,
            limit: PAGE_SIZE,
            page: currentPage,
          }),
        ])

        setStats({
          totalConflicts: statsResponse.total_relationships || statsResponse.coi_detected || 0,
          pendingReview: statsResponse.coi_detected || 0,
          autoDetected: statsResponse.coi_detected || 0,
          orphanedPapers: 0,
        })
        setRelationships(relationshipsResponse.relationships || [])
        setTotal(relationshipsResponse.total || 0)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load COI data")
      } finally {
        setLoading(false)
      }
    }

    void loadCOI()
  }, [numericConferenceId, searchQuery, severity, currentPage])

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {t("runtime.components.chair.conference-detail.conference-coi.text_conflicts_of_interest_management")}{" "}</h2>
          <p className="text-[12px] text-slate-500 mt-1 max-w-xl leading-relaxed">
            {t("runtime.components.chair.conference-detail.conference-coi.text_this_view_is_fully_api_backed")}{" "}<code>/api/v1/coi/*</code>{t("runtime.components.chair.conference-detail.conference-coi.text_manual_moderation_actions_are_currently_disabled")}{" "}</p>
        </div>
        <button
          type="button"
          disabled={rebuilding}
          onClick={async () => {
            if (!Number.isFinite(numericConferenceId)) return
            setRebuilding(true)
            setMessage(null)
            try {
              const result = await rebuildCOIRelationships(numericConferenceId)
              setMessage(
                `COI rebuild completed: ${result.relationships_stored} relationships stored.`,
              )
            } catch (rebuildError) {
              setMessage(
                rebuildError instanceof Error
                  ? rebuildError.message
                  : "Failed to trigger COI rebuild.",
              )
            } finally {
              setRebuilding(false)
            }
          }}
          className="h-8 px-3 bg-[#1B3C53] text-white text-[11px] font-medium rounded-md hover:bg-[#234C6A] transition-colors shadow-sm disabled:opacity-60"
        >
          {rebuilding ? "Rebuilding..." : "Rebuild COI Index"}
        </button>
      </div>

      {message && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Conflicts" value={stats.totalConflicts} />
        <StatCard label="Pending Review" value={stats.pendingReview} />
        <StatCard label="Auto-Detected" value={stats.autoDetected} />
        <StatCard label="Orphaned Papers" value={stats.orphanedPapers} />
      </div>

      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        {t("runtime.components.chair.conference-detail.conference-coi.text_confirm_dismiss_and_reviewer_reassignment_coi")}{" "}</div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={severity}
              onChange={(event) => handleSeverityChange(event.target.value as "" | "high" | "medium" | "low")}
              className="bg-white border border-slate-200 text-slate-600 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
            >
              <option value="">{t("runtime.components.chair.conference-detail.conference-coi.text_all_severities")}</option>
              <option value="high">{t("runtime.components.chair.conference-detail.conference-coi.text_high")}</option>
              <option value="medium">{t("runtime.components.chair.conference-detail.conference-coi.text_medium")}</option>
              <option value="low">{t("runtime.components.chair.conference-detail.conference-coi.text_low")}</option>
            </select>
          </div>

          <div className="relative w-full sm:w-56">
            <span
              className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: "16px" }}
            >
              search
            </span>
            <input
              type="text"
              placeholder={t("runtime.components.chair.conference-detail.conference-coi.placeholder_search_reviewer_author")}
              value={searchQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] placeholder-slate-400 transition-shadow"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-xs text-slate-500">{t("runtime.components.chair.conference-detail.conference-coi.text_loading_coi_relationships")}</div>
        ) : error ? (
          <div className="p-6 text-xs text-red-700 bg-red-50 border-t border-red-200">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 tracking-widest">
                <tr>
                  <th className="px-3 py-2.5">{t("runtime.components.chair.conference-detail.conference-coi.text_reviewer")}</th>
                  <th className="px-3 py-2.5">{t("runtime.components.chair.conference-detail.conference-coi.text_author")}</th>
                  <th className="px-3 py-2.5">{t("runtime.components.chair.conference-detail.conference-coi.text_type")}</th>
                  <th className="px-3 py-2.5">{t("runtime.components.chair.conference-detail.conference-coi.text_severity")}</th>
                  <th className="px-3 py-2.5">{t("runtime.components.chair.conference-detail.conference-coi.text_source")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relationships.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-500">
                      {t("runtime.components.chair.conference-detail.conference-coi.text_no_coi_relationships_found")}{" "}</td>
                  </tr>
                ) : (
                  relationships.map((relationship) => (
                    <tr key={relationship.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3">
                        <p className="text-[12px] font-semibold text-slate-900">
                          {relationship.reviewer_name}
                        </p>
                        <p className="text-[10px] text-slate-500">{relationship.reviewer_email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[12px] font-semibold text-slate-900">
                          {relationship.author_name}
                        </p>
                        <p className="text-[10px] text-slate-500">{relationship.author_email}</p>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-slate-700">{relationship.type}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                            relationship.severity === "high" &&
                              "bg-red-50 text-red-700 border-red-100",
                            relationship.severity === "medium" &&
                              "bg-amber-50 text-amber-700 border-amber-100",
                            relationship.severity === "low" &&
                              "bg-blue-50 text-blue-700 border-blue-100",
                          )}
                        >
                          {relationship.severity}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-slate-700">{relationship.detected_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between px-3 py-3 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-bold text-[#1B3C53] dark:text-white">
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}–{Math.min(currentPage * PAGE_SIZE, total)}
              </span>{" "}
              of <span className="font-bold text-[#1B3C53] dark:text-white">{total}</span> conflicts
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Previous
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === "ellipsis" ? (
                    <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-7 min-w-[28px] rounded text-[11px] font-bold transition-colors ${
                        currentPage === page
                          ? "bg-[#1B3C53] text-white"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

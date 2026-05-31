"use client"

import { useEffect, useMemo, useState } from "react"
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

const PAGE_SIZE = 8

function StatCard({
  label,
  value,
  icon,
  iconBgClass,
  iconTextClass,
}: {
  label: string
  value: number
  icon: string
  iconBgClass: string
  iconTextClass: string
}) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">
          {label}
        </p>
        <h3 className="text-xl font-bold text-[#1B3C53]">{value.toLocaleString()}</h3>
      </div>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", iconBgClass)}>
        <span className={cn("material-symbols-outlined text-[20px]", iconTextClass)}>{icon}</span>
      </div>
    </div>
  )
}

function getSeverityClasses(severity: string) {
  if (severity === "high") return "bg-red-50 text-red-700 border-red-100"
  if (severity === "medium") return "bg-amber-50 text-amber-700 border-amber-100"
  return "bg-blue-50 text-blue-700 border-blue-100"
}

function OperationsPanel({
  rebuilding,
  onRebuild,
}: {
  rebuilding: boolean
  onRebuild: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="bg-[#1B3C53] text-white px-4 pt-4 pb-4 rounded-xl shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

      <div className="relative z-10">
        <h3 className="text-sm font-bold mb-3 tracking-tight">
          {t("runtime.components.chair.conference-detail.conference-coi.text_batch_operations")}
        </h3>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onRebuild}
            disabled={rebuilding}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group disabled:opacity-60"
          >
            <span className="text-[11px] font-medium">
              {rebuilding ? "Rebuilding COI Index..." : "Rebuild COI Index"}
            </span>
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1 text-[12px]">
              arrow_forward
            </span>
          </button>
          <div className="w-full bg-white/10 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between opacity-70">
            <span className="text-[11px] font-medium">
              {t(
                "runtime.components.chair.conference-detail.conference-coi.text_manual_moderation_actions",
              )}
            </span>
            <span className="text-[10px] text-slate-300">
              {t("runtime.components.chair.conference-detail.conference-coi.text_api_only")}
            </span>
          </div>
          <div className="w-full bg-white/10 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between opacity-70">
            <span className="text-[11px] font-medium">
              {t(
                "runtime.components.chair.conference-detail.conference-coi.text_reviewer_reassignment_flow",
              )}
            </span>
            <span className="text-[10px] text-slate-300">
              {t("runtime.components.chair.conference-detail.conference-coi.text_read_only")}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-[10px] text-slate-300 leading-relaxed">
            {t(
              "runtime.components.chair.conference-detail.conference-coi.text_use_the_rebuild_action_to_refresh",
            )}{" "}
          </p>
        </div>
      </div>
    </div>
  )
}

function CoverageCard({
  stats,
  message,
}: {
  stats: {
    totalConflicts: number
    pendingReview: number
    autoDetected: number
    orphanedPapers: number
  }
  message: string | null
}) {
  const { t } = useTranslation()

  return (
    <div className="bg-white px-4 pt-4 pb-3 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
        {t("runtime.components.chair.conference-detail.conference-coi.text_current_coverage")}{" "}
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            {t("runtime.components.chair.conference-detail.conference-coi.text_total_conflicts")}
          </span>
          <span className="font-bold text-[#1B3C53]">{stats.totalConflicts}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            {t("runtime.components.chair.conference-detail.conference-coi.text_pending_review")}
          </span>
          <span className="font-bold text-[#1B3C53]">{stats.pendingReview}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            {t("runtime.components.chair.conference-detail.conference-coi.text_auto_detected")}
          </span>
          <span className="font-bold text-[#1B3C53]">{stats.autoDetected}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            {t("runtime.components.chair.conference-detail.conference-coi.text_orphaned_papers")}
          </span>
          <span className="font-bold text-[#1B3C53]">{stats.orphanedPapers}</span>
        </div>
      </div>

      {message && (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-600">
          {message}
        </div>
      )}
    </div>
  )
}

export function ConferenceCOI({ conferenceId, className }: ConferenceCOIProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({
    totalConflicts: 0,
    pendingReview: 0,
    autoDetected: 0,
    orphanedPapers: 0,
  })
  const [relationships, setRelationships] = useState<COIRelationship[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [severity, setSeverity] = useState<"" | "high" | "medium" | "low">("")
  const [rebuilding, setRebuilding] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const numericConferenceId = Number(conferenceId)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let index = 1; index <= totalPages; index += 1) pages.push(index)
      return pages
    }

    pages.push(1)
    if (currentPage <= 3) {
      for (let index = 2; index <= 4; index += 1) pages.push(index)
      pages.push("ellipsis")
      pages.push(totalPages)
      return pages
    }

    if (currentPage >= totalPages - 2) {
      pages.push("ellipsis")
      for (let index = totalPages - 3; index <= totalPages; index += 1) pages.push(index)
      return pages
    }

    pages.push("ellipsis")
    for (let index = currentPage - 1; index <= currentPage + 1; index += 1) pages.push(index)
    pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  }

  const headerMessage = useMemo(
    () =>
      "Review detected conflict signals across submissions and reviewers, then rebuild the index when you need to refresh COI coverage.",
    [],
  )

  const handleRebuild = async () => {
    if (!Number.isFinite(numericConferenceId)) return

    setRebuilding(true)
    setMessage(null)
    try {
      const result = await rebuildCOIRelationships(numericConferenceId)
      setMessage(`COI rebuild completed: ${result.relationships_stored} relationships stored.`)
    } catch (rebuildError) {
      setMessage(
        rebuildError instanceof Error ? rebuildError.message : "Failed to trigger COI rebuild.",
      )
    } finally {
      setRebuilding(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] tracking-tight">
            {t(
              "runtime.components.chair.conference-detail.conference-coi.text_conflicts_of_interest_management",
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{headerMessage}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className="h-8 px-3 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">file_download</span>
            {t("runtime.components.chair.conference-detail.conference-coi.text_export_report")}{" "}
          </button>
          <button
            type="button"
            disabled={rebuilding}
            onClick={handleRebuild}
            className="h-8 px-3 bg-[#1B3C53] text-white text-[11px] font-medium rounded-md hover:bg-[#234C6A] transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[14px]">sync</span>
            {rebuilding ? "Rebuilding..." : "Rebuild COI Index"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Conflicts"
          value={stats.totalConflicts}
          icon="list_alt"
          iconBgClass="bg-slate-50"
          iconTextClass="text-[#1B3C53]"
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          icon="pending_actions"
          iconBgClass="bg-yellow-50"
          iconTextClass="text-yellow-700"
        />
        <StatCard
          label="Auto-Detected"
          value={stats.autoDetected}
          icon="smart_toy"
          iconBgClass="bg-blue-50"
          iconTextClass="text-blue-700"
        />
        <StatCard
          label="Orphaned Papers"
          value={stats.orphanedPapers}
          icon="warning"
          iconBgClass="bg-red-50"
          iconTextClass="text-red-700"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  className="px-3 py-1 text-[10px] font-medium rounded bg-white text-[#1B3C53] shadow-sm"
                >
                  {t("runtime.components.chair.conference-detail.conference-coi.text_pending")}{" "}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-[10px] font-medium rounded text-slate-500"
                >
                  {t(
                    "runtime.components.chair.conference-detail.conference-coi.text_confirmed",
                  )}{" "}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-[10px] font-medium rounded text-slate-500"
                >
                  {t(
                    "runtime.components.chair.conference-detail.conference-coi.text_dismissed",
                  )}{" "}
                </button>
              </div>

              <div className="h-5 w-px bg-slate-200 mx-1" />

              <select
                value={severity}
                onChange={(event) => {
                  setSeverity(event.target.value as "" | "high" | "medium" | "low")
                  setCurrentPage(1)
                }}
                className="bg-transparent border border-slate-200 rounded-lg text-[10px] font-medium text-slate-600 focus:ring-0 cursor-pointer hover:text-[#1B3C53] py-[7px] px-2 w-[110px] outline-none"
              >
                <option value="">
                  {t(
                    "runtime.components.chair.conference-detail.conference-coi.text_all_severities",
                  )}
                </option>
                <option value="high">
                  {t("runtime.components.chair.conference-detail.conference-coi.text_high")}
                </option>
                <option value="medium">
                  {t("runtime.components.chair.conference-detail.conference-coi.text_medium")}
                </option>
                <option value="low">
                  {t("runtime.components.chair.conference-detail.conference-coi.text_low")}
                </option>
              </select>
            </div>

            <div className="relative w-full sm:w-56">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                placeholder={t(
                  "runtime.components.chair.conference-detail.conference-coi.placeholder_search_reviewer_author",
                )}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] placeholder-slate-400 transition-shadow outline-none"
              />
            </div>
          </div>

          <div className="rounded-md border-x-0 border-t-0 border-b border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t(
              "runtime.components.chair.conference-detail.conference-coi.text_confirm_dismiss_and_reviewer_reassignment_coi",
            )}
          </div>

          {loading ? (
            <div className="p-6 text-xs text-slate-500">
              {t(
                "runtime.components.chair.conference-detail.conference-coi.text_loading_coi_relationships",
              )}
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-red-700 bg-red-50 border-t border-red-200">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200 tracking-widest">
                  <tr>
                    <th className="px-3 py-2.5">
                      {t("runtime.components.chair.conference-detail.conference-coi.text_reviewer")}
                    </th>
                    <th className="px-3 py-2.5">
                      {t(
                        "runtime.components.chair.conference-detail.conference-coi.text_submission",
                      )}
                    </th>
                    <th className="px-3 py-2.5">
                      {t(
                        "runtime.components.chair.conference-detail.conference-coi.text_conflict_reason",
                      )}
                    </th>
                    <th className="px-3 py-2.5">
                      {t("runtime.components.chair.conference-detail.conference-coi.text_source")}
                    </th>
                    <th className="px-3 py-2.5 text-right">
                      {t("runtime.components.chair.conference-detail.conference-coi.text_actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relationships.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-500">
                        {t(
                          "runtime.components.chair.conference-detail.conference-coi.text_no_coi_relationships_found",
                        )}
                      </td>
                    </tr>
                  ) : (
                    relationships.map((relationship) => (
                      <tr
                        key={relationship.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                              {(relationship.reviewer_name || "R")
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() || "")
                                .join("")}
                            </div>
                            <div>
                              <div className="text-[12px] font-bold text-[#1B3C53] leading-tight">
                                {relationship.reviewer_name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {relationship.reviewer_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 max-w-[220px]">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
                            <div className="text-[11px] font-medium text-[#1B3C53] truncate">
                              {relationship.author_name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {relationship.author_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                              getSeverityClasses(relationship.severity),
                            )}
                          >
                            {relationship.type}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-200">
                            {relationship.detected_by}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title={t(
                                "runtime.components.chair.conference-detail.conference-coi.title_confirm_conflict",
                              )}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                check_circle
                              </span>
                            </button>
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title={t(
                                "runtime.components.chair.conference-detail.conference-coi.title_dismiss_as_false_positive",
                              )}
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                            </button>
                            <div className="w-px h-4 bg-slate-200 mx-0.5" />
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-[#1B3C53] hover:bg-slate-100 rounded transition-colors"
                              title={t(
                                "runtime.components.chair.conference-detail.conference-coi.title_reassign_reviewer",
                              )}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                person_search
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && total > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {t("runtime.components.chair.conference-detail.conference-coi.text_showing")}{" "}
                <span className="font-bold text-[#1B3C53]">
                  {Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}
                </span>
                -
                <span className="font-bold text-[#1B3C53]">
                  {Math.min(currentPage * PAGE_SIZE, total)}
                </span>{" "}
                {t("runtime.components.chair.conference-detail.conference-coi.text_of")}{" "}
                <span className="font-bold text-[#1B3C53]">{total}</span>{" "}
                {t("runtime.components.chair.conference-detail.conference-coi.text_conflicts")}
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t("runtime.components.chair.conference-detail.conference-coi.text_previous")}
                </button>
                {getPageNumbers().map((page, index) =>
                  page === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-1.5 text-slate-400 text-[10px]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px]",
                        currentPage === page
                          ? "bg-[#1B3C53] text-white hover:bg-[#234C6A]"
                          : "border border-slate-200 text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t("runtime.components.chair.conference-detail.conference-coi.text_next")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-[320px] space-y-4">
          <OperationsPanel rebuilding={rebuilding} onRebuild={handleRebuild} />
          <CoverageCard stats={stats} message={message} />
        </div>
      </div>
    </div>
  )
}

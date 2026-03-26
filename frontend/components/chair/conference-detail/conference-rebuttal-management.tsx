"use client"

import { useEffect, useState } from "react"
import {
  getRebuttalOverview,
  openRebuttal,
  finalizeRebuttal,
  type RebuttalOverviewResponse,
} from "@/lib/api/conference-rebuttal"

interface ConferenceRebuttalManagementProps {
  conferenceId: string
  refreshKey?: number
}

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  not_started: {
    label: "Not Started",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  awaiting: {
    label: "Awaiting Submissions",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  submitted: {
    label: "Submitted",
    color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  finalized: {
    label: "Finalized",
    color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
}

const SUBMISSION_PHASE_LABELS: Record<string, { text: string; color: string }> = {
  not_started: { text: "Not started", color: "text-slate-400" },
  awaiting: { text: "Awaiting", color: "text-blue-600 dark:text-blue-400 font-medium" },
  submitted: { text: "Submitted", color: "text-yellow-600 dark:text-yellow-400 font-medium" },
  finalized: { text: "Finalized", color: "text-green-600 dark:text-green-400 font-medium" },
}

type FilterType = "all" | "has_response" | "no_response"

export function ConferenceRebuttalManagement({
  conferenceId,
  refreshKey = 0,
}: ConferenceRebuttalManagementProps) {
  const [overview, setOverview] = useState<RebuttalOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmFinalize, setConfirmFinalize] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")

  async function load() {
    setLoading(true)
    const result = await getRebuttalOverview(conferenceId)
    setLoading(false)
    if (result.error || !result.data) {
      setError(result.error ?? "Failed to load overview")
    } else {
      setOverview(result.data)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, refreshKey])

  async function handleAction(action: () => Promise<{ error: string | null }>) {
    setActionLoading(true)
    setError(null)
    const result = await action()
    setActionLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      await load()
    }
  }

  const phase = overview?.settings.phase ?? "not_started"
  const phaseInfo = PHASE_LABELS[phase] ?? PHASE_LABELS.not_started
  const isRebuttalOff = !overview?.settings.enabled

  const filteredSubmissions = (overview?.submissions ?? []).filter((s) => {
    if (filter === "has_response") return s.has_response
    if (filter === "no_response") return !s.has_response
    return true
  })

  if (loading) {
    return <div className="text-xs text-slate-500 py-4">Loading rebuttal management…</div>
  }

  return (
    <div className="space-y-4">
      {/* Phase Control Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Phase Control
          </h2>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">Current Phase:</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${phaseInfo.color}`}
            >
              {phaseInfo.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {phase === "not_started" && !isRebuttalOff && (
              <button
                disabled={actionLoading}
                onClick={() => handleAction(() => openRebuttal(conferenceId))}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#1B3C53] text-white hover:bg-[#1B3C53]/90 disabled:opacity-50 font-medium"
              >
                Open Rebuttal Period
              </button>
            )}

            {phase === "not_started" && isRebuttalOff && (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              Rebuttal is Off. Enable rebuttal in settings to open rebuttal period.
              </span>
            )}

            {phase !== "not_started" && phase !== "finalized" && (
              <>
                {confirmFinalize ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Are you sure? This cannot be undone.
                    </span>
                    <button
                      disabled={actionLoading}
                      onClick={() => {
                        setConfirmFinalize(false)
                        handleAction(() => finalizeRebuttal(conferenceId))
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      Confirm Finalize
                    </button>
                    <button
                      onClick={() => setConfirmFinalize(false)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => setConfirmFinalize(true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 font-medium"
                  >
                    Finalize Rebuttal
                  </button>
                )}
              </>
            )}

            {phase === "finalized" && (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                Rebuttal period is finalized. No further changes possible.
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Submission Overview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1B3C53] dark:text-white tracking-tight">
            Submissions ({filteredSubmissions.length})
          </h2>
          <div className="flex gap-1">
            {(["all", "has_response", "no_response"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  filter === f
                    ? "bg-[#1B3C53] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {f === "all" ? "All" : f === "has_response" ? "Has Response" : "No Response"}
              </button>
            ))}
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-400 text-center">No submissions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-4 py-2 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Paper Title
                  </th>
                  <th className="text-left px-4 py-2 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Rebuttal Phase
                  </th>
                  <th className="text-left px-4 py-2 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Response
                  </th>
                  <th className="text-left px-4 py-2 font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Reviewers Acked
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((s) => (
                  <tr
                    key={s.submission_id}
                    className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {s.title}
                    </td>
                    <td className="px-4 py-2.5">
                      {(() => {
                        const p = SUBMISSION_PHASE_LABELS[s.rebuttal_phase]
                        return p ? (
                          <span className={`text-[10px] ${p.color}`}>{p.text}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">{s.rebuttal_phase}</span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.has_response ? (
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                          ✓ Submitted
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.total_reviewers === 0 ? (
                        <span className="text-[10px] text-slate-400">—</span>
                      ) : s.acked_reviewers === s.total_reviewers ? (
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                          {s.acked_reviewers} / {s.total_reviewers} ✓
                        </span>
                      ) : s.acked_reviewers > 0 ? (
                        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
                          {s.acked_reviewers} / {s.total_reviewers} pending
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {s.acked_reviewers} / {s.total_reviewers}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

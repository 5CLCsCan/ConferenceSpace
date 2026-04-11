"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api/client"
import { transitionConferenceStatus } from "@/lib/api/conferences"
import type { ConferenceStatus } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROUTES } from "@/lib/routes"

interface ChairAction {
  id: string
  label: string
  icon: string
  onClick?: () => void
  loading?: boolean
}

interface NextMilestone {
  label: string
  date: string
}

interface ChairActionsPanelProps {
  conferenceId: string
  conferenceStatus?: ConferenceStatus
  onNavigateToAssignments?: () => void
  actions?: ChairAction[]
  nextMilestone?: NextMilestone
  className?: string
}

export function ChairActionsPanel({
  conferenceId,
  conferenceStatus,
  onNavigateToAssignments,
  actions,
  nextMilestone,
  className,
}: ChairActionsPanelProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { currentRole } = useAuth()
  const [autoAssignLoading, setAutoAssignLoading] = useState(false)
  const [autoAssignError, setAutoAssignError] = useState<string | null>(null)
  const [autoAssignSuccess, setAutoAssignSuccess] = useState<string | null>(null)
  const [phaseLoading, setPhaseLoading] = useState(false)
  const [phaseError, setPhaseError] = useState<string | null>(null)
  const [phaseSuccess, setPhaseSuccess] = useState<string | null>(null)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null)

  // Only render for chairs
  if (currentRole !== "chair") return null
  const displayMilestone = nextMilestone ?? {
    label: t(
      "runtime.components.chair.conference-detail.chair-actions-panel.prop_label_author_notification",
    ),
    date: "Dec 10",
  }

  const handleAutoAssign = async () => {
    setAutoAssignLoading(true)
    setAutoAssignError(null)
    setAutoAssignSuccess(null)

    try {
      const { data } = await apiFetch<{
        data: {
          total_assignments: number
          total_submissions: number
        }
      }>(`/api/v1/conferences/${conferenceId}/submissions/auto-assign`, {
        method: "POST",
        body: JSON.stringify({
          min_reviewers_per_paper: 2,
          max_reviewers_per_paper: 3,
          min_score_threshold: 0.0,
          dry_run: false,
        }),
      })

      setAutoAssignSuccess(
        t(
          "runtime.components.chair.conference-detail.chair-actions-panel.text_created_assignment_suggestions",
          {
            assignments: data.data.total_assignments,
            submissions: data.data.total_submissions,
          },
        ),
      )

      // Navigate to assignments tab after success
      if (onNavigateToAssignments) {
        setTimeout(() => {
          onNavigateToAssignments()
        }, 1500)
      }
    } catch (error: any) {
      setAutoAssignError(
        error.message ||
          t(
            "runtime.components.chair.conference-detail.chair-actions-panel.text_failed_to_run_auto_assignment",
          ),
      )
    } finally {
      setAutoAssignLoading(false)
    }
  }

  const getNextPhaseStatus = (): ConferenceStatus | null => {
    if (conferenceStatus === "draft") return "open"
    if (conferenceStatus === "open") return "reviewing"
    if (conferenceStatus === "reviewing") return "completed"
    return null
  }

  const getNextPhaseLabel = (): string | null => {
    if (conferenceStatus === "draft") return "Publish Conference"
    if (conferenceStatus === "open") return "Start Reviewing Now"
    if (conferenceStatus === "reviewing") return "Mark Conference Completed"
    return null
  }

  const handleAdvancePhase = async () => {
    const nextStatus = getNextPhaseStatus()
    if (!nextStatus) return

    setPhaseLoading(true)
    setPhaseError(null)
    setPhaseSuccess(null)

    try {
      const response = await transitionConferenceStatus(conferenceId, nextStatus)
      if (response.error || !response.data) {
        setPhaseError(response.error || "Failed to update conference status")
        return
      }

      if (nextStatus === "reviewing") {
        setPhaseSuccess(
          "Conference moved to reviewing. Auto-assign was triggered automatically.",
        )
      } else {
        setPhaseSuccess("Conference status updated successfully.")
      }

      router.refresh()
    } finally {
      setPhaseLoading(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!conferenceStatus) return

    const targetStatus: ConferenceStatus =
      conferenceStatus === "archived" ? "completed" : "archived"

    setArchiveLoading(true)
    setArchiveError(null)
    setArchiveSuccess(null)

    try {
      const response = await transitionConferenceStatus(conferenceId, targetStatus)
      if (response.error || !response.data) {
        setArchiveError(response.error || "Failed to update conference status")
        return
      }

      setArchiveSuccess(
        targetStatus === "archived"
          ? t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_archived_success",
            )
          : t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_unarchived_success",
            ),
      )

      // Reload detail page to reflect new status
      router.refresh()
    } finally {
      setArchiveLoading(false)
    }
  }

  const defaultActions: ChairAction[] = [
    {
      id: "advance-phase",
      label: phaseLoading
        ? "Updating phase..."
        : getNextPhaseLabel() || "Advance Phase",
      icon: "fast_forward",
      onClick: handleAdvancePhase,
      loading: phaseLoading,
    },
    {
      id: "auto-assign",
      label: autoAssignLoading
        ? t("runtime.components.chair.conference-detail.chair-actions-panel.text_running")
        : t(
            "runtime.components.chair.conference-detail.chair-actions-panel.text_auto_assign_reviewers",
          ),
      icon: "auto_awesome",
      onClick: handleAutoAssign,
      loading: autoAssignLoading,
    },
    {
      id: "view-assignments",
      label: t(
        "runtime.components.chair.conference-detail.chair-actions-panel.prop_label_view_assignments",
      ),
      icon: "assignment_ind",
      onClick: onNavigateToAssignments,
    },
    {
      id: "cfp",
      label: t(
        "runtime.components.chair.conference-detail.chair-actions-panel.prop_label_edit_cfp_details",
      ),
      icon: "edit_note",
      onClick: () => router.push(ROUTES.CHAIR.CONFERENCE_EDIT(conferenceId)),
    },
    {
      id: "archive",
      label:
        conferenceStatus === "archived"
          ? t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_unarchive_conference",
            )
          : t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_archive_conference",
            ),
      icon: "inventory_2",
      onClick: handleArchiveToggle,
      loading: archiveLoading,
    },
  ].filter((action) => !(action.id === "advance-phase" && !getNextPhaseStatus()))

  const displayActions = actions || defaultActions

  return (
    <div
      className={cn(
        "bg-[#1B3C53] text-white px-4 pt-4 pb-4 rounded-xl shadow-lg relative overflow-hidden",
        className,
      )}
    >
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

      <div className="relative z-10">
        <h3 className="text-sm font-bold mb-3 tracking-tight">
          {t("runtime.components.chair.conference-detail.chair-actions-panel.text_chair_actions")}
        </h3>

        {/* Status messages */}
        {autoAssignError && (
          <div className="mb-2 px-2 py-1.5 bg-red-500/20 border border-red-400/30 rounded text-[10px] text-red-200">
            {autoAssignError}
          </div>
        )}
        {phaseError && (
          <div className="mb-2 px-2 py-1.5 bg-red-500/20 border border-red-400/30 rounded text-[10px] text-red-200">
            {phaseError}
          </div>
        )}
        {autoAssignSuccess && (
          <div className="mb-2 px-2 py-1.5 bg-green-500/20 border border-green-400/30 rounded text-[10px] text-green-200">
            {autoAssignSuccess}
          </div>
        )}
        {phaseSuccess && (
          <div className="mb-2 px-2 py-1.5 bg-green-500/20 border border-green-400/30 rounded text-[10px] text-green-200">
            {phaseSuccess}
          </div>
        )}
        {archiveError && (
          <div className="mb-2 px-2 py-1.5 bg-red-500/20 border border-red-400/30 rounded text-[10px] text-red-200">
            {archiveError}
          </div>
        )}
        {archiveSuccess && (
          <div className="mb-2 px-2 py-1.5 bg-green-500/20 border border-green-400/30 rounded text-[10px] text-green-200">
            {archiveSuccess}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {displayActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.loading}
              className={cn(
                "w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all",
                action.loading && "opacity-50 cursor-not-allowed",
              )}
            >
              <span className="text-[11px] font-medium">{action.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {action.loading ? "sync" : action.icon}
              </span>
            </button>
          ))}
        </div>

        {/* Next Milestone */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-[9px] text-slate-300 mb-1.5 uppercase tracking-widest font-medium">
            {t(
              "runtime.components.chair.conference-detail.chair-actions-panel.text_next_milestone",
            )}{" "}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold">{displayMilestone.label}</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-medium">
              {displayMilestone.date}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

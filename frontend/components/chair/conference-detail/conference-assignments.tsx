"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  getSuggestions,
  confirmSuggestions,
  deleteSuggestion,
  addSuggestion,
  getConfirmedAssignments,
  type SuggestionGroup,
  type SuggestedReviewer,
  type ConfirmedAssignmentGroup,
  type ConfirmedReviewer,
} from "@/lib/api/suggestions"
import { getConferenceReviewers, type Reviewer } from "@/lib/api/conferences"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { isReadOnlyRole } from "@/lib/role-helpers"
import { SuggestionDetail } from "./suggestion-detail"

interface ConferenceAssignmentsProps {
  conferenceId: string
  className?: string
}

type TabType = "suggestions" | "confirmed"

function ScoreBadge({ score }: { score: number }) {
  const { t } = useTranslation()
  const percentage = Math.round(score * 100)
  const variant =
    percentage >= 70
      ? "bg-green-100 text-green-700 border-green-200"
      : percentage >= 40
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : "bg-red-50 text-red-700 border-red-100"

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-bold border",
        variant,
      )}
    >
      {percentage}%
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    pending: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_pending",
      ),
      bg: "bg-amber-50",
      text: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_amber_700",
      ),
    },
    accepted: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_accepted",
      ),
      bg: "bg-green-50",
      text: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_green_700",
      ),
    },
    declined: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_declined",
      ),
      bg: "bg-red-50",
      text: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_red_700",
      ),
    },
    completed: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_completed",
      ),
      bg: "bg-blue-50",
      text: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_blue_700",
      ),
    },
  }

  const config = statusConfig[status] || {
    label: status,
    bg: "bg-slate-100",
    text: t(
      "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_slate_600",
    ),
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
        config.bg,
        config.text,
      )}
    >
      {config.label}
    </span>
  )
}

function ReviewStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    not_started: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_not_started",
      ),
      bg: "bg-slate-100",
      text: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_slate_500",
      ),
    },
    in_progress: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_in_progress",
      ),
      bg: "bg-purple-50",
      text: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_purple_700",
      ),
    },
    submitted: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_submitted",
      ),
      bg: "bg-emerald-50",
      text: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_emerald_700",
      ),
    },
  }

  const config = statusConfig[status] || {
    label: status,
    bg: "bg-slate-100",
    text: t(
      "runtime.components.chair.conference-detail.conference-assignments.prop_text_text_slate_600",
    ),
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
        config.bg,
        config.text,
      )}
    >
      {config.label}
    </span>
  )
}

export function ConferenceAssignments({ conferenceId, className }: ConferenceAssignmentsProps) {
  const { t } = useTranslation()
  const { currentRole } = useAuth()
  const readOnly = isReadOnlyRole(currentRole)
  const [activeTab, setActiveTab] = useState<TabType>("suggestions")

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [totalSuggestions, setTotalSuggestions] = useState(0)

  // Confirmed assignments state
  const [confirmedAssignments, setConfirmedAssignments] = useState<ConfirmedAssignmentGroup[]>([])
  const [loadingConfirmed, setLoadingConfirmed] = useState(true)
  const [totalConfirmed, setTotalConfirmed] = useState(0)

  // Shared state
  const [error, setError] = useState<string | null>(null)
  const [confirmingAll, setConfirmingAll] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Add reviewer dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<SuggestionGroup | null>(null)
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([])
  const [loadingReviewers, setLoadingReviewers] = useState(false)
  const [addingReviewer, setAddingReviewer] = useState(false)
  const [coiWarning, setCoiWarning] = useState<{
    show: boolean
    reasons: string[]
    reviewerId: number | null
  }>({
    show: false,
    reasons: [],
    reviewerId: null,
  })

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    type: "confirm-all" | "delete" | null
    data: any
  }>({ show: false, type: null, data: null })

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true)
    setError(null)

    const response = await getSuggestions(conferenceId)
    if (response.error || !response.data) {
      setError(response.error || "Failed to load suggestions")
      setSuggestions([])
      setTotalSuggestions(0)
    } else {
      setSuggestions(response.data.suggestions || [])
      setTotalSuggestions(response.data.total_suggestions || 0)
    }
    setLoadingSuggestions(false)
  }, [conferenceId])

  const loadConfirmedAssignments = useCallback(async () => {
    setLoadingConfirmed(true)
    setError(null)

    const response = await getConfirmedAssignments(conferenceId)
    if (response.error || !response.data) {
      setError(response.error || "Failed to load confirmed assignments")
      setConfirmedAssignments([])
      setTotalConfirmed(0)
    } else {
      setConfirmedAssignments(response.data.assignments || [])
      setTotalConfirmed(response.data.total_assignments || 0)
    }
    setLoadingConfirmed(false)
  }, [conferenceId])

  useEffect(() => {
    void loadSuggestions()
    void loadConfirmedAssignments()
  }, [loadSuggestions, loadConfirmedAssignments])

  const handleConfirmAll = async () => {
    setConfirmingAll(true)
    const response = await confirmSuggestions(conferenceId)
    if (response.error) {
      setError(response.error)
    } else {
      await loadSuggestions()
      await loadConfirmedAssignments()
    }
    setConfirmingAll(false)
    setConfirmDialog({ show: false, type: null, data: null })
  }

  const handleDeleteSuggestion = async (assignmentId: number) => {
    setDeletingId(assignmentId)
    const response = await deleteSuggestion(conferenceId, assignmentId)
    if (response.error) {
      setError(response.error)
    } else {
      await loadSuggestions()
    }
    setDeletingId(null)
    setConfirmDialog({ show: false, type: null, data: null })
  }

  const handleConfirmSingle = async (assignmentId: number) => {
    const response = await confirmSuggestions(conferenceId, [assignmentId])
    if (response.error) {
      setError(response.error)
    } else {
      await loadSuggestions()
      await loadConfirmedAssignments()
    }
  }

  const openAddDialog = async (submission: SuggestionGroup) => {
    setSelectedSubmission(submission)
    setShowAddDialog(true)
    setLoadingReviewers(true)

    const response = await getConferenceReviewers(conferenceId, { status: "accepted", limit: 100 })
    if (response.data) {
      // Filter out reviewers already suggested for this submission
      const existingReviewerIds = new Set(submission.reviewers.map((r) => r.reviewer_id))
      setAvailableReviewers(
        response.data.reviewers.filter((r) => r.id && !existingReviewerIds.has(r.id)),
      )
    }
    setLoadingReviewers(false)
  }

  const handleAddReviewer = async (reviewerId: number) => {
    if (!selectedSubmission) return

    setAddingReviewer(true)
    const response = await addSuggestion(conferenceId, selectedSubmission.submission_id, reviewerId)

    if (response.error) {
      setError(response.error)
      setAddingReviewer(false)
      return
    }

    if (response.data?.coi_warning?.has_conflict) {
      setCoiWarning({
        show: true,
        reasons: response.data.coi_warning.reasons,
        reviewerId,
      })
      // The suggestion was still added, so reload
      await loadSuggestions()
    } else {
      await loadSuggestions()
    }

    setAddingReviewer(false)
    setShowAddDialog(false)
    setSelectedSubmission(null)
  }

  const suggestionsEmpty = suggestions.length === 0
  const confirmedEmpty = confirmedAssignments.length === 0

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] tracking-tight">
            {t(
              "runtime.components.chair.conference-detail.conference-assignments.text_reviewer_assignments",
            )}{" "}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              "runtime.components.chair.conference-detail.conference-assignments.text_review_and_manage_reviewer_assignments_for",
            )}{" "}
          </p>
        </div>

        {activeTab === "suggestions" && !suggestionsEmpty && !readOnly && (
          <Button
            onClick={() => setConfirmDialog({ show: true, type: "confirm-all", data: null })}
            disabled={confirmingAll || totalSuggestions === 0}
            className="bg-[#1B3C53] hover:bg-[#2a4d66] text-white text-[11px] font-medium h-8 px-3"
          >
            {confirmingAll ? "Confirming..." : `Confirm All (${totalSuggestions})`}
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("suggestions")}
          className={cn(
            "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors relative",
            activeTab === "suggestions"
              ? "text-[#1B3C53] dark:text-white"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
          )}
        >
          {t(
            "runtime.components.chair.conference-detail.conference-assignments.text_pending_suggestions",
          )}{" "}
          {totalSuggestions > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold">
              {totalSuggestions}
            </span>
          )}
          {activeTab === "suggestions" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3C53]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("confirmed")}
          className={cn(
            "px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors relative",
            activeTab === "confirmed"
              ? "text-[#1B3C53] dark:text-white"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
          )}
        >
          {t(
            "runtime.components.chair.conference-detail.conference-assignments.text_confirmed_assignments",
          )}{" "}
          {totalConfirmed > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold">
              {totalConfirmed}
            </span>
          )}
          {activeTab === "confirmed" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3C53]" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {activeTab === "suggestions" ? (
          // Suggestions Tab Content
          loadingSuggestions ? (
            <div className="p-6 text-xs font-medium text-slate-500">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_loading_suggestions",
              )}
            </div>
          ) : error ? (
            <div className="p-6 text-xs font-medium text-red-700 bg-red-50 border-t border-red-200">
              {error}
            </div>
          ) : suggestionsEmpty ? (
            <div className="p-8 text-center">
              <div className="text-slate-400 mb-2">
                <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
                  assignment
                </span>
              </div>
              <h3 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-slate-300">
                {t(
                  "runtime.components.chair.conference-detail.conference-assignments.text_no_pending_suggestions",
                )}{" "}
              </h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed mt-1 max-w-md mx-auto">
                {t(
                  "runtime.components.chair.conference-detail.conference-assignments.text_run_auto_assignment_from_the_actions",
                )}{" "}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {suggestions.map((group) => (
                <div key={group.submission_id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
                        #{group.submission_id} - {group.submission_title}
                      </h3>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {group.reviewers.length}{" "}
                        {t(
                          "runtime.components.chair.conference-detail.conference-assignments.text_suggested_reviewer",
                        )}{" "}
                        {group.reviewers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddDialog(group)}
                        className="text-[9px] font-bold uppercase tracking-wider h-7 px-2.5 gap-1.5"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                          person_add
                        </span>
                        {t(
                          "runtime.components.chair.conference-detail.conference-assignments.text_add_reviewer",
                        )}{" "}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {group.reviewers.map((reviewer: SuggestedReviewer) => (
                      <div
                        key={reviewer.assignment_id}
                        className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1B3C53] text-white flex items-center justify-center text-xs font-medium">
                              {reviewer.reviewer_email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                {reviewer.reviewer_email}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium text-slate-400">
                                  {t(
                                    "runtime.components.chair.conference-detail.conference-assignments.text_match",
                                  )}
                                </span>
                                <ScoreBadge score={reviewer.score} />
                              </div>
                            </div>
                          </div>

                          {!readOnly && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmSingle(reviewer.assignment_id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 text-[9px] font-bold uppercase tracking-wider h-7 px-2.5 gap-1.5"
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: "14px" }}
                                >
                                  check
                                </span>
                                {t(
                                  "runtime.components.chair.conference-detail.conference-assignments.text_confirm",
                                )}{" "}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setConfirmDialog({
                                    show: true,
                                    type: "delete",
                                    data: reviewer.assignment_id,
                                  })
                                }
                                disabled={deletingId === reviewer.assignment_id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[9px] font-bold uppercase tracking-wider h-7 px-2.5 gap-1.5"
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: "14px" }}
                                >
                                  close
                                </span>
                                {t(
                                  "runtime.components.chair.conference-detail.conference-assignments.text_remove",
                                )}{" "}
                              </Button>
                            </div>
                          )}
                        </div>
                        <SuggestionDetail
                          metadata={reviewer.metadata}
                          assignmentCount={reviewer.assignment_count}
                          score={reviewer.score}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : // Confirmed Assignments Tab Content
        loadingConfirmed ? (
          <div className="p-6 text-xs font-medium text-slate-500">
            {t(
              "runtime.components.chair.conference-detail.conference-assignments.text_loading_confirmed_assignments",
            )}
          </div>
        ) : error ? (
          <div className="p-6 text-xs font-medium text-red-700 bg-red-50 border-t border-red-200">
            {error}
          </div>
        ) : confirmedEmpty ? (
          <div className="p-8 text-center">
            <div className="text-slate-400 mb-2">
              <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
                assignment_turned_in
              </span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-slate-300">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_no_confirmed_assignments",
              )}{" "}
            </h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed mt-1 max-w-md mx-auto">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_confirm_suggestions_from_the_ldquo_pending",
              )}{" "}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {confirmedAssignments.map((group) => (
              <div key={group.submission_id} className="p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-bold tracking-tight text-[#1B3C53] dark:text-white">
                    #{group.submission_id} - {group.submission_title}
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                    {group.reviewers.length}{" "}
                    {t(
                      "runtime.components.chair.conference-detail.conference-assignments.text_assigned_reviewer",
                    )}{" "}
                    {group.reviewers.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  {group.reviewers.map((reviewer: ConfirmedReviewer) => (
                    <div
                      key={reviewer.assignment_id}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1B3C53] text-white flex items-center justify-center text-xs font-medium">
                          {reviewer.reviewer_email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {reviewer.reviewer_email}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium text-slate-400">
                              {t(
                                "runtime.components.chair.conference-detail.conference-assignments.text_match",
                              )}
                            </span>
                            <ScoreBadge score={reviewer.score} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={reviewer.status} />
                        <ReviewStatusBadge status={reviewer.review_status} />
                        {reviewer.status === "declined" && (
                          <span className="text-[10px] text-slate-400 italic">
                            {reviewer.decline_category
                              ? reviewer.decline_category.replace(/_/g, " ")
                              : reviewer.decline_reason
                                ? reviewer.decline_reason
                                : "No reason given"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reviewer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_add_reviewer",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_select_a_reviewer_to_assign_to",
              )}
              {selectedSubmission?.submission_title}
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_rdquo",
              )}{" "}
            </DialogDescription>
          </DialogHeader>

          {loadingReviewers ? (
            <div className="py-4 text-center text-xs font-medium text-slate-500">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_loading_reviewers",
              )}
            </div>
          ) : availableReviewers.length === 0 ? (
            <div className="py-4 text-center text-xs font-medium text-slate-500">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_no_available_reviewers_all_accepted_reviewers",
              )}{" "}
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableReviewers.map((reviewer) => (
                <button
                  key={reviewer.id}
                  onClick={() => reviewer.id && handleAddReviewer(reviewer.id)}
                  disabled={addingReviewer}
                  className="w-full p-3 text-left bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {reviewer.email}
                  </p>
                  {reviewer.domain && reviewer.domain.length > 0 && (
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {t(
                        "runtime.components.chair.conference-detail.conference-assignments.text_expertise",
                      )}{" "}
                      {reviewer.domain.join(", ")}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* COI Warning Dialog */}
      <AlertDialog
        open={coiWarning.show}
        onOpenChange={(open) =>
          !open && setCoiWarning({ show: false, reasons: [], reviewerId: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                warning
              </span>
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_conflict_of_interest_warning",
              )}{" "}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2 text-xs font-medium">
                {t(
                  "runtime.components.chair.conference-detail.conference-assignments.text_the_reviewer_was_added_but_has",
                )}
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {coiWarning.reasons.map((reason, i) => (
                  <li key={i} className="text-xs">
                    {reason}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-medium">
                {t(
                  "runtime.components.chair.conference-detail.conference-assignments.text_the_assignment_has_been_created_you",
                )}{" "}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.text_understood",
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={confirmDialog.show}
        onOpenChange={(open) => !open && setConfirmDialog({ show: false, type: null, data: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "confirm-all"
                ? "Confirm All Suggestions?"
                : "Remove Suggestion?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "confirm-all"
                ? `This will confirm all ${totalSuggestions} pending suggestions and notify the assigned reviewers.`
                : "This will remove the suggested reviewer from this paper."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("runtime.components.chair.conference-detail.conference-assignments.text_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.type === "confirm-all") {
                  handleConfirmAll()
                } else if (confirmDialog.type === "delete" && confirmDialog.data) {
                  handleDeleteSuggestion(confirmDialog.data)
                }
              }}
              className={confirmDialog.type === "delete" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmDialog.type === "confirm-all" ? "Confirm All" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

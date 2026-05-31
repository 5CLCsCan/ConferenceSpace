"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { SubmissionDetail } from "./types"
import type { AssignmentReview } from "@/lib/api/reviews"
import {
  addSuggestion,
  confirmSuggestions,
  deleteSuggestion,
  getConfirmedAssignments,
  getSuggestions,
  type ConfirmedReviewer,
  type SuggestedReviewer,
} from "@/lib/api/suggestions"
import { getConferenceReviewers, type Reviewer } from "@/lib/api/conferences"
import { getRebuttal, type RebuttalPanelData } from "@/lib/api/rebuttal"
import { updateSubmissionStatus } from "@/lib/api/submissions"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"
import useChairDecisionCopilot from "@/hooks/use-chair-decision-copilot"
import { ChairDecisionCopilotPanel } from "./chair-decision-copilot-panel"
import { trackUsageEvent } from "@/lib/usage-events"
import { AssignmentStatusBadge } from "./components"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// --- Types ---
interface ReviewerScore {
  id: string
  anonymousId: string
  originalScore: number
  currentScore: number
  updated: boolean
  recommendation:
    | "strong_accept"
    | "accept"
    | "weak_accept"
    | "borderline"
    | "weak_reject"
    | "reject"
    | "strong_reject"
}

interface RebuttalPoint {
  id: string
  reviewerId: string
  category: "weakness" | "question" | "clarification" | "suggestion"
  section?: string
  originalComment: string
  authorResponse?: string
  status: "pending_review" | "addressed" | "partially_addressed" | "not_addressed"
  reviewerAcknowledgment?: {
    acknowledged: boolean
    satisfactory?: boolean
    note?: string
  }
}

type DisplayDecision = "accept" | "minor" | "major" | "reject"
type PersistedDecision = Extract<DisplayDecision, "accept" | "reject">
type ReviewerProgressStatus = "not_started" | "in_progress" | "submitted"
type AssignmentState = "pending" | "accepted" | "declined" | "completed"
type ReviewerSourceState = "suggested" | "confirmed"

interface PaperReviewerRow {
  key: string
  reviewerId: number
  assignmentId?: number
  reviewerEmail: string
  score?: number
  status: AssignmentState
  reviewStatus: ReviewerProgressStatus
  source: ReviewerSourceState
  declineCategory?: string
  declineReason?: string
}

function mapSubmissionStatusToDecision(
  status: SubmissionDetail["status"],
): DisplayDecision | undefined {
  if (status === "accepted") return "accept"
  if (status === "rejected") return "reject"
  return undefined
}

function isPersistableDecision(decision?: DisplayDecision): decision is PersistedDecision {
  return decision === "accept" || decision === "reject"
}

function mapDecisionToSubmissionStatus(decision: PersistedDecision): "accepted" | "rejected" {
  return decision === "accept" ? "accepted" : "rejected"
}

function mapReviewRecommendation(value?: string): ReviewerScore["recommendation"] {
  if (
    value === "strong_accept" ||
    value === "accept" ||
    value === "weak_accept" ||
    value === "borderline" ||
    value === "weak_reject" ||
    value === "reject" ||
    value === "strong_reject"
  ) {
    return value
  }

  return "borderline"
}

function reviewerLabel(index: number) {
  return `Reviewer #${index + 1}`
}

function buildReviewerScores(
  reviews: AssignmentReview[],
  rebuttalData: RebuttalPanelData | null,
): ReviewerScore[] {
  const rebuttalReviewers = new Map(
    (rebuttalData?.reviewers ?? []).map((reviewer) => [reviewer.id, reviewer]),
  )

  const mappedReviews = reviews
    .filter((review) => review.review_status === "submitted")
    .map((review, index) => {
      const rebuttalReviewer = rebuttalReviewers.get(String(review.id))

      return {
        id: String(review.id),
        anonymousId: rebuttalReviewer?.anonymousId || reviewerLabel(index),
        originalScore: typeof review.review_score === "number" ? review.review_score : 0,
        currentScore: typeof review.review_score === "number" ? review.review_score : 0,
        updated: false,
        recommendation: mapReviewRecommendation(review.review_data?.recommendation),
      }
    })

  const seen = new Set(mappedReviews.map((review) => review.id))

  ;(rebuttalData?.reviewers ?? []).forEach((reviewer, index) => {
    if (seen.has(reviewer.id)) {
      return
    }

    mappedReviews.push({
      id: reviewer.id,
      anonymousId: reviewer.anonymousId || reviewerLabel(index),
      originalScore: reviewer.scores.original || 0,
      currentScore: reviewer.scores.current || 0,
      updated: reviewer.scores.updated || false,
      recommendation: mapReviewRecommendation(
        reviewer.recommendation.current || reviewer.recommendation.original,
      ),
    })
  })

  return mappedReviews
}

function buildRebuttalPoints(rebuttalData: RebuttalPanelData | null): RebuttalPoint[] {
  return (rebuttalData?.points ?? []).map((point) => ({
    id: point.id,
    reviewerId: point.reviewerId,
    category: point.category === "clarification" ? "clarification" : point.category,
    section: point.section,
    originalComment: point.originalComment,
    authorResponse: point.authorResponse,
    status: point.status,
    reviewerAcknowledgment: point.reviewerAcknowledgment,
  }))
}

function buildPaperReviewerRows(
  confirmedReviewers: ConfirmedReviewer[],
  suggestedReviewers: SuggestedReviewer[],
): PaperReviewerRow[] {
  const rowsByReviewerId = new Map<number, PaperReviewerRow>()

  suggestedReviewers.forEach((reviewer) => {
    rowsByReviewerId.set(reviewer.reviewer_id, {
      key: `suggested-${reviewer.assignment_id}`,
      reviewerId: reviewer.reviewer_id,
      assignmentId: reviewer.assignment_id,
      reviewerEmail: reviewer.reviewer_email,
      score: reviewer.score,
      status: "pending",
      reviewStatus: "not_started",
      source: "suggested",
    })
  })

  confirmedReviewers.forEach((reviewer) => {
    rowsByReviewerId.set(reviewer.reviewer_id, {
      key: `confirmed-${reviewer.assignment_id}`,
      reviewerId: reviewer.reviewer_id,
      assignmentId: reviewer.assignment_id,
      reviewerEmail: reviewer.reviewer_email,
      score: reviewer.score,
      status: reviewer.status as AssignmentState,
      reviewStatus: reviewer.review_status as ReviewerProgressStatus,
      source: "confirmed",
      declineCategory: reviewer.decline_category,
      declineReason: reviewer.decline_reason,
    })
  })

  return Array.from(rowsByReviewerId.values()).sort((left, right) => {
    const leftRank = left.source === "confirmed" ? 0 : 1
    const rightRank = right.source === "confirmed" ? 0 : 1
    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }
    return left.reviewerEmail.localeCompare(right.reviewerEmail)
  })
}

function formatReviewerLabel(email: string) {
  const localPart = email.split("@")[0] || email
  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function formatReviewerInitials(email: string) {
  const label = formatReviewerLabel(email)
  const initials = label
    .split(/\s+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0))
    .join("")

  return (initials || email.charAt(0) || "R").slice(0, 2).toUpperCase()
}

type ConfirmedAssignmentStatus = "completed" | "pending" | "in_progress" | "declined"

function ReviewProgressBadge({ status }: { status: string }) {
  const { t } = useTranslation()

  const config: Record<string, { label: string; className: string }> = {
    not_started: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_not_started",
      ),
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    in_progress: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_in_progress",
      ),
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    submitted: {
      label: t(
        "runtime.components.chair.conference-detail.conference-assignments.prop_label_submitted",
      ),
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  }

  const current = config[status] || {
    label: status,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
        current.className,
      )}
    >
      {current.label}
    </span>
  )
}

function ReviewerAssignmentsPanel({
  conferenceId,
  submissionId,
}: {
  conferenceId: string
  submissionId: string
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)
  const [assignedReviewers, setAssignedReviewers] = useState<PaperReviewerRow[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [availableReviewers, setAvailableReviewers] = useState<Reviewer[]>([])
  const [invitingReviewerId, setInvitingReviewerId] = useState<number | null>(null)
  const [confirmingSuggestionId, setConfirmingSuggestionId] = useState<number | null>(null)
  const [deletingSuggestionId, setDeletingSuggestionId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterReviewStatus, setFilterReviewStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const loadAssignments = async () => {
    setLoadingAssignments(true)
    setAssignmentsError(null)

    const [confirmedResponse, suggestionsResponse] = await Promise.all([
      getConfirmedAssignments(conferenceId),
      getSuggestions(conferenceId),
    ])

    if (confirmedResponse.error || !confirmedResponse.data) {
      setAssignmentsError(
        confirmedResponse.error ||
          t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_failed_to_load_assigned_reviewers",
          ),
      )
      setAssignedReviewers([])
      setLoadingAssignments(false)
      return
    }

    const confirmedGroup = confirmedResponse.data.assignments.find(
      (group) => String(group.submission_id) === String(submissionId),
    )
    const suggestionsGroup = suggestionsResponse.data?.suggestions.find(
      (group) => String(group.submission_id) === String(submissionId),
    )

    setAssignedReviewers(
      buildPaperReviewerRows(confirmedGroup?.reviewers || [], suggestionsGroup?.reviewers || []),
    )
    setLoadingAssignments(false)
  }

  useEffect(() => {
    let isCancelled = false

    async function initializeAssignments() {
      setLoadingAssignments(true)
      setAssignmentsError(null)

      const [confirmedResponse, suggestionsResponse] = await Promise.all([
        getConfirmedAssignments(conferenceId),
        getSuggestions(conferenceId),
      ])
      if (isCancelled) {
        return
      }

      if (confirmedResponse.error || !confirmedResponse.data) {
        setAssignmentsError(
          confirmedResponse.error ||
            t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_failed_to_load_assigned_reviewers",
            ),
        )
        setAssignedReviewers([])
      } else {
        const confirmedGroup = confirmedResponse.data.assignments.find(
          (group) => String(group.submission_id) === String(submissionId),
        )
        const suggestionsGroup = suggestionsResponse.data?.suggestions.find(
          (group) => String(group.submission_id) === String(submissionId),
        )

        setAssignedReviewers(
          buildPaperReviewerRows(
            confirmedGroup?.reviewers || [],
            suggestionsGroup?.reviewers || [],
          ),
        )
      }

      setLoadingAssignments(false)
    }

    void initializeAssignments()

    return () => {
      isCancelled = true
    }
  }, [conferenceId, submissionId, t])

  useEffect(() => {
    let isCancelled = false

    async function loadInviteOptions() {
      if (!inviteOpen) {
        return
      }

      setInviteLoading(true)
      setInviteError(null)

      const response = await getConferenceReviewers(conferenceId, {
        status: "accepted",
        limit: 200,
      })
      if (isCancelled) {
        return
      }

      if (response.error || !response.data) {
        setInviteError(
          response.error ||
            t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_failed_to_load_reviewer_options",
            ),
        )
        setAvailableReviewers([])
      } else {
        const assignedReviewerIds = new Set(
          assignedReviewers.map((reviewer) => reviewer.reviewerId),
        )
        setAvailableReviewers(
          response.data.reviewers.filter(
            (reviewer) => reviewer.id && !assignedReviewerIds.has(reviewer.id),
          ),
        )
      }

      setInviteLoading(false)
    }

    void loadInviteOptions()

    return () => {
      isCancelled = true
    }
  }, [assignedReviewers, conferenceId, inviteOpen, t])

  const handleInviteReviewer = async (reviewerId: number) => {
    setInvitingReviewerId(reviewerId)
    setInviteError(null)

    const response = await addSuggestion(conferenceId, Number(submissionId), reviewerId)
    if (response.error || !response.data) {
      setInviteError(
        response.error ||
          t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_failed_to_invite_reviewer_to_this_paper",
          ),
      )
      setInvitingReviewerId(null)
      return
    }

    if (response.data.coi_warning?.has_conflict) {
      toast({
        title: t(
          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_warning_title",
        ),
        description: t(
          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_warning_description",
        ),
        variant: "warning",
      })
    } else {
      toast({
        title: t(
          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_success_title",
        ),
        description: t(
          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_success_description",
        ),
      })
    }

    await loadAssignments()

    setInviteOpen(false)
    setInvitingReviewerId(null)
  }

  const handleConfirmSingle = async (assignmentId: number) => {
    setConfirmingSuggestionId(assignmentId)
    const response = await confirmSuggestions(conferenceId, [assignmentId])

    if (response.error || !response.data) {
      toast({
        title: t(
          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_confirm_invites_failed_title",
        ),
        description:
          response.error ||
          t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_confirm_invites_failed_description",
          ),
        variant: "destructive",
      })
    } else {
      toast({
        title: t(
          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_confirm_invites_success_title",
        ),
        description: t(
          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_confirm_invites_success_description",
        ),
      })
      await loadAssignments()
    }
    setConfirmingSuggestionId(null)
  }

  const handleDeleteSingle = async (assignmentId: number) => {
    setDeletingSuggestionId(assignmentId)
    const response = await deleteSuggestion(conferenceId, assignmentId)

    if (response.error) {
      toast({
        title: t(
          "runtime.components.chair.conference-detail.conference-assignments.text_remove_failed",
        ),
        description: response.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: t(
          "runtime.components.chair.conference-detail.conference-assignments.text_remove_success",
        ),
      })
      await loadAssignments()
    }
    setDeletingSuggestionId(null)
  }

  const filteredReviewers = assignedReviewers.filter((reviewer) => {
    if (filterStatus === "suggested") {
      if (reviewer.source !== "suggested") return false
    } else if (
      filterStatus !== "all" &&
      reviewer.status !== filterStatus &&
      !(filterStatus === "pending" && reviewer.source === "suggested")
    ) {
      return false
    }
    if (filterReviewStatus !== "all" && reviewer.reviewStatus !== filterReviewStatus) {
      return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredReviewers.length / itemsPerPage))
  const paginatedReviewers = filteredReviewers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const assignedCount = assignedReviewers.length

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-4 border-b border-slate-100">
        <div>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_assigned_reviewers",
            )}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_assigned_reviewers_description",
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[10px] font-medium text-slate-400">
            {assignedCount}{" "}
            {t(
              "runtime.components.chair.conference-detail.conference-assignments.text_assigned_reviewer",
            )}
            {assignedCount === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="h-8 rounded-md bg-[#1B3C53] px-3 text-[11px] font-medium hover:bg-[#234C6A]"
            >
              <span className="material-symbols-outlined mr-1" style={{ fontSize: "14px" }}>
                person_add
              </span>
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_reviewer_to_this_paper",
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {!loadingAssignments && !assignmentsError && assignedReviewers.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="bg-white border border-slate-200 text-slate-600 text-[10px] rounded px-2 py-1 focus:ring-1 focus:ring-[#1B3C53] outline-none cursor-pointer"
          >
            <option value="all">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_all_statuses",
              )}
            </option>
            <option value="suggested">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invitation_pending",
              )}
            </option>
            <option value="pending">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_pending",
              )}
            </option>
            <option value="accepted">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_accepted",
              )}
            </option>
            <option value="declined">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_declined",
              )}
            </option>
            <option value="completed">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_completed",
              )}
            </option>
          </select>
          <select
            value={filterReviewStatus}
            onChange={(e) => {
              setFilterReviewStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="bg-white border border-slate-200 text-slate-600 text-[10px] rounded px-2 py-1 focus:ring-1 focus:ring-[#1B3C53] outline-none cursor-pointer"
          >
            <option value="all">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_all_review_statuses",
              )}
            </option>
            <option value="not_started">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.prop_label_not_started",
              )}
            </option>
            <option value="in_progress">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.prop_label_in_progress",
              )}
            </option>
            <option value="submitted">
              {t(
                "runtime.components.chair.conference-detail.conference-assignments.prop_label_submitted",
              )}
            </option>
          </select>
        </div>
      )}

      <div className="p-4 space-y-3">
        {loadingAssignments ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_loading_assigned_reviewers",
            )}
          </div>
        ) : assignmentsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {assignmentsError}
          </div>
        ) : assignedReviewers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <p className="text-xs font-medium text-slate-600">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_no_reviewers_assigned_yet",
              )}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_reviewer_to_this_paper_description",
              )}
            </p>
          </div>
        ) : filteredReviewers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] text-slate-500">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_no_reviewers_matching_filters",
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedReviewers.map((reviewer) => (
                <div
                  key={reviewer.key}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1B3C53] text-[10px] font-bold text-white">
                      {formatReviewerInitials(reviewer.reviewerEmail)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {formatReviewerLabel(reviewer.reviewerEmail)}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {reviewer.reviewerEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {reviewer.source === "suggested" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={confirmingSuggestionId === reviewer.assignmentId}
                          onClick={() =>
                            reviewer.assignmentId && void handleConfirmSingle(reviewer.assignmentId)
                          }
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 text-[9px] font-bold uppercase tracking-wider h-7 px-2.5 gap-1.5"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                            check
                          </span>
                          {confirmingSuggestionId === reviewer.assignmentId
                            ? t(
                                "runtime.components.chair.conference-detail.conference-assignments.text_confirming",
                              )
                            : t(
                                "runtime.components.chair.conference-detail.conference-assignments.text_confirm",
                              )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingSuggestionId === reviewer.assignmentId}
                          onClick={() =>
                            reviewer.assignmentId && void handleDeleteSingle(reviewer.assignmentId)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[9px] font-bold uppercase tracking-wider h-7 px-2.5 gap-1.5"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                            close
                          </span>
                          {deletingSuggestionId === reviewer.assignmentId
                            ? t(
                                "runtime.components.chair.conference-detail.conference-assignments.text_removing",
                              )
                            : t(
                                "runtime.components.chair.conference-detail.conference-assignments.text_remove",
                              )}
                        </Button>
                      </div>
                    ) : (
                      <AssignmentStatusBadge
                        status={reviewer.status as ConfirmedAssignmentStatus}
                      />
                    )}
                    <ReviewProgressBadge status={reviewer.reviewStatus} />
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="text-[10px] text-slate-400">
                  {t(
                    "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_page",
                  )}{" "}
                  {currentPage} of {totalPages}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="px-2 py-1 rounded border border-slate-200 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {t(
                      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_prev",
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className="px-2 py-1 rounded border border-slate-200 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {t(
                      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_next",
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_reviewer_to_this_paper",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite_reviewer_to_this_paper_description",
              )}
            </DialogDescription>
          </DialogHeader>

          {inviteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {inviteError}
            </div>
          )}

          {inviteLoading ? (
            <div className="py-4 text-center text-xs font-medium text-slate-500">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_loading_reviewer_options",
              )}
            </div>
          ) : availableReviewers.length === 0 ? (
            <div className="py-4 text-center text-xs font-medium text-slate-500">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_no_available_reviewers_to_invite",
              )}
            </div>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {availableReviewers.map((reviewer) => (
                <button
                  key={reviewer.id}
                  type="button"
                  disabled={invitingReviewerId === reviewer.id}
                  onClick={() => reviewer.id && void handleInviteReviewer(reviewer.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-700">
                      {reviewer.email || `Reviewer ${reviewer.id}`}
                    </p>
                    {reviewer.domain && reviewer.domain.length > 0 && (
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {t(
                          "runtime.components.chair.conference-detail.conference-assignments.text_expertise",
                        )}{" "}
                        {reviewer.domain.join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-[#1B3C53]">
                    {invitingReviewerId === reviewer.id
                      ? t(
                          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_inviting",
                        )
                      : t(
                          "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_invite",
                        )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Helper functions ---
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  weakness: {
    icon: "warning",
    color: "text-amber-500",
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_weakness",
    ),
  },
  question: {
    icon: "help",
    color: "text-blue-500",
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_question",
    ),
  },
  clarification: {
    icon: "info",
    color: "text-sky-500",
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_clarification",
    ),
  },
  suggestion: {
    icon: "lightbulb",
    color: "text-purple-500",
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_suggestion",
    ),
  },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending_review: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_pending",
    ),
    bg: "bg-slate-100",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_slate_600",
    ),
  },
  addressed: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_addressed",
    ),
    bg: "bg-emerald-50",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_emerald_600",
    ),
  },
  partially_addressed: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_partial",
    ),
    bg: "bg-amber-50",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_amber_600",
    ),
  },
  not_addressed: {
    label: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_not_addressed",
    ),
    bg: "bg-red-50",
    text: t(
      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_text_text_red_600",
    ),
  },
}

function getRecommendationLabel(rec: string): string {
  const labels: Record<string, string> = {
    strong_accept: "Strong Accept",
    accept: "Accept",
    weak_accept: "Weak Accept",
    borderline: "Borderline",
    weak_reject: "Weak Reject",
    reject: "Reject",
    strong_reject: "Strong Reject",
  }
  return labels[rec] || rec
}

function getRecommendationColor(rec: string): string {
  const colors: Record<string, string> = {
    strong_accept: "text-emerald-700",
    accept: "text-emerald-600",
    weak_accept: "text-lime-600",
    borderline: "text-slate-500",
    weak_reject: "text-orange-500",
    reject: "text-red-500",
    strong_reject: "text-red-700",
  }
  return colors[rec] || "text-slate-500"
}

// --- Decision Making Panel (Sidebar) ---
function DecisionMakingPanel({
  currentDecision,
  onDecision,
  onSubmit,
  isSaving,
  message,
}: {
  currentDecision?: DisplayDecision
  onDecision: (decision: DisplayDecision) => void
  onSubmit: (notes: string) => Promise<void>
  isSaving: boolean
  message: string | null
}) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState("")
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)

  const decisions = [
    {
      key: "accept",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_accept",
      ),
      icon: "check_circle",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_ready_for_publication",
      ),
      activeStyle: "bg-emerald-600 text-white border-emerald-600",
      inactiveStyle:
        "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400",
    },
    {
      key: "minor",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_minor_revision",
      ),
      icon: "edit_note",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_small_changes_needed",
      ),
      activeStyle: "bg-sky-600 text-white border-sky-600",
      inactiveStyle: "bg-white text-sky-700 border-sky-200",
      disabled: true,
    },
    {
      key: "major",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_major_revision",
      ),
      icon: "rate_review",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_significant_changes_required",
      ),
      activeStyle: "bg-amber-600 text-white border-amber-600",
      inactiveStyle: "bg-white text-amber-700 border-amber-200",
      disabled: true,
    },
    {
      key: "reject",
      label: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_label_reject",
      ),
      icon: "cancel",
      description: t(
        "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.prop_description_does_not_meet_standards",
      ),
      activeStyle: "bg-red-600 text-white border-red-600",
      inactiveStyle: "bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-400",
    },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-0">
      {/* Decision Options */}
      <div className="p-4 space-y-2">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_select_decision",
          )}{" "}
        </div>
        {decisions.map((d) => {
          const isActive = currentDecision === d.key
          return (
            <button
              key={d.key}
              type="button"
              disabled={d.disabled}
              onClick={() => {
                if (!d.disabled) {
                  onDecision(d.key as DisplayDecision)
                }
              }}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 text-left",
                isActive ? d.activeStyle : d.inactiveStyle,
                isActive && "shadow-sm",
                d.disabled && "opacity-60 cursor-not-allowed",
              )}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {d.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className={cn("text-[11px] font-bold", isActive ? "" : "")}>{d.label}</div>
                <div className={cn("text-[9px]", isActive ? "text-white/70" : "text-slate-400")}>
                  {d.description}
                </div>
              </div>
              {isActive && (
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  check
                </span>
              )}
            </button>
          )
        })}
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_only_accept_and_reject_can_be",
          )}{" "}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-slate-700" />

      {/* Private Notes */}
      <div className="p-4">
        <button
          onClick={() => setIsNotesExpanded(!isNotesExpanded)}
          className="w-full text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between gap-1 hover:text-slate-600 transition-colors"
        >
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
              lock
            </span>
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_private_notes",
            )}{" "}
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            {isNotesExpanded ? "expand_less" : "expand_more"}
          </span>
        </button>
        {isNotesExpanded && (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] focus:border-[#1B3C53] focus:ring-1 focus:ring-[#1B3C53]/20 resize-none h-20 placeholder:text-slate-300 bg-white dark:bg-slate-800 p-2.5"
              placeholder={t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.placeholder_internal_notes_visible_only_to_chairs",
              )}
            />
            <div className="text-[9px] text-slate-400 mt-1">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_private_notes_are_not_persisted_yet",
              )}{" "}
            </div>
          </>
        )}
      </div>

      {/* Submit Button */}
      <div className="p-4 pt-0">
        <button
          type="button"
          onClick={() => void onSubmit(notes)}
          disabled={!isPersistableDecision(currentDecision) || isSaving}
          className={cn(
            "w-full h-10 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            isPersistableDecision(currentDecision)
              ? "bg-[#1B3C53] hover:bg-[#234C6A] text-white shadow-sm"
              : "bg-slate-100 text-slate-400 cursor-not-allowed",
          )}
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: "16px" }}>
                progress_activity
              </span>
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_submitting",
              )}{" "}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                send
              </span>
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_submit_decision",
              )}{" "}
            </>
          )}
        </button>
        {!currentDecision && (
          <div className="text-[9px] text-slate-400 text-center mt-2">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_select_a_decision_above_to_continue",
            )}{" "}
          </div>
        )}
        {message && <div className="text-[10px] text-slate-500 text-center mt-2">{message}</div>}
      </div>
    </div>
  )
}

// --- Reviewer Scores Panel (Same design as reviewer's, adapted for chair) ---
function ReviewerScoresPanel({ reviewers }: { reviewers: ReviewerScore[] }) {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const scoredReviewers = reviewers.filter((reviewer) => reviewer.currentScore > 0)
  const totalPages = Math.max(1, Math.ceil(scoredReviewers.length / itemsPerPage))
  const paginatedReviewers = scoredReviewers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  if (scoredReviewers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_reviewer_scores",
            )}{" "}
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_no_submitted_reviews_yet",
          )}
        </p>
      </div>
    )
  }

  const avgOriginal =
    scoredReviewers.reduce((sum, reviewer) => sum + reviewer.originalScore, 0) /
    scoredReviewers.length
  const avgCurrent =
    scoredReviewers.reduce((sum, reviewer) => sum + reviewer.currentScore, 0) /
    scoredReviewers.length
  const updatedCount = scoredReviewers.filter((reviewer) => reviewer.updated).length

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_reviewer_scores",
          )}{" "}
        </h3>
        {updatedCount > 0 && (
          <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {updatedCount} score{updatedCount > 1 ? "s" : ""} updated
          </span>
        )}
      </div>

      {/* Average Score Display */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-black text-[#1B3C53] leading-none">
            {avgCurrent.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_avg_score",
            )}
          </span>
        </div>
      </div>

      {/* Individual Reviewers */}
      <div className="space-y-2">
        {paginatedReviewers.map((reviewer) => (
          <div
            key={reviewer.id}
            className="flex items-center gap-3 p-2 bg-slate-50/80 rounded-lg border border-slate-100"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
              {reviewer.anonymousId.replace("Reviewer #", "R")}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium text-slate-700">{reviewer.anonymousId}</span>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                {t(
                  "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_score",
                )}
              </div>
              <div className="text-[12px] font-bold text-[#1B3C53]">
                {reviewer.updated ? (
                  <>
                    <span className="text-slate-400 line-through mr-1">
                      {reviewer.originalScore}
                    </span>
                    <span className="text-slate-400 mx-0.5">→</span>
                    <span>{reviewer.currentScore}</span>
                  </>
                ) : (
                  reviewer.currentScore
                )}
              </div>
            </div>
            <div className="text-right w-24">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                {t(
                  "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_rec",
                )}
              </div>
              <div
                className={cn(
                  "text-[11px] font-bold",
                  getRecommendationColor(reviewer.recommendation),
                )}
              >
                {getRecommendationLabel(reviewer.recommendation)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 mt-3 pt-3">
          <div className="text-[10px] text-slate-400">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_page",
            )}{" "}
            {currentPage} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="px-2 py-1 rounded border border-slate-200 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_prev",
              )}
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className="px-2 py-1 rounded border border-slate-200 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_next",
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Point Card (Read-only for chair) ---
function PointCard({ point, reviewerLabel }: { point: RebuttalPoint; reviewerLabel: string }) {
  const category = CATEGORY_CONFIG[point.category]
  const statusConfig = STATUS_CONFIG[point.status]

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header: Original Comment */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span
              className={cn("material-symbols-outlined mt-0.5", category.color)}
              style={{ fontSize: "16px" }}
            >
              {category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {point.section || category.label}
                </span>
                <span className="text-[9px] text-slate-400">from {reviewerLabel}</span>
                <span
                  className={cn(
                    "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                    statusConfig.bg,
                    statusConfig.text,
                  )}
                >
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{point.originalComment}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Author Response */}
      {point.authorResponse && (
        <div className="px-4 py-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="text-[9px] font-bold">
                {t(
                  "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_a",
                )}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500">
                  {t(
                    "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_author_response",
                  )}
                </span>
              </div>
              <p
                className="text-xs text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: point.authorResponse.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="text-emerald-600">$1</strong>',
                  ),
                }}
              />
            </div>
          </div>

          {/* Reviewer Acknowledgment */}
          {point.reviewerAcknowledgment?.acknowledged && (
            <div className="mt-3 ml-9 pl-3 border-l-2 border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {t(
                    "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_reviewer_response",
                  )}{" "}
                </span>
                {point.reviewerAcknowledgment.satisfactory && (
                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {t(
                      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_satisfied",
                    )}{" "}
                  </span>
                )}
                {point.reviewerAcknowledgment.satisfactory === false && (
                  <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    {t(
                      "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_concerns_remain",
                    )}{" "}
                  </span>
                )}
              </div>
              {point.reviewerAcknowledgment.note && (
                <p className="text-[11px] text-slate-600 italic">
                  {point.reviewerAcknowledgment.note}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Reviewer Response Group (Collapsible, read-only for chair) ---
function ReviewerResponseGroup({
  reviewerId,
  reviewerLabel,
  points,
}: {
  reviewerId: string
  reviewerLabel: string
  points: RebuttalPoint[]
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const addressedCount = points.filter((p) => p.status === "addressed").length
  const pendingCount = points.filter((p) => p.status === "pending_review").length

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between transition-colors bg-slate-50/80 hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
            {reviewerLabel.replace("Reviewer #", "R")}
          </div>
          <div className="text-left">
            <div className="text-[12px] font-bold text-slate-700">
              {t(
                "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_response_to",
              )}{" "}
              {reviewerLabel}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-slate-500">{points.length} points</span>
              {addressedCount === points.length && (
                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {t(
                    "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_all_addressed",
                  )}{" "}
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "16px" }}>
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Points */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
          {points.map((point) => (
            <PointCard key={point.id} point={point} reviewerLabel={reviewerLabel} />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Point-by-Point Responses Section ---
function PointByPointSection({
  points,
  reviewers,
  loading,
  error,
}: {
  points: RebuttalPoint[]
  reviewers: ReviewerScore[]
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="mb-5">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_point_by_point_responses",
          )}{" "}
        </h3>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">
            {t(
              "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_loading_point_by_point_responses",
            )}
          </p>
        </div>
      </div>
    )
  }

  if (points.length === 0) {
    return (
      <div className="mb-5">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_point_by_point_responses",
          )}{" "}
        </h3>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">
            {error || "No point-by-point responses available yet."}
          </p>
        </div>
      </div>
    )
  }

  const groupedByReviewer = new Map<string, RebuttalPoint[]>()
  points.forEach((point) => {
    const current = groupedByReviewer.get(point.reviewerId) || []
    current.push(point)
    groupedByReviewer.set(point.reviewerId, current)
  })

  const reviewerLabels = new Map(reviewers.map((reviewer) => [reviewer.id, reviewer.anonymousId]))

  const groupedPoints = reviewers
    .map((reviewer) => ({
      reviewerId: reviewer.id,
      reviewerLabel: reviewer.anonymousId,
      points: groupedByReviewer.get(reviewer.id) || [],
    }))
    .filter(({ points }) => points.length > 0)

  groupedByReviewer.forEach((reviewerPoints, reviewerId) => {
    if (reviewerLabels.has(reviewerId)) {
      return
    }

    groupedPoints.push({
      reviewerId,
      reviewerLabel: `Reviewer ${reviewerId}`,
      points: reviewerPoints,
    })
  })

  const totalPoints = points.length
  const addressedPoints = points.filter((p) => p.status === "addressed").length
  const pendingPoints = points.filter((p) => p.status === "pending_review").length

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t(
            "runtime.components.chair.conference-detail.submission-detail.chair-reviews-tab.text_point_by_point_responses",
          )}{" "}
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-slate-500">
            <span className="font-bold text-[#1B3C53]">{totalPoints}</span> total
          </span>
          <span className="text-slate-500">
            <span className="font-bold text-emerald-600">{addressedPoints}</span> addressed
          </span>
          {pendingPoints > 0 && (
            <span className="text-slate-500">
              <span className="font-bold text-amber-600">{pendingPoints}</span> pending
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {groupedPoints.map(({ reviewerId, reviewerLabel, points }) => (
          <ReviewerResponseGroup
            key={reviewerId}
            reviewerId={reviewerId}
            reviewerLabel={reviewerLabel}
            points={points}
          />
        ))}
      </div>
    </div>
  )
}

// --- Main Export ---
interface ChairReviewsTabProps {
  submission: SubmissionDetail
  conferenceId: string
  submissionId: string
  reviews: AssignmentReview[]
  onStatusChange?: (status: SubmissionDetail["status"]) => void
}

export function ChairReviewsTab({
  submission,
  conferenceId,
  submissionId,
  reviews,
  onStatusChange,
}: ChairReviewsTabProps) {
  const [currentDecision, setCurrentDecision] = useState<DisplayDecision | undefined>(
    mapSubmissionStatusToDecision(submission.status),
  )
  const [decisionSaving, setDecisionSaving] = useState(false)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)
  const [rebuttalData, setRebuttalData] = useState<RebuttalPanelData | null>(null)
  const [rebuttalLoading, setRebuttalLoading] = useState(true)
  const [rebuttalError, setRebuttalError] = useState<string | null>(null)
  const {
    copilot,
    loading: copilotLoading,
    generating: copilotGenerating,
    regenerating: copilotRegenerating,
    error: copilotError,
    generateCopilot,
    regenerateCopilot,
  } = useChairDecisionCopilot(conferenceId, submissionId)

  useEffect(() => {
    setCurrentDecision(mapSubmissionStatusToDecision(submission.status))
  }, [submission.status])

  useEffect(() => {
    let isCancelled = false

    async function loadRebuttal() {
      setRebuttalLoading(true)
      const result = await getRebuttal(conferenceId, submissionId)

      if (isCancelled) {
        return
      }

      if (result.error || !result.data) {
        setRebuttalData(null)
        setRebuttalError(result.error || "Failed to load rebuttal.")
      } else {
        setRebuttalData(result.data)
        setRebuttalError(null)
      }

      setRebuttalLoading(false)
    }

    void loadRebuttal()

    return () => {
      isCancelled = true
    }
  }, [conferenceId, submissionId])

  const reviewers = buildReviewerScores(reviews, rebuttalData)
  const points = buildRebuttalPoints(rebuttalData)

  async function handleDecisionSubmit(notes: string) {
    if (!isPersistableDecision(currentDecision)) {
      return
    }

    setDecisionSaving(true)
    setDecisionMessage(null)

    const nextStatus = mapDecisionToSubmissionStatus(currentDecision)
    const result = await updateSubmissionStatus(conferenceId, submissionId, nextStatus)

    if (result.error) {
      setDecisionMessage(`Failed to save decision: ${result.error}`)
    } else {
      trackUsageEvent("chair_decision_made", {
        role: "chair",
        entityType: "submission",
        entityId: submissionId,
        metadata: {
          conferenceId,
          decision: nextStatus,
        },
      })
      onStatusChange?.(nextStatus)
      setDecisionMessage(
        notes.trim().length > 0
          ? "Decision saved. Private notes are not persisted yet."
          : "Decision saved.",
      )
    }

    setDecisionSaving(false)
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-[7] min-w-0 space-y-5">
        <ChairDecisionCopilotPanel
          copilot={copilot}
          loading={copilotLoading}
          generating={copilotGenerating}
          regenerating={copilotRegenerating}
          error={copilotError}
          onGenerate={() => {
            void generateCopilot()
          }}
          onRegenerate={() => {
            void regenerateCopilot()
          }}
        />

        {/* Assigned Reviewers */}
        <ReviewerAssignmentsPanel conferenceId={conferenceId} submissionId={submissionId} />

        {/* Reviewer Scores Panel */}
        <ReviewerScoresPanel reviewers={reviewers} />

        {/* Point-by-Point Responses */}
        <PointByPointSection
          points={points}
          reviewers={reviewers}
          loading={rebuttalLoading}
          error={rebuttalError}
        />
      </div>

      {/* Sidebar - Decision Making */}
      <div className="xl:w-[340px] xl:flex-none">
        <DecisionMakingPanel
          currentDecision={currentDecision}
          onDecision={setCurrentDecision}
          onSubmit={handleDecisionSubmit}
          isSaving={decisionSaving}
          message={decisionMessage}
        />
      </div>
    </div>
  )
}

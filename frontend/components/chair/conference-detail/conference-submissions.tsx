"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import {
  getConferenceSubmissions,
  type Submission,
  updateSubmissionStatus,
} from "@/lib/api/submissions"
import { getSubmissionReviews } from "@/lib/api/reviews"
import { getConferenceTracks } from "@/lib/api/conferences"
import { getConfirmedAssignments, type ConfirmedReviewer } from "@/lib/api/suggestions"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"

type SubmissionStatus = "under_review" | "accepted" | "pending" | "rejected" | "withdrawn"
type SortOption = "id" | "score" | "title"

interface SubmissionReviewProgress {
  score: number | null
  reviewerStats: ReviewerStats
}

interface ReviewerStats {
  invited: number
  accepted: number
  completed: number
  incomplete: number
}

interface ConferenceSubmissionsProps {
  conferenceId: string
  className?: string
}

interface SubmissionRowData {
  submission: Submission
  progress: SubmissionReviewProgress
}

function mapStatus(status: Submission["status"]): SubmissionStatus {
  if (status === "accepted") return "accepted"
  if (status === "rejected") return "rejected"
  if (status === "reviewing") return "under_review"
  return "pending"
}

function statusLabel(status: SubmissionStatus) {
  if (status === "under_review") return "Under Review"
  if (status === "accepted") return "Accepted"
  if (status === "rejected") return "Rejected"
  if (status === "withdrawn") return "Withdrawn"
  return "Pending"
}

function statusClass(status: SubmissionStatus) {
  if (status === "under_review") return "bg-yellow-50 text-yellow-700 border-yellow-100"
  if (status === "accepted") return "bg-green-50 text-green-700 border-green-100"
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-100"
  if (status === "withdrawn") return "bg-slate-100 text-slate-600 border-slate-200"
  return "bg-purple-50 text-purple-700 border-purple-100"
}

function buildReviewerStats(reviewers: ConfirmedReviewer[] = []): ReviewerStats {
  const accepted = reviewers.filter(
    (reviewer) => reviewer.status === "accepted" || reviewer.status === "completed",
  ).length
  const completed = reviewers.filter(
    (reviewer) => reviewer.review_status === "submitted" || reviewer.status === "completed",
  ).length

  return {
    invited: reviewers.length,
    accepted,
    completed,
    incomplete: Math.max(accepted - completed, 0),
  }
}

function ReviewerStatsBlock({ stats }: { stats: ReviewerStats }) {
  const { t } = useTranslation()

  return (
    <div className="grid w-[150px] grid-cols-2 gap-x-3 gap-y-1 text-[10px] leading-tight">
      <div className="flex items-center justify-between gap-2 text-slate-500">
        <span>
          {t("runtime.components.chair.conference-detail.conference-submissions.text_invited")}
        </span>
        <span className="font-semibold text-slate-700">{stats.invited}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-slate-500">
        <span>
          {t("runtime.components.chair.conference-detail.conference-submissions.text_accepted")}
        </span>
        <span className="font-semibold text-slate-700">{stats.accepted}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-emerald-700">
        <span>
          {t("runtime.components.chair.conference-detail.conference-submissions.text_completed")}
        </span>
        <span className="font-semibold">{stats.completed}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-amber-700">
        <span>
          {t("runtime.components.chair.conference-detail.conference-submissions.text_incomplete")}
        </span>
        <span className="font-semibold">{stats.incomplete}</span>
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-slate-400 text-[10px] font-medium">--</span>
  }

  const variant =
    score >= 4
      ? "bg-green-100 text-green-700 border-green-200"
      : score >= 3
        ? "bg-slate-100 text-slate-700 border-slate-200"
        : "bg-red-50 text-red-700 border-red-100"

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-medium border",
        variant,
      )}
    >
      {score.toFixed(1)}
    </span>
  )
}

export function ConferenceSubmissions({ conferenceId, className }: ConferenceSubmissionsProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { toast } = useToast()
  const [rows, setRows] = useState<SubmissionRowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrack, setSelectedTrack] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("id")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [tracks, setTracks] = useState<Array<{ id: string; name: string }>>([])
  const [actionMenuSubmissionId, setActionMenuSubmissionId] = useState<number | null>(null)
  const [decisionLoadingSubmissionId, setDecisionLoadingSubmissionId] = useState<number | null>(
    null,
  )

  const entriesPerPage = 8
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Load available tracks
  useEffect(() => {
    async function loadTracks() {
      const response = await getConferenceTracks(conferenceId)
      if (response.data) {
        setTracks(response.data.map((track) => ({ id: track.name, name: track.name })))
      }
    }
    void loadTracks()
  }, [conferenceId])

  const handleQuickDecision = async (submissionId: number, status: "accepted" | "rejected") => {
    setDecisionLoadingSubmissionId(submissionId)
    const response = await updateSubmissionStatus(conferenceId, String(submissionId), status)

    if (response.error || !response.data) {
      toast({
        title: t(
          "runtime.components.chair.conference-detail.conference-submissions.text_update_decision_failed",
        ),
        description:
          response.error ||
          t(
            "runtime.components.chair.conference-detail.conference-submissions.text_please_try_again",
          ),
        variant: "destructive",
      })
      setDecisionLoadingSubmissionId(null)
      return
    }

    setRows((prev) =>
      prev.map((row) =>
        row.submission.id === submissionId
          ? {
              ...row,
              submission: {
                ...row.submission,
                status,
              },
            }
          : row,
      ),
    )

    setActionMenuSubmissionId(null)
    setDecisionLoadingSubmissionId(null)
    toast({
      title: t(
        "runtime.components.chair.conference-detail.conference-submissions.text_decision_updated",
      ),
      description: t(
        "runtime.components.chair.conference-detail.conference-submissions.text_decision_has_been_saved",
      ),
    })
  }

  useEffect(() => {
    async function loadSubmissions() {
      setLoading(true)
      setError(null)

      const response = await getConferenceSubmissions(conferenceId, {
        title: debouncedSearch || undefined,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        track: selectedTrack === "all" ? undefined : selectedTrack,
        limit: entriesPerPage,
        offset: (currentPage - 1) * entriesPerPage,
      })

      if (response.error || !response.data) {
        setError(response.error || t("common.errors.failedToLoadSubmissions"))
        setRows([])
        setTotalEntries(0)
        setLoading(false)
        return
      }

      const submissions = response.data.submissions || []
      setTotalEntries(response.data.total || 0)

      const assignmentsResponse = await getConfirmedAssignments(conferenceId)
      const assignmentsBySubmission = new Map<number, ConfirmedReviewer[]>()

      for (const group of assignmentsResponse.data?.assignments ?? []) {
        assignmentsBySubmission.set(group.submission_id, group.reviewers)
      }

      const reviewProgress = await Promise.all(
        submissions.map(async (submission) => {
          const reviewers = assignmentsBySubmission.get(submission.id) ?? []
          const reviewerStats = buildReviewerStats(reviewers)
          const reviews = await getSubmissionReviews(conferenceId, String(submission.id), {
            limit: 50,
            offset: 0,
          })
          const reviewList = reviews.data || []
          const completed = reviewList.filter(
            (review) => review.review_status === "submitted",
          ).length

          const score =
            completed > 0
              ? reviewList
                  .filter((review) => typeof review.review_score === "number" || typeof review.post_rebuttal_score === "number")
                  .reduce((sum, review) => {
                    const val = typeof review.post_rebuttal_score === "number" ? review.post_rebuttal_score : (review.review_score || 0)
                    return sum + val
                  }, 0) / completed
              : null

          return {
            submission,
            progress: {
              score: score && Number.isFinite(score) ? score : null,
              reviewerStats,
            },
          }
        }),
      )

      setRows(reviewProgress)
      setLoading(false)
    }

    void loadSubmissions()
  }, [conferenceId, currentPage, debouncedSearch, selectedStatus, selectedTrack])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalEntries / entriesPerPage)),
    [totalEntries],
  )

  const displayRows = useMemo(() => {
    const nextRows = [...rows]

    if (sortBy === "score") {
      nextRows.sort((left, right) => (right.progress.score ?? -1) - (left.progress.score ?? -1))
    } else if (sortBy === "title") {
      nextRows.sort((left, right) => left.submission.title.localeCompare(right.submission.title))
    } else {
      nextRows.sort((left, right) => Number(left.submission.id) - Number(right.submission.id))
    }

    return nextRows
  }, [rows, sortBy])

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let index = 1; index <= totalPages; index += 1) pages.push(index)
      return pages
    }

    pages.push(1)
    if (currentPage > 3) pages.push("ellipsis")
    for (
      let index = Math.max(2, currentPage - 1);
      index <= Math.min(totalPages - 1, currentPage + 1);
      index += 1
    ) {
      pages.push(index)
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] tracking-tight">
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_submissions",
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_manage_and_review_conference_submissions_with",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-8 px-3 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_export_csv",
            )}{" "}
          </button>
          <button
            type="button"
            className="h-8 px-3 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">send</span>
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_notifications",
            )}{" "}
          </button>
          <button
            type="button"
            className="h-8 px-3 bg-[#1B3C53] text-white text-[11px] font-medium rounded-md hover:bg-[#234C6A] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px]">group_add</span>
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_assign_reviewers",
            )}{" "}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setCurrentPage(1)
                setSearchQuery(event.target.value)
              }}
              placeholder={t(
                "runtime.components.chair.conference-detail.conference-submissions.placeholder_search_by_id_title_or_author",
              )}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={selectedTrack}
              onChange={(event) => {
                setSelectedTrack(event.target.value)
                setCurrentPage(1)
              }}
              className="bg-white border border-slate-200 text-slate-600 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
            >
              <option value="all">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_all_tracks",
                )}
              </option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => {
                setCurrentPage(1)
                setSelectedStatus(event.target.value)
              }}
              className="bg-white border border-slate-200 text-slate-600 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
            >
              <option value="all">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_all_statuses",
                )}
              </option>
              <option value="draft">
                {t("runtime.components.chair.conference-detail.conference-submissions.text_draft")}
              </option>
              <option value="published">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_published",
                )}
              </option>
              <option value="reviewing">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_reviewing",
                )}
              </option>
              <option value="accepted">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_accepted",
                )}
              </option>
              <option value="rejected">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_rejected",
                )}
              </option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="bg-white border border-slate-200 text-slate-600 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
            >
              <option value="id">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_sort_by_id",
                )}
              </option>
              <option value="score">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_sort_by_score",
                )}
              </option>
              <option value="title">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_sort_by_title",
                )}
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-xs text-slate-500">
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_loading_submissions",
            )}
          </div>
        ) : error ? (
          <div className="p-6 text-xs text-red-700 bg-red-50 border-t border-red-200">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-16">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-[#1B3C53]">
                        {t(
                          "runtime.components.chair.conference-detail.conference-submissions.text_id",
                        )}
                        <span className="material-symbols-outlined text-[12px]">unfold_more</span>
                      </div>
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_paper_details",
                      )}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-32">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_status",
                      )}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-[180px]">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_reviews",
                      )}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-20 text-center">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_score",
                      )}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-[62px] text-right">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_actions",
                      )}{" "}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {displayRows.map(({ submission, progress }) => {
                    const status = mapStatus(submission.status)
                    return (
                      <tr
                        key={submission.id}
                        onClick={() =>
                          router.push(
                            ROUTES.CHAIR.SUBMISSION_DETAIL(conferenceId, String(submission.id)),
                          )
                        }
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-400">
                          #{submission.id}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-slate-900 group-hover:text-[#456882] transition-colors line-clamp-1 tracking-tight leading-[1.3]">
                              {submission.title}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                              {submission.author}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                              statusClass(status),
                            )}
                          >
                            {statusLabel(status)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <ReviewerStatsBlock stats={progress.reviewerStats} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <ScoreBadge score={progress.score} />
                        </td>
                        <td
                          className="px-3 py-3 text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="relative inline-flex">
                            <button
                              type="button"
                              onClick={() =>
                                setActionMenuSubmissionId((prev) =>
                                  prev === submission.id ? null : submission.id,
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-[#1B3C53] hover:bg-slate-100 rounded transition-colors"
                              title={t(
                                "runtime.components.chair.conference-detail.conference-submissions.text_actions",
                              )}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                more_vert
                              </span>
                            </button>

                            {actionMenuSubmissionId === submission.id && (
                              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                                <button
                                  type="button"
                                  disabled={decisionLoadingSubmissionId === submission.id}
                                  onClick={() =>
                                    void handleQuickDecision(submission.id, "accepted")
                                  }
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    check_circle
                                  </span>
                                  {t(
                                    "runtime.components.chair.conference-detail.conference-submissions.text_select_decision_accept",
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={decisionLoadingSubmissionId === submission.id}
                                  onClick={() =>
                                    void handleQuickDecision(submission.id, "rejected")
                                  }
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-60"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    cancel
                                  </span>
                                  {t(
                                    "runtime.components.chair.conference-detail.conference-submissions.text_select_decision_reject",
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      ROUTES.CHAIR.SUBMISSION_DETAIL(
                                        conferenceId,
                                        String(submission.id),
                                      ),
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] text-slate-700 hover:bg-slate-50"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    open_in_new
                                  </span>
                                  {t(
                                    "runtime.components.chair.conference-detail.conference-submissions.text_open_detail",
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_showing",
                )}{" "}
                <span className="font-bold text-[#1B3C53]">
                  {Math.min((currentPage - 1) * entriesPerPage + 1, totalEntries)}
                </span>{" "}
                to{" "}
                <span className="font-bold text-[#1B3C53]">
                  {Math.min(currentPage * entriesPerPage, totalEntries)}
                </span>{" "}
                of <span className="font-bold text-[#1B3C53]">{totalEntries}</span> entries
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t(
                    "runtime.components.chair.conference-detail.conference-submissions.text_previous",
                  )}
                </button>
                {getVisiblePages().map((page, index) =>
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t("runtime.components.chair.conference-detail.conference-submissions.text_next")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

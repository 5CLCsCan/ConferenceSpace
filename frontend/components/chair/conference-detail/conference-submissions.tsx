"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import { getConferenceSubmissions, type Submission } from "@/lib/api/submissions"
import { getSubmissionReviews } from "@/lib/api/reviews"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useDebounce } from "@/hooks/use-debounce"

type SubmissionStatus = "under_review" | "accepted" | "pending" | "rejected" | "withdrawn"

interface SubmissionReviewProgress {
  completed: number
  total: number
  score: number | null
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

function ReviewProgress({ completed, total }: { completed: number; total: number }) {
  const { t } = useTranslation()
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="w-full max-w-[120px]">
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-600 dark:text-slate-400">
          {completed}/{total}{" "}
          {t("runtime.components.chair.conference-detail.conference-submissions.text_done")}{" "}
        </span>
        <span
          className={cn("font-medium", completed === total ? "text-green-600" : "text-slate-400")}
        >
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
        <div
          className={cn("h-1 rounded-full", completed === total ? "bg-green-600" : "bg-[#1B3C53]")}
          style={{ width: `${percentage}%` }}
        />
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
  const [rows, setRows] = useState<SubmissionRowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)

  const entriesPerPage = 8
  const debouncedSearch = useDebounce(searchQuery, 400)

  useEffect(() => {
    async function loadSubmissions() {
      setLoading(true)
      setError(null)

      const response = await getConferenceSubmissions(conferenceId, {
        title: debouncedSearch || undefined,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        limit: entriesPerPage,
        offset: (currentPage - 1) * entriesPerPage,
      })

      if (response.error || !response.data) {
        setError(response.error || "Failed to load submissions")
        setRows([])
        setTotalEntries(0)
        setLoading(false)
        return
      }

      const submissions = response.data.submissions || []
      setTotalEntries(response.data.total || 0)

      const reviewProgress = await Promise.all(
        submissions.map(async (submission) => {
          const reviews = await getSubmissionReviews(conferenceId, String(submission.id), {
            limit: 50,
            offset: 0,
          })
          const reviewList = reviews.data || []
          const completed = reviewList.filter(
            (review) => review.review_status === "submitted",
          ).length
          const total = reviewList.length
          const score =
            completed > 0
              ? reviewList
                  .filter((review) => typeof review.review_score === "number")
                  .reduce((sum, review) => sum + (review.review_score || 0), 0) / completed
              : null

          return {
            submission,
            progress: {
              completed,
              total,
              score: score && Number.isFinite(score) ? score : null,
            },
          }
        }),
      )

      setRows(reviewProgress)
      setLoading(false)
    }

    void loadSubmissions()
  }, [conferenceId, currentPage, debouncedSearch, selectedStatus])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalEntries / entriesPerPage))
  }, [totalEntries])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3C53] dark:text-white tracking-tight">
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_submissions",
            )}{" "}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              "runtime.components.chair.conference-detail.conference-submissions.text_manage_and_review_conference_submissions_with",
            )}{" "}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="relative w-full md:w-80">
            <span
              className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: "16px" }}
            >
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
                "runtime.components.chair.conference-detail.conference-submissions.placeholder_search_by_title",
              )}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] dark:text-white outline-none transition-colors"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(event) => {
              setCurrentPage(1)
              setSelectedStatus(event.target.value)
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] rounded-md py-1.5 pl-2.5 pr-6 focus:ring-1 focus:ring-[#1B3C53] focus:border-[#1B3C53] outline-none cursor-pointer"
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
              {t("runtime.components.chair.conference-detail.conference-submissions.text_accepted")}
            </option>
            <option value="rejected">
              {t("runtime.components.chair.conference-detail.conference-submissions.text_rejected")}
            </option>
          </select>
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
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-16">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_id",
                      )}{" "}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_paper_details",
                      )}{" "}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-32">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_status",
                      )}{" "}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-[168px]">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_reviews",
                      )}{" "}
                    </th>
                    <th className="px-3 py-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest w-20 text-center">
                      {t(
                        "runtime.components.chair.conference-detail.conference-submissions.text_score",
                      )}{" "}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[12px]">
                  {rows.map(({ submission, progress }) => {
                    const status = mapStatus(submission.status)
                    return (
                      <tr
                        key={submission.id}
                        onClick={() =>
                          router.push(
                            ROUTES.CHAIR.SUBMISSION_DETAIL(conferenceId, String(submission.id)),
                          )
                        }
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      >
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-400">
                          #{submission.id}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-[#456882] transition-colors line-clamp-1 tracking-tight leading-[1.3]">
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
                          <ReviewProgress completed={progress.completed} total={progress.total} />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <ScoreBadge score={progress.score} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {t(
                  "runtime.components.chair.conference-detail.conference-submissions.text_showing",
                )}{" "}
                <span className="font-bold text-[#1B3C53] dark:text-white">
                  {Math.min((currentPage - 1) * entriesPerPage + 1, totalEntries)}
                </span>{" "}
                to{" "}
                <span className="font-bold text-[#1B3C53] dark:text-white">
                  {Math.min(currentPage * entriesPerPage, totalEntries)}
                </span>{" "}
                of <span className="font-bold text-[#1B3C53] dark:text-white">{totalEntries}</span>{" "}
                entries
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t(
                    "runtime.components.chair.conference-detail.conference-submissions.text_previous",
                  )}{" "}
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 border border-slate-200 rounded text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  {t(
                    "runtime.components.chair.conference-detail.conference-submissions.text_next",
                  )}{" "}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

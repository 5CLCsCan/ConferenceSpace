"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useConferencePapers } from "@/hooks/use-conference-papers"
import { useReviewerDashboard } from "@/hooks/use-reviewer-dashboard"
import { useDebounce } from "@/hooks/use-debounce"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/routes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PapersSkeleton } from "./loading-skeletons"
import { setAssignmentConferenceContext } from "@/lib/reviewer/assignment-context-cache"
import { recordRecentConference } from "@/lib/recent-conferences"

const PAGE_SIZE = 8

type StatusFilter = "all" | "pending" | "accepted" | "declined" | "completed"
type SortOption = "deadline" | "title" | "status"

interface AssignedDashboardProps {
  conferenceId: string
}

function normalizeAssignmentStatus(status: string): Exclude<StatusFilter, "all"> {
  switch (status) {
    case "not_started":
    case "in_progress":
    case "pending":
      return "pending"
    case "accepted":
      return "accepted"
    case "rejected":
    case "declined":
      return "declined"
    case "submitted":
    case "completed":
      return "completed"
    default:
      return "pending"
  }
}

function statusRank(status: string) {
  switch (normalizeAssignmentStatus(status)) {
    case "pending":
      return 0
    case "accepted":
      return 1
    case "declined":
      return 2
    case "completed":
      return 3
    default:
      return 4
  }
}

function getStatusFilterLabel(status: StatusFilter, t: ReturnType<typeof useTranslation>["t"]) {
  switch (status) {
    case "all":
      return t("runtime.components.reviewer.assigned-dashboard.filters.all")
    case "pending":
      return t("runtime.components.reviewer.assigned-dashboard.filters.pending")
    case "accepted":
      return t("runtime.components.reviewer.assigned-dashboard.filters.accepted")
    case "declined":
      return t("runtime.components.reviewer.assigned-dashboard.filters.declined")
    case "completed":
      return t("runtime.components.reviewer.assigned-dashboard.filters.completed")
    default:
      return t("runtime.components.reviewer.assigned-dashboard.filters.all")
  }
}

function getAssignmentStatusLabel(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  switch (status) {
    case "not_started":
      return t("dashboard.roles.reviewer.papers.statusValues.not_started")
    case "in_progress":
      return t("dashboard.roles.reviewer.papers.statusValues.in_progress")
    case "completed":
      return t("dashboard.roles.reviewer.papers.statusValues.completed")
    case "pending":
      return t("dashboard.roles.reviewer.papers.statusValues.pending")
    case "accepted":
      return t("dashboard.roles.reviewer.papers.statusValues.accepted")
    case "declined":
    case "rejected":
      return t("dashboard.roles.reviewer.papers.statusValues.declined")
    case "submitted":
      return t("dashboard.roles.reviewer.papers.statusValues.submitted")
    default:
      return t("dashboard.roles.reviewer.papers.statusValues.pending")
  }
}

export function AssignedDashboard({ conferenceId }: AssignedDashboardProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()

  const reviewerEmail = user?.email || null

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("deadline")
  const [currentPage, setCurrentPage] = useState(1)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const { papers, isLoading, error } = useConferencePapers(reviewerEmail, conferenceId, {
    limit: 500,
    offset: 0,
    search: debouncedSearch || undefined,
  })

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
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

  const { dashboard } = useReviewerDashboard(reviewerEmail, {
    conferenceLimit: 100,
    conferenceOffset: 0,
    invitationLimit: 1,
    invitationOffset: 0,
  })

  const conference = useMemo(
    () => dashboard?.conferences?.find((item) => String(item.id) === String(conferenceId)),
    [conferenceId, dashboard?.conferences],
  )

  useEffect(() => {
    if (!conference) {
      return
    }

    recordRecentConference({
      userKey: user?.email || "guest",
      role: "reviewer",
      conference: {
        id: String(conference.id),
        name: conference.name || "Conference",
        acronym: conference.acronym,
        year: conference.year,
        role: "reviewer",
        href: ROUTES.REVIEWER.CONFERENCE_SUBMISSIONS(String(conference.id)),
        viewedAt: new Date().toISOString(),
      },
    })
  }, [conference, user?.email])

  const filteredPapers = useMemo(() => {
    if (statusFilter === "all") {
      return papers
    }

    return papers.filter(
      (paper) => normalizeAssignmentStatus(paper.assignment_status) === statusFilter,
    )
  }, [papers, statusFilter])

  const sortedPapers = useMemo(() => {
    const next = [...filteredPapers]
    next.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === "status") {
        return statusRank(a.assignment_status) - statusRank(b.assignment_status)
      }
      const aDate = new Date(a.due_date || "").getTime()
      const bDate = new Date(b.due_date || "").getTime()
      return aDate - bDate
    })
    return next
  }, [filteredPapers, sortBy])

  const filteredTotal = sortedPapers.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE))

  const paginatedPapers = useMemo(
    () => sortedPapers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, sortedPapers],
  )

  const handleOpenAssignment = (assignmentId: number) => {
    setAssignmentConferenceContext(String(assignmentId), String(conferenceId))
    router.push(`${ROUTES.REVIEWER.ASSIGNMENT(String(assignmentId))}?conferenceId=${conferenceId}`)
  }

  if (isLoading) {
    return <PapersSkeleton />
  }

  if (error) {
    return (
      <div className="py-8 px-12">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{t("dashboard.roles.reviewer.review.errors.loadFailed")}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(ROUTES.REVIEWER.CONFERENCES)}
            >
              {t("common.actions.goBack")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-8 px-12">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push(ROUTES.REVIEWER.CONFERENCES)}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {t("common.actions.goBack")}
          </span>
        </button>
      </div>

      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#141414] dark:text-white leading-none">
          {conference?.acronym || conference?.name || `Conference ${conferenceId}`}
        </h1>
        <p className="text-sm font-light text-slate-500 dark:text-slate-400 mt-2">
          {t("dashboard.roles.reviewer.papers.description", { count: filteredTotal })}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(["all", "pending", "accepted", "declined", "completed"] as StatusFilter[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === status
                    ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {getStatusFilterLabel(status, t)}
                {statusFilter === status && (
                  <span className="ml-1 opacity-60">{filteredTotal}</span>
                )}
              </button>
            ),
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t("dashboard.roles.reviewer.papers.search.placeholder")}
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="h-8 w-56 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="h-8 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none"
          >
            <option value="deadline">
              {t("runtime.components.reviewer.assigned-dashboard.text_sort_deadline")}
            </option>
            <option value="title">
              {t("runtime.components.reviewer.assigned-dashboard.text_sort_title")}
            </option>
            <option value="status">
              {t("runtime.components.reviewer.assigned-dashboard.text_sort_status")}
            </option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {filteredTotal === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("dashboard.roles.reviewer.papers.empty.title")}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {t("dashboard.roles.reviewer.papers.empty.description")}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="py-2.5 pl-4 pr-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  #
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("dashboard.roles.reviewer.papers.table.title")}
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("dashboard.roles.reviewer.papers.table.status")}
                </th>
                <th className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("dashboard.roles.reviewer.papers.table.deadline")}
                </th>
                <th className="py-2.5 px-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("dashboard.roles.reviewer.papers.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPapers.map((paper, index) => (
                <tr
                  key={paper.assignment_id}
                  className="border-b border-slate-100 dark:border-slate-700/50"
                >
                  <td className="py-3 pl-4 pr-2 text-[11px] text-slate-400">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                      {paper.title}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300">
                    {getAssignmentStatusLabel(paper.assignment_status, t)}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300">
                    {paper.due_date ? new Date(paper.due_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenAssignment(paper.assignment_id)}
                      className="h-8 px-3 rounded-md bg-[#1B3C53] hover:bg-[#234C6A] text-white text-[11px] font-semibold"
                    >
                      {t("runtime.components.reviewer.assigned-dashboard.text_open")}{" "}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredTotal > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t("runtime.components.reviewer.assigned-dashboard.text_showing")}{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">
              {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredTotal)}–
              {Math.min(currentPage * PAGE_SIZE, filteredTotal)}
            </span>{" "}
            {t("runtime.components.reviewer.assigned-dashboard.text_of")}{" "}
            <span className="font-bold text-[#1B3C53] dark:text-white">{filteredTotal}</span>{" "}
            {filteredTotal === 1
              ? t("runtime.components.reviewer.assigned-dashboard.text_paper")
              : t("runtime.components.reviewer.assigned-dashboard.text_papers")}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {t("runtime.components.reviewer.assigned-dashboard.text_previous")}
              </button>
              {getPageNumbers().map((page, idx) =>
                page === "ellipsis" ? (
                  <span key={`e-${idx}`} className="px-1 text-slate-400 text-xs">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-8 min-w-[32px] rounded-md text-[11px] font-bold transition-colors ${
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {t("runtime.components.reviewer.assigned-dashboard.text_next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
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

type StatusFilter = "all" | "not_started" | "in_progress" | "completed"
type SortOption = "deadline" | "title" | "status"

interface AssignedDashboardProps {
  conferenceId: string
}

function statusRank(status: string) {
  switch (status) {
    case "not_started":
      return 0
    case "in_progress":
      return 1
    case "completed":
      return 2
    default:
      return 3
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
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { papers, isLoading, error } = useConferencePapers(reviewerEmail, conferenceId, {
    limit: 100,
    offset: 0,
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  })

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

  const sortedPapers = useMemo(() => {
    const next = [...papers]
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
  }, [papers, sortBy])

  const statusCounts = {
    all: papers.length,
    not_started: papers.filter((paper) => paper.assignment_status === "not_started").length,
    in_progress: papers.filter((paper) => paper.assignment_status === "in_progress").length,
    completed: papers.filter((paper) => paper.assignment_status === "completed").length,
  }

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
          {t("dashboard.roles.reviewer.papers.description", { count: papers.length })}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(["all", "not_started", "in_progress", "completed"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {status === "all"
                ? "All"
                : status === "not_started"
                  ? "Pending"
                  : status === "in_progress"
                    ? "Draft"
                    : "Done"}
              <span className="ml-1 opacity-60">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t("dashboard.roles.reviewer.papers.search.placeholder")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-8 w-56 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="h-8 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="title">Sort: Title</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {sortedPapers.length === 0 ? (
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
              {sortedPapers.map((paper, index) => (
                <tr
                  key={paper.assignment_id}
                  className="border-b border-slate-100 dark:border-slate-700/50"
                >
                  <td className="py-3 pl-4 pr-2 text-[11px] text-slate-400">{index + 1}</td>
                  <td className="py-3 px-3">
                    <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                      {paper.title}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300">
                    {t(`dashboard.roles.reviewer.papers.statusValues.${paper.assignment_status}`)}
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
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

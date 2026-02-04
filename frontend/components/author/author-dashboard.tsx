"use client"
import { listConferences, toggleBookmark } from "@/lib/api/conferences"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import type { Conference, ConferenceStatus } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

type ViewMode = "my" | "discover"
type StatusFilter = "open" | "reviewing" | "completed" | "" | "pending" | "accepted" | "rejected"

export function AuthorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("my") // Default to My Conferences per instructions
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10 // Reduced limit for card grid

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Fetch conferences logic
  useEffect(() => {
    const fetchConferences = async () => {
      try {
        setLoading(true)
        const offset = (currentPage - 1) * limit
        const filters: any = { limit, offset }

        if (viewMode === "my") {
          // Both submissions and bookmarks
          const submissionsFilters = { ...filters, myConferences: true, role: "author" }
          if (debouncedSearchQuery.trim()) submissionsFilters.title = debouncedSearchQuery.trim()

          const [submissionsResponse, bookmarksResponse] = await Promise.all([
            listConferences(submissionsFilters),
            listConferences({
              ...filters,
              myBookmark: true,
              title: debouncedSearchQuery.trim() || undefined,
            }),
          ])

          const conferenceMap = new Map<string, Conference>()
          if (submissionsResponse.data) {
            submissionsResponse.data.conferences.forEach((conf) => {
              conferenceMap.set(conf.id, { ...conf, userRole: "author" })
            })
          }
          if (bookmarksResponse.data) {
            bookmarksResponse.data.conferences.forEach((conf) => {
              const existing = conferenceMap.get(conf.id)
              if (existing) {
                conferenceMap.set(conf.id, { ...existing, isBookmarked: true })
              } else {
                conferenceMap.set(conf.id, { ...conf, isBookmarked: true })
              }
            })
          }

          let merged = Array.from(conferenceMap.values())
          if (statusFilter) {
            merged = merged.filter((conf) => computeConferenceStatus(conf) === statusFilter)
          }
          if (yearFilter !== "all") {
            merged = merged.filter((conf) => conf.year?.toString() === yearFilter)
          }
          setConferences(merged)
          setTotal(merged.length)
        } else {
          if (debouncedSearchQuery.trim()) filters.title = debouncedSearchQuery.trim()
          const resp = await listConferences(filters)
          if (resp.error) setError(resp.error)
          else if (resp.data) {
            let list = resp.data.conferences
            if (statusFilter) {
              list = list.filter((conf) => computeConferenceStatus(conf) === statusFilter)
            }
            if (yearFilter !== "all") {
              list = list.filter((conf) => conf.year?.toString() === yearFilter)
            }
            setConferences(list)
            setTotal(resp.data.total || list.length)
          }
        }
      } catch (err) {
        setError("Failed to load conferences")
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchConferences()
  }, [user, viewMode, currentPage, debouncedSearchQuery, statusFilter, yearFilter])

  const computeConferenceStatus = (conference: Conference): ConferenceStatus => {
    const now = new Date()
    const submissionDeadline = conference.submission_deadline
      ? new Date(conference.submission_deadline)
      : null
    const conferenceEnd = conference.conference_end_date
      ? new Date(conference.conference_end_date)
      : null

    if (submissionDeadline && now < submissionDeadline) return "open"
    if (conferenceEnd && now >= conferenceEnd) return "completed"
    return "reviewing"
  }

  const handleBookmarkToggle = async (conference: Conference, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      const result = await toggleBookmark(conference.id)
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
        return
      }
      const isBookmarked = result.data?.isBookmarked ?? false
      toast({
        title: isBookmarked ? "Bookmarked" : "Removed bookmark",
        description: conference.name,
      })

      setConferences((prev) =>
        prev.map((c) => (c.id === conference.id ? { ...c, isBookmarked } : c)),
      )
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-[#141414] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          Author Dashboard
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm font-normal">
          {viewMode === "my"
            ? `Welcome back, ${user?.name}. You have ${total || 0} active submissions.`
            : "Browse active conferences, find submission opportunities, and manage your bookmarks."}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#dbdbdb] dark:border-neutral-800">
        <div className="flex gap-8 justify-start items-start">
          <button
            onClick={() => {
              setViewMode("my")
              setCurrentPage(1)
            }}
            className={cn(
              "flex items-center gap-2 border-b-[3px] pb-3 px-1 transition-all group outline-none",
              viewMode === "my"
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-slate-900 dark:hover:text-white",
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[20px]",
                viewMode === "my"
                  ? "text-slate-900 dark:text-white"
                  : "text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white",
              )}
            >
              inventory_2
            </span>
            <span className="text-sm font-bold tracking-[0.015em]">My Conferences</span>
          </button>
          <button
            onClick={() => {
              setViewMode("discover")
              setCurrentPage(1)
            }}
            className={cn(
              "flex items-center gap-2 border-b-[3px] pb-3 px-1 transition-all group outline-none",
              viewMode === "discover"
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-slate-900 dark:hover:text-white",
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[20px]",
                viewMode === "discover"
                  ? "text-slate-900 dark:text-white"
                  : "text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white",
              )}
            >
              explore
            </span>
            <span className="text-sm font-bold tracking-[0.015em]">Explore</span>
          </button>
        </div>
      </div>

      {/* Filters & Search - Match Design exactly */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 h-10">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder={
              viewMode === "my" ? "Search conferences..." : "Search by name, acronym, or topic..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full pl-11 pr-4 bg-white dark:bg-neutral-800 border border-[#dbdbdb] dark:border-neutral-700 rounded-lg text-primary dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm shadow-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full h-10 pl-3.5 pr-10 bg-white dark:bg-neutral-800 border border-[#dbdbdb] dark:border-neutral-700 rounded-lg text-primary dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-sm cursor-pointer shadow-sm"
            >
              <option value="">All Status</option>
              {viewMode === "my" ? (
                <>
                  <option value="pending">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </>
              ) : (
                <>
                  <option value="open">Call for Papers</option>
                  <option value="reviewing">Registration Open</option>
                  <option value="completed">Past/Closed</option>
                </>
              )}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[18px]">
              expand_more
            </span>
          </div>

          <div className="relative min-w-[110px]">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full h-10 pl-3.5 pr-10 bg-white dark:bg-neutral-800 border border-[#dbdbdb] dark:border-neutral-700 rounded-lg text-primary dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-sm cursor-pointer shadow-sm"
            >
              <option value="all">Any Year</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[18px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Conference List Container - flex-col for List View */}
      <div className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-white dark:bg-neutral-900 border border-[#dbdbdb] dark:border-neutral-800 animate-pulse"
            />
          ))
        ) : conferences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-[#dbdbdb] dark:border-neutral-800">
            <span className="material-symbols-outlined text-5xl text-neutral-200 mb-4 font-light">
              search_off
            </span>
            <p className="text-base font-medium text-neutral-500">
              No results found matching your criteria
            </p>
          </div>
        ) : (
          conferences.map((conf) => (
            <ConferenceListCard
              key={conf.id}
              conference={conf}
              onToggleBookmark={(e) => handleBookmarkToggle(conf, e)}
              viewMode={viewMode}
            />
          ))
        )}
      </div>

      {/* Pagination - Match Design */}
      {total > limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-[#ededed] dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            Showing{" "}
            <span className="font-bold text-[#141414] dark:text-white">
              {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, total)}
            </span>{" "}
            of <span className="font-bold text-[#141414] dark:text-white">{total}</span> results
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="flex items-center justify-center size-9 rounded-lg border border-transparent text-neutral-400 hover:text-slate-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="flex items-center justify-center size-9 rounded-lg bg-slate-900 text-white text-sm font-bold shadow-sm">
              {currentPage}
            </button>
            <button
              disabled={currentPage >= Math.ceil(total / limit)}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="flex items-center justify-center size-9 rounded-lg border border-transparent text-neutral-600 dark:text-neutral-400 hover:text-slate-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConferenceListCard({
  conference,
  onToggleBookmark,
  viewMode,
}: {
  conference: Conference
  onToggleBookmark: (e: React.MouseEvent) => void
  viewMode: ViewMode
}) {
  const router = useRouter()
  const statusInfo = useMemo(() => {
    const now = new Date()
    const deadline = conference.submission_deadline
      ? new Date(conference.submission_deadline)
      : null

    if (viewMode === "my") {
      if (conference.submissionStatus === "accepted")
        return {
          label: "Paper Accepted",
          icon: "check_circle",
          btnText: "View Details",
          btnVariant: "outline",
          color:
            "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200",
        }
      if (conference.userRole === "author")
        return {
          label: "Abstract Submitted",
          icon: "hourglass_top",
          btnText: "Manage Submission",
          btnVariant: "primary",
          color:
            "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200",
          subText: `Full paper due: ${deadline ? deadline.toLocaleDateString() : "TBD"}`,
        }
      const isPast = conference.conference_date && new Date(conference.conference_date) < now
      if (isPast)
        return {
          label: "Past Conference",
          icon: "history",
          btnText: "Access Proceedings",
          btnVariant: "outline",
          color:
            "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200",
        }
      return {
        label: "Bookmarked",
        icon: "bookmark",
        btnText: "Apply Now",
        btnVariant: "outline",
        color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200",
      }
    } else {
      if (deadline && now < deadline)
        return {
          label: "Call for Papers Open",
          icon: "edit_document",
          btnText: "View Call for Papers",
          btnVariant: "primary",
          color:
            "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200",
        }
      // Simplified Registration logic
      return {
        label: "Registration Open",
        icon: "confirmation_number",
        btnText: "Register Now",
        btnVariant: "outline",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200",
      }
    }
  }, [conference, viewMode])

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return "Dates TBD"
    const s = new Date(start)
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }
    if (!end) return s.toLocaleDateString("en-US", { ...options, year: "numeric" })
    const e = new Date(end)
    return `${s.toLocaleDateString("en-US", options)} - ${e.toLocaleDateString("en-US", { ...options, year: "numeric" })}`
  }

  return (
    <div
      className="group bg-white dark:bg-neutral-800 border border-[#dbdbdb] dark:border-neutral-700 rounded-xl p-4 hover:shadow-lg hover:border-slate-900/30 dark:hover:border-white/20 transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/author/conference/${conference.id}`)}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#1B3C53] text-white text-xs font-bold px-2 py-1 rounded">
              {conference.acronym} {conference.year || ""}
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {conference.location || "Online"}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#141414] dark:text-white mb-2 group-hover:text-[#1B3C53] dark:group-hover:text-slate-300 transition-colors">
            {conference.name}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
            {formatDateRange(conference.conference_date, conference.conference_end_date)}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors",
                statusInfo.color,
              )}
            >
              {statusInfo.label}
            </div>
            {viewMode === "discover" && conference.submission_deadline && (
              <span className="text-neutral-500 text-xs font-medium">
                Abstracts due:{" "}
                {new Date(conference.submission_deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {viewMode === "my" && statusInfo.subText && (
              <span className="text-neutral-400 text-xs font-medium">{statusInfo.subText}</span>
            )}
          </div>
        </div>

        <div
          className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 mt-4 md:mt-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onToggleBookmark}
            className={cn(
              "size-10 rounded-full flex items-center justify-center transition-colors",
              conference.isBookmarked
                ? "text-[#1B3C53] dark:text-white bg-neutral-100 dark:bg-neutral-700"
                : "text-neutral-400 hover:text-[#1B3C53] hover:bg-neutral-100 dark:hover:bg-neutral-700",
            )}
            title={conference.isBookmarked ? "Bookmarked" : "Bookmark"}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[20px]",
                conference.isBookmarked && "fill-current",
              )}
            >
              {conference.isBookmarked ? "bookmark" : "bookmark_border"}
            </span>
          </button>

          <button
            onClick={() => router.push(`/author/conference/${conference.id}`)}
            className={cn(
              "text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-sm w-full md:w-auto text-center border",
              statusInfo.btnVariant === "primary"
                ? "bg-[#141414] hover:bg-[#252525] text-white border-[#141414]"
                : "bg-white dark:bg-neutral-800 border-[#dbdbdb] dark:border-neutral-600 hover:border-[#141414] text-[#141414] dark:text-white",
            )}
          >
            {statusInfo.btnText}
          </button>
        </div>
      </div>
    </div>
  )
}

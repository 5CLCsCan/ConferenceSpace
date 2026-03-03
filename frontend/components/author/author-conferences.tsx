"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useDebounce } from "@/hooks/use-debounce"
import type { AuthorConference, AuthorTabType } from "./author-conference-cards"
import { AuthorConferenceCard } from "./author-conference-cards"
import { AuthorConferenceList } from "./author-conference-list"
import { EMPTY_STATE_CONTENT } from "./author-mock-data"
import type { ExploreConference } from "@/components/conference/types"
import {
  ExploreConferenceCard,
  ArchivedConferenceCard,
  ExploreConferenceList,
  ArchivedConferenceList,
} from "@/components/conference/explore-cards"
import { useAuth } from "@/lib/auth-context"
import { listConferences } from "@/lib/api/conferences"
import { getConferenceSubmissions, type Submission } from "@/lib/api/submissions"
import type { Conference } from "@/lib/types"

type ViewMode = "grid" | "list"

interface AuthorConferencesProps {
  /** Initial conferences data - falls back to mock data */
  conferences?: AuthorConference[]
}

function formatConferenceDates(conference: Conference): string {
  const start = conference.conference_date ? new Date(conference.conference_date) : null
  const end = conference.conference_end_date ? new Date(conference.conference_end_date) : null
  if (!start || Number.isNaN(start.getTime())) {
    return "Dates TBD"
  }
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
  if (!end || Number.isNaN(end.getTime())) {
    return startLabel
  }
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
  return `${startLabel} - ${endLabel}`
}

function mapSubmissionStatus(status: Submission["status"]): AuthorConference["status"] {
  if (status === "accepted") return "accepted"
  if (status === "rejected") return "rejected"
  if (status === "reviewing") return "under-review"
  if (status === "draft" || status === "published") return "submitted"
  return "submitted"
}

function mapConferenceToExplore(conference: Conference): ExploreConference {
  return {
    id: conference.id,
    name: conference.acronym || conference.name,
    fullDescription: conference.description || conference.name,
    location: conference.location || "TBD",
    dates: formatConferenceDates(conference),
    exploreStatus: conference.status === "open" ? "call-for-papers" : "upcoming",
    topics: conference.domain?.slice(0, 3) || conference.tracks.slice(0, 3) || [],
  }
}

function PaginationBar({
  currentPage,
  totalPages,
  total,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  total: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const startIndex = (currentPage - 1) * itemsPerPage
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-[11px] text-slate-500">
        Showing{" "}
        <span className="font-bold text-[#1B3C53]">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, total)}</span>{" "}
        of <span className="font-bold text-[#1B3C53]">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-[11px] rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-[11px] text-slate-400">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-2 py-1 text-[11px] rounded border ${
                currentPage === page
                  ? "bg-[#1B3C53] text-white border-[#1B3C53]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-[11px] rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function AuthorConferences({ conferences: initialConferences }: AuthorConferencesProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AuthorTabType>("my-conferences")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("date-newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [myConferences, setMyConferences] = useState<AuthorConference[]>(initialConferences || [])
  // explore/archived use server-side data with separate totals
  const [exploreConferences, setExploreConferences] = useState<ExploreConference[]>([])
  const [exploreTotal, setExploreTotal] = useState(0)
  const [exploreLoading, setExploreLoading] = useState(false)
  const [archivedConferences, setArchivedConferences] = useState<ExploreConference[]>([])
  const [archivedTotal, setArchivedTotal] = useState(0)
  const [archivedLoading, setArchivedLoading] = useState(false)

  const ITEMS_PER_PAGE = 6
  const debouncedSearch = useDebounce(searchQuery, 400)

  // my-conferences: N+1 approach (conferences + check submissions per conference)
  useEffect(() => {
    async function loadMyConferences() {
      if (!user?.email) {
        setLoading(false)
        setMyConferences(initialConferences || [])
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch all conferences to check user's submissions (no server-side endpoint for this)
        const conferenceResponse = await listConferences({ limit: 500 })
        const conferences = conferenceResponse.data?.conferences || []

        const conferenceWithSubmissions = await Promise.all(
          conferences.map(async (conference) => {
            const submissionsResponse = await getConferenceSubmissions(conference.id, {
              author: user.email,
              limit: 10,
              offset: 0,
            })

            return {
              conference,
              submissions: submissionsResponse.data?.submissions || [],
            }
          }),
        )

        const nextMy: AuthorConference[] = []

        for (const { conference, submissions } of conferenceWithSubmissions) {
          if (submissions.length > 0) {
            const primarySubmission = [...submissions].sort((a, b) => {
              return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            })[0]

            nextMy.push({
              id: conference.id,
              name: conference.name,
              acronym: conference.acronym,
              location: conference.location || "TBD",
              dates: formatConferenceDates(conference),
              status: mapSubmissionStatus(primarySubmission.status),
              paperTitle: primarySubmission.title,
              trackName: primarySubmission.information?.track_name || "",
              submissionDate: new Date(primarySubmission.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              submissionDeadline: conference.submission_deadline || "",
              fullPaperDeadline: conference.camera_ready_deadline || "",
            })
          }
        }

        setMyConferences(nextMy)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load conferences")
        setMyConferences(initialConferences || [])
      } finally {
        setLoading(false)
      }
    }

    void loadMyConferences()
  }, [user?.email, initialConferences])

  // explore/archived: server-side fetch with debounced search
  useEffect(() => {
    if (activeTab !== "explore" && activeTab !== "archived") return
    let cancelled = false

    async function fetchExploreOrArchived() {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE

      if (activeTab === "explore") {
        setExploreLoading(true)
        try {
          const res = await listConferences({
            title: debouncedSearch || undefined,
            limit: ITEMS_PER_PAGE,
            offset,
          })
          if (!cancelled) {
            setExploreConferences(
              (res.data?.conferences || []).filter(c => c.status !== "completed").map(mapConferenceToExplore),
            )
            setExploreTotal(res.data?.total || 0)
          }
        } finally {
          if (!cancelled) setExploreLoading(false)
        }
      } else if (activeTab === "archived") {
        setArchivedLoading(true)
        try {
          const res = await listConferences({
            status: "completed",
            title: debouncedSearch || undefined,
            limit: ITEMS_PER_PAGE,
            offset,
          })
          if (!cancelled) {
            setArchivedConferences((res.data?.conferences || []).map(mapConferenceToExplore))
            setArchivedTotal(res.data?.total || 0)
          }
        } finally {
          if (!cancelled) setArchivedLoading(false)
        }
      }
    }

    void fetchExploreOrArchived()
    return () => {
      cancelled = true
    }
  }, [activeTab, debouncedSearch, currentPage])

  const handleNavigate = (id: string) => {
    router.push(ROUTES.AUTHOR.CONFERENCE_DETAIL(id))
  }

  const handleViewDetails = (id: string) => {
    router.push(ROUTES.AUTHOR.CONFERENCE_DETAIL(id))
  }

  // Filter My Conferences client-side (server-side not possible without a dedicated submissions endpoint)
  const getFilteredMyConferences = (): AuthorConference[] => {
    let filtered = myConferences.filter((c) => c.status !== "rejected")
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.acronym?.toLowerCase().includes(query) ||
          c.paperTitle?.toLowerCase().includes(query),
      )
    }
    const statusOrder: Record<string, number> = {
      accepted: 0,
      "under-review": 1,
      submitted: 2,
      rejected: 3,
    }
    if (sortBy === "name-asc") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "status") {
      filtered = [...filtered].sort(
        (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9),
      )
    } else {
      // date-newest: sort by submissionDeadline descending
      filtered = [...filtered].sort((a, b) => {
        const da = a.submissionDeadline ? new Date(a.submissionDeadline).getTime() : 0
        const db = b.submissionDeadline ? new Date(b.submissionDeadline).getTime() : 0
        return db - da
      })
    }
    return filtered
  }

  // Reset page when tab or search changes
  const handleTabChange = (tab: AuthorTabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Get data and render based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16 text-xs text-slate-500">
          Loading conferences...
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          Failed to load conferences: {error}
        </div>
      )
    }

    if (activeTab === "my-conferences") {
      const allConferences = getFilteredMyConferences()
      const totalPages = Math.ceil(allConferences.length / ITEMS_PER_PAGE) || 1
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const paginatedConferences = allConferences.slice(startIndex, startIndex + ITEMS_PER_PAGE)

      if (allConferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (allConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <AuthorConferenceList
              conferences={paginatedConferences}
              onNavigate={handleNavigate}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={allConferences.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )
      }

      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedConferences.map((conference) => (
              <AuthorConferenceCard
                key={conference.id}
                conference={conference}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            total={allConferences.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )
    }

    if (activeTab === "explore") {
      const totalPages = Math.ceil(exploreTotal / ITEMS_PER_PAGE) || 1
      if (exploreLoading) {
        return (
          <div className="flex items-center justify-center py-16 text-xs text-slate-500">
            Loading conferences...
          </div>
        )
      }
      if (exploreConferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (exploreConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ExploreConferenceList
              conferences={exploreConferences}
              onViewDetails={handleViewDetails}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={exploreTotal}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )
      }

      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {exploreConferences.map((conference) => (
              <ExploreConferenceCard
                key={conference.id}
                conference={conference}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            total={exploreTotal}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )
    }

    if (activeTab === "archived") {
      const totalPages = Math.ceil(archivedTotal / ITEMS_PER_PAGE) || 1
      if (archivedLoading) {
        return (
          <div className="flex items-center justify-center py-16 text-xs text-slate-500">
            Loading conferences...
          </div>
        )
      }
      if (archivedConferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (archivedConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ArchivedConferenceList
              conferences={archivedConferences}
              onViewDetails={handleViewDetails}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={archivedTotal}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )
      }

      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {archivedConferences.map((conference) => (
              <ArchivedConferenceCard
                key={conference.id}
                conference={conference}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            total={archivedTotal}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <Header />

      {/* Tabs */}
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Toolbar */}
      <Toolbar
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content */}
      <div className="flex-1">{renderContent()}</div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Header Component
// -------------------------------------------------------------------------

function Header() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
          Conferences
        </h1>
        <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
          Track your paper submissions and discover new opportunities to publish your research.
        </p>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Tabs Component
// -------------------------------------------------------------------------

interface TabsProps {
  activeTab: AuthorTabType
  onTabChange: (tab: AuthorTabType) => void
}

function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs: { key: AuthorTabType; label: string }[] = [
    { key: "my-conferences", label: "My Submissions" },
    { key: "explore", label: "Explore" },
    { key: "archived", label: "Archived" },
  ]

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
              activeTab === tab.key
                ? "text-[#1B3C53] dark:text-white border-[#1B3C53] dark:border-white"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-[#1B3C53] dark:hover:text-slate-300 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Toolbar Component
// -------------------------------------------------------------------------

interface ToolbarProps {
  activeTab: AuthorTabType
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

function Toolbar({
  activeTab,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: ToolbarProps) {
  const placeholders: Record<AuthorTabType, string> = {
    "my-conferences": "Search submissions...",
    explore: "Search conferences...",
    archived: "Search archived...",
  }

  const sortOptions: Record<AuthorTabType, { value: string; label: string }[]> = {
    "my-conferences": [
      { value: "date-newest", label: "Date (Newest)" },
      { value: "name-asc", label: "Name (A-Z)" },
      { value: "status", label: "Status" },
    ],
    explore: [
      { value: "deadline", label: "Deadline (Soon)" },
      { value: "date-upcoming", label: "Date (Upcoming)" },
      { value: "name-asc", label: "Name (A-Z)" },
    ],
    archived: [
      { value: "date-newest", label: "Date (Newest)" },
      { value: "name-asc", label: "Name (A-Z)" },
    ],
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Search */}
      <div className="relative group w-full sm:w-80">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 text-slate-400 group-focus-within:text-[#1B3C53] transition-colors"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transform: "translateY(-50%)",
            boxSizing: "border-box",
          }}
        >
          search
        </span>
        <input
          className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3C53]/20 focus:border-[#1B3C53] transition-all"
          placeholder={placeholders[activeTab]}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Sort + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="border-none bg-transparent text-[11px] font-bold text-[#1B3C53] dark:text-white focus:ring-0 cursor-pointer p-0 pr-5"
          >
            {sortOptions[activeTab].map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`w-7 h-7 rounded transition-all duration-200 flex items-center justify-center ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              grid_view
            </span>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`w-7 h-7 rounded transition-all duration-200 flex items-center justify-center ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-700 shadow-sm text-[#1B3C53] dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontSize: "16px",
                width: "16px",
                height: "16px",
                maxWidth: "16px",
                maxHeight: "16px",
                minWidth: "16px",
                minHeight: "16px",
                lineHeight: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transform: "none",
                boxSizing: "border-box",
              }}
            >
              view_list
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Empty State Components
// -------------------------------------------------------------------------

interface EmptyStateProps {
  type: AuthorTabType
}

function EmptyState({ type }: EmptyStateProps) {
  const { icon, title, description } = EMPTY_STATE_CONTENT[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-[10px] font-medium text-slate-400 text-center max-w-xs">{description}</p>
    </div>
  )
}

function NoResultsState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <span className="material-symbols-outlined text-[28px] text-slate-300 mb-2">search_off</span>
      <h3 className="text-sm font-bold text-[#1B3C53] dark:text-white mb-1 tracking-tight">
        No results found
      </h3>
      <p className="text-[10px] font-medium text-slate-400 text-center">
        Try adjusting your search terms
      </p>
    </div>
  )
}

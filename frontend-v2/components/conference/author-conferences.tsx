"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { TabType, ViewMode, Conference, ExploreConference } from "./types"
import {
  MOCK_MY_CONFERENCES,
  MOCK_EXPLORE_CONFERENCES,
  MOCK_ARCHIVED_CONFERENCES,
} from "./mock-data"
import { ConferenceCard } from "./conference-cards"
import { ConferenceList } from "./conference-list"
import { CreateConferenceCard } from "./create-conference-card"
import { EmptyState, NoResultsState } from "./empty-state"
import {
  ExploreConferenceCard,
  ArchivedConferenceCard,
  ExploreConferenceList,
  ArchivedConferenceList,
} from "./explore-cards"

interface AuthorConferencesProps {
  /** Initial conferences data - falls back to mock data */
  conferences?: Conference[]
}

export function AuthorConferences({ conferences: initialConferences }: AuthorConferencesProps) {
  const router = useRouter()
  const { currentRole } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("my-conferences")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("date-newest")
  const [currentPage, setCurrentPage] = useState(1)

  // Data sources for each tab
  const myConferences = initialConferences || MOCK_MY_CONFERENCES
  const exploreConferences = MOCK_EXPLORE_CONFERENCES
  const archivedConferences = MOCK_ARCHIVED_CONFERENCES

  const ITEMS_PER_PAGE = 5

  const handleNavigate = (id: string) => {
    // Navigate to role-specific conference detail page
    if (currentRole === "chair") {
      router.push("/role/chair")
    } else {
      router.push(`/role/author/conferences/${id}`)
    }
  }

  const handleViewDetails = (id: string) => {
    // For explore/archived, navigate to details page
    router.push(`/conference/${id}`)
  }

  const handleCreateConference = () => {
    router.push("/role/chair")
  }

  // Filter My Conferences (exclude completed)
  const getFilteredMyConferences = (): Conference[] => {
    let filtered = myConferences.filter((c) => c.status !== "completed")
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.acronym?.toLowerCase().includes(query) ||
          c.role.toLowerCase().includes(query),
      )
    }
    return filtered
  }

  // Filter Explore Conferences
  const getFilteredExploreConferences = (): ExploreConference[] => {
    let filtered = [...exploreConferences]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.fullDescription.toLowerCase().includes(query) ||
          c.topics.some((t) => t.toLowerCase().includes(query)),
      )
    }
    return filtered
  }

  // Filter Archived Conferences
  const getFilteredArchivedConferences = (): ExploreConference[] => {
    let filtered = [...archivedConferences]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.fullDescription.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query),
      )
    }
    return filtered
  }

  // Reset page when tab or search changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Get data and render based on active tab
  const renderContent = () => {
    if (activeTab === "my-conferences") {
      const allConferences = getFilteredMyConferences()
      const totalPages = Math.ceil(allConferences.length / ITEMS_PER_PAGE)
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const paginatedConferences = allConferences.slice(startIndex, startIndex + ITEMS_PER_PAGE)

      if (allConferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (allConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ConferenceList
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedConferences.map((conference) => (
            <ConferenceCard
              key={conference.id}
              conference={conference}
              onNavigate={handleNavigate}
            />
          ))}
          <CreateConferenceCard onClick={handleCreateConference} />
        </div>
      )
    }

    if (activeTab === "explore") {
      const allConferences = getFilteredExploreConferences()
      const totalPages = Math.ceil(allConferences.length / ITEMS_PER_PAGE)
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const paginatedConferences = allConferences.slice(startIndex, startIndex + ITEMS_PER_PAGE)

      if (allConferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (allConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ExploreConferenceList
              conferences={paginatedConferences}
              onViewDetails={handleViewDetails}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedConferences.map((conference) => (
            <ExploreConferenceCard
              key={conference.id}
              conference={conference}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )
    }

    if (activeTab === "archived") {
      const allConferences = getFilteredArchivedConferences()
      const totalPages = Math.ceil(allConferences.length / ITEMS_PER_PAGE)
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const paginatedConferences = allConferences.slice(startIndex, startIndex + ITEMS_PER_PAGE)

      if (allConferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (allConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ArchivedConferenceList
              conferences={paginatedConferences}
              onViewDetails={handleViewDetails}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedConferences.map((conference) => (
            <ArchivedConferenceCard
              key={conference.id}
              conference={conference}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <Header onCreateConference={handleCreateConference} />

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

interface HeaderProps {
  onCreateConference: () => void
}

function Header({ onCreateConference }: HeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
          Conferences
        </h1>
        <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
          Manage your conferences and discover new opportunities.
        </p>
      </div>
      <button
        onClick={onCreateConference}
        className="h-9 px-4 bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] text-[10px] font-medium uppercase tracking-wider rounded-md hover:bg-[#234C6A] dark:hover:bg-slate-100 transition-all duration-200 flex items-center gap-2"
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "16px",
            width: "16px",
            height: "16px",
            maxWidth: "16px",
            maxHeight: "16px",
            minWidth: "16px",
            minHeight: "16px",
            lineHeight: "16px",
            display: "inline-block",
            flexShrink: 0,
            transform: "none",
            boxSizing: "border-box",
          }}
        >
          add
        </span>
        Create Conference
      </button>
    </div>
  )
}

// -------------------------------------------------------------------------
// Tabs Component
// -------------------------------------------------------------------------

interface TabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs: { key: TabType; label: string }[] = [
    { key: "my-conferences", label: "My Conferences" },
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
  activeTab: TabType
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
  const placeholders: Record<TabType, string> = {
    "my-conferences": "Search conferences...",
    explore: "Search conferences...",
    archived: "Search archived conferences...",
  }

  const sortOptions: Record<TabType, { value: string; label: string }[]> = {
    "my-conferences": [
      { value: "date-newest", label: "Date (Newest)" },
      { value: "name-asc", label: "Name (A-Z)" },
      { value: "submissions", label: "Submissions (High-Low)" },
    ],
    explore: [
      { value: "popularity", label: "Popularity" },
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

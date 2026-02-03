"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { AuthorConference, AuthorTabType } from "./author-conference-cards"
import { AuthorConferenceCard } from "./author-conference-cards"
import { AuthorConferenceList } from "./author-conference-list"
import {
  MOCK_AUTHOR_CONFERENCES,
  MOCK_EXPLORE_CONFERENCES,
  MOCK_ARCHIVED_CONFERENCES,
  EMPTY_STATE_CONTENT,
} from "./author-mock-data"
import type { ExploreConference } from "@/components/conference/types"
import {
  ExploreConferenceCard,
  ArchivedConferenceCard,
  ExploreConferenceList,
  ArchivedConferenceList,
} from "@/components/conference/explore-cards"

type ViewMode = "grid" | "list"

interface AuthorConferencesProps {
  /** Initial conferences data - falls back to mock data */
  conferences?: AuthorConference[]
}

export function AuthorConferences({ conferences: initialConferences }: AuthorConferencesProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AuthorTabType>("my-conferences")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("date-newest")

  // Data sources for each tab
  const myConferences = initialConferences || MOCK_AUTHOR_CONFERENCES
  const exploreConferences = MOCK_EXPLORE_CONFERENCES
  const archivedConferences = MOCK_ARCHIVED_CONFERENCES

  const handleNavigate = (id: string) => {
    router.push(`/dashboard/author/conference/${id}`)
  }

  const handleViewDetails = (id: string) => {
    router.push(`/conference/${id}`)
  }

  // Filter My Conferences (exclude rejected from active view)
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

  // Get data and render based on active tab
  const renderContent = () => {
    if (activeTab === "my-conferences") {
      const conferences = getFilteredMyConferences()
      if (conferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (conferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <AuthorConferenceList conferences={conferences} onNavigate={handleNavigate} />
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {conferences.map((conference) => (
            <AuthorConferenceCard
              key={conference.id}
              conference={conference}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )
    }

    if (activeTab === "explore") {
      const conferences = getFilteredExploreConferences()
      if (conferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (conferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ExploreConferenceList conferences={conferences} onViewDetails={handleViewDetails} />
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {conferences.map((conference) => (
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
      const conferences = getFilteredArchivedConferences()
      if (conferences.length === 0 && !searchQuery) return <EmptyState type={activeTab} />
      if (conferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ArchivedConferenceList conferences={conferences} onViewDetails={handleViewDetails} />
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {conferences.map((conference) => (
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
      <Header />

      {/* Tabs */}
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Toolbar */}
      <Toolbar
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
          My Conferences
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

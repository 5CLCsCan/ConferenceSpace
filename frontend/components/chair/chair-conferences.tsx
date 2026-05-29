"use client"

import { useEffect, useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import type {
  TabType,
  ViewMode,
  Conference,
  ExploreConference,
} from "@/components/conference/types"
import { ConferenceCard } from "@/components/conference/conference-cards"
import { ConferenceList } from "@/components/conference/conference-list"
import { CreateConferenceCard } from "@/components/conference/create-conference-card"
import { EmptyState, NoResultsState } from "@/components/conference/empty-state"
import {
  ExploreConferenceCard,
  ArchivedConferenceCard,
  ExploreConferenceList,
  ArchivedConferenceList,
} from "@/components/conference/explore-cards"
import { listConferences } from "@/lib/api/conferences"
import type { Conference as ApiConference } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { isReadOnlyRole } from "@/lib/role-helpers"
import { Sparkles } from "lucide-react"
import { ConferenceTemplateSheet } from "@/components/chair/conference-template-sheet"
import type { ConferenceFormData } from "@/components/wizard/creation"
import { ConferenceMoreMenu } from "@/components/chair/conference-more-menu"

interface ChairConferencesProps {
  /** Initial conferences data */
  conferences?: Conference[]
}

function formatConferenceDates(conference: ApiConference): string {
  const start = conference.conference_date ? new Date(conference.conference_date) : null
  const end = conference.conference_end_date ? new Date(conference.conference_end_date) : null
  if (!start || Number.isNaN(start.getTime())) {
    return "Dates TBD"
  }
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
  if (!end || Number.isNaN(end.getTime())) {
    return startLabel
  }
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
  return `${startLabel} - ${endLabel}`
}

function mapConferenceStatus(status: ApiConference["status"]): Conference["status"] {
  if (status === "draft") return "draft"
  if (status === "completed") return "completed"
  if (status === "reviewing") return "active"
  return "planning"
}

function mapToChairConference(conference: ApiConference): Conference {
  return {
    id: conference.id,
    name: conference.name,
    acronym: conference.acronym,
    role: conference.userRole || "Chair",
    location: conference.location || "TBD",
    dates: formatConferenceDates(conference),
    status: mapConferenceStatus(conference.status),
    acceptedPapers: undefined,
  }
}

function mapToExploreConference(conference: ApiConference): ExploreConference {
  return {
    id: conference.id,
    name: conference.acronym || conference.name,
    fullDescription: conference.description || conference.name,
    location: conference.location || "TBD",
    dates: formatConferenceDates(conference),
    exploreStatus: conference.status === "open" ? "call-for-papers" : "upcoming",
    topics: conference.domain?.slice(0, 3) || conference.tracks.slice(0, 3) || [],
    userRole: conference.userRole,
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
  const { t } = useTranslation()
  if (totalPages <= 1) return null
  const startIndex = (currentPage - 1) * itemsPerPage
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      )
        pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-[11px] text-slate-500">
        {t("runtime.components.chair.chair-conferences.text_showing")}{" "}
        <span className="font-bold text-[#1B3C53]">
          {startIndex + 1}–{Math.min(startIndex + itemsPerPage, total)}
        </span>{" "}
        {t("runtime.components.chair.chair-conferences.text_of")}{" "}
        <span className="font-bold text-[#1B3C53]">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-[11px] rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("runtime.components.chair.chair-conferences.text_previous")}
        </button>
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-[11px] text-slate-400">
              …
            </span>
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
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-[11px] rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("runtime.components.chair.chair-conferences.text_next")}
        </button>
      </div>
    </div>
  )
}

export function ChairConferences({ conferences: initialConferences }: ChairConferencesProps) {
  const { t } = useTranslation()
  const { currentRole } = useAuth()
  const readOnly = isReadOnlyRole(currentRole)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("my-conferences")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("date-newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [myConferences, setMyConferences] = useState<Conference[]>([])
  const [myTotal, setMyTotal] = useState(0)
  const [exploreConferences, setExploreConferences] = useState<ExploreConference[]>([])
  const [exploreTotal, setExploreTotal] = useState(0)
  const [draftConferences, setDraftConferences] = useState<Conference[]>([])
  const [draftTotal, setDraftTotal] = useState(0)
  const [archivedConferences, setArchivedConferences] = useState<ExploreConference[]>([])
  const [archivedTotal, setArchivedTotal] = useState(0)

  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const ITEMS_PER_PAGE = 6
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Sort raw ApiConference list before mapping
  function sortApiConferences(list: import("@/lib/types").Conference[], sort: string) {
    const sorted = [...list]
    if (sort === "name-asc") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    } else if (sort === "name-desc") {
      sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""))
    } else if (sort === "deadline") {
      sorted.sort((a, b) => {
        const da = a.submission_deadline ? new Date(a.submission_deadline).getTime() : 0
        const db = b.submission_deadline ? new Date(b.submission_deadline).getTime() : 0
        return da - db
      })
    } else if (sort === "date-upcoming" || sort === "popularity") {
      sorted.sort((a, b) => {
        const da = a.conference_date ? new Date(a.conference_date).getTime() : 0
        const db = b.conference_date ? new Date(b.conference_date).getTime() : 0
        return da - db
      })
    } else {
      // date-newest (default)
      sorted.sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0
        const db = b.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
      })
    }
    return sorted
  }

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        if (activeTab === "my-conferences") {
          const res = await listConferences({
            myConferences: true,
            role: currentRole === "pc" ? "pc" : "chair",
            title: debouncedSearch || undefined,
            limit: 500,
            offset: 0,
          })
          if (!cancelled) {
            const filtered = (res.data?.conferences || []).filter(
              (c) => c.status !== "archived" && c.status !== "draft",
            )
            const sorted = sortApiConferences(filtered, sortBy)
            const page = currentPage
            const start = (page - 1) * ITEMS_PER_PAGE
            setMyConferences(sorted.slice(start, start + ITEMS_PER_PAGE).map(mapToChairConference))
            setMyTotal(sorted.length)
          }
        } else if (activeTab === "explore") {
          const res = await listConferences({
            title: debouncedSearch || undefined,
            limit: 500,
            offset: 0,
          })
          if (!cancelled) {
            const filtered = (res.data?.conferences || []).filter(
              (c) => c.status !== "completed" && c.status !== "archived" && c.status !== "draft",
            )
            const sorted = sortApiConferences(filtered, sortBy)
            const start = (currentPage - 1) * ITEMS_PER_PAGE
            setExploreConferences(sorted.slice(start, start + ITEMS_PER_PAGE).map(mapToExploreConference))
            setExploreTotal(sorted.length)
          }
        } else if (activeTab === "drafts") {
          const res = await listConferences({
            myConferences: true,
            role: currentRole === "pc" ? "pc" : "chair",
            status: "draft",
            title: debouncedSearch || undefined,
            limit: 500,
            offset: 0,
          })
          if (!cancelled) {
            const sorted = sortApiConferences(res.data?.conferences || [], sortBy)
            const start = (currentPage - 1) * ITEMS_PER_PAGE
            setDraftConferences(sorted.slice(start, start + ITEMS_PER_PAGE).map(mapToChairConference))
            setDraftTotal(sorted.length)
          }
        } else if (activeTab === "archived") {
          const res = await listConferences({
            myConferences: true,
            role: currentRole === "pc" ? "pc" : "chair",
            status: "archived",
            title: debouncedSearch || undefined,
            limit: 500,
            offset: 0,
          })
          if (!cancelled) {
            const sorted = sortApiConferences(res.data?.conferences || [], sortBy)
            const start = (currentPage - 1) * ITEMS_PER_PAGE
            setArchivedConferences(sorted.slice(start, start + ITEMS_PER_PAGE).map(mapToExploreConference))
            setArchivedTotal(sorted.length)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load conferences")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchData()
    return () => {
      cancelled = true
    }
  }, [activeTab, debouncedSearch, currentPage, reloadKey, currentRole, sortBy])

  const handleNavigate = (id: string) => {
    router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(id))
  }

  const handleViewDetails = (id: string) => {
    router.push(ROUTES.CHAIR.CONFERENCE_DETAIL(id))
  }

  const handleCreateConference = () => {
    router.push(ROUTES.CHAIR.NEW_CONFERENCE)
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSortBy("date-newest")
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const handleApplyTemplate = (data: Partial<ConferenceFormData>) => {
    sessionStorage.setItem("conferenceTemplateDraft", JSON.stringify(data))
    router.push(ROUTES.CHAIR.NEW_CONFERENCE)
  }

  const handleConferenceActionComplete = () => {
    setReloadKey((current) => current + 1)
  }

  const renderMoreMenu = (conference: Conference) => {
    const backendStatus: ApiConference["status"] =
      conference.status === "draft"
        ? "draft"
        : conference.status === "active"
          ? "reviewing"
          : "completed"

    return (
      <ConferenceMoreMenu
        conferenceId={conference.id}
        conferenceStatus={backendStatus}
        userRole={conference.role}
        compact
        onActionComplete={handleConferenceActionComplete}
      />
    )
  }

  const renderArchivedMoreMenu = (conference: ExploreConference) => (
    <ConferenceMoreMenu
      conferenceId={conference.id}
      conferenceStatus="archived"
      userRole={conference.userRole}
      compact
      onActionComplete={handleConferenceActionComplete}
    />
  )

  // Get data and render based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16 text-xs text-slate-500">
          {t("runtime.components.chair.chair-conferences.text_loading_conferences")}{" "}
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {t("runtime.components.chair.chair-conferences.text_failed_to_load_conferences")} {error}
        </div>
      )
    }

    if (activeTab === "my-conferences") {
      const totalPages = Math.ceil(myTotal / ITEMS_PER_PAGE) || 1
      if (!loading && myConferences.length === 0 && !searchQuery)
        return <EmptyState type={activeTab} />
      if (!loading && myConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ConferenceList
              conferences={myConferences}
              onNavigate={handleNavigate}
              renderMoreMenu={renderMoreMenu}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={myTotal}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )
      }

      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myConferences.map((conference) => (
              <ConferenceCard
                key={conference.id}
                conference={conference}
                onNavigate={handleNavigate}
                moreMenu={renderMoreMenu(conference)}
              />
            ))}
            {!readOnly && <CreateConferenceCard onClick={handleCreateConference} />}
          </div>
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            total={myTotal}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )
    }

    if (activeTab === "explore") {
      const totalPages = Math.ceil(exploreTotal / ITEMS_PER_PAGE) || 1
      if (!loading && exploreConferences.length === 0 && !searchQuery)
        return <EmptyState type={activeTab} />
      if (!loading && exploreConferences.length === 0 && searchQuery) return <NoResultsState />

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

    if (activeTab === "drafts") {
      const totalPages = Math.ceil(draftTotal / ITEMS_PER_PAGE) || 1
      if (!loading && draftConferences.length === 0 && !searchQuery)
        return <EmptyState type={activeTab} />
      if (!loading && draftConferences.length === 0 && searchQuery) return <NoResultsState />

      // Drafts are always list-style: focus on editing, not grid cards
      return (
        <div className="flex flex-col gap-4">
          <ConferenceList
            conferences={draftConferences}
            onNavigate={handleNavigate}
            renderMoreMenu={renderMoreMenu}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={draftTotal}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )
    }

    if (activeTab === "archived") {
      const totalPages = Math.ceil(archivedTotal / ITEMS_PER_PAGE) || 1
      if (!loading && archivedConferences.length === 0 && !searchQuery)
        return <EmptyState type={activeTab} />
      if (!loading && archivedConferences.length === 0 && searchQuery) return <NoResultsState />

      if (viewMode === "list") {
        return (
          <div className="flex flex-col gap-4">
            <ArchivedConferenceList
              conferences={archivedConferences}
              onViewDetails={handleViewDetails}
              renderMoreMenu={renderArchivedMoreMenu}
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
                moreMenu={renderArchivedMoreMenu(conference)}
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
    <div className="flex flex-col relative">
      {/* Header */}
      <Header
        onCreateConference={handleCreateConference}
        onManageTemplates={() => setIsTemplateSheetOpen(true)}
        readOnly={readOnly}
      />

      {/* Tabs */}
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Toolbar */}
      <Toolbar
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content */}
      <div className="flex-1">{renderContent()}</div>

      <ConferenceTemplateSheet
        open={isTemplateSheetOpen}
        onOpenChange={setIsTemplateSheetOpen}
        onApply={handleApplyTemplate}
        allowSave={false}
      />
    </div>
  )
}

// -------------------------------------------------------------------------
// Header Component
// -------------------------------------------------------------------------

interface HeaderProps {
  onCreateConference: () => void
  onManageTemplates: () => void
  readOnly?: boolean
}

function Header({ onCreateConference, onManageTemplates, readOnly }: HeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
          {t("runtime.components.chair.chair-conferences.text_conferences")}{" "}
        </h1>
        <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
          {t(
            "runtime.components.chair.chair-conferences.text_manage_your_conferences_and_discover_new",
          )}
        </p>
      </div>
      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            onClick={onManageTemplates}
            className="h-9 px-4 bg-white dark:bg-slate-800 text-[#1B3C53] dark:text-white border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="size-4" />
            {t("runtime.components.chair.conference-form-page.text_open_templates") ||
              "Manage Templates"}
          </button>

          <button
            onClick={onCreateConference}
            className="h-9 px-4 bg-[#1B3C53] dark:bg-white text-white dark:text-[#1B3C53] text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-[#234C6A] dark:hover:bg-slate-100 transition-all duration-200 flex items-center gap-2"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px", width: "16px", height: "16px" }}
            >
              add
            </span>
            {t("runtime.components.chair.chair-conferences.text_create_conference")}
          </button>
        </div>
      )}
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
  const { t } = useTranslation()
  const tabs: { key: TabType; label: string }[] = [
    {
      key: "my-conferences",
      label: t("runtime.components.chair.chair-conferences.prop_label_my_conferences"),
    },
    { key: "explore", label: t("runtime.components.chair.chair-conferences.prop_label_explore") },
    { key: "drafts", label: t("runtime.components.chair.chair-conferences.prop_label_drafts") },
    { key: "archived", label: t("runtime.components.chair.chair-conferences.prop_label_archived") },
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
  const { t } = useTranslation()
  const placeholders: Record<TabType, string> = {
    "my-conferences": "Search conferences...",
    explore: "Search conferences...",
    drafts: "Search drafts...",
    archived: "Search archived conferences...",
  }

  const sortOptions: Record<TabType, { value: string; label: string }[]> = {
    "my-conferences": [
      {
        value: "date-newest",
        label: t("runtime.components.chair.chair-conferences.prop_label_date_newest"),
      },
      {
        value: "name-asc",
        label: t("runtime.components.chair.chair-conferences.prop_label_name_a_z"),
      },
      {
        value: "submissions",
        label: t("runtime.components.chair.chair-conferences.prop_label_submissions_high_low"),
      },
    ],
    drafts: [
      {
        value: "date-newest",
        label: t("runtime.components.chair.chair-conferences.prop_label_date_newest"),
      },
      {
        value: "name-asc",
        label: t("runtime.components.chair.chair-conferences.prop_label_name_a_z"),
      },
    ],
    explore: [
      {
        value: "popularity",
        label: t("runtime.components.chair.chair-conferences.prop_label_popularity"),
      },
      {
        value: "date-upcoming",
        label: t("runtime.components.chair.chair-conferences.prop_label_date_upcoming"),
      },
      {
        value: "name-asc",
        label: t("runtime.components.chair.chair-conferences.prop_label_name_a_z"),
      },
    ],
    archived: [
      {
        value: "date-newest",
        label: t("runtime.components.chair.chair-conferences.prop_label_date_newest"),
      },
      {
        value: "name-asc",
        label: t("runtime.components.chair.chair-conferences.prop_label_name_a_z"),
      },
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
            {t("runtime.components.chair.chair-conferences.text_sort_by")}{" "}
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

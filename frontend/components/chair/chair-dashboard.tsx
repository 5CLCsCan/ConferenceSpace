import { ConferenceCard } from "@/components/chair/conference-table-row"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo, useCallback } from "react"
import { listConferences } from "@/lib/api/conferences"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"
import { useDebounce } from "@/hooks/use-debounce"
import { typography, spacing } from "@/lib/typography"
import Link from "next/link"

type ViewMode = "your" | "discover"
type StatusFilter = "open" | "reviewing" | "completed" | ""

export default function ChairDashboard() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>("your")
  const [conferences, setConferences] = useState<
    Array<{
      id: string
      name: string
      acronym: string
      dates: string
      status: "open" | "reviewing" | "completed"
      submissions: number
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20 // Items per page

  const totalPages = Math.ceil(total / limit)

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        setLoading(true)

        const offset = (currentPage - 1) * limit

        // Use backend query parameters to filter conferences
        const filters: any = {
          limit,
          offset,
        }

        // Add view mode filter
        if (viewMode === "your") {
          filters.myConferences = true
          filters.role = "chair"
        }

        // Add search filter (pass to backend as 'title' parameter)
        if (debouncedSearchQuery.trim()) {
          filters.title = debouncedSearchQuery.trim()
        }

        // Add status filter (pass to backend)
        if (statusFilter) {
          filters.status = statusFilter
        }

        const response = await listConferences(filters)

        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          // Transform API data to component format
          let transformedConferences = response.data.conferences.map((conf) => ({
            id: conf.id,
            name: conf.name,
            acronym: conf.acronym,
            dates: conf.conference_date
              ? new Date(conf.conference_date).toLocaleDateString()
              : "TBD",
            status: conf.status as "open" | "reviewing" | "completed",
            submissions: 0, // TODO: Get actual submission count
            chair: conf.chair,
            primary_contact: conf.primary_contact,
            area_chair: conf.area_chair,
          }))

          // In "discover" mode, filter out conferences created by the current user
          if (viewMode === "discover" && user) {
            transformedConferences = transformedConferences.filter((conf) => {
              const isCreatedByUser =
                conf.chair === user.email ||
                (user.id &&
                  (conf.primary_contact?.toString() === user.id ||
                    conf.area_chair?.toString() === user.id))
              return !isCreatedByUser
            })
          }

          // Remove the extra fields before setting state
          const finalConferences = transformedConferences.map(
            ({ chair, primary_contact, area_chair, ...rest }) => rest,
          )
          setConferences(finalConferences)
          setTotal(response.data.total || 0)
        }
      } catch (err) {
        setError(t("dashboard.chair.dashboard.messages.error"))
      } finally {
        setLoading(false)
      }
    }

    fetchConferences()
  }, [viewMode, t, user, currentPage, debouncedSearchQuery, statusFilter, limit])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode, debouncedSearchQuery, statusFilter])

  const handleRemoveStatusFilter = () => {
    setStatusFilter("")
  }

  const hasActiveFilters = statusFilter !== ""

  const activeFilters: ActiveFilter[] = useMemo(() => {
    if (!statusFilter) return []
    return [
      {
        id: "status",
        label: t(`common.conferenceStatus.${statusFilter}`),
        onRemove: handleRemoveStatusFilter,
      },
    ]
  }, [statusFilter])

  const filterPopover = (
    <div className={spacing.subsection}>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>Status</h4>
        <div className={spacing.item}>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "open"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "open" : "")}
            />
            <span className={typography.body}>{t("common.conferenceStatus.open")}</span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "reviewing"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "reviewing" : "")}
            />
            <span className={typography.body}>{t("common.conferenceStatus.reviewing")}</span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "completed"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "completed" : "")}
            />
            <span className={typography.body}>{t("common.conferenceStatus.completed")}</span>
          </label>
        </div>
      </div>
      <div className={`flex justify-end ${spacing.gap.sm} pt-2 border-t`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusFilter("")
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  )

  const renderStatusBadge = useCallback((status: "open" | "reviewing" | "completed") => {
    const statusStyles = {
      open: "bg-success/10 text-success",
      reviewing: "bg-primary/10 text-primary",
      completed: "bg-secondary/10 text-secondary",
    }

    const statusLabel = t(`common.conferenceStatus.${status}`)

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full ${typography.bodySmall} ${typography.medium} ${statusStyles[status]}`}
      >
        {statusLabel}
      </span>
    )
  }, [t])

  type ConferenceData = {
    id: string
    name: string
    acronym: string
    dates: string
    status: "open" | "reviewing" | "completed"
    submissions: number
  }

  const columns = useMemo<DataTableColumn<ConferenceData>[]>(
    () => [
      {
        key: "name",
        label: t("dashboard.chair.dashboard.tableHeaders.conferenceName"),
        render: (conference) => (
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/dashboard/conference/${conference.id}`)
            }}
          >
            <div className={`${typography.semibold} text-foreground`}>{conference.name}</div>
            <div className={`${typography.body} text-muted-foreground`}>{conference.acronym}</div>
          </div>
        ),
      },
      {
        key: "dates",
        label: t("dashboard.chair.dashboard.tableHeaders.dates"),
        width: "w-32",
        render: (conference) => (
          <span className={`${typography.body} text-foreground`}>{conference.dates}</span>
        ),
        mobileLabel: t("dashboard.chair.dashboard.tableHeaders.dates"),
      },
      {
        key: "status",
        label: t("dashboard.chair.dashboard.tableHeaders.status"),
        width: "w-40",
        render: (conference) => renderStatusBadge(conference.status),
        mobileLabel: t("dashboard.chair.dashboard.tableHeaders.status"),
      },
      {
        key: "submissions",
        label: t("dashboard.chair.dashboard.tableHeaders.submissions"),
        width: "w-32",
        render: (conference) => (
          <span className={`${typography.body} text-foreground`}>{conference.submissions}</span>
        ),
        mobileLabel: t("dashboard.chair.dashboard.tableHeaders.submissions"),
      },
    ],
    [t, renderStatusBadge, router],
  )
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          {/* <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, Administrator.
          </h1>
          <p className="text-base text-muted-foreground mb-6">
            Your central hub for managing all academic conferences.
          </p> */}

          <div className="flex flex-wrap gap-4">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push(`/dashboard/chair/create-conference`)}
            >
              {t("dashboard.chair.dashboard.createNewConference")}
            </Button>
          </div>
        </section>

        {/* Conference Management List */}
        <section className="mb-12">
          <div className={`flex items-center ${spacing.gap.md} mb-4`}>
            <h2
              className={`${typography.h2} ${typography.semibold} cursor-pointer transition-all px-4 py-2 rounded-md ${
                viewMode === "your"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => {
                setViewMode("your")
                setSearchQuery("")
                setStatusFilter("")
              }}
            >
              {t("dashboard.chair.dashboard.yourConferences")}
            </h2>
            <span className="text-muted-foreground">/</span>
            <h2
              className={`${typography.h2} ${typography.semibold} cursor-pointer transition-all px-4 py-2 rounded-md ${
                viewMode === "discover"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => {
                setViewMode("discover")
                setSearchQuery("")
                setStatusFilter("")
              }}
            >
              {t("dashboard.chair.dashboard.discoverConferences")}
            </h2>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-4">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t("dashboard.chair.dashboard.searchPlaceholder")}
              activeFilters={activeFilters}
              filterPopover={filterPopover}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Data Table */}
          <DataTable<ConferenceData>
            columns={columns}
            data={conferences}
            loading={loading}
            error={error}
            emptyMessage={t("dashboard.chair.dashboard.messages.noConferencesFound")}
            loadingMessage={t("dashboard.chair.dashboard.messages.loading")}
            errorMessage={
              error ? `${t("dashboard.chair.dashboard.messages.error")}: ${error}` : undefined
            }
            getRowKey={(conference) => conference.id}
            onRowClick={(conference) => {
              router.push(`/dashboard/conference/${conference.id}`)
            }}
            renderMobileCard={(conference) => <ConferenceCard {...conference} />}
          />

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className={`${typography.body} text-muted-foreground`}>
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} conferences
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted py-6 mt-16">
        <div className="container mx-auto px-4">
          <div
            className={`flex flex-col sm:flex-row items-center justify-center ${spacing.gap.md} ${typography.body} text-muted-foreground`}
          >
            <span>© 2025 ConferenceHub</span>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Help
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-primary transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

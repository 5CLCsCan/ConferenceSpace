"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { listConferences, toggleBookmark } from "@/lib/api/conferences"
import { formatDate } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import type { Conference, ConferenceStatus } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { Bookmark, BookmarkCheck } from "lucide-react"

type ViewMode = "my" | "discover"
type StatusFilter = "open" | "reviewing" | "completed" | ""

export function AuthorDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("discover") // Default view mode
  const [conferences, setConferences] = useState<Conference[]>([])
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

  // Fetch conferences based on view mode - use backend filtering!
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
        if (viewMode === "my") {
          // For "My Conference" tab: show conferences where user has submissions OR bookmarks
          // We'll fetch both and merge them
          // First, get conferences with submissions (role=author)
          const submissionsFilters = {
            ...filters,
            myConferences: true,
            role: "author",
          }

          // Add search filter if present
          if (debouncedSearchQuery.trim()) {
            submissionsFilters.title = debouncedSearchQuery.trim()
          }

          const [submissionsResponse, bookmarksResponse] = await Promise.all([
            listConferences(submissionsFilters),
            listConferences({
              ...filters,
              myBookmark: true,
              title: debouncedSearchQuery.trim() || undefined,
            }),
          ])

          // Merge results, avoiding duplicates
          const conferenceMap = new Map<string, Conference>()

          if (submissionsResponse.data) {
            submissionsResponse.data.conferences.forEach((conf) => {
              conferenceMap.set(conf.id, conf)
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

          let mergedConferences = Array.from(conferenceMap.values())

          if (statusFilter) {
            mergedConferences = mergedConferences.filter(
              (conf) => computeConferenceStatus(conf) === statusFilter,
            )
          }

          setConferences(mergedConferences)
          setTotal(mergedConferences.length)
        } else {
          // Explore tab: show all conferences
          // Add search filter (pass to backend as 'title' parameter)
          if (debouncedSearchQuery.trim()) {
            filters.title = debouncedSearchQuery.trim()
          }

          const conferencesResponse = await listConferences(filters)

          if (conferencesResponse.error) {
            setError(conferencesResponse.error)
          } else if (conferencesResponse.data) {
            let list = conferencesResponse.data.conferences

            if (statusFilter) {
              list = list.filter((conf) => computeConferenceStatus(conf) === statusFilter)
            }

            setConferences(list)
            setTotal(list.length)
          }
        }
      } catch (err) {
        setError("Failed to load conferences")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchConferences()
    }
  }, [user, viewMode, currentPage, debouncedSearchQuery, statusFilter, limit]) // Re-fetch when filters or page changes

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

  const computeConferenceStatus = (conference: Conference): ConferenceStatus => {
    const parseDate = (value?: string | null) => (value ? new Date(value) : null)
    const now = new Date()
    const submissionDeadline = parseDate(conference.submission_deadline)
    const conferenceEnd = parseDate(conference.conference_end_date ?? conference.conference_date)

    if (submissionDeadline && now < submissionDeadline) {
      return "open"
    }

    if (conferenceEnd) {
      return now >= conferenceEnd ? "completed" : "reviewing"
    }

    return conference.status
  }

  // Handle bookmark toggle
  const handleBookmarkToggle = async (conference: Conference, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click

    try {
      const result = await toggleBookmark(conference.id)

      if (result.error) {
        console.error("Failed to toggle bookmark:", result.error)
        toast({
          title: "Bookmark failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      const isBookmarked = result.data?.isBookmarked ?? false

      toast({
        title: isBookmarked ? "Conference bookmarked" : "Bookmark removed",
        description: conference.name,
      })

      setConferences((prev) => {
        const updated = prev.map((conf) =>
          conf.id === conference.id ? { ...conf, isBookmarked } : conf,
        )

        if (viewMode === "discover") {
          return updated.filter((conf) => !conf.isBookmarked)
        }

        if (viewMode === "my") {
          return updated.filter((conf) => {
            if (conf.id !== conference.id) return true
            if (conf.isBookmarked) return true
            return conf.userRole === "author"
          })
        }

        return updated
      })
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }

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

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        {/* Conference Management List */}
        <section className="mb-12">
          <div className={`flex items-center ${spacing.gap.md} mb-4`}>
            <h2
              className={`${typography.h2} ${typography.semibold} cursor-pointer transition-all px-4 pb-1 rounded-t-md border-b-2 ${
                viewMode === "my"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setViewMode("my")
                setSearchQuery("")
                setStatusFilter("")
              }}
            >
              {t("dashboard.author.dashboard.myConferences")}
            </h2>
            <span className="text-muted-foreground">/</span>
            <h2
              className={`${typography.h2} ${typography.semibold} cursor-pointer transition-all px-4 pb-1 rounded-t-md border-b-2 ${
                viewMode === "discover"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setViewMode("discover")
                setSearchQuery("")
                setStatusFilter("")
              }}
            >
              {t("dashboard.author.dashboard.exploreConferences")}
            </h2>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-4">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder={t("dashboard.author.dashboard.searchPlaceholder")}
              activeFilters={activeFilters}
              filterPopover={filterPopover}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Data Table */}
          <DataTable<Conference>
            columns={useMemo<DataTableColumn<Conference>[]>(() => {
              const baseColumns: DataTableColumn<Conference>[] = [
                {
                  key: "name",
                  label: t("dashboard.author.dashboard.tableHeaders.conferenceName"),
                  render: (conference) => (
                    <>
                      <Link
                        href={`/dashboard/conference/${conference.id}`}
                        className={`text-primary hover:underline block ${typography.medium} truncate`}
                      >
                        {conference.name}
                      </Link>
                      <div className={`${typography.body} text-muted-foreground`}>
                        {conference.acronym}
                      </div>
                    </>
                  ),
                },
                {
                  key: "conference_date",
                  label: t("dashboard.author.dashboard.tableHeaders.date"),
                  width: "w-36",
                  render: (conference) => (
                    <div className="whitespace-nowrap">
                      {conference.conference_date ? formatDate(conference.conference_date) : "-"}
                    </div>
                  ),
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.date"),
                },
                {
                  key: "submission_deadline",
                  label: t("dashboard.author.dashboard.tableHeaders.submissionDeadline"),
                  width: "w-[140px]",
                  render: (conference) => (
                    <div className="whitespace-nowrap">
                      {conference.submission_deadline
                        ? formatDate(conference.submission_deadline)
                        : "-"}
                    </div>
                  ),
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.submissionDeadline"),
                },
                {
                  key: "status",
                  label: "Status",
                  width: "w-32",
                  render: (conference) => {
                    if (viewMode === "my") {
                      // For My Conference: show submission status
                      // TODO: This should come from backend with submission data
                      const status =
                        conference.submissionStatus || conference.userRole === "author"
                          ? t("common.status.submitted")
                          : t("common.status.bookmarked")
                      const statusColors: Record<string, string> = {
                        Submitted: "bg-blue-100 text-blue-800",
                        Reviewing: "bg-yellow-100 text-yellow-800",
                        Accepted: "bg-green-100 text-green-800",
                        Rejected: "bg-red-100 text-red-800",
                        Bookmarked: "bg-gray-100 text-gray-800",
                      }
                      return (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {status}
                        </span>
                      )
                    } else {
                      // For Explore: show conference status
                      const derivedStatus = computeConferenceStatus(conference)
                      const statusMap: Record<ConferenceStatus, string> = {
                        open: t("common.conferenceStatus.open"),
                        reviewing: t("common.conferenceStatus.reviewing"),
                        completed: t("common.conferenceStatus.completed"),
                      }
                      const statusColors: Record<ConferenceStatus, string> = {
                        open: "bg-green-100 text-green-800",
                        reviewing: "bg-yellow-100 text-yellow-800",
                        completed: "bg-gray-100 text-gray-800",
                      }
                      return (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[derivedStatus]}`}
                        >
                          {statusMap[derivedStatus]}
                        </span>
                      )
                    }
                  },
                  mobileLabel: "Status",
                },
                {
                  key: "actions",
                  label: "Action",
                  width: "w-24",
                  render: (conference) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleBookmarkToggle(conference, e)}
                      className="hover:bg-accent"
                    >
                      {conference.isBookmarked || conference.userRole === "author" ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  ),
                  mobileLabel: "Action",
                },
              ]

              return baseColumns
            }, [viewMode, t])}
            data={conferences}
            loading={loading}
            error={error}
            emptyMessage={t("dashboard.author.dashboard.messages.noConferencesFound")}
            loadingMessage={t("dashboard.author.dashboard.messages.loading")}
            errorMessage={
              error ? `${t("dashboard.author.dashboard.messages.error")}: ${error}` : undefined
            }
            getRowKey={(conference) => conference.id}
            onRowClick={(conference) => {
              router.push(`/dashboard/conference/${conference.id}`)
            }}
            renderMobileCard={(conference) => (
              <div className={spacing.padding.card}>
                <Link
                  href={`/dashboard/conference/${conference.id}`}
                  className={`text-primary hover:underline block ${typography.medium} mb-2`}
                >
                  {conference.name}
                </Link>
                <div className={`${typography.body} text-muted-foreground mb-2`}>
                  {conference.acronym}
                </div>
                <div
                  className={`flex flex-col ${spacing.gap.sm} ${typography.body} text-muted-foreground`}
                >
                  <div>
                    {t("dashboard.author.dashboard.tableHeaders.date")}:{" "}
                    {conference.conference_date ? formatDate(conference.conference_date) : "-"}
                  </div>
                  <div>
                    {t("dashboard.author.dashboard.tableHeaders.submissionDeadline")}:{" "}
                    {conference.submission_deadline
                      ? formatDate(conference.submission_deadline)
                      : "-"}
                  </div>
                </div>
              </div>
            )}
          />

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className={`${typography.body} text-muted-foreground`}>
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of{" "}
                {total} conferences
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
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
    </div>
  )
}

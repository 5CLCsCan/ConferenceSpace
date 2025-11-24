"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { listConferences } from "@/lib/api/conferences"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import type { Conference } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing, iconSizes } from "@/lib/typography"

type ViewMode = "my" | "discover"
type StatusFilter = "active" | "upcoming" | "archived" | ""

export function AuthorDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("discover") // Default view mode
  const [allConferences, setAllConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")

  // Fetch conferences based on view mode - use backend filtering!
  useEffect(() => {
    const fetchConferences = async () => {
      try {
        setLoading(true)

        // Use backend query parameters to filter conferences
        const filters = viewMode === "my" 
          ? { limit: 100, myConferences: true, role: "author" } // My conferences with author role
          : { limit: 100 }; // All conferences

        const conferencesResponse = await listConferences(filters)

        if (conferencesResponse.error) {
          setError(conferencesResponse.error)
        } else if (conferencesResponse.data) {
          setAllConferences(conferencesResponse.data.conferences)
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
  }, [user, viewMode]) // Re-fetch when viewMode changes

  // Use the filtered conferences from backend
  const conferencesWithSubmissions = viewMode === "my" ? allConferences : []
  const exploreConferences = viewMode === "discover" ? allConferences : []

  // Filter conferences based on viewMode, search, status, and category
  const conferences = useMemo(() => {
    const sourceConferences = viewMode === "my" ? conferencesWithSubmissions : exploreConferences
    let filtered = [...sourceConferences]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (conf) =>
          conf.name.toLowerCase().includes(query) ||
          conf.acronym.toLowerCase().includes(query) ||
          conf.location.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((conf) => conf.status === statusFilter)
    }

    return filtered
  }, [viewMode, conferencesWithSubmissions, exploreConferences, searchQuery, statusFilter])

  const handleRemoveStatusFilter = () => {
    setStatusFilter("")
  }

  const hasActiveFilters = statusFilter !== ""

  const activeFilters: ActiveFilter[] = useMemo(() => {
    if (!statusFilter) return []
    return [
      {
        id: "status",
        label:
          statusFilter === "active"
            ? "Accepting Submissions"
            : statusFilter === "upcoming"
              ? "In Review"
              : "Archived",
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
              checked={statusFilter === "active"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "active" : "")}
            />
            <span className={typography.body}>Accepting Submissions</span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "upcoming"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "upcoming" : "")}
            />
            <span className={typography.body}>In Review</span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "archived"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "archived" : "")}
            />
            <span className={typography.body}>Archived</span>
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
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Conference Management List */}
        <section className="mb-12">
          <div className={`flex items-center ${spacing.gap.md} mb-4`}>
            <h2
              className={`${typography.h2} ${typography.semibold} cursor-pointer transition-all px-4 py-2 rounded-md ${
                viewMode === "my"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                  key: "location",
                  label: t("dashboard.author.dashboard.tableHeaders.location"),
                  width: "w-36",
                  render: (conference) => (
                    <div className="whitespace-nowrap">{conference.location || "-"}</div>
                  ),
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.location"),
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
                      {conference.submission_deadline ? formatDate(conference.submission_deadline) : "-"}
                    </div>
                  ),
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.submissionDeadline"),
                },
              ]

              // Note: Removed "status" column since we don't load submissions on this page
              // Submissions are loaded when user clicks into a specific conference

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
                    {t("dashboard.author.dashboard.tableHeaders.location")}:{" "}
                    {conference.location || "-"}
                  </div>
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
        </section>
      </main>
    </div>
  )
}

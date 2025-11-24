"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { listConferences } from "@/lib/api/conferences"
import { getUserSubmissions } from "@/lib/api/submissions"
import type { SubmissionWithConference } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo, useCallback } from "react"
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
  const [viewMode, setViewMode] = useState<ViewMode>("my")
  const [allConferences, setAllConferences] = useState<Conference[]>([])
  const [mySubmissions, setMySubmissions] = useState<SubmissionWithConference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all conferences
        const conferencesResponse = await listConferences({ limit: 100 })

        if (conferencesResponse.error) {
          setError(conferencesResponse.error)
        } else if (conferencesResponse.data) {
          // Transform API data to frontend format
          const conferences: Conference[] = conferencesResponse.data.conferences.map((conf) => ({
            id: conf.id,
            name: conf.name,
            acronym: conf.acronym,
            year: conf.year,
            description: conf.description,
            submission_deadline: conf.submission_deadline,
            review_deadline: conf.review_deadline || "",
            camera_ready_deadline: conf.camera_ready_deadline,
            notification_date: conf.notification_date || "",
            conference_date: conf.conference_date,
            location: "", // TODO: Map from backend
            website: conf.website || "",
            status: conf.status,
            tracks: conf.tracks,
          }))

          setAllConferences(conferences)

          // Fetch user submissions if user is authenticated
          if (user?.email) {
            const submissionsResponse = await getUserSubmissions(user.email)
            if (submissionsResponse.data) {
              setMySubmissions(submissionsResponse.data)
            } else if (submissionsResponse.error) {
              // Don't set error if submissions fail, just show empty state
              console.error("Failed to load submissions:", submissionsResponse.error)
            }
          }
        }
      } catch (err) {
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  // Get unique conferences from submissions (group by conference ID)
  const conferencesWithSubmissions = Array.from(
    new Map(mySubmissions.map((sub) => [sub.conference.id, sub.conference])).values(),
  )

  // Get the latest submission status for each conference
  const getConferenceSubmissionStatus = useCallback(
    (conferenceId: string): string => {
      const conferenceSubmissions = mySubmissions.filter(
        (sub) => sub.conference.id === conferenceId,
      )
      if (conferenceSubmissions.length === 0) return ""

      // Return the most recent submission status, or "draft" if any is draft
      const hasDraft = conferenceSubmissions.some((sub) => sub.status === "draft")
      if (hasDraft) return "Nháp"
      return "Đã nộp"
    },
    [mySubmissions],
  )

  // Filter out conferences that have submissions for discover mode
  const exploreConferences = allConferences.filter(
    (conf) => !conferencesWithSubmissions.some((myConf) => myConf.id === conf.id),
  )

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

  const renderStatusBadge = useCallback((status: string) => {
    const statusVariants = {
      Nháp: "bg-yellow-100 text-yellow-800",
      "Đã nộp": "bg-blue-100 text-blue-800",
      "Được chấp nhận": "bg-green-100 text-green-800",
      "Bị từ chối": "bg-red-100 text-red-800",
      "Đang đánh giá": "bg-orange-100 text-orange-800",
    }
    return (
      <Badge
        className={`${statusVariants[status as keyof typeof statusVariants] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </Badge>
    )
  }, [])

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
                  key: "conference_date",
                  label: t("dashboard.author.dashboard.tableHeaders.date"),
                  width: "w-36",
                  render: (conference) => formatDate(conference.conference_date),
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.date"),
                },
                {
                  key: "location",
                  label: t("dashboard.author.dashboard.tableHeaders.location"),
                  width: "w-36",
                  render: (conference) => conference.location || "-",
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.location"),
                },
                {
                  key: "submission_deadline",
                  label: t("dashboard.author.dashboard.tableHeaders.submissionDeadline"),
                  width: "w-[140px]",
                  render: (conference) => formatDate(conference.submission_deadline),
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.submissionDeadline"),
                },
              ]

              if (viewMode === "my") {
                baseColumns.push({
                  key: "status",
                  label: t("dashboard.author.dashboard.tableHeaders.status"),
                  width: "w-28",
                  render: (conference) => {
                    const status = getConferenceSubmissionStatus(conference.id)
                    return status ? renderStatusBadge(status) : null
                  },
                  mobileLabel: t("dashboard.author.dashboard.tableHeaders.status"),
                })
              }

              return baseColumns
            }, [viewMode, t, getConferenceSubmissionStatus, renderStatusBadge])}
            data={conferences}
            loading={loading}
            error={error}
            emptyMessage={
              viewMode === "my"
                ? t("dashboard.author.dashboard.noSubmissions")
                : t("dashboard.author.dashboard.messages.noConferencesFound")
            }
            loadingMessage={t("dashboard.author.dashboard.messages.loading")}
            errorMessage={
              error ? `${t("dashboard.author.dashboard.messages.error")}: ${error}` : undefined
            }
            getRowKey={(conference) => conference.id}
            onRowClick={(conference) => {
              router.push(`/dashboard/conference/${conference.id}`)
            }}
            renderMobileCard={(conference) => {
              const submissionStatus =
                viewMode === "my" ? getConferenceSubmissionStatus(conference.id) : null
              return (
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
                      {formatDate(conference.conference_date)}
                    </div>
                    <div>
                      {t("dashboard.author.dashboard.tableHeaders.location")}:{" "}
                      {conference.location || "-"}
                    </div>
                    <div>
                      {t("dashboard.author.dashboard.tableHeaders.submissionDeadline")}:{" "}
                      {formatDate(conference.submission_deadline)}
                    </div>
                    {viewMode === "my" && submissionStatus && (
                      <div>
                        {t("dashboard.author.dashboard.tableHeaders.status")}:{" "}
                        {renderStatusBadge(submissionStatus)}
                      </div>
                    )}
                  </div>
                </div>
              )
            }}
          />
        </section>
      </main>
    </div>
  )
}

"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { FileText, FileCheck, Paperclip } from "lucide-react"
import { getUserSubmissions } from "@/lib/api/submissions"
import type { SubmissionWithConference } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing } from "@/lib/typography"

export function AuthorSubmissionsList() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<SubmissionWithConference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [conferenceFilter, setConferenceFilter] = useState<string>("all")

  useEffect(() => {
    const fetchSubmissions = async () => {
      console.log("[AuthorSubmissionsList] useEffect triggered", {
        userEmail: user?.email,
        hasUser: !!user,
        userObjectKeys: user ? Object.keys(user) : [],
        fullUserObject: JSON.stringify(user, null, 2),
      })

      if (!user?.email) {
        console.warn("[AuthorSubmissionsList] No user email found, skipping fetch", {
          user,
          userKeys: user ? Object.keys(user) : [],
          userEmailValue: user?.email,
          userEmailType: typeof user?.email,
        })
        setLoading(false)
        return
      }

      try {
        console.log("[AuthorSubmissionsList] Starting fetch for user:", user.email)
        setLoading(true)
        const response = await getUserSubmissions(user.email)
        console.log("[AuthorSubmissionsList] Fetch response:", {
          hasError: !!response.error,
          hasData: !!response.data,
          dataLength: response.data?.length || 0,
        })

        if (response.error) {
          console.error("[AuthorSubmissionsList] Error:", response.error)
          setError(response.error)
        } else if (response.data) {
          console.log("[AuthorSubmissionsList] Setting submissions:", response.data.length)
          setSubmissions(response.data)
        } else {
          console.warn("[AuthorSubmissionsList] No data and no error in response")
          setSubmissions([])
        }
      } catch (err) {
        console.error("[AuthorSubmissionsList] Exception:", err)
        setError("Failed to load submissions")
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [user])

  // Get unique conferences for filter dropdown
  const uniqueConferences = useMemo(() => {
    const conferences = new Map<string, { id: string; name: string; acronym: string }>()
    submissions.forEach((sub) => {
      if (!conferences.has(sub.conference.id)) {
        conferences.set(sub.conference.id, {
          id: sub.conference.id,
          name: sub.conference.name,
          acronym: sub.conference.acronym,
        })
      }
    })
    return Array.from(conferences.values())
  }, [submissions])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch = sub.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter
      const matchesConference = conferenceFilter === "all" || sub.conference.id === conferenceFilter

      return matchesSearch && matchesStatus && matchesConference
    })
  }, [submissions, searchQuery, statusFilter, conferenceFilter])

  const handleRemoveStatusFilter = () => {
    setStatusFilter("all")
  }

  const handleRemoveConferenceFilter = () => {
    setConferenceFilter("all")
  }

  const hasActiveFilters = statusFilter !== "all" || conferenceFilter !== "all"

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = []
    if (statusFilter !== "all") {
      filters.push({
        id: "status",
        label: t(`dashboard.submissions.status.${statusFilter}`),
        onRemove: handleRemoveStatusFilter,
      })
    }
    if (conferenceFilter !== "all") {
      const conference = uniqueConferences.find((c) => c.id === conferenceFilter)
      if (conference) {
        filters.push({
          id: "conference",
          label: `${conference.name} (${conference.acronym})`,
          onRemove: handleRemoveConferenceFilter,
        })
      }
    }
    return filters
  }, [statusFilter, conferenceFilter, uniqueConferences, t])

  const filterPopover = (
    <div className={spacing.subsection}>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>
          {t("dashboard.submissions.filterStatus")}
        </h4>
        <div className={spacing.item}>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "all"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "all" : statusFilter)}
            />
            <span className={typography.body}>{t("dashboard.submissions.allStatuses")}</span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "draft"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "draft" : "all")}
            />
            <span className={typography.body}>{t("dashboard.submissions.status.draft")}</span>
          </label>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={statusFilter === "published"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "published" : "all")}
            />
            <span className={typography.body}>{t("dashboard.submissions.status.published")}</span>
          </label>
        </div>
      </div>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>
          {t("dashboard.submissions.filterConference")}
        </h4>
        <div className={spacing.item}>
          <label className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
            <Checkbox
              checked={conferenceFilter === "all"}
              onCheckedChange={(checked) => setConferenceFilter(checked ? "all" : conferenceFilter)}
            />
            <span className={typography.body}>{t("dashboard.submissions.allConferences")}</span>
          </label>
          {uniqueConferences.map((conf) => (
            <label key={conf.id} className={`flex items-center ${spacing.gap.sm} cursor-pointer`}>
              <Checkbox
                checked={conferenceFilter === conf.id}
                onCheckedChange={(checked) => setConferenceFilter(checked ? conf.id : "all")}
              />
              <span className={typography.body}>
                {conf.name} ({conf.acronym})
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className={`flex justify-end ${spacing.gap.sm} pt-2 border-t`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusFilter("all")
            setConferenceFilter("all")
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  )

  const renderStatusBadge = useCallback(
    (status: string) => {
      const statusConfig = {
        draft: {
          label: t("dashboard.submissions.status.draft"),
          className: "bg-yellow-100 text-yellow-800",
        },
        published: {
          label: t("dashboard.submissions.status.published"),
          className: "bg-blue-100 text-blue-800",
        },
      }

      const config = statusConfig[status as keyof typeof statusConfig] || {
        label: status,
        className: "bg-gray-100 text-gray-800",
      }

      return <Badge className={config.className}>{config.label}</Badge>
    },
    [t],
  )

  const columns = useMemo<DataTableColumn<SubmissionWithConference>[]>(
    () => [
      {
        key: "title",
        label: t("dashboard.submissions.title"),
        width: "w-[400px]",
        className: "min-w-0",
        render: (submission) => (
          <div className="min-w-0 w-[40vw] max-w-[40vw]">
            <Link
              href={`/dashboard/conference/${submission.conference_id}/submission/${submission.id}`}
              className="text-primary hover:underline block font-medium truncate"
            >
              {submission.title}
            </Link>
            <div className={`${typography.body} text-muted-foreground mt-1 line-clamp-2`}>
              {submission.abstract || t("dashboard.submissions.noAbstract")}
            </div>
          </div>
        ),
      },
      {
        key: "conference",
        label: t("dashboard.submissions.conference"),
        width: "w-48",
        className: "min-w-0",
        render: (submission) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{submission.conference.name}</div>
            <div className={`${typography.bodySmall} text-muted-foreground truncate`}>
              {submission.conference.acronym}
            </div>
          </div>
        ),
        mobileLabel: t("dashboard.submissions.conference"),
      },
      {
        key: "created_at",
        label: t("dashboard.submissions.submittedDate"),
        width: "w-32",
        className: "whitespace-nowrap",
        render: (submission) => (
          <div className="whitespace-nowrap">{formatDate(submission.created_at)}</div>
        ),
        mobileLabel: t("dashboard.submissions.submittedDate"),
      },
      {
        key: "status",
        label: t("dashboard.submissions.status.label"),
        width: "w-28",
        className: "whitespace-nowrap",
        render: (submission) => (
          <div className="whitespace-nowrap">{renderStatusBadge(submission.status)}</div>
        ),
        mobileLabel: t("dashboard.submissions.status.label"),
      },
      {
        key: "attachments",
        label: t("dashboard.submissions.attachments", "Files"),
        width: "w-24",
        className: "whitespace-nowrap",
        render: (submission) => (
          <div className="flex items-center gap-2">
            {submission.file && (
              <div className="flex items-center gap-1 text-xs text-gray-600" title="Paper attached">
                <FileText className="size-4 text-blue-600" />
                <span className="sr-only">Paper</span>
              </div>
            )}
            {submission.cover_letter && (
              <div
                className="flex items-center gap-1 text-xs text-gray-600"
                title="Cover letter attached"
              >
                <FileCheck className="size-4 text-green-600" />
                <span className="sr-only">Cover Letter</span>
              </div>
            )}
            {!submission.file && !submission.cover_letter && (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        ),
        mobileLabel: t("dashboard.submissions.attachments", "Files"),
      },
    ],
    [t, renderStatusBadge],
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="mb-4">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t("dashboard.submissions.searchPlaceholder")}
          activeFilters={activeFilters}
          filterPopover={filterPopover}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Submissions Table */}
      <DataTable<SubmissionWithConference>
        columns={columns}
        data={filteredSubmissions}
        loading={loading}
        error={error}
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="mx-auto size-12 text-muted-foreground mb-4" />
            <p className={typography.muted}>{t("dashboard.submissions.empty")}</p>
          </div>
        }
        loadingMessage={t("dashboard.submissions.loading")}
        errorMessage={error ? `${t("dashboard.submissions.error")}: ${error}` : undefined}
        getRowKey={(submission) => `${submission.conference_id}-${submission.id}`}
        onRowClick={(submission) => {
          router.push(
            `/dashboard/conference/${submission.conference_id}/submission/${submission.id}`,
          )
        }}
        renderMobileCard={(submission) => (
          <div className={spacing.padding.card}>
            <Link
              href={`/dashboard/conference/${submission.conference_id}/submission/${submission.id}`}
              className={`text-primary hover:underline block ${typography.medium} mb-2`}
            >
              {submission.title}
            </Link>
            <div className={`${typography.body} text-muted-foreground mb-2 line-clamp-2`}>
              {submission.abstract || t("dashboard.submissions.noAbstract")}
            </div>
            <div
              className={`flex flex-col ${spacing.gap.sm} ${typography.body} text-muted-foreground`}
            >
              <div>
                {t("dashboard.submissions.conference")}: {submission.conference.name} (
                {submission.conference.acronym})
              </div>
              <div>
                {t("dashboard.submissions.submittedDate")}: {formatDate(submission.created_at)}
              </div>
              <div>
                {t("dashboard.submissions.status.label")}: {renderStatusBadge(submission.status)}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}

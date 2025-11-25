"use client"

import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { Inbox, Loader2 } from "lucide-react"
import type { ReviewerConference } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing, iconSizes } from "@/lib/typography"

type StatusFilter = "open" | "reviewing" | "completed" | ""

interface ReviewerConferencesProps {
  conferences: ReviewerConference[]
  onSelectConference: (conferenceId: number) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function ReviewerConferences({
  conferences,
  onSelectConference,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  searchQuery = "",
  onSearchChange,
}: ReviewerConferencesProps) {
  const { t } = useTranslation()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("")

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onLoadMore()
      }
    }, options)

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observerRef.current.observe(currentRef)
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef)
      }
    }
  }, [onLoadMore, hasMore, isLoadingMore])

  // Filter conferences based on status
  const filteredConferences = useMemo(() => {
    return statusFilter ? conferences.filter((conf) => conf.status === statusFilter) : conferences
  }, [conferences, statusFilter])

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
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm mb-3">Status</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={statusFilter === "open"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "open" : "")}
            />
            <span className="text-sm">{t("common.conferenceStatus.open")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={statusFilter === "reviewing"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "reviewing" : "")}
            />
            <span className="text-sm">{t("common.conferenceStatus.reviewing")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={statusFilter === "completed"}
              onCheckedChange={(checked) => setStatusFilter(checked ? "completed" : "")}
            />
            <span className="text-sm">{t("common.conferenceStatus.completed")}</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
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

  const columns = useMemo<DataTableColumn<ReviewerConference>[]>(
    () => [
      {
        key: "name",
        label: t("dashboard.roles.reviewer.conferences.table.name"),
        render: (conference) => (
          <>
            <div className="font-medium">{conference.name}</div>
            {conference.acronym && (
              <div className={`${typography.body} text-muted-foreground`}>{conference.acronym}</div>
            )}
          </>
        ),
      },
      {
        key: "domain",
        label: t("review.conferences.columns.domain"),
        width: "w-32",
        render: (conference) => <span className={typography.body}>{conference.domain || "-"}</span>,
        mobileLabel: t("review.conferences.columns.domain"),
      },
      {
        key: "progress",
        label: t("dashboard.roles.reviewer.conferences.table.progress"),
        width: "w-32",
        render: (conference) => (
          <div className="flex items-center gap-2">
            <span className={`${typography.body} ${typography.medium}`}>
              {conference.reviewed_papers || 0}/{conference.total_papers || 0}
            </span>
            <span className={`${typography.bodySmall} text-muted-foreground`}>
              {t("common.actions.complete")}
            </span>
          </div>
        ),
        mobileLabel: t("dashboard.roles.reviewer.conferences.table.progress"),
      },
      {
        key: "timeline",
        label: t("review.conferences.columns.timeline"),
        width: "w-40",
        render: (conference) => (
          <div className={typography.body}>
            {conference.conference_date ? (
              <>
                <div>{new Date(conference.conference_date).toLocaleDateString()}</div>
                {conference.submission_deadline && (
                  <div className={`${typography.bodySmall} text-muted-foreground`}>
                    {t("review.conferences.submission")}:{" "}
                    {new Date(conference.submission_deadline).toLocaleDateString()}
                  </div>
                )}
              </>
            ) : (
              "-"
            )}
          </div>
        ),
        mobileLabel: t("review.conferences.columns.timeline"),
      },
    ],
    [t],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.roles.reviewer.conferences.title")}</CardTitle>
        <CardDescription>
          {t("dashboard.roles.reviewer.conferences.description", {
            count: conferences.length,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        {onSearchChange && (
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchPlaceholder={t("dashboard.chair.dashboard.searchPlaceholder")}
            activeFilters={activeFilters}
            filterPopover={filterPopover}
            hasActiveFilters={hasActiveFilters}
          />
        )}
        <div className="space-y-4">
          <DataTable<ReviewerConference>
            columns={columns}
            data={filteredConferences}
            loading={false}
            error={null}
            emptyMessage={
              <div className="flex flex-col items-center justify-center space-y-3 py-8">
                <Inbox className="h-12 w-12 text-muted-foreground" />
                <div className="text-muted-foreground">{t("review.conferences.noConferences")}</div>
              </div>
            }
            getRowKey={(conference) => conference.id}
            onRowClick={(conference) => onSelectConference(Number(conference.id))}
            renderMobileCard={(conference) => (
              <div className={spacing.padding.card}>
                <div className={`${typography.medium} mb-2`}>{conference.name}</div>
                {conference.acronym && (
                  <div className={`${typography.body} text-muted-foreground mb-2`}>
                    {conference.acronym}
                  </div>
                )}
                <div
                  className={`flex flex-col ${spacing.gap.sm} ${typography.body} text-muted-foreground`}
                >
                  <div>
                    {t("review.conferences.columns.domain")}: {conference.domain || "-"}
                  </div>
                  <div>
                    {t("dashboard.roles.reviewer.conferences.table.progress")}:{" "}
                    {conference.reviewed_papers || 0}/{conference.total_papers || 0}{" "}
                    {t("common.actions.complete")}
                  </div>
                  <div>
                    {t("review.conferences.columns.timeline")}:{" "}
                    {conference.conference_date
                      ? new Date(conference.conference_date).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
              </div>
            )}
          />

          {/* Infinite scroll sentinel and loading indicator */}
          {hasMore && (
            <div ref={loadMoreRef} className="p-4 text-center">
              {isLoadingMore && (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm text-muted-foreground">{t("common.loading")}...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

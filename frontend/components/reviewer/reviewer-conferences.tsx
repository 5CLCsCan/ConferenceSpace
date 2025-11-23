"use client"

import { useRef, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Inbox, Loader2, Search, Filter, X } from "lucide-react"
import type { ReviewerConference } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

type StatusFilter = "active" | "upcoming" | "archived" | ""

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
  const [filterOpen, setFilterOpen] = useState(false)

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
  const filteredConferences = statusFilter
    ? conferences.filter((conf) => conf.status === statusFilter)
    : conferences
  
  const handleRemoveStatusFilter = () => {
    setStatusFilter("")
  }
  
  const hasActiveFilters = statusFilter !== ""

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
          <div className="relative flex items-center gap-2 border rounded-md bg-background">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <div className="flex-1 flex items-center gap-2 pl-10 pr-2 py-2">
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  {statusFilter && (
                    <Badge variant="secondary" className="gap-1">
                      {statusFilter === "active"
                        ? "Accepting Submissions"
                        : statusFilter === "upcoming"
                          ? "In Review"
                          : "Archived"}
                      <button
                        onClick={handleRemoveStatusFilter}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
              <Input
                placeholder={
                  hasActiveFilters ? "" : t("dashboard.chair.dashboard.searchPlaceholder")
                }
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="!border-0 focus-visible:!ring-0 focus-visible:!border-0 focus-visible:!ring-offset-0 !shadow-none h-auto p-0 flex-1 min-w-[120px]"
              />
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 mr-2 ${hasActiveFilters ? "text-primary" : ""}`}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Status</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={statusFilter === "active"}
                          onCheckedChange={(checked) => setStatusFilter(checked ? "active" : "")}
                        />
                        <span className="text-sm">Accepting Submissions</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={statusFilter === "upcoming"}
                          onCheckedChange={(checked) =>
                            setStatusFilter(checked ? "upcoming" : "")
                          }
                        />
                        <span className="text-sm">In Review</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={statusFilter === "archived"}
                          onCheckedChange={(checked) =>
                            setStatusFilter(checked ? "archived" : "")
                          }
                        />
                        <span className="text-sm">Archived</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("")
                        setFilterOpen(false)
                      }}
                    >
                      Clear
                    </Button>
                    <Button size="sm" onClick={() => setFilterOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.conferences.table.name")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("review.conferences.columns.domain")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("dashboard.roles.reviewer.conferences.table.progress")}
                </th>
                <th className="text-left p-4 font-medium">
                  {t("review.conferences.columns.timeline")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredConferences.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 py-8">
                      <Inbox className="h-12 w-12 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        {t("review.conferences.noConferences")}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredConferences.map((conference) => (
                  <tr
                    key={conference.id}
                    className="border-b cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectConference(Number(conference.id))}
                  >
                    <td className="p-4">
                      <div className="font-medium">{conference.name}</div>
                      {conference.acronym && (
                        <div className="text-sm text-muted-foreground">{conference.acronym}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{conference.domain || "-"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {conference.reviewed_papers || 0}/{conference.total_papers || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("common.actions.complete")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {conference.conference_date ? (
                          <>
                            <div>{new Date(conference.conference_date).toLocaleDateString()}</div>
                            {conference.submission_deadline && (
                              <div className="text-xs text-muted-foreground">
                                {t("review.conferences.submission")}:{" "}
                                {new Date(conference.submission_deadline).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

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

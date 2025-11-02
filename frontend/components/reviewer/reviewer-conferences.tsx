"use client"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Inbox, Loader2, Search } from "lucide-react"
import type { ReviewerConference } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"

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

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const options = {
      root: null,
      rootMargin: '100px',
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
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("common.actions.search")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
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
              {conferences.length === 0 ? (
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
                conferences.map((conference) => (
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
                                {t("review.conferences.submission")}: {new Date(conference.submission_deadline).toLocaleDateString()}
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
                  <span className="text-sm text-muted-foreground">
                    {t("common.loading")}...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

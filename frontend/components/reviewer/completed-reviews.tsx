"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  FileText,
  Eye,
  Filter,
  Loader2,
  CheckCircle2,
  Calendar,
  ArrowUpDown,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { formatDate } from "@/lib/utils"
import type { AssignedPaper } from "@/lib/types"
import { useCompletedReviews } from "@/hooks/use-completed-reviews"
import { useDebounce } from "@/hooks/use-debounce"

interface CompletedReviewsProps {
  reviewerId?: string
  onSelectPaper?: (paperId: string, conferenceId: string) => void
}

export function CompletedReviews({ reviewerId, onSelectPaper }: CompletedReviewsProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const currentReviewerId = reviewerId || "1"

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 500)

  const {
    reviews,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useCompletedReviews(currentReviewerId, {
    search: debouncedSearch,
  })

  // Sort reviews client-side (only for current page)
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "date") {
      const comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      return sortOrder === "asc" ? -comparison : comparison
    }
    const comparison = a.title.localeCompare(b.title)
    return sortOrder === "asc" ? comparison : -comparison
  })

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMore || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [loadMore, hasMore, isLoadingMore])

  const handleSelect = (paperId: string, conferenceId: string) => {
    if (onSelectPaper) return onSelectPaper(paperId, conferenceId)
    const conferenceParam = conferenceId ? `?conference_id=${conferenceId}` : ""
    router.push(`/dashboard/reviewer/papers/${paperId}${conferenceParam}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.roles.reviewer.nav.completedReviews")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("dashboard.roles.reviewer.completedReviews.description")}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="size-4" />
            {t("dashboard.roles.reviewer.completedReviews.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.roles.reviewer.completedReviews.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "title")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  {t("dashboard.roles.reviewer.completedReviews.sortByDate")}
                </SelectItem>
                <SelectItem value="title">
                  {t("dashboard.roles.reviewer.completedReviews.sortByTitle")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              <ArrowUpDown className="size-4" />
            </Button>

            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => setSearchQuery("")}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : sortedReviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {debouncedSearch
                  ? t("dashboard.roles.reviewer.completedReviews.noResults")
                  : t("dashboard.roles.reviewer.completedReviews.noCompletedReviews")}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{review.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{review.abstract}</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-4 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="size-3 mr-1" />
                    {t("dashboard.roles.reviewer.completedReviews.completed")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Keywords */}
                  {review.keywords && review.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.keywords.slice(0, 5).map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {review.keywords.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{review.keywords.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      <span>
                        {t("dashboard.roles.reviewer.completedReviews.completedOn")}: {" "}
                        {formatDate(review.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4" />
                      <span>
                        {t("dashboard.roles.reviewer.completedReviews.version")} {review.version}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(review.id, review.conference_id)}
                      className="gap-2"
                    >
                      <Eye className="size-4" />
                      {t("dashboard.roles.reviewer.completedReviews.viewReview")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>{t("common.messages.loading")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

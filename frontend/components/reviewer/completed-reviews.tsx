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
import { typography, spacing, iconSizes } from "@/lib/typography"

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

  const { reviews, isLoading, isLoadingMore, hasMore, loadMore, refresh } = useCompletedReviews(
    currentReviewerId,
    {
      search: debouncedSearch,
    },
  )

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
    <div className={spacing.subsection}>
      {/* Header */}
      <div>
        <h1 className={`${typography.h1} ${typography.bold} tracking-tight`}>
          {t("dashboard.roles.reviewer.nav.completedReviews")}
        </h1>
        <p className={`${typography.muted} mt-2`}>
          {t("dashboard.roles.reviewer.completedReviews.description")}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className={`${typography.h4} flex items-center ${spacing.gap.sm}`}>
            <Filter className={iconSizes.sm} />
            {t("dashboard.roles.reviewer.completedReviews.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent className={spacing.subsection}>
          <div className={`flex items-center ${spacing.gap.md}`}>
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconSizes.sm} text-muted-foreground`}
              />
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
              <Button variant="ghost" onClick={() => setSearchQuery("")}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className={spacing.subsection}>
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2
                className="animate-spin text-muted-foreground"
                style={{ width: "2rem", height: "2rem" }}
              />
            </CardContent>
          </Card>
        ) : sortedReviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2
                className="text-muted-foreground mb-4"
                style={{ width: "3rem", height: "3rem" }}
              />
              <p className={`${typography.h4} ${typography.medium} text-muted-foreground`}>
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
                    <CardTitle className={`${typography.h4} mb-2`}>{review.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{review.abstract}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-4 bg-green-50 text-green-700 border-green-200"
                  >
                    <CheckCircle2 className={`${iconSizes.xs} mr-1`} />
                    {t("dashboard.roles.reviewer.completedReviews.completed")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className={spacing.subsection}>
                  {/* Keywords */}
                  {review.keywords && review.keywords.length > 0 && (
                    <div className={`flex flex-wrap ${spacing.gap.sm}`}>
                      {review.keywords.slice(0, 5).map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className={typography.bodySmall}>
                          {keyword}
                        </Badge>
                      ))}
                      {review.keywords.length > 5 && (
                        <Badge variant="secondary" className={typography.bodySmall}>
                          +{review.keywords.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div
                    className={`flex items-center ${spacing.gap.lg} ${typography.body} text-muted-foreground`}
                  >
                    <div className={`flex items-center ${spacing.gap.sm}`}>
                      <Calendar className={iconSizes.sm} />
                      <span>
                        {t("dashboard.roles.reviewer.completedReviews.completedOn")}:{" "}
                        {formatDate(review.updated_at)}
                      </span>
                    </div>
                    <div className={`flex items-center ${spacing.gap.sm}`}>
                      <FileText className={iconSizes.sm} />
                      <span>
                        {t("dashboard.roles.reviewer.completedReviews.version")} {review.version}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`flex ${spacing.gap.sm} pt-2`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(review.id, review.conference_id)}
                      className={spacing.gap.sm}
                    >
                      <Eye className={iconSizes.sm} />
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
              <div className={`flex items-center ${spacing.gap.sm} text-muted-foreground`}>
                <Loader2 className={`${iconSizes.sm} animate-spin`} />
                <span className={typography.body}>{t("common.messages.loading")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

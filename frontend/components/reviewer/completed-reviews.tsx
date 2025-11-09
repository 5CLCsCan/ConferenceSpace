"use client"

import { useState, useEffect, useRef } from "react"
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
  CheckCircle2,
  Search,
  Calendar,
  FileText,
  Eye,
  Filter,
  Loader2,
  Award,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { formatDate } from "@/lib/utils"
import type { AssignedPaper } from "@/lib/types"

interface CompletedReviewsProps {
  reviews: AssignedPaper[]
  onSelectPaper: (paperId: string, conferenceId: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function CompletedReviews({
  reviews,
  onSelectPaper,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: CompletedReviewsProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [conferenceFilter, setConferenceFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const [currentMonth, setCurrentMonth] = useState<{ month: number; year: number } | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Set current month on client side only to avoid hydration mismatch
  useEffect(() => {
    const now = new Date()
    setCurrentMonth({ month: now.getMonth(), year: now.getFullYear() })
  }, [])

  // Extract unique conferences from reviews
  const conferences = Array.from(
    new Set(reviews.map((r) => JSON.stringify({ id: r.conference_id, name: r.conference_id }))),
  ).map((str) => JSON.parse(str))

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((review) => {
      const matchesSearch =
        searchQuery === "" ||
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesConference =
        conferenceFilter === "all" || review.conference_id === conferenceFilter

      return matchesSearch && matchesConference
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
      return a.title.localeCompare(b.title)
    })

  // Infinite scroll observer
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
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
  }, [onLoadMore, hasMore, isLoadingMore])

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

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.roles.reviewer.completedReviews.totalCompleted")}
            </CardTitle>
            <CheckCircle2 className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.roles.reviewer.completedReviews.allTime")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.roles.reviewer.completedReviews.conferences")}
            </CardTitle>
            <Award className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conferences.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.roles.reviewer.completedReviews.uniqueConferences")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.roles.reviewer.completedReviews.thisMonth")}
            </CardTitle>
            <Calendar className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonth
                ? reviews.filter((r) => {
                    const reviewDate = new Date(r.updated_at)
                    return (
                      reviewDate.getMonth() === currentMonth.month &&
                      reviewDate.getFullYear() === currentMonth.year
                    )
                  }).length
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.roles.reviewer.completedReviews.currentMonth")}
            </p>
          </CardContent>
        </Card>
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
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.roles.reviewer.completedReviews.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("dashboard.roles.reviewer.completedReviews.allConferences")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("dashboard.roles.reviewer.completedReviews.allConferences")}
                </SelectItem>
                {conferences.map((conf) => (
                  <SelectItem key={conf.id} value={conf.id}>
                    {conf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "title")}>
              <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery || conferenceFilter !== "all"
                  ? t("dashboard.roles.reviewer.completedReviews.noResults")
                  : t("dashboard.roles.reviewer.completedReviews.noCompletedReviews")}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
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
                        {t("dashboard.roles.reviewer.completedReviews.completedOn")}:{" "}
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
                      onClick={() => onSelectPaper(review.id, review.conference_id)}
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

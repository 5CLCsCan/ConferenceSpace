"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useRouter } from "next/navigation"
import {
  getSubmissionReviews,
  getSubmissionReviewAnalytics,
  type AssignmentReview,
  type ReviewAnalytics,
} from "@/lib/api/reviews"
import { formatDate } from "@/lib/utils"
import { SubmissionAnalytics } from "@/components/chair/submission-analytics"

interface SubmissionReviewTabProps {
  conferenceId: string
  submissionId: string
}

export function SubmissionReviewTab({ conferenceId, submissionId }: SubmissionReviewTabProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null)
  const [reviews, setReviews] = useState<AssignmentReview[]>([])
  const [totalReviews, setTotalReviews] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reviewsExpanded, setReviewsExpanded] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const REVIEWS_PER_PAGE = 10

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    const response = await getSubmissionReviewAnalytics(conferenceId, submissionId)
    if (response.error) {
      setError(response.error)
    } else {
      setAnalytics(response.data)
    }
    setLoading(false)
  }

  const loadReviews = async (page: number) => {
    setLoadingReviews(true)
    const offset = (page - 1) * REVIEWS_PER_PAGE
    const response = await getSubmissionReviews(conferenceId, submissionId, {
      limit: REVIEWS_PER_PAGE,
      offset,
    })
    if (!response.error && response.data) {
      setReviews(response.data)
      setTotalReviews(response.total)
    }
    setLoadingReviews(false)
  }

  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, submissionId])

  useEffect(() => {
    if (reviewsExpanded) {
      loadReviews(currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewsExpanded, currentPage])

  const getRecommendationBadge = (recommendation: string) => {
    const config: Record<string, { label: string; className: string }> = {
      strong_accept: { label: "Strong Accept", className: "bg-green-600 text-white" },
      accept: { label: "Accept", className: "bg-green-500 text-white" },
      weak_accept: { label: "Weak Accept", className: "bg-green-400 text-white" },
      borderline: { label: "Borderline", className: "bg-yellow-500 text-white" },
      weak_reject: { label: "Weak Reject", className: "bg-orange-400 text-white" },
      reject: { label: "Reject", className: "bg-red-500 text-white" },
      strong_reject: { label: "Strong Reject", className: "bg-red-600 text-white" },
    }
    const item = config[recommendation] || {
      label: recommendation,
      className: "bg-gray-500 text-white",
    }
    return <Badge className={item.className}>{item.label}</Badge>
  }

  const getConfidenceBadge = (confidence: string) => {
    const config: Record<string, { label: string; className: string }> = {
      high: {
        label: t("dashboard.chair.review.confidence.high"),
        className: "bg-blue-600 text-white",
      },
      medium: {
        label: t("dashboard.chair.review.confidence.medium"),
        className: "bg-blue-400 text-white",
      },
      low: {
        label: t("dashboard.chair.review.confidence.low"),
        className: "bg-blue-300 text-white",
      },
    }
    const item = config[confidence] || { label: confidence, className: "bg-gray-500 text-white" }
    return <Badge className={item.className}>{item.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadAnalytics}>
            {t("common.actions.retry")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t("dashboard.chair.review.noAnalytics")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {/* Use SubmissionAnalytics Component */}
      <SubmissionAnalytics analytics={analytics} />

      {/* Review List (Collapsible) */}
      <Card className="mt-2">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>{t("dashboard.chair.review.reviewList")}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setReviewsExpanded(!reviewsExpanded)}>
              {reviewsExpanded ? (
                <>
                  <ChevronUp className="size-4 mr-2" />
                  {t("common.actions.collapse")}
                </>
              ) : (
                <>
                  <ChevronDown className="size-4 mr-2" />
                  {t("common.actions.expand")}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {reviewsExpanded && (
          <CardContent className="space-y-6 px-4 pb-4">
            {loadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("dashboard.chair.review.noReviews")}
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {reviews.map((review, index) => {
                    const globalIndex = (currentPage - 1) * REVIEWS_PER_PAGE + index
                    return (
                      <Card key={review.id} className="border-l-4 border-l-primary mb-4">
                        <CardHeader className="px-4 pt-4 pb-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">
                                  {t("dashboard.chair.review.reviewNumber")} #{globalIndex + 1}
                                </CardTitle>
                                {review.reviewer_email && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {review.reviewer_email}
                                  </span>
                                )}
                                {review.review_data?.recommendation &&
                                  getRecommendationBadge(review.review_data.recommendation)}
                                {review.review_data?.confidence &&
                                  getConfidenceBadge(review.review_data.confidence)}
                              </div>
                              {review.review_score !== undefined && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    {review.review_score?.toFixed?.(1) ?? review.review_score}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    / 10
                                  </span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {t("dashboard.chair.review.score")}
                                  </span>
                                </div>
                              )}
                              {review.review_submitted_at && (
                                <div className="text-sm text-muted-foreground">
                                  {t("dashboard.chair.review.submittedAt")}:{" "}
                                  {formatDate(review.review_submitted_at)}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/conference/${conferenceId}/review/${review.id}`,
                                )
                              }
                            >
                              <Eye className="size-4 mr-2" />
                              {t("common.actions.viewDetail")}
                            </Button>
                          </div>
                        </CardHeader>
                        {review.review_data?.feedback && (
                          <CardContent className="space-y-3 px-4 pb-4">
                            {review.review_data.feedback.strengths && (
                              <div>
                                <div className="text-sm font-semibold text-success mb-1">
                                  {t("dashboard.chair.review.strengths")}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {review.review_data.feedback.strengths}
                                </p>
                              </div>
                            )}
                            {review.review_data.feedback.weaknesses && (
                              <div>
                                <div className="text-sm font-semibold text-destructive mb-1">
                                  {t("dashboard.chair.review.weaknesses")}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {review.review_data.feedback.weaknesses}
                                </p>
                              </div>
                            )}
                            {review.review_data.feedback.questions && (
                              <div>
                                <div className="text-sm font-semibold text-primary mb-1">
                                  {t("dashboard.chair.review.questions")}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {review.review_data.feedback.questions}
                                </p>
                              </div>
                            )}
                            {review.review_data.criteria && (
                              <div>
                                <div className="text-sm font-semibold mb-2">
                                  {t("dashboard.chair.review.criteriaScores")}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {Object.entries(review.review_data.criteria).map(
                                    ([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="capitalize text-muted-foreground">
                                          {key.replace(/_/g, " ")}:
                                        </span>
                                        <span className="font-semibold">{value}</span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t("dashboard.chair.review.analytics.showingReviews")}{" "}
                      {(currentPage - 1) * REVIEWS_PER_PAGE + 1}{" "}
                      {t("dashboard.chair.review.analytics.to")}{" "}
                      {Math.min(currentPage * REVIEWS_PER_PAGE, totalReviews)}{" "}
                      {t("dashboard.chair.review.analytics.of")} {totalReviews}{" "}
                      {t("dashboard.chair.review.analytics.reviews")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="size-4 mr-1" />
                        {t("dashboard.chair.review.analytics.previous")}
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first, last, current, and adjacent pages
                          if (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          ) {
                            return (
                              <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        {t("dashboard.chair.review.analytics.next")}
                        <ChevronRight className="size-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

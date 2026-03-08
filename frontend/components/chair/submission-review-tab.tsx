"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, ChevronUp, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import {
  getSubmissionReviews,
  getSubmissionReviewAnalytics,
  type AssignmentReview,
  type ReviewAnalytics,
} from "@/lib/api/reviews"
import { updateSubmissionStatus } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import { SubmissionAnalytics } from "@/components/chair/submission-analytics"
import { ROUTES } from "@/lib/routes"

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
  const [selectedDecision, setSelectedDecision] = useState<
    "accepted" | "rejected" | "minor" | "major" | null
  >(null)
  const [decisionSaving, setDecisionSaving] = useState(false)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<AssignmentReview | null>(null)

  const REVIEWS_PER_PAGE = 5

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
      strong_accept: {
        label: t("runtime.components.chair.submission-review-tab.prop_label_strong_accept"),
        className: "bg-green-600 text-white",
      },
      accept: {
        label: t("runtime.components.chair.submission-review-tab.prop_label_accept"),
        className: "bg-green-500 text-white",
      },
      weak_accept: {
        label: t("runtime.components.chair.submission-review-tab.prop_label_weak_accept"),
        className: "bg-green-400 text-white",
      },
      borderline: {
        label: t("runtime.components.chair.submission-review-tab.prop_label_borderline"),
        className: "bg-yellow-500 text-white",
      },
      weak_reject: {
        label: t("runtime.components.chair.submission-review-tab.prop_label_weak_reject"),
        className: "bg-orange-400 text-white",
      },
      reject: {
        label: t("runtime.components.chair.submission-review-tab.prop_label_reject"),
        className: "bg-red-500 text-white",
      },
      strong_reject: {
        label: t("runtime.components.chair.submission-review-tab.prop_label_strong_reject"),
        className: "bg-red-600 text-white",
      },
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
        className: "bg-primary text-primary-foreground",
      },
      medium: {
        label: t("dashboard.chair.review.confidence.medium"),
        className: "bg-primary/80 text-primary-foreground",
      },
      low: {
        label: t("dashboard.chair.review.confidence.low"),
        className: "bg-primary/60 text-primary-foreground",
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
      <Card>
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle>
            {t("runtime.components.chair.submission-review-tab.text_final_decision")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              type="button"
              variant={selectedDecision === "accepted" ? "default" : "outline"}
              onClick={() => setSelectedDecision("accepted")}
            >
              {t("runtime.components.chair.submission-review-tab.text_accept")}{" "}
            </Button>
            <Button
              type="button"
              variant={selectedDecision === "rejected" ? "destructive" : "outline"}
              onClick={() => setSelectedDecision("rejected")}
            >
              {t("runtime.components.chair.submission-review-tab.text_reject")}{" "}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              title={t(
                "runtime.components.chair.submission-review-tab.title_backend_only_supports_accepted_rejected_statuses",
              )}
            >
              {t("runtime.components.chair.submission-review-tab.text_minor_revision")}{" "}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              title={t(
                "runtime.components.chair.submission-review-tab.title_backend_only_supports_accepted_rejected_statuses",
              )}
            >
              {t("runtime.components.chair.submission-review-tab.text_major_revision")}{" "}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("runtime.components.chair.submission-review-tab.text_only")} <code>accepted</code>{" "}
            and <code>rejected</code>{" "}
            {t(
              "runtime.components.chair.submission-review-tab.text_can_be_persisted_with_the_current",
            )}{" "}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={
                decisionSaving ||
                !(selectedDecision === "accepted" || selectedDecision === "rejected")
              }
              onClick={async () => {
                if (selectedDecision !== "accepted" && selectedDecision !== "rejected") {
                  return
                }

                setDecisionSaving(true)
                setDecisionMessage(null)
                const result = await updateSubmissionStatus(
                  conferenceId,
                  submissionId,
                  selectedDecision,
                )
                if (result.error) {
                  setDecisionMessage(`Failed to save decision: ${result.error}`)
                } else {
                  setDecisionMessage(`Decision saved: ${selectedDecision}`)
                }
                setDecisionSaving(false)
              }}
            >
              {decisionSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("runtime.components.chair.submission-review-tab.text_saving")}{" "}
                </>
              ) : (
                "Save Decision"
              )}
            </Button>

            {decisionMessage && <p className="text-xs text-muted-foreground">{decisionMessage}</p>}
          </div>
        </CardContent>
      </Card>

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
                <div className="space-y-2">
                  {reviews.map((review, index) => {
                    const globalIndex = (currentPage - 1) * REVIEWS_PER_PAGE + index
                    return (
                      <div
                        key={review.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        {/* Left: index + email */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold shrink-0 text-muted-foreground w-7 text-right">
                            #{globalIndex + 1}
                          </span>
                          {review.reviewer_email ? (
                            <button
                              type="button"
                              className="text-sm font-medium hover:underline truncate max-w-[160px]"
                              onClick={() =>
                                router.push(ROUTES.PROFILE(review.reviewer_email || ""))
                              }
                            >
                              {review.reviewer_email}
                            </button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {t("dashboard.chair.review.anonymous")}
                            </span>
                          )}
                        </div>

                        {/* Middle: badges + score */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {review.review_data?.recommendation &&
                            getRecommendationBadge(review.review_data.recommendation)}
                          {review.review_data?.confidence &&
                            getConfidenceBadge(review.review_data.confidence)}
                          {review.review_score !== undefined && (
                            <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {review.review_score?.toFixed?.(1) ?? review.review_score}
                              <span className="text-xs font-normal text-muted-foreground ml-0.5">
                                /10
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Right: date + button */}
                        <div className="flex items-center gap-3 shrink-0">
                          {review.review_submitted_at && (
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {formatDate(review.review_submitted_at)}
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReview(review)}
                          >
                            <Eye className="size-3.5 mr-1.5" />
                            {t("common.actions.viewDetail")}
                          </Button>
                        </div>
                      </div>
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
      {/* Review Detail Dialog */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={(open) => {
          if (!open) setSelectedReview(null)
        }}
      >
        <DialogContent
          className="max-w-2xl w-full p-0 overflow-visible"
          style={{ overflow: "visible" }}
        >
          <div className="p-6 overflow-auto max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap text-base">
                {t("dashboard.chair.review.reviewDetail")}
                {selectedReview?.review_data?.recommendation &&
                  getRecommendationBadge(selectedReview.review_data.recommendation)}
                {selectedReview?.review_data?.confidence &&
                  getConfidenceBadge(selectedReview.review_data.confidence)}
              </DialogTitle>
            </DialogHeader>

            {selectedReview && (
              <div className="space-y-3 text-sm">
                {/* Top: meta + criteria side by side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Left: meta */}
                  <div className="space-y-1.5 text-sm">
                    {selectedReview.reviewer_email && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground shrink-0">
                          {t("dashboard.chair.review.reviewer")}:
                        </span>
                        <button
                          type="button"
                          className="font-medium hover:underline truncate"
                          onClick={() => {
                            router.push(ROUTES.PROFILE(selectedReview.reviewer_email || ""))
                            setSelectedReview(null)
                          }}
                        >
                          {selectedReview.reviewer_email}
                        </button>
                      </div>
                    )}
                    {selectedReview.review_score !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">
                          {t("dashboard.chair.review.score")}:
                        </span>
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {selectedReview.review_score?.toFixed?.(1) ?? selectedReview.review_score}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">
                            /10
                          </span>
                        </span>
                      </div>
                    )}
                    {selectedReview.review_submitted_at && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">
                          {t("dashboard.chair.review.submittedAt")}:
                        </span>
                        <span>{formatDate(selectedReview.review_submitted_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: criteria scores */}
                  {selectedReview.review_data?.criteria && (
                    <div className="bg-muted/40 rounded-md px-3 py-2 space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        {t("dashboard.chair.review.criteriaScores")}
                      </div>
                      {Object.entries(selectedReview.review_data.criteria).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="capitalize text-muted-foreground text-xs">
                            {key.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${(Number(value) / 10) * 100}%` }}
                              />
                            </div>
                            <span className="font-semibold text-xs w-5 text-right">
                              {String(value)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Feedback sections */}
                {selectedReview.review_data?.feedback && (
                  <div className="space-y-2 border-t pt-3">
                    {selectedReview.review_data.feedback.summary && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                          {t("dashboard.chair.review.summaryOfContribution")}
                        </div>
                        <p className="text-sm text-foreground/80 leading-snug">
                          {selectedReview.review_data.feedback.summary}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReview.review_data.feedback.strengths && (
                        <div>
                          <div className="text-xs font-semibold text-success uppercase tracking-wide mb-0.5">
                            {t("dashboard.chair.review.strengths")}
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {selectedReview.review_data.feedback.strengths}
                          </p>
                        </div>
                      )}
                      {selectedReview.review_data.feedback.weaknesses && (
                        <div>
                          <div className="text-xs font-semibold text-destructive uppercase tracking-wide mb-0.5">
                            {t("dashboard.chair.review.weaknesses")}
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {selectedReview.review_data.feedback.weaknesses}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedReview.review_data.feedback.questions && (
                      <div>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
                          {t("dashboard.chair.review.questions")}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {selectedReview.review_data.feedback.questions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

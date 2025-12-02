"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { ReviewAnalytics } from "@/lib/api/reviews"
import { useTranslation } from "@/lib/i18n/translation-context"

interface SubmissionAnalyticsProps {
  analytics: ReviewAnalytics
  compact?: boolean
}

export function SubmissionAnalytics({ analytics, compact = false }: SubmissionAnalyticsProps) {
  const { t } = useTranslation()
  // Calculate decision insights
  const acceptCount =
    (analytics.score_distribution?.strong_accept || 0) +
    (analytics.score_distribution?.accept || 0) +
    (analytics.score_distribution?.weak_accept || 0)
  const rejectCount =
    (analytics.score_distribution?.strong_reject || 0) +
    (analytics.score_distribution?.reject || 0) +
    (analytics.score_distribution?.weak_reject || 0)
  const borderlineCount = analytics.score_distribution?.borderline || 0

  const acceptPercentage = analytics.total_reviews > 0 ? (acceptCount / analytics.total_reviews) * 100 : 0
  const rejectPercentage = analytics.total_reviews > 0 ? (rejectCount / analytics.total_reviews) * 100 : 0
  const borderlinePercentage = analytics.total_reviews > 0 ? (borderlineCount / analytics.total_reviews) * 100 : 0

  const hasConsensus = acceptPercentage >= 70 || rejectPercentage >= 70
  const hasStrongDisagreement = Math.abs(acceptCount - rejectCount) <= 1 && analytics.total_reviews >= 3
  const highConfidenceReviews = analytics.confidence_distribution?.high || 0
  const confidencePercentage = analytics.total_reviews > 0 ? (highConfidenceReviews / analytics.total_reviews) * 100 : 0

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Compact Decision Summary */}
        <Card className="border-2">
          <CardHeader className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {hasConsensus ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : hasStrongDisagreement ? (
                    <AlertTriangle className="size-5 text-amber-600" />
                  ) : (
                    <XCircle className="size-5 text-muted-foreground" />
                  )}
                  {hasConsensus
                    ? t("dashboard.chair.review.analytics.strongConsensus")
                    : hasStrongDisagreement
                      ? t("dashboard.chair.review.analytics.reviewersDisagree")
                      : t("dashboard.chair.review.analytics.mixedReviews")}
                </CardTitle>
                <CardDescription className="mt-1">
                  {analytics.total_reviews} {analytics.total_reviews === 1 ? t("dashboard.chair.review.analytics.review") : t("dashboard.chair.review.analytics.reviews")} {t("dashboard.chair.review.analytics.submitted")}
                </CardDescription>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {analytics.average_score ? analytics.average_score.toFixed(1) : "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">/ 10</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">{acceptCount}</div>
                <div className="text-xs font-medium text-green-600 dark:text-green-500">{t("dashboard.chair.review.analytics.accept")}</div>
                <div className="text-xs text-muted-foreground">{acceptPercentage.toFixed(0)}%</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{borderlineCount}</div>
                <div className="text-xs font-medium text-amber-600 dark:text-amber-500">{t("dashboard.chair.review.analytics.borderline")}</div>
                <div className="text-xs text-muted-foreground">{borderlinePercentage.toFixed(0)}%</div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">{rejectCount}</div>
                <div className="text-xs font-medium text-red-600 dark:text-red-500">{t("dashboard.chair.review.analytics.reject")}</div>
                <div className="text-xs text-muted-foreground">{rejectPercentage.toFixed(0)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compact Quality Metrics */}
        <Card>
          <CardHeader className="px-4 pt-3 pb-2">
            <CardTitle className="text-sm">{t("dashboard.chair.review.analytics.qualityCriteria")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {[
                { label: t("dashboard.chair.review.analytics.originality"), value: analytics.criteria_averages?.originality },
                { label: t("dashboard.chair.review.analytics.technicalQuality"), value: analytics.criteria_averages?.technical_quality },
                { label: t("dashboard.chair.review.analytics.clarity"), value: analytics.criteria_averages?.clarity },
                { label: t("dashboard.chair.review.analytics.significance"), value: analytics.criteria_averages?.significance },
                { label: t("dashboard.chair.review.analytics.methodology"), value: analytics.criteria_averages?.methodology },
              ].map((criterion) => {
                const percentage = criterion.value ? (criterion.value / 10) * 100 : 0
                return (
                  <div key={criterion.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium min-w-[100px]">{criterion.label}</span>
                    <Progress value={percentage} className="h-1.5 flex-1" />
                    <span className="text-xs font-bold min-w-[30px] text-right">
                      {criterion.value ? criterion.value.toFixed(1) : "N/A"}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Quick Decision Card */}
      <Card className="border-2 mb-6">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {hasConsensus ? (
                  <CheckCircle2 className="size-6 text-green-600" />
                ) : hasStrongDisagreement ? (
                  <AlertTriangle className="size-6 text-amber-600" />
                ) : (
                  <XCircle className="size-6 text-muted-foreground" />
                )}
                {hasConsensus
                  ? t("dashboard.chair.review.analytics.strongConsensus")
                  : hasStrongDisagreement
                    ? t("dashboard.chair.review.analytics.reviewersDisagree")
                    : t("dashboard.chair.review.analytics.mixedReviews")}
              </CardTitle>
              <CardDescription className="mt-1">
                {analytics.total_reviews} {analytics.total_reviews === 1 ? t("dashboard.chair.review.analytics.review") : t("dashboard.chair.review.analytics.reviews")} {t("dashboard.chair.review.analytics.submitted")}
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">
                {analytics.average_score ? analytics.average_score.toFixed(1) : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">/ 10</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{acceptCount}</div>
              <div className="text-sm font-medium text-green-600 dark:text-green-500">{t("dashboard.chair.review.analytics.accept")}</div>
              <div className="text-xs text-muted-foreground mt-1">{acceptPercentage.toFixed(0)}%</div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{borderlineCount}</div>
              <div className="text-sm font-medium text-amber-600 dark:text-amber-500">{t("dashboard.chair.review.analytics.borderline")}</div>
              <div className="text-xs text-muted-foreground mt-1">{borderlinePercentage.toFixed(0)}%</div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{rejectCount}</div>
              <div className="text-sm font-medium text-red-600 dark:text-red-500">{t("dashboard.chair.review.analytics.reject")}</div>
              <div className="text-xs text-muted-foreground mt-1">{rejectPercentage.toFixed(0)}%</div>
            </div>
          </div>

          {hasStrongDisagreement && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-500" />
              <div className="text-sm">
                <div className="font-semibold text-amber-900 dark:text-amber-100">{t("dashboard.chair.review.analytics.significantDisagreement")}</div>
                <div className="text-amber-800 dark:text-amber-200">
                  {t("dashboard.chair.review.analytics.significantDisagreementDescription")}
                </div>
              </div>
            </div>
          )}

          {hasConsensus && acceptPercentage >= 70 && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
              <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-500" />
              <div className="text-sm">
                <div className="font-semibold text-green-900 dark:text-green-100">{t("dashboard.chair.review.analytics.strongAcceptRecommendation")}</div>
                <div className="text-green-800 dark:text-green-200">
                  {acceptPercentage.toFixed(0)}% {t("dashboard.chair.review.analytics.strongAcceptDescription")}
                </div>
              </div>
            </div>
          )}

          {hasConsensus && rejectPercentage >= 70 && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <XCircle className="size-5 shrink-0 text-red-600 dark:text-red-500" />
              <div className="text-sm">
                <div className="font-semibold text-red-900 dark:text-red-100">{t("dashboard.chair.review.analytics.strongRejectRecommendation")}</div>
                <div className="text-red-800 dark:text-red-200">
                  {rejectPercentage.toFixed(0)}% {t("dashboard.chair.review.analytics.strongRejectDescription")}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="breakdown">
            <BarChart3 className="size-4 mr-2" />
            {t("dashboard.chair.review.analytics.breakdown")}
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Award className="size-4 mr-2" />
            {t("dashboard.chair.review.analytics.qualityMetrics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base">{t("dashboard.chair.review.analytics.recommendationBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {[
                  { label: t("dashboard.chair.review.analytics.strongAccept"), count: analytics.score_distribution?.strong_accept || 0, type: "accept" },
                  { label: t("dashboard.chair.review.analytics.accept"), count: analytics.score_distribution?.accept || 0, type: "accept" },
                  { label: t("dashboard.chair.review.analytics.weakAccept"), count: analytics.score_distribution?.weak_accept || 0, type: "accept" },
                  { label: t("dashboard.chair.review.analytics.borderline"), count: analytics.score_distribution?.borderline || 0, type: "borderline" },
                  { label: t("dashboard.chair.review.analytics.weakReject"), count: analytics.score_distribution?.weak_reject || 0, type: "reject" },
                  { label: t("dashboard.chair.review.analytics.reject"), count: analytics.score_distribution?.reject || 0, type: "reject" },
                  { label: t("dashboard.chair.review.analytics.strongReject"), count: analytics.score_distribution?.strong_reject || 0, type: "reject" },
                ].map((item) => {
                  const percentage = analytics.total_reviews > 0 ? (item.count / analytics.total_reviews) * 100 : 0
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">
                          {item.count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base">{t("dashboard.chair.review.analytics.qualityCriteriaAnalysis")}</CardTitle>
              <CardDescription>{t("dashboard.chair.review.analytics.averageScoresDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-4">
                {[
                  { label: t("dashboard.chair.review.analytics.originality"), value: analytics.criteria_averages?.originality },
                  { label: t("dashboard.chair.review.analytics.technicalQuality"), value: analytics.criteria_averages?.technical_quality },
                  { label: t("dashboard.chair.review.analytics.clarity"), value: analytics.criteria_averages?.clarity },
                  { label: t("dashboard.chair.review.analytics.significance"), value: analytics.criteria_averages?.significance },
                  { label: t("dashboard.chair.review.analytics.methodology"), value: analytics.criteria_averages?.methodology },
                ].map((criterion) => {
                  const percentage = criterion.value ? (criterion.value / 10) * 100 : 0
                  return (
                    <div key={criterion.label}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">{criterion.label}</span>
                        <span className="text-lg font-bold">
                          {criterion.value ? criterion.value.toFixed(1) : "N/A"}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-base">{t("dashboard.chair.review.analytics.reviewerConfidence")}</CardTitle>
              <CardDescription>{t("dashboard.chair.review.analytics.confidenceDistributionDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {[
                  { label: t("dashboard.chair.review.analytics.highConfidence"), count: analytics.confidence_distribution?.high || 0, color: "blue" },
                  { label: t("dashboard.chair.review.analytics.mediumConfidence"), count: analytics.confidence_distribution?.medium || 0, color: "blue" },
                  { label: t("dashboard.chair.review.analytics.lowConfidence"), count: analytics.confidence_distribution?.low || 0, color: "blue" },
                ].map((item) => {
                  const percentage = analytics.total_reviews > 0 ? (item.count / analytics.total_reviews) * 100 : 0
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">
                          {item.count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

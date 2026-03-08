"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, FileText, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { PrecheckResult } from "@/lib/types"

export type PreCheckResult = PrecheckResult

interface PreCheckResultsProps {
  result: PreCheckResult
}

export function PreCheckResults({ result }: PreCheckResultsProps) {
  const { t } = useTranslation()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const getStatusIcon = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="size-5 text-green-600" />
      case "fail":
        return <XCircle className="size-5 text-red-600" />
      case "warning":
        return <AlertCircle className="size-5 text-yellow-600" />
    }
  }

  const getStatusBadgeVariant = (status: "pass" | "fail" | "warning") => {
    switch (status) {
      case "pass":
        return "bg-green-50 text-green-700 border-green-200"
      case "fail":
        return "bg-red-50 text-red-700 border-red-200"
      case "warning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
    }
  }

  const getDecisionBadge = (decision: string) => {
    if (decision === "accept_for_review") {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 font-medium">
          {t("dashboard.author.submit.precheck.decision.acceptForReview")}
        </Badge>
      )
    }
    if (decision === "desk_reject") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 font-medium">
          Desk Reject
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">
        Manual Review
      </Badge>
    )
  }

  // Group detailed results by category
  const resultsByCategory = result.detailed_results.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof result.detailed_results>,
  )

  // Separate passed, warnings, and failed
  const passedResults = result.detailed_results.filter((r) => r.status === "pass")
  const warningResults = result.detailed_results.filter((r) => r.status === "warning")
  const failedResults = result.detailed_results.filter((r) => r.status === "fail")

  // Category display names
  const categoryNames: Record<string, string> = {
    title_abstract: t("dashboard.author.submit.precheck.categories.titleAbstract"),
    introduction: t("dashboard.author.submit.precheck.categories.introduction"),
    method: t("dashboard.author.submit.precheck.categories.method"),
    experiments: t("dashboard.author.submit.precheck.categories.experiments"),
    writing_quality: t("dashboard.author.submit.precheck.categories.writingQuality"),
    pre_submission: t("dashboard.author.submit.precheck.categories.preSubmission"),
    scope_match: t("dashboard.author.submit.precheck.categories.scopeMatch"),
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {t("dashboard.author.submit.precheck.title")}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.paper_title || t("dashboard.author.submit.precheck.extractedTitle")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary mb-1">
                {Math.round(result.overall_score)}%
              </div>
              {getDecisionBadge(result.decision)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-700 mb-1">{result.summary.passed}</div>
              <div className="text-sm text-muted-foreground">
                {t("dashboard.author.submit.precheck.summary.passed")}
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700 mb-1">{warningResults.length}</div>
              <div className="text-sm text-muted-foreground">
                {t("dashboard.author.submit.precheck.summary.warnings")}
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="text-2xl font-bold text-red-700 mb-1">{result.summary.failed}</div>
              <div className="text-sm text-muted-foreground">
                {t("dashboard.author.submit.precheck.summary.failed")}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t("dashboard.author.submit.precheck.summary.passRate")}
              </span>
              <span className="font-semibold">{Math.round(result.summary.pass_rate * 100)}%</span>
            </div>
            <Progress value={result.summary.pass_rate * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            {t("dashboard.author.submit.precheck.categoryScores")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(result.category_scores).map(([category, scores]) => (
              <div
                key={category}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {categoryNames[category] || category}
                </div>
                <div className="text-2xl font-bold mb-1">{Math.round(scores.score)}%</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-green-600">
                    {scores.passed} {t("dashboard.author.submit.precheck.summary.passed")}
                  </span>
                  {scores.failed > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600">
                        {scores.failed} {t("dashboard.author.submit.precheck.summary.failed")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="space-y-4">
        {/* Passed Items */}
        {passedResults.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="size-5" />
                {t("dashboard.author.submit.precheck.whatsGood")} ({passedResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {passedResults.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-green-200"
                  >
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{item.description}</div>
                      <div className="text-xs text-muted-foreground">{item.details}</div>
                    </div>
                    <Badge variant="outline" className={getStatusBadgeVariant(item.status)}>
                      {t("dashboard.author.submit.precheck.status.pass")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning Items */}
        {warningResults.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="size-5" />
                {t("dashboard.author.submit.precheck.needsAttention")} ({warningResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {warningResults.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-yellow-200"
                  >
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{item.description}</div>
                      <div className="text-xs text-muted-foreground">{item.details}</div>
                    </div>
                    <Badge variant="outline" className={getStatusBadgeVariant(item.status)}>
                      {t("dashboard.author.submit.precheck.status.warning")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed Items */}
        {failedResults.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="size-5" />
                {t("dashboard.author.submit.precheck.whatsFixed")} ({failedResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Group by category */}
              {Object.entries(
                failedResults.reduce(
                  (acc, item) => {
                    if (!acc[item.category]) {
                      acc[item.category] = []
                    }
                    acc[item.category].push(item)
                    return acc
                  },
                  {} as Record<string, typeof failedResults>,
                ),
              ).map(([category, items]) => (
                <Collapsible key={category} className="mb-4">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto hover:bg-red-50"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-4" />
                        <span className="font-medium">
                          {categoryNames[category] || category} ({items.length})
                        </span>
                      </div>
                      {expandedCategories.has(category) ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 mt-2 pl-8">
                      {items.map((item) => (
                        <div
                          key={item.item_id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white border border-red-200"
                        >
                          {getStatusIcon(item.status)}
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">{item.description}</div>
                            <div className="text-xs text-muted-foreground">{item.details}</div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {t("dashboard.author.submit.precheck.confidence")}:{" "}
                                {Math.round(item.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusBadgeVariant(item.status)}>
                            {t("dashboard.author.submit.precheck.status.fail")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

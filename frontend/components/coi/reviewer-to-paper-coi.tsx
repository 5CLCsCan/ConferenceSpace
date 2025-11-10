"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, User, FileText, Users, CheckCircle2, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { Reviewer, Paper, Relationship } from "@/lib/mock-data/coi"
import {
  searchReviewers,
  getAllPapers,
  checkReviewerToPaperCOI,
  getRelationshipTimeline,
} from "@/lib/api/coi-mock"
import { RelationshipTimeline } from "./relationship-timeline"

export function ReviewerToPaperCOI() {
  const { t } = useTranslation()
  const [selectedReviewer, setSelectedReviewer] = useState<string>("")
  const [selectedPaper, setSelectedPaper] = useState<string>("")
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [coiReport, setCoiReport] = useState<any>(null)
  const [authorTimelines, setAuthorTimelines] = useState<Record<string, Relationship[]>>({})
  const [loading, setLoading] = useState(false)
  const [loadingTimelines, setLoadingTimelines] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedReviewer && selectedPaper) {
      loadCOIReport()
      loadAuthorTimelines()
    }
  }, [selectedReviewer, selectedPaper])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [reviewersRes, papersRes] = await Promise.all([
        searchReviewers({ limit: 50 }),
        getAllPapers(),
      ])
      setReviewers(reviewersRes.data)
      setPapers(papersRes.data)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCOIReport = async () => {
    if (!selectedReviewer || !selectedPaper) return

    setLoading(true)
    try {
      const result = await checkReviewerToPaperCOI(selectedReviewer, selectedPaper)
      if (result.data) {
        setCoiReport(result.data)
      }
    } catch (error) {
      console.error("Failed to load COI report:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAuthorTimelines = async () => {
    if (!selectedReviewer || !selectedPaper) return

    setLoadingTimelines(true)
    try {
      const paper = papers.find((p) => p.id === selectedPaper)
      if (!paper) return

      const timelines: Record<string, Relationship[]> = {}

      for (const author of paper.authors) {
        const result = await getRelationshipTimeline(selectedReviewer, author.id)
        if (result.data && result.data.length > 0) {
          timelines[author.id] = result.data
        }
      }

      setAuthorTimelines(timelines)
    } catch (error) {
      console.error("Failed to load timelines:", error)
    } finally {
      setLoadingTimelines(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200 text-red-900"
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-900"
      case "low":
        return "bg-blue-50 border-blue-200 text-blue-900"
      default:
        return "bg-green-50 border-green-200 text-green-900"
    }
  }

  const selectedReviewerData = reviewers.find((r) => r.id === selectedReviewer)
  const selectedPaperData = papers.find((p) => p.id === selectedPaper)

  // Group relationships by author
  const relationshipsByAuthor =
    coiReport?.relationships?.reduce((acc: any, rel: Relationship) => {
      if (!acc[rel.author_id]) {
        acc[rel.author_id] = []
      }
      acc[rel.author_id].push(rel)
      return acc
    }, {}) || {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Selection */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>{t("coi.reviewerToPaper.title") || "Reviewer → Paper COI Analysis"}</CardTitle>
          <CardDescription>
            {t("coi.reviewerToPaper.description") ||
              "Select a reviewer and paper to analyze COI against all paper authors"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reviewer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("coi.reviewerToPaper.selectReviewer") || "Select Reviewer"}
            </label>
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("coi.reviewerToPaper.reviewerPlaceholder") || "Choose reviewer"}
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent className="max-w-[500px]">
                {reviewers.map((reviewer) => (
                  <SelectItem key={reviewer.id} value={reviewer.id} className="max-w-full">
                    <span
                      className="block truncate"
                      title={`${reviewer.name} - ${reviewer.affiliation}`}
                    >
                      {reviewer.name} - {reviewer.affiliation}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paper Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("coi.reviewerToPaper.selectPaper") || "Select Paper"}
            </label>
            <Select value={selectedPaper} onValueChange={setSelectedPaper}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("coi.reviewerToPaper.paperPlaceholder") || "Choose paper"}
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent className="max-w-[500px]">
                {papers.map((paper) => (
                  <SelectItem key={paper.id} value={paper.id} className="max-w-full">
                    <span className="block truncate" title={paper.title}>
                      {paper.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReviewerData && selectedPaperData && (
            <>
              <Card className="border-2">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">{t("coi.common.reviewer")}</p>
                    <p className="text-xs text-muted-foreground">{selectedReviewerData.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedReviewerData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">{t("coi.common.paper")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {selectedPaperData.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t("coi.common.authors", { count: selectedPaperData.authors.length })}
                    </p>
                    <div className="space-y-1">
                      {selectedPaperData.authors.map((author) => (
                        <p key={author.id} className="text-xs text-muted-foreground">
                          • {author.name}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right Panel - COI Report */}
      <div className="lg:col-span-2 space-y-6">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : !selectedReviewer || !selectedPaper ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {t("coi.reviewerToPaper.selectBoth") ||
                    "Please select both reviewer and paper to analyze COI"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : coiReport ? (
          <>
            {/* COI Summary */}
            <Card className={getSeverityColor(coiReport.severity)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {coiReport.severity === "none" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                    {t("coi.reviewerToPaper.coiReport") || "COI Analysis Report"}
                  </CardTitle>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {t(`coi.severity.${coiReport.severity}`) || coiReport.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{coiReport.summary}</p>

                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {Object.keys(relationshipsByAuthor).length}{" "}
                    {t("coi.reviewerToPaper.authorsAffected") || "author(s) affected"}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {coiReport.relationships.length}{" "}
                    {t("coi.reviewerToPaper.totalRelationships") || "total relationships"}
                  </Badge>
                  <Badge
                    variant={
                      coiReport.recommendation === "assign"
                        ? "default"
                        : coiReport.recommendation === "review"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {t(`coi.recommendation.${coiReport.recommendation}`) ||
                      coiReport.recommendation.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Authors Breakdown */}
            {selectedPaperData && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("coi.reviewerToPaper.authorsBreakdown") || "Authors Breakdown"}
                  </CardTitle>
                  <CardDescription>
                    {t("coi.reviewerToPaper.authorsBreakdownDescription") ||
                      "COI analysis for each author of the paper"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPaperData.authors.map((author) => {
                    const authorRels = relationshipsByAuthor[author.id] || []
                    const authorSeverity =
                      authorRels.length > 0
                        ? authorRels.some((r: Relationship) => r.severity === "high")
                          ? "high"
                          : authorRels.some((r: Relationship) => r.severity === "medium")
                            ? "medium"
                            : "low"
                        : "none"

                    return (
                      <Card key={author.id} className={getSeverityColor(authorSeverity)}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-sm">{author.name}</h4>
                              <p className="text-xs text-muted-foreground">{author.email}</p>
                              <p className="text-xs text-muted-foreground">{author.affiliation}</p>
                            </div>
                            <Badge variant="outline" className={getSeverityColor(authorSeverity)}>
                              {t(`coi.severity.${authorSeverity}`) || authorSeverity.toUpperCase()}
                            </Badge>
                          </div>

                          {authorRels.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium">
                                {authorRels.length}{" "}
                                {t("coi.reviewerToPaper.relationship") || "relationship(s)"}:
                              </p>
                              {authorRels.map((rel: Relationship, idx: number) => (
                                <div key={idx} className="text-xs pl-3 border-l-2 border-current">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {t(`coi.relationshipTypes.${rel.type}`) ||
                                        rel.type.replace(/_/g, " ")}
                                    </Badge>
                                    <Badge
                                      className={getSeverityColor(rel.severity)}
                                      variant="outline"
                                    >
                                      {t(`coi.severity.${rel.severity}`) || rel.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-xs opacity-90">{rel.description}</p>
                                  <p className="text-xs opacity-75 mt-1">
                                    {t("coi.common.from")} {rel.start_date}
                                    {rel.end_date && ` ${t("coi.common.to")} ${rel.end_date}`}
                                  </p>
                                </div>
                              ))}

                              {/* Timeline for this author */}
                              {authorTimelines[author.id] &&
                                authorTimelines[author.id].length > 0 && (
                                  <div className="mt-4 pt-4 border-t">
                                    <RelationshipTimeline
                                      relationships={authorTimelines[author.id]}
                                    />
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3" />
                              {t("coi.reviewerToPaper.noCOI") || "No COI detected"}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("coi.reviewerToPaper.noData") || "No COI data available"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

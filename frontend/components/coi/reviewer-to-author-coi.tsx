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
import { AlertTriangle, User, FileText, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { Reviewer, Author, Relationship } from "@/lib/mock-data/coi"
import {
  searchReviewers,
  getAllAuthors,
  checkReviewerToAuthorCOI,
  getRelationshipTimeline,
} from "@/lib/api/coi-mock"
import { RelationshipTimeline } from "./relationship-timeline"
import { Loader2 } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"

export function ReviewerToAuthorCOI() {
  const { t } = useTranslation()
  const [selectedReviewer, setSelectedReviewer] = useState<string>("")
  const [selectedAuthor, setSelectedAuthor] = useState<string>("")
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [coiReport, setCoiReport] = useState<any>(null)
  const [timeline, setTimeline] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedReviewer && selectedAuthor) {
      loadCOIReport()
      loadTimeline()
    }
  }, [selectedReviewer, selectedAuthor])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [reviewersRes, authorsRes] = await Promise.all([
        searchReviewers({ limit: 50 }),
        getAllAuthors(),
      ])
      setReviewers(reviewersRes.data)
      setAuthors(authorsRes.data)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCOIReport = async () => {
    if (!selectedReviewer || !selectedAuthor) return

    setLoading(true)
    try {
      const result = await checkReviewerToAuthorCOI(selectedReviewer, selectedAuthor)
      if (result.data) {
        setCoiReport(result.data)
      }
    } catch (error) {
      console.error("Failed to load COI report:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async () => {
    if (!selectedReviewer || !selectedAuthor) return

    setLoadingTimeline(true)
    try {
      const result = await getRelationshipTimeline(selectedReviewer, selectedAuthor)
      if (result.data) {
        setTimeline(result.data)
      }
    } catch (error) {
      console.error("Failed to load timeline:", error)
    } finally {
      setLoadingTimeline(false)
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
  const selectedAuthorData = authors.find((a) => a.id === selectedAuthor)

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 ${spacing.gap.lg}`}>
      {/* Left Panel - Selection */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className={typography.h4}>
            {t("coi.reviewerToAuthor.title") || "Reviewer → Author COI Analysis"}
          </CardTitle>
          <CardDescription className={typography.body}>
            {t("coi.reviewerToAuthor.description") ||
              "Select a reviewer and author to analyze their conflict of interest relationship"}
          </CardDescription>
        </CardHeader>
        <CardContent className={spacing.subsection}>
          {/* Reviewer Selection */}
          <div className={spacing.item}>
            <label className={`${typography.body} ${typography.medium} flex items-center ${spacing.gap.sm}`}>
              <User className={iconSizes.sm} />
              {t("coi.reviewerToAuthor.selectReviewer") || "Select Reviewer"}
            </label>
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("coi.reviewerToAuthor.reviewerPlaceholder") || "Choose reviewer"}
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

          {/* Author Selection */}
          <div className={spacing.item}>
            <label className={`${typography.body} ${typography.medium} flex items-center ${spacing.gap.sm}`}>
              <FileText className={iconSizes.sm} />
              {t("coi.reviewerToAuthor.selectAuthor") || "Select Author"}
            </label>
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("coi.reviewerToAuthor.authorPlaceholder") || "Choose author"}
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent className="max-w-[500px]">
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id} className="max-w-full">
                    <span
                      className="block truncate"
                      title={`${author.name} - ${author.affiliation}`}
                    >
                      {author.name} - {author.affiliation}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReviewerData && selectedAuthorData && (
            <Card className={`border-2 ${getSeverityColor(coiReport?.severity || "none")}`}>
              <CardContent className="pt-4">
                <div className={`${spacing.item} ${typography.body}`}>
                  <div>
                    <p className={typography.medium}>{t("coi.common.reviewer")}</p>
                    <p className={typography.muted}>{selectedReviewerData.name}</p>
                    <p className={typography.caption}>{selectedReviewerData.email}</p>
                  </div>
                  <div>
                    <p className={typography.medium}>{t("coi.common.author")}</p>
                    <p className={typography.muted}>{selectedAuthorData.name}</p>
                    <p className={typography.caption}>{selectedAuthorData.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Right Panel - COI Report */}
      <div className={`lg:col-span-2 ${spacing.subsection}`}>
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" style={{ width: "2rem", height: "2rem" }} />
            </CardContent>
          </Card>
        ) : !selectedReviewer || !selectedAuthor ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <User className="mx-auto mb-4 opacity-50" style={{ width: "3rem", height: "3rem" }} />
                <p className={typography.body}>
                  {t("coi.reviewerToAuthor.selectBoth") ||
                    "Please select both reviewer and author to analyze COI"}
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
                  <CardTitle className={`flex items-center ${spacing.gap.sm}`}>
                    {coiReport.severity === "none" ? (
                      <CheckCircle2 className={iconSizes.md} />
                    ) : (
                      <AlertTriangle className={iconSizes.md} />
                    )}
                    {t("coi.reviewerToAuthor.coiReport") || "COI Analysis Report"}
                  </CardTitle>
                  <Badge variant="outline" className={`${typography.h4} ${typography.semibold}`}>
                    {t(`coi.severity.${coiReport.severity}`) || coiReport.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className={spacing.subsection}>
                <p className={typography.body}>{coiReport.summary}</p>

                <div className={`flex items-center ${spacing.gap.md}`}>
                  <Badge variant="outline" className={`flex items-center ${spacing.gap.tight}`}>
                    <Calendar className={iconSizes.xs} />
                    {coiReport.relationships.length}{" "}
                    {t("coi.reviewerToAuthor.relationships") || "relationships"}
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

            {/* Relationships */}
            {coiReport.relationships.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className={typography.h4}>
                    {t("coi.reviewerToAuthor.relationships") || "Relationships"}
                  </CardTitle>
                  <CardDescription className={typography.body}>
                    {t("coi.reviewerToAuthor.relationshipsDescription") ||
                      "Detailed breakdown of detected relationships"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={spacing.gap.md}>
                  {coiReport.relationships.map((rel: Relationship, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className={`flex items-center ${spacing.gap.sm} mb-2`}>
                              <Badge variant="outline">
                                {t(`coi.relationshipTypes.${rel.type}`) ||
                                  rel.type.replace(/_/g, " ")}
                              </Badge>
                              <Badge className={getSeverityColor(rel.severity)}>
                                {t(`coi.severity.${rel.severity}`) || rel.severity}
                              </Badge>
                            </div>
                            <p className={`${typography.body} ${typography.medium} mb-1`}>
                              {rel.description}
                            </p>
                            <p className={typography.caption}>
                              {t("coi.common.from")} {rel.start_date}
                              {rel.end_date && ` ${t("coi.common.to")} ${rel.end_date}`}
                            </p>
                            {rel.evidence && rel.evidence.length > 0 && (
                              <div className="mt-2">
                                <p className={`${typography.bodySmall} ${typography.medium} mb-1`}>
                                  {t("coi.timeline.evidence")}
                                </p>
                                <ul className={`${typography.bodySmall} ${typography.muted} list-disc list-inside ${spacing.tight}`}>
                                  {rel.evidence.map((ev: string, i: number) => (
                                    <li key={i}>{ev}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className={typography.h4}>
                  {t("coi.reviewerToAuthor.timeline") || "Relationship History Timeline"}
                </CardTitle>
                <CardDescription className={typography.body}>
                  {t("coi.reviewerToAuthor.timelineDescription") ||
                    "Interactive timeline showing the history of interactions"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTimeline ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-muted-foreground" style={{ width: "1.5rem", height: "1.5rem" }} />
                  </div>
                ) : timeline.length > 0 ? (
                  <RelationshipTimeline relationships={timeline} />
                ) : (
                  <div className={`text-center py-8 text-muted-foreground ${typography.body}`}>
                    {t("coi.reviewerToAuthor.noTimeline") || "No relationship history available"}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <XCircle className="mx-auto mb-4 opacity-50" style={{ width: "3rem", height: "3rem" }} />
                <p className={typography.body}>
                  {t("coi.reviewerToAuthor.noData") || "No COI data available"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

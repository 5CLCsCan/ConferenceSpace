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
import { searchReviewers, getAllAuthors, checkReviewerToAuthorCOI, getRelationshipTimeline } from "@/lib/api/coi-mock"
import { RelationshipTimeline } from "./relationship-timeline"
import { Loader2 } from "lucide-react"

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Selection */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>{t("coi.reviewerToAuthor.title") || "Reviewer → Author COI Analysis"}</CardTitle>
          <CardDescription>
            {t("coi.reviewerToAuthor.description") ||
              "Select a reviewer and author to analyze their conflict of interest relationship"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reviewer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("coi.reviewerToAuthor.selectReviewer") || "Select Reviewer"}
            </label>
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger>
                <SelectValue placeholder={t("coi.reviewerToAuthor.reviewerPlaceholder") || "Choose reviewer"} />
              </SelectTrigger>
              <SelectContent>
                {reviewers.map((reviewer) => (
                  <SelectItem key={reviewer.id} value={reviewer.id}>
                    {reviewer.name} - {reviewer.affiliation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Author Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("coi.reviewerToAuthor.selectAuthor") || "Select Author"}
            </label>
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger>
                <SelectValue placeholder={t("coi.reviewerToAuthor.authorPlaceholder") || "Choose author"} />
              </SelectTrigger>
              <SelectContent>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name} - {author.affiliation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReviewerData && selectedAuthorData && (
            <Card className={`border-2 ${getSeverityColor(coiReport?.severity || "none")}`}>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Reviewer:</p>
                    <p className="text-muted-foreground">{selectedReviewerData.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedReviewerData.email}</p>
                  </div>
                  <div>
                    <p className="font-medium">Author:</p>
                    <p className="text-muted-foreground">{selectedAuthorData.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAuthorData.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        ) : !selectedReviewer || !selectedAuthor ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("coi.reviewerToAuthor.selectBoth") || "Please select both reviewer and author to analyze COI"}</p>
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
                    {t("coi.reviewerToAuthor.coiReport") || "COI Analysis Report"}
                  </CardTitle>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {coiReport.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{coiReport.summary}</p>

                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {coiReport.relationships.length} {t("coi.reviewerToAuthor.relationships") || "relationships"}
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
                    {t(`coi.recommendation.${coiReport.recommendation}`) || coiReport.recommendation.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Relationships */}
            {coiReport.relationships.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("coi.reviewerToAuthor.relationships") || "Relationships"}</CardTitle>
                  <CardDescription>
                    {t("coi.reviewerToAuthor.relationshipsDescription") ||
                      "Detailed breakdown of detected relationships"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {coiReport.relationships.map((rel: Relationship, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{rel.type.replace(/_/g, " ")}</Badge>
                              <Badge className={getSeverityColor(rel.severity)}>
                                {rel.severity}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mb-1">{rel.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("coi.reviewerToAuthor.from") || "From"} {rel.start_date}
                              {rel.end_date && ` ${t("coi.reviewerToAuthor.to") || "to"} ${rel.end_date}`}
                            </p>
                            {rel.evidence && rel.evidence.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">
                                  {t("coi.reviewerToAuthor.evidence") || "Evidence:"}
                                </p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
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
                <CardTitle>{t("coi.reviewerToAuthor.timeline") || "Relationship History Timeline"}</CardTitle>
                <CardDescription>
                  {t("coi.reviewerToAuthor.timelineDescription") ||
                    "Interactive timeline showing the history of interactions"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTimeline ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : timeline.length > 0 ? (
                  <RelationshipTimeline relationships={timeline} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
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
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("coi.reviewerToAuthor.noData") || "No COI data available"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


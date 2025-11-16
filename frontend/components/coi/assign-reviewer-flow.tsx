"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, UserCheck, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { Reviewer, Paper, Author, COIType } from "@/lib/mock-data/coi"
import { searchReviewers, getAllPapers, getAllAuthors, assignReviewer } from "@/lib/api/coi-mock"
import { ReviewerListItem } from "./reviewer-list-item"
import { useToast } from "@/hooks/use-toast"
import { typography, spacing, iconSizes } from "@/lib/typography"

export function AssignReviewerFlow() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [coiType, setCoiType] = useState<COIType>("paper")
  const [selectedPaper, setSelectedPaper] = useState<string>("")
  const [selectedAuthor, setSelectedAuthor] = useState<string>("")
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [selectedReviewers, setSelectedReviewers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [reviewersRes, papersRes, authorsRes] = await Promise.all([
        searchReviewers({ limit: 50 }),
        getAllPapers(),
        getAllAuthors(),
      ])
      setReviewers(reviewersRes.data)
      setPapers(papersRes.data)
      setAuthors(authorsRes.data)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const result = await searchReviewers({ query: searchQuery, limit: 50 })
      setReviewers(result.data)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleReviewerSelection = (reviewerId: string) => {
    const newSelected = new Set(selectedReviewers)
    if (newSelected.has(reviewerId)) {
      newSelected.delete(reviewerId)
    } else {
      newSelected.add(reviewerId)
    }
    setSelectedReviewers(newSelected)
  }

  const handleAssign = async () => {
    if (selectedReviewers.size === 0) {
      toast({
        title: t("coi.assign.noSelection"),
        description: t("coi.assign.selectAtLeastOne"),
        variant: "destructive",
      })
      return
    }

    if (coiType === "paper" && !selectedPaper) {
      toast({
        title: t("coi.assign.noPaper"),
        description: t("coi.assign.paper"),
        variant: "destructive",
      })
      return
    }

    if (coiType === "author" && !selectedAuthor) {
      toast({
        title: t("coi.assign.noAuthor"),
        description: t("coi.assign.author"),
        variant: "destructive",
      })
      return
    }

    setAssigning(true)
    try {
      const assignments = Array.from(selectedReviewers).map((reviewerId) =>
        assignReviewer({
          reviewerId,
          paperId: coiType === "paper" ? selectedPaper : undefined,
          authorId: coiType === "author" ? selectedAuthor : undefined,
          coiType,
          override: false,
        }),
      )

      const results = await Promise.all(assignments)

      const successful = results.filter((r) => r.data.success).length
      const failed = results.filter((r) => !r.data.success).length

      toast({
        title: successful > 0 ? t("coi.assign.success") : t("coi.assign.failed"),
        description:
          successful > 0
            ? t("coi.assign.successMessage", { count: successful })
            : t("coi.assign.failureMessage", { count: failed }),
        variant: successful > 0 ? "default" : "destructive",
      })

      if (successful > 0) {
        setSelectedReviewers(new Set())
      }
    } catch (error) {
      toast({
        title: t("coi.assign.error"),
        description: error instanceof Error ? error.message : "Failed to assign reviewers",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 ${spacing.gap.lg}`}>
      {/* Left Panel - Selection */}
      <div className={`lg:col-span-2 ${spacing.subsection}`}>
        <Card>
          <CardHeader>
            <CardTitle className={typography.h4}>{t("coi.assign.title")}</CardTitle>
            <CardDescription className={typography.body}>
              {t("coi.assign.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className={spacing.subsection}>
            {/* COI Type Selection */}
            <div className={spacing.item}>
              <Label className={typography.label}>{t("coi.assign.coiType")}</Label>
              <Select value={coiType} onValueChange={(v) => setCoiType(v as COIType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">{t("coi.assign.types.paper")}</SelectItem>
                  <SelectItem value="author">{t("coi.assign.types.author")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paper/Author Selection */}
            {coiType === "paper" && (
              <div className={spacing.item}>
                <Label className={typography.label}>{t("coi.assign.selectPaper")}</Label>
                <Select value={selectedPaper} onValueChange={setSelectedPaper}>
                  <SelectTrigger className="w-full max-w-full">
                    <SelectValue
                      placeholder={t("coi.assign.paperPlaceholder")}
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
            )}

            {coiType === "author" && (
              <div className={spacing.item}>
                <Label className={typography.label}>{t("coi.assign.selectAuthor")}</Label>
                <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                  <SelectTrigger className="w-full max-w-full">
                    <SelectValue
                      placeholder={t("coi.assign.authorPlaceholder")}
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent className="max-w-[500px]">
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id} className="max-w-full">
                        <span
                          className="block truncate"
                          title={`${author.name} (${author.affiliation})`}
                        >
                          {author.name} ({author.affiliation})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            <div className={spacing.item}>
              <Label className={typography.label}>{t("coi.assign.search")}</Label>
              <div className={`flex ${spacing.gap.sm}`}>
                <div className="relative flex-1">
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconSizes.sm} text-muted-foreground`}
                  />
                  <Input
                    placeholder={t("coi.assign.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className={`${iconSizes.sm} animate-spin`} />
                  ) : (
                    <Search className={iconSizes.sm} />
                  )}
                </Button>
              </div>
            </div>

            {/* Reviewers List */}
            <div className={spacing.item}>
              <div className="flex items-center justify-between">
                <Label className={typography.label}>{t("coi.assign.reviewersList")}</Label>
                <Badge variant="outline">
                  {reviewers.length} {t("coi.assign.reviewers")}
                </Badge>
              </div>
              <div
                className={`max-h-[500px] overflow-y-auto ${spacing.item} border rounded-lg ${spacing.padding.card}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2
                      className="animate-spin text-muted-foreground"
                      style={{ width: "1.5rem", height: "1.5rem" }}
                    />
                  </div>
                ) : reviewers.length === 0 ? (
                  <div className={`text-center py-8 text-muted-foreground ${typography.body}`}>
                    {t("coi.assign.noReviewers")}
                  </div>
                ) : (
                  reviewers.map((reviewer) => (
                    <ReviewerListItem
                      key={reviewer.id}
                      reviewer={reviewer}
                      selected={selectedReviewers.has(reviewer.id)}
                      onSelect={() => toggleReviewerSelection(reviewer.id)}
                      coiType={coiType}
                      paperId={coiType === "paper" ? selectedPaper : undefined}
                      authorId={coiType === "author" ? selectedAuthor : undefined}
                    />
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Selected Reviewers & Actions */}
      <div className={spacing.subsection}>
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center ${spacing.gap.sm}`}>
              <UserCheck className={iconSizes.md} />
              {t("coi.assign.selectedReviewers")}
            </CardTitle>
            <CardDescription className={typography.body}>
              {selectedReviewers.size}{" "}
              {selectedReviewers.size === 1
                ? t("coi.assign.reviewerSelected")
                : t("coi.assign.reviewersSelected")}
            </CardDescription>
          </CardHeader>
          <CardContent className={spacing.subsection}>
            {selectedReviewers.size === 0 ? (
              <div className={`text-center py-8 text-muted-foreground ${typography.body}`}>
                {t("coi.assign.noSelectionYet")}
              </div>
            ) : (
              <div className={`${spacing.item} max-h-[300px] overflow-y-auto`}>
                {reviewers
                  .filter((r) => selectedReviewers.has(r.id))
                  .map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className={`flex items-center justify-between ${spacing.padding.card} border rounded-lg`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`${typography.body} ${typography.medium} truncate`}>
                          {reviewer.name}
                        </p>
                        <p className={`${typography.bodySmall} text-muted-foreground truncate`}>
                          {reviewer.affiliation}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReviewerSelection(reviewer.id)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            <Button
              onClick={handleAssign}
              disabled={selectedReviewers.size === 0 || assigning}
              className="w-full"
            >
              {assigning ? (
                <>
                  <Loader2 className={`mr-2 ${iconSizes.sm} animate-spin`} />
                  {t("coi.assign.assigning")}
                </>
              ) : (
                <>
                  <UserCheck className={`mr-2 ${iconSizes.sm}`} />
                  {t("coi.assign.assignSelected")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className={`flex items-start ${spacing.gap.sm}`}>
              <AlertTriangle className={`${iconSizes.md} text-blue-600 mt-0.5`} />
              <div className="flex-1">
                <p className={`${typography.body} ${typography.medium} text-blue-900`}>
                  {t("coi.assign.info.title")}
                </p>
                <p className={`${typography.bodySmall} text-blue-700 mt-1`}>
                  {coiType === "paper" ? t("coi.assign.info.paper") : t("coi.assign.info.author")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

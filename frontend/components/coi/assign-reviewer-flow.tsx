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
        title: t("coi.assign.noSelection") || "No reviewers selected",
        description: t("coi.assign.selectAtLeastOne") || "Please select at least one reviewer.",
        variant: "destructive",
      })
      return
    }

    if (coiType === "paper" && !selectedPaper) {
      toast({
        title: t("coi.assign.noPaper") || "No paper selected",
        description: t("coi.assign.selectPaper") || "Please select a paper.",
        variant: "destructive",
      })
      return
    }

    if (coiType === "author" && !selectedAuthor) {
      toast({
        title: t("coi.assign.noAuthor") || "No author selected",
        description: t("coi.assign.selectAuthor") || "Please select an author.",
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
        title:
          successful > 0
            ? t("coi.assign.success") || "Assignment successful"
            : t("coi.assign.failed") || "Assignment failed",
        description:
          successful > 0
            ? t("coi.assign.successMessage", { count: successful }) ||
              `${successful} reviewer(s) assigned successfully.`
            : t("coi.assign.failureMessage", { count: failed }) ||
              `${failed} assignment(s) failed due to COI conflicts.`,
        variant: successful > 0 ? "default" : "destructive",
      })

      if (successful > 0) {
        setSelectedReviewers(new Set())
      }
    } catch (error) {
      toast({
        title: t("coi.assign.error") || "Error",
        description: error instanceof Error ? error.message : "Failed to assign reviewers",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("coi.assign.title") || "Select Reviewers"}</CardTitle>
            <CardDescription>
              {t("coi.assign.description") ||
                "Search and select reviewers to assign. COI will be checked based on selection type."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* COI Type Selection */}
            <div className="space-y-2">
              <Label>{t("coi.assign.coiType") || "COI Check Type"}</Label>
              <Select value={coiType} onValueChange={(v) => setCoiType(v as COIType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">
                    {t("coi.assign.types.paper") || "Paper-based COI"}
                  </SelectItem>
                  <SelectItem value="author">
                    {t("coi.assign.types.author") || "Author-based COI"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paper/Author Selection */}
            {coiType === "paper" && (
              <div className="space-y-2">
                <Label>{t("coi.assign.selectPaper") || "Select Paper"}</Label>
                <Select value={selectedPaper} onValueChange={setSelectedPaper}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("coi.assign.paperPlaceholder") || "Choose a paper"} />
                  </SelectTrigger>
                  <SelectContent>
                    {papers.map((paper) => (
                      <SelectItem key={paper.id} value={paper.id}>
                        {paper.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {coiType === "author" && (
              <div className="space-y-2">
                <Label>{t("coi.assign.selectAuthor") || "Select Author"}</Label>
                <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("coi.assign.authorPlaceholder") || "Choose an author"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name} ({author.affiliation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <Label>{t("coi.assign.search") || "Search Reviewers"}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("coi.assign.searchPlaceholder") || "Search by name, email, or domain..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Reviewers List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("coi.assign.reviewersList") || "Available Reviewers"}</Label>
                <Badge variant="outline">
                  {reviewers.length} {t("coi.assign.reviewers") || "reviewers"}
                </Badge>
              </div>
              <div className="max-h-[500px] overflow-y-auto space-y-2 border rounded-lg p-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reviewers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("coi.assign.noReviewers") || "No reviewers found"}
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
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {t("coi.assign.selectedReviewers") || "Selected Reviewers"}
            </CardTitle>
            <CardDescription>
              {selectedReviewers.size}{" "}
              {selectedReviewers.size === 1
                ? t("coi.assign.reviewerSelected") || "reviewer selected"
                : t("coi.assign.reviewersSelected") || "reviewers selected"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedReviewers.size === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t("coi.assign.noSelectionYet") || "No reviewers selected yet"}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {reviewers
                  .filter((r) => selectedReviewers.has(r.id))
                  .map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{reviewer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("coi.assign.assigning") || "Assigning..."}
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {t("coi.assign.assignSelected") || `Assign Selected (${selectedReviewers.size})`}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {t("coi.assign.info.title") || "COI Check"}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {coiType === "paper"
                    ? t("coi.assign.info.paper") ||
                      "Checking COI against all authors of the selected paper."
                    : t("coi.assign.info.author") ||
                      "Checking COI specifically for the selected author."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


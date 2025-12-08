"use client"

/**
 * Conference Submissions Component
 * Displays list of papers submitted to the conference
 * Role-based filtering:
 * - Author: Only sees their own papers
 * - Reviewer: Only sees papers assigned to them
 * - Chair: Sees all papers
 *
 * Data Sources:
 * - Papers: GET /api/conferences/:id/papers?status=&track_id= (papers table)
 * - Assignments: GET /api/users/:userId/assignments (review_assignments table)
 */

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Paper } from "@/lib/types"
import { getConferencePapers } from "@/lib/api/conferences"
import { getSubmissionReviewAnalytics, type ReviewAnalytics } from "@/lib/api/reviews"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Users, X, Filter, Eye, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubmissionAnalytics } from "@/components/chair/submission-analytics"
import type { PaperStatus } from "@/lib/types"

interface ConferenceSubmissionsProps {
  conferenceId: string
}

export function ConferenceSubmissions({ conferenceId }: ConferenceSubmissionsProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, currentRole } = useAuth()
  const { t } = useTranslation()
  const [papers, setPapers] = useState<Paper[]>([])
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [trackFilter, setTrackFilter] = useState<string>("all")
  const [filterOpen, setFilterOpen] = useState(false)
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all")
  const [tempTrackFilter, setTempTrackFilter] = useState<string>("all")
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null)
  const [quickViewAnalytics, setQuickViewAnalytics] = useState<ReviewAnalytics | null>(null)
  const [loadingQuickView, setLoadingQuickView] = useState(false)

  // Initialize filters from URL query params (e.g., keyword, track)
  useEffect(() => {
    const initialKeyword = searchParams.get("keyword")
    const initialTrack = searchParams.get("track")

    if (initialKeyword) {
      setSearchQuery(initialKeyword)
    }

    if (initialTrack) {
      setTrackFilter(initialTrack)
      setTempTrackFilter(initialTrack)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadPapers() {
      const response = await getConferencePapers(conferenceId)
      if (response.data) {
        let visiblePapers = response.data

        if (currentRole === "author") {
          // Authors only see their own papers
          visiblePapers = response.data.filter((paper) =>
            paper.authors.some((author) => author.user_id === user?.id),
          )
        } else if (currentRole === "reviewer") {
          // Reviewers only see papers assigned to them
          // In a real app, this would check review_assignments table
          // For now, we'll show papers that have reviews from this user
          visiblePapers = response.data.filter((paper) =>
            paper.reviews.some((review) => review.reviewer_id === user?.id),
          )
        } else if (currentRole === "chair") {
          // Chairs see all papers
          visiblePapers = response.data
        }

        setPapers(visiblePapers)
        setFilteredPapers(visiblePapers)
      }
      setLoading(false)
    }

    loadPapers()
  }, [conferenceId, user, currentRole])

  useEffect(() => {
    let filtered = papers

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (paper) =>
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((paper) => paper.status === statusFilter)
    }

    // Track filter
    if (trackFilter !== "all") {
      filtered = filtered.filter((paper) => paper.track_id === trackFilter)
    }

    setFilteredPapers(filtered)
  }, [searchQuery, statusFilter, trackFilter, papers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-success text-white"
      case "rejected":
        return "bg-error text-white"
      case "under_review":
        return "bg-primary text-white"
      case "revision_requested":
        return "bg-warning text-gray-900"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "submitted":
        return t("dashboard.chair.submissions.submitted")
      case "under_review":
        return t("dashboard.chair.submissions.underReview")
      case "accepted":
        return t("dashboard.chair.submissions.accepted")
      case "rejected":
        return t("dashboard.chair.submissions.rejected")
      case "revision_requested":
        return t("dashboard.chair.submissions.revisionRequested")
      case "camera_ready":
        return t("dashboard.chair.submissions.cameraReady")
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const locale = t("common.messages.languages.vietnamese") === "Tiếng Việt" ? "vi-VN" : "en-US"
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDecision = async (paperId: string, decision: "accepted" | "rejected") => {
    try {
      const { updateSubmissionStatus } = await import("@/lib/api/submissions")
      const response = await updateSubmissionStatus(conferenceId, paperId, decision)
      
      if (response.error) {
        console.error("Failed to update submission status:", response.error)
        // TODO: Show error toast
        return
      }
      
      // Update local state
      setPapers((prevPapers) =>
        prevPapers.map((paper) =>
          paper.id === paperId ? { ...paper, status: decision as PaperStatus } : paper
        )
      )
      
      console.log(`Successfully updated paper ${paperId} to ${decision}`)
      // TODO: Show success toast
    } catch (error) {
      console.error("Error updating submission status:", error)
      // TODO: Show error toast
    }
  }

  const handleQuickView = async (paperId: string) => {
    setSelectedPaperId(paperId)
    setQuickViewOpen(true)
    setLoadingQuickView(true)
    
    const response = await getSubmissionReviewAnalytics(conferenceId, paperId)
    if (!response.error && response.data) {
      setQuickViewAnalytics(response.data)
    }
    setLoadingQuickView(false)
  }

  const getRoleDescription = () => {
    if (currentRole === "author") {
      return t("dashboard.chair.submissions.descriptionAuthor")
    } else if (currentRole === "reviewer") {
      return t("dashboard.chair.submissions.descriptionReviewer")
    } else if (currentRole === "chair") {
      return t("dashboard.chair.submissions.descriptionChair")
    }
    return t("dashboard.chair.submissions.descriptionDefault")
  }

  const handleRemoveStatusFilter = () => {
    setStatusFilter("all")
  }

  const handleRemoveTrackFilter = () => {
    setTrackFilter("all")
  }

  const handleApplyFilters = () => {
    setStatusFilter(tempStatusFilter)
    setTrackFilter(tempTrackFilter)
    setFilterOpen(false)
  }

  const handleClearFilters = () => {
    setTempStatusFilter("all")
    setTempTrackFilter("all")
    setStatusFilter("all")
    setTrackFilter("all")
    setFilterOpen(false)
  }

  const hasActiveFilters = statusFilter !== "all" || trackFilter !== "all"

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const getStatusLabel = (status: string) => {
      switch (status) {
        case "submitted":
          return t("dashboard.chair.submissions.submitted")
        case "under_review":
          return t("dashboard.chair.submissions.underReview")
        case "accepted":
          return t("dashboard.chair.submissions.accepted")
        case "rejected":
          return t("dashboard.chair.submissions.rejected")
        case "revision_requested":
          return t("dashboard.chair.submissions.revisionRequested")
        default:
          return status
      }
    }

    const filters: ActiveFilter[] = []
    if (statusFilter !== "all") {
      filters.push({
        id: "status",
        label: getStatusLabel(statusFilter),
        onRemove: handleRemoveStatusFilter,
      })
    }
    if (trackFilter !== "all") {
      filters.push({
        id: "track",
        label:
          trackFilter === "track-1"
            ? "Machine Learning & AI"
            : trackFilter === "track-2"
              ? "Systems & Networking"
              : trackFilter === "track-3"
                ? "Human-Computer Interaction"
                : trackFilter,
        onRemove: handleRemoveTrackFilter,
      })
    }
    return filters
  }, [statusFilter, trackFilter, t])

  const filterPopover = (
    <div className={spacing.subsection}>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>{t("dashboard.chair.submissions.statusLabel")}</h4>
        <div className={spacing.item}>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("all")}
          >
            <Checkbox checked={tempStatusFilter === "all"} />
            <span className={typography.body}>{t("dashboard.chair.submissions.allStatuses")}</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("submitted")}
          >
            <Checkbox checked={tempStatusFilter === "submitted"} />
            <span className={typography.body}>{t("dashboard.chair.submissions.submitted")}</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("under_review")}
          >
            <Checkbox checked={tempStatusFilter === "under_review"} />
            <span className={typography.body}>{t("dashboard.chair.submissions.underReview")}</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("accepted")}
          >
            <Checkbox checked={tempStatusFilter === "accepted"} />
            <span className={typography.body}>{t("dashboard.chair.submissions.accepted")}</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("rejected")}
          >
            <Checkbox checked={tempStatusFilter === "rejected"} />
            <span className={typography.body}>{t("dashboard.chair.submissions.rejected")}</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("revision_requested")}
          >
            <Checkbox checked={tempStatusFilter === "revision_requested"} />
            <span className={typography.body}>{t("dashboard.chair.submissions.revisionRequested")}</span>
          </label>
        </div>
      </div>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>{t("dashboard.chair.submissions.trackLabel")}</h4>
        <div className={spacing.item}>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempTrackFilter("all")}
          >
            <Checkbox checked={tempTrackFilter === "all"} />
            <span className={typography.body}>{t("dashboard.chair.submissions.allTracks")}</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempTrackFilter("track-1")}
          >
            <Checkbox checked={tempTrackFilter === "track-1"} />
            <span className={typography.body}>Machine Learning & AI</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempTrackFilter("track-2")}
          >
            <Checkbox checked={tempTrackFilter === "track-2"} />
            <span className={typography.body}>Systems & Networking</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempTrackFilter("track-3")}
          >
            <Checkbox checked={tempTrackFilter === "track-3"} />
            <span className={typography.body}>Human-Computer Interaction</span>
          </label>
        </div>
      </div>
      <div className={`flex justify-end ${spacing.gap.sm} pt-2 border-t`}>
        <Button variant="outline" size="sm" onClick={handleClearFilters}>
          {t("dashboard.chair.submissions.clear")}
        </Button>
        <Button size="sm" onClick={handleApplyFilters}>
          {t("dashboard.chair.submissions.apply")}
        </Button>
      </div>
    </div>
  )

  const getStatusLabelForFilter = (status: string) => {
    switch (status) {
      case "submitted":
        return t("dashboard.chair.submissions.submitted")
      case "under_review":
        return t("dashboard.chair.submissions.underReview")
      case "accepted":
        return t("dashboard.chair.submissions.accepted")
      case "rejected":
        return t("dashboard.chair.submissions.rejected")
      case "revision_requested":
        return t("dashboard.chair.submissions.revisionRequested")
      default:
        return status
    }
  }

  if (loading) {
    return <div>{t("common.actions.loading")}</div>
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={`${typography.h1} text-gray-900`}>{t("dashboard.chair.submissions.title")}</h1>
        <p className={`mt-3 ${typography.bodyLarge} leading-relaxed text-gray-600`}>
          {getRoleDescription()}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t("dashboard.chair.submissions.searchPlaceholder")}
          activeFilters={activeFilters}
          filterPopover={filterPopover}
          hasActiveFilters={hasActiveFilters}
          filterOpen={filterOpen}
          onFilterOpenChange={setFilterOpen}
          onFilterButtonClick={() => {
            setTempStatusFilter(statusFilter)
            setTempTrackFilter(trackFilter)
          }}
        />
        <div
          className={`mt-2 flex items-center ${spacing.gap.md} ${typography.body} text-gray-600`}
        >
          <Filter className={iconSizes.sm} />
          <span>
            {t("dashboard.chair.submissions.resultsCount")} <span className={typography.semibold}>{filteredPapers.length}</span> /{" "}
            {papers.length}
          </span>
        </div>
      </div>

      {/* Papers List */}
      <div className={spacing.subsection}>
        {filteredPapers.map((paper) => (
          <Card
            key={paper.id}
            className={`${spacing.padding.cardLarge} transition-shadow hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`flex items-start ${spacing.gap.md}`}>
                  <FileText className={`mt-1 ${iconSizes.md} flex-shrink-0 text-primary`} />
                  <div className="flex-1 min-w-0">
                    <h3 className={`${typography.h4} text-gray-900 truncate`}>{paper.title}</h3>
                    <p
                      className={`mt-2 line-clamp-2 ${typography.body} leading-relaxed text-gray-600`}
                    >
                      {paper.abstract}
                    </p>

                    <div
                      className={`mt-4 flex flex-wrap items-center ${spacing.gap.md} ${typography.body} text-gray-600`}
                    >
                      <div className={`flex items-center ${spacing.gap.sm}`}>
                        <Users className={iconSizes.sm} />
                        <span>{paper.authors.map((a) => a.name).join(", ")}</span>
                      </div>
                      <div className={`flex items-center ${spacing.gap.sm}`}>
                        <Calendar className={iconSizes.sm} />
                        <span>{formatDate(paper.submitted_at)}</span>
                      </div>
                    </div>

                    <div className={`mt-3 flex flex-wrap ${spacing.gap.sm}`}>
                      {paper.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className={typography.bodySmall}>
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`ml-4 flex flex-col items-end ${spacing.gap.md}`}>
                <Badge className={getStatusColor(paper.status)}>
                  {getStatusLabel(paper.status)}
                </Badge>
                {paper.reviews.length > 0 && (
                  <span className={`${typography.bodySmall} text-gray-500`}>
                    {paper.reviews.length} {t("dashboard.chair.submissions.reviews")}
                  </span>
                )}
                
                {/* Chair-only actions */}
                {currentRole === "chair" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickView(paper.id)
                      }}
                      title={t("dashboard.chair.submissions.quickViewTitle")}
                    >
                      <Eye className={iconSizes.sm} />
                    </Button>
                    <Select
                      value={["accepted", "rejected"].includes(paper.status) ? paper.status : "__current"}
                      onValueChange={(value) => handleDecision(paper.id, value as "accepted" | "rejected")}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder={t("dashboard.chair.submissions.decision")} />
                      </SelectTrigger>
                      <SelectContent>
                        {!["accepted", "rejected"].includes(paper.status) && (
                          <SelectItem value="__current" disabled>
                            {getStatusLabel(paper.status)}
                          </SelectItem>
                        )}
                        <SelectItem value="accepted">
                          <span className="font-bold text-green-700">{t("common.actions.accept")}</span>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <span className="font-bold text-red-700">{t("common.actions.decline")}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/conference/${conferenceId}/submission/${paper.id}`)
                  }
                >
                  {t("common.actions.viewDetail")}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredPapers.length === 0 && (
          <Card className={`${spacing.padding.cardLarge} text-center`}>
            <FileText className="mx-auto text-gray-400" style={{ width: "3rem", height: "3rem" }} />
            <h3 className={`mt-4 ${typography.h4} text-gray-900`}>{t("dashboard.chair.submissions.noSubmissionsFound")}</h3>
            <p className={`mt-2 ${typography.body} text-gray-600`}>
              {currentRole === "author"
                ? t("dashboard.chair.submissions.noSubmissionsAuthor")
                : currentRole === "reviewer"
                  ? t("dashboard.chair.submissions.noSubmissionsReviewer")
                  : t("dashboard.chair.submissions.noSubmissionsFilter")}
            </p>
          </Card>
        )}
      </div>

      {/* Quick View Analytics Dialog */}
      <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPaperId && papers.find(p => p.id === selectedPaperId)?.title}
            </DialogTitle>
          </DialogHeader>
          {loadingQuickView ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : quickViewAnalytics ? (
            <SubmissionAnalytics analytics={quickViewAnalytics} compact />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t("dashboard.chair.submissions.noAnalytics")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

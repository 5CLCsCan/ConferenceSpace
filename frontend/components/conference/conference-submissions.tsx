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
import { useRouter } from "next/navigation"
import type { Paper } from "@/lib/types"
import { getConferencePapers } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Users, X, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterBar, type ActiveFilter } from "@/components/ui/filter-bar"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface ConferenceSubmissionsProps {
  conferenceId: string
}

export function ConferenceSubmissions({ conferenceId }: ConferenceSubmissionsProps) {
  const router = useRouter()
  const { user, currentRole } = useAuth()
  const [papers, setPapers] = useState<Paper[]>([])
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [trackFilter, setTrackFilter] = useState<string>("all")
  const [filterOpen, setFilterOpen] = useState(false)
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all")
  const [tempTrackFilter, setTempTrackFilter] = useState<string>("all")

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
        return "Đã Nộp"
      case "under_review":
        return "Đang Review"
      case "accepted":
        return "Chấp Nhận"
      case "rejected":
        return "Từ Chối"
      case "revision_requested":
        return "Yêu Cầu Sửa"
      case "camera_ready":
        return "Camera Ready"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRoleDescription = () => {
    if (currentRole === "author") {
      return "Danh sách các bài báo bạn đã nộp cho hội nghị"
    } else if (currentRole === "reviewer") {
      return "Danh sách các bài báo được phân công cho bạn review"
    } else if (currentRole === "chair") {
      return "Danh sách tất cả các bài báo đã nộp cho hội nghị"
    }
    return "Danh sách các bài báo"
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
    const filters: ActiveFilter[] = []
    if (statusFilter !== "all") {
      filters.push({
        id: "status",
        label: getStatusLabelForFilter(statusFilter),
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
  }, [statusFilter, trackFilter])

  const filterPopover = (
    <div className={spacing.subsection}>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>Trạng Thái</h4>
        <div className={spacing.item}>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("all")}
          >
            <Checkbox checked={tempStatusFilter === "all"} />
            <span className={typography.body}>Tất Cả Trạng Thái</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("submitted")}
          >
            <Checkbox checked={tempStatusFilter === "submitted"} />
            <span className={typography.body}>Đã Nộp</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("under_review")}
          >
            <Checkbox checked={tempStatusFilter === "under_review"} />
            <span className={typography.body}>Đang Review</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("accepted")}
          >
            <Checkbox checked={tempStatusFilter === "accepted"} />
            <span className={typography.body}>Chấp Nhận</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("rejected")}
          >
            <Checkbox checked={tempStatusFilter === "rejected"} />
            <span className={typography.body}>Từ Chối</span>
          </label>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempStatusFilter("revision_requested")}
          >
            <Checkbox checked={tempStatusFilter === "revision_requested"} />
            <span className={typography.body}>Yêu Cầu Sửa</span>
          </label>
        </div>
      </div>
      <div>
        <h4 className={`${typography.semibold} ${typography.body} mb-3`}>Track</h4>
        <div className={spacing.item}>
          <label
            className={`flex items-center ${spacing.gap.sm} cursor-pointer`}
            onClick={() => setTempTrackFilter("all")}
          >
            <Checkbox checked={tempTrackFilter === "all"} />
            <span className={typography.body}>Tất Cả Tracks</span>
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
          Clear
        </Button>
        <Button size="sm" onClick={handleApplyFilters}>
          Apply
        </Button>
      </div>
    </div>
  )

  const getStatusLabelForFilter = (status: string) => {
    switch (status) {
      case "submitted":
        return "Đã Nộp"
      case "under_review":
        return "Đang Review"
      case "accepted":
        return "Chấp Nhận"
      case "rejected":
        return "Từ Chối"
      case "revision_requested":
        return "Yêu Cầu Sửa"
      default:
        return status
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={`${typography.h1} text-gray-900`}>Bài Nộp</h1>
        <p className={`mt-3 ${typography.bodyLarge} leading-relaxed text-gray-600`}>
          {getRoleDescription()}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Tìm kiếm theo tiêu đề, abstract, keywords..."
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
            Hiển thị <span className={typography.semibold}>{filteredPapers.length}</span> /{" "}
            {papers.length} bài
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
                    {paper.reviews.length} reviews
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/conference/${conferenceId}/submission/${paper.id}`)
                  }
                >
                  Xem Chi Tiết
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredPapers.length === 0 && (
          <Card className={`${spacing.padding.cardLarge} text-center`}>
            <FileText className="mx-auto text-gray-400" style={{ width: "3rem", height: "3rem" }} />
            <h3 className={`mt-4 ${typography.h4} text-gray-900`}>Không Tìm Thấy Bài Nộp</h3>
            <p className={`mt-2 ${typography.body} text-gray-600`}>
              {currentRole === "author"
                ? "Bạn chưa nộp bài nào cho hội nghị này"
                : currentRole === "reviewer"
                  ? "Bạn chưa được phân công review bài nào"
                  : "Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác"}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

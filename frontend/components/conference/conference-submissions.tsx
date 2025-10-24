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

import { useEffect, useState } from "react"
import type { Paper } from "@/lib/types"
import { getConferencePapers } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Search, Filter, Calendar, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ConferenceSubmissionsProps {
  conferenceId: string
}

export function ConferenceSubmissions({ conferenceId }: ConferenceSubmissionsProps) {
  const { user, currentRole } = useAuth()
  const [papers, setPapers] = useState<Paper[]>([])
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [trackFilter, setTrackFilter] = useState<string>("all")

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

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bài Nộp</h1>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">{getRoleDescription()}</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tiêu đề, abstract, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
              <SelectItem value="submitted">Đã Nộp</SelectItem>
              <SelectItem value="under_review">Đang Review</SelectItem>
              <SelectItem value="accepted">Chấp Nhận</SelectItem>
              <SelectItem value="rejected">Từ Chối</SelectItem>
              <SelectItem value="revision_requested">Yêu Cầu Sửa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={trackFilter} onValueChange={setTrackFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc theo track" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất Cả Tracks</SelectItem>
              <SelectItem value="track-1">Machine Learning & AI</SelectItem>
              <SelectItem value="track-2">Systems & Networking</SelectItem>
              <SelectItem value="track-3">Human-Computer Interaction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>
            Hiển thị <span className="font-semibold">{filteredPapers.length}</span> /{" "}
            {papers.length} bài
          </span>
        </div>
      </Card>

      {/* Papers List */}
      <div className="space-y-4">
        {filteredPapers.map((paper) => (
          <Card key={paper.id} className="p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <FileText className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{paper.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
                      {paper.abstract}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{paper.authors.map((a) => a.name).join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(paper.submitted_at)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {paper.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex flex-col items-end gap-3">
                <Badge className={getStatusColor(paper.status)}>
                  {getStatusLabel(paper.status)}
                </Badge>
                {paper.reviews.length > 0 && (
                  <span className="text-xs text-gray-500">{paper.reviews.length} reviews</span>
                )}
                <Button variant="outline" size="sm">
                  Xem Chi Tiết
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredPapers.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Không Tìm Thấy Bài Nộp</h3>
            <p className="mt-2 text-gray-600">
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

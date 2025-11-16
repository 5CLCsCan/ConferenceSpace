"use client"

/**
 * Conference Overview Component
 * Displays general conference information and statistics
 * Role-based visibility: Chair sees all, Author/Reviewer see limited info
 *
 * Data Sources:
 * - Conference info: GET /api/conferences/:id (conferences table)
 * - Statistics: GET /api/conferences/:id/stats (aggregated from papers, reviews tables)
 */

import { useEffect, useState } from "react"
import type { Conference, ConferenceStats } from "@/lib/types"
import { getConferenceStats } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Globe, TrendingUp, FileText, Users, CheckCircle } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useAuth } from "@/lib/auth-context"

interface ConferenceOverviewProps {
  conference: Conference
}

export function ConferenceOverview({ conference }: ConferenceOverviewProps) {
  const { currentRole } = useAuth()
  const [stats, setStats] = useState<ConferenceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const response = await getConferenceStats(conference.id)
      if (response.data) {
        setStats(response.data)
      }
      setLoading(false)
    }

    loadStats()
  }, [conference.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const COLORS = ["#0056A3", "#28A745", "#FFC107", "#DC3545"]

  const isChair = currentRole === "chair"
  const showFullStats = isChair
  const showCharts = isChair

  return (
    <div className={spacing.section}>
      {/* Conference Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className={typography.h1}>{conference.name}</h1>
          <Badge
            variant={conference.status === "active" ? "default" : "secondary"}
            className={`bg-success text-white ${typography.bodySmall}`}
          >
            {conference.status === "active"
              ? "Đang Diễn Ra"
              : conference.status === "upcoming"
                ? "Sắp Tới"
                : "Đã Kết Thúc"}
          </Badge>
        </div>
        <p className={`mt-2 ${typography.body} leading-relaxed text-gray-600`}>
          {conference.description}
        </p>
      </div>

      {/* Quick Info Cards - Public for all roles */}
      <div className={`grid ${spacing.gap.md} md:grid-cols-2 lg:grid-cols-3`}>
        <Card className={spacing.padding.card}>
          <div className={`flex items-start ${spacing.gap.md}`}>
            <div className="rounded-lg bg-primary/10 p-2">
              <Calendar className={`${iconSizes.sm} text-primary`} />
            </div>
            <div>
              <p className={`${typography.label} text-gray-500`}>Ngày Tổ Chức</p>
              <p className={`mt-1 ${typography.body} ${typography.semibold} text-gray-900`}>
                {formatDate(conference.conference_date)}
              </p>
            </div>
          </div>
        </Card>

        <Card className={spacing.padding.card}>
          <div className={`flex items-start ${spacing.gap.md}`}>
            <div className="rounded-lg bg-primary/10 p-2">
              <MapPin className={`${iconSizes.sm} text-primary`} />
            </div>
            <div>
              <p className={`${typography.label} text-gray-500`}>Địa Điểm</p>
              <p className={`mt-1 ${typography.body} ${typography.semibold} text-gray-900`}>
                {conference.location}
              </p>
            </div>
          </div>
        </Card>

        {conference.website && (
          <Card className={spacing.padding.card}>
            <div className={`flex items-start ${spacing.gap.md}`}>
              <div className="rounded-lg bg-primary/10 p-2">
                <Globe className={`${iconSizes.sm} text-primary`} />
              </div>
              <div>
                <p className={`${typography.label} text-gray-500`}>Website</p>
                <a
                  href={conference.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-1 ${typography.body} ${typography.semibold} text-primary hover:underline`}
                >
                  Truy cập
                </a>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Statistics Section - Role-based visibility */}
      {stats && !loading && (
        <>
          <div>
            <h2 className={typography.h2}>Thống Kê Hội Nghị</h2>
            <p className={`mt-1 ${typography.body} text-gray-600`}>
              {isChair
                ? "Tổng quan về số liệu và tiến độ của hội nghị"
                : "Thông tin cơ bản về hội nghị"}
            </p>
          </div>

          {/* Key Metrics - Chair sees all, others see limited */}
          <div className={`grid ${spacing.gap.md} md:grid-cols-2 lg:grid-cols-4`}>
            <Card className={spacing.padding.card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${typography.label} text-gray-500`}>Tổng Bài Nộp</p>
                  <p className={`mt-1 ${typography.stats} text-gray-900`}>
                    {stats.total_submissions}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className={`${iconSizes.md} text-primary`} />
                </div>
              </div>
            </Card>

            {showFullStats && (
              <>
                <Card className={spacing.padding.card}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${typography.label} text-gray-500`}>Tổng Reviews</p>
                      <p className={`mt-1 ${typography.stats} text-gray-900`}>
                        {stats.total_reviews}
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Users className={`${iconSizes.md} text-primary`} />
                    </div>
                  </div>
                </Card>

                <Card className={spacing.padding.card}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${typography.label} text-gray-500`}>Tỷ Lệ Chấp Nhận</p>
                      <p className={`mt-1 ${typography.stats} text-gray-900`}>
                        {stats.acceptance_rate}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-2">
                      <CheckCircle className={`${iconSizes.md} text-success`} />
                    </div>
                  </div>
                </Card>

                <Card className={spacing.padding.card}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${typography.label} text-gray-500`}>TB Reviews/Bài</p>
                      <p className={`mt-1 ${typography.stats} text-gray-900`}>
                        {stats.avg_reviews_per_paper.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2">
                      <TrendingUp className={`${iconSizes.md} text-primary`} />
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Charts Section - Only for Chair */}
          {showCharts && (
            <div className={`grid ${spacing.gap.md} lg:grid-cols-2`}>
              {/* Submissions by Track */}
              <Card className={spacing.padding.card}>
                <h3 className={typography.h5}>Bài Nộp Theo Track</h3>
                <p className={`mt-1 ${typography.caption}`}>
                  Phân bố bài nộp theo từng track nghiên cứu
                </p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.submissions_by_track}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="track" tick={{ fill: "#6B7280", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="#0056A3" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Review Progress */}
              <Card className={spacing.padding.card}>
                <h3 className={typography.h5}>Tiến Độ Review</h3>
                <p className={`mt-1 ${typography.caption}`}>
                  Trạng thái hiện tại của quá trình review
                </p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Hoàn Thành",
                            value: stats.review_progress.completed,
                          },
                          {
                            name: "Đang Thực Hiện",
                            value: stats.review_progress.in_progress,
                          },
                          {
                            name: "Chưa Bắt Đầu",
                            value: stats.review_progress.pending,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          const p = typeof percent === "number" ? percent : 0
                          return `${name}: ${(p * 100).toFixed(0)}%`
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Top Keywords - Public for all */}
          <Card className={spacing.padding.card}>
            <h3 className={typography.h5}>Từ Khóa Phổ Biến</h3>
            <p className={`mt-1 ${typography.caption}`}>
              Các chủ đề nghiên cứu được quan tâm nhất
            </p>
            <div className={`mt-4 flex flex-wrap ${spacing.gap.sm}`}>
              {stats.top_keywords.map((keyword, index) => (
                <Badge
                  key={keyword.keyword}
                  variant="secondary"
                  className={`px-2.5 py-1 ${typography.bodySmall}`}
                  style={{
                    backgroundColor: `rgba(0, 86, 163, ${0.1 + index * 0.15})`,
                    color: "#0056A3",
                  }}
                >
                  {keyword.keyword} ({keyword.count})
                </Badge>
              ))}
            </div>
          </Card>

          {/* Tracks Section - Public for all */}
          <div>
            <h2 className={typography.h2}>Tracks Nghiên Cứu</h2>
            <p className={`mt-1 ${typography.body} text-gray-600`}>
              Các lĩnh vực nghiên cứu của hội nghị
            </p>
          </div>

          <div className={`grid ${spacing.gap.md} md:grid-cols-2 lg:grid-cols-3`}>
            {(conference.tracks || []).map((track) => (
              <Card key={track.id} className={spacing.padding.card}>
                <h3 className={typography.h5}>{track.name || "Unnamed Track"}</h3>
                <p className={`mt-1.5 ${typography.bodySmall} leading-relaxed text-gray-600`}>
                  {track.description || "No description available"}
                </p>
                <div className="mt-3">
                  <p className={`${typography.label} text-gray-500`}>Track Chairs</p>
                  <div className={`mt-1.5 flex flex-wrap ${spacing.gap.sm}`}>
                    {(track.chairs || []).map((chairId) => (
                      <Badge key={chairId} variant="outline" className={typography.bodySmall}>
                        Chair {chairId}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

/**
 * Conference Program Component
 * Displays accepted papers and conference schedule
 *
 * Data Sources:
 * - Accepted papers: GET /api/conferences/:id/papers?status=accepted (papers table)
 * - Schedule: GET /api/conferences/:id/schedule (conference_schedule table)
 */

import { useEffect, useState } from "react"
import type { Paper } from "@/lib/types"
import { getConferencePapers } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Award, Users, Calendar } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface ConferenceProgramProps {
  conferenceId: string
}

export function ConferenceProgram({ conferenceId }: ConferenceProgramProps) {
  const [acceptedPapers, setAcceptedPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProgram() {
      const response = await getConferencePapers(conferenceId, { status: "accepted" })
      if (response.data) {
        setAcceptedPapers(response.data)
      }
      setLoading(false)
    }

    loadProgram()
  }, [conferenceId])

  const papersByTrack = acceptedPapers.reduce(
    (acc, paper) => {
      if (!acc[paper.track_id]) {
        acc[paper.track_id] = []
      }
      acc[paper.track_id].push(paper)
      return acc
    },
    {} as Record<string, Paper[]>,
  )

  const getTrackName = (trackId: string) => {
    const trackNames: Record<string, string> = {
      "track-1": "Machine Learning & AI",
      "track-2": "Systems & Networking",
      "track-3": "Human-Computer Interaction",
    }
    return trackNames[trackId] || trackId
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={`${typography.h1} text-gray-900`}>Chương Trình Hội Nghị</h1>
        <p className={`mt-3 ${typography.bodyLarge} leading-relaxed text-gray-600`}>
          Danh sách các bài báo được chấp nhận và lịch trình hội nghị
        </p>
      </div>

      {/* Statistics */}
      <div className={`grid ${spacing.gap.lg} md:grid-cols-3`}>
        <Card className={spacing.padding.cardLarge}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${typography.body} ${typography.medium} text-gray-500`}>
                Tổng Bài Chấp Nhận
              </p>
              <p className={`mt-2 ${typography.stats} text-gray-900`}>{acceptedPapers.length}</p>
            </div>
            <div className={`rounded-lg bg-success/10 p-3`}>
              <Award
                className={`${iconSizes.lg} text-success`}
                style={{ width: "2rem", height: "2rem" }}
              />
            </div>
          </div>
        </Card>

        <Card className={spacing.padding.cardLarge}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${typography.body} ${typography.medium} text-gray-500`}>Số Tracks</p>
              <p className={`mt-2 ${typography.stats} text-gray-900`}>
                {Object.keys(papersByTrack).length}
              </p>
            </div>
            <div className={`rounded-lg bg-primary/10 p-3`}>
              <FileText
                className={`${iconSizes.lg} text-primary`}
                style={{ width: "2rem", height: "2rem" }}
              />
            </div>
          </div>
        </Card>

        <Card className={spacing.padding.cardLarge}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${typography.body} ${typography.medium} text-gray-500`}>
                Tổng Tác Giả
              </p>
              <p className={`mt-2 ${typography.stats} text-gray-900`}>
                {new Set(acceptedPapers.flatMap((p) => p.authors.map((a) => a.user_id))).size}
              </p>
            </div>
            <div className={`rounded-lg bg-primary/10 p-3`}>
              <Users
                className={`${iconSizes.lg} text-primary`}
                style={{ width: "2rem", height: "2rem" }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Accepted Papers by Track */}
      {Object.entries(papersByTrack).map(([trackId, papers]) => (
        <div key={trackId}>
          <div className={`mb-4 flex items-center ${spacing.gap.md}`}>
            <h2 className={`${typography.h2} text-gray-900`}>{getTrackName(trackId)}</h2>
            <Badge className="bg-primary text-white">{papers.length} bài</Badge>
          </div>

          <div className={spacing.subsection}>
            {papers.map((paper, index) => (
              <Card
                key={paper.id}
                className={`${spacing.padding.cardLarge} transition-shadow hover:shadow-lg`}
              >
                <div className={`flex items-start ${spacing.gap.md}`}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 ${typography.semibold} text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className={`${typography.h4} text-gray-900`}>{paper.title}</h3>
                    <p
                      className={`mt-2 line-clamp-2 ${typography.body} leading-relaxed text-gray-600`}
                    >
                      {paper.abstract}
                    </p>

                    <div
                      className={`mt-3 flex items-center ${spacing.gap.sm} ${typography.body} text-gray-600`}
                    >
                      <Users className={iconSizes.sm} />
                      <span>{paper.authors.map((a) => a.name).join(", ")}</span>
                    </div>

                    <div className={`mt-3 flex flex-wrap ${spacing.gap.sm}`}>
                      {paper.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className={typography.bodySmall}>
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Badge className="bg-success text-white">Accepted</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {acceptedPapers.length === 0 && (
        <Card className={`${spacing.padding.cardLarge} text-center`}>
          <Calendar className="mx-auto text-gray-400" style={{ width: "3rem", height: "3rem" }} />
          <h3 className={`mt-4 ${typography.h4} text-gray-900`}>Chương Trình Chưa Công Bố</h3>
          <p className={`mt-2 ${typography.body} text-gray-600`}>
            Danh sách bài báo được chấp nhận sẽ được công bố sau khi kết thúc review
          </p>
        </Card>
      )}
    </div>
  )
}

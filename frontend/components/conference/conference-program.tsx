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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chương Trình Hội Nghị</h1>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">
          Danh sách các bài báo được chấp nhận và lịch trình hội nghị
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng Bài Chấp Nhận</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{acceptedPapers.length}</p>
            </div>
            <div className="rounded-lg bg-success/10 p-3">
              <Award className="h-8 w-8 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Số Tracks</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {Object.keys(papersByTrack).length}
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng Tác Giả</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {new Set(acceptedPapers.flatMap((p) => p.authors.map((a) => a.user_id))).size}
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Accepted Papers by Track */}
      {Object.entries(papersByTrack).map(([trackId, papers]) => (
        <div key={trackId}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{getTrackName(trackId)}</h2>
            <Badge className="bg-primary text-white">{papers.length} bài</Badge>
          </div>

          <div className="space-y-4">
            {papers.map((paper, index) => (
              <Card key={paper.id} className="p-6 transition-shadow hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{paper.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
                      {paper.abstract}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{paper.authors.map((a) => a.name).join(", ")}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {paper.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
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
        <Card className="p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Chương Trình Chưa Công Bố</h3>
          <p className="mt-2 text-gray-600">
            Danh sách bài báo được chấp nhận sẽ được công bố sau khi kết thúc review
          </p>
        </Card>
      )}
    </div>
  )
}

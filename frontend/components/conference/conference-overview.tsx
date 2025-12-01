"use client"

/**
 * Conference Overview Component
 * Displays general conference information (description, dates, location, keywords, tracks)
 *
 * Data Sources:
 * - Conference info: GET /api/conferences/:id (conferences table)
 * - Statistics: GET /api/conferences/:id/stats (for keywords)
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Conference, ConferenceStats, ConferenceStatus } from "@/lib/types"
import { getConferenceStats } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Globe, Send } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"

interface ConferenceOverviewProps {
  conference: Conference
}

export function ConferenceOverview({ conference }: ConferenceOverviewProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { currentRole } = useAuth()
  const [stats, setStats] = useState<ConferenceStats | null>(null)

  useEffect(() => {
    async function loadStats() {
      const response = await getConferenceStats(conference.id)
      if (response.data) {
        setStats(response.data)
      }
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

  const parseDate = (value?: string | null) => (value ? new Date(value) : null)
  const now = new Date()
  const submissionDeadline = parseDate(conference.submission_deadline)
  const reviewDeadline = parseDate(conference.review_deadline)
  const cameraReadyDeadline = parseDate(conference.camera_ready_deadline)
  const conferenceEnd = parseDate(conference.conference_end_date ?? conference.conference_date)

  const derivedStatus: ConferenceStatus = (() => {
    if (submissionDeadline && now < submissionDeadline) {
      return "open"
    }

    if (reviewDeadline && now < reviewDeadline) {
      return "reviewing"
    }

    if (cameraReadyDeadline && now < cameraReadyDeadline) {
      return "reviewing"
    }

    if (conferenceEnd) {
      return now >= conferenceEnd ? "completed" : "reviewing"
    }

    return conference.status
  })()

  const statusConfig: Record<
    ConferenceStatus,
    { variant: "default" | "secondary" | "destructive" | "outline" | "success"; className: string }
  > = {
    open: {
      variant: "success",
      className: typography.bodySmall,
    },
    reviewing: {
      variant: "outline",
      className: `${typography.bodySmall} border-amber-200 bg-amber-50 text-amber-900`,
    },
    completed: {
      variant: "outline",
      className: `${typography.bodySmall} border-gray-200 bg-gray-100 text-gray-600`,
    },
  }

  const statusTone = statusConfig[derivedStatus]

  return (
    <div className={spacing.section}>
      {/* Conference Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className={typography.h1}>{conference.name}</h1>
            <Badge variant={statusTone.variant} className={statusTone.className}>
              {t(`common.conferenceStatus.${derivedStatus}`)}
            </Badge>
          </div>
          {currentRole === "author" && derivedStatus === "open" && (
            <Button
              onClick={() => router.push(`/dashboard/author/submit?conference=${conference.id}`)}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {t("common.actions.submit")}
            </Button>
          )}
        </div>
        <div className="mt-3 rounded-lg border-l-2 border-primary/50 bg-muted/40 p-4">
          <p className={`${typography.body} italic leading-relaxed text-gray-700`}>
            {conference.description}
          </p>
        </div>
      </div>

      {/* Conference Information */}
      <div>
        <h2 className={`${typography.h2} pt-2`}>Thông Tin Hội Nghị</h2>
        <p className={`mt-1 ${typography.body} text-gray-600`}>
          Chi tiết về thời gian, địa điểm và thông tin liên hệ
        </p>
      </div>

      {/* Quick Info Cards */}
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

      {/* Keywords/Topics */}
      {conference.domain && conference.domain.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className={`${typography.h2} pt-2`}>Từ Khóa / Chủ Đề</h2>
            <p className={`mt-1 ${typography.body} text-gray-600`}>
              Các lĩnh vực nghiên cứu trọng tâm của hội nghị
            </p>
          </div>
          <div className={`flex flex-wrap ${spacing.gap.sm}`}>
            {conference.domain.map((keyword, index) => (
              <button
                key={`${keyword}-${index}`}
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/conference/${conference.id}?tab=submissions&keyword=${encodeURIComponent(keyword)}`,
                  )
                }
                className={`inline-flex items-center rounded-full border border-primary/50 bg-white px-3.5 py-1.5 ${typography.bodySmall} ${typography.semibold} text-primary hover:bg-primary/5 transition-colors`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracks Section */}
      {conference.tracks && conference.tracks.length > 0 && (
        <>
          <div>
            <h2 className={`${typography.h2} pt-2`}>Tracks Nghiên Cứu</h2>
            <p className={`mt-1 ${typography.body} text-gray-600`}>
              Các lĩnh vực nghiên cứu của hội nghị
            </p>
          </div>

          <div className={`flex flex-wrap ${spacing.gap.sm}`}>
            {conference.tracks.map((track, index) => (
              <button
                key={`track-${index}`}
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/conference/${conference.id}?tab=submissions&track=${encodeURIComponent(track)}`,
                  )
                }
                className={`inline-flex items-center rounded-full border border-primary/50 bg-white px-3.5 py-1.5 ${typography.bodySmall} ${typography.semibold} text-primary hover:bg-primary/5 transition-colors`}
              >
                {track}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

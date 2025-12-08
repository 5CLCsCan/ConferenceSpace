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
import type { Conference, ConferenceStats } from "@/lib/types"
import { getConferenceStats } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Globe } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceOverviewProps {
  conference: Conference
}

export function ConferenceOverview({ conference }: ConferenceOverviewProps) {
  const { t } = useTranslation()
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
    const locale = t("common.messages.languages.vietnamese") === "Tiếng Việt" ? "vi-VN" : "en-US"
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className={spacing.section}>
      {/* Conference Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className={typography.h1}>{conference.name}</h1>
          <Badge
            variant={conference.status === "open" ? "default" : "secondary"}
            className={`bg-success text-white ${typography.bodySmall}`}
          >
          {t(`common.conferenceStatus.${conference.status}`)}
          </Badge>
        </div>
        <p className={`mt-2 ${typography.body} leading-relaxed text-gray-600`}>
          {conference.description}
        </p>
      </div>

      {/* Conference Information */}
      <div>
        <h2 className={typography.h2}>{t("conference.overview.title")}</h2>
        <p className={`mt-1 ${typography.body} text-gray-600`}>
          {t("conference.overview.description")}
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
              <p className={`${typography.label} text-gray-500`}>{t("conference.overview.conferenceDate")}</p>
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
              <p className={`${typography.label} text-gray-500`}>{t("conference.overview.location")}</p>
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
                <p className={`${typography.label} text-gray-500`}>{t("conference.overview.website")}</p>
                <a
                  href={conference.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-1 ${typography.body} ${typography.semibold} text-primary hover:underline`}
                >
                  {t("conference.overview.visitWebsite")}
                </a>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Keywords/Topics */}
      {conference.domain && conference.domain.length > 0 && (
        <Card className={spacing.padding.card}>
          <h3 className={typography.h5}>{t("conference.overview.keywordsTitle")}</h3>
          <p className={`mt-1 ${typography.caption}`}>{t("conference.overview.keywordsDescription")}</p>
          <div className={`mt-4 flex flex-wrap ${spacing.gap.sm}`}>
            {conference.domain.map((keyword, index) => (
              <Badge
                key={keyword}
                variant="secondary"
                className={`px-2.5 py-1 ${typography.bodySmall}`}
                style={{
                  backgroundColor: `rgba(0, 86, 163, ${0.1 + (index % 5) * 0.15})`,
                  color: "#0056A3",
                }}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Tracks Section */}
      {conference.tracks && conference.tracks.length > 0 && (
        <>
          <div>
            <h2 className={typography.h2}>{t("conference.overview.tracksTitle")}</h2>
            <p className={`mt-1 ${typography.body} text-gray-600`}>
              {t("conference.overview.tracksDescription")}
            </p>
          </div>

          <div className={`grid ${spacing.gap.md} md:grid-cols-2 lg:grid-cols-3`}>
            {conference.tracks.map((track, index) => (
              <Card key={`track-${index}`} className={spacing.padding.card}>
                <h3 className={typography.h5}>{track}</h3>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

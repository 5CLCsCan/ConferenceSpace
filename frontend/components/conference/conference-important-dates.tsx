"use client"

/**
 * Important Dates Component
 * Displays timeline of key conference dates
 *
 * Data Sources:
 * - Dates: GET /api/conferences/:id/dates (conferences table + conference_dates table)
 */

import { useEffect, useState } from "react"
import { getConferenceDates, type ImportantDate } from "@/lib/api/conferences"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2 } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

interface ConferenceImportantDatesProps {
  conferenceId: string
}

export function ConferenceImportantDates({ conferenceId }: ConferenceImportantDatesProps) {
  const { t } = useTranslation()
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDates() {
      const response = await getConferenceDates(conferenceId)
      if (response.data) {
        setDates(response.data)
      }
      setLoading(false)
    }

    loadDates()
  }, [conferenceId])

  const formatDate = (dateString: string) => {
    const locale = t("common.messages.languages.vietnamese") === "Tiếng Việt" ? "vi-VN" : "en-US"
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deadline":
        return "bg-error text-white"
      case "notification":
        return "bg-primary text-white"
      case "event":
        return "bg-success text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTypeLabel = (type: string) => {
    const key = `conference.importantDates.typeLabels.${type}` as const
    return t(key) || type
  }

  if (loading) {
    return <div>{t("conference.importantDates.loading")}</div>
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={typography.h1}>{t("conference.importantDates.title")}</h1>
        <p className={`mt-2 ${typography.body} leading-relaxed text-gray-600`}>
          {t("conference.importantDates.description")}
        </p>
      </div>

      {/* Timeline */}
      {dates.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className={`mx-auto ${iconSizes.lg} text-gray-400`} />
          <h3 className={`mt-3 ${typography.h5} text-gray-900`}>{t("conference.importantDates.noData")}</h3>
          <p className={`mt-1.5 ${typography.body} text-gray-600`}>
            {t("conference.importantDates.noDataDescription")}
          </p>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200" />

          {/* Date items */}
          <div className={spacing.subsection}>
            {dates.map((date, index) => (
              <div key={date.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      date.isPast ? "bg-gray-300" : "bg-primary"
                    }`}
                  >
                    {date.isPast ? (
                      <CheckCircle2 className={`${iconSizes.md} text-white`} />
                    ) : (
                      <Calendar className={`${iconSizes.md} text-white`} />
                    )}
                  </div>
                </div>

                {/* Content card */}
                <Card className={`flex-1 ${spacing.padding.card} ${date.isPast ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`flex items-center ${spacing.gap.sm} flex-wrap`}>
                        <h3 className={typography.h5}>{date.title}</h3>
                        <Badge className={getTypeColor(date.type)}>{getTypeLabel(date.type)}</Badge>
                        {date.isPast && (
                          <Badge variant="outline" className={`border-gray-400 text-gray-600 ${typography.bodySmall}`}>
                            {t("conference.importantDates.past")}
                          </Badge>
                        )}
                      </div>
                      <p className={`mt-1.5 ${typography.body} text-gray-600`}>{date.description}</p>
                      <div className={`mt-3 flex items-center gap-1.5 ${typography.caption}`}>
                        <Clock className={iconSizes.xs} />
                        <span>{formatDate(date.date)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Card */}
      <Card className={`border-2 border-primary bg-primary/5 ${spacing.padding.card}`}>
        <h3 className={typography.h5}>{t("conference.importantDates.notesTitle")}</h3>
        <ul className={`mt-2.5 ${spacing.item} ${typography.body} text-gray-600`}>
          <li className="flex items-start gap-2">
            <CheckCircle2 className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-primary`} />
            <span>{t("conference.importantDates.notes.timezone")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-primary`} />
            <span>{t("conference.importantDates.notes.reminders")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-primary`} />
            <span>{t("conference.importantDates.notes.lateSubmissions")}</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

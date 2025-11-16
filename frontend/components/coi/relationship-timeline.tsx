"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowRight } from "lucide-react"
import type { Relationship } from "@/lib/mock-data/coi"
import { format } from "date-fns"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface RelationshipTimelineProps {
  relationships: Relationship[]
}

export function RelationshipTimeline({ relationships }: RelationshipTimelineProps) {
  const { t } = useTranslation()

  if (relationships.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${typography.body}`}>
        {t("coi.timeline.noHistory")}
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  // Sort by start date
  const sortedRels = [...relationships].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  )

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

      {/* Timeline items */}
      <div className={spacing.subsection}>
        {sortedRels.map((rel, idx) => {
          const startDate = new Date(rel.start_date)
          const endDate = rel.end_date ? new Date(rel.end_date) : null
          const isActive = !endDate || endDate > new Date()

          return (
            <div key={rel.id} className={`relative flex ${spacing.gap.md}`}>
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    isActive ? getSeverityColor(rel.severity) : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <Calendar className={iconSizes.sm} />
                </div>
              </div>

              {/* Content */}
              <Card className={`flex-1 ${getSeverityColor(rel.severity)}`}>
                <CardContent className="pt-4">
                  <div className={`flex items-start justify-between ${spacing.gap.md} mb-2`}>
                    <div className="flex-1">
                      <div className={`flex items-center ${spacing.gap.sm} mb-2`}>
                        <Badge variant="outline">
                          {t(`coi.relationshipTypes.${rel.type}`) || rel.type.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={getSeverityColor(rel.severity)} variant="outline">
                          {t(`coi.severity.${rel.severity}`) || rel.severity}
                        </Badge>
                        {isActive && (
                          <Badge variant="default" className="bg-green-600">
                            {t("coi.timeline.active")}
                          </Badge>
                        )}
                      </div>
                      <p className={`${typography.body} ${typography.medium} mb-1`}>
                        {rel.description}
                      </p>
                      <div className={`flex items-center ${spacing.gap.sm} ${typography.bodySmall} text-muted-foreground`}>
                        <Calendar className={iconSizes.xs} />
                        <span>
                          {t("coi.timeline.started")} {format(startDate, "MMM dd, yyyy")}
                        </span>
                        {endDate && (
                          <>
                            <ArrowRight className={iconSizes.xs} />
                            <span>
                              {t("coi.timeline.ended")} {format(endDate, "MMM dd, yyyy")}
                            </span>
                          </>
                        )}
                        {!endDate && (
                          <span className="text-green-600">• {t("coi.timeline.ongoing")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {rel.evidence && rel.evidence.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className={`${typography.bodySmall} ${typography.medium} mb-2`}>
                        {t("coi.timeline.evidence")}
                      </p>
                      <ul className={`${typography.bodySmall} ${spacing.tight} list-disc list-inside opacity-90`}>
                        {rel.evidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

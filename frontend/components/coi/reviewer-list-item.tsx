"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Users, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import type { Reviewer, COIType } from "@/lib/mock-data/coi"
import { checkReviewerToPaperCOI, checkReviewerToAuthorCOI } from "@/lib/api/coi-mock"
import type { COIReport } from "@/lib/mock-data/coi"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface ReviewerListItemProps {
  reviewer: Reviewer
  selected: boolean
  onSelect: () => void
  coiType: COIType
  paperId?: string
  authorId?: string
}

export function ReviewerListItem({
  reviewer,
  selected,
  onSelect,
  coiType,
  paperId,
  authorId,
}: ReviewerListItemProps) {
  const { t } = useTranslation()
  const [coiReport, setCoiReport] = useState<COIReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ((coiType === "paper" && paperId) || (coiType === "author" && authorId)) {
      loadCOIReport()
    }
  }, [coiType, paperId, authorId])

  const loadCOIReport = async () => {
    setLoading(true)
    try {
      let result
      if (coiType === "paper" && paperId) {
        result = await checkReviewerToPaperCOI(reviewer.id, paperId)
      } else if (coiType === "author" && authorId) {
        result = await checkReviewerToAuthorCOI(reviewer.id, authorId)
      } else {
        return
      }

      if (result.data) {
        setCoiReport(result.data)
      }
    } catch (error) {
      console.error("Failed to load COI report:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const workloadPercentage = (reviewer.current_workload / reviewer.max_capacity) * 100
  const isOverloaded = workloadPercentage >= 100

  return (
    <Card className={`${spacing.padding.card} transition-all ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className={`flex items-start ${spacing.gap.md}`}>
        <Checkbox checked={selected} onCheckedChange={onSelect} className="mt-1" />
        <div className={`flex-1 min-w-0 ${spacing.item}`}>
          {/* Header */}
          <div className={`flex items-start justify-between ${spacing.gap.sm}`}>
            <div className="flex-1 min-w-0">
              <h4 className={`${typography.body} ${typography.semibold} truncate`}>
                {reviewer.name}
              </h4>
              <p className={`${typography.bodySmall} text-muted-foreground truncate`}>
                {reviewer.email}
              </p>
              <p className={`${typography.bodySmall} text-muted-foreground truncate`}>
                {reviewer.affiliation}
              </p>
            </div>
            {loading ? (
              <Loader2 className={`${iconSizes.sm} animate-spin text-muted-foreground`} />
            ) : coiReport ? (
              <Badge className={getSeverityColor(coiReport.severity)} variant="outline">
                {coiReport.severity === "none" ? (
                  <CheckCircle2 className={`${iconSizes.xs} mr-1`} />
                ) : (
                  <AlertTriangle className={`${iconSizes.xs} mr-1`} />
                )}
                {t(`coi.severity.${coiReport.severity}`) || coiReport.severity.toUpperCase()}
              </Badge>
            ) : null}
          </div>

          {/* Domains */}
          <div className={`flex flex-wrap ${spacing.gap.tight}`}>
            {reviewer.domains.slice(0, 3).map((domain, idx) => (
              <Badge key={idx} variant="secondary" className={typography.bodySmall}>
                {domain}
              </Badge>
            ))}
            {reviewer.domains.length > 3 && (
              <Badge variant="secondary" className={typography.bodySmall}>
                +{reviewer.domains.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className={`flex items-center ${spacing.gap.md} ${typography.bodySmall} text-muted-foreground`}>
            <span>
              {t("coi.reviewer.hIndex")} {reviewer.h_index}
            </span>
            <span>•</span>
            <span className={`flex items-center ${spacing.gap.tight}`}>
              <Users className={iconSizes.xs} />
              {reviewer.current_workload}/{reviewer.max_capacity}
            </span>
            {isOverloaded && (
              <Badge variant="destructive" className={typography.bodySmall}>
                {t("coi.reviewer.overloaded")}
              </Badge>
            )}
          </div>

          {/* COI Warning */}
          {coiReport && coiReport.severity !== "none" && (
            <div
              className={`mt-2 ${spacing.padding.card} rounded-lg border ${getSeverityColor(coiReport.severity)}`}
            >
              <div className={`flex items-start ${spacing.gap.sm}`}>
                <AlertTriangle className={`${iconSizes.sm} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className={`${typography.bodySmall} ${typography.medium}`}>
                    {t("coi.reviewer.relationshipsDetected", {
                      count: coiReport.relationships.length,
                    })}
                  </p>
                  <p className={`${typography.bodySmall} mt-1 opacity-90`}>
                    {coiReport.summary}
                  </p>
                  <p className={`${typography.bodySmall} mt-1 ${typography.medium}`}>
                    {t("coi.reviewer.recommendation")}:{" "}
                    {t(`coi.recommendation.${coiReport.recommendation}`) ||
                      coiReport.recommendation.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

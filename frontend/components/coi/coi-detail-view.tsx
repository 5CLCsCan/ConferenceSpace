"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Shield,
  Users,
  Mail,
  Building2,
  CornerDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/translation-context"
import { checkReviewerToAuthorCOI, type COIReport } from "@/lib/api/coi"

interface COIDetailViewProps {
  conferenceId: number
  reviewerId: number
  authorEmail: string
  onClose: () => void
}

export function COIDetailView({
  conferenceId,
  reviewerId,
  authorEmail,
  onClose,
}: COIDetailViewProps) {
  const { t } = useTranslation()
  const [coiReport, setCoiReport] = useState<COIReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (conferenceId && reviewerId && authorEmail) {
      loadCOIDetails()
    }
  }, [conferenceId, reviewerId, authorEmail])

  const loadCOIDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await checkReviewerToAuthorCOI(conferenceId, reviewerId, authorEmail)
      setCoiReport(result)
    } catch (err) {
      setError("Failed to load COI details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.actions.loading")}</p>
        </div>
      </div>
    )
  }

  if (error || !coiReport) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive font-semibold">{error || "Failed to load COI details"}</p>
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
      case "medium":
        return "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
      case "low":
        return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
      default:
        return "border-l-slate-500 bg-slate-50/50 dark:bg-slate-950/20"
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      case "medium":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      case "low":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      default:
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <Shield className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">{t("common.labels.details")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("coi.common.reviewer")}{" "}
              <span className="font-semibold text-foreground">{coiReport.reviewer_name}</span>
              {" → "}
              {coiReport.coi_type === "paper" ? (
                <span>
                  Paper <span className="font-semibold text-foreground">Conflict Analysis</span>
                </span>
              ) : (
                <span className="font-semibold text-foreground">{coiReport.author_name}</span>
              )}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-xs ${getSeverityBadgeColor(coiReport.severity)}`}
          >
            {getSeverityIcon(coiReport.severity)}
            {t(`coi.severity.${coiReport.severity}`)}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-2 gap-6 px-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-blue-600" />
            {t("coi.common.reviewer")}
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{coiReport.reviewer_name}</p>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Mail className="h-3 w-3" />
              <span className="truncate">{coiReport.reviewer_email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{coiReport.reviewer_affiliation}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-purple-600" />
            {coiReport.coi_type === "paper" ? "Affected Authors" : t("coi.common.author")}
          </div>
          <div className="space-y-1 text-sm">
            {coiReport.coi_type === "paper" ? (
              <p className="font-medium">{coiReport.summary}</p>
            ) : (
              <>
                <p className="font-medium">{coiReport.author_name}</p>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{coiReport.author_email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{coiReport.author_affiliation}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Timeline */}
      <Card className={`border-l-4 ${getSeverityColor(coiReport.severity)} py-6`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("coi.timeline.active")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {coiReport.relationships && coiReport.relationships.length > 0 ? (
            <div className="space-y-3">
              {coiReport.relationships.map((rel, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <div className="flex-shrink-0 pt-1">
                    <CornerDownRight className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground mb-1">
                      {rel.type
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">{rel.description}</p>
                    {rel.evidence && rel.evidence.length > 0 && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {rel.evidence.map((evidence, i) => (
                          <p key={i}>
                            <span className="font-medium">Evidence:</span> {evidence}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {t("coi.timeline.noHistory")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="py-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("coi.reviewer.recommendation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{coiReport.summary}</p>
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm
            ${
              coiReport.recommendation === "avoid"
                ? "bg-red-500/10 text-red-700 dark:text-red-400"
                : coiReport.recommendation === "review"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-green-500/10 text-green-700 dark:text-green-400"
            }`}
          >
            {t(`coi.recommendation.${coiReport.recommendation}`)}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {coiReport.recommendation !== "avoid" && (
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            {t("coi.recommendation.assign")}
          </Button>
        )}
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {t("common.actions.close")}
        </Button>
      </div>
    </div>
  )
}

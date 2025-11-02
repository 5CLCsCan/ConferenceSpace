"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Users, Loader2 } from "lucide-react"
import type { Reviewer, COIType } from "@/lib/mock-data/coi"
import { checkReviewerToPaperCOI, checkReviewerToAuthorCOI } from "@/lib/api/coi-mock"
import type { COIReport } from "@/lib/mock-data/coi"

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
    <Card className={`p-3 transition-all ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onSelect} className="mt-1" />
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{reviewer.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{reviewer.email}</p>
              <p className="text-xs text-muted-foreground truncate">{reviewer.affiliation}</p>
            </div>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : coiReport ? (
              <Badge className={getSeverityColor(coiReport.severity)} variant="outline">
                {coiReport.severity === "none" ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {coiReport.severity.toUpperCase()}
              </Badge>
            ) : null}
          </div>

          {/* Domains */}
          <div className="flex flex-wrap gap-1">
            {reviewer.domains.slice(0, 3).map((domain, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {domain}
              </Badge>
            ))}
            {reviewer.domains.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{reviewer.domains.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>H-index: {reviewer.h_index}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {reviewer.current_workload}/{reviewer.max_capacity}
            </span>
            {isOverloaded && (
              <Badge variant="destructive" className="text-xs">
                Overloaded
              </Badge>
            )}
          </div>

          {/* COI Warning */}
          {coiReport && coiReport.severity !== "none" && (
            <div className={`mt-2 p-2 rounded-lg border ${getSeverityColor(coiReport.severity)}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">
                    {coiReport.relationships.length} relationship(s) detected
                  </p>
                  <p className="text-xs mt-1 opacity-90">{coiReport.summary}</p>
                  <p className="text-xs mt-1 font-medium">
                    Recommendation: {coiReport.recommendation.toUpperCase()}
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


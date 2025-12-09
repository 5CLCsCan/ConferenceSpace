"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, AlertCircle, ChevronDown, FileText, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getAllPaperCOIs, type PaperCOISummary } from "@/lib/api/coi"

interface PaperCOIListProps {
  conferenceId: string
  filters: {
    search: string
    severity: "all" | "high" | "medium" | "low"
  }
}

export function PaperCOIList({ conferenceId, filters }: PaperCOIListProps) {
  const { t } = useTranslation()
  const [papers, setPapers] = useState<PaperCOISummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    loadPapers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page])

  const loadPapers = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getAllPaperCOIs({
        conference_id: parseInt(conferenceId),
        search: filters.search || undefined,
        severity: filters.severity === "all" ? undefined : filters.severity,
        limit: itemsPerPage,
        page,
      })

      setPapers(result.papers)
      setTotalCount(result.total)
    } catch (err) {
      setError("Failed to load papers")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  if (loading) {
    return (
      <Card className="py-6">
        <CardContent className="py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">{t("common.actions.loading")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50 py-6">
        <CardContent className="py-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (papers.length === 0) {
    return (
      <Card className="py-6">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-semibold text-foreground mb-1">No papers found</h3>
          <p className="text-sm text-muted-foreground">{t("common.messages.noData")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {papers.map((paper) => {
        const isExpanded = expandedRows[paper.paper_id]
        const hasHigh = paper.high_severity_count > 0
        const hasMedium = paper.medium_severity_count > 0

        // Determine border color based on highest severity
        let borderColor = "border-l-slate-500"
        let bgColor = "bg-white dark:bg-slate-950"

        if (hasHigh) {
          borderColor = "border-l-red-500"
          bgColor = "bg-red-50/30 dark:bg-red-950/10"
        } else if (hasMedium) {
          borderColor = "border-l-amber-500"
          bgColor = "bg-amber-50/30 dark:bg-amber-950/10"
        } else if (paper.low_severity_count > 0) {
          borderColor = "border-l-primary"
          bgColor = "bg-primary/5 dark:bg-primary/10"
        }

        return (
          <Card
            key={paper.paper_id}
            className={`border-l-4 ${borderColor} ${bgColor} shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer py-6`}
            onClick={() => toggleExpanded(paper.paper_id)}
          >
            <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-foreground text-lg leading-tight">
                    {paper.paper_title}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{paper.authors.map((a) => a.name).join(", ")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {paper.high_severity_count > 0 && (
                    <Badge
                      variant="destructive"
                      className="bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 border-0"
                    >
                      {paper.high_severity_count} High Conflicts
                    </Badge>
                  )}
                  {paper.medium_severity_count > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-0"
                    >
                      {paper.medium_severity_count} Medium Conflicts
                    </Badge>
                  )}
                  {paper.low_severity_count > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary dark:text-primary hover:bg-primary/20 border-0"
                    >
                      {paper.low_severity_count} Low Conflicts
                    </Badge>
                  )}
                  {paper.total_conflicts === 0 && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200 bg-green-50"
                    >
                      No Conflicts
                    </Badge>
                  )}
                </div>
              </div>

              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>

            {isExpanded && paper.conflicted_reviewers.length > 0 && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-700"></div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Conflicted Reviewers ({paper.conflicted_reviewers.length})
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {paper.conflicted_reviewers.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-white dark:bg-slate-900 shadow-sm"
                      >
                        <div
                          className={`mt-0.5 ${
                            item.severity === "high"
                              ? "text-red-500"
                              : item.severity === "medium"
                                ? "text-amber-500"
                                : "text-primary"
                          }`}
                        >
                          {item.severity === "high" ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{item.reviewer_name}</p>
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                item.severity === "high"
                                  ? "bg-red-100 text-red-700"
                                  : item.severity === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-primary/10 text-primary"
                              }`}
                            >
                              {item.severity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1.5 truncate">
                            {item.reviewer_email}
                          </p>
                          <div className="space-y-1">
                            {item.reasons.map((reason, rIdx) => (
                              <p
                                key={rIdx}
                                className="text-xs text-slate-600 dark:text-slate-400 leading-snug"
                              >
                                • {reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        )
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, totalCount)}{" "}
            of {totalCount} papers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p >= page - 1 && p <= page + 1)
                .map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="w-8"
                  >
                    {p}
                  </Button>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

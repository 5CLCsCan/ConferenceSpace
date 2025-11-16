"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertTriangle,
  Search,
  Filter,
  X,
  User,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getAllCOIRelationships, type RelationshipWithDetails } from "@/lib/api/coi-mock"
import { Loader2 } from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"

interface AllCOIRelationshipsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AllCOIRelationships({ open, onOpenChange }: AllCOIRelationshipsProps) {
  const { t } = useTranslation()
  const [relationships, setRelationships] = useState<RelationshipWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      loadRelationships()
    }
  }, [open])

  const loadRelationships = async () => {
    setLoading(true)
    try {
      const result = await getAllCOIRelationships({
        search: searchQuery || undefined,
        severity: severityFilter !== "all" ? (severityFilter as any) : undefined,
        relationship_type:
          typeFilter !== "all" ? (typeFilter as RelationshipWithDetails["type"]) : undefined,
        limit: 100,
      })
      if (result.data) {
        setRelationships(result.data.relationships)
      }
    } catch (error) {
      console.error("Failed to load COI relationships:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        loadRelationships()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, severityFilter, typeFilter])

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200 text-red-900"
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-900"
      case "low":
        return "bg-blue-50 border-blue-200 text-blue-900"
      default:
        return "bg-gray-50 border-gray-200 text-gray-900"
    }
  }

  const severityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }
    relationships.forEach((rel) => {
      if (rel.severity in counts) {
        counts[rel.severity as keyof typeof counts]++
      }
    })
    return counts
  }, [relationships])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header and Filters Section - Fixed */}
        <div className={`flex-shrink-0 ${spacing.padding.cardLarge} pb-4 border-b`}>
          <DialogHeader>
            <DialogTitle className={typography.h4}>{t("coi.allRelationships.title")}</DialogTitle>
            <CardDescription className={typography.body}>
              {t("coi.allRelationships.description")}
            </CardDescription>
          </DialogHeader>

          {/* Filters and Search */}
          <div className={`${spacing.subsection} mt-4`}>
            <div className={`flex ${spacing.gap.md} flex-wrap`}>
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${iconSizes.sm} text-muted-foreground`}
                  />
                  <Input
                    placeholder={t("coi.allRelationships.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("coi.allRelationships.filterSeverity")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("coi.allRelationships.allSeverities")}</SelectItem>
                  <SelectItem value="high">
                    {t("coi.severity.high")} ({severityCounts.high})
                  </SelectItem>
                  <SelectItem value="medium">
                    {t("coi.severity.medium")} ({severityCounts.medium})
                  </SelectItem>
                  <SelectItem value="low">
                    {t("coi.severity.low")} ({severityCounts.low})
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("coi.allRelationships.filterType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("coi.allRelationships.allTypes")}</SelectItem>
                  <SelectItem value="co_author">{t("coi.relationshipTypes.co_author")}</SelectItem>
                  <SelectItem value="same_organization">
                    {t("coi.relationshipTypes.same_organization")}
                  </SelectItem>
                  <SelectItem value="advisor_advisee">
                    {t("coi.relationshipTypes.advisor_advisee")}
                  </SelectItem>
                  <SelectItem value="collaborator">
                    {t("coi.relationshipTypes.collaborator")}
                  </SelectItem>
                  <SelectItem value="competitor">
                    {t("coi.relationshipTypes.competitor")}
                  </SelectItem>
                  <SelectItem value="citation">{t("coi.relationshipTypes.citation")}</SelectItem>
                  <SelectItem value="review_history">
                    {t("coi.relationshipTypes.review_history")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchQuery || severityFilter !== "all" || typeFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSeverityFilter("all")
                    setTypeFilter("all")
                  }}
                >
                  <X className={`${iconSizes.sm} mr-2`} />
                  {t("coi.allRelationships.clearFilters")}
                </Button>
              )}
            </div>

            {/* Summary Stats */}
            <div className={`flex ${spacing.gap.md} ${typography.body} text-muted-foreground`}>
              <span>{t("coi.allRelationships.totalFound", { count: relationships.length })}</span>
              {severityFilter === "all" && (
                <>
                  <span>•</span>
                  <span className="text-red-600">
                    {t("coi.severity.high")}: {severityCounts.high}
                  </span>
                  <span>•</span>
                  <span className="text-yellow-600">
                    {t("coi.severity.medium")}: {severityCounts.medium}
                  </span>
                  <span>•</span>
                  <span className="text-blue-600">
                    {t("coi.severity.low")}: {severityCounts.low}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Relationships List - Scrollable */}
        <div className={`flex-1 overflow-y-auto ${spacing.gap.md} ${spacing.padding.cardLarge} min-h-0`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" style={{ width: "2rem", height: "2rem" }} />
            </div>
          ) : relationships.length === 0 ? (
            <div className={`text-center py-12 text-muted-foreground`}>
              <AlertTriangle className="mx-auto mb-4 opacity-50" style={{ width: "3rem", height: "3rem" }} />
              <p className={typography.body}>{t("coi.allRelationships.noRelationships")}</p>
            </div>
          ) : (
            relationships.map((rel) => {
              const isExpanded = expandedIds.has(rel.id)
              return (
                <Card
                  key={rel.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${getSeverityColor(rel.severity)}`}
                  onClick={() => toggleExpand(rel.id)}
                >
                  <CardContent className="pt-4">
                    <div className={`flex items-start justify-between ${spacing.gap.md}`}>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center ${spacing.gap.sm} mb-2 flex-wrap`}>
                          <Badge variant="outline" className={getSeverityColor(rel.severity)}>
                            {t(`coi.severity.${rel.severity}`)}
                          </Badge>
                          <Badge variant="outline">{t(`coi.relationshipTypes.${rel.type}`)}</Badge>
                        </div>

                        <div className={spacing.tight}>
                          <div className={`flex items-center ${spacing.gap.sm}`}>
                            <User className={`${iconSizes.sm} text-muted-foreground`} />
                            <span className={typography.medium}>{rel.reviewer_name}</span>
                            <span className={typography.muted}>→</span>
                            <span className={typography.medium}>{rel.author_name}</span>
                          </div>
                          <p className={`${typography.body} text-muted-foreground`}>
                            {rel.description}
                          </p>
                          <div className={`flex items-center ${spacing.gap.md} ${typography.bodySmall} text-muted-foreground`}>
                            <span className={`flex items-center ${spacing.gap.tight}`}>
                              <Calendar className={iconSizes.xs} />
                              {t("coi.common.from")} {rel.start_date}
                              {rel.end_date && ` ${t("coi.common.to")} ${rel.end_date}`}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className={`mt-4 pt-4 border-t ${spacing.gap.md}`}>
                            <div className={`grid grid-cols-2 ${spacing.gap.md} ${typography.body}`}>
                              <div>
                                <p className={`${typography.medium} mb-1`}>
                                  {t("coi.allRelationships.reviewer")}
                                </p>
                                <p className={typography.muted}>{rel.reviewer_name}</p>
                                <p className={typography.caption}>{rel.reviewer_email}</p>
                              </div>
                              <div>
                                <p className={`${typography.medium} mb-1`}>
                                  {t("coi.allRelationships.author")}
                                </p>
                                <p className={typography.muted}>{rel.author_name}</p>
                                <p className={typography.caption}>{rel.author_email}</p>
                                <p className={typography.caption}>{rel.author_affiliation}</p>
                              </div>
                            </div>

                            {rel.paper_titles && rel.paper_titles.length > 0 && (
                              <div>
                                <p className={`${typography.medium} mb-2 ${typography.body} flex items-center ${spacing.gap.sm}`}>
                                  <FileText className={iconSizes.sm} />
                                  {t("coi.allRelationships.relatedPapers")}
                                </p>
                                <ul className={spacing.tight}>
                                  {rel.paper_titles.map((title: string, idx: number) => (
                                    <li key={idx} className={`${typography.body} text-muted-foreground`}>
                                      • {title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {rel.evidence && rel.evidence.length > 0 && (
                              <div>
                                <p className={`${typography.medium} mb-2 ${typography.body}`}>
                                  {t("coi.timeline.evidence")}
                                </p>
                                <ul className={`${spacing.tight} list-disc list-inside ${typography.body} text-muted-foreground`}>
                                  {rel.evidence.map((ev: string, idx: number) => (
                                    <li key={idx}>{ev}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(rel.id)
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className={iconSizes.sm} />
                        ) : (
                          <ChevronDown className={iconSizes.sm} />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  X,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Download,
  LayoutList,
  Users as UsersIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useTranslation } from "@/lib/i18n/translation-context"
import { getAllCOIRelationships, type RelationshipWithDetails } from "@/lib/api/coi-mock"
import type { Relationship } from "@/lib/mock-data/coi"
import { PaperCOIList } from "./paper-coi-list"
import { COIDetailView } from "./coi-detail-view"

interface FilterState {
  severity: "all" | "high" | "medium" | "low"
  type: "all" | string
  search: string
}

interface ExpandedRows {
  [key: string]: boolean
}

interface COIAnalysisDashboardProps {
  conferenceId: string
}

export function COIAnalysisDashboard({ conferenceId }: COIAnalysisDashboardProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [viewMode, setViewMode] = useState<"person" | "paper">("person")
  const [relationships, setRelationships] = useState<RelationshipWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({})
  const [filters, setFilters] = useState<FilterState>({
    severity: "all",
    type: "all",
    search: "",
  })
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipWithDetails | null>(
    null,
  )
  const itemsPerPage = 10

  useEffect(() => {
    if (viewMode === "person") {
      loadRelationships()
    }
  }, [filters, page, viewMode])

  const loadRelationships = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getAllCOIRelationships({
        severity:
          filters.severity === "all" ? undefined : (filters.severity as "high" | "medium" | "low"),
        relationship_type:
          filters.type === "all" ? undefined : (filters.type as Relationship["type"]),
        search: filters.search || undefined,
        limit: itemsPerPage,
        page,
      })

      if (result.data) {
        setRelationships(result.data.relationships)
        setTotalCount(result.data.total)
      } else {
        setError(result.error || "Failed to load relationships")
      }
    } catch (err) {
      setError("Failed to load relationships")
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

  const handleClearFilters = () => {
    setFilters({ severity: "all", type: "all", search: "" })
    setPage(1)
  }

  const hasActiveFilters =
    filters.severity !== "all" || filters.type !== "all" || filters.search !== ""

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          badge: "bg-red-500/10 text-red-700 dark:text-red-400",
          border: "border-l-red-500",
          bg: "bg-red-50/50 dark:bg-red-950/20",
        }
      case "medium":
        return {
          badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
          border: "border-l-amber-500",
          bg: "bg-amber-50/50 dark:bg-amber-950/20",
        }
      case "low":
        return {
          badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
          border: "border-l-blue-500",
          bg: "bg-blue-50/50 dark:bg-blue-950/20",
        }
      default:
        return {
          badge: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
          border: "border-l-slate-500",
          bg: "bg-slate-50/50 dark:bg-slate-950/20",
        }
    }
  }

  const getSeverityIcon = (severity: string) => {
    if (severity === "high") {
      return <AlertTriangle className="h-4 w-4" />
    }
    return <AlertCircle className="h-4 w-4" />
  }

  const getRelationshipTypeLabel = (type: string) => {
    const key = `coi.relationshipTypes.${type}`
    const label = t(key)
    // If translation key is not found, return formatted type
    if (label === key) {
      return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    }
    return label
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-slate-50 dark:to-slate-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                {t("coi.dashboard.title")}
              </h1>
              <p className="text-muted-foreground mt-2">{t("coi.dashboard.description")}</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Download className="h-4 w-4" />
              {t("common.actions.download")} Report
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={t("coi.allRelationships.title")}
            value={totalCount}
            trend="+5.2%"
            icon={AlertTriangle}
          />
          <StatsCard
            label="Critical Conflicts"
            value="87"
            trend="+12%"
            icon={AlertTriangle}
            highlight="destructive"
          />
          <StatsCard
            label="Needs Review"
            value="156"
            trend="-2.1%"
            icon={AlertCircle}
            highlight="warning"
          />
          <StatsCard
            label="Informational"
            value={Math.max(0, totalCount - 87 - 156)}
            trend="+4.8%"
            icon={TrendingUp}
          />
        </div>

        {/* View Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("person")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                viewMode === "person"
                  ? "bg-white dark:bg-slate-950 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              Person to Person
            </button>
            <button
              onClick={() => setViewMode("paper")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                viewMode === "paper"
                  ? "bg-white dark:bg-slate-950 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Paper View
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  viewMode === "person"
                    ? t("coi.allRelationships.searchPlaceholder")
                    : "Search by paper title or author..."
                }
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                  setPage(1)
                }}
                className="pl-10 h-11 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex flex-wrap gap-3 flex-1">
                {/* Severity Filter */}
                <Select
                  value={filters.severity}
                  onValueChange={(value) => {
                    setFilters((prev) => ({ ...prev, severity: value as FilterState["severity"] }))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-[200px] h-9 bg-slate-100 dark:bg-slate-800 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter - Only for Person View */}
                {viewMode === "person" && (
                  <Select
                    value={filters.type}
                    onValueChange={(value) => {
                      setFilters((prev) => ({ ...prev, type: value }))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[200px] h-9 bg-slate-100 dark:bg-slate-800 border-0">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="co_author">Co-Author</SelectItem>
                      <SelectItem value="same_organization">Same Organization</SelectItem>
                      <SelectItem value="advisor_advisee">Advisor/Advisee</SelectItem>
                      <SelectItem value="collaborator">Collaborator</SelectItem>
                      <SelectItem value="competitor">Competitor</SelectItem>
                      <SelectItem value="citation">Citation</SelectItem>
                      <SelectItem value="review_history">Review History</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {viewMode === "paper" ? (
          <PaperCOIList filters={filters} />
        ) : (
          /* Relationships List (Person View) */
          <div className="space-y-3">
            {loading ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">{t("common.actions.loading")}</p>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-destructive/50">
                <CardContent className="py-6 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            ) : relationships.length === 0 ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="font-semibold text-foreground mb-1">
                    {t("coi.allRelationships.noRelationships")}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t("common.messages.noData")}</p>
                </CardContent>
              </Card>
            ) : (
              relationships.map((rel) => {
                const isExpanded = expandedRows[rel.id]
                const colors = getSeverityColor(rel.severity)

                return (
                  <Card
                    key={rel.id}
                    className={`border-l-4 ${colors.border} ${colors.bg} shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer`}
                    onClick={() => toggleExpanded(rel.id)}
                  >
                    {/* Collapsed View */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}
                          >
                            {getSeverityIcon(rel.severity)}
                            {t(`coi.severity.${rel.severity}`)}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                            {getRelationshipTypeLabel(rel.type)}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                            {new Date(rel.start_date).getFullYear()}
                          </span>
                        </div>

                        {/* Names */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-semibold text-foreground">{rel.reviewer_name}</p>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold text-foreground">{rel.author_name}</p>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground">{rel.description}</p>
                      </div>

                      {/* Timeline Bar */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Timeline</span>
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: isExpanded ? "100%" : "75%",
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Expand/Collapse Icon */}
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <>
                        <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        <div className="p-6 bg-white dark:bg-slate-900/50 space-y-6">
                          {/* Reviewer and Author Info */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-foreground mb-3">
                                {t("coi.common.reviewer")} Info
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-medium text-muted-foreground">Name:</span>
                                  <span className="text-foreground ml-2">{rel.reviewer_name}</span>
                                </p>
                                <p>
                                  <span className="font-medium text-muted-foreground">Email:</span>
                                  <span className="text-foreground ml-2">{rel.reviewer_email}</span>
                                </p>
                                <p>
                                  <span className="font-medium text-muted-foreground">
                                    Affiliation:
                                  </span>
                                  <span className="text-foreground ml-2">
                                    {rel.author_affiliation}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-foreground mb-3">
                                {t("coi.common.author")} Info
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-medium text-muted-foreground">Name:</span>
                                  <span className="text-foreground ml-2">{rel.author_name}</span>
                                </p>
                                <p>
                                  <span className="font-medium text-muted-foreground">Email:</span>
                                  <span className="text-foreground ml-2">{rel.author_email}</span>
                                </p>
                                <p>
                                  <span className="font-medium text-muted-foreground">
                                    Affiliation:
                                  </span>
                                  <span className="text-foreground ml-2">
                                    {rel.author_affiliation}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Related Papers */}
                          {rel.paper_titles && rel.paper_titles.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Related Papers</h4>
                              <ul className="space-y-1 text-sm">
                                {rel.paper_titles.map((title, idx) => (
                                  <li key={idx} className="text-slate-600 dark:text-slate-300">
                                    • {title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Evidence Timeline */}
                          {rel.evidence && rel.evidence.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-3">Evidence</h4>
                              <div className="space-y-2 border-l-2 border-slate-300 dark:border-slate-600 pl-4">
                                {rel.evidence.map((evidence, idx) => (
                                  <p
                                    key={idx}
                                    className="text-sm text-slate-600 dark:text-slate-300"
                                  >
                                    • {evidence}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedRelationship(rel)
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Perform action
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                )
              })
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(page * itemsPerPage, totalCount)} of {totalCount} results
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
        )}
      </div>

      <Sheet
        open={!!selectedRelationship}
        onOpenChange={(open) => !open && setSelectedRelationship(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
          <SheetTitle className="sr-only">Conflict of Interest Details</SheetTitle>
          {selectedRelationship && (
            <COIDetailView
              reviewerId={selectedRelationship.reviewer_id}
              authorId={selectedRelationship.author_id}
              onClose={() => setSelectedRelationship(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface StatsCardProps {
  label: string
  value: string | number
  trend: string
  icon: React.ElementType
  highlight?: "destructive" | "warning"
}

function StatsCard({ label, value, trend, icon: Icon, highlight }: StatsCardProps) {
  const highlightClass =
    highlight === "destructive"
      ? "text-destructive"
      : highlight === "warning"
        ? "text-amber-500"
        : "text-emerald-500"

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${highlightClass || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${highlightClass || "text-emerald-600 dark:text-emerald-400"}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  )
}

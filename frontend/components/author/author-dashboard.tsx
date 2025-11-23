"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, X } from "lucide-react"
import { listConferences } from "@/lib/api/conferences"
import { getUserSubmissions } from "@/lib/api/submissions"
import type { SubmissionWithConference } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useState, useEffect } from "react"
import type { Conference } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { typography, spacing, iconSizes } from "@/lib/typography"

export function AuthorDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [allConferences, setAllConferences] = useState<Conference[]>([])
  const [mySubmissions, setMySubmissions] = useState<SubmissionWithConference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state for My Conferences section
  const [myConferencesSearchQuery, setMyConferencesSearchQuery] = useState("")
  const [myConferencesStatusFilter, setMyConferencesStatusFilter] = useState<"" | "active" | "upcoming" | "archived">("")
  const [myConferencesFilterOpen, setMyConferencesFilterOpen] = useState(false)

  const categories = [
    { value: "all", label: t("dashboard.author.dashboard.categories.all") },
    { value: "technology", label: t("dashboard.author.dashboard.categories.technology") },
    { value: "healthcare", label: t("dashboard.author.dashboard.categories.healthcare") },
    { value: "education", label: t("dashboard.author.dashboard.categories.education") },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all conferences
        const conferencesResponse = await listConferences({ limit: 100 })

        if (conferencesResponse.error) {
          setError(conferencesResponse.error)
        } else if (conferencesResponse.data) {
          // Transform API data to frontend format
          const conferences: Conference[] = conferencesResponse.data.conferences.map((conf) => ({
            id: conf.id,
            name: conf.name,
            acronym: conf.acronym,
            year: conf.year,
            description: conf.description,
            submission_deadline: conf.submission_deadline,
            review_deadline: conf.review_deadline || "",
            camera_ready_deadline: conf.camera_ready_deadline,
            notification_date: conf.notification_date || "",
            conference_date: conf.conference_date,
            location: "", // TODO: Map from backend
            website: conf.website || "",
            status: conf.status,
            tracks: conf.tracks,
          }))

          setAllConferences(conferences)

          // Fetch user submissions if user is authenticated
          if (user?.email) {
            const submissionsResponse = await getUserSubmissions(user.email)
            if (submissionsResponse.data) {
              setMySubmissions(submissionsResponse.data)
            } else if (submissionsResponse.error) {
              // Don't set error if submissions fail, just show empty state
              console.error("Failed to load submissions:", submissionsResponse.error)
            }
          }
        }
      } catch (err) {
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  // Get unique conferences from submissions (group by conference ID)
  const conferencesWithSubmissions = Array.from(
    new Map(mySubmissions.map((sub) => [sub.conference.id, sub.conference])).values(),
  )

  // Get the latest submission status for each conference
  const getConferenceSubmissionStatus = (conferenceId: string): string => {
    const conferenceSubmissions = mySubmissions.filter((sub) => sub.conference.id === conferenceId)
    if (conferenceSubmissions.length === 0) return ""

    // Return the most recent submission status, or "draft" if any is draft
    const hasDraft = conferenceSubmissions.some((sub) => sub.status === "draft")
    if (hasDraft) return "Nháp"
    return "Đã nộp"
  }

  const filterConferences = (conferences: Conference[]) => {
    return conferences.filter((conf) => {
      const matchesSearch =
        conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conf.location.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === "all" ||
        conf.tracks.some((track) => track.name.toLowerCase() === selectedCategory.toLowerCase())
      return matchesSearch && matchesCategory
    })
  }
  
  // Filter My Conferences based on search and status
  const filterMyConferences = (conferences: Conference[]) => {
    return conferences.filter((conf) => {
      const matchesSearch =
        conf.name.toLowerCase().includes(myConferencesSearchQuery.toLowerCase()) ||
        conf.acronym.toLowerCase().includes(myConferencesSearchQuery.toLowerCase())
      const matchesStatus = myConferencesStatusFilter === "" || conf.status === myConferencesStatusFilter
      return matchesSearch && matchesStatus
    })
  }
  
  const handleRemoveMyConferencesStatusFilter = () => {
    setMyConferencesStatusFilter("")
  }
  
  const hasMyConferencesActiveFilters = myConferencesStatusFilter !== ""

  // Filter out conferences that have submissions
  const exploreConferences = allConferences.filter(
    (conf) => !conferencesWithSubmissions.some((myConf) => myConf.id === conf.id),
  )

  const renderStatusBadge = (status: string) => {
    const statusVariants = {
      Nháp: "bg-yellow-100 text-yellow-800",
      "Đã nộp": "bg-blue-100 text-blue-800",
      "Được chấp nhận": "bg-green-100 text-green-800",
      "Bị từ chối": "bg-red-100 text-red-800",
      "Đang đánh giá": "bg-orange-100 text-orange-800",
    }
    return (
      <Badge
        className={`${statusVariants[status as keyof typeof statusVariants] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </Badge>
    )
  }

  return (
    <div className={spacing.section}>
      <div>
        {/* Thanh tìm kiếm và Filter */}
        <div className={`flex flex-col sm:flex-row ${spacing.gap.md}`}>
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconSizes.md} text-gray-400`} />
            <Input
              type="text"
              placeholder={t("dashboard.author.dashboard.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("dashboard.author.dashboard.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section: Bài nộp của tôi */}
      <section className={spacing.subsection}>
        <h2 className={`${typography.h2} ${typography.semibold} tracking-tight`}>
          {t("dashboard.author.dashboard.myConferences")}
        </h2>
        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            {/* Search and Filter Controls for My Conferences */}
            <div className="p-4 border-b">
              <div className="relative flex items-center gap-2 border rounded-md bg-background">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 flex items-center gap-2 pl-10 pr-2 py-2">
                  {hasMyConferencesActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {myConferencesStatusFilter && (
                        <Badge variant="secondary" className="gap-1">
                          {myConferencesStatusFilter === "active"
                            ? "Accepting Submissions"
                            : myConferencesStatusFilter === "upcoming"
                              ? "In Review"
                              : "Archived"}
                          <button
                            onClick={handleRemoveMyConferencesStatusFilter}
                            className="ml-1 hover:bg-muted rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  )}
                  <Input
                    placeholder={
                      hasMyConferencesActiveFilters
                        ? ""
                        : t("dashboard.chair.dashboard.searchPlaceholder")
                    }
                    value={myConferencesSearchQuery}
                    onChange={(e) => setMyConferencesSearchQuery(e.target.value)}
                    className="!border-0 focus-visible:!ring-0 focus-visible:!border-0 focus-visible:!ring-offset-0 !shadow-none h-auto p-0 flex-1 min-w-[120px]"
                  />
                </div>
                <Popover open={myConferencesFilterOpen} onOpenChange={setMyConferencesFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 mr-2 ${hasMyConferencesActiveFilters ? "text-primary" : ""}`}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Status</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={myConferencesStatusFilter === "active"}
                              onCheckedChange={(checked) =>
                                setMyConferencesStatusFilter(checked ? "active" : "")
                              }
                            />
                            <span className="text-sm">Accepting Submissions</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={myConferencesStatusFilter === "upcoming"}
                              onCheckedChange={(checked) =>
                                setMyConferencesStatusFilter(checked ? "upcoming" : "")
                              }
                            />
                            <span className="text-sm">In Review</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={myConferencesStatusFilter === "archived"}
                              onCheckedChange={(checked) =>
                                setMyConferencesStatusFilter(checked ? "archived" : "")
                              }
                            />
                            <span className="text-sm">Archived</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMyConferencesStatusFilter("")
                            setMyConferencesFilterOpen(false)
                          }}
                        >
                          Clear
                        </Button>
                        <Button size="sm" onClick={() => setMyConferencesFilterOpen(false)}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Header row */}
            <div className={`hidden md:flex items-center ${spacing.gap.md} ${spacing.padding.card} bg-gray-50 border-b ${typography.medium} ${typography.body} text-gray-500`}>
              <div className="flex-1 min-w-0">
                {t("dashboard.author.dashboard.tableHeaders.conferenceName")}
              </div>
              <div className={`flex items-center ${spacing.gap.md} ml-auto`}>
                <div className="w-36">{t("dashboard.author.dashboard.tableHeaders.date")}</div>
                <div className="w-36">{t("dashboard.author.dashboard.tableHeaders.location")}</div>
                <div className="w-32">
                  {t("dashboard.author.dashboard.tableHeaders.submissionDeadline")}
                </div>
                <div className="w-28">{t("dashboard.author.dashboard.tableHeaders.status")}</div>
              </div>
            </div>

            {loading ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <p className={`text-gray-500 ${typography.body}`}>
                  {t("dashboard.author.dashboard.messages.loading")}
                </p>
              </div>
            ) : error ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <p className={`text-red-500 ${typography.body}`}>
                  {t("dashboard.author.dashboard.messages.error")}: {error}
                </p>
              </div>
            ) : filterConferences(conferencesWithSubmissions).length === 0 ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <p className={`text-gray-500 ${typography.body}`}>Bạn chưa có bài nộp nào</p>
              </div>
            ) : (
              filterMyConferences(conferencesWithSubmissions).map((conference, index, array) => {
                const submissionStatus = getConferenceSubmissionStatus(conference.id)
                return (
                  <div
                    key={conference.id}
                    className={`flex flex-col md:flex-row md:items-center ${spacing.gap.md} ${spacing.padding.card} ${
                      index !== array.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/conference/${conference.id}`}
                        className={`text-blue-600 hover:underline block ${typography.medium} truncate`}
                      >
                        {conference.name}
                      </Link>
                      <div className={`${typography.body} text-gray-500`}>{conference.acronym}</div>
                    </div>
                    <div className={`flex flex-col md:flex-row items-start md:items-center ${spacing.gap.md} ${typography.body} text-gray-600 ml-auto`}>
                      <div className="md:w-36">{formatDate(conference.conference_date)}</div>
                      <div className="md:w-36">{conference.location}</div>
                      <div className="md:w-32">{formatDate(conference.submission_deadline)}</div>
                      <div className="md:w-28">
                        {submissionStatus ? renderStatusBadge(submissionStatus) : null}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* Section: Explore Conferences */}
      <section className={spacing.subsection}>
        <h2 className={`${typography.h2} ${typography.semibold} tracking-tight`}>
          {t("dashboard.author.dashboard.exploreConferences")}
        </h2>
        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            {/* Header row */}
            <div className={`hidden md:flex items-center ${spacing.gap.md} ${spacing.padding.card} bg-gray-50 border-b ${typography.medium} ${typography.body} text-gray-500`}>
              <div className="flex-1 min-w-0">
                {t("dashboard.author.dashboard.tableHeaders.conferenceName")}
              </div>
              <div className={`flex items-center ${spacing.gap.md} ml-auto`}>
                <div className="w-36">{t("dashboard.author.dashboard.tableHeaders.date")}</div>
                <div className="w-36">{t("dashboard.author.dashboard.tableHeaders.location")}</div>
                <div className="w-32">
                  {t("dashboard.author.dashboard.tableHeaders.submissionDeadline")}
                </div>
              </div>
            </div>

            {loading ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <p className={`text-gray-500 ${typography.body}`}>
                  {t("dashboard.author.dashboard.messages.loading")}
                </p>
              </div>
            ) : error ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <p className={`text-red-500 ${typography.body}`}>
                  {t("dashboard.author.dashboard.messages.error")}: {error}
                </p>
              </div>
            ) : filterConferences(exploreConferences).length === 0 ? (
              <div className={`${spacing.padding.cardLarge} text-center`}>
                <p className={`text-gray-500 ${typography.body}`}>
                  {t("dashboard.author.dashboard.messages.noConferencesFound")}
                </p>
              </div>
            ) : (
              filterConferences(exploreConferences).map((conference, index, array) => (
                <div
                  key={conference.id}
                  className={`flex flex-col md:flex-row md:items-center ${spacing.gap.md} ${spacing.padding.card} ${
                    index !== array.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/conference/${conference.id}`}
                      className={`text-blue-600 hover:underline block ${typography.medium} truncate`}
                    >
                      {conference.name}
                    </Link>
                    <div className={`${typography.body} text-gray-500`}>{conference.acronym}</div>
                  </div>
                  <div className={`flex flex-col md:flex-row items-start md:items-center ${spacing.gap.md} ${typography.body} text-gray-600 ml-auto`}>
                    <div className="md:w-36">{formatDate(conference.conference_date)}</div>
                    <div className="md:w-36">{conference.location}</div>
                    <div className="md:w-32">{formatDate(conference.submission_deadline)}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

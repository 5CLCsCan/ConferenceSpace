"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, FileText } from "lucide-react"
import { getUserSubmissions } from "@/lib/api/submissions"
import type { SubmissionWithConference } from "@/lib/api/submissions"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

export function AuthorSubmissionsList() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [submissions, setSubmissions] = useState<SubmissionWithConference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log("[AuthorSubmissionsList] Component render", {
    hasUser: !!user,
    userEmail: user?.email,
    userObject: JSON.stringify(user, null, 2),
    loading,
    submissionsCount: submissions.length,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [conferenceFilter, setConferenceFilter] = useState<string>("all")

  useEffect(() => {
    const fetchSubmissions = async () => {
      console.log("[AuthorSubmissionsList] useEffect triggered", {
        userEmail: user?.email,
        hasUser: !!user,
        userObjectKeys: user ? Object.keys(user) : [],
        fullUserObject: JSON.stringify(user, null, 2),
      })

      if (!user?.email) {
        console.warn("[AuthorSubmissionsList] No user email found, skipping fetch", {
          user,
          userKeys: user ? Object.keys(user) : [],
          userEmailValue: user?.email,
          userEmailType: typeof user?.email,
        })
        setLoading(false)
        return
      }

      try {
        console.log("[AuthorSubmissionsList] Starting fetch for user:", user.email)
        setLoading(true)
        const response = await getUserSubmissions(user.email)
        console.log("[AuthorSubmissionsList] Fetch response:", {
          hasError: !!response.error,
          hasData: !!response.data,
          dataLength: response.data?.length || 0,
        })

        if (response.error) {
          console.error("[AuthorSubmissionsList] Error:", response.error)
          setError(response.error)
        } else if (response.data) {
          console.log("[AuthorSubmissionsList] Setting submissions:", response.data.length)
          setSubmissions(response.data)
        } else {
          console.warn("[AuthorSubmissionsList] No data and no error in response")
          setSubmissions([])
        }
      } catch (err) {
        console.error("[AuthorSubmissionsList] Exception:", err)
        setError("Failed to load submissions")
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [user])

  // Get unique conferences for filter dropdown
  const uniqueConferences = useMemo(() => {
    const conferences = new Map<string, { id: string; name: string; acronym: string }>()
    submissions.forEach((sub) => {
      if (!conferences.has(sub.conference.id)) {
        conferences.set(sub.conference.id, {
          id: sub.conference.id,
          name: sub.conference.name,
          acronym: sub.conference.acronym,
        })
      }
    })
    return Array.from(conferences.values())
  }, [submissions])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch = sub.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter
      const matchesConference = conferenceFilter === "all" || sub.conference.id === conferenceFilter

      return matchesSearch && matchesStatus && matchesConference
    })
  }, [submissions, searchQuery, statusFilter, conferenceFilter])

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        label: t("dashboard.submissions.status.draft"),
        className: "bg-yellow-100 text-yellow-800",
      },
      published: {
        label: t("dashboard.submissions.status.published"),
        className: "bg-blue-100 text-blue-800",
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    }

    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">{t("dashboard.submissions.loading")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">
          {t("dashboard.submissions.error")}: {error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t("dashboard.submissions.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("dashboard.submissions.filterConference")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dashboard.submissions.allConferences")}</SelectItem>
            {uniqueConferences.map((conf) => (
              <SelectItem key={conf.id} value={conf.id}>
                {conf.name} ({conf.acronym})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder={t("dashboard.submissions.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dashboard.submissions.allStatuses")}</SelectItem>
            <SelectItem value="draft">{t("dashboard.submissions.status.draft")}</SelectItem>
            <SelectItem value="published">{t("dashboard.submissions.status.published")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      <Card>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="hidden md:flex items-center gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-500">
            <div className="flex-1 min-w-0">{t("dashboard.submissions.title")}</div>
            <div className="flex items-center gap-4 ml-auto">
              <div className="w-48">{t("dashboard.submissions.conference")}</div>
              <div className="w-32">{t("dashboard.submissions.submittedDate")}</div>
              <div className="w-28">{t("dashboard.submissions.status.label")}</div>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="mx-auto size-12 text-gray-400 mb-4" />
              <p className="text-gray-500">{t("dashboard.submissions.empty")}</p>
            </div>
          ) : (
            filteredSubmissions.map((submission, index, array) => (
              <div
                key={`${submission.conference_id}-${submission.id}`}
                className={`flex flex-col md:flex-row md:items-center gap-4 p-4 ${
                  index !== array.length - 1 ? "border-b" : ""
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/conference/${submission.conference_id}/submission/${submission.id}`}
                    className="text-blue-600 hover:underline block font-medium truncate"
                  >
                    {submission.title}
                  </Link>
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {submission.abstract || t("dashboard.submissions.noAbstract")}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm text-gray-600 ml-auto">
                  <div className="md:w-48">
                    <div className="font-medium">{submission.conference.name}</div>
                    <div className="text-xs text-gray-500">{submission.conference.acronym}</div>
                  </div>
                  <div className="md:w-32">{formatDate(submission.created_at)}</div>
                  <div className="md:w-28">{renderStatusBadge(submission.status)}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

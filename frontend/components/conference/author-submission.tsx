"use client"

/**
 * Author Submission Component
 * Displays the author's submission for a specific conference
 * - If submission exists: shows submission details with version history (planned)
 * - If no submission: shows prompt to submit
 *
 * Data Sources:
 * - Submissions: GET /api/v1/conferences/:id/submissions?author=email
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getConferenceSubmissions, type Submission } from "@/lib/api/submissions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Calendar,
  Users,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Eye,
  History,
  Loader2,
} from "lucide-react"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useTranslation } from "@/lib/i18n/translation-context"

interface AuthorSubmissionProps {
  conferenceId: string
}

type SubmissionStatus =
  | "draft"
  | "published"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> =
  {
    draft: {
      label: "Draft",
      icon: Edit,
      className: "bg-gray-100 text-gray-700 border-gray-300",
    },
    published: {
      label: "Submitted",
      icon: CheckCircle2,
      className: "bg-primary/10 text-primary border-primary/30",
    },
    submitted: {
      label: "Submitted",
      icon: CheckCircle2,
      className: "bg-primary/10 text-primary border-primary/30",
    },
    under_review: {
      label: "Under Review",
      icon: Clock,
      className: "bg-amber-100 text-amber-700 border-amber-300",
    },
    accepted: {
      label: "Accepted",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700 border-green-300",
    },
    rejected: {
      label: "Rejected",
      icon: AlertCircle,
      className: "bg-red-100 text-red-700 border-red-300",
    },
  }

export function AuthorSubmission({ conferenceId }: AuthorSubmissionProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSubmission() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      const response = await getConferenceSubmissions(conferenceId, {
        author: user.email,
      })

      if (response.data && response.data.submissions.length > 0) {
        // Get the most recent submission
        setSubmission(response.data.submissions[0])
      }
      setLoading(false)
    }

    loadSubmission()
  }, [conferenceId, user?.email])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // No submission - show prompt to submit
  if (!submission) {
    return (
      <div className={spacing.section}>
        <div>
          <h1 className={`${typography.h1} text-gray-900`}>
            {t("dashboard.conference.details.tabs.mySubmission")}
          </h1>
          <p className={`mt-3 ${typography.bodyLarge} leading-relaxed text-gray-600`}>
            {t("dashboard.author.submission.description")}
          </p>
        </div>

        <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-6">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h3 className={`${typography.h3} text-gray-900 mb-2`}>
              {t("dashboard.author.submission.noSubmission")}
            </h3>
            <p className={`${typography.body} text-gray-600 mb-6 max-w-md`}>
              {t("dashboard.author.submission.noSubmissionDescription")}
            </p>
            <Button
              size="lg"
              onClick={() => router.push(`/dashboard/author/submit?conference=${conferenceId}`)}
              className="gap-2"
            >
              <Send className="h-5 w-5" />
              {t("dashboard.author.submission.submitNow")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Has submission - show details
  const status = statusConfig[submission.status] || statusConfig.draft
  const StatusIcon = status.icon

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`${typography.h1} text-gray-900`}>
            {t("dashboard.conference.details.tabs.mySubmission")}
          </h1>
          <p className={`mt-3 ${typography.bodyLarge} leading-relaxed text-gray-600`}>
            {t("dashboard.author.submission.description")}
          </p>
        </div>
        {submission.status === "draft" && (
          <Button
            onClick={() =>
              router.push(
                `/dashboard/author/submit?conference=${conferenceId}&edit=${submission.id}`,
              )
            }
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            {t("dashboard.author.submission.continueDraft")}
          </Button>
        )}
      </div>

      {/* Submission Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className={`${typography.h4} text-gray-900`}>
                  {submission.title || t("dashboard.author.submission.untitled")}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {t("dashboard.author.submission.submittedOn", {
                      date: formatDate(submission.created_at),
                    })}
                  </span>
                  {submission.updated_at !== submission.created_at && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {t("dashboard.author.submission.lastUpdated", {
                        date: formatDate(submission.updated_at),
                      })}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${status.className} gap-1.5 px-3`}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/conference/${conferenceId}/submission/${submission.id}`)
                }
                className={`gap-2 ${typography.bodySmall}`}
              >
                <Eye className="h-1 w-1" />
                {t("dashboard.author.submission.viewDetails")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          {/* Abstract */}
          {submission.abstract && (
            <div className="mb-6">
              <h4 className={`${typography.h5} ${typography.semibold} text-gray-700 mb-2`}>
                {t("common.labels.abstract")}
              </h4>
              <div className="rounded-lg border-l-2 border-primary/30 bg-muted/30 p-4">
                <p className={`${typography.body} leading-relaxed text-gray-700`}>
                  {submission.abstract}
                </p>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Keywords */}
            {submission.information?.keywords && submission.information.keywords.length > 0 && (
              <div>
                <h4 className={`${typography.h5} ${typography.semibold} text-gray-700 mb-2`}>
                  {t("common.labels.keywords")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {submission.information.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Track */}
            {submission.information?.track_name && (
              <div>
                <h4 className={`${typography.h5} ${typography.semibold} text-gray-700 mb-2`}>
                  {t("common.labels.tracks")}
                </h4>
                <Badge variant="secondary" className="text-sm">
                  {submission.information.track_name}
                </Badge>
              </div>
            )}

            {/* Co-authors */}
            {submission.information?.co_authors && submission.information.co_authors.length > 0 && (
              <div className="md:col-span-2">
                <h4 className={`${typography.h5} ${typography.semibold} text-gray-700 mb-2`}>
                  {t("dashboard.submission.details.coAuthors")}
                </h4>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className={`${typography.body} text-gray-600`}>
                    {submission.information.co_authors.join(", ")}
                  </span>
                </div>
              </div>
            )}

            {/* Attached File */}
            {submission.file && (
              <div className="md:col-span-2">
                <h4 className={`${typography.h5} ${typography.semibold} text-gray-700 mb-2`}>
                  {t("dashboard.submission.details.file")}
                </h4>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className={`${typography.body} ${typography.medium} text-gray-900`}>
                      {submission.file.original_name}
                    </p>
                    <p className={`${typography.bodySmall} text-gray-500`}>
                      {(submission.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Eye className="h-4 w-4" />
                    {t("common.actions.view")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Version History Section (Placeholder for future) */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3 py-6">
            <div className="rounded-lg bg-muted p-2">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className={`${typography.h4} text-gray-700`}>
                {t("dashboard.author.submission.versionHistory")}
              </CardTitle>
              <CardDescription>
                {t("dashboard.author.submission.versionHistoryDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div>
              <p className={`${typography.body} text-muted-foreground mb-2`}>
                {t("dashboard.author.submission.versionHistoryPlaceholder")}
              </p>
              <Badge variant="outline" className="text-xs">
                {t("dashboard.author.submission.comingSoon")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {submission.status === "draft" && (
          <Button
            onClick={() =>
              router.push(
                `/dashboard/author/submit?conference=${conferenceId}&edit=${submission.id}`,
              )
            }
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            {t("dashboard.author.submission.editSubmission")}
          </Button>
        )}
      </div>
    </div>
  )
}

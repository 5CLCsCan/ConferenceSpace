"use client"

/**
 * Call for Papers Component
 * Displays submission guidelines, requirements, and tracks
 *
 * Data Sources:
 * - Conference info: GET /api/conferences/:id (conferences table)
 * - Tracks: GET /api/conferences/:id/tracks (tracks table)
 * - User's submission: GET /api/v1/conferences/:id/submissions?author=<email>&limit=1
 */

import { useState, useEffect } from "react"
import type { Conference } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, AlertCircle, Upload, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { getConferenceSubmissions } from "@/lib/api/submissions"
import { useTranslation } from "@/lib/i18n/translation-context"
import { GithubMarkdown } from "@/components/ui/github-markdown"

interface ConferenceCallForPapersProps {
  conference: Conference
}

export function ConferenceCallForPapers({ conference }: ConferenceCallForPapersProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [hasSubmission, setHasSubmission] = useState(false)
  const [userSubmissionId, setUserSubmissionId] = useState<number | null>(null)
  const [checkingSubmission, setCheckingSubmission] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Check if submissions are open based on conference status
  // "open" = accepting submissions, "reviewing" or "completed" = submissions closed
  const isSubmissionOpen = conference.status === "open"

  // Check if user already has a submission for this conference
  useEffect(() => {
    async function checkUserSubmission() {
      if (!user || !conference) {
        setCheckingSubmission(false)
        return
      }

      setCheckingSubmission(true)
      console.log("[ConferenceCallForPapers] Checking for existing submission:", {
        conferenceId: conference.id,
        userEmail: user.email,
        refreshTrigger,
      })

      try {
        // Check for ANY submission (draft OR published) by this author
        const response = await getConferenceSubmissions(conference.id, {
          author: user.email,
          limit: 1,
          // NO status filter - we want to find any existing submission
        })

        console.log("[ConferenceCallForPapers] Check response:", {
          hasData: !!response.data,
          submissionCount: response.data?.submissions?.length || 0,
          error: response.error,
        })

        if (response.data && response.data.submissions.length > 0) {
          const existingSubmission = response.data.submissions[0]
          setHasSubmission(true)
          setUserSubmissionId(existingSubmission.id)
          console.log(
            `[ConferenceCallForPapers] ✅ User already has submission ID ${existingSubmission.id} for conference ${conference.id}`,
          )
        } else {
          setHasSubmission(false)
          setUserSubmissionId(null)
          console.log(
            `[ConferenceCallForPapers] ❌ No existing submission found for user ${user.email} in conference ${conference.id}`,
          )
        }
      } catch (error) {
        console.error("[ConferenceCallForPapers] Error checking for existing submission:", error)
        // On error, assume no submission (fail open)
        setHasSubmission(false)
        setUserSubmissionId(null)
      } finally {
        setCheckingSubmission(false)
      }
    }

    checkUserSubmission()
  }, [conference?.id, user?.email, refreshTrigger])

  // Re-check when page becomes visible (handles navigation back from submission form)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && conference) {
        console.log("[ConferenceCallForPapers] Page became visible, triggering refresh")
        setRefreshTrigger((prev) => prev + 1)
      }
    }

    const handleFocus = () => {
      if (user && conference) {
        console.log("[ConferenceCallForPapers] Window focused, triggering refresh")
        setRefreshTrigger((prev) => prev + 1)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [user, conference])

  const formatDate = (dateString: string) => {
    const locale = t("common.messages.languages.vietnamese") === "Tiếng Việt" ? "vi-VN" : "en-US"
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSubmitClick = () => {
    if (hasSubmission && userSubmissionId) {
      // Navigate to edit existing submission
      router.push(`/dashboard/author/submit?conference=${conference.id}&edit=${userSubmissionId}`)
    } else {
      // Navigate to create new submission
      router.push(`/dashboard/author/submit?conference=${conference.id}`)
    }
  }

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={typography.h1}>{t("conference.callForPapers.title")}</h1>
        <p className={`mt-2 ${typography.body} leading-relaxed text-gray-600`}>
          {t("conference.callForPapers.description", { acronym: conference.acronym })}
        </p>
      </div>

      {/* Submission Status */}
      <Card
        className={`border-2 ${spacing.padding.card} ${isSubmissionOpen ? "border-success bg-success/5" : "border-error bg-error/5"}`}
      >
        <div className={`flex items-start ${spacing.gap.md}`}>
          {isSubmissionOpen ? (
            <CheckCircle className={`${iconSizes.md} text-success`} />
          ) : (
            <AlertCircle className={`${iconSizes.md} text-error`} />
          )}
          <div className="flex-1">
            <h3 className={typography.h5}>
              {isSubmissionOpen
                ? t("conference.callForPapers.submissionOpen")
                : t("conference.callForPapers.submissionClosed")}
            </h3>
            <p className={`mt-1 ${typography.body} text-gray-600`}>
              {t("conference.callForPapers.deadline")}:{" "}
              <span className={typography.semibold}>
                {formatDate(conference.submission_deadline)}
              </span>
            </p>
            {isSubmissionOpen && user && !checkingSubmission && (
              <Button
                className={`mt-3 ${typography.bodySmall}`}
                size="sm"
                onClick={handleSubmitClick}
                disabled={checkingSubmission}
              >
                {hasSubmission ? (
                  <>
                    <Edit className={`mr-1.5 ${iconSizes.xs}`} />
                    {t("conference.callForPapers.editSubmission")}
                  </>
                ) : (
                  <>
                    <Upload className={`mr-1.5 ${iconSizes.xs}`} />
                    {t("conference.callForPapers.submitNow")}
                  </>
                )}
              </Button>
            )}
            {checkingSubmission && user && (
              <Button className={`mt-3 ${typography.bodySmall}`} size="sm" disabled>
                {t("conference.callForPapers.checking")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Submission Guidelines */}
      <div>
        <h2 className={typography.h2}>{t("conference.callForPapers.guidelinesTitle")}</h2>
        <Card className={`mt-3 ${spacing.padding.card}`}>
          {conference.call_for_paper_text ? (
            <GithubMarkdown content={conference.call_for_paper_text} className="w-full" />
          ) : (
            <div className={spacing.subsection}>
              <div>
                <h3 className={`flex items-center ${spacing.gap.sm} ${typography.h5}`}>
                  <FileText className={`${iconSizes.sm} text-primary`} />
                  {t("conference.callForPapers.formatRequirements")}
                </h3>
                <ul className={`mt-2 ${spacing.item} ${typography.body} text-gray-600`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.requirements.language")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.requirements.length")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.requirements.template")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.requirements.fileFormat")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.requirements.originality")}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`flex items-center ${spacing.gap.sm} ${typography.h5}`}>
                  <FileText className={`${iconSizes.sm} text-primary`} />
                  {t("conference.callForPapers.paperContent")}
                </h3>
                <ul className={`mt-2 ${spacing.item} ${typography.body} text-gray-600`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.content.abstract")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.content.keywords")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.content.introduction")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.content.relatedWork")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.content.methodology")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.content.results")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.content.conclusion")}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`flex items-center ${spacing.gap.sm} ${typography.h5}`}>
                  <FileText className={`${iconSizes.sm} text-primary`} />
                  {t("conference.callForPapers.reviewProcess")}
                </h3>
                <ul className={`mt-2 ${spacing.item} ${typography.body} text-gray-600`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.review.doubleBlind")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.review.reviewers")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.review.criteria")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className={`mt-0.5 ${iconSizes.xs} flex-shrink-0 text-success`} />
                    <span>{t("conference.callForPapers.review.outcomes")}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

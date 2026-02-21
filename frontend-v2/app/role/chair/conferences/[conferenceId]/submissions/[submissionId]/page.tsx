"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubmissionDetailHeader } from "@/components/chair/conference-detail/submission-detail-header"
import { SubmissionDetailContent } from "@/components/chair/conference-detail/submission-detail-content"
import type { ConferenceInfo } from "@/components/chair/conference-detail/types"
import type {
  SubmissionDetail,
  SubmissionDetailStatus,
  SubmissionSubTab,
  ReviewerDecision,
  ConfidenceLevel,
} from "@/components/chair/conference-detail/submission-detail/types"
import { getSidebarMenuItems } from "@/lib/navigation"
import { getConferenceById } from "@/lib/api/conferences"
import { getSubmissionById } from "@/lib/api/submissions"
import { getSubmissionReviewAnalytics, getSubmissionReviews } from "@/lib/api/reviews"

const REVIEWER_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
]

function formatDate(value?: string): string {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "N/A"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function normalizePersonLabel(identifier: string) {
  const local = identifier.split("@")[0] || identifier
  return local
    .split(/[._-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function mapSubmissionStatus(status: string): SubmissionDetailStatus {
  if (status === "accepted") return "accepted"
  if (status === "rejected") return "rejected"
  if (status === "reviewing") return "under_review"
  if (status === "draft") return "pending_decision"
  return "pending_decision"
}

function mapRecommendation(value?: string): ReviewerDecision {
  if (value === "accept" || value === "weak_accept" || value === "borderline" || value === "weak_reject" || value === "reject") {
    return value
  }
  if (value === "strong_accept") return "accept"
  if (value === "strong_reject") return "reject"
  return "borderline"
}

function mapConfidence(value?: string): ConfidenceLevel {
  if (value === "high" || value === "medium" || value === "low") return value
  return "medium"
}

export default function ChairSubmissionDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const conferenceId = params.conferenceId as string
  const submissionId = params.submissionId as string
  const tabQuery = searchParams.get("tab")

  const { unreadCount } = useNotifications({ limit: 1 })
  const [activeTab, setActiveTab] = useState<SubmissionSubTab>(
    tabQuery === "reviews" || tabQuery === "discussion" || tabQuery === "history"
      ? tabQuery
      : "overview",
  )
  const [conference, setConference] = useState<ConferenceInfo>({
    id: conferenceId,
    acronym: "CONF",
    fullName: "Conference Detail",
    location: "TBD",
    startDate: "-",
    endDate: "-",
    year: "2026",
  })
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)

      const [conferenceResponse, submissionResponse, reviewsResponse, analyticsResponse] =
        await Promise.all([
          getConferenceById(conferenceId),
          getSubmissionById(conferenceId, submissionId),
          getSubmissionReviews(conferenceId, submissionId, { limit: 50, offset: 0 }),
          getSubmissionReviewAnalytics(conferenceId, submissionId),
        ])

      if (conferenceResponse.error || !conferenceResponse.data) {
        setError(conferenceResponse.error || "Failed to load conference")
        setLoading(false)
        return
      }

      if (submissionResponse.error || !submissionResponse.data) {
        setError(submissionResponse.error || "Failed to load submission")
        setLoading(false)
        return
      }

      const conferenceData = conferenceResponse.data
      setConference({
        id: conferenceId,
        acronym: conferenceData.acronym || conferenceData.name || "CONF",
        fullName: conferenceData.name || "Conference",
        location: conferenceData.location || "TBD",
        startDate: formatDate(conferenceData.conference_date),
        endDate: formatDate(conferenceData.conference_end_date),
        year: String(conferenceData.year || new Date().getFullYear()),
      })

      const submissionData = submissionResponse.data
      const coAuthors = submissionData.information?.co_authors || []
      const keywords = submissionData.information?.keywords || submissionData.domain || []
      const conflicts = (submissionData.information?.declared_conflicts || []).map((item) => item.email)
      const reviews = reviewsResponse.data || []
      const analytics = analyticsResponse.data

      const files: SubmissionDetail["files"] = []
      if (submissionData.file) {
        files.push({
          id: "main",
          name: submissionData.file.original_name || submissionData.file.filename,
          size: formatFileSize(submissionData.file.size),
          type: submissionData.file.mime_type.includes("pdf") ? "pdf" : "other",
        })
      }
      if (submissionData.cover_letter) {
        files.push({
          id: "cover-letter",
          name: submissionData.cover_letter.original_name || submissionData.cover_letter.filename,
          size: formatFileSize(submissionData.cover_letter.size),
          type: "other",
        })
      }

      const mappedSubmission: SubmissionDetail = {
        id: String(submissionData.id),
        displayId: `#${submissionData.id}`,
        title: submissionData.title,
        abstract: submissionData.abstract || "No abstract provided.",
        track: submissionData.information?.track_name || "Unassigned",
        status: mapSubmissionStatus(submissionData.status),
        keywords,
        authors: [
          {
            id: submissionData.author,
            name: normalizePersonLabel(submissionData.author),
            email: submissionData.author,
            affiliation: "",
            isCorresponding: true,
          },
          ...coAuthors.map((author, index) => ({
            id: `${submissionData.id}-co-${index}`,
            name: normalizePersonLabel(author),
            email: author.includes("@") ? author : undefined,
            affiliation: "",
          })),
        ],
        conflictsOfInterest: conflicts,
        files,
        coverLetter: submissionData.information?.additional_notes,
        lastUpdated: formatDate(submissionData.updated_at),
        reviewOverview: {
          averageScore: analytics?.average_score || 0,
          maxScore: 10,
          confidence:
            analytics && analytics.confidence_distribution.high >= analytics.confidence_distribution.medium
              ? "high"
              : analytics && analytics.confidence_distribution.low > analytics.confidence_distribution.medium
                ? "low"
                : "medium",
          status: `${reviews.filter((review) => review.review_status === "submitted").length}/${reviews.length} reviews submitted`,
          individualScores: reviews.map((review, index) => ({
            reviewerId: String(review.reviewer_id || index + 1),
            reviewerName: review.reviewer_email || `Reviewer #${index + 1}`,
            avatarColor: REVIEWER_COLORS[index % REVIEWER_COLORS.length],
            decision: mapRecommendation(review.review_data?.recommendation),
            score: review.review_score || 0,
            confidence: mapConfidence(review.review_data?.confidence),
          })),
        },
        reviewerAssignments: reviews.map((review, index) => ({
          id: String(review.id),
          name: review.reviewer_email || `Reviewer #${index + 1}`,
          status:
            review.review_status === "submitted"
              ? "completed"
              : review.review_status === "draft"
                ? "in_progress"
                : "pending",
        })),
      }

      setSubmission(mappedSubmission)
      setLoading(false)
    }

    void loadData()
  }, [conferenceId, submissionId])

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("chair", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        {submission ? (
          <SubmissionDetailHeader
            conference={conference}
            conferenceId={conferenceId}
            submissionTitle={submission.title}
            submissionDisplayId={submission.displayId}
            submissionTrack={submission.track}
            submissionStatus={submission.status}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : null}

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black">
          <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                Loading...
              </div>
            ) : error || !submission ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                Failed to load submission: {error || "Unknown error"}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                    Loading...
                  </div>
                }
              >
                <SubmissionDetailContent
                  submission={submission}
                  activeTab={activeTab}
                  conferenceId={conferenceId}
                  submissionId={submissionId}
                />
              </Suspense>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

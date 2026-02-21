"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubmissionDetailHeader } from "@/components/chair/conference-detail/submission-detail-header"
import { SubmissionDetailContent } from "@/components/chair/conference-detail/submission-detail-content"
import type { ConferenceInfo } from "@/components/chair/conference-detail/types"
import type {
  ConfidenceLevel,
  HistoryEventCategory,
  HistoryEventType,
  ReviewerDecision,
  SubmissionDetail,
  SubmissionDetailStatus,
  SubmissionHistoryActor,
  SubmissionHistoryEvent,
  SubmissionSubTab,
} from "@/components/chair/conference-detail/submission-detail/types"
import { getSidebarMenuItems } from "@/lib/navigation"
import { getConferenceById } from "@/lib/api/conferences"
import { getSubmissionById, type Submission } from "@/lib/api/submissions"
import {
  getSubmissionReviewAnalytics,
  getSubmissionReviews,
  type AssignmentReview,
} from "@/lib/api/reviews"
import {
  getMessages,
  getThreads,
  type DiscussionMessage,
  type DiscussionThread,
} from "@/lib/api/discussions"

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

function formatDateTime(value?: string): string {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  if (
    value === "accept" ||
    value === "weak_accept" ||
    value === "borderline" ||
    value === "weak_reject" ||
    value === "reject"
  ) {
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

function buildActor(name: string, role: string, id?: string): SubmissionHistoryActor {
  const actorName = name.trim() || "System"
  return {
    id: id || actorName.toLowerCase().replace(/\s+/g, "-"),
    name: actorName,
    role,
  }
}

function roleFromEmail(email: string | undefined, authorEmail: string): string {
  if (!email) return "system"
  if (email === authorEmail) return "author"
  if (email.includes("chair")) return "chair"
  if (email.includes("reviewer")) return "reviewer"
  return "reviewer"
}

function pushHistoryEvent(
  events: SubmissionHistoryEvent[],
  payload: {
    id: string
    type: HistoryEventType
    category: HistoryEventCategory
    title: string
    description: string
    actor: SubmissionHistoryActor
    timestamp?: string
    metadata?: Record<string, string>
  },
) {
  if (!payload.timestamp) return

  events.push({
    id: payload.id,
    type: payload.type,
    category: payload.category,
    title: payload.title,
    description: payload.description,
    actor: payload.actor,
    timestamp: payload.timestamp,
    relativeTime: formatDateTime(payload.timestamp),
    metadata: payload.metadata,
  })
}

function buildHistoryEvents(
  submissionData: Submission,
  reviews: AssignmentReview[],
  threads: DiscussionThread[],
  messagesByThread: Record<number, DiscussionMessage[]>,
): SubmissionHistoryEvent[] {
  const events: SubmissionHistoryEvent[] = []
  const authorActor = buildActor(
    normalizePersonLabel(submissionData.author),
    "author",
    submissionData.author,
  )

  pushHistoryEvent(events, {
    id: `submission-created-${submissionData.id}`,
    type: "submission_created",
    category: "submission",
    title: "Submission Created",
    description: "Initial submission was created",
    actor: authorActor,
    timestamp: submissionData.created_at,
  })

  if (submissionData.file) {
    pushHistoryEvent(events, {
      id: `submission-file-${submissionData.id}`,
      type: "submission_uploaded",
      category: "submission",
      title: "File Uploaded",
      description: `Uploaded ${submissionData.file.original_name || submissionData.file.filename}`,
      actor: authorActor,
      timestamp: submissionData.updated_at || submissionData.created_at,
      metadata: {
        fileName: submissionData.file.original_name || submissionData.file.filename,
      },
    })
  }

  if (submissionData.updated_at && submissionData.updated_at !== submissionData.created_at) {
    pushHistoryEvent(events, {
      id: `submission-updated-${submissionData.id}`,
      type: "submission_updated",
      category: "submission",
      title: "Submission Updated",
      description: "Submission metadata was updated",
      actor: authorActor,
      timestamp: submissionData.updated_at,
    })
  }

  pushHistoryEvent(events, {
    id: `submission-status-${submissionData.id}`,
    type:
      submissionData.status === "accepted" || submissionData.status === "rejected"
        ? "decision_made"
        : "status_changed",
    category:
      submissionData.status === "accepted" || submissionData.status === "rejected"
        ? "decision"
        : "status",
    title: "Status Updated",
    description: `Submission status is ${submissionData.status}`,
    actor: buildActor("System", "system"),
    timestamp: submissionData.updated_at || submissionData.created_at,
  })

  reviews.forEach((review, index) => {
    const reviewerName = review.reviewer_email || `Reviewer #${index + 1}`
    const reviewerActor = buildActor(reviewerName, "reviewer", reviewerName)

    pushHistoryEvent(events, {
      id: `review-assigned-${review.id}`,
      type: "reviewers_assigned",
      category: "assignment",
      title: "Reviewer Assigned",
      description: `${reviewerName} assigned to this submission`,
      actor: buildActor("Chair", "chair"),
      timestamp: review.created_at,
    })

    if (review.review_status === "draft") {
      pushHistoryEvent(events, {
        id: `review-draft-${review.id}`,
        type: "review_saved",
        category: "review",
        title: "Draft Review Saved",
        description: `${reviewerName} saved a draft review`,
        actor: reviewerActor,
        timestamp: review.updated_at,
      })
    }

    if (review.review_status === "submitted") {
      const recommendation = review.review_data?.recommendation || "submitted"
      const scoreValue =
        typeof review.review_score === "number" ? review.review_score.toFixed(1) : undefined
      const scoreLabel = scoreValue ? `${recommendation} (${scoreValue})` : recommendation
      pushHistoryEvent(events, {
        id: `review-submitted-${review.id}`,
        type: "review_submitted",
        category: "review",
        title: "Review Submitted",
        description: `${reviewerName} submitted a review`,
        actor: reviewerActor,
        timestamp: review.review_submitted_at || review.updated_at,
        metadata: { score: scoreLabel },
      })
    }
  })

  threads.forEach((thread) => {
    const reviewerEmail = thread.reviewer_email || `reviewer-${thread.reviewer_id}`
    const threadActor = buildActor(normalizePersonLabel(reviewerEmail), "reviewer", reviewerEmail)
    pushHistoryEvent(events, {
      id: `thread-created-${thread.id}`,
      type: "discussion_thread_created",
      category: "discussion",
      title: "Discussion Thread Created",
      description: `${threadActor.name} opened thread: ${thread.title}`,
      actor: threadActor,
      timestamp: thread.created_at,
    })

    const threadMessages = messagesByThread[thread.id] || []
    threadMessages.forEach((message) => {
      const actorEmail = message.author_email || `user-${message.author_id}`
      pushHistoryEvent(events, {
        id: `thread-message-${message.id}`,
        type: "discussion_message_added",
        category: "discussion",
        title: "Discussion Message Added",
        description: `${normalizePersonLabel(actorEmail)} posted a message in "${thread.title}"`,
        actor: buildActor(
          normalizePersonLabel(actorEmail),
          roleFromEmail(message.author_email, submissionData.author),
          actorEmail,
        ),
        timestamp: message.created_at,
      })
    })
  })

  return events.sort((left, right) => {
    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  })
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
  const [historyEvents, setHistoryEvents] = useState<SubmissionHistoryEvent[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setHistoryLoading(true)
      setError(null)

      const conferenceNumericId = Number(conferenceId)
      const submissionNumericId = Number(submissionId)
      const canLoadDiscussion =
        Number.isFinite(conferenceNumericId) &&
        conferenceNumericId > 0 &&
        Number.isFinite(submissionNumericId) &&
        submissionNumericId > 0

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
        setHistoryLoading(false)
        return
      }

      if (submissionResponse.error || !submissionResponse.data) {
        setError(submissionResponse.error || "Failed to load submission")
        setLoading(false)
        setHistoryLoading(false)
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

      let threads: DiscussionThread[] = []
      let messagesByThread: Record<number, DiscussionMessage[]> = {}

      if (canLoadDiscussion) {
        try {
          const threadsResponse = await getThreads(conferenceNumericId, submissionNumericId)
          threads = threadsResponse.threads || []
          const messageEntries = await Promise.all(
            threads.map(async (thread) => {
              try {
                const messagesResponse = await getMessages(thread.id)
                return [thread.id, messagesResponse.messages || []] as const
              } catch {
                return [thread.id, []] as const
              }
            }),
          )
          messagesByThread = Object.fromEntries(messageEntries)
        } catch {
          threads = []
          messagesByThread = {}
        }
      }

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
            analytics &&
            analytics.confidence_distribution.high >= analytics.confidence_distribution.medium
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
      setHistoryEvents(buildHistoryEvents(submissionData, reviews, threads, messagesByThread))
      setHistoryLoading(false)
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
                  historyEvents={historyEvents}
                  historyLoading={historyLoading}
                />
              </Suspense>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

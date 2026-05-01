import { apiFetch } from "./client"
import type {
  RebuttalSettings,
  ReviewerInfo,
  RebuttalPoint,
  RebuttalSubmission,
  RebuttalSubmissionData,
  ResponseStatus,
} from "@/components/shared/rebuttal/types"

// Backend response shape
interface BackendRebuttalPoint {
  point_id: string
  assignment_id: number
  category: string
  section: string
  original_comment: string
  author_response: string
  status: ResponseStatus
  reviewer_acknowledged: boolean
  reviewer_note: string
}

interface BackendAssignmentStatus {
  assignment_id: number
  rebuttal_status: string
  review_score: number
  review_data: {
    feedback: {
      summary: string
      strengths: string
      weaknesses: string
      questions: string
    }
    recommendation: string
  } | null
  post_rebuttal_score: number
  post_rebuttal_recommendation: string
}

interface BackendGetRebuttalResponse {
  phase: string
  general_response: string
  submitted_at: string | null
  points: BackendRebuttalPoint[]
  assignments: BackendAssignmentStatus[]
  char_limit_general: number
  char_limit_per_point: number
  deadline: string | null
}

export interface RebuttalPanelData {
  settings: RebuttalSettings
  reviewers: ReviewerInfo[]
  points: RebuttalPoint[]
  submission: RebuttalSubmission | null
}

/**
 * Fetch the rebuttal state for a submission and map to RebuttalPanel props.
 * Backend: GET /api/v1/conferences/:id/submissions/:id/rebuttal
 *
 * @param currentAssignmentId - if provided, the matching ReviewerInfo will be marked isCurrentUser=true
 */
export async function getRebuttal(
  conferenceId: string,
  submissionId: string,
  currentAssignmentId?: string,
): Promise<{ data: RebuttalPanelData | null; error: string | null }> {
  try {
    const { data } = await apiFetch<{ data: BackendGetRebuttalResponse }>(
      `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/rebuttal`,
    )
    const backend = data.data

    const deadlineDate = backend.deadline ? new Date(backend.deadline) : null
    const daysRemaining = deadlineDate
      ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000))
      : 0

    const settings: RebuttalSettings = {
      phase: (backend.phase as RebuttalSettings["phase"]) || "awaiting",
      deadline: backend.deadline ?? "",
      daysRemaining,
      characterLimitPerReview: backend.char_limit_general || 10000,
      charLimitGeneral: backend.char_limit_general || 3000,
      charLimitPerPoint: backend.char_limit_per_point || 1000,
      allowRevisions: false,
      allowNewResults: false,
      requireResponseToAll: false,
    }

    const points: RebuttalPoint[] = (backend.points ?? []).map((p) => ({
      id: p.point_id,
      reviewerId: String(p.assignment_id),
      category: p.category as RebuttalPoint["category"],
      section: p.section,
      originalComment: p.original_comment,
      authorResponse: p.author_response || undefined,
      status: p.status,
      reviewerAcknowledgment: p.reviewer_acknowledged
        ? { acknowledged: true, note: p.reviewer_note || undefined }
        : undefined,
    }))

    // If no points exist, auto-generate them from review feedback for authors to start their rebuttal
    if (points.length === 0 && backend.assignments && backend.assignments.length > 0) {
      for (const a of backend.assignments) {
        if (a.review_data?.feedback) {
          const f = a.review_data.feedback
          const assignmentId = String(a.assignment_id)

          if (f.weaknesses) {
            points.push({
              id: `gen-w-${assignmentId}`,
              reviewerId: assignmentId,
              category: "weakness",
              originalComment: f.weaknesses,
              section: "Weaknesses",
              status: "pending_review",
            })
          }
          if (f.questions) {
            points.push({
              id: `gen-q-${assignmentId}`,
              reviewerId: assignmentId,
              category: "question",
              originalComment: f.questions,
              section: "Questions to Authors",
              status: "pending_review",
            })
          }
          // If no weaknesses/questions but there is a summary, use it as a point
          if (!f.weaknesses && !f.questions && f.summary) {
            points.push({
              id: `gen-s-${assignmentId}`,
              reviewerId: assignmentId,
              category: "clarification",
              originalComment: f.summary,
              section: "Summary Feedback",
              status: "pending_review",
            })
          }
        }
      }
    }

    // Build reviewers from all assignments
    const reviewers: ReviewerInfo[] = (backend.assignments ?? []).map((a, index) => {
      const assignmentId = String(a.assignment_id)
      return {
        id: assignmentId,
        anonymousId: `Reviewer #${index + 1}`,
        isCurrentUser: currentAssignmentId ? assignmentId === currentAssignmentId : false,
        rebuttalStatus: a.rebuttal_status,
        scores: {
          original: a.review_score,
          current: a.post_rebuttal_score || a.review_score,
          updated: !!a.post_rebuttal_score && a.post_rebuttal_score !== a.review_score,
        },
        recommendation: {
          original: a.review_data?.recommendation || "",
          current: a.post_rebuttal_recommendation || a.review_data?.recommendation || "",
          updated: !!a.post_rebuttal_recommendation && a.post_rebuttal_recommendation !== a.review_data?.recommendation,
        },
        confidence: 0,
      }
    })

    const submission: RebuttalSubmission | null =
      backend.phase !== "awaiting" && backend.general_response
        ? {
            id: submissionId,
            submittedAt: backend.submitted_at || "",
            generalResponse: {
              content: backend.general_response,
              wordCount: backend.general_response.split(" ").length,
            },
            perReviewerResponses: [],
            attachments: [],
          }
        : null

    return { data: { settings, reviewers, points, submission }, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to load rebuttal",
    }
  }
}

/**
 * Author submits rebuttal general response + per-point responses.
 * Backend: PUT /api/v1/conferences/:id/submissions/:id/rebuttal
 */
export async function submitRebuttal(
  conferenceId: string,
  submissionId: string,
  data: RebuttalSubmissionData & {
    points: Array<{
      pointId: string
      assignmentId: number
      category: string
      section: string
      originalComment: string
      authorResponse: string
    }>
  },
): Promise<{ error: string | null }> {
  try {
    await apiFetch(`/api/v1/conferences/${conferenceId}/submissions/${submissionId}/rebuttal`, {
      method: "PUT",
      body: JSON.stringify({
        general_response: data.generalResponse,
        points: data.points.map((p) => ({
          point_id: p.pointId,
          assignment_id: p.assignmentId,
          category: p.category,
          section: p.section,
          original_comment: p.originalComment,
          author_response: p.authorResponse,
        })),
      }),
    })
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to submit rebuttal" }
  }
}

/**
 * Reviewer acknowledges a single rebuttal point.
 * Backend: PUT /api/v1/conferences/:id/assignments/:id/rebuttal/points/:point_id/acknowledge
 */
export async function acknowledgePoint(
  conferenceId: string,
  assignmentId: string,
  pointId: string,
  status: ResponseStatus,
  note?: string,
): Promise<{ error: string | null }> {
  try {
    await apiFetch(
      `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/rebuttal/points/${encodeURIComponent(pointId)}/acknowledge`,
      {
        method: "PUT",
        body: JSON.stringify({ status, note: note ?? "" }),
      },
    )
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to acknowledge point" }
  }
}

/**
 * Reviewer updates their post-rebuttal score after reading the author's rebuttal.
 * Backend: PUT /api/v1/conferences/:id/assignments/:id/post-rebuttal-score
 */
export async function updatePostRebuttalScore(
  conferenceId: string,
  assignmentId: string,
  data: { score: number; recommendation: string; comment: string },
): Promise<{ error: string | null }> {
  try {
    await apiFetch(
      `/api/v1/conferences/${conferenceId}/assignments/${assignmentId}/post-rebuttal-score`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    )
    return { error: null }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update post-rebuttal score",
    }
  }
}

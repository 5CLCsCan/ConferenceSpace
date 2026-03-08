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

interface BackendGetRebuttalResponse {
  phase: string
  general_response: string
  submitted_at: string | null
  points: BackendRebuttalPoint[]
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

    const settings: RebuttalSettings = {
      phase: (backend.phase as RebuttalSettings["phase"]) || "awaiting",
      deadline: "",
      daysRemaining: 0,
      characterLimitPerReview: 10000,
      allowRevisions: true,
      allowNewResults: true,
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

    // Derive unique ReviewerInfo objects from the unique assignment_ids in points.
    // The panel groups points by reviewer.id which maps to assignment_id.
    const assignmentIds = Array.from(new Set(points.map((p) => p.reviewerId)))
    const reviewers: ReviewerInfo[] = assignmentIds.map((assignmentId, index) => ({
      id: assignmentId,
      anonymousId: `Reviewer #${index + 1}`,
      isCurrentUser: currentAssignmentId ? assignmentId === currentAssignmentId : false,
      scores: { original: 0, current: 0, updated: false },
      recommendation: { original: "", current: "", updated: false },
      confidence: 0,
    }))

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

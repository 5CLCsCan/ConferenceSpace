import {
  getReviewerDashboard,
  getReviewerPapersWithPagination,
  type DashboardOptions,
} from "@/lib/api/reviewer"
import {
  getAssignmentConferenceContext,
  setAssignmentConferenceContext,
} from "@/lib/reviewer/assignment-context-cache"

interface ResolveAssignmentConferenceInput {
  assignmentId: string
  reviewerEmail: string
  conferenceId?: string | null
}

interface ResolveAssignmentConferenceResult {
  conferenceId: string | null
  source: "query" | "cache" | "lookup" | "unresolved"
}

const DEFAULT_DASHBOARD_OPTIONS: DashboardOptions = {
  conferenceLimit: 50,
  conferenceOffset: 0,
  invitationLimit: 1,
  invitationOffset: 0,
  recentAssignmentLimit: 100,
  recentAssignmentOffset: 0,
}

function normalize(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function resolveAssignmentConference({
  assignmentId,
  reviewerEmail,
  conferenceId,
}: ResolveAssignmentConferenceInput): Promise<ResolveAssignmentConferenceResult> {
  const normalizedAssignmentId = normalize(assignmentId)
  if (!normalizedAssignmentId) {
    return { conferenceId: null, source: "unresolved" }
  }

  const queryConferenceId = normalize(conferenceId)
  if (queryConferenceId) {
    return { conferenceId: queryConferenceId, source: "query" }
  }

  const cachedConferenceId = getAssignmentConferenceContext(normalizedAssignmentId)
  if (cachedConferenceId) {
    return { conferenceId: cachedConferenceId, source: "cache" }
  }

  const normalizedReviewerEmail = normalize(reviewerEmail)
  if (!normalizedReviewerEmail) {
    return { conferenceId: null, source: "unresolved" }
  }

  const dashboardResponse = await getReviewerDashboard(
    normalizedReviewerEmail,
    DEFAULT_DASHBOARD_OPTIONS,
  )
  if (dashboardResponse.error || !dashboardResponse.data) {
    return { conferenceId: null, source: "unresolved" }
  }

  const recentMatch = (dashboardResponse.data.recent_assignments || []).find(
    (assignment) => String(assignment.assignment_id) === normalizedAssignmentId,
  )
  if (recentMatch?.conference_id !== undefined && recentMatch?.conference_id !== null) {
    const resolvedConferenceId = String(recentMatch.conference_id)
    setAssignmentConferenceContext(normalizedAssignmentId, resolvedConferenceId)
    return { conferenceId: resolvedConferenceId, source: "lookup" }
  }

  const conferences = dashboardResponse.data.conferences || []
  for (const conference of conferences) {
    const conferenceIdFromList = normalize(conference.id)
    if (!conferenceIdFromList) {
      continue
    }

    let offset = 0
    const limit = 100

    for (let page = 0; page < 5; page += 1) {
      const papersResponse = await getReviewerPapersWithPagination(
        normalizedReviewerEmail,
        conferenceIdFromList,
        {
          limit,
          offset,
        },
      )

      if (papersResponse.error || !papersResponse.data) {
        break
      }

      const matchedPaper = papersResponse.data.find(
        (paper) => String(paper.assignment_id) === normalizedAssignmentId,
      )

      if (matchedPaper) {
        setAssignmentConferenceContext(normalizedAssignmentId, conferenceIdFromList)
        return { conferenceId: conferenceIdFromList, source: "lookup" }
      }

      offset += papersResponse.data.length
      if (offset >= papersResponse.total || papersResponse.data.length === 0) {
        break
      }
    }
  }

  return { conferenceId: null, source: "unresolved" }
}

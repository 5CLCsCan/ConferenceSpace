import { ROUTES } from "@/lib/routes"

const LEGACY_DASHBOARD_PREFIX = "/dashboard"

function toSearch(queryString?: string): string {
  return queryString && queryString.length > 0 ? `?${queryString}` : ""
}

export function resolveNotificationActionUrl(actionUrl?: string): string | null {
  if (!actionUrl) return null

  // Already a v2 route.
  if (actionUrl.startsWith("/role/") || actionUrl.startsWith("/profile/")) {
    return actionUrl
  }

  // Keep external links untouched.
  if (/^https?:\/\//i.test(actionUrl)) {
    return actionUrl
  }

  let url: URL
  try {
    url = new URL(actionUrl, "http://localhost")
  } catch {
    return null
  }

  const path = url.pathname
  const search = url.searchParams.toString()

  if (!path.startsWith(LEGACY_DASHBOARD_PREFIX)) {
    return `${path}${toSearch(search)}`
  }

  const conferenceSubmission = path.match(/^\/dashboard\/conference\/(\d+)\/submission\/(\d+)$/)
  if (conferenceSubmission) {
    const [, conferenceId, submissionId] = conferenceSubmission
    const tab = url.searchParams.get("tab")
    if (tab === "discussion") {
      return `${ROUTES.CHAIR.SUBMISSION_DETAIL(conferenceId, submissionId)}?tab=discussion`
    }
    return ROUTES.CHAIR.SUBMISSION_DETAIL(conferenceId, submissionId)
  }

  const conferenceReviewers = path.match(/^\/dashboard\/conference\/(\d+)\/reviewers$/)
  if (conferenceReviewers) {
    const [, conferenceId] = conferenceReviewers
    return ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId)
  }

  const conferenceRoot = path.match(/^\/dashboard\/conference\/(\d+)$/)
  if (conferenceRoot) {
    const [, conferenceId] = conferenceRoot
    return ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId)
  }

  const reviewerPaper = path.match(/^\/dashboard\/reviewer\/papers\/(\d+)$/)
  if (reviewerPaper) {
    const [, assignmentId] = reviewerPaper
    const conferenceId =
      url.searchParams.get("conference_id") || url.searchParams.get("conferenceId")
    if (conferenceId) {
      return `${ROUTES.REVIEWER.ASSIGNMENT(assignmentId)}?conferenceId=${conferenceId}`
    }
    return ROUTES.REVIEWER.ASSIGNMENT(assignmentId)
  }

  const authorPaper = path.match(/^\/dashboard\/author\/papers\/(\d+)$/)
  if (authorPaper) {
    const [, submissionId] = authorPaper
    const conferenceId =
      url.searchParams.get("conference_id") || url.searchParams.get("conferenceId")
    if (conferenceId) {
      return `${ROUTES.AUTHOR.SUBMISSION_DETAIL(submissionId)}?conferenceId=${conferenceId}`
    }
    return ROUTES.AUTHOR.SUBMISSION_DETAIL(submissionId)
  }

  const users = path.match(/^\/dashboard\/users\/(.+)$/)
  if (users) {
    const [, userId] = users
    return ROUTES.PROFILE(decodeURIComponent(userId))
  }

  // Fallback: strip legacy dashboard prefix where possible.
  if (path === "/dashboard") {
    return ROUTES.ROLE_SELECT
  }

  return `${path.replace(LEGACY_DASHBOARD_PREFIX, "") || "/"}${toSearch(search)}`
}

import { getUserSubmissions } from "@/lib/api/submissions"

interface ResolveSubmissionConferenceInput {
  submissionId: string
  conferenceId?: string | null
  userEmail?: string | null
}

interface ResolveSubmissionConferenceResult {
  conferenceId: string | null
  source: "query" | "lookup" | "unresolved"
}

export async function resolveSubmissionConference({
  submissionId,
  conferenceId,
  userEmail,
}: ResolveSubmissionConferenceInput): Promise<ResolveSubmissionConferenceResult> {
  if (conferenceId) {
    return { conferenceId, source: "query" }
  }

  if (!userEmail) {
    return { conferenceId: null, source: "unresolved" }
  }

  const response = await getUserSubmissions(userEmail)
  if (response.error || !response.data) {
    return { conferenceId: null, source: "unresolved" }
  }

  const matched = response.data.find((item) => String(item.id) === String(submissionId))
  if (!matched) {
    return { conferenceId: null, source: "unresolved" }
  }

  return { conferenceId: String(matched.conference_id), source: "lookup" }
}

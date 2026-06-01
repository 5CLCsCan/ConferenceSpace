export type SubmissionLike = {
  id: string | number
  status?: string | null
}

export type SubmissionEligibilityInput = {
  conferenceStatus?: string | null
  fullPaperDeadline?: string | null
  submission?: SubmissionLike | null
  now?: Date
}

export type SubmissionEligibility = {
  isFullPaperDeadlinePassed: boolean
  canStartNewSubmission: boolean
  canViewExistingSubmission: boolean
  canEditExistingSubmission: boolean
  action: "submit" | "edit" | "view" | "closed"
  publicStatus: "call-for-papers" | "submission-closed" | "upcoming"
  closedReason: "new-submissions-closed" | null
}

export function isFinalSubmissionStatus(status?: string | null): boolean {
  return status === "accepted" || status === "rejected"
}

export function hasFullPaperDeadlinePassed(
  fullPaperDeadline?: string | null,
  now: Date = new Date(),
): boolean {
  if (!fullPaperDeadline) {
    return false
  }

  const deadline = new Date(fullPaperDeadline)
  return !Number.isNaN(deadline.getTime()) && now > deadline
}

export function getSubmissionEligibility({
  conferenceStatus,
  fullPaperDeadline,
  submission,
  now = new Date(),
}: SubmissionEligibilityInput): SubmissionEligibility {
  const isFullPaperDeadlinePassed = hasFullPaperDeadlinePassed(fullPaperDeadline, now)
  const canViewExistingSubmission = Boolean(submission)
  const canEditExistingSubmission =
    canViewExistingSubmission && !isFinalSubmissionStatus(submission?.status)
  const canStartNewSubmission =
    conferenceStatus === "open" && !isFullPaperDeadlinePassed && !canViewExistingSubmission

  const action = canEditExistingSubmission
    ? "edit"
    : canViewExistingSubmission
      ? "view"
      : canStartNewSubmission
        ? "submit"
        : "closed"

  const publicStatus =
    conferenceStatus === "open" && !isFullPaperDeadlinePassed
      ? "call-for-papers"
      : isFullPaperDeadlinePassed
        ? "submission-closed"
        : "upcoming"

  return {
    isFullPaperDeadlinePassed,
    canStartNewSubmission,
    canViewExistingSubmission,
    canEditExistingSubmission,
    action,
    publicStatus,
    closedReason:
      !canViewExistingSubmission && !canStartNewSubmission ? "new-submissions-closed" : null,
  }
}

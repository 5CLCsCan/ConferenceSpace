import { describe, expect, it } from "vitest"

import { getSubmissionEligibility, isFinalSubmissionStatus } from "@/lib/submission-eligibility"

const pastDeadline = "2026-04-29T00:00:00.000Z"
const futureDeadline = "2026-05-29T00:00:00.000Z"
const now = new Date("2026-05-02T12:00:00.000Z")

describe("submission eligibility", () => {
  it("blocks new submissions after the full-paper deadline", () => {
    const eligibility = getSubmissionEligibility({
      conferenceStatus: "open",
      fullPaperDeadline: pastDeadline,
      now,
    })

    expect(eligibility.isFullPaperDeadlinePassed).toBe(true)
    expect(eligibility.canStartNewSubmission).toBe(false)
    expect(eligibility.action).toBe("closed")
    expect(eligibility.publicStatus).toBe("submission-closed")
    expect(eligibility.closedReason).toBe("deadline-passed")
  })

  it("allows existing non-final submissions to be edited after the deadline", () => {
    const eligibility = getSubmissionEligibility({
      conferenceStatus: "open",
      fullPaperDeadline: pastDeadline,
      submission: { id: "42", status: "published" },
      now,
    })

    expect(eligibility.canStartNewSubmission).toBe(false)
    expect(eligibility.canEditExistingSubmission).toBe(true)
    expect(eligibility.action).toBe("edit")
  })

  it("keeps final submissions view-only after the deadline", () => {
    const eligibility = getSubmissionEligibility({
      conferenceStatus: "open",
      fullPaperDeadline: pastDeadline,
      submission: { id: "42", status: "accepted" },
      now,
    })

    expect(eligibility.canEditExistingSubmission).toBe(false)
    expect(eligibility.action).toBe("view")
  })

  it("allows new submissions only when the conference is open and the deadline has not passed", () => {
    const eligibility = getSubmissionEligibility({
      conferenceStatus: "open",
      fullPaperDeadline: futureDeadline,
      now,
    })

    expect(eligibility.canStartNewSubmission).toBe(true)
    expect(eligibility.action).toBe("submit")
    expect(eligibility.publicStatus).toBe("call-for-papers")
  })

  it("distinguishes a future-deadline conference that is not open", () => {
    const eligibility = getSubmissionEligibility({
      conferenceStatus: "draft",
      fullPaperDeadline: futureDeadline,
      now,
    })

    expect(eligibility.isFullPaperDeadlinePassed).toBe(false)
    expect(eligibility.canStartNewSubmission).toBe(false)
    expect(eligibility.action).toBe("closed")
    expect(eligibility.publicStatus).toBe("upcoming")
    expect(eligibility.closedReason).toBe("conference-not-open")
  })

  it("treats accepted and rejected as final statuses", () => {
    expect(isFinalSubmissionStatus("accepted")).toBe(true)
    expect(isFinalSubmissionStatus("rejected")).toBe(true)
    expect(isFinalSubmissionStatus("published")).toBe(false)
  })
})

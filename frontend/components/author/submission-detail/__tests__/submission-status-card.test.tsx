import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { SubmissionStatusCard } from "../overview-tab"
import type { Submission } from "@/lib/api/submissions"

const mockTranslations: Record<string, string> = {
  "runtime.components.author.submission-detail.overview-tab.text_accepted": "Accepted",
  "runtime.components.author.submission-detail.overview-tab.text_rejected": "Rejected",
  "runtime.components.author.submission-detail.overview-tab.text_expected": "Expected",
  "runtime.components.author.submission-detail.overview-tab.text_completed": "Completed",
  "runtime.components.author.submission-detail.overview-tab.text_in_progress": "In Progress",
  "runtime.components.author.submission-detail.overview-tab.text_not_configured": "Not Configured",
  "runtime.components.author.submission-detail.overview-tab.text_ends_in_days":
    "Ends in {days} days",
  "runtime.components.author.submission-detail.overview-tab.text_ends_in_day": "Ends in 1 day",
  "runtime.components.author.submission-detail.overview-tab.text_ends_in_hours":
    "Ends in {hours} hours",
  "runtime.components.author.submission-detail.overview-tab.text_ends_in_hour": "Ends in 1 hour",
  "runtime.components.author.submission-detail.overview-tab.text_ends_today": "Ends today",
  "runtime.components.author.submission-detail.overview-tab.text_starts_on": "Starts on {date}",
  "runtime.components.author.submission-detail.overview-tab.text_expected_on": "Expected {date}",
  "runtime.components.author.submission-detail.overview-tab.text_expected_after":
    "Expected after {date}",
  "runtime.components.author.submission-detail.overview-tab.text_withdrawn": "Withdrawn",
}

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      let result = mockTranslations[key] || key
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          result = result.replace(`{${k}}`, String(v)).replace(`{{${k}}}`, String(v))
        })
      }
      return result
    },
  }),
}))

const BASE_SUBMISSION: Submission = {
  id: 1,
  conference_id: 1,
  author: "Test Author",
  title: "Test Paper",
  abstract: "Abstract",
  domain: [],
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeSubmission(status: Submission["status"]): Submission {
  return { ...BASE_SUBMISSION, status }
}

// Helper: count elements with opacity-50 class (pending steps)
function pendingCount(container: HTMLElement) {
  return container.querySelectorAll(".opacity-50").length
}

// Helper: count checkmark SVGs (completed steps)
function completedCount(container: HTMLElement) {
  // each completed step renders a <path d="M5 13l4 4L19 7" />
  return container.querySelectorAll("path[d='M5 13l4 4L19 7']").length
}

// Helper: count pulsing dots (current step indicator)
function currentCount(container: HTMLElement) {
  return container.querySelectorAll(".animate-pulse").length
}

describe("SubmissionStatusCard status timeline", () => {
  it("draft: submitted is current, under_review/rebuttal/decision are pending", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("draft")} />)
    expect(completedCount(container)).toBe(0)
    expect(currentCount(container)).toBe(1)
    expect(pendingCount(container)).toBe(3)
  })

  it("published: submitted completed, under_review is current, rebuttal/decision pending", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("published")} />)
    expect(completedCount(container)).toBe(1)
    expect(currentCount(container)).toBe(1)
    expect(pendingCount(container)).toBe(2)
  })

  it("reviewing: submitted completed, under_review is current, rebuttal/decision pending", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("reviewing")} />)
    expect(completedCount(container)).toBe(1)
    expect(currentCount(container)).toBe(1)
    expect(pendingCount(container)).toBe(2)
  })

  it("accepted: all 4 steps completed, no pending or current", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("accepted")} />)
    expect(completedCount(container)).toBe(4)
    expect(currentCount(container)).toBe(0)
    expect(pendingCount(container)).toBe(0)
  })

  it("rejected: all 4 steps completed, no pending or current", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("rejected")} />)
    expect(completedCount(container)).toBe(4)
    expect(currentCount(container)).toBe(0)
    expect(pendingCount(container)).toBe(0)
  })

  it("accepted: decision date shows 'Accepted'", () => {
    render(<SubmissionStatusCard submission={makeSubmission("accepted")} />)
    expect(screen.getByText("Accepted")).toBeTruthy()
  })

  it("rejected: decision date shows 'Rejected'", () => {
    render(<SubmissionStatusCard submission={makeSubmission("rejected")} />)
    expect(screen.getByText("Rejected")).toBeTruthy()
  })

  it("reviewing: decision date shows 'Expected'", () => {
    render(<SubmissionStatusCard submission={makeSubmission("reviewing")} />)
    expect(screen.getAllByText("Expected").length).toBeGreaterThanOrEqual(1)
  })

  it("uses conference data to display relative dates", () => {
    // 1. Rebuttal in progress (ends in 3 days)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 3)
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)

    const conferenceWithRebuttal = {
      id: "conf-1",
      name: "Conference 1",
      acronym: "C1",
      year: 2026,
      description: "",
      submission_deadline: pastDate.toISOString(),
      review_deadline: futureDate.toISOString(),
      camera_ready_deadline: "",
      notification_date: futureDate.toISOString(),
      conference_date: "",
      status: "reviewing" as const,
      tracks: [],
      configurations: {
        rebuttal_settings: {
          enabled: true,
          start_at: pastDate.toISOString(),
          end_at: futureDate.toISOString(),
        },
      },
    }

    const { rerender } = render(
      <SubmissionStatusCard
        submission={makeSubmission("reviewing")}
        conference={conferenceWithRebuttal}
      />,
    )

    // Should display rebuttal ends in 3 days
    expect(screen.getByText("Ends in 3 days")).toBeTruthy()

    // 2. Rebuttal not configured
    const conferenceNoRebuttal = {
      ...conferenceWithRebuttal,
      configurations: {
        rebuttal_settings: {
          enabled: false,
        },
      },
    }

    rerender(
      <SubmissionStatusCard
        submission={makeSubmission("reviewing")}
        conference={conferenceNoRebuttal}
      />,
    )

    expect(screen.getByText("Not Configured")).toBeTruthy()
  })
})

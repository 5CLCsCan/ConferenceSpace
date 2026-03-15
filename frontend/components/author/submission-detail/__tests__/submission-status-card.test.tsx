import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { SubmissionStatusCard } from "../overview-tab"
import type { Submission } from "@/lib/api/submissions"

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
  it("draft: submitted is current, bidding/rebuttal/decision are pending", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("draft")} />)
    expect(completedCount(container)).toBe(0)
    expect(currentCount(container)).toBe(1)
    expect(pendingCount(container)).toBe(3)
  })

  it("published: submitted completed, bidding is current, rebuttal/decision pending", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("published")} />)
    expect(completedCount(container)).toBe(1)
    expect(currentCount(container)).toBe(1)
    expect(pendingCount(container)).toBe(2)
  })

  it("reviewing: submitted+bidding completed, rebuttal is current, decision pending", () => {
    const { container } = render(<SubmissionStatusCard submission={makeSubmission("reviewing")} />)
    expect(completedCount(container)).toBe(2)
    expect(currentCount(container)).toBe(1)
    expect(pendingCount(container)).toBe(1)
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
    expect(screen.getByText("Expected")).toBeTruthy()
  })
})

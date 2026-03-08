import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import React from "react"

// Mock the rebuttal API module
vi.mock("@/lib/api/rebuttal", () => ({
  getRebuttal: vi.fn(),
  acknowledgePoint: vi.fn(),
}))

// Mock translation context
vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock the shared RebuttalPanel — captures onPointStatusChange to trigger it in tests
let capturedOnPointStatusChange: ((pointId: string, status: string, note?: string) => void) | null =
  null

vi.mock("@/components/shared/rebuttal", () => ({
  RebuttalPanel: ({
    settings,
    reviewers,
    points,
    submission,
    userRole,
    onSubmitRebuttal,
    onPointStatusChange,
    readOnly,
  }: any) => {
    capturedOnPointStatusChange = onPointStatusChange ?? null
    return (
      <div
        data-testid="rebuttal-panel"
        data-role={userRole}
        data-points={points?.length}
        data-reviewers={reviewers?.length}
        data-read-only={String(readOnly ?? false)}
      />
    )
  },
}))

import * as rebuttalApi from "@/lib/api/rebuttal"
import { RebuttalTab } from "../rebuttal-tab"

const mockGetRebuttal = rebuttalApi.getRebuttal as ReturnType<typeof vi.fn>
const mockAcknowledgePoint = rebuttalApi.acknowledgePoint as ReturnType<typeof vi.fn>

const SUBMITTED_DATA = {
  settings: { phase: "submitted", conferenceId: "1", submissionId: "10" },
  reviewers: [
    { id: "42", anonymousId: "Reviewer #1", isCurrentUser: true },
    { id: "99", anonymousId: "Reviewer #2", isCurrentUser: false },
  ],
  points: [
    {
      id: "p1",
      reviewerId: "42",
      category: "weakness",
      section: "Weaknesses",
      originalComment: "Insufficient ablation.",
      authorResponse: "We added Table 5.",
      status: "pending_review",
      reviewerAcknowledged: false,
    },
  ],
  submission: {
    generalResponse: { content: "We thank the reviewers." },
  },
}

beforeEach(() => {
  mockGetRebuttal.mockReset()
  mockAcknowledgePoint.mockReset()
  capturedOnPointStatusChange = null
})

describe("Reviewer RebuttalTab", () => {
  it("shows loading state initially", () => {
    mockGetRebuttal.mockReturnValue(new Promise(() => {}))

    render(<RebuttalTab conferenceId="1" submissionId="10" assignmentId="42" />)

    expect(screen.getByText(/loading rebuttal/i)).toBeInTheDocument()
  })

  it("calls getRebuttal with conferenceId, submissionId, AND assignmentId", async () => {
    mockGetRebuttal.mockResolvedValue({ data: SUBMITTED_DATA, error: null })

    render(<RebuttalTab conferenceId="1" submissionId="10" assignmentId="42" />)

    await waitFor(() => {
      expect(mockGetRebuttal).toHaveBeenCalledWith("1", "10", "42")
    })
  })

  it("renders RebuttalPanel with reviewers (not empty array) after load", async () => {
    mockGetRebuttal.mockResolvedValue({ data: SUBMITTED_DATA, error: null })

    render(<RebuttalTab conferenceId="1" submissionId="10" assignmentId="42" />)

    await waitFor(() => {
      const panel = screen.getByTestId("rebuttal-panel")
      expect(panel).toBeInTheDocument()
      // reviewers has 2 entries
      expect(panel.getAttribute("data-reviewers")).toBe("2")
    })
  })

  it("calls acknowledgePoint with correct args when onPointStatusChange fires", async () => {
    mockGetRebuttal.mockResolvedValue({ data: SUBMITTED_DATA, error: null })
    mockAcknowledgePoint.mockResolvedValue({ data: {}, error: null })

    render(<RebuttalTab conferenceId="1" submissionId="10" assignmentId="42" />)

    await waitFor(() => {
      expect(screen.getByTestId("rebuttal-panel")).toBeInTheDocument()
    })

    // Trigger the onPointStatusChange callback captured from RebuttalPanel
    expect(capturedOnPointStatusChange).not.toBeNull()
    await act(async () => {
      capturedOnPointStatusChange!("p1", "addressed", "Good response.")
    })

    expect(mockAcknowledgePoint).toHaveBeenCalledWith(
      "1",
      "42",
      "p1",
      "addressed",
      "Good response.",
    )
  })
})

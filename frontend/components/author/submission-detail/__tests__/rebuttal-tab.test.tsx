import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import React from "react"

// Mock the rebuttal API module
vi.mock("@/lib/api/rebuttal", () => ({
  getRebuttal: vi.fn(),
  submitRebuttal: vi.fn(),
}))

// Mock translation context
vi.mock("@/lib/i18n/translation-context", async () => {
  const { tStatic } = await vi.importActual<typeof import("@/lib/i18n/static-translate")>(
    "@/lib/i18n/static-translate",
  )

  return {
    useTranslation: () => ({ t: tStatic }),
  }
})

// Mock the shared RebuttalPanel.
//
// Post-8af09fb the submit button lives inside RebuttalPanel (in its ActionBar),
// not inside RebuttalTab, and submission is delegated via onSubmitRebuttal. The
// real panel calls back with `{ generalResponse: "", perReviewerResponses: [], points }`
// — RebuttalTab uses its own ref for the actual general response. We mirror that
// shape here so click-driven tests can exercise the parent's handleSubmit.
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
  }: any) => (
    <div
      data-testid="rebuttal-panel"
      data-role={userRole}
      data-points={points?.length}
      data-reviewers={reviewers?.length}
      data-read-only={String(readOnly ?? false)}
    >
      {!readOnly && onSubmitRebuttal && (
        <button
          type="button"
          onClick={() =>
            onSubmitRebuttal({
              generalResponse: "",
              perReviewerResponses: [],
              points: points ?? [],
            })
          }
        >
          Submit Rebuttal
        </button>
      )}
    </div>
  ),
}))

import * as rebuttalApi from "@/lib/api/rebuttal"
import { RebuttalTab } from "../rebuttal-tab"

const mockGetRebuttal = rebuttalApi.getRebuttal as ReturnType<typeof vi.fn>
const mockSubmitRebuttal = rebuttalApi.submitRebuttal as ReturnType<typeof vi.fn>

const AWAITING_DATA = {
  settings: { phase: "awaiting", conferenceId: "1", submissionId: "10" },
  reviewers: [],
  points: [],
  submission: null,
}

const SUBMITTED_DATA = {
  settings: { phase: "submitted", conferenceId: "1", submissionId: "10" },
  reviewers: [{ id: "42", anonymousId: "Reviewer #1", isCurrentUser: false }],
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
  mockSubmitRebuttal.mockReset()
})

describe("Author RebuttalTab", () => {
  it("shows loading state initially", () => {
    // getRebuttal never resolves during this test
    mockGetRebuttal.mockReturnValue(new Promise(() => {}))

    render(<RebuttalTab conferenceId="1" submissionId="10" />)

    expect(screen.getByText(/loading rebuttal/i)).toBeInTheDocument()
  })

  it("shows error if getRebuttal fails", async () => {
    mockGetRebuttal.mockResolvedValue({ data: null, error: "Failed to load" })

    render(<RebuttalTab conferenceId="1" submissionId="10" />)

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument()
    })
  })

  it("shows textarea for general response when phase=awaiting", async () => {
    mockGetRebuttal.mockResolvedValue({ data: AWAITING_DATA, error: null })

    render(<RebuttalTab conferenceId="1" submissionId="10" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write your general response/i)).toBeInTheDocument()
    })
  })

  it("hides submit textarea when phase=submitted (shows read-only panel)", async () => {
    mockGetRebuttal.mockResolvedValue({ data: SUBMITTED_DATA, error: null })

    render(<RebuttalTab conferenceId="1" submissionId="10" />)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/write your general response/i)).not.toBeInTheDocument()
    })

    // RebuttalPanel should be rendered with readOnly=true
    const panel = screen.getByTestId("rebuttal-panel")
    expect(panel.getAttribute("data-read-only")).toBe("true")
  })

  it("calls submitRebuttal with the typed general_response text when submit button clicked", async () => {
    mockGetRebuttal.mockResolvedValue({ data: AWAITING_DATA, error: null })
    mockSubmitRebuttal.mockResolvedValue({ data: {}, error: null })
    // Second call after reload
    mockGetRebuttal.mockResolvedValueOnce({ data: AWAITING_DATA, error: null })

    render(<RebuttalTab conferenceId="1" submissionId="10" />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write your general response/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/write your general response/i)
    fireEvent.change(textarea, { target: { value: "Our detailed response to reviewers." } })

    const submitBtn = screen.getByRole("button", { name: /submit rebuttal/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockSubmitRebuttal).toHaveBeenCalledWith(
        "1",
        "10",
        expect.objectContaining({
          generalResponse: "Our detailed response to reviewers.",
        }),
      )
    })
  })

})

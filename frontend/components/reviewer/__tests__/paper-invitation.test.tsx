import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PaperInvitation } from "../paper-invitation"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ assignmentId: "42" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

// Mock auth context
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { email: "reviewer@example.com" } }),
}))

// Mock API functions
vi.mock("@/lib/api/suggestions", () => ({
  getInvitation: vi.fn(),
  respondToInvitation: vi.fn(),
}))

import { getInvitation, respondToInvitation } from "@/lib/api/suggestions"

const mockInvitationBase = {
  assignment_id: 42,
  status: "pending",
  paper_title: "Advances in Neural Architecture Search",
  paper_abstract: "We present a novel approach to neural architecture search using evolutionary algorithms.",
  conference_name: "ICLR 2026",
  evidence: null,
}

describe("PaperInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders evidence card with full metadata", async () => {
    const score = 0.72
    vi.mocked(getInvitation).mockResolvedValue({
      data: {
        ...mockInvitationBase,
        evidence: {
          matched_keywords: ["NLP", "transformers"],
          score,
          assignment_count: 2,
        },
      },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => {
      expect(screen.getByText("Advances in Neural Architecture Search")).toBeInTheDocument()
    })

    expect(screen.getByText("NLP")).toBeInTheDocument()
    expect(screen.getByText("transformers")).toBeInTheDocument()
    expect(screen.getByText("72%")).toBeInTheDocument()
    expect(screen.getByText(/2 papers/)).toBeInTheDocument()
  })

  it("hides score when below 50% threshold (server returns null)", async () => {
    vi.mocked(getInvitation).mockResolvedValue({
      data: {
        ...mockInvitationBase,
        evidence: {
          matched_keywords: ["NLP"],
          score: null,
          assignment_count: 1,
        },
      },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => {
      expect(screen.getByText("NLP")).toBeInTheDocument()
    })

    expect(screen.queryByText(/%/)).toBeNull()
  })

  it("shows fallback text when no metadata", async () => {
    vi.mocked(getInvitation).mockResolvedValue({
      data: {
        ...mockInvitationBase,
        evidence: {
          matched_keywords: [],
          score: null,
          assignment_count: 0,
        },
      },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => {
      expect(
        screen.getByText(/You were selected by the program committee/i),
      ).toBeInTheDocument()
    })
  })

  it("accept button calls API and shows success", async () => {
    vi.mocked(getInvitation).mockResolvedValue({
      data: { ...mockInvitationBase, evidence: null },
      error: null,
      status: 200,
    })
    vi.mocked(respondToInvitation).mockResolvedValue({
      data: { assignment_id: 42, status: "accepted", message: "Assignment accepted successfully" },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => {
      expect(screen.getByText("Accept Assignment")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Accept Assignment"))

    await waitFor(() => {
      expect(respondToInvitation).toHaveBeenCalledWith(
        "reviewer@example.com",
        42,
        expect.objectContaining({ action: "accept" }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Go to Review")).toBeInTheDocument()
    })
  })

  it("decline flow shows chip dialog", async () => {
    vi.mocked(getInvitation).mockResolvedValue({
      data: { ...mockInvitationBase, evidence: null },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => {
      expect(screen.getByText("Decline")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Decline"))

    await waitFor(() => {
      expect(screen.getByText("Not my expertise")).toBeInTheDocument()
      expect(screen.getByText("Too busy")).toBeInTheDocument()
      expect(screen.getByText("Schedule conflict")).toBeInTheDocument()
      expect(screen.getByText("Conflict of interest")).toBeInTheDocument()
    })
  })

  it("clicking decline chip fills category", async () => {
    vi.mocked(getInvitation).mockResolvedValue({
      data: { ...mockInvitationBase, evidence: null },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => {
      expect(screen.getByText("Decline")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Decline"))

    await waitFor(() => {
      expect(screen.getByText("Too busy")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Too busy"))

    const tooBusyChip = screen.getByText("Too busy")
    expect(tooBusyChip.closest("button")).toHaveClass("bg-[#1B3C53]")
  })

  it("decline submits with reason", async () => {
    vi.mocked(getInvitation).mockResolvedValue({
      data: { ...mockInvitationBase, evidence: null },
      error: null,
      status: 200,
    })
    vi.mocked(respondToInvitation).mockResolvedValue({
      data: { assignment_id: 42, status: "declined", message: "Assignment declined" },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => expect(screen.getByText("Decline")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Decline"))

    await waitFor(() => expect(screen.getByText("Too busy")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Too busy"))

    const textarea = screen.getByPlaceholderText(/Additional comments/i)
    fireEvent.change(textarea, { target: { value: "Taking a sabbatical" } })

    fireEvent.click(screen.getByText("Confirm Decline"))

    await waitFor(() => {
      expect(respondToInvitation).toHaveBeenCalledWith(
        "reviewer@example.com",
        42,
        expect.objectContaining({
          action: "decline",
          decline_category: "too_busy",
          decline_reason: "Taking a sabbatical",
        }),
      )
    })
  })

  it("decline without reason works", async () => {
    vi.mocked(getInvitation).mockResolvedValue({
      data: { ...mockInvitationBase, evidence: null },
      error: null,
      status: 200,
    })
    vi.mocked(respondToInvitation).mockResolvedValue({
      data: { assignment_id: 42, status: "declined", message: "Assignment declined" },
      error: null,
      status: 200,
    })

    render(<PaperInvitation />)

    await waitFor(() => expect(screen.getByText("Decline")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Decline"))

    await waitFor(() => expect(screen.getByText("Confirm Decline")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Confirm Decline"))

    await waitFor(() => {
      expect(respondToInvitation).toHaveBeenCalledWith(
        "reviewer@example.com",
        42,
        expect.objectContaining({ action: "decline" }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Assignment declined")).toBeInTheDocument()
    })
  })
})

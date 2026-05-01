import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { InvitationDialog } from "../invitation-dialog"

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { email: "reviewer@example.com" } }),
}))

vi.mock("@/lib/api/suggestions", () => ({
  getInvitation: vi.fn(),
  respondToInvitation: vi.fn(),
}))

import { getInvitation, respondToInvitation } from "@/lib/api/suggestions"

const mockInvitationBase = {
  assignment_id: 42,
  status: "pending",
  paper_title: "Advances in Neural Architecture Search",
  paper_abstract: "We present a novel approach to neural architecture search.",
  conference_name: "ICLR 2026",
  evidence: null as any,
}

const mockInvitationWithEvidence = {
  ...mockInvitationBase,
  evidence: {
    matched_keywords: ["NLP", "transformers"],
    score: 0.72,
    assignment_count: 2,
  },
}

function renderDialog(
  props: { assignmentId?: number | null; open?: boolean } = {},
) {
  const onClose = vi.fn()
  const onResponded = vi.fn()
  const utils = render(
    <InvitationDialog
      assignmentId={"assignmentId" in props ? (props.assignmentId as number | null) : 42}
      open={props.open ?? true}
      onClose={onClose}
      onResponded={onResponded}
    />,
  )
  return { ...utils, onClose, onResponded }
}

describe("InvitationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("rendering", () => {
    it("does not fetch when open is false", () => {
      renderDialog({ open: false })
      expect(getInvitation).not.toHaveBeenCalled()
    })

    it("does not fetch when assignmentId is null", () => {
      renderDialog({ assignmentId: null })
      expect(getInvitation).not.toHaveBeenCalled()
    })

    it("fetches invitation data when opened", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })

      renderDialog()

      await waitFor(() => {
        expect(getInvitation).toHaveBeenCalledWith("reviewer@example.com", 42)
      })
    })

    it("renders evidence card with full metadata", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationWithEvidence,
        error: null,
        status: 200,
      })

      renderDialog()

      await waitFor(() => {
        expect(
          screen.getByText("Advances in Neural Architecture Search"),
        ).toBeInTheDocument()
      })
      expect(screen.getByText("NLP")).toBeInTheDocument()
      expect(screen.getByText("transformers")).toBeInTheDocument()
      expect(screen.getByText("72%")).toBeInTheDocument()
      expect(screen.getByText(/2 papers/)).toBeInTheDocument()
    })

    it("hides score when score is null", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: {
          ...mockInvitationBase,
          evidence: { matched_keywords: ["NLP"], score: null, assignment_count: 1 },
        },
        error: null,
        status: 200,
      })

      renderDialog()

      await waitFor(() => expect(screen.getByText("NLP")).toBeInTheDocument())
      expect(screen.queryByText(/%/)).toBeNull()
    })

    it("shows fallback text when evidence has no matched keywords and no score", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: {
          ...mockInvitationBase,
          evidence: { matched_keywords: [], score: null, assignment_count: 0 },
        },
        error: null,
        status: 200,
      })

      renderDialog()

      await waitFor(() =>
        expect(
          screen.getByText(/You were selected by the program committee/i),
        ).toBeInTheDocument(),
      )
    })

    it("shows error state when fetch fails", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: null,
        error: "network down",
        status: 500,
      })

      renderDialog()

      await waitFor(() => expect(screen.getByText("network down")).toBeInTheDocument())
      expect(screen.getByText("Failed to load")).toBeInTheDocument()
    })
  })

  describe("accept flow", () => {
    it("calls API and invokes onResponded + onClose on success", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })
      vi.mocked(respondToInvitation).mockResolvedValue({
        data: { assignment_id: 42, status: "accepted", message: "ok" },
        error: null,
        status: 200,
      })

      const { onResponded, onClose } = renderDialog()

      await waitFor(() =>
        expect(screen.getByText("Accept Assignment")).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByText("Accept Assignment"))

      await waitFor(() => {
        expect(respondToInvitation).toHaveBeenCalledWith(
          "reviewer@example.com",
          42,
          { action: "accept" },
        )
      })
      await waitFor(() => {
        expect(onResponded).toHaveBeenCalledWith(42, "accepted")
        expect(onClose).toHaveBeenCalled()
      })
    })

    it("shows inline error and stays open on accept failure", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })
      vi.mocked(respondToInvitation).mockResolvedValue({
        data: null,
        error: "server boom",
        status: 500,
      })

      const { onResponded, onClose } = renderDialog()

      await waitFor(() =>
        expect(screen.getByText("Accept Assignment")).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByText("Accept Assignment"))

      await waitFor(() => expect(screen.getByText("server boom")).toBeInTheDocument())
      expect(onResponded).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
      // Buttons are still visible
      expect(screen.getByText("Accept Assignment")).toBeInTheDocument()
    })
  })

  describe("decline flow", () => {
    it("opens decline form with five category chips", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })

      renderDialog()

      await waitFor(() => expect(screen.getByText("Decline")).toBeInTheDocument())
      fireEvent.click(screen.getByText("Decline"))

      await waitFor(() => {
        expect(screen.getByText("Not my expertise")).toBeInTheDocument()
        expect(screen.getByText("Too busy")).toBeInTheDocument()
        expect(screen.getByText("Schedule conflict")).toBeInTheDocument()
        expect(screen.getByText("Conflict of interest")).toBeInTheDocument()
        expect(screen.getByText("Other")).toBeInTheDocument()
      })
    })

    it("clicking a category chip selects it (visual state)", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })

      renderDialog()

      await waitFor(() => expect(screen.getByText("Decline")).toBeInTheDocument())
      fireEvent.click(screen.getByText("Decline"))
      await waitFor(() => expect(screen.getByText("Too busy")).toBeInTheDocument())

      fireEvent.click(screen.getByText("Too busy"))
      const tooBusyChip = screen.getByText("Too busy")
      expect(tooBusyChip.closest("button")).toHaveClass("bg-[#1B3C53]")
    })

    it("submits decline with category + reason and invokes callbacks", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })
      vi.mocked(respondToInvitation).mockResolvedValue({
        data: { assignment_id: 42, status: "declined", message: "ok" },
        error: null,
        status: 200,
      })

      const { onResponded, onClose } = renderDialog()

      await waitFor(() => expect(screen.getByText("Decline")).toBeInTheDocument())
      fireEvent.click(screen.getByText("Decline"))
      await waitFor(() => expect(screen.getByText("Too busy")).toBeInTheDocument())
      fireEvent.click(screen.getByText("Too busy"))
      const textarea = screen.getByPlaceholderText(/Additional comments/i)
      fireEvent.change(textarea, { target: { value: "Sabbatical" } })

      fireEvent.click(screen.getByText("Confirm Decline"))

      await waitFor(() =>
        expect(respondToInvitation).toHaveBeenCalledWith(
          "reviewer@example.com",
          42,
          expect.objectContaining({
            action: "decline",
            decline_category: "too_busy",
            decline_reason: "Sabbatical",
          }),
        ),
      )
      await waitFor(() => {
        expect(onResponded).toHaveBeenCalledWith(42, "declined")
        expect(onClose).toHaveBeenCalled()
      })
    })

    it("decline without category or reason still works", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })
      vi.mocked(respondToInvitation).mockResolvedValue({
        data: { assignment_id: 42, status: "declined", message: "ok" },
        error: null,
        status: 200,
      })

      const { onResponded } = renderDialog()

      await waitFor(() => expect(screen.getByText("Decline")).toBeInTheDocument())
      fireEvent.click(screen.getByText("Decline"))
      await waitFor(() =>
        expect(screen.getByText("Confirm Decline")).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByText("Confirm Decline"))

      await waitFor(() => {
        const call = vi.mocked(respondToInvitation).mock.calls[0]
        expect(call[2].action).toBe("decline")
        expect(call[2].decline_category).toBeUndefined()
        expect(call[2].decline_reason).toBeUndefined()
      })
      await waitFor(() => expect(onResponded).toHaveBeenCalledWith(42, "declined"))
    })

    it("Cancel returns to pending state and clears submit error", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })
      vi.mocked(respondToInvitation).mockResolvedValue({
        data: null,
        error: "boom",
        status: 500,
      })

      renderDialog()

      await waitFor(() => expect(screen.getByText("Decline")).toBeInTheDocument())
      fireEvent.click(screen.getByText("Decline"))
      await waitFor(() =>
        expect(screen.getByText("Confirm Decline")).toBeInTheDocument(),
      )

      fireEvent.click(screen.getByText("Confirm Decline"))
      await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument())

      fireEvent.click(screen.getByText("Cancel"))

      await waitFor(() =>
        expect(screen.getByText("Accept Assignment")).toBeInTheDocument(),
      )
      expect(screen.queryByText("boom")).toBeNull()
    })
  })

  describe("submitting state", () => {
    it("keeps both buttons visible and disabled during accept", async () => {
      vi.mocked(getInvitation).mockResolvedValue({
        data: mockInvitationBase,
        error: null,
        status: 200,
      })
      let resolveAccept: (val: any) => void = () => {}
      vi.mocked(respondToInvitation).mockImplementationOnce(
        () =>
          new Promise((res) => {
            resolveAccept = res
          }),
      )

      renderDialog()

      await waitFor(() =>
        expect(screen.getByText("Accept Assignment")).toBeInTheDocument(),
      )
      fireEvent.click(screen.getByText("Accept Assignment"))

      await waitFor(() => {
        const acceptBtn = screen.getByText("Accept Assignment").closest("button")
        const declineBtn = screen.getByText("Decline").closest("button")
        expect(acceptBtn).toBeDisabled()
        expect(declineBtn).toBeDisabled()
      })

      // Resolve so React doesn't warn about unsettled promises
      resolveAccept({
        data: { assignment_id: 42, status: "accepted", message: "ok" },
        error: null,
        status: 200,
      })
    })
  })
})

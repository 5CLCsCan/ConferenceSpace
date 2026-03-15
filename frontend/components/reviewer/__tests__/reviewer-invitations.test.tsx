import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ReviewerInvitations } from "../reviewer-invitations"

vi.mock("@/lib/i18n/translation-context", async () => {
  const { tStatic } = await vi.importActual<typeof import("@/lib/i18n/static-translate")>(
    "@/lib/i18n/static-translate",
  )

  return {
    useTranslation: () => ({
      locale: "en",
      messages: {},
      setLocale: vi.fn(),
      t: tStatic,
      tList: () => [],
    }),
  }
})

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/api/reviewer", () => ({
  respondToReviewRequest: vi.fn(),
}))

const rejectedInvitation = {
  id: "inv-1",
  conference_id: "conf-1",
  conference_name: "ECCV 2026",
  conference_acronym: "ECCV",
  requested_by: "chair@example.com",
  requested_by_name: "Chair",
  requested_at: "2026-03-01T08:00:00Z",
  status: "rejected" as const,
  expertise_match: 0.9,
  papers_count: 3,
  estimated_hours: 9,
  conflict_of_interest: false,
  declined_on: "2026-03-02T08:00:00Z",
}

describe("ReviewerInvitations", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => "en"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    })
  })

  it("emits the backend-compatible rejected filter when the declined tab is clicked", () => {
    const onStatusFilterChange = vi.fn()

    render(
      <ReviewerInvitations
        invitations={[]}
        onInvitationHandled={vi.fn()}
        reviewerId="reviewer@example.com"
        currentStatusFilter="all"
        onStatusFilterChange={onStatusFilterChange}
        statusCounts={{ all: 1, pending: 0, accepted: 0, rejected: 1 }}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /declined/i }))

    expect(onStatusFilterChange).toHaveBeenCalledWith("rejected")
  })

  it("renders rejected invitations in the read-only rejected state", () => {
    render(
      <ReviewerInvitations
        invitations={[rejectedInvitation]}
        onInvitationHandled={vi.fn()}
        reviewerId="reviewer@example.com"
        currentStatusFilter="rejected"
        statusCounts={{ all: 1, pending: 0, accepted: 0, rejected: 1 }}
      />,
    )

    expect(screen.getByText("No actions available")).toBeInTheDocument()
    expect(
      screen.queryByText(/You have been invited to serve as a reviewer/i),
    ).not.toBeInTheDocument()
  })
})

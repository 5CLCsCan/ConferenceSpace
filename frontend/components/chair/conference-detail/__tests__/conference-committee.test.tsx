import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { ConferenceCommittee } from "../conference-committee"

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

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(() => ({ currentRole: "chair" })),
}))

vi.mock("@/lib/api/conferences", () => ({
  getConferenceById: vi.fn(async () => ({
    data: {
      id: "1",
      name: "Test Conference",
      chair: "chair@example.com",
      co_chairs: ["cochair@example.com"],
      pc_members: ["pc@example.com"],
      status: "open",
      tracks: [],
    },
    error: null,
    status: 200,
  })),
  getConferenceReviewers: vi.fn(async () => ({
    data: {
      reviewers: [
        {
          id: 99,
          user_id: 2,
          conference_id: 1,
          email: "reviewer@example.com",
          first_name: "reviewer",
          last_name: "User",
          status: "pending",
          domain: ["AI"],
        },
      ],
      total: 1,
      limit: 200,
      offset: 0,
    },
    error: null,
    status: 200,
  })),
  inviteReviewers: vi.fn(async () => ({
    data: { success: [], failed: [] },
    error: null,
    status: 200,
  })),
  removeReviewer: vi.fn(async () => ({ data: {}, error: null, status: 200 })),
  updateConference: vi.fn(async () => ({ data: {}, error: null, status: 200 })),
}))

vi.mock("@/lib/api/user", () => ({
  userApi: {
    getByEmail: vi.fn(async (email: string) => ({
      data: {
        data: {
          id: 1,
          email,
          first_name: email.split("@")[0],
          last_name: "User",
          domain: [],
        },
      },
    })),
  },
}))

describe("ConferenceCommittee", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders committee management with chairs and PC members", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText("Committee Members")).toBeInTheDocument()
    expect(screen.getByText("Total Members")).toBeInTheDocument()
    expect(screen.getByText("PC Members")).toBeInTheDocument()
    expect(screen.getByText("Reviewers")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Import CSV/i })).toBeInTheDocument()
  })

  it("shows chair, co-chair, pc member, and reviewer in the table", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText("chair@example.com")).toBeInTheDocument()
    expect(screen.getByText("cochair@example.com")).toBeInTheDocument()
    expect(screen.getByText("pc@example.com")).toBeInTheDocument()
    expect(screen.getByText("reviewer@example.com")).toBeInTheDocument()
  })

  it("displays correct role badges for each member type", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    const badges = screen.getAllByText(/^(Chair|Co-Chair|Program Committee|Reviewer)$/)
    const badgeLabels = badges
      .filter((el) => el.tagName === "SPAN" && el.className.includes("rounded-full"))
      .map((el) => el.textContent)

    expect(badgeLabels).toContain("Chair")
    expect(badgeLabels).toContain("Co-Chair")
    expect(badgeLabels).toContain("Program Committee")
    expect(badgeLabels).toContain("Reviewer")
  })

  it("shows reviewer invitation details", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getAllByText("Reviewer").length).toBeGreaterThan(0)
    expect(screen.getByText(/invitation: pending/i)).toBeInTheDocument()
  })

  it("shows correct stat card counts", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    const totalMembersCard = screen.getByText("Total Members").closest("div")!
    expect(totalMembersCard.parentElement!.textContent).toContain("4")

    const chairsCard = screen.getByText("Chairs").closest("div")!
    expect(chairsCard.parentElement!.textContent).toContain("2")

    const pcCard = screen.getByText("PC Members").closest("div")!
    expect(pcCard.parentElement!.textContent).toContain("1")

    const reviewerCard = screen.getByText("Reviewers").closest("div")!
    expect(reviewerCard.parentElement!.textContent).toContain("1")
  })

  it("has role filter with reviewer option", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[]
    const roleFilterSelect = selects.find((select) =>
      Array.from(select.options).some((option) => option.value === "all"),
    )
    expect(roleFilterSelect).toBeDefined()

    const options = Array.from(roleFilterSelect!.options).map((o) => o.value)

    expect(options).toContain("all")
    expect(options).toContain("chair")
    expect(options).toContain("co_chair")
    expect(options).toContain("pc")
    expect(options).toContain("reviewer")
  })
})

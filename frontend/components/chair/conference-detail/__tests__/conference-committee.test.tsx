import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { ConferenceCommittee } from "../conference-committee"
import { getConferenceById, getConferenceReviewers } from "@/lib/api/conferences"
import { searchUsersForConference } from "@/lib/api/user"

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
  searchUsersForConference: vi.fn(async () => ({
    data: { users: [], total: 0 },
    error: null,
  })),
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

describe("ConferenceCommittee — Add Member search dropdown match evidence", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
    vi.clearAllMocks()
    // Override the getConferenceById default with a conference that has domains.
    ;(getConferenceById as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: "1",
        name: "Test Conference",
        chair: "chair@example.com",
        co_chairs: [],
        pc_members: [],
        status: "open",
        tracks: [],
        domain: ["AI", "ML"],
      },
      error: null,
      status: 200,
    })
    ;(getConferenceReviewers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reviewers: [], total: 0, limit: 200, offset: 0 },
      error: null,
      status: 200,
    })
  })

  function selectRole(role: "pc" | "reviewer") {
    // The role <select> sits next to the search input; values are "pc" /
    // "reviewer" with display labels "Program Committee" / "Reviewer".
    const select = screen.getByDisplayValue(/Program Committee|Reviewer/i) as HTMLSelectElement
    fireEvent.change(select, { target: { value: role } })
    return select
  }

  async function setupAndOpenSearch(
    searchValue: string,
    options: { role?: "pc" | "reviewer" } = {},
  ) {
    const { role = "reviewer" } = options
    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })
    if (role !== "pc") {
      // Default role is "pc" which suppresses match evidence; flip it before
      // typing so the search call carries `conference_id`.
      selectRole(role)
    }
    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: searchValue } })
    // Debounce in handleSearch is 300ms internally; let it settle.
    await waitFor(
      () => {
        expect(searchUsersForConference).toHaveBeenCalled()
      },
      { timeout: 1500 },
    )
    return input
  }

  it("renders matched-field chips green and unmatched chips grey", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 10,
            email: "alice@x.edu",
            first_name: "Alice",
            last_name: "Smith",
            domain: ["AI", "Robotics"],
            matched_fields: ["ai"],
            score: 33,
          },
        ],
        total: 1,
      },
      error: null,
    })

    await setupAndOpenSearch("alice")

    await waitFor(() => {
      expect(screen.getByText("alice@x.edu")).toBeInTheDocument()
    })

    const aiChip = screen.getByText("AI")
    const roboChip = screen.getByText("Robotics")
    expect(aiChip.className).toContain("emerald")
    expect(roboChip.className).toContain("slate")
  })

  it("renders no chip strip when the user has no domains", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 11,
            email: "bare@x.edu",
            first_name: "Bare",
            last_name: "Person",
            domain: [],
          },
        ],
        total: 1,
      },
      error: null,
    })

    await setupAndOpenSearch("bare")

    await waitFor(() => {
      expect(screen.getByText("bare@x.edu")).toBeInTheDocument()
    })

    // No emerald or slate chips for this row.
    expect(screen.queryByText("AI")).not.toBeInTheDocument()
  })

  it("excludes users who are already on the committee", async () => {
    ;(getConferenceById as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: "1",
        name: "Test Conference",
        chair: "chair@example.com",
        co_chairs: [],
        pc_members: ["pc@example.com"],
        status: "open",
        tracks: [],
        domain: ["AI"],
      },
      error: null,
      status: 200,
    })
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 1,
            email: "pc@example.com",
            first_name: "Existing",
            last_name: "PC",
            domain: ["AI"],
            matched_fields: ["ai"],
            score: 100,
          },
          {
            id: 2,
            email: "newcomer@x.edu",
            first_name: "New",
            last_name: "Comer",
            domain: ["AI"],
            matched_fields: ["ai"],
            score: 100,
          },
        ],
        total: 2,
      },
      error: null,
    })

    await setupAndOpenSearch("@example.com")

    await waitFor(() => {
      expect(screen.getByText("newcomer@x.edu")).toBeInTheDocument()
    })

    // The existing PC member's email appears in the table; assert it is NOT
    // present inside the search dropdown panel itself.
    const dropdown = screen.getByText("newcomer@x.edu").closest("div.absolute") as HTMLElement
    expect(dropdown).not.toBeNull()
    expect(within(dropdown).queryByText("pc@example.com")).not.toBeInTheDocument()
  })

  it("passes the conference id when adding a reviewer", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { users: [], total: 0 },
      error: null,
    })

    await setupAndOpenSearch("hello", { role: "reviewer" })

    expect(searchUsersForConference).toHaveBeenCalledWith("hello", "1", 10)
  })

  it("omits the conference id when adding a non-reviewer (PC) member", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { users: [], total: 0 },
      error: null,
    })

    // PC role is the default — match evidence is irrelevant for committee
    // adds, so the helper must be called WITHOUT a conference id.
    await setupAndOpenSearch("hello", { role: "pc" })

    expect(searchUsersForConference).toHaveBeenCalledWith("hello", null, 10)
  })

  it("hides match evidence (chips, label, tooltip) for non-reviewer roles", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 21,
            email: "pcadd@x.edu",
            first_name: "PC",
            last_name: "Add",
            domain: ["AI", "Robotics"],
            // Backend wouldn't actually annotate without a conference_id, but
            // even if it did, evidence must stay hidden in PC role.
            matched_fields: ["ai"],
            score: 33,
          },
        ],
        total: 1,
      },
      error: null,
    })

    await setupAndOpenSearch("pcadd", { role: "pc" })

    await waitFor(() => {
      expect(screen.getByText("pcadd@x.edu")).toBeInTheDocument()
    })

    // No green chips, no label, no tooltip — just plain expertise info.
    expect(screen.getByText("AI").className).toContain("slate")
    expect(screen.getByText("Robotics").className).toContain("slate")
    expect(screen.getByText("AI")).not.toHaveAttribute("title")
    expect(screen.queryByTestId("match-evidence-label")).not.toBeInTheDocument()
  })

  it("re-runs the search when the user toggles to the reviewer role", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 22,
            email: "toggle@x.edu",
            first_name: "Tog",
            last_name: "Gle",
            domain: ["AI"],
            matched_fields: ["ai"],
            score: 50,
          },
        ],
        total: 1,
      },
      error: null,
    })

    // Start in PC role and search.
    await setupAndOpenSearch("toggle", { role: "pc" })
    await waitFor(() => {
      expect(screen.getByText("toggle@x.edu")).toBeInTheDocument()
    })
    expect(searchUsersForConference).toHaveBeenLastCalledWith("toggle", null, 10)

    // Flip to reviewer — the active query should be re-issued WITH the
    // conference id, and chips/label should appear without retyping.
    selectRole("reviewer")
    await waitFor(() => {
      expect(searchUsersForConference).toHaveBeenLastCalledWith("toggle", "1", 10)
    })
    await waitFor(() => {
      expect(screen.getByTestId("match-evidence-label")).toBeInTheDocument()
    })
    expect(screen.getByText("AI").className).toContain("emerald")
  })

  it("preserves the order returned by the endpoint", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 1,
            email: "a@x.edu",
            first_name: "Alice",
            last_name: "A",
            domain: [],
          },
          {
            id: 2,
            email: "b@x.edu",
            first_name: "Bob",
            last_name: "B",
            domain: ["AI"],
            matched_fields: ["ai"],
            score: 50,
          },
          {
            id: 3,
            email: "c@x.edu",
            first_name: "Carol",
            last_name: "C",
            domain: ["AI", "ML"],
            matched_fields: ["ai", "ml"],
            score: 100,
          },
        ],
        total: 3,
      },
      error: null,
    })

    await setupAndOpenSearch("@x.edu")

    await waitFor(() => {
      expect(screen.getByText("a@x.edu")).toBeInTheDocument()
    })

    const dropdown = screen.getByText("a@x.edu").closest("div.absolute") as HTMLElement
    const order = within(dropdown)
      .getAllByText(/@x\.edu$/)
      .map((el) => el.textContent)
    expect(order).toEqual(["a@x.edu", "b@x.edu", "c@x.edu"])
  })

  it("falls back to the conference-domain set when the backend omits matched_fields", async () => {
    // Simulates the graceful-degrade path on the backend: matched_fields and
    // score are missing, so the FE colors chips by comparing each domain to
    // the conference's domain list.
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 99,
            email: "fallback@x.edu",
            first_name: "Fall",
            last_name: "Back",
            domain: ["AI", "Quantum"],
            // no matched_fields, no score
          },
        ],
        total: 1,
      },
      error: null,
    })

    await setupAndOpenSearch("fallback")

    await waitFor(() => {
      expect(screen.getByText("fallback@x.edu")).toBeInTheDocument()
    })

    // Conference domains are ["AI", "ML"] in this describe block.
    expect(screen.getByText("AI").className).toContain("emerald")
    expect(screen.getByText("Quantum").className).toContain("slate")

    // The explanatory label is reserved for server-confirmed matches; in the
    // fallback path we don't claim "this matched conference topics" because
    // the backend never said so.
    expect(screen.queryByTestId("match-evidence-label")).not.toBeInTheDocument()
  })

  it("shows the explanatory label and chip tooltip when the backend confirms a match", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 42,
            email: "evidence@x.edu",
            first_name: "Eve",
            last_name: "Idence",
            domain: ["AI", "Robotics"],
            matched_fields: ["ai"],
            score: 50,
          },
        ],
        total: 1,
      },
      error: null,
    })

    await setupAndOpenSearch("evidence")

    await waitFor(() => {
      expect(screen.getByText("evidence@x.edu")).toBeInTheDocument()
    })

    const label = screen.getByTestId("match-evidence-label")
    expect(label).toBeInTheDocument()
    expect(label.textContent).toContain("Matches conference topics")
    expect(label.className).toContain("emerald")

    const aiChip = screen.getByText("AI")
    expect(aiChip).toHaveAttribute("title", "Matches a conference topic")
    // Unmatched chip should NOT carry the tooltip.
    expect(screen.getByText("Robotics")).not.toHaveAttribute("title")
  })

  it("does not show the explanatory label when the backend annotated zero matches", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 43,
            email: "nomatch@x.edu",
            first_name: "No",
            last_name: "Match",
            domain: ["Quantum"],
            // server explicitly returned an empty matched_fields array, meaning
            // it computed the overlap and found none.
            matched_fields: [],
            score: 0,
          },
        ],
        total: 1,
      },
      error: null,
    })

    await setupAndOpenSearch("nomatch")

    await waitFor(() => {
      expect(screen.getByText("nomatch@x.edu")).toBeInTheDocument()
    })

    expect(screen.queryByTestId("match-evidence-label")).not.toBeInTheDocument()
    // Quantum is not a conference topic, so it should remain grey and have no
    // tooltip — the server has authoritatively said this is not a match.
    const chip = screen.getByText("Quantum")
    expect(chip.className).toContain("slate")
    expect(chip).not.toHaveAttribute("title")
  })
})

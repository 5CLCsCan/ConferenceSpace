import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { ConferenceCommittee } from "../conference-committee"
import { getConferenceById, getConferenceReviewers, updateConference } from "@/lib/api/conferences"
import { searchUsersForConference } from "@/lib/api/user"
import { semanticScholarApi } from "@/lib/api/semantic-scholar"
import { createExternalInvitations, listExternalInvitations } from "@/lib/api/external-invitations"

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

vi.mock("@/lib/api/semantic-scholar", () => ({
  semanticScholarApi: {
    searchAuthors: vi.fn(async () => ({ data: [] })),
  },
}))

vi.mock("@/lib/api/external-invitations", () => ({
  listExternalInvitations: vi.fn(async () => ({
    data: { invitations: [], total: 0 },
    error: null,
  })),
  createExternalInvitations: vi.fn(async () => ({
    data: { success: [], failed: [] },
    error: null,
  })),
  deleteExternalInvitation: vi.fn(async () => ({ data: {}, error: null })),
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
    expect(screen.getAllByRole("button", { name: /Add PC Member/i }).length).toBeGreaterThan(0)
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

describe("ConferenceCommittee — profile links", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
    vi.clearAllMocks()
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
    ;(getConferenceReviewers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reviewers: [], total: 0, limit: 200, offset: 0 },
      error: null,
      status: 200,
    })
    ;(listExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        invitations: [
          {
            id: 501,
            conference_id: 1,
            role: "reviewer",
            scholar_id: "S-EXT-1",
            name: "Ext Invitee",
            email: "",
            affiliation: "Oxford",
            profile_url: "https://www.semanticscholar.org/author/S-EXT-1",
            status: "pending",
            invited_by: 1,
            created_at: "2026-05-02T10:00:00Z",
            updated_at: "2026-05-02T10:00:00Z",
          },
        ],
        total: 1,
      },
      error: null,
    })
  })

  it("renders a platform profile icon link for each on-platform committee member", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    // Chair and PC member live on the platform — both rows should expose an
    // internal profile link (href = /profile/<email>). The aria-label uses
    // the member's DISPLAY name (resolved via userApi.getByEmail), not their
    // raw email; the mocked user resolves "chair@example.com" → "chair User".
    const chairLink = screen.getByRole("link", {
      name: /View profile for chair User/,
    })
    expect(chairLink).toHaveAttribute("href", "/profile/chair@example.com")
    expect(chairLink).not.toHaveAttribute("target")

    const pcLink = screen.getByRole("link", {
      name: /View profile for pc User/,
    })
    expect(pcLink).toHaveAttribute("href", "/profile/pc@example.com")
  })

  it("renders a Semantic Scholar profile icon link for external invitees", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => expect(screen.getByText("Ext Invitee")).toBeInTheDocument())

    const link = screen.getByRole("link", {
      name: /Open Semantic Scholar profile for Ext Invitee/,
    })
    expect(link).toHaveAttribute("href", "https://www.semanticscholar.org/author/S-EXT-1")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"))
  })

  it("renders exactly one trash button for an external PC invitee (no duplicate delete icon)", async () => {
    // Regression: previously the `role === 'pc'` delete button rendered for
    // external PC members too, on top of the external-invitation delete
    // button, so the row had two trash icons. The fix guards the PC branch
    // with `!member.is_external`.
    ;(listExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        invitations: [
          {
            id: 777,
            conference_id: 1,
            role: "pc",
            scholar_id: "S-EXT-PC",
            name: "External PC",
            email: "",
            affiliation: "MIT",
            profile_url: "https://www.semanticscholar.org/author/S-EXT-PC",
            status: "pending",
            invited_by: 1,
            created_at: "2026-05-02T10:00:00Z",
            updated_at: "2026-05-02T10:00:00Z",
          },
        ],
        total: 1,
      },
      error: null,
    })

    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => expect(screen.getByText("External PC")).toBeInTheDocument())

    // Locate the external PC row and count delete buttons inside it.
    const row = screen.getByText("External PC").closest("tr") as HTMLElement
    expect(row).not.toBeNull()
    const deleteButtons = within(row)
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("title") === "Remove")
    expect(deleteButtons).toHaveLength(1)
  })

  it("exposes profile icon links in the search dropdown for platform users", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        users: [
          {
            id: 77,
            email: "new@example.com",
            first_name: "New",
            last_name: "User",
            domain: [],
          },
        ],
        total: 1,
      },
      error: null,
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "new" } })
    await waitFor(() => expect(screen.getByText("new@example.com")).toBeInTheDocument())

    const link = screen.getByRole("link", {
      name: /View profile for new@example\.com/,
    })
    expect(link).toHaveAttribute("href", "/profile/new@example.com")
    expect(link).not.toHaveAttribute("target")
  })

  it("exposes Semantic Scholar profile icon links in the search dropdown for external authors", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { users: [], total: 0 },
      error: null,
    })
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-42",
          name: "Scholar Person",
          affiliations: ["ETH"],
        },
      ],
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "scholar" } })
    await waitFor(() => expect(screen.getByText("Scholar Person")).toBeInTheDocument())

    const link = screen.getByRole("link", {
      name: /Open Semantic Scholar profile for Scholar Person/,
    })
    expect(link).toHaveAttribute("href", "https://www.semanticscholar.org/author/scholar-42")
    expect(link).toHaveAttribute("target", "_blank")
  })
})

describe("ConferenceCommittee — Semantic Scholar domain chips", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
    vi.clearAllMocks()
    ;(getConferenceById as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: "1",
        name: "Test Conference",
        chair: "chair@example.com",
        co_chairs: [],
        pc_members: [],
        status: "open",
        tracks: [],
        // Conference-topic set used for highlighting matching chips.
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
    ;(listExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { invitations: [], total: 0 },
      error: null,
    })
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { users: [], total: 0 },
      error: null,
    })
  })

  function selectRole(role: "pc" | "reviewer") {
    const select = screen.getByDisplayValue(/Program Committee|Reviewer/i) as HTMLSelectElement
    fireEvent.change(select, { target: { value: role } })
  }

  async function typeAndWaitForAuthor(value: string, authorName: string) {
    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value } })
    await waitFor(() => expect(screen.getByText(authorName)).toBeInTheDocument())
  }

  it("renders domain chips from fieldsOfStudy for Semantic Scholar authors", async () => {
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-1",
          name: "Dr Domains",
          affiliations: ["Stanford"],
          fieldsOfStudy: ["AI", "Robotics"],
        },
      ],
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })
    // Flip to reviewer so conference-topic matching kicks in (chip greens).
    selectRole("reviewer")

    await typeAndWaitForAuthor("domains", "Dr Domains")

    // Both tags render as chips.
    expect(screen.getByText("AI")).toBeInTheDocument()
    expect(screen.getByText("Robotics")).toBeInTheDocument()
  })

  it("highlights fields that match the conference topic set when adding a reviewer", async () => {
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-2",
          name: "Dr Match",
          fieldsOfStudy: ["AI", "Robotics"],
        },
      ],
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })
    selectRole("reviewer")

    await typeAndWaitForAuthor("match", "Dr Match")

    // AI is in the conference topic set → green chip. Robotics is not → grey.
    expect(screen.getByText("AI").className).toContain("emerald")
    expect(screen.getByText("Robotics").className).toContain("slate")
  })

  it("does not highlight any scholar chip when the chair is adding a PC role (match evidence is reviewer-only)", async () => {
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-3",
          name: "Dr PC",
          fieldsOfStudy: ["AI", "Robotics"],
        },
      ],
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })
    // PC is the default role — do not flip to reviewer.

    await typeAndWaitForAuthor("pc", "Dr PC")

    // Even though "AI" is in the conference topic set, role=pc suppresses the
    // green highlight to mirror platform-search behavior.
    expect(screen.getByText("AI").className).toContain("slate")
    expect(screen.getByText("Robotics").className).toContain("slate")
  })

  it("caps the dropdown to 4 chips and shows a +N overflow counter", async () => {
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-4",
          name: "Dr Many",
          fieldsOfStudy: ["F1", "F2", "F3", "F4", "F5", "F6"],
        },
      ],
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    await typeAndWaitForAuthor("many", "Dr Many")

    expect(screen.getByText("F1")).toBeInTheDocument()
    expect(screen.getByText("F4")).toBeInTheDocument()
    // F5 / F6 are hidden behind the overflow chip.
    expect(screen.queryByText("F5")).not.toBeInTheDocument()
    expect(screen.queryByText("F6")).not.toBeInTheDocument()
    expect(screen.getByText("+2")).toBeInTheDocument()
  })

  it("omits the chip strip when the author has no fieldsOfStudy", async () => {
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-5",
          name: "Dr Empty",
          affiliations: ["Oxford"],
          // no fieldsOfStudy, also covers backward-compat with cached entries
        },
      ],
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    await typeAndWaitForAuthor("empty", "Dr Empty")

    // No chip nor overflow counter rendered for this row — smoke-check by
    // asserting the overflow counter is absent.
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })
})

describe("ConferenceCommittee — refresh after invite", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
    vi.clearAllMocks()
    ;(getConferenceById as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: "1",
        name: "Test Conference",
        chair: "chair@example.com",
        co_chairs: [],
        pc_members: [],
        status: "open",
        tracks: [],
        domain: ["AI"],
      },
      error: null,
      status: 200,
    })
    ;(getConferenceReviewers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reviewers: [], total: 0, limit: 200, offset: 0 },
      error: null,
      status: 200,
    })
    ;(listExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { invitations: [], total: 0 },
      error: null,
    })
  })

  // Helper: the form action button (right side of the chip strip) is the one
  // that actually calls handleAddMembers. It shares label text with the
  // toolbar button, so we disambiguate by the `disabled:` class, which only
  // the action button carries. Label text: "Add PC Member" (default role) or
  // "Invite Reviewer" (reviewer role).
  function getInviteActionButton(): HTMLButtonElement {
    const buttons = screen
      .getAllByRole("button", { name: /Add PC Member|Invite Reviewer/i })
      .filter((btn) => btn.className.includes("disabled:"))
    expect(buttons.length).toBe(1)
    return buttons[0] as HTMLButtonElement
  }

  it("adds a direct PC email from the action button without requiring a staged chip first", async () => {
    ;(updateConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {},
      error: null,
      status: 200,
    })

    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading committee/i)).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "direct-pc@example.com" } })

    await act(async () => {
      fireEvent.click(getInviteActionButton())
    })

    await waitFor(() => {
      expect(updateConference).toHaveBeenCalledWith("1", {
        pc_members: ["direct-pc@example.com"],
      })
    })
  })

  it("removes co-chairs from the committee table", async () => {
    ;(getConferenceById as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: "1",
        name: "Test Conference",
        chair: "chair@example.com",
        co_chairs: ["cochair@example.com"],
        pc_members: [],
        status: "open",
        tracks: [],
        domain: ["AI"],
      },
      error: null,
      status: 200,
    })
    ;(updateConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {},
      error: null,
      status: 200,
    })

    render(<ConferenceCommittee conferenceId="1" />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading committee/i)).not.toBeInTheDocument()
    })

    const coChairRow = screen.getByText("cochair@example.com").closest("tr") as HTMLElement
    fireEvent.click(within(coChairRow).getByRole("button", { name: "delete" }))

    await waitFor(() => {
      expect(updateConference).toHaveBeenCalledWith("1", {
        co_chairs: [],
      })
    })
  })

  it("keeps the committee table visible during the post-invite refresh (does not blank to 'Loading committee...')", async () => {
    ;(updateConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {},
      error: null,
      status: 200,
    })

    render(<ConferenceCommittee conferenceId="1" />)

    // Finish the initial load so we enter the rendered-table state.
    await waitFor(() => {
      expect(screen.queryByText(/Loading committee/i)).not.toBeInTheDocument()
    })
    expect(screen.getByText("chair@example.com")).toBeInTheDocument()

    // Now gate the NEXT getConferenceById call behind a pending promise so
    // we can assert UI state *while* the refresh is in flight. The updated
    // conference resolves with the newly invited PC member.
    let resolveSecondFetch: (value: unknown) => void = () => undefined
    ;(getConferenceById as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecondFetch = resolve
        }),
    )

    // Stage an invite by typing a direct email into the search box, then
    // accept the dropdown's "add directly" affordance. The label template is
    // `Add directly: "<query>"` in the en locale.
    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "added@example.com" } })
    await waitFor(() => {
      expect(screen.getByText(/Add directly: "added@example\.com"/i)).toBeInTheDocument()
    })
    fireEvent.mouseDown(screen.getByText(/Add directly: "added@example\.com"/i))

    await act(async () => {
      fireEvent.click(getInviteActionButton())
    })

    // At this point loadCommittee() has been called again and is awaiting
    // getConferenceById — the key assertion: the committee table stays
    // visible (no blank "Loading committee..." screen) during the refresh.
    expect(screen.queryByText(/^Loading committee/i)).not.toBeInTheDocument()
    expect(screen.getByText("chair@example.com")).toBeInTheDocument()

    // Release the refresh: updated conference now includes the new PC member.
    await act(async () => {
      resolveSecondFetch({
        data: {
          id: "1",
          name: "Test Conference",
          chair: "chair@example.com",
          co_chairs: [],
          pc_members: ["added@example.com"],
          status: "open",
          tracks: [],
          domain: ["AI"],
        },
        error: null,
        status: 200,
      })
    })

    // After the refresh completes the new row appears without any page reload.
    await waitFor(() => {
      expect(screen.getByText("added@example.com")).toBeInTheDocument()
    })
  })

  it("refreshes external invitations after inviting a Semantic Scholar author", async () => {
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { users: [], total: 0 },
      error: null,
    })
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-777",
          name: "Dr Refresh",
          affiliations: ["MIT"],
        },
      ],
    })
    ;(createExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        success: [
          {
            id: 9001,
            conference_id: 1,
            role: "pc",
            scholar_id: "scholar-777",
            name: "Dr Refresh",
            email: "",
            affiliation: "MIT",
            profile_url: "https://www.semanticscholar.org/author/scholar-777",
            status: "pending",
            invited_by: 1,
            created_at: "2026-05-02T10:00:00Z",
            updated_at: "2026-05-02T10:00:00Z",
          },
        ],
        failed: [],
      },
      error: null,
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading committee/i)).not.toBeInTheDocument()
    })

    // Baseline: listExternalInvitations was called exactly once (initial load).
    const initialExtCalls = (listExternalInvitations as ReturnType<typeof vi.fn>).mock.calls.length
    expect(initialExtCalls).toBeGreaterThanOrEqual(1)

    // Queue the refresh response so the post-invite refetch surfaces the
    // newly created external invitation in the table.
    ;(listExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        invitations: [
          {
            id: 9001,
            conference_id: 1,
            role: "pc",
            scholar_id: "scholar-777",
            name: "Dr Refresh",
            email: "",
            affiliation: "MIT",
            profile_url: "https://www.semanticscholar.org/author/scholar-777",
            status: "pending",
            invited_by: 1,
            created_at: "2026-05-02T10:00:00Z",
            updated_at: "2026-05-02T10:00:00Z",
          },
        ],
        total: 1,
      },
      error: null,
    })

    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "refresh" } })
    await waitFor(() => expect(screen.getByText("Dr Refresh")).toBeInTheDocument())

    fireEvent.mouseDown(screen.getByText("Dr Refresh"))

    await act(async () => {
      fireEvent.click(getInviteActionButton())
    })

    // createExternalInvitations was called for the staged author.
    await waitFor(() => {
      expect(createExternalInvitations).toHaveBeenCalledWith(
        "1",
        expect.arrayContaining([
          expect.objectContaining({ scholar_id: "scholar-777", name: "Dr Refresh" }),
        ]),
      )
    })

    // loadCommittee re-fetched external invitations — that's the signal that
    // the committee list will reflect the invite without a page reload.
    await waitFor(() => {
      expect(
        (listExternalInvitations as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBeGreaterThan(initialExtCalls)
    })

    // We also never blanked to the "Loading committee..." state during this
    // second refresh (regression test for the UI bug).
    expect(screen.queryByText(/^Loading committee/i)).not.toBeInTheDocument()
  })

  it("persists fields_of_study when inviting a Semantic Scholar author", async () => {
    // Regression for the Domain column showing "—" after invite: the chair
    // picks an S2 author whose profile advertises two topics, and we expect
    // those topics to ride along in the createExternalInvitations payload.
    ;(searchUsersForConference as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { users: [], total: 0 },
      error: null,
    })
    ;(semanticScholarApi.searchAuthors as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          authorId: "scholar-fos-1",
          name: "Fieldy McPerson",
          affiliations: ["ETH"],
          fieldsOfStudy: ["Computer Science", "Robotics"],
        },
      ],
    })
    ;(createExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: [], failed: [] },
      error: null,
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading committee/i)).not.toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Search by email or name/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "fieldy" } })
    await waitFor(() => expect(screen.getByText("Fieldy McPerson")).toBeInTheDocument())
    fireEvent.mouseDown(screen.getByText("Fieldy McPerson"))

    await act(async () => {
      fireEvent.click(getInviteActionButton())
    })

    await waitFor(() => {
      expect(createExternalInvitations).toHaveBeenCalledWith(
        "1",
        expect.arrayContaining([
          expect.objectContaining({
            scholar_id: "scholar-fos-1",
            fields_of_study: ["Computer Science", "Robotics"],
          }),
        ]),
      )
    })
  })

  it("renders the Domain column from fields_of_study for external committee members", async () => {
    // The backend returns the persisted fields_of_study on the external
    // invitation; the committee row's Domain column must render them the
    // same way it does for platform members with `domain: [...]`.
    ;(listExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        invitations: [
          {
            id: 42,
            conference_id: 1,
            role: "reviewer",
            scholar_id: "scholar-domaincol",
            name: "Ada External",
            email: "",
            affiliation: "Caltech",
            profile_url: "https://www.semanticscholar.org/author/scholar-domaincol",
            status: "pending",
            invited_by: 1,
            created_at: "2026-05-02T10:00:00Z",
            updated_at: "2026-05-02T10:00:00Z",
            fields_of_study: ["Computer Science", "Robotics"],
          },
        ],
        total: 1,
      },
      error: null,
    })

    render(<ConferenceCommittee conferenceId="1" />)
    await waitFor(() => {
      expect(screen.queryByText(/Loading committee/i)).not.toBeInTheDocument()
    })

    // Join logic in the Domain cell is `member.domain?.join(", ") || "—"`.
    expect(screen.getByText("Ada External")).toBeInTheDocument()
    expect(screen.getByText("Computer Science, Robotics")).toBeInTheDocument()
  })
})

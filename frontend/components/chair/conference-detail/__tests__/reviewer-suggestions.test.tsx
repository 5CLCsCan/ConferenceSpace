import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import {
  ReviewerSuggestions,
  __resetReviewerSuggestionCache,
} from "../reviewer-suggestions"

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

vi.mock("@/lib/api/reviewer-suggestions", () => ({
  getReviewerSuggestions: vi.fn(),
}))

vi.mock("@/lib/api/conferences", () => ({
  inviteReviewers: vi.fn(),
}))

vi.mock("@/lib/api/external-invitations", () => ({
  createExternalInvitations: vi.fn(),
}))

import { getReviewerSuggestions } from "@/lib/api/reviewer-suggestions"
import { inviteReviewers } from "@/lib/api/conferences"
import { createExternalInvitations } from "@/lib/api/external-invitations"

const mockSuggestions = [
  {
    id: "platform-1",
    source: "internal" as const,
    name: "Alice Smith",
    email: "alice@test.com",
    affiliation: "MIT",
    on_platform: true,
    score: 95,
    fields: ["AI", "ML", "NLP"],
    matched_fields: ["AI", "ML"],
    publications: 42,
    past_reviews: 10,
    scholar_id: "s2-100",
    platform_user_id: 1,
  },
  {
    id: "s2-200",
    source: "external" as const,
    name: "Bob Jones",
    email: "",
    affiliation: "Oxford",
    on_platform: false,
    score: 80,
    fields: ["Computer Vision", "Deep Learning"],
    matched_fields: ["Deep Learning"],
    publications: 30,
    past_reviews: null,
    scholar_id: "200",
    platform_user_id: null,
  },
]

beforeEach(() => {
  localStorage.setItem("conference_locale", "en")
  vi.clearAllMocks()
  __resetReviewerSuggestionCache()
  ;(getReviewerSuggestions as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { suggestions: mockSuggestions, conference_topics: ["AI", "ML"], total: 2 },
    error: null,
  })
  ;(inviteReviewers as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { success: [{ id: 1 }], failed: [] },
    error: null,
  })
  ;(createExternalInvitations as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { success: [{ id: 900 }], failed: [] },
    error: null,
  })
})

function getStartButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /Start$/ }) as HTMLButtonElement
}

function getReRunButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /Re-run$/ }) as HTMLButtonElement
}

function clickStart() {
  fireEvent.click(getStartButton())
}

describe("ReviewerSuggestions", () => {
  it("does NOT auto-fetch on mount; shows the picker until Start is clicked", () => {
    render(<ReviewerSuggestions conferenceId="1" />)

    expect(getReviewerSuggestions).not.toHaveBeenCalled()
    expect(
      screen.getByText(/Choose how many candidates to fetch/i),
    ).toBeInTheDocument()
    expect(getStartButton()).toBeInTheDocument()
  })

  it("defaults the Top input to 20 and sends that limit when Start is clicked", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)

    const input = screen.getByLabelText(/Top/i) as HTMLInputElement
    expect(input.value).toBe("20")

    clickStart()

    await waitFor(() => {
      expect(getReviewerSuggestions).toHaveBeenCalledWith("1", 20)
    })
  })

  it("sends a custom limit when the user changes the Top input before Start", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)

    const input = screen.getByLabelText(/Top/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "100" } })
    clickStart()

    await waitFor(() => {
      expect(getReviewerSuggestions).toHaveBeenCalledWith("1", 100)
    })
  })

  it("disables Start when the Top input is empty or invalid", () => {
    render(<ReviewerSuggestions conferenceId="1" />)

    const input = screen.getByLabelText(/Top/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "" } })
    expect(getStartButton()).toBeDisabled()

    fireEvent.change(input, { target: { value: "0" } })
    expect(getStartButton()).toBeDisabled()

    fireEvent.change(input, { target: { value: "5" } })
    expect(getStartButton()).not.toBeDisabled()
  })

  it("renders suggestions after Start is clicked", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument()
      expect(screen.getByText("Bob Jones")).toBeInTheDocument()
    })
  })

  it("shows the loading skeleton while fetching after Start", async () => {
    let resolvePromise: (value: unknown) => void = () => undefined
    ;(getReviewerSuggestions as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve
      }),
    )

    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")
    expect(screen.getByText(/Generating reviewer suggestions/i)).toBeInTheDocument()
    expect(screen.getByText(/Considering conference topics/i)).toBeInTheDocument()

    resolvePromise({
      data: { suggestions: mockSuggestions, conference_topics: ["AI"], total: 2 },
      error: null,
    })

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument()
    })
  })

  it("changes the Start label to 'Re-run' after first fetch and re-fetches with the new N", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    expect(getReRunButton()).toBeInTheDocument()

    const input = screen.getByLabelText(/Top/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "7" } })
    fireEvent.click(getReRunButton())

    await waitFor(() => {
      expect(getReviewerSuggestions).toHaveBeenLastCalledWith("1", 7)
    })
  })

  it("shows platform badges for both on/off platform reviewers", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument()
    })

    expect(screen.getAllByText(/On platform/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Not on platform/).length).toBeGreaterThan(0)
  })

  it("filters by on-platform when chip is clicked", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const platformFilter = screen.getByRole("button", { name: /^On platform \(1\)$/ })
    fireEvent.click(platformFilter)

    expect(screen.getByText("Alice Smith")).toBeInTheDocument()
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument()
  })

  it("filters by not-on-platform when chip is clicked", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const externalFilter = screen.getByRole("button", { name: /^Not on platform \(1\)$/ })
    fireEvent.click(externalFilter)

    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument()
    expect(screen.getByText("Bob Jones")).toBeInTheDocument()
  })

  it("invites on-platform user and shows invited badge", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const inviteButtons = screen
      .getAllByRole("button", { name: /\bInvite\b/ })
      .filter(
        (btn) =>
          !(btn as HTMLButtonElement).disabled &&
          !btn.textContent?.includes("all") &&
          !btn.textContent?.includes("Invited"),
      )
    expect(inviteButtons.length).toBeGreaterThanOrEqual(1)

    fireEvent.click(inviteButtons[0])

    await waitFor(() => {
      expect(inviteReviewers).toHaveBeenCalledWith("1", [{ user_id: 1 }])
      expect(screen.getByText("Invited")).toBeInTheDocument()
    })
  })

  it("removes suggestion from list when remove is clicked", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const removeButtons = screen.getAllByTitle(/Remove/)
    fireEvent.click(removeButtons[0])

    await waitFor(() => {
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument()
    })
  })

  it("shows match scores", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => {
      expect(screen.getByText("95")).toBeInTheDocument()
      expect(screen.getByText("80")).toBeInTheDocument()
    })
  })

  it("renders on-platform name as an in-app profile link using the user's email", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const aliceLink = screen.getByText("Alice Smith").closest("a")
    expect(aliceLink).not.toBeNull()
    // The profile route resolves by email (see resolveUserEmail), not numeric id.
    expect(aliceLink).toHaveAttribute("href", "/profile/alice@test.com")
    expect(aliceLink).not.toHaveAttribute("target")
  })

  it("renders external suggestion name as a Semantic Scholar link opening in a new tab", async () => {
    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Bob Jones"))

    const bobLink = screen.getByText("Bob Jones").closest("a")
    expect(bobLink).not.toBeNull()
    expect(bobLink).toHaveAttribute(
      "href",
      "https://www.semanticscholar.org/author/200",
    )
    expect(bobLink).toHaveAttribute("target", "_blank")
    expect(bobLink).toHaveAttribute("rel", expect.stringContaining("noopener"))
  })

  it("rehydrates suggestions from cache when the component remounts (tab switch)", async () => {
    const { unmount } = render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))
    expect(getReviewerSuggestions).toHaveBeenCalledTimes(1)

    unmount()
    ;(getReviewerSuggestions as ReturnType<typeof vi.fn>).mockClear()

    render(<ReviewerSuggestions conferenceId="1" />)

    expect(screen.getByText("Alice Smith")).toBeInTheDocument()
    expect(screen.getByText("Bob Jones")).toBeInTheDocument()
    expect(getReviewerSuggestions).not.toHaveBeenCalled()
    expect(screen.queryByText(/Choose how many candidates to fetch/i)).not.toBeInTheDocument()
    expect(getReRunButton()).toBeInTheDocument()
  })

  it("preserves invited/removed decisions across remounts", async () => {
    const { unmount } = render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const inviteButton = screen
      .getAllByRole("button", { name: /\bInvite\b/ })
      .find(
        (btn) =>
          !(btn as HTMLButtonElement).disabled &&
          !btn.textContent?.includes("all") &&
          !btn.textContent?.includes("Invited"),
      ) as HTMLButtonElement
    fireEvent.click(inviteButton)

    await waitFor(() => expect(screen.getByText("Invited")).toBeInTheDocument())

    const removeButtons = screen.getAllByTitle(/Remove/)
    fireEvent.click(removeButtons[removeButtons.length - 1])

    await waitFor(() => expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument())

    unmount()
    render(<ReviewerSuggestions conferenceId="1" />)

    expect(screen.getByText("Alice Smith")).toBeInTheDocument()
    expect(screen.getByText("Invited")).toBeInTheDocument()
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument()
  })

  it("keeps separate caches per conferenceId", async () => {
    const { unmount } = render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()
    await waitFor(() => screen.getByText("Alice Smith"))
    unmount()
    ;(getReviewerSuggestions as ReturnType<typeof vi.fn>).mockClear()

    render(<ReviewerSuggestions conferenceId="2" />)

    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument()
    expect(screen.getByText(/Choose how many candidates to fetch/i)).toBeInTheDocument()
    expect(getReviewerSuggestions).not.toHaveBeenCalled()
  })

  it("enables invite-all when external suggestions are present (they are now invitable)", async () => {
    ;(getReviewerSuggestions as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        suggestions: [mockSuggestions[1]],
        conference_topics: ["AI"],
        total: 1,
      },
      error: null,
    })

    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => screen.getByText("Bob Jones"))

    const inviteAll = screen.getByRole("button", { name: /Invite all/ })
    expect(inviteAll).not.toBeDisabled()
  })

  it("disables invite-all when the suggestion list is empty", async () => {
    ;(getReviewerSuggestions as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        suggestions: [],
        conference_topics: ["AI"],
        total: 0,
      },
      error: null,
    })

    render(<ReviewerSuggestions conferenceId="1" />)
    clickStart()

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Invite all/ })
      expect(btn).toBeDisabled()
    })
  })

  it("calls onInviteSuccess after inviting an on-platform suggestion", async () => {
    const onInviteSuccess = vi.fn()
    render(<ReviewerSuggestions conferenceId="1" onInviteSuccess={onInviteSuccess} />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const inviteButton = screen
      .getAllByRole("button", { name: /\bInvite\b/ })
      .find(
        (btn) =>
          !(btn as HTMLButtonElement).disabled &&
          !btn.textContent?.includes("all") &&
          !btn.textContent?.includes("Invited"),
      ) as HTMLButtonElement
    fireEvent.click(inviteButton)

    await waitFor(() => expect(screen.getByText("Invited")).toBeInTheDocument())
    expect(onInviteSuccess).toHaveBeenCalledTimes(1)
  })

  it("calls onInviteSuccess after inviting an external (Semantic Scholar) suggestion", async () => {
    const onInviteSuccess = vi.fn()
    ;(getReviewerSuggestions as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        suggestions: [mockSuggestions[1]],
        conference_topics: ["AI"],
        total: 1,
      },
      error: null,
    })

    render(<ReviewerSuggestions conferenceId="1" onInviteSuccess={onInviteSuccess} />)
    clickStart()

    await waitFor(() => screen.getByText("Bob Jones"))

    // External suggestions render an amber "Invite" button that routes to
    // createExternalInvitations (not inviteReviewers).
    const inviteBtn = screen
      .getAllByRole("button", { name: /\bInvite\b/ })
      .find(
        (btn) =>
          !(btn as HTMLButtonElement).disabled &&
          !btn.textContent?.includes("all") &&
          !btn.textContent?.includes("Invited"),
      ) as HTMLButtonElement
    fireEvent.click(inviteBtn)

    await waitFor(() => {
      expect(createExternalInvitations).toHaveBeenCalledWith(
        "1",
        expect.arrayContaining([
          expect.objectContaining({
            scholar_id: "200",
            name: "Bob Jones",
            // Suggestion.fields must round-trip as fields_of_study so the
            // committee table's Domain column is populated for externals.
            fields_of_study: ["Computer Vision", "Deep Learning"],
          }),
        ]),
      )
    })
    expect(onInviteSuccess).toHaveBeenCalledTimes(1)
  })

  it("calls onInviteSuccess once after Invite-all when at least one invite succeeds", async () => {
    const onInviteSuccess = vi.fn()
    render(<ReviewerSuggestions conferenceId="1" onInviteSuccess={onInviteSuccess} />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const inviteAll = screen.getByRole("button", { name: /Invite all/ })
    fireEvent.click(inviteAll)

    await waitFor(() => {
      expect(inviteReviewers).toHaveBeenCalled()
      expect(createExternalInvitations).toHaveBeenCalled()
    })
    // Bulk invite should only fire onInviteSuccess once, not once per invitee,
    // so the parent can batch a single committee refresh.
    expect(onInviteSuccess).toHaveBeenCalledTimes(1)
  })

  it("does not call onInviteSuccess when a single-invite API call fails", async () => {
    const onInviteSuccess = vi.fn()
    ;(inviteReviewers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: "boom",
    })

    render(<ReviewerSuggestions conferenceId="1" onInviteSuccess={onInviteSuccess} />)
    clickStart()

    await waitFor(() => screen.getByText("Alice Smith"))

    const inviteButton = screen
      .getAllByRole("button", { name: /\bInvite\b/ })
      .find(
        (btn) =>
          !(btn as HTMLButtonElement).disabled &&
          !btn.textContent?.includes("all") &&
          !btn.textContent?.includes("Invited"),
      ) as HTMLButtonElement
    fireEvent.click(inviteButton)

    await waitFor(() => expect(inviteReviewers).toHaveBeenCalled())
    expect(onInviteSuccess).not.toHaveBeenCalled()
  })
})

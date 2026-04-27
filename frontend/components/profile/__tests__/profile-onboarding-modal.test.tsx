import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProfileOnboardingModal } from "../profile-onboarding-modal"

const { mockSearchAuthors, mockGetAuthorDetails, mockLinkAcademicProfile, mockToast } =
  vi.hoisted(() => ({
    mockSearchAuthors: vi.fn(),
    mockGetAuthorDetails: vi.fn(),
    mockLinkAcademicProfile: vi.fn(),
    mockToast: vi.fn(),
  }))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

vi.mock("@/lib/api/user", () => ({
  userApi: {
    linkAcademicProfile: mockLinkAcademicProfile,
  },
}))

vi.mock("@/lib/api/semantic-scholar", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/semantic-scholar")>(
    "@/lib/api/semantic-scholar",
  )

  return {
    ...actual,
    semanticScholarApi: {
      searchAuthors: mockSearchAuthors,
      getAuthorDetails: mockGetAuthorDetails,
    },
  }
})

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        {
          "runtime.components.profile.profile-onboarding-modal.text_connect_academic_profile":
            "Connect Academic Profile",
          "runtime.components.profile.profile-onboarding-modal.text_link_your_semantic_scholar_profile_to":
            "Find your author page on Semantic Scholar, then paste the profile URL here to sync publications and citation metrics.",
          "runtime.components.profile.profile-onboarding-modal.text_find_your_profile_on_semantic_scholar":
            "Find your profile on Semantic Scholar",
          "runtime.components.profile.profile-onboarding-modal.text_search_your_name_or_paper_title":
            "Search your name or paper title on Semantic Scholar.",
          "runtime.components.profile.profile-onboarding-modal.text_open_your_author_page_and_paste_the_url":
            "Open your author page and paste the profile URL here.",
          "runtime.components.profile.profile-onboarding-modal.text_semantic_scholar_profile_url_or_author_id":
            "Semantic Scholar profile URL or author ID",
          "runtime.components.profile.profile-onboarding-modal.placeholder_paste_profile_url_or_author_id":
            "Paste a Semantic Scholar profile URL or author ID",
          "runtime.components.profile.profile-onboarding-modal.text_continue": "Continue",
          "runtime.components.profile.profile-onboarding-modal.text_example": "Example:",
          "runtime.components.profile.profile-onboarding-modal.text_or": "or",
          "runtime.components.profile.profile-onboarding-modal.text_open_semantic_scholar":
            "Open Semantic Scholar",
          "runtime.components.profile.profile-onboarding-modal.text_search_by_name_instead":
            "Search by name instead",
          "runtime.components.profile.profile-onboarding-modal.prop_description_only_semantic_scholar_links_are_supported":
            "Only Semantic Scholar author links are supported here.",
          "runtime.components.profile.profile-onboarding-modal.text_choose_the_profile_that_best_matches_your_publications_and_affiliation":
            "Choose the profile that best matches your publications and affiliation.",
          "runtime.components.profile.profile-onboarding-modal.text_search_results_show_affiliation_homepage_and_sample_publications":
            "Search results show affiliation, homepage, and representative papers to help you recognize the right profile.",
          "runtime.components.profile.profile-onboarding-modal.placeholder_search_by_name":
            "Search by name...",
          "runtime.components.profile.profile-onboarding-modal.text_search": "Search",
          "runtime.components.profile.profile-onboarding-modal.text_found": "Found",
          "runtime.components.profile.profile-onboarding-modal.text_potential_matches":
            "potential matches",
          "runtime.components.profile.profile-onboarding-modal.text_search_for_your_name_to_find":
            "Search for your name to find your profile",
          "runtime.components.profile.profile-onboarding-modal.text_no_affiliation_listed":
            "No affiliation listed",
          "runtime.components.profile.profile-onboarding-modal.text_h_index_2": "h-index",
          "runtime.components.profile.profile-onboarding-modal.text_papers": "Papers",
          "runtime.components.profile.profile-onboarding-modal.text_citations": "Citations",
          "runtime.components.profile.profile-onboarding-modal.text_view_profile": "View Profile",
          "runtime.components.profile.profile-onboarding-modal.text_preview_publications":
            "Preview publications",
          "runtime.components.profile.profile-onboarding-modal.text_we_will_sync_the_publications_shown_here":
            "We will sync the publications shown here and use them to build your profile page.",
          "runtime.components.profile.profile-onboarding-modal.text_link_this_profile":
            "Link this profile",
          "runtime.components.profile.profile-onboarding-modal.text_back_to_search":
            "Back to search",
          "runtime.components.profile.profile-onboarding-modal.text_back_to_paste":
            "Back to paste",
          "runtime.components.profile.profile-onboarding-modal.text_this_is_not_me":
            "This is not me",
          "runtime.components.profile.profile-onboarding-modal.text_skip_for_now":
            "Skip for now",
          "runtime.components.profile.profile-onboarding-modal.text_semantic_scholar_profile":
            "Semantic Scholar Profile",
        } as Record<string, string>
      )[key] || key,
  }),
}))

describe("ProfileOnboardingModal", () => {
  beforeEach(() => {
    mockSearchAuthors.mockReset()
    mockGetAuthorDetails.mockReset()
    mockLinkAcademicProfile.mockReset()
    mockToast.mockReset()
  })

  it("renders the paste-first flow by default", () => {
    render(
      <ProfileOnboardingModal
        isOpen
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
        userName="Grace Hopper"
      />,
    )

    expect(screen.getByText("Find your profile on Semantic Scholar")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Paste a Semantic Scholar profile URL or author ID"),
    ).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Continue" })[0]).toBeDisabled()
  })

  it("shows inline validation for unsupported URLs", () => {
    render(
      <ProfileOnboardingModal
        isOpen
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
        userName="Grace Hopper"
      />,
    )

    fireEvent.change(
      screen.getByPlaceholderText("Paste a Semantic Scholar profile URL or author ID"),
      {
        target: { value: "https://scholar.google.com/citations?user=abc123" },
      },
    )

    expect(
      screen.getByText("Only Semantic Scholar author links are supported here."),
    ).toBeInTheDocument()
  })

  it("opens the richer fallback search and renders recognizable search results", async () => {
    mockSearchAuthors.mockResolvedValue({
      data: [
        {
          authorId: "123",
          name: "Grace Hopper",
          affiliations: ["Yale University", "Harvard University"],
          homepage: "https://www.yale.edu/~hopper",
          paperCount: 12,
          citationCount: 340,
          hIndex: 8,
          externalIds: { ORCID: ["0000-0001-2345-6789"], DBLP: ["hopper/Grace"] },
          papers: [
            { paperId: "p-1", title: "Compiler Design", year: 1952, venue: "CACM" },
          ],
        },
      ],
    })

    render(
      <ProfileOnboardingModal
        isOpen
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
        userName="Grace Hopper"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Search by name instead" }))
    fireEvent.change(screen.getByPlaceholderText("Search by name..."), {
      target: { value: "Grace Hopper" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Search" }))

    await waitFor(() => {
      expect(screen.getByText("Grace Hopper")).toBeInTheDocument()
    })

    expect(screen.getByText("Yale University")).toBeInTheDocument()
    expect(screen.getByText("Compiler Design")).toBeInTheDocument()
    expect(screen.getByText("ORCID")).toBeInTheDocument()
    expect(screen.getByText("DBLP")).toBeInTheDocument()
  })

  it("resolves a pasted Semantic Scholar profile URL into the confirm step", async () => {
    mockGetAuthorDetails.mockResolvedValue({
      authorId: "1741101",
      name: "Grace Hopper",
      affiliations: ["Yale University"],
      paperCount: 12,
      citationCount: 340,
      hIndex: 8,
      url: "https://www.semanticscholar.org/author/1741101",
      papers: [{ paperId: "p-1", title: "Compiler Design", year: 1952, venue: "CACM" }],
    })

    render(
      <ProfileOnboardingModal
        isOpen
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
        userName="Grace Hopper"
      />,
    )

    fireEvent.change(
      screen.getByPlaceholderText("Paste a Semantic Scholar profile URL or author ID"),
      {
        target: { value: "https://www.semanticscholar.org/author/Grace-Hopper/1741101" },
      },
    )
    fireEvent.click(screen.getAllByRole("button", { name: "Continue" })[0])

    await waitFor(() => {
      expect(screen.getByText("Preview publications")).toBeInTheDocument()
    })

    expect(mockGetAuthorDetails).toHaveBeenCalledWith("1741101")
    expect(screen.getByRole("button", { name: "Link this profile" })).toBeInTheDocument()
  })
})

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { tStatic } from "@/lib/i18n/static-translate"
import UserProfilePage from "./page"

const {
  mockApiFetch,
  mockGetAcademicProfile,
  mockGetAcademicProfileByEmail,
  mockGetProfileSyncStatus,
  mockResolveUserEmail,
  mockUseParams,
  mockPush,
  mockRefreshUser,
  mockToast,
  mockAuthState,
} = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockGetAcademicProfile: vi.fn(),
  mockGetAcademicProfileByEmail: vi.fn(),
  mockGetProfileSyncStatus: vi.fn(),
  mockResolveUserEmail: vi.fn(),
  mockUseParams: vi.fn(),
  mockPush: vi.fn(),
  mockRefreshUser: vi.fn(),
  mockToast: vi.fn(),
  mockAuthState: {
    user: { id: 1, email: "grace@example.com", name: "Grace Hopper" },
    refreshUser: vi.fn(),
    isAuthenticated: true,
    currentRole: "author",
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/profile/me",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockUseParams(),
}))

vi.mock("@/components/dashboard-sidebar", () => ({
  DashboardSidebar: () => <div data-testid="dashboard-sidebar" />,
}))

vi.mock("@/components/profile/profile-onboarding-modal", () => ({
  ProfileOnboardingModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="profile-onboarding-modal" /> : null,
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    ...mockAuthState,
    refreshUser: mockRefreshUser,
  }),
}))

vi.mock("@/lib/profile/resolve-user-email", () => ({
  resolveUserEmail: mockResolveUserEmail,
}))

vi.mock("@/lib/api/client", () => {
  class ApiError extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }

  class UnauthorizedError extends Error {}

  return {
    ApiError,
    UnauthorizedError,
    apiFetch: mockApiFetch,
  }
})

vi.mock("@/lib/api/user", () => ({
  userApi: {
    getAcademicProfile: mockGetAcademicProfile,
    getAcademicProfileByEmail: mockGetAcademicProfileByEmail,
    getProfileSyncStatus: mockGetProfileSyncStatus,
    unlinkAcademicProfile: vi.fn(),
  },
}))

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({
    locale: "en",
    messages: {},
    setLocale: vi.fn(),
    t: tStatic,
    tList: () => [],
  }),
}))

const buildAcademicProfile = () => ({
  userId: 1,
  semanticScholarId: "ss-1",
  name: "Grace Hopper",
  affiliations: ["Yale University", "US Navy"],
  paperCount: 9,
  citationCount: 1520,
  hIndex: 28,
  url: "https://www.semanticscholar.org/author/ss-1",
  syncedAt: "2026-03-08 09:00:00",
  papers: [
    {
      paperId: "p-1",
      title: "Compilers for Early Systems",
      abstract: "A foundational paper on compilers.",
      year: 1952,
      citationCount: 320,
      venue: "CACM",
      url: "https://example.com/p-1",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
    {
      paperId: "p-2",
      title: "High Impact Systems",
      abstract: "A highly cited systems paper.",
      year: 1960,
      citationCount: 910,
      venue: "IEEE",
      url: "https://example.com/p-2",
      authors: [
        { authorId: "a-1", name: "Grace Hopper" },
        { authorId: "a-2", name: "Alan Turing" },
      ],
    },
    {
      paperId: "p-3",
      title: "Machine Vision Notes",
      abstract: "Notes on early machine perception.",
      year: 1958,
      citationCount: 75,
      venue: "Vision Journal",
      url: "https://example.com/p-3",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
    {
      paperId: "p-4",
      title: "Paper Four",
      year: 1951,
      citationCount: 21,
      venue: "Venue Four",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
    {
      paperId: "p-5",
      title: "Paper Five",
      year: 1950,
      citationCount: 19,
      venue: "Venue Five",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
    {
      paperId: "p-6",
      title: "Paper Six",
      year: 1949,
      citationCount: 14,
      venue: "Venue Six",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
    {
      paperId: "p-7",
      title: "Paper Seven",
      year: 1948,
      citationCount: 9,
      venue: "Venue Seven",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
    {
      paperId: "p-8",
      title: "Paper Eight",
      year: 1947,
      citationCount: 4,
      venue: "Venue Eight",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
    {
      paperId: "p-9",
      title: "Paper Nine",
      year: 1946,
      citationCount: 1,
      venue: "Venue Nine",
      authors: [{ authorId: "a-1", name: "Grace Hopper" }],
    },
  ],
})

describe("UserProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => "en"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
    })
    mockUseParams.mockReturnValue({ user_id: "me" })
    mockResolveUserEmail.mockResolvedValue({ mode: "me" })
    mockApiFetch.mockResolvedValue({
      data: {
        data: {
          id: 1,
          email: "grace@example.com",
          first_name: "Grace",
          last_name: "Hopper",
          domain: ["Compilers", "Programming Languages"],
          profile_sync_status: "completed",
        },
      },
      response: {} as Response,
    })
    mockGetAcademicProfile.mockResolvedValue({
      data: { data: buildAcademicProfile() },
    })
    mockGetProfileSyncStatus.mockResolvedValue({
      data: { data: { profile_sync_status: "completed" } },
    })
    mockGetAcademicProfileByEmail.mockResolvedValue({
      data: { data: buildAcademicProfile() },
    })
  })

  it("renders an owner profile with publication controls", async () => {
    render(<UserProfilePage />)

    await screen.findByRole("heading", { level: 1, name: "Grace Hopper" })

    expect(screen.getByText("Your profile")).toBeInTheDocument()
    expect(screen.getByText("Academic profile linked")).toBeInTheDocument()
    expect(screen.getAllByText("Compilers").length).toBeGreaterThan(0)
    expect(screen.getByText("Paper Eight")).toBeInTheDocument()
    expect(screen.queryByText("Paper Nine")).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Search publications/i), {
      target: { value: "vision" },
    })

    await waitFor(() => {
      expect(screen.getByText("Machine Vision Notes")).toBeInTheDocument()
      expect(screen.queryByText("Compilers for Early Systems")).not.toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Search publications/i), {
      target: { value: "" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Most cited" }))

    await waitFor(() => {
      const titles = Array.from(document.querySelectorAll("article h3")).map((node) =>
        node.textContent?.trim(),
      )
      expect(titles[0]).toBe("High Impact Systems")
    })
  })

  it("renders a public profile in read-only mode with academic publications", async () => {
    mockUseParams.mockReturnValue({ user_id: "public-user" })
    mockResolveUserEmail.mockResolvedValue({ mode: "email", email: "public@example.com" })
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: {
          id: 2,
          email: "public@example.com",
          first_name: "Public",
          last_name: "Researcher",
          domain: ["AI"],
          profile_sync_status: "completed",
        },
      },
      response: {} as Response,
    })

    render(<UserProfilePage />)

    await screen.findByRole("heading", { level: 1, name: "Grace Hopper" })

    expect(screen.getByText("Read-only profile")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Connect" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Unlink" })).not.toBeInTheDocument()
    expect(screen.getAllByText("public@example.com").length).toBeGreaterThan(0)
    expect(screen.getByText("Compilers for Early Systems")).toBeInTheDocument()
  })
})

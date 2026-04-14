import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import ChairConferenceDetailPage from "./page"

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockGetConferenceById = vi.fn()

vi.mock("next/navigation", () => ({
  useParams: () => ({ conferenceId: "1" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}))

vi.mock("@/components/dashboard-sidebar", () => ({
  DashboardSidebar: () => <div data-testid="dashboard-sidebar" />,
}))

vi.mock("@/lib/navigation", () => ({
  getSidebarMenuItems: () => [],
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ currentRole: "chair", isAuthLoading: false }),
}))

vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@/lib/api/conferences", () => ({
  getConferenceById: (...args: unknown[]) => mockGetConferenceById(...args),
}))

vi.mock("@/components/author/conference-detail/committee-tab", () => ({
  CommitteeTab: ({ conference }: { conference: { fullName?: string; name?: string } }) => (
    <div>public committee {conference.fullName || conference.name}</div>
  ),
}))

vi.mock("@/components/chair/conference-detail", () => ({
  ConferenceDetailHeader: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <button type="button" onClick={() => onTabChange("committee")}>
      Open Committee
    </button>
  ),
  ConferenceDetailDashboard: () => <div>dashboard</div>,
  ConferenceOverview: () => <div>overview</div>,
  ConferenceCFP: () => <div>cfp</div>,
  ConferenceDates: () => <div>dates</div>,
  ConferenceCommittee: () => <div>management committee</div>,
  ConferenceCOI: () => <div>coi</div>,
  ConferenceSubmissions: () => <div>submissions</div>,
  ConferenceAssignments: () => <div>assignments</div>,
  ConferenceRebuttalSettings: () => <div>rebuttal settings</div>,
  ConferenceRebuttalManagement: () => <div>rebuttal management</div>,
}))

describe("ChairConferenceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the public committee view for conference guests", async () => {
    mockGetConferenceById.mockResolvedValue({
      data: {
        id: "1",
        acronym: "CONF",
        name: "Guest Conference",
        location: "Paris",
        conference_date: "2026-01-01T00:00:00Z",
        conference_end_date: "2026-01-05T00:00:00Z",
        year: 2026,
        userRole: "reviewer",
      },
      error: null,
      status: 200,
    })

    render(<ChairConferenceDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: /open committee/i }))

    expect(await screen.findByText(/public committee guest conference/i)).toBeInTheDocument()
    expect(screen.queryByText(/management committee/i)).not.toBeInTheDocument()
  })

  it("keeps the management committee view for chair users", async () => {
    mockGetConferenceById.mockResolvedValue({
      data: {
        id: "1",
        acronym: "CONF",
        name: "Managed Conference",
        location: "Paris",
        conference_date: "2026-01-01T00:00:00Z",
        conference_end_date: "2026-01-05T00:00:00Z",
        year: 2026,
        userRole: "chair",
      },
      error: null,
      status: 200,
    })

    render(<ChairConferenceDetailPage />)

    fireEvent.click(screen.getByRole("button", { name: /open committee/i }))

    expect(await screen.findByText(/management committee/i)).toBeInTheDocument()
    expect(screen.queryByText(/public committee/i)).not.toBeInTheDocument()
  })
})

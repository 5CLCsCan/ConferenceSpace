import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConferenceDetailHeader } from "../conference-detail-header"

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

vi.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | boolean)[]) =>
    args.filter((a) => typeof a === "string" && a).join(" "),
}))

beforeEach(() => {
  localStorage.setItem("conference_locale", "en")
})

const mockConference = {
  id: "1",
  acronym: "CONF",
  fullName: "Test Conference",
  location: "Paris",
  startDate: "Jan 01",
  endDate: "Jan 05",
  year: "2026",
}

// Counts tab buttons rendered in the nav area
function getTabButtons(container: HTMLElement) {
  // Tab buttons are inside the border-t div (the tabs bar), not the header actions
  const tabBar = container.querySelector(".overflow-x-auto")
  return tabBar ? tabBar.querySelectorAll("button") : []
}

const TOTAL_TABS = 8 // dashboard, overview, cfp, dates, committee, submissions, assignments, coi
const CHAIR_ONLY_TAB_COUNT = 1 // coi

describe("ConferenceDetailHeader — tab visibility by role", () => {
  it("shows all tabs (including COI) for chair role", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="chair"
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS)
  })

  it("hides COI tab for author role — one fewer tab than chair", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="author"
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS - CHAIR_ONLY_TAB_COUNT)
  })

  it("hides COI tab for reviewer role", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="reviewer"
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS - CHAIR_ONLY_TAB_COUNT)
  })

  it("hides COI tab when no userRole provided", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS - CHAIR_ONLY_TAB_COUNT)
  })

  it("COI tab icon (warning) is present for chair but absent for author", () => {
    const { container: chairContainer } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="chair"
      />,
    )
    const tabBar = chairContainer.querySelector(".overflow-x-auto")
    expect(tabBar?.textContent).toContain("warning")

    const { container: authorContainer } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="author"
      />,
    )
    const authorTabBar = authorContainer.querySelector(".overflow-x-auto")
    expect(authorTabBar?.textContent).not.toContain("warning")
  })
})

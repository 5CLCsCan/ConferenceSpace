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
  // Tabs are inside ScrollArea (data-slot="scroll-area-viewport") within the border-t wrapper
  const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
  if (viewport) return viewport.querySelectorAll("button")
  // Fallback: look in border-t container directly
  const tabBar = container.querySelector(".border-t")
  return tabBar ? tabBar.querySelectorAll("button") : []
}

const TOTAL_TABS = 9 // dashboard, overview, cfp, dates, committee, submissions, assignments, coi, rebuttal
const RESTRICTED_TAB_COUNT = 4 // submissions, assignments, coi, rebuttal

describe("ConferenceDetailHeader — tab visibility by role", () => {
  it("uses the legacy direct overflow tab shell instead of the scroll-area wrapper", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="chair"
      />,
    )

    expect(screen.getByText("Test Conference")).toBeInTheDocument()
    expect(screen.getByText("Paris")).toBeInTheDocument()
    expect(screen.getByText(/Jan 01/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: /Assignments/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: /Rebuttal/i,
      }),
    ).toBeInTheDocument()
    expect(container.querySelector('[data-slot="scroll-area-viewport"]')).toBeNull()
    expect(
      container.querySelector(".px-8.border-t.border-slate-100.overflow-x-auto"),
    ).not.toBeNull()
  })

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

  it("shows all restricted tabs for co-chair role", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="co-chair"
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS)
  })

  it("hides restricted tabs for author role", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="author"
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS - RESTRICTED_TAB_COUNT)
  })

  it("hides restricted tabs for reviewer role", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="reviewer"
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS - RESTRICTED_TAB_COUNT)
  })

  it("hides restricted tabs when no userRole provided", () => {
    const { container } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
      />,
    )
    expect(getTabButtons(container).length).toBe(TOTAL_TABS - RESTRICTED_TAB_COUNT)
  })

  it("restricted tab icons are present for chair but absent for author", () => {
    const { container: chairContainer } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="chair"
      />,
    )
    const chairViewport =
      chairContainer.querySelector('[data-slot="scroll-area-viewport"]') ??
      chairContainer.querySelector(".border-t")
    expect(chairViewport?.textContent).toContain("warning")
    expect(chairViewport?.textContent).toContain("assignment_ind")
    expect(chairViewport?.textContent).toContain("description")
    expect(chairViewport?.textContent).toContain("rate_review")

    const { container: authorContainer } = render(
      <ConferenceDetailHeader
        conference={mockConference}
        activeTab="dashboard"
        onTabChange={vi.fn()}
        userRole="author"
      />,
    )
    const authorViewport =
      authorContainer.querySelector('[data-slot="scroll-area-viewport"]') ??
      authorContainer.querySelector(".border-t")
    expect(authorViewport?.textContent).not.toContain("warning")
    expect(authorViewport?.textContent).not.toContain("assignment_ind")
    expect(authorViewport?.textContent).not.toContain("description")
    expect(authorViewport?.textContent).not.toContain("rate_review")
  })
})

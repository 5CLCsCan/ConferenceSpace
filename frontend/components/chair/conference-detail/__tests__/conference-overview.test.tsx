import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConferenceOverview } from "../conference-overview"

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

vi.mock("@/lib/api/conferences", () => ({
  getConferenceById: vi.fn(async () => ({
    data: {
      id: "1",
      name: "Conference on AI Systems",
      acronym: "CAIS",
      description: "Scope and objectives.",
      location: "Ho Chi Minh City",
      conference_date: "2026-08-01T00:00:00.000Z",
      conference_end_date: "2026-08-05T00:00:00.000Z",
      status: "open",
      domain: ["Machine Learning", "Systems"],
    },
    error: null,
  })),
  getConferenceTracks: vi.fn(async () => ({
    data: [
      { id: "track-1", name: "AI Systems", description: "Systems track" },
      { id: "track-2", name: "ML Infra", description: "Infrastructure track" },
    ],
    error: null,
  })),
}))

describe("ConferenceOverview", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders the restored legacy overview shell", async () => {
    render(<ConferenceOverview conferenceId="1" />)

    expect(await screen.findByText(/About the Conference/i)).toHaveClass("text-card-header")
    expect(screen.getByText(/Conference Tracks/i)).toHaveClass("text-card-header")
    expect(screen.getByText(/Details/i)).toHaveClass("text-card-header")
    expect(screen.getByText(/Keywords/i)).toHaveClass("text-card-header")
    expect(screen.getByText(/Scope and objectives\./i)).toHaveClass("text-body")
  })
})

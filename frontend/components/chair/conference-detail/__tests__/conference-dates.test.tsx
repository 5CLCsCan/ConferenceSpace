import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConferenceDates } from "../conference-dates"

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

vi.mock("@/lib/utils/ics-calendar", () => ({
  downloadICS: vi.fn(),
}))

vi.mock("@/lib/api/conferences", () => ({
  getConferenceDates: vi.fn(async () => ({
    data: [
      {
        id: "date-1",
        title: "Abstract Submission Deadline",
        description: "Register the abstract",
        date: "2026-06-01T00:00:00.000Z",
        isPast: false,
      },
      {
        id: "date-2",
        title: "Notification of Acceptance",
        description: "Decision announcement",
        date: "2026-07-01T00:00:00.000Z",
        isPast: false,
      },
    ],
    error: null,
  })),
  getConferenceById: vi.fn(async () => ({
    data: {
      acronym: "CAIS",
      name: "Conference on AI Systems",
    },
    error: null,
  })),
}))

describe("ConferenceDates", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders the restored timeline shell", async () => {
    render(<ConferenceDates conferenceId="1" />)

    expect(await screen.findByText(/Conference Timeline/i)).toBeInTheDocument()
    expect(screen.getByText(/Submission Phase/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Sync to Calendar/i })).toBeInTheDocument()
  })
})

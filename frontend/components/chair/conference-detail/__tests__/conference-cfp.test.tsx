import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConferenceCFP } from "../conference-cfp"

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
      call_for_paper_text: "# Call for Papers\n\nSubmit your best work.",
    },
    error: null,
  })),
  getConferenceDates: vi.fn(async () => ({
    data: [
      {
        id: "date-1",
        title: "Abstract Deadline",
        date: "2026-06-01T00:00:00.000Z",
      },
    ],
    error: null,
  })),
}))

describe("ConferenceCFP", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders the restored CFP shell with the legacy right rail", async () => {
    render(<ConferenceCFP conferenceId="1" />)

    expect(await screen.findByText(/Important Dates/i)).toBeInTheDocument()
    expect(screen.getByText(/Author Resources/i)).toBeInTheDocument()
  })
})

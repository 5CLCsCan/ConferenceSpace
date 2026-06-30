import { beforeEach, describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { ImportantDatesTab } from "../important-dates-tab"

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

describe("ImportantDatesTab", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders timeline without translation reference errors", () => {
    const dates = [
      {
        id: "1",
        title: "Submission Deadline",
        description: "Final paper submission deadline",
        date: "2099-01-10T23:59:00.000Z",
        isPast: false,
      },
      {
        id: "2",
        title: "Review Notification",
        description: "Decision announcement",
        date: "2099-02-20T23:59:00.000Z",
        isPast: false,
      },
    ]

    expect(() => render(<ImportantDatesTab dates={dates as any} />)).not.toThrow()
  })
})

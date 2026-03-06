import { beforeEach, describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { OverviewTab } from "../overview-tab"

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

describe("OverviewTab", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders conference sections without translation reference errors", () => {
    const conference = {
      id: "123",
      name: "Conference on AI Systems",
      acronym: "CAIS",
      year: 2026,
      description: "Scope and objectives.",
      tracks: ["AI Systems"],
      location: "Ho Chi Minh City",
      website: "example.org",
      primary_contact: "chair@example.org",
      domain: ["Machine Learning"],
    }

    expect(() => render(<OverviewTab conference={conference as any} />)).not.toThrow()
  })
})


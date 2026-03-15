import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConferenceCOI } from "../conference-coi"

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

vi.mock("@/lib/api/coi", () => ({
  getCOIDashboardStats: vi.fn(async () => ({
    total_relationships: 10,
    coi_detected: 6,
  })),
  getAllCOIRelationships: vi.fn(async () => ({
    relationships: [
      {
        id: 1,
        reviewer_name: "Reviewer One",
        reviewer_email: "reviewer@example.com",
        author_name: "Author One",
        author_email: "author@example.com",
        type: "coauthor",
        severity: "high",
        detected_by: "system",
      },
    ],
    total: 1,
  })),
  rebuildCOIRelationships: vi.fn(async () => ({
    relationships_stored: 10,
  })),
}))

describe("ConferenceCOI", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders the restored COI action shell", async () => {
    render(<ConferenceCOI conferenceId="1" />)

    expect(
      await screen.findByText(/Conflicts of Interest Management/i),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Export Report/i })).toBeInTheDocument()
  })
})

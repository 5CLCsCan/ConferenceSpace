import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AuthorConferences } from "../author-conferences"

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { email: "author@example.com" },
  }),
}))

vi.mock("@/lib/api/conferences", () => ({
  listConferences: vi.fn().mockResolvedValue({ data: { conferences: [] } }),
}))

vi.mock("@/lib/api/submissions", () => ({
  getConferenceSubmissions: vi.fn().mockResolvedValue({ data: { submissions: [] } }),
}))

describe("AuthorConferences", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders without throwing when helper sections access translations", () => {
    expect(() => render(<AuthorConferences conferences={[]} />)).not.toThrow()
    expect(screen.getByText("Conferences")).toBeInTheDocument()
  })
})


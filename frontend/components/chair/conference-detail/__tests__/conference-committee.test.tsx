import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConferenceCommittee } from "../conference-committee"

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

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}))

vi.mock("@/lib/api/conferences", () => ({
  getConferenceReviewers: vi.fn(async (_conferenceId: string, params?: { status?: string }) => ({
    data: {
      reviewers:
        params?.status === "pending"
          ? []
          : [
              {
                id: 1,
                user_id: 1,
                email: "reviewer@example.com",
                status: "accepted",
                domain: ["AI Systems"],
              },
            ],
      total: params?.status === "pending" ? 0 : 1,
      limit: 200,
      offset: 0,
    },
    error: null,
  })),
  inviteReviewers: vi.fn(),
  removeReviewer: vi.fn(),
}))

describe("ConferenceCommittee", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders the restored committee management shell", async () => {
    render(<ConferenceCommittee conferenceId="1" />)

    expect(await screen.findByText(/Committee Members/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Import CSV/i })).toBeInTheDocument()
  })
})

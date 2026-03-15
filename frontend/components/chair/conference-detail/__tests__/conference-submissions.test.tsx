import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ConferenceSubmissions } from "../conference-submissions"

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

vi.mock("@/hooks/use-debounce", () => ({
  useDebounce: (value: string) => value,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/lib/api/submissions", () => ({
  getConferenceSubmissions: vi.fn(async () => ({
    data: {
      submissions: [
        {
          id: 101,
          title: "Paper Title",
          author: "Author Name",
          status: "reviewing",
        },
      ],
      total: 1,
    },
    error: null,
  })),
}))

vi.mock("@/lib/api/reviews", () => ({
  getSubmissionReviews: vi.fn(async () => ({
    data: [
      { review_status: "submitted", review_score: 4 },
      { review_status: "submitted", review_score: 5 },
    ],
  })),
}))

describe("ConferenceSubmissions", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders the restored submissions control bar", async () => {
    render(<ConferenceSubmissions conferenceId="1" />)

    expect(await screen.findByText(/Paper Details/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Assign Reviewers/i })).toBeInTheDocument()
  })
})

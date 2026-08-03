import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
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

vi.mock("@/lib/api/conferences", () => ({
  getConferenceTracks: vi.fn(async () => ({
    data: [],
    error: null,
  })),
}))

vi.mock("@/lib/api/suggestions", () => ({
  getConfirmedAssignments: vi.fn(async () => ({
    data: {
      assignments: [
        {
          submission_id: 101,
          submission_title: "Paper Title",
          reviewers: [
            {
              assignment_id: 1,
              reviewer_id: 1,
              reviewer_email: "pending@example.com",
              score: 0,
              status: "pending",
              review_status: "not_started",
            },
            {
              assignment_id: 2,
              reviewer_id: 2,
              reviewer_email: "accepted-not-started@example.com",
              score: 0,
              status: "accepted",
              review_status: "not_started",
            },
            {
              assignment_id: 3,
              reviewer_id: 3,
              reviewer_email: "accepted-submitted@example.com",
              score: 0,
              status: "accepted",
              review_status: "submitted",
            },
            {
              assignment_id: 4,
              reviewer_id: 4,
              reviewer_email: "declined@example.com",
              score: 0,
              status: "declined",
              review_status: "not_started",
            },
            {
              assignment_id: 5,
              reviewer_id: 5,
              reviewer_email: "completed@example.com",
              score: 0,
              status: "completed",
              review_status: "submitted",
            },
          ],
        },
      ],
      total_papers: 1,
      total_assignments: 5,
    },
    error: null,
  })),
}))

describe("ConferenceSubmissions", () => {
  beforeEach(() => {
    localStorage.setItem("conference_locale", "en")
  })

  it("renders the restored submissions control bar", async () => {
    render(<ConferenceSubmissions conferenceId="1" />)

    expect(await screen.findByText(/Paper Details/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Assign Reviewers/i })).not.toBeInTheDocument()
  })

  it("renders per-paper reviewer assignment stats", async () => {
    render(<ConferenceSubmissions conferenceId="1" />)

    const row = (await screen.findByText("Paper Title")).closest("tr")
    expect(row).not.toBeNull()
    const rowScope = within(row as HTMLTableRowElement)

    expect(rowScope.getByText(/Invited/i)).toBeInTheDocument()
    expect(rowScope.getByText("5")).toBeInTheDocument()
    expect(rowScope.getByText(/Accepted/i)).toBeInTheDocument()
    expect(rowScope.getByText("3")).toBeInTheDocument()
    expect(rowScope.getByText(/Completed/i)).toBeInTheDocument()
    expect(rowScope.getByText("2")).toBeInTheDocument()
    expect(rowScope.getByText(/Incomplete/i)).toBeInTheDocument()
    expect(rowScope.getByText("1")).toBeInTheDocument()
  })
})

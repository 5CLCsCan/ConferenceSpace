import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { PaperSubmissionForm } from "../paper-submission-form"
import type { Conference } from "@/lib/types"

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
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      email: "author@example.com",
      first_name: "Author",
      last_name: "User",
      roles: ["author"],
      expertise: [],
      name: "Author User",
    },
  }),
}))

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/api/papers", () => ({
  submitPaper: vi.fn(),
  updatePaper: vi.fn(),
  publishPaper: vi.fn(),
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | boolean)[]) =>
    args.filter((a) => typeof a === "string" && a).join(" "),
}))

vi.mock("@/lib/routes", () => ({
  ROUTES: {
    AUTHOR: {
      CONFERENCE_DETAIL: (id: string) => `/role/author/conferences/${id}`,
    },
  },
}))

// Stub child step components so we don't have to mock their dependencies
vi.mock("../submission-progress-sidebar", () => ({
  SubmissionProgressSidebar: () => <div data-testid="progress-sidebar" />,
}))
vi.mock("../paper-details-step", () => ({
  PaperDetailsStep: () => <div data-testid="paper-details-step" />,
}))
vi.mock("../authors-step", () => ({
  AuthorsStep: () => <div data-testid="authors-step" />,
}))
vi.mock("../file-upload-step", () => ({
  FileUploadStep: () => <div data-testid="file-upload-step" />,
}))
vi.mock("../conflicts-step", () => ({
  ConflictsStep: () => <div data-testid="conflicts-step" />,
}))
vi.mock("../review-step", () => ({
  ReviewStep: () => <div data-testid="review-step" />,
}))
vi.mock("../submission-action-bar", () => ({
  SubmissionActionBar: ({ canSubmit }: { canSubmit?: boolean }) => (
    <div data-testid="action-bar">
      <button disabled={canSubmit === false} data-testid="submit-btn">
        Submit Paper
      </button>
    </div>
  ),
}))
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))

function makeConference(overrides?: Partial<Conference>): Conference {
  return {
    id: "1",
    name: "Test Conference",
    acronym: "TC2026",
    year: 2026,
    description: "",
    submission_deadline: "",
    review_deadline: "",
    camera_ready_deadline: "",
    notification_date: "",
    conference_date: "",
    location: "",
    status: "open",
    tracks: [],
    ...overrides,
  }
}

describe("PaperSubmissionForm — deadline enforcement (UI-NEG-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows no deadline warning when no deadline is set", () => {
    render(<PaperSubmissionForm conference={makeConference()} />)
    expect(screen.queryByText(/deadline has passed/i)).not.toBeInTheDocument()
  })

  it("shows no deadline warning when deadline is in the future", () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    render(
      <PaperSubmissionForm
        conference={makeConference({
          configurations: { full_paper_submission_deadline: futureDate },
        })}
      />,
    )
    expect(screen.queryByText(/deadline has passed/i)).not.toBeInTheDocument()
  })

  it("shows deadline warning when deadline has passed", () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    render(
      <PaperSubmissionForm
        conference={makeConference({
          configurations: { full_paper_submission_deadline: pastDate },
        })}
      />,
    )
    expect(screen.getByText(/submission deadline has passed/i)).toBeInTheDocument()
  })

  it("disables submit button when deadline has passed", () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    render(
      <PaperSubmissionForm
        conference={makeConference({
          configurations: { full_paper_submission_deadline: pastDate },
        })}
      />,
    )
    const submitBtn = screen.getByTestId("submit-btn")
    expect(submitBtn).toBeDisabled()
  })

  it("does not show deadline warning when deadline is in the future", () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    render(
      <PaperSubmissionForm
        conference={makeConference({
          configurations: { full_paper_submission_deadline: futureDate },
        })}
      />,
    )
    // Deadline enforcement: no deadline warning should appear
    expect(screen.queryByText(/submission deadline has passed/i)).not.toBeInTheDocument()
    // Submit button exists (may be disabled for other reasons like precheck, not deadline)
    expect(screen.getByTestId("submit-btn")).toBeInTheDocument()
  })

  it("disables submit button when conference is not open (status check)", () => {
    render(<PaperSubmissionForm conference={makeConference({ status: "reviewing" })} />)
    const submitBtn = screen.getByTestId("submit-btn")
    expect(submitBtn).toBeDisabled()
  })
})

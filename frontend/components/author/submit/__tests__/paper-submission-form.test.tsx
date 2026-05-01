import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { PaperSubmissionForm } from "../paper-submission-form"
import type { Conference } from "@/lib/types"
import type { Submission } from "@/lib/api/submissions"
import { publishPaper, submitPaper, updatePaper } from "@/lib/api/papers"
import { updateSubmissionStatus } from "@/lib/api/submissions"

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

vi.mock("@/lib/api/submissions", () => ({
  updateSubmissionStatus: vi.fn(),
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
  SubmissionProgressSidebar: ({ onStepChange }: { onStepChange: (step: string) => void }) => (
    <div data-testid="progress-sidebar">
      {(["paper", "authors", "file", "coi", "review"] as const).map((step) => (
        <button key={step} type="button" data-testid={`step-${step}`} onClick={() => onStepChange(step)}>
          {step}
        </button>
      ))}
    </div>
  ),
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
  ConflictsStep: ({ coiConfirmed, onCoiConfirmedChange }: any) => (
    <label data-testid="conflicts-step">
      <input
        type="checkbox"
        data-testid="coi-confirmed-checkbox"
        checked={coiConfirmed}
        onChange={(e) => onCoiConfirmedChange(e.target.checked)}
      />
    </label>
  ),
}))
vi.mock("../review-step", () => ({
  ReviewStep: ({ submissionConfirmed, onSubmissionConfirmedChange }: any) => (
    <label data-testid="review-step">
      <input
        type="checkbox"
        data-testid="submission-confirmed-checkbox"
        checked={submissionConfirmed}
        onChange={(e) => onSubmissionConfirmedChange(e.target.checked)}
      />
    </label>
  ),
}))
vi.mock("../submission-action-bar", () => ({
  SubmissionActionBar: ({ currentStep, canSubmit, onStepChange, onSubmit }: any) => {
    const stepOrder = ["paper", "authors", "file", "coi", "review"] as const
    const currentIndex = stepOrder.indexOf(currentStep)
    const isLastStep = currentStep === "review"
    return (
    <div data-testid="action-bar">
      {isLastStep ? (
        <button disabled={canSubmit === false} data-testid="submit-btn" onClick={onSubmit}>
          Submit Paper
        </button>
      ) : (
        <button
          data-testid="next-btn"
          onClick={() => onStepChange(stepOrder[currentIndex + 1])}
        >
          Next
        </button>
      )}
    </div>
    )
  },
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

function makeSubmission(overrides?: Partial<Submission>): Submission {
  return {
    id: "10",
    conference_id: "1",
    author: "author@example.com",
    title: "Edited Paper",
    abstract: "Edited abstract",
    link: "",
    domain: [],
    status: "withdrawn",
    information: {
      keywords: ["ML"],
      co_authors: [],
      declared_conflicts: [],
      paper_type: "research",
      track_name: "Artificial Intelligence & Machine Learning",
      additional_notes: "",
      metadata: { language: "en", page_count: 10 },
    },
    file: {
      original_name: "paper.pdf",
      path: "/tmp/paper.pdf",
      size: 1024,
      mime_type: "application/pdf",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    fireEvent.click(screen.getByTestId("step-review"))
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
    fireEvent.click(screen.getByTestId("step-review"))
    // Deadline enforcement: no deadline warning should appear
    expect(screen.queryByText(/submission deadline has passed/i)).not.toBeInTheDocument()
    // Submit button exists (may be disabled for other reasons like precheck, not deadline)
    expect(screen.getByTestId("submit-btn")).toBeInTheDocument()
  })

  it("disables submit button when conference is not open (status check)", () => {
    render(<PaperSubmissionForm conference={makeConference({ status: "reviewing" })} />)
    fireEvent.click(screen.getByTestId("step-review"))
    const submitBtn = screen.getByTestId("submit-btn")
    expect(submitBtn).toBeDisabled()
  })

  it("prechecks the COI and accuracy confirmations when editing an existing submission", () => {
    render(
      <PaperSubmissionForm
        conference={makeConference()}
        submission={makeSubmission({ status: "withdrawn" })}
      />,
    )

    fireEvent.click(screen.getByTestId("step-coi"))

    expect(screen.getByTestId("coi-confirmed-checkbox")).toBeChecked()

    fireEvent.click(screen.getByTestId("step-review"))

    expect(screen.getByTestId("submission-confirmed-checkbox")).toBeChecked()
  })

  it("republishes a withdrawn submission when the author submits the edit", async () => {
    vi.mocked(updatePaper).mockResolvedValue({
      data: { id: "10" },
      error: null,
      precheckBlocked: null,
    } as any)
    vi.mocked(updateSubmissionStatus).mockResolvedValue({
      data: null,
      error: null,
      status: 200,
    } as any)
    vi.mocked(publishPaper).mockResolvedValue({
      data: { id: "10" },
      error: null,
      precheckBlocked: null,
    } as any)

    render(
      <PaperSubmissionForm
        conference={makeConference()}
        submission={makeSubmission({ status: "withdrawn" })}
      />,
    )

    fireEvent.click(screen.getByTestId("step-authors"))
    fireEvent.click(screen.getByTestId("next-btn"))
    fireEvent.click(screen.getByTestId("next-btn"))
    fireEvent.click(screen.getByTestId("next-btn"))

    fireEvent.click(screen.getByTestId("submit-btn"))

    await waitFor(() => expect(updatePaper).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(updateSubmissionStatus).toHaveBeenCalledWith("1", "10", "draft"))
    await waitFor(() => expect(publishPaper).toHaveBeenCalledWith("10", "1"))
  })
})

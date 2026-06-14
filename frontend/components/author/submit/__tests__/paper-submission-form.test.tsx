import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { PaperSubmissionForm } from "../paper-submission-form"
import type { Conference, PrecheckResult } from "@/lib/types"
import type { Submission } from "@/lib/api/submissions"
import { precheckPaper, publishPaper, submitPaper, updatePaper } from "@/lib/api/papers"
import { updateSubmissionStatus } from "@/lib/api/submissions"
import type { SubmissionAutofillResponse } from "@/lib/api/submission-autofill"

const toastMock = vi.fn()

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
  useToast: () => ({ toast: toastMock }),
}))

vi.mock("@/lib/api/papers", () => ({
  submitPaper: vi.fn(),
  updatePaper: vi.fn(),
  publishPaper: vi.fn(),
  precheckPaper: vi.fn(),
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
        <button
          key={step}
          type="button"
          data-testid={`step-${step}`}
          onClick={() => onStepChange(step)}
        >
          {step}
        </button>
      ))}
    </div>
  ),
}))
vi.mock("../paper-details-step", () => ({
  PaperDetailsStep: ({ onTitleChange }: any) => (
    <div data-testid="paper-details-step">
      <button
        type="button"
        data-testid="change-title-btn"
        onClick={() => onTitleChange("Changed Title")}
      >
        Change title
      </button>
    </div>
  ),
}))
vi.mock("../authors-step", () => ({
  AuthorsStep: () => <div data-testid="authors-step" />,
}))
vi.mock("../file-upload-step", () => ({
  FileUploadStep: ({ precheckLoading, precheckResult, precheckError }: any) => (
    <div data-testid="file-upload-step">
      {precheckLoading && <span data-testid="precheck-loading">running</span>}
      {precheckResult && <span data-testid="precheck-result">{precheckResult.decision}</span>}
      {precheckError && <span data-testid="precheck-error">{precheckError}</span>}
    </div>
  ),
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
  ReviewStep: ({
    title,
    abstract,
    keywords,
    authors,
    selectedTrack,
    uploadedFile,
    submissionConfirmed,
    onSubmissionConfirmedChange,
  }: any) => (
    <label data-testid="review-step">
      <span data-testid="review-title">{title}</span>
      <span data-testid="review-abstract">{abstract}</span>
      <span data-testid="review-keywords">{keywords.join(",")}</span>
      <span data-testid="review-track">{selectedTrack}</span>
      <span data-testid="review-file">{uploadedFile?.name || ""}</span>
      <span data-testid="review-authors">
        {authors.map((author: any) => author.email).join(",")}
      </span>
      <input
        type="checkbox"
        data-testid="submission-confirmed-checkbox"
        checked={submissionConfirmed}
        onChange={(e) => onSubmissionConfirmedChange(e.target.checked)}
      />
    </label>
  ),
}))
vi.mock("../submission-autofill-sheet", () => ({
  SubmissionAutofillSheet: ({ open, onApply }: any) => {
    const manuscript = new File(["paper"], "generated-paper.pdf", { type: "application/pdf" })

    return open ? (
      <button
        type="button"
        data-testid="apply-autofill"
        onClick={() =>
          onApply(
            {
              fields: {
                title: "Generated Title",
                abstract: "Generated abstract",
                keywords: ["AI", "Review"],
                paper_type: "student",
                additional_notes: "Generated notes",
              },
              selected_track_name: "Systems",
              track_rankings: [
                {
                  track_name: "Artificial Intelligence & Machine Learning",
                  confidence: 9.1,
                  rationale: "The manuscript is about AI.",
                },
                {
                  track_name: "Systems",
                  confidence: 7.4,
                  rationale: "The evaluation includes systems concerns.",
                },
              ],
              authors: [
                {
                  name: "Author User",
                  email: "author@example.com",
                  affiliation: "HCMUS",
                  country: "Vietnam",
                },
                {
                  name: "Second Author",
                  email: "second@example.com",
                  affiliation: "HCMUS",
                  country: "Vietnam",
                },
              ],
              materials: [
                {
                  file_id: "file-1",
                  filename: "generated-paper.pdf",
                  content_type: "application/pdf",
                  size_bytes: manuscript.size,
                  role: "manuscript",
                  extraction_status: "ready",
                  warnings: [],
                },
              ],
              warnings: [],
            } satisfies Partial<SubmissionAutofillResponse>,
            [manuscript],
          )
        }
      >
        Apply generated data
      </button>
    ) : null
  },
}))
vi.mock("../submission-action-bar", () => ({
  SubmissionActionBar: ({
    currentStep,
    canSubmit,
    onStepChange,
    onSubmit,
    onSaveDraft,
    onAutofill,
  }: any) => {
    const stepOrder = ["paper", "authors", "file", "coi", "review"] as const
    const currentIndex = stepOrder.indexOf(currentStep)
    const isLastStep = currentStep === "review"
    return (
      <div data-testid="action-bar">
        <button data-testid="autofill-btn" onClick={onAutofill}>
          Autofill
        </button>
        <button data-testid="save-draft-btn" onClick={onSaveDraft}>
          Save Draft
        </button>
        {isLastStep ? (
          <button disabled={canSubmit === false} data-testid="submit-btn" onClick={onSubmit}>
            Submit Paper
          </button>
        ) : (
          <button data-testid="next-btn" onClick={() => onStepChange(stepOrder[currentIndex + 1])}>
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
function makePrecheckResult(overrides?: Partial<PrecheckResult>): PrecheckResult {
  return {
    paper_title: "Generated Title",
    overall_score: 95,
    decision: "accept_for_review",
    summary: { total_items: 1, passed: 1, failed: 0, pass_rate: 100 },
    category_scores: {},
    detailed_results: [],
    ...overrides,
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe("PaperSubmissionForm — deadline enforcement (UI-NEG-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
    vi.mocked(precheckPaper).mockResolvedValue({
      data: makePrecheckResult(),
      error: null,
    })
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

  it("allows saving edits to an existing non-final submission after the deadline", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    vi.mocked(updatePaper).mockResolvedValue({
      data: { id: "10" },
      error: null,
      precheckBlocked: null,
    } as any)

    render(
      <PaperSubmissionForm
        conference={makeConference({
          configurations: { full_paper_submission_deadline: pastDate },
        })}
        submission={makeSubmission({ status: "published" })}
      />,
    )

    fireEvent.click(screen.getByTestId("save-draft-btn"))

    await waitFor(() => expect(updatePaper).toHaveBeenCalledTimes(1))
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

  it("applies generated autofill data to the draft and shows the review step", async () => {
    render(
      <PaperSubmissionForm
        conference={makeConference({
          tracks: ["Artificial Intelligence & Machine Learning", "Systems"],
        })}
        submission={makeSubmission({ status: "draft" })}
      />,
    )

    fireEvent.click(screen.getByTestId("autofill-btn"))
    fireEvent.click(screen.getByTestId("apply-autofill"))

    expect(screen.getByTestId("review-step")).toBeInTheDocument()
    expect(screen.getByTestId("review-title")).toHaveTextContent("Generated Title")
    expect(screen.getByTestId("review-abstract")).toHaveTextContent("Generated abstract")
    expect(screen.getByTestId("review-keywords")).toHaveTextContent("AI,Review")
    expect(screen.getByTestId("review-track")).toHaveTextContent("Systems")
    expect(screen.getByTestId("review-file")).toHaveTextContent("generated-paper.pdf")
    expect(screen.getByTestId("review-authors")).toHaveTextContent(
      "author@example.com,second@example.com",
    )
    expect(screen.getByTestId("submission-confirmed-checkbox")).not.toBeChecked()
    await waitFor(() => expect(precheckPaper).toHaveBeenCalledWith("1", expect.any(File)))
  })

  it("does not block autofill apply while precheck runs and keeps the result on the file step", async () => {
    const deferred = createDeferred<{ data: PrecheckResult | null; error: string | null }>()
    vi.mocked(precheckPaper).mockReturnValue(deferred.promise)

    render(
      <PaperSubmissionForm
        conference={makeConference({
          tracks: ["Artificial Intelligence & Machine Learning", "Systems"],
        })}
        submission={makeSubmission({ status: "draft" })}
      />,
    )

    fireEvent.click(screen.getByTestId("autofill-btn"))
    fireEvent.click(screen.getByTestId("apply-autofill"))

    expect(screen.getByTestId("review-step")).toBeInTheDocument()
    expect(screen.getByTestId("review-file")).toHaveTextContent("generated-paper.pdf")
    expect(precheckPaper).toHaveBeenCalledWith("1", expect.any(File))

    fireEvent.click(screen.getByTestId("step-file"))
    expect(screen.getByTestId("precheck-loading")).toBeInTheDocument()

    await act(async () => {
      deferred.resolve({ data: makePrecheckResult(), error: null })
      await deferred.promise
    })

    expect(screen.queryByTestId("precheck-loading")).not.toBeInTheDocument()
    expect(screen.getByTestId("precheck-result")).toHaveTextContent("accept_for_review")
  })

  it("shows a warning when autosave cannot create another submission for the conference", async () => {
    vi.useFakeTimers()
    vi.mocked(submitPaper).mockResolvedValue({
      data: null,
      error:
        "You already have a submission for this conference. Open your existing submission instead of creating a new one.",
      precheckBlocked: null,
    } as any)

    render(<PaperSubmissionForm conference={makeConference()} />)
    fireEvent.click(screen.getByTestId("change-title-btn"))

    await act(async () => {
      vi.advanceTimersByTime(2 * 60 * 1000)
      await Promise.resolve()
    })

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Failed to save draft",
        description:
          "You already have a submission for this conference. Open your existing submission instead of creating a new one.",
        variant: "destructive",
      }),
    )
    vi.useRealTimers()
  })

  it("does not autosave an untouched new submission form", async () => {
    vi.useFakeTimers()
    render(<PaperSubmissionForm conference={makeConference()} />)

    await act(async () => {
      vi.advanceTimersByTime(2 * 60 * 1000)
      await Promise.resolve()
    })

    expect(submitPaper).not.toHaveBeenCalled()
    expect(toastMock).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

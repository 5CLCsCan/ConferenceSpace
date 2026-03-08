import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ChairActionsPanel } from "../chair-actions-panel"
import * as client from "@/lib/api/client"

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

// Mock the apiFetch function
vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8080",
}))

// Mock cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...args: (string | undefined | boolean)[]) =>
    args.filter((a) => typeof a === "string" && a).join(" "),
}))

describe("ChairActionsPanel", () => {
  const mockApiFetch = client.apiFetch as ReturnType<typeof vi.fn>
  const mockOnNavigateToAssignments = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem("conference_locale", "en")
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("should render chair actions title", () => {
    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    expect(screen.getByText("Chair Actions")).toBeInTheDocument()
  })

  it("should render default action buttons", () => {
    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    expect(screen.getByText("Auto-Assign Reviewers")).toBeInTheDocument()
    expect(screen.getByText("View Assignments")).toBeInTheDocument()
    expect(screen.getByText("Edit CFP Details")).toBeInTheDocument()
  })

  it("should render next milestone with default values", () => {
    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    expect(screen.getByText("Next Milestone")).toBeInTheDocument()
    expect(screen.getByText("Author Notification")).toBeInTheDocument()
    expect(screen.getByText("Dec 10")).toBeInTheDocument()
  })

  it("should render custom milestone when provided", () => {
    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
        nextMilestone={{ label: "Review Deadline", date: "Jan 15" }}
      />,
    )

    expect(screen.getByText("Review Deadline")).toBeInTheDocument()
    expect(screen.getByText("Jan 15")).toBeInTheDocument()
  })

  it("should call onNavigateToAssignments when View Assignments is clicked", () => {
    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    const viewAssignmentsButton = screen.getByText("View Assignments")
    fireEvent.click(viewAssignmentsButton)

    expect(mockOnNavigateToAssignments).toHaveBeenCalledTimes(1)
  })

  it("should render custom actions when provided", () => {
    const customActions = [
      {
        id: "custom-1",
        label: "Custom Action 1",
        icon: "star",
        onClick: vi.fn(),
      },
      {
        id: "custom-2",
        label: "Custom Action 2",
        icon: "settings",
        onClick: vi.fn(),
      },
    ]

    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
        actions={customActions}
      />,
    )

    expect(screen.getByText("Custom Action 1")).toBeInTheDocument()
    expect(screen.getByText("Custom Action 2")).toBeInTheDocument()
    // Default actions should not be present
    expect(screen.queryByText("Auto-Assign Reviewers")).not.toBeInTheDocument()
  })

  it("should call custom action onClick when clicked", () => {
    const customOnClick = vi.fn()
    const customActions = [
      {
        id: "custom-1",
        label: "Custom Action",
        icon: "star",
        onClick: customOnClick,
      },
    ]

    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
        actions={customActions}
      />,
    )

    const customButton = screen.getByText("Custom Action")
    fireEvent.click(customButton)

    expect(customOnClick).toHaveBeenCalledTimes(1)
  })

  it("should show loading state when auto-assign button is clicked", async () => {
    // Create a promise that we can resolve manually
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockApiFetch.mockReturnValueOnce(pendingPromise)

    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    const autoAssignButton = screen.getByText("Auto-Assign Reviewers")
    fireEvent.click(autoAssignButton)

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText("Running...")).toBeInTheDocument()
    })

    // Resolve the promise to clean up
    resolvePromise!({
      data: { data: { total_assignments: 0, total_submissions: 0 } },
      response: { status: 200 },
    })
  })

  it("should show success message after auto-assign completes", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: { total_assignments: 5, total_submissions: 3 },
      },
      response: { status: 200 },
    })

    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    const autoAssignButton = screen.getByText("Auto-Assign Reviewers")
    fireEvent.click(autoAssignButton)

    await waitFor(() => {
      expect(screen.getByText("Created 5 suggestions for 3 papers")).toBeInTheDocument()
    })
  })

  it("should show error message when auto-assign fails", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("No reviewers available"))

    render(
      <ChairActionsPanel
        conferenceId="123"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    const autoAssignButton = screen.getByText("Auto-Assign Reviewers")
    fireEvent.click(autoAssignButton)

    await waitFor(() => {
      expect(screen.getByText("No reviewers available")).toBeInTheDocument()
    })
  })

  it("should call API with correct conference ID", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: {
        data: { total_assignments: 2, total_submissions: 1 },
      },
      response: { status: 200 },
    })

    render(
      <ChairActionsPanel
        conferenceId="456"
        onNavigateToAssignments={mockOnNavigateToAssignments}
      />,
    )

    const autoAssignButton = screen.getByText("Auto-Assign Reviewers")
    fireEvent.click(autoAssignButton)

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/conferences/456/submissions/auto-assign",
        expect.objectContaining({
          method: "POST",
        }),
      )
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ConferenceAssignments } from "../conference-assignments"
import * as suggestionsApi from "@/lib/api/suggestions"
import * as conferencesApi from "@/lib/api/conferences"

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

// Mock the API modules
vi.mock("@/lib/api/suggestions", () => ({
  getSuggestions: vi.fn(),
  confirmSuggestions: vi.fn(),
  deleteSuggestion: vi.fn(),
  addSuggestion: vi.fn(),
  getConfirmedAssignments: vi.fn(),
}))

vi.mock("@/lib/api/conferences", () => ({
  getConferenceReviewers: vi.fn(),
}))

describe("ConferenceAssignments", () => {
  const mockGetSuggestions = suggestionsApi.getSuggestions as ReturnType<typeof vi.fn>
  const mockGetConfirmedAssignments = suggestionsApi.getConfirmedAssignments as ReturnType<typeof vi.fn>
  const mockConfirmSuggestions = suggestionsApi.confirmSuggestions as ReturnType<typeof vi.fn>
  const mockDeleteSuggestion = suggestionsApi.deleteSuggestion as ReturnType<typeof vi.fn>
  const mockGetConferenceReviewers = conferencesApi.getConferenceReviewers as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem("conference_locale", "en")
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("Loading states", () => {
    it("should show loading state for suggestions tab", async () => {
      // Create a promise that never resolves to keep loading state
      mockGetSuggestions.mockReturnValue(new Promise(() => {}))
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      expect(screen.getByText("Loading suggestions...")).toBeInTheDocument()
    })

    it("should show loading state for confirmed tab when switched", async () => {
      mockGetSuggestions.mockResolvedValue({ data: { suggestions: [], total_papers: 0, total_suggestions: 0 }, error: null, status: 200 })
      // Create a promise that never resolves to keep loading state
      mockGetConfirmedAssignments.mockReturnValue(new Promise(() => {}))

      render(<ConferenceAssignments conferenceId="123" />)

      // Wait for suggestions to load, then switch tab
      await waitFor(() => {
        expect(screen.queryByText("Loading suggestions...")).not.toBeInTheDocument()
      })

      // Switch to confirmed tab
      fireEvent.click(screen.getByText("Confirmed Assignments"))

      expect(screen.getByText("Loading confirmed assignments...")).toBeInTheDocument()
    })
  })

  describe("Empty states", () => {
    it("should show empty state for suggestions when no suggestions exist", async () => {
      mockGetSuggestions.mockResolvedValue({
        data: { suggestions: [], total_papers: 0, total_suggestions: 0 },
        error: null,
        status: 200,
      })
      mockGetConfirmedAssignments.mockResolvedValue({
        data: { assignments: [], total_papers: 0, total_assignments: 0 },
        error: null,
        status: 200,
      })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("No Pending Suggestions")).toBeInTheDocument()
      })
      expect(screen.getByText(/Run auto-assignment from the Actions panel/)).toBeInTheDocument()
    })

    it("should show empty state for confirmed assignments when none exist", async () => {
      mockGetSuggestions.mockResolvedValue({
        data: { suggestions: [], total_papers: 0, total_suggestions: 0 },
        error: null,
        status: 200,
      })
      mockGetConfirmedAssignments.mockResolvedValue({
        data: { assignments: [], total_papers: 0, total_assignments: 0 },
        error: null,
        status: 200,
      })

      render(<ConferenceAssignments conferenceId="123" />)

      // Wait for initial load and switch to confirmed tab
      await waitFor(() => {
        expect(screen.queryByText("Loading suggestions...")).not.toBeInTheDocument()
      })
      fireEvent.click(screen.getByText("Confirmed Assignments"))

      await waitFor(() => {
        expect(screen.getByText("No Confirmed Assignments")).toBeInTheDocument()
      })
      expect(screen.getByText(/Confirm suggestions from the/)).toBeInTheDocument()
    })
  })

  describe("Tab switching", () => {
    it("should switch between suggestions and confirmed tabs", async () => {
      const mockSuggestions = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [
              { assignment_id: 100, reviewer_id: 10, reviewer_email: "reviewer@test.com", score: 0.85 },
            ],
          },
        ],
        total_papers: 1,
        total_suggestions: 1,
      }

      const mockConfirmed = {
        assignments: [
          {
            submission_id: 2,
            submission_title: "Confirmed Paper",
            reviewers: [
              {
                assignment_id: 200,
                reviewer_id: 20,
                reviewer_email: "confirmed@test.com",
                score: 0.9,
                status: "pending",
                review_status: "not_started",
              },
            ],
          },
        ],
        total_papers: 1,
        total_assignments: 1,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockSuggestions, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: mockConfirmed, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      // Wait for suggestions to load
      await waitFor(() => {
        expect(screen.getByText("Test Paper", { exact: false })).toBeInTheDocument()
      })

      // Switch to confirmed tab
      fireEvent.click(screen.getByText("Confirmed Assignments"))

      await waitFor(() => {
        expect(screen.getByText("Confirmed Paper", { exact: false })).toBeInTheDocument()
      })

      // Switch back to suggestions tab
      fireEvent.click(screen.getByText("Pending Suggestions"))

      await waitFor(() => {
        expect(screen.getByText("Test Paper", { exact: false })).toBeInTheDocument()
      })
    })

    it("should show badge counts in tab headers", async () => {
      const mockSuggestions = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Paper 1",
            reviewers: [{ assignment_id: 100, reviewer_id: 10, reviewer_email: "r1@test.com", score: 0.8 }],
          },
          {
            submission_id: 2,
            submission_title: "Paper 2",
            reviewers: [
              { assignment_id: 101, reviewer_id: 11, reviewer_email: "r2@test.com", score: 0.7 },
              { assignment_id: 102, reviewer_id: 12, reviewer_email: "r3@test.com", score: 0.6 },
            ],
          },
        ],
        total_papers: 2,
        total_suggestions: 3,
      }

      const mockConfirmed = {
        assignments: [
          {
            submission_id: 3,
            submission_title: "Paper 3",
            reviewers: [
              { assignment_id: 200, reviewer_id: 20, reviewer_email: "c1@test.com", score: 0.9, status: "accepted", review_status: "in_progress" },
              { assignment_id: 201, reviewer_id: 21, reviewer_email: "c2@test.com", score: 0.85, status: "pending", review_status: "not_started" },
            ],
          },
        ],
        total_papers: 1,
        total_assignments: 2,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockSuggestions, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: mockConfirmed, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        // Check that the badge shows the count
        expect(screen.getByText("3")).toBeInTheDocument() // suggestions count
        expect(screen.getByText("2")).toBeInTheDocument() // confirmed count
      })
    })
  })

  describe("Suggestions display", () => {
    it("should display suggestions grouped by submission", async () => {
      const mockData = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Machine Learning Paper",
            reviewers: [
              { assignment_id: 100, reviewer_id: 10, reviewer_email: "alice@example.com", score: 0.95 },
              { assignment_id: 101, reviewer_id: 11, reviewer_email: "bob@example.com", score: 0.75 },
            ],
          },
        ],
        total_papers: 1,
        total_suggestions: 2,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockData, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("#1 - Machine Learning Paper")).toBeInTheDocument()
        expect(screen.getByText("alice@example.com")).toBeInTheDocument()
        expect(screen.getByText("bob@example.com")).toBeInTheDocument()
        expect(
          screen.getByText((_, element) => element?.textContent?.replace(/\s+/g, " ").trim() === "2 suggested reviewer s"),
        ).toBeInTheDocument()
      })
    })

    it("should show Confirm All button when suggestions exist", async () => {
      const mockData = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [{ assignment_id: 100, reviewer_id: 10, reviewer_email: "test@test.com", score: 0.8 }],
          },
        ],
        total_papers: 1,
        total_suggestions: 1,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockData, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("Confirm All (1)")).toBeInTheDocument()
      })
    })

    it("should not show Confirm All button when no suggestions", async () => {
      mockGetSuggestions.mockResolvedValue({ data: { suggestions: [], total_papers: 0, total_suggestions: 0 }, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.queryByText(/Confirm All/)).not.toBeInTheDocument()
      })
    })
  })

  describe("Confirmed assignments display", () => {
    it("should display confirmed assignments with status badges", async () => {
      const mockConfirmed = {
        assignments: [
          {
            submission_id: 1,
            submission_title: "Confirmed Paper",
            reviewers: [
              {
                assignment_id: 100,
                reviewer_id: 10,
                reviewer_email: "reviewer@test.com",
                score: 0.85,
                status: "pending",
                review_status: "not_started",
              },
            ],
          },
        ],
        total_papers: 1,
        total_assignments: 1,
      }

      mockGetSuggestions.mockResolvedValue({ data: { suggestions: [], total_papers: 0, total_suggestions: 0 }, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: mockConfirmed, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      // Switch to confirmed tab
      await waitFor(() => {
        expect(screen.queryByText("Loading suggestions...")).not.toBeInTheDocument()
      })
      fireEvent.click(screen.getByText("Confirmed Assignments"))

      await waitFor(() => {
        expect(screen.getByText("#1 - Confirmed Paper")).toBeInTheDocument()
        expect(screen.getByText("reviewer@test.com")).toBeInTheDocument()
        expect(screen.getByText("Pending")).toBeInTheDocument()
        expect(screen.getByText("Not Started")).toBeInTheDocument()
      })
    })

    it("should display different assignment statuses correctly", async () => {
      const mockConfirmed = {
        assignments: [
          {
            submission_id: 1,
            submission_title: "Paper with Multiple Reviewers",
            reviewers: [
              { assignment_id: 100, reviewer_id: 10, reviewer_email: "accepted@test.com", score: 0.9, status: "accepted", review_status: "in_progress" },
              { assignment_id: 101, reviewer_id: 11, reviewer_email: "declined@test.com", score: 0.8, status: "declined", review_status: "not_started" },
              { assignment_id: 102, reviewer_id: 12, reviewer_email: "completed@test.com", score: 0.85, status: "completed", review_status: "submitted" },
            ],
          },
        ],
        total_papers: 1,
        total_assignments: 3,
      }

      mockGetSuggestions.mockResolvedValue({ data: { suggestions: [], total_papers: 0, total_suggestions: 0 }, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: mockConfirmed, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      // Switch to confirmed tab
      await waitFor(() => {
        expect(screen.queryByText("Loading suggestions...")).not.toBeInTheDocument()
      })
      fireEvent.click(screen.getByText("Confirmed Assignments"))

      await waitFor(() => {
        expect(screen.getByText("Accepted")).toBeInTheDocument()
        expect(screen.getByText("Declined")).toBeInTheDocument()
        expect(screen.getByText("Completed")).toBeInTheDocument()
        expect(screen.getByText("In Progress")).toBeInTheDocument()
        expect(screen.getByText("Submitted")).toBeInTheDocument()
      })
    })
  })

  describe("Score badge", () => {
    it("should display high scores with green styling", async () => {
      const mockData = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [{ assignment_id: 100, reviewer_id: 10, reviewer_email: "test@test.com", score: 0.85 }],
          },
        ],
        total_papers: 1,
        total_suggestions: 1,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockData, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("85%")).toBeInTheDocument()
      })
    })

    it("should display medium scores with yellow styling", async () => {
      const mockData = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [{ assignment_id: 100, reviewer_id: 10, reviewer_email: "test@test.com", score: 0.55 }],
          },
        ],
        total_papers: 1,
        total_suggestions: 1,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockData, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("55%")).toBeInTheDocument()
      })
    })

    it("should display low scores with red styling", async () => {
      const mockData = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [{ assignment_id: 100, reviewer_id: 10, reviewer_email: "test@test.com", score: 0.25 }],
          },
        ],
        total_papers: 1,
        total_suggestions: 1,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockData, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("25%")).toBeInTheDocument()
      })
    })
  })

  describe("Error handling", () => {
    it("should display error when suggestions API fails", async () => {
      mockGetSuggestions.mockResolvedValue({ data: null, error: "Failed to load suggestions", status: 500 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("Failed to load suggestions")).toBeInTheDocument()
      })
    })

    it("should display error when confirmed assignments API fails", async () => {
      mockGetSuggestions.mockResolvedValue({ data: { suggestions: [], total_papers: 0, total_suggestions: 0 }, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: null, error: "Failed to load confirmed assignments", status: 500 })

      render(<ConferenceAssignments conferenceId="123" />)

      // Switch to confirmed tab
      await waitFor(() => {
        expect(screen.queryByText("Loading suggestions...")).not.toBeInTheDocument()
      })
      fireEvent.click(screen.getByText("Confirmed Assignments"))

      await waitFor(() => {
        expect(screen.getByText("Failed to load confirmed assignments")).toBeInTheDocument()
      })
    })
  })

  describe("Actions", () => {
    it("should call confirmSuggestions when Confirm All is clicked", async () => {
      const mockData = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [{ assignment_id: 100, reviewer_id: 10, reviewer_email: "test@test.com", score: 0.8 }],
          },
        ],
        total_papers: 1,
        total_suggestions: 1,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockData, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })
      mockConfirmSuggestions.mockResolvedValue({ data: { confirmed_count: 1, message: "Confirmed" }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        expect(screen.getByText("Confirm All (1)")).toBeInTheDocument()
      })

      // Click Confirm All button to open dialog
      fireEvent.click(screen.getByText("Confirm All (1)"))

      // Wait for dialog to appear and click confirm
      await waitFor(() => {
        expect(screen.getByText("Confirm All Suggestions?")).toBeInTheDocument()
      })

      // Find and click the confirm button in the dialog
      const confirmButton = screen.getByRole("button", { name: "Confirm All" })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockConfirmSuggestions).toHaveBeenCalledWith("123")
      })
    })

    it("should show confirm single button for each reviewer", async () => {
      const mockData = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [
              { assignment_id: 100, reviewer_id: 10, reviewer_email: "test@test.com", score: 0.8 },
              { assignment_id: 101, reviewer_id: 11, reviewer_email: "test2@test.com", score: 0.7 },
            ],
          },
        ],
        total_papers: 1,
        total_suggestions: 2,
      }

      mockGetSuggestions.mockResolvedValue({ data: mockData, error: null, status: 200 })
      mockGetConfirmedAssignments.mockResolvedValue({ data: { assignments: [], total_papers: 0, total_assignments: 0 }, error: null, status: 200 })

      render(<ConferenceAssignments conferenceId="123" />)

      await waitFor(() => {
        const confirmButtons = screen.getAllByRole("button", { name: /Confirm/i })
        // Should have individual confirm buttons (excluding Confirm All)
        expect(confirmButtons.length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})

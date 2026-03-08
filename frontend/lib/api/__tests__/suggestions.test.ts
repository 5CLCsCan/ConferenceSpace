import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  getSuggestions,
  confirmSuggestions,
  deleteSuggestion,
  addSuggestion,
  getConfirmedAssignments,
  type SuggestionsListResponse,
  type ConfirmSuggestionsResponse,
  type AddSuggestionResponse,
  type ConfirmedAssignmentsListResponse,
} from "../suggestions"
import * as client from "../client"

// Mock the apiFetch function
vi.mock("../client", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8080",
}))

describe("suggestions API", () => {
  const mockApiFetch = client.apiFetch as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("getSuggestions", () => {
    it("should fetch suggestions successfully", async () => {
      const mockResponse: SuggestionsListResponse = {
        suggestions: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [
              {
                assignment_id: 100,
                reviewer_id: 10,
                reviewer_email: "reviewer@test.com",
                score: 0.85,
              },
            ],
          },
        ],
        total_papers: 1,
        total_suggestions: 1,
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await getSuggestions("123")

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/conferences/123/assignments/suggestions")
      expect(result.data).toEqual(mockResponse)
      expect(result.error).toBeNull()
      expect(result.status).toBe(200)
    })

    it("should handle errors gracefully", async () => {
      const error = new Error("Network error")
      mockApiFetch.mockRejectedValueOnce(error)

      const result = await getSuggestions("123")

      expect(result.data).toBeNull()
      expect(result.error).toBe("Network error")
      expect(result.status).toBe(500)
    })

    it("should handle API errors with status code", async () => {
      const error = { message: "Unauthorized", status: 401 }
      mockApiFetch.mockRejectedValueOnce(error)

      const result = await getSuggestions("123")

      expect(result.data).toBeNull()
      expect(result.error).toBe("Unauthorized")
      expect(result.status).toBe(401)
    })
  })

  describe("confirmSuggestions", () => {
    it("should confirm all suggestions when no IDs provided", async () => {
      const mockResponse: ConfirmSuggestionsResponse = {
        confirmed_count: 5,
        message: "Confirmed 5 assignments",
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await confirmSuggestions("123")

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/conferences/123/assignments/suggestions/confirm",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      )
      expect(result.data).toEqual(mockResponse)
      expect(result.error).toBeNull()
    })

    it("should confirm specific suggestions when IDs provided", async () => {
      const mockResponse: ConfirmSuggestionsResponse = {
        confirmed_count: 2,
        message: "Confirmed 2 assignments",
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await confirmSuggestions("123", [100, 101])

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/conferences/123/assignments/suggestions/confirm",
        {
          method: "POST",
          body: JSON.stringify({ assignment_ids: [100, 101] }),
        },
      )
      expect(result.data?.confirmed_count).toBe(2)
    })

    it("should handle empty assignment_ids array as confirm all", async () => {
      const mockResponse: ConfirmSuggestionsResponse = {
        confirmed_count: 3,
        message: "Confirmed 3 assignments",
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await confirmSuggestions("123", [])

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/conferences/123/assignments/suggestions/confirm",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      )
    })

    it("should handle errors gracefully", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("Server error"))

      const result = await confirmSuggestions("123")

      expect(result.data).toBeNull()
      expect(result.error).toBe("Server error")
    })
  })

  describe("deleteSuggestion", () => {
    it("should delete a suggestion successfully", async () => {
      mockApiFetch.mockResolvedValueOnce({
        data: { message: "suggestion deleted successfully" },
        response: { status: 200 },
      })

      const result = await deleteSuggestion("123", 100)

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/v1/conferences/123/assignments/suggestions/100",
        {
          method: "DELETE",
        },
      )
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.status).toBe(200)
    })

    it("should handle deletion errors", async () => {
      mockApiFetch.mockRejectedValueOnce({
        message: "Suggestion not found",
        status: 404,
      })

      const result = await deleteSuggestion("123", 999)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Suggestion not found")
      expect(result.status).toBe(404)
    })
  })

  describe("addSuggestion", () => {
    it("should add a suggestion successfully without COI warning", async () => {
      const mockResponse: AddSuggestionResponse = {
        assignment: {
          id: 100,
          conference_id: 123,
          submission_id: 1,
          reviewer_id: 10,
          score: 0,
          status: "suggested",
          reviewer_email: "reviewer@test.com",
        },
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 201 },
      })

      const result = await addSuggestion("123", 1, 10)

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/conferences/123/assignments/suggestions", {
        method: "POST",
        body: JSON.stringify({ submission_id: 1, reviewer_id: 10 }),
      })
      expect(result.data).toEqual(mockResponse)
      expect(result.data?.coi_warning).toBeUndefined()
      expect(result.status).toBe(201)
    })

    it("should add a suggestion with COI warning", async () => {
      const mockResponse: AddSuggestionResponse = {
        assignment: {
          id: 101,
          conference_id: 123,
          submission_id: 2,
          reviewer_id: 20,
          score: 0,
          status: "suggested",
          reviewer_email: "author@test.com",
        },
        coi_warning: {
          has_conflict: true,
          reasons: ["Self-author conflict: reviewer is the paper's author"],
        },
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 201 },
      })

      const result = await addSuggestion("123", 2, 20)

      expect(result.data?.coi_warning).toBeDefined()
      expect(result.data?.coi_warning?.has_conflict).toBe(true)
      expect(result.data?.coi_warning?.reasons).toContain(
        "Self-author conflict: reviewer is the paper's author",
      )
    })

    it("should handle errors when adding suggestion", async () => {
      mockApiFetch.mockRejectedValueOnce({
        message: "Reviewer already assigned",
        status: 400,
      })

      const result = await addSuggestion("123", 1, 10)

      expect(result.data).toBeNull()
      expect(result.error).toBe("Reviewer already assigned")
      expect(result.status).toBe(400)
    })
  })

  describe("getConfirmedAssignments", () => {
    it("should fetch confirmed assignments successfully", async () => {
      const mockResponse: ConfirmedAssignmentsListResponse = {
        assignments: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
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

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await getConfirmedAssignments("123")

      expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/conferences/123/assignments/confirmed")
      expect(result.data).toEqual(mockResponse)
      expect(result.error).toBeNull()
      expect(result.status).toBe(200)
    })

    it("should return empty list when no confirmed assignments", async () => {
      const mockResponse: ConfirmedAssignmentsListResponse = {
        assignments: [],
        total_papers: 0,
        total_assignments: 0,
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await getConfirmedAssignments("456")

      expect(result.data?.assignments).toEqual([])
      expect(result.data?.total_assignments).toBe(0)
    })

    it("should handle multiple reviewers per submission", async () => {
      const mockResponse: ConfirmedAssignmentsListResponse = {
        assignments: [
          {
            submission_id: 1,
            submission_title: "Test Paper",
            reviewers: [
              {
                assignment_id: 100,
                reviewer_id: 10,
                reviewer_email: "reviewer1@test.com",
                score: 0.85,
                status: "accepted",
                review_status: "in_progress",
              },
              {
                assignment_id: 101,
                reviewer_id: 11,
                reviewer_email: "reviewer2@test.com",
                score: 0.75,
                status: "pending",
                review_status: "not_started",
              },
            ],
          },
        ],
        total_papers: 1,
        total_assignments: 2,
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await getConfirmedAssignments("123")

      expect(result.data?.assignments[0].reviewers).toHaveLength(2)
      expect(result.data?.total_assignments).toBe(2)
    })

    it("should handle different assignment statuses", async () => {
      const mockResponse: ConfirmedAssignmentsListResponse = {
        assignments: [
          {
            submission_id: 1,
            submission_title: "Paper 1",
            reviewers: [
              {
                assignment_id: 100,
                reviewer_id: 10,
                reviewer_email: "reviewer@test.com",
                score: 0.85,
                status: "completed",
                review_status: "submitted",
              },
            ],
          },
        ],
        total_papers: 1,
        total_assignments: 1,
      }

      mockApiFetch.mockResolvedValueOnce({
        data: { data: mockResponse },
        response: { status: 200 },
      })

      const result = await getConfirmedAssignments("123")

      expect(result.data?.assignments[0].reviewers[0].status).toBe("completed")
      expect(result.data?.assignments[0].reviewers[0].review_status).toBe("submitted")
    })

    it("should handle errors gracefully", async () => {
      const error = new Error("Network error")
      mockApiFetch.mockRejectedValueOnce(error)

      const result = await getConfirmedAssignments("123")

      expect(result.data).toBeNull()
      expect(result.error).toBe("Network error")
      expect(result.status).toBe(500)
    })

    it("should handle API errors with status code", async () => {
      const error = { message: "Forbidden", status: 403 }
      mockApiFetch.mockRejectedValueOnce(error)

      const result = await getConfirmedAssignments("123")

      expect(result.data).toBeNull()
      expect(result.error).toBe("Forbidden")
      expect(result.status).toBe(403)
    })
  })
})

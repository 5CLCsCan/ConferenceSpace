/**
 * Tests for lib/api/rebuttal.ts
 *
 * These tests would have caught all three bugs found during review:
 * 1. reviewers=[] passed to RebuttalPanel → points never rendered
 * 2. onSubmitRebuttal called with empty data
 * 3. reviewer identity (isCurrentUser) not being set
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { getRebuttal, submitRebuttal, acknowledgePoint, updatePostRebuttalScore } from "../rebuttal"

// Mock apiFetch at module level
vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from "@/lib/api/client"
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

const BACKEND_RESPONSE_WITH_POINTS = {
  data: {
    phase: "submitted",
    general_response: "We thank the reviewers.",
    submitted_at: "2026-03-08T10:00:00Z",
    points: [
      {
        point_id: "p1",
        assignment_id: 42,
        category: "weakness",
        section: "Weaknesses",
        original_comment: "The ablation is insufficient.",
        author_response: "We added Table 5.",
        status: "pending_review",
        reviewer_acknowledged: false,
        reviewer_note: "",
      },
      {
        point_id: "p2",
        assignment_id: 99,
        category: "question",
        section: "Questions",
        original_comment: "How was alpha chosen?",
        author_response: "Via grid search.",
        status: "addressed",
        reviewer_acknowledged: true,
        reviewer_note: "Good response.",
      },
    ],
    assignments: [
      { assignment_id: 42, rebuttal_status: "submitted" },
      { assignment_id: 99, rebuttal_status: "acknowledged" },
    ],
    char_limit_general: 2000,
    char_limit_per_point: 500,
    deadline: null,
  },
}

const BACKEND_RESPONSE_AWAITING = {
  data: {
    phase: "awaiting",
    general_response: "",
    submitted_at: null,
    points: [],
    assignments: [],
    char_limit_general: 3000,
    char_limit_per_point: 1000,
    deadline: null,
  },
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe("getRebuttal", () => {
  /**
   * Contract (post-8af09fb): backend.assignments is the single source of truth for
   * reviewers, since the new score / recommendation fields live there. The panel
   * groups points by reviewer.id, so the assignment_ids on points MUST line up with
   * the assignment_ids on assignments — otherwise those points won't render. An
   * orphan point (assignment_id not present in assignments) is a backend data
   * inconsistency, not something the API client masks.
   */
  it("builds reviewers from assignments, with ids matching point assignment_ids", async () => {
    mockApiFetch.mockResolvedValue({
      data: BACKEND_RESPONSE_WITH_POINTS,
      response: { status: 200 },
    })

    const result = await getRebuttal("1", "10")

    expect(result.data).not.toBeNull()
    // Must return reviewers derived from the unique assignment_ids in points
    expect(result.data!.reviewers).toHaveLength(2)
    expect(result.data!.reviewers[0].id).toBe("42")
    expect(result.data!.reviewers[1].id).toBe("99")
    // anonymousId must be set so the panel header renders
    expect(result.data!.reviewers[0].anonymousId).toBe("Reviewer #1")
    expect(result.data!.reviewers[1].anonymousId).toBe("Reviewer #2")
  })

  it("returns empty reviewers array (not null) when no points exist", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_RESPONSE_AWAITING, response: { status: 200 } })

    const result = await getRebuttal("1", "10")

    expect(result.data!.reviewers).toEqual([])
  })

  it("maps points correctly — reviewerId matches assignment_id as string", async () => {
    mockApiFetch.mockResolvedValue({
      data: BACKEND_RESPONSE_WITH_POINTS,
      response: { status: 200 },
    })

    const result = await getRebuttal("1", "10")

    const points = result.data!.points
    expect(points).toHaveLength(2)
    // reviewerId must be string(assignment_id) so panel grouping works
    expect(points[0].reviewerId).toBe("42")
    expect(points[1].reviewerId).toBe("99")
    expect(points[0].id).toBe("p1")
    expect(points[0].authorResponse).toBe("We added Table 5.")
    expect(points[0].status).toBe("pending_review")
  })

  /**
   * BUG 3: reviewer identity — isCurrentUser must be set when assignmentId is provided
   * Without this the reviewer sees no "Your Comments" section and can't acknowledge points.
   */
  it("marks the current reviewer isCurrentUser=true when currentAssignmentId matches", async () => {
    mockApiFetch.mockResolvedValue({
      data: BACKEND_RESPONSE_WITH_POINTS,
      response: { status: 200 },
    })

    const result = await getRebuttal("1", "10", "42")

    const reviewers = result.data!.reviewers
    const currentReviewer = reviewers.find((r) => r.id === "42")
    const otherReviewer = reviewers.find((r) => r.id === "99")

    expect(currentReviewer?.isCurrentUser).toBe(true)
    expect(otherReviewer?.isCurrentUser).toBe(false)
  })

  it("sets all reviewers isCurrentUser=false when no currentAssignmentId provided", async () => {
    mockApiFetch.mockResolvedValue({
      data: BACKEND_RESPONSE_WITH_POINTS,
      response: { status: 200 },
    })

    const result = await getRebuttal("1", "10")

    result.data!.reviewers.forEach((r) => {
      expect(r.isCurrentUser).toBe(false)
    })
  })

  it("returns submission=null for awaiting phase", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_RESPONSE_AWAITING, response: { status: 200 } })

    const result = await getRebuttal("1", "10")

    expect(result.data!.submission).toBeNull()
  })

  it("returns submission with general response for submitted phase", async () => {
    mockApiFetch.mockResolvedValue({
      data: BACKEND_RESPONSE_WITH_POINTS,
      response: { status: 200 },
    })

    const result = await getRebuttal("1", "10")

    expect(result.data!.submission).not.toBeNull()
    expect(result.data!.submission!.generalResponse.content).toBe("We thank the reviewers.")
  })

  it("returns error on fetch failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"))

    const result = await getRebuttal("1", "10")

    expect(result.data).toBeNull()
    expect(result.error).toBe("Network error")
  })
})

describe("submitRebuttal", () => {
  /**
   * BUG 2: onSubmitRebuttal called with empty generalResponse=""
   * The API must forward the actual generalResponse and points to the backend.
   */
  it("sends generalResponse and points to the backend (not empty strings)", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await submitRebuttal("1", "10", {
      generalResponse: "We thank all reviewers for their thorough feedback.",
      perReviewerResponses: [],
      points: [
        {
          pointId: "p1",
          assignmentId: 42,
          category: "weakness",
          section: "Weaknesses",
          originalComment: "The ablation is insufficient.",
          authorResponse: "We added Table 5.",
        },
      ],
    })

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/submissions/10/rebuttal",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining("We thank all reviewers"),
      }),
    )

    const body = JSON.parse((mockApiFetch.mock.calls[0][1] as { body: string }).body)
    expect(body.general_response).toBe("We thank all reviewers for their thorough feedback.")
    expect(body.points).toHaveLength(1)
    expect(body.points[0].point_id).toBe("p1")
    expect(body.points[0].assignment_id).toBe(42)
    expect(body.points[0].author_response).toBe("We added Table 5.")
  })

  it("sends empty points array when no points provided", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await submitRebuttal("1", "10", {
      generalResponse: "General response only.",
      perReviewerResponses: [],
      points: [],
    })

    const body = JSON.parse((mockApiFetch.mock.calls[0][1] as { body: string }).body)
    expect(body.general_response).toBe("General response only.")
    expect(body.points).toEqual([])
  })

  it("returns error on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Server error"))

    const result = await submitRebuttal("1", "10", {
      generalResponse: "test",
      perReviewerResponses: [],
      points: [],
    })

    expect(result.error).toBe("Server error")
  })
})

describe("acknowledgePoint", () => {
  it("calls the correct per-point endpoint with status and note", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await acknowledgePoint("1", "42", "p1", "addressed", "Good response.")

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/assignments/42/rebuttal/points/p1/acknowledge",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining("addressed"),
      }),
    )

    const body = JSON.parse((mockApiFetch.mock.calls[0][1] as { body: string }).body)
    expect(body.status).toBe("addressed")
    expect(body.note).toBe("Good response.")
  })

  it("URL-encodes special characters in point_id", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await acknowledgePoint("1", "42", "point/with/slashes", "addressed")

    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("point%2Fwith%2Fslashes"),
      expect.anything(),
    )
  })

  it("sends empty string for note when not provided", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    await acknowledgePoint("1", "42", "p1", "not_addressed")

    const body = JSON.parse((mockApiFetch.mock.calls[0][1] as { body: string }).body)
    expect(body.note).toBe("")
  })

  it("returns error on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Forbidden"))

    const result = await acknowledgePoint("1", "42", "p1", "addressed")

    expect(result.error).toBe("Forbidden")
  })
})

describe("getRebuttal — new fields (charLimits, assignments, rebuttalStatus)", () => {
  it("maps charLimitGeneral and charLimitPerPoint from backend", async () => {
    mockApiFetch.mockResolvedValue({
      data: BACKEND_RESPONSE_WITH_POINTS,
      response: { status: 200 },
    })

    const result = await getRebuttal("1", "10")

    expect(result.data!.settings.charLimitGeneral).toBe(2000)
    expect(result.data!.settings.charLimitPerPoint).toBe(500)
  })

  it("maps rebuttalStatus onto each ReviewerInfo from the assignments array", async () => {
    mockApiFetch.mockResolvedValue({
      data: BACKEND_RESPONSE_WITH_POINTS,
      response: { status: 200 },
    })

    const result = await getRebuttal("1", "10")

    const reviewer42 = result.data!.reviewers.find((r) => r.id === "42")
    const reviewer99 = result.data!.reviewers.find((r) => r.id === "99")
    expect(reviewer42?.rebuttalStatus).toBe("submitted")
    expect(reviewer99?.rebuttalStatus).toBe("acknowledged")
  })

  it("does not synthesize a reviewer for orphan points whose assignment_id is missing from assignments", async () => {
    // Contract: assignments is the single source of truth for reviewers. A point
    // referencing an assignment_id that is absent from `assignments` is treated
    // as a backend data inconsistency — the API client does NOT fabricate a
    // placeholder reviewer for it.
    const responseWithExtraPoint = {
      data: {
        ...BACKEND_RESPONSE_WITH_POINTS.data,
        points: [
          ...BACKEND_RESPONSE_WITH_POINTS.data.points,
          {
            point_id: "p3",
            assignment_id: 777,
            category: "suggestion",
            section: "Suggestions",
            original_comment: "Add more details.",
            author_response: "",
            status: "pending_review",
            reviewer_acknowledged: false,
            reviewer_note: "",
          },
        ],
        // assignments only covers 42 and 99, not 777
      },
    }
    mockApiFetch.mockResolvedValue({ data: responseWithExtraPoint, response: { status: 200 } })

    const result = await getRebuttal("1", "10")

    expect(result.data!.reviewers).toHaveLength(2)
    expect(result.data!.reviewers.map((r) => r.id)).toEqual(["42", "99"])
    expect(result.data!.reviewers.find((r) => r.id === "777")).toBeUndefined()
  })

  it("uses default char limits when not provided by backend", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_RESPONSE_AWAITING, response: { status: 200 } })

    const result = await getRebuttal("1", "10")

    expect(result.data!.settings.charLimitGeneral).toBe(3000)
    expect(result.data!.settings.charLimitPerPoint).toBe(1000)
  })

  it("calls the correct backend URL for getRebuttal", async () => {
    mockApiFetch.mockResolvedValue({ data: BACKEND_RESPONSE_AWAITING, response: { status: 200 } })

    await getRebuttal("5", "99")

    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/conferences/5/submissions/99/rebuttal")
  })
})

describe("updatePostRebuttalScore", () => {
  it("calls the correct backend endpoint with score, recommendation, and comment", async () => {
    mockApiFetch.mockResolvedValue({
      data: { message: "post-rebuttal score updated" },
      response: { status: 200 },
    })

    await updatePostRebuttalScore("1", "42", {
      score: 7,
      recommendation: "accept",
      comment: "The rebuttal addressed all concerns.",
    })

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/1/assignments/42/post-rebuttal-score",
      expect.objectContaining({ method: "PUT" }),
    )

    const body = JSON.parse((mockApiFetch.mock.calls[0][1] as { body: string }).body)
    expect(body.score).toBe(7)
    expect(body.recommendation).toBe("accept")
    expect(body.comment).toBe("The rebuttal addressed all concerns.")
  })

  it("returns no error on success", async () => {
    mockApiFetch.mockResolvedValue({ data: {}, response: { status: 200 } })

    const result = await updatePostRebuttalScore("1", "42", {
      score: 5,
      recommendation: "borderline",
      comment: "",
    })

    expect(result.error).toBeNull()
  })

  it("returns error on failure", async () => {
    mockApiFetch.mockRejectedValue(new Error("Forbidden"))

    const result = await updatePostRebuttalScore("1", "42", {
      score: 5,
      recommendation: "borderline",
      comment: "",
    })

    expect(result.error).toBe("Forbidden")
  })
})

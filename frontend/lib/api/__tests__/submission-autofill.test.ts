import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  generateSubmissionAutofill,
  normalizeSubmissionAutofillResponse,
} from "../submission-autofill"
import { apiFetch } from "../client"

vi.mock("../client", () => ({
  apiFetch: vi.fn(),
}))

describe("generateSubmissionAutofill", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("posts request metadata and repeated files to the backend autofill endpoint", async () => {
    const manuscript = new File(["paper"], "paper.pdf", { type: "application/pdf" })
    const supplement = new File(["appendix"], "appendix.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        data: {
          run_id: "run-1",
          status: "ready",
          fields: {
            title: { value: "Extracted title", confidence: "high", evidence: [], warnings: [] },
            abstract: {
              value: "Extracted abstract",
              confidence: "high",
              evidence: [],
              warnings: [],
            },
            keywords: { value: ["ai"], confidence: "medium", evidence: [], warnings: [] },
            paper_type: { value: "research", confidence: "medium", evidence: [], warnings: [] },
            additional_notes: { value: "", confidence: "not_found", evidence: [], warnings: [] },
          },
          track_rankings: [
            {
              track_name: "AI",
              confidence: 8.5,
              rationale: "The paper focuses on AI methods.",
              evidence: [],
              warnings: [],
            },
          ],
          authors: [],
          possible_conflicts: [],
          materials: [],
          warnings: [],
        },
      },
      response: new Response(null, { status: 200 }),
    } as any)

    const result = await generateSubmissionAutofill({
      conferenceId: "210",
      files: [manuscript, supplement],
      extraDetails: "Prioritize the camera-ready title.",
      availableTracks: ["AI", "Systems"],
    })

    expect(result.error).toBeNull()
    expect(result.data?.track_rankings).toEqual([
      {
        track_name: "AI",
        confidence: 8.5,
        rationale: "The paper focuses on AI methods.",
        evidence: [],
        warnings: [],
      },
    ])
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/conferences/210/submissions/autofill",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    )

    const formData = vi.mocked(apiFetch).mock.calls[0][1]?.body as FormData
    expect(formData.getAll("files")).toEqual([manuscript, supplement])
    expect(JSON.parse(String(formData.get("request")))).toEqual({
      extra_details: "Prioritize the camera-ready title.",
      available_tracks: ["AI", "Systems"],
    })
  })

  it("normalizes omitted optional arrays from AI service responses", () => {
    const response = normalizeSubmissionAutofillResponse({
      run_id: "run-1",
      status: "ready",
      fields: {
        title: { value: "Title", confidence: "high", evidence: [] },
        abstract: { value: "Abstract", confidence: "high", evidence: [] },
        keywords: { value: ["ai"], confidence: "medium", evidence: [] },
        paper_type: { value: "full paper", confidence: "low", evidence: [] },
        additional_notes: { value: "", confidence: "not_found", evidence: [] },
      },
      authors: [
        {
          name: "Leily Sheugh",
          email: "leily.sheugh@gmail.com",
          confidence: "high",
          evidence: [],
        },
      ],
      materials: [{ file_id: "file-1", filename: "paper.pdf", size_bytes: 100 }],
    })

    expect(response.possible_conflicts).toEqual([])
    expect(response.track_rankings).toEqual([])
    expect(response.warnings).toEqual([])
    expect(response.authors[0].warnings).toEqual([])
    expect(response.materials[0].warnings).toEqual([])
  })
})

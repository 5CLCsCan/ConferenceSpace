import { apiFetch, API_BASE_URL, ApiError } from "@/lib/api/client"
import type { Paper, PrecheckBlockedError, PrecheckResult, TrackRecommendation } from "@/lib/types"

interface PaperMutationResult {
  data: Paper | null
  error: string | null
  precheckBlocked?: PrecheckBlockedError | null
}

interface TrackRecommendationResult {
  data: TrackRecommendation[] | null
  error: string | null
}

function parsePrecheckBlocked(error: unknown): PrecheckBlockedError | null {
  if (!(error instanceof ApiError) || error.status !== 422) {
    return null
  }

  const body = error.body as { data?: unknown } | undefined
  const payload = body?.data as
    | { code?: string; decision?: string; blocking_items?: unknown }
    | undefined
  if (!payload || payload.code !== "PRECHECK_BLOCKED") {
    return null
  }

  return payload as PrecheckBlockedError
}

/**
 * Submit a new paper to a conference
 * Backend endpoint: POST /api/v1/conferences/:conference_id/submissions
 */
export async function submitPaper(data: {
  conference_id: string
  title: string
  abstract: string
  link?: string
  domain: string[]
  track?: string
  file?: File
  cover_letter?: File // Cover letter file (PDF, DOCX, or TXT)
  status?: "draft" | "published" // Allow caller to specify status
  information?: {
    co_authors?: string[]
    keywords?: string[]
    paper_type?: string
    track_name?: string
    additional_notes?: string
    metadata?: Record<string, unknown>
  }
}): Promise<PaperMutationResult> {
  try {
    // Create FormData for multipart upload
    const formData = new FormData()

    // Add submission data as JSON string in form field
    // Wrap in { submission: ... } to match backend DTO structure
    const submissionData = {
      submission: {
        title: data.title,
        abstract: data.abstract,
        link: data.link || "",
        domain: data.domain,
        track: data.track || "", // Include track field
        status: data.status || "draft", // Use provided status or default to draft
        information: data.information || {},
      },
    }
    formData.append("submission", JSON.stringify(submissionData))

    // Add paper file if provided
    if (data.file) {
      formData.append("file", data.file)
    }

    // Add cover letter if provided
    if (data.cover_letter) {
      formData.append("cover_letter", data.cover_letter)
    }

    const { data: responseData, response } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${data.conference_id}/submissions`,
      {
        method: "POST",
        body: formData,
        // Let apiFetch handle Content-Type and Authorization headers
      },
    )

    // Transform backend response to frontend Paper format
    const paper: Paper = {
      id: responseData.data.id.toString(),
      title: responseData.data.title,
      abstract: responseData.data.abstract,
      keywords: [], // TODO: Map from information.keywords if available
      authors: [], // TODO: Map from submission author/co_authors
      conference_id: data.conference_id,
      track_id: "", // TODO: Map from track_name if available
      status: responseData.data.status as any,
      submitted_at: responseData.data.created_at,
      updated_at: responseData.data.updated_at,
      version: 1,
      reviews: [],
    }

    return { data: paper, error: null, precheckBlocked: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to submit paper",
      precheckBlocked: parsePrecheckBlocked(error),
    }
  }
}

/**
 * Get submission details by ID
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions/:id
 */
export async function getPaperById(
  paperId: string,
  conferenceId?: string,
): Promise<{ data: Paper | null; error: string | null }> {
  try {
    if (!conferenceId) {
      return { data: null, error: "Conference ID is required" }
    }

    const { data, response } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/submissions/${paperId}`,
    )

    // Transform backend response to frontend Paper format
    const paper: Paper = {
      id: data.data.id.toString(),
      title: data.data.title,
      abstract: data.data.abstract,
      keywords: data.data.information?.keywords || [],
      authors: [], // TODO: Map from submission author/co_authors
      conference_id: conferenceId,
      track_id: data.data.information?.track_name || "",
      status: data.data.status as any,
      submitted_at: data.data.created_at,
      updated_at: data.data.updated_at,
      version: 1,
      reviews: [],
    }

    return { data: paper, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Failed to fetch paper" }
  }
}

/**
 * Update a submission
 * Backend endpoint: PUT /api/v1/conferences/:conference_id/submissions/:id
 *
 * Supports updating metadata, paper file, and cover letter.
 * Files are optional - only updated if provided.
 */
export async function updatePaper(
  paperId: string,
  conferenceId: string,
  data: {
    title: string
    abstract: string
    link?: string
    domain: string[]
    track?: string
    file?: File
    cover_letter?: File // Cover letter file (PDF, DOCX, or TXT)
    information?: {
      co_authors?: string[]
      keywords?: string[]
      paper_type?: string
      track_name?: string
      additional_notes?: string
      metadata?: Record<string, unknown>
    }
  },
): Promise<PaperMutationResult> {
  try {
    // Create FormData for multipart upload (supports file updates)
    const formData = new FormData()

    // Add submission data as JSON string in form field
    const submissionData = {
      submission: {
        title: data.title,
        abstract: data.abstract,
        link: data.link || "",
        domain: data.domain,
        track: data.track || "", // Include track field
        information: data.information || {},
      },
    }
    formData.append("submission", JSON.stringify(submissionData))

    // Add paper file if provided (replaces existing)
    if (data.file) {
      formData.append("file", data.file)
    }

    // Add cover letter if provided (replaces existing)
    if (data.cover_letter) {
      formData.append("cover_letter", data.cover_letter)
    }

    const { data: responseData, response } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/submissions/${paperId}`,
      {
        method: "PUT",
        body: formData,
        // Let apiFetch handle Content-Type and Authorization headers
      },
    )

    // Transform backend response to frontend Paper format
    const paper: Paper = {
      id: responseData.data.id.toString(),
      title: responseData.data.title,
      abstract: responseData.data.abstract,
      keywords: responseData.data.information?.keywords || [],
      authors: [], // TODO: Map from submission author/co_authors
      conference_id: conferenceId,
      track_id: responseData.data.information?.track_name || "",
      status: responseData.data.status as any,
      submitted_at: responseData.data.created_at,
      updated_at: responseData.data.updated_at,
      version: 1,
      reviews: [],
    }

    return { data: paper, error: null, precheckBlocked: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update paper",
      precheckBlocked: parsePrecheckBlocked(error),
    }
  }
}

export async function getTrackRecommendations(data: {
  conference_id: string
  title: string
  abstract: string
  keywords: string[]
}): Promise<TrackRecommendationResult> {
  try {
    const { data: responseData } = await apiFetch<{
      data: { recommendations: TrackRecommendation[] }
    }>(`/api/v1/conferences/${data.conference_id}/submissions/track-recommendation`, {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords,
      }),
    })

    return {
      data: responseData.data.recommendations || [],
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to get track recommendations",
    }
  }
}

/**
 * Publish a draft submission
 * Backend endpoint: POST /api/v1/conferences/:conference_id/submissions/:id/publish
 *
 * This endpoint changes a draft submission to published status.
 * If the draft doesn't have a paper file yet, you can provide one.
 */
export async function publishPaper(
  paperId: string,
  conferenceId: string,
  data?: {
    file?: File // Paper file (required if not already uploaded)
    cover_letter?: File // Cover letter file (optional)
  },
): Promise<PaperMutationResult> {
  try {
    let requestOptions: RequestInit = {
      method: "POST",
    }

    // If files are provided, use FormData
    if (data?.file || data?.cover_letter) {
      const formData = new FormData()

      // Add paper file if provided
      if (data.file) {
        formData.append("file", data.file)
      }

      // Add cover letter if provided
      if (data.cover_letter) {
        formData.append("cover_letter", data.cover_letter)
      }

      requestOptions.body = formData
    }

    const { data: responseData } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/submissions/${paperId}/publish`,
      requestOptions,
    )

    // Transform backend response to frontend Paper format
    const paper: Paper = {
      id: responseData.data.id.toString(),
      title: responseData.data.title,
      abstract: responseData.data.abstract,
      keywords: responseData.data.information?.keywords || [],
      authors: [], // TODO: Map from submission author/co_authors
      conference_id: conferenceId,
      track_id: responseData.data.information?.track_name || "",
      status: responseData.data.status as any,
      submitted_at: responseData.data.created_at,
      updated_at: responseData.data.updated_at,
      version: 1,
      reviews: [],
    }

    return { data: paper, error: null, precheckBlocked: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to publish paper",
      precheckBlocked: parsePrecheckBlocked(error),
    }
  }
}

/**
 * Delete a submission
 * Backend endpoint: DELETE /api/v1/conferences/:conference_id/submissions/:id
 */
export async function deletePaper(
  paperId: string,
  conferenceId: string,
): Promise<{ data: boolean; error: string | null }> {
  try {
    const { response } = await apiFetch(
      `/api/v1/conferences/${conferenceId}/submissions/${paperId}`,
      {
        method: "DELETE",
      },
    )

    return { data: true, error: null }
  } catch (error) {
    return { data: false, error: error instanceof Error ? error.message : "Failed to delete paper" }
  }
}

/**
 * Download paper file
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions/:id/file
 */
export async function downloadPaperFile(
  paperId: string,
  conferenceId: string,
): Promise<{ data: Blob | null; filename: string | null; error: string | null }> {
  try {
    const response = await fetch(
      `/api/backend/api/v1/conferences/${conferenceId}/submissions/${paperId}/file`,
      {
        credentials: "include",
      },
    )

    if (!response.ok) {
      return { data: null, filename: null, error: `HTTP ${response.status}` }
    }

    const blob = await response.blob()
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition")
    let filename = "paper.pdf"
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, "")
      }
    }

    return { data: blob, filename, error: null }
  } catch (error) {
    return {
      data: null,
      filename: null,
      error: error instanceof Error ? error.message : "Failed to download paper file",
    }
  }
}

/**
 * Download cover letter
 * Backend endpoint: GET /api/v1/conferences/:conference_id/submissions/:id/cover_letter
 */
export async function downloadCoverLetter(
  paperId: string,
  conferenceId: string,
): Promise<{ data: Blob | null; filename: string | null; error: string | null }> {
  try {
    const response = await fetch(
      `/api/backend/api/v1/conferences/${conferenceId}/submissions/${paperId}/cover_letter`,
      {
        credentials: "include",
      },
    )

    if (!response.ok) {
      return { data: null, filename: null, error: `HTTP ${response.status}` }
    }

    const blob = await response.blob()
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition")
    let filename = "cover_letter.pdf"
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, "")
      }
    }

    return { data: blob, filename, error: null }
  } catch (error) {
    return {
      data: null,
      filename: null,
      error: error instanceof Error ? error.message : "Failed to download cover letter",
    }
  }
}

/**
 * Pre-check a paper file before submission
 * Backend endpoint: POST /api/v1/conferences/:conference_id/submissions/precheck
 */
// ── MOCK FLAG: set to true to use mock precheck data ──
const USE_MOCK_PRECHECK = false

const MOCK_PRECHECK_RESULT: PrecheckResult = {
  paper_title: "Attention-Based Neural Architecture for Low-Resource Language Translation",
  overall_score: 68,
  decision: "manual_review",
  summary: {
    total_items: 11,
    passed: 7,
    failed: 2,
    pass_rate: 0.73,
  },
  category_scores: {
    title_abstract: { score: 100, passed: 2, failed: 0, weight: 0.2 },
    method: { score: 80, passed: 2, failed: 0, weight: 0.15 },
    writing_quality: { score: 40, passed: 1, failed: 1, weight: 0.15 },
    experiments: { score: 50, passed: 1, failed: 1, weight: 0.25 },
    scope_match: { score: 100, passed: 1, failed: 0, weight: 0.05 },
    deterministic: { score: 100, passed: 0, failed: 0, weight: 0.0 },
  },
  detailed_results: [
    {
      item_id: "1.1",
      category: "title_abstract",
      description: "Title word limit",
      status: "pass",
      details: "Title has 9 words (limit: 15 words). Well within the allowed range.",
      confidence: 1.0,
    },
    {
      item_id: "1.2",
      category: "title_abstract",
      description: "Abstract structure and length",
      status: "pass",
      details:
        "Abstract contains 245 words with clear problem statement, methodology, and results.",
      confidence: 0.92,
    },
    {
      item_id: "3.1",
      category: "method",
      description: "Methodology section present",
      status: "pass",
      details: "Paper includes a well-structured methodology section (Section 3, pages 3-5).",
      confidence: 0.95,
    },
    {
      item_id: "3.2",
      category: "method",
      description: "Reproducibility information",
      status: "pass",
      details: "Hyperparameters, training details, and dataset splits are documented.",
      confidence: 0.78,
    },
    {
      item_id: "6.1",
      category: "writing_quality",
      description: "Grammar and language quality",
      status: "pass",
      details: "Writing quality is acceptable with minor grammatical issues.",
      confidence: 0.82,
    },
    {
      item_id: "6.2",
      category: "writing_quality",
      description: "Sentence length compliance",
      status: "warning",
      details:
        "7 sentences exceed the 25-word recommended limit. Consider breaking them into shorter sentences for readability.",
      confidence: 0.88,
    },
    {
      item_id: "6.3",
      category: "writing_quality",
      description: "Banned phrases detection",
      status: "fail",
      details:
        "Found banned phrase: 'it is obvious that' (page 4, line 12). Academic writing should avoid assumptive language.",
      confidence: 0.97,
    },
    {
      item_id: "5.1",
      category: "experiments",
      description: "Baseline comparisons",
      status: "pass",
      details: "Paper compares against 4 baseline methods including SOTA approaches.",
      confidence: 0.85,
    },
    {
      item_id: "5.2",
      category: "experiments",
      description: "Minimum tables requirement",
      status: "fail",
      details:
        "Paper contains 1 table but minimum required is 3. Add comparison tables for results and ablation studies.",
      confidence: 1.0,
    },
    {
      item_id: "0.1",
      category: "scope_match",
      description: "Conference scope alignment",
      status: "pass",
      details:
        "Paper topics (NLP, neural machine translation, attention mechanisms) align with conference domains.",
      confidence: 0.91,
    },
    {
      item_id: "11.4",
      category: "deterministic",
      description: "Page limit compliance",
      status: "pass",
      details: "Paper has 8 pages (limit: 10 pages).",
      confidence: 1.0,
    },
  ],
}

export async function precheckPaper(
  conferenceId: string,
  file: File,
): Promise<{
  data: PrecheckResult | null
  error: string | null
}> {
  // ── Return mock data when flag is enabled ──
  if (USE_MOCK_PRECHECK) {
    await new Promise((r) => setTimeout(r, 1500)) // simulate network delay
    return { data: MOCK_PRECHECK_RESULT, error: null }
  }

  try {
    const formData = new FormData()
    formData.append("file", file)

    const { data: responseData } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/submissions/precheck`,
      {
        method: "POST",
        body: formData,
      },
    )

    // Backend returns { data: ComplianceReport }, so responseData.data contains the report
    if (!responseData || !responseData.data) {
      return {
        data: null,
        error: "Invalid response format from precheck API",
      }
    }

    return { data: responseData.data as PrecheckResult, error: null }
  } catch (error) {
    if (error instanceof ApiError) {
      const body = error.body as
        | {
            data?: {
              message?: string
            }
          }
        | undefined

      const detailedMessage = body?.data?.message?.trim()
      if (detailedMessage) {
        return {
          data: null,
          error: detailedMessage,
        }
      }
    }

    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to precheck paper",
    }
  }
}

/**
 * Upload camera-ready version of an accepted paper
 * Backend: POST /api/v1/conferences/:conference_id/submissions/:submission_id/camera-ready
 */
export async function submitCameraReady(
  conferenceId: string,
  submissionId: string,
  file: File,
): Promise<{ data: import("@/lib/api/submissions").Submission | null; error: string | null }> {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await apiFetch<{ data: any }>(
      `/api/v1/conferences/${conferenceId}/submissions/${submissionId}/camera-ready`,
      {
        method: "POST",
        body: formData,
      },
    )

    return { data: data.data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to upload camera-ready file",
    }
  }
}

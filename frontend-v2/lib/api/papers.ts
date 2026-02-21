import { apiFetch, API_BASE_URL } from "@/lib/api/client"
import type { Paper } from "@/lib/types"

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
    metadata?: {
      language?: string
      page_count?: number
    }
  }
}): Promise<{ data: Paper | null; error: string | null }> {
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

    return { data: paper, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Failed to submit paper" }
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
      metadata?: {
        language?: string
        page_count?: number
      }
    }
  },
): Promise<{ data: Paper | null; error: string | null }> {
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

    return { data: paper, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Failed to update paper" }
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
): Promise<{ data: Paper | null; error: string | null }> {
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

    return { data: paper, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Failed to publish paper" }
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
export async function precheckPaper(
  conferenceId: string,
  file: File,
): Promise<{
  data: {
    paper_title: string
    overall_score: number
    decision: string
    summary: {
      total_items: number
      passed: number
      failed: number
      pass_rate: number
    }
    category_scores: Record<
      string,
      {
        score: number
        passed: number
        failed: number
        weight: number
      }
    >
    detailed_results: Array<{
      item_id: string
      category: string
      description: string
      status: "pass" | "fail" | "warning"
      details: string
      confidence: number
    }>
  } | null
  error: string | null
}> {
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

    return { data: responseData.data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to precheck paper",
    }
  }
}

/**
 * Submit camera ready version of accepted paper
 * TODO: Backend endpoint not yet implemented - placeholder for future use
 */
export async function submitCameraReady(
  paperId: string,
  file: File,
): Promise<{ data: boolean; error: string | null }> {
  try {
    /*
    BACKEND REQUEST: <Implement camera-ready upload contract for conference submissions; frontend-v2 papers API contains placeholder logic because backend upload endpoint is unavailable; provide authenticated multipart upload endpoint, validation/error schema, and final artifact metadata response compatible with current submission model.>
    */
    // TODO: Implement when backend supports file uploads
    // const formData = new FormData()
    // formData.append('file', file)
    // const { response } = await apiFetch(`/api/v1/conferences/${conferenceId}/submissions/${paperId}/camera-ready`, {
    //   method: 'POST',
    //   body: formData
    // })

    return { data: true, error: null }
  } catch (error) {
    return { data: false, error: "Failed to submit camera ready version" }
  }
}

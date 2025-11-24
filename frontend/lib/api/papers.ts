import { apiFetch } from "@/lib/api/client"
import type { Paper } from "@/lib/types"

/**
 * Submit a new paper to a conference
 * Backend endpoint: POST /api/v1/conferences/:conference_id/submissions
 *
 * TODO: Add cover_letter?: File parameter when backend implements cover letter support
 * See: frontend/components/author/submit/cover-letter-tab.tsx for implementation details
 */
export async function submitPaper(data: {
  conference_id: string
  title: string
  abstract: string
  link?: string
  domain: string[]
  file?: File
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
        status: data.status || "draft", // Use provided status or default to draft
        information: data.information || {},
      },
    }
    formData.append("submission", JSON.stringify(submissionData))

    // Add file if provided
    if (data.file) {
      formData.append("file", data.file)
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
 * TODO: Add cover_letter?: File parameter when backend implements cover letter support
 * See: frontend/components/author/submit/cover-letter-tab.tsx for implementation details
 */
export async function updatePaper(
  paperId: string,
  conferenceId: string,
  data: {
    title: string
    abstract: string
    link?: string
    domain: string[]
    file?: File
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
        information: data.information || {},
      },
    }
    formData.append("submission", JSON.stringify(submissionData))

    // Add file if provided
    if (data.file) {
      formData.append("file", data.file)
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

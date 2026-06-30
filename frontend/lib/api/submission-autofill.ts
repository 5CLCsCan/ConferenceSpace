import { apiFetch } from "@/lib/api/client"

export interface AutofillAuthor {
  name: string
  email?: string
  affiliation?: string
  country?: string
}

export interface AutofillTrackRanking {
  track_name: string
  confidence: number
  rationale: string
}

export interface AutofillMaterial {
  file_id: string
  filename: string
  content_type?: string
  size_bytes: number
  role: string
  extraction_status: string
  text_coverage_ratio?: number
  page_count?: number
  warnings: string[]
}

export interface SubmissionAutofillResponse {
  run_id: string
  status: "ready" | "failed"
  fields: {
    title: string
    abstract: string
    keywords: string[]
    paper_type: "research" | "student" | "other" | "" | string
    additional_notes: string
  }
  selected_track_name?: string
  track_rankings: AutofillTrackRanking[]
  authors: AutofillAuthor[]
  materials: AutofillMaterial[]
  warnings: string[]
  error?: {
    code: string
    message: string
  } | null
}

export function normalizeSubmissionAutofillResponse(response: any): SubmissionAutofillResponse {
  return {
    ...response,
    authors: Array.isArray(response.authors) ? response.authors.map(normalizeAuthor) : [],
    track_rankings: Array.isArray(response.track_rankings)
      ? response.track_rankings.map(normalizeTrackRanking)
      : [],
    materials: Array.isArray(response.materials) ? response.materials.map(normalizeMaterial) : [],
    warnings: Array.isArray(response.warnings) ? response.warnings : [],
    fields: {
      title: normalizeString(response.fields?.title),
      abstract: normalizeString(response.fields?.abstract),
      keywords: Array.isArray(response.fields?.keywords)
        ? response.fields.keywords
            .map((keyword: unknown) => normalizeString(keyword))
            .filter(Boolean)
        : [],
      paper_type: normalizeString(response.fields?.paper_type),
      additional_notes: normalizeString(response.fields?.additional_notes),
    },
  }
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function normalizeAuthor(author: AutofillAuthor): AutofillAuthor {
  return {
    name: normalizeString(author.name),
    email: normalizeString(author.email) || undefined,
    affiliation: normalizeString(author.affiliation) || undefined,
    country: normalizeString(author.country) || undefined,
  }
}

function normalizeTrackRanking(ranking: AutofillTrackRanking): AutofillTrackRanking {
  const confidence = Number(ranking.confidence)
  return {
    track_name: normalizeString(ranking.track_name),
    confidence: Number.isFinite(confidence) ? Math.min(10, Math.max(1, confidence)) : 1,
    rationale: normalizeString(ranking.rationale),
  }
}

function normalizeMaterial(material: AutofillMaterial): AutofillMaterial {
  return {
    ...material,
    warnings: Array.isArray(material.warnings) ? material.warnings : [],
  }
}

export async function generateSubmissionAutofill(input: {
  conferenceId: string
  files: File[]
  extraDetails?: string
  availableTracks?: string[]
}): Promise<{ data: SubmissionAutofillResponse | null; error: string | null }> {
  try {
    const formData = new FormData()
    formData.append(
      "request",
      JSON.stringify({
        extra_details: input.extraDetails?.trim() || "",
        available_tracks: input.availableTracks || [],
      }),
    )
    input.files.forEach((file) => {
      formData.append("files", file)
    })

    const { data } = await apiFetch<{ data: SubmissionAutofillResponse }>(
      `/api/v1/conferences/${input.conferenceId}/submissions/autofill`,
      {
        method: "POST",
        body: formData,
      },
    )

    return { data: normalizeSubmissionAutofillResponse(data.data), error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to generate submission autofill",
    }
  }
}

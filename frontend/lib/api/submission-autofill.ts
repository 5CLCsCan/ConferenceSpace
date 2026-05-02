import { apiFetch } from "@/lib/api/client"

export type AutofillConfidence = "high" | "medium" | "low" | "not_found"

export interface AutofillEvidence {
  file_id: string
  source_type?: string
  quote_or_signal: string
  location_hint?: string
}

export interface AutofillField<T> {
  value: T
  confidence: AutofillConfidence
  evidence: AutofillEvidence[]
  warnings: string[]
}

export interface AutofillAuthor {
  name: string
  email?: string
  affiliation?: string
  country?: string
  ordinal?: number
  confidence: AutofillConfidence
  evidence: AutofillEvidence[]
  warnings: string[]
}

export interface AutofillConflict {
  name: string
  email?: string
  institution?: string
  reason: string
  confidence: AutofillConfidence
  evidence: AutofillEvidence[]
  warnings: string[]
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
    title: AutofillField<string>
    abstract: AutofillField<string>
    keywords: AutofillField<string[]>
    track_name: AutofillField<string>
    paper_type: AutofillField<"research" | "student" | "other" | "">
    additional_notes: AutofillField<string>
  }
  authors: AutofillAuthor[]
  possible_conflicts: AutofillConflict[]
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
    possible_conflicts: Array.isArray(response.possible_conflicts)
      ? response.possible_conflicts.map(normalizeConflict)
      : [],
    materials: Array.isArray(response.materials) ? response.materials.map(normalizeMaterial) : [],
    warnings: Array.isArray(response.warnings) ? response.warnings : [],
    fields: {
      title: normalizeField(response.fields.title, ""),
      abstract: normalizeField(response.fields.abstract, ""),
      keywords: normalizeField(response.fields.keywords, []),
      track_name: normalizeField(response.fields.track_name, ""),
      paper_type: normalizeField(response.fields.paper_type, ""),
      additional_notes: normalizeField(response.fields.additional_notes, ""),
    },
  }
}

function normalizeField<T>(field: AutofillField<T>, fallbackValue: T): AutofillField<T> {
  return {
    value: field?.value ?? fallbackValue,
    confidence: field?.confidence ?? "not_found",
    evidence: Array.isArray(field?.evidence) ? field.evidence : [],
    warnings: Array.isArray(field?.warnings) ? field.warnings : [],
  }
}

function normalizeAuthor(author: AutofillAuthor): AutofillAuthor {
  return {
    ...author,
    evidence: Array.isArray(author.evidence) ? author.evidence : [],
    warnings: Array.isArray(author.warnings) ? author.warnings : [],
  }
}

function normalizeConflict(conflict: AutofillConflict): AutofillConflict {
  return {
    ...conflict,
    evidence: Array.isArray(conflict.evidence) ? conflict.evidence : [],
    warnings: Array.isArray(conflict.warnings) ? conflict.warnings : [],
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

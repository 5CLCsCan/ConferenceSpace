import { apiFetch } from "@/lib/api/client"
import type { ConferenceConfigTemplate, ConferenceConfigTemplatePayload } from "@/lib/types"
import type { ApiResponse } from "@/lib/api/conferences"

function mapTemplate(raw: any): ConferenceConfigTemplate {
  return {
    id: String(raw.id),
    name: raw.name || "",
    description: raw.description || "",
    payload: raw.payload || {},
    created_at: raw.created_at || "",
    updated_at: raw.updated_at || "",
  }
}

export async function listConferenceConfigTemplates(
  search?: string,
): Promise<ApiResponse<{ templates: ConferenceConfigTemplate[] }>> {
  try {
    const params = new URLSearchParams()
    if (search?.trim()) {
      params.set("search", search.trim())
    }

    const endpoint = `/api/v1/conference-config-templates${params.size ? `?${params.toString()}` : ""}`
    const { data, response } = await apiFetch<{ data: { templates: any[] } }>(endpoint)

    return {
      data: {
        templates: (data.data.templates || []).map(mapTemplate),
      },
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to list conference config templates",
      status: 500,
    }
  }
}

export async function createConferenceConfigTemplate(input: {
  name: string
  description?: string
  payload: ConferenceConfigTemplatePayload
}): Promise<ApiResponse<ConferenceConfigTemplate>> {
  try {
    const { data, response } = await apiFetch<{ data: any }>(
      "/api/v1/conference-config-templates",
      {
        method: "POST",
        body: JSON.stringify({
          template: {
            name: input.name,
            description: input.description || "",
            payload: input.payload,
          },
        }),
      },
    )

    return {
      data: mapTemplate(data.data),
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to create conference config template",
      status: 500,
    }
  }
}

export async function updateConferenceConfigTemplate(
  templateId: string,
  input: {
    name: string
    description?: string
    payload: ConferenceConfigTemplatePayload
  },
): Promise<ApiResponse<ConferenceConfigTemplate>> {
  try {
    const { data, response } = await apiFetch<{ data: any }>(
      `/api/v1/conference-config-templates/${templateId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          template: {
            name: input.name,
            description: input.description || "",
            payload: input.payload,
          },
        }),
      },
    )

    return {
      data: mapTemplate(data.data),
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update conference config template",
      status: 500,
    }
  }
}

export async function deleteConferenceConfigTemplate(
  templateId: string,
): Promise<ApiResponse<boolean>> {
  try {
    const { response } = await apiFetch(`/api/v1/conference-config-templates/${templateId}`, {
      method: "DELETE",
    })

    return {
      data: true,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to delete conference config template",
      status: 500,
    }
  }
}

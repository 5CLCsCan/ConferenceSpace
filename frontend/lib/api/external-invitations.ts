import { apiFetch } from "./client"

export interface ExternalInvitationItem {
  role: string
  scholar_id?: string
  name: string
  email?: string
  affiliation?: string
  profile_url?: string
  fields_of_study?: string[]
}

export interface ExternalInvitation {
  id: number
  conference_id: number
  role: string
  scholar_id?: string
  name: string
  email?: string
  affiliation?: string
  profile_url?: string
  status: string
  invited_by: number
  created_at: string
  updated_at: string
  fields_of_study?: string[]
}

export interface ExternalInvitationBatchResponse {
  success: ExternalInvitation[]
  failed: { scholar_id: string; error: string }[]
}

export interface ExternalInvitationListResponse {
  invitations: ExternalInvitation[]
  total: number
  limit: number
  offset: number
}

export async function createExternalInvitations(
  conferenceId: string,
  invitations: ExternalInvitationItem[],
): Promise<{ data: ExternalInvitationBatchResponse | null; error: string | null }> {
  try {
    const { data } = await apiFetch<{ data: ExternalInvitationBatchResponse }>(
      `/api/v1/conferences/${conferenceId}/external-invitations`,
      {
        method: "POST",
        body: JSON.stringify({ invitations }),
      },
    )
    return { data: data.data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create external invitations",
    }
  }
}

export async function listExternalInvitations(
  conferenceId: string,
  params?: { limit?: number; offset?: number; role?: string },
): Promise<{ data: ExternalInvitationListResponse | null; error: string | null }> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", String(params.limit))
    if (params?.offset) searchParams.set("offset", String(params.offset))
    if (params?.role) searchParams.set("role", params.role)
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""

    const { data } = await apiFetch<{ data: ExternalInvitationListResponse }>(
      `/api/v1/conferences/${conferenceId}/external-invitations${query}`,
    )
    return { data: data.data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to list external invitations",
    }
  }
}

export async function deleteExternalInvitation(
  conferenceId: string,
  invitationId: number,
): Promise<{ error: string | null }> {
  try {
    await apiFetch(
      `/api/v1/conferences/${conferenceId}/external-invitations/${invitationId}`,
      { method: "DELETE" },
    )
    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete external invitation",
    }
  }
}

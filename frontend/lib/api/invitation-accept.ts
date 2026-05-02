import { apiFetch } from "./client"
// ApiFetchOptions is exported implicitly via usage; declare what we need
type ApiFetchOptions = Parameters<typeof apiFetch>[1]

export interface InvitationPrefill {
  invitation_id: number
  role: string
  name: string
  email?: string
  scholar_id?: string
  affiliation?: string
  profile_url?: string
  fields_of_study?: string[]
  conference: { id: number; title: string; acronym: string }
  invited_by: { name?: string; email?: string }
}

export interface AcceptInvitationPayload {
  token: string
  email: string
  password: string
  first_name: string
  last_name: string
  domain: string[]
}

export interface AcceptInvitationResponse {
  user: { id: number; email: string; first_name: string; last_name: string }
  conference_id: number
  role: string
}

export async function validateInvitationToken(token: string) {
  try {
    const options: ApiFetchOptions = { skipAuth: true }
    const { data } = await apiFetch<{ data: InvitationPrefill }>(
      `/api/v1/external-invitations/accept?token=${encodeURIComponent(token)}`,
      options,
    )
    return { data: data.data, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Invalid invitation" }
  }
}

// POST goes to the Next.js route at /api/v1/auth/accept-invitation, NOT
// directly to the backend. The Next.js route forwards the request to the
// Go backend, reads the JWT from the response, and sets httpOnly cookies
// (same pattern as /api/v1/auth/login/route.ts). The client receives
// { user, conference_id, role } without ever touching the raw JWT.
export async function acceptInvitation(payload: AcceptInvitationPayload) {
  try {
    const response = await fetch("/api/v1/auth/accept-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) {
      return { data: null, error: data.error ?? "Failed to accept" }
    }
    return { data: data as AcceptInvitationResponse, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to accept" }
  }
}

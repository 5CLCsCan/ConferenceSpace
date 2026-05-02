import { apiFetch } from "./client"

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  domain: string[]
  semantic_scholar_id?: string
  profile_sync_status?: string
  roles?: string[]
  /**
   * Conference-match annotations. Populated only when the search endpoint is
   * called with `?conference_id=`. Field names mirror the suggestion DTO.
   */
  matched_fields?: string[]
  score?: number
}

/** Response shape of GET /api/v1/users/search. */
export interface UserSearchResponse {
  users: User[]
  total: number
}

/**
 * Search users with an optional conference context. When `conferenceId` is
 * supplied, each returned user includes `matched_fields` and `score` computed
 * server-side using the same scoring as the reviewer-suggestions endpoint.
 */
export async function searchUsersForConference(
  q: string,
  conferenceId: string | number | null | undefined,
  limit = 10,
): Promise<{ data: UserSearchResponse | null; error: string | null }> {
  const trimmed = q.trim()
  if (!trimmed) return { data: { users: [], total: 0 }, error: null }

  try {
    const params = new URLSearchParams()
    params.set("q", trimmed)
    params.set("limit", String(limit))
    if (conferenceId !== null && conferenceId !== undefined && conferenceId !== "") {
      params.set("conference_id", String(conferenceId))
    }

    const { data } = await apiFetch<
      { data: UserSearchResponse } | UserSearchResponse
    >(`/api/v1/users/search?${params.toString()}`)

    const result =
      data && typeof data === "object" && "data" in data && (data as { data: unknown }).data
        ? (data as { data: UserSearchResponse }).data
        : (data as UserSearchResponse)

    return { data: result, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to search users",
    }
  }
}

export interface ProfileSyncStatus {
  semantic_scholar_id?: string
  profile_sync_status?: "pending" | "completed" | "failed" | string
}

export const userApi = {
  getMe: () => apiFetch<{ data: User }>("/api/v1/users/me"),
  getByEmail: (email: string) =>
    apiFetch<{ data: User }>(`/api/v1/users/${encodeURIComponent(email)}`),
  getProfileSyncStatus: () =>
    apiFetch<{ data: ProfileSyncStatus }>("/api/v1/users/me/profile-sync-status"),
  getAcademicProfile: () =>
    apiFetch<{ data: AcademicProfile }>("/api/v1/users/me/academic-profile"),
  getAcademicProfileByEmail: (email: string) =>
    apiFetch<{ data: AcademicProfile }>(
      `/api/v1/users/${encodeURIComponent(email)}/academic-profile`,
    ),
  linkAcademicProfile: (semanticScholarId: string) =>
    apiFetch<{ data: User }>("/api/v1/users/link-academic-profile", {
      method: "POST",
      body: JSON.stringify({ semanticScholarId }),
    }),
  unlinkAcademicProfile: () =>
    apiFetch<{ data: User }>("/api/v1/users/unlink-academic-profile", {
      method: "POST",
    }),
}

export interface AcademicPaper {
  paperId: string
  title: string
  abstract?: string
  year?: number
  citationCount?: number
  venue?: string
  url?: string
  authors?: { authorId: string; name: string }[]
}

export interface AcademicProfile {
  userId: number
  semanticScholarId: string
  name: string
  affiliations: string[]
  paperCount: number
  citationCount: number
  hIndex: number
  url: string
  syncedAt: string
  papers: AcademicPaper[]
}

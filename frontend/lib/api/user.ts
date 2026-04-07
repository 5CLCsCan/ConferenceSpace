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

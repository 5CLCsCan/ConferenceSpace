import { apiFetch } from "./client"

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  domain: string[]
  semantic_scholar_id?: string
  profile_sync_status?: string
}

export const userApi = {
  getMe: () => apiFetch<{ data: User }>("/users/me"),
  getAcademicProfile: () => apiFetch<{ data: AcademicProfile }>("/users/me/academic-profile"),
  linkAcademicProfile: (semanticScholarId: string) =>
    apiFetch<{ data: User }>("/users/link-academic-profile", {
      method: "POST",
      body: JSON.stringify({ semanticScholarId }),
    }),
}

export interface AcademicPaper {
  paperId: string
  title: string
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

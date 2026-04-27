import { apiFetch } from "./client"

export interface AuthorExternalIds {
  ORCID?: string[] | string
  DBLP?: string[] | string
  [key: string]: string[] | string | undefined
}

export interface NormalizedAffiliation {
  rorId: string
  rorDisplayName: string
}

export interface Author {
  authorId: string
  name: string
  affiliations?: string[]
  normalizedAffiliations?: NormalizedAffiliation[]
  externalIds?: AuthorExternalIds
  homepage?: string
  paperCount?: number
  citationCount?: number
  hIndex?: number
  url?: string
  papers?: Paper[]
}

export interface Paper {
  paperId: string
  title: string
  year?: number
  citationCount?: number
  abstract?: string
  venue?: string
  url?: string
  authors?: Author[]
}

export interface AuthorWithPapers extends Author {
  papers?: Paper[]
}

export interface SearchResponse {
  total: number
  offset: number
  next?: number
  data: Author[]
}

export interface PapersResponse {
  offset: number
  next?: number
  data: Paper[]
}

export function parseSemanticScholarAuthorInput(value: string): {
  authorId?: string
  error?: "empty" | "unsupported_url" | "invalid_format"
} {
  const trimmed = value.trim()
  if (!trimmed) {
    return { error: "empty" }
  }

  if (/^\d+$/.test(trimmed)) {
    return { authorId: trimmed }
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmed)
  } catch {
    return { error: "invalid_format" }
  }

  const hostname = parsedUrl.hostname.toLowerCase()
  if (!hostname.endsWith("semanticscholar.org")) {
    return { error: "unsupported_url" }
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean)
  const authorIndex = segments.findIndex((segment) => segment === "author")
  if (authorIndex === -1 || authorIndex === segments.length - 1) {
    return { error: "invalid_format" }
  }

  const candidate = segments[segments.length - 1]
  if (!/^\d+$/.test(candidate)) {
    return { error: "invalid_format" }
  }

  return { authorId: candidate }
}

export const semanticScholarApi = {
  searchAuthors: async (query: string, limit: number = 20): Promise<SearchResponse> => {
    // Backend returns: Response{Data: SearchResponse{total, offset, data: Author[]}}
    // apiFetch extracts and returns: {data: SearchResponse}
    // We return result.data to get the SearchResponse
    const result = await apiFetch<{ data: SearchResponse }>(
      `/api/v1/semantic-scholar/authors/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    )
    return result.data.data
  },

  getAuthorDetails: async (authorId: string): Promise<AuthorWithPapers> => {
    const { data: response } = await apiFetch<{ data: AuthorWithPapers }>(
      `/api/v1/semantic-scholar/authors/${authorId}`,
    )
    return response.data
  },

  getAuthorPapers: async (
    authorId: string,
    offset: number = 0,
    limit: number = 100,
  ): Promise<PapersResponse> => {
    const { data: response } = await apiFetch<{ data: PapersResponse }>(
      `/api/v1/semantic-scholar/authors/${authorId}/papers?offset=${offset}&limit=${limit}`,
    )
    return response.data
  },
}

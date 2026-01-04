import { apiFetch } from './client';

export interface Author {
    authorId: string;
    name: string;
    affiliations?: string[];
    homepage?: string;
    paperCount?: number;
    citationCount?: number;
    hIndex?: number;
    url?: string;
}

export interface Paper {
    paperId: string;
    title: string;
    year?: number;
    citationCount?: number;
    abstract?: string;
    venue?: string;
    url?: string;
    authors?: Author[];
}

export interface AuthorWithPapers extends Author {
    papers?: Paper[];
}

export interface SearchResponse {
    total: number;
    offset: number;
    next?: number;
    data: Author[];
}

export interface PapersResponse {
    offset: number;
    next?: number;
    data: Paper[];
}

export const semanticScholarApi = {
    searchAuthors: async (query: string, limit: number = 20): Promise<SearchResponse> => {
        const { data } = await apiFetch<SearchResponse>(`/api/v1/semantic-scholar/authors/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        return data;
    },

    getAuthorDetails: async (authorId: string): Promise<AuthorWithPapers> => {
        const { data } = await apiFetch<AuthorWithPapers>(`/api/v1/semantic-scholar/authors/${authorId}`);
        return data;
    },

    getAuthorPapers: async (authorId: string, offset: number = 0, limit: number = 100): Promise<PapersResponse> => {
        const { data } = await apiFetch<PapersResponse>(`/api/v1/semantic-scholar/authors/${authorId}/papers?offset=${offset}&limit=${limit}`);
        return data;
    },
};

import useSWR from 'swr'
import { getReviewerPapersWithPagination } from '@/lib/api/reviewer'
import { swrConfig } from '@/lib/swr-config'
import type { AssignedPaper } from '@/lib/types'

/**
 * Parameters for papers list
 */
export interface PapersParams {
  limit?: number
  offset?: number
  search?: string
  status?: string
}

/**
 * SWR hook for reviewer's conference papers with caching and pagination
 * 
 * Features:
 * - Automatic caching (5 minutes)
 * - Pagination support
 * - Search and filter support
 * - Automatic error retry
 * 
 * @param reviewerId - The reviewer's user ID
 * @param conferenceId - The conference ID
 * @param params - Pagination and filter parameters
 * @returns Papers data, pagination info, loading state, and mutate function
 */
export function useConferencePapers(
  reviewerId: string | null,
  conferenceId: string | null,
  params: PapersParams = {}
) {
  // Create stable key for SWR caching
  const key = reviewerId && conferenceId
    ? ['conference-papers', reviewerId, conferenceId, JSON.stringify(params)]
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      if (!reviewerId || !conferenceId) return null
      
      const response = await getReviewerPapersWithPagination(
        reviewerId,
        conferenceId,
        params
      )
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return {
        papers: response.data || [],
        total: response.total,
        limit: response.limit,
        offset: response.offset,
      }
    },
    {
      ...swrConfig,
      // Papers data doesn't change as frequently
      dedupingInterval: 180000, // Cache for 3 minutes
      onError: (err) => {
        console.error('Failed to fetch conference papers:', err)
      },
    }
  )

  return {
    papers: data?.papers || [],
    total: data?.total || 0,
    limit: data?.limit || params.limit || 20,
    offset: data?.offset || params.offset || 0,
    isLoading,
    isValidating,
    error: error?.message || null,
    refresh: mutate,
    
    // Helper to update a single paper optimistically
    updatePaper: (paperId: string, updater: (paper: AssignedPaper) => AssignedPaper) => {
      return mutate(
        (currentData) => {
          if (!currentData) return currentData
          
          return {
            ...currentData,
            papers: currentData.papers.map((paper) =>
              paper.id === paperId ? updater(paper) : paper
            ),
          }
        },
        { revalidate: false }
      )
    },
  }
}

/**
 * Hook to prefetch papers for a conference (useful for optimistic navigation)
 * Call this when user hovers over a conference to preload data
 */
export function usePrefetchConferencePapers(
  reviewerId: string,
  conferenceId: string,
  params: PapersParams = {}
) {
  const key = ['conference-papers', reviewerId, conferenceId, JSON.stringify(params)]
  
  // This will start fetching but won't return anything
  // The data will be cached and ready when the component mounts
  return useSWR(
    key,
    () => getReviewerPapersWithPagination(reviewerId, conferenceId, params),
    { ...swrConfig, revalidateOnMount: false }
  )
}

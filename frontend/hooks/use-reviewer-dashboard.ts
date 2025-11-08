import useSWR from "swr"
import { getReviewerDashboard, DashboardOptions } from "@/lib/api/reviewer"
import { swrConfig } from "@/lib/swr-config"
import type { ReviewerDashboardData } from "@/lib/types"

/**
 * SWR hook for reviewer dashboard data with caching and automatic revalidation
 *
 * Features:
 * - Automatic caching (5 minutes)
 * - Automatic error retry
 * - Optimistic updates support
 * - Stale-while-revalidate pattern
 *
 * @param reviewerId - The reviewer's user ID
 * @param options - Pagination and filter options
 * @returns Dashboard data, loading state, error, and mutate function
 *
 * @example
 * const { dashboard, isLoading, error, refresh } = useReviewerDashboard('123', {
 *   conferenceLimit: 10,
 *   invitationStatus: 'pending'
 * });
 */
export function useReviewerDashboard(reviewerId: string | null, options: DashboardOptions = {}) {
  // Create stable key for SWR caching
  const key = reviewerId ? ["reviewer-dashboard", reviewerId, JSON.stringify(options)] : null

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async () => {
      if (!reviewerId) return null

      const response = await getReviewerDashboard(reviewerId, options)

      if (response.error) {
        throw new Error(response.error)
      }

      return response.data
    },
    {
      ...swrConfig,
      // Custom config for dashboard
      dedupingInterval: 60000, // Cache for 1 minute (dashboard data changes frequently)
      onError: (err) => {
        console.error("Failed to fetch reviewer dashboard:", err)
      },
    },
  )

  return {
    dashboard: data,
    isLoading,
    isValidating, // True when revalidating in background
    error: error?.message || null,
    refresh: mutate, // Manually trigger refresh

    // Helper to update data optimistically
    updateOptimistic: (
      updater: (data: ReviewerDashboardData | null | undefined) => ReviewerDashboardData | null,
    ) => {
      return mutate(updater, { revalidate: false })
    },
  }
}

/**
 * Hook specifically for invitation status filter
 * Provides easy access to change invitation filter and see loading state
 */
export function useReviewerInvitations(
  reviewerId: string | null,
  invitationStatus: string = "",
  invitationLimit: number = 10,
  invitationOffset: number = 0,
) {
  return useReviewerDashboard(reviewerId, {
    invitationStatus,
    invitationLimit,
    invitationOffset,
  })
}

/**
 * Hook specifically for conference search
 * Provides easy access to search conferences and see loading state
 */
export function useReviewerConferences(
  reviewerId: string | null,
  conferenceSearch: string = "",
  conferenceLimit: number = 10,
  conferenceOffset: number = 0,
) {
  return useReviewerDashboard(reviewerId, {
    conferenceSearch,
    conferenceLimit,
    conferenceOffset,
  })
}

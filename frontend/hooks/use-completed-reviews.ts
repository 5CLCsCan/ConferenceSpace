import { useState, useEffect, useCallback } from "react"
import { getCompletedPapers } from "@/lib/api/reviews"
import type { AssignedPaper } from "@/lib/types"

const PAGE_SIZE = 20

interface UseCompletedReviewsFilters {
  search?: string
}

export function useCompletedReviews(reviewerId: string, filters?: UseCompletedReviewsFilters) {
  const [reviews, setReviews] = useState<AssignedPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)

  const loadReviews = useCallback(
    async (reset: boolean = false) => {
      if (!reviewerId) return

      if (reset) {
        setIsLoading(true)
        setReviews([])
        setCurrentOffset(0)
      } else {
        setIsLoadingMore(true)
      }

      try {
        // Load paginated papers from completed-papers API with filters
        const offset = reset ? 0 : currentOffset
        const response = await getCompletedPapers(reviewerId, {
          limit: PAGE_SIZE,
          offset,
          search: filters?.search,
        })

        if (response.error) {
          setError(response.error)
          return
        }

        const newReviews = response.data || []
        const total = response.total

        if (reset) {
          setReviews(newReviews)
          setCurrentOffset(newReviews.length)
        } else {
          // Avoid duplicates
          setReviews((prev) => {
            const existingIds = new Set(prev.map((r) => r.id))
            const uniqueNew = newReviews.filter((r) => !existingIds.has(r.id))
            return [...prev, ...uniqueNew]
          })
          setCurrentOffset((prev) => prev + newReviews.length)
        }

        const totalLoaded = reset ? newReviews.length : currentOffset + newReviews.length
        setHasMore(totalLoaded < total)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load completed reviews")
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [reviewerId, currentOffset, filters?.search],
  )

  useEffect(() => {
    loadReviews(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewerId, filters?.search])

  const loadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore) {
      loadReviews(false)
    }
  }, [isLoading, isLoadingMore, hasMore, loadReviews])

  return {
    reviews,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh: () => loadReviews(true),
  }
}

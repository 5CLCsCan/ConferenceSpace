import { useState, useEffect, useCallback } from "react"
import { getCompletedPapers } from "@/lib/api/reviews"
import type { AssignedPaper } from "@/lib/types"

const PAGE_SIZE = 5

interface UseCompletedReviewsFilters {
  search?: string
  limit?: number
  offset?: number
}

export function useCompletedReviews(reviewerId: string, filters?: UseCompletedReviewsFilters) {
  const [reviews, setReviews] = useState<AssignedPaper[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = filters?.limit ?? PAGE_SIZE
  const offset = filters?.offset ?? 0

  const loadReviews = useCallback(async () => {
    if (!reviewerId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await getCompletedPapers(reviewerId, {
        limit,
        offset,
        search: filters?.search,
      })

      if (response.error) {
        setError(response.error)
        return
      }

      setReviews(response.data || [])
      setTotal(response.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load completed reviews")
    } finally {
      setIsLoading(false)
    }
  }, [reviewerId, limit, offset, filters?.search])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  return {
    reviews,
    total,
    isLoading,
    error,
    refresh: loadReviews,
  }
}

import { useState, useEffect, useCallback } from "react"
import { getReviewerConferences, getReviewerStats, getReviewRequests } from "@/lib/api/reviewer"
import type { Conference, ReviewRequest } from "@/lib/types"

interface ReviewerStats {
  total_assigned: number
  pending: number
  in_progress: number
  completed: number
  pending_requests: number
}

export function useReviewerData(reviewerId: string) {
  const [conferences, setConferences] = useState<Conference[]>([])
  const [stats, setStats] = useState<ReviewerStats | null>(null)
  const [invitations, setInvitations] = useState<ReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [confResponse, statsResponse, invitesResponse] = await Promise.all([
        getReviewerConferences(reviewerId),
        getReviewerStats(reviewerId),
        getReviewRequests(reviewerId),
      ])

      let errors: string[] = []
      if (confResponse.data) {
        setConferences(confResponse.data)
      } else {
        errors.push(`Failed to fetch conferences: ${confResponse.error}`)
      }

      if (statsResponse.data) {
        setStats(statsResponse.data)
      } else {
        errors.push(`Failed to fetch stats: ${statsResponse.error}`)
      }

      if (invitesResponse.data) {
        setInvitations(invitesResponse.data)
      } else {
        errors.push(`Failed to fetch invitations: ${invitesResponse.error}`)
      }

      if (errors.length > 0) {
        setError(errors.join("\n"))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [reviewerId])

  useEffect(() => {
    if (reviewerId) {
      fetchData()
    }
  }, [reviewerId, fetchData])

  return { conferences, stats, invitations, loading, error, refetch: fetchData }
}

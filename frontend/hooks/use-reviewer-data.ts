import { useState, useEffect, useCallback } from "react"
import { getReviewerDashboard } from "@/lib/api/reviewer"
import type { ReviewerConference, ReviewerStats, AssignmentWithPaper } from "@/lib/types"
import type { ReviewRequest } from "@/lib/types"

export function useReviewerData(reviewerId: string, invitationStatus?: string) {
  const [conferences, setConferences] = useState<ReviewerConference[]>([])
  const [stats, setStats] = useState<ReviewerStats | null>(null)
  const [invitations, setInvitations] = useState<ReviewRequest[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!reviewerId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Use single dashboard API call instead of multiple calls
      const dashboardResponse = await getReviewerDashboard(reviewerId, {
        invitationStatus
      })

      if (dashboardResponse.error || !dashboardResponse.data) {
        setError(dashboardResponse.error || "Failed to fetch reviewer dashboard data")
        // Set empty defaults
        setConferences([])
        setStats(null)
        setInvitations([])
        setAssignments([])
      } else {
        // Set all data from single response
        setConferences(dashboardResponse.data.conferences || [])
        setStats(dashboardResponse.data.stats || null)
        setInvitations(dashboardResponse.data.invitations || [])
        setAssignments(dashboardResponse.data.recent_assignments || [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred")
      // Set empty defaults on error
      setConferences([])
      setStats(null)
      setInvitations([])
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [reviewerId, invitationStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData, invitationStatus])

  return { 
    conferences, 
    stats, 
    invitations, 
    assignments,
    loading, 
    error, 
    refetch: fetchData 
  }
}

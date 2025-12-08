import { useEffect, useState, useCallback } from "react"
import {
  getAssignmentReview,
  saveAssignmentReview,
  type AssignmentReview,
  type ReviewData,
} from "@/lib/api/reviews"

type SaveReviewPayload = {
  review_score?: number
  review_data?: ReviewData
  status: "draft" | "submitted"
  assignment_id?: number
  conference_id?: number
}

export default function useAssignmentReview(conferenceId: string, assignmentId: string) {
  const [review, setReview] = useState<AssignmentReview | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReview = useCallback(async () => {
    if (!conferenceId || !assignmentId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: e } = await getAssignmentReview(conferenceId, assignmentId)
      if (e) {
        setError(e)
        setReview(null)
      } else {
        setReview(data)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load review")
    } finally {
      setLoading(false)
    }
  }, [conferenceId, assignmentId])

  useEffect(() => {
    fetchReview()
  }, [fetchReview])

  const saveReview = useCallback(
    async (payload: SaveReviewPayload) => {
      if (!conferenceId || !assignmentId) return { success: false }

      setSaving(true)
      setError(null)
      try {
        // Backend only supports PUT method for saving reviews
        const method = "PUT"
        const { data, error: e } = await saveAssignmentReview(
          conferenceId,
          assignmentId,
          payload,
          method,
        )
        if (e) {
          setError(e)
          return { success: false, error: e }
        }
        setReview(data)
        return { success: true, data }
      } catch (err: any) {
        setError(err.message || "Failed to save review")
        return { success: false, error: err.message }
      } finally {
        setSaving(false)
      }
    },
    [conferenceId, assignmentId],
  )

  return { review, loading, saving, error, fetchReview, saveReview }
}

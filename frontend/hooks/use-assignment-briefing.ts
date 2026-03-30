import { useCallback, useEffect, useState } from "react"

import {
  generateAssignmentBriefing,
  getAssignmentBriefing,
  type ReviewerBriefingResponse,
} from "@/lib/api/reviewer-briefing"

export default function useAssignmentBriefing(conferenceId: string, assignmentId: string) {
  const [briefing, setBriefing] = useState<ReviewerBriefingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBriefing = useCallback(async () => {
    if (!conferenceId || !assignmentId) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await getAssignmentBriefing(conferenceId, assignmentId)
      if (apiError) {
        setError(apiError)
        setBriefing(null)
        return
      }
      setBriefing(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch reviewer briefing")
      setBriefing(null)
    } finally {
      setLoading(false)
    }
  }, [assignmentId, conferenceId])

  useEffect(() => {
    fetchBriefing()
  }, [fetchBriefing])

  const generateBriefing = useCallback(async () => {
    if (!conferenceId || !assignmentId) {
      return { success: false, error: "Missing assignment context" }
    }

    setGenerating(true)
    setError(null)
    try {
      const { data, error: apiError } = await generateAssignmentBriefing(conferenceId, assignmentId)
      if (apiError) {
        setError(apiError)
        return { success: false, error: apiError }
      }
      setBriefing(data)
      return { success: true, data }
    } catch (err: any) {
      const message = err.message || "Failed to generate reviewer briefing"
      setError(message)
      return { success: false, error: message }
    } finally {
      setGenerating(false)
    }
  }, [assignmentId, conferenceId])

  return { briefing, loading, generating, error, fetchBriefing, generateBriefing }
}

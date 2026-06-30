import { useCallback, useEffect, useState } from "react"

import {
  generateReviewerInitialAnalysis,
  getReviewerInitialAnalysis,
  type ReviewerInitialAnalysisResponse,
} from "@/lib/api/reviewer-initial-analysis"

export default function useReviewerInitialAnalysis(conferenceId: string, assignmentId: string) {
  const [analysis, setAnalysis] = useState<ReviewerInitialAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = useCallback(async () => {
    if (!conferenceId || !assignmentId) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await getReviewerInitialAnalysis(conferenceId, assignmentId)
      if (apiError) {
        setError(apiError)
        setAnalysis(null)
        return
      }
      setAnalysis(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch reviewer initial analysis")
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }, [assignmentId, conferenceId])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const generateAnalysis = useCallback(async () => {
    if (!conferenceId || !assignmentId) {
      return { success: false, error: "Missing assignment context" }
    }

    setGenerating(true)
    setError(null)
    try {
      const { data, error: apiError } = await generateReviewerInitialAnalysis(conferenceId, assignmentId)
      if (apiError) {
        setError(apiError)
        return { success: false, error: apiError }
      }
      setAnalysis(data)
      return { success: true, data }
    } catch (err: any) {
      const message = err.message || "Failed to generate reviewer initial analysis"
      setError(message)
      return { success: false, error: message }
    } finally {
      setGenerating(false)
    }
  }, [assignmentId, conferenceId])

  return { analysis, loading, generating, error, fetchAnalysis, generateAnalysis }
}

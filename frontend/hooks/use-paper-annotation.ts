import { useCallback, useEffect, useState } from "react"

import {
  generatePaperAnnotation,
  getPaperAnnotation,
  type PaperAnnotationResponse,
} from "@/lib/api/paper-annotation"

export default function usePaperAnnotation(conferenceId: string, assignmentId: string) {
  const [annotation, setAnnotation] = useState<PaperAnnotationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnotation = useCallback(async () => {
    if (!conferenceId || !assignmentId) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await getPaperAnnotation(conferenceId, assignmentId)
      if (apiError) {
        setError(apiError)
        setAnnotation(null)
        return
      }
      setAnnotation(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch paper annotation")
      setAnnotation(null)
    } finally {
      setLoading(false)
    }
  }, [assignmentId, conferenceId])

  useEffect(() => {
    fetchAnnotation()
  }, [fetchAnnotation])

  const generate = useCallback(async () => {
    if (!conferenceId || !assignmentId) {
      return { success: false, error: "Missing assignment context" }
    }

    setGenerating(true)
    setError(null)
    try {
      const { data, error: apiError } = await generatePaperAnnotation(conferenceId, assignmentId)
      if (apiError) {
        setError(apiError)
        return { success: false, error: apiError }
      }
      setAnnotation(data)
      return { success: true, data }
    } catch (err: any) {
      const message = err.message || "Failed to generate paper annotation"
      setError(message)
      return { success: false, error: message }
    } finally {
      setGenerating(false)
    }
  }, [assignmentId, conferenceId])

  return { annotation, loading, generating, error, fetchAnnotation, generateAnnotation: generate }
}

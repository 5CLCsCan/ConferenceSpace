import { useCallback, useEffect, useState } from "react"

import {
  generateChairDecisionCopilot,
  getChairDecisionCopilot,
  regenerateChairDecisionCopilot,
  type ChairDecisionCopilotResponse,
} from "@/lib/api/chair-decision-copilot"

export default function useChairDecisionCopilot(conferenceId: string, submissionId: string) {
  const [copilot, setCopilot] = useState<ChairDecisionCopilotResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCopilot = useCallback(async () => {
    if (!conferenceId || !submissionId) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await getChairDecisionCopilot(conferenceId, submissionId)
      if (apiError) {
        setError(apiError)
        return
      }
      setCopilot(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch chair decision copilot")
    } finally {
      setLoading(false)
    }
  }, [conferenceId, submissionId])

  useEffect(() => {
    void fetchCopilot()
  }, [fetchCopilot])

  const generateCopilot = useCallback(async () => {
    if (!conferenceId || !submissionId) {
      return { success: false, error: "Missing submission context" }
    }

    setGenerating(true)
    setError(null)
    try {
      const { data, error: apiError } = await generateChairDecisionCopilot(
        conferenceId,
        submissionId,
      )
      if (apiError) {
        setError(apiError)
        return { success: false, error: apiError }
      }
      setCopilot(data)
      return { success: true, data }
    } catch (err: any) {
      const message = err.message || "Failed to generate chair decision copilot"
      setError(message)
      return { success: false, error: message }
    } finally {
      setGenerating(false)
    }
  }, [conferenceId, submissionId])

  const regenerateCopilot = useCallback(async () => {
    if (!conferenceId || !submissionId) {
      return { success: false, error: "Missing submission context" }
    }

    setRegenerating(true)
    setError(null)
    try {
      const { data, error: apiError } = await regenerateChairDecisionCopilot(
        conferenceId,
        submissionId,
      )
      if (apiError) {
        setError(apiError)
        return { success: false, error: apiError }
      }
      setCopilot(data)
      return { success: true, data }
    } catch (err: any) {
      const message = err.message || "Failed to regenerate chair decision copilot"
      setError(message)
      return { success: false, error: message }
    } finally {
      setRegenerating(false)
    }
  }, [conferenceId, submissionId])

  return {
    copilot,
    loading,
    generating,
    regenerating,
    error,
    fetchCopilot,
    generateCopilot,
    regenerateCopilot,
  }
}

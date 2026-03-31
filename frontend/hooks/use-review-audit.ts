import { useCallback, useRef, useState } from "react"

import {
  runReviewAudit,
  updateReviewAuditDismissal,
  type ReviewAuditFinding,
  type ReviewAuditMode,
  type ReviewAuditResponse,
} from "@/lib/api/review-audit"
import type { ReviewData } from "@/lib/api/reviews"

type AuditPayload = {
  mode: ReviewAuditMode
  review_score?: number
  review_data: ReviewData
}

export default function useReviewAudit(conferenceId: string, assignmentId: string) {
  const [audit, setAudit] = useState<ReviewAuditResponse | null>(null)
  const [auditing, setAuditing] = useState(false)
  const [updatingDismissal, setUpdatingDismissal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastPayloadRef = useRef<AuditPayload | null>(null)

  const runAudit = useCallback(
    async (payload: AuditPayload) => {
      if (!conferenceId || !assignmentId) return { success: false as const }

      setAuditing(true)
      setError(null)
      lastPayloadRef.current = payload

      try {
        const result = await runReviewAudit(conferenceId, assignmentId, payload)
        if (result.error) {
          setError(result.error)
          return { success: false as const, error: result.error, errorData: result.errorData }
        }
        setAudit(result.data)
        return { success: true as const, data: result.data }
      } finally {
        setAuditing(false)
      }
    },
    [assignmentId, conferenceId],
  )

  const updateDismissal = useCallback(
    async (action: "dismiss" | "undismiss", finding: ReviewAuditFinding) => {
      if (!conferenceId || !assignmentId) return { success: false as const }

      setUpdatingDismissal(true)
      setError(null)
      try {
        const result = await updateReviewAuditDismissal(conferenceId, assignmentId, {
          action,
          finding: {
            code: finding.code,
            severity: finding.severity,
            field: finding.field,
            condition_fingerprint: finding.condition_fingerprint,
          },
        })
        if (result.error) {
          setError(result.error)
          return { success: false as const, error: result.error, errorData: result.errorData }
        }

        if (lastPayloadRef.current) {
          const rerun = await runReviewAudit(conferenceId, assignmentId, lastPayloadRef.current)
          if (!rerun.error) {
            setAudit(rerun.data)
          }
        }

        return { success: true as const, data: result.data }
      } finally {
        setUpdatingDismissal(false)
      }
    },
    [assignmentId, conferenceId],
  )

  return {
    audit,
    auditing,
    updatingDismissal,
    error,
    runAudit,
    dismissFinding: (finding: ReviewAuditFinding) => updateDismissal("dismiss", finding),
    undismissFinding: (finding: ReviewAuditFinding) => updateDismissal("undismiss", finding),
    clearAudit: () => {
      setAudit(null)
      setError(null)
    },
    replaceAudit: (value: ReviewAuditResponse | null) => {
      setAudit(value)
      setError(null)
    },
  }
}

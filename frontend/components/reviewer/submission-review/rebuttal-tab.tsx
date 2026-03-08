"use client"

import { useEffect, useState } from "react"
import { RebuttalPanel } from "@/components/shared/rebuttal"
import { getRebuttal, acknowledgePoint } from "@/lib/api/rebuttal"
import type { RebuttalPanelData } from "@/lib/api/rebuttal"
import type { ResponseStatus } from "@/components/shared/rebuttal/types"

interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
  assignmentId: string
}

export function RebuttalTab({ conferenceId, submissionId, assignmentId }: RebuttalTabProps) {
  const [data, setData] = useState<RebuttalPanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const result = await getRebuttal(conferenceId, submissionId, assignmentId)
      setLoading(false)
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to load rebuttal")
      } else {
        setData(result.data)
      }
    }
    void load()
  }, [conferenceId, submissionId, assignmentId])

  async function handlePointStatusChange(pointId: string, status: ResponseStatus, note?: string) {
    const result = await acknowledgePoint(conferenceId, assignmentId, pointId, status, note)
    if (result.error) {
      setError(result.error)
    }
  }

  if (loading) {
    return <div className="text-xs text-slate-500 py-4">Loading rebuttal…</div>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <RebuttalPanel
      settings={data.settings}
      reviewers={data.reviewers}
      points={data.points}
      submission={data.submission}
      userRole="reviewer"
      currentUserId={assignmentId}
      onPointStatusChange={handlePointStatusChange}
    />
  )
}

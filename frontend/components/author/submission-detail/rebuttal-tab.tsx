"use client"

import { useEffect, useRef, useState } from "react"
import { RebuttalPanel } from "@/components/shared/rebuttal"
import { getRebuttal, submitRebuttal } from "@/lib/api/rebuttal"
import type { RebuttalPanelData } from "@/lib/api/rebuttal"

interface RebuttalTabProps {
  conferenceId: string
  submissionId: string
}

export function RebuttalTab({ conferenceId, submissionId }: RebuttalTabProps) {
  const [data, setData] = useState<RebuttalPanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [generalResponse, setGeneralResponse] = useState("")
  const generalResponseRef = useRef(generalResponse)
  generalResponseRef.current = generalResponse

  async function load() {
    setLoading(true)
    const result = await getRebuttal(conferenceId, submissionId)
    setLoading(false)
    if (result.error || !result.data) {
      setError(result.error ?? "Failed to load rebuttal")
    } else {
      setData(result.data)
      if (result.data.submission?.generalResponse.content) {
        setGeneralResponse(result.data.submission.generalResponse.content)
      }
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId, submissionId])

  async function handleSubmit() {
    if (!data) return
    setSubmitting(true)
    setError(null)
    const points = data.points.map((p) => ({
      pointId: p.id,
      assignmentId: Number(p.reviewerId),
      category: p.category,
      section: p.section ?? "",
      originalComment: p.originalComment,
      authorResponse: p.authorResponse ?? "",
    }))
    const result = await submitRebuttal(conferenceId, submissionId, {
      generalResponse: generalResponseRef.current,
      perReviewerResponses: [],
      points,
    })
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else {
      await load()
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

  const isSubmitted = data.settings.phase !== "awaiting"

  return (
    <div className="space-y-4">
      {/* General response textarea — only shown when not yet submitted */}
      {!isSubmitted && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <label className="text-xs font-bold text-[#1B3C53] dark:text-white block mb-2">
            General Response
          </label>
          <textarea
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 min-h-[100px] resize-y focus:outline-none focus:ring-1 focus:ring-[#1B3C53]"
            placeholder="Write your general response to all reviewers…"
            value={generalResponse}
            onChange={(e) => setGeneralResponse(e.target.value)}
            disabled={submitting}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !generalResponse.trim()}
              className="text-xs px-4 py-1.5 rounded-lg bg-[#1B3C53] text-white hover:bg-[#1B3C53]/90 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Rebuttal"}
            </button>
          </div>
        </div>
      )}

      <RebuttalPanel
        settings={data.settings}
        reviewers={data.reviewers}
        points={data.points}
        submission={data.submission}
        userRole="author"
        readOnly={isSubmitted || submitting}
      />
    </div>
  )
}

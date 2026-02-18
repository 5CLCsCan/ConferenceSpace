"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubmissionReviewScreen } from "@/components/reviewer/submission-review"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/lib/auth-context"
import { getReviewerMenuItems } from "@/components/reviewer/menu-items"
import { resolveAssignmentConference } from "@/lib/reviewer/resolve-assignment-conference"
import { getAssignmentReview } from "@/lib/api/reviews"
import { getPaperById } from "@/lib/api/papers"
import { setAssignmentConferenceContext } from "@/lib/reviewer/assignment-context-cache"
import type { Paper } from "@/lib/types"

export default function ReviewerAssignmentPage() {
  const params = useParams() as { assignmentId: string }
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })

  const [conferenceId, setConferenceId] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [submission, setSubmission] = useState<Paper | null>(null)
  const [isUnresolved, setIsUnresolved] = useState(false)
  const [loading, setLoading] = useState(true)
  const queryConferenceId = searchParams.get("conferenceId")

  useEffect(() => {
    const run = async () => {
      if (!user?.email) {
        return
      }

      setLoading(true)
      setIsUnresolved(false)
      setConferenceId(null)
      setSubmissionId(null)
      setSubmission(null)

      const resolution = await resolveAssignmentConference({
        assignmentId: params.assignmentId,
        reviewerEmail: user.email,
        conferenceId: queryConferenceId,
      })

      if (!resolution.conferenceId) {
        setIsUnresolved(true)
        setLoading(false)
        return
      }

      let resolvedConferenceId = resolution.conferenceId
      let reviewRes = await getAssignmentReview(resolvedConferenceId, params.assignmentId)

      if ((reviewRes.error || !reviewRes.data?.submission_id) && resolution.source === "query") {
        const fallbackResolution = await resolveAssignmentConference({
          assignmentId: params.assignmentId,
          reviewerEmail: user.email,
        })

        if (
          fallbackResolution.conferenceId &&
          fallbackResolution.conferenceId !== resolvedConferenceId
        ) {
          resolvedConferenceId = fallbackResolution.conferenceId
          reviewRes = await getAssignmentReview(resolvedConferenceId, params.assignmentId)
        }
      }

      if (reviewRes.error || !reviewRes.data?.submission_id) {
        setIsUnresolved(true)
        setLoading(false)
        return
      }

      const resolvedSubmissionId = String(reviewRes.data.submission_id)
      const submissionRes = await getPaperById(resolvedSubmissionId, resolvedConferenceId)

      if (submissionRes.error || !submissionRes.data) {
        setIsUnresolved(true)
        setLoading(false)
        return
      }

      setConferenceId(resolvedConferenceId)
      setAssignmentConferenceContext(params.assignmentId, resolvedConferenceId)
      setSubmissionId(resolvedSubmissionId)
      setSubmission(submissionRes.data)
      setLoading(false)
    }

    run()
  }, [params.assignmentId, queryConferenceId, user?.email])

  const unresolvedBody = useMemo(
    () => (
      <div className="h-full w-full flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-xl border border-amber-300 bg-amber-50 p-6 space-y-3">
          <h1 className="text-xl font-semibold text-amber-900">Unable to resolve assignment context</h1>
          <p className="text-sm text-amber-800">
            We could not determine the conference for assignment <strong>{params.assignmentId}</strong>.
            Open this assignment from the conference submissions list or add a valid{" "}
            <code>conferenceId</code> query parameter.
          </p>
          <div className="pt-2">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800"
              onClick={() => router.push("/role/reviewer/conferences")}
            >
              Go to Conferences
            </button>
          </div>
        </div>
      </div>
    ),
    [params.assignmentId, router],
  )

  if (!user) {
    return null
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getReviewerMenuItems(unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400">Loading...</div>
          ) : isUnresolved || !conferenceId || !submissionId ? (
            unresolvedBody
          ) : (
            <SubmissionReviewScreen
              conferenceId={conferenceId}
              assignmentId={params.assignmentId}
              submissionId={submissionId}
              submission={submission}
              onBack={() => router.push(`/role/reviewer/conferences/${conferenceId}/submissions`)}
            />
          )}
        </div>
      </main>
    </div>
  )
}

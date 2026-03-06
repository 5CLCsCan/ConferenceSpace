"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { PaperSubmissionForm } from "@/components/author/submit/paper-submission-form"
import { useAuth } from "@/lib/auth-context"
import { getConferenceById } from "@/lib/api/conferences"
import { getSubmissionById } from "@/lib/api/submissions"
import { resolveSubmissionConference } from "@/lib/submissions/resolve-submission-conference"
import type { Conference } from "@/lib/types"
import type { Submission } from "@/lib/api/submissions"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"

function EditSubmissionPageContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const submissionId = params?.submissionId as string
  const conferenceIdQuery = searchParams.get("conferenceId")

  const [conference, setConference] = useState<Conference | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [resolvedConferenceId, setResolvedConferenceId] = useState<string | null>(conferenceIdQuery)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function resolveConferenceContext() {
      if (!submissionId || !user?.email) {
        setLoading(false)
        setNotFound(true)
        return
      }

      const resolution = await resolveSubmissionConference({
        submissionId,
        conferenceId: conferenceIdQuery,
        userEmail: user.email,
      })

      if (!resolution.conferenceId) {
        setLoading(false)
        setNotFound(true)
        return
      }

      setResolvedConferenceId(resolution.conferenceId)
    }

    if (user) {
      resolveConferenceContext()
    }
  }, [conferenceIdQuery, submissionId, user])

  useEffect(() => {
    async function loadData() {
      if (!resolvedConferenceId || !submissionId) {
        return
      }

      setLoading(true)

      const conferenceResponse = await getConferenceById(resolvedConferenceId)
      if (conferenceResponse.data) {
        setConference(conferenceResponse.data)
      }

      const submissionResponse = await getSubmissionById(resolvedConferenceId, submissionId)
      if (submissionResponse.data) {
        setSubmission(submissionResponse.data)
      }

      if (!conferenceResponse.data || !submissionResponse.data) {
        setNotFound(true)
      }

      setLoading(false)
    }

    if (resolvedConferenceId) {
      loadData()
    }
  }, [resolvedConferenceId, submissionId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !submission) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-lg text-center space-y-4 bg-white border rounded-xl p-8">
          <h1 className="text-2xl font-bold text-neutral-900">{t("runtime.app.role.author.submissions.submissionId.edit.page.text_submission_not_found")}</h1>
          <p className="text-neutral-600">
            {t("runtime.app.role.author.submissions.submissionId.edit.page.text_we_could_not_resolve_this_submission")}{" "}</p>
          <Button onClick={() => router.push(ROUTES.AUTHOR.SUBMISSIONS)}>
            {t("runtime.app.role.author.submissions.submissionId.edit.page.text_back_to_submissions")}{" "}</Button>
        </div>
      </main>
    )
  }

  return <PaperSubmissionForm conference={conference} submission={submission} />
}

export default function EditSubmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <EditSubmissionPageContent />
    </Suspense>
  )
}

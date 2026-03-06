"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PaperSubmissionForm } from "@/components/author/submit/paper-submission-form"
import { getConferenceById } from "@/lib/api/conferences"
import type { Conference } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"

function NewSubmissionPageContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const conferenceId = searchParams.get("conferenceId")

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(!!conferenceId)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConference() {
      if (!conferenceId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadError(null)
      const conferenceResponse = await getConferenceById(conferenceId)
      if (conferenceResponse.data) {
        setConference(conferenceResponse.data)
      } else {
        setLoadError(conferenceResponse.error || "Failed to load conference")
      }
      setLoading(false)
    }

    loadConference()
  }, [conferenceId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("runtime.app.role.author.submissions.new.page.text_failed_to_load_conference")}{" "}{loadError}
        </div>
      </div>
    )
  }

  if (conference && conference.status !== "open") {
    return (
      <div className="flex h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
          <h1 className="text-base font-semibold text-amber-900">{t("runtime.app.role.author.submissions.new.page.text_submissions_are_closed")}</h1>
          <p className="text-sm text-amber-800">
            {t("runtime.app.role.author.submissions.new.page.text_new_submissions_are_only_allowed_when")}{" "}<code>open</code>{t("runtime.app.role.author.submissions.new.page.text_current_status")}{" "}<code>{conference.status}</code>.
          </p>
        </div>
      </div>
    )
  }

  return <PaperSubmissionForm conference={conference} submission={null} />
}

export default function NewSubmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <NewSubmissionPageContent />
    </Suspense>
  )
}

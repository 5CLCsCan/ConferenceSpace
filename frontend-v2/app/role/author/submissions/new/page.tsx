"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PaperSubmissionForm } from "@/components/author/submit/paper-submission-form"
import { getConferenceById } from "@/lib/api/conferences"
import type { Conference } from "@/lib/types"
import { Loader2 } from "lucide-react"

function NewSubmissionPageContent() {
  const searchParams = useSearchParams()
  const conferenceId = searchParams.get("conferenceId")

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(!!conferenceId)

  useEffect(() => {
    async function loadConference() {
      if (!conferenceId) {
        setLoading(false)
        return
      }

      setLoading(true)
      const conferenceResponse = await getConferenceById(conferenceId)
      if (conferenceResponse.data) {
        setConference(conferenceResponse.data)
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

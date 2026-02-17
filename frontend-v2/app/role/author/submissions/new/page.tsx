"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PaperSubmissionForm } from "@/components/author/submit/paper-submission-form"
import { useAuth } from "@/lib/auth-context"
import { getConferenceById } from "@/lib/api/conferences"
import type { Conference } from "@/lib/types"
import { Loader2 } from "lucide-react"

function NewSubmissionPageContent() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const conferenceId = searchParams.get("conferenceId")

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(!!conferenceId)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

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

  if (!authChecked || !isAuthenticated || !user || loading) {
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

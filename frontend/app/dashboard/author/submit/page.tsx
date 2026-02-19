"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { PaperSubmissionForm } from "@/components/author/submit/paper-submission-form"
import { useAuth } from "@/lib/auth-context"
import { getConferenceById } from "@/lib/api/conferences"
import { getSubmissionById } from "@/lib/api/submissions"
import type { Conference } from "@/lib/types"
import type { Submission } from "@/lib/api/submissions"
import { Loader2 } from "lucide-react"

export default function SubmitPaperPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const conferenceId = searchParams.get("conference")
  const editSubmissionId = searchParams.get("edit")

  const [conference, setConference] = useState<Conference | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(!!conferenceId)
  const [authChecked, setAuthChecked] = useState(false)

  // Wait for auth to be checked before redirecting
  useEffect(() => {
    // Give auth context time to initialize from localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/login")
      return
    }
  }, [authChecked, isAuthenticated, router])

  useEffect(() => {
    async function loadData() {
      if (!conferenceId) {
        setLoading(false)
        return
      }

      setLoading(true)

      // Load conference
      const conferenceResponse = await getConferenceById(conferenceId)
      if (conferenceResponse.data) {
        setConference(conferenceResponse.data)
      }

      // Load submission if edit mode
      if (editSubmissionId) {
        const submissionResponse = await getSubmissionById(conferenceId, editSubmissionId)
        if (submissionResponse.data) {
          setSubmission(submissionResponse.data)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [conferenceId, editSubmissionId])

  // Show loading while checking auth or loading data
  if (!authChecked || !isAuthenticated || !user || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader role="author" />
      <main className="container mx-auto px-4 py-8">
        <PaperSubmissionForm conference={conference} submission={submission} />
      </main>
    </div>
  )
}

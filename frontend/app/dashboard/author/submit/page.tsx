"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { PaperSubmissionForm } from "@/components/author/submit/paper-submission-form"
import { useAuth } from "@/lib/auth-context"
import { getConferenceById } from "@/lib/api/conferences"
import type { Conference } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function SubmitPaperPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const conferenceId = searchParams.get("conference")

  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(!!conferenceId)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    async function loadConference() {
      if (!conferenceId) {
        setLoading(false)
        return
      }

      setLoading(true)
      const response = await getConferenceById(conferenceId)
      if (response.data) {
        setConference(response.data)
      }
      setLoading(false)
    }

    loadConference()
  }, [conferenceId])

  if (!isAuthenticated || !user) {
    return null
  }

  if (loading) {
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
        <PaperSubmissionForm conference={conference} />
      </main>
    </div>
  )
}

"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubmissionDetailView } from "@/components/author/submission-detail"
import { useAuth } from "@/lib/auth-context"
import { getSubmissionById } from "@/lib/api/submissions"
import { getConferenceById } from "@/lib/api/conferences"
import { resolveSubmissionConference } from "@/lib/submissions/resolve-submission-conference"
import type { Submission } from "@/lib/api/submissions"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"

function SubmissionDetailPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, user, currentRole } = useAuth()
  const { t } = useTranslation()
  const { unreadCount } = useNotifications({ limit: 1 })

  const submissionId = params.submissionId as string
  const conferenceIdQuery = searchParams.get("conferenceId")

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [conferenceName, setConferenceName] = useState<string>("")
  const [conferenceId, setConferenceId] = useState<string | null>(conferenceIdQuery)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authChecked) {
      return
    }

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (!user || !user.roles.includes("author") || currentRole !== "author") {
      router.push("/role")
    }
  }, [authChecked, currentRole, isAuthenticated, user, router])

  useEffect(() => {
    async function resolveConference() {
      if (!submissionId || !user?.email) {
        return
      }

      const resolution = await resolveSubmissionConference({
        submissionId,
        conferenceId: conferenceIdQuery,
        userEmail: user.email,
      })

      if (!resolution.conferenceId) {
        setError("Could not resolve conference context for this submission link")
        setLoading(false)
        return
      }

      setConferenceId(resolution.conferenceId)
    }

    if (authChecked && isAuthenticated && user) {
      resolveConference()
    }
  }, [authChecked, conferenceIdQuery, isAuthenticated, submissionId, user])

  useEffect(() => {
    async function loadSubmission() {
      if (!conferenceId || !submissionId) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await getSubmissionById(conferenceId, submissionId)
        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          if (!user?.roles.includes("author") || currentRole !== "author") {
            setError("You don't have permission to view this submission")
          } else {
            setSubmission(response.data)
          }
        }

        const confResponse = await getConferenceById(conferenceId)
        if (confResponse.data) {
          setConferenceName(confResponse.data.acronym || confResponse.data.name || "")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load submission")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user && conferenceId && submissionId) {
      loadSubmission()
    }
  }, [conferenceId, submissionId, currentRole, isAuthenticated, user])

  if (
    !authChecked ||
    !isAuthenticated ||
    !user ||
    !user.roles.includes("author") ||
    currentRole !== "author"
  ) {
    return null
  }

  const authorMenuItems = [
    { label: "Dashboard", href: "/role/author", icon: "dashboard" },
    { label: "My Submissions", href: "/role/author/submissions", icon: "description" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
  ]

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
        <DashboardSidebar menuItems={authorMenuItems} />
        <main className="flex-grow flex flex-col h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8 w-full max-w-7xl mx-auto">
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
        <DashboardSidebar menuItems={authorMenuItems} />
        <main className="flex-grow flex flex-col h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8 w-full max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-red-600 mb-2">
                    {t("dashboard.submission.error.title", { defaultValue: "Error" })}
                  </h2>
                  <p className="text-gray-600">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/role/author/submissions")}
                    className="mt-4"
                  >
                    {t("common.actions.back", { defaultValue: "Go Back" })}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!submission || !conferenceId) {
    return (
      <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
        <DashboardSidebar menuItems={authorMenuItems} />
        <main className="flex-grow flex flex-col h-screen overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8 w-full max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">
                    {t("dashboard.submission.notFound.title", { defaultValue: "Not Found" })}
                  </h2>
                  <p className="text-gray-600">
                    {t("dashboard.submission.notFound.message", {
                      defaultValue: "Submission does not exist",
                    })}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/role/author/submissions")}
                    className="mt-4"
                  >
                    Back To Submissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={authorMenuItems} />
      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <SubmissionDetailView
          submission={submission}
          conferenceId={conferenceId}
          conferenceName={conferenceName}
        />
      </main>
    </div>
  )
}

export default function SubmissionDetailPage() {
  return (
    <Suspense fallback={null}>
      <SubmissionDetailPageContent />
    </Suspense>
  )
}

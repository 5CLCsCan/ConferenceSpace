"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubmissionDetailView } from "@/components/author/submission-detail"
import { useAuth } from "@/lib/auth-context"
import { getSubmissionById } from "@/lib/api/submissions"
import { getConferenceById } from "@/lib/api/conferences"
import type { Submission } from "@/lib/api/submissions"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user, currentRole } = useAuth()
  const { t } = useTranslation()
  const { unreadCount } = useNotifications({ limit: 1 })
  const conferenceId = params.id as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [conferenceName, setConferenceName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Wait for auth to be checked before redirecting
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

    if (!user || (!user.roles.includes("author") && !user.roles.includes("chair"))) {
      router.push("/dashboard")
      return
    }
  }, [authChecked, isAuthenticated, user, router])

  useEffect(() => {
    async function loadSubmission() {
      if (!conferenceId || !submissionId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await getSubmissionById(conferenceId, submissionId)

        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          const isChair = user?.roles.includes("chair")
          const isAuthorRole = user?.roles.includes("author")

          if (!isAuthorRole && !isChair) {
            setError("You don't have permission to view this submission")
          } else {
            setSubmission(response.data)
          }
        }

        // Also fetch conference name
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
  }, [conferenceId, submissionId, isAuthenticated, user])

  if (!authChecked || !isAuthenticated || !user) {
    return null
  }

  const authorMenuItems = [
    { label: "Dashboard", href: "/dashboard/author", icon: "dashboard" },
    { label: "My Submissions", href: "/dashboard/author/submissions", icon: "description" },
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
                  <Button variant="outline" onClick={() => router.back()} className="mt-4">
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

  if (!submission) {
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
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8 w-full">
          <div className="max-w-7xl mx-auto">
            <SubmissionDetailView
              submission={submission}
              conferenceId={conferenceId}
              conferenceName={conferenceName}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { SubmissionDetailView } from "@/components/author/submission-detail-view"
import { useAuth } from "@/lib/auth-context"
import { getSubmissionById } from "@/lib/api/submissions"
import type { Submission } from "@/lib/api/submissions"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user, currentRole } = useAuth()
  const { t } = useTranslation()
  const conferenceId = params.id as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Check if user has appropriate role (author or chair)
    if (!user || (!user.roles.includes("author") && !user.roles.includes("chair"))) {
      router.push("/dashboard")
      return
    }
  }, [isAuthenticated, user, router])

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
          // Check if user has permission to view this submission
          // Authors can only view their own submissions
          // Chairs can view all submissions in their conference
          const isAuthor = user?.email === response.data.author
          const isChair = user?.roles.includes("chair")

          if (!isAuthor && !isChair) {
            setError("You don't have permission to view this submission")
          } else {
            setSubmission(response.data)
          }
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

  if (!isAuthenticated || !user) {
    return null
  }

  // Determine role for header
  const headerRole = currentRole === "chair" ? "chair" : "author"

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader role={headerRole} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader role={headerRole} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">
                  {t("dashboard.submission.error.title", "Lỗi")}
                </h2>
                <p className="text-gray-600">{error}</p>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">
                  {t("common.actions.back", "Quay lại")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader role={headerRole} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">
                  {t("dashboard.submission.notFound.title", "Không tìm thấy")}
                </h2>
                <p className="text-gray-600">
                  {t("dashboard.submission.notFound.message", "Bài nộp không tồn tại")}
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role={headerRole} />
      <main className="container mx-auto px-4 py-8">
        <SubmissionDetailView submission={submission} conferenceId={conferenceId} />
      </main>
    </div>
  )
}

"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { PaperReview } from "@/components/reviewer/paper-review"
import { notFound, useSearchParams, useRouter } from "next/navigation"
import { use, useEffect, useState, Suspense } from "react"
import { getPaperById } from "@/lib/api/papers"
import type { Paper } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { useAuth } from "@/lib/auth-context"

function PaperContent({ id }: { id: string }) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [paper, setPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPaper() {
      try {
        setLoading(true)
        setError(null)

        // Get conference_id from URL query params
        const conferenceId = searchParams.get("conference_id")

        if (!conferenceId) {
          setError(t("dashboard.roles.reviewer.review.errors.conferenceIdRequired"))
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await getPaperById(id, conferenceId)

        if (fetchError || !data) {
          setError(fetchError || t("dashboard.roles.reviewer.review.errors.fetchPaperFailed"))
          setLoading(false)
          return
        }

        setPaper(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("dashboard.roles.reviewer.review.errors.unknownError"),
        )
      } finally {
        setLoading(false)
      }
    }

    fetchPaper()
  }, [id, searchParams, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("dashboard.roles.reviewer.review.loadingPaper")}</p>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive mb-4">
          {error || t("dashboard.roles.reviewer.review.errors.paperNotFound")}
        </p>
        <button
          onClick={() => window.history.back()}
          className="text-sm text-primary hover:underline"
        >
          {t("common.actions.goBack")}
        </button>
      </div>
    )
  }

  return <PaperReview paper={paper} onBack={() => window.history.back()} />
}

export default function ReviewPaperPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
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
    if (!authChecked) {
      return
    }

    if (!isAuthenticated) {
      router.push("/login")
    } else if (user && !user.roles.includes("reviewer")) {
      router.push("/dashboard")
    }
  }, [authChecked, isAuthenticated, user, router])

  if (!authChecked || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role="reviewer" />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          }
        >
          <PaperContent id={resolvedParams.id} />
        </Suspense>
      </main>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { PaperReview } from "@/components/reviewer/paper-review"
import { getAssignmentReview } from "@/lib/api/reviews"
import { getPaperById } from "@/lib/api/papers"
import type { AssignmentReview } from "@/lib/api/reviews"
import type { Paper } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function ReviewDetailPage() {
  const router = useRouter()
  const params = useParams() as { id: string; reviewId: string }
  const { user, currentRole } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState<AssignmentReview | null>(null)
  const [paper, setPaper] = useState<Paper | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        // Fetch review data by assignmentId
        const reviewResponse = await getAssignmentReview(params.id, params.reviewId)
        if (reviewResponse.error || !reviewResponse.data) {
          setError(reviewResponse.error || "Review not found")
          setLoading(false)
          return
        }
        setReview(reviewResponse.data)
        // Fetch the submission (paper) details using the submission_id from the review
        const paperResponse = await getPaperById(
          reviewResponse.data.submission_id.toString(),
          params.id,
        )
        if (paperResponse.error || !paperResponse.data) {
          setError(paperResponse.error || "Paper not found")
          setLoading(false)
          return
        }
        setPaper(paperResponse.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load review")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id, params.reviewId])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader role={currentRole as "author" | "reviewer" | "chair"} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex h-64 items-center justify-center flex-col gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t("common.actions.loading")}</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !review || !paper) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <DashboardHeader role={currentRole as "author" | "reviewer" | "chair"} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-destructive font-medium">
                  {error || t("common.messages.notFound")}
                </p>
                <button onClick={() => router.back()} className="text-primary hover:underline">
                  {t("common.actions.goBack")}
                </button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Merge review data into the paper object for PaperReview
  const paperWithReview = {
    ...paper,
    review_status: review.review_status,
    review_score: review.review_score,
    review_data: review.review_data,
    review_submitted_at: review.review_submitted_at,
    id: review.id.toString(),
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role={currentRole as "author" | "reviewer" | "chair"} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto py-8">
          <PaperReview paper={paperWithReview as any} onBack={() => router.back()} readOnly />
        </div>
      </main>
    </div>
  )
}

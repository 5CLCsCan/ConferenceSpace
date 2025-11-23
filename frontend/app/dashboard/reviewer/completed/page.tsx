"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { CompletedReviews } from "@/components/reviewer/completed-reviews"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CompletedReviewsPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role="reviewer" />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/reviewer")}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("common.actions.goBack")}
          </Button>
        </div>
        <Suspense fallback={<div>{t("common.messages.loading")}</div>}>
          <CompletedReviews />
        </Suspense>
      </main>
    </div>
  )
}

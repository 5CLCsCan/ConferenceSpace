"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ReviewerDashboard } from "@/components/reviewer/reviewer-dashboard"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function ReviewerPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
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
    }
    // Note: Removed role check - users can select any role from dashboard
    // The roles array represents backend-assigned roles, currentRole is the selected dashboard view
  }, [authChecked, isAuthenticated, router])

  if (!authChecked || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role="reviewer" />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>{t("common.messages.loading")}</div>}>
          <ReviewerDashboard />
        </Suspense>
      </main>
    </div>
  )
}

"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ReviewerDashboard } from "@/components/reviewer/reviewer-dashboard"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"

export default function ReviewerPage() {
  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const { t } = useTranslation()
  const [authChecked, setAuthChecked] = useState(false)

  // Wait for auth to be checked before redirecting
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

  if (!authChecked || !isAuthenticated || !user) {
    return null
  }

  const reviewerMenuItems = [
    { label: "Dashboard", href: "/dashboard/reviewer", icon: "grid_view" },
    { label: "Conferences", href: "/dashboard/reviewer?tab=conferences", icon: "calendar_month" },
    { label: "Reviews", href: "/dashboard/reviewer?tab=overview", icon: "rate_review" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
  ]

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={reviewerMenuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-16 py-8 md:py-12 w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400">
                Loading Reviewer Dashboard...
              </div>
            }
          >
            <ReviewerDashboard />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

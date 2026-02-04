"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ChairDashboard from "@/components/chair/chair-dashboard"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"

export default function ChairPage() {
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

  const chairMenuItems = [
    { label: "Conferences", href: "/dashboard/conference", icon: "folder_open" },
    { label: "Schedules", href: "/dashboard/chair/schedules", icon: "calendar_month" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
    { label: "Dashboard", href: "/dashboard/chair", icon: "dashboard" },
  ]

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={chairMenuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-12 py-8 md:py-8 w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400">
                Loading Chair Dashboard...
              </div>
            }
          >
            <ChairDashboard />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

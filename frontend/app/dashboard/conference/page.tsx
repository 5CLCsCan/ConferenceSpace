"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthorConferences } from "@/components/conference/author-conferences"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"

export default function ConferencesPage() {
  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  // Wait for auth to be checked before redirecting
  useEffect(() => {
    const timer = setTimeout(() => setAuthChecked(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

  if (!authChecked || !isAuthenticated || !user) {
    return null
  }

  const menuItems = [
    { label: "Dashboard", href: "/role", icon: "dashboard" },
    { label: "Conferences", href: "/dashboard/conference", icon: "folder_open" },
    { label: "Schedules", href: "/dashboard/schedules", icon: "calendar_month" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
  ]

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={menuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 md:py-8 w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400">
                Loading Conferences...
              </div>
            }
          >
            <AuthorConferences />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

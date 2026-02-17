"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthorConferenceDetail } from "@/components/author/author-conference-detail"
import { useAuth } from "@/lib/auth-context"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"

export default function AuthorConferenceDetailPage() {
  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const router = useRouter()
  const params = useParams()
  const [authChecked, setAuthChecked] = useState(false)

  const conferenceId = params?.conferenceId as string

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
    }
  }, [authChecked, isAuthenticated, router])

  if (!authChecked || !isAuthenticated || !user || !conferenceId) {
    return null
  }

  const authorMenuItems = [
    { label: "Dashboard", href: "/role/author", icon: "dashboard" },
    { label: "My Submissions", href: "/role/author/submissions", icon: "description" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
  ]

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={authorMenuItems} />

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen w-full text-slate-400">
            Loading Conference Details...
          </div>
        }
      >
        <AuthorConferenceDetail conferenceId={conferenceId} />
      </Suspense>
    </div>
  )
}

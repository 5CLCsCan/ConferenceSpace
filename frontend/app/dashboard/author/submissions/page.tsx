"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthorSubmissionsList } from "@/components/author/author-submissions-list"
import { useAuth } from "@/lib/auth-context"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"

export default function AuthorSubmissionsPage() {
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

  const authorMenuItems = [
    { label: "Dashboard", href: "/dashboard/author", icon: "dashboard" },
    { label: "My Submissions", href: "/dashboard/author/submissions", icon: "description" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
  ]

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={authorMenuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 md:py-8 w-full">
          {/* Header Section - Scholar-Compact */}
          <div className="flex flex-col">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
                  My Submissions
                </h1>
                <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                  Track and manage all your research papers across conferences.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
                Loading...
              </div>
            }
          >
            <AuthorSubmissionsList />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

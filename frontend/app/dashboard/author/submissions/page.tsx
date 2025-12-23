"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthorSubmissionsList } from "@/components/author/author-submissions-list"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"

export default function AuthorSubmissionsPage() {
  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const { t } = useTranslation()
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
        <div className="flex-1 overflow-y-auto px-10 md:px-16 py-8 md:py-12 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-2">
            <div className="flex flex-col gap-2">
              <h1 className="text-[#141414] dark:text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
                My Submissions
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-normal">
                Track and manage all your research papers and conference proposals.
              </p>
            </div>
            <button className="flex items-center gap-2 h-11 px-6 bg-[#141414] hover:bg-[#252525] text-white text-sm font-bold rounded-lg transition-all shadow-sm whitespace-nowrap group">
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">
                add
              </span>
              New Submission
            </button>
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12 text-slate-400">
                Loading Submissions...
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

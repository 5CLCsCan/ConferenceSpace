"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthorSubmissionsList } from "@/components/author/author-submissions-list"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function AuthorSubmissionsPage() {
  const { isAuthenticated, user } = useAuth()
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

    console.log("[AuthorSubmissionsPage] Auth check", {
      isAuthenticated,
      user: user?.email,
      roles: user?.roles,
    })
    if (!isAuthenticated) {
      router.push("/login")
    } else if (user && !user.roles.includes("author")) {
      router.push("/dashboard")
    }
  }, [authChecked, isAuthenticated, user, router])

  if (!authChecked || !isAuthenticated || !user) {
    console.log("[AuthorSubmissionsPage] Not authenticated or no user, returning null")
    return null
  }

  console.log("[AuthorSubmissionsPage] Rendering page with user:", user.email)

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role="author" />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("dashboard.submissions.pageTitle")}
          </h1>
          <p className="text-gray-600">{t("dashboard.submissions.pageDescription")}</p>
        </div>
        <Suspense fallback={<div>{t("dashboard.submissions.loading")}</div>}>
          <AuthorSubmissionsList />
        </Suspense>
      </main>
    </div>
  )
}

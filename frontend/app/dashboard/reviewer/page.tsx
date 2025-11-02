"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ReviewerDashboard } from "@/components/reviewer/reviewer-dashboard"
import { DashboardHeader } from "@/components/dashboard-header"
import { useAuth } from "@/lib/auth-context"

export default function ReviewerPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/login")
  //   } else if (user && !user.roles.includes("reviewer")) {
  //     router.push("/dashboard")
  //   }
  // }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader role="reviewer" />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ReviewerDashboard />
        </Suspense>
      </main>
    </div>
  )
}

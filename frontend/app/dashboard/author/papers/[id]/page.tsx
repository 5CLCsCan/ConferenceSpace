"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { PaperDetailView } from "@/components/author/paper-detail-view"
import { mockPapers } from "@/lib/mock-data"
import { notFound, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function PaperDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const paper = mockPapers.find((p) => p.id === params.id)

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
    } else if (user && !user.roles.includes("author")) {
      router.push("/dashboard")
    }
  }, [authChecked, isAuthenticated, user, router])

  if (!authChecked || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!paper) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role="author" />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <PaperDetailView paper={paper} />
      </main>
    </div>
  )
}

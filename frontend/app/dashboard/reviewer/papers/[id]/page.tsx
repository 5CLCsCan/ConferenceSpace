"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { PaperReview } from "@/components/reviewer/paper-review"
import { mockPapers } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { use } from "react"

export default function ReviewPaperPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params) // Mở params bằng React.use()
  const paper = mockPapers.find((p) => p.id === resolvedParams.id) // Sử dụng resolvedParams.id

  if (!paper) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role="reviewer" />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <PaperReview paper={paper!} onBack={() => window.history.back()} />
      </main>
    </div>
  )
}

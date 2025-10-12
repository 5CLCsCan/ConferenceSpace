import { DashboardHeader } from "@/components/dashboard-header"
import { ReviewForm } from "@/components/reviewer/review-form"
import { mockPapers } from "@/lib/mock-data"
import { notFound } from "next/navigation"

export default function ReviewPaperPage({ params }: { params: { id: string } }) {
  const paper = mockPapers.find((p) => p.id === params.id)

  if (!paper) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role="reviewer" />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <ReviewForm paper={paper} />
      </main>
    </div>
  )
}

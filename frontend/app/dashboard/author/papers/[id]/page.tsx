import { DashboardHeader } from "@/components/dashboard-header"
import { PaperDetailView } from "@/components/author/paper-detail-view"
import { mockPapers } from "@/lib/mock-data"
import { notFound } from "next/navigation"

export default function PaperDetailPage({ params }: { params: { id: string } }) {
  const paper = mockPapers.find((p) => p.id === params.id)

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

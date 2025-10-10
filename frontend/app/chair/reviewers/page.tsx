import { DashboardHeader } from "@/components/dashboard-header"
import { ReviewerAssignment } from "@/components/chair/reviewer-assignment"

export default function ReviewersPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role="chair" />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reviewer Assignment</h1>
          <p className="text-muted-foreground">Use AI-powered matching to assign the best reviewers to each paper</p>
        </div>
        <ReviewerAssignment />
      </main>
    </div>
  )
}

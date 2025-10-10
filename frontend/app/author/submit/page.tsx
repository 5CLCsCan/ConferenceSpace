import { DashboardHeader } from "@/components/dashboard-header"
import { PaperSubmissionForm } from "@/components/author/paper-submission-form"

export default function SubmitPaperPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader role="author" />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit New Paper</h1>
          <p className="text-muted-foreground">
            Fill in the details below to submit your paper. Our AI will provide recommendations to help you make the
            best choices.
          </p>
        </div>
        <PaperSubmissionForm />
      </main>
    </div>
  )
}

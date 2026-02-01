"use client"

import { Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { SubmissionReviewScreen } from "@/components/reviewer/submission-review"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { Loader2 } from "lucide-react"

/**
 * Submission Review Page for Reviewers
 * Route: /dashboard/conference/[id]/reviewer/submissions/[paperId]
 *
 * Accessed when a reviewer selects a paper to review from the assigned papers list
 */
export default function SubmissionReviewPage() {
  const params = useParams() as { id: string; paperId: string }
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })

  // Auth guard
  if (!isAuthenticated || !user) {
    router.push("/login")
    return null
  }

  const conferenceId = params.id
  const paperId = params.paperId

  const handleBack = () => {
    router.push(`/dashboard/conference/${conferenceId}/reviewer/assigned`)
  }

  const reviewerMenuItems = [
    { label: "Dashboard", href: "/dashboard/reviewer", icon: "grid_view" },
    { label: "Conferences", href: "/dashboard/reviewer?tab=conferences", icon: "calendar_month" },
    { label: "Invitations", href: "/dashboard/reviewer?tab=invitations", icon: "mail" },
    { label: "Notifications", href: "/notifications", icon: "notifications", badge: unreadCount },
  ]

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={reviewerMenuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full gap-3 text-slate-400">
                <Loader2 className="size-5 animate-spin" />
                Loading Review Form...
              </div>
            }
          >
            <SubmissionReviewScreen
              conferenceId={conferenceId}
              paperId={paperId}
              onBack={handleBack}
            />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

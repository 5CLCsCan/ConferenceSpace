"use client"

import { Suspense } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"
import { ReviewerDashboard } from "@/components/reviewer/reviewer-dashboard"
import { getSidebarMenuItems } from "@/lib/navigation"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function ReviewerPage() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifications({ limit: 1 })

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("reviewer", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto py-8 px-12 w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400">
                {t("runtime.app.role.reviewer.page.text_loading")}{" "}
              </div>
            }
          >
            <ReviewerDashboard />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

"use client"

import { Suspense } from "react"
import ChairDashboard from "@/components/chair/chair-dashboard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useNotifications } from "@/hooks/use-notifications"
import { getSidebarMenuItems } from "@/lib/navigation"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function ChairPage() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifications({ limit: 1 })

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("chair", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-12 py-8 md:py-8 w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400">
                {t("runtime.app.role.chair.page.text_loading_chair_dashboard")}{" "}</div>
            }
          >
            <ChairDashboard />
          </Suspense>
        </div>
      </main>
    </div>
  )
}


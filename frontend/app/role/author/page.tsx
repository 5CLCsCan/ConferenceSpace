"use client"

import { Suspense } from "react"
import { AuthorConferences } from "@/components/author/author-conferences"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { getSidebarMenuItems } from "@/lib/navigation"
import { useNotifications } from "@/hooks/use-notifications"
import { useTranslation } from "@/lib/i18n/translation-context"

export default function AuthorPage() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifications({ limit: 1 })

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getSidebarMenuItems("author", unreadCount)} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-6 md:py-8 w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-400">
                {t("runtime.app.role.author.page.text_loading_conferences")}{" "}
              </div>
            }
          >
            <AuthorConferences />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

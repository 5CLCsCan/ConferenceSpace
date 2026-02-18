"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import {
  CheckCircle2,
  Settings2,
  Bell,
  MessageSquare,
  FileText,
  AlertCircle,
  History,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationCard } from "@/components/notifications/notification-card"
import { TabButton, FilterPill } from "@/components/notifications/notification-controls"
import { EmptyState } from "@/components/notifications/empty-state"
import { MOCK_NOTIFICATIONS } from "@/lib/mock/notifications"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const { currentRole } = useAuth()
  const { unreadCount: apiUnreadCount } = useNotifications({ limit: 1 })
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions">("all")
  const [activeFilter, setActiveFilter] = useState("all")

  // [INFO] Using mock data for UI verification of the Scholar-Compact aesthetic
  const notifications = MOCK_NOTIFICATIONS

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const filteredNotifications = notifications.filter((n) => {
    const tabMatch =
      activeTab === "unread" ? !n.isRead : activeTab === "mentions" ? n.type === "mention" : true

    const filterMatch =
      activeFilter === "all"
        ? true
        : activeFilter === "deadline"
          ? n.type === "deadline"
          : activeFilter === "review"
            ? n.type === "review"
            : activeFilter === "submission"
              ? n.type === "success" // Mapping success to submission for mock
              : true

    return tabMatch && filterMatch
  })

  const getMenuItems = () => {
    if (currentRole === "author") {
      return [
        { label: "Dashboard", href: "/role/author", icon: "dashboard" },
        { label: "My Submissions", href: "/role/author/submissions", icon: "description" },
        {
          label: "Notifications",
          href: "/notifications",
          icon: "notifications",
          badge: apiUnreadCount,
        },
      ]
    }

    if (currentRole === "chair") {
      return [
        { label: "Dashboard", href: "/role/chair", icon: "dashboard" },
        { label: "Conferences", href: "/role/chair/conferences", icon: "folder_open" },
        { label: "Schedules", href: "/role/chair/schedules", icon: "calendar_month" },
        {
          label: "Notifications",
          href: "/notifications",
          icon: "notifications",
          badge: apiUnreadCount,
        },
      ]
    }

    if (currentRole === "reviewer") {
      return [
        { label: "Dashboard", href: "/role/reviewer", icon: "dashboard" },
        {
          label: "Notifications",
          href: "/notifications",
          icon: "notifications",
          badge: apiUnreadCount,
        },
      ]
    }

    // Default fallback
    return [
      { label: "Role Selection", href: "/role", icon: "dashboard" },
      {
        label: "Notifications",
        href: "/notifications",
        icon: "notifications",
        badge: apiUnreadCount,
      },
    ]
  }

  return (
    <div className="text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={getMenuItems()} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-12 py-8 w-full relative">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
                Notifications
              </h1>
              <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                Stay updated on your submissions, reviews, and deadlines with real-time academic
                alerts.
              </p>
            </div>

            <div className="absolute top-8 right-12 flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm">
                Mark all as read
              </button>
              <button className="p-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm">
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filters & Tabs */}
          <div className="flex flex-col gap-0 mb-4">
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex gap-6">
                <TabButton
                  label="All"
                  active={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
                  badge={notifications.length}
                />
                <TabButton
                  label="Unread"
                  active={activeTab === "unread"}
                  onClick={() => setActiveTab("unread")}
                  badge={unreadCount}
                  badgeActiveBg="bg-blue-600"
                />
                <TabButton
                  label="Mentions"
                  active={activeTab === "mentions"}
                  onClick={() => setActiveTab("mentions")}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <FilterPill
                label="All Types"
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <FilterPill
                label="Deadlines"
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                active={activeFilter === "deadline"}
                onClick={() => setActiveFilter("deadline")}
              />
              <FilterPill
                label="Submissions"
                icon={<FileText className="w-3.5 h-3.5" />}
                active={activeFilter === "submission"}
                onClick={() => setActiveFilter("submission")}
              />
              <FilterPill
                label="Reviews"
                icon={<History className="w-3.5 h-3.5" />}
                active={activeFilter === "review"}
                onClick={() => setActiveFilter("review")}
              />
            </div>
          </div>

          {/* Notification List */}
          <div className="flex flex-col gap-4 pb-20">
            {filteredNotifications.length > 0 ? (
              <>
                <SectionLabel label="Today" />
                {filteredNotifications
                  .filter((n) => !n.time.includes("Yesterday") && !n.time.includes("day ago"))
                  .map((n) => (
                    <NotificationCard key={n.id} notification={n} />
                  ))}

                <SectionLabel label="Earlier" />
                {filteredNotifications
                  .filter((n) => n.time.includes("Yesterday") || n.time.includes("day ago"))
                  .map((n) => (
                    <NotificationCard key={n.id} notification={n} />
                  ))}
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionLabel({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-2", className)}>
      <div className="h-[1px] bg-slate-100 dark:bg-neutral-800/50 flex-1"></div>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
        {label}
      </span>
      <div className="h-[1px] bg-slate-100 dark:bg-neutral-800/50 flex-1"></div>
    </div>
  )
}

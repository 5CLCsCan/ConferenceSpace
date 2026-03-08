"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Settings2, FileText, AlertCircle, History } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationCard, type Notification as CardNotification } from "@/components/notifications/notification-card"
import { TabButton, FilterPill } from "@/components/notifications/notification-controls"
import { EmptyState } from "@/components/notifications/empty-state"
import type { Notification } from "@/lib/types"
import { resolveNotificationActionUrl } from "@/lib/notifications/resolve-action-url"
import { cn } from "@/lib/utils"
import { getSidebarMenuItems } from "@/lib/navigation"
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/api/notifications"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

function notificationKind(type: Notification["type"]): CardNotification["type"] {
  if (type === "deadline_reminder") return "deadline"
  if (type === "review_assigned" || type === "review_submitted") return "review"
  if (type === "discussion_thread" || type === "discussion_message") return "mention"
  if (type === "submission_received" || type === "paper_accepted") return "success"
  return "system"
}

function actionLabelForType(type: Notification["type"]): string {
  if (type === "deadline_reminder") return "View Deadline"
  if (type === "review_assigned" || type === "review_submitted") return "Open Review"
  if (type === "discussion_thread" || type === "discussion_message") return "Open Discussion"
  if (type === "paper_accepted" || type === "paper_rejected") return "View Decision"
  return "Open"
}

function metadataToString(metadata?: Record<string, unknown>): string | undefined {
  if (!metadata) return undefined

  const preferred = ["conference_name", "submission_title", "paper_title", "thread_title"]
    .map((key) => metadata[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0)

  if (preferred.length > 0) {
    return preferred.join(" • ")
  }

  const keys = Object.keys(metadata)
  if (keys.length === 0) return undefined
  return keys
    .slice(0, 2)
    .map((key) => `${key}: ${String(metadata[key])}`)
    .join(" • ")
}

function mapNotification(notification: Notification): CardNotification {
  const actionHref = resolveNotificationActionUrl(notification.action_url)

  return {
    id: String(notification.id),
    type: notificationKind(notification.type),
    title: notification.title,
    content: notification.message,
    time: formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }),
    isRead: notification.read,
    actionLabel: actionHref ? actionLabelForType(notification.type) : undefined,
    actionHref: actionHref || undefined,
    meta: metadataToString(notification.metadata),
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { currentRole } = useAuth()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
    error,
  } = useNotifications({ limit: 100 })

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions">("all")
  const [activeFilter, setActiveFilter] = useState("all")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)

  const cardNotifications = useMemo(() => notifications.map(mapNotification), [notifications])

  const filteredNotifications = useMemo(() => {
    return cardNotifications.filter((n) => {
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
                ? n.type === "success"
                : true

      return tabMatch && filterMatch
    })
  }, [activeFilter, activeTab, cardNotifications])

  const handleMarkAsRead = async (id: string) => {
    const numericId = Number(id)
    if (Number.isFinite(numericId)) {
      await markAsRead(numericId)
    }
  }

  const handleAction = async (href?: string, id?: string) => {
    if (id) {
      await handleMarkAsRead(id)
    }
    if (!href) return

    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer")
      return
    }

    router.push(href)
  }

  const menuItems = getSidebarMenuItems(currentRole, unreadCount)

  useEffect(() => {
    if (!settingsOpen) {
      return
    }

    setSettingsLoading(true)
    void getNotificationPreferences()
      .then((prefs) => {
        setNotificationPrefs(prefs)
      })
      .catch(() => undefined)
      .finally(() => setSettingsLoading(false))
  }, [settingsOpen])

  const preferenceRows: Array<{ key: keyof NotificationPreferences; label: string }> = [
    { key: "submission_received", label: "Submission Received" },
    { key: "review_assigned", label: "Review Assigned" },
    { key: "review_submitted", label: "Review Submitted" },
    { key: "paper_accepted", label: "Paper Accepted" },
    { key: "paper_rejected", label: "Paper Rejected" },
    { key: "deadline_reminder", label: "Deadline Reminder" },
    { key: "status_change", label: "Status Change" },
    { key: "email_notifications", label: "Email Notifications" },
  ]

  return (
    <div className="text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <DashboardSidebar menuItems={menuItems} />

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-10 md:px-12 py-8 w-full relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
            <div>
              <h1 className="text-[32px] font-bold tracking-tight text-[#1B3C53] dark:text-white leading-none">
                Notifications
              </h1>
              <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                Stay updated on submissions, reviews, deadlines, and discussion activity.
              </p>
            </div>

            <div className="absolute top-8 right-12 flex items-center gap-2">
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
              >
                Mark all as read
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-0 mb-4">
            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex gap-6">
                <TabButton
                  label="All"
                  active={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
                  badge={cardNotifications.length}
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

          <div className="flex flex-col gap-4 pb-20">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading notifications...</div>
            ) : error ? (
              <div className="text-sm text-red-600">Failed to load notifications: {error.message}</div>
            ) : filteredNotifications.length > 0 ? (
              <>
                <SectionLabel label="Latest" />
                {filteredNotifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onMarkAsRead={handleMarkAsRead}
                    onAction={handleAction}
                  />
                ))}
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
          </DialogHeader>
          {settingsLoading ? (
            <p className="text-sm text-slate-500">Loading settings...</p>
          ) : (
            <div className="space-y-3">
              {preferenceRows.map((row) => {
                if (!notificationPrefs) return null
                const checked = Boolean(notificationPrefs[row.key])
                return (
                  <div key={row.key} className="flex items-center justify-between gap-3">
                    <span className="text-sm">{row.label}</span>
                    <Switch
                      checked={checked}
                      onCheckedChange={(next) => {
                        const optimistic = { ...notificationPrefs, [row.key]: next }
                        setNotificationPrefs(optimistic)
                        void updateNotificationPreferences({ [row.key]: next }).catch(() => {
                          setNotificationPrefs(notificationPrefs)
                        })
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionLabel({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-2", className)}>
      <div className="h-[1px] bg-slate-100 dark:bg-neutral-800/50 flex-1"></div>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      <div className="h-[1px] bg-slate-100 dark:bg-neutral-800/50 flex-1"></div>
    </div>
  )
}

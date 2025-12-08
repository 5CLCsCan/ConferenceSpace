"use client"

import { useState, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { NotificationList } from "@/components/notifications/notification-list"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import type { NotificationType } from "@/lib/types"

const NOTIFICATION_TYPES: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All notifications" },
  { value: "submission_received", label: "New submissions" },
  { value: "review_assigned", label: "Review assignments" },
  { value: "review_submitted", label: "Submitted reviews" },
  { value: "paper_accepted", label: "Paper accepted" },
  { value: "paper_rejected", label: "Paper rejected" },
  { value: "deadline_reminder", label: "Deadline reminders" },
  { value: "status_change", label: "Status changes" },
]

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all")
  const [offset, setOffset] = useState(0)

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    total,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    limit: PAGE_SIZE,
    autoConnect: true,
  })

  const handleTypeChange = useCallback(
    (value: string) => {
      setTypeFilter(value as NotificationType | "all")
      setOffset(0)
      fetchNotifications({
        limit: PAGE_SIZE,
        offset: 0,
        type: value === "all" ? undefined : value,
      })
    },
    [fetchNotifications],
  )

  const handleLoadMore = useCallback(() => {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchNotifications({
      limit: PAGE_SIZE,
      offset: newOffset,
      type: typeFilter === "all" ? undefined : typeFilter,
    })
  }, [offset, typeFilter, fetchNotifications])

  const hasMore = notifications.length < total

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader role="author" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">Filter:</span>
          </div>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-48 h-9 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notification List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            error={error}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            showHeader={true}
            showMarkAllAsRead={true}
            emptyMessage={
              typeFilter === "all"
                ? "No notifications yet"
                : `No ${NOTIFICATION_TYPES.find((t) => t.value === typeFilter)?.label.toLowerCase()} notifications`
            }
          />
        </div>

        {/* Stats */}
        {total > 0 && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Showing {notifications.length} of {total} notifications
          </p>
        )}
      </main>
    </div>
  )
}


"use client"

import { Bell, CheckCheck, Loader2 } from "lucide-react"
import type { Notification } from "@/lib/types"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NotificationListProps {
  notifications: Notification[]
  isLoading?: boolean
  error?: Error | null
  onMarkAsRead?: (id: number) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: number) => void
  onLoadMore?: () => void
  hasMore?: boolean
  showHeader?: boolean
  showMarkAllAsRead?: boolean
  compact?: boolean
  className?: string
  emptyMessage?: string
}

export function NotificationList({
  notifications,
  isLoading = false,
  error = null,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
  hasMore = false,
  showHeader = true,
  showMarkAllAsRead = true,
  compact = false,
  className,
  emptyMessage = "No notifications yet",
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  if (error) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">Failed to load notifications</p>
          <p className="text-slate-400 text-xs mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {showMarkAllAsRead && unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-700"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
      )}

      {isLoading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
          <p className="text-slate-400 text-xs mt-1">
            You&apos;ll see notifications about submissions, reviews, and more here.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                compact={compact}
              />
            ))}
          </div>

          {hasMore && onLoadMore && (
            <div className="px-4 py-3 border-t border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-blue-600 hover:text-blue-700"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}


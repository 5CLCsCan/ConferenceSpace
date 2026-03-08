"use client"

import { Bell, CheckCheck, Loader2 } from "lucide-react"
import type { Notification } from "@/lib/types"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n/translation-context"

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
  const { t } = useTranslation()
  const unreadCount = notifications.filter((n) => !n.read).length

  if (error) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-center py-8">
          <p className="text-destructive text-sm">
            {t(
              "runtime.components.notifications.notification-list.text_failed_to_load_notifications",
            )}
          </p>
          <p className="text-muted-foreground text-xs mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              {t("runtime.components.notifications.notification-list.text_notifications")}
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {showMarkAllAsRead && unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              {t("runtime.components.notifications.notification-list.text_mark_all_as_read")}{" "}
            </Button>
          )}
        </div>
      )}

      {isLoading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          <p className="text-muted-foreground text-xs mt-1">
            {t(
              "runtime.components.notifications.notification-list.text_you_apos_ll_see_notifications_about",
            )}{" "}
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
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
            <div className="px-4 py-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:text-primary"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("runtime.components.notifications.notification-list.text_load_more")}{" "}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, GraduationCap, User, LogOut, Home, CheckCheck, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { typography, spacing, iconSizes } from "@/lib/typography"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationItem } from "@/components/notifications/notification-item"
import { ROUTES } from "@/lib/routes"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications({
    limit: 5,
  })

  const handleLogout = () => {
    logout()
    router.push(ROUTES.HOME)
  }

  const handleSwitchRole = () => {
    router.push(ROUTES.ROLE_SELECT)
  }

  if (!user) return null

  return (
    <header className="border-b border-neutral-200 bg-white shadow-sm sticky top-0 z-50 h-[7vh]">
      <div className="w-full px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div
                className="rounded-lg bg-primary flex items-center justify-center"
                style={{ width: "calc(7vh * 0.6)", height: "calc(7vh * 0.6)" }}
              >
                <GraduationCap
                  className="text-white"
                  style={{ width: "calc(7vh * 0.6 * 0.6)", height: "calc(7vh * 0.6 * 0.6)" }}
                />
              </div>
              <span
                className="font-bold text-neutral-900 leading-none"
                style={{ fontSize: "calc(7vh * 0.6 * 0.4)" }}
              >
                {t("app.name")}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div style={{ fontSize: "calc(7vh * 0.6 * 0.35)" }}>
              <LanguageSwitcher />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-neutral-100 bg-transparent"
                  style={{ width: "calc(7vh * 0.6)", height: "calc(7vh * 0.6)" }}
                >
                  <Bell
                    className="text-neutral-700"
                    style={{ width: "calc(7vh * 0.6 * 0.6)", height: "calc(7vh * 0.6 * 0.6)" }}
                  />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-medium"
                      style={{
                        width: "18px",
                        height: "18px",
                        fontSize: "11px",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 bg-white border-neutral-200 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                  <span className={`${typography.semibold} text-neutral-900`}>
                    {t("dashboard.header.notifications.title")}
                  </span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary/80 h-auto py-1 px-2"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        markAllAsRead()
                      }}
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      {t("runtime.components.dashboard-header.text_mark_all_read")}{" "}
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="h-8 w-8 text-neutral-300 mb-2" />
                      <p className="text-sm text-neutral-500">
                        {t("runtime.components.dashboard-header.text_no_notifications_yet")}
                      </p>
                    </div>
                  ) : (
                    notifications
                      .slice(0, 5)
                      .map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          compact
                        />
                      ))
                  )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem
                  className={`text-center ${typography.body} text-primary ${typography.medium} cursor-pointer justify-center py-3`}
                  onClick={() => router.push(ROUTES.NOTIFICATIONS)}
                >
                  {t("dashboard.header.notifications.seeAll")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-neutral-100 bg-transparent"
                  style={{ width: "calc(7vh * 0.6)", height: "calc(7vh * 0.6)" }}
                >
                  <User
                    className="text-neutral-700"
                    style={{ width: "calc(7vh * 0.6 * 0.6)", height: "calc(7vh * 0.6 * 0.6)" }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-neutral-200">
                <DropdownMenuLabel>
                  <div className={`flex flex-col ${spacing.tight}`}>
                    <div className={`${typography.semibold} text-neutral-900`}>{user.name}</div>
                    <div
                      className={`${typography.bodySmall} text-neutral-600 ${typography.normal}`}
                    >
                      {user.email}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleSwitchRole}>
                  <Home className={`${iconSizes.sm} mr-2`} />
                  {t("dashboard.header.profile.switchRole")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push(ROUTES.PROFILE(user.id || "me"))}
                >
                  <User className={`${iconSizes.sm} mr-2`} />
                  {t("dashboard.header.profile.profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-error" onClick={handleLogout}>
                  <LogOut className={`${iconSizes.sm} mr-2`} />
                  {t("dashboard.header.profile.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

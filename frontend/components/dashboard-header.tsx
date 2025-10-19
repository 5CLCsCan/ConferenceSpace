"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, GraduationCap, User, LogOut, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockNotifications } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { LanguageSwitcher } from "@/components/language-switcher"

interface DashboardHeaderProps {
  role: "author" | "reviewer" | "chair" | "pc_member"
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const unreadNotifications = mockNotifications.filter((n) => !n.read).length

  const roleLinks: Record<DashboardHeaderProps["role"], { href: string; label: string }[]> = {
    author: [
      { href: "/author", label: t("dashboard.header.links.author.myPapers") },
      { href: "/author/submit", label: t("dashboard.header.links.author.newSubmission") },
    ],
    reviewer: [
      { href: "/reviewer", label: t("dashboard.header.links.reviewer.assignments") },
      { href: "/reviewer/completed", label: t("dashboard.header.links.reviewer.completed") },
    ],
    chair: [
      { href: "/chair", label: t("dashboard.header.links.chair.overview") },
      { href: "/chair/papers", label: t("dashboard.header.links.chair.papers") },
      { href: "/chair/reviewers", label: t("dashboard.header.links.chair.reviewers") },
    ],
    pc_member: [
      { href: "/pc", label: t("dashboard.header.links.pc_member.dashboard") },
      { href: "/pc/assignments", label: t("dashboard.header.links.pc_member.assignments") },
    ],
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  if (!user) return null

  return (
    <header className="border-b border-neutral-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-neutral-900">{t("app.name")}</span>
            </Link>
            <nav className="flex items-center gap-6">
              {roleLinks[role].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-neutral-100 bg-transparent"
                >
                  <Bell className="w-5 h-5 text-neutral-700" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-error text-white">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white border-neutral-200">
                <DropdownMenuLabel className="font-semibold text-neutral-900">
                  {t("dashboard.header.notifications.title")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {mockNotifications.slice(0, 3).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="font-medium text-sm text-neutral-900">{notification.title}</div>
                    <div className="text-xs text-neutral-600 leading-relaxed">
                      {notification.message}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-sm text-primary font-medium cursor-pointer">
                  {t("dashboard.header.notifications.seeAll")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-neutral-100 bg-transparent">
                  <User className="w-5 h-5 text-neutral-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-neutral-200">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold text-neutral-900">{user.name}</div>
                    <div className="text-xs text-neutral-600 font-normal">{user.email}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleBackToDashboard}>
                  <Home className="w-4 h-4 mr-2" />
                  {t("dashboard.header.profile.switchRole")}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  {t("dashboard.header.profile.profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-error" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
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

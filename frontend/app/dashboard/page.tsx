"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { sessionManager } from "@/lib/session-manager"
import { FileText, Users, BarChart3, GraduationCap, LogOut, Sparkles } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { useTranslation } from "@/lib/i18n/translation-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { typography, spacing, iconSizes } from "@/lib/typography"

type RoleConfig = {
  title: string
  description: string
  icon: typeof FileText
  color: string
  path: string
  features: string[]
}

// Valid roles that have dashboard pages (excluding admin)
const VALID_DASHBOARD_ROLES: UserRole[] = ["author", "reviewer", "chair"]

export default function DashboardPage() {
  const { user, isAuthenticated, logout, switchRole } = useAuth()
  const { t, tList } = useTranslation()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  // Wait for auth to be checked before redirecting
  useEffect(() => {
    // Give auth context time to initialize from localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Enable role changes when on dashboard page
  useEffect(() => {
    sessionManager.enableRoleChange()

    // Disable role changes when leaving dashboard
    return () => {
      sessionManager.disableRoleChange()
    }
  }, [])

  useEffect(() => {
    if (!authChecked) {
      return
    }

    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [authChecked, isAuthenticated, router])

  const roleConfig = useMemo<Record<UserRole, RoleConfig>>(
    () => ({
      author: {
        title: t("dashboard.roles.author.name"),
        description: t("dashboard.roles.author.description"),
        icon: FileText,
        color: "bg-primary text-primary-foreground",
        path: "/dashboard/author",
        features: tList("dashboard.roles.author.features"),
      },
      reviewer: {
        title: t("dashboard.roles.reviewer.name"),
        description: t("dashboard.roles.reviewer.description"),
        icon: Users,
        color: "bg-success text-success-foreground",
        path: "/dashboard/reviewer",
        features: tList("dashboard.roles.reviewer.features"),
      },
      chair: {
        title: t("dashboard.roles.chair.name"),
        description: t("dashboard.roles.chair.description"),
        icon: BarChart3,
        color: "bg-secondary text-secondary-foreground",
        path: "/dashboard/chair",
        features: tList("dashboard.roles.chair.features"),
      },

      admin: {
        title: t("dashboard.roles.admin.name"),
        description: t("dashboard.roles.admin.description"),
        icon: BarChart3,
        color: "bg-destructive text-destructive-foreground",
        path: "/dashboard/admin",
        features: tList("dashboard.roles.admin.features"),
      },
    }),
    [t, tList],
  )

  if (!authChecked || !isAuthenticated || !user) {
    return null
  }

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role)
    const config = roleConfig[role]
    if (config) {
      router.push(config.path)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Display all 3 main roles (author, reviewer, chair) regardless of user's actual roles
  // This allows users to select and operate as any of these roles
  const availableRoles = VALID_DASHBOARD_ROLES.filter(
    (role): role is UserRole => role in roleConfig,
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-lg bg-primary flex items-center justify-center size-10 shadow-sm">
              <GraduationCap className="text-primary-foreground size-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg">{t("app.name")}</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="size-4" />
              {t("common.actions.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12`}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Sparkles className={`${iconSizes.lg} text-primary`} />
            </div>
            <h1 className={`${typography.h1} text-foreground mb-2`}>
              {t("dashboard.greeting", { name: user.name })}
            </h1>
            {user.affiliation ? (
              <p className={`text-muted-foreground mb-1 ${typography.body}`}>{user.affiliation}</p>
            ) : null}
            <p className={`${typography.body} text-muted-foreground`}>{user.email}</p>
          </div>

          <div className="mb-6">
            <h2 className={`${typography.h2} text-foreground mb-2`}>{t("dashboard.selectRole")}</h2>
            <p className={`text-muted-foreground ${typography.body}`}>
              {t("dashboard.selectRoleDescription")}
            </p>
          </div>

          <div className={`grid md:grid-cols-3 ${spacing.gap.lg}`}>
            {availableRoles.map((role) => {
              const config = roleConfig[role]

              if (!config) {
                return null
              }

              const Icon = config.icon

              return (
                <Card
                  key={role}
                  className="bg-card border-2 border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer group py-6"
                  onClick={() => handleRoleSelect(role)}
                >
                  <CardHeader>
                    <div className={`flex items-start justify-between mb-4`}>
                      <div className={`flex items-center ${spacing.gap.md}`}>
                        <div
                          className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center shadow-sm`}
                        >
                          <Icon className={`${iconSizes.lg} text-primary-foreground`} />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                      >
                        {t("common.actions.choose")}
                      </Button>
                    </div>
                    <CardTitle className={`${typography.h4} text-foreground`}>
                      {config.title}
                    </CardTitle>
                    <CardDescription className={`text-muted-foreground ${typography.body}`}>
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className={spacing.item}>
                      {config.features.map((feature, index) => (
                        <li
                          key={index}
                          className={`flex items-center ${spacing.gap.sm} ${typography.body} text-foreground`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {availableRoles.length === 0 && (
            <Card className="bg-card border border-border mt-8">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t("dashboard.noRoles.title")}</p>
                <p className={`${typography.body} text-muted-foreground mt-2`}>
                  {t("dashboard.noRoles.description")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

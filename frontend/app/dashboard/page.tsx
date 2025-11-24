"use client"

import { useEffect, useMemo } from "react"
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

  // Enable role changes when on dashboard page
  useEffect(() => {
    sessionManager.enableRoleChange()

    // Disable role changes when leaving dashboard
    return () => {
      sessionManager.disableRoleChange()
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const roleConfig = useMemo<Record<UserRole, RoleConfig>>(
    () => ({
      author: {
        title: t("dashboard.roles.author.name"),
        description: t("dashboard.roles.author.description"),
        icon: FileText,
        color: "bg-blue-500",
        path: "/dashboard/author",
        features: tList("dashboard.roles.author.features"),
      },
      reviewer: {
        title: t("dashboard.roles.reviewer.name"),
        description: t("dashboard.roles.reviewer.description"),
        icon: Users,
        color: "bg-green-500",
        path: "/dashboard/reviewer",
        features: tList("dashboard.roles.reviewer.features"),
      },
      chair: {
        title: t("dashboard.roles.chair.name"),
        description: t("dashboard.roles.chair.description"),
        icon: BarChart3,
        color: "bg-purple-500",
        path: "/dashboard/chair",
        features: tList("dashboard.roles.chair.features"),
      },

      admin: {
        title: t("dashboard.roles.admin.name"),
        description: t("dashboard.roles.admin.description"),
        icon: BarChart3,
        color: "bg-red-500",
        path: "/dashboard/admin",
        features: tList("dashboard.roles.admin.features"),
      },
    }),
    [t, tList],
  )

  if (!user) {
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
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white shadow-sm h-[7vh]">
        <div className="w-full px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="rounded-lg bg-primary flex items-center justify-center"
              style={{ width: "calc(7vh * 0.6)", height: "calc(7vh * 0.6)" }}
            >
              <GraduationCap
                className="text-white"
                style={{ width: "calc(7vh * 0.6 * 0.6)", height: "calc(7vh * 0.6 * 0.6)" }}
              />
            </div>
            <div className="flex flex-col">
              <span
                className="font-bold text-neutral-900 leading-none"
                style={{ fontSize: "calc(7vh * 0.6 * 0.4)" }}
              >
                {t("app.name")}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div style={{ fontSize: "calc(7vh * 0.6 * 0.35)" }}>
              <LanguageSwitcher />
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 bg-transparent leading-none"
              style={{
                height: "calc(7vh * 0.6)",
                fontSize: "calc(7vh * 0.6 * 0.35)",
                paddingLeft: "calc(7vh * 0.6 * 0.3)",
                paddingRight: "calc(7vh * 0.6 * 0.3)",
              }}
            >
              <LogOut style={{ width: "calc(7vh * 0.6 * 0.5)", height: "calc(7vh * 0.6 * 0.5)" }} />
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
            <h1 className={`${typography.h1} text-neutral-900 mb-2`}>
              {t("dashboard.greeting", { name: user.name })}
            </h1>
            {user.affiliation ? (
              <p className={`text-neutral-600 mb-1 ${typography.body}`}>{user.affiliation}</p>
            ) : null}
            <p className={`${typography.body} text-neutral-500`}>{user.email}</p>
          </div>

          <div className="mb-6">
            <h2 className={`${typography.h2} text-neutral-900 mb-2`}>
              {t("dashboard.selectRole")}
            </h2>
            <p className={`text-neutral-600 ${typography.body}`}>
              {t("dashboard.selectRoleDescription")}
            </p>
          </div>

          <div className={`grid md:grid-cols-3 ${spacing.gap.lg}`}>
            {availableRoles.map((role) => {
              const config = roleConfig[role]

              // Skip if config doesn't exist (shouldn't happen due to filter, but safety check)
              if (!config) {
                return null
              }

              const Icon = config.icon

              return (
                <Card
                  key={role}
                  className="bg-white border-2 border-neutral-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer group py-6"
                  onClick={() => handleRoleSelect(role)}
                >
                  <CardHeader>
                    <div className={`flex items-start justify-between mb-4`}>
                      <div className={`flex items-center ${spacing.gap.md}`}>
                        <div
                          className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center`}
                        >
                          <Icon className={`${iconSizes.lg} text-white`} />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors bg-transparent"
                      >
                        {t("common.actions.choose")}
                      </Button>
                    </div>
                    <CardTitle className={`${typography.h4} text-neutral-900`}>
                      {config.title}
                    </CardTitle>
                    <CardDescription className={`text-neutral-600 ${typography.body}`}>
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className={spacing.item}>
                      {config.features.map((feature, index) => (
                        <li
                          key={index}
                          className={`flex items-center ${spacing.gap.sm} ${typography.body} text-neutral-700`}
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
            <Card className="bg-white border border-neutral-200 mt-8">
              <CardContent className="py-12 text-center">
                <p className="text-neutral-600">{t("dashboard.noRoles.title")}</p>
                <p className={`${typography.body} text-neutral-500 mt-2`}>
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

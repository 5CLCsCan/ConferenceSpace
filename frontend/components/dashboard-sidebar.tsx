"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import type { NavItem } from "@/lib/navigation"
import { listConferences, transitionConferenceStatus } from "@/lib/api/conferences"
import type { Conference, ConferenceStatus } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface DashboardSidebarProps {
  menuItems: NavItem[]
  className?: string
}

function DashboardSidebarContent({ menuItems, className }: DashboardSidebarProps) {
  const { t, locale, setLocale } = useTranslation()
  const { user, logout, currentRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [recentConferences, setRecentConferences] = useState<Conference[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [recentError, setRecentError] = useState<string | null>(null)
  const [archivedRecentConferenceIds, setArchivedRecentConferenceIds] = useState<string[]>([])
  const [showArchivedRecent, setShowArchivedRecent] = useState(false)

  const isRolePage = pathname === ROUTES.ROLE_SELECT

  // Helper to check if a menu item is active (handles query params)
  const isItemActive = (href: string) => {
    const url = new URL(href, "http://localhost")
    const hrefPathname = url.pathname
    const hrefTab = url.searchParams.get("tab")
    const currentTab = searchParams.get("tab")

    // If href has no query params, just match pathname exactly
    if (!hrefTab) {
      return pathname === hrefPathname && !currentTab
    }

    // If href has tab query param, match both pathname and tab
    return pathname === hrefPathname && currentTab === hrefTab
  }

  useEffect(() => {
    let cancelled = false

    async function loadRecentConferences() {
      if (!currentRole || currentRole === "admin") {
        setRecentConferences([])
        return
      }

      setLoadingRecent(true)
      setRecentError(null)
      const response = await listConferences({
        myConferences: true,
        role: currentRole,
        limit: 20,
      })

      if (cancelled) {
        return
      }

      if (response.error || !response.data) {
        setRecentError(response.error || "Failed to load conferences")
        setRecentConferences([])
        setLoadingRecent(false)
        return
      }

      // Exclude non-active conferences from the recent list by default
      const nonArchived = (response.data.conferences || []).filter(
        (conf) => conf.status !== "archived" && conf.status !== "draft",
      )

      const sorted = [...nonArchived].sort((a, b) => {
        const updatedA = Date.parse(a.updated_at || a.created_at || "")
        const updatedB = Date.parse(b.updated_at || b.created_at || "")
        if (updatedA !== updatedB) {
          return updatedB - updatedA
        }
        const createdA = Date.parse(a.created_at || "")
        const createdB = Date.parse(b.created_at || "")
        return createdB - createdA
      })

      setRecentConferences(sorted.slice(0, 5))
      setLoadingRecent(false)
    }

    void loadRecentConferences()

    return () => {
      cancelled = true
    }
  }, [currentRole])

  const roleLabel = useMemo(() => {
    if (!currentRole) return ""
    return currentRole.charAt(0).toUpperCase() + currentRole.slice(1)
  }, [currentRole])

  const recentConferenceArchiveStorageKey = useMemo(() => {
    const userKey = user?.email || "guest"
    const roleKey = currentRole || "none"
    return `recent-conferences:archived:${userKey}:${roleKey}`
  }, [currentRole, user?.email])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const rawValue = window.localStorage.getItem(recentConferenceArchiveStorageKey)
      if (!rawValue) {
        setArchivedRecentConferenceIds([])
        return
      }

      const parsed = JSON.parse(rawValue)
      if (Array.isArray(parsed)) {
        setArchivedRecentConferenceIds(
          parsed.filter((value): value is string => typeof value === "string"),
        )
        return
      }
    } catch {
      // Ignore malformed local state and reset to empty.
    }

    setArchivedRecentConferenceIds([])
  }, [recentConferenceArchiveStorageKey])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(
      recentConferenceArchiveStorageKey,
      JSON.stringify(archivedRecentConferenceIds),
    )
  }, [archivedRecentConferenceIds, recentConferenceArchiveStorageKey])

  const conferenceDetailHref = (conferenceId: string) => {
    if (currentRole === "chair") return ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId)
    if (currentRole === "reviewer") return ROUTES.REVIEWER.CONFERENCE_SUBMISSIONS(conferenceId)
    return ROUTES.AUTHOR.CONFERENCE_DETAIL(conferenceId)
  }

  const profileHref = ROUTES.PROFILE(user?.id ? String(user.id) : "me")
  const visibleRecentConferences = useMemo(
    () => recentConferences.filter((conf) => !archivedRecentConferenceIds.includes(conf.id)),
    [archivedRecentConferenceIds, recentConferences],
  )
  const archivedRecentConferences = useMemo(
    () => recentConferences.filter((conf) => archivedRecentConferenceIds.includes(conf.id)),
    [archivedRecentConferenceIds, recentConferences],
  )

  const archiveRecentConference = async (conferenceId: string, status?: ConferenceStatus) => {
    // Optimistically hide from recent list
    setArchivedRecentConferenceIds((current) =>
      current.includes(conferenceId) ? current : [...current, conferenceId],
    )

    const targetStatus: ConferenceStatus = status === "archived" ? "completed" : "archived"

    const response = await transitionConferenceStatus(conferenceId, targetStatus)
    if (response.error || !response.data) {
      setArchivedRecentConferenceIds((current) => current.filter((id) => id !== conferenceId))
      toast({
        title: t("runtime.components.dashboard-sidebar.text_failed_to_archive_recent_conference"),
        description:
          response.error ||
          t(
            "runtime.components.dashboard-sidebar.text_failed_to_archive_recent_conference_description",
          ),
        variant: "destructive",
      })
    }
  }

  const restoreRecentConference = async (
    conferenceId: string,
    restoreStatus: ConferenceStatus = "completed",
  ) => {
    // Optimistically restore in recent list
    setArchivedRecentConferenceIds((current) => current.filter((id) => id !== conferenceId))

    const response = await transitionConferenceStatus(conferenceId, restoreStatus)
    if (response.error || !response.data) {
      setArchivedRecentConferenceIds((current) =>
        current.includes(conferenceId) ? current : [...current, conferenceId],
      )
      toast({
        title: t("runtime.components.dashboard-sidebar.text_failed_to_restore_recent_conference"),
        description:
          response.error ||
          t(
            "runtime.components.dashboard-sidebar.text_failed_to_restore_recent_conference_description",
          ),
        variant: "destructive",
      })
    }
  }

  return (
    <aside
      className={cn(
        "relative z-40 hidden h-screen w-56 shrink-0 flex-col overflow-hidden border-r border-[#e2e8f0] bg-white shadow-[2px_0_6px_-6px_rgba(15,23,42,0.12)] md:flex",
        className,
      )}
      style={{ height: "100vh" }}
    >
      {/* Branding */}
      <div className="px-5 py-8">
        <Link
          href={
            currentRole
              ? (ROUTES.ROLE_ROUTE_MAP[currentRole] ?? ROUTES.ROLE_SELECT)
              : ROUTES.ROLE_SELECT
          }
          className="group flex items-center gap-[10px] transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141414] text-white transition-colors group-hover:bg-[#1b3c53]">
            <span className="material-symbols-outlined text-[18px] leading-none">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-[700] leading-tight tracking-tight text-[#141414]">
              {t("runtime.components.dashboard-sidebar.text_conferencespace")}{" "}
            </h1>
            {!isRolePage && currentRole && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-[700] leading-none tracking-[0.08em] text-[#1b3c53] uppercase">
                  {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                </span>
                <div className="inline-flex items-center justify-center gap-1 rounded-full border border-[#cbd5e1] bg-[#f1f5f9] px-2 py-[2px] text-[9px] font-[700] uppercase leading-none tracking-[0.08em] text-[#64748b]">
                  {t("runtime.components.dashboard-sidebar.text_active") || "Active"}
                </div>
              </div>
            )}
          </div>
        </Link>
        {!isRolePage && currentRole && (
          <div className="px-11 mt-2">
            <Link
              href={ROUTES.ROLE_SELECT}
              className="group flex items-center gap-1 text-[9px] font-[700] uppercase leading-[1.2] tracking-[0.08em] text-[#64748b] transition-colors hover:text-[#1b3c53]"
            >
              <span className="material-symbols-outlined text-[12px] leading-none">swap_horiz</span>
              <span className="group-hover:underline underline-offset-2">
                {t("runtime.components.dashboard-sidebar.text_change_role") || "Switch Role"}
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-8 overflow-y-auto">
        <div>
          <h3 className="mb-3 text-[10px] font-[700] uppercase leading-[1.35] tracking-[0.12em] text-[#94a3b8]">
            {t("runtime.components.dashboard-sidebar.text_menu")}{" "}
          </h3>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = isItemActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors",
                    isActive
                      ? "bg-[#f1f5f9] font-[700] text-[#141414]"
                      : "font-[500] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#141414]",
                  )}
                >
                  <div className="relative flex items-center">
                    <span
                      className={cn(
                        "material-symbols-outlined text-[18px] leading-none",
                        !isActive && "text-[#94a3b8] group-hover:text-[#141414]",
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-red-500"></span>
                    )}
                  </div>
                  <span className="text-[12px] font-normal leading-[1.5] text-[#475569]">
                    {t(item.labelKey)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Conferences */}
        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="px-0 text-[10px] font-[700] uppercase leading-[1.35] tracking-[0.12em] text-[#94a3b8]">
              {t("runtime.components.dashboard-sidebar.text_recent_conferences")}{" "}
            </h3>
            {archivedRecentConferences.length > 0 && (
              <button
                type="button"
                onClick={() => setShowArchivedRecent((current) => !current)}
                className="text-[9px] font-[700] uppercase leading-[1.2] tracking-[0.08em] text-[#94a3b8] transition-colors hover:text-[#64748b]"
              >
                {showArchivedRecent
                  ? t("runtime.components.dashboard-sidebar.text_hide_archived_recent")
                  : t("runtime.components.dashboard-sidebar.text_show_archived_recent").replace(
                      "{count}",
                      String(archivedRecentConferences.length),
                    )}
              </button>
            )}
          </div>
          <nav className="space-y-5">
            {loadingRecent ? (
              <p className="px-1.5 text-[10px] font-normal leading-[1.35] text-[#94a3b8]">
                {t("runtime.components.dashboard-sidebar.text_loading_conferences")}
              </p>
            ) : recentError ? (
              <p className="px-1.5 text-[12px] font-normal leading-[1.5] text-[#b91c1c]">
                {t("runtime.components.dashboard-sidebar.text_unable_to_load_recent_conferences")}
              </p>
            ) : visibleRecentConferences.length === 0 ? (
              <p className="px-1.5 text-[10px] font-normal leading-[1.35] text-[#94a3b8]">
                {archivedRecentConferences.length > 0
                  ? t("runtime.components.dashboard-sidebar.text_all_recent_conferences_archived")
                  : t("runtime.components.dashboard-sidebar.text_no_recent_conferences_yet")}
              </p>
            ) : (
              visibleRecentConferences.map((conf) => (
                <div key={conf.id} className="group relative px-1.5">
                  <Link
                    href={conferenceDetailHref(conf.id)}
                    className="block cursor-pointer transition-all duration-200 pr-6"
                  >
                    <h4 className="text-[13px] font-[700] leading-[1.3] tracking-[-0.01em] text-[#141414] transition-colors group-hover:text-[#1b3c53]">
                      {conf.acronym ? `${conf.acronym} ${conf.year}` : conf.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0">
                      <span className="text-[10px] font-[500] uppercase leading-[1.35] tracking-[0.08em] text-[#94a3b8]">
                        {(conf.userRole || roleLabel || "").toUpperCase()}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      archiveRecentConference(conf.id, conf.status as ConferenceStatus)
                    }
                    aria-label={t(
                      "runtime.components.dashboard-sidebar.text_archive_recent_conference",
                    )}
                    className="absolute right-1 top-0 flex h-5 w-5 items-center justify-center rounded-md text-[#94a3b8] opacity-0 transition-[opacity,color,background-color] hover:bg-[#f1f5f9] hover:text-[#1b3c53] group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[14px] leading-none">archive</span>
                  </button>
                </div>
              ))
            )}
          </nav>

          {showArchivedRecent && archivedRecentConferences.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-[#f1f5f9] pt-4">
              <p className="px-1.5 text-[9px] font-[700] uppercase leading-[1.2] tracking-[0.08em] text-[#94a3b8]">
                {t("runtime.components.dashboard-sidebar.text_archived_recent_conferences")}
              </p>
              {archivedRecentConferences.map((conf) => (
                <div key={conf.id} className="group relative px-1.5 opacity-80">
                  <Link
                    href={conferenceDetailHref(conf.id)}
                    className="block cursor-pointer transition-all duration-200 pr-6"
                  >
                    <h4 className="text-[13px] font-[700] leading-[1.3] tracking-[-0.01em] text-[#64748b] transition-colors group-hover:text-[#1b3c53]">
                      {conf.acronym ? `${conf.acronym} ${conf.year}` : conf.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0">
                      <span className="text-[10px] font-[500] uppercase leading-[1.35] tracking-[0.08em] text-[#94a3b8]">
                        {(conf.userRole || roleLabel || "").toUpperCase()}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      restoreRecentConference(conf.id, conf.status as ConferenceStatus)
                    }
                    aria-label={t(
                      "runtime.components.dashboard-sidebar.text_restore_recent_conference",
                    )}
                    className="absolute right-1 top-0 flex h-5 w-5 items-center justify-center rounded-md text-[#94a3b8] opacity-0 transition-[opacity,color,background-color] hover:bg-[#f1f5f9] hover:text-[#1b3c53] group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[14px] leading-none">
                      unarchive
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User Section Selector */}
      <div className="mt-auto border-t border-[#f1f5f9]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex w-full items-center gap-2.5 border-none px-3 py-2.5 text-left outline-none transition-colors hover:bg-[#f1f5f9]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e2e8f0] bg-[#f1f5f9]">
                <span className="material-symbols-outlined text-[16px] text-[#64748b] transition-colors group-hover:text-[#1b3c53]">
                  person
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-[12px] font-[700] leading-tight tracking-tight text-[#141414] transition-colors group-hover:text-[#1b3c53]">
                  {user?.name || t("runtime.components.dashboard-sidebar.text_guest")}
                </span>
                <span className="mt-0.5 truncate text-[10px] font-normal leading-[1.35] text-[#94a3b8] transition-colors group-hover:text-[#64748b]">
                  {user?.affiliation ||
                    user?.email ||
                    t("runtime.components.dashboard-sidebar.text_account_settings")}
                </span>
              </div>
              <div className="flex items-center justify-center text-[#94a3b8] transition-colors group-hover:text-[#1b3c53]">
                <span className="material-symbols-outlined text-[14px] leading-none">
                  chevron_right
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[180px] rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-[0_1px_2px_0_rgb(15_23_42_/_0.05)] data-[state=closed]:duration-100 data-[state=open]:duration-150"
            align="start"
            side="right"
            // sideOffset={12}
          >
            <DropdownMenuItem
              onClick={() => router.push(profileHref)}
              className="group/menu flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 pl-2 text-[12px] font-normal leading-[1.5] text-[#475569] transition-colors focus:bg-[#f1f5f9] focus:text-[#141414] data-[highlighted]:bg-[#f1f5f9] data-[highlighted]:text-[#141414]"
            >
              <span className="font-[500] tracking-tight">
                {t("runtime.components.dashboard-sidebar.text_view_profile")}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setLocale(locale === "en" ? "vi" : "en")}
              className="group/menu flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 pl-2 text-[12px] font-normal leading-[1.5] text-[#475569] transition-colors focus:bg-[#f1f5f9] focus:text-[#141414] data-[highlighted]:bg-[#f1f5f9] data-[highlighted]:text-[#141414]"
            >
              <span className="font-[500] tracking-tight">
                {t("runtime.components.dashboard-sidebar.text_change_language")}
              </span>
              <span className="ml-auto text-[9px] font-[700] uppercase leading-[1.2] tracking-[0.08em] text-[#94a3b8]">
                {locale.toUpperCase()}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-0.5 bg-[#f1f5f9]" />

            <DropdownMenuItem
              onClick={logout}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[12px] font-normal leading-[1.5] text-[#b91c1c] transition-colors focus:bg-[#fee2e2] focus:text-[#b91c1c] data-[highlighted]:bg-[#fee2e2] data-[highlighted]:text-[#b91c1c]"
            >
              <span className="font-[500] tracking-tight">
                {t("runtime.components.dashboard-sidebar.text_sign_out")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <Suspense fallback={null}>
      <DashboardSidebarContent {...props} />
    </Suspense>
  )
}

"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { Globe, Check } from "lucide-react"
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
import { listConferences } from "@/lib/api/conferences"
import type { Conference } from "@/lib/types"

interface DashboardSidebarProps {
  menuItems: NavItem[]
  className?: string
}

function DashboardSidebarContent({ menuItems, className }: DashboardSidebarProps) {
  const { user, logout, currentRole } = useAuth()
  const { locale, setLocale } = useTranslation()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [recentConferences, setRecentConferences] = useState<Conference[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [recentError, setRecentError] = useState<string | null>(null)

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

      const sorted = [...response.data.conferences].sort((a, b) => {
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

  const conferenceDetailHref = (conferenceId: string) => {
    if (currentRole === "chair") return ROUTES.CHAIR.CONFERENCE_DETAIL(conferenceId)
    if (currentRole === "reviewer") return ROUTES.REVIEWER.CONFERENCE_SUBMISSIONS(conferenceId)
    return ROUTES.AUTHOR.CONFERENCE_DETAIL(conferenceId)
  }

  return (
    <aside
      className={cn(
        "w-56 hidden md:flex flex-col border-r border-slate-200 bg-white dark:bg-neutral-900 h-screen overflow-hidden flex-shrink-0 z-40 relative shadow-[4px_0_24px_-2px_rgba(0,0,0,0.02)]",
        className,
      )}
      style={{ height: "100vh" }}
    >
      {/* Branding */}
      <div className="px-5 py-8">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#141414] text-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10 w-9 h-9">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold tracking-tight text-[#141414] dark:text-white">
              ConferenceSpace
            </h1>
            {!isRolePage && currentRole && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.5px] leading-none">
                  {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                </span>
                <Link
                  href={ROUTES.ROLE_SELECT}
                  className="text-[8px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-1.5 py-0.5 rounded transition-all uppercase tracking-wider leading-none"
                >
                  Change
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-8 overflow-y-auto">
        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Menu
          </h3>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = isItemActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-1.5 py-1.5 rounded-lg transition-colors group",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-800",
                  )}
                >
                  <div className="relative flex items-center">
                    <span
                      className={cn(
                        "material-symbols-outlined text-[18px]",
                        !isActive &&
                          "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white",
                      )}
                      style={{ fontSize: "18px" }}
                    >
                      {item.icon}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-neutral-900"></span>
                    )}
                  </div>
                  <span className="text-[12px]">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Conferences */}
        <div>
          <h3 className="px-0 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Recent Conferences
          </h3>
          <nav className="space-y-5">
            {loadingRecent ? (
              <p className="text-[10px] text-slate-400 px-1.5">Loading conferences...</p>
            ) : recentError ? (
              <p className="text-[10px] text-red-500 px-1.5">Unable to load recent conferences.</p>
            ) : recentConferences.length === 0 ? (
              <p className="text-[10px] text-slate-400 px-1.5">No recent conferences yet.</p>
            ) : (
              recentConferences.map((conf) => (
                <Link
                  key={conf.id}
                  href={conferenceDetailHref(conf.id)}
                  className="block group cursor-pointer relative transition-all duration-200 px-1.5"
                >
                  <h4 className="font-bold text-[12px] text-[#141414] dark:text-white group-hover:text-blue-600 transition-colors">
                    {conf.acronym ? `${conf.acronym} ${conf.year}` : conf.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                      {(conf.userRole || roleLabel || "").toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </nav>
        </div>
      </nav>

      {/* User Section Selector */}
      <div className="mt-auto border-t border-slate-100 dark:border-neutral-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all duration-300 group outline-none border-none text-left">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden border border-slate-200 dark:border-neutral-700 flex-shrink-0 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                <span className="material-symbols-outlined text-slate-500 text-xl">person</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                  {user?.name || "Guest"}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.affiliation || user?.email || "Account Settings"}
                </span>
              </div>
              <div className="flex items-center justify-center text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px] leading-none transition-transform duration-300 group-hover:translate-x-1">
                  chevron_right
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 py-1.5 rounded-lg shadow-xl border-slate-200 dark:border-neutral-800"
            align="start"
            side="right"
            sideOffset={8}
          >
            <div className="px-2.5 py-1.5 border-b border-slate-50 dark:border-neutral-800/50 mb-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Account Settings
              </span>
            </div>

            <DropdownMenuItem
              onClick={() => setLocale(locale === "en" ? "vi" : "en")}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-neutral-800 cursor-pointer transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Change Language</span>
              <span className="text-[9px] font-bold text-slate-400 ml-auto uppercase tracking-tighter">
                {locale.toUpperCase()}
              </span>
              <Check className="w-3.5 h-3.5 text-slate-400" />
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-50 dark:bg-neutral-800 my-1" />

            <DropdownMenuItem
              onClick={logout}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="text-xs font-semibold">Sign Out</span>
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

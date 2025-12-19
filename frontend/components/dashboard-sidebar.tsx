"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}

interface DashboardSidebarProps {
  menuItems: NavItem[]
  className?: string
}

export function DashboardSidebar({ menuItems, className }: DashboardSidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const mockConferences = [
    { name: "CVPR 2024", role: "Reviewer", color: "text-[#2563eb]" },
    { name: "ICML 2023", role: "Author", color: "text-[#16a34a]" },
    { name: "NeurIPS 2024", role: "Reviewer", color: "text-[#2563eb]" },
    { name: "AAAI 2024", role: "Chair", color: "text-[#9333ea]", active: true },
  ]

  return (
    <aside
      className={cn(
        "w-64 hidden md:flex flex-col border-r border-slate-200 bg-white dark:bg-neutral-900 h-screen overflow-hidden flex-shrink-0 z-40 relative shadow-[4px_0_24px_-2px_rgba(0,0,0,0.02)]",
        className,
      )}
    >
      {/* Branding */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-2.5">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/20">
            <span className="material-symbols-outlined text-xl">school</span>
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            ConferenceSpace
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 space-y-8 overflow-y-auto">
        <div>
          <h3 className="px-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Menu
          </h3>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  )}
                >
                  <div className="relative flex items-center">
                    <span
                      className={cn(
                        "material-symbols-outlined text-lg",
                        !isActive &&
                          "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white",
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full border border-white dark:border-neutral-900"></span>
                    )}
                  </div>
                  <span className="font-medium text-xs">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Conferences */}
        <div>
          <h3 className="px-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Recent Conferences
          </h3>
          <div className="space-y-3">
            {mockConferences.map((conf, i) => (
              <div
                key={i}
                className={cn(
                  "px-2 group cursor-pointer relative transition-all duration-200",
                  conf.active
                    ? "bg-slate-100 dark:bg-slate-800 rounded-xl -mx-2 py-3 px-4 border-l-2 border-slate-900 dark:border-white shadow-sm"
                    : "hover:translate-x-1",
                )}
              >
                <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-0.5">
                  {conf.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider transition-colors",
                      conf.active
                        ? "text-slate-500 dark:text-slate-300"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200",
                    )}
                  >
                    {conf.role}
                  </span>
                  {conf.active && <span className="w-0.5 h-0.5 rounded-full bg-slate-400"></span>}
                  {conf.active && (
                    <span className="text-[9px] font-medium text-slate-400 uppercase italic">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User Section Selector */}
      <div className="mt-auto border-t border-slate-100 dark:border-neutral-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all duration-300 group outline-none border-none text-left">
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
                <span className="material-symbols-outlined text-lg leading-none transition-transform duration-300 group-hover:translate-x-1">
                  chevron_right
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 p-1.5 rounded-lg shadow-xl border-slate-200 dark:border-neutral-800 ml-3"
            align="start"
            side="right"
            sideOffset={8}
          >
            <div className="px-2.5 py-1.5 border-b border-slate-50 dark:border-neutral-800/50 mb-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Account Settings
              </span>
            </div>

            <DropdownMenuItem className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-slate-600 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-neutral-800 cursor-pointer transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Change Language</span>
              <span className="text-[9px] font-bold text-slate-400 ml-auto uppercase tracking-tighter">
                EN
              </span>
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

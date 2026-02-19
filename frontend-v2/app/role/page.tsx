"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { canAccessRole } from "@/lib/role-access"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ROUTES } from "@/lib/routes"

export default function RoleSelectionPage() {
  const { user, isAuthenticated, isAuthLoading, switchRole } = useAuth()
  const router = useRouter()

  // Injected design patterns from code.html
  const customStyles = `
    .material-symbols-outlined {
      font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24
    }
    .shadow-card {
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }
    .shadow-card-hover {
      box-shadow: 0 10px 40px -5px rgba(0, 0, 0, 0.1);
    }
  `

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
    }
  }, [isAuthLoading, isAuthenticated, router])

  if (isAuthLoading || !isAuthenticated || !user) {
    return null
  }

  const handleRoleSelect = (role: UserRole) => {
    if (!canAccessRole(user, role)) {
      return
    }

    const didSwitchRole = switchRole(role)
    if (!didSwitchRole) {
      return
    }

    router.push(ROUTES.ROLE_ROUTE_MAP[role] ?? ROUTES.ROLE_SELECT)
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Mobile Header */}
      <header className="w-full border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-50 md:hidden flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0f172a] text-white p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a] dark:text-white">
              ConferenceSpace
            </h1>
          </div>
          <button className="text-slate-500">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <DashboardSidebar
        menuItems={[
          { label: "Dashboard", href: ROUTES.ROLE_SELECT, icon: "dashboard" },
          { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: "notifications", badge: 3 },
        ]}
      />

      {/* Main Content */}
      <main className="flex-grow flex flex-col px-10 md:px-12 py-8 md:py-8 max-w-[1400px] w-full mx-auto overflow-y-auto">
        <div className="w-full flex flex-col gap-8 mt-0">
          <div className="flex flex-col items-start text-left space-y-2">
            <h2 className="text-[32px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Welcome back, <br className="md:hidden" />
              <span className="text-[#16a34a]">{user.name.split(" ")[0]}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl font-light leading-relaxed">
              Please select the role you wish to operate as today. You can switch roles at any time
              from your account settings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full pb-10">
            {canAccessRole(user, "author") && (
              <div className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden h-full">
                <div className="h-24 w-full bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
                  <div className="absolute top-4 left-5 z-20 flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-green-700 text-xl font-bold">
                        edit_document
                      </span>
                    </div>
                    <h4 className="text-[9px] font-bold text-white uppercase tracking-[0.2em] opacity-90 mt-1 ml-0.5">
                      Submissions
                    </h4>
                  </div>
                  <div className="absolute -right-8 -bottom-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Author</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed">
                    Manage submissions, view reviews, and upload camera-ready papers for upcoming
                    conferences.
                  </p>
                  <div className="mt-auto">
                    <button
                      onClick={() => handleRoleSelect("author")}
                      className="w-full py-2.5 px-5 rounded-full bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 group/btn shadow-lg shadow-green-600/20"
                    >
                      Enter Dashboard
                      <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {canAccessRole(user, "reviewer") && (
              <div className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden h-full">
                <div className="h-24 w-full bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
                  <div className="absolute top-4 left-5 z-20 flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-blue-700 text-xl font-bold">
                        rate_review
                      </span>
                    </div>
                    <h4 className="text-[9px] font-bold text-white uppercase tracking-[0.2em] opacity-90 mt-1 ml-0.5">
                      Evaluations
                    </h4>
                  </div>
                  <div className="absolute -right-8 -bottom-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Reviewer
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed">
                    Evaluate assigned papers, submit scores, and provide constructive feedback to
                    authors.
                  </p>
                  <div className="mt-auto">
                    <button
                      onClick={() => handleRoleSelect("reviewer")}
                      className="w-full py-2.5 px-5 rounded-full bg-white border-2 border-blue-600 text-blue-600 text-xs font-bold hover:bg-blue-50 dark:bg-transparent dark:text-blue-400 dark:border-blue-500 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                    >
                      Enter Dashboard
                      <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {canAccessRole(user, "chair") && (
              <div className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden h-full">
                <div className="h-24 w-full bg-gradient-to-br from-purple-700 to-purple-800 relative overflow-hidden">
                  <div className="absolute top-4 left-5 z-20 flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-purple-700 text-xl font-bold">
                        gavel
                      </span>
                    </div>
                    <h4 className="text-[9px] font-bold text-white uppercase tracking-[0.2em] opacity-90 mt-1 ml-0.5">
                      Management
                    </h4>
                  </div>
                  <div className="absolute -right-8 -bottom-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chair</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed">
                    Oversee conference tracks, manage committees, and set schedules for the event.
                  </p>
                  <div className="mt-auto">
                    <button
                      onClick={() => handleRoleSelect("chair")}
                      className="w-full py-2.5 px-5 rounded-full bg-white border-2 border-purple-600 text-purple-600 text-xs font-bold hover:bg-purple-50 dark:bg-transparent dark:text-purple-400 dark:border-purple-500 dark:hover:bg-purple-900/20 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
                    >
                      Enter Dashboard
                      <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

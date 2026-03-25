"use client"

import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { canAccessRole } from "@/lib/role-access"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ROUTES } from "@/lib/routes"
import { useTranslation } from "@/lib/i18n/translation-context"
import { tStatic as t } from "@/lib/i18n/static-translate"

/* ------------------------------------------------------------------ */
/*  Abstract decorative shape component                                */
/* ------------------------------------------------------------------ */
function AbstractShape({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { t } = useTranslation()
  return <div className={className} style={style} aria-hidden="true" />
}

/* ------------------------------------------------------------------ */
/*  Role card configuration                                            */
/* ------------------------------------------------------------------ */
// ROLE_CONFIG moved inside component to support dynamic translation and avoid build-time errors

export default function RoleSelectionPage() {
  const { t } = useTranslation()

  const ROLE_CONFIG = useMemo(
    () => ({
      author: {
        icon: "edit_document",
        label: t("runtime.app.role.page.prop_label_submissions"),
        title: t("runtime.app.role.page.prop_title_author"),
        description: t(
          "runtime.app.role.page.prop_description_manage_submissions_view_reviews_and_upload",
        ),
        gradient: "from-emerald-500 via-green-600 to-teal-700",
        accentColor: "#16a34a",
        shadowColor: "rgba(22,163,74,0.25)",
        borderGlow: "rgba(22,163,74,0.4)",
        btnClass: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20",
      },
      reviewer: {
        icon: "rate_review",
        label: t("runtime.app.role.page.prop_label_evaluations"),
        title: t("runtime.app.role.page.prop_title_reviewer"),
        description: t(
          "runtime.app.role.page.prop_description_evaluate_assigned_papers_submit_scores_and",
        ),
        gradient: "from-blue-500 via-blue-600 to-indigo-700",
        accentColor: "#2563eb",
        shadowColor: "rgba(37,99,235,0.25)",
        borderGlow: "rgba(37,99,235,0.4)",
        btnClass:
          "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:bg-transparent dark:text-blue-400 dark:border-blue-500 dark:hover:bg-blue-900/20",
      },
      chair: {
        icon: "gavel",
        label: t("runtime.app.role.page.prop_label_management"),
        title: t("runtime.app.role.page.prop_title_chair"),
        description: t(
          "runtime.app.role.page.prop_description_oversee_conference_tracks_manage_committees_and",
        ),
        gradient: "from-violet-500 via-purple-600 to-purple-800",
        accentColor: "#9333ea",
        shadowColor: "rgba(147,51,234,0.25)",
        borderGlow: "rgba(147,51,234,0.4)",
        btnClass:
          "bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:bg-transparent dark:text-purple-400 dark:border-purple-500 dark:hover:bg-purple-900/20",
      },
    }),
    [t],
  )

  const { user, isAuthenticated, isAuthLoading, switchRole, resetRole } = useAuth()
  const router = useRouter()
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const customStyles = `
    .material-symbols-outlined {
      font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
    }
    .shadow-card {
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }
    .shadow-card-hover {
      box-shadow: 0 10px 40px -5px rgba(0, 0, 0, 0.1);
    }

    /* Abstract page decorations */
    .role-page-bg {
      position: relative;
      background: #FFFFFF;
    }
    .role-page-bg::before {
      content: '';
      position: absolute;
      top: -120px;
      right: -80px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(27,60,83,0.04) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    .role-page-bg::after {
      content: '';
      position: absolute;
      bottom: 40px;
      left: -60px;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(69,104,130,0.03) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    /* Dot grid pattern overlay */
    .dot-pattern {
      background-image: radial-gradient(circle, rgba(27,60,83,0.04) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    /* Role card glow on hover */
    .role-card {
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .role-card:hover {
      transform: translateY(-6px);
    }

    /* Abstract shape animations */
    @keyframes float-slow {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(3deg); }
    }
    @keyframes float-slower {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(-2deg); }
    }
    @keyframes pulse-subtle {
      0%, 100% { opacity: 0.15; }
      50% { opacity: 0.25; }
    }
    .float-slow { animation: float-slow 6s ease-in-out infinite; }
    .float-slower { animation: float-slower 8s ease-in-out infinite; }
    .pulse-subtle { animation: pulse-subtle 4s ease-in-out infinite; }

    /* Gradient mesh for card headers */
    .mesh-author {
      background:
        radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.6) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(5,150,105,0.4) 0%, transparent 50%),
        radial-gradient(ellipse at 60% 80%, rgba(20,184,166,0.5) 0%, transparent 50%),
        linear-gradient(135deg, #10b981, #059669, #0d9488);
    }
    .mesh-reviewer {
      background:
        radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.6) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.4) 0%, transparent 50%),
        radial-gradient(ellipse at 60% 80%, rgba(79,70,229,0.5) 0%, transparent 50%),
        linear-gradient(135deg, #3b82f6, #2563eb, #4f46e5);
    }
    .mesh-chair {
      background:
        radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.6) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(147,51,234,0.4) 0%, transparent 50%),
        radial-gradient(ellipse at 60% 80%, rgba(126,34,206,0.5) 0%, transparent 50%),
        linear-gradient(135deg, #8b5cf6, #9333ea, #7e22ce);
    }

    /* Icon badge glassmorphism */
    .glass-badge {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.5);
    }

    /* Entry animation */
    @keyframes card-enter {
      from { opacity: 0; transform: translateY(24px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .card-enter { animation: card-enter 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
    .card-enter-1 { animation-delay: 0.08s; }
    .card-enter-2 { animation-delay: 0.16s; }
    .card-enter-3 { animation-delay: 0.24s; }

    @keyframes header-enter {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header-enter { animation: header-enter 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
  `

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
    }
  }, [isAuthLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      resetRole()
    }
  }, [isAuthLoading, isAuthenticated, resetRole])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (isAuthLoading || !isAuthenticated || !user) {
    return null
  }

  const handleRoleSelect = (role: UserRole) => {
    if (!canAccessRole(user, role)) return
    const didSwitchRole = switchRole(role)
    if (!didSwitchRole) return
    router.push(ROUTES.ROLE_ROUTE_MAP[role] ?? ROUTES.ROLE_SELECT)
  }

  const roles = (["author", "reviewer", "chair"] as const).filter((r) => canAccessRole(user, r))

  return (
    <div className="bg-white dark:bg-[#191919] text-slate-800 dark:text-white font-sans min-h-screen flex flex-col md:flex-row overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* Mobile Header */}
      <header className="w-full border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-50 md:hidden flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href={ROUTES.ROLE_SELECT}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="bg-[#0f172a] text-white p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a] dark:text-white">
              {t("runtime.app.role.page.text_conferencespace")}{" "}
            </h1>
          </Link>
          <button className="text-slate-500">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <DashboardSidebar
        menuItems={[
          {
            labelKey: "dashboard.sidebar.nav.common.dashboard",
            href: ROUTES.ROLE_SELECT,
            icon: "dashboard",
          },
          {
            labelKey: "dashboard.sidebar.nav.common.notifications",
            href: ROUTES.NOTIFICATIONS,
            icon: "notifications",
            badge: 3,
          },
        ]}
      />

      {/* Main Content */}
      <main className="flex-grow flex flex-col role-page-bg overflow-y-auto overflow-x-hidden relative">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern pointer-events-none" />

        {/* Floating abstract decorations */}
        <AbstractShape
          className="absolute top-16 right-16 w-20 h-20 rounded-full border border-slate-200/60 dark:border-neutral-700/30 float-slow pointer-events-none"
          style={{ opacity: 0.5 }}
        />
        <AbstractShape className="absolute top-40 right-48 w-3 h-3 rounded-full bg-[#1B3C53]/10 float-slower pointer-events-none" />
        <AbstractShape
          className="absolute bottom-32 left-20 w-16 h-16 rounded-full border border-slate-200/40 dark:border-neutral-700/20 float-slower pointer-events-none"
          style={{ opacity: 0.4 }}
        />
        <AbstractShape className="absolute top-28 left-[40%] w-2 h-2 rounded-full bg-[#456882]/15 pulse-subtle pointer-events-none" />
        <AbstractShape
          className="absolute bottom-48 right-[30%] w-2 h-2 rounded-full bg-[#234C6A]/10 pulse-subtle pointer-events-none"
          style={{ animationDelay: "2s" }}
        />

        {/* Diagonal abstract line */}
        <div
          className="absolute top-0 right-0 w-[1px] h-60 bg-gradient-to-b from-transparent via-slate-200/40 to-transparent pointer-events-none"
          style={{
            transform: "rotate(25deg)",
            transformOrigin: "top right",
            right: "160px",
            top: "40px",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 px-8 md:px-12 py-6 md:py-8 max-w-[1400px] w-full mx-auto">
          <div className="w-full flex flex-col gap-10">
            {/* Welcome Header */}
            <div
              className={`flex flex-col items-start text-left space-y-3 ${mounted ? "header-enter" : "opacity-0"}`}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1B3C53]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {t("runtime.app.role.page.text_role_selection")}{" "}
                </span>
              </div>
              <h2 className="text-[32px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {t("runtime.app.role.page.text_welcome_back")} <br className="md:hidden" />
                <span className="text-[#16a34a]">{user.name.split(" ")[0]}</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl font-light leading-relaxed">
                {t("runtime.app.role.page.text_please_select_the_role_you_wish")}{" "}
              </p>
              {/* Accent divider */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-[2px] bg-[#1B3C53] rounded-full" />
                <div className="w-2 h-[2px] bg-[#1B3C53]/30 rounded-full" />
                <div className="w-1 h-[2px] bg-[#1B3C53]/15 rounded-full" />
              </div>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full pb-10">
              {roles.map((roleKey, idx) => {
                const cfg = ROLE_CONFIG[roleKey]
                const isHovered = hoveredRole === roleKey
                const meshClass =
                  roleKey === "author"
                    ? "mesh-author"
                    : roleKey === "reviewer"
                      ? "mesh-reviewer"
                      : "mesh-chair"

                return (
                  <div
                    key={roleKey}
                    className={`role-card card-enter card-enter-${idx + 1} group relative flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-card overflow-hidden h-full cursor-pointer ${mounted ? "" : "opacity-0"}`}
                    style={{
                      boxShadow: isHovered
                        ? `0 20px 60px -10px ${cfg.shadowColor}, 0 0 0 1px ${cfg.borderGlow}`
                        : undefined,
                    }}
                    onMouseEnter={() => setHoveredRole(roleKey)}
                    onMouseLeave={() => setHoveredRole(null)}
                    onClick={() => handleRoleSelect(roleKey)}
                  >
                    {/* Gradient Header with Abstract Shapes */}
                    <div className={`h-36 w-full ${meshClass} relative overflow-hidden`}>
                      {/* Abstract geometric shapes per role */}
                      {roleKey === "author" && (
                        <>
                          {/* Overlapping circles - collaboration */}
                          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-2 border-white/15" />
                          <div className="absolute right-8 top-4 w-20 h-20 rounded-full border border-white/10" />
                          <div className="absolute -right-2 bottom-0 w-24 h-24 rounded-full bg-white/5" />
                          <div className="absolute left-1/2 -bottom-8 w-40 h-40 rounded-full bg-white/[0.03]" />
                          {/* Small accent dots */}
                          <div className="absolute top-6 right-20 w-1.5 h-1.5 rounded-full bg-white/30" />
                          <div className="absolute top-16 right-12 w-1 h-1 rounded-full bg-white/20" />
                        </>
                      )}
                      {roleKey === "reviewer" && (
                        <>
                          {/* Angular shapes - precision */}
                          <div
                            className="absolute -right-4 top-2 w-24 h-24 border border-white/10"
                            style={{ transform: "rotate(45deg)" }}
                          />
                          <div
                            className="absolute right-12 -top-4 w-16 h-16 border border-white/[0.07]"
                            style={{ transform: "rotate(30deg)" }}
                          />
                          <div className="absolute -left-4 -bottom-4 w-32 h-32 rounded-full bg-white/[0.04]" />
                          <div
                            className="absolute right-1/3 bottom-2 w-12 h-12 border border-white/[0.08]"
                            style={{ transform: "rotate(15deg)" }}
                          />
                          <div className="absolute top-8 left-[60%] w-1 h-1 rounded-full bg-white/25" />
                        </>
                      )}
                      {roleKey === "chair" && (
                        <>
                          {/* Concentric arcs - governance */}
                          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10" />
                          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full border border-white/[0.07]" />
                          <div className="absolute -right-2 -top-2 w-24 h-24 rounded-full border border-white/[0.04]" />
                          <div className="absolute left-4 -bottom-6 w-20 h-20 rounded-full bg-white/[0.05]" />
                          <div className="absolute top-10 left-8 w-1.5 h-1.5 rounded-full bg-white/20" />
                          <div className="absolute bottom-6 left-1/2 w-1 h-1 rounded-full bg-white/15" />
                        </>
                      )}

                      {/* Icon + label in the gradient zone */}
                      <div className="absolute bottom-4 left-5 z-20 flex items-end gap-3">
                        <div className="glass-badge w-11 h-11 rounded-xl flex items-center justify-center shadow-lg">
                          <span
                            className="material-symbols-outlined text-xl"
                            style={{ color: cfg.accentColor }}
                          >
                            {cfg.icon}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 pb-0.5">
                          <h3 className="text-xl font-bold text-white leading-none tracking-tight">
                            {cfg.title}
                          </h3>
                          <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.2em]">
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Subtle bottom gradient fade */}
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
                    </div>

                    {/* Card Body */}
                    <div className="px-5 pt-5 pb-4 flex flex-col flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                        {cfg.description}
                      </p>

                      {/* Stats / Meta row */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{
                              backgroundColor: cfg.accentColor,
                              opacity: 0.6,
                            }}
                          />
                          <span className="text-[10px] font-medium text-slate-400">
                            {roleKey === "author"
                              ? "Submit & Track"
                              : roleKey === "reviewer"
                                ? "Review & Score"
                                : "Govern & Manage"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{
                              backgroundColor: cfg.accentColor,
                              opacity: 0.4,
                            }}
                          />
                          <span className="text-[10px] font-medium text-slate-400">
                            {t("runtime.app.role.page.text_full_access")}{" "}
                          </span>
                        </div>
                      </div>

                      {/* Enter Button */}
                      <div className="mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRoleSelect(roleKey)
                          }}
                          className={`w-full py-2.5 px-5 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 group/btn ${cfg.btnClass}`}
                        >
                          {t("runtime.app.role.page.text_enter_dashboard")}{" "}
                          <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

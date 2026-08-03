"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/lib/auth-context"
import { getSidebarMenuItems } from "@/lib/navigation"
import { ROUTES } from "@/lib/routes"
import type { UserRole } from "@/lib/types"
import { useNotifications } from "@/hooks/use-notifications"
import { useTranslation } from "@/lib/i18n/translation-context"
import {
  buildQuickStartSteps,
  buildRunbookStages,
  buildTutorial,
  getTutorialRoles,
} from "@/lib/onboarding-content"
import type { TutorialRole } from "@/lib/onboarding-structure"
import { ROLE_THEMES } from "@/lib/onboarding-structure"

function getDefaultTutorialRole(currentRole: UserRole | null): TutorialRole {
  if (currentRole === "author" || currentRole === "reviewer" || currentRole === "chair") {
    return currentRole
  }
  return "chair"
}

function ScreenshotFrame({ src, alt, role }: { src: string; alt: string; role: TutorialRole }) {
  const { t } = useTranslation()
  const [isAvailable, setIsAvailable] = useState(true)
  const theme = ROLE_THEMES[role]

  useEffect(() => {
    setIsAvailable(true)
  }, [src])

  if (!isAvailable) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-[8px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <div>
          <span className="material-symbols-outlined text-3xl text-slate-400">image</span>
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {t("dashboard.onboarding.page.screenshotPlaceholder")}
          </p>
          <code className="mt-1 block break-all text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {src}
          </code>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group/screen onboarding-glint relative overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm ring-1 ${theme.ring} transition duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950`}
    >
      <div className="flex h-8 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 dark:border-neutral-800 dark:bg-neutral-900">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-2 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {t("dashboard.onboarding.page.brandLabel")}
        </span>
      </div>
      <Image
        src={src}
        alt={alt}
        width={1440}
        height={1050}
        loading="lazy"
        className="aspect-[16/9] w-full bg-slate-100 object-cover object-top transition duration-500 group-hover/screen:scale-[1.01] dark:bg-neutral-900"
        onError={() => setIsAvailable(false)}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/18 to-transparent opacity-0 transition duration-500 group-hover/screen:opacity-100" />
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { t, tList } = useTranslation()
  const { user, isAuthenticated, isAuthLoading, currentRole } = useAuth()
  const { unreadCount } = useNotifications({ limit: 1 })
  const defaultRole = useMemo(() => getDefaultTutorialRole(currentRole), [currentRole])
  const [activeRole, setActiveRole] = useState<TutorialRole>(defaultRole)
  const sidebarRole = currentRole ?? defaultRole
  const tutorialRoles = getTutorialRoles()
  const tutorials = useMemo(
    () =>
      Object.fromEntries(tutorialRoles.map((role) => [role, buildTutorial(role, t, tList)])) as Record<
        TutorialRole,
        ReturnType<typeof buildTutorial>
      >,
    [t, tList, tutorialRoles],
  )
  const quickStartSteps = useMemo(() => buildQuickStartSteps(t), [t])
  const runbookStages = useMemo(() => buildRunbookStages(t), [t])

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
    }
  }, [isAuthLoading, isAuthenticated, router])

  useEffect(() => {
    setActiveRole(defaultRole)
  }, [defaultRole])

  if (isAuthLoading || !isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#f8fafc] font-sans text-slate-800 dark:bg-[#191919] dark:text-white md:flex-row">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes onboarding-fade-up {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes onboarding-line {
              from { transform: scaleY(0); }
              to { transform: scaleY(1); }
            }
            @keyframes onboarding-glint {
              0%, 72% { transform: translateX(-120%); opacity: 0; }
              82% { opacity: 0.16; }
              100% { transform: translateX(120%); opacity: 0; }
            }
            .onboarding-enter {
              animation: onboarding-fade-up 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .onboarding-ledger {
              background-image:
                linear-gradient(to right, rgba(15, 23, 42, 0.055) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
              background-size: 28px 28px;
            }
            .onboarding-line {
              transform-origin: top;
              animation: onboarding-line 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .onboarding-glint::after {
              content: "";
              position: absolute;
              inset: 0;
              background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.8), transparent 65%);
              animation: onboarding-glint 5200ms ease-in-out infinite;
              pointer-events: none;
            }
            @media (prefers-reduced-motion: reduce) {
              .onboarding-enter,
              .onboarding-line,
              .onboarding-glint::after {
                animation: none;
              }
              .onboarding-enter {
                opacity: 1;
                transform: none;
              }
            }
            @media (max-width: 640px) {
              button[data-chatbot-ui="true"] {
                bottom: 1rem !important;
                right: 1rem !important;
                height: 2.75rem !important;
                width: 2.75rem !important;
              }
            }
          `,
        }}
      />
      <DashboardSidebar menuItems={getSidebarMenuItems(sidebarRole, unreadCount)} />

      <main className="flex h-screen flex-grow flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto onboarding-ledger px-5 py-6 pb-24 sm:px-8 md:px-12 md:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <section className="onboarding-enter overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="p-5 sm:p-7">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#1B3C53] dark:text-slate-200">
                    <span className="material-symbols-outlined text-base">route</span>
                    {t("dashboard.onboarding.page.eyebrow")}
                  </div>
                  <h1 className="mt-3 max-w-4xl text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">
                    {t("dashboard.onboarding.page.title")}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t("dashboard.onboarding.page.description")}
                  </p>

                  <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {quickStartSteps.map((item, index) => (
                      <div
                        key={item.label}
                        className="rounded-[8px] border border-slate-200 bg-slate-50/80 p-3 transition duration-200 hover:border-slate-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/70"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#1B3C53] shadow-sm dark:bg-neutral-900 dark:text-slate-100">
                            <span className="material-symbols-outlined text-base">{item.icon}</span>
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-[#102A43] p-5 text-white dark:border-neutral-800 lg:border-l lg:border-t-0 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                        {t("dashboard.onboarding.page.workflowTitle")}
                      </p>
                      <h2 className="mt-2 text-lg font-black leading-tight">
                        {t("dashboard.onboarding.page.workflowSubtitle")}
                      </h2>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-white/10">
                      <span className="material-symbols-outlined text-2xl">account_tree</span>
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    {runbookStages.map((stage, index) => {
                      const stageTheme = ROLE_THEMES[stage.role]
                      const isActiveStage = activeRole === stage.role

                      return (
                        <button
                          key={`${stage.label}-${index}`}
                          type="button"
                          onClick={() => setActiveRole(stage.role)}
                          className={`group/stage relative flex w-full items-center gap-3 rounded-[8px] border p-3 text-left transition duration-300 ${
                            isActiveStage
                              ? "border-white/35 bg-white text-slate-950 shadow-lg"
                              : "border-white/15 bg-white/[0.07] text-white hover:border-white/30 hover:bg-white/[0.12]"
                          }`}
                        >
                          {index < runbookStages.length - 1 && (
                            <span
                              className="onboarding-line absolute left-[27px] top-[calc(100%-2px)] h-5 w-px bg-white/25"
                              style={{ animationDelay: `${index * 120}ms` }}
                            />
                          )}
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                            style={{ backgroundColor: stageTheme.accent }}
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-black">{stage.label}</span>
                            <span
                              className={`mt-0.5 block text-xs leading-5 ${
                                isActiveStage ? "text-slate-500" : "text-slate-300"
                              }`}
                            >
                              {stage.detail}
                            </span>
                          </span>
                          <span className="material-symbols-outlined text-base opacity-70 transition duration-200 group-hover/stage:translate-x-0.5">
                            arrow_forward
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 rounded-[8px] border border-white/15 bg-white/[0.08] p-3">
                    <p className="text-xs font-bold leading-5 text-slate-100">
                      {t("dashboard.onboarding.page.tip")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Tabs
              value={activeRole}
              onValueChange={(value) => setActiveRole(value as TutorialRole)}
              className="gap-5"
              id="onboarding-journey"
            >
              <div className="sticky top-0 z-20 flex flex-col gap-3 rounded-[8px] border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 sm:flex-row sm:items-center sm:justify-between">
                <div className="hidden px-2 sm:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {t("dashboard.onboarding.page.selectGuide")}
                  </p>
                </div>
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-[8px] bg-slate-100 p-1 dark:bg-neutral-950 sm:w-fit">
                  {tutorialRoles.map((role) => (
                    <TabsTrigger
                      key={role}
                      value={role}
                      className="gap-2 rounded-[7px] px-3 py-2.5 text-xs font-black transition duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-white sm:px-5"
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{
                          color: activeRole === role ? ROLE_THEMES[role].accent : undefined,
                        }}
                      >
                        {tutorials[role].icon}
                      </span>
                      {tutorials[role].label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {tutorialRoles.map((role) => {
                const tutorial = tutorials[role]

                return (
                  <TabsContent key={role} value={role} className="mt-0 onboarding-enter">
                    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
                      <div className="min-w-0">
                        <div
                          className={`mb-5 overflow-hidden rounded-[8px] border border-slate-200 bg-gradient-to-br p-5 shadow-sm dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 sm:p-6 ${ROLE_THEMES[role].panel}`}
                        >
                          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                            <div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${ROLE_THEMES[role].accentSoft}`}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {tutorial.icon}
                                </span>
                                {tutorial.eyebrow}
                              </span>
                              <h2 className="mt-3 max-w-3xl text-xl font-black leading-tight text-slate-950 dark:text-white md:text-2xl">
                                {tutorial.title}
                              </h2>
                              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {tutorial.summary}
                              </p>
                            </div>
                            <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-[240px]">
                              <div className="rounded-[8px] border border-white bg-white/85 px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                                <p className="text-2xl font-black text-slate-950 dark:text-white">
                                  {tutorial.steps.length}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  {t("dashboard.onboarding.page.stepsLabel")}
                                </p>
                              </div>
                              <div className="rounded-[8px] border border-white bg-white/85 px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                                <p className="text-2xl font-black text-slate-950 dark:text-white">
                                  {tutorial.checkpoints.length}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  {t("dashboard.onboarding.page.checkpointsLabel")}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 rounded-[8px] border border-slate-200 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-950/70">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                              {t("dashboard.onboarding.page.youWillLearn")}
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                              {tutorial.outcome}
                            </p>
                          </div>
                        </div>

                        <div className="relative space-y-5 before:absolute before:left-5 before:top-8 before:hidden before:h-[calc(100%-4rem)] before:w-px before:bg-slate-200 dark:before:bg-neutral-800 md:before:block">
                          {tutorial.steps.map((step, index) => (
                            <Card
                              key={step.title}
                              className="group/step onboarding-enter overflow-hidden rounded-[8px] border-slate-200 bg-white py-0 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                              style={{ animationDelay: `${index * 90}ms` }}
                            >
                              <CardContent className="grid gap-0 p-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(430px,1.1fr)]">
                                <div className="flex flex-col gap-4 p-5 sm:p-6">
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-lg ${ROLE_THEMES[role].step}`}
                                    >
                                      {index + 1}
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                        {t("dashboard.onboarding.page.screenLabel", {
                                          number: index + 1,
                                        })}
                                      </p>
                                      <h3 className="mt-1 text-base font-black leading-tight text-slate-950 dark:text-white md:text-lg">
                                        {step.title}
                                      </h3>
                                    </div>
                                  </div>

                                  <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    {step.bullets.map((bullet) => (
                                      <li key={bullet} className="flex gap-2">
                                        <span className="material-symbols-outlined mt-0.5 text-base text-emerald-600">
                                          check_circle
                                        </span>
                                        <span>{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  <Button
                                    asChild
                                    variant="outline"
                                    className="mt-auto w-fit rounded-[8px] bg-white transition duration-300 group-hover/step:border-slate-400 dark:bg-neutral-950"
                                  >
                                    <Link href={step.href}>
                                      {step.actionLabel}
                                      <span className="material-symbols-outlined text-base">
                                        arrow_forward
                                      </span>
                                    </Link>
                                  </Button>
                                </div>

                                <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950 xl:border-l xl:border-t-0">
                                  <ScreenshotFrame src={step.image} alt={step.title} role={role} />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <aside className="h-fit rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[8px] text-white shadow-lg"
                          style={{ backgroundColor: ROLE_THEMES[role].accent }}
                        >
                          <span className="material-symbols-outlined text-2xl">
                            {tutorial.icon}
                          </span>
                        </div>
                        <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white md:text-lg">
                          {t("dashboard.onboarding.page.prepareTitle")}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {t("dashboard.onboarding.page.prepareDescription")}
                        </p>

                        <div className="my-5 h-px bg-slate-200 dark:bg-neutral-800" />

                        <h4 className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                          <span className="material-symbols-outlined text-lg text-[#1B3C53]">
                            checklist
                          </span>
                          {t("dashboard.onboarding.page.prepareChecklist")}
                        </h4>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {tutorial.checkpoints.map((checkpoint) => (
                            <li key={checkpoint} className="flex gap-2">
                              <span
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: ROLE_THEMES[role].accent }}
                              />
                              <span>{checkpoint}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          asChild
                          className="mt-5 w-full rounded-[8px] text-white hover:opacity-90"
                          style={{ backgroundColor: ROLE_THEMES[role].accent }}
                        >
                          <Link href={tutorial.steps[0]?.href ?? ROUTES.ROLE_SELECT}>
                            {t("dashboard.onboarding.page.openFirstScreen")}
                            <span className="material-symbols-outlined text-base">
                              arrow_forward
                            </span>
                          </Link>
                        </Button>
                      </aside>
                    </section>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

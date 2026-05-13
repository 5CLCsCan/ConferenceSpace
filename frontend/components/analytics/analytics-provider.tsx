"use client"

import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { useAuth } from "@/lib/auth-context"
import {
  flushAnalytics,
  setAnalyticsContext,
  startAnalyticsFlushTimer,
  stopAnalyticsFlushTimer,
  trackEvent,
  trackFlowStep,
} from "@/lib/analytics"

const IDLE_AFTER_MS = 60_000

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, currentRole } = useAuth()
  const activeStartedAtRef = useRef<number | null>(null)
  const activeMsRef = useRef(0)
  const lastActivityAtRef = useRef(0)
  const previousPathRef = useRef<string | null>(null)

  useEffect(() => {
    setAnalyticsContext({ user, role: currentRole, route: pathname })
  }, [currentRole, pathname, user])

  useEffect(() => {
    if (!user) return

    startAnalyticsFlushTimer()

    return () => {
      void flushAnalytics()
      stopAnalyticsFlushTimer()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const previousPath = previousPathRef.current
    if (previousPath && previousPath !== pathname) {
      emitActiveTime(previousPath)
      void flushAnalytics()
    }

    previousPathRef.current = pathname
    trackEvent("page_view", {
      eventType: "page_view",
      route: pathname,
      feature: resolveFeature(pathname),
      metadata: { path_template: templatePath(pathname) },
    })
    trackRouteFlowStep(pathname)
  }, [pathname, user])

  useEffect(() => {
    if (!user) return

    const markActive = () => {
      const now = Date.now()
      lastActivityAtRef.current = now
      if (activeStartedAtRef.current === null) {
        activeStartedAtRef.current = now
      }
    }

    const settleIdleTime = () => {
      const startedAt = activeStartedAtRef.current
      if (startedAt === null) return

      const now = Date.now()
      const activeUntil = Math.min(now, lastActivityAtRef.current + IDLE_AFTER_MS)
      if (activeUntil > startedAt) {
        activeMsRef.current += activeUntil - startedAt
      }
      activeStartedAtRef.current = null
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        emitActiveTime(pathname, settleIdleTime)
        void flushAnalytics({ useBeacon: true })
      } else {
        markActive()
      }
    }

    const onBeforeUnload = () => {
      emitActiveTime(pathname, settleIdleTime)
      void flushAnalytics({ useBeacon: true })
    }

    const idleInterval = window.setInterval(() => {
      if (
        activeStartedAtRef.current !== null &&
        Date.now() - lastActivityAtRef.current >= IDLE_AFTER_MS
      ) {
        settleIdleTime()
      }
    }, 5000)

    markActive()
    window.addEventListener("click", markActive, { passive: true })
    window.addEventListener("keydown", markActive)
    window.addEventListener("scroll", markActive, { passive: true })
    window.addEventListener("pointermove", markActive, { passive: true })
    window.addEventListener("input", markActive)
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("beforeunload", onBeforeUnload)

    return () => {
      window.clearInterval(idleInterval)
      window.removeEventListener("click", markActive)
      window.removeEventListener("keydown", markActive)
      window.removeEventListener("scroll", markActive)
      window.removeEventListener("pointermove", markActive)
      window.removeEventListener("input", markActive)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("beforeunload", onBeforeUnload)
      emitActiveTime(pathname, settleIdleTime)
    }
  }, [pathname, user])

  function emitActiveTime(route: string, settle?: () => void) {
    settle?.()
    const activeMs = Math.round(activeMsRef.current)
    if (activeMs <= 0) return

    activeMsRef.current = 0
    trackEvent("page_active_time", {
      eventType: "timing",
      route,
      feature: resolveFeature(route),
      activeMs,
      metadata: { path_template: templatePath(route) },
    })
  }

  return <>{children}</>
}

function trackRouteFlowStep(pathname: string) {
  if (pathname === "/role/author") {
    trackFlowStep("author_submission", "author_dashboard_opened", 1, {
      feature: "submission",
      route: pathname,
    })
    return
  }

  if (/^\/role\/author\/conferences\/[^/]+$/.test(pathname)) {
    trackFlowStep("author_submission", "conference_opened", 2, {
      feature: "conference_management",
      route: pathname,
    })
    return
  }

  if (pathname === "/role/author/submissions/new") {
    trackFlowStep("author_submission", "submission_draft_started", 3, {
      feature: "submission",
      route: pathname,
    })
    return
  }

  if (pathname === "/role/reviewer") {
    trackFlowStep("reviewer_review", "reviewer_dashboard_opened", 1, {
      feature: "review",
      route: pathname,
    })
    return
  }

  if (/^\/role\/reviewer\/assignments\/[^/]+$/.test(pathname)) {
    trackFlowStep("reviewer_review", "assignment_opened", 2, {
      feature: "review",
      route: pathname,
    })
    trackFlowStep("reviewer_review", "review_form_started", 4, {
      feature: "review",
      route: pathname,
    })
    return
  }

  if (pathname === "/role/chair") {
    trackFlowStep("chair_assignment", "chair_dashboard_opened", 1, {
      feature: "reviewer_matching",
      route: pathname,
    })
    return
  }

  if (/^\/role\/chair\/conferences\/[^/]+$/.test(pathname)) {
    trackFlowStep("chair_assignment", "conference_opened", 2, {
      feature: "conference_management",
      route: pathname,
    })
  }
}

function resolveFeature(pathname: string) {
  if (pathname.includes("/submissions")) return "submission"
  if (pathname.includes("/assignments")) return "review"
  if (pathname.includes("/notifications")) return "notification"
  if (pathname.includes("/conferences")) return "conference_management"
  if (pathname.includes("/reviewer")) return "review"
  if (pathname.includes("/chair")) return "reviewer_matching"
  if (pathname.includes("/author")) return "submission"
  return "navigation"
}

function templatePath(pathname: string) {
  return pathname.replace(/\/\d+(?=\/|$)/g, "/:id").replace(/\/[0-9a-fA-F-]{12,}(?=\/|$)/g, "/:id")
}

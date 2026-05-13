"use client"

import type { User, UserRole } from "./types"

export type AnalyticsEventType = "page_view" | "feature" | "flow_step" | "timing"

type AnalyticsMetadata = Record<string, unknown>

type QueuedAnalyticsEvent = {
  event_id: string
  event_name: string
  event_type: AnalyticsEventType
  route: string
  role?: UserRole
  feature?: string
  flow_id?: string
  flow_name?: string
  step_name?: string
  step_index?: number
  active_ms?: number
  metadata?: AnalyticsMetadata
  occurred_at: string
}

type AnalyticsContext = {
  user?: User | null
  role?: UserRole | null
  route?: string
}

type TrackPayload = {
  eventType?: AnalyticsEventType
  route?: string
  role?: UserRole
  feature?: string
  flowId?: string
  flowName?: string
  stepName?: string
  stepIndex?: number
  activeMs?: number
  metadata?: AnalyticsMetadata
}

const SESSION_KEY = "cs_analytics_session_id"
const FLOW_PREFIX = "cs_analytics_flow:"
const FLUSH_INTERVAL_MS = 8000
const MAX_BATCH_SIZE = 50
const ANALYTICS_ENDPOINT = "/api/backend/api/v1/analytics/events"

let context: AnalyticsContext = {}
let queue: QueuedAnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let isFlushing = false

function isBrowser() {
  return typeof window !== "undefined"
}

function uuid() {
  if (isBrowser() && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  )
}

function getSessionStorage(): Storage | null {
  if (!isBrowser()) return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function getAnalyticsSessionId() {
  const storage = getSessionStorage()
  if (!storage) return uuid()

  const existing = storage.getItem(SESSION_KEY)
  if (existing) return existing

  const next = uuid()
  storage.setItem(SESSION_KEY, next)
  return next
}

export function setAnalyticsContext(nextContext: AnalyticsContext) {
  context = {
    ...context,
    ...nextContext,
  }
}

export function startFlow(flowName: string) {
  const storage = getSessionStorage()
  const key = `${FLOW_PREFIX}${flowName}`
  const existing = storage?.getItem(key)
  if (existing) return existing

  const flowId = uuid()
  storage?.setItem(key, flowId)
  return flowId
}

export function getFlowId(flowName: string) {
  return getSessionStorage()?.getItem(`${FLOW_PREFIX}${flowName}`) ?? null
}

export function endFlow(
  flowId: string,
  status: "completed" | "abandoned" | "cancelled" = "completed",
) {
  const storage = getSessionStorage()
  if (storage) {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i)
      if (key?.startsWith(FLOW_PREFIX) && storage.getItem(key) === flowId) {
        storage.removeItem(key)
      }
    }
  }
  trackEvent("flow_ended", {
    eventType: "feature",
    feature: "workflow",
    flowId,
    metadata: { status },
  })
}

export function trackEvent(eventName: string, payload: TrackPayload = {}) {
  if (!isBrowser() || !context.user) return

  const event: QueuedAnalyticsEvent = {
    event_id: uuid(),
    event_name: eventName,
    event_type: payload.eventType ?? "feature",
    route: payload.route ?? context.route ?? window.location.pathname,
    role: payload.role ?? context.role ?? undefined,
    feature: payload.feature,
    flow_id: payload.flowId,
    flow_name: payload.flowName,
    step_name: payload.stepName,
    step_index: payload.stepIndex,
    active_ms: payload.activeMs,
    metadata: sanitizeMetadata(payload.metadata),
    occurred_at: new Date().toISOString(),
  }

  queue.push(event)

  if (queue.length >= MAX_BATCH_SIZE) {
    void flushAnalytics()
  }
}

export function trackFlowStep(
  flowName: string,
  stepName: string,
  stepIndex: number,
  payload: Omit<TrackPayload, "eventType" | "flowId" | "flowName" | "stepName" | "stepIndex"> = {},
) {
  const flowId = startFlow(flowName)
  trackEvent(stepName, {
    ...payload,
    eventType: "flow_step",
    flowId,
    flowName,
    stepName,
    stepIndex,
  })
  return flowId
}

export async function flushAnalytics(options: { useBeacon?: boolean } = {}) {
  if (!isBrowser() || isFlushing || queue.length === 0 || !context.user) return

  const events = queue.splice(0, MAX_BATCH_SIZE)
  const payload = JSON.stringify({
    session_id: getAnalyticsSessionId(),
    events,
  })

  if (options.useBeacon && navigator.sendBeacon) {
    const accepted = navigator.sendBeacon(
      ANALYTICS_ENDPOINT,
      new Blob([payload], { type: "application/json" }),
    )
    if (!accepted) {
      queue = [...events, ...queue]
    }
    return
  }

  isFlushing = true
  try {
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: payload,
      keepalive: events.length <= 10,
    })
    if (!response.ok) {
      queue = [...events, ...queue]
    }
  } catch {
    queue = [...events, ...queue]
  } finally {
    isFlushing = false
  }
}

export function startAnalyticsFlushTimer() {
  if (!isBrowser() || flushTimer) return
  flushTimer = setInterval(() => {
    void flushAnalytics()
  }, FLUSH_INTERVAL_MS)
}

export function stopAnalyticsFlushTimer() {
  if (!flushTimer) return
  clearInterval(flushTimer)
  flushTimer = null
}

export function getQueuedAnalyticsCount() {
  return queue.length
}

export function resetAnalyticsForTests() {
  queue = []
  context = {}
  isFlushing = false
  stopAnalyticsFlushTimer()
}

function sanitizeMetadata(metadata?: AnalyticsMetadata) {
  if (!metadata) return undefined

  const sanitized: AnalyticsMetadata = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (/comment|content|abstract|message|password|token|text|review/i.test(key)) {
      continue
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value
    } else if (value === null) {
      sanitized[key] = null
    }
  }
  return sanitized
}

export function trackApiSuccess(path: string, method: string) {
  const normalizedMethod = method.toUpperCase()
  const route = context.route

  if (/\/api\/v1\/conferences\/\d+\/submissions$/.test(path) && normalizedMethod === "POST") {
    trackFlowStep("author_submission", "submission_metadata_completed", 4, {
      feature: "submission",
      route,
    })
    trackFlowStep("author_submission", "submission_file_uploaded", 5, {
      feature: "submission",
      route,
    })
    return
  }

  if (/\/api\/v1\/conferences\/\d+\/submissions\/\d+\/publish$/.test(path)) {
    const flowId = trackFlowStep("author_submission", "submission_published", 6, {
      feature: "submission",
      route,
    })
    endFlow(flowId, "completed")
    return
  }

  if (
    /\/api\/v1\/conferences\/\d+\/assignments\/\d+\/review$/.test(path) &&
    normalizedMethod === "PUT"
  ) {
    trackFlowStep("reviewer_review", "review_saved", 5, {
      feature: "review",
      route,
    })
    return
  }

  if (/\/api\/v1\/conferences\/\d+\/submissions\/\d+\/file$/.test(path)) {
    trackFlowStep("reviewer_review", "paper_file_opened", 3, {
      feature: "review",
      route,
    })
    return
  }

  if (/\/api\/v1\/conferences\/\d+\/reviewers$/.test(path) && normalizedMethod === "POST") {
    trackFlowStep("chair_assignment", "reviewer_selected", 5, {
      feature: "reviewer_matching",
      route,
    })
    trackFlowStep("chair_assignment", "reviewer_invited", 6, {
      feature: "reviewer_invitation",
      route,
    })
    return
  }

  if (
    /\/api\/v1\/conferences\/\d+\/reviewer-suggestions/.test(path) &&
    normalizedMethod === "GET"
  ) {
    trackFlowStep("chair_assignment", "reviewer_suggestions_opened", 3, {
      feature: "reviewer_matching",
      route,
    })
    trackFlowStep("chair_assignment", "match_detail_opened", 4, {
      feature: "reviewer_matching",
      route,
    })
    return
  }

  if (/\/api\/v1\/conferences\/\d+\/assignments\/suggestions\/confirm$/.test(path)) {
    trackFlowStep("chair_assignment", "reviewer_selected", 5, {
      feature: "reviewer_matching",
      route,
    })
    const flowId = trackFlowStep("chair_assignment", "assignments_confirmed", 7, {
      feature: "reviewer_matching",
      route,
    })
    endFlow(flowId, "completed")
    return
  }

  if (/\/review-audit$/.test(path) && normalizedMethod === "POST") {
    trackEvent("review_audit_opened", { feature: "review_audit", route })
    return
  }

  if (/\/briefing\/generate$/.test(path)) {
    trackEvent("reviewer_briefing_generated", { feature: "reviewer_briefing", route })
    return
  }

  if (/\/paper-annotation\/generate$/.test(path)) {
    trackEvent("paper_annotation_generated", { feature: "paper_annotation", route })
    return
  }

  if (/\/rebuttal$/.test(path) && normalizedMethod === "PUT") {
    trackEvent("rebuttal_submitted", { feature: "rebuttal", route })
  }
}

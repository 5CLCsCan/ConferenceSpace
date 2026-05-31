import { apiFetch } from "@/lib/api/client"

export interface UsageEventInput {
  sessionId?: string
  role?: string
  pagePath?: string
  entityType?: string
  entityId?: string | number
  success?: boolean
  metadata?: Record<string, unknown>
}

interface UsageEventPayload {
  session_id: string
  role?: string
  event_name: string
  page_path?: string
  entity_type?: string
  entity_id?: string
  success?: boolean
  metadata?: Record<string, unknown>
}

const STORAGE_KEY = "conference_usage_session_id"
const FLUSH_INTERVAL_MS = 5000
const MAX_BATCH_SIZE = 20

let queue: UsageEventPayload[] = []
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushInFlight = false
let flushListenersRegistered = false

export function trackUsageEvent(eventName: string, options: UsageEventInput = {}) {
  if (typeof window === "undefined") return
  if (!eventName.trim()) return
  ensureFlushListeners()

  queue.push({
    session_id: options.sessionId || getUsageSessionId(),
    role: options.role,
    event_name: eventName,
    page_path: options.pagePath || `${window.location.pathname}${window.location.search}`,
    entity_type: options.entityType,
    entity_id: options.entityId === undefined ? undefined : String(options.entityId),
    success: options.success,
    metadata: options.metadata,
  })

  if (queue.length >= MAX_BATCH_SIZE) {
    void flushUsageEvents()
    return
  }

  scheduleFlush()
}

export async function flushUsageEvents() {
  if (flushInFlight || queue.length === 0) return
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = undefined
  }

  const events = queue
  queue = []
  flushInFlight = true

  try {
    await apiFetch("/api/v1/usage-events", {
      method: "POST",
      body: JSON.stringify({ events }),
    })
  } catch {
    // Usage analytics must never interrupt product workflows.
  } finally {
    flushInFlight = false
    if (queue.length > 0) scheduleFlush()
  }
}

export function getUsageSessionId() {
  if (typeof window === "undefined") return "server"

  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `usage-${Date.now()}-${Math.random().toString(16).slice(2)}`
  window.localStorage.setItem(STORAGE_KEY, generated)
  return generated
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = undefined
    void flushUsageEvents()
  }, FLUSH_INTERVAL_MS)
}

function ensureFlushListeners() {
  if (flushListenersRegistered || typeof window === "undefined") return
  flushListenersRegistered = true

  window.addEventListener("pagehide", () => {
    void flushUsageEvents()
  })

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushUsageEvents()
    }
  })
}

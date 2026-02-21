const STORAGE_KEY = "reviewer.assignment-conference-context"

const memoryCache = new Map<string, string>()

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
}

function readCache(): Record<string, string> {
  if (!canUseSessionStorage()) {
    return {}
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") {
      return {}
    }
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

function writeCache(cache: Record<string, string>) {
  if (!canUseSessionStorage()) {
    return
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}

export function getAssignmentConferenceContext(assignmentId: string): string | null {
  const cachedMemory = memoryCache.get(String(assignmentId))
  if (cachedMemory) {
    return cachedMemory
  }

  const cache = readCache()
  const cachedStorage = cache[String(assignmentId)]
  if (!cachedStorage) {
    return null
  }

  memoryCache.set(String(assignmentId), cachedStorage)
  return cachedStorage
}

export function setAssignmentConferenceContext(assignmentId: string, conferenceId: string) {
  const normalizedAssignmentId = String(assignmentId)
  const normalizedConferenceId = String(conferenceId)

  memoryCache.set(normalizedAssignmentId, normalizedConferenceId)

  const cache = readCache()
  cache[normalizedAssignmentId] = normalizedConferenceId
  writeCache(cache)
}

export function clearAssignmentConferenceContext(assignmentId: string) {
  const normalizedAssignmentId = String(assignmentId)
  memoryCache.delete(normalizedAssignmentId)

  const cache = readCache()
  delete cache[normalizedAssignmentId]
  writeCache(cache)
}

import { beforeEach, describe, expect, it, vi } from "vitest"
import { ROLE_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/config"
import { canAccessRole, getAccessibleRoles } from "@/lib/role-access"
import type { User } from "@/lib/types"

function createUser(email: string, roles: User["roles"] = ["author"]): User {
  return {
    id: "1",
    name: "Test User",
    email,
    roles,
    expertise: [],
  }
}

async function loadSessionManager() {
  vi.resetModules()
  const { sessionManager } = await import("@/lib/session-manager")
  return sessionManager
}

describe("session-manager persistence", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it("writes session data to sessionStorage when rememberMe is false", async () => {
    const sessionManager = await loadSessionManager()
    const user = createUser("session@example.com")

    sessionManager.setUser(user, true, false)

    expect(window.sessionStorage.getItem(USER_STORAGE_KEY)).not.toBeNull()
    expect(window.localStorage.getItem(USER_STORAGE_KEY)).toBeNull()
  })

  it("writes session data to localStorage when rememberMe is true", async () => {
    const sessionManager = await loadSessionManager()
    const user = createUser("local@example.com")

    sessionManager.setUser(user, true, true)

    expect(window.localStorage.getItem(USER_STORAGE_KEY)).not.toBeNull()
    expect(window.sessionStorage.getItem(USER_STORAGE_KEY)).toBeNull()
  })

  it("loads sessionStorage first when both storages have user data", async () => {
    const sessionUser = createUser("session-priority@example.com", ["reviewer"])
    const localUser = createUser("local-fallback@example.com", ["author"])

    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser))
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, "reviewer")
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(localUser))
    window.localStorage.setItem(ROLE_STORAGE_KEY, "author")

    const sessionManager = await loadSessionManager()

    expect(sessionManager.getUser()?.email).toBe(sessionUser.email)
    expect(sessionManager.getRole()).toBe("reviewer")
    expect(window.localStorage.getItem(USER_STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem(ROLE_STORAGE_KEY)).toBeNull()
  })

  it("clearSession removes auth state from both storages", async () => {
    const sessionManager = await loadSessionManager()
    const user = createUser("clear@example.com")

    sessionManager.setUser(user, true, true)
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, "author")

    sessionManager.clearSession()

    expect(window.localStorage.getItem(USER_STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem(ROLE_STORAGE_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(USER_STORAGE_KEY)).toBeNull()
    expect(window.sessionStorage.getItem(ROLE_STORAGE_KEY)).toBeNull()
    expect(sessionManager.isAuthenticated()).toBe(false)
  })

  it("allows every authenticated user to access the three default product roles", async () => {
    const user = createUser("default-roles@example.com", [])

    expect(getAccessibleRoles(user)).toEqual(["author", "reviewer", "chair"])
    expect(canAccessRole(user, "author")).toBe(true)
    expect(canAccessRole(user, "reviewer")).toBe(true)
    expect(canAccessRole(user, "chair")).toBe(true)
  })

  it("still keeps explicit non-default roles gated", async () => {
    const defaultUser = createUser("default-only@example.com", [])
    const adminUser = createUser("admin@example.com", ["admin"])

    expect(canAccessRole(defaultUser, "admin")).toBe(false)
    expect(canAccessRole(adminUser, "admin")).toBe(true)
  })
})

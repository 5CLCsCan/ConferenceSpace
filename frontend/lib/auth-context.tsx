"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { apiFetch, ApiError, UnauthorizedError } from "./api/client"
import { useTranslation } from "@/lib/i18n/translation-context"
import { sessionManager } from "./session-manager"
import { flushAnalytics, setAnalyticsContext, trackEvent } from "./analytics"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  currentRole: UserRole | null
  login: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean },
  ) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  switchRole: (role: UserRole) => boolean
  resetRole: () => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  first_name: string
  last_name: string
  email: string
  password: string
  domain: string[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Valid user roles - used for validation
const VALID_USER_ROLES: UserRole[] = ["author", "reviewer", "chair", "pc", "admin"]
const TECHNICAL_ERROR_PATTERN =
  /(pq:|sqlstate|duplicate key value|violates unique constraint|constraint|database|failed to [a-z_ ]+:)/i

function resolveAuthErrorMessage(
  error: unknown,
  flow: "login" | "register",
  t: (key: string) => string,
): string {
  const generic =
    flow === "register" ? t("auth.messages.genericRegister") : t("auth.messages.genericLogin")
  const fallback =
    flow === "register" ? t("auth.messages.fallbackRegister") : t("auth.messages.fallbackLogin")

  if (error instanceof ApiError) {
    if (flow === "register" && error.status === 409) {
      return t("auth.register.errors.emailInUse")
    }
    if (flow === "login" && error.status === 401) {
      return t("auth.login.errors.invalidCredentials")
    }
    if (error.status >= 500) {
      return fallback
    }
    if (!error.message || TECHNICAL_ERROR_PATTERN.test(error.message)) {
      return generic
    }
    return error.message
  }

  if (error instanceof Error) {
    if (!error.message || TECHNICAL_ERROR_PATTERN.test(error.message)) {
      return fallback
    }
    return error.message
  }

  return fallback
}

function extractRoles(rawRoles: unknown): UserRole[] {
  if (!Array.isArray(rawRoles)) {
    return []
  }

  const roles: UserRole[] = []

  for (const rawRole of rawRoles) {
    let candidate: unknown = rawRole

    if (rawRole && typeof rawRole === "object") {
      const roleObject = rawRole as Record<string, unknown>
      candidate = roleObject.role ?? roleObject.name ?? roleObject.value
    }

    if (typeof candidate !== "string") {
      continue
    }

    const normalized = candidate.trim().toLowerCase() as UserRole

    if (VALID_USER_ROLES.includes(normalized) && !roles.includes(normalized)) {
      roles.push(normalized)
    }
  }

  return roles
}

function mergeRoles(primary: UserRole[], secondary: UserRole[]): UserRole[] {
  return [...new Set<UserRole>([...primary, ...secondary])]
}

function normalizeUser(apiUser: any): User {
  const firstName = apiUser?.first_name ?? ""
  const lastName = apiUser?.last_name ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || apiUser?.name || apiUser?.email || "User"

  // Normalize roles from API and tolerate case/shape differences.
  let roles = extractRoles(apiUser?.roles)

  // Default to author if no valid roles found
  if (roles.length === 0) {
    roles = ["author"]
  }

  const expertise: string[] =
    Array.isArray(apiUser?.domain) && apiUser.domain.length > 0
      ? apiUser.domain
      : (apiUser?.expertise ?? [])

  return {
    id: String(apiUser?.id ?? ""),
    name: fullName,
    email: apiUser?.email ?? "",
    affiliation: apiUser?.affiliation ?? "",
    roles,
    expertise,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    domain: Array.isArray(apiUser?.domain) ? apiUser.domain : undefined,
    semantic_scholar_id:
      typeof apiUser?.semantic_scholar_id === "string" ? apiUser.semantic_scholar_id : undefined,
    profile_sync_status:
      typeof apiUser?.profile_sync_status === "string" ? apiUser.profile_sync_status : undefined,
    created_at: apiUser?.created_at,
    updated_at: apiUser?.updated_at,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const { t } = useTranslation()

  // Sync state with SessionManager
  const syncWithSessionManager = useCallback(() => {
    const sessionUser = sessionManager.getUser()
    const sessionRole = sessionManager.getRole()
    const sessionAuth = sessionManager.isAuthenticated()

    setUser(sessionUser)
    setCurrentRole(sessionRole)
    setIsAuthenticated(sessionAuth)
  }, [])

  const persistSession = useCallback(
    (nextUser: User) => {
      if (!nextUser.email) {
        return
      }

      sessionManager.refreshUser(nextUser)
      syncWithSessionManager()
    },
    [syncWithSessionManager],
  )

  const clearSession = useCallback(() => {
    sessionManager.clearSession()
    syncWithSessionManager()
  }, [syncWithSessionManager])

  const refreshSession = useCallback(async () => {
    try {
      const existingUser = sessionManager.getUser()
      const existingRoles = extractRoles(existingUser?.roles)

      const response = await apiFetch<{ data: any }>("/api/v1/users/me", {
        method: "GET",
      })

      const userData = response.data?.data || response.data

      if (!userData || !userData.email) {
        return
      }

      const apiRoles = extractRoles(userData?.roles)
      userData.roles = mergeRoles(apiRoles, existingRoles)

      if (userData.roles.length === 0) {
        userData.roles = ["author"]
      }

      const normalizedUser = normalizeUser(userData)

      if (!normalizedUser.email) {
        return
      }

      persistSession(normalizedUser)
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        clearSession()
        return
      }
    }
  }, [clearSession, persistSession])

  useEffect(() => {
    let isActive = true

    const initializeAuth = async () => {
      syncWithSessionManager()
      const hasStoredSession = sessionManager.isAuthenticated()

      if (hasStoredSession) {
        if (isActive) {
          setIsAuthLoading(false)
        }

        void refreshSession()
        return
      }

      await refreshSession()

      if (isActive) {
        syncWithSessionManager()
        setIsAuthLoading(false)
      }
    }

    void initializeAuth()

    return () => {
      isActive = false
    }
  }, [refreshSession, syncWithSessionManager])

  const login = useCallback(
    async (email: string, password: string, options?: { rememberMe?: boolean }) => {
      const rememberMe = options?.rememberMe ?? false

      try {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, rememberMe }),
        })

        const data = await response.json()

        if (!response.ok) {
          return {
            success: false,
            error: data?.error || t("auth.messages.genericLogin"),
          }
        }

        const apiUser = data?.user
        if (!apiUser) {
          return { success: false, error: t("auth.messages.invalidLogin") }
        }

        const normalizedUser = normalizeUser(apiUser)
        sessionManager.setUser(normalizedUser, true, rememberMe)
        setAnalyticsContext({ user: normalizedUser })
        trackEvent("login_succeeded", {
          feature: "auth",
          metadata: { remember_me: rememberMe },
        })
        void flushAnalytics()
        syncWithSessionManager()
        setIsAuthLoading(false)

        return { success: true }
      } catch (error) {
        return { success: false, error: resolveAuthErrorMessage(error, "login", t) }
      }
    },
    [syncWithSessionManager, t],
  )

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        await apiFetch("/api/v1/auth/register", {
          method: "POST",
          skipAuth: true,
          body: JSON.stringify({
            user: {
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              domain: data.domain,
            },
            password: data.password,
          }),
        })

        return { success: true }
      } catch (error) {
        return { success: false, error: resolveAuthErrorMessage(error, "register", t) }
      }
    },
    [t],
  )

  const logout = useCallback(() => {
    clearSession()
    setIsAuthLoading(false)
    void fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined)
  }, [clearSession])

  const switchRole = useCallback(
    (role: UserRole) => {
      const success = sessionManager.setRole(role, true)
      if (success) {
        setAnalyticsContext({ role })
        trackEvent("role_selected", {
          feature: "role_switching",
          role,
          metadata: { selected_role: role },
        })
        syncWithSessionManager()
      }
      return success
    },
    [syncWithSessionManager],
  )

  const resetRole = useCallback(() => {
    sessionManager.resetRole()
    syncWithSessionManager()
  }, [syncWithSessionManager])

  const refreshUser = useCallback(async () => {
    await refreshSession()
  }, [refreshSession])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAuthLoading,
    currentRole,
    login,
    register,
    logout,
    switchRole,
    resetRole,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

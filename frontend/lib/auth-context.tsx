"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { apiFetch, ApiError, UnauthorizedError } from "./api/client"
import { useTranslation } from "@/lib/i18n/translation-context"
import { sessionManager } from "./session-manager"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  currentRole: UserRole | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  switchRole: (role: UserRole) => void
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
const VALID_USER_ROLES: UserRole[] = ["author", "reviewer", "chair", "admin"]

function normalizeUser(apiUser: any): User {
  const firstName = apiUser?.first_name ?? ""
  const lastName = apiUser?.last_name ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || apiUser?.name || apiUser?.email || "User"

  // Validate and filter roles to only include valid UserRole values
  let roles: UserRole[] = []
  if (Array.isArray(apiUser?.roles) && apiUser.roles.length > 0) {
    roles = apiUser.roles.filter(
      (role: any): role is UserRole =>
        typeof role === "string" && VALID_USER_ROLES.includes(role as UserRole),
    )
  }

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
    created_at: apiUser?.created_at,
    updated_at: apiUser?.updated_at,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

  // Initialize from SessionManager on mount
  useEffect(() => {
    syncWithSessionManager()
  }, [syncWithSessionManager])

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
      const existingRoles = existingUser?.roles || ["author"]

      const response = await apiFetch<{ data: any }>("/api/v1/users/me", {
        method: "GET",
      })

      const userData = response.data?.data || response.data

      if (!userData || !userData.email) {
        return
      }

      userData.roles = existingRoles

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
    syncWithSessionManager()
    void refreshSession()
  }, [refreshSession, syncWithSessionManager])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          return {
            success: false,
            error: data?.error || t("auth.messages.genericLogin"),
          }
        }

        const apiUser = data?.user || data?.data?.user
        if (!apiUser) {
          return { success: false, error: t("auth.messages.invalidLogin") }
        }

        // Manually set cookie if backend returns token but doesn't set Set-Cookie
        const token = data?.token || data?.data?.token
        if (token) {
          document.cookie = `conference_auth_token=${token}; path=/; max-age=86400; SameSite=Lax`
        }

        const normalizedUser = normalizeUser(apiUser)
        sessionManager.setUser(normalizedUser)
        syncWithSessionManager()

        return { success: true }
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, error: error.message || t("auth.messages.genericLogin") }
        }
        const message = error instanceof Error ? error.message : t("auth.messages.fallbackLogin")
        return { success: false, error: message }
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
        if (error instanceof ApiError) {
          return { success: false, error: error.message || t("auth.messages.genericRegister") }
        }
        const message = error instanceof Error ? error.message : t("auth.messages.fallbackRegister")
        return { success: false, error: message }
      }
    },
    [t],
  )

  const logout = useCallback(() => {
    clearSession()
    void fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined)
  }, [clearSession])

  const switchRole = useCallback(
    (role: UserRole) => {
      const success = sessionManager.setRole(role, false)
      if (success) {
        syncWithSessionManager()
      }
    },
    [syncWithSessionManager],
  )

  const refreshUser = useCallback(async () => {
    await refreshSession()
  }, [refreshSession])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    currentRole,
    login,
    register,
    logout,
    switchRole,
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

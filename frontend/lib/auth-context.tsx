"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { apiFetch, ApiError, UnauthorizedError } from "./api/client"
import { useTranslation } from "@/lib/i18n/translation-context"
import { ROLE_STORAGE_KEY, USER_STORAGE_KEY } from "./config"

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

function readStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { t } = useTranslation()

  const persistSession = useCallback((nextUser: User) => {
    console.log("[AuthContext] persistSession called with user:", JSON.stringify(nextUser, null, 2))
    if (!nextUser.email) {
      console.error("[AuthContext] persistSession - user missing email!", nextUser)
    }
    setUser(nextUser)
    setIsAuthenticated(true)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))

    const preferredRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null
    const resolvedRole =
      preferredRole && nextUser.roles.includes(preferredRole)
        ? preferredRole
        : (nextUser.roles[0] ?? null)

    if (resolvedRole) {
      setCurrentRole(resolvedRole)
      localStorage.setItem(ROLE_STORAGE_KEY, resolvedRole)
    } else {
      setCurrentRole(null)
      localStorage.removeItem(ROLE_STORAGE_KEY)
    }
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setCurrentRole(null)
    setIsAuthenticated(false)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(ROLE_STORAGE_KEY)
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const response = await apiFetch<{ data: any }>("/api/v1/users/me", {
        method: "GET",
      })

      console.log("[AuthContext] refreshSession response:", JSON.stringify(response, null, 2))

      // Backend returns: { data: { id, email, first_name, ... } }
      // apiFetch returns: { data: { data: { id, email, ... } } }
      // So we need response.data.data to get the actual user object
      const userData = response.data?.data || response.data
      console.log("[AuthContext] User data to normalize:", JSON.stringify(userData, null, 2))

      if (!userData || !userData.email) {
        console.error("[AuthContext] Invalid user data - missing email:", userData)
        // Don't clear session if we have a stored user - allow using cached data
        return
      }

      const normalizedUser = normalizeUser(userData)
      console.log("[AuthContext] Normalized user:", JSON.stringify(normalizedUser, null, 2))

      if (!normalizedUser.email) {
        console.error("[AuthContext] Normalized user missing email!")
        return
      }

      persistSession(normalizedUser)
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        console.warn("[AuthContext] Unauthorized - clearing session")
        clearSession()
        return
      }
      // Log API errors but don't clear session - allow using cached user data
      // This handles cases where the backend is temporarily unavailable
      if (error instanceof ApiError) {
        console.error("[AuthContext] API error refreshing session:", error.status, error.message)
      } else {
        console.error("[AuthContext] Failed to refresh user session:", error)
      }
    }
  }, [clearSession, persistSession])

  useEffect(() => {
    const storedUser = readStoredUser()
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null

    if (storedUser) {
      setUser(storedUser)
      setIsAuthenticated(true)
    }

    if (storedRole) {
      setCurrentRole(storedRole)
    }

    void refreshSession()
  }, [refreshSession])

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

        const apiUser = data?.user
        if (!apiUser) {
          return { success: false, error: t("auth.messages.invalidLogin") }
        }

        const normalizedUser = normalizeUser(apiUser)
        persistSession(normalizedUser)

        return { success: true }
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, error: error.message || t("auth.messages.genericLogin") }
        }
        const message = error instanceof Error ? error.message : t("auth.messages.fallbackLogin")
        return { success: false, error: message }
      }
    },
    [persistSession, t],
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
      // Allow switching to any valid role, not just roles the user has
      // This enables role-based UI testing and multi-role operations
      if (user && VALID_USER_ROLES.includes(role)) {
        setCurrentRole(role)
        localStorage.setItem(ROLE_STORAGE_KEY, role)
      }
    },
    [user],
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

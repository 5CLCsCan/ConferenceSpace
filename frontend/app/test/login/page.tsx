"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { sessionManager } from "@/lib/session-manager"
import type { User, UserRole } from "@/lib/types"
import { ROUTES } from "@/lib/routes"

type TestRole = "author" | "reviewer" | "chair" | "profile"

type RoleConfig = {
  email: string
  first_name: string
  last_name: string
  roles: UserRole[]
  defaultRedirect: string
  routeRole?: UserRole
}

const ROLE_CONFIG: Record<TestRole, RoleConfig> = {
  author: {
    email: "test.discussion.author@example.com",
    first_name: "Test",
    last_name: "Author",
    roles: ["author"],
    defaultRedirect: ROUTES.AUTHOR.DASHBOARD,
    routeRole: "author",
  },
  reviewer: {
    email: "test.discussion.reviewer@example.com",
    first_name: "Test",
    last_name: "Reviewer",
    roles: ["reviewer"],
    defaultRedirect: ROUTES.REVIEWER.DASHBOARD,
    routeRole: "reviewer",
  },
  chair: {
    email: "test.discussion.chair@example.com",
    first_name: "Test",
    last_name: "Chair",
    roles: ["chair"],
    defaultRedirect: ROUTES.CHAIR.DASHBOARD,
    routeRole: "chair",
  },
  profile: {
    email: "test.profile@example.com",
    first_name: "Test",
    last_name: "ProfileUser",
    roles: ["author"],
    defaultRedirect: ROUTES.PROFILE("me"),
  },
}

function isRole(value: string | null): value is TestRole {
  return value === "author" || value === "reviewer" || value === "chair" || value === "profile"
}

function resolveRedirect(target: string | null, fallback: string): string {
  if (!target) return fallback
  if (!target.startsWith("/")) return fallback
  if (target.startsWith("//")) return fallback
  return target
}

function normalizeUser(apiUser: any, roles: UserRole[]): User {
  const firstName = apiUser?.first_name ?? ""
  const lastName = apiUser?.last_name ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || apiUser?.name || apiUser?.email || "User"

  return {
    id: String(apiUser?.id ?? ""),
    name: fullName,
    email: apiUser?.email ?? "",
    affiliation: apiUser?.affiliation ?? "",
    roles,
    expertise: Array.isArray(apiUser?.domain) ? apiUser.domain : ["AI", "ML"],
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    domain: Array.isArray(apiUser?.domain) ? apiUser.domain : undefined,
  }
}

function TestLoginPageContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Initializing test login...")
  const [error, setError] = useState("")

  const role = useMemo(() => {
    const raw = searchParams.get("role")
    return isRole(raw) ? raw : null
  }, [searchParams])

  const redirect = searchParams.get("redirect")

  useEffect(() => {
    if (!role) {
      setError("Invalid role. Use /test/login?role=author|reviewer|chair|profile")
      return
    }

    const loginAndRedirect = async () => {
      const config = ROLE_CONFIG[role]

      try {
        setStatus(`Logging in as ${role} test user...`)
        const response = await fetch("/api/v1/auth/test-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: config.email,
            first_name: config.first_name,
            last_name: config.last_name,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || "Test login failed")
        }

        const apiUser = data?.user
        if (!apiUser) {
          throw new Error("No user returned from test login")
        }

        const normalizedUser = normalizeUser(apiUser, config.roles)

        // Replace any previous local session state before forcing route-role.
        sessionManager.setUser(normalizedUser, false)
        if (config.routeRole) {
          sessionManager.setRole(config.routeRole, true)
        }

        const target = resolveRedirect(redirect, config.defaultRedirect)
        setStatus(`Redirecting to ${target}...`)
        window.location.href = target
      } catch (err) {
        setError(err instanceof Error ? err.message : "Test login failed")
      }
    }

    loginAndRedirect()
  }, [redirect, role])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center text-red-600 max-w-lg px-4">
          <p className="text-lg font-medium">Error</p>
          <p className="mt-2 text-sm break-all">{error}</p>
          <div className="mt-6 space-y-2 text-sm text-neutral-600">
            <p>Examples:</p>
            <p className="font-mono bg-neutral-100 p-2 rounded">
              /test/login?role=chair
            </p>
            <p className="font-mono bg-neutral-100 p-2 rounded">
              /test/login?role=reviewer&amp;redirect=%2Frole%2Freviewer
            </p>
          </div>
          <p className="text-sm mt-4 text-neutral-500">
            Make sure the backend is running with test-login enabled.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-neutral-600">{status}</p>
      </div>
    </div>
  )
}

export default function TestLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <TestLoginPageContent />
    </Suspense>
  )
}

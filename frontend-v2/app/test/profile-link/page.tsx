"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { sessionManager } from "@/lib/session-manager"
import type { User } from "@/lib/types"

const TEST_EMAIL = "test.profile@example.com"
const TEST_FIRST_NAME = "Test"
const TEST_LAST_NAME = "ProfileUser"

function normalizeUser(apiUser: any): User {
  const firstName = apiUser?.first_name ?? ""
  const lastName = apiUser?.last_name ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || apiUser?.name || apiUser?.email || "User"

  return {
    id: String(apiUser?.id ?? ""),
    name: fullName,
    email: apiUser?.email ?? "",
    affiliation: apiUser?.affiliation ?? "",
    roles: ["author"],
    expertise: Array.isArray(apiUser?.domain) ? apiUser.domain : [],
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    domain: Array.isArray(apiUser?.domain) ? apiUser.domain : undefined,
  }
}

export default function ProfileLinkTestPage() {
  const [error, setError] = useState("")

  useEffect(() => {
    const loginAndRedirect = async () => {
      try {
        // Call the test-login API route (sets cookies server-side)
        const response = await fetch("/api/v1/auth/test-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: TEST_EMAIL,
            first_name: TEST_FIRST_NAME,
            last_name: TEST_LAST_NAME,
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

        // Set user in session manager (same as regular login)
        const normalizedUser = normalizeUser(apiUser)
        sessionManager.setUser(normalizedUser)

        // Redirect to own profile route
        window.location.href = "/profile/me"
      } catch (err) {
        setError(err instanceof Error ? err.message : "Test login failed")
      }
    }

    loginAndRedirect()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center text-red-600 max-w-md px-4">
          <p className="text-lg font-medium">Error</p>
          <p className="mt-2">{error}</p>
          <p className="text-sm mt-4 text-neutral-500">
            Make sure the backend is running in development mode.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-neutral-600">Logging in as test user...</p>
      </div>
    </div>
  )
}

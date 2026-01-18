"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { sessionManager } from "@/lib/session-manager"
import type { User } from "@/lib/types"

function normalizeUser(apiUser: any): User {
  const firstName = apiUser?.first_name ?? ""
  const lastName = apiUser?.last_name ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || apiUser?.name || apiUser?.email || "User"

  return {
    id: String(apiUser?.id ?? ""),
    name: fullName,
    email: apiUser?.email ?? "",
    affiliation: apiUser?.affiliation ?? "",
    roles: ["author", "reviewer"],
    expertise: Array.isArray(apiUser?.domain) ? apiUser.domain : ["AI", "ML"],
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    domain: Array.isArray(apiUser?.domain) ? apiUser.domain : ["AI", "ML"],
  }
}

export default function DiscussionTestPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Initializing...")
  const [error, setError] = useState("")

  const isAuthor = searchParams.get("author") === "true"
  const isReviewer = searchParams.get("reviewer") === "true"
  const role = isAuthor ? "author" : isReviewer ? "reviewer" : null

  useEffect(() => {
    if (!role) {
      setError("Please specify role: ?author=true or ?reviewer=true")
      return
    }

    const setupAndRedirect = async () => {
      try {
        setStatus("Setting up test data (conference, submission, assignment)...")

        // Call the server-side setup route
        const response = await fetch("/api/test/discussion-setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || "Setup failed")
        }

        const { user, conferenceId, submissionId, assignmentId } = data

        // Set user in session manager
        const normalizedUser = normalizeUser(user)
        sessionManager.setUser(normalizedUser)

        setStatus("Redirecting to discussion page...")

        // Redirect based on role
        if (role === "author") {
          window.location.href = `/dashboard/conference/${conferenceId}/submission/${submissionId}?tab=discussion`
        } else {
          // Reviewer page uses assignment_id in URL and conference_id as query param
          window.location.href = `/dashboard/reviewer/papers/${assignmentId}?conference_id=${conferenceId}&tab=discussion`
        }
      } catch (err) {
        console.error("Setup error:", err)
        setError(err instanceof Error ? err.message : "Setup failed")
      }
    }

    setupAndRedirect()
  }, [role])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center text-red-600 max-w-lg px-4">
          <p className="text-lg font-medium">Error</p>
          <p className="mt-2 text-sm break-all">{error}</p>
          <div className="mt-6 space-y-2 text-sm text-neutral-600">
            <p>Usage:</p>
            <p className="font-mono bg-neutral-100 p-2 rounded">
              /test/discussion?author=true
            </p>
            <p className="font-mono bg-neutral-100 p-2 rounded">
              /test/discussion?reviewer=true
            </p>
          </div>
          <p className="text-sm mt-4 text-neutral-500">
            Make sure the backend is running in development mode with test-login enabled.
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
        {role && (
          <p className="text-sm text-neutral-400 mt-2">
            Setting up as: <span className="font-medium">{role}</span>
          </p>
        )}
      </div>
    </div>
  )
}

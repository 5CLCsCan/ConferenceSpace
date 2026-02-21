"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"

export default function ProfileLinkTestPage() {
  useEffect(() => {
    const target = `${ROUTES.TEST.LOGIN}?role=profile&redirect=${encodeURIComponent("/profile/me")}`
    window.location.replace(target)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-neutral-600">Redirecting to test profile login...</p>
      </div>
    </div>
  )
}

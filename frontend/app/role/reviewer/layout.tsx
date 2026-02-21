"use client"

import type { ReactNode } from "react"
import { useRoleRouteGuard } from "@/lib/use-role-route-guard"

export default function ReviewerRoleLayout({ children }: { children: ReactNode }) {
  const { canRender } = useRoleRouteGuard("reviewer")

  if (!canRender) {
    return null
  }

  return <>{children}</>
}

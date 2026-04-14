"use client"

import type { ReactNode } from "react"
import { useRoleRouteGuard } from "@/lib/use-role-route-guard"
import { useAuth } from "@/lib/auth-context"

export default function ChairRoleLayout({ children }: { children: ReactNode }) {
  const { currentRole } = useAuth()
  const guardRole = currentRole === "pc" ? "pc" : "chair"
  const { canRender } = useRoleRouteGuard(guardRole)

  if (!canRender) {
    return null
  }

  return <div className="chair-ui">{children}</div>
}

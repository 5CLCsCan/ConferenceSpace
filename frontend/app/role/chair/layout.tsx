"use client"

import type { ReactNode } from "react"
import { useRoleRouteGuard } from "@/lib/use-role-route-guard"

export default function ChairRoleLayout({ children }: { children: ReactNode }) {
  const { canRender } = useRoleRouteGuard("chair")

  if (!canRender) {
    return null
  }

  return <>{children}</>
}

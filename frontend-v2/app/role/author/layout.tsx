"use client"

import type { ReactNode } from "react"
import { useRoleRouteGuard } from "@/lib/use-role-route-guard"

export default function AuthorRoleLayout({ children }: { children: ReactNode }) {
  const { canRender } = useRoleRouteGuard("author")

  if (!canRender) {
    return null
  }

  return <>{children}</>
}

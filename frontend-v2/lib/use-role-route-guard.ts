"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { canAccessRole } from "@/lib/role-access"

interface RoleRouteGuardResult {
  canRender: boolean
}

export function useRoleRouteGuard(requiredRole: UserRole): RoleRouteGuardResult {
  const { isAuthenticated, isAuthLoading, user, currentRole, switchRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!isAuthenticated || !user) {
      router.replace("/login")
      return
    }

    if (!canAccessRole(user, requiredRole)) {
      router.replace("/role")
      return
    }

    if (currentRole !== requiredRole) {
      const didSwitchRole = switchRole(requiredRole)

      if (!didSwitchRole) {
        router.replace("/role")
      }
    }
  }, [currentRole, isAuthenticated, isAuthLoading, requiredRole, router, switchRole, user])

  const hasRequiredRole = canAccessRole(user, requiredRole)
  const roleSynced = currentRole === requiredRole

  return {
    canRender: !isAuthLoading && isAuthenticated && hasRequiredRole && roleSynced,
  }
}

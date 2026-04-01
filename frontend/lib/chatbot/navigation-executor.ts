import type { UserRole } from "@/lib/types"

import { buildNavigationPath, resolveCurrentNavigation } from "@/lib/chatbot/navigation-routing"
import {
  CHATBOT_NAVIGATION_SITEMAP,
  getNavigationDestination,
  type NavigationRoleScope,
} from "@/lib/chatbot/navigation-sitemap"

export interface CurrentNavigationSnapshot {
  url: string
  pathname: string
  destinationId: string | null
  params: Record<string, string>
  matchStatus: "matched" | "unmapped"
  sitemap: typeof CHATBOT_NAVIGATION_SITEMAP
}

export interface NavigationResult {
  success: boolean
  message: string
  destinationId?: string
  path?: string
}

export function getCurrentNavigationSnapshot({
  href,
  pathname,
  searchParams,
}: {
  href: string
  pathname: string
  searchParams: URLSearchParams
}): CurrentNavigationSnapshot {
  const resolved = resolveCurrentNavigation({ pathname, searchParams })

  return {
    url: href,
    pathname,
    destinationId: resolved.destinationId,
    params: resolved.params,
    matchStatus: resolved.matchStatus,
    sitemap: CHATBOT_NAVIGATION_SITEMAP,
  }
}

export function navigateToDestination({
  currentRole,
  destinationId,
  params,
  push,
  activateRole,
  onBeforePush,
}: {
  currentRole: UserRole | null
  destinationId: string
  params: Record<string, string>
  push: (path: string) => void
  activateRole?: (role: UserRole) => boolean
  onBeforePush?: (details: { destinationId: string; destinationLabel: string; path: string }) => void
}): NavigationResult {
  const destination = getNavigationDestination(destinationId)
  if (!destination) {
    return {
      success: false,
      message: `Unknown destinationId: ${destinationId}`,
    }
  }

  const resolvedRole = resolveNavigationRole({
    currentRole,
    roleScope: destination.roleScope,
    activateRole,
  })

  if (!resolvedRole.allowed) {
    return {
      success: false,
      message: `Destination ${destinationId} is not available for the current role`,
      destinationId,
    }
  }

  try {
    const path = buildNavigationPath(destinationId, params)
    if (!path.startsWith("/")) {
      return {
        success: false,
        message: `Refusing to navigate to non-platform path for ${destinationId}`,
        destinationId,
      }
    }

    onBeforePush?.({
      destinationId,
      destinationLabel: destination.label,
      path,
    })
    push(path)
    return {
      success: true,
      message: `Navigated to ${destinationId}`,
      destinationId,
      path,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : `Failed to navigate to ${destinationId}`,
      destinationId,
    }
  }
}

function canAccessDestination(
  roleScope: NavigationRoleScope,
  currentRole: UserRole | null,
): boolean {
  if (roleScope === "shared") {
    return true
  }

  return currentRole === roleScope
}

function resolveNavigationRole({
  currentRole,
  roleScope,
  activateRole,
}: {
  currentRole: UserRole | null
  roleScope: NavigationRoleScope
  activateRole?: (role: UserRole) => boolean
}): { allowed: boolean } {
  if (roleScope === "shared") {
    return { allowed: true }
  }

  if (canAccessDestination(roleScope, currentRole)) {
    return { allowed: true }
  }

  if (activateRole?.(roleScope)) {
    return { allowed: true }
  }

  return { allowed: false }
}

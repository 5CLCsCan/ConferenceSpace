import type { User, UserRole } from "./types"

const BASE_PLATFORM_ROLES: UserRole[] = ["author", "reviewer", "chair"]

export function getAccessibleRoles(user: User | null): UserRole[] {
  if (!user) {
    return []
  }

  return [...new Set<UserRole>([...BASE_PLATFORM_ROLES, ...(user.roles || [])])]
}

export function canAccessRole(user: User | null, role: UserRole): boolean {
  return getAccessibleRoles(user).includes(role)
}

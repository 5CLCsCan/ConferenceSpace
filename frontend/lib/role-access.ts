import type { User, UserRole } from "./types"

const DEFAULT_PRODUCT_ROLES: UserRole[] = ["author", "reviewer", "chair"]

export function getAccessibleRoles(user: User | null): UserRole[] {
  if (!user) {
    return []
  }

  return [...new Set<UserRole>([...DEFAULT_PRODUCT_ROLES, ...(user.roles || [])])]
}

export function canAccessRole(user: User | null, role: UserRole): boolean {
  return getAccessibleRoles(user).includes(role)
}

import type { User, UserRole } from "./types"

export function getAccessibleRoles(user: User | null): UserRole[] {
  if (!user) {
    return []
  }

  // Roles are now derived from backend data via /users/me response
  // The backend always includes "author" as a base role
  return [...new Set<UserRole>([...(user.roles || [])])]
}

export function canAccessRole(user: User | null, role: UserRole): boolean {
  return getAccessibleRoles(user).includes(role)
}

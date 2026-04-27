import type { UserRole } from "./types"

/**
 * Returns true if the given role should have read-only access
 * (can view but not modify data). Currently only the "pc" role.
 */
export function isReadOnlyRole(role: UserRole | null | undefined): boolean {
  return role === "pc"
}

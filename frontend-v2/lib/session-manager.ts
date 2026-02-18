import type { User, UserRole } from "./types"
import { USER_STORAGE_KEY, ROLE_STORAGE_KEY } from "./config"
import { canAccessRole } from "./role-access"

const VALID_USER_ROLES: UserRole[] = ["author", "reviewer", "chair", "admin"]

class SessionManager {
  private static instance: SessionManager | null = null
  private user: User | null = null
  private currentRole: UserRole | null = null
  private allowRoleChange: boolean = false

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  private normalizeRoles(rawRoles: unknown): UserRole[] {
    if (!Array.isArray(rawRoles)) {
      return []
    }

    const roles: UserRole[] = []

    for (const rawRole of rawRoles) {
      if (typeof rawRole !== "string") {
        continue
      }

      const normalizedRole = rawRole.trim().toLowerCase() as UserRole

      if (VALID_USER_ROLES.includes(normalizedRole) && !roles.includes(normalizedRole)) {
        roles.push(normalizedRole)
      }
    }

    return roles
  }

  private normalizeSessionUser(user: User): User {
    const normalizedRoles = this.normalizeRoles(user.roles)

    return {
      ...user,
      roles: normalizedRoles.length > 0 ? normalizedRoles : ["author"],
    }
  }

  private hasRole(role: UserRole): boolean {
    return canAccessRole(this.user, role)
  }

  private reconcileRoleWithUser(): void {
    if (!this.currentRole) {
      return
    }

    if (!this.hasRole(this.currentRole)) {
      this.currentRole = null
      this.clearRole()
    }
  }

  private loadFromStorage(): void {
    if (!this.isBrowser()) {
      return
    }

    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User
        this.user = this.normalizeSessionUser(parsedUser)
        this.persistUser()
      }

      const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null

      if (storedRole && VALID_USER_ROLES.includes(storedRole)) {
        this.currentRole = storedRole
      } else {
        this.currentRole = null
      }

      this.reconcileRoleWithUser()
    } catch (error) {
      this.user = null
      this.currentRole = null
    }
  }

  getUser(): User | null {
    return this.user
  }

  getRole(): UserRole | null {
    return this.currentRole
  }

  isAuthenticated(): boolean {
    return this.user !== null && this.user.email !== undefined
  }

  setUser(user: User, preserveRole: boolean = true): void {
    this.user = this.normalizeSessionUser(user)
    this.persistUser()

    if (!preserveRole) {
      this.resetRole()
      return
    }

    this.reconcileRoleWithUser()

    if (this.currentRole) {
      this.persistRole()
    }
  }

  setRole(role: UserRole, force: boolean = false): boolean {
    if (!this.user) {
      return false
    }

    if (!force && !this.allowRoleChange) {
      return false
    }

    if (!VALID_USER_ROLES.includes(role)) {
      return false
    }

    if (!this.hasRole(role)) {
      return false
    }

    this.currentRole = role
    this.persistRole()
    return true
  }

  enableRoleChange(): void {
    this.allowRoleChange = true
  }

  disableRoleChange(): void {
    this.allowRoleChange = false
  }

  resetRole(): void {
    this.currentRole = null
    this.clearRole()
  }

  private persistUser(): void {
    if (!this.isBrowser() || !this.user) {
      return
    }

    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user))
    } catch (error) {
      // Silently fail - localStorage might be disabled
    }
  }

  private persistRole(): void {
    if (!this.isBrowser() || !this.currentRole) {
      return
    }

    try {
      localStorage.setItem(ROLE_STORAGE_KEY, this.currentRole)
    } catch (error) {
      // Silently fail - localStorage might be disabled
    }
  }

  private clearRole(): void {
    if (!this.isBrowser()) {
      return
    }

    try {
      localStorage.removeItem(ROLE_STORAGE_KEY)
    } catch (error) {
      // Silently fail
    }
  }

  clearSession(): void {
    this.user = null
    this.currentRole = null
    this.allowRoleChange = false

    if (!this.isBrowser()) {
      return
    }

    try {
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(ROLE_STORAGE_KEY)
    } catch (error) {
      // Silently fail
    }
  }

  refreshUser(newUser: User): void {
    const previousRole = this.currentRole
    this.user = this.normalizeSessionUser(newUser)
    this.persistUser()

    if (previousRole && this.hasRole(previousRole)) {
      this.currentRole = previousRole
      this.persistRole()
      return
    }

    this.reconcileRoleWithUser()
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

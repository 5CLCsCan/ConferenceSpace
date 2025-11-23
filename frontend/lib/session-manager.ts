import type { User, UserRole } from "./types"
import { USER_STORAGE_KEY, ROLE_STORAGE_KEY } from "./config"

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

  private loadFromStorage(): void {
    if (!this.isBrowser()) {
      return
    }

    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (storedUser) {
        this.user = JSON.parse(storedUser) as User
      }

      const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null
      const VALID_USER_ROLES: UserRole[] = ["author", "reviewer", "chair", "admin"]

      if (storedRole && VALID_USER_ROLES.includes(storedRole)) {
        this.currentRole = storedRole
      } else {
        this.currentRole = "author"
        this.persistRole()
      }
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
    this.user = user
    this.persistUser()

    if (preserveRole && this.currentRole) {
      this.persistRole()
    } else if (!this.currentRole) {
      this.currentRole = "author"
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

    const VALID_USER_ROLES: UserRole[] = ["author", "reviewer", "chair", "admin"]
    if (!VALID_USER_ROLES.includes(role)) {
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
    const currentRole = this.currentRole
    this.setUser(newUser, true)

    if (currentRole && this.currentRole !== currentRole) {
      this.currentRole = currentRole
      this.persistRole()
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

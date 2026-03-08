import type { User, UserRole } from "./types"
import { USER_STORAGE_KEY, ROLE_STORAGE_KEY } from "./config"
import { canAccessRole } from "./role-access"

const VALID_USER_ROLES: UserRole[] = ["author", "reviewer", "chair", "admin"]
type StoragePreference = "local" | "session"

class SessionManager {
  private static instance: SessionManager | null = null
  private user: User | null = null
  private currentRole: UserRole | null = null
  private allowRoleChange: boolean = false
  private storagePreference: StoragePreference = "local"

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
    return typeof window !== "undefined"
  }

  private getStorage(storageType: StoragePreference): Storage | null {
    if (!this.isBrowser()) {
      return null
    }

    try {
      return storageType === "local" ? window.localStorage : window.sessionStorage
    } catch {
      return null
    }
  }

  private getInactiveStorageType(): StoragePreference {
    return this.storagePreference === "local" ? "session" : "local"
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

  private readUserFromStorage(storageType: StoragePreference): User | null {
    const storage = this.getStorage(storageType)
    if (!storage) {
      return null
    }

    try {
      const storedUser = storage.getItem(USER_STORAGE_KEY)
      if (!storedUser) {
        return null
      }

      const parsedUser = JSON.parse(storedUser) as User
      return this.normalizeSessionUser(parsedUser)
    } catch {
      return null
    }
  }

  private readRoleFromStorage(storageType: StoragePreference): UserRole | null {
    const storage = this.getStorage(storageType)
    if (!storage) {
      return null
    }

    try {
      const storedRole = storage.getItem(ROLE_STORAGE_KEY) as UserRole | null
      if (storedRole && VALID_USER_ROLES.includes(storedRole)) {
        return storedRole
      }
      return null
    } catch {
      return null
    }
  }

  private loadFromStorage(): void {
    const sessionUser = this.readUserFromStorage("session")
    const localUser = this.readUserFromStorage("local")

    if (sessionUser) {
      this.user = sessionUser
      this.storagePreference = "session"
    } else if (localUser) {
      this.user = localUser
      this.storagePreference = "local"
    } else {
      this.user = null
      this.storagePreference = "local"
    }

    this.currentRole = this.readRoleFromStorage(this.storagePreference)
    this.reconcileRoleWithUser()
    this.persistUser()

    if (this.currentRole) {
      this.persistRole()
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

  setUser(user: User, preserveRole: boolean = true, rememberMe?: boolean): void {
    if (typeof rememberMe === "boolean") {
      this.storagePreference = rememberMe ? "local" : "session"
    }

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
    if (!this.user) {
      return
    }

    const activeStorage = this.getStorage(this.storagePreference)
    const inactiveStorage = this.getStorage(this.getInactiveStorageType())

    try {
      activeStorage?.setItem(USER_STORAGE_KEY, JSON.stringify(this.user))
      inactiveStorage?.removeItem(USER_STORAGE_KEY)
    } catch {
      // Silently fail - storage might be unavailable
    }
  }

  private persistRole(): void {
    if (!this.currentRole) {
      return
    }

    const activeStorage = this.getStorage(this.storagePreference)
    const inactiveStorage = this.getStorage(this.getInactiveStorageType())

    try {
      activeStorage?.setItem(ROLE_STORAGE_KEY, this.currentRole)
      inactiveStorage?.removeItem(ROLE_STORAGE_KEY)
    } catch {
      // Silently fail - storage might be unavailable
    }
  }

  private clearRole(): void {
    const localStorageRef = this.getStorage("local")
    const sessionStorageRef = this.getStorage("session")

    try {
      localStorageRef?.removeItem(ROLE_STORAGE_KEY)
      sessionStorageRef?.removeItem(ROLE_STORAGE_KEY)
    } catch {
      // Silently fail
    }
  }

  clearSession(): void {
    this.user = null
    this.currentRole = null
    this.allowRoleChange = false
    this.storagePreference = "local"

    const localStorageRef = this.getStorage("local")
    const sessionStorageRef = this.getStorage("session")

    try {
      localStorageRef?.removeItem(USER_STORAGE_KEY)
      localStorageRef?.removeItem(ROLE_STORAGE_KEY)
      sessionStorageRef?.removeItem(USER_STORAGE_KEY)
      sessionStorageRef?.removeItem(ROLE_STORAGE_KEY)
    } catch {
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

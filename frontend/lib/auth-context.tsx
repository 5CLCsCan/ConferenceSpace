"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { mockUsers } from "./mock-data"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  switchRole: (role: UserRole) => void
  currentRole: UserRole | null
}

interface RegisterData {
  name: string
  email: string
  password: string
  affiliation: string
  expertise: string[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("conference_user")
    const storedRole = localStorage.getItem("conference_role")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
      if (storedRole) {
        setCurrentRole(storedRole as UserRole)
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Find user by email (in real app, this would be API call)
    const foundUser = mockUsers.find((u) => u.email === email)

    if (!foundUser) {
      return { success: false, error: "Email không tồn tại trong hệ thống" }
    }

    // In real app, verify password hash
    // For demo, accept any password
    setUser(foundUser)
    setIsAuthenticated(true)
    localStorage.setItem("conference_user", JSON.stringify(foundUser))

    return { success: true }
  }

  const register = async (data: RegisterData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.email === data.email)
    if (existingUser) {
      return { success: false, error: "Email đã được sử dụng" }
    }

    // Create new user (in real app, this would be API call)
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      affiliation: data.affiliation,
      roles: ["author"], // Default role for new users
      expertise: data.expertise,
      h_index: 0,
      total_papers: 0,
      total_reviews: 0,
    }

    // Add to mock users (in real app, this would be saved to database)
    mockUsers.push(newUser)

    setUser(newUser)
    setIsAuthenticated(true)
    localStorage.setItem("conference_user", JSON.stringify(newUser))

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    setCurrentRole(null)
    setIsAuthenticated(false)
    localStorage.removeItem("conference_user")
    localStorage.removeItem("conference_role")
  }

  const switchRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      setCurrentRole(role)
      localStorage.setItem("conference_role", role)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, switchRole, currentRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Simplified auth without external dependencies
export type UserRole = "ADMIN" | "COMPANY" | "EMPLOYEE"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  organizationId?: string
  organizationName?: string
}

// Mock user database - replace with your actual database
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@pulse.com",
    name: "Admin User",
    role: "ADMIN",
    organizationId: "org-1",
    organizationName: "Pulse HQ",
  },
  {
    id: "2",
    email: "company@example.com",
    name: "Company Manager",
    role: "COMPANY",
    organizationId: "org-2",
    organizationName: "Example Corp",
  },
  {
    id: "3",
    email: "employee@example.com",
    name: "John Employee",
    role: "EMPLOYEE",
    organizationId: "org-2",
    organizationName: "Example Corp",
  },
]

export async function validateUser(email: string, password: string): Promise<User | null> {
  // Simple validation - in production, hash and compare passwords
  const user = mockUsers.find((u) => u.email === email)

  if (user && password === "password123") {
    return user
  }

  return null
}

export async function createUser(userData: Omit<User, "id">): Promise<User> {
  const newUser: User = {
    ...userData,
    id: Math.random().toString(36).substr(2, 9),
  }

  mockUsers.push(newUser)
  return newUser
}

// Session management using localStorage (client-side only)
export const authService = {
  setUser: (user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pulse_user", JSON.stringify(user))
    }
  },

  getUser: (): User | null => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("pulse_user")
      return userData ? JSON.parse(userData) : null
    }
    return null
  },

  removeUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pulse_user")
    }
  },

  isAuthenticated: (): boolean => {
    return authService.getUser() !== null
  },
}

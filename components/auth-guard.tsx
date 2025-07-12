"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService, type User, type UserRole } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole[]
  redirectTo?: string
}

export function AuthGuard({ children, requiredRole, redirectTo = "/auth/signin" }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getUser()

      if (!currentUser) {
        // Store the attempted URL to redirect back after login
        const returnUrl = pathname !== "/dashboard" ? pathname : ""
        const redirectUrl = returnUrl ? `${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}` : redirectTo
        router.push(redirectUrl)
        return
      }

      // Check role permissions
      if (requiredRole && !requiredRole.includes(currentUser.role)) {
        router.push("/unauthorized")
        return
      }

      setUser(currentUser)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, requiredRole, redirectTo, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-alabaster flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster mx-auto animate-pulse">
            <span className="text-lg font-bold">P</span>
          </div>
          <p className="text-warm-gray">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

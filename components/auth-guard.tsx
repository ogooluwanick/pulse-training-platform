"use client"

import { ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: string[]
}

export const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    router.push("/auth/signin")
    return null
  }

  if (allowedRoles && !allowedRoles.some((role) => session.user?.role === role)) {
    // Optionally redirect to an unauthorized page or show a message
    router.push("/unauthorized") // Assuming you have an unauthorized page
    return null
  }

  return <>{children}</>
}

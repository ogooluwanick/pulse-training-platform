"use client"

import { ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import FullPageLoader from "./full-page-loader"

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: string[]
}

export const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return <FullPageLoader />
  }

  if (!session) {
    router.push("/auth/signin")
    return null
  }

  if (allowedRoles && !allowedRoles.some((role) => session.user?.role === role)) {
    router.push("/dashboard/unauthorized")
    return null
  }

  return <>{children}</>
}

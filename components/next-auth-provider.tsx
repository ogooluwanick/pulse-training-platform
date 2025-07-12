"use client"

import { SessionProvider } from "next-auth/react"
import { Session } from "next-auth"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  session: Session | null
}

export function NextAuthProvider({ children }: Props) {
  return <>{children}</>
}

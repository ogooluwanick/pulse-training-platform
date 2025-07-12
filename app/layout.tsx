import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextAuthProvider } from "@/components/next-auth-provider"
import "./globals.css"
import { getServerSession } from "next-auth"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Pulse - The Intelligent Workspace",
  description: "Multi-tenant corporate training platform",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <NextAuthProvider session={session}>
          <div className="min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
            {children}
          </div>
        </NextAuthProvider>
      </body>
    </html>
  )
}

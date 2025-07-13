import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextAuthProvider } from "@/components/next-auth-provider"
import "./globals.css"
import { getServerSession } from "next-auth"
import { Toaster } from "sonner" // Import Toaster from sonner

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
          <Toaster richColors={true} />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  )
}

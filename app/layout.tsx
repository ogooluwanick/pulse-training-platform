import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextAuthProvider } from "@/components/next-auth-provider"
import "./globals.css"
import { getServerSession } from "next-auth"
import { Toaster } from "sonner" // Import Toaster from sonner
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import { NotificationDisplay } from "@/components/notification-display";
import QueryProvider from "@/components/query-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Pulse - The Intelligent Workspace",
  description: "Multi-tenant corporate training platform",
  icons: {
    icon: "/pulse-logo.png",
  },
  openGraph: {
    title: "Pulse - The Intelligent Workspace",
    description: "Multi-tenant corporate training platform",
    images: [
      {
        url: "/site-img.png",
        width: 1200,
        height: 630,
        alt: "Pulse - The Intelligent Workspace",
      },
    ],
  },
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
          <QueryProvider>
            <NotificationProvider>
              <div className="min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
                {children}
              <Toaster richColors={true} />
              <NotificationDisplay />
              </div>
            </NotificationProvider>
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}

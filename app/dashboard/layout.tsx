"use client"

import type React from "react"
import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopMenu } from "@/components/top-menu"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      <TopMenu />
      <SidebarProvider>
        <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        <main className="flex-1">{children}</main>
      </SidebarProvider>
    </div>
  )
}

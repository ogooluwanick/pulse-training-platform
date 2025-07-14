"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  BarChart3,
  Users,
  Settings,
  Home,
  Award,
  Calendar,
  MessageSquare,
  Building2,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "My Learning",
    url: "/dashboard/learning",
    icon: BookOpen,
    badge: "3",
  },
  {
    title: "Course Catalog",
    url: "/dashboard/catalog",
    icon: Award,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Discussions",
    url: "/dashboard/discussions",
    icon: MessageSquare,
  },
]

const managementItems = [
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Team Management",
    url: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Organization",
    url: "/dashboard/organization",
    icon: Building2,
  },
]

const accountItems = [
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

const adminItems = [
  {
    title: "Company Management",
    url: "/admin/companies",
    icon: Building2,
  },
  {
    title: "Platform Settings",
    url: "/admin/platform",
    icon: Settings,
  },
]

interface AppSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const { data: session } = useSession()
  const user = session?.user

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  if (!user) return null

  return (
    <>
      {/* Toggle Button - Fixed position on left side, vertically centered */}
      <Button
        onClick={onToggle}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-alabaster hover:bg-alabaster/90 text-charcoal shadow-soft-lg rounded-full p-3 transition-soft border border-warm-gray/20"
        size="icon"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar className="border-r border-warm-gray/20 h-full" style={{ backgroundColor: "#f5f4ed" }}>
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-charcoal text-alabaster">
                <span className="text-lg font-bold">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-charcoal">Pulse</h1>
                <p className="text-sm text-warm-gray">Intelligent Workspace</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-warm-gray font-medium">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Dashboard and Employee items */}
                  {navigationItems.map(item => {
                    const employeeOnlyItems = [
                      "My Learning",
                      "Course Catalog",
                      "Calendar",
                      "Discussions",
                    ]
                    if (
                      employeeOnlyItems.includes(item.title) &&
                      user?.role !== "EMPLOYEE"
                    ) {
                      return null
                    }
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className="hover:bg-alabaster"
                          onClick={onToggle}
                        >
                          <a
                            href={item.url}
                            className="flex items-center gap-3"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-auto bg-success-green text-alabaster"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                  {/* Management items for Company and Admin */}
                  {(user?.role === "COMPANY" || user?.role === "ADMIN") &&
                    managementItems.map(item => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className="hover:bg-alabaster"
                          onClick={onToggle}
                        >
                          <a
                            href={item.url}
                            className="flex items-center gap-3"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Account Section - Company & Admin */}
            {(user?.role === "COMPANY" || user?.role === "ADMIN") && (
              <>
                <SidebarSeparator className="bg-warm-gray/20" />
                <SidebarGroup>
                  <SidebarGroupLabel className="text-warm-gray font-medium">
                    Account
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {accountItems.map(item => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className="hover:bg-alabaster"
                            onClick={onToggle}
                          >
                            <a
                              href={item.url}
                              className="flex items-center gap-3"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}

            {/* Platform Admin Section - Admin only */}
            {user?.role === "ADMIN" && (
              <>
                <SidebarSeparator className="bg-warm-gray/20" />
                <SidebarGroup>
                  <SidebarGroupLabel className="text-warm-gray font-medium">Platform Admin</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild className="hover:bg-alabaster" onClick={onToggle}>
                            <a href={item.url} className="flex items-center gap-3">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="space-y-3">
              <div className="group/profile flex items-center gap-3 rounded-lg bg-alabaster p-3 transition hover:bg-charcoal">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="border border-alabaster bg-charcoal text-alabaster group-hover/profile:bg-alabaster group-hover/profile:text-charcoal">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : ""}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="max-w-[180px] truncate text-sm font-medium capitalize text-charcoal group-hover/profile:text-alabaster">
                    {user.firstName || "User"}
                  </p>
                  <span className="-mb-1.5 block max-w-[180px] truncate text-xs capitalize text-gray-700 group-hover/profile:text-gray-400">
                    {user?.companyName}
                  </span>
                  <span className="text-[10px] text-gray-500 group-hover/profile:text-gray-400">{user?.role}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent border-warm-gray/30 hover:bg-alabaster"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Search } from "lucide-react"
import { authService } from "@/lib/auth"
import Link from "next/link"

export function TopMenu() {
  const [user, setUser] = useState(authService.getUser())

  useEffect(() => {
    const currentUser = authService.getUser()
    setUser(currentUser)
  }, [])

  return (
    <div className="sticky top-0 z-40 w-full border-b border-warm-gray/20 backdrop-blur-md bg-white/70 supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-charcoal text-alabaster">
            <span className="text-sm font-bold">P</span>
          </div>
          <span className="text-xl font-bold text-charcoal">Pulse</span>
        </Link>

        {/* Center - Search (only show on dashboard pages) */}
        {user && (
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
              <input
                type="text"
                placeholder="Search courses, people, or content..."
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-warm-gray/30 rounded-lg text-sm focus:outline-none focus:border-charcoal focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Right side - User actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-warning-ochre text-alabaster text-xs p-0 flex items-center justify-center">
                  3
                </Badge>
              </Button>

              {/* User Profile */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/50 border border-warm-gray/20">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-alabaster text-xs font-medium">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <span className="text-sm font-medium text-charcoal">{user.name.split(" ")[0]}</span>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm" className="border-warm-gray/30 hover:bg-white/80 bg-white/50">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-charcoal hover:bg-charcoal/90 text-alabaster">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

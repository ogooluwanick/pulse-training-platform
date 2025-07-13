"use client"

import { useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react"; // Import useSession
import NotificationPanel from "@/components/notification-panel";
import { useNotificationContext } from "@/app/contexts/NotificationContext";

export function TopMenu() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const user = session?.user; // Assuming session.user contains the user data
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { unreadNotificationCount } = useNotificationContext();

  // Add a check for user existence before accessing properties
  // The conditional rendering below already handles cases where user might be null.

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

        {/* Right side - Auth/User elements */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Notifications Bell */}
              <div className="relative cursor-pointer" onClick={() => setIsPanelOpen(true)}>
                <button className="flex justify-center items-center bg-white rounded-full h-8 w-8 transition hover:bg-charcoal hover:text-white"><Bell size={18} /></button>
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
              <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />

              {/* User Info */}
              <div className="flex items-center cursor-pointer">
                <img src={user?.image || "/placeholder-user.jpg"} alt="Profile" className="h-8 w-8 rounded-full mr-2" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-charcoal">{user?.name || "User"}</span>
                  {/* Removed company and role display due to TS errors */}
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <button className="px-4 py-2 rounded-md border border-charcoal text-charcoal hover:bg-charcoal hover:text-white transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-charcoal/90 transition-colors">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

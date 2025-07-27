"use client"

import { useState } from "react";
import { Bell, User } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; 
import NotificationPanel from "@/components/notification-panel";
import { useNotificationContext } from "@/app/contexts/NotificationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopMenu() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user; 
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { unreadNotificationCount } = useNotificationContext();

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
          {isLoading ? (
            /* Loading State */
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="flex flex-col space-y-1">
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ) : isAuthenticated ? (
            <>
              {/* Notifications Bell */}
              <div
                className="relative cursor-pointer"
                onClick={() => setIsPanelOpen(true)}
              >
                <button className="flex justify-center items-center bg-white rounded-full h-8 w-8 transition hover:bg-charcoal hover:text-white">
                  <Bell size={18} />
                </button>
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
              <NotificationPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
              />

              {/* User Info Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer group">
                    {user?.profileImageUrl ? (
                      <img
                        src={user?.profileImageUrl}
                        alt="Profile"
                        className="h-8 w-8 rounded-full mr-2"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full mr-2">
                        <button className="flex justify-center items-center bg-white rounded-full h-8 w-8 transition group-hover:bg-charcoal group-hover:text-white">
                          <User size={18} />
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-charcoal capitalize truncate max-w-[180px]">
                        {user?.firstName ||
                          (isAuthenticated ? 'Loading...' : 'Loading...')}
                      </span>
                      <span className="text-xs text-gray-700 capitalize truncate max-w-[180px]">
                        {user?.companyName}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
  );
}

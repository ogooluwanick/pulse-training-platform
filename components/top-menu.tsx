'use client';

import { useState, useEffect } from 'react';
import { Bell, User, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import NotificationPanel from '@/components/notification-panel';
import { useNotificationContext } from '@/app/contexts/NotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopMenuProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function TopMenu({
  sidebarOpen = false,
  onToggleSidebar,
}: TopMenuProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user;
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { unreadNotificationCount, refetchNotifications } =
    useNotificationContext();

  // Fetch notifications when the top bar loads, then every 10 minutes
  useEffect(() => {
    if (isAuthenticated) {
      refetchNotifications();
      const intervalId = setInterval(
        () => {
          refetchNotifications();
        },
        10 * 60 * 1000
      );
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, refetchNotifications]);

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
        <div className="flex items-center space-x-3">
          {isLoading ? (
            /* Loading State */
            <div className="flex items-center space-x-3">
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
              {/* <DropdownMenu>
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
                  <DropdownMenuLabel className="text-charcoal">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}

              {/* Sidebar Toggle Button */}
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="flex justify-center items-center bg-white rounded-full h-8 w-8 transition hover:bg-charcoal hover:text-white"
                >
                  {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              )}
            </>
          ) : (
            /* Unauthenticated State */
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-md border border-charcoal text-charcoal hover:bg-charcoal hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-md bg-charcoal text-white hover:bg-charcoal/90 transition-soft"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

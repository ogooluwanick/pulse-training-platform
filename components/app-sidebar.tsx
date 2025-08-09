'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import {
  BookOpen,
  BarChart3,
  Users,
  Settings,
  Home,
  Award,
  MessageSquare,
  Building2,
  LogOut,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompanySwitcher } from '@/components/company-switcher';

// Fetch learning data for badge count
const fetchLearningData = async () => {
  const response = await fetch('/api/employee/learning');
  if (!response.ok) {
    throw new Error('Failed to fetch learning data');
  }
  const data = await response.json();
  return data.uncompletedCoursesCount || 0;
};

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'My Learning',
    url: '/learning',
    icon: BookOpen,
    badge: 'dynamic',
  },
  {
    title: 'Course Catalog',
    url: '/catalog',
    icon: Award,
  },
];

// const managementItems = [
//   {
//     title: 'Analytics',
//     url: '/analytics',
//     icon: BarChart3,
//   },
//   {
//     title: 'Team Management',
//     url: '/team',
//     icon: Users,
//   },
//   {
//     title: 'Organization',
//     url: '/organization',
//     icon: Building2,
//   },
// ];

const companyItems = [
  {
    title: 'Employee Management',
    url: '/employee-management',
    icon: Users,
  },
  {
    title: 'Course Assignment',
    url: '/course-assignment',
    icon: BookOpen,
  },
  {
    title: 'Course Builder',
    url: '/course-builder',
    icon: BookOpen,
  },
];

const adminItems = [
  // {
  //   title: 'Admin Dashboard',
  //   url: '/admin',
  //   icon: BarChart3,
  // },
  {
    title: 'Company Management',
    url: '/admin/companies',
    icon: Building2,
  },
  {
    title: 'Employee Management',
    url: '/admin/employees',
    icon: Users,
  },
  {
    title: 'Course Builder',
    url: '/admin/course-builder',
    icon: BookOpen,
  },
  {
    title: 'Reports',
    url: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'Inquiries',
    url: '/admin/inquiries',
    icon: MessageSquare,
  },
];

const accountItems = [
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';

  // Fetch uncompleted courses count for badge
  const { data: uncompletedCount } = useQuery({
    queryKey: ['learningBadge'],
    queryFn: fetchLearningData,
    enabled: !!user && user.role === 'EMPLOYEE',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Update navigation items with real badge count
  const updatedNavigationItems = navigationItems.map((item) => {
    if (item.title === 'My Learning' && item.badge === 'dynamic') {
      return {
        ...item,
        badge: uncompletedCount?.toString() || '0',
      };
    }
    return item;
  });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-[55] transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-72 sm:w-80 z-[60] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="h-full border-l border-warm-gray/20 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-warm-gray/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-charcoal text-alabaster">
                <span className="text-sm sm:text-lg font-bold">P</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-charcoal">
                  Pulse
                </h1>
                <p className="text-xs sm:text-sm text-warm-gray">
                  Intelligent Workspace
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              // Loading state for sidebar content
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ) : !user ? (
              // No user state - show basic navigation
              <div className="p-4">
                <p className="text-sm text-gray-500">
                  Please sign in to access navigation.
                </p>
              </div>
            ) : (
              // User is loaded - show full navigation
              <div className="p-4 space-y-6">
                {/* Main Navigation */}
                <div>
                  <div className="text-warm-gray font-medium mb-2">Menu</div>
                  <div className="space-y-1">
                    {updatedNavigationItems.map((item) => {
                      const employeeOnlyItems = ['My Learning', 'Discussions'];

                      // Show employee items only to employees
                      if (
                        employeeOnlyItems.includes(item.title) &&
                        user?.role !== 'EMPLOYEE'
                      ) {
                        return null;
                      }

                      // Show Course Catalog for COMPANY and ADMIN in their sections
                      if (
                        item.title === 'Course Catalog' &&
                        user?.role !== 'EMPLOYEE'
                      ) {
                        return null; // Will be rendered in company/admin section below
                      }

                      // Hide Course Catalog for EMPLOYEE users
                      if (
                        item.title === 'Course Catalog' &&
                        user?.role === 'EMPLOYEE'
                      ) {
                        return null;
                      }

                      return (
                        <Link
                          key={item.title}
                          href={item.url}
                          className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-alabaster transition-colors"
                          onClick={onToggle}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm sm:text-base">
                              {item.title}
                            </span>
                          </div>
                          {item.badge && item.badge !== '0' && (
                            <Badge className="bg-charcoal text-alabaster text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}

                    {/* Add Course Catalog for company and admin */}
                    {(user?.role === 'COMPANY' || user?.role === 'ADMIN') && (
                      <Link
                        href="/catalog"
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-alabaster transition-colors"
                        onClick={onToggle}
                      >
                        <Award className="h-4 w-4" />
                        <span className="text-sm sm:text-base">
                          Course Catalog
                        </span>
                      </Link>
                    )}

                    {/* Add company items for COMPANY users */}
                    {user?.role === 'COMPANY' &&
                      companyItems.map((item) => (
                        <Link
                          key={item.title}
                          href={item.url}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-alabaster transition-colors"
                          onClick={onToggle}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm sm:text-base">
                            {item.title}
                          </span>
                        </Link>
                      ))}

                    {/* Add admin items for ADMIN users */}
                    {user?.role === 'ADMIN' &&
                      adminItems.map((item) => (
                        <Link
                          key={item.title}
                          href={item.url}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-alabaster transition-colors"
                          onClick={onToggle}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm sm:text-base">
                            {item.title}
                          </span>
                        </Link>
                      ))}

                    {/* Add management items for COMPANY and ADMIN users */}
                    {/* {(user?.role === 'COMPANY' || user?.role === 'ADMIN') && (
                      <>
                        <div className="border-t border-warm-gray/20 my-2"></div>
                        <div className="text-warm-gray font-medium mb-2">
                          Management
                        </div>
                        {managementItems.map((item) => (
                          <Link
                            key={item.title}
                            href={item.url}
                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-alabaster transition-colors"
                            onClick={onToggle}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm sm:text-base">
                              {item.title}
                            </span>
                          </Link>
                        ))}
                      </>
                    )} */}
                  </div>
                </div>

                {/* Account items for all users */}
                <div className="border-t border-warm-gray/20 pt-4">
                  <div className="text-warm-gray font-medium mb-2">Account</div>
                  <div className="space-y-1">
                    {accountItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.url}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-alabaster transition-colors"
                        onClick={onToggle}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm sm:text-base">
                          {item.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-warm-gray/20">
            {isLoading ? (
              // Loading state for footer
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : !user ? (
              // No user state for footer
              <div className="text-center">
                <p className="text-sm text-gray-500">Please sign in</p>
              </div>
            ) : (
              // User is loaded - show full footer
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-charcoal text-alabaster">
                      {user.firstName
                        ? `${user.firstName} ${user.lastName}`
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                        : ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate capitalize">
                      {user.firstName || user.email}
                    </p>
                    <p className="text-xs text-warm-gray capitalize">
                      {(() => {
                        const getCookie = (name: string) => {
                          const value = `; ${document.cookie}`;
                          const parts = value.split(`; ${name}=`);
                          if (parts.length === 2)
                            return parts.pop()?.split(';').shift();
                          return null;
                        };

                        const activeCompanyId = getCookie('activeCompanyId');
                        if (activeCompanyId) {
                          const companyIndex =
                            user?.companyIds?.indexOf(
                              decodeURIComponent(activeCompanyId)
                            ) || -1;
                          return (
                            user?.companyNames?.[companyIndex]?.toLowerCase() ||
                            user?.companyName?.toLowerCase()
                          );
                        }
                        return user?.companyName?.toLowerCase();
                      })()}
                    </p>
                    <p className="text-xs text-warm-gray capitalize">
                      {user?.role?.toLowerCase()}
                    </p>
                  </div>
                </div>
                {/* Company Switcher */}
                <div className="mb-3">
                  <CompanySwitcher className="w-full justify-between" />
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent border-warm-gray/30 text-charcoal hover:bg-alabaster"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

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
  Menu,
  X,
  User,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  {
    title: 'Discussions',
    url: '/discussions',
    icon: MessageSquare,
  },
];

const managementItems = [
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Team Management',
    url: '/team',
    icon: Users,
  },
  {
    title: 'Organization',
    url: '/organization',
    icon: Building2,
  },
];

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
    title: 'Culture Builder',
    url: '/culture-builder',
    icon: Building2,
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
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

const adminItems = [
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
    title: 'Culture Builder',
    url: '/admin/culture-builder',
    icon: Building2,
  },
  {
    title: 'Reports',
    url: '/admin/reports',
    icon: BarChart3,
  },
  {
    title: 'Platform Settings',
    url: '/admin/platform',
    icon: Settings,
  },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const { data: session } = useSession();
  const user = session?.user;

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

  if (!user) return null;

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
      {/* Toggle Button - Fixed position on left side, vertically centered */}
      <Button
        onClick={onToggle}
        className="fixed left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-50 bg-alabaster hover:bg-alabaster/90 text-charcoal shadow-soft-lg rounded-full p-2 sm:p-3 transition-soft border border-warm-gray/20"
        size="icon"
      >
        {isOpen ? (
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
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
        className={`fixed left-0 top-0 h-full w-72 sm:w-80 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          className="border-r border-warm-gray/20 h-full"
          style={{ backgroundColor: '#f5f4ed' }}
        >
          <SidebarHeader className="p-4 sm:p-6">
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
          </SidebarHeader>

          <SidebarContent>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-warm-gray font-medium px-4 sm:px-6">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Dashboard and Employee items */}
                  {updatedNavigationItems.map((item) => {
                    const employeeOnlyItems = ['My Learning', 'Discussions']; // Removed 'Calendar' from here
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
                    // For COMPANY users, add companyItems directly to Menu
                    if (
                      user?.role === 'COMPANY' &&
                      item.title === 'Dashboard'
                    ) {
                      return (
                        <>
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className="hover:bg-alabaster"
                              onClick={onToggle}
                            >
                              <Link
                                href={item.url}
                                className="flex items-center justify-between"
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
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          {/* Add Course Catalog for company */}
                          <SidebarMenuItem key="Course Catalog">
                            <SidebarMenuButton
                              asChild
                              className="hover:bg-alabaster"
                              onClick={onToggle}
                            >
                              <Link
                                href="/catalog"
                                className="flex items-center gap-3"
                              >
                                <Award className="h-4 w-4" />
                                <span className="text-sm sm:text-base">
                                  Course Catalog
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          {/* Add companyItems directly under Menu for COMPANY users */}
                          {companyItems.map((companyItem) => (
                            <SidebarMenuItem key={companyItem.title}>
                              <SidebarMenuButton
                                asChild
                                className="hover:bg-alabaster"
                                onClick={onToggle}
                              >
                                <Link
                                  href={companyItem.url}
                                  className="flex items-center gap-3"
                                >
                                  <companyItem.icon className="h-4 w-4" />
                                  <span className="text-sm sm:text-base">
                                    {companyItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </>
                      );
                    }
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className="hover:bg-alabaster"
                          onClick={onToggle}
                        >
                          <Link
                            href={item.url}
                            className="flex items-center justify-between"
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
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {/* Management items for COMPANY users */}
                  {
                    user?.role === 'COMPANY' &&
                      false /* Remove Company section group */
                  }

                  {/* Admin items for ADMIN users */}
                  {user?.role === 'ADMIN' && (
                    <>
                      <SidebarSeparator />
                      <SidebarGroup>
                        <SidebarGroupLabel className="text-warm-gray font-medium px-4 sm:px-6">
                          Admin
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            {/* Add Course Catalog for admin */}
                            <SidebarMenuItem key="Course Catalog">
                              <SidebarMenuButton
                                asChild
                                className="hover:bg-alabaster"
                                onClick={onToggle}
                              >
                                <Link
                                  href="/catalog"
                                  className="flex items-center gap-3"
                                >
                                  <Award className="h-4 w-4" />
                                  <span className="text-sm sm:text-base">
                                    Course Catalog
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            {adminItems.map((item) => (
                              <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                  asChild
                                  className="hover:bg-alabaster"
                                  onClick={onToggle}
                                >
                                  <Link
                                    href={item.url}
                                    className="flex items-center gap-3"
                                  >
                                    <item.icon className="h-4 w-4" />
                                    <span className="text-sm sm:text-base">
                                      {item.title}
                                    </span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                    </>
                  )}

                  {/* Account items for all users */}
                  <SidebarSeparator />
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-warm-gray font-medium px-4 sm:px-6">
                      Account
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {accountItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className="hover:bg-alabaster"
                              onClick={onToggle}
                            >
                              <Link
                                href={item.url}
                                className="flex items-center gap-3"
                              >
                                <item.icon className="h-4 w-4" />
                                <span className="text-sm sm:text-base">
                                  {item.title}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
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
                <p className="text-sm font-medium text-charcoal truncate">
                  {user.firstName || user.email}
                </p>
                <p className="text-xs text-warm-gray capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
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
          </SidebarFooter>
        </Sidebar>
      </div>
    </>
  );
}

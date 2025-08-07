'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import FullPageLoader from '@/components/full-page-loader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { TopMenu } from '@/components/top-menu';

// Pages that are completely public (no layout components)
const COMPLETELY_PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/employee-signup',
  '/auth/verification-result',
];

// Pages that are public but should have top menu
const PUBLIC_PAGES_WITH_TOP_MENU = ['/'];

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/learning',
  '/catalog',
  '/discussions',
  '/analytics',
  '/team',
  '/organization',
  '/employee-management',
  '/course-assignment',
  '/course-builder',
  '/reports',
  '/profile',
  '/settings',
  '/calendar',
  '/videos',
];

// Role-based route access
const ROLE_ACCESS = {
  ADMIN: [
    '/dashboard',
    '/admin',
    '/course-assignment',
    '/course-builder',
    '/catalog',
    '/reports',
    '/analytics',
    '/profile',
    '/settings',
  ],
  COMPANY: [
    '/dashboard',
    '/course-assignment',
    '/course-builder',
    '/catalog',
    '/employee-management',
    '/reports',
    '/analytics',
    '/profile',
    '/settings',
  ],
  EMPLOYEE: ['/dashboard', '/learning', '/catalog', '/profile', '/settings'],
};

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle authentication
  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    // Check if current path is protected
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      if (status === 'unauthenticated') {
        signIn(undefined, { callbackUrl: pathname });
        return;
      }

      if (session?.user?.role) {
        const allowedRoutes =
          ROLE_ACCESS[session.user.role as keyof typeof ROLE_ACCESS] || [];
        const hasAccess = allowedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (!hasAccess) {
          toast.error('You do not have permission to access this page.');
          router.push('/dashboard');
        }
      }
    }
  }, [status, session, router, pathname]);

  // Check if current page is completely public (no layout components)
  const isCompletelyPublicPage = COMPLETELY_PUBLIC_PAGES.includes(pathname);

  // Check if current page is public but should have top menu
  const isPublicPageWithTopMenu = PUBLIC_PAGES_WITH_TOP_MENU.includes(pathname);

  // Show loading for protected routes while session is loading
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && status === 'loading') {
    return <FullPageLoader />;
  }

  // If it's a completely public page, render without any layout components
  if (isCompletelyPublicPage) {
    return <>{children}</>;
  }

  // If it's a public page that should have top menu (like landing page)
  if (isPublicPageWithTopMenu) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
        <TopMenu key={`top-menu-${pathname}`} sidebarOpen={false} />
        {children}
      </div>
    );
  }

  // For protected routes, check authentication
  if (isProtectedRoute) {
    if (status === 'unauthenticated' || !session?.user) {
      return <FullPageLoader />;
    }

    // Check role access
    const allowedRoutes =
      ROLE_ACCESS[session.user.role as keyof typeof ROLE_ACCESS] || [];
    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!hasAccess) {
      return <FullPageLoader />;
    }
  }

  // For all other pages, render with full layout (sidebar, top menu)
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
      <TopMenu
        key={`top-menu-${pathname}`}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <main className="flex-1">{children}</main>
    </div>
  );
}

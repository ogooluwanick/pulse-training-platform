'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { TopMenu } from '@/components/top-menu';
import { AuthGuard } from '@/components/auth-guard';

// Pages that need auth but don't need sidebar/top menu
const AUTH_ONLY_PAGES = ['/auth/verify-email', '/auth/verification-result'];

// Pages that are public but should have top menu
const PUBLIC_PAGES_WITH_TOP_MENU = ['/'];

// Pages that are completely public (no auth, no sidebar, no top menu)
const COMPLETELY_PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/employee-signup',
  '/auth/verification-result',
];

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if current page is completely public (no layout components)
  const isCompletelyPublicPage = COMPLETELY_PUBLIC_PAGES.includes(pathname);

  // Check if current page is public but should have top menu
  const isPublicPageWithTopMenu = PUBLIC_PAGES_WITH_TOP_MENU.includes(pathname);

  // Check if current page only needs auth but no sidebar/top menu
  const isAuthOnlyPage = AUTH_ONLY_PAGES.includes(pathname);

  // If it's a completely public page, render without any layout components
  if (isCompletelyPublicPage) {
    return <>{children}</>;
  }

  // If it's a public page that should have top menu (like landing page)
  if (isPublicPageWithTopMenu) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
        <TopMenu key={`top-menu-${pathname}`} />
        {children}
      </div>
    );
  }

  // If it's an auth-only page, render with just auth guard
  if (isAuthOnlyPage) {
    return (
      <AuthGuard>
        <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
          {children}
        </div>
      </AuthGuard>
    );
  }

  // For all other pages, render with full layout (sidebar, top menu, auth)
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
        <TopMenu key={`top-menu-${pathname}`} />
        <SidebarProvider>
          <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
          <main className="flex-1 pl-12 sm:pl-16 lg:pl-0">{children}</main>
        </SidebarProvider>
      </div>
    </AuthGuard>
  );
}

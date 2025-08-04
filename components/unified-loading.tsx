'use client';

import { usePathname } from 'next/navigation';

// Pages that should show loading with top navigation
const PAGES_WITH_TOP_NAV = ['/'];

// Pages that should show full page loader (no top nav)
const PAGES_WITH_FULL_LOADER = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/employee-signup',
  '/auth/verification-result',
];

interface UnifiedLoadingProps {
  placeholder?: string;
}

export function UnifiedLoading({
  placeholder = 'workspace',
}: UnifiedLoadingProps) {
  const pathname = usePathname();

  // Check if current page should show top nav with loading
  const shouldShowTopNav = PAGES_WITH_TOP_NAV.includes(pathname);

  // Check if current page should show full page loader
  const shouldShowFullLoader = PAGES_WITH_FULL_LOADER.includes(pathname);

  // If it's a page that should show top nav with loading
  if (shouldShowTopNav) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster mx-auto animate-pulse">
              <span className="text-lg font-bold">P</span>
            </div>
            <p className="text-warm-gray">Loading your {placeholder}...</p>
          </div>
        </div>
      </div>
    );
  }

  // If it's a page that should show full page loader
  if (shouldShowFullLoader) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm min-h-[90vh]">
        <div className="text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster mx-auto animate-pulse">
            <span className="text-lg font-bold">P</span>
          </div>
          <p className="text-warm-gray">Loading your {placeholder}...</p>
        </div>
      </div>
    );
  }

  // For all other pages (dashboard, learning, etc.), show loading without top menu to avoid duplicates
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f4ed' }}>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] pl-12 sm:pl-16 lg:pl-0">
        <div className="text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster mx-auto animate-pulse">
            <span className="text-lg font-bold">P</span>
          </div>
          <p className="text-warm-gray">Loading your {placeholder}...</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FullPageLoader from './full-page-loader';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect if we're definitely unauthenticated and haven't already redirected
    if (status === 'unauthenticated' && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading while session is loading
  if (status === 'loading') {
    return <FullPageLoader />;
  }

  // If unauthenticated, don't render content (redirect is happening)
  if (status === 'unauthenticated') {
    return <FullPageLoader />;
  }

  // Double-check session exists
  if (!session?.user) {
    return <FullPageLoader />;
  }

  // Check role permissions
  if (
    allowedRoles &&
    !allowedRoles.some((role) => session.user?.role === role)
  ) {
    router.push('/dashboard/unauthorized');
    return <FullPageLoader />;
  }

  return <>{children}</>;
};

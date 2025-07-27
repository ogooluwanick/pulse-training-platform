import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  try {
    // Set a reasonable timeout for token verification to avoid hanging
    const token = (await Promise.race([
      getToken({ req, secret: process.env.NEXTAUTH_SECRET }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Token verification timeout')), 3000)
      ),
    ])) as any;

    const { pathname } = req.nextUrl;

    // Allow requests for static files and auth pages
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.') ||
      pathname.startsWith('/auth')
    ) {
      return NextResponse.next();
    }

    if (token) {
      // If the user is authenticated, redirect them to the dashboard if they try to access the sign-in or sign-up pages
      if (pathname === '/auth/signin' || pathname === '/auth/signup') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } else {
      // If the user is not authenticated, allow access only to the landing page and auth pages
      // Allow all protected routes to be handled by client-side AuthGuard
      const protectedRoutes = [
        '/dashboard',
        '/learning',
        '/catalog',
        '/discussions',
        '/analytics',
        '/team',
        '/organization',
        '/employee-management',
        '/course-assignment',
        '/culture-builder',
        '/reports',
        '/profile',
        '/settings',
        '/calendar',
      ];

      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (
        pathname !== '/' &&
        !pathname.startsWith('/auth') &&
        !isProtectedRoute
      ) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware token verification error:', error);
    // On token verification errors, allow the request to proceed
    // Let the client-side auth handle authentication
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/forgot-password"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Auth routes
  const isAuthRoute = pathname.startsWith("/auth")

  // Protected routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/company")

  // For client-side auth, we can't check localStorage in middleware
  // So we'll let the AuthGuard component handle the actual authentication check
  // This middleware just handles basic routing logic

  // If trying to access auth pages, allow it
  if (isAuthRoute || isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, let them through and let AuthGuard handle the auth check
  if (isProtectedRoute) {
    return NextResponse.next()
  }

  return NextResponse.next()
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

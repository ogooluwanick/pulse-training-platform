import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Allow requests for static files and auth pages
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".") ||
    pathname.startsWith("/auth")
  ) {
    return NextResponse.next()
  }

  if (token) {
    // If the user is authenticated, redirect them to the dashboard if they try to access the sign-in or sign-up pages
    if (pathname === "/auth/signin" || pathname === "/auth/signup") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  } else {
    // If the user is not authenticated, allow access only to the landing page and auth pages
    if (pathname !== "/" && !pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/", req.url))
    }
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

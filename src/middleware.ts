import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicitly bypass public routes so unauthenticated clients can view them
  if (pathname.startsWith("/public")) {
    return NextResponse.next();
  }

  // Read the HttpOnly JWT cookie from the incoming request
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  // 2. Protect all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Redirect already-logged-in users away from /login and /register
  if (pathname === "/login" || pathname === "/register") {
    if (user) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes trigger this middleware
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/public/:path*"],
};

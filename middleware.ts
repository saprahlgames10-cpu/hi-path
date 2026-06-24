import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/auth/");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isPublicPage = pathname === "/" || pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.includes(".");

  if (isPublicPage) return NextResponse.next();

  // Supabase v2 stores auth token in a cookie named sb-<project-ref>-auth-token
  // Check all cookies that start with "sb-" or contain "auth-token"
  const authCookie = [...req.cookies.getAll()].find(
    (c) => c.name.startsWith("sb-") || c.name.includes("auth-token")
  );
  const hasSession = !!authCookie;

  if (isDashboardPage && !hasSession) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isAuthPage && hasSession && !pathname.includes("onboarding") && !pathname.includes("callback")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|images|.*\\..*).*)"],
};

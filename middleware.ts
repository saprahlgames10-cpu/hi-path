import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/auth/");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isPublicPage = pathname === "/" || pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.includes(".");

  if (isPublicPage) return NextResponse.next();

  const sbCookie = req.cookies.get("sb-access-token") || req.cookies.get("supabase-auth-token");
  const hasSession = !!sbCookie;

  if (isDashboardPage && !hasSession) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isAuthPage && hasSession && !pathname.includes("onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|images|.*\\..*).*)"],
};

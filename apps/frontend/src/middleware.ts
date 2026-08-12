import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/signin", "/signup"];
const PROTECTED_PAGES = ["/dashboard", "/choice", "/settings", "/explore", "/hobbies", "/messages"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get("accessToken")?.value);

  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (AUTH_PAGES.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (PROTECTED_PAGES.some((page) => pathname.startsWith(page)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/signin",
    "/signup",
    "/dashboard/:path*",
    "/choice/:path*",
    "/settings/:path*",
    "/explore/:path*",
    "/hobbies/:path*",
    "/messages/:path*",
  ],
};

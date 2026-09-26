import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/signin", "/signup"];
const PROTECTED_PAGES = ["/dashboard", "/choice", "/settings", "/explore", "/hobbies", "/messages", "/posts", "/saved", "/challenges", "/progress", "/practice"];

/**
 * Routing-only check: the token must be a JWT whose `exp` is still in the future. The signature
 * can't be verified here (the secret lives on the backend, which still verifies every request),
 * but this stops an expired or malformed leftover cookie from counting as "logged in".
 */
function hasUnexpiredToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const isAuthenticated = hasUnexpiredToken(token);

  let response: NextResponse;
  if ((pathname === "/" || AUTH_PAGES.includes(pathname)) && isAuthenticated) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else if (PROTECTED_PAGES.some((page) => pathname.startsWith(page)) && !isAuthenticated) {
    response = NextResponse.redirect(new URL("/signin", request.url));
  } else {
    response = NextResponse.next();
  }

  // Drop a stale cookie so the client-side code doesn't keep treating it as a session either
  if (token && !isAuthenticated) response.cookies.delete("accessToken");
  return response;
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
    "/posts/:path*",
    "/saved/:path*",
    "/challenges/:path*",
    "/progress/:path*",
    "/practice/:path*",
  ],
};

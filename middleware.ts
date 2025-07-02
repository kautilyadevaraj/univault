import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("univault_token")?.value;

  let userData: { userId?: string; email?: string; role?: string } = {};

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );

      userData = {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string,
      };

      // Block access to /admin for non-admins
      if (
        req.nextUrl.pathname.startsWith("/admin") &&
        userData.role !== "ADMIN"
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    } catch (err) {
      console.warn("JWT verification failed:", err);
      // If invalid token, redirect only if accessing protected route
      if (req.nextUrl.pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  } else {
    // Not logged in and accessing /admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Add user data (if available) to headers
  const requestHeaders = new Headers(req.headers);
  if (userData.userId) requestHeaders.set("x-user-id", userData.userId);
  if (userData.email) requestHeaders.set("x-user-email", userData.email);
  if (userData.role) requestHeaders.set("x-user-role", userData.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"], // Runs for all routes except static assets
};

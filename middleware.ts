import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const url = request.nextUrl.clone();

  // Define route categories
  const publicRoutes = [
    "/",
    "/search",
    "/upload",
    "/request",
  ];

  const protectedRoutes = ["/profile"];

  const adminRoutes = ["/admin"];

  // Check if current route needs protection
  const isPublicRoute = publicRoutes.some(
    (route) => url.pathname === route || url.pathname.startsWith(route + "/")
  );

  const isProtectedRoute = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  // Skip authentication check for public routes
  if (isPublicRoute && !isProtectedRoute && !isAdminRoute) {
    return response;
  }

  // Get user session only for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes
  if (!user && (isProtectedRoute || isAdminRoute)) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", url.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth pages
  if (user && (url.pathname === "/login" || url.pathname === "/signup")) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  // Handle admin routes
  if (user && isAdminRoute) {
    const { data: userProfile } = await supabase
      .from("User")
      .select("role")
      .eq("authId", user.id)
      .single();

    if (!userProfile || userProfile.role !== "ADMIN") {
      if (url.pathname.startsWith("/api/admin")) {
        return new NextResponse(
          JSON.stringify({ message: "Insufficient permissions" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const redirectUrl = url.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

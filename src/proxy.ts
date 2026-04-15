"use server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/events", "/about", "/contact", "/blog"];

export async function proxy(req: NextRequest) {
  let res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value),
          );
          res = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error, data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  // Only fetch profile if we have a logged-in user
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isPublicPage = PUBLIC_ROUTES.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );

  if (req.nextUrl.pathname === "/") {
    return res;
  }

  if (req.nextUrl.pathname === "/organizer") {
    return NextResponse.redirect(new URL("/organizer/dashboard", req.url));
  }

  if (profile?.role !== "admin" && req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/organizer/dashboard", req.url));
  }

  if ((error || !claims) && !isAuthPage && !isPublicPage) {
    // Redirect to login if trying to access protected route
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (claims && isAuthPage) {
    // Redirect to dashboard if already logged in and trying to access auth pages
    return NextResponse.redirect(new URL("/organizer/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.endsWith(path));
}

function isAuthApiRoute(pathname: string): boolean {
  return pathname.startsWith("/auth/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n for /auth/* API routes (callback, signout)
  if (isAuthApiRoute(pathname)) {
    return NextResponse.next();
  }

  // 1. Run next-intl middleware to handle locale routing
  const intlResponse = intlMiddleware(request);

  // 2. Refresh Supabase session via cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            intlResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Redirect unauthenticated users to login (except public paths)
  if (!user && !isPublicPath(pathname)) {
    const locale = routing.locales.find((l) => pathname.startsWith(`/${l}`));
    const prefix = locale ? `/${locale}` : `/${routing.defaultLocale}`;
    const loginUrl = new URL(`${prefix}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redirect authenticated users away from auth pages
  if (user && isPublicPath(pathname)) {
    const locale = routing.locales.find((l) => pathname.startsWith(`/${l}`));
    const prefix = locale ? `/${locale}` : `/${routing.defaultLocale}`;
    const dashboardUrl = new URL(`${prefix}/`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

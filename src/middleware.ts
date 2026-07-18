import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, parseSessionValue } from "@/lib/auth";

/**
 * Route protection for the gated Studio surfaces (DESIGN.md §4.5).
 *
 * Creation is privileged (Ramp operators), consumption is open (anyone), so we
 * only guard `/studio/**`. The Landing, Arcade, and game viewer stay public.
 *
 * Note: Next.js 16 renamed this file convention to `proxy.ts`; `middleware.ts`
 * still runs (deprecated). Kept as `middleware.ts` per project ownership rules.
 */
export function middleware(request: NextRequest) {
  const session = parseSessionValue(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    const { pathname, search } = request.nextUrl;
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/:path*"],
};

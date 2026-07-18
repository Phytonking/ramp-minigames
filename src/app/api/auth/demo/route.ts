import { NextResponse } from "next/server";
import {
  DEMO_USER,
  SESSION_COOKIE,
  createSessionValue,
  sanitizeNext,
  sessionCookieOptions,
} from "@/lib/auth";

/**
 * POST /api/auth/demo — the science-fair escape hatch (DESIGN.md §4.5).
 * One click signs the visitor in as the seeded demo operator so the
 * walkthrough never fumbles a password. Defaults to redirecting into /studio.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { next?: unknown };
  const next = sanitizeNext(typeof body.next === "string" ? body.next : null);

  const response = NextResponse.json({
    ok: true,
    redirect: next,
    user: DEMO_USER,
  });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionValue(DEMO_USER),
    sessionCookieOptions
  );
  return response;
}

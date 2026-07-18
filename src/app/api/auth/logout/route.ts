import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/** POST /api/auth/logout — clear the session cookie (used by the UserMenu). */
export async function POST() {
  const response = NextResponse.json({ ok: true, redirect: "/" });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

/** GET /api/auth/logout — same, but redirects to the landing page for plain links. */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionValue,
  nameFromEmail,
  roleForEmail,
  sanitizeNext,
  sessionCookieOptions,
  type SessionUser,
} from "@/lib/auth";

/**
 * POST /api/auth/login — set the mock session cookie.
 *
 * DEMO ONLY: any email/password combination is accepted. The role is derived
 * from the email domain (@ramp.com → operator, otherwise viewer). No password
 * is ever checked or stored — this is a science-fair front door, not real auth.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown;
    next?: unknown;
  };

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const next = sanitizeNext(typeof body.next === "string" ? body.next : null);

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Enter an email to continue." },
      { status: 400 }
    );
  }

  const user: SessionUser = {
    email,
    name: nameFromEmail(email),
    role: roleForEmail(email),
  };

  const response = NextResponse.json({ ok: true, redirect: next, user });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionValue(user),
    sessionCookieOptions
  );
  return response;
}

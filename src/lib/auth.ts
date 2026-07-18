/**
 * Auth helpers — thin wrappers over @neondatabase/auth.
 * All routes/components should import from here, not from lib/auth/server directly.
 */

export type Role = "admin" | "public";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const ADMIN_EMAILS = new Set([
  "avi.agola@gmail.com",
]);

export function roleForEmail(email: string): Role {
  const e = email.trim().toLowerCase();
  if (ADMIN_EMAILS.has(e)) return "admin";
  if (e.endsWith("@ramp.com")) return "admin";
  return "public";
}

export function sanitizeNext(
  next: string | null | undefined,
  fallback = "/arcade"
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/**
 * Read the current Neon Auth session on the server.
 * Returns null when no session exists or auth env vars are missing.
 */
export async function getSession(): Promise<SessionUser | null> {
  if (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET) {
    return null;
  }
  try {
    const { auth } = await import("@/lib/auth/server");
    const { data } = await auth.getSession();
    if (!data?.user) return null;
    const u = data.user;
    return {
      id: u.id,
      email: u.email ?? "",
      name: u.name ?? u.email ?? "User",
      role: roleForEmail(u.email ?? ""),
    };
  } catch {
    return null;
  }
}

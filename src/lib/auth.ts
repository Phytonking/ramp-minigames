/**
 * Auth helpers — thin wrappers over @neondatabase/auth.
 * All routes/components should import from here, not from lib/auth/server directly.
 */

export type Role = "operator" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** Cookie name kept for legacy compat (middleware still checks it during transition). */
export const SESSION_COOKIE = "rmg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Whether a given email gets operator access (ramp.com employees). */
export function roleForEmail(email: string): Role {
  return email.trim().toLowerCase().endsWith("@ramp.com") ? "operator" : "viewer";
}

export function sanitizeNext(
  next: string | null | undefined,
  fallback = "/studio"
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/**
 * Read the current Neon Auth session on the server.
 * Returns null when no session exists or auth env vars are missing.
 */
export async function getSession(): Promise<SessionUser | null> {
  // Guard: if Neon Auth isn't configured yet, fail gracefully
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

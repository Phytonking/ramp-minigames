/**
 * Mock auth core for the Ramp Minigames demo.
 *
 * SECURITY NOTE: this is a science-fair / hackathon demo. The session is just a
 * base64-encoded JSON blob stored in a cookie — it is NOT signed, NOT encrypted,
 * and trivially forgeable. Do not use anything here for real authentication.
 * The whole point is a lightweight, dependency-free front door for the Studio.
 */

export type Role = "operator" | "viewer";

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
}

/** Cookie that carries the mock session blob. */
export const SESSION_COOKIE = "rmg_session";

/** Session lifetime — 7 days is plenty for a demo. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Seeded demo operator — the science-fair escape hatch (DESIGN.md §4.5). */
export const DEMO_USER: SessionUser = {
  email: "demo@ramp.com",
  name: "Demo Operator",
  role: "operator",
};

/**
 * Operator role is reserved for Ramp emails to reinforce the "Ramp employee
 * console" framing; everyone else signs in as a viewer. (Demo accepts any
 * email/password — see the route handlers.)
 */
export function roleForEmail(email: string): Role {
  return email.trim().toLowerCase().endsWith("@ramp.com")
    ? "operator"
    : "viewer";
}

/** Derive a friendly display name from an email local-part, e.g. jane.doe → Jane Doe. */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "operator";
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Operator"
  );
}

// Runtime-agnostic base64 (works in both the Node.js and Edge runtimes, so the
// same helpers can be shared between route handlers and middleware).
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Constrain a `next` redirect target to a same-origin absolute path so the
 * login flow can't be turned into an open redirect.
 */
export function sanitizeNext(
  next: string | null | undefined,
  fallback = "/studio"
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/** Cookie options shared by every handler that writes the session. */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
} as const;

/** Serialize a user into the opaque cookie value. */
export function createSessionValue(user: SessionUser): string {
  return toBase64(JSON.stringify(user));
}

/** Parse a cookie value back into a SessionUser, or null if it is malformed. */
export function parseSessionValue(value: string | undefined): SessionUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(fromBase64(value)) as Partial<SessionUser>;
    if (
      typeof parsed?.email === "string" &&
      typeof parsed?.name === "string" &&
      (parsed?.role === "operator" || parsed?.role === "viewer")
    ) {
      return { email: parsed.email, name: parsed.name, role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Read the current session on the server (Server Components, Route Handlers).
 * `cookies()` is async in Next.js 16, so this must be awaited.
 */
export async function getSession(): Promise<SessionUser | null> {
  // Imported lazily so this module stays free of `next/headers` at the top
  // level and can be safely shared with middleware.
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return parseSessionValue(store.get(SESSION_COOKIE)?.value);
}

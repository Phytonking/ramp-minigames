"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

/**
 * Session avatar + dropdown for the top-right of gated Studio surfaces.
 *
 * Self-contained: pass the current session (from a Server Component via
 * `getSession()`); pass `null` to render the signed-out "Sign in" CTA.
 * Exported for the Studio to drop into its own layout — not wired here.
 */
export function UserMenu({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-sm text-ink outline-none transition-colors hover:bg-bg focus-visible:ring-2 focus-visible:ring-focus"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-bg">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">
          {user.name}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-ink-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-[--radius-md] border border-line bg-bg"
        >
          <div className="border-b border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-ink">
                {user.name}
              </p>
              <Badge
                variant={user.role === "operator" ? "solar" : "outline"}
                className="shrink-0 capitalize"
              >
                {user.role}
              </Badge>
            </div>
            <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
              {user.email}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/studio/runs"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-2 text-sm text-ink outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
            >
              <History className="size-4 text-ink-muted" />
              Run history
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-2 text-sm text-ink outline-none transition-colors hover:bg-surface focus-visible:bg-surface disabled:opacity-50"
            >
              <LogOut className="size-4 text-ink-muted" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

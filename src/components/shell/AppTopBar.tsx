"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RampMinigamesLogo } from "@/components/RampMinigamesLogo";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { href: "/arcade", label: "Arcade" },
  { href: "/studio", label: "Studio" },
] as const;

const ADMIN_NAV = [
  { href: "/admin", label: "Admin" },
] as const;

export function AppTopBar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-hairline bg-canvas/80 px-5 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/" className="shrink-0">
          <RampMinigamesLogo />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-surface text-ink"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
          {isAdmin &&
            ADMIN_NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-surface text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

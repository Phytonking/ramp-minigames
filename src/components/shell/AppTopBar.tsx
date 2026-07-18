"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import type { SessionUser } from "@/lib/auth";

function sectionTitle(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/studio/runs")) return "Run history";
  if (pathname.startsWith("/studio")) return "Studio";
  if (pathname.startsWith("/arcade")) return "Arcade";
  if (pathname.startsWith("/games")) return "Now playing";
  return "Ramp Minigames";
}

export function AppTopBar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-hairline bg-canvas/80 px-5 backdrop-blur">
      <div className="min-w-0">
        <span className="text-sm font-medium tracking-[-0.01em]">
          {sectionTitle(pathname)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

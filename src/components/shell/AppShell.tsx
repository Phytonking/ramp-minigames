"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppTopBar } from "@/components/shell/AppTopBar";
import type { SessionUser } from "@/lib/auth";

/**
 * Global app shell: left sidebar directory + a slim top bar carrying the
 * theme toggle and session menu. Auth screens (/login, /signup) render bare
 * so sign-in stays focused.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (bare) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar user={user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { AppTopBar } from "@/components/shell/AppTopBar";
import type { SessionUser } from "@/lib/auth";

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
    <div className="flex min-h-screen flex-col">
      <AppTopBar user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}

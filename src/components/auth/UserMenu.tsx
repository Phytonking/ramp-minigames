"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return <span className="h-7 w-16 animate-pulse rounded-[--radius-sm] bg-night-border" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 font-mono text-[11px] text-paper-muted sm:flex">
          <User className="size-3" />
          {session.user.name ?? session.user.email}
        </span>
        <Button
          variant="ghost-dark"
          size="sm"
          onClick={async () => {
            await authClient.signOut();
            router.refresh();
          }}
        >
          <LogOut className="size-3.5" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline-dark" size="sm" asChild>
      <Link href="/login?next=/arcade">
        <LogIn className="size-3.5" />
        Sign in
      </Link>
    </Button>
  );
}

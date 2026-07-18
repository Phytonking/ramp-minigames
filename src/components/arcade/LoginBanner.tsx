"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth/client";

export function LoginBanner() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending || session?.user) return null;

  return (
    <div className="border-b border-night-border bg-night-soft/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2.5">
        <p className="font-mono text-[11px] text-paper-muted">
          <span className="text-solar">→</span>{" "}
          Sign in to save your score and track progress across games
        </p>
        <Link
          href="/login?next=/arcade"
          className="shrink-0 font-mono text-[11px] text-paper underline-offset-2 hover:underline"
        >
          Log in to save your score
        </Link>
      </div>
    </div>
  );
}

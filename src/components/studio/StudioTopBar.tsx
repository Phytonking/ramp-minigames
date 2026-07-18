"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Command as CommandIcon,
  Gamepad2,
  History,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OPEN_COMMAND_EVENT } from "./CommandPalette";

const NAV = [
  { href: "/studio", label: "New", icon: Sparkles, exact: true },
  { href: "/studio/runs", label: "Runs", icon: History, exact: false },
];

export function StudioTopBar() {
  const pathname = usePathname();

  const openPalette = () =>
    window.dispatchEvent(new Event(OPEN_COMMAND_EVENT));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5">
        {/* Wordmark */}
        <Link href="/studio" className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-solar" />
          <span className="text-[15px] font-medium tracking-[-0.02em]">
            Ramp Minigames
          </span>
          <span className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
            Studio
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-[--radius-sm] px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-surface text-ink"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openPalette}
            className="flex items-center gap-2 rounded-[--radius-sm] border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            <Search className="size-3.5" strokeWidth={1.75} />
            <span className="hidden md:inline">Jump to…</span>
            <span className="flex items-center gap-0.5 font-mono text-[10px]">
              <CommandIcon className="size-3" strokeWidth={1.75} />K
            </span>
          </button>

          <OperatorMenu />
        </div>
      </div>
    </header>
  );
}

function OperatorMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pl-0.5 pr-2 transition-colors hover:border-ink/30"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-medium text-bg">
          DO
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-ink-muted transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-60 overflow-hidden rounded-[--radius-md] border border-line bg-bg">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-medium text-ink">Demo Operator</p>
            <p className="font-mono text-xs text-ink-muted">operator@ramp.com</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
              <span className="size-1.5 rounded-full bg-solar" />
              operator
            </span>
          </div>
          <div className="p-1.5">
            <Link
              href="/studio/runs"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <History className="size-4" strokeWidth={1.75} />
              Run history
            </Link>
            <Link
              href="/arcade"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <Gamepad2 className="size-4" strokeWidth={1.75} />
              Open Arcade
            </Link>
          </div>
          <div className="border-t border-line p-1.5">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

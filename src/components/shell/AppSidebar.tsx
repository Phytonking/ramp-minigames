"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  Gamepad2,
  History,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { HARDCODED_GAMES } from "@/lib/games";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  gated?: boolean;
};

const PRIMARY: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/arcade", label: "Arcade", icon: Gamepad2 },
  { href: "/studio", label: "Studio", icon: Sparkles, gated: true },
  { href: "/studio/runs", label: "Run history", icon: History, gated: true },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppSidebar() {
  const isActive = useIsActive();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-hairline bg-panel/40 md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-hairline px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-[--radius-xs] bg-solar text-on-solar">
            <span className="size-2 rounded-[2px] bg-on-solar" />
          </span>
          <span className="text-sm font-medium tracking-[-0.01em]">
            Ramp Minigames
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        <div className="flex flex-col gap-0.5">
          {PRIMARY.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
            Games
          </p>
          <div className="flex flex-col gap-0.5">
            {HARDCODED_GAMES.map((game) => {
              const href = `/games/${game.slug}`;
              return (
                <Link
                  key={game.slug}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-[--radius-sm] px-3 py-1.5 text-sm transition-colors",
                    isActive(href)
                      ? "bg-panel-2 text-fg"
                      : "text-fg-muted hover:bg-panel-2 hover:text-fg"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      game.accent === "solar" ? "bg-solar" : "bg-blaze"
                    )}
                  />
                  {game.title}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-hairline p-3">
        <p className="px-1 font-mono text-[11px] text-fg-muted">
          one system · three games
        </p>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-[--radius-sm] px-3 py-2 text-sm transition-colors",
        active
          ? "bg-panel-2 font-medium text-fg"
          : "text-fg-muted hover:bg-panel-2 hover:text-fg"
      )}
    >
      <Icon className="size-4" />
      <span className="flex-1">{item.label}</span>
      {item.gated ? (
        <Lock className="size-3 text-fg-muted opacity-60" />
      ) : null}
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Segmented light/dark switch. Renders a stable placeholder until mounted
 *  to avoid a hydration mismatch (theme is only known client-side). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = (mounted ? theme ?? resolvedTheme : undefined) as
    | "light"
    | "dark"
    | undefined;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-hairline bg-panel p-0.5",
        className
      )}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={active === "light"}
        aria-label="Light mode"
        className={cn(
          "grid size-7 place-items-center rounded-full transition-colors",
          active === "light"
            ? "bg-solar text-on-solar"
            : "text-fg-muted hover:text-fg"
        )}
      >
        <Sun className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={active === "dark"}
        aria-label="Dark mode"
        className={cn(
          "grid size-7 place-items-center rounded-full transition-colors",
          active === "dark"
            ? "bg-solar text-on-solar"
            : "text-fg-muted hover:text-fg"
        )}
      >
        <Moon className="size-3.5" />
      </button>
    </div>
  );
}

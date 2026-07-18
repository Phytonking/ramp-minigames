"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  ArrowRight,
  Gamepad2,
  History,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/** Dispatch this to open the palette from anywhere (e.g. the top-bar button). */
export const OPEN_COMMAND_EVENT = "studio:open-command";

interface Action {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  href: string;
}

const ACTIONS: Action[] = [
  {
    id: "new",
    label: "New generation",
    hint: "Start a fresh pipeline run",
    icon: Sparkles,
    href: "/studio",
  },
  {
    id: "runs",
    label: "Run history",
    hint: "Every generation, as a table",
    icon: History,
    href: "/studio/runs",
  },
  {
    id: "arcade",
    label: "Open Arcade",
    hint: "The consumer game gallery",
    icon: Gamepad2,
    href: "/arcade",
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
    };
  }, []);

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Studio command menu"
    >
      {/* Scrim */}
      <button
        aria-label="Close command menu"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink/20 backdrop-blur-[1px] motion-reduce:backdrop-blur-none"
      />

      <Command
        label="Studio command menu"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="relative mt-[18vh] w-full max-w-lg overflow-hidden rounded-[--radius-lg] border border-line bg-bg"
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Command.Input
            autoFocus
            placeholder="Jump to…"
            className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[320px] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-ink-muted">
            No matches.
          </Command.Empty>
          <Command.Group
            heading="Navigate"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-muted"
          >
            {ACTIONS.map((a) => (
              <Command.Item
                key={a.id}
                value={`${a.label} ${a.hint}`}
                onSelect={() => run(a.href)}
                className="group flex cursor-pointer items-center gap-3 rounded-[--radius-sm] px-3 py-2.5 text-sm text-ink data-[selected=true]:bg-surface"
              >
                <a.icon
                  className="size-4 text-ink-muted group-data-[selected=true]:text-ink"
                  strokeWidth={1.75}
                />
                <span className="flex-1">{a.label}</span>
                <span className="text-xs text-ink-muted">{a.hint}</span>
                <ArrowRight className="size-3.5 text-ink-muted opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

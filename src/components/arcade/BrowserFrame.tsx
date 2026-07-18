"use client";

import * as React from "react";
import { Lock, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Browser-chrome frame for a generated game's Daytona preview: a mono URL bar
 * and a booting → live status dot, then the sandboxed iframe.
 */
export function BrowserFrame({ url, title }: { url: string; title: string }) {
  const [live, setLive] = React.useState(false);

  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* keep raw url */
  }

  return (
    <div className="overflow-hidden rounded-[--radius-lg] border border-night-border bg-night-card">
      <div className="flex items-center gap-3 border-b border-night-border px-3 py-2">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-night-border" />
          <span className="size-2.5 rounded-full bg-night-border" />
          <span className="size-2.5 rounded-full bg-night-border" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-[--radius-sm] border border-night-border bg-night px-2.5 py-1">
          <Lock className="size-3 text-paper-muted" />
          <span className="truncate font-mono text-[11px] text-paper-muted">
            {host}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                live ? "bg-solar" : "bg-blaze animate-pulse"
              )}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
              {live ? "live" : "booting"}
            </span>
          </span>
        </div>
        <RotateCw className="size-3.5 text-paper-muted" />
      </div>
      <div className="relative aspect-[16/10] w-full bg-night">
        <iframe
          src={url}
          title={title}
          onLoad={() => setLive(true)}
          className="absolute inset-0 h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
}

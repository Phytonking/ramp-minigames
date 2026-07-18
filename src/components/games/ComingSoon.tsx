"use client";

import * as React from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Shared themed placeholder for games whose mechanic isn't fully built yet.
 * Keeps the Arcade dark system intact so stubs still feel authored.
 */
export function ComingSoon({
  title,
  concept,
  mechanic,
  preview,
  children,
}: {
  title: string;
  concept: string;
  mechanic: string;
  accent?: "solar" | "blaze";
  preview?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <Badge variant="outline-dark">
          <Wrench className="size-3" />
          Prototype in progress
        </Badge>
        <h2 className="text-4xl font-medium tracking-[-0.02em] text-paper">
          {title}
        </h2>
        <p className="max-w-md text-base text-paper-muted">{concept}</p>
      </div>

      {preview && (
        <div className="flex w-full items-center justify-center rounded-[--radius-md] border border-night-border bg-night-soft/60 p-8">
          {preview}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline-dark">{mechanic}</Badge>
        {children}
      </div>
    </div>
  );
}

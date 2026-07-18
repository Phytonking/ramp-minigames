"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Lock,
  Play,
  RotateCw,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/games";

export interface LivePreviewProps {
  game: Game;
  previewUrl: string;
  /** Closing stat template from the generated spec. */
  closingStat: string;
  reducedMotion?: boolean;
  onNewRun: () => void;
}

export function LivePreview({
  game,
  previewUrl,
  closingStat,
  reducedMotion = false,
  onNewRun,
}: LivePreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-2 items-center justify-center">
            <span className="size-2 animate-pulse rounded-full bg-solar" />
          </span>
          <span className="font-mono text-xs uppercase tracking-wide text-ink-muted">
            Preview live
          </span>
          <Badge variant="mono" className="gap-1.5">
            <ShieldCheck className="size-3" strokeWidth={1.75} />
            Sandbox isolated
          </Badge>
        </div>
        <span className="font-mono text-[11px] text-ink-muted">
          untrusted AI code, safely contained
        </span>
      </div>

      {/* Browser-chrome preview frame */}
      <div className="overflow-hidden rounded-[--radius-lg] border border-line bg-surface">
        <div className="flex items-center gap-3 border-b border-line bg-bg px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-line" />
            <span className="size-2.5 rounded-full border border-line" />
            <span className="size-2.5 rounded-full border border-line" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-[--radius-sm] border border-line bg-surface px-2.5 py-1">
            <Lock className="size-3 text-ink-muted" strokeWidth={1.75} />
            <span className="truncate font-mono text-[11px] text-ink-muted">
              {previewUrl}
            </span>
          </div>
          <RotateCw className="size-3.5 text-ink-muted" strokeWidth={1.75} />
        </div>

        {/* Faux playable surface */}
        <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-5 bg-bg px-6 py-12 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-[0.6]">
            <div className="mx-auto h-full max-w-md bg-[radial-gradient(circle_at_50%_0%,rgba(228,242,34,0.10),transparent_60%)]" />
          </div>

          <Badge variant="outline" className="relative">
            {game.mechanicLabel}
          </Badge>
          <div className="relative">
            <h3 className="text-3xl font-medium tracking-[-0.02em]">
              {game.title}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
              {game.teaches}
            </p>
          </div>

          <Button variant="solar" size="lg" className="relative gap-2" asChild>
            <Link href={`/games/${game.slug}`}>
              <Play className="size-4 fill-current" strokeWidth={0} />
              Play preview
            </Link>
          </Button>

          <p className="relative max-w-sm font-mono text-xs text-ink-muted">
            {closingStat}
          </p>
        </div>
      </div>

      {/* Payoff actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ink" size="sm" asChild>
            <Link href="/arcade">
              Open in Arcade <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="size-4" /> Share
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onNewRun}>
          <RotateCw className="size-4" /> New generation
        </Button>
      </div>
    </motion.div>
  );
}

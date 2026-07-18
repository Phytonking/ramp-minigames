"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Share2, Camera, Code2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/games";

/**
 * Shareable end-screen — the "would someone screenshot this?" moment.
 * Oversized --solar stat numeral, one-line takeaway, and share affordances.
 */
export function GameResultCard({
  game,
  heroValue,
  heroCaption,
  takeaway,
  score,
  onReplay,
}: {
  game: Game;
  /** The big number, already formatted (e.g. "62%"). */
  heroValue: string;
  /** Small caption under the numeral. */
  heroCaption: string;
  /** One-line takeaway (the filled closing-stat template). */
  takeaway: string;
  score: number;
  onReplay?: () => void;
}) {
  const reduce = useReducedMotion();

  const shareText = `${game.title}: ${takeaway}`;

  const onShare = React.useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${game.title} — Ramp Minigames`, text: shareText, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`.trim());
      toast.success("Result copied to clipboard");
    } catch {
      toast.error("Couldn't copy — try again");
    }
  }, [game.title, shareText]);

  const onScreenshot = React.useCallback(() => {
    toast("Screenshot", {
      description: "Frame is screenshot-ready — capture and post it.",
    });
  }, []);

  const onEmbed = React.useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const snippet = `<iframe src="${url}" width="480" height="640" style="border:0" title="${game.title}"></iframe>`;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Embed code copied");
    } catch {
      toast("Embed", { description: snippet });
    }
  }, [game.title]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-[--radius-lg] border border-night-border bg-night-card"
    >
      <div className="flex items-center justify-between border-b border-night-border px-6 py-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
          {game.title}
        </span>
        <Badge variant="mono-dark">score {score}</Badge>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
          {game.source.report}
        </span>
        <motion.div
          initial={reduce ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "font-sans text-7xl font-medium leading-none tracking-[-0.03em] text-solar tabular-nums"
          )}
        >
          {heroValue}
        </motion.div>
        <span className="text-sm text-paper-muted">{heroCaption}</span>
      </div>

      <div className="border-t border-night-border px-6 py-5">
        <p className="text-center text-base leading-snug text-paper">
          {takeaway}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-night-border p-4">
        <Button variant="solar" className="w-full" onClick={onShare}>
          <Share2 className="size-4" />
          Share result
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline-dark" onClick={onScreenshot}>
            <Camera className="size-4" />
            Screenshot
          </Button>
          <Button variant="outline-dark" onClick={onEmbed}>
            <Code2 className="size-4" />
            Embed
          </Button>
        </div>
        {onReplay && (
          <Button variant="ghost-dark" className="w-full" onClick={onReplay}>
            <RotateCcw className="size-4" />
            Play again
          </Button>
        )}
      </div>
    </motion.div>
  );
}

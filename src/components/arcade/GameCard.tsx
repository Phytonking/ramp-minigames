"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameThumbnail } from "@/components/arcade/GameThumbnail";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/games";

/**
 * Premium game card — provenance-forward, with an animated thumbnail that
 * comes alive on hover, a mechanic tag, the core insight it teaches, and a
 * hover-revealed closing stat + Play CTA. Motion is subtle (expo-out, 200–300ms).
 */
export function GameCard({
  game,
  featured = false,
}: {
  game: Game;
  featured?: boolean;
}) {
  const reduce = useReducedMotion();
  const [hover, setHover] = React.useState(false);

  const closingStatTeaser = game.closingStat.replace(/\{[A-Za-z]+\}/g, "—");

  return (
    <motion.article
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      animate={reduce ? undefined : { y: hover ? -4 : 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[--radius-lg] border bg-night-card transition-colors duration-200",
        hover ? "border-paper-muted/50" : "border-night-border",
        featured && "md:col-span-2 md:flex-row"
      )}
    >
      <GameThumbnail
        game={game}
        active={hover}
        className={cn(
          "h-44 w-full shrink-0 border-b border-night-border",
          featured && "md:h-auto md:w-1/2 md:border-b-0 md:border-r"
        )}
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-mono text-[11px] text-paper-muted">
              <FileText className="size-3" />
              <span className="truncate">{game.source.report}</span>
            </div>
            <h3
              className={cn(
                "font-medium tracking-[-0.02em] text-paper",
                featured ? "text-3xl" : "text-2xl"
              )}
            >
              {game.title}
            </h3>
          </div>
          {game.status === "live" && (
            <Badge variant="outline-dark" className="shrink-0">
              <span className="size-1.5 rounded-full bg-solar" />
              Live
            </Badge>
          )}
        </div>

        <Badge variant="mono-dark" className="self-start">
          {game.mechanicLabel}
        </Badge>

        <p className="text-sm leading-relaxed text-paper-muted">
          {game.teaches}
        </p>

        {/* Hover-revealed closing stat + CTA */}
        <AnimatePresence initial={false}>
          {(hover || reduce) && (
            <motion.div
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 border-t border-night-border pt-4">
                <p className="text-xs uppercase tracking-widest text-paper-muted">
                  <span className="font-mono">Ends with</span> · {closingStatTeaser}
                </p>
                <Button
                  variant="solar"
                  size="sm"
                  className="relative z-20 self-start"
                  asChild
                >
                  <Link href={`/games/${game.slug}`}>
                    Play
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full-card link for pointer users (the explicit Play CTA sits above it
          at z-20 and stays keyboard-reachable). */}
      <Link
        href={`/games/${game.slug}`}
        aria-label={`Play ${game.title}`}
        className="absolute inset-0 z-10 rounded-[--radius-lg] focus-visible:outline-none"
        tabIndex={-1}
      />
    </motion.article>
  );
}

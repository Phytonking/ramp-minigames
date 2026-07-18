"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Game } from "@/lib/games";
import { cn } from "@/lib/utils";

/**
 * Animated, mechanic-specific thumbnail loops keyed off the game accent.
 * CSS/motion only (no per-card canvas) so a dense grid stays performant.
 * `active` drives whether the loop runs (e.g. only on hover).
 */
export function GameThumbnail({
  game,
  active,
  className,
}: {
  game: Game;
  active: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const run = active && !reduce;
  const accent = game.accent === "solar" ? "bg-solar" : "bg-blaze";
  const accentBorder =
    game.accent === "solar" ? "border-solar/40" : "border-blaze/40";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-night-soft bg-grid",
        className
      )}
    >
      {/* accent wash that sweeps on hover */}
      <motion.div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          game.accent === "solar"
            ? "bg-gradient-to-tr from-solar/12 via-transparent to-transparent"
            : "bg-gradient-to-tr from-blaze/12 via-transparent to-transparent"
        )}
        animate={{ opacity: run ? 1 : 0.45 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="absolute inset-0 grid place-items-center p-6">
        {game.mechanic === "resource-sorting" && (
          <SortingLoop run={run} accent={accent} accentBorder={accentBorder} />
        )}
        {game.mechanic === "judgment-under-volume" && (
          <TriageLoop run={run} accent={accent} />
        )}
        {game.mechanic === "timed-race" && (
          <RaceLoop run={run} accent={accent} />
        )}
      </div>
    </div>
  );
}

function SortingLoop({
  run,
  accent,
  accentBorder,
}: {
  run: boolean;
  accent: string;
  accentBorder: string;
}) {
  return (
    <div className="relative flex h-full w-full max-w-[220px] items-end justify-between gap-4">
      {[0, 1, 2].map((col) => (
        <div key={col} className="flex flex-1 flex-col items-center gap-1.5">
          <motion.span
            className={cn(
              "h-2.5 w-2.5 rounded-[3px] border",
              col === 1 ? cn(accent, "border-transparent") : accentBorder
            )}
            animate={run ? { y: [-14, 0], opacity: [0, 1] } : { y: 0, opacity: 0.7 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              repeat: run ? Infinity : 0,
              repeatDelay: 0.5 + col * 0.25,
            }}
          />
          <span className="h-10 w-full rounded-[--radius-xs] border border-night-border bg-night-card/70" />
        </div>
      ))}
    </div>
  );
}

function TriageLoop({ run, accent }: { run: boolean; accent: string }) {
  return (
    <div className="relative h-[92px] w-[150px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-x-0 rounded-[--radius-sm] border border-night-border bg-night-card"
          style={{ top: i * 10, height: 46, zIndex: 3 - i }}
          animate={
            run
              ? { x: i === 0 ? [0, 120] : 0, opacity: i === 0 ? [1, 0] : 1 }
              : { x: 0, opacity: 1 }
          }
          transition={{
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            repeat: run ? Infinity : 0,
            repeatDelay: 1,
          }}
        >
          <span className="absolute left-2 top-2 h-1.5 w-10 rounded-full bg-night-border" />
          <span
            className={cn(
              "absolute bottom-2 right-2 h-2 w-2 rounded-full",
              i === 0 ? accent : "bg-night-border"
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

function RaceLoop({ run, accent }: { run: boolean; accent: string }) {
  return (
    <div className="flex w-full max-w-[200px] flex-col gap-3">
      {[
        { c: "bg-paper-muted", to: 60, dur: 2.2 },
        { c: accent, to: 96, dur: 0.9 },
      ].map((row, i) => (
        <div
          key={i}
          className="h-2 w-full overflow-hidden rounded-full bg-night-card"
        >
          <motion.div
            className={cn("h-full rounded-full", row.c)}
            animate={run ? { width: ["6%", `${row.to}%`] } : { width: "20%" }}
            transition={{
              duration: row.dur,
              ease: "linear",
              repeat: run ? Infinity : 0,
              repeatDelay: 0.6,
            }}
          />
        </div>
      ))}
    </div>
  );
}

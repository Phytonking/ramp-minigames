"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LaunchLoader } from "@/components/arcade/LaunchLoader";
import { GameResultCard } from "@/components/arcade/GameResultCard";
import { BrowserFrame } from "@/components/arcade/BrowserFrame";
import SpendSort from "@/components/games/SpendSort";
import Triage from "@/components/games/Triage";
import ThenVsNow from "@/components/games/ThenVsNow";
import type { Game } from "@/lib/games";

/** Payload every playable game hands back when it finishes. */
export type GameCompletion = { score: number; statValue: number };

type Phase = "loading" | "live" | "result";

/** Fill closing-stat placeholders like {X} / {N} from a value map. */
function fillTemplate(template: string, fills: Record<string, string | number>) {
  return template.replace(/\{([A-Za-z]+)\}/g, (m, key: string) =>
    key in fills ? String(fills[key]) : m
  );
}

/** Per-game result presentation (hero numeral + caption + takeaway line). */
function computeResult(game: Game, c: GameCompletion) {
  switch (game.slug) {
    case "spend-sort":
      return {
        heroValue: `${c.statValue}%`,
        heroCaption: "less spend vs. routing everything to the frontier tier",
        takeaway: fillTemplate(game.closingStat, { X: c.statValue }),
      };
    default:
      return {
        heroValue: String(c.score),
        heroCaption: "final score",
        takeaway: game.teaches,
      };
  }
}

function LocalGame({
  game,
  onComplete,
}: {
  game: Game;
  onComplete: (c: GameCompletion) => void;
}) {
  switch (game.slug) {
    case "spend-sort":
      return <SpendSort onComplete={onComplete} />;
    case "triage":
      return <Triage />;
    case "then-vs-now":
      return <ThenVsNow />;
    default:
      return null;
  }
}

export function GameViewer({ game }: { game: Game }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [completion, setCompletion] = React.useState<GameCompletion | null>(null);
  const [runId, setRunId] = React.useState(0);

  const isPreview = Boolean(game.previewUrl);

  const handleComplete = React.useCallback((c: GameCompletion) => {
    setCompletion(c);
    setPhase("result");
  }, []);

  const replay = React.useCallback(() => {
    setCompletion(null);
    setRunId((n) => n + 1);
    setPhase("live");
  }, []);

  const result = completion ? computeResult(game, completion) : null;

  return (
    <main className="flex min-h-screen flex-col">
      {/* Viewer top bar */}
      <header className="sticky top-0 z-30 border-b border-night-border bg-night/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost-dark" size="sm" asChild>
            <Link href="/arcade">
              <ArrowLeft className="size-4" />
              Arcade
            </Link>
          </Button>
          <div className="flex min-w-0 flex-col items-center text-center">
            <span className="truncate text-sm font-medium text-paper">
              {game.title}
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-widest text-paper-muted">
              {game.mechanicLabel}
            </span>
          </div>
          <Badge variant="mono-dark" className="shrink-0">
            {game.status === "live" ? "local" : game.status}
          </Badge>
        </div>
      </header>

      {/* Provenance strip */}
      <details className="group border-b border-night-border bg-night-soft/50">
        <summary className="mx-auto flex max-w-5xl cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 font-mono text-[11px] text-paper-muted">
          <span className="truncate">
            <span className="text-paper">source</span> · {game.source.report}
          </span>
          <ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <p className="text-sm italic leading-relaxed text-paper-muted">
            “{game.source.excerpt}”
          </p>
        </div>
      </details>

      {/* Stage */}
      <div className="relative flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "loading" && (
            <motion.div
              key="loader"
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <LaunchLoader
                title={game.title}
                subtitle={
                  isPreview
                    ? "Booting an isolated sandbox for AI-generated code…"
                    : "Getting the board ready…"
                }
                onReady={() => setPhase("live")}
              />
            </motion.div>
          )}

          {phase !== "loading" && (
            <motion.div
              key="stage"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {isPreview && game.previewUrl ? (
                <div className="mx-auto w-full max-w-4xl px-4 py-6">
                  <BrowserFrame url={game.previewUrl} title={game.title} />
                </div>
              ) : (
                <div key={runId}>
                  <LocalGame game={game} onComplete={handleComplete} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result overlay */}
        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-night/85 p-4 backdrop-blur-sm"
            >
              <GameResultCard
                game={game}
                heroValue={result.heroValue}
                heroCaption={result.heroCaption}
                takeaway={result.takeaway}
                score={completion?.score ?? 0}
                onReplay={replay}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

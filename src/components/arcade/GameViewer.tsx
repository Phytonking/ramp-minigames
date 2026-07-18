"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ChevronDown, Code2, Play, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LaunchLoader } from "@/components/arcade/LaunchLoader";
import { GameResultCard } from "@/components/arcade/GameResultCard";
import { BrowserFrame } from "@/components/arcade/BrowserFrame";
import SpendSort from "@/components/games/SpendSort";
import Triage from "@/components/games/Triage";
import ThenVsNow from "@/components/games/ThenVsNow";
import type { Game } from "@/lib/games";

export type GameCompletion = { score: number; statValue: number };

type Phase = "loading" | "live" | "result";
type Tab = "game" | "code";

function fillTemplate(template: string, fills: Record<string, string | number>) {
  return template.replace(/\{([A-Za-z]+)\}/g, (m, key: string) =>
    key in fills ? String(fills[key]) : m
  );
}

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

function LocalGame({ game, onComplete }: { game: Game; onComplete: (c: GameCompletion) => void }) {
  switch (game.slug) {
    case "spend-sort": return <SpendSort onComplete={onComplete} />;
    case "triage": return <Triage />;
    case "then-vs-now": return <ThenVsNow />;
    default: return null;
  }
}

/** Source file path for each hardcoded game (shown in code panel). */
const GAME_SOURCE_PATH: Record<string, string> = {
  "spend-sort": "src/components/games/SpendSort.tsx",
  "triage": "src/components/games/Triage.tsx",
  "then-vs-now": "src/components/games/ThenVsNow.tsx",
};

/** Daytona sandbox launch URL — for generated games this is the actual preview URL;
 *  for hardcoded games this is a placeholder that shows the run-in-sandbox concept. */
function getDaytonaLaunchInfo(game: Game) {
  if (game.previewUrl) {
    return { url: game.previewUrl, label: "Open in Daytona sandbox" };
  }
  return {
    url: null,
    label: "Run in Daytona sandbox",
    description:
      "AI-generated games spin up in an isolated Daytona workspace. This is one of the three handcrafted games — it runs locally.",
  };
}

export function GameViewer({ game }: { game: Game }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [completion, setCompletion] = React.useState<GameCompletion | null>(null);
  const [runId, setRunId] = React.useState(0);
  const [tab, setTab] = React.useState<Tab>("game");

  const isPreview = Boolean(game.previewUrl);
  const daytonaInfo = getDaytonaLaunchInfo(game);
  const sourcePath = GAME_SOURCE_PATH[game.slug];

  const handleComplete = React.useCallback(
    async (c: GameCompletion) => {
      setCompletion(c);
      setPhase("result");
      // Fire-and-forget: save session to Neon DB
      try {
        await fetch("/api/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            gameSlug: game.slug,
            score: c.score,
            statValue: { value: c.statValue },
          }),
        });
      } catch {
        // non-blocking — don't surface DB errors to the player
      }
    },
    [game.slug]
  );

  const replay = React.useCallback(() => {
    setCompletion(null);
    setRunId((n) => n + 1);
    setPhase("live");
  }, []);

  const result = completion ? computeResult(game, completion) : null;

  return (
    <main className="flex min-h-screen flex-col theme-arcade">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-night-border bg-night/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost-dark" size="sm" asChild>
            <Link href="/arcade">
              <ArrowLeft className="size-4" />
              Arcade
            </Link>
          </Button>
          <div className="flex min-w-0 flex-col items-center text-center">
            <span className="truncate text-sm font-medium text-paper">{game.title}</span>
            <span className="truncate font-mono text-[10px] uppercase tracking-widest text-paper-muted">
              {game.mechanicLabel}
            </span>
          </div>
          <Badge variant="mono-dark" className="shrink-0">
            {game.status === "live" ? (isPreview ? "daytona" : "local") : game.status}
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
          <p className="text-sm italic leading-relaxed text-paper-muted">"{game.source.excerpt}"</p>
        </div>
      </details>

      {/* Tab bar — Game / Code */}
      <div className="border-b border-night-border bg-night-soft/30">
        <div className="mx-auto flex max-w-5xl gap-0 px-4">
          {(["game", "code"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                tab === t
                  ? "border-solar text-paper"
                  : "border-transparent text-paper-muted hover:text-paper"
              }`}
            >
              {t === "game" ? <Play className="size-3" /> : <Code2 className="size-3" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stage */}
      {tab === "game" ? (
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
                      ? "Booting an isolated Daytona sandbox…"
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
      ) : (
        /* Code / Daytona panel */
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
          {/* Daytona sandbox box */}
          <div className="rounded-[--radius-lg] border border-night-border bg-night-card p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium text-paper">Daytona Sandbox</h2>
                <p className="mt-1 text-xs text-paper-muted">
                  {isPreview
                    ? "This game runs in an isolated Daytona workspace. Open it in a browser or embed it anywhere."
                    : "AI-generated games get their own isolated Daytona workspace with a live preview URL. The three handcrafted games run locally — the generated ones will appear here."}
                </p>
              </div>
              {isPreview && game.previewUrl ? (
                <Button variant="solar" size="sm" asChild>
                  <a href={game.previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    Open sandbox
                  </a>
                </Button>
              ) : (
                <Badge variant="mono-dark">local · no sandbox</Badge>
              )}
            </div>

            {isPreview && game.previewUrl && (
              <BrowserFrame url={game.previewUrl} title={game.title} />
            )}

            {!isPreview && (
              <div className="rounded-[--radius-sm] border border-night-border bg-night px-4 py-3">
                <p className="font-mono text-[11px] text-paper-muted">
                  <span className="text-solar">$</span> daytona create --repo{" "}
                  <span className="text-paper">Phytonking/ramp-minigames</span> --game{" "}
                  <span className="text-paper">{game.slug}</span>
                </p>
                <p className="mt-1 font-mono text-[10px] text-paper-muted/60">
                  → spins up an isolated workspace, injects this component, returns a live preview URL
                </p>
              </div>
            )}
          </div>

          {/* Source code viewer */}
          {sourcePath && (
            <div className="rounded-[--radius-lg] border border-night-border bg-night-card">
              <div className="flex items-center justify-between border-b border-night-border px-4 py-2.5">
                <span className="font-mono text-[11px] text-paper-muted">{sourcePath}</span>
                <Badge variant="mono-dark">React · TypeScript</Badge>
              </div>
              <GameSourceLoader slug={game.slug} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/** Lazy-loads the game source code from the API and renders it. */
function GameSourceLoader({ slug }: { slug: string }) {
  const [code, setCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/game-source?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.text())
      .then(setCode)
      .catch(() => setCode("// source unavailable"));
  }, [slug]);

  if (!code) {
    return (
      <div className="px-4 py-6 font-mono text-[11px] text-paper-muted">
        Loading source…
      </div>
    );
  }

  return (
    <pre className="max-h-[600px] overflow-auto px-4 py-4 font-mono text-[11px] leading-relaxed text-paper-muted">
      <code>{code}</code>
    </pre>
  );
}

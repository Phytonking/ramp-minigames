"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameResultCard } from "@/components/arcade/GameResultCard";
import type { Game } from "@/lib/games";
import type { SpendSortResult } from "@/components/games/SpendSort";

const LOCAL_GAMES: Record<
  string,
  React.ComponentType<{ onComplete?: (r: SpendSortResult) => void }>
> = {
  "spend-sort": dynamic(() => import("@/components/games/SpendSort")),
  triage: dynamic(() => import("@/components/games/Triage")),
  "then-vs-now": dynamic(() => import("@/components/games/ThenVsNow")),
};

const HARDCODED_SLUGS = new Set(["spend-sort", "triage", "then-vs-now"]);

async function saveScore(
  gameSlug: string,
  score: number,
  statValue?: unknown,
  durationMs?: number,
) {
  try {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlug, score, durationMs, statValue }),
    });
  } catch {}
}

export function GameViewer({ game }: { game: Game }) {
  const [result, setResult] = React.useState<SpendSortResult | null>(null);
  const [sandboxUrl, setSandboxUrl] = React.useState<string | null>(
    game.previewUrl ?? null,
  );
  const [sandboxLoading, setSandboxLoading] = React.useState(false);

  const isHardcoded = HARDCODED_SLUGS.has(game.slug) && !game.previewUrl;
  const LocalGame = LOCAL_GAMES[game.slug];

  // Fetch Daytona sandbox for hardcoded games — use our proxy to skip the warning
  React.useEffect(() => {
    if (!isHardcoded) return;
    setSandboxLoading(true);
    fetch(`/api/sandbox/${game.slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.previewUrl) setSandboxUrl(`/sandbox/${game.slug}`);
      })
      .catch(() => {})
      .finally(() => setSandboxLoading(false));
  }, [game.slug, isHardcoded]);

  const handleComplete = React.useCallback(
    (r: SpendSortResult) => {
      setResult(r);
      saveScore(game.slug, r.score, r.statValue);
    },
    [game.slug],
  );

  // Listen for postMessage from sandbox iframe (score reporting)
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "game-complete" && typeof e.data.score === "number") {
        handleComplete({ score: e.data.score, statValue: e.data.statValue ?? 0 });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handleComplete]);

  const handleReplay = React.useCallback(() => setResult(null), []);

  return (
    <main className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-hairline bg-canvas/80 px-4 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/arcade">
            <ArrowLeft className="size-4" />
            Arcade
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{game.title}</span>
          <span className="hidden truncate font-mono text-[10px] uppercase tracking-widest text-fg-muted sm:inline">
            {game.mechanicLabel}
          </span>
        </div>
        <Badge variant="outline" className="shrink-0">
          {sandboxUrl ? "daytona" : sandboxLoading ? "loading…" : "local"}
        </Badge>
      </header>

      <div className="relative flex-1 overflow-auto">
        {result ? (
          <div className="flex min-h-full items-center justify-center p-6">
            <GameResultCard
              game={game}
              heroValue={`${result.statValue}%`}
              heroCaption="saved vs. routing everything to the expensive tier"
              takeaway={game.closingStat.replace("{X}", String(result.statValue))}
              score={result.score}
              onReplay={handleReplay}
            />
          </div>
        ) : sandboxUrl ? (
          <iframe
            src={sandboxUrl}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          />
        ) : sandboxLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-solar border-t-transparent" />
              <p className="font-mono text-xs text-fg-muted">
                Spinning up Daytona sandbox…
              </p>
            </div>
          </div>
        ) : LocalGame ? (
          <LocalGame onComplete={handleComplete} />
        ) : (
          <div className="flex h-full items-center justify-center text-fg-muted">
            Game unavailable
          </div>
        )}
      </div>
    </main>
  );
}

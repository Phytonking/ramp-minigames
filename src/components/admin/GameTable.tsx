"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Game, GameStatus } from "@/lib/games";
import { GameEditDialog } from "./GameEditDialog";

const STATUS_CYCLE: Record<GameStatus, GameStatus> = {
  draft: "live",
  live: "hidden",
  hidden: "draft",
};

const STATUS_STYLE: Record<GameStatus, string> = {
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  hidden: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500",
};

const STATUS_ICON: Record<GameStatus, React.ReactNode> = {
  live: <Eye className="size-3" />,
  draft: <FileText className="size-3" />,
  hidden: <EyeOff className="size-3" />,
};

export function GameTable({ initialGames }: { initialGames: Game[] }) {
  const router = useRouter();
  const [games, setGames] = useState(initialGames);
  const [pending, startTransition] = useTransition();
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const patchGame = useCallback(
    async (slug: string, updates: Partial<Game>) => {
      const res = await fetch("/api/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...updates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Update failed");
      }
      return res.json();
    },
    []
  );

  const cycleStatus = useCallback(
    (game: Game) => {
      const next = STATUS_CYCLE[game.status];
      startTransition(async () => {
        try {
          await patchGame(game.slug, { status: next });
          setGames((g) =>
            g.map((x) => (x.slug === game.slug ? { ...x, status: next } : x))
          );
          toast.success(`${game.title} → ${next}`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        }
      });
    },
    [patchGame]
  );

  const deleteGame = useCallback(
    (slug: string) => {
      startTransition(async () => {
        try {
          const res = await fetch("/api/games", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          if (!res.ok) throw new Error("Delete failed");
          setGames((g) => g.filter((x) => x.slug !== slug));
          setConfirmDelete(null);
          toast.success("Deleted");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        }
      });
    },
    []
  );

  const moveGame = useCallback(
    (slug: string, direction: "up" | "down") => {
      const idx = games.findIndex((g) => g.slug === slug);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= games.length) return;

      const reordered = [...games];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
      setGames(reordered);

      startTransition(async () => {
        try {
          await Promise.all(
            reordered.map((g, i) => patchGame(g.slug, { sortOrder: i } as any))
          );
          toast.success("Reordered");
        } catch {
          toast.error("Reorder failed");
          router.refresh();
        }
      });
    },
    [games, patchGame, router]
  );

  const handleEditSave = useCallback(
    (updated: Game) => {
      setGames((g) =>
        g.map((x) => (x.slug === updated.slug ? updated : x))
      );
      setEditingGame(null);
      router.refresh();
    },
    [router]
  );

  return (
    <>
      <div className="overflow-hidden rounded-[--radius-lg] border border-line">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3 font-medium">Game</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Mechanic</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {games.map((game, idx) => (
              <tr
                key={game.slug}
                className="transition-colors hover:bg-surface/50"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{game.title}</span>
                      {game.hardcoded && (
                        <Badge variant="mono" className="text-[10px]">
                          built-in
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 max-w-xs truncate text-xs text-ink-muted">
                      {game.tagline}
                    </p>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="font-mono text-xs text-ink-muted">
                    {game.mechanicLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => cycleStatus(game)}
                    disabled={pending}
                    className="group"
                  >
                    <Badge
                      className={`${STATUS_STYLE[game.status]} cursor-pointer transition-all group-hover:scale-105`}
                    >
                      {STATUS_ICON[game.status]}
                      {game.status}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveGame(game.slug, "up")}
                      disabled={idx === 0 || pending}
                      className="size-8 p-0"
                      title="Move up"
                    >
                      <ArrowUpDown className="size-3.5 rotate-180" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveGame(game.slug, "down")}
                      disabled={idx === games.length - 1 || pending}
                      className="size-8 p-0"
                      title="Move down"
                    >
                      <ArrowUpDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="size-8 p-0"
                      title="View"
                    >
                      <Link href={`/games/${game.slug}`}>
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGame(game)}
                      className="size-8 p-0"
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    {confirmDelete === game.slug ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGame(game.slug)}
                          disabled={pending}
                          className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(null)}
                          className="h-8 px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(game.slug)}
                        className="size-8 p-0 text-ink-muted hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-ink-muted">
                  No games yet.{" "}
                  <Link href="/studio" className="text-ink underline">
                    Create one in Studio
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingGame && (
        <GameEditDialog
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}

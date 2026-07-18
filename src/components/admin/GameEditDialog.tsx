"use client";

import { useCallback, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Game, GameStatus } from "@/lib/games";

interface Props {
  game: Game;
  onClose: () => void;
  onSave: (updated: Game) => void;
}

export function GameEditDialog({ game, onClose, onSave }: Props) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(game.title);
  const [tagline, setTagline] = useState(game.tagline);
  const [teaches, setTeaches] = useState(game.teaches);
  const [closingStat, setClosingStat] = useState(game.closingStat);
  const [status, setStatus] = useState<GameStatus>(game.status);
  const [accent, setAccent] = useState(game.accent);

  const save = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/games", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: game.slug,
            title,
            tagline,
            teaches,
            closingStat,
            status,
            accent,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        const updated = { ...game, title, tagline, teaches, closingStat, status, accent };
        onSave(updated);
        toast.success("Saved");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }, [game, title, tagline, teaches, closingStat, status, accent, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-[--radius-lg] border border-line bg-canvas p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium">Edit: {game.slug}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Tagline" value={tagline} onChange={setTagline} />
          <Field label="Teaches" value={teaches} onChange={setTeaches} />
          <Field label="Closing stat" value={closingStat} onChange={setClosingStat} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GameStatus)}
                className="h-10 w-full rounded-[--radius-sm] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-ink/30"
              >
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Accent
              </label>
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value as "solar" | "blaze")}
                className="h-10 w-full rounded-[--radius-sm] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-ink/30"
              >
                <option value="solar">Solar</option>
                <option value="blaze">Blaze</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solar" size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-[--radius-sm] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-ink/30"
      />
    </div>
  );
}

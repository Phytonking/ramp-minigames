/**
 * Server-only registry for pipeline-generated games.
 *
 * Generated games are standalone HTML canvas games produced by the Python doodle
 * pipeline and copied into `public/generated/<slug>/`. Their metadata lives in
 * `public/generated/manifest.json`, which the /api/generate-doodle route appends to
 * whenever the Studio ships a new game. Reading it at request time (force-dynamic on
 * the pages) means Studio-generated games appear in the gallery immediately.
 *
 * This module uses `fs` and must only be imported from server components / route handlers.
 */
import fs from "fs";
import path from "path";
import type { Game } from "./games";

const MANIFEST_PATH = path.join(process.cwd(), "public", "generated", "manifest.json");

export function getGeneratedGames(): Game[] {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
    const data = JSON.parse(raw) as { games?: Game[] };
    if (Array.isArray(data.games)) {
      return data.games.map((g) => ({ ...g, hardcoded: false }));
    }
  } catch {
    // No manifest yet (or unreadable) — no generated games.
  }
  return [];
}

export function getGeneratedGame(slug: string): Game | undefined {
  return getGeneratedGames().find((g) => g.slug === slug);
}

export function appendGeneratedGame(game: Game): void {
  let games: Game[] = [];
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
    const data = JSON.parse(raw) as { games?: Game[] };
    if (Array.isArray(data.games)) games = data.games;
  } catch {
    // start fresh
  }
  // Replace any existing entry with the same slug, then prepend the new one.
  games = games.filter((g) => g.slug !== game.slug);
  games.unshift(game);
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ games }, null, 2), "utf8");
}

import { db } from "@/lib/db";
import { games as gamesTable } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type GameMechanic =
  | "resource-sorting"
  | "judgment-under-volume"
  | "timed-race"
  | string;

export type GameStatus = "live" | "draft" | "hidden";

export type GameSource = {
  report: string;
  excerpt: string;
};

export type Game = {
  slug: string;
  title: string;
  tagline: string;
  teaches: string;
  mechanic: GameMechanic;
  mechanicLabel: string;
  closingStat: string;
  source: GameSource;
  status: GameStatus;
  hardcoded: boolean;
  accent: "solar" | "blaze";
  previewUrl?: string | null;
};

function rowToGame(row: typeof gamesTable.$inferSelect): Game {
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    teaches: row.teaches,
    mechanic: row.mechanic,
    mechanicLabel: row.mechanicLabel,
    closingStat: row.closingStat,
    source: { report: row.sourceReport, excerpt: row.sourceExcerpt },
    status: row.status as GameStatus,
    hardcoded: row.hardcoded,
    accent: row.accent as "solar" | "blaze",
    previewUrl: row.previewUrl,
  };
}

/** Hardcoded fallback — used if DB is unreachable. */
const FALLBACK_GAMES: Game[] = [
  {
    slug: "spend-sort",
    title: "Spend Sort",
    tagline: "Sort the spend before the budget drains.",
    teaches: "AI / token spend is a new, unmanaged cost category.",
    mechanic: "resource-sorting",
    mechanicLabel: "Resource sorting under pressure",
    closingStat: "You saved {X}% vs. routing everything to the expensive tier.",
    source: {
      report: "AI spend / “third pillar” funding announcement",
      excerpt:
        "For 500 years business ran on people and vendors — now there’s a third pillar: tokens.",
    },
    status: "live",
    hardcoded: true,
    accent: "solar",
    previewUrl: null,
  },
  {
    slug: "triage",
    title: "Triage",
    tagline: "Approve, flag, escalate — before the queue buries you.",
    teaches: "Ramp’s agents handle routine spend so humans only deal with exceptions.",
    mechanic: "judgment-under-volume",
    mechanicLabel: "Judgment under volume",
    closingStat: "You reviewed {X} requests; the agent handled the rest.",
    source: {
      report: "AI agents for procurement launch",
      excerpt:
        "Agents approve routine requests automatically; humans only touch the hard judgment calls.",
    },
    status: "live",
    hardcoded: true,
    accent: "blaze",
    previewUrl: null,
  },
  {
    slug: "then-vs-now",
    title: "Then vs. Now",
    tagline: "Race manual receipt entry against the automated pass.",
    teaches: "The original, boring, real pain Ramp solved.",
    mechanic: "timed-race",
    mechanicLabel: "Head-to-head timed race",
    closingStat: "Manual: {X}s · Automated: instant.",
    source: {
      report: "Original expense / receipt automation product",
      excerpt:
        "Manual receipt entry and category matching vs. a one-click automated pass.",
    },
    status: "live",
    hardcoded: true,
    accent: "solar",
    previewUrl: null,
  },
];

export async function getVisibleGames(): Promise<Game[]> {
  try {
    const rows = await db
      .select()
      .from(gamesTable)
      .where(eq(gamesTable.status, "live"))
      .orderBy(asc(gamesTable.sortOrder));
    return rows.map(rowToGame);
  } catch {
    return FALLBACK_GAMES;
  }
}

export async function getAllGames(): Promise<Game[]> {
  try {
    const rows = await db
      .select()
      .from(gamesTable)
      .orderBy(asc(gamesTable.sortOrder));
    return rows.map(rowToGame);
  } catch {
    return FALLBACK_GAMES;
  }
}

export async function getGame(slug: string): Promise<Game | undefined> {
  try {
    const rows = await db
      .select()
      .from(gamesTable)
      .where(eq(gamesTable.slug, slug))
      .limit(1);
    return rows[0] ? rowToGame(rows[0]) : undefined;
  } catch {
    return FALLBACK_GAMES.find((g) => g.slug === slug);
  }
}

/** @deprecated Use getVisibleGames() instead */
export const HARDCODED_GAMES = FALLBACK_GAMES;

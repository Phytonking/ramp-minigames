/**
 * Shared game domain model — consumed by both the Arcade (consumer gallery)
 * and the Studio (generation cockpit). See PRD.md "The 3 Hardcoded Games"
 * and ramp-minigames-pitch.md "The Three Games".
 */

export type GameMechanic =
  | "resource-sorting"
  | "judgment-under-volume"
  | "timed-race"
  | string;

export type GameStatus = "live" | "generating" | "draft";

export type GameSource = {
  /** The real Ramp launch this game was generated from. */
  report: string;
  /** One-line description of the source excerpt. */
  excerpt: string;
};

export type Game = {
  slug: string;
  title: string;
  /** Short tagline shown on the card. */
  tagline: string;
  /** The core insight the game teaches. */
  teaches: string;
  mechanic: GameMechanic;
  /** Human-readable mechanic label for tags/pills. */
  mechanicLabel: string;
  /** Closing stat shown on the share screen (X is filled at runtime). */
  closingStat: string;
  source: GameSource;
  status: GameStatus;
  /** Whether this is one of the 3 handcrafted games or a pipeline output. */
  hardcoded: boolean;
  /** Accent used for the card's live thumbnail wash. */
  accent: "solar" | "blaze";
  /** Daytona preview URL for generated games (null for local/hardcoded). */
  previewUrl?: string | null;
};

/** The three handcrafted flagship games (the "proof the system produces varied output"). */
export const HARDCODED_GAMES: Game[] = [
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
    closingStat: "You reviewed {N} requests; the agent handled {M} — ~{Z} hours saved.",
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
    closingStat: "Manual: {X}m {Y}s · Automated: {Z}s.",
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

export function getGame(slug: string): Game | undefined {
  return HARDCODED_GAMES.find((g) => g.slug === slug);
}

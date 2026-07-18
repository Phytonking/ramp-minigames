import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGame, HARDCODED_GAMES } from "@/lib/games";
import { getGeneratedGames, getGeneratedGame } from "@/lib/generated";
import { GameViewer } from "@/components/arcade/GameViewer";

// Read the generated-games manifest per request so newly shipped games resolve.
export const dynamic = "force-dynamic";

function resolveGame(slug: string) {
  return getGame(slug) ?? getGeneratedGame(slug);
}

export function generateStaticParams() {
  return [...HARDCODED_GAMES, ...getGeneratedGames()].map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = resolveGame(slug);
  if (!game) return { title: "Game not found — Ramp Minigames" };
  return {
    title: `${game.title} — Ramp Minigames`,
    description: game.tagline,
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = resolveGame(slug);
  if (!game) notFound();

  return <GameViewer game={game} />;
}

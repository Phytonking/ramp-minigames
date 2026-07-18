import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGame, getVisibleGames } from "@/lib/games";
import { getGeneratedGames, getGeneratedGame } from "@/lib/generated";
import { GameViewer } from "@/components/arcade/GameViewer";

// Read the generated-games manifest per request so newly shipped games resolve.
export const dynamic = "force-dynamic";

async function resolveGame(slug: string) {
  return (await getGame(slug)) ?? getGeneratedGame(slug);
}

export async function generateStaticParams() {
  const dbGames = await getVisibleGames();
  return [...dbGames, ...getGeneratedGames()].map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await resolveGame(slug);
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
  const game = await resolveGame(slug);
  if (!game) notFound();

  return <GameViewer game={game} />;
}

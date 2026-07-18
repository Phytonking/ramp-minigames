import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGame, HARDCODED_GAMES } from "@/lib/games";
import { GameViewer } from "@/components/arcade/GameViewer";

export function generateStaticParams() {
  return HARDCODED_GAMES.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
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
  const game = getGame(slug);
  if (!game) notFound();

  return <GameViewer game={game} />;
}

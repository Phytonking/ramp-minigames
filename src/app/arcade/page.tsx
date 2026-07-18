import { getVisibleGames } from "@/lib/games";
import { GameCard } from "@/components/arcade/GameCard";
import { LoginBanner } from "@/components/arcade/LoginBanner";

export default async function ArcadePage() {
  const games = await getVisibleGames();

  return (
    <div className="min-h-screen">
      <LoginBanner />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-[-0.02em]">
              The gallery
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Three launches, three mechanics — one system that made them all.
            </p>
          </div>
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-fg-muted sm:inline">
            {games.length} games
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}

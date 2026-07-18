import Link from "next/link";
import { HARDCODED_GAMES } from "@/lib/games";
import { getGeneratedGames } from "@/lib/generated";
import { GameCard } from "@/components/arcade/GameCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { LoginBanner } from "@/components/arcade/LoginBanner";

// Re-read the generated-games manifest on every request so Studio-shipped games
// show up in the gallery immediately.
export const dynamic = "force-dynamic";

export default function ArcadePage() {
  // Generated (pipeline) games lead the gallery, then the three handcrafted flagships.
  const allGames = [...getGeneratedGames(), ...HARDCODED_GAMES];
  const [featured, ...rest] = allGames;

  return (
    <main className="min-h-screen theme-arcade">
      <header className="sticky top-0 z-30 border-b border-night-border bg-night/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link
            href="/"
            className="font-mono text-sm tracking-tight text-paper transition-colors hover:text-solar"
          >
            ramp<span className="text-paper-muted">/</span>minigames
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Login-to-save banner — UserMenu handles visibility reactively */}
      <LoginBanner />

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-paper">
              The gallery
            </h1>
            <p className="mt-1 text-sm text-paper-muted">
              Three launches, three mechanics — one system that made them all.
            </p>
          </div>
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-paper-muted sm:inline">
            {allGames.length} games
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <GameCard game={featured} featured />
          {rest.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </main>
  );
}

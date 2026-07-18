import Link from "next/link";
import { HARDCODED_GAMES } from "@/lib/games";
import { GameCard } from "@/components/arcade/GameCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { LoginBanner } from "@/components/arcade/LoginBanner";

export default function ArcadePage() {
  const [featured, ...rest] = HARDCODED_GAMES;

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
            {HARDCODED_GAMES.length} games
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

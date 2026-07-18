import Link from "next/link";
import { ArrowUpRight, LogIn } from "lucide-react";
import { HARDCODED_GAMES } from "@/lib/games";
import { GameCard } from "@/components/arcade/GameCard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getSession } from "@/lib/auth";

export default async function ArcadePage() {
  const session = await getSession();
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
            {session ? (
              <span className="hidden font-mono text-[11px] text-paper-muted sm:inline">
                {session.name}
              </span>
            ) : (
              <Button variant="outline-dark" size="sm" asChild>
                <Link href="/login?next=/arcade">
                  <LogIn className="size-3.5" />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Login-to-save banner — only shown when signed out */}
      {!session && (
        <div className="border-b border-night-border bg-night-soft/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2.5">
            <p className="font-mono text-[11px] text-paper-muted">
              <span className="text-solar">→</span>{" "}
              Sign in to save your score and track progress across games
            </p>
            <Link
              href="/login?next=/arcade"
              className="shrink-0 font-mono text-[11px] text-paper underline-offset-2 hover:underline"
            >
              Log in to save your score
            </Link>
          </div>
        </div>
      )}

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

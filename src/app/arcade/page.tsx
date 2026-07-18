import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HARDCODED_GAMES } from "@/lib/games";
import { ArcadeHero } from "@/components/arcade/ArcadeHero";
import { GameCard } from "@/components/arcade/GameCard";
import { Button } from "@/components/ui/button";

export default function ArcadePage() {
  const [featured, ...rest] = HARDCODED_GAMES;

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-night-border bg-night/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link
            href="/"
            className="font-mono text-sm tracking-tight text-paper transition-colors hover:text-solar"
          >
            ramp<span className="text-paper-muted">/</span>minigames
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-paper-muted sm:inline">
              The Arcade
            </span>
            <Button variant="outline-dark" size="sm" asChild>
              <Link href="/studio">
                Open Studio
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <ArcadeHero gameCount={HARDCODED_GAMES.length} />

      {/* Gallery */}
      <section id="games" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-paper">
              The gallery
            </h2>
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

      {/* Provenance close */}
      <section className="border-t border-night-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-6 py-14">
          <p className="max-w-2xl text-lg leading-relaxed text-paper">
            This isn&apos;t three games we made — it&apos;s one system that made
            three games.{" "}
            <span className="text-paper-muted">
              Every future Ramp launch could get one of these instead of just a
              blog post.
            </span>
          </p>
          <Button variant="ghost-dark" size="sm" asChild>
            <Link href="/studio">
              See how they&apos;re generated
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

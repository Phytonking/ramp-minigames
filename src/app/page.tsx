import Link from "next/link";
import { ArrowRight, Gamepad2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RampMinigamesLogo } from "@/components/RampMinigamesLogo";

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-ink-muted">
          <span className="size-1.5 rounded-full bg-solar" />
          Builders Cup 2026
        </div>

        <h1 className="mt-6 max-w-3xl text-5xl font-medium tracking-[-0.03em] sm:text-6xl">
          Every Ramp launch,
          <br />
          <span className="text-ink-muted">as a game you can play.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-ink-muted">
          One pipeline turns a product announcement into a polished, playable
          minigame that teaches its core idea in under 90 seconds. This isn’t
          three games we made — it’s one system that made three.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="solar">
            <Link href="/arcade">
              <Gamepad2 /> Play the arcade
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/studio">
              <Sparkles /> Open the Studio <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* Three chapters — mirrors the science-fair beats */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-5xl gap-px bg-line sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "The Pipeline",
              body: "Drop in a launch. Watch an agent extract the insight, design a mechanic, and write the game.",
            },
            {
              n: "02",
              title: "The Games",
              body: "Three real outputs from three real Ramp reports — each a genuinely different mechanic.",
            },
            {
              n: "03",
              title: "Why It Matters",
              body: "Every future launch could ship one of these instead of just a blog post.",
            },
          ].map((c) => (
            <div key={c.n} className="bg-bg p-8">
              <div className="font-mono text-sm text-ink-muted">{c.n}</div>
              <h2 className="mt-3 text-xl font-medium tracking-[-0.01em]">
                {c.title}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <RampMinigamesLogo />
            <div className="flex items-center gap-4">
              {[
                { handle: "Phytonking", href: "https://github.com/Phytonking" },
                { handle: "ddouda123", href: "https://github.com/ddouda123" },
                { handle: "nikhilkohli27", href: "https://github.com/nikhilkohli27" },
                { handle: "yashbudd", href: "https://github.com/yashbudd" },
              ].map(({ handle, href }) => (
                <a
                  key={handle}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
                >
                  @{handle}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

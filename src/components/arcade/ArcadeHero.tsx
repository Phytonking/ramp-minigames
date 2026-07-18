"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HeroPreview } from "@/components/arcade/HeroPreview";

/**
 * Editorial arcade hero — oversized restrained headline, one authored subhead,
 * a subtle grid, a live canvas preview of the sorting mechanic, and a scroll cue.
 */
export function ArcadeHero({ gameCount }: { gameCount: number }) {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay },
        };

  return (
    <section className="relative overflow-hidden border-b border-night-border bg-grid">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-night-border to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-8 md:pb-24 md:pt-28">
        <div className="flex flex-col items-start gap-6">
          <motion.div {...rise(0)}>
            <Badge variant="outline-dark">
              <span className="size-1.5 rounded-full bg-solar" />
              {gameCount} playable · generated from real Ramp launches
            </Badge>
          </motion.div>

          <motion.h1
            {...rise(0.05)}
            className="text-5xl font-medium leading-[0.98] tracking-[-0.03em] text-paper md:text-7xl"
          >
            Every launch,
            <br />
            <span className="text-paper-muted">a game you can play.</span>
          </motion.h1>

          <motion.p
            {...rise(0.12)}
            className="max-w-md text-lg leading-relaxed text-paper-muted"
          >
            One pipeline reads a Ramp announcement and ships a minigame that
            teaches its core idea in under ninety seconds. This is the showroom
            of what it made.
          </motion.p>

          <motion.div
            {...rise(0.18)}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-paper-muted"
          >
            <span>Report</span>
            <span className="text-solar">→</span>
            <span>Mechanic</span>
            <span className="text-solar">→</span>
            <span>Playable</span>
          </motion.div>
        </div>

        <motion.div
          {...rise(0.1)}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-[--radius-lg] border border-night-border bg-night-soft"
        >
          <HeroPreview className="h-full w-full" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2 font-mono text-[11px] text-paper-muted">
            <span className="size-1.5 rounded-full bg-solar" />
            live · sorting spend by tier
          </div>
        </motion.div>
      </div>

      <a
        href="#games"
        className="mx-auto mb-8 flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-paper-muted transition-colors hover:text-paper"
      >
        Browse the gallery
        <motion.span
          animate={reduce ? undefined : { y: [0, 3, 0] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </a>
    </section>
  );
}

"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Designed loading state — a narrated stepper that turns a cold start into an
 * intentional moment ("warming up your sandbox…"), per DESIGN.md §8.
 * Auto-advances through steps, then calls onReady.
 */

export type LoaderStep = { label: string; detail: string };

const DEFAULT_STEPS: LoaderStep[] = [
  { label: "Reading the launch", detail: "parsing the source Ramp report" },
  { label: "Loading the mechanic", detail: "wiring inputs and scoring" },
  { label: "Warming up your sandbox", detail: "allocating an isolated runtime" },
  { label: "Booting", detail: "starting the game server" },
];

export function LaunchLoader({
  title,
  subtitle,
  steps = DEFAULT_STEPS,
  stepDurationMs = 700,
  onReady,
}: {
  title: string;
  subtitle?: string;
  steps?: LoaderStep[];
  stepDurationMs?: number;
  onReady: () => void;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(0);
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;

  React.useEffect(() => {
    let i = 0;
    const timers: number[] = [];
    const advance = () => {
      i += 1;
      if (i < steps.length) {
        setActive(i);
        timers.push(window.setTimeout(advance, stepDurationMs));
      } else {
        setActive(steps.length);
        timers.push(window.setTimeout(() => onReadyRef.current(), 420));
      }
    };
    timers.push(window.setTimeout(advance, stepDurationMs));
    return () => timers.forEach(clearTimeout);
  }, [steps.length, stepDurationMs]);

  const done = active >= steps.length;
  const progress = Math.min(1, active / steps.length);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              done ? "bg-solar" : "bg-blaze",
              !done && !reduce && "animate-pulse"
            )}
          />
          <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
            {done ? "Live" : "Booting"}
          </span>
        </div>
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-paper">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-paper-muted">{subtitle}</p>}
      </div>

      <ol className="flex w-full flex-col gap-1">
        {steps.map((step, i) => {
          const state =
            i < active ? "done" : i === active ? "active" : "pending";
          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-[--radius-sm] px-3 py-2.5 transition-colors duration-200",
                state === "active" && "bg-night-card"
              )}
            >
              <span className="grid size-5 shrink-0 place-items-center">
                {state === "done" ? (
                  <Check className="size-4 text-solar" />
                ) : state === "active" ? (
                  <Loader2
                    className={cn(
                      "size-4 text-paper",
                      !reduce && "animate-spin"
                    )}
                  />
                ) : (
                  <span className="size-1.5 rounded-full bg-night-border" />
                )}
              </span>
              <span className="flex flex-1 items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "text-sm",
                    state === "pending" ? "text-paper-muted" : "text-paper"
                  )}
                >
                  {step.label}
                </span>
                <AnimatePresence>
                  {state === "active" && (
                    <motion.span
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-[11px] text-paper-muted"
                    >
                      {step.detail}…
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="h-0.5 w-full overflow-hidden rounded-full bg-night-soft">
        <motion.div
          className="h-full rounded-full bg-solar"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Zap, Scale, Brain, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Spend Sort — resource-sorting under pressure.
 * Route each task to the correct model-cost tier before the budget drains.
 * Wrong tier = the task bounces back and costs double. Self-contained; calls
 * onComplete({ score, statValue }) with the % saved vs. all-expensive routing.
 */

export type SpendSortResult = { score: number; statValue: number };

type Tier = 0 | 1 | 2;

type Task = {
  id: number;
  label: string;
  correctTier: Tier;
  bounced?: boolean;
};

const TIERS: {
  name: string;
  sub: string;
  cost: number;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { name: "Cheap · Fast", sub: "small model", cost: 1, key: "1", icon: Zap },
  { name: "Balanced", sub: "mid model", cost: 2, key: "2", icon: Scale },
  { name: "Expensive · Capable", sub: "frontier model", cost: 4, key: "3", icon: Brain },
];

const EXPENSIVE_COST = TIERS[2].cost;

const TASK_POOL: { label: string; tier: Tier }[] = [
  { label: "Categorize a receipt", tier: 0 },
  { label: "Tag the vendor", tier: 0 },
  { label: "Extract the line total", tier: 0 },
  { label: "Format a date field", tier: 0 },
  { label: "Spell-check a memo", tier: 0 },
  { label: "Flag a missing receipt", tier: 0 },
  { label: "Summarize an expense report", tier: 1 },
  { label: "Match a PO to an invoice", tier: 1 },
  { label: "Detect a duplicate charge", tier: 1 },
  { label: "Draft a policy reminder", tier: 1 },
  { label: "Reconcile a card statement", tier: 1 },
  { label: "Audit anomalous spend", tier: 2 },
  { label: "Negotiate contract terms", tier: 2 },
  { label: "Forecast quarterly burn", tier: 2 },
  { label: "Resolve a compliance dispute", tier: 2 },
  { label: "Model a vendor consolidation", tier: 2 },
];

const START_BUDGET = 100;
const MAX_QUEUE = 6;

type Phase = "ready" | "playing" | "over";

type State = {
  phase: Phase;
  queue: Task[];
  budget: number;
  score: number;
  elapsed: number;
  cleared: number;
  wrong: number;
  actualCost: number;
  nextSpawnAt: number;
  nextId: number;
  flash: { id: number; kind: "correct" | "wrong"; tier: Tier } | null;
};

function makeTask(id: number): Task {
  const pick = TASK_POOL[Math.floor(Math.random() * TASK_POOL.length)];
  return { id, label: pick.label, correctTier: pick.tier };
}

function initialState(): State {
  return {
    phase: "ready",
    queue: [makeTask(1), makeTask(2), makeTask(3)],
    budget: START_BUDGET,
    score: 0,
    elapsed: 0,
    cleared: 0,
    wrong: 0,
    actualCost: 0,
    nextSpawnAt: 1300,
    nextId: 4,
    flash: null,
  };
}

function spawnInterval(elapsedMs: number) {
  // Starts ~1300ms, tightens toward ~480ms as the round heats up.
  return Math.max(480, 1300 - elapsedMs * 0.03);
}

function drainPerSecond(elapsedMs: number, queueLen: number) {
  // Passive drain ramps with time; a backed-up queue burns budget faster.
  return 5 + elapsedMs / 4000 + Math.max(0, queueLen - 2) * 0.9;
}

function tick(prev: State, dtMs: number): State {
  if (prev.phase !== "playing") return prev;

  const elapsed = prev.elapsed + dtMs;
  let budget =
    prev.budget - (drainPerSecond(prev.elapsed, prev.queue.length) * dtMs) / 1000;

  let queue = prev.queue;
  let nextSpawnAt = prev.nextSpawnAt;
  let nextId = prev.nextId;

  if (elapsed >= prev.nextSpawnAt && queue.length < MAX_QUEUE) {
    queue = [...queue, makeTask(nextId)];
    nextId += 1;
    nextSpawnAt = elapsed + spawnInterval(elapsed);
  } else if (elapsed >= prev.nextSpawnAt) {
    // Queue is jammed — defer the spawn but keep pressure high.
    nextSpawnAt = elapsed + 300;
  }

  if (budget <= 0) {
    return { ...prev, phase: "over", budget: 0, elapsed, queue };
  }

  return { ...prev, elapsed, budget, queue, nextSpawnAt, nextId };
}

function applySort(prev: State, tier: Tier): State {
  if (prev.phase !== "playing" || prev.queue.length === 0) return prev;
  const task = prev.queue[0];

  if (tier === task.correctTier) {
    const cost = TIERS[tier].cost;
    return {
      ...prev,
      queue: prev.queue.slice(1),
      budget: prev.budget - cost,
      actualCost: prev.actualCost + cost,
      cleared: prev.cleared + 1,
      score: prev.score + 60 + tier * 40,
      flash: { id: task.id, kind: "correct", tier },
    };
  }

  // Wrong tier: double the intended cost, task bounces to the back.
  const penalty = TIERS[task.correctTier].cost * 2;
  const rest = prev.queue.slice(1);
  return {
    ...prev,
    queue: [...rest, { ...task, bounced: true }],
    budget: prev.budget - penalty,
    actualCost: prev.actualCost + penalty,
    wrong: prev.wrong + 1,
    score: Math.max(0, prev.score - 25),
    flash: { id: task.id, kind: "wrong", tier },
  };
}

function savedPercent(state: State): number {
  const baseline = state.cleared * EXPENSIVE_COST;
  if (baseline <= 0) return 0;
  const pct = (1 - state.actualCost / baseline) * 100;
  return Math.max(0, Math.round(pct));
}

export default function SpendSort({
  onComplete,
}: {
  onComplete?: (result: SpendSortResult) => void;
}) {
  const reduce = useReducedMotion();
  const [state, setState] = React.useState<State>(initialState);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const [pressed, setPressed] = React.useState<Tier | null>(null);
  const completedRef = React.useRef(false);

  const start = React.useCallback(() => {
    completedRef.current = false;
    setState({ ...initialState(), phase: "playing" });
  }, []);

  const sort = React.useCallback((tier: Tier) => {
    setState((prev) => applySort(prev, tier));
    setPressed(tier);
    window.setTimeout(() => setPressed(null), 120);
  }, []);

  // Game loop.
  React.useEffect(() => {
    if (state.phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      setState((prev) => tick(prev, dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.phase]);

  // Keyboard controls.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (s.phase === "ready" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        start();
        return;
      }
      if (s.phase !== "playing") return;
      if (e.key === "1") sort(0);
      else if (e.key === "2") sort(1);
      else if (e.key === "3") sort(2);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sort, start]);

  // Fire completion exactly once.
  React.useEffect(() => {
    if (state.phase === "over" && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ score: state.score, statValue: savedPercent(state) });
    }
  }, [state, onComplete]);

  const current = state.queue[0];
  const budgetPct = Math.max(0, Math.min(100, state.budget));
  const low = budgetPct < 30;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HUD */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase tracking-widest text-paper-muted">
            Score
          </span>
          <span className="font-mono text-4xl tabular-nums leading-none text-paper">
            {state.score}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Stat label="Cleared" value={state.cleared} />
          <Stat label="Bounced" value={state.wrong} />
          <Stat
            label="Time"
            value={`${(state.elapsed / 1000).toFixed(0)}s`}
            mono
          />
        </div>
      </div>

      {/* Budget bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-paper-muted">
          <span>Budget</span>
          <span className={cn(low && "text-blaze")}>{budgetPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-night-soft">
          <motion.div
            className={cn(
              "h-full rounded-full",
              low ? "bg-blaze" : "bg-solar"
            )}
            animate={{ width: `${budgetPct}%` }}
            transition={{ duration: 0.12, ease: "linear" }}
          />
        </div>
      </div>

      {/* Play field */}
      <div className="relative h-52 rounded-[--radius-md] border border-night-border bg-night-soft/60">
        {state.phase === "ready" && (
          <ReadyOverlay onStart={start} />
        )}
        {state.phase === "over" && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-mono text-sm uppercase tracking-widest text-paper-muted">
              Budget spent
            </span>
          </div>
        )}

        {state.phase === "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {/* Upcoming queue peeking behind */}
            <div className="flex h-6 items-center gap-1.5">
              {state.queue.slice(1, 5).map((t, i) => (
                <span
                  key={t.id}
                  className="h-1.5 rounded-full bg-night-border"
                  style={{ width: 22 - i * 3, opacity: 1 - i * 0.18 }}
                />
              ))}
            </div>

            <div className="relative h-24 w-full max-w-md">
              <AnimatePresence mode="popLayout">
                {current && (
                  <motion.div
                    key={current.id}
                    layout={!reduce}
                    initial={reduce ? false : { y: -18, opacity: 0, scale: 0.96 }}
                    animate={
                      state.flash?.id === current.id &&
                      state.flash.kind === "wrong"
                        ? reduce
                          ? { opacity: 1 }
                          : { x: [0, -8, 8, -5, 0], opacity: 1, scale: 1 }
                        : { x: 0, y: 0, opacity: 1, scale: 1 }
                    }
                    exit={
                      reduce
                        ? { opacity: 0 }
                        : { y: 22, opacity: 0, scale: 0.94 }
                    }
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "absolute inset-x-0 mx-auto flex w-full max-w-md items-center justify-center rounded-[--radius-md] border bg-night-card px-6 py-6 text-center",
                      current.bounced
                        ? "border-blaze/50"
                        : "border-night-border"
                    )}
                  >
                    <span className="text-xl tracking-[-0.01em] text-paper">
                      {current.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
              Route it to the right tier
            </span>
          </div>
        )}
      </div>

      {/* Buckets */}
      <div className="grid grid-cols-3 gap-3">
        {TIERS.map((t, i) => {
          const tier = i as Tier;
          const active = pressed === tier;
          const Icon = t.icon;
          return (
            <button
              key={t.name}
              type="button"
              disabled={state.phase !== "playing"}
              onClick={() => sort(tier)}
              className={cn(
                "group flex flex-col items-start gap-2 rounded-[--radius-md] border p-4 text-left transition-colors duration-150 disabled:opacity-50",
                active
                  ? "border-solar bg-solar/10"
                  : "border-night-border bg-night-card hover:border-paper-muted/60 hover:bg-night-soft"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <Icon
                  className={cn(
                    "size-4",
                    active ? "text-solar" : "text-paper-muted"
                  )}
                />
                <kbd className="rounded-[--radius-xs] border border-night-border bg-night px-1.5 py-0.5 font-mono text-[10px] text-paper-muted">
                  {t.key}
                </kbd>
              </div>
              <div>
                <div className="text-sm font-medium text-paper">{t.name}</div>
                <div className="font-mono text-[11px] text-paper-muted">
                  {t.sub} · {t.cost}cr
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-lg leading-none text-paper",
          mono && "font-mono tabular-nums"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ReadyOverlay({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="max-w-sm text-sm text-paper-muted">
        Tasks pile up and spawn faster over time. Send each to the cheapest tier
        that can handle it. Wrong tier bounces back and costs double.
      </p>
      <Button variant="solar" size="lg" onClick={onStart}>
        <Play className="size-4" />
        Start sorting
      </Button>
      <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
        Keys 1 · 2 · 3 or click
      </span>
    </div>
  );
}

"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Flag, ArrowUpRight, Play, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Triage — judgment under volume.
 * Expense requests fly in from a queue. Approve routine items, flag ambiguous
 * ones for review, or escalate policy violations. An AI agent auto-handles the
 * clearly routine requests so you only see the hard calls. Wrong decisions cost
 * money or time; correct decisions score points. Self-contained; calls
 * onComplete({ score, statValue }) with the % the agent auto-handled.
 */

export type TriageResult = { score: number; statValue: number };

type Decision = "approve" | "flag" | "escalate";

type Request = {
  id: number;
  vendor: string;
  amount: number;
  category: string;
  description: string;
  correctDecision: Decision;
  /** Whether the AI agent auto-cleared this one (visual only). */
  autoCleared?: boolean;
};

type Phase = "ready" | "playing" | "over";

const ACTIONS: {
  decision: Decision;
  label: string;
  sub: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    decision: "approve",
    label: "Approve",
    sub: "routine / low-risk",
    key: "1",
    icon: Check,
  },
  {
    decision: "flag",
    label: "Flag",
    sub: "needs review",
    key: "2",
    icon: Flag,
  },
  {
    decision: "escalate",
    label: "Escalate",
    sub: "violation / high-value",
    key: "3",
    icon: ArrowUpRight,
  },
];

/* ------------------------------------------------------------------ */
/*  Request pool                                                       */
/* ------------------------------------------------------------------ */

type RequestTemplate = {
  vendor: string;
  amount: number;
  category: string;
  description: string;
  correct: Decision;
};

const REQUEST_POOL: RequestTemplate[] = [
  // Routine (approve)
  { vendor: "Staples", amount: 12, category: "Office Supplies", description: "Printer paper, 2 reams", correct: "approve" },
  { vendor: "Zoom", amount: 14, category: "Software", description: "Monthly pro plan renewal", correct: "approve" },
  { vendor: "Uber Eats", amount: 18, category: "Meals", description: "Working lunch, client meeting", correct: "approve" },
  { vendor: "Amazon", amount: 24, category: "Office Supplies", description: "USB-C cables for conference room", correct: "approve" },
  { vendor: "Slack", amount: 8, category: "Software", description: "Per-seat monthly charge", correct: "approve" },
  { vendor: "FedEx", amount: 32, category: "Shipping", description: "Contract documents to client", correct: "approve" },
  { vendor: "Google", amount: 12, category: "Software", description: "Workspace storage upgrade", correct: "approve" },
  { vendor: "Costco", amount: 45, category: "Office Supplies", description: "Breakroom snacks restock", correct: "approve" },

  // Ambiguous (flag)
  { vendor: "WeWork", amount: 450, category: "Office Space", description: "Hot desk for visiting contractor", correct: "flag" },
  { vendor: "Delta Airlines", amount: 680, category: "Travel", description: "Flight to prospect meeting, no pre-approval", correct: "flag" },
  { vendor: "Apple Store", amount: 299, category: "Equipment", description: "AirPods for 'focus work'", correct: "flag" },
  { vendor: "Marriott", amount: 520, category: "Travel", description: "2-night stay, conference not on approved list", correct: "flag" },
  { vendor: "Best Buy", amount: 189, category: "Equipment", description: "Mechanical keyboard, ergonomic claim", correct: "flag" },
  { vendor: "Coursera", amount: 399, category: "Training", description: "ML course, unclear business relevance", correct: "flag" },
  { vendor: "Catering Co", amount: 1200, category: "Events", description: "Team dinner, 15 people, no manager sign-off", correct: "flag" },
  { vendor: "Adobe", amount: 600, category: "Software", description: "Creative Cloud, not in standard stack", correct: "flag" },
  { vendor: "Lyft", amount: 87, category: "Transport", description: "Late night ride, weekend timestamp", correct: "flag" },
  { vendor: "REI", amount: 150, category: "Misc", description: "Backpack labeled 'travel gear'", correct: "flag" },

  // Violations (escalate)
  { vendor: "Louis Vuitton", amount: 2100, category: "Personal", description: "Leather goods, no business purpose", correct: "escalate" },
  { vendor: "Crypto Exchange", amount: 5000, category: "Investment", description: "Wire transfer to trading platform", correct: "escalate" },
  { vendor: "Self-transfer", amount: 3000, category: "Reimbursement", description: "Transfer to personal account", correct: "escalate" },
  { vendor: "Luxury Resort", amount: 4200, category: "Travel", description: "5-star suite, solo trip, no client", correct: "escalate" },
  { vendor: "Wine Club", amount: 890, category: "Entertainment", description: "Annual membership, personal address", correct: "escalate" },
  { vendor: "Electronics Reseller", amount: 2800, category: "Equipment", description: "Gaming laptop, not on asset list", correct: "escalate" },
  { vendor: "Private Jet Co", amount: 8500, category: "Travel", description: "Charter flight, unauthorized", correct: "escalate" },
  { vendor: "Furniture Store", amount: 3400, category: "Office", description: "Home office furniture, exceeds policy cap", correct: "escalate" },
];

/** Requests the AI agent will auto-handle in the background (clearly routine). */
const AGENT_POOL: RequestTemplate[] = [
  { vendor: "AWS", amount: 6, category: "Cloud", description: "S3 storage, monthly", correct: "approve" },
  { vendor: "Notion", amount: 10, category: "Software", description: "Team plan renewal", correct: "approve" },
  { vendor: "Office Depot", amount: 8, category: "Supplies", description: "Sticky notes, pens", correct: "approve" },
  { vendor: "GitHub", amount: 9, category: "Software", description: "Seat license, monthly", correct: "approve" },
  { vendor: "Postmark", amount: 5, category: "Software", description: "Transactional email", correct: "approve" },
  { vendor: "1Password", amount: 8, category: "Security", description: "Team vault renewal", correct: "approve" },
  { vendor: "Linear", amount: 10, category: "Software", description: "Project tracking seat", correct: "approve" },
  { vendor: "Figma", amount: 12, category: "Design", description: "Editor seat, monthly", correct: "approve" },
  { vendor: "Vercel", amount: 20, category: "Cloud", description: "Pro plan hosting", correct: "approve" },
  { vendor: "Loom", amount: 8, category: "Software", description: "Video recording tool", correct: "approve" },
];

const TOTAL_REQUESTS = 30;
const MAX_MISTAKES = 5;

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

type AgentEvent = {
  id: number;
  vendor: string;
  amount: number;
  /** Timestamp (elapsed ms) when it was auto-cleared. */
  at: number;
};

type Flash = {
  id: number;
  kind: "correct" | "wrong";
} | null;

type State = {
  phase: Phase;
  /** Requests waiting for the player. */
  queue: Request[];
  score: number;
  elapsed: number;
  /** Player-reviewed count. */
  reviewed: number;
  /** Correct decisions. */
  correct: number;
  /** Wrong decisions. */
  mistakes: number;
  /** Agent auto-handled count. */
  agentHandled: number;
  /** Total requests spawned so far (player + agent). */
  totalSpawned: number;
  /** Next spawn time for a player request. */
  nextSpawnAt: number;
  /** Next agent auto-clear time. */
  nextAgentAt: number;
  nextId: number;
  flash: Flash;
  /** Recent agent events for the feed. */
  agentFeed: AgentEvent[];
  /** Estimated hours saved by agent. */
  hoursSaved: number;
};

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRequest(id: number): Request {
  const t = REQUEST_POOL[Math.floor(Math.random() * REQUEST_POOL.length)];
  return {
    id,
    vendor: t.vendor,
    amount: t.amount,
    category: t.category,
    description: t.description,
    correctDecision: t.correct,
  };
}

function pickAgentRequest(): RequestTemplate {
  return AGENT_POOL[Math.floor(Math.random() * AGENT_POOL.length)];
}

function initialState(): State {
  const first = shuffled(REQUEST_POOL).slice(0, 2);
  return {
    phase: "ready",
    queue: first.map((t, i) => ({
      id: i + 1,
      vendor: t.vendor,
      amount: t.amount,
      category: t.category,
      description: t.description,
      correctDecision: t.correct,
    })),
    score: 0,
    elapsed: 0,
    reviewed: 0,
    correct: 0,
    mistakes: 0,
    agentHandled: 0,
    totalSpawned: 2,
    nextSpawnAt: 2000,
    nextAgentAt: 1200,
    nextId: 3,
    flash: null,
    agentFeed: [],
    hoursSaved: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Tick & decision logic                                              */
/* ------------------------------------------------------------------ */

function spawnInterval(elapsed: number): number {
  return Math.max(1800, 3200 - elapsed * 0.04);
}

function agentInterval(elapsed: number): number {
  return Math.max(2200, 4000 - elapsed * 0.03);
}

function tick(prev: State, dtMs: number): State {
  if (prev.phase !== "playing") return prev;

  const elapsed = prev.elapsed + dtMs;
  let { queue, nextSpawnAt, nextAgentAt, nextId, agentHandled, totalSpawned, agentFeed, hoursSaved } = prev;

  // Check if game should end (all requests processed).
  if (totalSpawned >= TOTAL_REQUESTS && queue.length === 0 && agentHandled + prev.reviewed >= TOTAL_REQUESTS) {
    return { ...prev, phase: "over", elapsed };
  }

  // Spawn new player request.
  if (elapsed >= nextSpawnAt && totalSpawned < TOTAL_REQUESTS && queue.length < 5) {
    const req = pickRequest(nextId);
    queue = [...queue, req];
    nextId += 1;
    totalSpawned += 1;
    nextSpawnAt = elapsed + spawnInterval(elapsed);
  } else if (elapsed >= nextSpawnAt && totalSpawned < TOTAL_REQUESTS) {
    nextSpawnAt = elapsed + 500;
  }

  // Agent auto-clear.
  if (elapsed >= nextAgentAt && totalSpawned < TOTAL_REQUESTS) {
    const agentReq = pickAgentRequest();
    agentHandled += 1;
    totalSpawned += 1;
    hoursSaved = +(hoursSaved + 0.15 + Math.random() * 0.1).toFixed(1);
    const evt: AgentEvent = {
      id: nextId,
      vendor: agentReq.vendor,
      amount: agentReq.amount,
      at: elapsed,
    };
    agentFeed = [evt, ...agentFeed].slice(0, 4);
    nextId += 1;
    nextAgentAt = elapsed + agentInterval(elapsed);
  }

  return {
    ...prev,
    elapsed,
    queue,
    nextSpawnAt,
    nextAgentAt,
    nextId,
    agentHandled,
    totalSpawned,
    agentFeed,
    hoursSaved,
  };
}

function applyDecision(prev: State, decision: Decision): State {
  if (prev.phase !== "playing" || prev.queue.length === 0) return prev;
  const req = prev.queue[0];
  const isCorrect = decision === req.correctDecision;

  let scoreDelta = 0;
  if (isCorrect) {
    if (decision === "approve") scoreDelta = 50;
    else if (decision === "flag") scoreDelta = 80;
    else if (decision === "escalate") scoreDelta = 120;
  } else {
    // Penalties vary by severity.
    if (decision === "approve" && req.correctDecision === "escalate") {
      // Approved a violation — worst mistake.
      scoreDelta = -100;
    } else if (decision === "approve" && req.correctDecision === "flag") {
      scoreDelta = -40;
    } else if (decision === "escalate" && req.correctDecision === "approve") {
      // Over-escalated a routine request.
      scoreDelta = -30;
    } else if (decision === "flag" && req.correctDecision === "approve") {
      // Flagged routine — small penalty (slows queue).
      scoreDelta = -15;
    } else {
      scoreDelta = -25;
    }
  }

  const newMistakes = prev.mistakes + (isCorrect ? 0 : 1);
  const gameOver = newMistakes >= MAX_MISTAKES ||
    (prev.totalSpawned >= TOTAL_REQUESTS && prev.queue.length <= 1 && prev.agentHandled + prev.reviewed + 1 >= TOTAL_REQUESTS);

  return {
    ...prev,
    phase: gameOver ? "over" : "playing",
    queue: prev.queue.slice(1),
    score: Math.max(0, prev.score + scoreDelta),
    reviewed: prev.reviewed + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    mistakes: newMistakes,
    flash: { id: req.id, kind: isCorrect ? "correct" : "wrong" },
  };
}

function accuracyPct(state: State): number {
  if (state.reviewed === 0) return 100;
  return Math.round((state.correct / state.reviewed) * 100);
}

function agentPct(state: State): number {
  const total = state.reviewed + state.agentHandled;
  if (total === 0) return 0;
  return Math.round((state.agentHandled / total) * 100);
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                     */
/* ------------------------------------------------------------------ */

function fmtAmount(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
}

function categoryColor(correct: Decision): string {
  if (correct === "approve") return "text-green-400";
  if (correct === "escalate") return "text-blaze";
  return "text-solar";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Triage({
  onComplete,
}: {
  onComplete?: (result: TriageResult) => void;
}) {
  const reduce = useReducedMotion();
  const [state, setState] = React.useState<State>(initialState);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const [pressed, setPressed] = React.useState<Decision | null>(null);
  const completedRef = React.useRef(false);

  const start = React.useCallback(() => {
    completedRef.current = false;
    setState({ ...initialState(), phase: "playing" });
  }, []);

  const decide = React.useCallback((d: Decision) => {
    setState((prev) => applyDecision(prev, d));
    setPressed(d);
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
      if (e.key === "1") decide("approve");
      else if (e.key === "2") decide("flag");
      else if (e.key === "3") decide("escalate");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, start]);

  // Fire completion exactly once.
  React.useEffect(() => {
    if (state.phase === "over" && !completedRef.current) {
      completedRef.current = true;
      onComplete?.({ score: state.score, statValue: agentPct(state) });
    }
  }, [state, onComplete]);

  const current = state.queue[0];
  const progress = Math.round(
    ((state.reviewed + state.agentHandled) / TOTAL_REQUESTS) * 100
  );
  const mistakesLeft = MAX_MISTAKES - state.mistakes;
  const dangerZone = mistakesLeft <= 2;

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
          <Stat label="Reviewed" value={state.reviewed} />
          <Stat label="Accuracy" value={`${accuracyPct(state)}%`} mono />
          <Stat
            label="Mistakes"
            value={`${state.mistakes}/${MAX_MISTAKES}`}
            mono
            danger={dangerZone}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-paper-muted">
          <span>Queue progress</span>
          <span>
            {state.reviewed + state.agentHandled}/{TOTAL_REQUESTS}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-night-soft">
          <motion.div
            className="h-full rounded-full bg-solar"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: "linear" }}
          />
        </div>
      </div>

      {/* Play field */}
      <div className="relative min-h-[14rem] rounded-[--radius-md] border border-night-border bg-night-soft/60">
        {state.phase === "ready" && <ReadyOverlay onStart={start} />}

        {state.phase === "over" && (
          <GameOverOverlay state={state} onRestart={start} />
        )}

        {state.phase === "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            {/* Upcoming queue peeking behind */}
            <div className="flex h-6 items-center gap-1.5">
              {state.queue.slice(1, 5).map((r, i) => (
                <span
                  key={r.id}
                  className="h-1.5 rounded-full bg-night-border"
                  style={{ width: 22 - i * 3, opacity: 1 - i * 0.18 }}
                />
              ))}
            </div>

            {/* Current request card */}
            <div className="relative h-28 w-full max-w-md">
              <AnimatePresence mode="popLayout">
                {current && (
                  <motion.div
                    key={current.id}
                    layout={!reduce}
                    initial={
                      reduce ? false : { y: -18, opacity: 0, scale: 0.96 }
                    }
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
                    className="absolute inset-x-0 mx-auto flex w-full max-w-md flex-col gap-2 rounded-[--radius-md] border border-night-border bg-night-card px-6 py-5"
                  >
                    {/* Top row: vendor + amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium tracking-[-0.01em] text-paper">
                        {current.vendor}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-lg tabular-nums font-semibold",
                          current.amount >= 1000
                            ? "text-blaze"
                            : current.amount >= 200
                              ? "text-solar"
                              : "text-paper"
                        )}
                      >
                        {fmtAmount(current.amount)}
                      </span>
                    </div>
                    {/* Bottom row: category + description */}
                    <div className="flex items-center gap-2">
                      <Badge variant="mono-dark">{current.category}</Badge>
                      <span className="truncate text-sm text-paper-muted">
                        {current.description}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty state when queue is empty but game is ongoing */}
              {!current && state.phase === "playing" && (
                <div className="flex h-full items-center justify-center">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
                    Waiting for next request...
                  </span>
                </div>
              )}
            </div>

            <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
              Approve, flag, or escalate
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        {ACTIONS.map((a) => {
          const active = pressed === a.decision;
          const Icon = a.icon;
          return (
            <button
              key={a.decision}
              type="button"
              disabled={state.phase !== "playing" || !current}
              onClick={() => decide(a.decision)}
              className={cn(
                "group flex flex-col items-start gap-2 rounded-[--radius-md] border p-4 text-left transition-colors duration-150 disabled:opacity-50",
                active
                  ? a.decision === "escalate"
                    ? "border-blaze bg-blaze/10"
                    : "border-solar bg-solar/10"
                  : "border-night-border bg-night-card hover:border-paper-muted/60 hover:bg-night-soft"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <Icon
                  className={cn(
                    "size-4",
                    active
                      ? a.decision === "escalate"
                        ? "text-blaze"
                        : "text-solar"
                      : "text-paper-muted"
                  )}
                />
                <kbd className="rounded-[--radius-xs] border border-night-border bg-night px-1.5 py-0.5 font-mono text-[10px] text-paper-muted">
                  {a.key}
                </kbd>
              </div>
              <div>
                <div className="text-sm font-medium text-paper">{a.label}</div>
                <div className="font-mono text-[11px] text-paper-muted">
                  {a.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Agent feed */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-green-400" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
            Agent auto-handled ({state.agentHandled})
          </span>
          {state.hoursSaved > 0 && (
            <Badge variant="mono-dark">{state.hoursSaved}h saved</Badge>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {state.agentFeed.map((evt) => (
              <motion.div
                key={evt.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, x: 16, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between rounded-[--radius-sm] border border-green-500/20 bg-green-500/5 px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-green-400" />
                  <span className="text-xs text-paper-muted">{evt.vendor}</span>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-green-400">
                  {fmtAmount(evt.amount)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {state.agentFeed.length === 0 && state.phase === "playing" && (
            <span className="px-3 py-1.5 text-xs text-paper-muted/50">
              Agent is warming up...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  mono,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-lg leading-none",
          danger ? "text-blaze" : "text-paper",
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
        Expense requests fly in from the queue. Approve routine items, flag
        ambiguous ones for review, or escalate policy violations. The AI agent
        auto-handles the easy ones — you get the hard calls. {MAX_MISTAKES}{" "}
        mistakes and you are done.
      </p>
      <Button variant="solar" size="lg" onClick={onStart}>
        <Play className="size-4" />
        Start triaging
      </Button>
      <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
        Keys 1 · 2 · 3 or click
      </span>
    </div>
  );
}

function GameOverOverlay({
  state,
  onRestart,
}: {
  state: State;
  onRestart: () => void;
}) {
  const tooManyMistakes = state.mistakes >= MAX_MISTAKES;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="font-mono text-sm uppercase tracking-widest text-paper-muted">
        {tooManyMistakes ? "Too many mistakes" : "Queue cleared"}
      </span>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        <MiniStat label="Reviewed" value={String(state.reviewed)} />
        <MiniStat label="Agent handled" value={String(state.agentHandled)} />
        <MiniStat label="Accuracy" value={`${accuracyPct(state)}%`} />
        <MiniStat label="Hours saved" value={`${state.hoursSaved}h`} />
      </div>
      <Button variant="solar" size="md" onClick={onRestart}>
        <Play className="size-4" />
        Play again
      </Button>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
        {label}
      </span>
      <span className="font-mono text-lg tabular-nums text-paper">{value}</span>
    </div>
  );
}

"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Play, CheckCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Then vs. Now — head-to-head timed race.
 * Two side-by-side lanes: manual (player types/clicks) vs automated (auto-fills).
 * Player races to process 5 receipts the old-fashioned way while the automated
 * system blazes through them. Shows viscerally how much faster automation is.
 */

export type ThenVsNowResult = { score: number; statValue: number };

type Receipt = {
  vendor: string;
  amount: number;
  date: string;
  category: string;
};

const RECEIPTS: Receipt[] = [
  { vendor: "Uber", amount: 34.5, date: "Mar 12", category: "Travel" },
  { vendor: "Staples", amount: 127.89, date: "Mar 13", category: "Office Supplies" },
  { vendor: "Delta Airlines", amount: 489.0, date: "Mar 14", category: "Travel" },
  { vendor: "Sweetgreen", amount: 16.75, date: "Mar 15", category: "Meals" },
  { vendor: "AWS", amount: 2847.33, date: "Mar 16", category: "Software" },
];

const CATEGORIES = ["Travel", "Office Supplies", "Meals", "Software", "Other"];

// Auto lane timing: each field fills in 0.3-0.8s, then auto-submit
const AUTO_FIELD_DELAYS = [400, 300, 500, 350]; // vendor, amount, category, submit
const AUTO_PAUSE_BETWEEN = 250; // pause between receipts

type Phase = "ready" | "playing" | "over";

type AutoField = "idle" | "vendor" | "amount" | "category" | "submitting" | "done";

type AutoReceiptState = {
  currentIndex: number;
  currentField: AutoField;
  completedCount: number;
  finishTime: number | null;
};

type ManualReceiptState = {
  currentIndex: number;
  completedCount: number;
  finishTime: number | null;
  results: {
    vendorMatch: number;
    amountCorrect: boolean;
    categoryCorrect: boolean;
  }[];
};

/* ---------------------------------------------------------------
   Fuzzy match: Levenshtein distance normalised to 0–1 similarity
   --------------------------------------------------------------- */
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () =>
    Array(lb + 1).fill(0)
  );
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;
  for (let i = 1; i <= la; i++)
    for (let j = 1; j <= lb; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[la][lb];
}

function fuzzyScore(input: string, target: string): number {
  const a = input.trim().toLowerCase();
  const b = target.toLowerCase();
  if (a === b) return 1;
  if (a.length === 0) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - dist / maxLen);
}

function formatTime(ms: number): string {
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

export default function ThenVsNow({
  onComplete,
}: {
  onComplete?: (result: ThenVsNowResult) => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>("ready");
  const [elapsed, setElapsed] = React.useState(0);
  const startTimeRef = React.useRef(0);
  const completedRef = React.useRef(false);

  // -- Auto lane state --
  const [auto, setAuto] = React.useState<AutoReceiptState>({
    currentIndex: 0,
    currentField: "idle",
    completedCount: 0,
    finishTime: null,
  });

  // -- Manual lane state --
  const [manual, setManual] = React.useState<ManualReceiptState>({
    currentIndex: 0,
    completedCount: 0,
    finishTime: null,
    results: [],
  });

  // Manual form fields
  const [vendorInput, setVendorInput] = React.useState("");
  const [amountInput, setAmountInput] = React.useState("");
  const [categoryInput, setCategoryInput] = React.useState("");

  const vendorRef = React.useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------
  const start = React.useCallback(() => {
    completedRef.current = false;
    startTimeRef.current = performance.now();
    setPhase("playing");
    setElapsed(0);
    setAuto({
      currentIndex: 0,
      currentField: "vendor",
      completedCount: 0,
      finishTime: null,
    });
    setManual({
      currentIndex: 0,
      completedCount: 0,
      finishTime: null,
      results: [],
    });
    setVendorInput("");
    setAmountInput("");
    setCategoryInput("");
    // Focus vendor input after a tick
    setTimeout(() => vendorRef.current?.focus(), 100);
  }, []);

  // ---------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------
  React.useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const loop = () => {
      setElapsed(performance.now() - startTimeRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ---------------------------------------------------------------
  // Auto lane progression
  // ---------------------------------------------------------------
  React.useEffect(() => {
    if (phase !== "playing") return;
    if (auto.finishTime !== null) return; // already done
    if (auto.currentField === "idle") return;

    const fieldOrder: AutoField[] = ["vendor", "amount", "category", "submitting"];
    const currentFieldIdx = fieldOrder.indexOf(auto.currentField);

    if (auto.currentField === "done") return;

    const delay =
      auto.currentField === "submitting"
        ? AUTO_PAUSE_BETWEEN
        : AUTO_FIELD_DELAYS[currentFieldIdx] ?? 400;

    const timer = setTimeout(() => {
      setAuto((prev) => {
        if (prev.currentField === "submitting") {
          // Complete this receipt
          const newCompleted = prev.completedCount + 1;
          if (newCompleted >= RECEIPTS.length) {
            return {
              ...prev,
              currentField: "done",
              completedCount: newCompleted,
              finishTime: performance.now() - startTimeRef.current,
            };
          }
          return {
            ...prev,
            currentIndex: prev.currentIndex + 1,
            currentField: "vendor",
            completedCount: newCompleted,
          };
        }
        // Advance to next field
        const nextField = fieldOrder[currentFieldIdx + 1] ?? "submitting";
        return { ...prev, currentField: nextField as AutoField };
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [phase, auto.currentField, auto.currentIndex, auto.finishTime]);

  // ---------------------------------------------------------------
  // Manual submit
  // ---------------------------------------------------------------
  const submitManual = React.useCallback(() => {
    const receipt = RECEIPTS[manual.currentIndex];
    if (!receipt) return;

    const vScore = fuzzyScore(vendorInput, receipt.vendor);
    const parsedAmount = parseFloat(amountInput);
    const amountCorrect =
      !isNaN(parsedAmount) &&
      Math.abs(parsedAmount - receipt.amount) < 0.01;
    const categoryCorrect =
      categoryInput.toLowerCase() === receipt.category.toLowerCase();

    const result = { vendorMatch: vScore, amountCorrect, categoryCorrect };

    setManual((prev) => {
      const newResults = [...prev.results, result];
      const newCompleted = prev.completedCount + 1;
      if (newCompleted >= RECEIPTS.length) {
        return {
          ...prev,
          completedCount: newCompleted,
          currentIndex: prev.currentIndex + 1,
          finishTime: performance.now() - startTimeRef.current,
          results: newResults,
        };
      }
      return {
        ...prev,
        completedCount: newCompleted,
        currentIndex: prev.currentIndex + 1,
        results: newResults,
      };
    });

    setVendorInput("");
    setAmountInput("");
    setCategoryInput("");
    setTimeout(() => vendorRef.current?.focus(), 50);
  }, [manual.currentIndex, vendorInput, amountInput, categoryInput]);

  // ---------------------------------------------------------------
  // End game when both lanes finish
  // ---------------------------------------------------------------
  React.useEffect(() => {
    if (
      phase === "playing" &&
      manual.finishTime !== null &&
      auto.finishTime !== null &&
      !completedRef.current
    ) {
      completedRef.current = true;
      setPhase("over");

      // Score: each receipt = 20 points max
      // vendor fuzzy match: 0-8 points, amount correct: 6 points, category correct: 6 points
      let totalScore = 0;
      for (const r of manual.results) {
        totalScore += Math.round(r.vendorMatch * 8);
        if (r.amountCorrect) totalScore += 6;
        if (r.categoryCorrect) totalScore += 6;
      }
      // Perfect = 100
      const score = totalScore;
      const statValue = Math.round(manual.finishTime / 1000);

      onComplete?.({ score, statValue });
    }
  }, [phase, manual.finishTime, auto.finishTime, manual.results, onComplete]);

  // ---------------------------------------------------------------
  // Compute display values
  // ---------------------------------------------------------------
  const autoReceipt = RECEIPTS[auto.currentIndex];
  const manualReceipt = RECEIPTS[manual.currentIndex];

  const autoProgress = auto.completedCount / RECEIPTS.length;
  const manualProgress = manual.completedCount / RECEIPTS.length;

  // Determine which auto fields are "filled"
  const autoFieldsFilled = React.useMemo(() => {
    const order: AutoField[] = ["vendor", "amount", "category", "submitting"];
    const idx = order.indexOf(auto.currentField);
    return {
      vendor: idx > 0 || auto.currentField === "submitting" || auto.currentField === "done",
      amount: idx > 1 || auto.currentField === "submitting" || auto.currentField === "done",
      category: idx > 2 || auto.currentField === "submitting" || auto.currentField === "done",
    };
  }, [auto.currentField]);

  // Score breakdown for results
  const totalScore = React.useMemo(() => {
    let s = 0;
    for (const r of manual.results) {
      s += Math.round(r.vendorMatch * 8);
      if (r.amountCorrect) s += 6;
      if (r.categoryCorrect) s += 6;
    }
    return s;
  }, [manual.results]);

  const accuracy = React.useMemo(() => {
    if (manual.results.length === 0) return 0;
    const maxPer = 20;
    let earned = 0;
    for (const r of manual.results) {
      earned += Math.round(r.vendorMatch * 8);
      if (r.amountCorrect) earned += 6;
      if (r.categoryCorrect) earned += 6;
    }
    return Math.round((earned / (manual.results.length * maxPer)) * 100);
  }, [manual.results]);

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* HUD */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase tracking-widest text-paper-muted">
            Then vs. Now
          </span>
          <span className="font-mono text-3xl tabular-nums leading-none text-paper">
            {phase === "over" ? `Score: ${totalScore}` : "Receipt Race"}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Stat
            label="Manual"
            value={`${manual.completedCount}/${RECEIPTS.length}`}
          />
          <Stat
            label="Auto"
            value={`${auto.completedCount}/${RECEIPTS.length}`}
          />
          <Stat
            label="Time"
            value={formatTime(elapsed)}
            mono
          />
        </div>
      </div>

      {/* Progress bars */}
      <div className="flex flex-col gap-2">
        <ProgressBar
          label="Manual"
          pct={manualProgress * 100}
          color="bg-paper-muted"
          finished={manual.finishTime !== null}
        />
        <ProgressBar
          label="Automated"
          pct={autoProgress * 100}
          color="bg-solar"
          finished={auto.finishTime !== null}
        />
      </div>

      {/* Race lanes */}
      <div className="relative grid min-h-[360px] grid-cols-2 gap-3">
        {/* Ready overlay */}
        {phase === "ready" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-[--radius-md] bg-night/80 px-6 text-center backdrop-blur-sm">
            <p className="max-w-md text-sm text-paper-muted">
              Race to process 5 receipts manually while the automated system
              does the same. Type the vendor name, enter the amount, pick the
              category, then submit. Speed and accuracy both count.
            </p>
            <Button variant="solar" size="lg" onClick={start}>
              <Play className="size-4" />
              Start race
            </Button>
            <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
              Tab between fields · Enter to submit
            </span>
          </div>
        )}

        {/* Over overlay */}
        {phase === "over" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-[--radius-md] bg-night/80 px-6 text-center backdrop-blur-sm">
            <motion.div
              initial={reduce ? false : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
                  Race complete
                </span>
                <span className="font-mono text-5xl tabular-nums text-paper">
                  {totalScore}
                  <span className="text-2xl text-paper-muted">/100</span>
                </span>
                <span className="font-mono text-xs text-paper-muted">
                  Accuracy: {accuracy}%
                </span>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
                    Manual
                  </span>
                  <span className="font-mono text-xl tabular-nums text-paper">
                    {formatTime(manual.finishTime ?? 0)}
                  </span>
                </div>
                <div className="flex items-center text-paper-muted">vs</div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-solar">
                    Automated
                  </span>
                  <span className="font-mono text-xl tabular-nums text-solar">
                    {formatTime(auto.finishTime ?? 0)}
                  </span>
                </div>
              </div>

              {manual.finishTime !== null && auto.finishTime !== null && (
                <span className="font-mono text-sm text-paper-muted">
                  Automation was{" "}
                  <span className="text-solar font-semibold">
                    {(manual.finishTime / auto.finishTime).toFixed(1)}x
                  </span>{" "}
                  faster
                </span>
              )}

              <Button variant="solar" size="md" onClick={start}>
                <Play className="size-4" />
                Race again
              </Button>
            </motion.div>
          </div>
        )}

        {/* -- Manual Lane -- */}
        <div
          className={cn(
            "flex flex-col gap-3 rounded-[--radius-md] border border-night-border bg-night-soft/60 p-4",
            phase !== "playing" && "pointer-events-none opacity-40"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-paper-muted" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
              Manual
            </span>
            {manual.finishTime !== null && (
              <CheckCircle className="ml-auto size-3.5 text-green-400" />
            )}
          </div>

          <AnimatePresence mode="wait">
            {manualReceipt && phase === "playing" ? (
              <motion.div
                key={manual.currentIndex}
                initial={reduce ? false : { y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: -12, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-2.5"
              >
                {/* Receipt header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-paper-muted">
                    Receipt {manual.currentIndex + 1}/{RECEIPTS.length}
                  </span>
                  <span className="font-mono text-[10px] text-paper-muted">
                    {manualReceipt.date}
                  </span>
                </div>

                {/* Target info */}
                <div className="rounded-[--radius-sm] border border-night-border bg-night-card px-3 py-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-paper">
                      {manualReceipt.vendor}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-paper">
                      ${manualReceipt.amount.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-paper-muted">
                    {manualReceipt.category}
                  </span>
                </div>

                {/* Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitManual();
                  }}
                  className="flex flex-col gap-2"
                >
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
                      Vendor
                    </span>
                    <input
                      ref={vendorRef}
                      type="text"
                      value={vendorInput}
                      onChange={(e) => setVendorInput(e.target.value)}
                      placeholder="Type vendor name..."
                      autoComplete="off"
                      className="h-8 rounded-[--radius-sm] border border-night-border bg-night-card px-2.5 font-mono text-sm text-paper placeholder:text-paper-muted/40 outline-none focus:border-solar focus:ring-1 focus:ring-solar/30"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
                      Amount
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder="0.00"
                      autoComplete="off"
                      className="h-8 rounded-[--radius-sm] border border-night-border bg-night-card px-2.5 font-mono text-sm tabular-nums text-paper placeholder:text-paper-muted/40 outline-none focus:border-solar focus:ring-1 focus:ring-solar/30"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
                      Category
                    </span>
                    <select
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      className="h-8 rounded-[--radius-sm] border border-night-border bg-night-card px-2 font-mono text-sm text-paper outline-none focus:border-solar focus:ring-1 focus:ring-solar/30 [&>option]:bg-night-card [&>option]:text-paper"
                    >
                      <option value="" disabled>
                        Select category...
                      </option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button
                    type="submit"
                    variant="outline-dark"
                    size="sm"
                    className="mt-1 w-full"
                    disabled={
                      !vendorInput.trim() ||
                      !amountInput.trim() ||
                      !categoryInput
                    }
                  >
                    Submit receipt
                  </Button>
                </form>
              </motion.div>
            ) : phase === "playing" && manual.finishTime !== null ? (
              <motion.div
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-2 py-8"
              >
                <CheckCircle className="size-6 text-green-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-paper-muted">
                  Done in {formatTime(manual.finishTime)}
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* -- Automated Lane -- */}
        <div
          className={cn(
            "flex flex-col gap-3 rounded-[--radius-md] border border-night-border bg-night-soft/60 p-4",
            phase !== "playing" && "pointer-events-none opacity-40"
          )}
        >
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-solar" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-solar">
              Automated
            </span>
            {auto.finishTime !== null && (
              <CheckCircle className="ml-auto size-3.5 text-green-400" />
            )}
          </div>

          <AnimatePresence mode="wait">
            {autoReceipt && auto.currentField !== "done" && phase === "playing" ? (
              <motion.div
                key={auto.currentIndex}
                initial={reduce ? false : { y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: -12, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-2.5"
              >
                {/* Receipt header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-paper-muted">
                    Receipt {auto.currentIndex + 1}/{RECEIPTS.length}
                  </span>
                  <span className="font-mono text-[10px] text-paper-muted">
                    {autoReceipt.date}
                  </span>
                </div>

                {/* Auto-filling fields */}
                <AutoField
                  label="Vendor"
                  value={autoReceipt.vendor}
                  filled={autoFieldsFilled.vendor}
                  active={auto.currentField === "vendor"}
                  reduce={!!reduce}
                />
                <AutoField
                  label="Amount"
                  value={`$${autoReceipt.amount.toFixed(2)}`}
                  filled={autoFieldsFilled.amount}
                  active={auto.currentField === "amount"}
                  reduce={!!reduce}
                />
                <AutoField
                  label="Category"
                  value={autoReceipt.category}
                  filled={autoFieldsFilled.category}
                  active={auto.currentField === "category"}
                  reduce={!!reduce}
                />

                {/* Submit indicator */}
                <div
                  className={cn(
                    "mt-1 flex h-8 w-full items-center justify-center rounded-[--radius-sm] border text-xs font-medium transition-all duration-200",
                    auto.currentField === "submitting"
                      ? "border-solar bg-solar/20 text-solar"
                      : "border-night-border bg-night-card text-paper-muted/40"
                  )}
                >
                  {auto.currentField === "submitting" ? (
                    <motion.span
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Submitting...
                    </motion.span>
                  ) : (
                    "Waiting..."
                  )}
                </div>
              </motion.div>
            ) : phase === "playing" && auto.finishTime !== null ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-2 py-8"
              >
                <CheckCircle className="size-6 text-solar" />
                <span className="font-mono text-xs uppercase tracking-widest text-solar">
                  Done in {formatTime(auto.finishTime)}
                </span>
                <span className="font-mono text-[10px] text-paper-muted">
                  Waiting for manual...
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Sub-components
   --------------------------------------------------------------- */

function AutoField({
  label,
  value,
  filled,
  active,
  reduce,
}: {
  label: string;
  value: string;
  filled: boolean;
  active: boolean;
  reduce: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-paper-muted">
        {label}
      </span>
      <div
        className={cn(
          "relative h-8 overflow-hidden rounded-[--radius-sm] border px-2.5 font-mono text-sm transition-all duration-200",
          filled
            ? "border-solar/40 bg-solar/10 text-solar"
            : active
              ? "border-solar/30 bg-night-card text-paper"
              : "border-night-border bg-night-card text-paper-muted/30"
        )}
      >
        <div className="flex h-full items-center">
          {filled ? (
            <motion.span
              initial={reduce ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
            >
              {value}
            </motion.span>
          ) : active ? (
            <motion.span
              className="text-solar/60"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              Scanning...
            </motion.span>
          ) : (
            <span className="text-paper-muted/20">---</span>
          )}
        </div>
        {active && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-solar"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: (AUTO_FIELD_DELAYS[
                ["vendor", "amount", "category"].indexOf(label.toLowerCase())
              ] ?? 400) / 1000,
              ease: "linear",
            }}
          />
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  pct,
  color,
  finished,
}: {
  label: string;
  pct: number;
  color: string;
  finished: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-paper-muted">
        <span>{label}</span>
        <span className={cn(finished && "text-green-400")}>
          {finished ? "Done" : `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-night-soft">
        <motion.div
          className={cn("h-full rounded-full", color)}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.2, ease: "linear" }}
        />
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

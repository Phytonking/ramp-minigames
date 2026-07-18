"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, FileText, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HARDCODED_GAMES } from "@/lib/games";
import {
  runMockPipeline,
  type PipelineStage,
} from "@/lib/studio/mockPipeline";
import { findSampleForInput } from "@/lib/studio/specs";
import { PipelineStepper } from "@/components/studio/PipelineStepper";
import { SpecPanel, type SpecState } from "@/components/studio/SpecPanel";
import { CodePanel } from "@/components/studio/CodePanel";
import { LivePreview } from "@/components/studio/LivePreview";

type Phase = "intake" | "building" | "live";

interface RunResult {
  game: (typeof HARDCODED_GAMES)[number];
  previewUrl: string;
  closingStat: string;
}

export default function StudioPage() {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const reduced = !!prefersReduced;

  const [phase, setPhase] = useState<Phase>("intake");
  const [input, setInput] = useState("");

  const [source, setSource] = useState<{ report: string; excerpt: string } | null>(
    null
  );
  const [fileName, setFileName] = useState("GameComponent.tsx");
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null);
  const [completed, setCompleted] = useState<PipelineStage[]>([]);
  const [statusCopy, setStatusCopy] = useState("");
  const [spec, setSpec] = useState<SpecState>({});
  const [codeLines, setCodeLines] = useState<string[]>([]);
  const [bootProgress, setBootProgress] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  // Live elapsed timer during a run (mono, reinforces "alive").
  useEffect(() => {
    if (phase === "intake") return;
    const start = performance.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed(performance.now() - start), 100);
    return () => clearInterval(t);
  }, [phase]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setPhase("intake");
    setActiveStage(null);
    setCompleted([]);
    setStatusCopy("");
    setSpec({});
    setCodeLines([]);
    setBootProgress(0);
    setResult(null);
  }, []);

  const generate = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const sample = findSampleForInput(text);
    setSource({ report: sample.report, excerpt: sample.excerpt });
    setFileName(sample.fileName);
    setActiveStage(null);
    setCompleted([]);
    setStatusCopy("");
    setSpec({});
    setCodeLines([]);
    setBootProgress(0);
    setResult(null);
    setPhase("building");

    try {
      for await (const ev of runMockPipeline(text, {
        signal: controller.signal,
        reducedMotion: reduced,
      })) {
        switch (ev.type) {
          case "stage":
            setActiveStage(ev.stage);
            setStatusCopy(ev.status);
            break;
          case "status":
            setStatusCopy(ev.status);
            break;
          case "stage-complete":
            setCompleted((c) =>
              c.includes(ev.stage) ? c : [...c, ev.stage]
            );
            break;
          case "spec-open":
            setSpec((s) => ({
              ...s,
              [ev.field]: { value: "", streaming: true },
            }));
            break;
          case "spec-chunk":
            setSpec((s) => ({
              ...s,
              [ev.field]: {
                value: (s[ev.field]?.value ?? "") + ev.chunk,
                streaming: true,
              },
            }));
            break;
          case "spec-done":
            setSpec((s) => ({
              ...s,
              [ev.field]: {
                value: s[ev.field]?.value ?? "",
                streaming: false,
              },
            }));
            break;
          case "code-line":
            setCodeLines((l) => [...l, ev.line]);
            break;
          case "boot":
            setBootProgress(ev.progress);
            break;
          case "preview-ready": {
            const closingStat =
              findSampleForInput(text).spec.closing_stat_template;
            setResult({
              game: ev.game,
              previewUrl: ev.previewUrl,
              closingStat,
            });
            setPhase("live");
            toast.success("Shipped to the Arcade", {
              description: `${ev.game.title} is live in the gallery.`,
              action: {
                label: "Open →",
                onClick: () => router.push("/arcade"),
              },
            });
            break;
          }
        }
      }
    } catch {
      // Aborted (reset / unmount) — swallow.
    }
  }, [input, reduced, router]);

  const view: "panels" | "booting" | "preview" =
    phase === "live"
      ? "preview"
      : activeStage === "sandbox" || activeStage === "live"
        ? "booting"
        : "panels";

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8">
      <AnimatePresence mode="wait">
        {phase === "intake" ? (
          <IntakeState
            key="intake"
            input={input}
            setInput={setInput}
            onGenerate={generate}
            reduced={reduced}
          />
        ) : (
          <motion.div
            key="building"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <CompactHeader
              source={source}
              elapsed={elapsed}
              phase={phase}
              onReset={reset}
            />

            <div className="rounded-[--radius-lg] border border-line bg-surface px-5 py-6 sm:px-8">
              <PipelineStepper
                activeStage={activeStage}
                completed={completed}
                statusCopy={statusCopy}
                reducedMotion={reduced}
              />
            </div>

            <AnimatePresence mode="wait">
              {view === "panels" && (
                <motion.div
                  key="panels"
                  initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-4 lg:grid-cols-2 lg:items-stretch"
                >
                  <div className="min-h-[380px] lg:h-[460px]">
                    <SpecPanel spec={spec} reducedMotion={reduced} />
                  </div>
                  <div className="min-h-[380px] lg:h-[460px]">
                    <CodePanel
                      fileName={fileName}
                      lines={codeLines}
                      streaming={activeStage === "code"}
                      reducedMotion={reduced}
                    />
                  </div>
                </motion.div>
              )}

              {view === "booting" && (
                <motion.div
                  key="booting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <SandboxBoot progress={bootProgress} reduced={reduced} />
                </motion.div>
              )}

              {view === "preview" && result && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <LivePreview
                    game={result.game}
                    previewUrl={result.previewUrl}
                    closingStat={result.closingStat}
                    reducedMotion={reduced}
                    onNewRun={reset}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ── State A — Intake ─────────────────────────────────────────────────────── */

function IntakeState({
  input,
  setInput,
  onGenerate,
  reduced,
}: {
  input: string;
  setInput: (v: string) => void;
  onGenerate: () => void;
  reduced: boolean;
}) {
  const chips = HARDCODED_GAMES.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-2xl flex-col items-center pt-10 text-center sm:pt-16"
    >
      <h1 className="text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
        Turn a launch into a game.
      </h1>
      <p className="mt-4 max-w-lg text-ink-muted">
        Paste a Ramp announcement excerpt or a blog URL. An agent extracts the
        insight, designs a mechanic, writes the code, and boots a live sandbox.
      </p>

      <div className="mt-8 w-full">
        <div className="group rounded-[--radius-lg] border border-line bg-surface p-2 transition-colors focus-within:border-ink/30">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onGenerate();
            }}
            rows={5}
            placeholder="Paste a launch excerpt, or drop a ramp.com/blog URL…"
            className="w-full resize-none bg-transparent px-4 py-3 text-left text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-muted"
          />
          <div className="flex items-center justify-end px-2 pb-1 pt-1">
            <Button
              variant="solar"
              onClick={onGenerate}
              disabled={!input.trim()}
            >
              Generate game <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <p className="mt-2 text-right font-mono text-[11px] text-ink-muted">
          ⌘↵ to generate
        </p>
      </div>

      <div className="mt-8 w-full">
        <p className="mb-3 text-left font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          Try a real Ramp launch
        </p>
        <div className="flex flex-wrap gap-2">
          {chips.map((g) => (
            <button
              key={g.slug}
              onClick={() => setInput(g.source.excerpt)}
              className="group flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-left text-sm text-ink-muted transition-colors hover:border-ink/30 hover:text-ink"
            >
              <span className="max-w-[16rem] truncate">{g.source.report}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Compact header (States B/C) ──────────────────────────────────────────── */

function CompactHeader({
  source,
  elapsed,
  phase,
  onReset,
}: {
  source: { report: string; excerpt: string } | null;
  elapsed: number;
  phase: Phase;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 text-ink-muted" strokeWidth={1.75} />
          <span className="truncate text-sm font-medium text-ink">
            {source?.report ?? "Source"}
          </span>
        </div>
        <p className="mt-1 max-w-xl truncate font-mono text-xs text-ink-muted">
          {source?.excerpt}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              phase === "live" ? "bg-solar" : "animate-pulse bg-solar"
            )}
          />
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            {(elapsed / 1000).toFixed(1)}s
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCw className="size-4" /> New
        </Button>
      </div>
    </div>
  );
}

/* ── Sandbox boot ring (part of State C beat) ─────────────────────────────── */

function SandboxBoot({
  progress,
  reduced,
}: {
  progress: number;
  reduced: boolean;
}) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const pct = Math.round(progress * 100);

  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 rounded-[--radius-lg] border border-line bg-surface lg:h-[460px]">
      <div className="relative flex size-[120px] items-center justify-center">
        <svg className="size-[120px] -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="4"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--color-solar)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={false}
            animate={{ strokeDashoffset: C * (1 - progress) }}
            transition={{ duration: reduced ? 0 : 0.15, ease: "linear" }}
          />
        </svg>
        <span className="absolute font-mono text-lg tabular-nums text-ink">
          {pct}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink">Booting isolated sandbox…</p>
        <p className="mt-1 font-mono text-xs text-ink-muted">
          Daytona · untrusted AI code, safely contained
        </p>
      </div>
    </div>
  );
}

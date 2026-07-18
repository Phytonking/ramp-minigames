/**
 * Client-side mock of the Phase-2 generation pipeline (PRD.md). There is no
 * backend yet, so this streams believable staged output on a timer so the
 * Studio cockpit *feels* like a live agent run for the science-fair demo.
 *
 * Usage:
 *   for await (const ev of runMockPipeline(input, { signal })) { ... }
 *
 * Total wall-clock: ~9–11s at full motion, near-instant under reduced motion.
 */

import type { Game } from "@/lib/games";
import { HARDCODED_GAMES } from "@/lib/games";
import {
  findSampleForInput,
  INSIGHT_FIELDS,
  MECHANIC_FIELDS,
  type SampleSpec,
  type SpecField,
} from "./specs";

export type PipelineStage =
  | "ingest"
  | "extract"
  | "design"
  | "code"
  | "sandbox"
  | "live";

export interface StageMeta {
  id: PipelineStage;
  label: string;
  /** The agent / tool that owns this stage (shown as a sub-label). */
  agent: string;
}

/** The pipeline as drawn in DESIGN.md §2.1 — shared by the mock and the stepper. */
export const PIPELINE_STAGES: StageMeta[] = [
  { id: "ingest", label: "Ingest", agent: "scrape" },
  { id: "extract", label: "Extract insight", agent: "Claude" },
  { id: "design", label: "Design mechanic", agent: "Claude" },
  { id: "code", label: "Write code", agent: "Cursor" },
  { id: "sandbox", label: "Sandbox", agent: "Daytona" },
  { id: "live", label: "Live", agent: "" },
];

export type PipelineEvent =
  /** A stage becomes active, with its opening status micro-copy. */
  | { type: "stage"; stage: PipelineStage; status: string }
  /** Streaming status micro-copy under the active node. */
  | { type: "status"; stage: PipelineStage; status: string }
  /** A stage finished (renders the check + fills the connector). */
  | { type: "stage-complete"; stage: PipelineStage }
  /** A spec card should appear (empty, streaming). */
  | { type: "spec-open"; field: SpecField }
  /** A streamed chunk appended to a spec field's value. */
  | { type: "spec-chunk"; field: SpecField; chunk: string }
  /** A spec field finished streaming. */
  | { type: "spec-done"; field: SpecField }
  /** One line of the generated component appended to the code panel. */
  | { type: "code-line"; line: string }
  /** Sandbox boot progress, 0 → 1. */
  | { type: "boot"; progress: number }
  /** The playable preview is ready. */
  | { type: "preview-ready"; game: Game; previewUrl: string }
  | { type: "done" };

export interface PipelineOptions {
  signal?: AbortSignal;
  /** Under reduced motion we skip granular streaming and snap to results. */
  reducedMotion?: boolean;
}

class AbortError extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortError";
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AbortError());
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new AbortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Split a value into believable "token" chunks (word + trailing space). */
function chunk(value: string): string[] {
  return value.match(/\S+\s*/g) ?? [value];
}

function previewSlug(slug: string): string {
  const id = Math.random().toString(16).slice(2, 6);
  return `${slug}-${id}.preview.daytona.app`;
}

export async function* runMockPipeline(
  input: string,
  opts: PipelineOptions = {}
): AsyncGenerator<PipelineEvent> {
  const { signal, reducedMotion = false } = opts;
  const sample = findSampleForInput(input);
  const speed = reducedMotion ? 0.12 : 1;
  const wait = (ms: number) => sleep(Math.round(ms * speed), signal);

  // ── Ingest ───────────────────────────────────────────────────────────────
  yield { type: "stage", stage: "ingest", status: "Fetching source…" };
  await wait(600);
  yield {
    type: "status",
    stage: "ingest",
    status: `Parsed ${sample.sourceWords.toLocaleString()} words from “${sample.report}”.`,
  };
  await wait(700);
  yield { type: "stage-complete", stage: "ingest" };

  // ── Extract insight (Claude) ──────────────────────────────────────────────
  yield {
    type: "stage",
    stage: "extract",
    status: `Extracting core insight from ${sample.sourceWords.toLocaleString()} words…`,
  };
  await wait(500);
  yield* streamFields(sample, INSIGHT_FIELDS, wait);
  yield { type: "stage-complete", stage: "extract" };

  // ── Design mechanic (Claude) ──────────────────────────────────────────────
  yield {
    type: "stage",
    stage: "design",
    status: "Mapping the insight onto a playable mechanic…",
  };
  await wait(500);
  yield* streamFields(sample, MECHANIC_FIELDS, wait);
  yield { type: "stage-complete", stage: "design" };

  // ── Write code (Cursor) ───────────────────────────────────────────────────
  yield {
    type: "stage",
    stage: "code",
    status: `Cursor is writing ${sample.fileName}…`,
  };
  await wait(400);
  const lines = sample.code.replace(/\n$/, "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    yield { type: "code-line", line: lines[i] };
    if (i % 6 === 0) {
      yield {
        type: "status",
        stage: "code",
        status: `Writing ${sample.fileName} · ${i + 1}/${lines.length} lines`,
      };
    }
    await wait(reducedMotion ? 8 : 55);
  }
  yield {
    type: "status",
    stage: "code",
    status: `${sample.fileName} · ${lines.length} lines · types clean`,
  };
  await wait(300);
  yield { type: "stage-complete", stage: "code" };

  // ── Sandbox (Daytona) ─────────────────────────────────────────────────────
  yield {
    type: "stage",
    stage: "sandbox",
    status: "Booting isolated sandbox — untrusted AI code, safely contained…",
  };
  const bootSteps = 24;
  for (let i = 1; i <= bootSteps; i++) {
    yield { type: "boot", progress: i / bootSteps };
    await wait(reducedMotion ? 4 : 95);
  }
  yield { type: "stage-complete", stage: "sandbox" };

  // ── Live ──────────────────────────────────────────────────────────────────
  yield { type: "stage", stage: "live", status: "Preview is live." };
  const game = resolveGame(sample);
  const previewUrl = previewSlug(sample.slug);
  await wait(250);
  yield { type: "preview-ready", game, previewUrl };
  yield { type: "stage-complete", stage: "live" };
  yield { type: "done" };
}

async function* streamFields(
  sample: SampleSpec,
  fields: SpecField[],
  wait: (ms: number) => Promise<void>
): AsyncGenerator<PipelineEvent> {
  for (const field of fields) {
    yield { type: "spec-open", field };
    await wait(180);
    for (const c of chunk(sample.spec[field])) {
      yield { type: "spec-chunk", field, chunk: c };
      await wait(24);
    }
    yield { type: "spec-done", field };
    await wait(160);
  }
}

/** Prefer the matching hardcoded game as the "output" so provenance lines up. */
function resolveGame(sample: SampleSpec): Game {
  return (
    HARDCODED_GAMES.find((g) => g.slug === sample.slug) ?? HARDCODED_GAMES[0]
  );
}

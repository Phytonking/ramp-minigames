import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleDashed,
  Loader2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HARDCODED_GAMES } from "@/lib/games";

type RunStatus = "live" | "building" | "draft";

interface RunRow {
  id: string;
  report: string;
  mechanic: string;
  status: RunStatus;
  when: string;
  slug: string;
  playable: boolean;
}

/** Seeded from the three flagship games + a couple of mock in-flight runs. */
const RUNS: RunRow[] = [
  {
    id: "run_9f2a71",
    report: HARDCODED_GAMES[1].source.report,
    mechanic: HARDCODED_GAMES[1].mechanicLabel,
    status: "building",
    when: "just now",
    slug: HARDCODED_GAMES[1].slug,
    playable: false,
  },
  {
    id: "run_8c1d05",
    report: HARDCODED_GAMES[0].source.report,
    mechanic: HARDCODED_GAMES[0].mechanicLabel,
    status: "live",
    when: "12m ago",
    slug: HARDCODED_GAMES[0].slug,
    playable: true,
  },
  {
    id: "run_7b93e4",
    report: HARDCODED_GAMES[2].source.report,
    mechanic: HARDCODED_GAMES[2].mechanicLabel,
    status: "live",
    when: "1h ago",
    slug: HARDCODED_GAMES[2].slug,
    playable: true,
  },
  {
    id: "run_6a4f18",
    report: HARDCODED_GAMES[1].source.report,
    mechanic: HARDCODED_GAMES[1].mechanicLabel,
    status: "live",
    when: "3h ago",
    slug: HARDCODED_GAMES[1].slug,
    playable: true,
  },
  {
    id: "run_5e22ac",
    report: "Bill Pay auto-approval thresholds",
    mechanic: "Resource sorting under pressure",
    status: "draft",
    when: "yesterday",
    slug: HARDCODED_GAMES[0].slug,
    playable: false,
  },
];

const STATUS: Record<
  RunStatus,
  { label: string; className: string; icon: typeof Play }
> = {
  live: {
    label: "live",
    className: "border-solar/40 bg-solar/15 text-ink",
    icon: Play,
  },
  building: {
    label: "building",
    className: "border-line bg-surface text-ink-muted",
    icon: Loader2,
  },
  draft: {
    label: "draft",
    className: "border-line bg-transparent text-ink-muted",
    icon: CircleDashed,
  },
};

export default function RunsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Studio
          </Link>
          <h1 className="mt-3 text-2xl font-medium tracking-[-0.02em]">
            Run history
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every generation this operator has kicked off — proof of
            repeatability, not a one-off.
          </p>
        </div>
        <Button variant="solar" size="sm" asChild>
          <Link href="/studio">
            New generation <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-4 font-mono text-xs text-ink-muted">
        <span>
          <span className="text-ink">{RUNS.length}</span> runs
        </span>
        <span className="text-line">·</span>
        <span>
          <span className="text-ink">
            {RUNS.filter((r) => r.status === "live").length}
          </span>{" "}
          live
        </span>
        <span className="text-line">·</span>
        <span>
          <span className="text-ink">
            {RUNS.filter((r) => r.status === "building").length}
          </span>{" "}
          in flight
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[--radius-md] border border-line">
        {/* Header row */}
        <div className="grid grid-cols-[9rem_1fr_1fr_7rem_6rem_5rem] items-center gap-4 border-b border-line bg-surface px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          <span>run id</span>
          <span>source report</span>
          <span className="hidden sm:block">mechanic</span>
          <span>status</span>
          <span className="hidden sm:block">created</span>
          <span className="text-right">preview</span>
        </div>

        {RUNS.map((run, i) => {
          const s = STATUS[run.status];
          return (
            <div
              key={run.id}
              className={cn(
                "grid grid-cols-[9rem_1fr_1fr_7rem_6rem_5rem] items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-surface/60",
                i !== RUNS.length - 1 && "border-b border-line"
              )}
            >
              <span className="truncate font-mono text-xs text-ink-muted">
                {run.id}
              </span>
              <span className="truncate text-ink">{run.report}</span>
              <span className="hidden truncate font-mono text-xs text-ink-muted sm:block">
                {run.mechanic}
              </span>
              <span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px]",
                    s.className
                  )}
                >
                  <s.icon
                    className={cn(
                      "size-3",
                      run.status === "building" && "animate-spin"
                    )}
                    strokeWidth={1.75}
                  />
                  {s.label}
                </span>
              </span>
              <span className="hidden font-mono text-xs text-ink-muted sm:block">
                {run.when}
              </span>
              <span className="text-right">
                {run.playable ? (
                  <Link
                    href={`/games/${run.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-ink transition-colors hover:text-ink-muted"
                  >
                    open <ArrowRight className="size-3" strokeWidth={2} />
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-ink-muted/50">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

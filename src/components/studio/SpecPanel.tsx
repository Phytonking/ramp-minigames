"use client";

import { AnimatePresence, motion } from "motion/react";
import { Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEC_FIELDS, type SpecField } from "@/lib/studio/specs";

export interface SpecFieldState {
  value: string;
  streaming: boolean;
}

export type SpecState = Partial<Record<SpecField, SpecFieldState>>;

export interface SpecPanelProps {
  spec: SpecState;
  reducedMotion?: boolean;
}

export function SpecPanel({ spec, reducedMotion = false }: SpecPanelProps) {
  const visible = SPEC_FIELDS.filter((f) => spec[f.id] !== undefined);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[--radius-md] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Braces className="size-3.5 text-ink-muted" strokeWidth={1.75} />
          <span className="font-mono text-xs text-ink-muted">game_spec.json</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          {visible.length}/{SPEC_FIELDS.length}
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {visible.map((field) => {
            const state = spec[field.id]!;
            return (
              <motion.div
                key={field.id}
                layout={!reducedMotion}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[--radius-sm] border border-line bg-bg p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-ink-muted">
                    {field.label}
                  </span>
                  {state.streaming && (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted/70">
                      writing…
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-[13px] leading-relaxed text-ink">
                  {state.value}
                  {state.streaming && (
                    <span
                      className={cn(
                        "ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-solar",
                        !reducedMotion && "animate-pulse"
                      )}
                    />
                  )}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="flex h-full min-h-[8rem] items-center justify-center">
            <p className="font-mono text-xs text-ink-muted/70">
              awaiting spec…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

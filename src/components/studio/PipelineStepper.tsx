"use client";

import { motion } from "motion/react";
import {
  Check,
  Code2,
  Container,
  FileDown,
  Lightbulb,
  Puzzle,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/studio/mockPipeline";

const ICONS: Record<PipelineStage, LucideIcon> = {
  ingest: FileDown,
  extract: Lightbulb,
  design: Puzzle,
  code: Code2,
  sandbox: Container,
  live: Radio,
};

export interface PipelineStepperProps {
  activeStage: PipelineStage | null;
  completed: PipelineStage[];
  /** Streaming micro-copy for the currently active node. */
  statusCopy: string;
  reducedMotion?: boolean;
}

export function PipelineStepper({
  activeStage,
  completed,
  statusCopy,
  reducedMotion = false,
}: PipelineStepperProps) {
  const activeIndex = activeStage
    ? PIPELINE_STAGES.findIndex((s) => s.id === activeStage)
    : -1;

  return (
    <div className="w-full">
      <div className="flex items-start">
        {PIPELINE_STAGES.map((stage, i) => {
          const isDone = completed.includes(stage.id);
          const isActive = stage.id === activeStage;
          const Icon = ICONS[stage.id];
          const isLast = i === PIPELINE_STAGES.length - 1;
          // A connector fills once the node to its left is complete.
          const connectorFilled = isDone || i < activeIndex;

          return (
            <div
              key={stage.id}
              className={cn("flex flex-col items-center", !isLast && "flex-1")}
            >
              <div className="flex w-full items-center">
                <div className="relative flex flex-col items-center">
                  <StepNode
                    active={isActive}
                    done={isDone}
                    reducedMotion={reducedMotion}
                  >
                    {isDone ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      <Icon className="size-4" strokeWidth={1.75} />
                    )}
                  </StepNode>
                </div>

                {!isLast && (
                  <div className="relative mx-2 h-px flex-1 bg-line">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-solar"
                      initial={false}
                      animate={{ width: connectorFilled ? "100%" : "0%" }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.45,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 flex w-full max-w-[7.5rem] flex-col items-center px-1 text-center">
                <span
                  className={cn(
                    "text-[13px] leading-tight tracking-tight transition-colors",
                    isActive || isDone ? "text-ink" : "text-ink-muted"
                  )}
                >
                  {stage.label}
                </span>
                {stage.agent && (
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                    {stage.agent}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Single line of streaming status under the active node. */}
      <div className="mt-5 flex min-h-[1.25rem] items-center justify-center gap-2">
        {activeStage && statusCopy && (
          <>
            <motion.span
              key="dot"
              className="size-1.5 rounded-full bg-solar"
              animate={
                reducedMotion ? undefined : { opacity: [1, 0.35, 1] }
              }
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.p
              key={statusCopy}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-xs text-ink-muted"
            >
              {statusCopy}
            </motion.p>
          </>
        )}
      </div>
    </div>
  );
}

function StepNode({
  active,
  done,
  reducedMotion,
  children,
}: {
  active: boolean;
  done: boolean;
  reducedMotion?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {active && !reducedMotion && (
        <motion.span
          className="absolute inset-0 rounded-full bg-solar/50"
          animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <div
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full border transition-colors duration-200",
          done && "border-transparent bg-solar text-ink",
          active && !done && "border-solar bg-solar/10 text-ink",
          !active && !done && "border-line bg-bg text-ink-muted"
        )}
      >
        {children}
      </div>
    </div>
  );
}

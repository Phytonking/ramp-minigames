"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/games/ComingSoon";

/**
 * Then vs. Now — head-to-head timed race. Stub placeholder; the full mechanic
 * is intentionally not built (time). Shows the concept + a themed preview.
 */
export default function ThenVsNow() {
  const reduce = useReducedMotion();
  return (
    <ComingSoon
      title="Then vs. Now"
      concept="Race manual receipt entry against the one-click automated pass. Same receipts, two eras — watch the delta land in real time."
      mechanic="Head-to-head timed race"
      accent="solar"
      preview={
        <div className="flex w-full max-w-sm flex-col gap-3">
          {[
            { label: "Manual", w: reduce ? 82 : [8, 82], color: "bg-paper-muted", dur: 3.2 },
            { label: "Automated", w: reduce ? 22 : [8, 22], color: "bg-solar", dur: 0.9 },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-paper-muted">
                {row.label}
              </span>
              <div className="h-2 w-full overflow-hidden rounded-full bg-night-soft">
                <motion.div
                  className={`h-full rounded-full ${row.color}`}
                  initial={{ width: `${Array.isArray(row.w) ? row.w[0] : row.w}%` }}
                  animate={{
                    width: Array.isArray(row.w)
                      ? row.w.map((v) => `${v}%`)
                      : `${row.w}%`,
                  }}
                  transition={{
                    duration: row.dur,
                    ease: "linear",
                    repeat: reduce ? 0 : Infinity,
                    repeatDelay: 1.2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      }
    >
      <Badge variant="mono-dark">from · receipt automation</Badge>
    </ComingSoon>
  );
}

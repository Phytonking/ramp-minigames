"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, Flag, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/games/ComingSoon";

/**
 * Triage — judgment under volume. Stub placeholder; the full mechanic is
 * intentionally not built (time). Shows the concept + a themed preview.
 */
const ACTIONS = [
  { label: "Approve", icon: Check },
  { label: "Flag", icon: Flag },
  { label: "Escalate", icon: ArrowUpRight },
];

export default function Triage() {
  const reduce = useReducedMotion();
  return (
    <ComingSoon
      title="Triage"
      concept="Approve, flag, or escalate requests as they fly in — the agent auto-clears the routine ones so you only touch the hard judgment calls."
      mechanic="Judgment under volume"
      accent="blaze"
      preview={
        <div className="flex w-full max-w-sm flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: reduce ? 0 : i * 0.5,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                repeat: reduce ? 0 : Infinity,
                repeatDelay: 1.4,
                repeatType: "reverse",
              }}
              className="flex items-center justify-between rounded-[--radius-sm] border border-night-border bg-night-card px-3 py-2"
            >
              <span className="font-mono text-xs text-paper-muted">
                REQ-{4021 + i}
              </span>
              <div className="flex gap-1.5">
                {ACTIONS.map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="grid size-6 place-items-center rounded-[--radius-xs] border border-night-border text-paper-muted"
                  >
                    <Icon className="size-3" />
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      }
    >
      <Badge variant="mono-dark">from · AI agents for procurement</Badge>
    </ComingSoon>
  );
}

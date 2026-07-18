import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight",
  {
    variants: {
      variant: {
        solar: "border-transparent bg-solar text-ink",
        outline: "border-line bg-transparent text-ink-muted",
        "outline-dark": "border-night-border bg-transparent text-paper-muted",
        mono: "border-line bg-transparent font-mono text-ink-muted",
        "mono-dark": "border-night-border bg-transparent font-mono text-paper-muted",
      },
    },
    defaultVariants: { variant: "outline" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />;
}

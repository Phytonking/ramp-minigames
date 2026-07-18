import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Depth via 1px hairlines + surface contrast, never drop shadows (DESIGN.md §6).
 * Use `tone="dark"` on Arcade surfaces, default (light) on Studio surfaces.
 */
export function Card({
  className,
  tone = "light",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "light" | "dark" }) {
  return (
    <div
      className={cn(
        "rounded-[--radius-md] border",
        tone === "dark"
          ? "border-night-border bg-night-card text-paper"
          : "border-line bg-surface text-ink",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  tone = "light",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { tone?: "light" | "dark" }) {
  return (
    <p
      className={cn(
        "text-sm",
        tone === "dark" ? "text-paper-muted" : "text-ink-muted",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />
  );
}

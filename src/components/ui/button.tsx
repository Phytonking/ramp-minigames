import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[--radius-sm] text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The single loud note — generation / money moves.
        solar:
          "bg-solar text-ink hover:bg-solar-light active:bg-solar-strong font-semibold",
        // Light editorial (Studio).
        ink: "bg-ink text-bg hover:bg-ink/90",
        outline:
          "border border-line bg-transparent text-ink hover:bg-surface",
        ghost: "bg-transparent text-ink hover:bg-surface",
        // Dark (Arcade).
        paper: "bg-paper text-night hover:bg-white",
        "outline-dark":
          "border border-night-border bg-transparent text-paper hover:bg-night-soft",
        "ghost-dark": "bg-transparent text-paper hover:bg-night-soft",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "solar", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /** Render as the child element (e.g. a Next.js <Link>) instead of a <button>. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(button({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { button as buttonVariants };

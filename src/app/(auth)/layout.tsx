import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared shell for the auth surfaces (/login, /signup).
 * Clean, centered card on the light editorial canvas with a subtle hairline
 * grid — yellow is reserved for the primary CTA inside the card (DESIGN.md §6).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Faint editorial grid, masked to fade at the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(12,10,8,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(12,10,8,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <header className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-lg tracking-[-0.02em] text-ink"
          >
            <span
              aria-hidden
              className="size-2.5 rounded-[3px] bg-solar transition-transform group-hover:scale-110"
            />
            <span className="font-medium">
              Ramp <span className="text-ink-muted">Minigames</span>
            </span>
          </Link>
        </header>

        {children}

        <footer className="mt-6 text-center">
          <Link
            href="/arcade"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Back to the Arcade
          </Link>
        </footer>
      </div>
    </main>
  );
}

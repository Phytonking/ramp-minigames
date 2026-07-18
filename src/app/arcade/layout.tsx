import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arcade — Ramp Minigames",
  description:
    "Play the games. Each one is generated from a real Ramp launch — provenance and all.",
};

export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="theme-arcade min-h-screen">{children}</div>;
}

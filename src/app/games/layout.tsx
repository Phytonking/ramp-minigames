import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now playing — Ramp Minigames",
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="theme-arcade min-h-screen">{children}</div>;
}

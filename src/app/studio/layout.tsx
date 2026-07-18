import type { Metadata } from "next";
import { StudioTopBar } from "@/components/studio/StudioTopBar";
import { CommandPalette } from "@/components/studio/CommandPalette";

export const metadata: Metadata = {
  title: "Studio — Ramp Minigames",
  description:
    "The generation cockpit: drop in a Ramp launch, watch an agent build a playable minigame.",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg text-ink">
      <StudioTopBar />
      <div className="flex-1">{children}</div>
      <CommandPalette />
    </div>
  );
}

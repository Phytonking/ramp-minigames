import type { Metadata } from "next";
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
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <CommandPalette />
    </div>
  );
}

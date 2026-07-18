import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllGames } from "@/lib/games";
import { GameTable } from "@/components/admin/GameTable";

export default async function AdminPage() {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/arcade");

  const games = await getAllGames();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.02em]">
            Game management
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {games.length} games total
          </p>
        </div>
      </div>

      <GameTable initialGames={games} />
    </div>
  );
}

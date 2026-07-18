import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gameSessions } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      gameSlug: string;
      score?: number;
      durationMs?: number;
      statValue?: unknown;
    };

    if (!body.gameSlug) {
      return NextResponse.json({ error: "gameSlug required" }, { status: 400 });
    }

    const session = await getSession();

    const [row] = await db
      .insert(gameSessions)
      .values({
        neonUserId: session?.id ?? null,
        gameSlug: body.gameSlug,
        score: body.score ?? null,
        durationMs: body.durationMs ?? null,
        statValue: body.statValue ?? null,
      })
      .returning({ id: gameSessions.id });

    return NextResponse.json({ id: row?.id });
  } catch (err) {
    console.error("session save failed", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

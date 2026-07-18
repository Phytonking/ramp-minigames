import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { gameSandboxes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHardcodedGameSandbox } from "@/lib/daytona";
import { getSession } from "@/lib/auth";

export const maxDuration = 300;

const COMPONENT_MAP: Record<string, string> = {
  "spend-sort": "SpendSort",
  triage: "Triage",
  "then-vs-now": "ThenVsNow",
};

const ROOT = process.cwd();

function readSrc(rel: string) {
  return fs.readFileSync(path.join(ROOT, "src", rel), "utf8");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const componentName = COMPONENT_MAP[slug];

  if (!componentName) {
    return NextResponse.json({ error: "unknown slug" }, { status: 404 });
  }

  if (!process.env.DAYTONA_API_KEY) {
    return NextResponse.json({ error: "DAYTONA_API_KEY not set" }, { status: 503 });
  }

  // Check cache — sandbox may still be alive
  const cached = await db
    .select()
    .from(gameSandboxes)
    .where(eq(gameSandboxes.gameSlug, slug))
    .limit(1);

  if (cached.length > 0) {
    return NextResponse.json({ previewUrl: cached[0].previewUrl, cached: true });
  }

  // Read game file + local deps from disk
  const gameCode = readSrc(`components/games/${componentName}.tsx`);
  const localDeps = {
    utils: readSrc("lib/utils.ts"),
    button: readSrc("components/ui/button.tsx"),
    badge: readSrc("components/ui/badge.tsx"),
    comingSoon: readSrc("components/games/ComingSoon.tsx"),
  };

  const preview = await createHardcodedGameSandbox(slug, gameCode, componentName, localDeps);

  // Upsert cache row
  await db
    .insert(gameSandboxes)
    .values({
      gameSlug: slug,
      sandboxId: preview.workspaceId,
      previewUrl: preview.previewUrl,
    })
    .onConflictDoUpdate({
      target: gameSandboxes.gameSlug,
      set: {
        sandboxId: preview.workspaceId,
        previewUrl: preview.previewUrl,
        updatedAt: new Date(),
        lastVerifiedAt: new Date(),
      },
    });

  return NextResponse.json({ previewUrl: preview.previewUrl, cached: false });
}

/** Force-recreate a sandbox (invalidates cache). Admin only. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  await db.delete(gameSandboxes).where(eq(gameSandboxes.gameSlug, slug));
  return NextResponse.json({ ok: true });
}

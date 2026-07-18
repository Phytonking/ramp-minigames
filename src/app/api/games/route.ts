import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const allGames = await db
    .select()
    .from(games)
    .orderBy(asc(games.sortOrder));
  return NextResponse.json(allGames);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const row = await db
    .insert(games)
    .values({
      slug: body.slug,
      title: body.title,
      tagline: body.tagline,
      teaches: body.teaches,
      mechanic: body.mechanic,
      mechanicLabel: body.mechanicLabel,
      closingStat: body.closingStat,
      sourceReport: body.sourceReport,
      sourceExcerpt: body.sourceExcerpt,
      status: body.status ?? "draft",
      hardcoded: body.hardcoded ?? false,
      accent: body.accent ?? "solar",
      sortOrder: body.sortOrder ?? 0,
      previewUrl: body.previewUrl ?? null,
      createdBy: admin.id,
    })
    .returning();

  return NextResponse.json(row[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of [
    "title", "tagline", "teaches", "mechanic", "mechanicLabel",
    "closingStat", "sourceReport", "sourceExcerpt", "status",
    "accent", "sortOrder", "previewUrl",
  ] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const row = await db
    .update(games)
    .set(updates)
    .where(eq(games.slug, body.slug))
    .returning();

  if (row.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row[0]);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await db.delete(games).where(eq(games.slug, slug));
  return NextResponse.json({ ok: true });
}

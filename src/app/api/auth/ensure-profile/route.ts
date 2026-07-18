import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProfiles } from "@/db/schema";
import { getSession, roleForEmail } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.neonUserId, session.id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ profile: existing[0] });
  }

  const role = roleForEmail(session.email);
  const [profile] = await db
    .insert(userProfiles)
    .values({
      neonUserId: session.id,
      role,
      displayName: session.name,
    })
    .returning();

  return NextResponse.json({ profile, created: true });
}

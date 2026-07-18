import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const ALLOWED: Record<string, string> = {
  "spend-sort": "src/components/games/SpendSort.tsx",
  triage: "src/components/games/Triage.tsx",
  "then-vs-now": "src/components/games/ThenVsNow.tsx",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";
  const rel = ALLOWED[slug];

  if (!rel) {
    return new NextResponse("not found", { status: 404 });
  }

  try {
    const abs = join(process.cwd(), rel);
    const src = readFileSync(abs, "utf-8");
    return new NextResponse(src, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new NextResponse("// source unavailable", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

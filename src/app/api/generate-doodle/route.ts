import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Game } from "@/lib/games";
import { appendGeneratedGame } from "@/lib/generated";

// This route runs the real Python doodle pipeline (MAP -> ASSETS -> CODEGEN), which
// can take several minutes, so it must run on the Node runtime with a long budget.
export const runtime = "nodejs";
export const maxDuration = 800;
export const dynamic = "force-dynamic";

const ROOT = process.cwd();

const ARCHETYPE_LABEL: Record<string, string> = {
  pony_express: "Side-scrolling catch & dodge",
  magic_cat: "Match the right action under waves",
  cricket: "Timing-based precision",
  pangolin: "Roll & collect to a quota",
  champion_island: "Fast score-attack",
  half_moon: "Turn-based match & connect",
};

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `game-${Date.now()}`
  );
}

function runPipeline(inputFile: string): Promise<{ code: number; log: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      "python",
      ["pipeline.py", "--config", "config.json", "--input", inputFile],
      { cwd: ROOT, env: { ...process.env } }
    );
    let log = "";
    child.stdout.on("data", (d) => (log += d.toString()));
    child.stderr.on("data", (d) => (log += d.toString()));
    child.on("close", (code) => resolve({ code: code ?? -1, log }));
    child.on("error", (err) => resolve({ code: -1, log: log + "\n" + String(err) }));
  });
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set in the server environment." },
      { status: 500 }
    );
  }

  const { excerpt } = (await req.json()) as { excerpt?: string };
  if (!excerpt?.trim()) {
    return NextResponse.json({ error: "excerpt required" }, { status: 400 });
  }

  // Write the launch blurb to a file the pipeline reads.
  const inputFile = path.join(ROOT, "studio_input.txt");
  await fs.writeFile(inputFile, excerpt.trim() + "\n", "utf8");

  const { code, log } = await runPipeline("studio_input.txt");
  if (code !== 0) {
    return NextResponse.json(
      { error: "pipeline failed", log: log.slice(-4000) },
      { status: 500 }
    );
  }

  // Read what the pipeline produced.
  const designRaw = await fs.readFile(
    path.join(ROOT, "generated_game", "game_design.json"),
    "utf8"
  );
  const design = JSON.parse(designRaw) as Record<string, unknown>;
  const title = (design.title as string) || "Generated Game";
  const slug = slugify(title);

  // Copy the generated game into public/ so it can be served + iframed.
  const destDir = path.join(ROOT, "public", "generated", slug);
  await fs.rm(destDir, { recursive: true, force: true });
  await fs.mkdir(destDir, { recursive: true });
  await fs.copyFile(
    path.join(ROOT, "generated_game", "index.html"),
    path.join(destDir, "index.html")
  );
  await fs.cp(
    path.join(ROOT, "generated_game", "sprites"),
    path.join(destDir, "sprites"),
    { recursive: true }
  );
  await fs.copyFile(
    path.join(ROOT, "generated_game", "game_design.json"),
    path.join(destDir, "game_design.json")
  );

  const fe = (design.feature_explainer as Record<string, unknown>) || {};
  const bullets = (fe.bullets as string[]) || [];
  const archetype = (design.chosen_archetype as string) || "";

  const game: Game = {
    slug,
    title,
    tagline: (design.subtitle as string) || title,
    teaches: bullets[0] || (design.why as string) || (design.subtitle as string) || "",
    mechanic: archetype || "generated",
    mechanicLabel: ARCHETYPE_LABEL[archetype] || "Doodle-style arcade game",
    closingStat: (design.closing_stat as string) || "You scored {score}.",
    source: {
      report: (fe.headline as string) || "Ramp launch",
      excerpt: excerpt.trim().slice(0, 200),
    },
    status: "live",
    hardcoded: false,
    accent: "solar",
    previewUrl: `/generated/${slug}/index.html`,
  };

  appendGeneratedGame(game);

  return NextResponse.json({ slug, game, archetype });
}

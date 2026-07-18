import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { generationRuns } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createGameSandbox } from "@/lib/daytona";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin access required" }, { status: 403 });
  }

  const { excerpt } = (await req.json()) as { excerpt?: string };
  if (!excerpt?.trim()) {
    return NextResponse.json({ error: "excerpt required" }, { status: 400 });
  }

  // Step 1: Claude extracts a structured game spec
  const specResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a game designer. Given this Ramp product announcement excerpt, extract a concise game spec as JSON.

Excerpt:
${excerpt}

Return ONLY valid JSON matching this shape (no markdown, no explanation):
{
  "concept_name": string,        // short game title
  "mechanic": string,            // one-sentence mechanic description
  "hook": string,                // one punchy hook line
  "closing_stat_template": string, // closing stat with {X} placeholders
  "ui_description": string       // brief layout/interaction description for the coder
}`,
      },
    ],
  });

  const rawSpec = specResponse.content[0]?.type === "text" ? specResponse.content[0].text : "{}";
  let spec: Record<string, string>;
  try {
    spec = JSON.parse(rawSpec);
  } catch {
    return NextResponse.json({ error: "spec parse failed", raw: rawSpec }, { status: 500 });
  }

  const slug = spec.concept_name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") ?? `game-${Date.now()}`;

  // Step 2: Claude writes the React component
  const codeResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Build a self-contained React game component for this spec:
${JSON.stringify(spec, null, 2)}

Requirements:
- Single default export, no external deps beyond React
- Uses useState/useEffect/useRef only
- Tailwind CSS for styling (dark bg #0b0b0c, accent #e4f222)
- Accepts optional onComplete prop: (result: { score: number; statValue: number }) => void
- Game ends by calling onComplete with the result
- TypeScript, strict types
- Include the full game logic — not a stub

Return ONLY the TypeScript component code, no markdown fences, no explanation.`,
      },
    ],
  });

  const componentCode =
    codeResponse.content[0]?.type === "text" ? codeResponse.content[0].text : "";

  // Step 3: Spin up Daytona sandbox (if API key is configured)
  let previewUrl: string | null = null;
  let workspaceId: string | null = null;

  if (process.env.DAYTONA_API_KEY) {
    try {
      const sandbox = await createGameSandbox(slug, componentCode);
      previewUrl = sandbox.previewUrl;
      workspaceId = sandbox.workspaceId;
    } catch (err) {
      console.error("Daytona sandbox creation failed", err);
      // non-fatal — game still gets saved without a preview URL
    }
  }

  // Step 4: Persist to DB
  const [row] = await db
    .insert(generationRuns)
    .values({
      createdBy: session.id,
      inputText: excerpt,
      rawOutput: { spec, componentCode },
      gameSlug: slug,
      previewUrl,
      daytonaWorkspaceId: workspaceId,
    })
    .returning({ id: generationRuns.id });

  return NextResponse.json({
    id: row?.id,
    slug,
    spec,
    previewUrl,
    workspaceId,
    componentCode,
  });
}

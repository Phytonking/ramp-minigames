# PRD: Ramp Minigames — AI-Generated Interactive Explainers

**Builders Cup 2026 · Status: Active**

---

## Overview

A pipeline that ingests a Ramp product announcement and outputs a polished, playable minigame that teaches its core insight in under 90 seconds. Deliverable at the Science Fair is both the pipeline (live or documented) and three finished games proving the system produces varied output.

System is built in three ordered phases:

1. **Phase 1 — Game Hosting** (Daytona): sandboxed preview environments for generated games
2. **Phase 2 — Generation Pipeline** (Cursor Agent SDK): excerpt → full React game component, fully autonomous
3. **Phase 3 — Base App** (Next.js + Neon): the core product shell all phases plug into

---

## Goals

| Goal | Metric |
|---|---|
| Pipeline works end-to-end live | Paste excerpt → structured game concept in <30s |
| Generated games run in isolated preview | Daytona workspace spins up per generated game |
| 3 distinct, playable games ship | All three completable without bugs at demo time |
| Games are shareable | Each ends with a real stat + share affordance |
| System argument lands | Judges see a repeatable product, not 3 one-offs |

---

## Tech Stack

### Frontend
- **Next.js 15 (App Router)** — pipeline screen, game menu, 3 game routes, generated game viewer
- **TypeScript** — strict mode
- **Tailwind CSS + shadcn/ui** — UI components, consistent design system
- **React** — games as self-contained components (no Phaser; portable + embeddable)

### Backend / Data
- **Neon (Postgres)** — generation runs, game concepts, per-session stats
- **Drizzle ORM** — schema + migrations, native Neon serverless driver
- **Next.js Route Handlers** — `/api/generate`, `/api/generate-game`, `/api/session`

### AI Pipeline
- **Cursor Agent SDK (`@cursor/sdk`)** — autonomous game component generation
  - Takes mechanic description → writes complete `GameComponent.tsx` to disk
  - Runs headless, no human approval step
- **Anthropic Claude API (claude-sonnet-4-6)** — structured concept extraction (excerpt → game spec JSON)

### Game Hosting & Sandboxing
- **Daytona** — spin up isolated dev environment per generated game for preview
  - Each generated game gets a Daytona workspace with a running Next.js dev server
  - Exposes a preview URL per workspace (used for iframe embed and share link)
  - Preferred for: generated/AI games where you want sandbox isolation
- **Vercel** — production deploy for the 3 hardcoded games + main app shell
  - Preferred for: stable, client-facing, non-generated content

> **Hosting decision**: Daytona is the right sandbox for AI-generated games (untrusted code, ephemeral, needs isolation). Vercel is the right host for the known-good app shell and the 3 handcrafted games. These two coexist: Vercel serves the product, Daytona serves generated previews.

### Dev Tooling
- pnpm, ESLint, Prettier, Drizzle Kit

---

## Phase 1 — Game Hosting via Daytona

**Goal**: any generated game component can be previewed via a live URL in an isolated environment.

### How it works

1. Cursor SDK generates a game component file (e.g. `SpendSort.tsx`)
2. `/api/generate-game` triggers a Daytona workspace creation via Daytona API
3. Workspace clones a minimal Next.js shell repo, drops in the generated component, boots dev server
4. Daytona returns a preview URL → stored in `generation_runs.preview_url`
5. Main app embeds the preview URL in an `<iframe>` on `/games/[slug]`

### Daytona integration

```ts
// lib/daytona.ts
import Daytona from "@daytonaio/sdk";

const daytona = new Daytona();

export async function createGamePreview(componentCode: string, slug: string) {
  const workspace = await daytona.create({
    language: "typescript",
    // points to a minimal Next.js shell repo
    repoUrl: process.env.DAYTONA_SHELL_REPO,
  });

  // write the generated component into the workspace
  await workspace.process.executeCommand(
    `cat > app/games/${slug}/page.tsx << 'EOF'\n${componentCode}\nEOF`
  );

  // start dev server
  await workspace.process.executeCommand("pnpm dev &");

  const preview = await workspace.getPreviewLink(3000);
  return { workspaceId: workspace.id, previewUrl: preview.url };
}
```

**Env vars needed:**
```
DAYTONA_API_KEY=...
DAYTONA_SHELL_REPO=https://github.com/your-org/minigame-shell
```

### DB addition

```sql
ALTER TABLE generation_runs ADD COLUMN preview_url text;
ALTER TABLE generation_runs ADD COLUMN daytona_workspace_id text;
```

---

## Phase 2 — Generation Pipeline via Cursor Agent SDK

**Goal**: paste a product excerpt → get a complete, playable React game component, fully autonomous.

### Two-step pipeline

**Step 1 — Claude extracts structured spec** (`POST /api/generate`)

```ts
// uses claude-sonnet-4-6 with tool use
{
  concept_name: string,
  mechanic: string,          // detailed enough for Cursor to implement
  hook: string,
  closing_stat_template: string,
  difficulty_curve: string,
  ui_description: string     // layout, colors, interactions
}
```

**Step 2 — Cursor SDK builds the component** (`POST /api/generate-game`)

```ts
import { CursorAgent } from "@cursor/sdk";

const agent = new CursorAgent({ apiKey: process.env.CURSOR_API_KEY });

const prompt = `
Build a self-contained React game component based on this spec:
${JSON.stringify(spec, null, 2)}

Requirements:
- Single file, no external deps beyond React
- Uses useState/useEffect/useRef only
- Tailwind for styling
- Game ends and calls onComplete({ score, stat }) when done
- TypeScript, strict types
`;

const result = await agent.run(prompt, {
  outputFile: `./games/generated/${slug}.tsx`,
});
```

**Then**: hand the generated file to Phase 1 (Daytona) for live preview.

### Full `/api/generate-game` flow

```
POST /api/generate-game { excerpt: string }
  → Claude: extract spec
  → Save to generation_runs
  → Cursor SDK: build component → write to /games/generated/[slug].tsx
  → Daytona: spin up workspace, inject component, get preview URL
  → Update generation_runs.preview_url
  → Return { slug, previewUrl }
```

**Env vars needed:**
```
CURSOR_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Phase 3 — Base Next.js App + Neon DB

**Goal**: working Next.js app, DB connected, 3 hardcoded games live, pipeline screen wired.

### Scaffold steps

```bash
pnpm create next-app@latest ramp-minigames --typescript --tailwind --app
cd ramp-minigames
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
pnpm dlx shadcn@latest init
```

### Neon connection

```ts
// lib/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

**Env vars:**
```
DATABASE_URL=postgres://...         # pooled — use in Route Handlers
DATABASE_URL_UNPOOLED=postgres://...  # direct — use in drizzle-kit migrations
```

### Database Schema

```sql
CREATE TABLE generation_runs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz DEFAULT now(),
  input_text            text NOT NULL,
  raw_output            jsonb NOT NULL,
  game_slug             text,
  preview_url           text,
  daytona_workspace_id  text
);

CREATE TABLE game_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  game_slug    text NOT NULL,
  score        integer,
  duration_ms  integer,
  stat_value   jsonb
);
```

### Routes

| Route | Description |
|---|---|
| `/` | Station menu — links to pipeline + 3 games |
| `/pipeline` | Step 1: paste excerpt → structured spec |
| `/games/spend-sort` | Hardcoded game 1 |
| `/games/triage` | Hardcoded game 2 |
| `/games/then-vs-now` | Hardcoded game 3 |
| `/games/[slug]` | Generated game viewer (iframe → Daytona preview URL) |
| `/api/generate` | POST — Claude spec extraction |
| `/api/generate-game` | POST — full pipeline: spec → Cursor → Daytona |
| `/api/session` | POST — save game result |

---

## The 3 Hardcoded Games

### Spend Sort (`/games/spend-sort`)
Mechanic: resource-sorting under pressure
- Tasks pile into queue, spawn rate accelerates
- 3 buckets = model cost tiers (Cheap/Fast · Balanced · Expensive/Capable)
- Wrong bucket: task bounces back, costs double time; budget bar drains
- Closing stat: "You saved X% vs. routing everything to the expensive tier"

```ts
type Task = { id: string; label: string; correctTier: 0 | 1 | 2; spawnedAt: number }
type GameState = { queue: Task[]; budget: number; score: number; elapsed: number }
```

### Triage (`/games/triage`)
Mechanic: judgment under volume
- Request cards fly in: approve / flag / escalate
- Simple ones auto-resolve after 2s (agent handles routine work)
- Complex ones: player must act within 3s or miss
- Closing stat: "You reviewed N requests; agent handled M — ~Z hours saved"

### Then vs. Now (`/games/then-vs-now`)
Mechanic: head-to-head timed race
- Round 1: manual receipt entry (type, hunt for category, confirm)
- Round 2: same receipts, automated (one click, pre-filled)
- Closing stat: "Manual: Xm Ys · Automated: Zs"

---

## Build Order

| Step | Phase | Time | What ships |
|---|---|---|---|
| 1 | 3 | 20 min | Next.js scaffold, Neon connected, Drizzle schema migrated |
| 2 | 3 | 30 min | `/` menu + 3 game route stubs |
| 3 | 3 | 45 min | Spend Sort complete |
| 4 | 3 | 45 min | Triage complete |
| 5 | 3 | 40 min | Then vs. Now complete |
| 6 | 2 | 40 min | Claude extraction (`/api/generate` + pipeline screen) |
| 7 | 2 | 30 min | Cursor SDK integration (`/api/generate-game`) |
| 8 | 1 | 40 min | Daytona workspace creation + preview URL |
| 9 | 3 | 20 min | `/games/[slug]` iframe viewer wired to Daytona preview |
| 10 | — | 20 min | Walkthrough rehearsal |

**Total: ~5.5 hrs. Phases 1+2 are the "wow" extension — ship Phase 3 first, then layer in.**

---

## Open Questions

- [ ] Lock the three source excerpts before build day — pipeline person needs them early
- [ ] Daytona shell repo: needs to be a minimal Next.js app that accepts a dropped-in component — create this first
- [ ] Cursor SDK public beta: confirm API key provisioning before build day
- [ ] Each game needs one real, sourced number (cost ratio, time savings) — pin before writing copy
- [ ] Share affordance for generated games: iframe embed code, or just the Daytona preview URL?
- [ ] Daytona workspace cleanup: add a cron or TTL to teardown old preview workspaces

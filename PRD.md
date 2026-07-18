# PRD: Ramp Minigames — AI-Generated Interactive Explainers

**Builders Cup 2026 · Status: Active**

---

## Overview

A pipeline that ingests a Ramp product announcement and outputs a polished, playable minigame that teaches its core insight in under 90 seconds. Deliverable at the Science Fair is both the pipeline (live or documented) and three finished games proving the system produces varied output.

---

## Goals

| Goal | Metric |
|---|---|
| Pipeline works end-to-end live | Paste excerpt → structured game concept in <30s |
| 3 distinct, playable games ship | All three completable without bugs at demo time |
| Games are shareable | Each ends with a real stat + share affordance |
| System argument lands | Judges see it as a repeatable product, not 3 one-offs |

---

## Tech Stack

### Frontend
- **Next.js 15 (App Router)** — pages for pipeline screen, game menu, 3 game routes
- **TypeScript** — strict mode
- **Tailwind CSS + shadcn/ui** — UI components, consistent design system
- **React** — games built as self-contained React components (no Phaser; keeps bundle simple and games portable as embeds)

### Backend / Data
- **Neon (Postgres)** — store: generation runs, extracted game concepts, per-game session stats (score, time, closing stat value)
- **Drizzle ORM** — schema + migrations, works natively with Neon serverless driver
- **Next.js Route Handlers** — `/api/generate` for pipeline call, `/api/session` for saving game results

### AI Pipeline
- **Anthropic Claude API (claude-sonnet-4-6)** — structured extraction: report excerpt → `{ concept_name, mechanic_description, hook, closing_stat_template, difficulty_curve }`
- Response as JSON via tool use / structured output — not freeform text

### Hosting
- **Vercel** — deploy target, Neon integration available via Marketplace

### Dev Tooling
- pnpm, ESLint, Prettier, Drizzle Kit for migrations

---

## Database Schema

```sql
-- generation_runs: log every pipeline invocation
CREATE TABLE generation_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  input_text  text NOT NULL,
  raw_output  jsonb NOT NULL,         -- full LLM response
  game_slug   text                    -- 'spend-sort' | 'triage' | 'then-vs-now' | generated
);

-- game_sessions: per-play stats for closing stat calculation
CREATE TABLE game_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  game_slug    text NOT NULL,
  score        integer,
  duration_ms  integer,
  stat_value   jsonb            -- game-specific closing stat payload
);
```

---

## Features

### 1. Pipeline Screen (`/pipeline`)
- Textarea: paste report excerpt
- Button: "Generate Game Concept"
- Calls `/api/generate` → streams or returns structured JSON
- Renders: concept name, mechanic summary, hook line, closing stat template
- "Run it live" mode: real API call. "Show cached" mode: pre-run output for reliability during demo

**API contract (`POST /api/generate`)**
```ts
// Request
{ excerpt: string }

// Response
{
  concept_name: string,
  mechanic: string,
  hook: string,
  closing_stat_template: string,  // e.g. "You saved {{pct}}% vs. worst-case spend"
  tags: string[]
}
```

### 2. Game: Spend Sort (`/games/spend-sort`)
Mechanic: resource-sorting under pressure
- Tasks spawn in a queue, rate accelerates over time
- 3 buckets = model cost tiers (Cheap/Fast · Balanced · Expensive/Capable)
- Wrong bucket: task bounces back, costs double time
- Budget bar drains per task + passively
- Closing stat: "You saved X% vs. routing everything to the expensive tier"

State shape:
```ts
type Task = { id: string; label: string; correctTier: 0 | 1 | 2; spawnedAt: number }
type GameState = { queue: Task[]; budget: number; score: number; elapsed: number }
```

### 3. Game: Triage (`/games/triage`)
Mechanic: fast-decision judgment under volume
- Request cards fly in (approve / flag / escalate)
- Simple/routine requests auto-resolve after 2s (agent handles them)
- Complex ones require player action within 3s or timeout → miss
- Closing stat: "You reviewed N requests; agent handled M automatically — ~Z hours saved"

### 4. Game: Then vs. Now (`/games/then-vs-now`)
Mechanic: head-to-head timed race
- Round 1: manual receipt entry — type merchant name, hunt for category, confirm amount
- Round 2: same receipts, automated — one click each, pre-filled
- Timer runs both rounds, delta shown on closing screen
- Closing stat: "Manual: Xm Ys · Automated: Zs"

### 5. Menu / Station Screen (`/`)
- Title card + short description
- Links to pipeline screen and 3 games
- Shows aggregate session stats if DB has data ("N games played at this station")

---

## Routes

| Route | Description |
|---|---|
| `/` | Station menu |
| `/pipeline` | Live pipeline demo |
| `/games/spend-sort` | Game 1 |
| `/games/triage` | Game 2 |
| `/games/then-vs-now` | Game 3 |
| `/api/generate` | POST — pipeline LLM call |
| `/api/session` | POST — save game result |

---

## Build Plan

| Block | Time | Owner |
|---|---|---|
| Scaffold: Next.js + Neon + Drizzle + shadcn | 20 min | any |
| Pipeline screen + `/api/generate` | 40 min | person 1 |
| Spend Sort | 45 min | person 2 |
| Triage | 45 min | person 3 |
| Then vs. Now | 40 min | person 4 / shared |
| Menu screen + session API | 20 min | any |
| Walkthrough rehearsal | 20 min | all |

---

## Neon Integration

1. Provision Neon DB (done)
2. Set env vars:
   ```
   DATABASE_URL=postgres://...   # pooled (for serverless functions)
   DATABASE_URL_UNPOOLED=postgres://...  # direct (for migrations)
   ```
3. `pnpm add drizzle-orm @neondatabase/serverless`
4. `pnpm add -D drizzle-kit`
5. Run `drizzle-kit migrate` to push schema

---

## Open Questions

- [ ] Lock the three source excerpts before build day (pipeline person needs them early)
- [ ] Confirm: real Anthropic API key available at demo machine?
- [ ] Each game needs one real, sourced number (cost ratio, time savings) — pin these before copy is written
- [ ] Share affordance: Web Share API screenshot, or just a copyable stat string?
- [ ] Generated games beyond the 3 hardcoded ones: out of scope for Builders Cup, but document the extension path

<div align="center">

<svg width="150" height="40" viewBox="0 0 75 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Ramp">
  <g clipPath="url(#ramp-logo-clip)" fill="currentColor">
    <path d="M5.19 6.76c-1.79 0-2.667 1.576-2.667 3.681v5.275H0V4.585h2.478v2.888h.043c.53-1.776 1.585-3.21 3.212-3.21 1.144 0 1.627.399 1.627.399L6.22 6.955c0-.002-.363-.195-1.031-.195Zm30.496 1.528v7.427h-2.458V9.192c0-1.872-.587-2.864-2.088-2.864-1.553 0-2.305 1.254-2.305 3.66v5.726H26.4V9.192c0-1.8-.58-2.864-2.066-2.864-1.695 0-2.348 1.486-2.348 3.66v5.726h-2.478V4.584h2.478v2.521h.022c.386-1.744 1.44-2.82 3.218-2.82 1.764 0 2.913.947 3.349 2.627.415-1.617 1.52-2.628 3.218-2.628 2.37 0 3.893 1.486 3.893 4.004ZM12.318 4.262c-2.28 0-3.773 1.071-4.453 3.005l2.099.763c.382-1.166 1.18-1.83 2.398-1.83 1.37 0 2.175.603 2.175 1.528 0 .947-.64 1.145-2.088 1.379-1.61.259-5.437.344-5.437 3.573 0 1.892 1.582 3.315 3.958 3.315 1.786 0 3.003-.73 3.566-2.089h.022v1.81h2.457V8.868c0-2.995-1.508-4.607-4.697-4.607Zm2.283 6.214c0 2.334-1.155 3.833-3 3.833-1.306 0-2.088-.732-2.088-1.788 0-.99.804-1.678 2.348-1.961 1.58-.29 2.375-.648 2.74-1.507v1.423Zm29.826-6.192c-1.88 0-3.121 1.033-3.653 2.585V4.585h-2.61V20h2.588v-6.568h.022c.576 1.681 1.775 2.606 3.653 2.606 2.979 0 5.11-2.454 5.11-5.921 0-3.443-2.131-5.833-5.11-5.833Zm-.642 9.688c-2.063 0-3.207-1.497-3.207-3.822s1.28-3.822 3.207-3.822c1.926 0 3.208 1.57 3.208 3.822 0 2.253-1.28 3.822-3.208 3.822ZM75.172 15.665v.07l-10.1.003v-.073c1.457-.823 2.462-1.66 3.367-2.536h4.147l2.586 2.536ZM72.67 2.51 70.11 0h-.075s.043 4.68-4.255 8.936c-4.206 4.166-9.152 4.175-9.152 4.175v.073l2.608 2.555s4.874.048 9.18-4.175c4.29-4.21 4.254-9.053 4.254-9.053Z" />
  </g>
  <defs>
    <clipPath id="ramp-logo-clip">
      <path fill="#fff" d="M0 0h75v20H0z" />
    </clipPath>
  </defs>
</svg>

# MINIGAMES

**Builders Cup 2026 · Science Fair**

A pipeline that turns a Ramp product announcement into a playable minigame in under 90 seconds. Paste an excerpt — get a fully generated, sandboxed React game.

</div>

---

## What It Is

Ramp ships 70+ product launches a year. Every one gets a blog post. This turns them into interactive explainers instead.

**The system**: product excerpt → Claude extracts game spec → Claude writes React component → Daytona sandbox spins up → live preview URL.

**The proof**: three finished, polished games built from three real Ramp reports — each with a distinct mechanic and a closing stat drawn from real product data.

---

## The Three Games

### Spend Sort
*Source: Ramp AI spend / "third pillar" funding announcement*

Tasks pile into a queue and spawn faster over time. Three buckets = model cost tiers (Cheap/Fast · Balanced · Expensive/Capable). Wrong bucket: task bounces back, costs double time, budget bar drains.

**Teaches**: AI/token spend is a new, unmanaged cost category.
**Closing stat**: "You saved X% vs. routing everything to the expensive tier."

---

### Triage
*Source: Ramp AI agents for procurement launch*

Requests fly in: approve / flag / escalate. Simple ones auto-resolve (the agent handles routine work). Complex ones require a player decision within 3 seconds.

**Teaches**: Ramp's agents handle routine spend so humans only deal with exceptions.
**Closing stat**: "You reviewed N requests; agent handled M — ~Z hours saved."

---

### Then vs. Now
*Source: Ramp's original expense/receipt automation product*

Head-to-head speed race. Round 1: manual receipt entry (type, hunt for category, confirm). Round 2: same receipts, automated (one click, pre-filled). Timer runs both rounds.

**Teaches**: the original, concrete pain Ramp solved — grounds the flashier AI stories.
**Closing stat**: "Manual: X minutes. Automated: Y seconds."

---

## Architecture

```
/arcade          → game gallery (public)
/games/[slug]    → individual game (hardcoded or generated, iframe via Daytona)
/studio          → AI generation pipeline screen (admin only)
/studio/runs     → generation run history
/admin           → game management (admin only)
/login /signup   → Neon Auth
```

### Generation Pipeline (`POST /api/generate-game`)

```
excerpt (text)
  → Claude sonnet-4-6: extract structured game spec (JSON)
  → Claude sonnet-4-6: write full React component (TypeScript, Tailwind)
  → Daytona: spin up sandbox, inject component, boot dev server
  → Return { slug, previewUrl, spec, componentCode }
  → Save to generation_runs
```

The generated component is a single-file, dependency-free React component using only `useState` / `useEffect` / `useRef`. It accepts an optional `onComplete(result)` prop that fires with `{ score, statValue }` when the game ends.

### Sandbox Architecture

Hardcoded games get a cached Daytona sandbox per slug (stored in `game_sandboxes`). Generated games get a fresh sandbox per run. Both are embedded via `<iframe>` in the game viewer. A sandbox proxy route (`/api/sandbox/[slug]`) handles spin-up, caching, and liveness verification.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict |
| Styling | Tailwind CSS v4, shadcn/ui |
| Auth | Neon Auth SDK (`@neondatabase/auth`) |
| Database | Neon (Postgres), Drizzle ORM |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Sandboxing | Daytona (`@daytona/sdk`) — isolated preview per game |
| Animation | Motion (Framer Motion) |
| Deployment | Vercel (app shell + hardcoded games), Daytona (generated previews) |

---

## Database Schema

```sql
-- Catalog of all games (hardcoded + generated)
games (id, slug, title, tagline, teaches, mechanic, mechanic_label,
       closing_stat, source_report, source_excerpt, status, hardcoded,
       accent, preview_url, sort_order, created_by, created_at, updated_at)

-- Auth user profiles + roles
user_profiles (id, neon_user_id, role[public|admin], display_name, created_at)

-- AI generation runs
generation_runs (id, created_by, input_text, raw_output[spec+componentCode],
                 game_slug, preview_url, daytona_workspace_id, created_at)

-- Cached Daytona sandboxes per game slug
game_sandboxes (id, game_slug, sandbox_id, preview_url,
                last_verified_at, created_at, updated_at)

-- Player sessions / scores
game_sessions (id, neon_user_id, game_slug, score,
               duration_ms, stat_value[jsonb], created_at)
```

---

## Local Setup

```bash
pnpm install
```

**Required env vars:**

```env
# Neon database
DATABASE_URL=postgres://...          # pooled — for route handlers
DATABASE_URL_UNPOOLED=postgres://... # direct — for drizzle-kit migrations

# Neon Auth
NEON_AUTH_SECRET=...

# Anthropic (game generation pipeline)
ANTHROPIC_API_KEY=...

# Daytona (sandbox previews)
DAYTONA_API_KEY=...
```

```bash
# Run migrations
pnpm drizzle-kit push

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Files

```
src/
  app/
    arcade/          → game gallery page + layout
    games/[slug]/    → game viewer (iframe embed)
    studio/          → generation pipeline UI + run history
    admin/           → game table management
    api/
      generate-game/ → full AI + Daytona pipeline
      games/         → game catalog CRUD
      sandbox/[slug] → sandbox spin-up + proxy
      session/       → save game result
      auth/          → Neon Auth passthrough
  components/
    games/           → SpendSort, Triage, ThenVsNow, ComingSoon
    arcade/          → GameCard, GameViewer, ArcadeHero, etc.
    studio/          → PipelineStepper, SpecPanel, CodePanel, LivePreview
    shell/           → AppShell, AppSidebar, ThemeProvider, ThemeToggle
    admin/           → GameTable, GameEditDialog
  db/schema.ts       → Drizzle schema (all tables)
  lib/
    daytona.ts       → sandbox create/start/verify helpers
    db.ts            → lazy Neon client + Drizzle init
    auth/            → server + client auth helpers
    games.ts         → game catalog helpers
```

---

## Deployment

App shell and hardcoded games deploy to Vercel. Generated game previews run in Daytona sandboxes (ephemeral, isolated — correct choice for untrusted AI-generated code).

```bash
vercel deploy        # preview
vercel deploy --prod # production
```

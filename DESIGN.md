# Design Spec: Ramp Minigames — Frontend

**Builders Cup 2026 · Companion to `PRD.md` and `ramp-minigames-pitch.md`**

> The product is one system with two faces. **The Studio** is where a Ramp operator
> feeds in a launch and watches an agent build a game. **The Arcade** is where anyone
> browses and plays the outputs. The pitch — *"one system that made three games"* —
> is only fully legible when you can see both faces and the pipe between them.

North-star aesthetic: [valuemate.ai](https://www.valuemate.ai/) — editorial, scroll-driven,
dark, confident typography, and **live product surfaces instead of stock illustration**.
We show the machine actually working, as a living artifact.

---

## 1. Product Surface Map

| Surface | Audience | Job | Auth |
|---|---|---|---|
| **Landing** (`/`) | Judges / everyone | Tell the whole story in 3 scroll chapters: Pipeline → Games → Why it matters | Public |
| **Auth** (`/login`, `/signup`) | Ramp operators | Sign in to reach the Studio | Public |
| **Studio** (`/studio`) | Ramp operators | Upload a launch doc → watch the pipeline build a game live ← **HERO VIEW** | **Gated** |
| **Arcade** (`/arcade`) | End users | Browse the gallery of generated + hardcoded games | Public |
| **Game viewer** (`/games/[slug]`) | End users | Play a game (iframe → Daytona preview or local component) | Public |
| **Split demo** (`/demo`) | Judges | Studio + Arcade side-by-side, wired live — the money shot | Public (or gated) |
| **Run history** (`/studio/runs`) | Ramp operators | Table of every generation run — proof of repeatability | **Gated** |

---

## 2. The Studio Cockpit — the hero view

The single most important screen. When an operator hits **Generate**, the page must
transform from a quiet input into a **living generation cockpit**. This is the "wow, an
agent actually built this" moment — nail it above all else.

### 2.1 Layout (three states)

**State A — Intake (calm).**
A centered, oversized drop zone. Accepts: PDF, pasted excerpt, or a Ramp blog URL
(auto-scraped). Subtle helper text and 2–3 example launch chips ("AI spend funding
announcement", "Agents for Procurement", "Receipt automation") that prefill for the demo.
One confident primary button: **Generate game →**.

**State B — Building (alive).**
On submit, the intake collapses upward into a compact header and the screen becomes a
**horizontal pipeline of stages** that light up in sequence:

```
Ingest ──▶ Extract insight ──▶ Design mechanic ──▶ Write code ──▶ Sandbox ──▶ Live
(scrape)   (Claude)            (Claude)            (Cursor)       (Daytona)
```

Each node: idle → **pulsing while active** → check when done. A single line of streaming
status text under the active node ("Extracting core insight from 1,240 words…").

Below the pipeline, a **split working area**:
- **Left — Spec panel.** The structured fields (`concept_name`, `mechanic`, `hook`,
  `closing_stat_template`, `ui_description`) **type themselves in**, card by card, as
  Claude returns them. Judges literally watch the AI reason.
- **Right — Code panel.** A mini editor/terminal where the Cursor-generated
  `GameComponent.tsx` streams in with syntax highlighting. (Fake-forward the stream if the
  real one lags — the *feeling* of code appearing is what sells it.)

**State C — Live (payoff).**
The Daytona spin-up gets its own beat: a progress ring, "Booting isolated sandbox…", then
the **playable iframe fades in**. A toast: *"Shipped to the Arcade →"* with a link. Frame
sandbox isolation as a feature ("untrusted AI code, safely contained").

### 2.2 Why each detail earns its place
- Streaming spec = proves *reasoning*, not a canned template.
- Streaming code = proves *an agent wrote software*, the sponsor-category hook.
- Live Daytona boot = proves *isolation + real deploy*, not a mock.
- "Shipped to the Arcade" = closes the loop to the consumer side in one line.

---

## 3. The Arcade — the showroom

- **Editorial hero with a live playable.** A featured game actually loops/plays in the
  hero ("drag to play", echoing ValueMate's "drag to rotate"). Not a static banner.
- **Premium game cards.** Each card shows: animated thumbnail (canvas/GIF loop on hover,
  card lifts/tilts), the **source Ramp launch** it came from, a mechanic tag, the **core
  insight it teaches**, and the closing stat. Provenance is part of the aesthetic.
- **Lazy-launch loader.** Clicking a generated game triggers the Daytona spin-up behind a
  themed loader ("warming up your sandbox…"), then the game fades in full-bleed. Turn the
  cold start into an intentional moment, not a wait.
- **Shareable end-screen (the viral loop).** On game end: a polished result card with the
  real stat + one-click **share / screenshot / embed**. This is the "would someone
  screenshot this?" bar from the pitch.

---

## 4. The Landing Page — the narrative spine

Mirror the three science-fair beats as scroll chapters (ValueMate's numbered-chapter
structure), each with a **live product surface** embedded, not a screenshot:

- **01 The Pipeline** — a looping mini-version of the Studio cockpit running itself.
- **02 The Games** — the three finished games, playable inline.
- **03 Why It Matters** — the scale close: "one system, every future launch gets one."

---

## 4.5 Auth & login flow

The two sides have very different access needs, and the split *is* part of the story:
**creation is privileged (Ramp operators), consumption is open (anyone).**

### Access model
- **Public, no login:** Landing, Arcade, game viewer, and the split demo. Judges and
  end users should never hit a wall before they can play — friction here kills the pitch.
- **Gated (login required):** Studio (generation cockpit) and Run history. Only
  authenticated operators can kick off the pipeline (protects API spend + frames it as an
  internal Ramp tool).
- **Roles:** `operator` (can generate) and `viewer` (default). Keep it simple — a single
  `role` column on the user is enough for the demo. Optionally restrict operator signup to
  `@ramp.com` emails to reinforce the "Ramp employee console" framing.

### Flow
```
Landing / Arcade (public)
   └─ "Open Studio" ──▶ if not authed ──▶ /login ──▶ Studio
                         if authed ─────────────────▶ Studio
```
- **`/login`** — email + password (or magic link / OAuth). Clean, centered card on the
  dark editorial background; Ramp-amber primary button. A subtle "For Ramp operators" label.
- **`/signup`** — same shell; optional email-domain gate for operator role.
- **Protected routes** redirect unauthenticated users to `/login?next=/studio` and bounce
  back after sign-in.
- **Session UI:** avatar + menu in the top-right of gated surfaces (operator name, "Run
  history", "Sign out"). Public surfaces show a single "Open Studio" / "Sign in" CTA.
- **Demo escape hatch:** a seeded demo operator account (or a one-click "Enter as demo
  operator" button on `/login`) so the science-fair walkthrough never fumbles a password.

### Implementation recommendation
- **Auth library:** [Auth.js (NextAuth v5)](https://authjs.dev/) with the Drizzle adapter —
  it plugs straight into the existing Neon + Drizzle stack from `PRD.md`, supports
  credentials/OAuth/magic-link, and gives middleware-based route protection.
- **Alternative:** [Clerk](https://clerk.com/) if we want prebuilt, polished
  `<SignIn/>` components and org/role management out of the box with near-zero UI work —
  faster for a hackathon, at the cost of a third-party dependency.
- **Route protection:** Next.js `middleware.ts` guarding `/studio/**`.
- **Schema:** add `users`, `accounts`, `sessions` tables (Auth.js Drizzle schema) alongside
  the existing `generation_runs` / `game_sessions`; stamp `generation_runs.created_by`
  with the operator's user id for the run-history provenance.

---

## 5. Cross-cutting functionality

- **Split-screen demo mode** (`/demo`): Studio generating on the left, the new card
  appearing in the Arcade on the right, wired live. The pitch, as one view.
- **Command palette (⌘K):** jump between Studio, Arcade, games. Instant "real product" feel.
- **Provenance everywhere:** every game credits the pipeline + can reveal its source excerpt.
- **Toast/notification system** for pipeline events (generation done, sandbox live).

---

## 6. Visual system (research-backed)

**Thesis: two personalities, one accent.** The **Studio** is Ramp-editorial **light**
(Linear/Ramp.com craft — dense, keyboard-first, AI-transparent). The **Arcade** is arcade
**dark** (ValueMate scroll-storytelling × Raycast card density). The Ramp electric-yellow
`--solar` is the single thread binding both, used *only* where generation/money moves.

**Tokens** (drop into `globals.css` as CSS variables — shared by every surface):

```css
:root {
  /* Brand accent — the single loud note (CTAs, live counters, active state, stat numerals) */
  --solar:        #E4F222;  --solar-light: #F5FF78;  --solar-strong: #E8E750;
  --blaze:        #E96516;  /* orange — inline links only; never with solar in same hero */

  /* Studio (light / editorial, mirrors ramp.com) */
  --bg: #F7F7F5;  --bg-surface: #F4F2F0;  --ink: #0C0A08;  --ink-muted: #6B6862;
  --border: #D2CECB;  --focus-ring: #E4EBF6;

  /* Arcade (dark / arcade) */
  --night: #0B0B0C;  --night-soft: #141416;  --night-card: #1A1A1D;
  --night-border: #2A2A2E;  --paper: #EDEDEF;  --paper-muted: #9A9A9F;
}
```

Rules (non-negotiable): yellow is sacred (CTA / live counters / active / closing-stat
numerals only — never body text or large fills); pick `--solar` OR `--blaze` per hero, never
both; **depth via 1px hairlines + surface contrast, not drop shadows**; never pure `#000`/`#fff`.

**Typography** (free approximations of Ramp's paid Lausanne):

| Role | Font | Notes |
|---|---|---|
| Display / hero | **Geist** (or Space Grotesk) | weight 400–500, tracking `-0.02em`→`-0.03em` at large sizes |
| UI / body | **Inter** | hierarchy from *scale*, not weight |
| Technical / mono | **Geist Mono** (or JetBrains Mono) | run IDs, slugs, spec JSON, timers, code panel |

8-pt type scale: `64 → 40 → 28 → 20 → 16 → 14 → 12`. Headlines never bold-and-loud — let
size + the yellow carry emphasis.

**Motion:** `motion` (renamed Framer Motion) for all UI polish; **GSAP + ScrollTrigger** only
for the Arcade's scroll-driven hero. 100–300ms, expo/tight easings, **nothing bouncy, nothing
purple**; motion must *communicate state*. Respect `prefers-reduced-motion` (animate only
opacity/transform).

**Avoid the AI-slop tells:** purple/cyan gradients, glowing orbs, heavy glassmorphism,
oversized blur/shadow, "magic/supercharge/10x" copy, bouncy defaults.

---

## 7. Build priority (for the demo)

1. **Auth shell** — `/login` + middleware gating `/studio`, seeded demo operator. Thin but
   in place first so the Studio has a real front door.
2. **Studio cockpit** (States A→B→C) — the hero. Get the streaming spec + code + boot beat great.
3. **Arcade gallery** + game cards + shareable end-screen.
4. **Split demo view** — wire Studio → Arcade live.
5. **Landing page** — scroll narrative, last (it packages the rest).

---

## 8. Libraries, references & principles (from research pass)

**npm / tooling** (aligns with the PRD stack — Next.js 15, TS, Tailwind, shadcn/ui):
- **UI:** `shadcn/ui` (Radix-based, themeable to the tokens above), `geist` (Geist + Geist
  Mono fonts), `lucide-react` icons, `next/font`.
- **Motion:** `motion` (default UI animation — layout/`AnimatePresence`/`layoutId` shared-element
  transitions); `gsap` + ScrollTrigger + `@gsap/react` (`useGSAP`) for the Arcade hero scroll
  story only; `@formkit/auto-animate` (2kb list/grid add-remove).
- **Prebuilt animated components (steal for speed):** Magic UI + Aceternity UI — their
  **animated beam** is a near-perfect fit for the pipeline visualization
  (excerpt → spec → component → Daytona); `react-bits` for flashier gallery moments.
- **Utilities:** `cmdk` (⌘K palette), `sonner` (toasts).
- **3D (stretch only):** `three` + `@react-three/fiber` + `@react-three/drei` for a
  ValueMate-tier draggable/scroll-scrubbed hero object (e.g. a rotating game "cartridge").

**Highest-leverage polish:** the **generation/loading state is a first-class designed
component**, not a spinner. Given live Daytona latency, a narrated stepper
(`Reading announcement → Designing mechanic → Writing the game → Booting sandbox`) with
skeletons + streaming micro-copy makes the wait read as "craft in progress."

**ValueMate north-star takeaways:** single continuous scroll narrative with numbered chapters
(`01/02/03`); product-as-hero, live & interactive (for us: a *playable* game in the hero, not
a screenshot); authored prose over growth-hack copy; oversized restrained display type;
scroll-scrubbed reveals; utility-forward micro-interactions (directional `→` on links).

**Cited references:** Linear (six-state discipline on every interactive element; accent-as-signal),
Vercel (animated pipeline/flow diagram; dark grid backgrounds), Resend (lead with the real
artifact, not an illustration), Raycast (dense card-grid gallery), Stripe (one accent used
sparingly), Ramp.com (editorial black-on-off-white + one highlighter yellow, oversized numerals,
hairlines not shadows), and 2026 Awwwards winners Waabi / Oryzo AI / Solais (designed loading
state) / Gucci "Mystery Unfolds" (premium playable-as-hero).

_Full annotated reference set + source URLs preserved in the git history of the research pass._

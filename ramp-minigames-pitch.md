# Ramp Minigames: AI-Generated Explainers for Ramp Launches

**Builders Cup 2026 — Team Pitch Doc**
**Format: Science Fair-style walkthrough — pipeline + three playable games**

---

## The One-Liner

Ramp ships constantly — 70+ product releases in the last few months alone. Every launch gets explained the same way: a blog post or press release. We built a pipeline that turns a Ramp report into a playable minigame that teaches its core idea in under 90 seconds — and we're showing both the pipeline *and* three real outputs it produced, side by side.

---

## The Problem

Companies launch new ideas faster than people can absorb them. Ramp in particular is already all-in on agents doing operational work automatically (Agents for Controllers, Agents for AP, agent-executed payments with Visa) — but content creation, the part of GTM that explains all this to clients and prospects, is still fully manual. We're proposing the same automate-everything logic Ramp applies to finance ops, applied to their own storytelling.

## The Idea

**A pipeline: report in → playable game out.**

1. Feed in a real Ramp report or announcement excerpt
2. An agent extracts: the core insight, a game mechanic that dramatizes it, copy for a shareable end-screen stat
3. Output is a small, self-contained interactive explainer — shippable to clients, prospects, socials, or embedded in a landing page

We're proving this two ways at once: showing the pipeline itself in action, and showing three finished, polished games it produced from three different real Ramp reports — so judges see both the *system* and *proof the system produces varied, good output*, not just one lucky example.

---

## Why This Wins

- **Investable, not just cute** — the pitch is a repeatable system with a visible portfolio of outputs, not a one-off artifact
- **Legible GTM value** — "would someone screenshot and share this" is the bar, and it's a bar Ramp already cares about
- **Best Use of Our Sponsors, direct hit** — an agent generating game concepts from real text, built with Cursor/Codex
- **Portfolio > single demo** — three distinct mechanics mapped to three distinct product pillars proves range, not luck
- **We're speaking Ramp's own language back to them** — one game is literally built from their own funding-announcement quote: *"for 500 years business ran on people and vendors, now there's a third pillar: tokens."*

---

## Science Fair Station Structure

Since we have time to walk judges through the full story (not a 90-second sprint), structure the table as three beats:

### Beat 1 — The Pipeline
Show the actual generation step: paste a report excerpt in, walk through what the agent extracts (core insight → mechanic → hook → end-stat), and show the structured output it produces. This can be a live call or a clearly-documented "here's exactly what we prompted and what came back" — either works in this format since you have time to explain it properly, not just flash it.

### Beat 2 — The Three Games (the proof)
Let judges actually play. Each one maps to a different real Ramp report and uses a genuinely different mechanic, so the portfolio argument lands:

**1. Spend Sort** — *from the AI spend / "third pillar" funding announcement*
Mechanic: resource-sorting under pressure. Tasks pile into a queue and spawn faster over time; 3 buckets = model cost tiers (cheap/fast → expensive/capable); wrong bucket = task bounces back, costing double time; budget bar drains per task and passively.
Teaches: *AI/token spend is a new, unmanaged cost category.*
Closing stat: *"You saved X% vs. using the most expensive model for everything."*

**2. Triage** — *from the AI agents for procurement launch*
Mechanic: fast-decision judgment under volume. Requests fly in; player approves/flags/escalates; obvious/simple ones can be auto-handled (agent does the routine work) while the player only handles the harder judgment calls.
Teaches: *Ramp's agents handle routine spend so humans only deal with exceptions.*
Closing stat: *"You reviewed X requests; the agent handled Y automatically — Z hours saved."*

**3. Then vs. Now** — *from the original expense/receipt automation product*
Mechanic: head-to-head speed race. Manual receipt entry/matching (typing, hunting for the right category) vs. an automated pass, timer-based, showing the delta directly.
Teaches: *this is the original, boring, real pain Ramp solved* — grounds the flashier AI stories in something concrete and relatable.
Closing stat: *"Manual: X minutes. Automated: Y seconds."*

### Beat 3 — Why It Matters (scale + close)
Close the walkthrough by connecting the two prior beats explicitly: *"This isn't three games we made — it's one system that made three games. Every future Ramp launch could get one of these instead of just a blog post."* This is where the investability case gets made out loud.

---

## Build Plan (~3.5 hrs)

| Time | Task |
|---|---|
| 40 min | Pipeline screen: paste report excerpt → agent call → structured, nicely rendered output (concept name, mechanic, hook, stat). Test with all 3 report excerpts ahead of time so outputs are reliable to show. |
| 45 min | Spend Sort: sort/pile loop, 3 buckets, budget bar |
| 45 min | Triage: request stream, approve/flag/escalate interaction, auto-handle logic for simple cases |
| 40 min | Then vs. Now: manual vs. automated timed race |
| 20 min | Connective tissue: simple menu/station screen tying pipeline → three games → close |
| 20 min | Walkthrough rehearsal — practice the full station narration, not just a script for one game |

---

## Team Split (suggested for 3-4 people)

- **1 person**: Pipeline screen + prompt design (this is the "system" proof — needs to be reliable, test it early and often)
- **1 person**: Spend Sort
- **1 person**: Triage
- **1 person** (or shared if team of 3): Then vs. Now + connective menu screen

---

## Notes / Open Questions for the Team

- Confirm the exact three report excerpts before building — lock these first so the pipeline person can test against real text early:
  1. AI spend / "third pillar" funding announcement
  2. AI agents for procurement launch
  3. Original expense/receipt automation product description
- Each game needs its own closing stat, framed to that specific report — don't reuse Spend Sort's "efficiency%" language for all three, it should feel like three distinct outputs, not one template.
- Bake in one real, credible number per game (real-ish cost ratios, real time-savings figures) — small grounding detail buys outsized credibility.
- Because this is Science Fair format, prepare a verbal walkthrough script for all three beats — practice narrating the *connection* between pipeline and games out loud, since that link is the actual pitch, not any single game on its own.

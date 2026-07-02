# Chronic Trading — Product Upgrade Plan

*Approved 2026-07-02. Covers all three sites: trading-lab, ict-replay, ict-glossary.*

**The big idea:** turn three disconnected study tools into one branded suite —
*Learn it* (glossary) → *Understand it* (lab) → *Prove it* (replay).

Brand direction: the dark-terminal + amber identity all three apps already share (bg `#05050a`, lead accent `#f59e0b`, 7-color category palette, Inter + JetBrains Mono) — codified as tokens and applied consistently. (The June 2026 "synthwave" commits only touched the standalone `public/chronos/` easter-egg page, not the product.)

> **Progress (2026-07-02):** Phase 1 fully shipped on all three sites (suite bar, shared tokens, Inter/JetBrains type, mobile fixes, SEO meta, OG/social preview images).
> Phase 2 shipped so far: ict-replay Trade Mode (bar-by-bar replay, R-multiple scoring, Net R stat) with chart data backfilled for all 38 scenarios; ict-glossary diagram quiz mode. Glossary already had search + term-of-the-day from before.

## Phase 1 — One brand, three sites (visual overhaul)

1. **Shared design system.** One palette/typography token set, applied to all three apps. Add Tailwind 4 to ict-replay and ict-glossary so all three share styling tech.
2. **Suite navbar.** Slim shared header cross-linking Lab / Replay / Glossary on every site.
3. **Mobile-first pass.** Social traffic is ~90% phones; every page must feel native at 390px. Trading-lab's Capacitor shells benefit for free.
4. **Shareability basics.** Favicons, OG/social preview images, proper titles + meta descriptions per site.

## Phase 2 — Flagship features per site

### trading-lab
- Spaced-repetition review engine over the 267 concepts (daily queue, SM-2 scheduling)
- Journal analytics v2: equity curve, win rate by setup/killzone/day-of-week
- Cloud sync via existing Supabase auth (progress follows users across devices)
- Decide fate of CHRON-OS/KHA-OS: polished Arcade easter egg vs. cut from product build

### ict-replay
- Upgrade from "read the chart" to "trade the chart": bar-by-bar replay with entry/SL/TP placement, scored in R-multiples
- Grow 39 → 60+ scenarios organized by concept + difficulty tier; exam mode
- Streaks + scoring for daily-practice stickiness

### ict-glossary
- Search, category filters, per-term anchor links (shareable URLs)
- Quiz mode: name the concept from the diagram
- Term-of-the-day (doubles as a daily social-content feed)

## Phase 3 — Ecosystem glue

- One Supabase account across all three sites; shared progress (glossary mastery ↔ lab concepts ↔ replay scores)
- Glossary popups inside lab and replay (hover an ICT term → definition + diagram inline)
- Lightweight analytics (e.g. GoatCounter) to see what visitors actually use

## Sequencing

Phase 1 across all three sites first (highest leverage per effort), then Phase 2 features in priority order, Phase 3 last (depends on 1+2).

# Trading Lab

A model builder for traders learning ICT — stack concepts, watch the synergies
connect, and master the framework in one workspace. Built by Chronic Trading;
licenses are sold on Whop.

**Live:** https://chronic-trading.github.io/trading-lab/

## What's inside

Fifteen tools behind one license: a concept library (50+ mapped ICT/SMC
concepts), the strategy Builder with live synergy detection, a weighted-
confluence Trade Grader, spaced-repetition Review, a trade Journal with
R-multiples and kill-zone stats, bar-by-bar Replay, CSV-to-trade-card Recap,
the Playbook lessons, session planning, key levels, a red-folder News Calendar,
templates, saved builds, and the Arcade. Plus header utilities: prop-firm
comparison, drawdown guard, mindset check-ins, quiz, rules, and notes.

## Stack

- React 19 + TypeScript, Vite, Tailwind CSS v4 (CSS-based config — no
  `tailwind.config`)
- Supabase for license auth and cross-device sync (`user_data` upserts)
- `lightweight-charts` for the Replay chart, `framer-motion` for modals,
  `papaparse` + `mp4-muxer` for the Recap pipeline
- Capacitor scaffolding for iOS/Android shells (`npm run cap:ios` / `cap:android`)
- Deployed to GitHub Pages by Actions on every push to `main`

## Development

```bash
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm run lint
```

With no `.env`, the app boots in **local-only mode**: no network calls, all
state in localStorage, login disabled. To exercise auth and sync locally:

```bash
# .env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_WHOP_BUY_URL=...   # optional: shows the purchase CTA
VITE_PRICE=$9.99        # optional: pricing shown on the landing page
```

Production values are supplied as repository secrets to the deploy workflow
(`.github/workflows/deploy.yml`).

## Theming

Light is the default theme; dark is opt-in via `<html data-theme="dark">`.
All colors flow through the semantic tokens in `src/index.css` (`--bg`,
`--surface`, `--text`, `--accent`, status colors with `-soft` tints). Three
surfaces pin dark for their lifetime on purpose: the Landing page, the login
screen, and Recap (its share cards are designed dark). Canvas-drawn charts
keep literal hex — canvas can't resolve CSS variables.

## Structure

```
src/
  pages/        one file per tab (Today, Builder, Grader, Map, …)
  components/   shared widgets + the header modals (Guard, Quiz, Rules, …)
  hooks/        localStorage-backed state (journal, builds, mastery, theme, …)
  data/         the concept graph, setups, prop-firm data
  recap/        the CSV → trade-card → video pipeline
  lib/          supabase client, sync, grader scoring
```

Proprietary — all rights reserved.

import type { Instrument } from '../types'

export interface Template {
  id: string
  name: string
  instrument: Instrument
  difficulty: 'basic' | 'intermediate' | 'advanced'
  description: string
  conceptIds: string[]
  notes: string
}

export const templates: Template[] = [

  // ─── BASIC ────────────────────────────────────────────────────────────────

  {
    id: 'foundational',
    name: 'Foundational Model',
    instrument: 'ES',
    difficulty: 'basic',
    description: 'The complete set of core concepts every ICT trader must master before touching anything advanced. Structure, liquidity, imbalance, blocks, and range awareness — all six basics in one build.',
    conceptIds: ['market-structure', 'liquidity', 'equal-highs-lows', 'fvg', 'order-block', 'premium-discount'],
    notes: 'Do not add intermediate concepts until every one of these feels automatic. Every advanced concept is just a combination of these basics in disguise.',
  },
  {
    id: 'liquidity-blueprint',
    name: 'Liquidity Blueprint',
    instrument: 'NQ',
    difficulty: 'basic',
    description: 'A read-the-market-before-you-trade-it model. Focused entirely on identifying where price wants to go — BSL, SSL, equal highs and lows, and the range context. Know the draw before you look for any entry.',
    conceptIds: ['market-structure', 'liquidity', 'equal-highs-lows', 'premium-discount', 'opening-gaps'],
    notes: 'This is not an entry model — it is a directional framework. Use it to map the session before it opens. Ask: where is price drawn to? Then build your entry model around that answer.',
  },
  {
    id: 'entry-mechanics',
    name: 'Entry Mechanics',
    instrument: 'NQ',
    difficulty: 'basic',
    description: 'Focused entirely on how to enter. Structure sets the direction, displacement validates the move, and FVGs plus Order Blocks define the exact zone. The cleanest possible entry framework without timing or bias complexity.',
    conceptIds: ['market-structure', 'displacement', 'fvg', 'order-block', 'rejection-block', 'premium-discount'],
    notes: 'Pair this with Liquidity Blueprint once both feel natural. Structure + Liquidity tells you where. Displacement + FVG + OB tells you how. Together they cover most of what you need.',
  },

  // ─── INTERMEDIATE ─────────────────────────────────────────────────────────

  {
    id: 'nq-silver-bullet',
    name: 'NQ Silver Bullet',
    instrument: 'NQ',
    difficulty: 'intermediate',
    description: 'A precision time-based model for NQ futures. Uses the 10–11 AM Silver Bullet window, entering FVGs created by NY AM displacement. Clean, one-trade-per-window discipline with a defined edge.',
    conceptIds: ['daily-bias', 'market-structure', 'liquidity', 'kill-zones', 'key-opens', 'displacement', 'fvg', 'silver-bullet'],
    notes: 'One trade per Silver Bullet window max. If the FVG is not created by displacement within the window, skip it.',
  },
  {
    id: 'gold-london-reversal',
    name: 'Gold London Reversal',
    instrument: 'GC',
    difficulty: 'intermediate',
    description: "Built for Gold's clean London session reversals. Judas sweeps the Asian range extreme, then price delivers into the OB + FVG confluence as NY AM opens. Gold respects these setups with high frequency.",
    conceptIds: ['daily-bias', 'market-structure', 'liquidity', 'equal-highs-lows', 'kill-zones', 'opening-gaps', 'judas-swing', 'amd', 'order-block', 'fvg'],
    notes: 'Best on days with no high-impact US data in the morning. Mark the Asian range before London open.',
  },

  // ─── ADVANCED ─────────────────────────────────────────────────────────────

  {
    id: 'full-mm-buy-model',
    name: 'Full MM Buy Model',
    instrument: 'NQ',
    difficulty: 'advanced',
    description: 'The complete bullish institutional delivery framework from engineered liquidity through final distribution. Every phase mapped out. For traders who want the full picture before entering — nothing left to chance.',
    conceptIds: ['daily-bias', 'ipda', 'quarterly-theory', 'market-structure', 'liquidity', 'equal-highs-lows', 'engineered-liquidity', 'amd', 'judas-swing', 'kill-zones', 'displacement', 'inducement', 'order-block', 'fvg', 'ote', 'market-maker-buy'],
    notes: "Use IPDA to identify the draw. Quarterly Theory confirms the macro phase. Don't enter until AMD manipulation phase is complete.",
  },
  {
    id: 'nq-algorithm-framework',
    name: 'NQ Algorithm Framework',
    instrument: 'NQ',
    difficulty: 'advanced',
    description: 'The top-down macro read. IPDA defines the algorithmic draw, Quarterly Theory defines the delivery phase, and both Market Maker Models are in scope — because the algorithm does both. This is how you read what the algorithm is about to do before price moves, not after.',
    conceptIds: ['ipda', 'quarterly-theory', 'daily-bias', 'market-structure', 'liquidity', 'equal-highs-lows', 'engineered-liquidity', 'amd', 'judas-swing', 'kill-zones', 'ict-macros', 'market-maker-buy', 'market-maker-sell', 'opening-gaps'],
    notes: 'This is context, not entry. Layer your entry model on top of this framework. Without the macro read, every entry is reactive. With it, you see the move before it happens.',
  },
  {
    id: 'smt-reversal-sniper',
    name: 'SMT Reversal Sniper',
    instrument: 'NQ',
    difficulty: 'advanced',
    description: 'A correlation-confirmed reversal model. NQ sweeps a liquidity extreme while ES fails to confirm — that SMT divergence, paired with a Turtle Soup sweep and a displacement FVG, pinpoints the turn. One of the highest-conviction reversals in the methodology.',
    conceptIds: ['daily-bias', 'market-structure', 'liquidity', 'smt-divergence', 'turtle-soup', 'kill-zones', 'displacement', 'fvg'],
    notes: 'Requires a correlated chart (ES against NQ) open beside your entry chart. No SMT, no trade — the divergence is the entire edge. Time it inside a kill zone.',
  },
  {
    id: 'unicorn-precision',
    name: 'Unicorn Precision',
    instrument: 'NQ',
    difficulty: 'advanced',
    description: 'Built around the Unicorn Model — a breaker block overlapping an FVG in the same zone. After a CHoCH and displacement, the overlap of two independent PD arrays gives an A+ entry with a tight stop. Standard-deviation projections define the targets.',
    conceptIds: ['market-structure', 'displacement', 'breaker-block', 'fvg', 'unicorn-model', 'standard-deviation', 'ote', 'kill-zones'],
    notes: 'Only valid when the breaker and FVG genuinely overlap. If they do not share price, this is an ordinary breaker retest — size down. Project SD levels off the CE for exits.',
  },
]

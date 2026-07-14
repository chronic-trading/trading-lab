// ── Trade Grader scoring engine ───────────────────────────────────────────────
// Shared by the in-app Trade Grader (src/pages/TradeGrader.tsx) and the public
// landing demo (src/components/GraderDemo.tsx) so both run the exact same logic.

export interface Factor {
  id: string
  label: string
  weight: number
  essential: boolean
  why: string          // shown when it's a gap
  conceptIds?: string[] // maps a factor to the ICT concepts it represents
}

export interface Group {
  key: string
  title: string
  color: string
  factors: Factor[]
}

export const GROUPS: Group[] = [
  {
    key: 'draw', title: 'Bias & Draw', color: '#c084fc',
    factors: [
      { id: 'htf-bias', label: 'Aligns with my HTF daily bias', weight: 14, essential: true,
        why: 'Trading against the higher-timeframe bias flips the odds against you before you even enter.',
        conceptIds: ['daily-bias', 'mtfa'] },
      { id: 'dol', label: 'Clear draw on liquidity (target) identified', weight: 10, essential: true,
        why: 'Without a target you have an entry but no reason and no exit plan.',
        conceptIds: ['draw-on-liquidity'] },
    ],
  },
  {
    key: 'liquidity', title: 'Liquidity', color: '#34d399',
    factors: [
      { id: 'sweep', label: 'Liquidity swept before entry (raid / stop hunt)', weight: 12, essential: true,
        why: 'Entries taken before the sweep get run over — the sweep is the fuel for the move.',
        conceptIds: ['liquidity', 'turtle-soup', 'judas-swing'] },
      { id: 'pd-zone', label: 'Entering from correct premium / discount', weight: 8, essential: false,
        why: "Buying in premium or selling in discount is chasing — you become the liquidity.",
        conceptIds: ['premium-discount', 'ote'] },
    ],
  },
  {
    key: 'structure', title: 'Structure', color: '#60a5fa',
    factors: [
      { id: 'choch', label: 'Structure confirms direction (CHoCH / BOS)', weight: 10, essential: true,
        why: 'No structural shift means you are guessing the turn instead of trading it.',
        conceptIds: ['market-structure'] },
      { id: 'displacement', label: 'Displacement present (energy behind the move)', weight: 9, essential: true,
        why: 'OBs and FVGs without displacement are just candles — displacement is what validates them.',
        conceptIds: ['displacement'] },
    ],
  },
  {
    key: 'entry', title: 'Entry', color: '#f59e0b',
    factors: [
      { id: 'pd-array', label: 'Entry from a defined PD array (FVG / OB / breaker)', weight: 11, essential: true,
        why: 'An entry with no PD array is a market order on hope — define the zone.',
        conceptIds: ['fvg', 'order-block', 'breaker-block', 'unicorn-model', 'propulsion-block', 'rejection-block', 'mitigation-block'] },
      { id: 'stack', label: 'Two or more PD arrays overlap at entry', weight: 6, essential: false,
        why: 'Single-array entries work, but stacked confluence (OB + FVG) is where the A+ setups live.',
        conceptIds: ['unicorn-model', 'consequent-encroachment'] },
    ],
  },
  {
    key: 'timing', title: 'Timing', color: '#fb923c',
    factors: [
      { id: 'killzone', label: 'Entry inside a kill zone / macro window', weight: 9, essential: true,
        why: "Outside the kill zones the algorithm isn't delivering — you're trading dead time.",
        conceptIds: ['kill-zones', 'silver-bullet', 'ict-macros'] },
      { id: 'smt', label: 'Correlated confirmation (SMT divergence)', weight: 5, essential: false,
        why: 'SMT is the tell that separates a guess from a read on smart money.',
        conceptIds: ['smt-divergence'] },
    ],
  },
  {
    key: 'risk', title: 'Risk & Discipline', color: '#f472b6',
    factors: [
      { id: 'invalidation', label: 'Invalidation level defined before entry', weight: 8, essential: true,
        why: "If you can't say where you're wrong, you can't manage the trade — non-negotiable." },
      { id: 'in-plan', label: 'Matches a setup in my playbook (not impulsive)', weight: 6, essential: true,
        why: "If it isn't in your plan, it's gambling with extra steps." },
      { id: 'no-news', label: 'No high-impact news about to hit the position', weight: 4, essential: false,
        why: 'A red-folder release can erase a clean setup in a single candle.',
        conceptIds: ['ict-macros'] },
    ],
  },
]

export const ALL_FACTORS: Factor[] = GROUPS.flatMap(g => g.factors)
export const TOTAL_WEIGHT = ALL_FACTORS.reduce((s, f) => s + f.weight, 0)

export function letterFor(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: 'A+', color: '#34d399' }
  if (score >= 82) return { letter: 'A',  color: '#34d399' }
  if (score >= 70) return { letter: 'B',  color: '#a3e635' }
  if (score >= 56) return { letter: 'C',  color: '#f59e0b' }
  if (score >= 40) return { letter: 'D',  color: '#fb923c' }
  return { letter: 'F', color: '#f87171' }
}

export function rrAdjust(rr: number): number {
  if (rr >= 3)   return 6
  if (rr >= 2)   return 3
  if (rr >= 1.5) return 0
  if (rr >= 1)   return -4
  return -8
}

export function verdictFor(letter: string): { headline: string; body: string; riskMult: number } {
  switch (letter) {
    case 'A+': return { headline: 'Textbook setup.', body: 'Every essential is present. Execute your plan with full conviction — this is what you wait for.', riskMult: 1 }
    case 'A':  return { headline: 'High-quality setup.', body: 'Strong confluence with the essentials covered. Take it at full plan risk and manage without second-guessing.', riskMult: 1 }
    case 'B':  return { headline: 'Solid, not perfect.', body: 'A tradeable setup with a gap or two. Size slightly down and be strict on your invalidation.', riskMult: 0.75 }
    case 'C':  return { headline: 'Thin confluence.', body: 'Enough to be tempting, not enough to be confident. Half risk at most — or wait for one more confirmation.', riskMult: 0.5 }
    case 'D':  return { headline: 'This is a coin flip.', body: 'Key essentials are missing. Token risk or, better, pass and let it develop.', riskMult: 0.25 }
    default:   return { headline: 'This is a gamble, not a setup.', body: 'The essentials are not there. Passing this trade is the winning move.', riskMult: 0 }
  }
}

// Compute a 0–100 confluence score from the checked factor ids + planned R:R.
export function scoreSetup(checked: Set<string> | string[], rr: number): number {
  const set = Array.isArray(checked) ? new Set(checked) : checked
  const checkedWeight = ALL_FACTORS.filter(f => set.has(f.id)).reduce((s, f) => s + f.weight, 0)
  const base = (checkedWeight / TOTAL_WEIGHT) * 100
  return Math.max(0, Math.min(100, Math.round(base + rrAdjust(rr))))
}

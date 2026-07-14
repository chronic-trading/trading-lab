import { useMemo, useState } from 'react'
import {
  Gauge, Award, Check, X, Save, Trash2, TrendingUp, TrendingDown,
  AlertTriangle, Sparkles, RotateCcw, Package, ChevronRight,
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useBuilds } from '../hooks/useBuilds'
import { useTradeGrades } from '../hooks/useTradeGrades'
import { getConceptById } from '../data/concepts'
import type { Instrument } from '../types'

// ── Confluence factors ────────────────────────────────────────────────────────
// Each factor carries a weight; the essentials are the non-negotiables an A-grade
// setup should have. conceptIds map a factor to the ICT concepts it represents so
// a setup can be checked against a saved Build.
interface Factor {
  id: string
  label: string
  weight: number
  essential: boolean
  why: string          // shown when it's a gap
  conceptIds?: string[]
}

interface Group {
  key: string
  title: string
  color: string
  factors: Factor[]
}

const GROUPS: Group[] = [
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

const ALL_FACTORS = GROUPS.flatMap(g => g.factors)
const TOTAL_WEIGHT = ALL_FACTORS.reduce((s, f) => s + f.weight, 0)

const INSTRUMENTS: Instrument[] = ['NQ', 'ES', 'GC', 'SI', 'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'NZDUSD']
const SESSIONS = ['London Open', 'NY AM', 'Silver Bullet AM', 'NY Lunch', 'NY PM', 'Silver Bullet PM', 'London Close', 'Asian Range', 'Outside kill zone']

// ── Grade model ───────────────────────────────────────────────────────────────
function letterFor(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: 'A+', color: '#34d399' }
  if (score >= 82) return { letter: 'A',  color: '#34d399' }
  if (score >= 70) return { letter: 'B',  color: '#a3e635' }
  if (score >= 56) return { letter: 'C',  color: '#f59e0b' }
  if (score >= 40) return { letter: 'D',  color: '#fb923c' }
  return { letter: 'F', color: '#f87171' }
}

function rrAdjust(rr: number): number {
  if (rr >= 3)   return 6
  if (rr >= 2)   return 3
  if (rr >= 1.5) return 0
  if (rr >= 1)   return -4
  return -8
}

function verdictFor(letter: string): { headline: string; body: string; riskMult: number } {
  switch (letter) {
    case 'A+': return { headline: 'Textbook setup.', body: 'Every essential is present. Execute your plan with full conviction — this is what you wait for.', riskMult: 1 }
    case 'A':  return { headline: 'High-quality setup.', body: 'Strong confluence with the essentials covered. Take it at full plan risk and manage without second-guessing.', riskMult: 1 }
    case 'B':  return { headline: 'Solid, not perfect.', body: 'A tradeable setup with a gap or two. Size slightly down and be strict on your invalidation.', riskMult: 0.75 }
    case 'C':  return { headline: 'Thin confluence.', body: 'Enough to be tempting, not enough to be confident. Half risk at most — or wait for one more confirmation.', riskMult: 0.5 }
    case 'D':  return { headline: 'This is a coin flip.', body: 'Key essentials are missing. Token risk or, better, pass and let it develop.', riskMult: 0.25 }
    default:   return { headline: 'This is a gamble, not a setup.', body: 'The essentials are not there. Passing this trade is the winning move.', riskMult: 0 }
  }
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge180({ score, color }: { score: number; color: string }) {
  const r = 78, cx = 100, cy = 100
  const start = Math.PI, end = 0
  const a = start + (end - start) * (score / 100)
  const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a)
  const large = 0
  const arc = (fromA: number, toA: number, key: string, stroke: string, w: number, dash?: string) => {
    const x1 = cx + r * Math.cos(fromA), y1 = cy - r * Math.sin(fromA)
    const x2 = cx + r * Math.cos(toA),   y2 = cy - r * Math.sin(toA)
    return <path key={key} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
      fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
  }
  return (
    <svg viewBox="0 0 200 116" className="w-full max-w-[240px] mx-auto">
      {arc(start, end, 'track', 'rgba(148,163,184,0.16)', 12)}
      {score > 0 && arc(start, a, 'fill', color, 12)}
      <circle cx={x} cy={y} r={7} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <circle cx={x} cy={y} r={3} fill="#0b0b12" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TradeGrader() {
  const { settings } = useSettings()
  const { builds } = useBuilds()
  const { grades, add, remove, clear } = useTradeGrades()

  const [direction, setDirection] = useState<'long' | 'short'>('long')
  const [instrument, setInstrument] = useState<Instrument>(settings.defaultInstrument)
  const [session, setSession] = useState<string>('NY AM')
  const [rr, setRr] = useState('2')
  const [buildId, setBuildId] = useState<string>('')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [savedFlash, setSavedFlash] = useState(false)

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setSavedFlash(false)
  }

  const rrNum = parseFloat(rr) || 0

  const result = useMemo(() => {
    const checkedWeight = ALL_FACTORS.filter(f => checked.has(f.id)).reduce((s, f) => s + f.weight, 0)
    const base = (checkedWeight / TOTAL_WEIGHT) * 100
    const score = Math.max(0, Math.min(100, Math.round(base + rrAdjust(rrNum))))
    const { letter, color } = letterFor(score)
    const verdict = verdictFor(letter)
    const essentialsMissing = ALL_FACTORS.filter(f => f.essential && !checked.has(f.id))
    const strengths = ALL_FACTORS.filter(f => checked.has(f.id)).sort((a, b) => b.weight - a.weight)
    return { score, letter, color, verdict, essentialsMissing, strengths }
  }, [checked, rrNum])

  // Build coverage — of the selected build's concepts, how many are represented
  // by a checked confluence factor.
  const selectedBuild = builds.find(b => b.id === buildId)
  const buildCoverage = useMemo(() => {
    if (!selectedBuild) return null
    const covered = new Set<string>()
    for (const f of ALL_FACTORS) {
      if (!checked.has(f.id) || !f.conceptIds) continue
      for (const cid of f.conceptIds) if (selectedBuild.conceptIds.includes(cid)) covered.add(cid)
    }
    const missing = selectedBuild.conceptIds.filter(cid => !covered.has(cid))
    return { total: selectedBuild.conceptIds.length, covered: covered.size, missing }
  }, [selectedBuild, checked])

  const baseRisk = settings.accountSize * settings.riskPercent / 100
  const suggestedRisk = Math.round(baseRisk * result.verdict.riskMult)

  const reset = () => { setChecked(new Set()); setRr('2'); setSavedFlash(false) }

  const save = () => {
    if (checked.size === 0) return
    add({
      instrument, direction, session,
      factorIds: [...checked], rr: rrNum,
      score: result.score, letter: result.letter,
    })
    setSavedFlash(true)
  }

  const gradedCount = grades.length
  const avgScore = gradedCount ? Math.round(grades.reduce((s, g) => s + g.score, 0) / gradedCount) : 0

  return (
    <div className="flex-1 overflow-y-auto bg-[#05050a]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/25">
                <Gauge size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-[20px] md:text-[24px] font-black text-white tracking-tight leading-none">Trade Grader</h1>
                <p className="text-[12px] text-slate-500 mt-1">Score a setup's confluence before you risk a dollar.</p>
              </div>
            </div>
          </div>
          {gradedCount > 0 && (
            <div className="flex items-center gap-4 bg-[#0b0b12] border border-slate-800/60 rounded-2xl px-4 py-2.5">
              <div className="text-center">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">Graded</p>
                <p className="text-[15px] font-bold text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{gradedCount}</p>
              </div>
              <div className="w-px h-7 bg-slate-800" />
              <div className="text-center">
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">Avg Score</p>
                <p className="text-[15px] font-bold text-amber-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{avgScore}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── Left: inputs ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Setup context */}
            <div className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-5 space-y-4">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">The Setup</span>

              {/* Direction + instrument */}
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-1.5">
                  {(['long', 'short'] as const).map(d => (
                    <button key={d} onClick={() => setDirection(d)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[12px] font-bold transition-all ${
                        direction === d
                          ? d === 'long' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-red-500/15 border-red-500/40 text-red-300'
                          : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}>
                      {d === 'long' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {d === 'long' ? 'Long' : 'Short'}
                    </button>
                  ))}
                </div>
                <select value={instrument} onChange={e => setInstrument(e.target.value as Instrument)}
                  className="bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-200 focus:outline-none focus:border-slate-600 transition-all"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select value={session} onChange={e => setSession(e.target.value)}
                  className="flex-1 min-w-[130px] bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-200 focus:outline-none focus:border-slate-600 transition-all">
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* R:R */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Planned R:R</span>
                <div className="flex gap-1.5">
                  {['1', '1.5', '2', '3', '4'].map(v => (
                    <button key={v} onClick={() => { setRr(v); setSavedFlash(false) }}
                      className={`w-11 py-1.5 rounded-lg border text-[12px] font-bold transition-all ${
                        rr === v ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                      }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {v}R
                    </button>
                  ))}
                </div>
              </div>

              {/* Build check */}
              {builds.length > 0 && (
                <div className="flex items-center gap-2.5 border-t border-slate-800/40 pt-4">
                  <Package size={13} className="text-amber-400 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500">Grade against build:</span>
                  <select value={buildId} onChange={e => setBuildId(e.target.value)}
                    className="flex-1 min-w-0 bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-slate-200 focus:outline-none focus:border-slate-600 transition-all">
                    <option value="">— none —</option>
                    {builds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Confluence checklist */}
            <div className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Confluence Checklist</span>
                <span className="text-[10px] text-slate-600 font-semibold">{checked.size}/{ALL_FACTORS.length} checked</span>
              </div>

              {GROUPS.map(group => (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-[3px] h-3.5 rounded-full" style={{ background: group.color }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: group.color }}>{group.title}</span>
                  </div>
                  {group.factors.map(f => {
                    const on = checked.has(f.id)
                    return (
                      <button key={f.id} onClick={() => toggle(f.id)}
                        className={`w-full flex items-center gap-3 text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                          on ? 'bg-slate-900/60 border-slate-700/70' : 'bg-slate-900/20 border-slate-800/50 hover:border-slate-700/60'
                        }`}>
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${
                          on ? 'border-transparent' : 'border-slate-700'
                        }`} style={on ? { background: group.color } : undefined}>
                          {on && <Check size={13} className="text-[#0b0b12]" strokeWidth={3} />}
                        </span>
                        <span className={`text-[12.5px] leading-snug ${on ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>{f.label}</span>
                        {f.essential && (
                          <span className="ml-auto text-[8.5px] font-black uppercase tracking-wider text-amber-500/70 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex-shrink-0">Key</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}

              <button onClick={reset}
                className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-300 transition-colors pt-1">
                <RotateCcw size={11} /> Reset checklist
              </button>
            </div>
          </div>

          {/* ── Right: result ── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-4 space-y-5">

              {/* Grade card */}
              <div className="relative bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-6 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] opacity-70"
                  style={{ background: `linear-gradient(90deg,transparent,${result.color},transparent)` }} />

                <Gauge180 score={result.score} color={result.color} />

                <div className="text-center -mt-6">
                  <p className="font-black leading-none" style={{ fontSize: '52px', color: result.color, textShadow: `0 0 34px ${result.color}66`, fontFamily: "'JetBrains Mono', monospace" }}>
                    {result.letter}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-semibold">
                    Score <span className="text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{result.score}</span> / 100
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[14px] font-bold text-white">{result.verdict.headline}</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed mt-1.5">{result.verdict.body}</p>
                </div>

                {/* Risk suggestion */}
                <div className="mt-5 flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold">Suggested risk</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{Math.round(result.verdict.riskMult * 100)}% of your ${Math.round(baseRisk).toLocaleString()} plan</p>
                  </div>
                  <p className="text-[20px] font-black" style={{ color: result.color, fontFamily: "'JetBrains Mono', monospace" }}>
                    ${suggestedRisk.toLocaleString()}
                  </p>
                </div>

                {/* Save */}
                <button onClick={save} disabled={checked.size === 0}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: savedFlash ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: savedFlash ? '#34d399' : '#0a0800' }}>
                  {savedFlash ? <><Check size={15} /> Saved to history</> : <><Save size={15} /> Save this grade</>}
                </button>
              </div>

              {/* Gaps */}
              {result.essentialsMissing.length > 0 && (
                <div className="bg-[#0b0b12] border border-red-500/15 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={13} className="text-red-400" />
                    <span className="text-[12px] font-bold text-red-300 uppercase tracking-wider">Missing Essentials</span>
                  </div>
                  {result.essentialsMissing.map(f => (
                    <div key={f.id} className="flex gap-2.5">
                      <X size={13} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-semibold text-slate-300">{f.label}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{f.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="bg-[#0b0b12] border border-emerald-500/15 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-emerald-400" />
                    <span className="text-[12px] font-bold text-emerald-300 uppercase tracking-wider">What's Working</span>
                  </div>
                  {result.strengths.map(f => (
                    <div key={f.id} className="flex items-center gap-2.5">
                      <Check size={13} className="text-emerald-400/80 flex-shrink-0" />
                      <span className="text-[12px] text-slate-300 flex-1">{f.label}</span>
                      <span className="text-[10px] text-slate-600 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+{f.weight}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Build coverage */}
              {buildCoverage && (
                <div className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={13} className="text-amber-400" />
                      <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">System Match</span>
                    </div>
                    <span className="text-[12px] font-bold text-amber-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {buildCoverage.covered}/{buildCoverage.total}
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-slate-800/60">
                    <div className="bg-amber-400 transition-all duration-500" style={{ flex: buildCoverage.covered || 0.001 }} />
                    <div className="bg-slate-800/60" style={{ flex: buildCoverage.total - buildCoverage.covered || 0.001 }} />
                  </div>
                  {buildCoverage.missing.length > 0 ? (
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1.5">In your build, not in this setup</p>
                      <div className="flex flex-wrap gap-1.5">
                        {buildCoverage.missing.map(cid => (
                          <span key={cid} className="text-[10.5px] text-slate-400 bg-slate-900/60 border border-slate-800/60 rounded-lg px-2 py-0.5">
                            {getConceptById(cid)?.shortName ?? cid}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-400/80 flex items-center gap-1.5">
                      <Check size={12} /> This setup honours your whole system.
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── History ── */}
        {grades.length > 0 && (
          <div className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={13} className="text-amber-400" />
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Recent Grades</span>
              </div>
              <button onClick={clear} className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 size={11} /> Clear
              </button>
            </div>
            <div className="space-y-1.5">
              {grades.map(g => {
                const { color } = letterFor(g.score)
                return (
                  <div key={g.id} className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/50 rounded-xl px-3.5 py-2.5">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[14px] flex-shrink-0"
                      style={{ color, background: `${color}18`, border: `1px solid ${color}33`, fontFamily: "'JetBrains Mono', monospace" }}>
                      {g.letter}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {g.direction === 'long' ? <TrendingUp size={12} className="text-emerald-400 flex-shrink-0" /> : <TrendingDown size={12} className="text-red-400 flex-shrink-0" />}
                      <span className="text-[12px] font-bold text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{g.instrument}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate hidden sm:inline">{g.session}</span>
                    <span className="text-[11px] text-slate-600 flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{g.rr}R</span>
                    <span className="ml-auto flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] text-slate-500">{new Date(g.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <button onClick={() => remove(g.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                        <X size={13} />
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <p className="text-[11px] text-slate-700 text-center flex items-center justify-center gap-1.5 pb-2">
          <ChevronRight size={11} /> The grade is a discipline mirror, not a signal — it reflects the confluence you can see.
        </p>

      </div>
    </div>
  )
}

import { INSTRUMENTS } from '../data/instruments'
import { KILLZONES, type JournalEntry } from '../hooks/useJournal'
import { getConceptById } from '../data/concepts'
import { POINT_VALUES } from '../hooks/useSettings'
import { BarChart2, TrendingUp, TrendingDown, Zap, Clock, Gauge } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TRADING_DAYS = [1, 2, 3, 4, 5] // Mon-Fri

function getStreak(entries: JournalEntry[]): { count: number; type: 'W' | 'L' | null } {
  if (entries.length === 0) return { count: 0, type: null }
  const type = entries[0].result === 'win' ? 'W' : entries[0].result === 'loss' ? 'L' : null
  if (!type) return { count: 0, type: null }
  let count = 0
  for (const e of entries) {
    if ((e.result === 'win') === (type === 'W')) count++
    else break
  }
  return { count, type }
}

function EquityCurve({ entries }: { entries: JournalEntry[] }) {
  const chrono = [...entries].sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt))

  // Cumulative points, starting from 0
  const pts: number[] = [0]
  for (const e of chrono) pts.push(pts[pts.length - 1] + (e.points ?? 0))
  if (pts.length < 3) return null

  // Max drawdown (peak-to-trough in points)
  let peak = 0, maxDD = 0
  for (const v of pts) {
    if (v > peak) peak = v
    if (peak - v > maxDD) maxDD = peak - v
  }

  const W = 240, H = 72
  const min = Math.min(...pts, 0)
  const max = Math.max(...pts, 0)
  const range = max - min || 1
  const x = (i: number) => (i / (pts.length - 1)) * W
  const y = (v: number) => H - 4 - ((v - min) / range) * (H - 8)
  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const final = pts[pts.length - 1]
  const color = final >= 0 ? '#34d399' : '#f87171'

  return (
    <div className="tl-card p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Equity Curve</p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
            {final >= 0 ? '+' : ''}{final}pt
          </span>
          {maxDD > 0 && (
            <span className="text-[10px] font-semibold text-red-400/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              max DD −{maxDD}pt
            </span>
          )}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="#1e2030" strokeWidth="0.8" strokeDasharray="3 3" />
        <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#eq-fill)" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <p className="text-[10px] text-[var(--text-faint)] mt-1">cumulative points across {chrono.length} trades, oldest → newest</p>
    </div>
  )
}

function PointsTimeline({ entries }: { entries: JournalEntry[] }) {
  const recent = [...entries].slice(0, 24).reverse()
  if (recent.length === 0) return null
  const pts = recent.map(e => e.points ?? 0)
  const maxAbs = Math.max(...pts.map(Math.abs), 1)

  return (
    <svg viewBox="0 0 240 48" className="w-full h-12" preserveAspectRatio="none">
      <line x1="0" y1="24" x2="240" y2="24" stroke="#1e2030" strokeWidth="0.8" />
      {recent.map((e, i) => {
        const x = i * (240 / recent.length) + (240 / recent.length) * 0.1
        const w = (240 / recent.length) * 0.8
        const pt = e.points ?? 0
        const h = Math.max((Math.abs(pt) / maxAbs) * 22, 1.5)
        const y = pt >= 0 ? 24 - h : 24
        const fill = e.result === 'win' ? '#34d399' : e.result === 'loss' ? '#f87171' : '#64748b'
        return <rect key={e.id} x={x} y={y} width={w} height={h} fill={fill} rx="0.8" />
      })}
    </svg>
  )
}

interface Props { entries: JournalEntry[] }

/**
 * Win rate and points per Trade Grader grade.
 *
 * The point of grading a setup is the claim that better confluence produces
 * better outcomes. This is the only place that claim gets tested against the
 * user's own trades rather than asserted — so it deliberately reports what the
 * data says, including when the data disagrees with the grade.
 */
function GradePerformance({ entries }: { entries: JournalEntry[] }) {
  const ORDER = ['A+', 'A', 'B', 'C', 'D', 'F']
  const graded = entries.filter(e => e.gradeLetter)
  if (graded.length < 3) return null

  const rows = ORDER.map(letter => {
    const es = graded.filter(e => e.gradeLetter === letter)
    const wins = es.filter(e => e.result === 'win').length
    const decided = es.filter(e => e.result !== 'breakeven').length
    return {
      letter,
      count: es.length,
      winRate: decided > 0 ? Math.round((wins / decided) * 100) : null,
      points: es.reduce((s, e) => s + (e.points ?? 0), 0),
    }
  }).filter(r => r.count > 0)

  if (rows.length < 2) return null

  // Does the data actually support the grades? Compare the win rate of the top
  // half of grades against the bottom half, by trade count.
  const strong = rows.filter(r => ['A+', 'A', 'B'].includes(r.letter))
  const weak   = rows.filter(r => ['C', 'D', 'F'].includes(r.letter))
  const rateOf = (rs: typeof rows) => {
    const n = rs.reduce((s, r) => s + r.count, 0)
    if (!n) return null
    return Math.round(rs.reduce((s, r) => s + (r.winRate ?? 0) * r.count, 0) / n)
  }
  const strongRate = rateOf(strong), weakRate = rateOf(weak)
  // "points" means price points everywhere else in this app, so win rates are
  // always stated as percentages to avoid reading as a P&L figure.
  const verdict = strongRate !== null && weakRate !== null
    ? strongRate > weakRate
      ? `Your A–B setups win ${strongRate}% of the time against ${weakRate}% for C–F. The grading is earning its keep.`
      : strongRate === weakRate
        ? `High and low grades are both winning ${strongRate}% of the time so far. This needs more trades before it means anything.`
        : `Your C–F setups are winning more often (${weakRate}%) than your A–B ones (${strongRate}%). Either the grading needs tuning, or the good setups are being managed worse.`
    : null

  const max = Math.max(...rows.map(r => r.count))

  return (
    <div className="tl-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Gauge size={13} className="text-amber-400" />
        <span className="text-[13px] font-bold text-[var(--text)]">Performance by grade</span>
        <span className="ml-auto text-[10px] text-[var(--text-faint)] font-semibold">
          {graded.length} graded {graded.length === 1 ? 'trade' : 'trades'}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.letter} className="flex items-center gap-3">
            <span className="tl-figure w-8 text-[13px] font-bold text-[var(--text)]">{r.letter}</span>
            <div className="flex-1 h-6 rounded-lg bg-[var(--surface-2)] overflow-hidden relative">
              <div className="h-full rounded-lg transition-all"
                style={{
                  width: `${Math.max(6, (r.count / max) * 100)}%`,
                  background: r.winRate === null ? 'var(--border-strong)'
                    : r.winRate >= 50 ? 'var(--green)' : 'var(--red)',
                  opacity: 0.75,
                }} />
              <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] font-bold text-[var(--text)]">
                {r.count} {r.count === 1 ? 'trade' : 'trades'}
              </span>
            </div>
            <span className="tl-figure w-11 text-right text-[12px] font-bold"
              style={{ color: r.winRate === null ? 'var(--text-faint)' : r.winRate >= 50 ? 'var(--green)' : 'var(--red)' }}>
              {r.winRate === null ? '—' : `${r.winRate}%`}
            </span>
            <span className="tl-figure w-14 text-right text-[11px] font-semibold"
              style={{ color: r.points > 0 ? 'var(--green)' : r.points < 0 ? 'var(--red)' : 'var(--text-faint)' }}>
              {r.points > 0 ? '+' : ''}{r.points.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {verdict && (
        <p className="text-[11px] text-[var(--text-dim)] leading-relaxed border-t border-[var(--border)] pt-3">
          {verdict}
        </p>
      )}
    </div>
  )
}

/**
 * Expectancy, profit factor, and the live/backtest split.
 *
 * Win rate is the number traders quote and the one that misleads most — a 30%
 * win rate is excellent at 5R and ruinous at 0.5R. Expectancy (average points
 * per trade, wins and losses together) and profit factor (gross win ÷ gross
 * loss) are what actually say whether there's an edge, so they get stated
 * plainly rather than left for the reader to derive from the other panels.
 */
function EdgeSummary({ entries }: { entries: JournalEntry[] }) {
  const scored = entries.filter(e => e.points !== null)
  if (scored.length < 4) return null

  const gross = (sign: 1 | -1) =>
    scored.filter(e => sign * (e.points ?? 0) > 0)
          .reduce((s, e) => s + Math.abs(e.points ?? 0), 0)
  const grossWin  = gross(1)
  const grossLoss = gross(-1)

  const expectancy  = scored.reduce((s, e) => s + (e.points ?? 0), 0) / scored.length
  // Infinite profit factor is real (no losers yet) but reads as a bug, so it's
  // shown as an em dash with the reason in the caption instead.
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : null

  const byMode = (['live', 'backtest'] as const).map(m => {
    const es = entries.filter(e => e.mode === m)
    const decided = es.filter(e => e.result !== 'breakeven').length
    const w = es.filter(e => e.result === 'win').length
    return { mode: m, count: es.length, rate: decided ? Math.round((w / decided) * 100) : null }
  }).filter(r => r.count > 0)

  const tiles = [
    {
      label: 'Expectancy',
      value: `${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(2)}`,
      sub: 'points per trade, all trades',
      color: expectancy > 0 ? 'var(--green)' : expectancy < 0 ? 'var(--red)' : 'var(--text-dim)',
    },
    {
      label: 'Profit factor',
      value: profitFactor === null ? '—' : profitFactor.toFixed(2),
      sub: profitFactor === null ? 'no losing trades yet' : profitFactor >= 1 ? 'above 1.0 is profitable' : 'below 1.0 loses money',
      color: profitFactor === null ? 'var(--text-dim)' : profitFactor >= 1 ? 'var(--green)' : 'var(--red)',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tiles.map(t => (
        <div key={t.label} className="tl-card px-5 py-4">
          <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{t.label}</p>
          <p className="tl-figure text-[22px] font-bold mt-1 leading-none" style={{ color: t.color }}>{t.value}</p>
          <p className="text-[10px] text-[var(--text-faint)] mt-1">{t.sub}</p>
        </div>
      ))}
      <div className="tl-card px-5 py-4">
        <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">Live vs backtest</p>
        {byMode.length === 0 ? (
          <p className="text-[11px] text-[var(--text-faint)] mt-2">No trades yet</p>
        ) : (
          <div className="mt-1.5 space-y-1">
            {byMode.map(m => (
              <div key={m.mode} className="flex items-baseline gap-2">
                <span className="text-[11px] font-semibold text-[var(--text-dim)] capitalize w-14">{m.mode}</span>
                <span className="tl-figure text-[14px] font-bold text-[var(--text)]">
                  {m.rate === null ? '—' : `${m.rate}%`}
                </span>
                <span className="text-[10px] text-[var(--text-faint)]">{m.count} {m.count === 1 ? 'trade' : 'trades'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function JournalAnalytics({ entries }: Props) {
  const total    = entries.length
  const wins     = entries.filter(e => e.result === 'win').length
  const losses   = entries.filter(e => e.result === 'loss').length
  const bes      = entries.filter(e => e.result === 'breakeven').length
  const winRate  = total > 0 ? Math.round((wins / total) * 100) : 0
  const totalPts = entries.reduce((s, e) => s + (e.points ?? 0), 0)
  const streak   = getStreak(entries)

  const winEntries  = entries.filter(e => e.result === 'win' && e.points !== null)
  const lossEntries = entries.filter(e => e.result === 'loss' && e.points !== null)
  const avgWinPts   = winEntries.length > 0 ? winEntries.reduce((s, e) => s + (e.points ?? 0), 0) / winEntries.length : 0
  const avgLossPts  = lossEntries.length > 0 ? Math.abs(lossEntries.reduce((s, e) => s + (e.points ?? 0), 0) / lossEntries.length) : 0
  const rr = avgLossPts > 0 ? (avgWinPts / avgLossPts).toFixed(2) : '—'

  // Dollar P&L totals (sum across all entries using per-instrument point values)
  const totalDollar = entries.reduce((s, e) => s + (e.points ?? 0) * POINT_VALUES[e.instrument], 0)

  // Long vs Short
  const longs  = entries.filter(e => e.direction === 'long')
  const shorts = entries.filter(e => e.direction === 'short')
  const longWR  = longs.length  > 0 ? Math.round((longs.filter(e => e.result === 'win').length  / longs.length)  * 100) : 0
  const shortWR = shorts.length > 0 ? Math.round((shorts.filter(e => e.result === 'win').length / shorts.length) * 100) : 0

  // Day of week
  const dayStats = TRADING_DAYS.map(d => {
    const dayEntries = entries.filter(e => new Date(e.date + 'T12:00').getDay() === d)
    const dWins = dayEntries.filter(e => e.result === 'win').length
    return { day: DAYS[d], wins: dWins, total: dayEntries.length, rate: dayEntries.length > 0 ? Math.round((dWins / dayEntries.length) * 100) : 0 }
  })

  // Kill zone breakdown
  const kzTagged = entries.filter(e => e.killzone)
  const kzStats = KILLZONES.map(kz => {
    const ke = kzTagged.filter(e => e.killzone === kz)
    const kw = ke.filter(e => e.result === 'win').length
    const kPts = ke.reduce((s, e) => s + (e.points ?? 0), 0)
    return { kz, wins: kw, total: ke.length, pts: kPts, rate: ke.length > 0 ? Math.round((kw / ke.length) * 100) : 0 }
  }).filter(s => s.total > 0)

  // Instrument breakdown. Must cover every instrument the app can log, not just
  // forex — this list previously omitted the futures contracts, so an NQ trade
  // was silently dropped from the breakdown instead of appearing in it.
  const instStats = INSTRUMENTS.map(inst => {
    const ie = entries.filter(e => e.instrument === inst)
    const iw = ie.filter(e => e.result === 'win').length
    return { inst, total: ie.length, wins: iw, rate: ie.length > 0 ? Math.round((iw / ie.length) * 100) : 0 }
  }).filter(s => s.total > 0)

  // Concept performance
  const conceptMap: Record<string, { wins: number; total: number }> = {}
  for (const e of entries) {
    for (const cid of e.conceptIds) {
      if (!conceptMap[cid]) conceptMap[cid] = { wins: 0, total: 0 }
      conceptMap[cid].total++
      if (e.result === 'win') conceptMap[cid].wins++
    }
  }
  const conceptStats = Object.entries(conceptMap)
    .map(([id, v]) => ({ id, ...v, rate: Math.round((v.wins / v.total) * 100) }))
    .filter(c => c.total >= 2)
    .sort((a, b) => b.rate - a.rate)

  const tierDot: Record<string, string> = { basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400' }

  if (total === 0) return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-20">
      <BarChart2 size={32} className="text-[var(--text-faint)]" />
      <p className="text-[13px] font-semibold text-[var(--text-dim)]">Log trades to unlock analytics</p>
      <p className="text-[11px] text-[var(--text-faint)] max-w-xs leading-relaxed">Win rates, P&L charts, day-of-week performance and concept rankings appear here as you build your trading history.</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
      <div className="max-w-5xl mx-auto w-full space-y-5">

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Win Rate', value: `${winRate}%`, sub: `${wins}W · ${losses}L · ${bes}BE`, color: winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Total Points', value: totalPts >= 0 ? `+${totalPts}` : `${totalPts}`, sub: totalDollar !== 0 ? `≈ ${totalDollar >= 0 ? '+' : ''}$${Math.abs(totalDollar).toLocaleString()}` : `across ${total} trades`, color: totalPts >= 0 ? 'text-emerald-400' : 'text-red-400', mono: true },
          { label: 'Avg R:R', value: rr, sub: `${avgWinPts.toFixed(0)}pt win / ${avgLossPts.toFixed(0)}pt loss`, color: 'text-blue-400', mono: true },
          { label: 'Streak', value: streak.type ? `${streak.count}${streak.type}` : '—', sub: streak.type === 'W' ? 'current win streak' : streak.type === 'L' ? 'current loss streak' : 'no streak', color: streak.type === 'W' ? 'text-emerald-400' : streak.type === 'L' ? 'text-red-400' : 'text-[var(--text-dim)]' },
        ].map(s => (
          <div key={s.label} className="tl-card px-5 py-4">
            <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{s.label}</p>
            <p className={`text-[22px] font-bold mt-1 leading-none ${s.color}`} style={{ fontFamily: s.mono ? "'JetBrains Mono', monospace" : undefined }}>{s.value}</p>
            <p className="text-[10px] text-[var(--text-faint)] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <EdgeSummary entries={entries} />

      {/* Equity curve */}
      <EquityCurve entries={entries} />

      <GradePerformance entries={entries} />

      {/* Points timeline */}
      <div className="tl-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Points Timeline</p>
          <p className="text-[10px] text-[var(--text-faint)]">last {Math.min(total, 24)} trades</p>
        </div>
        <PointsTimeline entries={entries} />
        <div className="flex items-center gap-4 mt-2">
          {[['#34d399','Win'], ['#f87171','Loss'], ['#64748b','BE']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-lg" style={{ background: c }} />
              <span className="text-[10px] text-[var(--text-faint)]">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Day of week */}
        <div className="tl-card p-4">
          <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Day of Week</p>
          <div className="space-y-2.5">
            {dayStats.map(({ day, total: dt, rate }) => (
              <div key={day} className="flex items-center gap-2.5">
                <span className="text-[11px] font-semibold text-[var(--text-dim)] w-8">{day}</span>
                <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                  {dt > 0 && (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${rate >= 60 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${rate}%` }}
                    />
                  )}
                </div>
                {dt > 0
                  ? <span className="text-[11px] font-bold text-[var(--text-dim)] w-9 text-right">{rate}%</span>
                  : <span className="text-[11px] text-[var(--text-faint)] w-9 text-right">—</span>}
                <span className="text-[10px] text-[var(--text-faint)] w-6">{dt}t</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kill zone */}
        <div className="tl-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={12} className="text-[var(--text-dim)]" />
            <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Kill Zone</p>
            {kzTagged.length > 0 && kzTagged.length < entries.length && (
              <span className="text-[10px] text-[var(--text-faint)] ml-auto">{kzTagged.length}/{entries.length} tagged</span>
            )}
          </div>
          {kzStats.length === 0 ? (
            <p className="text-[11px] text-[var(--text-faint)] leading-relaxed py-2">
              Tag trades with a kill zone when logging them to see which session actually pays you.
            </p>
          ) : (
            <div className="space-y-2.5">
              {kzStats.map(({ kz, rate, total: t, pts }) => (
                <div key={kz} className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold text-[var(--text-dim)] w-14">{kz}</span>
                  <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${rate >= 60 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-dim)] w-9 text-right">{rate}%</span>
                  <span className={`text-[10px] w-12 text-right ${pts >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {pts >= 0 ? '+' : ''}{pts}pt
                  </span>
                  <span className="text-[10px] text-[var(--text-faint)] w-6">{t}t</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Direction */}
        <div className="tl-card p-4">
            <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Direction</p>
            <div className="space-y-2.5">
              {[
                { label: 'Long', rate: longWR, total: longs.length, icon: TrendingUp, color: 'text-emerald-400', bar: 'bg-emerald-500' },
                { label: 'Short', rate: shortWR, total: shorts.length, icon: TrendingDown, color: 'text-red-400', bar: 'bg-red-500' },
              ].map(({ label, rate, total: t, icon: Icon, color, bar }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon size={13} className={`flex-shrink-0 ${color}`} />
                  <span className="text-[11px] font-semibold text-[var(--text-dim)] w-10">{label}</span>
                  <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    {t > 0 && <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${rate}%` }} />}
                  </div>
                  {t > 0
                    ? <span className="text-[11px] font-bold text-[var(--text-dim)] w-9 text-right">{rate}%</span>
                    : <span className="text-[11px] text-[var(--text-faint)] w-9 text-right">—</span>}
                  <span className="text-[10px] text-[var(--text-faint)] w-6">{t}t</span>
                </div>
              ))}
            </div>
        </div>

        {/* Instrument */}
        {instStats.length > 0 && (
            <div className="tl-card p-4">
              <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Instrument</p>
              <div className="space-y-2.5">
                {instStats.map(({ inst, rate, total: t }) => (
                  <div key={inst} className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-amber-400 w-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{inst}</span>
                    <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${rate >= 60 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text-dim)] w-9 text-right">{rate}%</span>
                    <span className="text-[10px] text-[var(--text-faint)] w-6">{t}t</span>
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>

      {/* Concept performance */}
      {conceptStats.length > 0 && (
        <div className="tl-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={13} className="text-amber-400" />
            <p className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Concept Performance</p>
            <span className="text-[10px] text-[var(--text-faint)] ml-auto">min 2 trades</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {conceptStats.map(({ id, wins: cw, total: ct, rate }) => {
              const c = getConceptById(id)
              if (!c) return null
              return (
                <div key={id} className="flex items-center gap-2.5 py-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierDot[c.tier]}`} />
                  <span className="text-[11px] text-[var(--text-dim)] flex-1 min-w-0 truncate">{c.shortName}</span>
                  <div className="w-24 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className={`h-full rounded-full ${rate >= 60 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${rate}%`, transition: 'width 0.5s ease' }}
                    />
                  </div>
                  <span className={`text-[11px] font-bold w-9 text-right flex-shrink-0 ${rate >= 60 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{rate}%</span>
                  <span className="text-[10px] text-[var(--text-faint)] w-8 flex-shrink-0">{cw}W/{ct}T</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

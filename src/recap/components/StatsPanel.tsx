import type { Trade } from '../lib/csvParser'
import type { ThemeConfig } from '../lib/themes'

interface Props {
  trades: Trade[]
  theme: ThemeConfig
}

function fmt$(pnl: number) {
  const abs = Math.abs(pnl)
  const sign = pnl >= 0 ? '+' : '-'
  if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}K`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`
  return `${sign}$${abs.toFixed(0)}`
}

function calcStreaks(trades: Trade[]) {
  if (!trades.length) return { current: 0, best: 0, currentType: 'none' as const }
  const last = trades[trades.length - 1]
  const currentType = last.isWin ? 'win' : ('loss' as const)
  let current = 0
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].isWin === last.isWin) current++
    else break
  }
  let best = 0, streak = 0
  for (const t of trades) { if (t.isWin) { streak++; best = Math.max(best, streak) } else streak = 0 }
  return { current, best, currentType }
}

const DOW_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function StatsPanel({ trades, theme }: Props) {
  if (!trades.length) return null

  // Day of week
  const byDay = DOW_ORDER.map(day => {
    const dayTrades = trades.filter(t => t.dayOfWeek === day)
    const total = dayTrades.reduce((s, t) => s + t.pnl, 0)
    const wins = dayTrades.filter(t => t.isWin).length
    return { day, trades: dayTrades.length, total, wins }
  }).filter(d => d.trades > 0)

  const maxAbs = Math.max(...byDay.map(d => Math.abs(d.total)), 1)

  // Top symbols
  const symbolMap = new Map<string, { pnl: number; count: number; wins: number }>()
  for (const t of trades) {
    const cur = symbolMap.get(t.symbol) ?? { pnl: 0, count: 0, wins: 0 }
    symbolMap.set(t.symbol, { pnl: cur.pnl + t.pnl, count: cur.count + 1, wins: cur.wins + (t.isWin ? 1 : 0) })
  }
  const topSymbols = [...symbolMap.entries()]
    .sort((a, b) => Math.abs(b[1].pnl) - Math.abs(a[1].pnl))
    .slice(0, 5)

  // Streaks
  const { current, best, currentType } = calcStreaks(trades)

  // Best time of day (if time data available)
  const hasTimes = trades.some(t => t.openTimeOfDay !== '—')
  const sessionMap = { AM: { pnl: 0, count: 0 }, PM: { pnl: 0, count: 0 }, AH: { pnl: 0, count: 0 } }
  if (hasTimes) {
    for (const t of trades) {
      if (t.openTimeOfDay === '—') continue
      const hour = parseInt(t.openTimeOfDay.replace(/[^0-9]/g, '').slice(0, 2))
      const isPM = t.openTimeOfDay.toLowerCase().includes('pm')
      const h24 = isPM && hour !== 12 ? hour + 12 : hour
      if (h24 < 12) sessionMap.AM.pnl += t.pnl, sessionMap.AM.count++
      else if (h24 < 16) sessionMap.PM.pnl += t.pnl, sessionMap.PM.count++
      else sessionMap.AH.pnl += t.pnl, sessionMap.AH.count++
    }
  }

  return (
    <div
      className="w-full animate-fade-up"
      style={{ animationDelay: '0.1s' }}
    >
      <div
        className="rounded-2xl p-6 grid gap-6"
        style={{
          background: theme.surface2,
          border: `1px solid ${theme.divider}`,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >

        {/* Day of Week */}
        {byDay.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 14 }}>📅</span>
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>
                Day of Week
              </span>
            </div>
            {byDay.map(d => {
              const barW = (Math.abs(d.total) / maxAbs) * 100
              const color = d.total >= 0 ? theme.profit : theme.loss
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold w-7 shrink-0" style={{ color: theme.textMuted }}>{d.day}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: theme.surface }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barW}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold w-16 text-right shrink-0" style={{ color }}>{fmt$(d.total)}</span>
                  <span className="font-mono text-[10px] w-6 shrink-0" style={{ color: theme.textMuted }}>{d.trades}t</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Top Symbols */}
        {topSymbols.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 14 }}>🏆</span>
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>
                Top Symbols
              </span>
            </div>
            {topSymbols.map(([sym, data]) => {
              const wr = data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0
              const color = data.pnl >= 0 ? theme.profit : theme.loss
              return (
                <div key={sym} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-black w-14 shrink-0" style={{ color: theme.textPrimary }}>{sym}</span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.surface }}>
                      <div className="h-full rounded-full" style={{
                        width: `${(Math.abs(data.pnl) / topSymbols[0][1].pnl) * 100}%`,
                        background: color, boxShadow: `0 0 4px ${color}60`,
                      }} />
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold w-16 text-right shrink-0" style={{ color }}>{fmt$(data.pnl)}</span>
                  <span className="font-mono text-[10px] w-8 text-right shrink-0" style={{ color: theme.textMuted }}>{wr}%W</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Streak + Session */}
        <div className="flex flex-col gap-4">
          {/* Win streak */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 14 }}>🔥</span>
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>Streaks</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3 text-center" style={{ background: theme.surface, border: `1px solid ${theme.divider}` }}>
                <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: theme.textMuted }}>Current</div>
                <div className="font-mono font-black text-2xl" style={{
                  color: currentType === 'win' ? theme.profit : theme.loss,
                  textShadow: `0 0 12px ${currentType === 'win' ? theme.profit : theme.loss}60`,
                }}>
                  {current}{currentType === 'win' ? 'W' : 'L'}
                </div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: theme.surface, border: `1px solid ${theme.divider}` }}>
                <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: theme.textMuted }}>Best Win</div>
                <div className="font-mono font-black text-2xl" style={{ color: theme.profit, textShadow: `0 0 12px ${theme.profit}60` }}>
                  {best}W
                </div>
              </div>
            </div>
          </div>

          {/* Session breakdown */}
          {hasTimes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 14 }}>⏰</span>
                <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>Session</span>
              </div>
              <div className="flex flex-col gap-2">
                {(Object.entries(sessionMap) as [string, { pnl: number; count: number }][])
                  .filter(([, d]) => d.count > 0)
                  .map(([session, data]) => {
                    const color = data.pnl >= 0 ? theme.profit : theme.loss
                    return (
                      <div key={session} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: theme.surface, border: `1px solid ${theme.divider}` }}>
                        <span className="font-mono text-[10px] font-bold" style={{ color: theme.textSecondary }}>{session} Session</span>
                        <span className="font-mono text-[10px] font-bold" style={{ color }}>{fmt$(data.pnl)}</span>
                        <span className="font-mono text-[10px]" style={{ color: theme.textMuted }}>{data.count}t</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import type { Trade } from '../lib/csvParser'
import { calcStats } from '../lib/csvParser'
import type { ThemeConfig } from '../lib/themes'
import { EquityCurve } from './EquityCurve'

interface Props {
  trades: Trade[]
  theme: ThemeConfig
  label?: string
}

function fmt$(pnl: number) {
  const abs = Math.abs(pnl)
  const sign = pnl >= 0 ? '+' : '-'
  if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}K`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`
  return `${sign}$${abs.toFixed(2)}`
}

export function Montage({ trades, theme, label }: Props) {
  const stats = calcStats(trades)
  const pnlColor = stats.totalPnl >= 0 ? theme.profit : theme.loss
  const winRateColor = stats.winRate >= 60 ? theme.profit : stats.winRate >= 45 ? '#f59e0b' : theme.loss
  const pfColor = stats.profitFactor >= 1.5 ? theme.profit : stats.profitFactor >= 1 ? '#f59e0b' : theme.loss
  const dateLabel = label || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const fontClass = theme.monoEverything ? 'font-mono' : ''

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${fontClass}`}
      style={{
        background: theme.montageBg,
        border: `1px solid ${theme.divider}`,
        boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)`,
        width: 920,
        padding: '28px 32px',
      }}
    >
      {/* Orbs */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${theme.montageOrb1} 0%, transparent 70%)`, transform: 'translate(-40%,-50%)' }} />
      <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${theme.montageOrb2} 0%, transparent 70%)`, transform: 'translate(35%,45%)' }} />

      {/* Scanlines */}
      {theme.scanlines && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.012) 3px, rgba(0,255,0,0.012) 6px)' }} />
      )}

      <div className="relative z-10 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }} />
              <span className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: theme.textMuted }}>
                Trade Recap
              </span>
            </div>
            <h2 className="font-black leading-none" style={{ fontSize: 28, letterSpacing: '-1px', color: theme.textPrimary }}>
              {dateLabel}
            </h2>
            <p className="font-mono text-xs" style={{ color: theme.textMuted }}>
              {trades.length} trades &nbsp;·&nbsp; {stats.wins}W / {stats.losses}L
            </p>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="font-mono text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: theme.textMuted }}>Net P&L</span>
            <span className="font-mono font-black leading-none"
              style={{ fontSize: 44, color: pnlColor, textShadow: `0 0 28px ${pnlColor}55`, letterSpacing: '-2px' }}>
              {fmt$(stats.totalPnl)}
            </span>
          </div>
        </div>

        {/* Equity curve */}
        <div className="rounded-xl px-2 py-2" style={{ background: theme.surface2, border: `1px solid ${theme.divider}` }}>
          <EquityCurve trades={trades} theme={theme} width={848} height={90} />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Win Rate', value: `${stats.winRate.toFixed(0)}%`, sub: `${stats.wins}/${trades.length}`, color: winRateColor },
            { label: 'Best Trade', value: stats.bestTrade ? fmt$(stats.bestTrade.pnl) : '—', sub: stats.bestTrade?.symbol, color: theme.profit },
            { label: 'Avg Win', value: fmt$(stats.avgWin), sub: undefined, color: theme.profit },
            { label: 'Avg Loss', value: fmt$(stats.avgLoss), sub: undefined, color: theme.loss },
            {
              label: 'Profit Factor',
              value: isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) + 'x' : '∞',
              sub: undefined,
              color: pfColor,
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="flex flex-col gap-1 px-3 py-2.5 rounded-xl"
              style={{ background: theme.surface, border: `1px solid ${theme.divider}` }}>
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>{label}</span>
              <span className="font-mono font-black text-lg leading-none"
                style={{ color, textShadow: `0 0 12px ${color}50` }}>
                {value}
              </span>
              {sub && <span className="font-mono text-[10px]" style={{ color: theme.textMuted }}>{sub}</span>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: theme.textMuted }}>Trade Recap</span>
          <span className="font-mono text-[10px]" style={{ color: `${theme.textMuted}70` }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

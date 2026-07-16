import { useState, useEffect, useCallback, useRef } from 'react'
import type { Trade } from '../lib/csvParser'
import type { ThemeConfig } from '../lib/themes'

interface Props {
  trade: Trade
  theme: ThemeConfig
  rank?: number
  note?: string
  disabled?: boolean
  selected?: boolean
  selectMode?: boolean
  exportMode?: boolean
  isBest?: boolean
  isWorst?: boolean
  entranceIndex?: number
  onDelete?: () => void
  onToggleDisabled?: () => void
  onToggleSelected?: () => void
  onNoteChange?: (note: string) => void
  style?: React.CSSProperties
}

function fmt$(pnl: number): string {
  const abs = Math.abs(pnl)
  const sign = pnl >= 0 ? '+' : '-'
  if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}K`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`
  return `${sign}$${abs.toFixed(2)}`
}

function fmtPrice(p: number): string {
  if (p === 0) return '—'
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p < 1) return p.toFixed(5)
  return p.toFixed(2)
}

function fmtQty(q: number): string {
  if (q >= 1000) return `${(q / 1000).toFixed(1)}K`
  return q % 1 === 0 ? String(q) : q.toFixed(2)
}

export function TradeCard({
  trade, theme, rank, note = '', disabled = false, selected = false,
  selectMode = false, exportMode = false,
  isBest = false, isWorst = false, entranceIndex = 0,
  onDelete, onToggleDisabled, onToggleSelected, onNoteChange,
  style,
}: Props) {
  const [editingNote, setEditingNote] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [shine, setShine] = useState(false)
  const [displayPnl, setDisplayPnl] = useState(exportMode ? trade.pnl : 0)
  const [displayPct, setDisplayPct] = useState(exportMode ? trade.pnlPercent : 0)
  const animRef = useRef<number | null>(null)

  const isWin = trade.isWin
  const pnlColor = isWin ? theme.profit : theme.loss
  const borderColor = isWin ? theme.profitBorder : theme.lossBorder
  const shadow = isWin ? theme.profitShadow : theme.lossShadow
  const orbColor = isWin ? theme.profitOrb : theme.lossOrb
  const fontClass = theme.monoEverything ? 'font-mono' : ''

  const showSideTag = trade.side !== 'unknown'
  const sideLabel = trade.side === 'long' ? '▲ LONG' : '▼ SHORT'
  const barWidth = Math.min(Math.abs(trade.pnlPercent) * 4, 100)
  const showControls = !exportMode && !selectMode && hovered && (onDelete || onToggleDisabled)

  // Animated counter on mount
  useEffect(() => {
    if (exportMode) { setDisplayPnl(trade.pnl); setDisplayPct(trade.pnlPercent); return }
    const delay = entranceIndex * 40
    const startTimer = setTimeout(() => {
      const start = performance.now()
      const duration = 850
      function tick(now: number) {
        const t = Math.min((now - start) / duration, 1)
        const e = 1 - Math.pow(1 - t, 4)
        setDisplayPnl(trade.pnl * e)
        setDisplayPct(trade.pnlPercent * e)
        if (t < 1) animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(startTimer); if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [trade.id, trade.pnl, trade.pnlPercent, exportMode, entranceIndex])

  // 3D tilt
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (exportMode || selectMode || disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setTilt({ x: -y * 10, y: x * 10 })
  }, [exportMode, selectMode, disabled])

  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    setShine(true)
    setTimeout(() => setShine(false), 700)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setTilt({ x: 0, y: 0 })
  }, [])

  const isSettled = tilt.x === 0 && tilt.y === 0

  return (
    <div
      style={{
        perspective: '1000px',
        display: 'inline-block',
        animation: exportMode ? 'none' : `fadeUp 0.4s ease-out ${entranceIndex * 45}ms both`,
      }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl flex flex-col ${fontClass}`}
        style={{
          width: 280,
          background: theme.cardBg,
          border: `1px solid ${selected ? theme.accent + '88' : hovered && !disabled ? pnlColor + '35' : borderColor}`,
          boxShadow: selected
            ? `0 0 0 2px ${theme.accent}44, ${shadow}`
            : hovered && !disabled && !exportMode
              ? `0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.5), 0 0 50px ${isWin ? theme.profitOrb.replace('0.0', '0.2') : theme.lossOrb.replace('0.0', '0.2')}`
              : shadow,
          opacity: disabled ? 0.38 : 1,
          transform: exportMode ? 'none' : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${hovered ? 8 : 0}px)`,
          transition: isSettled
            ? 'transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease, border-color 0.3s ease'
            : 'transform 0.08s ease, box-shadow 0.3s ease, border-color 0.3s ease',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          cursor: selectMode ? 'pointer' : 'default',
          ...style,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => selectMode && onToggleSelected?.()}
      >
        {/* Shine sweep */}
        {shine && !exportMode && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 50%, transparent 65%)',
              animation: 'shineSwipe 0.65s ease-out forwards',
            }}
          />
        )}

        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${orbColor} 0%, transparent 70%)`, transform: 'translate(30%,-30%)' }} />

        {/* Scanlines */}
        {theme.scanlines && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)' }} />
        )}

        {/* Crown / Skull badge */}
        {(isBest || isWorst) && !disabled && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            zIndex: 15, fontSize: 18, lineHeight: 1,
            filter: `drop-shadow(0 0 6px ${isBest ? theme.profit : theme.loss})`,
          }}>
            {isBest ? '👑' : '💀'}
          </div>
        )}

        {/* Disabled banner */}
        {disabled && !exportMode && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <span className="font-mono text-[10px] font-bold tracking-widest px-3 py-1 rounded-lg border"
              style={{ color: theme.textMuted, borderColor: theme.divider, background: 'rgba(0,0,0,0.6)' }}>HIDDEN</span>
          </div>
        )}

        {/* Select checkbox */}
        {!exportMode && selectMode && (
          <div className="absolute top-2.5 left-2.5 z-20 w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: selected ? theme.accent : 'rgba(0,0,0,0.6)', border: `1.5px solid ${selected ? theme.accent : theme.divider}` }}>
            {selected && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
          </div>
        )}

        {/* Hover controls */}
        {showControls && (
          <div className="absolute top-2.5 right-2.5 z-20 flex gap-1.5">
            {onToggleDisabled && (
              <button onClick={e => { e.stopPropagation(); onToggleDisabled() }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
                style={{ background: 'rgba(0,0,0,0.75)', border: `1px solid ${theme.divider}`, color: theme.textMuted, cursor: 'pointer' }}>
                {disabled ? '👁' : '🚫'}
              </button>
            )}
            {onDelete && (
              <button onClick={e => { e.stopPropagation(); onDelete() }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
                style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,51,102,0.35)', color: '#ff3366', cursor: 'pointer' }}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* Card content */}
        <div className="relative z-10 flex flex-col p-4 gap-3">

          {/* Row 1: side tag + day + rank */}
          <div className="flex items-center justify-between" style={{ marginTop: isBest || isWorst ? 14 : 0 }}>
            <div className="flex items-center gap-1.5">
              {showSideTag && (
                <span className="font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-lg border"
                  style={{ color: pnlColor, background: `${pnlColor}12`, borderColor: `${pnlColor}30` }}>
                  {sideLabel}
                </span>
              )}
              {trade.dayOfWeek !== '—' && (
                <span className="font-mono text-[10px] font-semibold tracking-widest px-1.5 py-0.5 rounded-lg"
                  style={{ color: theme.textMuted, background: theme.surface }}>
                  {trade.dayOfWeek}
                </span>
              )}
            </div>
            {rank !== undefined && (
              <span className="font-mono text-[10px]" style={{ color: theme.textMuted }}>#{rank + 1}</span>
            )}
          </div>

          {/* Row 2: symbol + P&L */}
          <div className="flex items-start justify-between gap-2">
            <div className="font-mono font-black leading-none"
              style={{ fontSize: 34, color: theme.textPrimary, letterSpacing: '-1.5px' }}>
              {trade.symbol}
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="font-mono font-black leading-none"
                style={{ fontSize: 22, color: pnlColor, textShadow: `0 0 18px ${pnlColor}70`, letterSpacing: '-0.5px' }}>
                {fmt$(displayPnl)}
              </div>
              <div className="font-mono text-xs font-bold mt-0.5" style={{ color: `${pnlColor}aa` }}>
                {displayPct >= 0 ? '+' : ''}{displayPct.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: theme.divider }} />

          {/* Entry → Exit */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>Entry</span>
              <span className="font-mono text-sm font-bold" style={{ color: theme.textSecondary }}>{fmtPrice(trade.entryPrice)}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-0.5">
                <div className="w-6 h-px" style={{ background: `linear-gradient(90deg, ${theme.divider}, ${pnlColor}60)` }} />
                <svg width="5" height="7" viewBox="0 0 5 7"><path d="M0 0L5 3.5L0 7V0Z" fill={pnlColor} opacity="0.7" /></svg>
              </div>
              {trade.quantity > 1 && (
                <span className="font-mono text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{fmtQty(trade.quantity)}</span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 items-end">
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>Exit</span>
              <span className="font-mono text-sm font-bold" style={{ color: theme.textSecondary }}>{fmtPrice(trade.exitPrice)}</span>
            </div>
          </div>

          {/* P&L bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: theme.surface }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${barWidth}%`, background: pnlColor, boxShadow: `0 0 6px ${pnlColor}60` }} />
            </div>
            <span className="font-mono text-[10px] font-bold w-10 text-right shrink-0" style={{ color: `${pnlColor}99` }}>
              {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(1)}%
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Size', value: fmtQty(trade.quantity) },
              { label: 'Move', value: `${trade.movePct >= 0 ? '+' : ''}${trade.movePct.toFixed(1)}%` },
              { label: 'Hold', value: trade.duration },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5 rounded-lg p-2" style={{ background: theme.surface }}>
                <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>{label}</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: theme.textSecondary }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Datetime */}
          <div className="rounded-lg px-2.5 py-2 flex items-center justify-between"
            style={{ background: theme.surface2, border: `1px solid ${theme.divider}` }}>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: theme.textMuted }}>Opened</span>
              <span className="font-mono text-[10px] font-semibold" style={{ color: theme.textSecondary }}>
                {trade.openDate}
                {trade.openTimeOfDay !== '—' && <span style={{ color: theme.textMuted }}> · {trade.openTimeOfDay}</span>}
              </span>
            </div>
            <div className="w-px h-5" style={{ background: theme.divider }} />
            <div className="flex flex-col gap-0.5 items-end">
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: theme.textMuted }}>Closed</span>
              <span className="font-mono text-[10px] font-semibold" style={{ color: theme.textSecondary }}>
                {trade.closeDate}
                {trade.closeTimeOfDay !== '—' && <span style={{ color: theme.textMuted }}> · {trade.closeTimeOfDay}</span>}
              </span>
            </div>
          </div>

          {/* Fees */}
          {trade.fees > 0 && (
            <div className="flex items-center justify-between px-0.5">
              <span className="font-mono text-[10px]" style={{ color: theme.textMuted }}>Fees</span>
              <span className="font-mono text-[10px] font-semibold" style={{ color: theme.loss }}>-${trade.fees.toFixed(2)}</span>
            </div>
          )}

          {/* Note */}
          {(note || (!exportMode && onNoteChange)) && (
            <div className="rounded-lg px-2.5 py-2 flex gap-1.5 items-start"
              style={{ background: theme.surface, border: `1px solid ${theme.divider}` }}>
              <span style={{ color: theme.textMuted, fontSize: 10, marginTop: 1, flexShrink: 0 }}>✏</span>
              {editingNote && !exportMode ? (
                <textarea autoFocus value={note} onChange={e => onNoteChange?.(e.target.value)}
                  onBlur={() => setEditingNote(false)} placeholder="Add a note…" rows={2}
                  className="flex-1 bg-transparent outline-none resize-none text-[11px] font-mono"
                  style={{ color: theme.textSecondary, caretColor: pnlColor }} />
              ) : (
                <span className="flex-1 text-[11px] font-mono cursor-text"
                  style={{ color: note ? theme.textSecondary : theme.textMuted, minHeight: 28, display: 'block' }}
                  onClick={() => !exportMode && setEditingNote(true)}>
                  {note || 'Click to add a note…'}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${theme.divider}` }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: pnlColor, boxShadow: `0 0 5px ${pnlColor}`, animation: isWin && !exportMode ? 'glowPulse 2s ease-in-out infinite' : 'none' }} />
              <span className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>
                {isWin ? 'Winner' : 'Loser'}
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: `${theme.textMuted}70` }}>Recap</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import type { Trade } from '../lib/csvParser'
import { calcStats } from '../lib/csvParser'
import type { ThemeConfig } from '../lib/themes'
import { TradeCard } from './TradeCard'
import { EquityCurve } from './EquityCurve'

interface Props {
  trades: Trade[]
  theme: ThemeConfig
  label: string
  onClose: () => void
}

type Phase = 'intro' | 'card' | 'outro'

function fmt$(pnl: number) {
  const abs = Math.abs(pnl)
  const sign = pnl >= 0 ? '+' : '-'
  if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}K`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`
  return `${sign}$${abs.toFixed(2)}`
}

const INTRO_MS = 3000
const CARD_MS = 2400
const OUTRO_MS = 99999 // stays until user closes or taps

export function Slideshow({ trades, theme, label, onClose }: Props) {
  const stats = calcStats(trades)
  const [phase, setPhase] = useState<Phase>('intro')
  const [cardIndex, setCardIndex] = useState(0)
  const [show, setShow] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pnlColor = stats.totalPnl >= 0 ? theme.profit : theme.loss
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)

  const transition = useCallback((fn: () => void) => {
    setShow(false)
    setTimeout(() => { fn(); setShow(true) }, 380)
  }, [])

  const goNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (phase === 'intro') {
      transition(() => { setPhase('card'); setCardIndex(0) })
    } else if (phase === 'card') {
      if (cardIndex < trades.length - 1) {
        transition(() => setCardIndex(i => i + 1))
      } else {
        transition(() => setPhase('outro'))
      }
    } else {
      transition(() => { setPhase('intro'); setCardIndex(0) })
    }
  }, [phase, cardIndex, trades.length, transition])

  // Auto-advance
  useEffect(() => {
    const ms = phase === 'intro' ? INTRO_MS : phase === 'card' ? CARD_MS : OUTRO_MS
    timerRef.current = setTimeout(goNext, ms)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [phase, cardIndex, goNext])

  // Progress 0–1
  const totalSteps = 1 + trades.length + 1
  const currentStep = phase === 'intro' ? 0 : phase === 'card' ? 1 + cardIndex : 1 + trades.length
  const progress = currentStep / (totalSteps - 1)

  const trade = trades[cardIndex]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: theme.bgBase,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
      onClick={goNext}
    >
      {/* Accent orb */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 600, height: 600,
        borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${theme.montageOrb1} 0%, transparent 65%)`,
        transform: 'translate(-40%,-40%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: 400, height: 400,
        borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${theme.montageOrb2} 0%, transparent 65%)`,
        transform: 'translate(35%,35%)',
      }} />

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: theme.surface }}>
        <div style={{
          height: '100%', background: theme.accent,
          boxShadow: `0 0 8px ${theme.accent}`,
          width: `${progress * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 0',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: theme.surface, border: `1px solid ${theme.divider}`,
          borderRadius: 20, padding: '5px 12px',
          pointerEvents: 'none',
        }}>
          {isIOS ? (
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: theme.textMuted }}>
              📱 Use Screen Record to save
            </span>
          ) : (
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: theme.textMuted }}>
              Tap or click to advance
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          style={{
            width: 34, height: 34, borderRadius: 10, pointerEvents: 'all',
            background: theme.surface, border: `1px solid ${theme.divider}`,
            color: theme.textSecondary, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Close slideshow"
        ><X size={16} strokeWidth={2.5} /></button>
      </div>

      {/* Slide counter */}
      {phase === 'card' && (
        <div style={{
          position: 'absolute', bottom: 24,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: theme.textMuted, letterSpacing: '0.1em',
        }}>
          {cardIndex + 1} / {trades.length}
        </div>
      )}

      {/* ── Content ── */}
      <div style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20,
        padding: '60px 24px 60px',
        width: '100%', maxWidth: '100vw', maxHeight: '100vh',
        overflowY: 'auto',
        pointerEvents: 'none',
      }}>

        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.3em', color: theme.textMuted, textTransform: 'uppercase' }}>
              Trade Recap
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 8vw, 60px)', color: theme.textPrimary, letterSpacing: '-2px', lineHeight: 1 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 'clamp(28px, 7vw, 52px)', color: pnlColor, letterSpacing: '-1.5px', textShadow: `0 0 30px ${pnlColor}60` }}>
              {fmt$(stats.totalPnl)}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: theme.textSecondary, letterSpacing: '0.05em' }}>
              {stats.wins}W &nbsp;/&nbsp; {stats.losses}L &nbsp;·&nbsp; {stats.winRate.toFixed(0)}% Win Rate
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {[
                { label: 'Trades', value: String(trades.length) },
                { label: 'Avg Win', value: fmt$(stats.avgWin) },
                { label: 'Avg Loss', value: fmt$(stats.avgLoss) },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '8px 14px', borderRadius: 12,
                  background: theme.surface, border: `1px solid ${theme.divider}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: theme.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15, color: theme.textPrimary, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CARD ── */}
        {phase === 'card' && trade && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', width: '100%' }}>
            {/* Glow behind card */}
            <div style={{
              position: 'absolute',
              width: 320, height: 320, borderRadius: '50%', pointerEvents: 'none',
              background: `radial-gradient(circle, ${trade.isWin ? theme.profitOrb : theme.lossOrb} 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }} />
            <TradeCard trade={trade} theme={theme} exportMode />
          </div>
        )}

        {/* ── OUTRO ── */}
        {phase === 'outro' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 520 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.3em', color: theme.textMuted, textTransform: 'uppercase' }}>
              Final Summary
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 'clamp(36px, 9vw, 64px)', color: pnlColor, letterSpacing: '-2px', textShadow: `0 0 32px ${pnlColor}55` }}>
              {fmt$(stats.totalPnl)}
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
              {[
                { label: 'Win Rate', value: `${stats.winRate.toFixed(0)}%`, color: stats.winRate >= 60 ? theme.profit : stats.winRate >= 45 ? '#f59e0b' : theme.loss },
                { label: 'Profit Factor', value: isFinite(stats.profitFactor) ? `${stats.profitFactor.toFixed(2)}x` : '∞', color: stats.profitFactor >= 1.5 ? theme.profit : '#f59e0b' },
                { label: 'Best Trade', value: stats.bestTrade ? fmt$(stats.bestTrade.pnl) : '—', color: theme.profit },
                { label: 'Avg Loss', value: fmt$(stats.avgLoss), color: theme.loss },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '12px 16px', borderRadius: 14,
                  background: theme.surface, border: `1px solid ${theme.divider}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: theme.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 22, color: s.color, marginTop: 4, textShadow: `0 0 12px ${s.color}50` }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Equity curve */}
            {trades.length >= 2 && (
              <div style={{
                width: '100%', padding: '12px', borderRadius: 14,
                background: theme.surface2, border: `1px solid ${theme.divider}`,
              }}>
                <EquityCurve trades={trades} theme={theme} width={480} height={90} />
              </div>
            )}

            <div style={{ fontFamily: 'monospace', fontSize: 10, color: theme.textMuted, letterSpacing: '0.1em' }}>
              Tap to replay
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

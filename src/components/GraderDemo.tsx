import { useMemo, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { GROUPS, ALL_FACTORS, scoreSetup, letterFor, verdictFor } from '../lib/grader'
import { trackOnce } from '../lib/track'

// Compact semicircular gauge (mirrors the in-app Trade Grader gauge).
function Gauge({ score, color }: { score: number; color: string }) {
  const r = 78, cx = 100, cy = 100
  const a = Math.PI + (0 - Math.PI) * (score / 100)
  const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a)
  const arc = (fromA: number, toA: number, key: string, stroke: string, w: number) => {
    const x1 = cx + r * Math.cos(fromA), y1 = cy - r * Math.sin(fromA)
    const x2 = cx + r * Math.cos(toA),   y2 = cy - r * Math.sin(toA)
    return <path key={key} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
      fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" />
  }
  return (
    <svg viewBox="0 0 200 116" className="w-full max-w-[220px] mx-auto">
      {arc(Math.PI, 0, 'track', 'rgba(148,163,184,0.16)', 12)}
      {score > 0 && arc(Math.PI, a, 'fill', color, 12)}
      <circle cx={x} cy={y} r={7} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <circle cx={x} cy={y} r={3} fill="#0b0b12" />
    </svg>
  )
}

interface Props {
  onCTA?: () => void
  ctaLabel?: string
}

// A live, no-login preview of the real Trade Grader engine, embedded on the
// marketing page so visitors experience the flagship tool before buying.
export function GraderDemo({ onCTA, ctaLabel = 'Unlock the full Trade Grader' }: Props) {
  // Open on a complete A-grade setup (every essential present, 2R): the first
  // thing a visitor sees should be the tool validating a good setup in green —
  // not a red "F" telling them they're wrong before they've touched anything.
  // It still leaves room to explore both ways: adding the optional confluences
  // climbs to A+, and dropping an essential drops the grade fast.
  const [checked, setChecked] = useState<Set<string>>(
    new Set(['htf-bias', 'dol', 'sweep', 'choch', 'displacement', 'pd-array', 'killzone', 'invalidation', 'in-plan'])
  )
  const [rr, setRr] = useState(2)

  // "demo-used" is the key engagement signal: it separates visitors who merely
  // scrolled past the demo from those who actually felt the product work.
  const toggle = (id: string) => {
    trackOnce('demo-used', 'Interacted with the live Grader demo')
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const { score, letter, color, verdict } = useMemo(() => {
    const s = scoreSetup(checked, rr)
    const { letter, color } = letterFor(s)
    return { score: s, letter, color, verdict: verdictFor(letter) }
  }, [checked, rr])

  return (
    <div className="relative tl-sq2 overflow-hidden"
      style={{ background: 'rgba(8,8,15,0.98)', border: '1px solid rgba(245,158,11,0.18)', boxShadow: '0 0 60px rgba(245,158,11,0.06)' }}>
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.7),transparent)' }} />

      <div className="grid grid-cols-1 md:grid-cols-5">

        {/* Checklist — second on mobile so the grade + CTA lead (see below) */}
        <div className="order-2 md:order-1 md:col-span-3 p-6 md:p-8 md:border-r border-[var(--border)]">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-dim)]">Tap what your setup has</span>
            <span className="text-[10px] font-bold text-amber-400/80" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{checked.size}/{ALL_FACTORS.length}</span>
          </div>

          <div className="space-y-4">
            {GROUPS.map(group => (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-[3px] h-3 rounded-full" style={{ background: group.color }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: group.color }}>{group.title}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.factors.map(f => {
                    const on = checked.has(f.id)
                    // text via classes, not hex: the page's grey tiers are the
                    // slate scale, and one-off hexes read as extra colors.
                    return (
                      <button key={f.id} onClick={() => toggle(f.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 tl-sq2 text-[11px] font-medium transition-all ${on ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}
                        style={{
                          background: on ? `${group.color}1c` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${on ? group.color + '55' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                        <span className="w-3.5 h-3.5 tl-sq2 flex items-center justify-center flex-shrink-0"
                          style={{ background: on ? group.color : 'transparent', border: on ? 'none' : '1px solid rgba(255,255,255,0.18)' }}>
                          {on && <Check size={10} className="text-[#0b0b12]" strokeWidth={3.5} />}
                        </span>
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* R:R */}
          <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">R:R</span>
            {[1, 1.5, 2, 3, 4].map(v => (
              <button key={v} onClick={() => { trackOnce('demo-used', 'Interacted with the live Grader demo'); setRr(v) }}
                className={`px-2.5 py-1 tl-sq2 text-[11px] font-bold transition-all font-mono ${rr === v ? 'text-amber-400' : 'text-[var(--text-dim)]'}`}
                style={{
                  background: rr === v ? 'rgba(245,158,11,0.15)' : 'transparent',
                  border: `1px solid ${rr === v ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {v}R
              </button>
            ))}
          </div>
        </div>

        {/* Result — deliberately FIRST on mobile. Stacked, a 13-row checklist
            would bury the gauge, grade and CTA below the fold, so a phone visitor
            would tap chips with the payoff off-screen. Desktop is side-by-side,
            where the natural checklist-then-result order reads better. */}
        <div className="order-1 md:order-2 md:col-span-2 p-6 md:p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 border-[var(--border)]"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(245,158,11,0.04), transparent 70%)' }}>
          <Gauge score={score} color={color} />
          {/* 52px joins the page's statement step — 58 was the only display size
              outside the 94/52/40 scale. */}
          <p className="font-black leading-none -mt-5 font-mono" style={{ fontSize: '52px', color, textShadow: `0 0 34px ${color}66` }}>
            {letter}
          </p>
          <p className="text-[10px] text-[var(--text-dim)] mt-1 uppercase tracking-[0.2em] font-semibold">
            Score <span className="text-[var(--text-dim)] font-mono">{score}</span>/100
          </p>
          <p className="text-[14px] font-bold text-[var(--text)] mt-4">{verdict.headline}</p>
          <p className="text-[12px] text-[var(--text-dim)] leading-relaxed mt-1.5 max-w-[240px]">{verdict.body}</p>

          <button onClick={onCTA}
            className="group mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 tl-sq2 font-bold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0800' }}>
            {ctaLabel}
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-[10px] text-[var(--text-faint)] mt-2.5">Full version saves your history, suggests position size &amp; grades against your own system.</p>
        </div>
      </div>
    </div>
  )
}

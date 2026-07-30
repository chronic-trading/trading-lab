import { useMemo } from 'react'
import { concepts } from '../data/concepts'
import type { Category } from '../types'

const CATEGORIES: Category[] = ['structure', 'liquidity', 'entry', 'timing', 'bias', 'model']

const CAT_COLORS: Record<Category, string> = {
  structure: '#60a5fa',
  liquidity: '#34d399',
  entry:     '#f87171',
  timing:    '#a78bfa',
  bias:      '#fbbf24',
  model:     '#e879f9',
}

const CAT_LABELS: Record<Category, string> = {
  structure: 'Structure',
  liquidity: 'Liquidity',
  entry:     'Entry',
  timing:    'Timing',
  bias:      'Bias',
  model:     'Model',
}

const N      = CATEGORIES.length
const CX     = 100
const CY     = 100
const R      = 62
const LABEL_R = 82
const START  = -Math.PI / 2  // top

function pt(angle: number, r: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

function polyStr(values: number[], radius: number) {
  return values.map((v, i) => {
    const { x, y } = pt(START + (i * 2 * Math.PI) / N, radius * v)
    return `${x},${y}`
  }).join(' ')
}

function gridPoly(fraction: number) {
  return CATEGORIES.map((_, i) => {
    const { x, y } = pt(START + (i * 2 * Math.PI) / N, R * fraction)
    return `${x},${y}`
  }).join(' ')
}

interface Props { selectedIds: string[] }

export function BuildRadar({ selectedIds }: Props) {
  const data = useMemo(() => {
    const totals = Object.fromEntries(
      CATEGORIES.map(cat => [cat, concepts.filter(c => c.category === cat).length])
    ) as Record<Category, number>

    const selected = Object.fromEntries(
      CATEGORIES.map(cat => [
        cat,
        selectedIds.filter(id => concepts.find(c => c.id === id)?.category === cat).length,
      ])
    ) as Record<Category, number>

    const values = CATEGORIES.map(cat =>
      totals[cat] > 0 ? selected[cat] / totals[cat] : 0
    )

    return { selected, values }
  }, [selectedIds])

  if (selectedIds.length === 0) return null

  const { selected, values } = data
  const filledCount = CATEGORIES.filter((cat) => selected[cat] > 0).length
  const coveragePct = Math.round((filledCount / N) * 100)

  return (
    <div className="tl-card p-3 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Build DNA</span>
        <span className={`text-[11px] font-bold ${coveragePct === 100 ? 'text-amber-300' : coveragePct >= 66 ? 'text-emerald-400' : coveragePct >= 33 ? 'text-blue-400' : 'text-[var(--text-dim)]'}`}>
          {coveragePct}% coverage
        </span>
      </div>

      {/* Radar SVG */}
      <svg viewBox="0 0 200 200" className="w-full">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <polygon key={f} points={gridPoly(f)} fill="none" stroke="#1e2030" strokeWidth="1" />
        ))}

        {/* Axes */}
        {CATEGORIES.map((_, i) => {
          const { x, y } = pt(START + (i * 2 * Math.PI) / N, R)
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#1e2030" strokeWidth="1" />
        })}

        {/* Filled area */}
        <polygon
          points={polyStr(values, R)}
          fill="rgba(245,158,11,0.10)"
          stroke="rgba(245,158,11,0.50)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Category-colored vertex dots */}
        {CATEGORIES.map((cat, i) => {
          if (values[i] === 0) return null
          const { x, y } = pt(START + (i * 2 * Math.PI) / N, R * values[i])
          return (
            <circle key={cat} cx={x} cy={y} r="3.5" fill={CAT_COLORS[cat]}
              style={{ filter: `drop-shadow(0 0 3px ${CAT_COLORS[cat]}80)` }} />
          )
        })}

        {/* Axis labels */}
        {CATEGORIES.map((cat, i) => {
          const angle = START + (i * 2 * Math.PI) / N
          const { x, y } = pt(angle, LABEL_R)
          const anchor = x < CX - 4 ? 'end' : x > CX + 4 ? 'start' : 'middle'
          const hasData = selected[cat] > 0
          return (
            <text
              key={cat}
              x={x} y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fontWeight={hasData ? '700' : '400'}
              fill={hasData ? CAT_COLORS[cat] : '#334155'}
              fontFamily="Inter, sans-serif"
            >
              {CAT_LABELS[cat]}
            </text>
          )
        })}
      </svg>

      {/* Category dots legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {CATEGORIES.map(cat => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selected[cat] > 0 ? CAT_COLORS[cat] : '#334155' }} />
            <span className="text-[10px] font-medium" style={{ color: selected[cat] > 0 ? CAT_COLORS[cat] : '#475569' }}>
              {selected[cat]} {CAT_LABELS[cat]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
